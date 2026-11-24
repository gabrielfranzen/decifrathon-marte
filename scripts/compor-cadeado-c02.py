# Cola o cadeado estilo portão (4 letras) na gaveta da sala C02.
from pathlib import Path

from PIL import Image, ImageFilter

raiz = Path(__file__).resolve().parents[1]
sala_path = Path(
    r"C:\Users\gabri\.cursor\projects\c-Users-gabri-OneDrive-Desktop-MARTE-VERS-O-FINAL\assets\C02-sala-cartas-base.jpg"
)
prop_path = Path(
    r"C:\Users\gabri\.cursor\projects\c-Users-gabri-OneDrive-Desktop-MARTE-VERS-O-FINAL\assets\cadeado-portao-4-chroma.jpg"
)
saida = raiz / "assets" / "C02" / "C02-sala-cartas.jpg"

sala_rgb = Image.open(sala_path).convert("RGB")
prop = Image.open(prop_path).convert("RGBA")
w, h = sala_rgb.size

pixels = prop.load()
pw, ph = prop.size
for y in range(ph):
    for x in range(pw):
        r, g, b, a = pixels[x, y]
        if g >= 80 and g >= r + 25 and g >= b + 25:
            pixels[x, y] = (0, 0, 0, 0)
        elif g >= 60 and g > r and g > b and (g - min(r, b)) >= 15:
            alpha = max(0, 255 - int((g - min(r, b)) * 8))
            pixels[x, y] = (r, g, b, alpha)

bbox = prop.getbbox()
if not bbox:
    raise SystemExit("máscara vazia")
cadeado = prop.crop(bbox)

alvo_w = int(w * 0.055)
ratio = alvo_w / cadeado.width
cadeado = cadeado.resize(
    (alvo_w, max(1, int(cadeado.height * ratio))),
    Image.Resampling.LANCZOS,
)

cx = int(w * 0.50)
cy = int(h * 0.73)

# Cobre opaco o cadeado antigo (madeira da gaveta, leve blur)
x1, y1 = int(w * 0.42), int(h * 0.58)
x2, y2 = int(w * 0.58), int(h * 0.86)
tw, th = x2 - x1, y2 - y1
amostra = sala_rgb.crop(
    (int(w * 0.12), int(h * 0.68), int(w * 0.22), int(h * 0.82))
).resize((tw, th), Image.Resampling.LANCZOS)
amostra = amostra.filter(ImageFilter.GaussianBlur(1.2))
sala_rgb.paste(amostra, (x1, y1))

sala = sala_rgb.convert("RGBA")
x0 = cx - cadeado.width // 2
y0 = cy - int(cadeado.height * 0.48)
sala.alpha_composite(cadeado, (x0, y0))

final = sala.convert("RGB")
final.save(saida, quality=93)

check = final.crop((cx - 100, int(h * 0.55), cx + 100, int(h * 0.92)))
check.save(raiz / "assets" / "C02" / "_check-cadeado.jpg", quality=90)
print(f"salvo {saida} lock={cadeado.size} em ({x0},{y0}) cover=({x1},{y1})-({x2},{y2})")
