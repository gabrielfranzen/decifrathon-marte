import {
  aplicarEstilosHotspotsNaCena,
  atualizarHotspotsNoCache,
  carregarAmbiente,
  obterAmbiente,
  salvarHotspotsAmbiente,
} from "../dados/ambientes.js";
import { obterEstado, apagarSalvamento } from "../core/estado.js";

async function aviso(titulo, texto) {
  const { toast } = await import("./hud.js");
  toast(titulo, texto);
}

const ALCAS = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];

let ativo = false;
let painel = null;
let camada = null;
let ambienteId = null;
let rascunho = [];
let arraste = null;

function formatar(valor) {
  return Number(valor).toFixed(1).replace(/\.0$/, "");
}

function cenaAtiva() {
  return document.querySelector(".cena-foto.cena--visivel");
}

function garantirPainel() {
  if (painel) {
    return painel;
  }

  painel = document.createElement("div");
  painel.className = "modo-dev-painel";
  painel.innerHTML = `
    <p class="modo-dev-painel__titulo">Modo Dev · Hotspots</p>
    <p class="modo-dev-painel__info" data-papel="info">—</p>
    <div class="modo-dev-painel__acoes">
      <button type="button" class="modo-dev-botao" data-acao="salvar">Salvar JSON</button>
      <button type="button" class="modo-dev-botao" data-acao="pular-final">Pular para o final</button>
      <button type="button" class="modo-dev-botao modo-dev-botao--secundario" data-acao="fechar">Fechar</button>
    </div>
  `;

  painel.querySelector('[data-acao="salvar"]').addEventListener("click", () => {
    void salvar();
  });
  painel.querySelector('[data-acao="pular-final"]').addEventListener("click", () => {
    definirModoDev(false);
    window.dispatchEvent(new CustomEvent("oum:dev-pular-final"));
    void aviso("Modo Dev", "Indo para a cena final…");
  });
  painel.querySelector('[data-acao="fechar"]').addEventListener("click", () => {
    definirModoDev(false);
  });

  document.getElementById("app").append(painel);
  return painel;
}

function atualizarInfo() {
  const info = painel?.querySelector('[data-papel="info"]');
  if (!info) {
    return;
  }
  info.textContent = ambienteId
    ? `${ambienteId} · ${rascunho.length} hotspot(s) · arraste / redimensione · %`
    : "Nenhuma cena fotográfica ativa";
}

function criarAlca(tipo) {
  const alca = document.createElement("span");
  alca.className = `modo-dev-alca modo-dev-alca--${tipo}`;
  alca.dataset.alca = tipo;
  return alca;
}

function aplicarRetangulo(el, hotspot) {
  el.style.left = `${hotspot.left}%`;
  el.style.top = `${hotspot.top}%`;
  el.style.width = `${hotspot.width}%`;
  el.style.height = `${hotspot.height}%`;
  el.style.zIndex = String(20 + (hotspot.zIndex || 0));
  const rotulo = el.querySelector(".modo-dev-rotulo");
  if (rotulo) {
    rotulo.textContent = `${hotspot.id}  L${formatar(hotspot.left)} T${formatar(hotspot.top)} W${formatar(hotspot.width)} H${formatar(hotspot.height)}`;
  }
}

function limitar(valor, min, max) {
  return Math.min(max, Math.max(min, valor));
}

function iniciarArraste(evento, hotspot, alca) {
  if (evento.button !== 0) {
    return;
  }
  evento.preventDefault();
  evento.stopPropagation();

  const caixa = camada.getBoundingClientRect();
  arraste = {
    id: hotspot.id,
    alca: alca || "mover",
    inicioX: evento.clientX,
    inicioY: evento.clientY,
    origem: { ...hotspot },
    larguraPx: caixa.width,
    alturaPx: caixa.height,
  };

  camada.setPointerCapture(evento.pointerId);
}

function duranteArraste(evento) {
  if (!arraste) {
    return;
  }

  const dx = ((evento.clientX - arraste.inicioX) / arraste.larguraPx) * 100;
  const dy = ((evento.clientY - arraste.inicioY) / arraste.alturaPx) * 100;
  const o = arraste.origem;
  const alvo = rascunho.find((h) => h.id === arraste.id);
  if (!alvo) {
    return;
  }

  let left = o.left;
  let top = o.top;
  let width = o.width;
  let height = o.height;
  const alca = arraste.alca;

  if (alca === "mover") {
    left = limitar(o.left + dx, 0, 100 - o.width);
    top = limitar(o.top + dy, 0, 100 - o.height);
  } else {
    if (alca.includes("w")) {
      const novoLeft = limitar(o.left + dx, 0, o.left + o.width - 1);
      width = o.width + (o.left - novoLeft);
      left = novoLeft;
    }
    if (alca.includes("e")) {
      width = limitar(o.width + dx, 1, 100 - o.left);
    }
    if (alca.includes("n")) {
      const novoTop = limitar(o.top + dy, 0, o.top + o.height - 1);
      height = o.height + (o.top - novoTop);
      top = novoTop;
    }
    if (alca.includes("s")) {
      height = limitar(o.height + dy, 1, 100 - o.top);
    }
  }

  Object.assign(alvo, {
    left: Number(left.toFixed(2)),
    top: Number(top.toFixed(2)),
    width: Number(width.toFixed(2)),
    height: Number(height.toFixed(2)),
  });

  const el = camada.querySelector(`[data-dev-hotspot="${alvo.id}"]`);
  if (el) {
    aplicarRetangulo(el, alvo);
  }
}

function soltarArraste() {
  if (!arraste) {
    return;
  }
  arraste = null;
  sincronizarCenaAoVivo();
}

function sincronizarCenaAoVivo() {
  if (!ambienteId) {
    return;
  }
  const ambiente = atualizarHotspotsNoCache(ambienteId, rascunho);
  const cena = cenaAtiva();
  if (ambiente && cena) {
    aplicarEstilosHotspotsNaCena(cena, ambiente);
  }
}

function montarRetangulo(hotspot) {
  const el = document.createElement("div");
  el.className = "modo-dev-retangulo";
  el.dataset.devHotspot = hotspot.id;

  const rotulo = document.createElement("span");
  rotulo.className = "modo-dev-rotulo";
  el.append(rotulo);

  for (const tipo of ALCAS) {
    el.append(criarAlca(tipo));
  }

  el.addEventListener("pointerdown", (evento) => {
    const alca = evento.target.closest("[data-alca]")?.dataset.alca || "mover";
    iniciarArraste(evento, hotspot, alca);
  });

  aplicarRetangulo(el, hotspot);
  return el;
}

async function montarSobreCamada(forcarReload = false) {
  const cena = cenaAtiva();
  garantirPainel();

  if (camada) {
    camada.remove();
    camada = null;
  }

  if (!cena) {
    ambienteId = null;
    rascunho = [];
    atualizarInfo();
    return;
  }

  const estado = obterEstado();
  ambienteId = estado.salaAtual === "G00A" ? "G00A" : estado.salaAtual;
  if (!ambienteId || ambienteId === "tela-inicial" || ambienteId === "introducao") {
    ambienteId = cena.classList.contains("g00")
      ? "G00"
      : cena.classList.contains("g00a")
        ? "G00A"
        : null;
  }

  if (!ambienteId) {
    rascunho = [];
    atualizarInfo();
    return;
  }

  try {
    if (forcarReload || !obterAmbiente(ambienteId)) {
      await carregarAmbiente(ambienteId);
    }
  } catch (erro) {
    void aviso("Modo Dev", String(erro.message || erro));
    atualizarInfo();
    return;
  }

  const ambiente = obterAmbiente(ambienteId);
  rascunho = (ambiente.hotspots || []).map((h) => ({ ...h }));

  const mundo = cena.querySelector(".mundo-parallax") || cena.querySelector(".mundo");
  camada = document.createElement("div");
  camada.className = "modo-dev-camada";
  camada.addEventListener("pointermove", duranteArraste);
  camada.addEventListener("pointerup", soltarArraste);
  camada.addEventListener("pointercancel", soltarArraste);

  for (const hotspot of rascunho) {
    camada.append(montarRetangulo(hotspot));
  }

  mundo.append(camada);
  atualizarInfo();
}

async function salvar() {
  if (!ambienteId || !rascunho.length) {
    await aviso("Modo Dev", "Nada para salvar.");
    return;
  }

  try {
    await salvarHotspotsAmbiente(ambienteId, rascunho);
    sincronizarCenaAoVivo();
    await aviso("Modo Dev", `${ambienteId}.json atualizado`);
  } catch (erro) {
    await aviso(
      "Modo Dev",
      erro.status === 404
        ? "Use npm run dev (API de gravação)."
        : String(erro.message || erro)
    );
  }
}

export function modoDevAtivo() {
  return ativo;
}

export function definirModoDev(ligar) {
  ativo = Boolean(ligar);
  document.body.classList.toggle("modo-dev", ativo);
  garantirPainel();
  painel.hidden = !ativo;

  if (ativo) {
    void montarSobreCamada(true);
  } else {
    if (camada) {
      camada.remove();
      camada = null;
    }
    arraste = null;
  }

  window.dispatchEvent(
    new CustomEvent("oum:modo-dev", { detail: { ativo } })
  );
}

export function alternarModoDev() {
  definirModoDev(!ativo);
}

export function refrescarModoDevSeAtivo() {
  if (ativo) {
    void montarSobreCamada(false);
  }
}

function apagarSalvamentoComConfirmacao() {
  const confirmado = window.confirm(
    "Apagar o salvamento e resetar todo o progresso? Esta ação não pode ser desfeita."
  );
  if (!confirmado) {
    return;
  }

  // Limpa o save por completo (incluindo “ver o final” / batalha) e recarrega
  apagarSalvamento();
  window.location.reload();
}

export function instalarAtalhosModoDev() {
  document.addEventListener("keydown", (evento) => {
    if (evento.target.closest("input, textarea, [contenteditable]")) {
      return;
    }
    // Ctrl+D (ou Cmd+D no Mac) alterna o modo dev
    if ((evento.key === "d" || evento.key === "D") && (evento.ctrlKey || evento.metaKey)) {
      evento.preventDefault();
      alternarModoDev();
      return;
    }
    // Ctrl+E (ou Cmd+E no Mac) apaga o save e reinicia o progresso
    if ((evento.key === "e" || evento.key === "E") && (evento.ctrlKey || evento.metaKey)) {
      evento.preventDefault();
      apagarSalvamentoComConfirmacao();
    }
  });

  window.addEventListener("oum:cena", () => {
    refrescarModoDevSeAtivo();
  });
}
