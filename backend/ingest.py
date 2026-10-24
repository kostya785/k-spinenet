import db
import storage


def ingest_image(raw_bytes, filename, img_bgr, scale, annotated_bgr,
                 detections, model_version):
    """Сохраняет DICOM (обезличенный), превью, миниатюру и детекции.
    Возвращает (image_id, is_new). Дубликаты (по sha256 исходного файла)
    не создаются."""
    sha = storage.sha256_of(raw_bytes)

    existing = db.find_image_by_sha(sha)
    if existing is not None:
        return existing["id"], False

    anon_bytes = storage.anonymize_dicom(raw_bytes)
    dicom_path = storage.save_dicom(sha, anon_bytes)
    preview_path, thumb_path = storage.save_preview_and_thumb(sha, annotated_bgr)

    h, w = img_bgr.shape[:2]
    meta = {
        "sha256": sha,
        "original_name": filename or "",
        "dicom_path": str(dicom_path),
        "preview_path": str(preview_path),
        "thumb_path": str(thumb_path),
        "width": int(w),
        "height": int(h),
        "scale": float(scale),
        "model_version": model_version,
    }
    image_id = db.insert_image(meta, detections)
    return image_id, True