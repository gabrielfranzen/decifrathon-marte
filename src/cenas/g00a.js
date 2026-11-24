import { iniciarAudio, tocar, tocarAmbiente } from "../core/audio.js";
import {
  carregarAmbiente,
  estiloDeHotspot,
} from "../dados/ambientes.js";
import { obterImagemG00A } from "../dados/imagens.js";
import { definirSalaAtual, obterEstado } from "../core/estado.js";
import {
  criarCenaFotografica,
  criarHotspot,
} from "../interface/fotografia.js";
import {
  definirLugar,
  garantirHud,
  mostrarHud,
} from "../interface/hud.js";

export async function criarG00A({ aoAproximar, abrirOlhos = false } = {}) {
  definirSalaAtual("G00A");
  garantirHud();
  mostrarHud(true);
  definirLugar("Floresta · Castelo");
  iniciarAudio();
  tocarAmbiente("exterior");

  const ambiente = await carregarAmbiente("G00A");
  const estado = obterEstado();

  const { cena, camadaHotspots } = criarCenaFotografica({
    id: "g00a",
    ariaLabel: "G00A — Castelo visto da floresta",
    srcImagem: obterImagemG00A(estado),
    altImagem: estado.portaPrincipalAberta
      ? "Castelo monumental à noite com o portão principal aberto"
      : "Castelo monumental à noite, visto de um caminho na floresta",
    idPendente: "G00A",
  });

  // Só passagem de ida: G00A → G00. Sem botão/hotspot de voltar.
  const hotspot = criarHotspot({
    id: "aproximar-portao",
    rotulo: estado.portaPrincipalAberta
      ? "Aproximar-se da entrada"
      : "Aproximar-se do portão",
    tipo: "passagem",
    estilo: estiloDeHotspot(ambiente, "aproximar-portao", {
      left: 38,
      top: 22,
      width: 24,
      height: 58,
      zIndex: 3,
    }),
    aoAtivar: () => {
      tocar("passo");
      if (aoAproximar) {
        aoAproximar();
      }
    },
  });

  camadaHotspots.append(hotspot);

  if (abrirOlhos) {
    // Overlay fechado; app dispara a abertura após tirar a tela preta da morte
    prepararOlhosFechados();
  }

  window.dispatchEvent(new CustomEvent("oum:cena", { detail: { id: "G00A" } }));
  return cena;
}

function prepararOlhosFechados() {
  document.querySelectorAll(".olhos-abrindo").forEach((el) => el.remove());

  const overlay = document.createElement("div");
  overlay.className = "olhos-abrindo";
  overlay.setAttribute("aria-hidden", "true");
  overlay.dataset.olhos = "fechados";

  const cima = document.createElement("div");
  cima.className = "olhos-abrindo__tampa olhos-abrindo__tampa--cima";
  const baixo = document.createElement("div");
  baixo.className = "olhos-abrindo__tampa olhos-abrindo__tampa--baixo";
  overlay.append(cima, baixo);
  document.getElementById("app")?.append(overlay);
}

export function iniciarEfeitoAbrirOlhos() {
  let overlay = document.querySelector('.olhos-abrindo[data-olhos="fechados"]');
  if (!overlay) {
    prepararOlhosFechados();
    overlay = document.querySelector(".olhos-abrindo");
  }
  if (!overlay) {
    return;
  }

  overlay.dataset.olhos = "abrindo";
  void overlay.offsetWidth;
  window.requestAnimationFrame(() => {
    overlay.classList.add("olhos-abrindo--aberto");
  });

  window.setTimeout(() => {
    overlay.remove();
  }, 2400);
}
