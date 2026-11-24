// Núcleo da caçada do cavalo — port do cifrathon (js/nucleo/xadrez.js)

export const ARQUIVOS = ["a", "b", "c", "d", "e", "f", "g", "h"];
export const PALAVRA = "CAVALEIRO";
const CAVALO_INICIAL = "c2";

const PECAS_INICIAIS = [
  { id: "rei", tipo: "rei", casa: "h8" },
  { id: "dama", tipo: "dama", casa: "a1" },
  { id: "torre-b", tipo: "torre", casa: "b5" },
  { id: "torre-g", tipo: "torre", casa: "g8" },
  { id: "bispo-e", tipo: "bispo", casa: "e2" },
  { id: "bispo-b", tipo: "bispo", casa: "b8" },
  { id: "cavalo-h", tipo: "cavalo", casa: "h1" },
  { id: "cavalo-d", tipo: "cavalo", casa: "d6" },
  { id: "peao-a", tipo: "peao", casa: "a5" },
  { id: "peao-d", tipo: "peao", casa: "d7" },
  { id: "peao-e", tipo: "peao", casa: "e4" },
  { id: "peao-g5", tipo: "peao", casa: "g5" },
  { id: "peao-g7", tipo: "peao", casa: "g7" },
  { id: "peao-h", tipo: "peao", casa: "h7" },
];

export const ROTEIRO = [
  { destino: "e3", respostas: [["dama", "c1"]] },
  { destino: "g2", respostas: [["peao-g5", "g4"], ["bispo-e", "f1"]] },
  {
    destino: "h4",
    respostas: [
      ["cavalo-d", "e8"],
      ["bispo-b", "e5"],
      ["dama", "h6"],
    ],
  },
  {
    destino: "f5",
    respostas: [
      ["bispo-e", "g2"],
      ["peao-e", "e3"],
      ["bispo-b", "d4"],
    ],
  },
  {
    destino: "e7",
    respostas: [
      ["bispo-e", "c6"],
      ["torre-b", "c5"],
      ["dama", "h4"],
    ],
  },
  {
    destino: "c8",
    respostas: [
      ["torre-b", "f5"],
      ["dama", "g5"],
      ["cavalo-d", "c7"],
    ],
  },
  {
    destino: "d6",
    respostas: [
      ["bispo-b", "f6"],
      ["torre-b", "f2"],
      ["dama", "c5"],
    ],
  },
  { destino: "f7", respostas: null },
];

const NOMES = {
  rei: "O rei",
  dama: "A dama",
  torre: "A torre",
  bispo: "O bispo",
  cavalo: "O cavalo inimigo",
  peao: "Um peão",
};

const SALTOS = [
  [1, 2],
  [2, 1],
  [-1, 2],
  [-2, 1],
  [1, -2],
  [2, -1],
  [-1, -2],
  [-2, -1],
];
const VIZINHAS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];
const RETAS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];
const DIAGONAIS = [
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];

export function coordenada(id) {
  return { arquivo: id.charCodeAt(0) - 97, fileira: Number(id[1]) - 1 };
}

function idDaCasa(arquivo, fileira) {
  return `${ARQUIVOS[arquivo]}${fileira + 1}`;
}

function dentro(arquivo, fileira) {
  return arquivo >= 0 && arquivo < 8 && fileira >= 0 && fileira < 8;
}

export function ehMovimentoCavalo(origem, destino) {
  if (!origem || !destino || origem === destino) {
    return false;
  }
  const a = coordenada(origem);
  const b = coordenada(destino);
  const da = Math.abs(a.arquivo - b.arquivo);
  const df = Math.abs(a.fileira - b.fileira);
  return (da === 1 && df === 2) || (da === 2 && df === 1);
}

function pecaNaCasa(partida, casa) {
  return partida.inimigas.find((peca) => peca.casa === casa) || null;
}

function alcanca(peca, alvo, ocupadas) {
  const origem = coordenada(peca.casa);
  const destino = coordenada(alvo);
  const da = destino.arquivo - origem.arquivo;
  const df = destino.fileira - origem.fileira;
  if (peca.tipo === "peao") {
    return df === -1 && Math.abs(da) === 1;
  }
  if (peca.tipo === "cavalo") {
    return SALTOS.some(([a, b]) => a === da && b === df);
  }
  if (peca.tipo === "rei") {
    return VIZINHAS.some(([a, b]) => a === da && b === df);
  }
  const direcoes =
    peca.tipo === "torre"
      ? RETAS
      : peca.tipo === "bispo"
        ? DIAGONAIS
        : RETAS.concat(DIAGONAIS);
  for (const [a, b] of direcoes) {
    let arquivo = origem.arquivo + a;
    let fileira = origem.fileira + b;
    while (dentro(arquivo, fileira)) {
      const casa = idDaCasa(arquivo, fileira);
      if (casa === alvo) {
        return true;
      }
      if (ocupadas.has(casa)) {
        break;
      }
      arquivo += a;
      fileira += b;
    }
  }
  return false;
}

export function quemAtaca(partida, alvo) {
  const ocupadas = new Set(partida.inimigas.map((peca) => peca.casa));
  ocupadas.add(alvo);
  return (
    partida.inimigas.find(
      (peca) => peca.casa !== alvo && alcanca(peca, alvo, ocupadas)
    ) || null
  );
}

export function criarPartida() {
  return {
    cavalo: CAVALO_INICIAL,
    inimigas: PECAS_INICIAIS.map((peca) => ({ ...peca })),
    passo: 0,
    visitadas: [CAVALO_INICIAL],
    vitoria: false,
  };
}

export function letrasColetadas(partida) {
  return PALAVRA.slice(0, partida.visitadas.length);
}

export function jogar(partida, destino) {
  if (partida.vitoria) {
    return { tipo: "nada" };
  }
  if (!ehMovimentoCavalo(partida.cavalo, destino)) {
    return { tipo: "impossivel" };
  }

  const ocupante = pecaNaCasa(partida, destino);
  const etapa = ROTEIRO[partida.passo];
  const ultimo = partida.passo === ROTEIRO.length - 1;
  if (ocupante) {
    return { tipo: "ocupada", peca: ocupante };
  }

  const atacante = quemAtaca(partida, destino);
  if (atacante) {
    return {
      tipo: "morte",
      atacante: atacante.id,
      nome: NOMES[atacante.tipo],
      destino,
    };
  }
  if (destino !== etapa.destino) {
    return { tipo: "impossivel" };
  }

  const proxima = {
    ...partida,
    cavalo: destino,
    inimigas: partida.inimigas.map((peca) => ({ ...peca })),
    passo: partida.passo + 1,
    visitadas: partida.visitadas.concat(destino),
  };
  if (ultimo) {
    proxima.vitoria = true;
    return { tipo: "vitoria", partida: proxima };
  }
  const lances = [];
  let atual = proxima;
  for (const [id, casa] of etapa.respostas) {
    atual = {
      ...atual,
      inimigas: atual.inimigas.map((peca) =>
        peca.id === id ? { ...peca, casa } : peca
      ),
    };
    lances.push(atual);
  }
  const ameaca = quemAtaca(atual, atual.cavalo);
  return {
    tipo: "avanco",
    partida: proxima,
    lances,
    ameaca: ameaca?.id || null,
  };
}
