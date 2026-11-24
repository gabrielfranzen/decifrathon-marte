import { tocar } from "../core/audio.js";
import {
  definirGavetasAbertas,
  obterEstado,
} from "../core/estado.js";
import {
  ETIQUETAS,
  NUMEROS,
  TOTAL_GAVETAS,
} from "../enigmas/e02.js";

function criarGaveta(posicao) {
  const indice = posicao - 1;
  const botao = document.createElement("button");
  botao.type = "button";
  botao.className = "eg-gaveta";
  botao.dataset.posicao = String(posicao);
  botao.setAttribute("aria-label", `Gaveta ${posicao}`);

  const corpo = document.createElement("span");
  corpo.className = "eg-gaveta-corpo";

  const topo = document.createElement("span");
  topo.className = "eg-gaveta-topo";
  const numero = document.createElement("span");
  numero.className = "eg-gaveta-numero";
  numero.textContent = String(NUMEROS[indice]);
  const etiqueta = document.createElement("span");
  etiqueta.className = "eg-gaveta-etiqueta";
  etiqueta.textContent = ETIQUETAS[indice];
  topo.append(numero, etiqueta);

  const frente = document.createElement("span");
  frente.className = "eg-gaveta-frente";
  const placa = document.createElement("span");
  placa.className = "eg-gaveta-placa";
  placa.textContent = String(posicao);
  const puxador = document.createElement("span");
  puxador.className = "eg-gaveta-puxador";
  const revelacao = document.createElement("span");
  revelacao.className = "eg-gaveta-revelacao";
  revelacao.setAttribute("aria-hidden", "true");
  const revelacaoNumero = document.createElement("span");
  revelacaoNumero.className = "eg-gaveta-numero";
  revelacaoNumero.textContent = String(NUMEROS[indice]);
  const revelacaoEtiqueta = document.createElement("span");
  revelacaoEtiqueta.className = "eg-gaveta-etiqueta";
  revelacaoEtiqueta.textContent = ETIQUETAS[indice];
  revelacao.append(revelacaoNumero, revelacaoEtiqueta);
  frente.append(placa, puxador, revelacao);

  const ladoEsq = document.createElement("span");
  ladoEsq.className = "eg-gaveta-lado eg-gaveta-lado-esq";
  const ladoDir = document.createElement("span");
  ladoDir.className = "eg-gaveta-lado eg-gaveta-lado-dir";

  corpo.append(topo, ladoEsq, ladoDir, frente);
  botao.append(corpo);

  botao.abrir = () => {
    botao.classList.add("aberta");
    botao.setAttribute(
      "aria-label",
      `Gaveta ${posicao}: número ${NUMEROS[indice]}, etiqueta ${ETIQUETAS[indice]}`
    );
  };

  botao.fechar = () => {
    botao.classList.remove("aberta");
    botao.setAttribute("aria-label", `Gaveta ${posicao}`);
  };

  return botao;
}

export function montarEstanteGavetas(container) {
  const estado = obterEstado();
  let abertas = [...(estado.gavetasAbertas || [])];

  const raiz = document.createElement("div");
  raiz.className = "eg-root";
  raiz.id = "estante-gavetas-e02";
  raiz.setAttribute("aria-label", "Arquivo de gavetas");

  const cena = document.createElement("div");
  cena.className = "eg-scene";

  const painel = document.createElement("div");
  painel.className = "eg-painel eg-painel--so-gavetas";

  const movel = document.createElement("div");
  movel.className = "eg-movel";
  movel.setAttribute("aria-label", "Estante com quarenta gavetas");

  const estante = document.createElement("div");
  estante.className = "eg-estante";
  const gavetas = [];

  function persistirAbertas() {
    definirGavetasAbertas(abertas);
  }

  for (let posicao = 1; posicao <= TOTAL_GAVETAS; posicao += 1) {
    const gaveta = criarGaveta(posicao);
    gaveta.addEventListener("click", () => {
      if (gaveta.classList.contains("aberta")) {
        return;
      }
      gaveta.abrir();
      tocar("papel");
      abertas.push(posicao);
      persistirAbertas();
    });
    gavetas.push(gaveta);
    estante.append(gaveta);
  }

  movel.append(estante);

  const rodape = document.createElement("div");
  rodape.className = "eg-rodape";

  const botaoFechar = document.createElement("button");
  botaoFechar.type = "button";
  botaoFechar.className = "eg-botao";
  botaoFechar.textContent = "Fechar as gavetas";
  botaoFechar.addEventListener("click", () => {
    gavetas.forEach((gaveta) => gaveta.fechar());
    abertas = [];
    persistirAbertas();
    tocar("papel");
  });

  rodape.append(botaoFechar);
  painel.append(movel, rodape);
  cena.append(painel);
  raiz.append(cena);
  container.append(raiz);

  for (const posicao of abertas) {
    const gaveta = gavetas[posicao - 1];
    if (gaveta) {
      gaveta.abrir();
    }
  }

  return { raiz };
}
