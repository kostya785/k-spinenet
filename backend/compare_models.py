import sys
import time
from pathlib import Path

import cv2
import numpy as np

import app_torch
import app as app_onnx


def mask_of(det, shape):
    m = np.zeros(shape, np.uint8)
    cv2.fillPoly(m, [np.array(det["polygon"], np.int32)], 1)
    return m.astype(bool)


def by_class(dets):
    out = {}
    for d in dets:
        out.setdefault(d["class"], []).append(d)
    return {k: sorted(v, key=lambda d: -d["confidence"]) for k, v in out.items()}


times = []
for p in sorted(Path(sys.argv[1]).expanduser().rglob("*.dcm")):
    raw = p.read_bytes()
    _, _, ann_old, old = app_torch.process_image(raw, p.name)
    t0 = time.perf_counter()
    _, _, ann_new, new = app_onnx.process_image(raw, p.name)
    times.append((time.perf_counter() - t0) * 1000)

    shape = ann_new.shape[:2]
    a, b = by_class(old), by_class(new)
    missing = sorted(set(a) - set(b))
    extra = sorted(set(b) - set(a))
    ious, dconf = [], 0.0
    for c in set(a) & set(b):
        for d1, d2 in zip(a[c], b[c]):
            m1, m2 = mask_of(d1, shape), mask_of(d2, shape)
            ious.append((m1 & m2).sum() / max(1, (m1 | m2).sum()))
            dconf = max(dconf, abs(d1["confidence"] - d2["confidence"]))
    print(f"{p.name}: old={len(old)} new={len(new)} missing={missing} extra={extra} "
          f"conf_diff={dconf:.3f} min_iou={min(ious):.3f} mean_iou={np.mean(ious):.3f} "
          f"time={times[-1]:.0f} ms")

print(f"average ONNX time: {np.mean(times):.0f} ms")
