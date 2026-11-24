// Relatos e fragmentos recuperáveis na Sala do Arquivo (C03 / C03G).

export const RELATOS_ARQUIVO = Object.freeze({
  "relato-campo": {
    id: "relato-campo",
    nome: "Relato do campo",
    titulo: "Depoimento - Véspera",
    origem: "balcao",
    balcao: "esquerda",
    descricao: "Testemunho de um morador sobre o Cavaleiro no campo.",
    corpo: [
      "Eu estava no campo com o Tomás, cortando o trigo perto da estrada.",
      "Do nada surgiu aquele cavaleiro de ferro. Sem palavra, agarrou o Tomás pelo braço e arrastou-o para as muralhas.",
      "Eu não pude fazer nada. Ele é forte demais. Ninguém na vila ousa atravessar o caminho dele.",
    ],
  },
  "relato-forja": {
    id: "relato-forja",
    nome: "Relato da forja",
    titulo: "Depoimento - Véspera",
    origem: "balcao",
    balcao: "direita",
    descricao: "Vizinho do ferreiro: a forja ficou acesa e o homem sumiu.",
    corpo: [
      "O fogo da forja ainda ardia quando fui ver o Mateus.",
      "A bigorna estava no lugar, o martelo no chão, e ele não estava. A porta da oficina aberta para a estrada.",
      "À noite ouvi passos de metal naquele caminho. No dia seguinte, ninguém o viu voltar.",
    ],
  },
  "fragmento-ordem": {
    id: "fragmento-ordem",
    nome: "Ordem de guarnição",
    titulo: "Arquivo militar - fragmento",
    origem: "gaveta",
    gaveta: 20,
    descricao: "Ordem antiga: a guerra não acabou para quem ficou nas muralhas.",
    corpo: [
      "Aos postos ainda ocupados:",
      "A campanha no campo pode ter cessado para o inimigo. Para esta guarnição, a guerra não terminou.",
      "Nenhum homem abandona o muro. Os turnos continuam. Quem falhar ao chamado será anotado como desertor.",
    ],
  },
  "fragmento-relatorio": {
    id: "fragmento-relatorio",
    nome: "Relatório incompleto",
    titulo: "Arquivo militar - fragmento",
    origem: "gaveta",
    gaveta: 11,
    descricao: "Relatório militar sobre a fortaleza após a guerra no campo.",
    corpo: [
      "Relatório - estado da fortaleza após a guerra no campo.",
      "Perdemos homens demais lá fora. Os que voltaram ainda cobrem os muros e as torres, turno após turno.",
      "Ninguém aqui fala em vitória. Também ninguém recebeu ordem de dispersar. Seguimos no posto.",
    ],
  },
});

const POR_BALCAO = Object.freeze({
  esquerda: "relato-campo",
  direita: "relato-forja",
});

const POR_GAVETA = Object.freeze({
  20: "fragmento-ordem",
  11: "fragmento-relatorio",
});

export function obterRelato(id) {
  return RELATOS_ARQUIVO[id] || null;
}

export function obterRelatoDoBalcao(lado) {
  const id = POR_BALCAO[lado];
  return id ? RELATOS_ARQUIVO[id] : null;
}

export function obterRelatoDaGaveta(posicao) {
  const id = POR_GAVETA[Number(posicao)];
  return id ? RELATOS_ARQUIVO[id] : null;
}

export function idsRelatosArquivo() {
  return Object.keys(RELATOS_ARQUIVO);
}
