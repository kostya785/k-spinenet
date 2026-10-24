import ast
import os

import cv2
import numpy as np
import onnxruntime as ort

STRIDE = 32


def letterbox(img, new=896):
    """Как в ultralytics (auto=True): без растяжения, отступы кратны 32."""
    h, w = img.shape[:2]
    r = min(new / h, new / w)
    nw, nh = int(round(w * r)), int(round(h * r))
    dw, dh = np.mod(new - nw, STRIDE) / 2, np.mod(new - nh, STRIDE) / 2
    if (w, h) != (nw, nh):
        img = cv2.resize(img, (nw, nh), interpolation=cv2.INTER_LINEAR)
    top, bottom = int(round(dh - 0.1)), int(round(dh + 0.1))
    left, right = int(round(dw - 0.1)), int(round(dw + 0.1))
    img = cv2.copyMakeBorder(
        img, top, bottom, left, right, cv2.BORDER_CONSTANT, value=(114, 114, 114)
    )
    return img


def nms(boxes, scores, iou_thr):
    order = scores.argsort()[::-1]
    keep = []
    while order.size:
        i = order[0]
        keep.append(i)
        if order.size == 1:
            break
        rest = order[1:]
        xx1 = np.maximum(boxes[i, 0], boxes[rest, 0])
        yy1 = np.maximum(boxes[i, 1], boxes[rest, 1])
        xx2 = np.minimum(boxes[i, 2], boxes[rest, 2])
        yy2 = np.minimum(boxes[i, 3], boxes[rest, 3])
        inter = np.maximum(0, xx2 - xx1) * np.maximum(0, yy2 - yy1)
        area_i = (boxes[i, 2] - boxes[i, 0]) * (boxes[i, 3] - boxes[i, 1])
        area_r = (boxes[rest, 2] - boxes[rest, 0]) * (boxes[rest, 3] - boxes[rest, 1])
        iou = inter / (area_i + area_r - inter + 1e-9)
        order = rest[iou <= iou_thr]
    return keep


class SegModel:
    def __init__(self, path, imgsz=896):
        so = ort.SessionOptions()
        so.enable_cpu_mem_arena = False
        so.enable_mem_pattern = False
        so.intra_op_num_threads = int(os.environ.get("ORT_THREADS", "0"))
        self.sess = ort.InferenceSession(
            path, so, providers=["CPUExecutionProvider"]
        )
        self.input_name = self.sess.get_inputs()[0].name
        meta = self.sess.get_modelmeta().custom_metadata_map
        self.names = {int(k): v for k, v in ast.literal_eval(meta["names"]).items()}
        self.nc = len(self.names)
        self.imgsz = imgsz

    def predict(self, img_bgr, conf=0.35, iou=0.7, max_det=100):
        lb = letterbox(img_bgr, self.imgsz)
        ih, iw = lb.shape[:2]
        x = lb[:, :, ::-1].transpose(2, 0, 1)[None].astype(np.float32) / 255.0
        outs = self.sess.run(None, {self.input_name: np.ascontiguousarray(x)})
        pred = next(o for o in outs if o.ndim == 3)[0].T  # (N, 4+nc+32)
        proto = next(o for o in outs if o.ndim == 4)[0]   # (32, mh, mw)

        scores = pred[:, 4:4 + self.nc]
        cls = scores.argmax(1)
        confs = scores[np.arange(len(scores)), cls]
        sel = confs >= conf
        pred, cls, confs = pred[sel], cls[sel], confs[sel]
        if len(pred) == 0:
            return {"masks": [], "confs": [], "cls": [], "names": self.names}

        cx, cy, bw, bh = pred[:, 0], pred[:, 1], pred[:, 2], pred[:, 3]
        xyxy = np.stack([cx - bw / 2, cy - bh / 2, cx + bw / 2, cy + bh / 2], 1)

        # NMS отдельно для каждого класса (смещаем рамки разных классов)
        keep = nms(xyxy + cls[:, None] * 7680.0, confs, iou)[:max_det]
        xyxy, cls, confs = xyxy[keep], cls[keep], confs[keep]
        coefs = pred[keep][:, 4 + self.nc:]

        mh, mw = proto.shape[1:]
        sx, sy = mw / iw, mh / ih
        logits = (coefs @ proto.reshape(proto.shape[0], -1)).reshape(-1, mh, mw)
        cols = np.arange(mw)[None, :]
        rows = np.arange(mh)[:, None]

        # как ultralytics.utils.ops.process_mask: сначала обрезка по рамке
        # (границы округляются) в разрешении прототипов, затем растяжение
        ratios = np.array([sx, sy, sx, sy], dtype=np.float32)
        boxes_p = np.round(np.clip(xyxy * ratios, 0, None)).astype(int)
        masks, kept = [], []
        for j in range(len(keep)):
            x1, y1, x2, y2 = boxes_p[j]
            m = logits[j].copy()
            m[:y1] = 0
            m[y2:] = 0
            m[:, :x1] = 0
            m[:, x2:] = 0
            m = cv2.resize(m, (iw, ih), interpolation=cv2.INTER_LINEAR) > 0
            if m.any():  # как в ultralytics: пустые маски отбрасываются
                masks.append(m)
                kept.append(j)
        kept = np.array(kept, dtype=int)
        return {"masks": masks, "confs": confs[kept], "cls": cls[kept],
                "names": self.names, "xyxy": xyxy[kept]}
