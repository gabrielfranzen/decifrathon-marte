import { iniciarAudio, tocar, tocarAmbiente } from "../core/audio.js";
import {
  carregarAmbiente,
  estiloDeHotspot,
} from "../dados/ambientes.js";
import { obterImagemC01C, obterImagemCartaAdagas } from "../dados/imagens.js";
import {
  coletarCartaAdagas,
  definirSalaAtual,
  obterEstado,
} from "../core/estado.js";
import {
  criarCenaFotografica,
  criarHotspot,
  exibirMensagemTemporaria,
} from "../interface/fotografia.js";
import {
  abrirPainelAdagas,
  tentarAbrirPortaPedra,
} from "../interface/painel-adagas.js";
import {
  definirLugar,
  garantirHud,
  mostrarHud,
} from "../interface/hud.js";
import { abrirExaminador } from "../interface/examinador.js";
import { anunciarItem } from "../interface/inventario.js";

const FALLBACK_CARTA = {
  left: 64,
  top: 36,
  width: 6,
  height: 16,
  zIndex: 4,
};

const MSG_ARMADURA =
  "A armadura segura a espada e bloqueia a passagem. Olhar fixo — não se move.";
const MSG_PORTA_RESISTE =
  "A porta de pedra não cede. O mecanismo interno não se move.";
const MSG_PORTA_CEDEU =
  "A porta cede um pouco. O vão escuro convida a entrar.";

function descricaoAlt(portaAberta, cartaColetada) {
  const carta = cartaColetada
    ? "espaço vazio à direita onde havia uma carta"
    : "carta afixada à direita";
  if (portaAberta) {
    return `Antecâmara com porta entreaberta, armaduras segurando espadas, adagas à esquerda e ${carta}`;
  }
  return `Antecâmara com porta fechada, armaduras segurando espadas, adagas à esquerda e ${carta}`;
}

export async function criarC01C({ aoVoltar, aoEntrar } = {}) {
  definirSalaAtual("C01C");
  garantirHud();
  mostrarHud(true);
  definirLugar("Antecâmara");
  iniciarAudio();
  tocarAmbiente("pedra");

  const ambiente = await carregarAmbiente("C01C");
  let estado = obterEstado();
  let portaAberta = Boolean(estado.portaPedraAberta || estado.e03Resolvido);
  let cartaColetada = Boolean(estado.cartaAdagasColetada);

  const { cena, palco, camadaHotspots, imagem, placeholder, parallax } =
    criarCenaFotografica({
      id: "c01c",
      ariaLabel: "C01C — Antecâmara da porta de pedra",
      srcImagem: obterImagemC01C({ portaPedraAberta: portaAberta }),
      altImagem: descricaoAlt(portaAberta, cartaColetada),
      idPendente: "C01C",
    });

  // Carta na parede (some na coleta)
  const camadaProps = document.createElement("div");
  camadaProps.className = "camada-props";
  const propCarta = document.createElement("img");
  propCarta.className = "prop-cena prop-carta-adagas";
  propCarta.dataset.prop = "carta";
  propCarta.src = obterImagemCartaAdagas();
  propCarta.alt = "";
  propCarta.draggable = false;
  propCarta.setAttribute("aria-hidden", "true");
  camadaProps.append(propCarta);
  parallax.insertBefore(camadaProps, camadaHotspots);

  function estilo(id, fallback) {
    return estiloDeHotspot(ambiente, id, fallback);
  }

  function atualizarPropCarta() {
    estado = obterEstado();
    const caixa = estilo("carta", FALLBACK_CARTA);
    Object.assign(propCarta.style, {
      left: caixa.left,
      top: caixa.top,
      width: caixa.width,
      height: caixa.height,
      zIndex: String(caixa.zIndex ?? 4),
    });
    propCarta.hidden = Boolean(estado.cartaAdagasColetada);
  }

  function atualizarFoto() {
    estado = obterEstado();
    portaAberta = Boolean(estado.portaPedraAberta || estado.e03Resolvido);
    cartaColetada = Boolean(estado.cartaAdagasColetada);
    const src = obterImagemC01C({ portaPedraAberta: portaAberta });
    imagem.alt = descricaoAlt(portaAberta, cartaColetada);
    atualizarPropCarta();
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
    estado = obterEstado();
    portaAberta = Boolean(estado.portaPedraAberta || estado.e03Resolvido);
    cartaColetada = Boolean(estado.cartaAdagasColetada);

    camadaHotspots.append(
      criarHotspot({
        id: "esquerda",
        rotulo: "Examinar a armadura à esquerda",
        estilo: estilo("esquerda", {
          left: 4,
          top: 20,
          width: 14,
          height: 60,
          zIndex: 3,
        }),
        aoAtivar: () => {
          tocar("passo");
          exibirMensagemTemporaria(cena, MSG_ARMADURA);
        },
      }),
      criarHotspot({
        id: "direita",
        rotulo: "Examinar a armadura à direita",
        estilo: estilo("direita", {
          left: 82,
          top: 20,
          width: 14,
          height: 60,
          zIndex: 3,
        }),
        aoAtivar: () => {
          tocar("passo");
          exibirMensagemTemporaria(cena, MSG_ARMADURA);
        },
      }),
      criarHotspot({
        id: "adagas",
        rotulo: "Examinar as adagas",
        estilo: estilo("adagas", {
          left: 26.5,
          top: 18,
          width: 13,
          height: 38,
          zIndex: 6,
        }),
        aoAtivar: () => {
          tocar("passo");
          abrirPainelAdagas({
            container: palco,
            aoAcerto: () => {
              refrescarCena();
              exibirMensagemTemporaria(cena, MSG_PORTA_CEDEU);
            },
          });
        },
      })
    );

    if (!cartaColetada) {
      camadaHotspots.append(
        criarHotspot({
          id: "carta",
          rotulo: "Recolher a carta",
          estilo: estilo("carta", FALLBACK_CARTA),
          aoAtivar: () => {
            tocar("papel");
            coletarCartaAdagas();
            window.dispatchEvent(new CustomEvent("oum:inventario"));
            anunciarItem("carta-adagas");
            refrescarCena();
            abrirExaminador({
              tipo: "carta-adagas",
              nasMaos: true,
              nomeObjeto: "Mapa das adagas",
            });
          },
        })
      );
    }

    camadaHotspots.append(
      criarHotspot({
        id: "porta",
        rotulo: portaAberta
          ? "Entrar pela porta entreaberta"
          : "Tentar a porta de pedra",
        tipo: "passagem",
        estilo: estilo("porta", {
          left: 40,
          top: 16,
          width: 20,
          height: 56,
          zIndex: 5,
        }),
        aoAtivar: () => {
          if (portaAberta) {
            tocar("passo");
            if (aoEntrar) {
              aoEntrar();
            }
            return;
          }

          tentarAbrirPortaPedra({
            aoSucesso: () => {
              refrescarCena();
              exibirMensagemTemporaria(cena, MSG_PORTA_CEDEU);
            },
            aoFalhar: () => {
              exibirMensagemTemporaria(cena, MSG_PORTA_RESISTE);
            },
          });
        },
      }),
      criarHotspot({
        id: "voltar",
        rotulo: "Voltar ao corredor",
        tipo: "passagem",
        estilo: estilo("voltar", {
          left: 32,
          top: 86,
          width: 36,
          height: 12,
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

  atualizarPropCarta();
  montarHotspots();
  window.dispatchEvent(new CustomEvent("oum:cena", { detail: { id: "C01C" } }));
  return cena;
}
