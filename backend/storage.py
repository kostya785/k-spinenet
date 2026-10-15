import hashlib
import io
from pathlib import Path

import cv2
import pydicom

BASE_DIR = Path(__file__).resolve().parent
STORAGE_DIR = BASE_DIR / "storage"
DICOM_DIR = STORAGE_DIR / "dicom"
PREVIEW_DIR = STORAGE_DIR / "previews"
THUMB_DIR = STORAGE_DIR / "thumbs"

THUMB_SIZE = 256

# Теги, в которых могут быть персональные данные
BLANK_TAGS = [
    "PatientName",
    "PatientID",
    "PatientBirthDate",
    "PatientBirthTime",
    "PatientSex",
    "PatientAge",
    "PatientAddress",
    "PatientTelephoneNumbers",
    "OtherPatientIDs",
    "OtherPatientNames",
    "InstitutionName",
    "InstitutionAddress",
    "ReferringPhysicianName",
    "PerformingPhysicianName",
    "OperatorsName",
    "PhysiciansOfRecord",
    "AccessionNumber",
    "StationName",
    "DeviceSerialNumber",
]


def ensure_dirs():
    for d in (DICOM_DIR, PREVIEW_DIR, THUMB_DIR):
        d.mkdir(parents=True, exist_ok=True)


def anonymize_dicom(raw_bytes):
    """Возвращает байты обезличенного DICOM."""
    ds = pydicom.dcmread(io.BytesIO(raw_bytes))

    for tag in BLANK_TAGS:
        if tag in ds:
            ds.data_element(tag).value = ""

    ds.remove_private_tags()

    buf = io.BytesIO()
    ds.save_as(buf)
    return buf.getvalue()


def sha256_of(raw_bytes):
    return hashlib.sha256(raw_bytes).hexdigest()


def save_dicom(sha, anonymized_bytes):
    ensure_dirs()
    path = DICOM_DIR / f"{sha}.dcm"
    if not path.exists():
        path.write_bytes(anonymized_bytes)
    return path


def save_preview_and_thumb(sha, annotated_bgr):
    """Сохраняет аннотированный PNG и миниатюру JPEG. Возвращает (preview_path, thumb_path)."""
    ensure_dirs()

    preview_path = PREVIEW_DIR / f"{sha}.png"
    cv2.imwrite(str(preview_path), annotated_bgr)

    h, w = annotated_bgr.shape[:2]
    scale = THUMB_SIZE / max(h, w)
    thumb = cv2.resize(
        annotated_bgr,
        (max(1, int(w * scale)), max(1, int(h * scale))),
        interpolation=cv2.INTER_AREA,
    )
    thumb_path = THUMB_DIR / f"{sha}.jpg"
    cv2.imwrite(str(thumb_path), thumb, [cv2.IMWRITE_JPEG_QUALITY, 85])

    return preview_path, thumb_path
