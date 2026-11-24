// Enigma E02 — Busca Binária (gavetas)

export const ALVO = 232;

export const NUMEROS = Object.freeze([
  103, 118, 126, 141, 157, 163, 179, 188, 204, 215, 232, 247, 259, 266, 281,
  297, 305, 318, 334, 342, 359, 367, 381, 396, 402, 417, 433, 448, 456, 471,
  489, 505, 520, 538, 551, 567, 582, 599, 614, 631,
]);

// Caminho com fim=40: [20,10,15,12,11] → L U T A R
export const ETIQUETAS = Object.freeze([
  "K", "E", "B", "W", "A", "J", "U", "O", "F", "U", "R", "A", "L", "C", "T",
  "M", "H", "V", "N", "L", "G", "P", "Z", "D", "X", "I", "Q", "S", "E", "B",
  "Y", "W", "F", "J", "C", "P", "V", "N", "H", "S",
]);

// Posições 1-based do caminho canônico da busca binária (40 gavetas)
export const CAMINHO = Object.freeze([20, 10, 15, 12, 11]);

export const ROTINA = Object.freeze([
  "início ← 1",
  "fim ← 40",
  "enquanto início ≤ fim:",
  "    meio ← (início + fim) ÷ 2, arredondado para baixo",
  "    abrir a gaveta número meio",
  `    se o número escrito nela = ${ALVO}: parar`,
  `    se o número escrito nela < ${ALVO}: início ← meio + 1`,
  "    senão: fim ← meio − 1",
]);

export const TITULO_PAPEL_ARQUIVO = "Rotina do arquivo";

export const PALAVRA_E02 = "LUTAR";
export const SENHA_E02 = "LUTAR";
export const TOTAL_GAVETAS = NUMEROS.length;

export function numeroDaGaveta(posicao) {
  return NUMEROS[posicao - 1] ?? null;
}

export function etiquetaDaGaveta(posicao) {
  return ETIQUETAS[posicao - 1] ?? null;
}

// abertas: array de posições 1-based na ordem em que foram abertas
export function validarCaminho(abertas) {
  if (!Array.isArray(abertas) || abertas.length !== CAMINHO.length) {
    return false;
  }
  return CAMINHO.every((posicao, i) => abertas[i] === posicao);
}

export function etiquetasDoCaminho(abertas) {
  if (!validarCaminho(abertas)) {
    return null;
  }
  const palavra = CAMINHO.map((posicao) => etiquetaDaGaveta(posicao)).join("");
  return palavra === PALAVRA_E02 ? palavra : null;
}

export function validarCadeadoE02(rodas, linguetaAcionada) {
  if (!linguetaAcionada) {
    return { ok: false, motivo: "lingueta-inativa" };
  }
  const combinacao = Array.isArray(rodas) ? rodas.join("") : "";
  if (combinacao !== SENHA_E02) {
    return { ok: false, motivo: "combinacao" };
  }
  return { ok: true, motivo: "aberto" };
}
