import {
  alternarMudo,
  estaMudo,
  iniciarAudio,
} from "../core/audio.js";
import { obterEstado } from "../core/estado.js";

let ui = null;
let temporizadorLegenda = null;

function criarBotao(classe, texto, rotulo) {
  const botao = document.createElement("button");
  botao.type = "button";
  botao.className = classe;
  botao.textContent = texto;
  if (rotulo) {
    botao.setAttribute("aria-label", rotulo);
  }
  return botao;
}

export function garantirHud() {
  if (ui) {
    return ui;
  }

  const raiz = document.getElementById("app");

  ui = {};
  ui.hud = document.createElement("div");
  ui.hud.className = "hud";

  ui.nomeLugar = document.createElement("p");
  ui.nomeLugar.className = "hud-lugar";

  const acoes = document.createElement("div");
  acoes.className = "hud-acoes";

  ui.botaoReliquias = criarBotao("hud-botao", "Relíquias", "Abrir Relíquias");
  ui.botaoAreas = criarBotao("hud-botao hud-icone", "◎", "Mostrar áreas clicáveis");
  ui.botaoDev = criarBotao("hud-botao", "Dev", "Alternar modo desenvolvedor de hotspots");
  ui.botaoSom = criarBotao(
    "hud-botao hud-icone",
    estaMudo() ? "🔇" : "🔊",
    "Ligar ou desligar o som"
  );
  ui.botaoAreas.setAttribute("aria-pressed", "false");
  ui.botaoDev.setAttribute("aria-pressed", "false");

  ui.botaoReliquias.addEventListener("click", async () => {
    iniciarAudio();
    const { abrirPainelReliquias } = await import("./inventario.js");
    abrirPainelReliquias();
  });

  ui.botaoAreas.addEventListener("click", alternarAreas);

  ui.botaoDev.addEventListener("click", async () => {
    iniciarAudio();
    const { alternarModoDev, modoDevAtivo } = await import("./modo-dev.js");
    alternarModoDev();
    ui.botaoDev.setAttribute("aria-pressed", modoDevAtivo() ? "true" : "false");
  });

  ui.botaoSom.addEventListener("click", () => {
    iniciarAudio();
    const agoraMudo = alternarMudo();
    ui.botaoSom.textContent = agoraMudo ? "🔇" : "🔊";
  });

  acoes.append(ui.botaoReliquias, ui.botaoAreas, ui.botaoDev, ui.botaoSom);

  window.addEventListener("oum:modo-dev", async (evento) => {
    if (!ui?.botaoDev) {
      return;
    }
    const ativo = Boolean(evento.detail?.ativo);
    ui.botaoDev.setAttribute("aria-pressed", ativo ? "true" : "false");
  });
  ui.hud.append(ui.nomeLugar, acoes);

  ui.legenda = document.createElement("p");
  ui.legenda.className = "legenda";
  ui.legenda.setAttribute("aria-live", "polite");

  ui.toasts = document.createElement("div");
  ui.toasts.className = "toasts";
  ui.toasts.setAttribute("aria-live", "polite");

  ui.veu = document.createElement("div");
  ui.veu.className = "veu";
  ui.veu.setAttribute("aria-hidden", "true");

  raiz.append(ui.hud, ui.legenda, ui.toasts, ui.veu);

  document.addEventListener("keydown", async (evento) => {
    if (evento.key === "Escape") {
      const { fecharPainelReliquias } = await import("./inventario.js");
      fecharPainelReliquias();
    }
    if (
      (evento.key === "h" || evento.key === "H") &&
      !evento.target.closest("input, textarea, [contenteditable]")
    ) {
      alternarAreas();
    }
  });

  atualizarContagemReliquias();
  window.addEventListener("oum:inventario", atualizarContagemReliquias);
  window.addEventListener("oum:abrir-reliquias", limparPulsoReliquias);

  document.body.classList.add("sem-hud");
  return ui;
}

export function mostrarHud(visivel) {
  garantirHud();
  document.body.classList.toggle("sem-hud", !visivel);
}

export function definirLugar(nome) {
  garantirHud();
  ui.nomeLugar.textContent = nome || "";
}

export function ocultarLegenda() {
  garantirHud();
  window.clearTimeout(temporizadorLegenda);
  temporizadorLegenda = null;
  ui.legenda.classList.remove("visivel");
  ui.legenda.textContent = "";
}

export function mostrarLegenda(texto, duracao = 5200) {
  garantirHud();
  window.clearTimeout(temporizadorLegenda);
  if (!texto) {
    ocultarLegenda();
    return;
  }
  ui.legenda.textContent = texto;
  ui.legenda.classList.add("visivel");
  temporizadorLegenda = window.setTimeout(() => {
    ui.legenda.classList.remove("visivel");
  }, duracao);
}

export function toast(kicker, titulo) {
  garantirHud();
  const caixa = document.createElement("div");
  caixa.className = "toast";
  const k = document.createElement("p");
  k.className = "toast-kicker";
  k.textContent = kicker;
  caixa.append(k);
  if (titulo) {
    const t = document.createElement("p");
    t.className = "toast-titulo";
    t.textContent = titulo;
    caixa.append(t);
  }
  ui.toasts.append(caixa);
  window.requestAnimationFrame(() => caixa.classList.add("visivel"));
  window.setTimeout(() => {
    caixa.classList.remove("visivel");
    window.setTimeout(() => caixa.remove(), 700);
  }, 3600);
}

export function pulsarReliquias() {
  garantirHud();
  ui.botaoReliquias.classList.add("pulso");
}

export function limparPulsoReliquias() {
  if (!ui) {
    return;
  }
  ui.botaoReliquias.classList.remove("pulso");
}

function atualizarContagemReliquias() {
  if (!ui) {
    return;
  }
  const n = obterEstado().inventario.length;
  ui.botaoReliquias.textContent = n > 0 ? `Relíquias (${n})` : "Relíquias";
}

function alternarAreas() {
  garantirHud();
  const ativo = document.body.classList.toggle("mostrar-areas");
  ui.botaoAreas.setAttribute("aria-pressed", ativo ? "true" : "false");
}

export function aguardar(ms) {
  return new Promise((resolver) => {
    window.setTimeout(resolver, ms);
  });
}

export async function velarTela(ms = 360) {
  garantirHud();
  ui.veu.style.transitionDuration = `${ms}ms`;
  ui.veu.classList.add("ativo");
  await aguardar(ms);
}

export async function desvelarTela(ms = 480) {
  garantirHud();
  ui.veu.style.transitionDuration = `${ms}ms`;
  ui.veu.classList.remove("ativo");
  await aguardar(ms);
}
