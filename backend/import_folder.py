import sys
from pathlib import Path

from app import process_image, MODEL_VERSION
from ingest import ingest_image


def main():
    if len(sys.argv) != 2:
        print("Usage: python3 import_folder.py <folder>")
        sys.exit(1)

    folder = Path(sys.argv[1]).expanduser()
    files = sorted(
        p for p in folder.rglob("*") if p.suffix.lower() == ".dcm"
    )
    print(f"Found {len(files)} DICOM files")

    for i, path in enumerate(files, 1):
        try:
            raw = path.read_bytes()
            img_bgr, scale, annotated, detections = process_image(raw, path.name)
            if not detections:
                print(f"[{i}/{len(files)}] {path.name}: no detections, skipped")
                continue
            image_id, is_new = ingest_image(
                raw, path.name, img_bgr, scale, annotated, detections, MODEL_VERSION
            )
            status = "added" if is_new else "already in catalog"
            print(f"[{i}/{len(files)}] {path.name}: {status} (id={image_id}, "
                  f"{len(detections)} vertebrae)")
        except Exception as e:
            print(f"[{i}/{len(files)}] {path.name}: ERROR {e}")


if __name__ == "__main__":
    main()
