import { iniciarAudio, tocar, tocarAmbiente } from "../core/audio.js";
import {
  carregarAmbiente,
  estiloDeHotspot,
} from "../dados/ambientes.js";
import { obterImagemC02Mesa } from "../dados/imagens.js";
import { definirSalaAtual } from "../core/estado.js";
import {
  criarCenaFotografica,
  criarHotspot,
} from "../interface/fotografia.js";
import { montarMesaCartas } from "../interface/mesa-cartas.js";
import {
  definirLugar,
  garantirHud,
  mostrarHud,
} from "../interface/hud.js";

export async function criarC02M({ aoVoltar } = {}) {
  definirSalaAtual("C02M");
  garantirHud();
  mostrarHud(true);
  definirLugar("Mesa das Cartas");
  iniciarAudio();
  tocarAmbiente("pedra");

  const ambiente = await carregarAmbiente("C02M");

  const { cena, camadaHotspots } = criarCenaFotografica({
    id: "c02m",
    ariaLabel: "C02M — Close-up do tampo da mesa das cartas",
    srcImagem: obterImagemC02Mesa(),
    altImagem: "Vista de cima do tampo da mesa de madeira escura",
    idPendente: "C02M",
  });

  function estilo(id, fallback) {
    return estiloDeHotspot(ambiente, id, fallback);
  }

  montarMesaCartas(camadaHotspots);

  // Só o tampo: o cadeado fica na visão da sala (C02)
  camadaHotspots.append(
    criarHotspot({
      id: "voltar",
      rotulo: "Afastar-se da mesa",
      tipo: "passagem",
      estilo: estilo("voltar", {
        left: 38,
        top: 86,
        width: 24,
        height: 10,
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

  window.dispatchEvent(new CustomEvent("oum:cena", { detail: { id: "C02M" } }));
  return cena;
}
