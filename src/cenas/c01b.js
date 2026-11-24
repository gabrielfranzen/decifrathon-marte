import { iniciarAudio, tocar, tocarAmbiente } from "../core/audio.js";
import {
  carregarAmbiente,
  estiloDeHotspot,
} from "../dados/ambientes.js";
import {
  obterImagemCorredorC01B,
  obterFramesLutaC01B,
  obterImagemMorteEspadadaC01B,
} from "../dados/imagens.js";
import { definirSalaAtual } from "../core/estado.js";
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

const MSG_AINDA_NAO = "Ainda não explorável.";

// Corredor vazio pós-fuga (a galeria superior não é mais usada)
export async function criarC01B({ aoVoltar, aoAvancar } = {}) {
  definirSalaAtual("C01B");
  garantirHud();
  mostrarHud(true);
  definirLugar("Corredor Superior");
  iniciarAudio();
  tocarAmbiente("pedra");

  const ambiente = await carregarAmbiente("C01B");

  const { cena, camadaHotspots } = criarCenaFotografica({
    id: "c01b",
    ariaLabel: "C01B — Corredor no topo da escada",
    srcImagem: obterImagemCorredorC01B(),
    altImagem:
      "Corredor escuro e vazio iluminado por uma vela na parede esquerda",
    idPendente: "C01B",
  });

  camadaHotspots.append(
    criarHotspot({
      id: "frente",
      rotulo: "Avançar pelo corredor",
      tipo: "passagem",
      estilo: estiloDeHotspot(ambiente, "frente", {
        left: 32,
        top: 18,
        width: 36,
        height: 52,
        zIndex: 3,
      }),
      aoAtivar: () => {
        tocar("passo");
        if (aoAvancar) {
          aoAvancar();
          return;
        }
        exibirMensagemTemporaria(cena, MSG_AINDA_NAO);
      },
    }),
    criarHotspot({
      id: "voltar",
      rotulo: "Voltar ao salão",
      tipo: "passagem",
      estilo: estiloDeHotspot(ambiente, "voltar", {
        left: 38,
        top: 78,
        width: 24,
        height: 16,
        zIndex: 4,
      }),
      aoAtivar: () => {
        tocar("passo");
        if (aoVoltar) {
          aoVoltar();
          return;
        }
        exibirMensagemTemporaria(cena, MSG_AINDA_NAO);
      },
    })
  );

  window.dispatchEvent(new CustomEvent("oum:cena", { detail: { id: "C01B" } }));
  return cena;
}

function criarCenaCutsceneCorredor({
  id,
  ariaLabel,
  srcImagem,
  altImagem,
  idPendente,
}) {
  definirSalaAtual("C01B");
  garantirHud();
  mostrarHud(false);
  definirLugar("");
  iniciarAudio();

  const { cena, imagem, camadaHotspots } = criarCenaFotografica({
    id,
    ariaLabel,
    srcImagem,
    altImagem,
    idPendente,
  });

  camadaHotspots.style.pointerEvents = "none";
  // Permite trocar frames na cutscene sem remontar a cena
  cena._imagemCutscene = imagem;
  window.dispatchEvent(new CustomEvent("oum:cena", { detail: { id } }));
  return cena;
}

// Cutscene de morte: só a espadada
export function criarCenaMorteEspadada() {
  return criarCenaCutsceneCorredor({
    id: "c01b-morte",
    ariaLabel: "Morte — o cavaleiro enfia a espada no jogador",
    srcImagem: obterImagemMorteEspadadaC01B(),
    altImagem: "O cavaleiro enfia a espada no jogador",
    idPendente: "C01B-morte",
  });
}

// Cutscene de luta com espada: começa no encaramento
export function criarCenaLutaEspada() {
  const [primeiro] = obterFramesLutaC01B();
  return criarCenaCutsceneCorredor({
    id: "c01b-luta",
    ariaLabel: "Luta — o jogador enfrenta o cavaleiro no corredor",
    srcImagem: primeiro,
    altImagem: "O jogador e o perseguidor se encaram com as espadas prontas",
    idPendente: "C01B-luta",
  });
}

export function trocarFrameCutscene(cena, src, alt = "") {
  const imagem = cena?._imagemCutscene;
  if (!imagem || !document.body.contains(imagem)) {
    return;
  }
  imagem.classList.add("cena-foto__imagem--troca-frame");
  imagem.src = src;
  if (alt) {
    imagem.alt = alt;
  }
  window.setTimeout(() => {
    imagem.classList.remove("cena-foto__imagem--troca-frame");
  }, 220);
}
