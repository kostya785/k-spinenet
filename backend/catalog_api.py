import math
import os

from flask import Blueprint, abort, jsonify, request, send_file

import db

bp = Blueprint("catalog", __name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PUBLIC_MODE = os.environ.get("PUBLIC_MODE") == "1"


def _resolve(p):
    return p if os.path.isabs(p) else os.path.join(BASE_DIR, p)

REGION_COLS = {
    "cervical": "has_cervical",
    "thoracic": "has_thoracic",
    "lumbar": "has_lumbar",
    "sacrum": "has_sacrum",
    "pelvis": "has_pelvis",
    "femoral": "has_femoral_heads",
}
SORTS = {
    "newest": "uploaded_at DESC, id DESC",
    "confidence": "mean_conf DESC, id DESC",
    "count": "num_detections DESC, id DESC",
}


def _csv(name):
    raw = request.args.get(name, "")
    return [x.strip() for x in raw.split(",") if x.strip()]


def _num(name, default, cast, lo, hi):
    try:
        value = cast(request.args.get(name, default))
    except (TypeError, ValueError):
        return default
    return max(lo, min(hi, value))


@bp.route("/api/catalog")
def list_catalog():
    where, params = [], []

    # Отделы позвоночника
    regions = [r for r in _csv("regions") if r in REGION_COLS]
    mode = request.args.get("mode", "contains")
    for r in regions:
        where.append(f"{REGION_COLS[r]} = 1")
    if mode == "only" and regions:
        for r, col in REGION_COLS.items():
            if r not in regions:
                where.append(f"{col} = 0")

    # Конкретные позвонки: на снимке должны быть все выбранные
    classes = sorted({c for c in _csv("classes") if c.isalnum()})
    if classes:
        marks = ",".join("?" for _ in classes)
        where.append(
            "id IN (SELECT image_id FROM detections "
            f"WHERE class_name IN ({marks}) "
            "GROUP BY image_id HAVING COUNT(DISTINCT class_name) = ?)"
        )
        params += classes + [len(classes)]

    # Минимальная уверенность модели и число найденных структур
    min_conf = _num("min_conf", 0.0, float, 0.0, 1.0)
    if min_conf > 0:
        where.append("min_conf >= ?")
        params.append(min_conf)
    min_count = _num("min_count", 0, int, 0, 100)
    if min_count > 0:
        where.append("num_detections >= ?")
        params.append(min_count)

    order = SORTS.get(request.args.get("sort", "newest"), SORTS["newest"])
    page_size = _num("page_size", 12, int, 1, 60)
    page = _num("page", 1, int, 1, 100000)
    where_sql = ("WHERE " + " AND ".join(where)) if where else ""

    with db.get_conn() as conn:
        total = conn.execute(
            f"SELECT COUNT(*) FROM images {where_sql}", params
        ).fetchone()[0]
        pages = max(1, math.ceil(total / page_size))
        page = min(page, pages)

        rows = conn.execute(
            "SELECT id, original_name, uploaded_at, num_detections, min_conf, "
            f"mean_conf FROM images {where_sql} ORDER BY {order} LIMIT ? OFFSET ?",
            params + [page_size, (page - 1) * page_size],
        ).fetchall()

        classes_by_image = {}
        if rows:
            ids = [r["id"] for r in rows]
            marks = ",".join("?" for _ in ids)
            for d in conn.execute(
                "SELECT image_id, class_name FROM detections "
                f"WHERE image_id IN ({marks}) ORDER BY centroid_y",
                ids,
            ):
                classes_by_image.setdefault(d["image_id"], []).append(d["class_name"])

    items = [
        {
            "id": r["id"],
            "original_name": r["original_name"],
            "uploaded_at": r["uploaded_at"],
            "thumb_url": f"/files/thumb/{r['id']}",
            "preview_url": f"/files/preview/{r['id']}",
            "num_detections": r["num_detections"],
            "min_conf": r["min_conf"],
            "mean_conf": r["mean_conf"],
            "classes": classes_by_image.get(r["id"], []),
        }
        for r in rows
    ]
    return jsonify({"items": items, "total": total, "page": page, "pages": pages})


@bp.route("/api/catalog/stats")
def stats():
    with db.get_conn() as conn:
        row = conn.execute(
            "SELECT COUNT(*) AS total, "
            "COALESCE(SUM(has_cervical),0) AS cervical, "
            "COALESCE(SUM(has_thoracic),0) AS thoracic, "
            "COALESCE(SUM(has_lumbar),0) AS lumbar, "
            "COALESCE(SUM(has_sacrum),0) AS sacrum, "
            "COALESCE(SUM(has_pelvis),0) AS pelvis, "
            "COALESCE(SUM(has_femoral_heads),0) AS femoral "
            "FROM images"
        ).fetchone()
    return jsonify({
        "total_images": row["total"],
        "per_region_counts": {k: row[k] for k in REGION_COLS},
    })


@bp.route("/api/catalog/<int:image_id>")
def get_image(image_id):
    with db.get_conn() as conn:
        img = conn.execute(
            "SELECT id, original_name, uploaded_at, width, height, scale, "
            "model_version, num_detections, min_conf, mean_conf "
            "FROM images WHERE id = ?",
            (image_id,),
        ).fetchone()
        if img is None:
            return jsonify({"error": "not found"}), 404
        dets = conn.execute(
            "SELECT class_name, confidence FROM detections "
            "WHERE image_id = ? ORDER BY centroid_y",
            (image_id,),
        ).fetchall()
    data = dict(img)
    data["detections"] = [
        {"class": d["class_name"], "confidence": d["confidence"]} for d in dets
    ]
    data["preview_url"] = f"/files/preview/{image_id}"
    return jsonify(data)


@bp.route("/api/catalog/<int:image_id>", methods=["DELETE"])
def delete_image(image_id):
    if PUBLIC_MODE:
        return jsonify({"error": "read-only catalog"}), 403
    with db.get_conn() as conn:
        row = conn.execute(
            "SELECT dicom_path, preview_path, thumb_path FROM images WHERE id = ?",
            (image_id,),
        ).fetchone()
        if row is None:
            return jsonify({"error": "not found"}), 404
        paths = [row["dicom_path"], row["preview_path"], row["thumb_path"]]
        conn.execute("DELETE FROM images WHERE id = ?", (image_id,))
    for p in paths:
        if p and os.path.exists(p):
            os.remove(p)
    return jsonify({"deleted": image_id})


@bp.route("/files/<kind>/<int:image_id>")
def get_file(kind, image_id):
    col = {"thumb": "thumb_path", "preview": "preview_path"}.get(kind)
    if col is None:
        abort(404)
    with db.get_conn() as conn:
        row = conn.execute(
            f"SELECT {col} AS p FROM images WHERE id = ?", (image_id,)
        ).fetchone()
    path = _resolve(row["p"]) if row and row["p"] else None
    if path is None or not os.path.exists(path):
        abort(404)
    return send_file(path)


@bp.route("/api/config")
def config():
    return jsonify({"public_mode": PUBLIC_MODE})
