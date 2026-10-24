import base64
import io
import os
import traceback
import cv2
from flask import Flask, jsonify, request
from flask_cors import CORS
import numpy as np
from PIL import Image
import pydicom

import db
from ingest import ingest_image
from catalog_api import bp as catalog_bp
from onnx_infer import SegModel

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app = Flask(__name__)
_origins = [o.strip() for o in os.environ.get("ALLOWED_ORIGINS", "").split(",") if o.strip()]
CORS(app, origins=_origins or "*")
app.register_blueprint(catalog_bp)

# Публичный режим: загруженные снимки в каталог не сохраняются
PUBLIC_MODE = os.environ.get("PUBLIC_MODE") == "1"

# Обученные веса сегментации (ONNX)
MODEL_PATH = os.environ.get("MODEL_PATH", os.path.join(BASE_DIR, "best.onnx"))
model = SegModel(MODEL_PATH, imgsz=896)

# Версия модели: имя файла весов + время изменения
MODEL_VERSION = f"{os.path.basename(MODEL_PATH)}@{int(os.path.getmtime(MODEL_PATH))}"

TARGET_SIZE = 896  # Наше рабочее разрешение, на котором обучали модель

# Сколько детекций одного класса оставляем. По умолчанию один,
# парные структуры (таз, головки бедренных костей) разрешаем дважды
MAX_PER_CLASS = {"PB": 2, "FH": 2}
DEFAULT_MAX_PER_CLASS = 1

db.init_db()


def is_dicom(raw_bytes, filename=""):
  return filename.lower().endswith(".dcm") or raw_bytes[128:132] == b"DICM"


def read_image_bytes(raw_bytes, filename=""):
  """Чтение обычных картинок (JPG/PNG) и DICOM файлов с нормализацией."""
  if is_dicom(raw_bytes, filename):
    ds = pydicom.dcmread(io.BytesIO(raw_bytes))
    arr = ds.pixel_array.astype(np.float32)

    intercept = getattr(ds, "RescaleIntercept", 0)
    slope = getattr(ds, "RescaleSlope", 1)
    arr = arr * slope + intercept

    photo_interp = getattr(ds, "PhotometricInterpretation", "")
    if photo_interp == "MONOCHROME1":
      arr = np.max(arr) - arr

    arr_min, arr_max = arr.min(), arr.max()
    if arr_max > arr_min:
      arr = (arr - arr_min) / (arr_max - arr_min) * 255.0
    else:
      arr = np.zeros_like(arr)

    img = arr.astype(np.uint8)

    if len(img.shape) == 2:
      img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
    elif img.shape[2] == 4:
      img = cv2.cvtColor(img, cv2.COLOR_RGBA2BGR)

    return img
  else:
    pil_img = Image.open(io.BytesIO(raw_bytes)).convert("RGB")
    img = np.array(pil_img, dtype=np.uint8)
    return cv2.cvtColor(img, cv2.COLOR_RGB2BGR)


def resize_with_aspect(image, target_size=TARGET_SIZE):
  """Изменение размера с сохранением пропорций."""
  h, w = image.shape[:2]
  scale = target_size / max(h, w)

  new_w = int(w * scale)
  new_h = int(h * scale)

  resized = cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_LINEAR)
  return resized, scale


def draw_segmentation_annotations(image, det, min_conf=0.35):
  """Отрисовка масок сегментации: полупрозрачная заливка + тонкий контур + подпись.
  Каждый класс остаётся не более MAX_PER_CLASS раз (самые уверенные детекции)."""
  annotated = image.copy()
  overlay = image.copy()
  h, w = image.shape[:2]

  masks, confs, cls_ids, names = det["masks"], det["confs"], det["cls"], det["names"]

  if len(masks) == 0:
    return annotated, []

  detections = []

  # Генерируем уникальные фиксированные цвета для каждого класса
  np.random.seed(42)
  colors = {
      cls_id: [
          int(c) for c in np.random.randint(50, 255, size=3)
      ]  # BGR цвет
      for cls_id in names.keys()
  }

  # Для каждого класса оставляем только самые уверенные детекции
  order = sorted(
      range(len(masks)), key=lambda k: float(confs[k]), reverse=True
  )
  kept = []
  per_class = {}
  for k in order:
    if float(confs[k]) < min_conf:
      continue
    name = names[int(cls_ids[k])]
    if per_class.get(name, 0) >= MAX_PER_CLASS.get(name, DEFAULT_MAX_PER_CLASS):
      continue
    per_class[name] = per_class.get(name, 0) + 1
    kept.append(k)

  for i in kept:
    mask = masks[i]
    conf = float(confs[i])
    cls_id = int(cls_ids[i])
    class_name = names[cls_id]
    color = colors[cls_id]

    # Масштабируем маску под текущий размер картинки
    mask_resized = cv2.resize(
        mask.astype(np.uint8), (w, h), interpolation=cv2.INTER_NEAREST
    ).astype(np.uint8)

    # 1. Закрашиваем область маски на слое overlay
    overlay[mask_resized == 1] = color

    # 2. Находим контуры для четкой отрисовки границ
    contours, _ = cv2.findContours(
        mask_resized, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
    )
    cv2.drawContours(
        annotated, contours, -1, color, 1, cv2.LINE_AA
    )  # Тонкая линия 1px

    # Вычисляем центральную точку для подписи
    if contours:
      cnt = max(contours, key=cv2.contourArea)
      M = cv2.moments(cnt)
      if M["m00"] != 0:
        cx = int(M["m10"] / M["m00"])
        cy = int(M["m01"] / M["m00"])
      else:
        cx, cy = contours[0][0][0]

      # Форматируем подпись
      label = f"{class_name} {int(conf * 100)}%"
      font = cv2.FONT_HERSHEY_SIMPLEX
      font_scale = 0.35
      thickness = 1

      (text_w, text_h), _ = cv2.getTextSize(label, font, font_scale, thickness)

      # Подложка под текст
      cv2.rectangle(
          annotated,
          (cx - 2, cy - text_h - 2),
          (cx + text_w + 2, cy + 2),
          (0, 0, 0),
          -1,
      )
      cv2.putText(
          annotated,
          label,
          (cx, cy),
          font,
          font_scale,
          (255, 255, 255),
          thickness,
          cv2.LINE_AA,
      )

      # Формируем список полигонов для ответа API
      poly_pts = []
      for pt in cnt:
        poly_pts.append([int(pt[0][0]), int(pt[0][1])])

      detections.append({
          "class": class_name,
          "confidence": conf,
          "polygon": poly_pts,
      })

  # Смешиваем оригинал и слой с заливкой масок (прозрачность 35%)
  cv2.addWeighted(overlay, 0.35, annotated, 0.65, 0, annotated)

  return annotated, detections


def process_image(raw, filename=""):
  """Чтение, инференс и отрисовка. Общая логика для /predict и импорта папки.
  Возвращает (img_bgr, scale, annotated_bgr, detections)."""
  img_bgr = read_image_bytes(raw, filename)
  resized, scale = resize_with_aspect(img_bgr, TARGET_SIZE)

  # Прогоняем через модель сегментации
  det = model.predict(resized, conf=0.35)

  # Рисуем полигоны вместо рамок
  annotated_bgr, detections = draw_segmentation_annotations(
      resized, det, min_conf=0.35
  )

  # Упорядочиваем детекции сверху вниз (от шейных C2 до поясничных/таза)
  detections.sort(
      key=lambda x: x["polygon"][0][1] if len(x["polygon"]) > 0 else 0
  )
  return img_bgr, scale, annotated_bgr, detections


@app.route("/predict", methods=["POST"])
def predict():
  try:
    if "file" not in request.files:
      return jsonify({"detections": [], "error": "No file uploaded"}), 400

    file = request.files["file"]
    raw = file.read()

    img_bgr, scale, annotated_bgr, detections = process_image(raw, file.filename)

    # Сохраняем в каталог только DICOM (и не в публичном режиме);
    # сбой хранилища не ломает ответ
    image_id, saved = None, False
    if not PUBLIC_MODE and is_dicom(raw, file.filename) and detections:
      try:
        image_id, _ = ingest_image(
            raw, file.filename, img_bgr, scale, annotated_bgr,
            detections, MODEL_VERSION,
        )
        saved = True
      except Exception:
        print("INGEST ERROR:")
        print(traceback.format_exc())

    _, buffer = cv2.imencode(".png", annotated_bgr)
    img_base64 = base64.b64encode(buffer).decode("utf-8")
    image_url = f"data:image/png;base64,{img_base64}"

    return jsonify({
        "detections": detections,
        "image_url": image_url,
        "image_id": image_id,
        "saved": saved,
    }), 200

  except Exception as e:
    print("ERROR:", e)
    print(traceback.format_exc())
    return jsonify({"error": str(e), "detections": []}), 500


if __name__ == "__main__":
  print("=== Запуск сервера Flask (Сегментация, ONNX) ===")
  app.run(
      host=os.environ.get("FLASK_HOST", "127.0.0.1"),
      port=int(os.environ.get("PORT", 8000)),
      debug=os.environ.get("FLASK_DEBUG") == "1",
  )
