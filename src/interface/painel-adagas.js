import { tocar } from "../core/audio.js";
import {
  concluirE03,
  definirAlavancasE03,
  obterEstado,
} from "../core/estado.js";
import { obterImagemAdaga } from "../dados/imagens.js";
import {
  ESTADO_CERTO,
  TOTAL_ADAGAS,
  normalizarAdagas,
  validarAdagas,
} from "../enigmas/e03.js";
import { criarHotspot } from "./fotografia.js";

function criarBotaoAdaga(indice, ligadaInicial, bloqueada) {
  const botao = document.createElement("button");
  botao.type = "button";
  botao.className = "ad-adaga";
  botao.dataset.indice = String(indice);
  botao.setAttribute(
    "aria-label",
    `Adaga D${indice + 1}${ligadaInicial ? ", ligada (cima)" : ", desligada (baixo)"}`
  );
  if (bloqueada) {
    botao.disabled = true;
  }

  const rotulo = document.createElement("span");
  rotulo.className = "ad-adaga__rotulo";
  rotulo.textContent = `D${indice + 1}`;

  const figura = document.createElement("img");
  figura.className = "ad-adaga__figura";
  figura.alt = "";
  figura.draggable = false;
  figura.setAttribute("aria-hidden", "true");

  botao.append(rotulo, figura);

  botao.definir = (ligada) => {
    botao.classList.toggle("ligada", ligada);
    botao.setAttribute("aria-pressed", ligada ? "true" : "false");
    botao.setAttribute(
      "aria-label",
      `Adaga D${indice + 1}${ligada ? ", ligada (cima)" : ", desligada (baixo)"}`
    );
    figura.src = obterImagemAdaga(ligada);
  };

  botao.definir(ligadaInicial);
  return botao;
}

// Close-up: só as 8 adagas. Acerto fecha o modal e abre a porta.
export function abrirPainelAdagas({ container, aoFechar, aoAcerto } = {}) {
  const existente = document.querySelector(".ad-root");
  if (existente) {
    existente.remove();
  }
  const legado = document.querySelector(".al-root");
  if (legado) {
    legado.remove();
  }

  const estado = obterEstado();
  let resolvido = Boolean(estado.e03Resolvido || estado.portaPedraAberta);
  let adagas = normalizarAdagas(estado.alavancasE03);
  if (resolvido) {
    adagas = [...ESTADO_CERTO];
  }

  const raiz = document.createElement("div");
  raiz.className = "ad-root";
  raiz.setAttribute("role", "dialog");
  raiz.setAttribute("aria-modal", "true");
  raiz.setAttribute("aria-label", "As oito adagas");

  const cena = document.createElement("div");
  cena.className = "ad-scene";

  const painel = document.createElement("div");
  painel.className = "ad-painel";

  const workspace = document.createElement("section");
  workspace.className = "ad-workspace";
  workspace.setAttribute("aria-label", "Adagas");

  const grade = document.createElement("div");
  grade.className = "ad-grade";

  function fechar() {
    document.removeEventListener("keydown", aoTeclar);
    raiz.remove();
    if (aoFechar) {
      aoFechar();
    }
  }

  function aoTeclar(evento) {
    if (evento.key === "Escape") {
      fechar();
    }
  }

  function tentarConcluir() {
    if (resolvido) {
      return;
    }
    const resultado = validarAdagas(adagas);
    if (!resultado.ok) {
      return;
    }
    resolvido = true;
    tocar("acerto");
    concluirE03();
    grade.querySelectorAll(".ad-adaga").forEach((botao) => {
      botao.disabled = true;
    });
    window.setTimeout(() => {
      fechar();
      if (aoAcerto) {
        aoAcerto();
      }
    }, 420);
  }

  for (let i = 0; i < TOTAL_ADAGAS; i += 1) {
    const botao = criarBotaoAdaga(i, adagas[i], resolvido);
    botao.addEventListener("click", () => {
      if (resolvido || botao.disabled) {
        return;
      }
      const nova = !botao.classList.contains("ligada");
      botao.definir(nova);
      adagas[i] = nova;
      definirAlavancasE03(adagas);
      tocar(nova ? "giro" : "papel");
      tentarConcluir();
    });
    grade.append(botao);
  }

  workspace.append(grade);
  painel.append(workspace);
  cena.append(painel);
  raiz.append(cena);

  document.addEventListener("keydown", aoTeclar);

  raiz.append(
    criarHotspot({
      id: "voltar",
      rotulo: "Afastar-se das adagas",
      tipo: "passagem",
      classeExtra: "hotspot-saida-fixa ad-voltar",
      estilo: {
        left: "36%",
        top: "90%",
        width: "28%",
        height: "8%",
        zIndex: "20",
      },
      aoAtivar: () => {
        tocar("passo");
        fechar();
      },
    })
  );

  const alvo = container || document.getElementById("app");
  alvo?.append(raiz);

  return { fechar, raiz };
}

export function tentarAbrirPortaPedra({ aoSucesso, aoFalhar } = {}) {
  const estado = obterEstado();
  if (estado.e03Resolvido || estado.portaPedraAberta) {
    return { ok: true, jaAberta: true };
  }

  const resultado = validarAdagas(estado.alavancasE03);
  if (!resultado.ok) {
    tocar("erro");
    if (aoFalhar) {
      aoFalhar();
    }
    return { ok: false, jaAberta: false };
  }

  tocar("acerto");
  concluirE03();
  if (aoSucesso) {
    aoSucesso();
  }
  return { ok: true, jaAberta: false };
}

export const abrirPainelTochas = abrirPainelAdagas;
export const abrirPainelAlavancas = abrirPainelAdagas;
