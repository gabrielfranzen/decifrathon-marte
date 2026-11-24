# Remove o cadeado da foto C02, gerando a vista com a gaveta destrancada.
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

raiz = Path(__file__).resolve().parents[1]
sala_path = raiz / "assets" / "C02" / "C02-sala-cartas.jpg"
saida = raiz / "assets" / "C02" / "C02-sala-cartas-aberta.jpg"

sala = Image.open(sala_path).convert("RGB")
arr = np.asarray(sala).astype(np.float32)
w, h = sala.size

# Região do cadeado (centro da frente da gaveta)
x1, y1 = int(w * 0.448), int(h * 0.700)
x2, y2 = int(w * 0.552), int(h * 0.870)

# Madeira limpa nas laterais da gaveta (longe do metal)
xl0, xl1 = int(w * 0.30), int(w * 0.40)
xr0, xr1 = int(w * 0.60), int(w * 0.70)

out = arr.copy()
for y in range(y1, y2):
    ys = slice(max(0, y - 2), min(h, y + 3))
    left = arr[ys, xl0:xl1].mean(axis=(0, 1))
    right = arr[ys, xr0:xr1].mean(axis=(0, 1))
    for x in range(x1, x2):
        t = (x - x1) / max(1, (x2 - x1 - 1))
        out[y, x] = (1 - t) * left + t * right

resultado = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))

mask = Image.new("L", (w, h), 0)
draw = ImageDraw.Draw(mask)
inset = 6
draw.rectangle((x1 + inset, y1 + inset, x2 - 1 - inset, y2 - 1 - inset), fill=255)
mask = mask.filter(ImageFilter.GaussianBlur(5))
draw.rectangle((x1 + 10, y1 + 10, x2 - 11, y2 - 11), fill=255)

mistura = Image.composite(resultado, sala, mask)
mistura.save(saida, quality=93)
print(f"salvo {saida}")
