import { iniciarAudio, tocar, tocarAmbiente } from "../core/audio.js";
import {
  carregarAmbiente,
  estiloDeHotspot,
} from "../dados/ambientes.js";
import { obterImagemC01C } from "../dados/imagens.js";
import { definirSalaAtual, obterEstado } from "../core/estado.js";
import {
  criarCenaFotografica,
  criarHotspot,
  exibirMensagemTemporaria,
} from "../interface/fotografia.js";
import {
  abrirPainelAlavancas,
  tentarAbrirPortaPedra,
} from "../interface/painel-alavancas.js";
import {
  definirLugar,
  garantirHud,
  mostrarHud,
} from "../interface/hud.js";

const MSG_ARMADURA =
  "A armadura bloqueia a passagem. Espada baixa, olhar fixo — não se move.";
const MSG_PORTA_RESISTE =
  "A porta de pedra não cede. O mecanismo interno não se move.";
const MSG_PORTA_CEDEU =
  "A porta cede um pouco. O vão escuro convida a entrar.";
const MSG_STUB =
  "Além da porta: a sala do cavaleiro ainda não foi mapeada.";

function descricaoAlt(portaAberta) {
  if (portaAberta) {
    return "Antecâmara com porta de pedra entreaberta, armaduras nas laterais, alavancas e placa de instruções";
  }
  return "Antecâmara com porta de pedra maciça fechada, armaduras nas laterais, alavancas e placa de instruções";
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

  const { cena, camadaHotspots, imagem, placeholder } = criarCenaFotografica({
    id: "c01c",
    ariaLabel: "C01C — Antecâmara da porta de pedra",
    srcImagem: obterImagemC01C({ portaPedraAberta: portaAberta }),
    altImagem: descricaoAlt(portaAberta),
    idPendente: "C01C",
  });

  function estilo(id, fallback) {
    return estiloDeHotspot(ambiente, id, fallback);
  }

  function atualizarFoto() {
    estado = obterEstado();
    portaAberta = Boolean(estado.portaPedraAberta || estado.e03Resolvido);
    const src = obterImagemC01C({ portaPedraAberta: portaAberta });
    imagem.alt = descricaoAlt(portaAberta);
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

  function abrirPainel(foco) {
    abrirPainelAlavancas({
      foco,
      aoAtualizarCena: () => {
        refrescarCena();
        exibirMensagemTemporaria(cena, MSG_PORTA_CEDEU);
      },
    });
  }

  function montarHotspots() {
    limparHotspots();
    estado = obterEstado();
    portaAberta = Boolean(estado.portaPedraAberta || estado.e03Resolvido);

    camadaHotspots.append(
      criarHotspot({
        id: "esquerda",
        rotulo: "Examinar a armadura à esquerda",
        estilo: estilo("esquerda", {
          left: 2,
          top: 22,
          width: 16,
          height: 58,
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
          top: 22,
          width: 16,
          height: 58,
          zIndex: 3,
        }),
        aoAtivar: () => {
          tocar("passo");
          exibirMensagemTemporaria(cena, MSG_ARMADURA);
        },
      }),
      criarHotspot({
        id: "alavancas",
        rotulo: "Examinar as alavancas",
        estilo: estilo("alavancas", {
          left: 26,
          top: 28,
          width: 12,
          height: 36,
          zIndex: 4,
        }),
        aoAtivar: () => {
          tocar("passo");
          abrirPainel("alavancas");
        },
      }),
      criarHotspot({
        id: "instrucoes",
        rotulo: "Ler a placa de instruções",
        estilo: estilo("instrucoes", {
          left: 62,
          top: 28,
          width: 12,
          height: 36,
          zIndex: 4,
        }),
        aoAtivar: () => {
          tocar("passo");
          abrirPainel("instrucoes");
        },
      }),
      criarHotspot({
        id: "porta",
        rotulo: portaAberta
          ? "Entrar pela porta entreaberta"
          : "Empurrar a porta de pedra",
        tipo: "passagem",
        estilo: estilo("porta", {
          left: 38,
          top: 18,
          width: 24,
          height: 55,
          zIndex: 5,
        }),
        aoAtivar: () => {
          if (portaAberta) {
            tocar("passo");
            if (aoEntrar) {
              aoEntrar();
              return;
            }
            exibirMensagemTemporaria(cena, MSG_STUB);
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

  montarHotspots();
  window.dispatchEvent(new CustomEvent("oum:cena", { detail: { id: "C01C" } }));
  return cena;
}

// Stub temporário: sala do cavaleiro sem arte
export async function criarStubSalaCavaleiro({ aoVoltar } = {}) {
  definirSalaAtual("C01D");
  garantirHud();
  mostrarHud(true);
  definirLugar("Sala do Cavaleiro");
  iniciarAudio();
  tocarAmbiente("pedra");

  const { cena, camadaHotspots, imagem, placeholder } = criarCenaFotografica({
    id: "c01d-stub",
    ariaLabel: "C01D — Sala do cavaleiro (em construção)",
    srcImagem: obterImagemC01C({ portaPedraAberta: true }),
    altImagem: "Vão escuro além da porta de pedra — ambiente ainda não mapeado",
    idPendente: "C01D",
  });

  // Escurece o frame da antecâmara como placeholder
  imagem.style.filter = "brightness(0.22) saturate(0.4)";
  placeholder.hidden = true;

  camadaHotspots.append(
    criarHotspot({
      id: "voltar",
      rotulo: "Voltar à antecâmara",
      tipo: "passagem",
      classeExtra: "hotspot-saida-fixa",
      estilo: {
        left: 36,
        top: 86,
        width: 28,
        height: 10,
        zIndex: 10,
      },
      aoAtivar: () => {
        tocar("passo");
        if (aoVoltar) {
          aoVoltar();
        }
      },
    })
  );

  window.setTimeout(() => {
    exibirMensagemTemporaria(cena, MSG_STUB, 4200);
  }, 400);

  window.dispatchEvent(new CustomEvent("oum:cena", { detail: { id: "C01D" } }));
  return cena;
}
