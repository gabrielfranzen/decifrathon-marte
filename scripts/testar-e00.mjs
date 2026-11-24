import {
  decifrarCesar,
  girarLetra,
  girarRoda,
  janelaDaRoda,
  SENHA_E00,
  validarCadeado,
} from "../src/enigmas/e00.js";

let falhas = 0;

function afirmar(condicao, mensagem) {
  if (!condicao) {
    falhas += 1;
    console.error("FALHA:", mensagem);
    return;
  }
  console.log("ok:", mensagem);
}

afirmar(decifrarCesar("IHUUR", -3) === "FERRO", "César −3: IHUUR → FERRO");
afirmar(girarLetra("A", 1) === "B", "girarLetra A+1 = B");
afirmar(girarLetra("A", -1) === "Z", "girarLetra A-1 = Z");
afirmar(girarLetra("Z", 1) === "A", "girarLetra Z+1 = A");

let rodas = ["A", "A", "A", "A", "A"];
for (let i = 0; i < 5; i += 1) {
  rodas = girarRoda(rodas, 0, 1);
}
afirmar(rodas[0] === "F", "cinco passos na roda 0 chegam a F");

afirmar(
  validarCadeado(["F", "E", "R", "R", "O"], false).motivo === "lingueta-inativa",
  "FERRO sem lingueta não abre"
);
afirmar(
  validarCadeado(["A", "A", "A", "A", "A"], true).motivo === "combinacao",
  "lingueta com combinação errada falha"
);
afirmar(
  validarCadeado(["F", "E", "R", "R", "O"], true).ok === true,
  "FERRO + lingueta abre"
);
afirmar(SENHA_E00 === "FERRO", "senha canônica FERRO");

const janela = janelaDaRoda("F");
afirmar(
  janela.anterior === "E" && janela.atual === "F" && janela.seguinte === "G",
  "janela da roda em F mostra E/F/G"
);

if (falhas > 0) {
  console.error(`\n${falhas} teste(s) falharam.`);
  process.exit(1);
}

console.log("\nTodos os testes de E00 passaram.");
