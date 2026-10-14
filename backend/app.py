import base64
import io
import traceback
import cv2
from flask import Flask, jsonify, request
from flask_cors import CORS
import numpy as np
from PIL import Image
import pydicom
from ultralytics import YOLO

app = Flask(__name__)
CORS(app)

# Указываем путь к обученным весам сегментации
MODEL_PATH = "best.pt"
model = YOLO(MODEL_PATH)

TARGET_SIZE = 896  # Наше рабочее разрешение, на котором обучали модель


def read_image_bytes(raw_bytes, filename=""):
  """Чтение обычных картинок (JPG/PNG) и DICOM файлов с нормализацией."""
  is_dicom = filename.lower().endswith(".dcm") or raw_bytes.startswith(
      b"\x00" * 128 + b"DICM"
  )

  if is_dicom:
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


def draw_segmentation_annotations(image, results, min_conf=0.35):
  """Отрисовка масок сегментации: полупрозрачная заливка + тонкий контур + подпись."""
  annotated = image.copy()
  overlay = image.copy()
  h, w = image.shape[:2]

  if results.masks is None:
    return annotated, []

  boxes = results.boxes
  masks = results.masks.data.cpu().numpy()  # Бинарные маски
  names = results.names

  detections = []

  # Генерируем уникальные фиксированные цвета для каждого класса
  np.random.seed(42)
  colors = {
      cls_id: [
          int(c) for c in np.random.randint(50, 255, size=3)
      ]  # BGR цвет
      for cls_id in names.keys()
  }

  for i, mask in enumerate(masks):
    conf = float(boxes.conf[i])
    if conf < min_conf:
      continue

    cls_id = int(boxes.cls[i])
    class_name = names[cls_id]
    color = colors[cls_id]

    # Масштабируем маску под текущий размер картинки
    mask_resized = cv2.resize(
        mask, (w, h), interpolation=cv2.INTER_NEAREST
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

      # Формируем список полигонов для ответа API (если веб-фронтенд умеет сам их интерактивно подсвечивать)
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


@app.route("/predict", methods=["POST"])
def predict():
  try:
    if "file" not in request.files:
      return jsonify({"detections": [], "error": "No file uploaded"}), 400

    file = request.files["file"]
    raw = file.read()

    img_bgr = read_image_bytes(raw, file.filename)
    resized, scale = resize_with_aspect(img_bgr, TARGET_SIZE)

    # Прогоняем через модель сегментации
    results = model(resized, verbose=False)[0]

    # Рисуем полигоны вместо рамок
    annotated_bgr, detections = draw_segmentation_annotations(
        resized, results, min_conf=0.35
    )

    # Упорядочиваем детекции сверху вниз (от шейных C2 до поясничных/таза)
    detections.sort(
        key=lambda x: x["polygon"][0][1] if len(x["polygon"]) > 0 else 0
    )

    _, buffer = cv2.imencode(".png", annotated_bgr)
    img_base64 = base64.b64encode(buffer).decode("utf-8")
    image_url = f"data:image/png;base64,{img_base64}"

    return jsonify({"detections": detections, "image_url": image_url}), 200

  except Exception as e:
    print("ERROR:", e)
    print(traceback.format_exc())
    return jsonify({"error": str(e), "detections": []}), 500


if __name__ == "__main__":
  print("=== Запуск сервера Flask (Сегментация) на порту 8000 ===")
  app.run(host="0.0.0.0", port=8000, debug=True)