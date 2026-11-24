from PIL import Image
import numpy as np

path = r"C:\Users\gabri\.cursor\projects\c-Users-gabri-OneDrive-Desktop-MARTE-VERS-O-FINAL\assets\C02-mesa-cartas-base-v2.jpg"
im = Image.open(path).convert("RGB")
arr = np.array(im)
h, w, _ = arr.shape
bri = arr.mean(axis=2)

paper_mask = (
    (arr[:, :, 0] > 150)
    & (arr[:, :, 1] > 130)
    & (arr[:, :, 2] > 90)
    & (bri > 140)
)
ys, xs = np.where(paper_mask)
if len(xs):
    print(
        "paper bbox %",
        round(xs.min() / w * 100, 1),
        round(ys.min() / h * 100, 1),
        round((xs.max() - xs.min()) / w * 100, 1),
        round((ys.max() - ys.min()) / h * 100, 1),
    )
    print("paper LTRB %", round(xs.min() / w * 100, 1), round(ys.min() / h * 100, 1), round(xs.max() / w * 100, 1), round(ys.max() / h * 100, 1))
    print("paper px", xs.min(), ys.min(), xs.max(), ys.max())

# Detect darker slot-like regions in left 55% and upper-mid band
left = bri[:, : int(w * 0.55)]
# local darkness relative to neighborhood
print("image", w, h)
for gy in range(10):
    row = []
    for gx in range(12):
        y0, y1 = int(gy * h / 10), int((gy + 1) * h / 10)
        x0, x1 = int(gx * w / 12), int((gx + 1) * w / 12)
        row.append(f"{bri[y0:y1, x0:x1].mean():5.0f}")
    print(" ".join(row))

# Save a debug overlay grid
dbg = im.copy()
from PIL import ImageDraw
d = ImageDraw.Draw(dbg)
for i in range(1, 10):
    y = int(i * h / 10)
    d.line([(0, y), (w, y)], fill=(255, 0, 0), width=1)
for i in range(1, 20):
    x = int(i * w / 20)
    d.line([(x, 0), (x, h)], fill=(0, 255, 0), width=1)
out = r"C:\Users\gabri\OneDrive\Desktop\MARTE - VERSÃO FINAL\assets\C02\_mesa-grid-debug.jpg"
dbg.save(out, quality=90)
print("wrote", out)
