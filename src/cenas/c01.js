import { iniciarAudio, tocar, tocarAmbiente } from "../core/audio.js";
import {
  carregarAmbiente,
  estiloDeHotspot,
} from "../dados/ambientes.js";
import {
  obterFramesPerseguidorC01,
  obterImagemC01,
} from "../dados/imagens.js";
import {
  coletarEspada,
  definirSalaAtual,
  obterEstado,
  registrarPerseguidorC01Visto,
  temItem,
} from "../core/estado.js";
import {
  criarCenaFotografica,
  criarHotspot,
  exibirMensagemTemporaria,
} from "../interface/fotografia.js";
import { abrirExaminador } from "../interface/examinador.js";
import {
  definirLugar,
  garantirHud,
  mostrarHud,
  mostrarLegenda,
} from "../interface/hud.js";
import { anunciarItem } from "../interface/inventario.js";

const MSG_AINDA_NAO = "Ainda não explorável.";

// Já está na escada ao entrar; some após ~2,5s
const DURACAO_PERSEGUIDOR_MS = 2500;
const ATRASOS_PASSOS_ARMADURA_MS = Object.freeze([80, 780, 1480, 2180]);

function descricaoAlt({ armarioAberto, espadaColetada }) {
  if (espadaColetada) {
    return "Salão principal com armários abertos ao lado da escada; a espada já foi recolhida";
  }
  if (armarioAberto) {
    return "Salão principal com o armário direito aberto e uma espada à vista";
  }
  return "Salão principal do castelo com chão xadrez, escada central, armários e passagens laterais";
}

function guardarEspadaComoReliquia() {
  if (temItem("espada")) {
    return false;
  }
  coletarEspada();
  window.dispatchEvent(new CustomEvent("oum:inventario"));
  anunciarItem("espada");
  return true;
}

export async function criarC01({
  aoVoltar,
  aoIrEsquerda,
  aoIrDireita,
  aoSubirEscada,
} = {}) {
  definirSalaAtual("C01");
  garantirHud();
  mostrarHud(true);
  definirLugar("Salão Principal");
  iniciarAudio();
  tocarAmbiente("pedra");

  const ambiente = await carregarAmbiente("C01");
  let estado = obterEstado();
  let armarioAberto = Boolean(estado.e02Resolvido);
  let espadaColetada = Boolean(estado.espadaColetada || temItem("espada"));
  const mostrarPerseguidor = !estado.viuPerseguidorC01;
  const srcInicial = mostrarPerseguidor
    ? obterFramesPerseguidorC01()[0]
    : obterImagemC01({ armarioAberto, espadaColetada });

  const { cena, camadaHotspots, imagem, placeholder } = criarCenaFotografica({
    id: "c01",
    ariaLabel: "C01 — Salão principal do castelo",
    srcImagem: srcInicial,
    altImagem: descricaoAlt({ armarioAberto, espadaColetada }),
    idPendente: "C01",
  });

  function estilo(id, fallback) {
    return estiloDeHotspot(ambiente, id, fallback);
  }

  function lerEstadoCena() {
    estado = obterEstado();
    armarioAberto = Boolean(estado.e02Resolvido);
    espadaColetada = Boolean(estado.espadaColetada || temItem("espada"));
  }

  function atualizarFoto() {
    lerEstadoCena();
    const src = obterImagemC01({ armarioAberto, espadaColetada });
    imagem.alt = descricaoAlt({ armarioAberto, espadaColetada });
    if (imagem.getAttribute("src") === src) {
      return;
    }
    imagem.hidden = false;
    placeholder.hidden = true;
    imagem.src = src;
    imagem.addEventListener(
      "error",
      () => {
        imagem.hidden = true;
        placeholder.hidden = false;
      },
      { once: true }
    );
  }

  function limparHotspots() {
    camadaHotspots.replaceChildren();
  }

  function refrescarCena() {
    atualizarFoto();
    montarHotspots();
  }

  function montarHotspots() {
    limparHotspots();
    lerEstadoCena();

    camadaHotspots.append(
      criarHotspot({
        id: "esquerda",
        rotulo: "Ir à esquerda",
        tipo: "passagem",
        estilo: estilo("esquerda", {
          left: 2,
          top: 28,
          width: 14,
          height: 48,
          zIndex: 3,
        }),
        aoAtivar: () => {
          tocar("passo");
          if (aoIrEsquerda) {
            aoIrEsquerda();
            return;
          }
          exibirMensagemTemporaria(cena, MSG_AINDA_NAO);
        },
      }),
      criarHotspot({
        id: "direita",
        rotulo: "Ir à direita",
        tipo: "passagem",
        estilo: estilo("direita", {
          left: 84,
          top: 28,
          width: 14,
          height: 48,
          zIndex: 3,
        }),
        aoAtivar: () => {
          tocar("passo");
          if (aoIrDireita) {
            aoIrDireita();
            return;
          }
          exibirMensagemTemporaria(cena, MSG_AINDA_NAO);
        },
      }),
      criarHotspot({
        id: "escada",
        rotulo: "Subir a escada",
        tipo: "passagem",
        estilo: estilo("escada", {
          left: 36,
          top: 22,
          width: 28,
          height: 42,
          zIndex: 3,
        }),
        aoAtivar: () => {
          tocar("passo");
          if (aoSubirEscada) {
            aoSubirEscada();
            return;
          }
          exibirMensagemTemporaria(cena, MSG_AINDA_NAO);
        },
      }),
      criarHotspot({
        id: "armario-esquerdo",
        rotulo: "Examinar o armário esquerdo",
        estilo: estilo("armario-esquerdo", {
          left: 22,
          top: 28,
          width: 12,
          height: 42,
          zIndex: 5,
        }),
        aoAtivar: () => {
          tocar("papel");
          abrirExaminador({
            tipo: "armario-vazio",
            nomeObjeto: "Armário",
          });
        },
      })
    );

    // Um único hotspot do armário direito: cadeado → espada → vazio
    if (!armarioAberto) {
      camadaHotspots.append(
        criarHotspot({
          id: "armario-direito",
          rotulo: "Examinar o cadeado do armário",
          estilo: estilo("armario-direito", {
            left: 66,
            top: 28,
            width: 12,
            height: 42,
            zIndex: 5,
          }),
          aoAtivar: () => {
            tocar("papel");
            abrirExaminador({
              tipo: "cadeado-armario",
              nomeObjeto: "Cadeado do armário",
              aoAtualizarCena: () => {
                refrescarCena();
                mostrarLegenda(
                  "O armário cede. Há uma espada lá dentro.",
                  5200
                );
              },
            });
          },
        })
      );
    } else if (!espadaColetada) {
      camadaHotspots.append(
        criarHotspot({
          id: "armario-direito",
          rotulo: "Recolher a espada",
          estilo: estilo("armario-direito", {
            left: 66,
            top: 28,
            width: 12,
            height: 42,
            zIndex: 5,
          }),
          aoAtivar: () => {
            tocar("papel");
            guardarEspadaComoReliquia();
            refrescarCena();
            abrirExaminador({
              tipo: "espada",
              nasMaos: true,
              nomeObjeto: "Espada",
            });
          },
        })
      );
    } else {
      camadaHotspots.append(
        criarHotspot({
          id: "armario-direito",
          rotulo: "Examinar o armário direito",
          estilo: estilo("armario-direito", {
            left: 66,
            top: 28,
            width: 12,
            height: 42,
            zIndex: 5,
          }),
          aoAtivar: () => {
            tocar("papel");
            abrirExaminador({
              tipo: "armario-vazio",
              nomeObjeto: "Armário",
            });
          },
        })
      );
    }

    camadaHotspots.append(
      criarHotspot({
        id: "voltar",
        rotulo: "Voltar ao portão",
        tipo: "passagem",
        estilo: estilo("voltar", {
          left: 38,
          top: 82,
          width: 24,
          height: 14,
          zIndex: 4,
        }),
        aoAtivar: () => {
          tocar("passo");
          if (aoVoltar) {
            aoVoltar();
          }
        },
      })
    );
  }

  montarHotspots();
  window.addEventListener("oum:inventario", refrescarCena);

  // Primeira entrada: já aparece na escada; some após ~2,5s
  if (mostrarPerseguidor) {
    iniciarPassagemPerseguidor({
      imagem,
      camadaHotspots,
      obterSrcLimpa: () => {
        lerEstadoCena();
        return obterImagemC01({ armarioAberto, espadaColetada });
      },
    });
  }

  window.dispatchEvent(new CustomEvent("oum:cena", { detail: { id: "C01" } }));
  return cena;
}

function iniciarPassagemPerseguidor({ imagem, camadaHotspots, obterSrcLimpa }) {
  // Marca cedo para não repetir se o jogador sair no meio da passagem
  registrarPerseguidorC01Visto();
  camadaHotspots.style.pointerEvents = "none";

  let finalizado = false;

  function finalizarPassagem() {
    if (finalizado || !document.body.contains(imagem)) {
      return;
    }
    finalizado = true;
    imagem.classList.add("cena-foto__imagem--troca-frame");
    imagem.src = obterSrcLimpa();
    window.setTimeout(() => {
      imagem.classList.remove("cena-foto__imagem--troca-frame");
    }, 220);
    camadaHotspots.style.pointerEvents = "";
  }

  for (const atraso of ATRASOS_PASSOS_ARMADURA_MS) {
    window.setTimeout(() => {
      if (finalizado || !document.body.contains(imagem)) {
        return;
      }
      tocar("passoArmadura");
    }, atraso);
  }

  window.setTimeout(finalizarPassagem, DURACAO_PERSEGUIDOR_MS);
}
