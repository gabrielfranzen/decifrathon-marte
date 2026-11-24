import { iniciarAudio, tocar } from "../core/audio.js";
import { mostrarLegenda, ocultarLegenda } from "./hud.js";

const PROPORCAO = 16 / 9;

function movimentoReduzido() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function criarCenaFotografica({
  id,
  ariaLabel,
  srcImagem,
  altImagem,
  idPendente,
  filhos = [],
}) {
  const cena = document.createElement("section");
  cena.className = `cena cena-foto ${id}`;
  cena.setAttribute("aria-label", ariaLabel);

  const palco = document.createElement("div");
  palco.className = "palco";

  const mundo = document.createElement("div");
  mundo.className = "mundo";

  const parallax = document.createElement("div");
  parallax.className = "mundo-parallax";

  const camadaBase = document.createElement("div");
  camadaBase.className = "camada-imagem camada-base visivel";

  const imagem = document.createElement("img");
  imagem.className = "cena-foto__imagem";
  imagem.src = srcImagem;
  imagem.alt = altImagem;
  imagem.draggable = false;

  const placeholder = document.createElement("div");
  placeholder.className = "cena-foto__placeholder";
  placeholder.hidden = true;
  placeholder.innerHTML = `
    <p class="cena-foto__placeholder-titulo">Imagem pendente</p>
    <p class="cena-foto__placeholder-id">${idPendente}</p>
    <p class="cena-foto__placeholder-nota">Placeholder técnico — aguardando fotografia aprovada.</p>
  `;

  function mostrarPlaceholder() {
    imagem.hidden = true;
    placeholder.hidden = false;
    camadaBase.classList.add("faltando");
  }

  function mostrarImagem() {
    imagem.hidden = false;
    placeholder.hidden = true;
    camadaBase.classList.remove("faltando");
  }

  imagem.addEventListener("error", mostrarPlaceholder);
  imagem.addEventListener("load", () => {
    if (imagem.naturalWidth > 0) {
      mostrarImagem();
      return;
    }
    mostrarPlaceholder();
  });

  if (imagem.complete && imagem.naturalWidth > 0) {
    mostrarImagem();
  }

  const efeitos = document.createElement("div");
  efeitos.className = "camada-efeitos";

  const camadaHotspots = document.createElement("div");
  camadaHotspots.className = "camada-hotspots";

  const rotulo = document.createElement("div");
  rotulo.className = "rotulo-hotspot";
  rotulo.setAttribute("aria-hidden", "true");

  camadaBase.append(imagem, placeholder);
  parallax.append(camadaBase, efeitos, camadaHotspots);
  mundo.append(parallax);
  palco.append(mundo, rotulo);
  cena.append(palco, ...filhos);

  function calcularCobertura() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let w;
    let h;
    if (vw / vh > PROPORCAO) {
      w = vw;
      h = vw / PROPORCAO;
    } else {
      h = vh;
      w = vh * PROPORCAO;
    }
    mundo.style.width = `${w}px`;
    mundo.style.height = `${h}px`;
    mundo.style.top = `${(vh - h) / 2}px`;
    mundo.style.left = `${(vw - w) / 2}px`;
  }

  calcularCobertura();
  window.addEventListener("resize", calcularCobertura);

  palco.addEventListener("pointermove", (evento) => {
    if (!movimentoReduzido()) {
      const dx = evento.clientX / window.innerWidth - 0.5;
      const dy = evento.clientY / window.innerHeight - 0.5;
      parallax.style.setProperty("--px", `${(-dx * 1.2).toFixed(3)}%`);
      parallax.style.setProperty("--py", `${(-dy * 0.9).toFixed(3)}%`);
    }
    const caixa = palco.getBoundingClientRect();
    rotulo.style.left = `${evento.clientX - caixa.left}px`;
    rotulo.style.top = `${evento.clientY - caixa.top}px`;
  });

  cena._destruirFoto = () => {
    window.removeEventListener("resize", calcularCobertura);
  };

  return {
    cena,
    palco,
    mundo,
    parallax,
    imagem,
    camadaHotspots,
    placeholder,
    rotulo,
  };
}

export function criarHotspot({
  id,
  rotulo: textoRotulo,
  estilo,
  aoAtivar,
  classeExtra = "",
  tipo = "examinar",
}) {
  const botao = document.createElement("button");
  botao.type = "button";
  botao.className = `hotspot hotspot-${tipo} ${classeExtra}`.trim();
  botao.dataset.hotspot = id;
  botao.setAttribute("aria-label", textoRotulo);

  Object.assign(botao.style, estilo);

  if (tipo === "passagem") {
    const seta = document.createElement("span");
    seta.className = "seta-saida";
    // Mesmo estilo dos outros; voltar aponta para trás
    seta.textContent = id === "voltar" ? "⬇" : "⬆";
    botao.append(seta);
  }

  botao.addEventListener("pointerenter", () => {
    const cena = botao.closest(".cena-foto");
    const rotulo = cena?.querySelector(".rotulo-hotspot");
    if (!rotulo) {
      return;
    }
    rotulo.textContent = textoRotulo;
    rotulo.classList.add("visivel");
  });

  botao.addEventListener("pointerleave", () => {
    const cena = botao.closest(".cena-foto");
    const rotulo = cena?.querySelector(".rotulo-hotspot");
    rotulo?.classList.remove("visivel");
  });

  botao.addEventListener("click", (evento) => {
    evento.stopPropagation();
    iniciarAudio();
    const cena = botao.closest(".cena-foto");
    cena?.querySelector(".rotulo-hotspot")?.classList.remove("visivel");
    aoAtivar();
  });

  return botao;
}

export function criarBotaoVoltar(nomeDestino, aoVoltar) {
  const botao = document.createElement("button");
  botao.type = "button";
  botao.className = "botao-voltar";
  botao.textContent = `⟵ Voltar · ${nomeDestino}`;
  botao.setAttribute("aria-label", `Voltar para ${nomeDestino}`);
  botao.addEventListener("click", () => {
    iniciarAudio();
    tocar("passo");
    if (aoVoltar) {
      aoVoltar();
    }
  });
  return botao;
}

export function criarBarraInferior(conteudos) {
  const barra = document.createElement("div");
  barra.className = "barra-inferior";
  for (const item of conteudos) {
    if (item) {
      barra.append(item);
    }
  }
  return barra;
}

export function criarMensagemFlutuante(texto) {
  const aviso = document.createElement("p");
  aviso.className = "mensagem-flutuante";
  aviso.textContent = texto;
  aviso.setAttribute("role", "status");
  return aviso;
}

export function limparMensagensTemporarias(container) {
  if (container) {
    for (const aviso of container.querySelectorAll(".mensagem-flutuante")) {
      aviso.remove();
    }
  }
  document
    .querySelectorAll(".cena-fotografica .mensagem-flutuante")
    .forEach((aviso) => aviso.remove());
  ocultarLegenda();
}

export function exibirMensagemTemporaria(container, texto, ms = 3200) {
  // Um único canal visual: a legenda do HUD (evita caixa duplicada)
  limparMensagensTemporarias(container);

  const aviso = criarMensagemFlutuante(texto);
  aviso.hidden = true;
  container.append(aviso);
  mostrarLegenda(texto, ms);

  window.setTimeout(() => {
    aviso.remove();
  }, ms);
}
