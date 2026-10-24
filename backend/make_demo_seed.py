import shutil
import sqlite3
import sys
from pathlib import Path

BASE = Path(__file__).resolve().parent
SRC_DB = BASE / "data" / "catalog.db"
OUT = BASE / "demo"

con = sqlite3.connect(SRC_DB)
rows = con.execute(
    "SELECT id, original_name, num_detections, preview_path, thumb_path "
    "FROM images ORDER BY id").fetchall()
con.close()

if len(sys.argv) < 2:
    for r in rows:
        print(r[0], r[1], r[2], "structures")
    print("Usage: python3 make_demo_seed.py <id> <id> ...")
    sys.exit(0)

ids = [int(x) for x in sys.argv[1:]]
if OUT.exists():
    shutil.rmtree(OUT)
(OUT / "previews").mkdir(parents=True)
(OUT / "thumbs").mkdir()
shutil.copy(SRC_DB, OUT / "catalog.db")

con = sqlite3.connect(OUT / "catalog.db")
con.execute("PRAGMA foreign_keys = ON")
con.execute(f"DELETE FROM images WHERE id NOT IN ({','.join('?' * len(ids))})", ids)
for id_, name, n, prev, thumb in rows:
    if id_ not in ids:
        continue
    pn, tn = Path(prev).name, Path(thumb).name
    shutil.copy(prev, OUT / "previews" / pn)
    shutil.copy(thumb, OUT / "thumbs" / tn)
    con.execute(
        "UPDATE images SET dicom_path = '', preview_path = ?, thumb_path = ? WHERE id = ?",
        (f"demo/previews/{pn}", f"demo/thumbs/{tn}", id_))
con.commit()
con.execute("VACUUM")
con.close()
print("demo catalog ready:", len(ids), "images in", OUT)
