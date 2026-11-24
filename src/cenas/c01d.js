import { iniciarAudio, tocar, tocarAmbiente } from "../core/audio.js";
import {
  carregarAmbiente,
  estiloDeHotspot,
} from "../dados/ambientes.js";
import {
  obterImagemC01D,
  obterImagemRevelacaoC01D,
} from "../dados/imagens.js";
import {
  coletarElmo,
  definirSalaAtual,
  obterEstado,
} from "../core/estado.js";
import {
  criarCenaFotografica,
  criarHotspot,
  exibirMensagemTemporaria,
} from "../interface/fotografia.js";
import {
  definirLugar,
  garantirHud,
  mostrarHud,
} from "../interface/hud.js";
import { anunciarItem } from "../interface/inventario.js";
import { abrirPainelXadrez } from "../interface/painel-xadrez.js";

const MSG_PERSEGUIDOR =
  "Ele espera. A espada está no chão. O tabuleiro, entre vocês.";
const MSG_JA_VENCEU =
  "A partida já acabou. O elmo permanece sobre a mesa.";

let cenaC01DAtiva = null;
let montarHotspotsC01D = null;
let aoColetarElmoAtual = null;
let coletandoElmo = false;

// Troca a foto para o capacete na mesma sessão, sem sair da sala
export function aplicarRevelacaoC01D() {
  const cena = cenaC01DAtiva;
  if (!cena) {
    return;
  }
  const imagem = cena.querySelector(".cena-foto__imagem");
  if (imagem) {
    // Troca sólida: o fade do xadrez cobre a mudança
    imagem.src = obterImagemRevelacaoC01D();
    imagem.alt =
      "Capacete do perseguidor sobre a mesa; grande janela para o pátio do castelo";
    imagem.classList.remove(
      "cena-foto__imagem--revelando",
      "cena-foto__imagem--revelada"
    );
  }
  cena.setAttribute(
    "aria-label",
    "C01D — Mesa vazia com o capacete do perseguidor"
  );
  if (typeof montarHotspotsC01D === "function") {
    montarHotspotsC01D();
  }
}

export async function criarC01D({
  aoVoltar,
  aoVencerXadrez,
  aoColetarElmo = null,
  forcarPreVitoria = false,
  abrirVitoriaAutomatica = false,
  forcarColetaElmo = false,
} = {}) {
  definirSalaAtual("C01D");
  garantirHud();
  mostrarHud(true);
  definirLugar("A Última Partida");
  iniciarAudio();
  tocarAmbiente("pedra");
  aoColetarElmoAtual = aoColetarElmo;
  coletandoElmo = false;
  let elmoConsumidoNestaCena = false;
  const exigirColetaElmo = Boolean(forcarColetaElmo);

  const ambiente = await carregarAmbiente("C01D");
  const estilo = (id, fallback) => estiloDeHotspot(ambiente, id, fallback);
  const e04Resolvido =
    !forcarPreVitoria && Boolean(obterEstado().e04Resolvido);

  const { cena, camadaHotspots, palco } = criarCenaFotografica({
    id: "c01d",
    ariaLabel: e04Resolvido
      ? "C01D — Mesa vazia com o capacete do perseguidor"
      : "C01D — Sala do perseguidor: mesa com tabuleiro de xadrez, janela para o pátio",
    srcImagem: e04Resolvido
      ? obterImagemRevelacaoC01D()
      : obterImagemC01D(),
    altImagem: e04Resolvido
      ? "Capacete do perseguidor sobre a mesa; grande janela para o pátio do castelo"
      : "Perseguidor sentado à mesa com tabuleiro de xadrez; símbolo de Marte na parede; grande janela para o pátio do castelo",
    idPendente: "C01D",
  });

  cenaC01DAtiva = cena;

  function montarHotspots() {
    camadaHotspots.replaceChildren();
    const estado = obterEstado();
    const resolvido = Boolean(estado.e04Resolvido);
    const elmoPendente =
      resolvido &&
      !elmoConsumidoNestaCena &&
      (!estado.elmoColetado || exigirColetaElmo);

    // Pós-mate com elmo na mesa: só o hotspot de coleta
    if (elmoPendente) {
      camadaHotspots.append(
        criarHotspot({
          id: "elmo",
          rotulo: "Coletar elmo",
          estilo: estilo("elmo", {
            left: 42,
            top: 40,
            width: 16,
            height: 20,
            zIndex: 7,
          }),
          aoAtivar: () => {
            if (coletandoElmo) {
              return;
            }
            coletandoElmo = true;
            elmoConsumidoNestaCena = true;
            const jaTinha = Boolean(obterEstado().elmoColetado);
            if (!jaTinha) {
              coletarElmo();
              window.dispatchEvent(new CustomEvent("oum:inventario"));
              anunciarItem("elmo");
            }
            tocar("item");
            if (typeof montarHotspotsC01D === "function") {
              montarHotspotsC01D();
            }
            if (aoColetarElmoAtual) {
              aoColetarElmoAtual();
            }
          },
        })
      );
      return;
    }

    if (!resolvido) {
      camadaHotspots.append(
        criarHotspot({
          id: "perseguidor",
          rotulo: "Olhar o perseguidor",
          estilo: estilo("perseguidor", {
            left: 38,
            top: 18,
            width: 24,
            height: 36,
            zIndex: 3,
          }),
          aoAtivar: () => {
            tocar("passo");
            exibirMensagemTemporaria(cena, MSG_PERSEGUIDOR);
          },
        }),
        criarHotspot({
          id: "tabuleiro",
          rotulo: "Jogar a última partida",
          estilo: estilo("tabuleiro", {
            left: 30,
            top: 48,
            width: 40,
            height: 28,
            zIndex: 5,
          }),
          aoAtivar: () => {
            tocar("passo");
            abrirPainelXadrez({
              container: palco,
              aoVencer: () => {
                if (aoVencerXadrez) {
                  aoVencerXadrez();
                }
              },
            });
          },
        })
      );
    } else {
      camadaHotspots.append(
        criarHotspot({
          id: "tabuleiro",
          rotulo: "Olhar a mesa",
          estilo: estilo("tabuleiro", {
            left: 30,
            top: 48,
            width: 40,
            height: 28,
            zIndex: 5,
          }),
          aoAtivar: () => {
            tocar("passo");
            exibirMensagemTemporaria(cena, MSG_JA_VENCEU);
          },
        })
      );
    }

    camadaHotspots.append(
      criarHotspot({
        id: "voltar",
        rotulo: "Voltar à antecâmara",
        tipo: "passagem",
        classeExtra: "hotspot-saida-baixa",
        estilo: estilo("voltar", {
          left: 36,
          top: 86,
          width: 28,
          height: 10,
          zIndex: 6,
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

  montarHotspotsC01D = montarHotspots;
  montarHotspots();

  if (e04Resolvido && !abrirVitoriaAutomatica && !obterEstado().elmoColetado) {
    // Já venceu antes: só espera a coleta
  } else if (e04Resolvido && !abrirVitoriaAutomatica) {
    window.setTimeout(() => {
      exibirMensagemTemporaria(cena, MSG_JA_VENCEU, 3200);
    }, 400);
  }

  if (abrirVitoriaAutomatica) {
    window.setTimeout(() => {
      abrirPainelXadrez({
        container: palco,
        reproduzirVitoria: true,
        aoVencer: () => {
          if (aoVencerXadrez) {
            aoVencerXadrez();
          }
        },
      });
    }, 450);
  }

  window.dispatchEvent(new CustomEvent("oum:cena", { detail: { id: "C01D" } }));
  return cena;
}
