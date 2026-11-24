import {
  aoChegarMarcoTrilhaFinal,
  definirTaxaTrilhaFinal,
  MARCO_CAVALEIRO_SEG,
  obterTempoTrilhaFinal,
  pararTrilhaFinal,
  tocar,
  tocarTrilhaFinal,
  trilhaFinalAtiva,
} from "../core/audio.js";
import { marcarFinalVisto } from "../core/estado.js";
import { obterImagemFinalVilaCelebracao } from "../dados/imagens.js";
import { mostrarHud } from "./hud.js";

const SEGUNDOS_POR_LINHA = 2.6;
// Folga entre o fim do rolo ("Você se tornou um ...") e o CAVALEIRO no 2:55
const FOLGA_ANTES_CAVALEIRO_S = 2.2;
const DURACAO_MINIMA_CREDITOS_S = 14;

export const POEMA_FINAL = [
  "A guerra terminou há muito tempo.",
  "O castelo nunca recebeu a ordem para parar de lutar.",
  "",
  "Séculos atrás, diante de uma derrota inevitável,",
  "um comandante jurou a Marte",
  "que nenhum homem abandonaria o posto",
  "e que a guerra só cessaria com seu último movimento.",
  "",
  "O exército caiu.",
  "O comandante morreu antes de pronunciar a ordem.",
  "O juramento permaneceu.",
  "",
  "Ninguém desertou.",
  "Ninguém venceu.",
  "Ninguém recebeu permissão para partir.",
  "",
  "Homens mortos continuaram ocupando seus postos.",
  "Quando as fileiras falharam,",
  "a fortaleza procurou substitutos em Véspera.",
  "Viajantes. Moradores. Investigadores.",
  "",
  "Quem entra não encontra uma maldição qualquer.",
  "Encontra uma estrutura militar",
  "ainda obedecendo à ordem de um homem morto.",
  "",
  "Os códigos, as fechaduras, o Inventário,",
  "não eram enigmas mágicos.",
  "Eram protocolos de uma guarnição que nunca encerrou a campanha.",
  "",
  "O ferro que o perseguia não o fazia por prazer.",
  "Era a autoridade de comando",
  "que continuou existindo depois que o comandante deixou de existir.",
  "Um dever sem corpo. Uma armadura sem rosto.",
  "",
  "Você não derrotou o ferro.",
  "Você aprendeu a linguagem da fortaleza.",
  "Chegou ao lugar da ordem pendente.",
  "",
  "E pela primeira vez em séculos,",
  "alguém pronunciou o que faltava.",
  "O último movimento.",
  "A guarnição foi dispensada.",
  "A guerra, enfim, terminou.",
  "",
  "Você volta a Véspera.",
  "O portão está aberto.",
  "Os que restaram celebram nas ruas.",
  "Você carrega o elmo daquele que atormentou a vila.",
  "",
  "Você não ficou para guardar o castelo.",
  "Você o libertou.",
  "E por ter tido a coragem de encerrar a guerra,",
  "Você se tornou um ...",
];

function movimentoReduzido() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function esperar(ms) {
  return new Promise((resolver) => {
    window.setTimeout(resolver, ms);
  });
}

function criarElemento(tag, classe, texto) {
  const el = document.createElement(tag);
  if (classe) {
    el.className = classe;
  }
  if (texto != null && texto !== "") {
    el.textContent = texto;
  }
  return el;
}

function precarregarImagem(url) {
  return new Promise((resolver) => {
    const img = new Image();
    img.onload = () => resolver();
    img.onerror = () => resolver();
    img.src = url;
  });
}

let cenaAtiva = null;
let emCurso = false;

// Overlay de créditos + CAVALEIRO no marco 2:55 da Final-soundtrack.
// iniciarTrilha: true quando a trilha ainda não toca.
// Após o diálogo na mesa: preto → vila já escurecida → créditos.
export async function iniciarRevelacao({
  aoEncerrar,
  iniciarTrilha = false,
} = {}) {
  if (emCurso) {
    return;
  }
  emCurso = true;
  marcarFinalVisto();
  mostrarHud(false);

  if (iniciarTrilha || !trilhaFinalAtiva()) {
    tocarTrilhaFinal();
  }

  const urlFundo = obterImagemFinalVilaCelebracao();
  await precarregarImagem(urlFundo);

  const cena = document.createElement("section");
  cena.className = "revelacao";
  cena.setAttribute("aria-label", "O Último Movimento — créditos");
  cenaAtiva = cena;

  // Fundo + véu já montados juntos: a vila nunca aparece clara
  const fundo = document.createElement("div");
  fundo.className = "revelacao-fundo";
  fundo.style.backgroundImage = `url("${urlFundo}")`;
  fundo.setAttribute("aria-hidden", "true");

  const veu = document.createElement("div");
  veu.className = "revelacao-veu";
  veu.setAttribute("aria-hidden", "true");

  const capa = document.createElement("div");
  capa.className = "revelacao-capa";
  capa.setAttribute("aria-hidden", "true");

  const palco = document.createElement("div");
  palco.className = "revelacao-palco";
  cena.append(fundo, veu, capa, palco);
  document.body.append(cena);

  // 1) Fade para preto (após o diálogo do cavaleiro na mesa)
  window.requestAnimationFrame(() => cena.classList.add("visivel"));
  await esperar(movimentoReduzido() ? 0 : 1100);

  // 2) Tira a capa: revela a vila já escurecida, aí sobem os créditos
  if (movimentoReduzido()) {
    capa.remove();
  } else {
    capa.classList.add("saindo");
    await esperar(1350);
    capa.remove();
  }

  let chaveMontada = false;
  let cancelarMarco = () => {};

  async function encerrar() {
    if (!cenaAtiva) {
      return;
    }
    cancelarMarco();
    pararTrilhaFinal();
    const alvo = cenaAtiva;
    cenaAtiva = null;
    emCurso = false;
    if (aoEncerrar) {
      await aoEncerrar();
    }
    alvo.classList.remove("visivel");
    window.setTimeout(() => alvo.remove(), 900);
  }

  function montarChave() {
    if (chaveMontada || !cenaAtiva) {
      return;
    }
    chaveMontada = true;
    cancelarMarco();

    // CAVALEIRO sempre em velocidade normal (áudio + cena)
    definirTaxaTrilhaFinal(1);

    // Punchline em tela preta
    cena.classList.add("revelacao--chave");
    fundo.classList.add("oculto");
    veu.classList.add("oculto");

    const chave = criarElemento("div", "chave-final");
    const palavra = criarElemento("h1", "palavra-cavaleiro", "CAVALEIRO");
    palavra.setAttribute("aria-label", "Cavaleiro");
    const rodape = criarElemento("p", "sua-chave", "Essa é sua chave");
    const menu = document.createElement("button");
    menu.type = "button";
    menu.className = "botao-texto";
    menu.textContent = "Voltar ao menu principal";
    menu.addEventListener("click", encerrar);
    chave.append(palavra, rodape, menu);
    palco.replaceChildren(chave);
    // Trilha segue até o fim se o jogador ficar nesta tela
    window.requestAnimationFrame(() => {
      chave.classList.add("surgindo");
      if (!movimentoReduzido()) {
        palavra.classList.add("revelando");
      }
    });
    tocar("acerto");
  }

  function revelarCavaleiroNoMarco() {
    if (chaveMontada) {
      return;
    }
    if (!creditosEncerrados && janela?.isConnected) {
      creditosEncerrados = true;
      rolo?.removeEventListener("animationend", aoFimAnimacao);
      controles?.remove();
      janela.classList.add("saindo");
      window.setTimeout(() => montarChave(), 400);
      return;
    }
    montarChave();
  }

  function aguardarMarcoCavaleiro() {
    cancelarMarco();
    if (obterTempoTrilhaFinal() >= MARCO_CAVALEIRO_SEG) {
      revelarCavaleiroNoMarco();
      return;
    }
    cancelarMarco = aoChegarMarcoTrilhaFinal(
      MARCO_CAVALEIRO_SEG,
      revelarCavaleiroNoMarco
    );
  }

  // Declarados antes do marco para o callback poder fechá-los
  let janela = null;
  let rolo = null;
  let controles = null;
  let creditosEncerrados = false;
  let aoFimAnimacao = () => {};

  if (movimentoReduzido()) {
    aguardarMarcoCavaleiro();
    return;
  }

  if (obterTempoTrilhaFinal() >= MARCO_CAVALEIRO_SEG) {
    montarChave();
    return;
  }

  janela = criarElemento("div", "creditos");
  rolo = criarElemento("div", "rolo-creditos");
  POEMA_FINAL.forEach((linha) =>
    rolo.append(
      linha
        ? criarElemento("p", "linha-credito", linha)
        : criarElemento("span", "pausa-credito")
    )
  );
  // Duração cabe no tempo que falta até 2:55 da trilha, pra não sobrar espera morta
  // depois de "Você se tornou um ..."
  const tempoNaTrilha = obterTempoTrilhaFinal();
  const restanteAteMarco =
    MARCO_CAVALEIRO_SEG - tempoNaTrilha - FOLGA_ANTES_CAVALEIRO_S;
  const duracaoFallback = POEMA_FINAL.length * SEGUNDOS_POR_LINHA;
  const duracaoCreditos = trilhaFinalAtiva()
    ? Math.max(DURACAO_MINIMA_CREDITOS_S, restanteAteMarco)
    : duracaoFallback;
  rolo.style.setProperty("--duracao", `${duracaoCreditos}s`);
  janela.append(rolo);

  controles = criarElemento("div", "creditos-controles");

  const grupoVelocidade = criarElemento("div", "creditos-velocidade");
  const rotuloVelocidade = criarElemento(
    "label",
    "creditos-velocidade-rotulo",
    "Velocidade"
  );
  rotuloVelocidade.setAttribute("for", "creditos-velocidade");
  const valorVelocidade = criarElemento(
    "span",
    "creditos-velocidade-valor",
    "1×"
  );
  valorVelocidade.setAttribute("aria-hidden", "true");

  const sliderVelocidade = document.createElement("input");
  sliderVelocidade.type = "range";
  sliderVelocidade.id = "creditos-velocidade";
  sliderVelocidade.className = "creditos-velocidade-slider";
  sliderVelocidade.min = "1";
  sliderVelocidade.max = "5";
  sliderVelocidade.step = "0.1";
  sliderVelocidade.value = "1";
  sliderVelocidade.setAttribute("aria-label", "Velocidade dos créditos");
  sliderVelocidade.setAttribute("aria-valuemin", "1");
  sliderVelocidade.setAttribute("aria-valuemax", "5");
  sliderVelocidade.setAttribute("aria-valuenow", "1");
  sliderVelocidade.setAttribute("aria-valuetext", "1 vezes");

  grupoVelocidade.append(rotuloVelocidade, sliderVelocidade, valorVelocidade);

  const pular = document.createElement("button");
  pular.type = "button";
  pular.className = "creditos-botao";
  pular.textContent = "Pular";

  controles.append(grupoVelocidade, pular);

  function formatarTaxa(taxa) {
    const arredondada = Math.round(taxa * 10) / 10;
    return Number.isInteger(arredondada)
      ? `${arredondada}×`
      : `${arredondada.toFixed(1)}×`;
  }

  function animacaoCreditos() {
    const animacoes = rolo.getAnimations?.() || [];
    return (
      animacoes.find((anim) => anim.animationName === "xz-subir-creditos") ||
      animacoes[0] ||
      null
    );
  }

  function aplicarVelocidade(taxa) {
    const anim = animacaoCreditos();
    if (anim) {
      anim.playbackRate = taxa;
    }
    definirTaxaTrilhaFinal(taxa);
  }

  function atualizarVelocidade() {
    const taxa = Math.min(5, Math.max(1, Number(sliderVelocidade.value) || 1));
    const texto = formatarTaxa(taxa);
    valorVelocidade.textContent = texto;
    sliderVelocidade.setAttribute("aria-valuenow", String(taxa));
    sliderVelocidade.setAttribute(
      "aria-valuetext",
      `${texto.replace("×", "")} vezes`
    );
    grupoVelocidade.style.setProperty(
      "--progresso",
      `${((taxa - 1) / 4) * 100}%`
    );
    aplicarVelocidade(taxa);
  }

  sliderVelocidade.addEventListener("input", atualizarVelocidade);

  // Encerra o rolo; se o marco já estiver perto, CAVALEIRO vem na sequência
  function encerrarCreditosAguardandoMarco() {
    if (creditosEncerrados || chaveMontada) {
      return;
    }
    creditosEncerrados = true;
    rolo.removeEventListener("animationend", aoFimAnimacao);
    controles.remove();
    janela.classList.add("saindo");
    window.setTimeout(() => {
      if (chaveMontada) {
        return;
      }
      palco.replaceChildren();
      const falta = MARCO_CAVALEIRO_SEG - obterTempoTrilhaFinal();
      // Se já passou ou falta pouco, não deixa a tela preta “morrer”
      if (falta <= FOLGA_ANTES_CAVALEIRO_S + 0.4) {
        montarChave();
        return;
      }
      aguardarMarcoCavaleiro();
    }, 500);
  }

  aoFimAnimacao = (evento) => {
    if (evento.target !== rolo || evento.animationName !== "xz-subir-creditos") {
      return;
    }
    encerrarCreditosAguardandoMarco();
  };

  pular.addEventListener("click", encerrarCreditosAguardandoMarco);
  rolo.addEventListener("animationend", aoFimAnimacao);
  palco.replaceChildren(janela, controles);
  tocar("item");

  aguardarMarcoCavaleiro();
}
