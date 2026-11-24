import { imagensAmbientes } from "../dados/imagens.js";

export function criarTelaInicial({ aoIniciar, aoContinuar, aoVerFinal } = {}) {
  const cena = document.createElement("section");
  cena.className = "cena tela-inicial";
  cena.setAttribute("aria-label", "Tela inicial");

  const fundo = document.createElement("div");
  fundo.className = "tela-inicial__fundo";
  fundo.style.backgroundImage = `url("${imagensAmbientes.g00a}")`;
  fundo.setAttribute("aria-hidden", "true");

  const vinheta = document.createElement("div");
  vinheta.className = "tela-inicial__vinheta";
  vinheta.setAttribute("aria-hidden", "true");

  const painel = document.createElement("aside");
  painel.className = "tela-inicial__painel";

  const titulo = document.createElement("h1");
  titulo.className = "tela-inicial__titulo";
  titulo.innerHTML = "O Último<br />Movimento";

  const acoes = document.createElement("nav");
  acoes.className = "tela-inicial__acoes";
  acoes.setAttribute("aria-label", "Menu principal");

  const botaoIniciar = document.createElement("button");
  botaoIniciar.type = "button";
  botaoIniciar.className = "tela-inicial__opcao";
  botaoIniciar.textContent = "Iniciar";
  botaoIniciar.addEventListener("click", () => {
    aoIniciar();
  });
  acoes.append(botaoIniciar);

  if (typeof aoContinuar === "function") {
    const botaoContinuar = document.createElement("button");
    botaoContinuar.type = "button";
    botaoContinuar.className =
      "tela-inicial__opcao tela-inicial__opcao--secundaria";
    botaoContinuar.textContent = "Continuar";
    botaoContinuar.addEventListener("click", () => {
      aoContinuar();
    });
    acoes.append(botaoContinuar);
  }

  if (typeof aoVerFinal === "function") {
    const botaoFinal = document.createElement("button");
    botaoFinal.type = "button";
    botaoFinal.className =
      "tela-inicial__opcao tela-inicial__opcao--secundaria";
    botaoFinal.textContent = "Ver o final";
    botaoFinal.addEventListener("click", () => {
      aoVerFinal();
    });
    acoes.append(botaoFinal);
  }

  painel.append(titulo, acoes);
  cena.append(fundo, vinheta, painel);
  return cena;
}
