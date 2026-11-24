import cv2
import numpy as np
from pathlib import Path
from PIL import Image

raiz = Path(__file__).resolve().parents[1]
origem = raiz / "assets" / "propostas" / "G00-portao-proposta.jpg"
destino = raiz / "assets" / "propostas" / "G00-portao-sem-medalhao.jpg"
check = raiz / "assets" / "propostas" / "_check-sem-medalhao.png"

# OpenCV não lê bem caminhos com acento no Windows — carregar via PIL
rgb = np.array(Image.open(origem).convert("RGB"))
img = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
h, w = img.shape[:2]

mascara = np.zeros((h, w), dtype=np.uint8)
centro = (275, 625)
eixos = (78, 72)
cv2.ellipse(mascara, centro, eixos, 0, 0, 360, 255, -1)
kernel = np.ones((7, 7), np.uint8)
mascara = cv2.dilate(mascara, kernel, iterations=1)

resultado = cv2.inpaint(img, mascara, inpaintRadius=5, flags=cv2.INPAINT_TELEA)
resultado = cv2.inpaint(resultado, mascara, inpaintRadius=3, flags=cv2.INPAINT_NS)

out_rgb = cv2.cvtColor(resultado, cv2.COLOR_BGR2RGB)
pil = Image.fromarray(out_rgb)
pil.save(destino, quality=95)
pil.crop((180, 520, 420, 710)).save(check)
print("ok", destino)
