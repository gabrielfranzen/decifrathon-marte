import { iniciarAudio, tocar, tocarAmbiente } from "../core/audio.js";
import {
  carregarAmbiente,
  estiloDeHotspot,
} from "../dados/ambientes.js";
import { obterImagemC02 } from "../dados/imagens.js";
import {
  coletarPapelArquivo,
  definirSalaAtual,
  obterEstado,
  temItem,
} from "../core/estado.js";
import {
  criarCenaFotografica,
  criarHotspot,
} from "../interface/fotografia.js";
import { abrirExaminador } from "../interface/examinador.js";
import {
  definirLugar,
  garantirHud,
  mostrarHud,
} from "../interface/hud.js";
import { anunciarItem } from "../interface/inventario.js";

function descricaoAlt(gavetaAberta, papelColetado) {
  if (!gavetaAberta) {
    return "Sala lateral do castelo com mesa de cartas, pergaminho, cadeado na gaveta e cabideiro";
  }
  if (papelColetado) {
    return "Sala das cartas com a gaveta aberta; o papel já foi recolhido";
  }
  return "Sala das cartas com a gaveta aberta e um papel dobrado à vista";
}

function guardarPapelComoReliquia() {
  if (temItem("papel-arquivo")) {
    return false;
  }
  coletarPapelArquivo();
  window.dispatchEvent(new CustomEvent("oum:inventario"));
  anunciarItem("papel-arquivo");
  return true;
}

export async function criarC02({ aoVoltar, aoAbrirMesa } = {}) {
  definirSalaAtual("C02");
  garantirHud();
  mostrarHud(true);
  definirLugar("Sala das Cartas");
  iniciarAudio();
  tocarAmbiente("pedra");

  const ambiente = await carregarAmbiente("C02");
  let estado = obterEstado();
  let gavetaAberta = Boolean(estado.gavetaCartasAberta || estado.e01Resolvido);

  const { cena, camadaHotspots, imagem, placeholder } = criarCenaFotografica({
    id: "c02",
    ariaLabel: "C02 — Sala das cartas",
    srcImagem: obterImagemC02({ gavetaAberta }),
    altImagem: descricaoAlt(gavetaAberta, temItem("papel-arquivo")),
    idPendente: "C02",
  });

  function estilo(id, fallback) {
    return estiloDeHotspot(ambiente, id, fallback);
  }

  function atualizarFoto() {
    estado = obterEstado();
    gavetaAberta = Boolean(estado.gavetaCartasAberta || estado.e01Resolvido);
    const papelColetado = temItem("papel-arquivo");
    const src = obterImagemC02({ gavetaAberta });
    imagem.alt = descricaoAlt(gavetaAberta, papelColetado);
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
    gavetaAberta = Boolean(estado.gavetaCartasAberta || estado.e01Resolvido);
    const papelColetado = temItem("papel-arquivo");

    camadaHotspots.append(
      criarHotspot({
        id: "mesa",
        rotulo: "Aproximar-se da mesa",
        estilo: estilo("mesa", {
          left: 22,
          top: 36,
          width: 56,
          height: 30,
          zIndex: 3,
        }),
        aoAtivar: () => {
          tocar("passo");
          if (aoAbrirMesa) {
            aoAbrirMesa();
          }
        },
      })
    );

    if (!gavetaAberta) {
      camadaHotspots.append(
        criarHotspot({
          id: "cadeado",
          rotulo: "Examinar o cadeado da gaveta",
          estilo: estilo("cadeado", {
            left: 44,
            top: 76,
            width: 12,
            height: 10,
            zIndex: 5,
          }),
          aoAtivar: () => {
            tocar("papel");
            abrirExaminador({
              tipo: "cadeado-cartas",
              aoAtualizarCena: () => {
                // Gaveta abre: cadeado some e o papel vira relíquia na hora
                guardarPapelComoReliquia();
                refrescarCena();
              },
            });
          },
        })
      );
    } else if (!papelColetado) {
      // Save antigo: gaveta já aberta, mas o papel ainda não virou relíquia
      camadaHotspots.append(
        criarHotspot({
          id: "papel",
          rotulo: "Recolher o papel da gaveta",
          estilo: estilo("papel", {
            left: 40,
            top: 72,
            width: 20,
            height: 12,
            zIndex: 6,
          }),
          aoAtivar: () => {
            tocar("papel");
            guardarPapelComoReliquia();
            refrescarCena();
            abrirExaminador({
              tipo: "papel-arquivo",
              nasMaos: true,
              nomeObjeto: "Rotina",
            });
          },
        })
      );
    }

    camadaHotspots.append(
      criarHotspot({
        id: "voltar",
        rotulo: "Voltar ao salão",
        tipo: "passagem",
        estilo: estilo("voltar", {
          left: 38,
          top: 86,
          width: 24,
          height: 10,
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

  window.dispatchEvent(new CustomEvent("oum:cena", { detail: { id: "C02" } }));
  return cena;
}
