// Diálogo modal simples: pergunta + Cancelar / Sim

export function abrirConfirmacao({
  pergunta,
  rotuloCancelar = "Cancelar",
  rotuloConfirmar = "Sim",
  aoCancelar,
  aoConfirmar,
} = {}) {
  const existente = document.querySelector(".confirmacao");
  if (existente) {
    existente.remove();
  }

  const overlay = document.createElement("div");
  overlay.className = "confirmacao";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");

  const painel = document.createElement("div");
  painel.className = "confirmacao__painel";

  const texto = document.createElement("p");
  texto.className = "confirmacao__pergunta";
  texto.textContent = pergunta || "";

  const acoes = document.createElement("div");
  acoes.className = "confirmacao__acoes";

  const botaoCancelar = document.createElement("button");
  botaoCancelar.type = "button";
  botaoCancelar.className = "confirmacao__botao confirmacao__botao--secundario";
  botaoCancelar.textContent = rotuloCancelar;

  const botaoConfirmar = document.createElement("button");
  botaoConfirmar.type = "button";
  botaoConfirmar.className = "confirmacao__botao confirmacao__botao--primario";
  botaoConfirmar.textContent = rotuloConfirmar;

  function fechar() {
    document.removeEventListener("keydown", aoTeclar);
    overlay.remove();
  }

  function aoTeclar(evento) {
    if (evento.key === "Escape") {
      evento.preventDefault();
      fechar();
      if (aoCancelar) {
        aoCancelar();
      }
    }
  }

  botaoCancelar.addEventListener("click", () => {
    fechar();
    if (aoCancelar) {
      aoCancelar();
    }
  });

  botaoConfirmar.addEventListener("click", () => {
    fechar();
    if (aoConfirmar) {
      aoConfirmar();
    }
  });

  acoes.append(botaoCancelar, botaoConfirmar);
  painel.append(texto, acoes);
  overlay.append(painel);
  document.getElementById("app")?.append(overlay);
  document.addEventListener("keydown", aoTeclar);
  botaoConfirmar.focus();

  return { fechar };
}
