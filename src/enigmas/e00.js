import { obterAlfabeto } from "../core/estado.js";

export const INSCRICAO_E00 = "IHUUR";
export const SENHA_E00 = "FERRO";
export const DESLOCAMENTO_CESAR = -3;

export const ALFABETO = obterAlfabeto();

export function girarLetra(letra, sinal) {
  const atual = String(letra || "A").toUpperCase();
  const indice = ALFABETO.indexOf(atual);
  if (indice < 0) {
    return "A";
  }

  const delta = Number(sinal) || 0;
  return ALFABETO[(indice + delta + 26) % 26];
}

export function girarRoda(rodas, indiceRoda, sinal) {
  const copia = Array.isArray(rodas) ? [...rodas] : ["A", "A", "A", "A", "A"];
  if (indiceRoda < 0 || indiceRoda >= copia.length) {
    return copia;
  }

  copia[indiceRoda] = girarLetra(copia[indiceRoda], sinal);
  return copia;
}

export function decifrarCesar(texto, deslocamento = DESLOCAMENTO_CESAR) {
  return String(texto || "")
    .toUpperCase()
    .split("")
    .map((caractere) => {
      const indice = ALFABETO.indexOf(caractere);
      if (indice < 0) {
        return caractere;
      }
      return ALFABETO[(indice + deslocamento + 26) % 26];
    })
    .join("");
}

export function validarCadeado(rodas, linguetaAcionada) {
  if (!linguetaAcionada) {
    return { ok: false, motivo: "lingueta-inativa" };
  }

  const combinacao = Array.isArray(rodas) ? rodas.join("") : "";
  if (combinacao !== SENHA_E00) {
    return { ok: false, motivo: "combinacao" };
  }

  return { ok: true, motivo: "aberto" };
}

export function janelaDaRoda(letra) {
  return {
    anterior: girarLetra(letra, -1),
    atual: String(letra || "A").toUpperCase(),
    seguinte: girarLetra(letra, 1),
  };
}

export function girarIndice(indice, passos) {
  const base = Number.isInteger(indice) ? indice : 0;
  const delta = Number.isInteger(passos) ? passos : 0;
  return ((base + delta) % 26 + 26) % 26;
}

export function deslocamentoEntre(externo, interno) {
  let diferenca = ((interno - externo) % 26 + 26) % 26;
  if (diferenca > 13) {
    diferenca -= 26;
  }
  return diferenca;
}

export function formatarDeslocamento(valor) {
  if (valor === 0) {
    return "0";
  }
  const sinal = valor < 0 ? "−" : "+";
  return `${sinal}${Math.abs(valor)}`;
}

export function letraNoIndice(indice) {
  return ALFABETO[((indice % 26) + 26) % 26];
}
