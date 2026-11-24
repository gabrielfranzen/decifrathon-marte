import { iniciarAudio, tocar, tocarAmbiente } from "../core/audio.js";
import {
  carregarAmbiente,
  estiloDeHotspot,
} from "../dados/ambientes.js";
import {
  obterImagemC01D,
  obterImagemRevelacaoC01D,
} from "../dados/imagens.js";
import { definirSalaAtual, obterEstado } from "../core/estado.js";
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
import { abrirPainelXadrez } from "../interface/painel-xadrez.js";

const MSG_PERSEGUIDOR =
  "Ele espera. A espada está no chão. O tabuleiro, entre vocês.";
const MSG_JA_VENCEU =
  "A partida já acabou. O elmo permanece sobre a mesa.";

export async function criarC01D({ aoVoltar, aoVencerXadrez } = {}) {
  definirSalaAtual("C01D");
  garantirHud();
  mostrarHud(true);
  definirLugar("A Última Partida");
  iniciarAudio();
  tocarAmbiente("pedra");

  const ambiente = await carregarAmbiente("C01D");
  const estilo = (id, fallback) => estiloDeHotspot(ambiente, id, fallback);
  const e04Resolvido = Boolean(obterEstado().e04Resolvido);

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

  function montarHotspots() {
    camadaHotspots.replaceChildren();

    if (!obterEstado().e04Resolvido) {
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
        })
      );
    }

    camadaHotspots.append(
      criarHotspot({
        id: "tabuleiro",
        rotulo: e04Resolvido
          ? "Rever o tabuleiro"
          : "Jogar a última partida",
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
      }),
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

  montarHotspots();

  if (e04Resolvido) {
    window.setTimeout(() => {
      exibirMensagemTemporaria(cena, MSG_JA_VENCEU, 3200);
    }, 400);
  }

  window.dispatchEvent(new CustomEvent("oum:cena", { detail: { id: "C01D" } }));
  return cena;
}
