import {
  criarPartida,
  jogar,
  ROTEIRO,
  quemAtaca,
} from "../src/enigmas/xadrez-nucleo.js";

// Simula o que o painel faz: partida = resultado.partida (SEM lances)
let partida = criarPartida();
const r0 = jogar(partida, "e3");
console.log("após e3 (só proxima, sem respostas):", {
  tipo: r0.tipo,
  passo: r0.partida.passo,
  cavalo: r0.partida.cavalo,
  dama: r0.partida.inimigas.find((p) => p.id === "dama").casa,
});

partida = r0.partida;
console.log("g2 sem aplicar respostas:", jogar(partida, "g2").tipo);
console.log(
  "quemAtaca g2 sem respostas:",
  quemAtaca(partida, "g2")?.id || null
);

// Como o painel DEVERIA ficar após animarLances
partida = r0.lances[r0.lances.length - 1];
console.log("após aplicar respostas:", {
  passo: partida.passo,
  cavalo: partida.cavalo,
  dama: partida.inimigas.find((p) => p.id === "dama").casa,
});
const r1 = jogar(partida, "g2");
console.log("g2 com respostas aplicadas:", r1.tipo, r1.atacante || "");
console.log("quemAtaca g2:", quemAtaca(partida, "g2")?.id || null);

// Bug hipotético: se partida ficar com passo 0 após o visual
partida = criarPartida();
partida = { ...r0.partida, passo: 0, cavalo: "e3" };
console.log("hipótese passo stuck 0:", jogar(partida, "g2"));
