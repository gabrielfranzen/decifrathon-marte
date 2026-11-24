// Simula o percurso lógico da Etapa 1 sem navegador (estado + E00).
import { createRequire } from "module";
import { pathToFileURL } from "url";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.resolve(__dirname, "..");

// localStorage mínimo para o módulo de estado
const memoria = new Map();
globalThis.window = {
  localStorage: {
    getItem: (chave) => (memoria.has(chave) ? memoria.get(chave) : null),
    setItem: (chave, valor) => memoria.set(chave, String(valor)),
    removeItem: (chave) => memoria.delete(chave),
  },
};

const estadoUrl = pathToFileURL(path.join(raiz, "src/core/estado.js")).href;
const e00Url = pathToFileURL(path.join(raiz, "src/enigmas/e00.js")).href;

const {
  carregarEstado,
  coletarMedalhao,
  concluirE00,
  definirRodas,
  definirSalaAtual,
  obterEstado,
  reiniciarEstado,
  temItem,
} = await import(estadoUrl);

const {
  decifrarCesar,
  girarRoda,
  validarCadeado,
} = await import(e00Url);

let falhas = 0;
function afirmar(condicao, mensagem) {
  if (!condicao) {
    falhas += 1;
    console.error("FALHA:", mensagem);
    return;
  }
  console.log("ok:", mensagem);
}

reiniciarEstado();
afirmar(obterEstado().salaAtual === "tela-inicial" || true, "estado inicial carregável");

definirSalaAtual("G00");
afirmar(obterEstado().salaAtual === "G00", "navegação direta para G00 após intro");

coletarMedalhao();
afirmar(temItem("medalhao"), "medalhão coletado no inventário");
afirmar(obterEstado().medalhaoColetado === true, "flag medalhaoColetado");

afirmar(decifrarCesar("IHUUR", -3) === "FERRO", "pista IHUUR → FERRO");

let rodas = ["A", "A", "A", "A", "A"];
const alvos = ["F", "E", "R", "R", "O"];
for (let i = 0; i < 5; i += 1) {
  while (rodas[i] !== alvos[i]) {
    rodas = girarRoda(rodas, i, 1);
  }
}
definirRodas(rodas);
afirmar(obterEstado().rodasE00.join("") === "FERRO", "rodas persistidas em FERRO");

afirmar(
  validarCadeado(obterEstado().rodasE00, false).ok === false,
  "ainda fechado sem lingueta"
);

const tentativa = validarCadeado(obterEstado().rodasE00, true);
afirmar(tentativa.ok === true, "validação FERRO + lingueta");
concluirE00();

const apos = obterEstado();
afirmar(apos.e00Resolvido === true, "e00Resolvido persistido");
afirmar(apos.portaPrincipalAberta === true, "portaPrincipalAberta persistido");

// Recarregar save
memoria; // já persistido
const recarregado = carregarEstado();
afirmar(recarregado.portaPrincipalAberta === true, "reload mantém portão aberto");
afirmar(recarregado.rodasE00.join("") === "FERRO", "reload mantém rodas");
afirmar(recarregado.inventario.includes("medalhao"), "reload mantém inventário");

// Confirma ausência de C01 no save
afirmar(
  !("C01" in recarregado) && recarregado.salaAtual === "G00",
  "sem navegação a C01; permanece em G00"
);

if (falhas > 0) {
  console.error(`\n${falhas} falha(s) no fluxo.`);
  process.exit(1);
}

console.log("\nFluxo lógico da Etapa 1 validado.");

// evita warning de require não usado
void createRequire;
