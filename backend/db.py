import json
import re
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
DB_PATH = DATA_DIR / "catalog.db"

SCHEMA = """
CREATE TABLE IF NOT EXISTS images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sha256 TEXT UNIQUE NOT NULL,
    original_name TEXT,
    dicom_path TEXT,
    preview_path TEXT,
    thumb_path TEXT,
    width INTEGER,
    height INTEGER,
    scale REAL,
    uploaded_at TEXT,
    model_version TEXT,
    num_detections INTEGER DEFAULT 0,
    min_conf REAL,
    mean_conf REAL,
    has_cervical INTEGER DEFAULT 0,
    has_thoracic INTEGER DEFAULT 0,
    has_lumbar INTEGER DEFAULT 0,
    has_sacrum INTEGER DEFAULT 0,
    has_pelvis INTEGER DEFAULT 0,
    has_femoral_heads INTEGER DEFAULT 0,
    only_cervical INTEGER DEFAULT 0,
    only_pelvis INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS detections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    image_id INTEGER NOT NULL REFERENCES images(id) ON DELETE CASCADE,
    class_name TEXT NOT NULL,
    confidence REAL NOT NULL,
    polygon_json TEXT,
    centroid_y REAL
);

CREATE INDEX IF NOT EXISTS idx_det_class ON detections(class_name);
CREATE INDEX IF NOT EXISTS idx_det_image ON detections(image_id);
CREATE INDEX IF NOT EXISTS idx_img_minconf ON images(min_conf);
"""


@contextmanager
def get_conn():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db():
    with get_conn() as conn:
        conn.executescript(SCHEMA)


def region_of(class_name):
    """C* -> cervical, Th* -> thoracic, L* -> lumbar, S1 -> sacrum,
    PB -> pelvis, FH -> femoral."""
    if re.fullmatch(r"C\d+", class_name):
        return "cervical"
    if re.fullmatch(r"Th\d+", class_name):
        return "thoracic"
    if re.fullmatch(r"L\d+", class_name):
        return "lumbar"
    if class_name == "S1":
        return "sacrum"
    if class_name == "PB":
        return "pelvis"
    if class_name == "FH":
        return "femoral"
    return None


def derive_fields(detections):
    """Производные поля по списку детекций [{class, confidence, ...}]."""
    names = [d["class"] for d in detections]
    confs = [d["confidence"] for d in detections]
    regions = {region_of(n) for n in names}

    return {
        "num_detections": len(detections),
        "min_conf": min(confs) if confs else None,
        "mean_conf": sum(confs) / len(confs) if confs else None,
        "has_cervical": int("cervical" in regions),
        "has_thoracic": int("thoracic" in regions),
        "has_lumbar": int("lumbar" in regions),
        "has_sacrum": int("sacrum" in regions),
        "has_pelvis": int("pelvis" in regions),
        "has_femoral_heads": int("femoral" in regions),
        "only_cervical": int(bool(names) and regions == {"cervical"}),
        "only_pelvis": int(
            bool(names) and regions <= {"sacrum", "pelvis", "femoral"}
        ),
    }


def polygon_centroid_y(polygon):
    if not polygon:
        return None
    return sum(p[1] for p in polygon) / len(polygon)


def find_image_by_sha(sha256):
    with get_conn() as conn:
        return conn.execute(
            "SELECT * FROM images WHERE sha256 = ?", (sha256,)
        ).fetchone()


def insert_image(meta, detections):
    """meta: sha256, original_name, dicom_path, preview_path, thumb_path,
    width, height, scale, model_version. Возвращает id новой записи."""
    fields = derive_fields(detections)
    row = {
        **meta,
        **fields,
        "uploaded_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    }
    cols = ", ".join(row.keys())
    marks = ", ".join("?" for _ in row)

    with get_conn() as conn:
        cur = conn.execute(
            f"INSERT INTO images ({cols}) VALUES ({marks})", tuple(row.values())
        )
        image_id = cur.lastrowid
        conn.executemany(
            "INSERT INTO detections "
            "(image_id, class_name, confidence, polygon_json, centroid_y) "
            "VALUES (?, ?, ?, ?, ?)",
            [
                (
                    image_id,
                    d["class"],
                    d["confidence"],
                    json.dumps(d.get("polygon", [])),
                    polygon_centroid_y(d.get("polygon", [])),
                )
                for d in detections
            ],
        )
    return image_id