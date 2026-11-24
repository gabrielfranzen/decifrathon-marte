from PIL import Image, ImageEnhance, ImageFilter

BASE_FECHADA = (
    r"C:\Users\gabri\.cursor\projects\c-Users-gabri-OneDrive-Desktop-MARTE-VERS-O-FINAL"
    r"\assets\C01C-antecamara-base.jpg"
)
BASE_ABERTA = (
    r"C:\Users\gabri\.cursor\projects\c-Users-gabri-OneDrive-Desktop-MARTE-VERS-O-FINAL"
    r"\assets\C01C-antecamara-porta-entreaberta-base.jpg"
)
ALAVANCAS = (
    r"C:\Users\gabri\OneDrive\Desktop\MARTE - VERSÃO FINAL"
    r"\assets\C01C\C01C-alavancas-detalhe.jpg"
)
SAIDA_FECHADA = (
    r"C:\Users\gabri\OneDrive\Desktop\MARTE - VERSÃO FINAL"
    r"\assets\C01C\C01C-antecamara.jpg"
)
SAIDA_ABERTA = (
    r"C:\Users\gabri\OneDrive\Desktop\MARTE - VERSÃO FINAL"
    r"\assets\C01C\C01C-antecamara-porta-entreaberta.jpg"
)


def preparar_alavancas(caminho, alvo_w, alvo_h):
    img = Image.open(caminho).convert("RGBA")
    img = img.resize((alvo_w, alvo_h), Image.Resampling.LANCZOS)
    # Escurece um pouco para casar com a antecâmara
    rgb = ImageEnhance.Brightness(img.convert("RGB")).enhance(0.78)
    rgb = ImageEnhance.Color(rgb).enhance(0.85)
    rgb = ImageEnhance.Contrast(rgb).enhance(1.08)
    img = Image.merge(
        "RGBA",
        (*rgb.split(), img.split()[-1]),
    )
    # Máscara com bordas suaves para não parecer “colado”
    mask = Image.new("L", (alvo_w, alvo_h), 0)
    inset = Image.new("L", (max(1, alvo_w - 10), max(1, alvo_h - 10)), 255)
    mask.paste(inset, (5, 5))
    mask = mask.filter(ImageFilter.GaussianBlur(4))
    img.putalpha(mask)
    return img


def compor(caminho_base, caminho_saida):
    base = Image.open(caminho_base).convert("RGBA")
    w, h = base.size
    # Placa esquerda da porta na base gerada
    alvo_w = int(w * 0.132)
    alvo_h = int(h * 0.36)
    levers = preparar_alavancas(ALAVANCAS, alvo_w, alvo_h)
    x = int(w * 0.292)
    y = int(h * 0.248)
    out = base.copy()
    out.alpha_composite(levers, (x, y))
    out.convert("RGB").save(caminho_saida, quality=93)
    print(f"salvo {caminho_saida} @ ({x},{y}) {alvo_w}x{alvo_h}")


compor(BASE_FECHADA, SAIDA_FECHADA)
compor(BASE_ABERTA, SAIDA_ABERTA)
