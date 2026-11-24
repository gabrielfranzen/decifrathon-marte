from pathlib import Path
from PIL import Image, ImageFilter, ImageDraw

raiz = Path(__file__).resolve().parents[1]
base = Image.open(raiz / "assets" / "propostas" / "G00-portao-proposta.jpg").convert("RGBA")

candidatos = [
    Path(r"C:\Users\gabri\.cursor\projects\c-Users-gabri-OneDrive-Desktop-MARTE-VERS-O-FINAL\assets\G00-chao-sem-medalhao-patch.jpg"),
    raiz / "assets" / "propostas" / "G00-chao-sem-medalhao-patch.jpg",
]
patch_path = next(p for p in candidatos if p.exists())
patch = Image.open(patch_path).convert("RGBA")

box = (145, 515, 410, 715)
alvo_w = box[2] - box[0]
alvo_h = box[3] - box[1]
patch = patch.resize((alvo_w, alvo_h), Image.Resampling.LANCZOS)

# Máscara quase opaca no centro; só borda estreita suave
mascara = Image.new("L", (alvo_w, alvo_h), 0)
draw = ImageDraw.Draw(mascara)
margem = 6
draw.rectangle((margem, margem, alvo_w - margem - 1, alvo_h - margem - 1), fill=255)
mascara = mascara.filter(ImageFilter.GaussianBlur(radius=4))

base.paste(patch, (box[0], box[1]), mascara)
out = base.convert("RGB")
destino = raiz / "assets" / "propostas" / "G00-portao-sem-medalhao.jpg"
out.save(destino, quality=95)
out.crop((140, 500, 420, 720)).save(raiz / "assets" / "propostas" / "_check-sem-medalhao.png")
print("ok", destino)
