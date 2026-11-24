import { iniciarAudio, tocar, tocarAmbiente } from "../core/audio.js";
import {
  carregarAmbiente,
  estiloDeHotspot,
} from "../dados/ambientes.js";
import { obterImagemC03 } from "../dados/imagens.js";
import { definirSalaAtual } from "../core/estado.js";
import {
  criarCenaFotografica,
  criarHotspot,
} from "../interface/fotografia.js";
import { montarEstanteGavetas } from "../interface/estante-gavetas.js";
import {
  definirLugar,
  garantirHud,
  mostrarHud,
} from "../interface/hud.js";

export async function criarC03G({ aoVoltar } = {}) {
  definirSalaAtual("C03G");
  garantirHud();
  mostrarHud(true);
  definirLugar("Arquivo de Gavetas");
  iniciarAudio();
  tocarAmbiente("pedra");

  const ambiente = await carregarAmbiente("C03G");

  // Overlay no palco (viewport), não na camada com parallax
  const { cena, palco } = criarCenaFotografica({
    id: "c03g",
    ariaLabel: "C03G — Close-up do arquivo de gavetas",
    srcImagem: obterImagemC03(),
    altImagem: "Close-up das gavetas do arquivo",
    idPendente: "C03G",
  });

  function estilo(id, fallback) {
    return estiloDeHotspot(ambiente, id, fallback);
  }

  montarEstanteGavetas(palco);

  // Voltar: seta sempre visível e maior, fixa embaixo do modal
  palco.append(
    criarHotspot({
      id: "voltar",
      rotulo: "Afastar-se do arquivo",
      tipo: "passagem",
      classeExtra: "hotspot-saida-fixa",
      estilo: estilo("voltar", {
        left: 36,
        top: 90,
        width: 28,
        height: 8,
        zIndex: 20,
      }),
      aoAtivar: () => {
        tocar("passo");
        if (aoVoltar) {
          aoVoltar();
        }
      },
    })
  );

  window.dispatchEvent(new CustomEvent("oum:cena", { detail: { id: "C03G" } }));
  return cena;
}
