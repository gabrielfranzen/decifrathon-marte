from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

raiz = Path(__file__).resolve().parents[1]
base = Image.open(raiz / "assets" / "G00" / "G00-portao-sem-medalhao.jpg").convert("RGBA")
med = Image.open(raiz / "assets" / "inventario" / "objeto-medalhao-base.jpg").convert("RGBA")

# Remove fundo preto da textura
pixels = med.load()
largura0, altura0 = med.size
for y in range(altura0):
    for x in range(largura0):
        r, g, b, a = pixels[x, y]
        if r < 22 and g < 22 and b < 22:
            pixels[x, y] = (r, g, b, 0)

# Tamanho intermediário: ~7.5% da largura da cena (nem escudo, nem moeda)
tamanho = max(40, int(base.width * 0.075))
med = med.resize((tamanho, tamanho), Image.Resampling.LANCZOS)

mascara = Image.new("L", (tamanho, tamanho), 0)
ImageDraw.Draw(mascara).ellipse((1, 1, tamanho - 2, tamanho - 2), fill=255)
mascara = mascara.filter(ImageFilter.GaussianBlur(0.9))
alpha = Image.new("L", (tamanho, tamanho), 0)
alpha.paste(mascara, (0, 0))
med.putalpha(alpha)

sombra = Image.new("RGBA", (tamanho + 12, tamanho + 12), (0, 0, 0, 0))
ImageDraw.Draw(sombra).ellipse((4, 7, tamanho + 4, tamanho + 5), fill=(0, 0, 0, 100))
sombra = sombra.filter(ImageFilter.GaussianBlur(3.5))

x = int(base.width * 0.15)
y = int(base.height * 0.82)
base.alpha_composite(sombra, (x - 2, y + 3))
base.alpha_composite(med, (x, y))

destino = raiz / "assets" / "G00" / "G00-portao-tres-passos.jpg"
base.convert("RGB").save(destino, quality=94)
print(f"ok {destino.name} medalhao={tamanho}px pos=({x},{y}) cena={base.size}")
