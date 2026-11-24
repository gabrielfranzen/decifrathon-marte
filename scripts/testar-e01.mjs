// Testes da lógica canônica E01 — As Quatro Cartas (sem UI / sem spoiler automático).
import {
  CARTAS,
  ORDEM_CORRETA,
  PALAVRA_E01,
  PISTAS,
  SENHA_E01,
  cartaPorId,
  extrairLuto,
  idsForaDasCasas,
  validarCadeadoE01,
  validarCasas,
} from "../src/enigmas/e01.js";

let falhas = 0;

function afirmar(condicao, mensagem) {
  if (!condicao) {
    falhas += 1;
    console.error("FALHA:", mensagem);
    return;
  }
  console.log("ok:", mensagem);
}

afirmar(CARTAS.length === 10, "dez cartas canônicas");
afirmar(
  ORDEM_CORRETA.join(",") === "espadas,copas,ouros,paus",
  "ordem correta espadas → copas → ouros → paus"
);
afirmar(PISTAS.length === 7, "sete pistas");
afirmar(PALAVRA_E01 === "LUTO" && SENHA_E01 === "LUTO", "senha canônica LUTO");

afirmar(validarCasas(ORDEM_CORRETA) === true, "validarCasas aceita ordem correta");
afirmar(
  validarCasas(["copas", "espadas", "ouros", "paus"]) === false,
  "validarCasas rejeita ordem errada"
);
afirmar(validarCasas([null, null, null, null]) === false, "slots vazios não validam");

afirmar(extrairLuto(ORDEM_CORRETA) === "LUTO", "extrairLuto na ordem correta → LUTO");
afirmar(extrairLuto(["paus", "ouros", "copas", "espadas"]) === null, "extrairLuto rejeita ordem errada");

const letras = ORDEM_CORRETA.map((id) => {
  const carta = cartaPorId(id);
  return carta.palavra.charAt(carta.numero - 1);
});
afirmar(letras.join("") === "LUTO", "regra palavra[numero-1] produz LUTO");

const casasParciais = ["espadas", null, "ouros", null];
const fora = idsForaDasCasas(casasParciais);
afirmar(!fora.includes("espadas") && !fora.includes("ouros"), "ids nas casas saem da mão");
afirmar(fora.length === 8, "oito ids restantes fora das casas");
afirmar(new Set(fora).size === fora.length, "sem IDs duplicados na mão");

// Simula colocar "copas" no slot 1 já ocupado por "copas-cinzas"
const casasAntes = ["espadas", "copas-cinzas", "ouros", null];
const maoComCopas = idsForaDasCasas(casasAntes);
afirmar(maoComCopas.includes("copas"), "copas está na mão antes da troca");
const casasDepois = ["espadas", "copas", "ouros", null];
const maoDepois = [
  ...maoComCopas.filter((id) => id !== "copas"),
  "copas-cinzas",
];
const todosDepois = [...casasDepois.filter(Boolean), ...maoDepois];
afirmar(
  todosDepois.length === CARTAS.length &&
    new Set(todosDepois).size === CARTAS.length,
  "troca em slot ocupado não duplica nem perde carta"
);
afirmar(casasDepois[1] === "copas", "slot 1 recebe a carta nova");
afirmar(maoDepois.includes("copas-cinzas"), "ocupante volta à mão");

afirmar(
  validarCadeadoE01(["L", "U", "T", "O"], false).motivo === "lingueta-inativa",
  "LUTO sem lingueta não abre"
);
afirmar(
  validarCadeadoE01(["A", "A", "A", "A"], true).motivo === "combinacao",
  "lingueta com combinação errada falha"
);
afirmar(
  validarCadeadoE01(["L", "U", "T", "O"], true).ok === true,
  "LUTO + lingueta abre"
);

if (falhas > 0) {
  console.error(`\n${falhas} falha(s) em E01.`);
  process.exit(1);
}

console.log("\nTodos os testes E01 passaram.");
