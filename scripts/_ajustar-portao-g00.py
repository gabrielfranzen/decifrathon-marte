# Cola o cadeado do modal no portão e reposiciona o medalhão mais alto
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance

raiz = Path(__file__).resolve().parents[1]
origem_porta = Path(
    r"C:\Users\gabri\.cursor\projects\c-Users-gabri-OneDrive-Desktop-MARTE-VERS-O-FINAL\assets\G00-portao-base-limpa.jpg"
)
# Usa a geração "crua" se existir backup; senão a atual
ref_cadeado = raiz / "assets" / "G00" / "_ref-cadeado-modal.png"
saida_tres = raiz / "assets" / "G00" / "G00-portao-tres-passos.jpg"
saida_frente = raiz / "assets" / "G00" / "G00-portao-frente.jpg"
saida_sem = raiz / "assets" / "G00" / "G00-portao-sem-medalhao.jpg"
crop_debug = raiz / "assets" / "G00" / "_ref-cadeado-crop.png"


def preparar_cadeado(ref: Image.Image) -> Image.Image:
    w, h = ref.size
    # Corta o corpo do cadeado e evita a label "LINGUETA" no rodapé do modal
    crop = ref.crop((int(w * 0.22), int(h * 0.04), int(w * 0.78), int(h * 0.78))).convert(
        "RGBA"
    )
    pixels = crop.load()
    cw, ch = crop.size
    for y in range(ch):
        for x in range(cw):
            r, g, b, a = pixels[x, y]
            if r < 50 and g < 50 and b < 50:
                pixels[x, y] = (r, g, b, 0)
            elif r < 68 and g < 68 and b < 68:
                pixels[x, y] = (r, g, b, max(0, min(255, (max(r, g, b) - 40) * 10)))
    crop.save(crop_debug)
    return crop


def amostra(base: Image.Image, caixa):
    pedaco = base.crop(caixa).convert("RGB")
    dados = list(pedaco.get_flattened_data())
    # get_flattened_data pode não existir em todas as versões; fallback
    try:
        pixels = list(pedaco.getdata())
    except Exception:
        pixels = [dados[i : i + 3] for i in range(0, len(dados), 3)]
    n = max(1, len(pixels))
    return (
        sum(p[0] for p in pixels) // n,
        sum(p[1] for p in pixels) // n,
        sum(p[2] for p in pixels) // n,
    )


def pintar_retangulo_suave(base: Image.Image, caixa, cor, blur=6, alpha=255):
    camada = Image.new("RGBA", base.size, (0, 0, 0, 0))
    ImageDraw.Draw(camada).rounded_rectangle(caixa, radius=18, fill=(*cor, alpha))
    camada = camada.filter(ImageFilter.GaussianBlur(radius=blur))
    return Image.alpha_composite(base.convert("RGBA"), camada)


def pintar_elipse(base: Image.Image, caixa, cor, blur=8, alpha=255):
    camada = Image.new("RGBA", base.size, (0, 0, 0, 0))
    ImageDraw.Draw(camada).ellipse(caixa, fill=(*cor, alpha))
    camada = camada.filter(ImageFilter.GaussianBlur(radius=blur))
    return Image.alpha_composite(base.convert("RGBA"), camada)


def colar_cadeado(base: Image.Image, cadeado: Image.Image) -> Image.Image:
    w, h = base.size
    # Amostra madeira da porta para cobrir o cadeado gerado antigo
    cor_porta = amostra(
        base, (int(w * 0.46), int(h * 0.40), int(w * 0.49), int(h * 0.48))
    )
    cor_porta2 = amostra(
        base, (int(w * 0.51), int(h * 0.55), int(w * 0.54), int(h * 0.62))
    )
    cor_media = tuple((a + b) // 2 for a, b in zip(cor_porta, cor_porta2))

    out = pintar_retangulo_suave(
        base,
        (int(w * 0.38), int(h * 0.38), int(w * 0.62), int(h * 0.66)),
        cor_media,
        blur=4,
        alpha=250,
    )

    alvo_largura = max(78, int(w * 0.11))
    escala = alvo_largura / cadeado.width
    alvo = cadeado.resize(
        (alvo_largura, max(58, int(cadeado.height * escala))),
        Image.Resampling.LANCZOS,
    )
    alvo = ImageEnhance.Brightness(alvo).enhance(0.88)
    alvo = ImageEnhance.Contrast(alvo).enhance(1.05)

    x = int(w * 0.50) - alvo.width // 2
    y = int(h * 0.49) - alvo.height // 2
    out.paste(alvo, (x, y), alvo)
    return out


def ajustar_medalhao(base: Image.Image, manter: bool) -> Image.Image:
    w, h = base.size
    out = base.convert("RGBA")
    cor_chao = amostra(base, (int(w * 0.25), int(h * 0.88), int(w * 0.45), int(h * 0.96)))
    cor_parede = amostra(base, (int(w * 0.08), int(h * 0.48), int(w * 0.14), int(h * 0.55)))

    # Apaga qualquer medalhão antigo baixo / na parede
    out = pintar_elipse(
        out, (int(w * 0.01), int(h * 0.72), int(w * 0.22), int(h * 1.05)), cor_chao, 12
    )
    out = pintar_elipse(
        out, (int(w * 0.03), int(h * 0.58), int(w * 0.20), int(h * 0.80)), cor_parede, 10
    )

    if not manter:
        return out

    # Medalhão mais alto: ~62% da altura (bem acima da borda)
    x0, y0 = int(w * 0.08), int(h * 0.61)
    x1, y1 = int(w * 0.155), int(h * 0.71)
    camada = Image.new("RGBA", out.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(camada)
    d.ellipse([x0 + 3, y0 + 5, x1 + 3, y1 + 5], fill=(10, 8, 5, 150))
    d.ellipse([x0, y0, x1, y1], fill=(176, 132, 64, 255))
    d.ellipse([x0 + 2, y0 + 2, x1 - 2, y1 - 2], outline=(95, 68, 30, 255), width=2)
    d.ellipse([x0 + 9, y0 + 9, x1 - 9, y1 - 9], outline=(220, 180, 110, 230), width=2)
    d.ellipse(
        [
            x0 + int((x1 - x0) * 0.2),
            y0 + int((y1 - y0) * 0.15),
            x0 + int((x1 - x0) * 0.5),
            y0 + int((y1 - y0) * 0.42),
        ],
        fill=(235, 205, 145, 100),
    )
    return Image.alpha_composite(out, camada)


def main():
    # Prefer regeneração crua no cursor assets; se já foi editada, ainda funciona
    base = Image.open(origem_porta).convert("RGBA")
    # Se a origem já tiver o composite ruim, regeneramos a partir dela mesmo
    # cobrindo o centro com madeira amostrada
    cadeado = preparar_cadeado(Image.open(ref_cadeado).convert("RGBA"))
    com_cadeado = colar_cadeado(base, cadeado)
    com_m = ajustar_medalhao(com_cadeado, True)
    sem_m = ajustar_medalhao(com_cadeado, False)

    com_m.convert("RGB").save(saida_tres, quality=93, optimize=True)
    com_m.convert("RGB").save(saida_frente, quality=93, optimize=True)
    sem_m.convert("RGB").save(saida_sem, quality=93, optimize=True)
    print("ok", saida_tres)
    print("ok", saida_frente)
    print("ok", saida_sem)


if __name__ == "__main__":
    main()
