import { frasesIntroducao } from "../dados/introducao.js";

const DURACAO_FADE_FRASE_MS = 350;

export function criarIntroducao({ aoConcluir }) {
  let indiceFrase = 0;
  let emTransicao = false;

  const cena = document.createElement("section");
  cena.className = "cena introducao";
  cena.setAttribute("aria-label", "Introdução narrativa");

  const frase = document.createElement("p");
  frase.className = "introducao__frase";
  frase.textContent = frasesIntroducao[indiceFrase];

  const controles = document.createElement("div");
  controles.className = "introducao__controles";

  const botaoAvancar = document.createElement("button");
  botaoAvancar.type = "button";
  botaoAvancar.className = "botao-texto";
  botaoAvancar.textContent = "Avançar";

  const botaoPular = document.createElement("button");
  botaoPular.type = "button";
  botaoPular.className = "botao-texto botao-texto--secundario";
  botaoPular.textContent = "Pular";

  function concluirIntroducao() {
    aoConcluir();
  }

  function mostrarProximaFrase() {
    if (emTransicao) {
      return;
    }

    if (indiceFrase >= frasesIntroducao.length - 1) {
      concluirIntroducao();
      return;
    }

    emTransicao = true;
    frase.classList.add("introducao__frase--ocultando");

    window.setTimeout(() => {
      indiceFrase += 1;
      frase.textContent = frasesIntroducao[indiceFrase];
      frase.classList.remove("introducao__frase--ocultando");
      emTransicao = false;
    }, DURACAO_FADE_FRASE_MS);
  }

  botaoAvancar.addEventListener("click", mostrarProximaFrase);
  botaoPular.addEventListener("click", concluirIntroducao);

  controles.append(botaoPular, botaoAvancar);
  cena.append(frase, controles);
  return cena;
}
