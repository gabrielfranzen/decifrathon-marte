import { tocar } from "../core/audio.js";
import { marcarFinalVisto } from "../core/estado.js";
import { mostrarHud } from "./hud.js";

const SEGUNDOS_POR_LINHA = 2.6;

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
  "Quem entra não encontra uma maldição aleatória.",
  "Encontra uma estrutura militar",
  "ainda obedecendo à ordem de um homem morto.",
  "",
  "Os códigos, as fechaduras, as Relíquias,",
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
  "Véspera acordou livre da maldição.",
  "As casas voltaram a ter luz.",
  "Os desaparecidos puderam ser nomeados.",
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

let cenaAtiva = null;
let emCurso = false;

// Overlay de créditos em tela preta + chave CAVALEIRO. aoEncerrar volta ao menu.
export async function iniciarRevelacao({ aoEncerrar } = {}) {
  if (emCurso) {
    return;
  }
  emCurso = true;
  marcarFinalVisto();
  mostrarHud(false);
  tocar("acerto");

  const cena = document.createElement("section");
  cena.className = "revelacao";
  cena.setAttribute("aria-label", "O Último Movimento — créditos");
  cenaAtiva = cena;

  const palco = document.createElement("div");
  palco.className = "revelacao-palco";
  cena.append(palco);
  document.body.append(cena);
  window.requestAnimationFrame(() => cena.classList.add("visivel"));
  await esperar(900);

  async function encerrar() {
    if (!cenaAtiva) {
      return;
    }
    const alvo = cenaAtiva;
    cenaAtiva = null;
    emCurso = false;
    // Monta o menu ainda sob a tela preta, para não flashar a sala por baixo
    if (aoEncerrar) {
      await aoEncerrar();
    }
    alvo.classList.remove("visivel");
    window.setTimeout(() => alvo.remove(), 900);
  }

  function montarChave() {
    const chave = criarElemento("div", "chave-final");
    const palavra = criarElemento("h1", "palavra-cavaleiro", "CAVALEIRO");
    palavra.setAttribute("aria-label", "Cavaleiro");
    const rodape = criarElemento(
      "p",
      "sua-chave",
      "Essa é sua chave"
    );
    const menu = document.createElement("button");
    menu.type = "button";
    menu.className = "botao-texto";
    menu.textContent = "Voltar ao menu principal";
    menu.addEventListener("click", encerrar);
    chave.append(palavra, rodape, menu);
    palco.replaceChildren(chave);
    window.requestAnimationFrame(() => {
      chave.classList.add("surgindo");
      palavra.classList.add("revelando");
    });
  }

  if (movimentoReduzido()) {
    montarChave();
    return;
  }

  const janela = criarElemento("div", "creditos");
  const rolo = criarElemento("div", "rolo-creditos");
  POEMA_FINAL.forEach((linha) =>
    rolo.append(
      linha
        ? criarElemento("p", "linha-credito", linha)
        : criarElemento("span", "pausa-credito")
    )
  );
  const duracaoBase = POEMA_FINAL.length * SEGUNDOS_POR_LINHA;
  rolo.style.setProperty("--duracao", `${duracaoBase}s`);
  janela.append(rolo);

  const controles = criarElemento("div", "creditos-controles");

  const grupoVelocidade = criarElemento("div", "creditos-velocidade");
  const rotuloVelocidade = criarElemento("label", "creditos-velocidade-rotulo", "Velocidade");
  rotuloVelocidade.setAttribute("for", "creditos-velocidade");
  const valorVelocidade = criarElemento("span", "creditos-velocidade-valor", "1×");
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

  let terminou = false;

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

  function aoFimAnimacao(evento) {
    if (evento.target !== rolo || evento.animationName !== "xz-subir-creditos") {
      return;
    }
    seguir();
  }

  // Só altera a taxa de reprodução — não reinicia o rolo
  function aplicarVelocidade(taxa) {
    const anim = animacaoCreditos();
    if (anim) {
      anim.playbackRate = taxa;
    }
  }

  function atualizarVelocidade() {
    const taxa = Math.min(5, Math.max(1, Number(sliderVelocidade.value) || 1));
    const texto = formatarTaxa(taxa);
    valorVelocidade.textContent = texto;
    sliderVelocidade.setAttribute("aria-valuenow", String(taxa));
    sliderVelocidade.setAttribute("aria-valuetext", `${texto.replace("×", "")} vezes`);
    grupoVelocidade.style.setProperty(
      "--progresso",
      `${((taxa - 1) / 4) * 100}%`
    );
    aplicarVelocidade(taxa);
  }

  sliderVelocidade.addEventListener("input", atualizarVelocidade);

  const seguir = () => {
    if (terminou) {
      return;
    }
    terminou = true;
    rolo.removeEventListener("animationend", aoFimAnimacao);
    controles.remove();
    janela.classList.add("saindo");
    window.setTimeout(() => {
      tocar("acerto");
      montarChave();
    }, 700);
  };
  pular.addEventListener("click", seguir);
  rolo.addEventListener("animationend", aoFimAnimacao);
  palco.replaceChildren(janela, controles);
  tocar("item");
}
