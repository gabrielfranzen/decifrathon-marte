import { criarTelaInicial } from "./cenas/tela-inicial.js";
import { criarIntroducao } from "./cenas/introducao.js";
import { criarG00A, iniciarEfeitoAbrirOlhos } from "./cenas/g00a.js";
import { criarG00 } from "./cenas/g00.js";
import { criarC01 } from "./cenas/c01.js";
import {
  criarC01B,
  criarCenaLutaEspada,
  criarCenaMorteEspadada,
  trocarFrameCutscene,
} from "./cenas/c01b.js";
import { criarC02 } from "./cenas/c02.js";
import { criarC02M } from "./cenas/c02m.js";
import { criarC03 } from "./cenas/c03.js";
import { criarC03G } from "./cenas/c03g.js";
import { iniciarAudio, tocar, tocarArquivo } from "./core/audio.js";
import {
  carregarEstado,
  definirSalaAtual,
  obterEstado,
  registrarLutaCorredorConcluida,
  reiniciarEstado,
  temItem,
} from "./core/estado.js";
import { obterFramesLutaC01B } from "./dados/imagens.js";
import {
  desvelarTela,
  garantirHud,
  mostrarHud,
  velarTela,
} from "./interface/hud.js";
import { instalarAtalhosModoDev } from "./interface/modo-dev.js";

const DURACAO_FADE_MS = 500;
const DURACAO_ESPADADA_MS = 1400;
const DURACAO_FLASH_MS = 650;
// Primeiro segundo do Blades = desembainhar (frame 01); resto = combate (frame 02)
const DURACAO_LUTA_DESEMBAINHAR_MS = 1000;

const app = document.getElementById("app");
let cenaAtual = null;
let trocandoCena = false;
let cenaPendente = null;

function aguardar(ms) {
  return new Promise((resolver) => {
    window.setTimeout(resolver, ms);
  });
}

async function mostrarCena(criarElemento, { comVeil = false } = {}) {
  if (trocandoCena) {
    cenaPendente = () => mostrarCena(criarElemento, { comVeil });
    return;
  }

  trocandoCena = true;
  cenaPendente = null;

  if (comVeil && cenaAtual) {
    await velarTela(360);
  }

  const proximaCena = await Promise.resolve(criarElemento());

  if (cenaAtual) {
    if (typeof cenaAtual._destruirFoto === "function") {
      cenaAtual._destruirFoto();
    }
    cenaAtual.classList.remove("cena--visivel");
    cenaAtual.classList.add("cena--saindo");
    await aguardar(comVeil ? 80 : DURACAO_FADE_MS);
    cenaAtual.remove();
  }

  app.append(proximaCena);
  void proximaCena.offsetWidth;
  proximaCena.classList.add("cena--visivel");
  cenaAtual = proximaCena;

  if (comVeil) {
    await desvelarTela(480);
  } else {
    await aguardar(DURACAO_FADE_MS);
  }

  trocandoCena = false;

  if (cenaPendente) {
    const seguinte = cenaPendente;
    cenaPendente = null;
    seguinte();
  }
}

function irParaIntroducao() {
  garantirHud();
  mostrarHud(false);
  definirSalaAtual("introducao");
  mostrarCena(() =>
    criarIntroducao({
      aoConcluir: irParaG00A,
    })
  );
}

// Etapa 1: introdução → vista distante (G00A) → portão (G00, sem volta)
function irParaG00A({ abrirOlhos = false } = {}) {
  if (!abrirOlhos) {
    tocar("passo");
  }
  mostrarCena(
    () =>
      criarG00A({
        aoAproximar: irParaG00,
        abrirOlhos,
      }),
    { comVeil: !abrirOlhos }
  );
}

function irParaG00() {
  tocar("passo");
  // G00 não oferece retorno a G00A; a aproximação é definitiva
  mostrarCena(
    () =>
      criarG00({
        aoEntrar: irParaC01,
      }),
    { comVeil: true }
  );
}

function irParaC01() {
  tocar("passo");
  mostrarCena(
    () =>
      criarC01({
        aoVoltar: irParaG00,
        aoIrEsquerda: irParaC02,
        aoIrDireita: irParaC03,
        aoSubirEscada: irParaC01B,
      }),
    { comVeil: true }
  );
}

function irParaCorredorC01B() {
  void mostrarCena(
    () =>
      criarC01B({
        aoVoltar: irParaC01,
        // aoAvancar: próximo trecho do corredor ainda não existe
      }),
    { comVeil: true }
  );
}

function irParaC01B() {
  tocar("passo");
  // Sem espada: cutscene de morte. Com espada: luta → fuga → corredor
  if (!temItem("espada")) {
    void executarMorteSemEspada();
    return;
  }
  if (obterEstado().lutaCorredorConcluida) {
    irParaCorredorC01B();
    return;
  }
  void executarLutaComEspada();
}

async function executarLutaComEspada() {
  const [, frame02, frameFuga] = obterFramesLutaC01B();

  await mostrarCena(() => criarCenaLutaEspada(), { comVeil: true });

  // Áudio único: 1s desembainhar (frame 01), depois combate (frame 02) até acabar
  const audioBladesPronto = tocarArquivo("bladesClash");
  await aguardar(DURACAO_LUTA_DESEMBAINHAR_MS);

  if (cenaAtual) {
    trocarFrameCutscene(
      cenaAtual,
      frame02,
      "Choque de espadas com o perseguidor"
    );
  }
  await audioBladesPronto;

  if (cenaAtual) {
    trocarFrameCutscene(
      cenaAtual,
      frameFuga,
      "O perseguidor foge pelo fundo do corredor"
    );
  }
  // Frame de fuga dura o tempo do áudio de passos do cavaleiro
  await tocarArquivo("knightRunning");

  // Fuga → pisca (veil) → corredor jogável (sem frame vazio no meio)
  registrarLutaCorredorConcluida();
  irParaCorredorC01B();
}

async function executarMorteSemEspada() {
  await mostrarCena(() => criarCenaMorteEspadada(), { comVeil: true });

  // Som da espadada na imagem de morte
  tocarArquivo("knifeSlash");
  await aguardar(DURACAO_ESPADADA_MS);

  const flash = document.createElement("div");
  flash.className = "morte-flash morte-flash--impacto";
  flash.setAttribute("aria-hidden", "true");
  document.getElementById("app")?.append(flash);

  await aguardar(DURACAO_FLASH_MS);
  flash.classList.add("morte-flash--preto");
  flash.classList.remove("morte-flash--impacto");

  await reiniciarAposMorte();
}

async function reiniciarAposMorte() {
  reiniciarEstado();
  definirSalaAtual("G00A");

  // Mantém tela preta até G00A + pálpebras
  let preto = document.querySelector(".morte-flash");
  if (!preto) {
    preto = document.createElement("div");
    preto.className = "morte-flash morte-flash--preto";
    preto.setAttribute("aria-hidden", "true");
    document.getElementById("app")?.append(preto);
  } else {
    preto.classList.add("morte-flash--preto");
    preto.classList.remove("morte-flash--impacto");
  }

  await mostrarCena(
    () =>
      criarG00A({
        aoAproximar: irParaG00,
        abrirOlhos: true,
      }),
    { comVeil: false }
  );

  preto.remove();
  tocarArquivo("returnByDeath");
  iniciarEfeitoAbrirOlhos();
}

function irParaC02() {
  tocar("passo");
  mostrarCena(
    () =>
      criarC02({
        aoVoltar: irParaC01,
        aoAbrirMesa: irParaC02M,
      }),
    { comVeil: true }
  );
}

function irParaC02M() {
  tocar("passo");
  mostrarCena(
    () =>
      criarC02M({
        aoVoltar: irParaC02,
      }),
    { comVeil: true }
  );
}

function irParaC03() {
  tocar("passo");
  mostrarCena(
    () =>
      criarC03({
        aoVoltar: irParaC01,
        aoAbrirArquivo: irParaC03G,
      }),
    { comVeil: true }
  );
}

function irParaC03G() {
  tocar("passo");
  mostrarCena(
    () =>
      criarC03G({
        aoVoltar: irParaC03,
      }),
    { comVeil: true }
  );
}

function retomarPartida() {
  iniciarAudio();
  const estado = carregarEstado();

  if (estado.salaAtual === "C02M") {
    irParaC02M();
    return;
  }

  // Saves antigos no quadro (C02Q) voltam à sala — quadro removido
  if (estado.salaAtual === "C02" || estado.salaAtual === "C02Q") {
    irParaC02();
    return;
  }

  if (estado.salaAtual === "C03G") {
    irParaC03G();
    return;
  }

  if (estado.salaAtual === "C03") {
    irParaC03();
    return;
  }

  if (estado.salaAtual === "C01B") {
    irParaCorredorC01B();
    return;
  }

  if (estado.salaAtual === "C01") {
    irParaC01();
    return;
  }

  if (
    estado.salaAtual === "G00" ||
    estado.portaPrincipalAberta ||
    estado.e00Resolvido
  ) {
    irParaG00();
    return;
  }

  // Ainda na floresta, antes de aproximar do portão
  if (estado.salaAtual === "G00A") {
    irParaG00A();
    return;
  }

  irParaIntroducao();
}

function iniciar() {
  garantirHud();
  mostrarHud(false);
  instalarAtalhosModoDev();
  // Modo Dev: botão "Tocar luta" dispara a cutscene completa
  window.addEventListener("oum:dev-luta", () => {
    void executarLutaComEspada();
  });
  const estado = carregarEstado();
  const podeContinuar =
    estado.salaAtual === "C02M" ||
    estado.salaAtual === "C02" ||
    estado.salaAtual === "C02Q" ||
    estado.salaAtual === "C03" ||
    estado.salaAtual === "C03G" ||
    estado.salaAtual === "C01" ||
    estado.salaAtual === "C01B" ||
    estado.salaAtual === "G00" ||
    estado.salaAtual === "G00A" ||
    estado.e00Resolvido ||
    estado.e01Resolvido ||
    estado.e02Resolvido ||
    estado.portaPrincipalAberta ||
    estado.medalhaoColetado;

  mostrarCena(() =>
    criarTelaInicial({
      aoIniciar: () => {
        iniciarAudio();
        reiniciarEstado();
        irParaIntroducao();
      },
      aoContinuar: podeContinuar ? retomarPartida : null,
    })
  );
}

iniciar();
