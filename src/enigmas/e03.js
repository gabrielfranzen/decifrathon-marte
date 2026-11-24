// Enigma E03 — Oito Alavancas (antecâmara C01C)
// Palavra-resultado visual: PASSAGEM

export const ROTINA = Object.freeze([
  "A5 ← NÃO (A2 OU A4)",
  "A2 ← NÃO A1",
  "A7 ← A3 OU NÃO A6",
  "A1 ← LIGADA",
  "A4 ← A1 OU A3",
  "A8 ← A6 E NÃO A7",
  "A6 ← A4 E NÃO A5",
  "A3 ← A1 E A2",
]);

export const LETRAS_LIGADA = Object.freeze([
  "P",
  "R",
  "C",
  "S",
  "D",
  "G",
  "T",
  "M",
]);

export const LETRAS_DESLIGADA = Object.freeze([
  "O",
  "A",
  "S",
  "I",
  "A",
  "N",
  "E",
  "U",
]);

// índice 0 = A1 … índice 7 = A8
export const ESTADO_CERTO = Object.freeze([
  true,
  false,
  false,
  true,
  false,
  true,
  false,
  true,
]);

export const PALAVRA_E03 = "PASSAGEM";
export const TOTAL_ALAVANCAS = 8;

export function normalizarAlavancas(estados) {
  if (!Array.isArray(estados) || estados.length !== TOTAL_ALAVANCAS) {
    return Array(TOTAL_ALAVANCAS).fill(false);
  }
  return estados.map((valor) => Boolean(valor));
}

export function extrairPalavra(estados) {
  const vetor = normalizarAlavancas(estados);
  return vetor
    .map((ligada, i) => (ligada ? LETRAS_LIGADA[i] : LETRAS_DESLIGADA[i]))
    .join("");
}

export function validarAlavancas(estados) {
  const vetor = normalizarAlavancas(estados);
  const ok = vetor.every((ligada, i) => ligada === ESTADO_CERTO[i]);
  return {
    ok,
    motivo: ok ? "aberto" : "combinacao",
    palavra: ok ? PALAVRA_E03 : extrairPalavra(vetor),
  };
}
