import { tocar } from "../core/audio.js";
import { concluirE04, obterEstado } from "../core/estado.js";
import {
  ARQUIVOS,
  ROTEIRO,
  coordenada,
  criarPartida,
  jogar,
} from "../enigmas/xadrez-nucleo.js";
import { criarHotspot } from "./fotografia.js";

const SIMBOLOS = {
  rei: "♚",
  dama: "♛",
  torre: "♜",
  bispo: "♝",
  cavalo: "♞",
  peao: "♟",
};
const TEXTO = "\uFE0E";

function movimentoReduzido() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function tempo(ms) {
  return movimentoReduzido() ? 0 : ms;
}

function criarElemento(tag, classe, texto) {
  const el = document.createElement(tag);
  if (classe) {
    el.className = classe;
  }
  if (texto != null && texto !== "") {
    el.textContent = texto;
  }
  return el;
}

function criarBotao(classe, texto, rotulo) {
  const botao = document.createElement("button");
  botao.type = "button";
  if (classe) {
    botao.className = classe;
  }
  if (texto != null) {
    botao.textContent = texto;
  }
  if (rotulo) {
    botao.setAttribute("aria-label", rotulo);
  }
  return botao;
}

// Close-up da Última Partida. aoVencer dispara após o mate (já com e04 marcado).
export function abrirPainelXadrez({ container, aoFechar, aoVencer } = {}) {
  const existente = document.querySelector(".xz-root");
  if (existente) {
    existente.remove();
  }

  const estadoJogo = obterEstado();
  let partida = criarPartida();
  let concluido = Boolean(estadoJogo.e04Resolvido);
  let travado = false;
  const pecas = new Map();
  const temporizadores = [];
  const agendar = (funcao, ms) =>
    temporizadores.push(window.setTimeout(funcao, tempo(ms)));

  const raiz = document.createElement("div");
  raiz.className = "xz-root";
  raiz.setAttribute("role", "dialog");
  raiz.setAttribute("aria-modal", "true");
  raiz.setAttribute("aria-label", "A Última Partida");

  const cena = document.createElement("div");
  cena.className = "xz-scene";

  const painel = document.createElement("div");
  painel.className = "xz-painel";

  const cena3d = criarElemento("div", "tabuleiro-cena");
  const moldura = criarElemento("div", "tabuleiro-moldura");
  const palco = criarElemento("div", "palco-xadrez");
  const grade = criarElemento("div", "grade-xadrez");
  const camadaPecas = criarElemento("div", "pecas-xadrez");
  palco.append(grade, camadaPecas);
  moldura.append(palco);
  cena3d.append(moldura);

  const mensagem = criarElemento("p", "mensagem-xadrez");
  mensagem.setAttribute("role", "status");

  function limparTemporizadores() {
    temporizadores.forEach((id) => window.clearTimeout(id));
    temporizadores.length = 0;
  }

  function fechar() {
    limparTemporizadores();
    document.removeEventListener("keydown", aoTeclar);
    raiz.remove();
    if (aoFechar) {
      aoFechar();
    }
  }

  function aoTeclar(evento) {
    if (evento.key === "Escape" && !travado) {
      fechar();
    }
  }

  function posicionar(elemento, casa) {
    const { arquivo, fileira } = coordenada(casa);
    elemento.style.transform = `translate(${arquivo * 100}%, ${(7 - fileira) * 100}%)`;
  }

  function criarPeca(id, tipo, inimiga) {
    const peca = criarElemento(
      "span",
      `peca ${inimiga ? "peca-inimiga" : "peca-heroi"} peca-${tipo}`
    );
    peca.append(
      criarElemento("span", "peca-figura", SIMBOLOS[tipo] + TEXTO)
    );
    peca.setAttribute("aria-hidden", "true");
    camadaPecas.append(peca);
    pecas.set(id, peca);
    return peca;
  }

  function montarPecas() {
    camadaPecas.replaceChildren();
    pecas.clear();
    partida.inimigas.forEach((inimiga) =>
      posicionar(criarPeca(inimiga.id, inimiga.tipo, true), inimiga.casa)
    );
    posicionar(criarPeca("heroi", "cavalo", false), partida.cavalo);
  }

  function atualizarPecas() {
    const vivas = new Set(partida.inimigas.map((peca) => peca.id));
    for (const [id, elemento] of pecas) {
      if (id === "heroi") {
        continue;
      }
      if (!vivas.has(id)) {
        elemento.classList.add("capturada");
        continue;
      }
      elemento.classList.remove("capturada", "atacando");
      posicionar(
        elemento,
        partida.inimigas.find((peca) => peca.id === id).casa
      );
    }
    const heroi = pecas.get("heroi");
    heroi.classList.remove("caida");
    posicionar(heroi, partida.cavalo);
  }

  function desenharCasas() {
    grade.replaceChildren();
    for (let fileira = 8; fileira >= 1; fileira -= 1) {
      ARQUIVOS.forEach((arquivo, indiceArquivo) => {
        const id = `${arquivo}${fileira}`;
        const casa = criarBotao("casa-xadrez", null, `Casa ${id}`);
        casa.classList.add(
          (indiceArquivo + fileira) % 2 === 1 ? "escura" : "clara"
        );
        if (indiceArquivo === 0) {
          casa.append(
            criarElemento("span", "coord coord-fileira", String(fileira))
          );
        }
        if (fileira === 1) {
          casa.append(
            criarElemento("span", "coord coord-arquivo", arquivo)
          );
        }
        casa.disabled = concluido;
        casa.addEventListener("click", () => tentarSalto(id));
        grade.append(casa);
      });
    }
  }

  function definirMensagem(texto, tipo = "") {
    mensagem.textContent = texto;
    mensagem.dataset.tipo = tipo;
  }

  function sacudir() {
    moldura.classList.remove("alerta");
    void moldura.offsetWidth;
    moldura.classList.add("alerta");
  }

  function limparAmeaca() {
    for (const elemento of pecas.values()) {
      elemento.classList.remove("ameacando", "em-perigo");
    }
  }

  function marcarAmeaca(id) {
    if (!id) {
      return;
    }
    pecas.get(id)?.classList.add("ameacando");
    pecas.get("heroi")?.classList.add("em-perigo");
    definirMensagem("Ele está sob ameaça.", "perigo");
  }

  function animarLances(lances, ameaca) {
    lances.forEach((estadoLance, i) => {
      agendar(() => {
        partida = estadoLance;
        atualizarPecas();
        tocar("giro");
      }, 350 + i * 600);
    });
    agendar(() => {
      marcarAmeaca(ameaca);
      travado = false;
    }, 350 + lances.length * 600);
  }

  function vencer() {
    concluido = true;
    desenharCasas();
    definirMensagem("XEQUE-MATE", "mate");
    tocar("acerto");
    const heroi = pecas.get("heroi");
    const rei = pecas.get("rei");
    const casaRei = partida.inimigas.find((peca) => peca.id === "rei").casa;
    rei?.classList.add("em-mate");
    agendar(() => {
      heroi.classList.add("tomando");
      posicionar(heroi, casaRei);
      tocar("giro");
    }, 1300);
    agendar(() => rei?.classList.add("tomado"), 1650);
    agendar(() => {
      concluirE04();
      fechar();
      if (aoVencer) {
        aoVencer();
      }
    }, 3200);
  }

  function tentarSalto(destino) {
    if (travado || concluido) {
      return;
    }
    const resultado = jogar(partida, destino);

    if (resultado.tipo === "impossivel") {
      definirMensagem("Ele não chega lá.", "erro");
      tocar("erro");
      sacudir();
      return;
    }
    if (resultado.tipo === "ocupada") {
      definirMensagem("Essa não é a presa.", "erro");
      tocar("erro");
      sacudir();
      return;
    }

    travado = true;
    limparAmeaca();
    const heroi = pecas.get("heroi");
    posicionar(heroi, destino);
    tocar("giro");
    definirMensagem("");

    if (resultado.tipo === "morte") {
      const atacante = pecas.get(resultado.atacante);
      agendar(() => {
        atacante.classList.add("atacando");
        posicionar(atacante, destino);
        tocar("giro");
      }, 420);
      agendar(() => {
        heroi.classList.add("caida");
        tocar("erro");
        definirMensagem(
          `${resultado.nome} o alcançou em ${destino}.`,
          "perigo"
        );
      }, 820);
      agendar(() => {
        partida = criarPartida();
        montarPecas();
        desenharCasas();
        definirMensagem("Tudo recomeça.", "perigo");
        travado = false;
      }, 2400);
      return;
    }

    partida = resultado.partida;
    agendar(() => {
      desenharCasas();
      if (resultado.tipo === "vitoria") {
        vencer();
        return;
      }
      animarLances(resultado.lances, resultado.ameaca);
    }, 450);
  }

  const cabeca = criarElemento("div", "xadrez-frases");
  cabeca.append(
    criarElemento("p", "frase-caca", "Aplique o último movimento."),
    criarElemento(
      "p",
      "frase-caca frase-menor",
      "A partida ainda aguarda o lance final."
    )
  );

  painel.append(cabeca, cena3d, mensagem);
  cena.append(painel);
  raiz.append(cena);

  document.addEventListener("keydown", aoTeclar);

  raiz.append(
    criarHotspot({
      id: "voltar-xadrez",
      rotulo: "Afastar-se do tabuleiro",
      tipo: "passagem",
      classeExtra: "hotspot-saida-baixa xz-voltar",
      estilo: {
        left: "36%",
        top: "90%",
        width: "28%",
        height: "8%",
        zIndex: "20",
      },
      aoAtivar: () => {
        if (travado) {
          return;
        }
        tocar("passo");
        fechar();
      },
    })
  );

  if (concluido) {
    ROTEIRO.forEach(({ destino }) => {
      const resultado = jogar(partida, destino);
      partida = resultado.lances
        ? resultado.lances[resultado.lances.length - 1]
        : resultado.partida;
    });
  }
  montarPecas();
  desenharCasas();
  if (concluido) {
    definirMensagem("XEQUE-MATE", "mate");
  }

  const alvo = container || document.getElementById("app");
  alvo?.append(raiz);

  return { fechar, raiz };
}
