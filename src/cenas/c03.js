import { iniciarAudio, tocar, tocarAmbiente } from "../core/audio.js";
import {
  coletarRelatoArquivo,
  definirSalaAtual,
  temRelatoArquivo,
} from "../core/estado.js";
import {
  carregarAmbiente,
  estiloDeHotspot,
} from "../dados/ambientes.js";
import { obterRelatoDoBalcao } from "../dados/relatos-arquivo.js";
import { obterImagemC03 } from "../dados/imagens.js";
import {
  criarCenaFotografica,
  criarHotspot,
} from "../interface/fotografia.js";
import { abrirExaminador } from "../interface/examinador.js";
import { anunciarItem } from "../interface/inventario.js";
import {
  definirLugar,
  garantirHud,
  mostrarHud,
} from "../interface/hud.js";

function ativarBalcao(lado) {
  const relato = obterRelatoDoBalcao(lado);
  if (!relato) {
    return;
  }

  const jaTinha = temRelatoArquivo(relato.id);
  if (!jaTinha) {
    coletarRelatoArquivo(relato.id);
    window.dispatchEvent(new CustomEvent("oum:inventario"));
    anunciarItem(relato.id);
  }

  tocar("papel");
  abrirExaminador({
    tipo: "relato-arquivo",
    idRelato: relato.id,
    nasMaos: true,
    nomeObjeto: relato.nome,
  });
}

export async function criarC03({ aoVoltar, aoAbrirArquivo } = {}) {
  definirSalaAtual("C03");
  garantirHud();
  mostrarHud(true);
  definirLugar("Sala do Arquivo");
  iniciarAudio();
  tocarAmbiente("pedra");

  const ambiente = await carregarAmbiente("C03");

  const { cena, camadaHotspots } = criarCenaFotografica({
    id: "c03",
    ariaLabel: "C03 — Sala do arquivo de gavetas",
    srcImagem: obterImagemC03(),
    altImagem:
      "Sala do castelo com parede frontal ocupada por um arquivo de gavetas de madeira",
    idPendente: "C03",
  });

  function estilo(id, fallback) {
    return estiloDeHotspot(ambiente, id, fallback);
  }

  camadaHotspots.append(
    criarHotspot({
      id: "balcao-esquerda",
      rotulo: "Examinar pergaminhos do balcão esquerdo",
      estilo: estilo("balcao-esquerda", {
        left: 0.5,
        top: 38,
        width: 17.5,
        height: 42,
        zIndex: 5,
      }),
      aoAtivar: () => ativarBalcao("esquerda"),
    }),
    criarHotspot({
      id: "balcao-direita",
      rotulo: "Examinar pergaminhos do balcão direito",
      estilo: estilo("balcao-direita", {
        left: 82,
        top: 38,
        width: 17.5,
        height: 42,
        zIndex: 5,
      }),
      aoAtivar: () => ativarBalcao("direita"),
    }),
    criarHotspot({
      id: "arquivo",
      rotulo: "Aproximar o arquivo de gavetas",
      estilo: estilo("arquivo", {
        left: 18,
        top: 12,
        width: 64,
        height: 70,
        zIndex: 3,
      }),
      aoAtivar: () => {
        tocar("passo");
        if (aoAbrirArquivo) {
          aoAbrirArquivo();
        }
      },
    }),
    criarHotspot({
      id: "voltar",
      rotulo: "Voltar ao salão",
      tipo: "passagem",
      estilo: estilo("voltar", {
        left: 38,
        top: 88,
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

  window.dispatchEvent(new CustomEvent("oum:cena", { detail: { id: "C03" } }));
  return cena;
}
