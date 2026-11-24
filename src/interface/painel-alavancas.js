import { tocar } from "../core/audio.js";
import {
  concluirE03,
  definirAlavancasE03,
  obterEstado,
} from "../core/estado.js";
import {
  ESTADO_CERTO,
  LETRAS_DESLIGADA,
  LETRAS_LIGADA,
  PALAVRA_E03,
  ROTINA,
  TOTAL_ALAVANCAS,
  extrairPalavra,
  normalizarAlavancas,
  validarAlavancas,
} from "../enigmas/e03.js";

function criarBotaoAlavanca(indice, ligadaInicial, bloqueada) {
  const botao = document.createElement("button");
  botao.type = "button";
  botao.className = "al-alavanca";
  botao.dataset.indice = String(indice);
  botao.setAttribute("aria-pressed", ligadaInicial ? "true" : "false");
  botao.setAttribute(
    "aria-label",
    `Alavanca A${indice + 1}${ligadaInicial ? ", ligada" : ", desligada"}`
  );
  if (bloqueada) {
    botao.disabled = true;
  }

  const rotulo = document.createElement("span");
  rotulo.className = "al-alavanca__rotulo";
  rotulo.textContent = `A${indice + 1}`;

  const haste = document.createElement("span");
  haste.className = "al-alavanca__haste";
  haste.setAttribute("aria-hidden", "true");

  const base = document.createElement("span");
  base.className = "al-alavanca__base";
  base.setAttribute("aria-hidden", "true");

  const estadoTxt = document.createElement("span");
  estadoTxt.className = "al-alavanca__estado";
  estadoTxt.textContent = ligadaInicial ? "ligada" : "desligada";

  botao.append(rotulo, haste, base, estadoTxt);

  botao.definir = (ligada) => {
    botao.classList.toggle("ligada", ligada);
    botao.setAttribute("aria-pressed", ligada ? "true" : "false");
    botao.setAttribute(
      "aria-label",
      `Alavanca A${indice + 1}${ligada ? ", ligada" : ", desligada"}`
    );
    estadoTxt.textContent = ligada ? "ligada" : "desligada";
  };

  botao.definir(ligadaInicial);
  return botao;
}

function destacarLetras(tabela, estados) {
  const celulas = tabela.querySelectorAll("[data-linha][data-col]");
  celulas.forEach((celula) => {
    celula.classList.remove("letra-lida");
  });
  const vetor = normalizarAlavancas(estados);
  vetor.forEach((ligada, col) => {
    const linha = ligada ? "ligada" : "desligada";
    const alvo = tabela.querySelector(
      `[data-linha="${linha}"][data-col="${col}"]`
    );
    if (alvo) {
      alvo.classList.add("letra-lida");
    }
  });
}

export function abrirPainelAlavancas({
  aoFechar,
  aoAtualizarCena,
  foco = "alavancas",
} = {}) {
  const existente = document.querySelector(".al-overlay");
  if (existente) {
    existente.remove();
  }

  const estado = obterEstado();
  const resolvido = Boolean(estado.e03Resolvido || estado.portaPedraAberta);
  let alavancas = normalizarAlavancas(estado.alavancasE03);
  if (resolvido) {
    alavancas = [...ESTADO_CERTO];
  }

  const overlay = document.createElement("div");
  overlay.className = "al-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "Painel das oito alavancas");

  const painel = document.createElement("div");
  painel.className = "al-painel";

  const titulo = document.createElement("h2");
  titulo.className = "al-titulo";
  titulo.textContent = "As Oito Alavancas";

  const layout = document.createElement("div");
  layout.className = "al-layout";
  if (foco === "instrucoes") {
    layout.classList.add("al-layout--foco-placa");
  }

  // Coluna das alavancas
  const colunaAlavancas = document.createElement("section");
  colunaAlavancas.className = "al-coluna al-coluna--alavancas";
  colunaAlavancas.setAttribute("aria-label", "Alavancas");

  const grade = document.createElement("div");
  grade.className = "al-grade";
  const botoes = [];

  for (let i = 0; i < TOTAL_ALAVANCAS; i += 1) {
    const botao = criarBotaoAlavanca(i, alavancas[i], resolvido);
    botao.addEventListener("click", () => {
      if (resolvido || botao.disabled) {
        return;
      }
      const nova = !botao.classList.contains("ligada");
      botao.definir(nova);
      alavancas[i] = nova;
      definirAlavancasE03(alavancas);
      tocar(nova ? "giro" : "papel");
      palavraAtual.textContent = extrairPalavra(alavancas);
    });
    botoes.push(botao);
    grade.append(botao);
  }

  colunaAlavancas.append(grade);

  // Coluna da placa / rotina / tabela
  const colunaPlaca = document.createElement("section");
  colunaPlaca.className = "al-coluna al-coluna--placa";
  colunaPlaca.setAttribute("aria-label", "Instruções do enigma");

  const folha = document.createElement("div");
  folha.className = "al-folha";

  const subRotina = document.createElement("h3");
  subRotina.className = "al-folha__titulo";
  subRotina.textContent = "Rotina de verificação";

  const lista = document.createElement("ol");
  lista.className = "al-rotina";
  ROTINA.forEach((linha) => {
    const item = document.createElement("li");
    item.textContent = linha;
    lista.append(item);
  });

  const subTabela = document.createElement("h3");
  subTabela.className = "al-folha__titulo";
  subTabela.textContent = "Tabela do escriba";

  const tabela = document.createElement("table");
  tabela.className = "al-tabela";
  tabela.setAttribute("aria-label", "Letras por alavanca ligada ou desligada");

  const thead = document.createElement("thead");
  const trHead = document.createElement("tr");
  const thVazio = document.createElement("th");
  thVazio.scope = "col";
  thVazio.textContent = "";
  trHead.append(thVazio);
  for (let i = 0; i < TOTAL_ALAVANCAS; i += 1) {
    const th = document.createElement("th");
    th.scope = "col";
    th.textContent = `A${i + 1}`;
    trHead.append(th);
  }
  thead.append(trHead);

  const tbody = document.createElement("tbody");
  const linhas = [
    { id: "ligada", rotulo: "ligada", letras: LETRAS_LIGADA },
    { id: "desligada", rotulo: "desligada", letras: LETRAS_DESLIGADA },
  ];
  linhas.forEach((linha) => {
    const tr = document.createElement("tr");
    const th = document.createElement("th");
    th.scope = "row";
    th.textContent = linha.rotulo;
    tr.append(th);
    linha.letras.forEach((letra, col) => {
      const td = document.createElement("td");
      td.dataset.linha = linha.id;
      td.dataset.col = String(col);
      td.textContent = letra;
      tr.append(td);
    });
    tbody.append(tr);
  });

  tabela.append(thead, tbody);

  const palavraAtual = document.createElement("p");
  palavraAtual.className = "al-palavra";
  palavraAtual.setAttribute("aria-live", "polite");
  palavraAtual.textContent = resolvido
    ? PALAVRA_E03
    : extrairPalavra(alavancas);

  const nota = document.createElement("p");
  nota.className = "al-nota";
  nota.textContent = resolvido
    ? "A porta cedeu. As alavancas travaram na posição correta."
    : "Empurre a porta de pedra para verificar o conjunto. Nenhuma alavanca responde sozinha.";

  folha.append(subRotina, lista, subTabela, tabela, palavraAtual, nota);
  colunaPlaca.append(folha);

  layout.append(colunaAlavancas, colunaPlaca);

  const acoes = document.createElement("div");
  acoes.className = "al-acoes";

  const botaoFechar = document.createElement("button");
  botaoFechar.type = "button";
  botaoFechar.className = "botao-texto botao-texto--secundario al-fechar";
  botaoFechar.textContent = "Fechar";

  const botaoTentar = document.createElement("button");
  botaoTentar.type = "button";
  botaoTentar.className = "botao-texto al-tentar";
  botaoTentar.textContent = resolvido
    ? "Porta entreaberta"
    : "Empurrar a porta";
  botaoTentar.disabled = resolvido;

  function fechar() {
    document.removeEventListener("keydown", aoTeclar);
    overlay.remove();
    if (aoFechar) {
      aoFechar();
    }
  }

  function aoTeclar(evento) {
    if (evento.key === "Escape") {
      fechar();
    }
  }

  function revelarAcerto() {
    destacarLetras(tabela, ESTADO_CERTO);
    palavraAtual.textContent = PALAVRA_E03;
    palavraAtual.classList.add("al-palavra--revelada");
    botoes.forEach((botao, i) => {
      botao.definir(ESTADO_CERTO[i]);
      botao.disabled = true;
    });
    botaoTentar.disabled = true;
    botaoTentar.textContent = "Porta entreaberta";
    nota.textContent =
      "A porta cede um pouco. O vão escuro convida a entrar.";
  }

  botaoTentar.addEventListener("click", () => {
    if (resolvido || botaoTentar.disabled) {
      return;
    }
    const resultado = validarAlavancas(alavancas);
    if (!resultado.ok) {
      tocar("erro");
      nota.textContent =
        "A porta não cede. O mecanismo interno não se move.";
      painel.classList.remove("al-painel--tremer");
      void painel.offsetWidth;
      painel.classList.add("al-painel--tremer");
      return;
    }

    tocar("acerto");
    concluirE03();
    revelarAcerto();
    window.setTimeout(() => {
      fechar();
      if (aoAtualizarCena) {
        aoAtualizarCena();
      }
    }, 1600);
  });

  botaoFechar.addEventListener("click", fechar);
  document.addEventListener("keydown", aoTeclar);

  if (resolvido) {
    revelarAcerto();
  }

  acoes.append(botaoTentar, botaoFechar);
  painel.append(titulo, layout, acoes);
  overlay.append(painel);
  document.getElementById("app")?.append(overlay);

  return { fechar, overlay };
}

// Validação diegética ao clicar na porta na cena (sem abrir o painel)
export function tentarAbrirPortaPedra({ aoSucesso, aoFalhar } = {}) {
  const estado = obterEstado();
  if (estado.e03Resolvido || estado.portaPedraAberta) {
    return { ok: true, jaAberta: true };
  }

  const resultado = validarAlavancas(estado.alavancasE03);
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
