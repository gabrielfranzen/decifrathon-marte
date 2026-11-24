from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os

base_path = r"C:\Users\gabri\OneDrive\Desktop\MARTE - VERSÃO FINAL\assets\propostas\G00-portao-proposta.jpg"
out_path = r"C:\Users\gabri\OneDrive\Desktop\MARTE - VERSÃO FINAL\assets\propostas\G00-portao-proposta.jpg"
check_path = r"C:\Users\gabri\OneDrive\Desktop\MARTE - VERSÃO FINAL\assets\propostas\_crop-ihuurr-check.png"

im = Image.open(base_path).convert("RGBA")

# Interior útil da placa (dentro da moldura), com margem interna
# Ajustado para o nicho vertical da pilastra direita
inner = (1005, 302, 1095, 392)  # left, top, right, bottom
pad = 8
box = (inner[0] + pad, inner[1] + pad, inner[2] - pad, inner[3] - pad)
max_w = box[2] - box[0]
max_h = box[3] - box[1]
cx = (box[0] + box[2]) // 2
cy = (box[1] + box[3]) // 2

font_path = None
for cand in [
    r"C:\Windows\Fonts\georgia.ttf",
    r"C:\Windows\Fonts\times.ttf",
    r"C:\Windows\Fonts\consola.ttf",
]:
    if os.path.exists(cand):
        font_path = cand
        break

texto = "IHUUR"
layer = Image.new("RGBA", im.size, (0, 0, 0, 0))
draw = ImageDraw.Draw(layer)

# Encontra o maior tamanho que cabe na largura e na altura
tamanho = 10
fonte_final = ImageFont.load_default()
for t in range(10, 80):
    if font_path:
        fonte = ImageFont.truetype(font_path, t)
    else:
        fonte = ImageFont.load_default()
    bbox = draw.textbbox((0, 0), texto, font=fonte)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    if tw <= max_w and th <= max_h:
        tamanho = t
        fonte_final = fonte
    else:
        break

bbox = draw.textbbox((0, 0), texto, font=fonte_final)
tw = bbox[2] - bbox[0]
th = bbox[3] - bbox[1]
x = cx - tw // 2 - bbox[0]
y = cy - th // 2 - bbox[1]

# Gravura contida: entalhe escuro + bisel discreto
draw.text((x + 1, y + 1), texto, font=fonte_final, fill=(185, 175, 155, 45))
draw.text((x, y), texto, font=fonte_final, fill=(22, 18, 14, 230))

layer = layer.filter(ImageFilter.GaussianBlur(radius=0.25))
out = Image.alpha_composite(im, layer).convert("RGB")
out.save(out_path, quality=95)

# Verificação: só a placa
out.crop((inner[0] - 25, inner[1] - 25, inner[2] + 25, inner[3] + 25)).save(check_path)
print(f"ok fonte={tamanho}px caixa={box} texto={tw}x{th}")
