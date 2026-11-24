from pathlib import Path

import numpy as np
from PIL import Image, ImageEnhance, ImageFilter

corredor = Path(
    r"C:\Users\gabri\OneDrive\Desktop\MARTE - VERSÃO FINAL\assets\C01B\C01B-corredor-morte-fundo.jpg"
)
# Geração AI com cavaleiro mid-frame (costas), usada só como fonte do personagem
fonte_cena = Path(
    r"C:\Users\gabri\.cursor\projects\c-Users-gabri-OneDrive-Desktop-MARTE-VERS-O-FINAL\assets\C01B-luta-fuga.jpg"
)
saida = Path(
    r"C:\Users\gabri\OneDrive\Desktop\MARTE - VERSÃO FINAL\assets\C01B\C01B-luta-fuga.jpg"
)

base = Image.open(corredor).convert("RGBA")
w, h = base.size
cena = Image.open(fonte_cena).convert("RGB")
cw, ch = cena.size

# Recorta a região do cavaleiro no centro da geração
x0, x1 = int(cw * 0.30), int(cw * 0.70)
y0, y1 = int(ch * 0.10), int(ch * 0.92)
crop = cena.crop((x0, y0, x1, y1))
rw, rh = crop.size
rgb = np.array(crop)

# Remove pixels muito escuros das bordas (fundo do crop), mantém personagem
luma = rgb.mean(axis=2)
# Seed flood a partir das bordas do crop
visitado = np.zeros((rh, rw), dtype=bool)
pilha = []
for x in range(rw):
    pilha.append((x, 0))
    pilha.append((x, rh - 1))
for y in range(rh):
    pilha.append((0, y))
    pilha.append((rw - 1, y))
limiar = 32
while pilha:
    x, y = pilha.pop()
    if x < 0 or y < 0 or x >= rw or y >= rh or visitado[y, x]:
        continue
    if float(luma[y, x]) > limiar:
        continue
    visitado[y, x] = True
    pilha.extend([(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)])

fundo = np.array(
    Image.fromarray((visitado.astype(np.uint8) * 255), mode="L").filter(
        ImageFilter.MaxFilter(5)
    )
) > 0
alpha = np.where(fundo, 0, 255).astype(np.uint8)
alpha = np.array(Image.fromarray(alpha).filter(ImageFilter.GaussianBlur(1.0)))
cav = Image.merge("RGBA", (*crop.split(), Image.fromarray(alpha)))

ys, xs = np.where(alpha > 40)
if len(xs) == 0:
    raise SystemExit("mascara vazia")
cav = cav.crop((int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1))

altura_alvo = int(h * 0.38)
ratio = altura_alvo / cav.size[1]
nova_w = max(1, int(cav.size[0] * ratio))
cav = cav.resize((nova_w, altura_alvo), Image.Resampling.LANCZOS)

rgb_c = ImageEnhance.Brightness(cav.convert("RGB")).enhance(0.78)
rgb_c = ImageEnhance.Contrast(rgb_c).enhance(1.05)
a = cav.split()[3].filter(ImageFilter.GaussianBlur(0.9))
cav = Image.merge("RGBA", (*rgb_c.split(), a))

pos_x = (w - nova_w) // 2
pos_y = int(h * 0.33)

comp = base.copy()
comp.paste(cav, (pos_x, pos_y), cav)
comp.convert("RGB").save(saida, quality=93)
print("saved", saida, "knight", nova_w, altura_alvo, "at", pos_x, pos_y)
