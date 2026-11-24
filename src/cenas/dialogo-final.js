import { frasesFinal } from "../dados/final-dialogo.js";
import { mostrarHud } from "../interface/hud.js";

const DURACAO_FADE_FRASE_MS = 350;
const DURACAO_SAIDA_MS = 500;

function movimentoReduzido() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Overlay automático sobre o capacete; avança sozinho nos tempos de frasesFinal
export function abrirDialogoFinal() {
  return new Promise((resolver) => {
    let indiceFrase = 0;
    let concluido = false;
    const temporizadores = [];

    mostrarHud(false);

    const overlay = document.createElement("section");
    overlay.className = "introducao dialogo-final";
    overlay.setAttribute("aria-label", "Diálogo final");
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");

    const frase = document.createElement("p");
    frase.className = "introducao__frase";
    frase.textContent = frasesFinal[0]?.texto ?? "";

    function agendar(fn, ms) {
      const id = window.setTimeout(fn, ms);
      temporizadores.push(id);
      return id;
    }

    function limparTemporizadores() {
      temporizadores.forEach((id) => window.clearTimeout(id));
      temporizadores.length = 0;
    }

    function encerrar() {
      if (concluido) {
        return;
      }
      concluido = true;
      limparTemporizadores();
      // Vai a preto (não revela a mesa); a revelação assume em seguida
      overlay.classList.add("dialogo-final--para-preto");
      window.setTimeout(() => {
        resolver();
        window.setTimeout(() => overlay.remove(), movimentoReduzido() ? 0 : 1200);
      }, movimentoReduzido() ? 0 : DURACAO_SAIDA_MS);
    }

    function mostrarFrase(indice) {
      if (concluido) {
        return;
      }
      if (indice >= frasesFinal.length) {
        encerrar();
        return;
      }

      const entrada = frasesFinal[indice];
      const aplicar = () => {
        if (concluido) {
          return;
        }
        frase.textContent = entrada.texto;
        frase.classList.remove("introducao__frase--ocultando");
        const leituraMs = Math.max(800, Number(entrada.duracaoMs) || 2800);
        agendar(() => mostrarFrase(indice + 1), leituraMs);
      };

      if (indice === 0 || movimentoReduzido()) {
        aplicar();
        return;
      }

      frase.classList.add("introducao__frase--ocultando");
      agendar(aplicar, DURACAO_FADE_FRASE_MS);
    }

    overlay.append(frase);
    document.getElementById("app").append(overlay);
    window.requestAnimationFrame(() => {
      overlay.classList.add("dialogo-final--visivel");
      mostrarFrase(0);
    });
  });
}
