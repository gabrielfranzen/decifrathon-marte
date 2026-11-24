// Enigma E01 — As Quatro Cartas (dados e validação pura)

export const CARTAS = Object.freeze([
  {
    id: "espadas",
    naipe: "espadas",
    nomeNaipe: "Espadas",
    simbolo: "♠",
    numero: 3,
    palavra: "VELAS",
  },
  {
    id: "copas",
    naipe: "copas",
    nomeNaipe: "Copas",
    simbolo: "♥",
    numero: 2,
    palavra: "TUMBA",
  },
  {
    id: "ouros",
    naipe: "ouros",
    nomeNaipe: "Ouros",
    simbolo: "♦",
    numero: 3,
    palavra: "RITUAL",
  },
  {
    id: "paus",
    naipe: "paus",
    nomeNaipe: "Paus",
    simbolo: "♣",
    numero: 4,
    palavra: "OSSOS",
  },
  {
    id: "copas-cinzas",
    naipe: "copas",
    nomeNaipe: "Copas",
    simbolo: "♥",
    numero: 5,
    palavra: "CINZAS",
  },
  {
    id: "paus-eco",
    naipe: "paus",
    nomeNaipe: "Paus",
    simbolo: "♣",
    numero: 1,
    palavra: "ECO",
  },
  {
    id: "espadas-sal",
    naipe: "espadas",
    nomeNaipe: "Espadas",
    simbolo: "♠",
    numero: 6,
    palavra: "SAL",
  },
  {
    id: "ouros-vazio",
    naipe: "ouros",
    nomeNaipe: "Ouros",
    simbolo: "♦",
    numero: 4,
    palavra: "VAZIO",
  },
  {
    id: "espadas-sombra",
    naipe: "espadas",
    nomeNaipe: "Espadas",
    simbolo: "♠",
    numero: 2,
    palavra: "SOMBRA",
  },
  {
    id: "copas-prece",
    naipe: "copas",
    nomeNaipe: "Copas",
    simbolo: "♥",
    numero: 3,
    palavra: "PRECE",
  },
]);

export const ORDEM_CORRETA = Object.freeze([
  "espadas",
  "copas",
  "ouros",
  "paus",
]);

export const PISTAS = Object.freeze([
  "Os quatro naipes estão sobre a mesa.",
  "Só um número aparece duas vezes na mesa.",
  "Os números da mesa somam doze.",
  "Juntas, as pretas valem mais que as vermelhas.",
  "As pontas são pretas.",
  "A última carta vale mais entre as quatro.",
  "O ouro nunca toca a lâmina.",
]);

export const FECHO_PISTAS =
  "Quando as quatro estiverem sobre a mesa, leia o que elas escondem.";

export const PALAVRA_E01 = "LUTO";
export const SENHA_E01 = "LUTO";

const mapaCartas = new Map(CARTAS.map((carta) => [carta.id, carta]));

export function validarCadeadoE01(rodas, linguetaAcionada) {
  if (!linguetaAcionada) {
    return { ok: false, motivo: "lingueta-inativa" };
  }
  const combinacao = Array.isArray(rodas) ? rodas.join("") : "";
  if (combinacao !== SENHA_E01) {
    return { ok: false, motivo: "combinacao" };
  }
  return { ok: true, motivo: "aberto" };
}

export function cartaPorId(id) {
  return mapaCartas.get(id) || null;
}

export function embaralharLista(lista) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = copia[i];
    copia[i] = copia[j];
    copia[j] = tmp;
  }
  return copia;
}

export function embaralharMao(ids = CARTAS.map((c) => c.id)) {
  return embaralharLista(ids);
}

// casas: array de 4 ids (string) ou null
export function validarCasas(casas) {
  if (!Array.isArray(casas) || casas.length !== ORDEM_CORRETA.length) {
    return false;
  }
  return ORDEM_CORRETA.every((id, i) => casas[i] === id);
}

export function extrairLuto(casas) {
  if (!validarCasas(casas)) {
    return null;
  }

  const letras = ORDEM_CORRETA.map((id) => {
    const carta = cartaPorId(id);
    if (!carta) {
      return "";
    }
    return carta.palavra.charAt(carta.numero - 1) || "";
  });

  const palavra = letras.join("");
  return palavra === PALAVRA_E01 ? palavra : null;
}

export function idsForaDasCasas(casas) {
  const ocupadas = new Set(
    (Array.isArray(casas) ? casas : []).filter(Boolean)
  );
  return CARTAS.map((c) => c.id).filter((id) => !ocupadas.has(id));
}
