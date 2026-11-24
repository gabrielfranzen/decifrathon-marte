import { obterEstado } from "../core/estado.js";
import { iniciarAudio, tocar } from "../core/audio.js";
import { abrirExaminador } from "./examinador.js";

export const ITENS = {
  medalhao: {
    id: "medalhao",
    nome: "Medalhão",
    descricao: "Dois anéis de letras que giram um em relação ao outro.",
    inicial: "M",
    imagem: "assets/inventario/objeto-medalhao-base.png",
  },
  "papel-arquivo": {
    id: "papel-arquivo",
    nome: "Rotina",
    descricao: "Rotina do arquivo: busca binária nas quarenta gavetas.",
    inicial: "P",
    imagem: "assets/inventario/objeto-papel-arquivo.png",
  },
  espada: {
    id: "espada",
    nome: "Espada",
    descricao: "Espada medieval retirada do armário do salão.",
    inicial: "E",
    imagem: "assets/inventario/objeto-espada.png",
  },
  "carta-adagas": {
    id: "carta-adagas",
    nome: "Mapa das adagas",
    descricao: "Rotina booleana das oito adagas da antecâmara.",
    inicial: "A",
    imagem: "assets/inventario/objeto-carta-adagas.jpg",
  },
};

let painel = null;

function criarBotao(classe, texto, rotulo) {
  const botao = document.createElement("button");
  botao.type = "button";
  botao.className = classe;
  if (texto) {
    botao.textContent = texto;
  }
  if (rotulo) {
    botao.setAttribute("aria-label", rotulo);
  }
  return botao;
}

function garantirPainel() {
  if (painel) {
    return painel;
  }

  painel = document.createElement("aside");
  painel.className = "painel-reliquias";
  painel.setAttribute("aria-label", "Relíquias");
  painel.setAttribute("aria-hidden", "true");
  painel.inert = true;

  const topo = document.createElement("div");
  topo.className = "painel-topo";

  const titulo = document.createElement("p");
  titulo.className = "painel-titulo";
  titulo.textContent = "Relíquias";

  const fechar = criarBotao("painel-fechar", "Fechar", "Fechar Relíquias");
  fechar.addEventListener("click", fecharPainelReliquias);

  topo.append(titulo, fechar);

  const corpo = document.createElement("div");
  corpo.className = "painel-corpo";
  painel.corpo = corpo;

  painel.append(topo, corpo);
  document.getElementById("app").append(painel);
  return painel;
}

function miniaturaItem(item) {
  const caixa = document.createElement("div");
  caixa.className = "item-miniatura";
  if (item.id === "espada") {
    caixa.classList.add("item-miniatura--espada");
  }
  if (item.imagem) {
    const figura = document.createElement("img");
    figura.className = "item-figura";
    figura.src = item.imagem;
    figura.alt = "";
    figura.draggable = false;
    caixa.append(figura);
    return caixa;
  }
  const inicial = document.createElement("span");
  inicial.className = "item-inicial";
  inicial.textContent = item.inicial || item.nome.charAt(0);
  caixa.append(inicial);
  return caixa;
}

function renderizar() {
  const alvo = garantirPainel().corpo;
  const estado = obterEstado();
  alvo.replaceChildren();

  if (estado.inventario.length === 0) {
    const vazio = document.createElement("p");
    vazio.className = "painel-vazio";
    vazio.textContent = "Nenhuma relíquia recuperada.";
    alvo.append(vazio);
    return;
  }

  const grade = document.createElement("div");
  grade.className = "grade-reliquias";

  for (const id of estado.inventario) {
    const item = ITENS[id];
    if (!item) {
      continue;
    }
    const botao = criarBotao("reliquia", null, `Examinar ${item.nome}`);
    botao.append(miniaturaItem(item));
    const nome = document.createElement("span");
    nome.className = "reliquia-nome";
    nome.textContent = item.nome;
    botao.append(nome);
    botao.addEventListener("click", () => {
      fecharPainelReliquias();
      if (id === "medalhao") {
        abrirExaminador({
          tipo: "medalhao",
          nasMaos: true,
          nomeObjeto: item.nome,
        });
        return;
      }
      if (id === "papel-arquivo") {
        abrirExaminador({
          tipo: "papel-arquivo",
          nasMaos: true,
          nomeObjeto: item.nome,
        });
        return;
      }
      if (id === "espada") {
        abrirExaminador({
          tipo: "espada",
          nasMaos: true,
          nomeObjeto: item.nome,
        });
        return;
      }
      if (id === "carta-adagas") {
        abrirExaminador({
          tipo: "carta-adagas",
          nasMaos: true,
          nomeObjeto: item.nome,
        });
      }
    });
    grade.append(botao);
  }

  alvo.append(grade);
}

export function abrirPainelReliquias() {
  iniciarAudio();
  window.dispatchEvent(new CustomEvent("oum:abrir-reliquias"));
  const caixa = garantirPainel();
  renderizar();
  caixa.classList.add("aberto");
  caixa.setAttribute("aria-hidden", "false");
  caixa.inert = false;
  document.body.classList.add("painel-aberto");
  caixa.querySelector(".painel-fechar")?.focus();
}

export function fecharPainelReliquias() {
  if (!painel) {
    return;
  }
  painel.classList.remove("aberto");
  painel.setAttribute("aria-hidden", "true");
  painel.inert = true;
  document.body.classList.remove("painel-aberto");
}

export function painelReliquiasAberto() {
  return Boolean(painel?.classList.contains("aberto"));
}

export function criarBotaoInventario() {
  const botao = criarBotao("hud-botao", "Relíquias", "Abrir Relíquias");
  botao.addEventListener("click", () => abrirPainelReliquias());
  function atualizar() {
    const n = obterEstado().inventario.length;
    botao.textContent = n > 0 ? `Relíquias (${n})` : "Relíquias";
  }
  atualizar();
  window.addEventListener("oum:inventario", atualizar);
  return botao;
}

export function abrirPainelInventario() {
  abrirPainelReliquias();
}

export async function anunciarItem(id, { tocarSom = true } = {}) {
  const item = ITENS[id];
  if (!item) {
    return;
  }
  if (tocarSom) {
    tocar("item");
  }
  const { limparMensagensTemporarias } = await import("./fotografia.js");
  limparMensagensTemporarias();
  const { toast, pulsarReliquias } = await import("./hud.js");
  toast("Relíquia recuperada", item.nome);
  pulsarReliquias();
}
