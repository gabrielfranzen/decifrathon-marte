from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter

galeria_path = Path(
    r"C:\Users\gabri\OneDrive\Desktop\MARTE - VERSÃO FINAL\assets\C01B\C01B-galeria-superior.jpg"
)
cutout_path = Path(
    r"C:\Users\gabri\.cursor\projects\c-Users-gabri-OneDrive-Desktop-MARTE-VERS-O-FINAL\assets\C01B-perseguidor-cutout.jpg"
)
out_path = Path(
    r"C:\Users\gabri\OneDrive\Desktop\MARTE - VERSÃO FINAL\assets\C01B\C01B-morte-alerta.jpg"
)
debug_path = Path(
    r"C:\Users\gabri\.cursor\projects\c-Users-gabri-OneDrive-Desktop-MARTE-VERS-O-FINAL\assets\C01B-alerta-debug.jpg"
)

galeria = Image.open(galeria_path).convert("RGBA")
src = Image.open(cutout_path).convert("RGB")
w, h = galeria.size
cw, ch = src.size
rgb = np.array(src)

# Flood fill do fundo preto (preserva armadura escura)
visitado = np.zeros((ch, cw), dtype=bool)
pilha = [(0, 0), (cw - 1, 0), (0, ch - 1), (cw - 1, ch - 1), (cw // 2, 0)]
limiar = 32
while pilha:
    x, y = pilha.pop()
    if x < 0 or y < 0 or x >= cw or y >= ch or visitado[y, x]:
        continue
    if float(rgb[y, x].mean()) > limiar:
        continue
    visitado[y, x] = True
    pilha.extend([(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)])

fundo_img = Image.fromarray((visitado.astype(np.uint8) * 255), mode="L").filter(
    ImageFilter.MaxFilter(3)
)
fundo = np.array(fundo_img) > 0
alpha = np.where(fundo, 0, 255).astype(np.uint8)
alpha = np.array(Image.fromarray(alpha).filter(ImageFilter.GaussianBlur(0.4)))
cut = Image.merge("RGBA", (*src.split(), Image.fromarray(alpha)))

ys, xs = np.where(alpha > 40)
cut = cut.crop((int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1))

altura_alvo = int(h * 0.30)
ratio = altura_alvo / cut.size[1]
nova_w = max(1, int(cut.size[0] * ratio))
cut = cut.resize((nova_w, altura_alvo), Image.Resampling.LANCZOS)
cut_rgb = ImageEnhance.Brightness(cut.convert("RGB")).enhance(0.75)
cut_rgb = ImageEnhance.Contrast(cut_rgb).enhance(1.08)
cut = Image.merge("RGBA", (*cut_rgb.split(), cut.split()[3]))

# Contra a parede esquerda; pés no piso do walkway (atrás da grade)
pos_x = 70
pes_y = 400
pos_y = pes_y - altura_alvo

base = galeria.copy()
base.paste(cut, (pos_x, pos_y), cut)

# Detecta madeira da cerca só na faixa esquerda
g_np = np.array(galeria.convert("RGB")).astype(np.float32)
r, g, b = g_np[:, :, 0], g_np[:, :, 1], g_np[:, :, 2]
# Madeira escura: R um pouco > G/B, luminância baixa-média
luma = (r + g + b) / 3.0
madeira = (r > g + 2) & (r > b + 2) & (luma > 12) & (luma < 95) & (r < 120)

# ROI da cerca esquerda (não pega portas da parede)
roi = np.zeros((h, w), dtype=bool)
roi[250:520, 160:290] = True
# Exclui área muito à esquerda (parede/portas)
roi[:, :165] = False

mascara_cerca = madeira & roi
# Dilata um pouco para cobrir balaústres finos
mask_img = Image.fromarray((mascara_cerca.astype(np.uint8) * 255), mode="L")
mask_img = mask_img.filter(ImageFilter.MaxFilter(3))
m = (np.array(mask_img).astype(np.float32) / 255.0)[:, :, None]

base_np = np.array(base)
galeria_np = np.array(galeria)
comp = base_np.astype(np.float32) * (1.0 - m) + galeria_np.astype(np.float32) * m
resultado = Image.fromarray(np.clip(comp, 0, 255).astype(np.uint8), mode="RGBA").convert("RGB")
resultado.save(out_path, quality=93)

dbg = resultado.convert("RGBA")
overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
od = ImageDraw.Draw(overlay)
# pinta máscara da cerca
mc = np.array(mask_img)
ys_m, xs_m = np.where(mc > 40)
for yy, xx in zip(ys_m[::8], xs_m[::8]):
    od.point((int(xx), int(yy)), fill=(255, 0, 0, 180))
od.rectangle([pos_x, pos_y, pos_x + nova_w, pos_y + altura_alvo], outline=(0, 255, 0, 220))
od.ellipse(
    [pos_x + nova_w // 2 - 4, pes_y - 4, pos_x + nova_w // 2 + 4, pes_y + 4],
    fill=(0, 255, 255, 220),
)
dbg = Image.alpha_composite(dbg, overlay).convert("RGB")
dbg.save(debug_path, quality=90)

print("saved", out_path)
print("knight", pos_x, pos_y, "feet", pes_y)
print("railing pixels", int(mascara_cerca.sum()))
