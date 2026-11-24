# Compoe C02-mesa-cartas.jpg: nichos no tamanho de carta + texto PISTAS no papel.
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance, ImageOps
import os
import numpy as np

BASE = r"C:\Users\gabri\.cursor\projects\c-Users-gabri-OneDrive-Desktop-MARTE-VERS-O-FINAL\assets\C02-mesa-cartas-lisa.jpg"
OUT = r"C:\Users\gabri\OneDrive\Desktop\MARTE - VERSÃO FINAL\assets\C02\C02-mesa-cartas.jpg"
CHECK = r"C:\Users\gabri\OneDrive\Desktop\MARTE - VERSÃO FINAL\assets\C02\_check-papel-cartas.jpg"

# Layout alvo em % do palco 16:9 (sincronizar com mesa-cartas.js)
TAMANHO = (6.8, 16.5)  # width%, height% — cabe 2x5 na mao sem scroll
SLOTS = [
    (5.5, 10.0),
    (13.8, 10.0),
    (22.1, 10.0),
    (30.4, 10.0),
]

# Papel grande a direita (area util para texto nitido)
PAPEL = (48.0, 5.0, 40.0, 62.0)  # left, top, width, height % — evita o cadeado

PISTAS = [
    "Os quatro naipes estão sobre a mesa.",
    "Só um número aparece duas vezes na mesa.",
    "Os números da mesa somam doze.",
    "Juntas, as pretas valem mais que as vermelhas.",
    "As pontas são pretas.",
    "A última carta vale mais entre as quatro.",
    "O ouro nunca toca a lâmina.",
]
FECHO_PISTAS = (
    "Quando as quatro estiverem sobre a mesa, leia o que elas escondem."
)
TITULO = "AS QUATRO CARTAS"


def pct_box(w, h, left, top, width, height):
    x0 = int(left / 100 * w)
    y0 = int(top / 100 * h)
    x1 = int((left + width) / 100 * w)
    y1 = int((top + height) / 100 * h)
    return x0, y0, x1, y1


def achar_papel_original(arr):
    h, w, _ = arr.shape
    bri = arr.mean(axis=2)
    mask = (
        (arr[:, :, 0] > 145)
        & (arr[:, :, 1] > 125)
        & (arr[:, :, 2] > 85)
        & (bri > 135)
        & (np.arange(w)[None, :] > w * 0.45)
    )
    ys, xs = np.where(mask)
    if len(xs) == 0:
        return None
    return (
        int(np.percentile(xs, 2)),
        int(np.percentile(ys, 2)),
        int(np.percentile(xs, 98)),
        int(np.percentile(ys, 98)),
    )


def desenhar_nicho(base, box, madeira_amostra):
    x0, y0, x1, y1 = box
    nw = x1 - x0
    nh = y1 - y0
    patch = madeira_amostra.resize((nw, nh), Image.Resampling.LANCZOS)
    patch = ImageEnhance.Brightness(patch).enhance(0.42)
    patch = ImageEnhance.Contrast(patch).enhance(1.15)
    base.paste(patch, (x0, y0))

    overlay = Image.new("RGBA", base.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    d.rectangle([x0, y0, x1 - 1, y1 - 1], outline=(8, 6, 4, 210), width=2)
    d.line([(x0 + 2, y0 + 2), (x1 - 3, y0 + 2)], fill=(0, 0, 0, 160), width=2)
    d.line([(x0 + 2, y0 + 2), (x0 + 2, y1 - 3)], fill=(0, 0, 0, 140), width=2)
    d.line([(x0 + 3, y1 - 3), (x1 - 3, y1 - 3)], fill=(90, 70, 45, 70), width=1)
    d.line([(x1 - 3, y0 + 3), (x1 - 3, y1 - 3)], fill=(90, 70, 45, 55), width=1)
    return Image.alpha_composite(base.convert("RGBA"), overlay).convert("RGB")


def pintar_papel_grande(im, papel_box, amostra_papel):
    x0, y0, x1, y1 = papel_box
    pw, ph = x1 - x0, y1 - y0
    # Estica amostra do pergaminho original
    sheet = amostra_papel.resize((pw, ph), Image.Resampling.LANCZOS)
    # Suaviza bordas um pouco irregular
    mask = Image.new("L", (pw, ph), 0)
    md = ImageDraw.Draw(mask)
    md.rounded_rectangle([0, 0, pw - 1, ph - 1], radius=6, fill=255)
    # Sombra sob o papel
    sombra = Image.new("RGBA", im.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(sombra)
    sd.rounded_rectangle(
        [x0 + 4, y0 + 5, x1 + 3, y1 + 6], radius=6, fill=(0, 0, 0, 110)
    )
    sombra = sombra.filter(ImageFilter.GaussianBlur(radius=3))
    base = Image.alpha_composite(im.convert("RGBA"), sombra)
    base.paste(sheet, (x0, y0), mask)
    # Borda sutil
    edge = Image.new("RGBA", im.size, (0, 0, 0, 0))
    ed = ImageDraw.Draw(edge)
    ed.rounded_rectangle(
        [x0, y0, x1 - 1, y1 - 1],
        radius=6,
        outline=(90, 70, 45, 90),
        width=1,
    )
    return Image.alpha_composite(base, edge).convert("RGB")


def quebrar_linha(texto, fonte, max_w, draw):
    palavras = texto.split()
    linhas = []
    atual = ""
    for p in palavras:
        teste = f"{atual} {p}".strip()
        bbox = draw.textbbox((0, 0), teste, font=fonte)
        if bbox[2] - bbox[0] <= max_w:
            atual = teste
        else:
            if atual:
                linhas.append(atual)
            atual = p
    if atual:
        linhas.append(atual)
    return linhas


def desenhar_texto_papel(im, papel_box):
    x0, y0, x1, y1 = papel_box
    pad_x = int((x1 - x0) * 0.07)
    pad_y = int((y1 - y0) * 0.05)
    box = (x0 + pad_x, y0 + pad_y, x1 - pad_x, y1 - pad_y)
    max_w = box[2] - box[0]
    max_h = box[3] - box[1]

    font_path = None
    for cand in [
        r"C:\Windows\Fonts\georgia.ttf",
        r"C:\Windows\Fonts\times.ttf",
        r"C:\Windows\Fonts\segoeui.ttf",
        r"C:\Windows\Fonts\arial.ttf",
    ]:
        if os.path.exists(cand):
            font_path = cand
            break

    layer = Image.new("RGBA", im.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)

    melhor = None
    for t in range(42, 15, -1):
        if font_path:
            fonte_tit = ImageFont.truetype(font_path, t + 8)
            fonte = ImageFont.truetype(font_path, t)
        else:
            fonte_tit = ImageFont.load_default()
            fonte = fonte_tit

        linhas = []
        for i, pista in enumerate(PISTAS, start=1):
            bloco = quebrar_linha(f"{i}. {pista}", fonte, max_w, draw)
            linhas.extend(bloco)
            # Espaco compacto entre pistas (linha vazia curta)
            linhas.append("")

        while linhas and linhas[-1] == "":
            linhas.pop()

        bb_tit = draw.textbbox((0, 0), TITULO, font=fonte_tit)
        tit_h = bb_tit[3] - bb_tit[1]
        gap_tit = int(t * 0.55)
        line_h = int(t * 1.22)
        vazios = sum(1 for ln in linhas if ln == "")
        total_h = tit_h + gap_tit + line_h * (len(linhas) - vazios) + int(
            line_h * 0.22
        ) * vazios
        if total_h <= max_h * 0.98:
            melhor = (fonte_tit, fonte, linhas, tit_h, gap_tit, line_h, t)
            break

    if not melhor:
        raise SystemExit("texto nao cabe no papel")

    fonte_tit, fonte, linhas, tit_h, gap_tit, line_h, t = melhor
    y = box[1]
    bb_tit = draw.textbbox((0, 0), TITULO, font=fonte_tit)
    tw = bb_tit[2] - bb_tit[0]
    x_tit = box[0] + (max_w - tw) // 2 - bb_tit[0]
    draw.text((x_tit + 1, y + 1), TITULO, font=fonte_tit, fill=(90, 70, 40, 70))
    draw.text((x_tit, y), TITULO, font=fonte_tit, fill=(38, 26, 14, 240))
    y += tit_h + gap_tit

    for linha in linhas:
        if linha == "":
            y += int(line_h * 0.22)
            continue
        draw.text((box[0] + 1, y + 1), linha, font=fonte, fill=(80, 60, 35, 50))
        draw.text((box[0], y), linha, font=fonte, fill=(32, 22, 12, 235))
        y += line_h

    layer = layer.filter(ImageFilter.GaussianBlur(radius=0.15))
    out = Image.alpha_composite(im.convert("RGBA"), layer).convert("RGB")
    print(f"fonte={t}px papel={papel_box}")
    return out


def main():
    im = Image.open(BASE).convert("RGB")
    w, h = im.size
    arr = np.array(im)
    papel_orig = achar_papel_original(arr)
    print("papel original", papel_orig)

    if papel_orig:
        amostra_papel = im.crop(papel_orig)
    else:
        # Fallback bege pergaminho
        amostra_papel = Image.new("RGB", (200, 280), (214, 198, 162))

    # Cobre toda a faixa direita (papel antigo incluso) com madeira antes do pergaminho
    madeira = im.crop((int(w * 0.08), int(h * 0.18), int(w * 0.28), int(h * 0.42)))
    rx0, ry0, rx1, ry1 = int(w * 0.45), int(h * 0.04), int(w * 0.92), int(h * 0.72)
    cover = madeira.resize((rx1 - rx0, ry1 - ry0), Image.Resampling.LANCZOS)
    im.paste(cover, (rx0, ry0))

    papel = pct_box(w, h, *PAPEL)
    im = pintar_papel_grande(im, papel, amostra_papel)

    amostra_mad = madeira
    for left, top in SLOTS:
        box = pct_box(w, h, left, top, TAMANHO[0], TAMANHO[1])
        im = desenhar_nicho(im, box, amostra_mad)
        print("nicho", box)

    im = desenhar_texto_papel(im, papel)
    im.save(OUT, quality=95)
    px0, py0, px1, py1 = papel
    im.crop((px0 - 8, py0 - 8, px1 + 8, py1 + 8)).save(CHECK, quality=92)
    print("ok", OUT)


if __name__ == "__main__":
    main()
