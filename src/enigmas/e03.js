// Enigma E03 — Oito adagas (antecâmara C01C)
// Cima = ligada; baixo = desligada. Sem palavra-resultado.

export const TITULO_CARTA_ADAGAS = "Mapa das adagas";

export const ROTINA = Object.freeze([
  "D5 ← NÃO (D2 OU D4)",
  "D2 ← NÃO D1",
  "D7 ← D3 OU NÃO D6",
  "D1 ← LIGADA",
  "D4 ← D1 OU D3",
  "D8 ← D6 E NÃO D7",
  "D6 ← D4 E NÃO D5",
  "D3 ← D1 E D2",
]);

// índice 0 = D1 … índice 7 = D8
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

export const TOTAL_ADAGAS = 8;
export const TOTAL_TOCHAS = TOTAL_ADAGAS;
export const TOTAL_ALAVANCAS = TOTAL_ADAGAS;

export function normalizarAdagas(estados) {
  if (!Array.isArray(estados) || estados.length !== TOTAL_ADAGAS) {
    return Array(TOTAL_ADAGAS).fill(false);
  }
  return estados.map((valor) => Boolean(valor));
}

export function validarAdagas(estados) {
  const vetor = normalizarAdagas(estados);
  const ok = vetor.every((ligada, i) => ligada === ESTADO_CERTO[i]);
  return {
    ok,
    motivo: ok ? "aberto" : "combinacao",
  };
}

// Aliases de save / código antigo
export const normalizarTochas = normalizarAdagas;
export const validarTochas = validarAdagas;
export const normalizarAlavancas = normalizarAdagas;
export const validarAlavancas = validarAdagas;
