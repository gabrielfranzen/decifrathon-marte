import { tocar } from "../core/audio.js";
import {
  definirCasasCartas,
  obterEstado,
} from "../core/estado.js";
import {
  FECHO_PISTAS,
  PISTAS,
  cartaPorId,
  extrairLuto,
  idsForaDasCasas,
  validarCasas,
} from "../enigmas/e01.js";
import { limparMensagensTemporarias } from "./fotografia.js";

// Ordem fixa do baralho: cartas corretas intercaladas com iscas
// (não deixar as 4 da resposta nas primeiras posições)
const ORDEM_MAO_PADRAO = Object.freeze([
  "copas-cinzas",
  "espadas-sal",
  "espadas",
  "paus-eco",
  "ouros-vazio",
  "copas",
  "espadas-sombra",
  "ouros",
  "copas-prece",
  "paus",
]);

function maoNaOrdemPadrao(ids) {
  const conjunto = new Set(ids);
  return ORDEM_MAO_PADRAO.filter((id) => conjunto.has(id));
}

export function montarMesaCartas(camadaHotspots) {
  const estado = obterEstado();
  const gavetaAberta = Boolean(estado.gavetaCartasAberta || estado.e01Resolvido);
  let casas = [...(estado.casasCartas || [null, null, null, null])];
  let mao = maoNaOrdemPadrao(idsForaDasCasas(casas));
  let selecionada = null;
  let resolvidoVisual = validarCasas(casas) && Boolean(extrairLuto(casas));

  const raiz = document.createElement("div");
  raiz.className = "mc-root";
  raiz.id = "mesa-cartas-e01";
  raiz.setAttribute("aria-label", "Mesa das cartas");

  const cena = document.createElement("div");
  cena.className = "mc-scene";

  const mesa = document.createElement("div");
  mesa.className = "mc-table";

  const layout = document.createElement("div");
  layout.className = "mc-layout";

  const workspace = document.createElement("section");
  workspace.className = "mc-workspace";
  workspace.setAttribute("aria-label", "Mesa das cartas");

  const slotsEl = document.createElement("div");
  slotsEl.className = "mc-slot-grid";
  slotsEl.setAttribute("aria-label", "Quatro posições das cartas");

  const maoEl = document.createElement("div");
  maoEl.className = "mc-hand-grid";
  maoEl.dataset.mao = "1";
  maoEl.setAttribute("aria-label", "Dez cartas disponíveis");

  const divisor = document.createElement("div");
  divisor.className = "mc-divider";

  const acoes = document.createElement("div");
  acoes.className = "mc-actions";

  const botaoRecolher = document.createElement("button");
  botaoRecolher.type = "button";
  botaoRecolher.className = "mc-button";
  botaoRecolher.textContent = "Recolher";

  const botaoValidar = document.createElement("button");
  botaoValidar.type = "button";
  botaoValidar.className = "mc-button mc-button-primary";
  botaoValidar.textContent = "Validar";
  botaoValidar.disabled = resolvidoVisual;

  acoes.append(botaoRecolher, botaoValidar);

  const avisoGaveta = document.createElement("p");
  avisoGaveta.className = "mc-gaveta-aviso";
  avisoGaveta.hidden = !gavetaAberta;
  avisoGaveta.textContent =
    "A gaveta cedeu. O papel da rotina está nas Relíquias.";

  workspace.append(
    slotsEl,
    maoEl,
    divisor,
    acoes,
    avisoGaveta
  );

  const papelWrap = document.createElement("aside");
  papelWrap.className = "mc-paper-wrap";

  const papel = document.createElement("div");
  papel.className = "mc-paper";
  papel.setAttribute("aria-label", "Pergaminho com as pistas");

  const papelTitulo = document.createElement("h2");
  papelTitulo.textContent = "AS QUATRO CARTAS";

  const lista = document.createElement("ol");
  for (const pista of PISTAS) {
    const item = document.createElement("li");
    item.textContent = pista;
    lista.append(item);
  }

  const papelRodape = document.createElement("div");
  papelRodape.className = "mc-paper-foot";
  papelRodape.innerHTML = "<span>❧</span>";

  const papelFecho = document.createElement("p");
  papelFecho.className = "mc-paper-fecho";
  papelFecho.textContent = FECHO_PISTAS;

  papel.append(papelTitulo, lista, papelRodape, papelFecho);
  papelWrap.append(papel);

  layout.append(workspace, papelWrap);
  mesa.append(layout);
  cena.append(mesa);
  raiz.append(cena);
  camadaHotspots.append(raiz);

  function persistirCasas() {
    definirCasasCartas(casas);
  }

  function localizar(id) {
    if (mao.includes(id)) {
      return { origem: "mao" };
    }
    const indice = casas.findIndex((c) => c === id);
    if (indice >= 0) {
      return { origem: indice };
    }
    return null;
  }

  function limparResolucaoVisual() {
    if (!resolvidoVisual) {
      return;
    }
    resolvidoVisual = false;
    botaoValidar.disabled = false;
  }

  function colocar(id, indice) {
    if (resolvidoVisual) {
      return;
    }
    const achado = localizar(id);
    if (!achado || indice < 0 || indice > 3) {
      return;
    }
    const ocupante = casas[indice];
    if (achado.origem === "mao") {
      mao = mao.filter((c) => c !== id);
      if (ocupante && ocupante !== id) {
        mao = maoNaOrdemPadrao([...mao, ocupante]);
      }
    } else if (achado.origem !== indice) {
      casas[achado.origem] =
        ocupante && ocupante !== id ? ocupante : null;
    }
    casas[indice] = id;
    selecionada = null;
    tocar("papel");
    persistirCasas();
    desenhar();
  }

  function recolherUma(id) {
    if (resolvidoVisual) {
      return;
    }
    const indice = casas.findIndex((c) => c === id);
    if (indice < 0) {
      return;
    }
    mao = maoNaOrdemPadrao([...mao, casas[indice]]);
    casas[indice] = null;
    selecionada = null;
    tocar("papel");
    persistirCasas();
    desenhar();
  }

  function limparAlvosSoltura() {
    document
      .querySelectorAll(".mc-slot.is-drop-target")
      .forEach((slot) => slot.classList.remove("is-drop-target"));
    maoEl.classList.remove("is-drop-target");
  }

  function prepararArrasto(cartaEl, id) {
    let arrastando = false;
    let origemX = 0;
    let origemY = 0;
    let fantasma = null;

    cartaEl.addEventListener("pointerdown", (evento) => {
      if (resolvidoVisual || evento.button !== 0) {
        return;
      }
      arrastando = false;
      origemX = evento.clientX;
      origemY = evento.clientY;
      cartaEl.setPointerCapture(evento.pointerId);
    });

    cartaEl.addEventListener("pointermove", (evento) => {
      if (!cartaEl.hasPointerCapture(evento.pointerId)) {
        return;
      }
      const distancia = Math.hypot(
        evento.clientX - origemX,
        evento.clientY - origemY
      );
      if (!arrastando && distancia < 8) {
        return;
      }
      if (!arrastando) {
        arrastando = true;
        const caixa = cartaEl.getBoundingClientRect();
        fantasma = cartaEl.cloneNode(true);
        fantasma.classList.add("mc-drag-ghost");
        fantasma.style.width = `${caixa.width}px`;
        fantasma.style.height = `${caixa.height}px`;
        document.body.append(fantasma);
        cartaEl.classList.add("is-dragging");
      }
      fantasma.style.left = `${evento.clientX - fantasma.offsetWidth / 2}px`;
      fantasma.style.top = `${evento.clientY - 35}px`;
      limparAlvosSoltura();
      const sobPonteiro = document.elementFromPoint(
        evento.clientX,
        evento.clientY
      );
      const alvoSlot = sobPonteiro?.closest(".mc-slot");
      if (alvoSlot) {
        alvoSlot.classList.add("is-drop-target");
        return;
      }
      // Carta que está num slot pode voltar ao baralho
      if (
        casas.includes(id) &&
        sobPonteiro?.closest(".mc-hand-grid")
      ) {
        maoEl.classList.add("is-drop-target");
      }
    });

    function finalizar(evento) {
      if (!cartaEl.hasPointerCapture(evento.pointerId) && !arrastando) {
        return;
      }
      if (cartaEl.hasPointerCapture(evento.pointerId)) {
        cartaEl.releasePointerCapture(evento.pointerId);
      }
      const estavaArrastando = arrastando;
      if (arrastando) {
        cartaEl.classList.remove("is-dragging");
        fantasma?.remove();
        fantasma = null;
        const sobPonteiro = document.elementFromPoint(
          evento.clientX,
          evento.clientY
        );
        limparAlvosSoltura();
        const alvoSlot = sobPonteiro?.closest(".mc-slot");
        if (alvoSlot) {
          colocar(id, Number(alvoSlot.dataset.slot));
        } else if (
          casas.includes(id) &&
          sobPonteiro?.closest(".mc-hand-grid")
        ) {
          recolherUma(id);
        }
      }
      arrastando = false;
      if (estavaArrastando) {
        const engolir = (clique) => {
          clique.stopImmediatePropagation();
          cartaEl.removeEventListener("click", engolir, true);
        };
        cartaEl.addEventListener("click", engolir, true);
      }
    }

    cartaEl.addEventListener("pointerup", finalizar);
    cartaEl.addEventListener("pointercancel", () => {
      arrastando = false;
      fantasma?.remove();
      fantasma = null;
      cartaEl.classList.remove("is-dragging");
      limparAlvosSoltura();
    });
  }

  function criarCarta(id) {
    const carta = cartaPorId(id);
    if (!carta) {
      return document.createElement("span");
    }

    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = `mc-card ${
      carta.naipe === "copas" || carta.naipe === "ouros" ? "is-red" : "is-black"
    }`;
    if (selecionada === id) {
      botao.classList.add("is-selected");
    }
    botao.dataset.card = id;
    botao.setAttribute(
      "aria-label",
      `${carta.numero} de ${carta.naipe}: ${carta.palavra}`
    );

    const canto = document.createElement("span");
    canto.className = "mc-card-corner";
    const numeroEl = document.createElement("span");
    numeroEl.textContent = String(carta.numero);
    const naipePeq = document.createElement("span");
    naipePeq.className = "mc-suit-small";
    naipePeq.textContent = carta.simbolo;
    canto.append(numeroEl, naipePeq);

    const naipeGrande = document.createElement("span");
    naipeGrande.className = "mc-card-suit";
    naipeGrande.textContent = carta.simbolo;
    naipeGrande.setAttribute("aria-hidden", "true");

    const palavra = document.createElement("span");
    palavra.className = "mc-card-word";
    if (carta.palavra.length > 6) {
      palavra.classList.add("is-long");
    }
    palavra.textContent = carta.palavra;

    botao.append(canto, naipeGrande, palavra);
    prepararArrasto(botao, id);

    botao.addEventListener("click", (evento) => {
      evento.stopPropagation();
      if (resolvidoVisual) {
        return;
      }
      selecionada = selecionada === id ? null : id;
      desenhar();
    });

    return botao;
  }

  function criarSlot(indice) {
    const id = casas[indice];
    const slot = document.createElement("div");
    slot.className = "mc-slot";
    slot.dataset.slot = String(indice);
    slot.setAttribute("role", "button");
    slot.tabIndex = 0;
    slot.setAttribute(
      "aria-label",
      id
        ? `Posição ${indice + 1}: ${cartaPorId(id)?.palavra || id}`
        : `Posição ${indice + 1}, vazia`
    );

    if (id) {
      const carta = criarCarta(id);
      carta.tabIndex = -1;
      slot.append(carta);
    } else {
      const vazio = document.createElement("span");
      vazio.className = "mc-slot-empty";
      vazio.textContent = "COLOCAR CARTA";
      slot.append(vazio);
    }

    function tentarColocar() {
      if (resolvidoVisual) {
        return;
      }
      if (selecionada) {
        colocar(selecionada, indice);
        return;
      }
      if (casas[indice]) {
        recolherUma(casas[indice]);
      }
    }

    slot.addEventListener("click", (evento) => {
      if (evento.target.closest(".mc-card")) {
        return;
      }
      tentarColocar();
    });

    slot.addEventListener("keydown", (evento) => {
      if (evento.target !== slot) {
        return;
      }
      if (evento.key !== "Enter" && evento.key !== " ") {
        return;
      }
      evento.preventDefault();
      tentarColocar();
    });

    return slot;
  }

  function desenhar() {
    slotsEl.replaceChildren();
    for (let i = 0; i < 4; i += 1) {
      slotsEl.append(criarSlot(i));
    }

    maoEl.replaceChildren();
    for (const id of mao) {
      maoEl.append(criarCarta(id));
    }

    botaoValidar.disabled = resolvidoVisual;
    slotsEl.classList.toggle("mc-slot-grid--acertadas", resolvidoVisual);
  }

  botaoRecolher.addEventListener("click", () => {
    casas = [null, null, null, null];
    mao = [...ORDEM_MAO_PADRAO];
    selecionada = null;
    limparResolucaoVisual();
    tocar("papel");
    persistirCasas();
    desenhar();
  });

  function tremerCartas() {
    slotsEl.classList.remove("is-tremendo");
    // Força o reflow para reiniciar a animação se validar de novo em seguida
    void slotsEl.offsetWidth;
    slotsEl.classList.add("is-tremendo");
    window.setTimeout(() => {
      slotsEl.classList.remove("is-tremendo");
    }, 450);
  }

  botaoValidar.addEventListener("click", () => {
    if (resolvidoVisual) {
      return;
    }
    if (casas.some((id) => id === null)) {
      tremerCartas();
      return;
    }
    if (validarCasas(casas) && extrairLuto(casas) === "LUTO") {
      resolvidoVisual = true;
      tocar("papel");
      desenhar();
      return;
    }
    tremerCartas();
  });

  function marcarGavetaAberta() {
    avisoGaveta.hidden = false;
    avisoGaveta.textContent =
      "A gaveta cedeu. O papel da rotina está nas Relíquias.";
    limparMensagensTemporarias();
  }

  desenhar();

  return { raiz, marcarGavetaAberta };
}
