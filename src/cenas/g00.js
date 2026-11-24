import { iniciarAudio, tocar, tocarAmbiente } from "../core/audio.js";
import {
  carregarAmbiente,
  estiloDeHotspot,
} from "../dados/ambientes.js";
import {
  obterImagemG00,
  obterImagemMedalhaoG00,
} from "../dados/imagens.js";
import {
  coletarMedalhao,
  definirSalaAtual,
  obterEstado,
} from "../core/estado.js";
import { abrirExaminador } from "../interface/examinador.js";
import {
  criarCenaFotografica,
  criarHotspot,
  exibirMensagemTemporaria,
  limparMensagensTemporarias,
} from "../interface/fotografia.js";
import {
  definirLugar,
  garantirHud,
  mostrarHud,
} from "../interface/hud.js";
import { anunciarItem } from "../interface/inventario.js";

// Posição inicial do prop (extraída do asset); modo dev ajusta via hotspot medalhao
const FALLBACK_MEDALHAO = {
  left: 77.46,
  top: 41.41,
  width: 5.51,
  height: 12,
  zIndex: 3,
};

function avisarModoDev() {
  import("../interface/modo-dev.js").then(({ refrescarModoDevSeAtivo }) => {
    refrescarModoDevSeAtivo();
  });
}

function descricaoAlt(estado) {
  if (estado.portaPrincipalAberta) {
    return estado.medalhaoColetado
      ? "Portão do castelo aberto; o medalhão já foi recolhido"
      : "Portão do castelo aberto";
  }
  return estado.medalhaoColetado
    ? "Portão fechado; o medalhão já foi recolhido"
    : "Portão do castelo fechado, à noite";
}

function estilo(ambiente, id, fallback) {
  return estiloDeHotspot(ambiente, id, fallback);
}

export async function criarG00({ aoEntrar } = {}) {
  // Chegada definitiva após G00A — sem retorno à vista distante
  definirSalaAtual("G00");
  garantirHud();
  mostrarHud(true);
  definirLugar("Portão do castelo");
  iniciarAudio();
  tocarAmbiente("exterior");

  const ambiente = await carregarAmbiente("G00");
  let estado = obterEstado();

  const { cena, camadaHotspots, imagem, placeholder, parallax } =
    criarCenaFotografica({
      id: "g00",
      ariaLabel: "G00 — Portão do castelo",
      srcImagem: obterImagemG00(estado),
      altImagem: descricaoAlt(estado),
      idPendente: "G00",
    });

  // Camada do medalhão: some na coleta; o fundo nunca troca por causa disso
  const camadaProps = document.createElement("div");
  camadaProps.className = "camada-props";
  const imgMedalhao = document.createElement("img");
  imgMedalhao.className = "prop-cena prop-medalhao";
  imgMedalhao.dataset.prop = "medalhao";
  imgMedalhao.src = obterImagemMedalhaoG00();
  imgMedalhao.alt = "";
  imgMedalhao.draggable = false;
  imgMedalhao.setAttribute("aria-hidden", "true");
  camadaProps.append(imgMedalhao);
  parallax.insertBefore(camadaProps, camadaHotspots);

  function atualizarPropMedalhao() {
    estado = obterEstado();
    const caixa = estilo(ambiente, "medalhao", FALLBACK_MEDALHAO);
    Object.assign(imgMedalhao.style, {
      left: caixa.left,
      top: caixa.top,
      width: caixa.width,
      height: caixa.height,
      zIndex: caixa.zIndex,
    });
    imgMedalhao.hidden = Boolean(estado.medalhaoColetado);
  }

  function atualizarFoto() {
    estado = obterEstado();
    const src = obterImagemG00(estado);
    imagem.alt = descricaoAlt(estado);
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
    atualizarPropMedalhao();
    montarHotspots();
    avisarModoDev();
  }

  function montarHotspots() {
    limparHotspots();
    estado = obterEstado();

    // Só medalhão, cadeado e (após abrir) entrar — posições pelo modo dev
    if (!estado.portaPrincipalAberta) {
      camadaHotspots.append(
        criarHotspot({
          id: "cadeado",
          rotulo: "Examinar cadeado",
          estilo: estilo(ambiente, "cadeado", {
            left: 42,
            top: 50,
            width: 16,
            height: 12,
            zIndex: 4,
          }),
          aoAtivar: () =>
            abrirExaminador({
              tipo: "cadeado",
              aoAtualizarCena: () => {
                tocar("metalPorta");
                limparMensagensTemporarias(cena);
                refrescarCena();
              },
            }),
        })
      );
    }

    if (!estado.medalhaoColetado) {
      camadaHotspots.append(
        criarHotspot({
          id: "medalhao",
          rotulo: "Recolher medalhão",
          estilo: estilo(ambiente, "medalhao", FALLBACK_MEDALHAO),
          aoAtivar: () => {
            coletarMedalhao();
            window.dispatchEvent(new CustomEvent("oum:inventario"));
            anunciarItem("medalhao");
            refrescarCena();
          },
        })
      );
    }

    if (estado.portaPrincipalAberta) {
      camadaHotspots.append(
        criarHotspot({
          id: "entrar",
          rotulo: "Entrar no castelo",
          tipo: "passagem",
          classeExtra: "hotspot--entrar",
          estilo: estilo(ambiente, "entrar", {
            left: 32,
            top: 28,
            width: 36,
            height: 50,
            zIndex: 5,
          }),
          aoAtivar: () => {
            tocar("passo");
            if (aoEntrar) {
              aoEntrar();
              return;
            }
            exibirMensagemTemporaria(
              cena,
              "A continuação será desenvolvida na próxima etapa."
            );
          },
        })
      );
    }
  }

  atualizarPropMedalhao();
  montarHotspots();
  window.addEventListener("oum:inventario", refrescarCena);
  window.dispatchEvent(new CustomEvent("oum:cena", { detail: { id: "G00" } }));

  return cena;
}
