import { tocar } from "../core/audio.js";
import {
  coletarMedalhao,
  coletarEspada,
  concluirE00,
  concluirE01,
  concluirE02,
  definirAnelExterno,
  definirAnelInterno,
  definirRodas,
  definirRodasE01,
  definirRodasE02,
  obterEstado,
  temItem,
} from "../core/estado.js";
import { TITULO_CARTA_ADAGAS } from "../enigmas/e03.js";
import { obterImagemCartaAdagas } from "../dados/imagens.js";
import {
  ALFABETO,
  deslocamentoEntre,
  formatarDeslocamento,
  girarIndice,
  girarLetra,
  INSCRICAO_E00,
  letraNoIndice,
  validarCadeado,
} from "../enigmas/e00.js";
import { validarCadeadoE01 } from "../enigmas/e01.js";
import {
  ROTINA,
  TITULO_PAPEL_ARQUIVO,
  validarCadeadoE02,
} from "../enigmas/e02.js";
import { obterRelato } from "../dados/relatos-arquivo.js";

export function abrirExaminador({
  tipo,
  aoFechar,
  aoAtualizarCena,
  permitirColeta = false,
  // Item do inventário: só fundo escurecido, nome, objeto e Fechar
  nasMaos = false,
  nomeObjeto = "",
  idRelato = "",
}) {
  const existente = document.querySelector(".examinador");
  if (existente) {
    existente.remove();
  }

  const overlay = document.createElement("div");
  overlay.className = nasMaos ? "examinador examinador--nas-maos" : "examinador";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");

  const painel = document.createElement("div");
  painel.className = "examinador__painel";

  const titulo = document.createElement("h2");
  titulo.className = "examinador__titulo";

  const botaoFechar = document.createElement("button");
  botaoFechar.type = "button";
  botaoFechar.className = "botao-texto botao-texto--secundario examinador__fechar";
  botaoFechar.textContent = "Fechar";

  const corpo = document.createElement("div");
  corpo.className = "examinador__corpo";

  const rodape = document.createElement("p");
  rodape.className = "examinador__rodape";

  function fechar() {
    document.removeEventListener("keydown", aoTeclar);
    overlay.remove();
    // Toast “Item recuperado” da espada some junto com o modal
    if (tipo === "espada") {
      void import("./hud.js").then(({ limparToasts }) => {
        limparToasts();
      });
    }
    if (aoFechar) {
      aoFechar();
    }
  }

  function aoTeclar(evento) {
    if (evento.key === "Escape") {
      fechar();
    }
  }

  botaoFechar.addEventListener("click", fechar);
  document.addEventListener("keydown", aoTeclar);

  // Título no topo (centralizado), conteúdo, rodapé e Fechar embaixo
  if (nasMaos) {
    // Sem modal marrom: nome, objeto e Fechar
    painel.append(titulo, corpo, botaoFechar);
  } else {
    painel.append(titulo, corpo, rodape, botaoFechar);
  }
  overlay.append(painel);
  document.getElementById("app").append(overlay);

  if (tipo === "relogio") {
    titulo.textContent = nomeObjeto || "Relógio";
    montarRelogio(corpo, rodape);
  } else if (tipo === "inscricao") {
    titulo.textContent = nomeObjeto || "Inscrição";
    montarInscricao(corpo, rodape);
  } else if (tipo === "medalhao") {
    titulo.textContent = nomeObjeto || "Medalhão";
    montarMedalhao(corpo, rodape, {
      permitirColeta,
      aoAtualizarCena,
      aoFechar: fechar,
      nasMaos,
    });
  } else if (tipo === "cadeado") {
    titulo.textContent = nomeObjeto || "Cadeado";
    montarCadeado(corpo, rodape, { aoFechar: fechar, aoAtualizarCena });
  } else if (tipo === "cadeado-cartas") {
    titulo.textContent = nomeObjeto || "Cadeado da gaveta";
    montarCadeadoCartas(corpo, rodape, { aoFechar: fechar, aoAtualizarCena });
  } else if (tipo === "cadeado-armario") {
    titulo.textContent = nomeObjeto || "Cadeado do armário";
    montarCadeadoArmario(corpo, rodape, { aoFechar: fechar, aoAtualizarCena });
  } else if (tipo === "papel-arquivo") {
    titulo.textContent = nomeObjeto || "Rotina";
    montarPapelArquivo(corpo, rodape, { nasMaos });
  } else if (tipo === "relato-arquivo") {
    const relato = obterRelato(idRelato);
    titulo.textContent = nomeObjeto || relato?.nome || "Relato";
    montarRelatoArquivo(corpo, rodape, { relato, nasMaos });
  } else if (tipo === "carta-adagas") {
    titulo.hidden = false;
    titulo.textContent = nomeObjeto || TITULO_CARTA_ADAGAS;
    montarCartaAdagas(corpo, rodape, {
      aoFechar: fechar,
      nasMaos,
    });
  } else if (tipo === "carta-relogio") {
    titulo.hidden = false;
    titulo.textContent = nomeObjeto || "Carta do relógio";
    montarCartaRelogio(corpo, rodape, { nasMaos });
  } else if (tipo === "espada") {
    titulo.textContent = nomeObjeto || "Espada";
    montarEspada(corpo, rodape, {
      permitirColeta,
      aoAtualizarCena,
      aoFechar: fechar,
      nasMaos,
    });
  } else if (tipo === "armario-vazio") {
    titulo.textContent = nomeObjeto || "Armário";
    montarArmarioVazio(corpo, rodape);
  }

  botaoFechar.focus();
  return overlay;
}

function montarArmarioVazio(corpo, rodape) {
  const nota = document.createElement("p");
  nota.className = "examinador__nota-simples";
  nota.textContent = "O armário está vazio.";
  corpo.append(nota);
  rodape.hidden = true;
}

function montarEspada(
  corpo,
  rodape,
  { permitirColeta = false, aoAtualizarCena, aoFechar, nasMaos = false } = {}
) {
  const palco = document.createElement("div");
  palco.className = "espada-palco";

  const figura = document.createElement("img");
  figura.className = "espada-reliquia";
  figura.src = "assets/inventario/objeto-espada.png";
  figura.alt = "Espada medieval";
  figura.draggable = false;
  palco.append(figura);

  const podeColetar = permitirColeta && !temItem("espada");
  if (nasMaos) {
    corpo.append(palco);
    return;
  }

  if (podeColetar) {
    const botaoColetar = document.createElement("button");
    botaoColetar.type = "button";
    botaoColetar.className = "botao-texto";
    botaoColetar.textContent = "Coletar espada";
    botaoColetar.addEventListener("click", () => {
      coletarEspada();
      botaoColetar.remove();
      rodape.textContent = "A espada foi guardada no Inventário.";
      window.dispatchEvent(new CustomEvent("oum:inventario"));
      import("./inventario.js").then(({ anunciarItem }) => {
        anunciarItem("espada");
      });
      if (aoAtualizarCena) {
        aoAtualizarCena();
      }
      window.setTimeout(() => {
        if (aoFechar) {
          aoFechar();
        }
      }, 700);
    });
    corpo.append(palco, botaoColetar);
    rodape.textContent = "A lâmina descansa no armário aberto.";
    return;
  }

  corpo.append(palco);
  rodape.textContent = temItem("espada")
    ? "Você já guardou a espada no Inventário."
    : "A lâmina descansa no armário aberto.";
}

function montarPapelArquivo(corpo, rodape, { nasMaos = false } = {}) {
  const folha = document.createElement("div");
  folha.className = "papel-arquivo";
  folha.setAttribute("aria-label", TITULO_PAPEL_ARQUIVO);

  const tituloFolha = document.createElement("h3");
  tituloFolha.className = "papel-arquivo__titulo";
  tituloFolha.textContent = TITULO_PAPEL_ARQUIVO;

  const rotina = document.createElement("pre");
  rotina.className = "papel-arquivo__rotina";
  rotina.translate = false;
  rotina.textContent = ROTINA.join("\n");

  folha.append(tituloFolha, rotina);
  corpo.append(folha);
  rodape.textContent = nasMaos
    ? "Rotina do arquivo — guardada no Inventário."
    : "";
}

function montarRelatoArquivo(corpo, rodape, { relato = null, nasMaos = false } = {}) {
  const folha = document.createElement("div");
  folha.className = "papel-arquivo";
  folha.setAttribute(
    "aria-label",
    relato?.titulo || relato?.nome || "Relato do arquivo"
  );

  const tituloFolha = document.createElement("h3");
  tituloFolha.className = "papel-arquivo__titulo";
  tituloFolha.textContent = relato?.titulo || relato?.nome || "Relato";

  const corpoTexto = document.createElement("pre");
  corpoTexto.className = "papel-arquivo__rotina";
  corpoTexto.translate = false;
  corpoTexto.textContent = (relato?.corpo || ["Documento ilegível."]).join(
    "\n\n"
  );

  folha.append(tituloFolha, corpoTexto);
  corpo.append(folha);
  rodape.textContent = nasMaos ? "Guardado no Inventário." : "";
}

function montarCartaAdagas(corpo, rodape, { nasMaos = false } = {}) {
  const palco = document.createElement("div");
  palco.className = "espada-palco carta-adagas-palco";

  const figura = document.createElement("img");
  figura.className = "carta-adagas-reliquia";
  figura.src = obterImagemCartaAdagas();
  figura.alt = TITULO_CARTA_ADAGAS;
  figura.draggable = false;
  palco.append(figura);

  corpo.append(palco);
  rodape.textContent = nasMaos
    ? "Rotina booleana das oito adagas da antecâmara."
    : "";
  if (!nasMaos) {
    rodape.hidden = true;
  }
}

function montarCartaRelogio(corpo, rodape, { nasMaos = false } = {}) {
  const palco = document.createElement("div");
  palco.className = "espada-palco carta-relogio-palco";

  const figura = document.createElement("img");
  figura.className = "carta-relogio-reliquia";
  figura.src = "assets/inventario/objeto-carta-relogio.png";
  figura.alt = "Pergaminho com desenho de um relógio marcando três horas";
  figura.draggable = false;
  palco.append(figura);

  corpo.append(palco);
  rodape.textContent = nasMaos
    ? "Desenho de um relógio — ponteiro curto nas três, longo nas doze."
    : "";
  if (!nasMaos) {
    rodape.hidden = true;
  }
}

function montarRelogio(corpo, rodape) {
  const palco = document.createElement("div");
  palco.className = "relogio-falso";

  const aro = document.createElement("div");
  aro.className = "relogio-falso__aro";

  const face = document.createElement("div");
  face.className = "relogio-falso__face";

  const romanos = [
    "XII",
    "I",
    "II",
    "III",
    "IV",
    "V",
    "VI",
    "VII",
    "VIII",
    "IX",
    "X",
    "XI",
  ];

  for (let hora = 0; hora < 12; hora += 1) {
    const marca = document.createElement("span");
    marca.className = "relogio-falso__marca";
    marca.style.setProperty("--angulo", `${hora * 30}deg`);
    marca.dataset.hora = romanos[hora];
    marca.textContent = romanos[hora];
    face.append(marca);
  }

  const ponteiroHora = document.createElement("div");
  ponteiroHora.className = "relogio-falso__ponteiro relogio-falso__ponteiro--hora";
  // 03:00 — ponteiro das horas a 90°
  ponteiroHora.style.transform = "rotate(90deg)";

  const ponteiroMinuto = document.createElement("div");
  ponteiroMinuto.className =
    "relogio-falso__ponteiro relogio-falso__ponteiro--minuto";
  ponteiroMinuto.style.transform = "rotate(0deg)";

  const eixo = document.createElement("div");
  eixo.className = "relogio-falso__eixo";

  face.append(ponteiroHora, ponteiroMinuto, eixo);
  aro.append(face);
  palco.append(aro);
  corpo.append(palco);
  rodape.textContent =
    "Os ponteiros estão imóveis. O mecanismo parece travado às três horas.";
}

function montarInscricao(corpo, rodape) {
  const placa = document.createElement("div");
  placa.className = "inscricao-falsa";

  const moldura = document.createElement("div");
  moldura.className = "inscricao-falsa__moldura";

  const letras = document.createElement("p");
  letras.className = "inscricao-falsa__letras";
  letras.textContent = INSCRICAO_E00;
  letras.setAttribute(
    "aria-label",
    `Inscrição: ${INSCRICAO_E00.split("").join(" ")}`
  );

  moldura.append(letras);
  placa.append(moldura);
  corpo.append(placa);
  rodape.textContent =
    "Cinco letras gravadas na pedra: I H U U R. Não aceitam chave comum.";
}

const TEXTURA_MEDALHAO = "assets/inventario/objeto-medalhao-base.png";
const PASSO_MEDALHAO = 360 / 26;
const NS_SVG = "http://www.w3.org/2000/svg";

function movimentoReduzido() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function criarNoSvg(tag, atributos = {}) {
  const no = document.createElementNS(NS_SVG, tag);
  Object.entries(atributos).forEach(([chave, valor]) => {
    no.setAttribute(chave, String(valor));
  });
  return no;
}

function polarMedalhao(raio, grau) {
  const rad = ((grau - 90) * Math.PI) / 180;
  return [200 + raio * Math.cos(rad), 200 + raio * Math.sin(rad)];
}

function carregarTexturaMedalhao(url) {
  return new Promise((resolve) => {
    const imagem = new Image();
    imagem.onload = () => resolve(imagem);
    imagem.onerror = () => resolve(null);
    imagem.src = url;
  });
}

function montarAnelSvg({ raioExterno, raioInterno, raioLetra, classe, tamanhoLetra }) {
  const grupo = criarNoSvg("g", { class: `anel ${classe}` });
  grupo.append(
    criarNoSvg("circle", {
      cx: 200,
      cy: 200,
      r: (raioExterno + raioInterno) / 2,
      class: "anel-faixa",
      "stroke-width": raioExterno - raioInterno,
    })
  );
  grupo.append(criarNoSvg("circle", { cx: 200, cy: 200, r: raioExterno, class: "anel-borda" }));
  grupo.append(criarNoSvg("circle", { cx: 200, cy: 200, r: raioInterno, class: "anel-borda" }));
  for (let i = 0; i < 26; i += 1) {
    const angulo = i * PASSO_MEDALHAO + PASSO_MEDALHAO / 2;
    const [x1, y1] = polarMedalhao(raioInterno, angulo);
    const [x2, y2] = polarMedalhao(raioExterno, angulo);
    grupo.append(criarNoSvg("line", { x1, y1, x2, y2, class: "anel-divisao" }));
    const [lx, ly] = polarMedalhao(raioLetra, i * PASSO_MEDALHAO);
    const letra = criarNoSvg("text", {
      x: lx,
      y: ly,
      class: "anel-letra",
      "font-size": tamanhoLetra,
      transform: `rotate(${i * PASSO_MEDALHAO} ${lx} ${ly})`,
      "text-anchor": "middle",
      "dominant-baseline": "central",
    });
    letra.dataset.indice = String(i);
    letra.textContent = ALFABETO[i];
    grupo.append(letra);
  }
  return grupo;
}

function montarSvgMedalhao() {
  const raiz = criarNoSvg("svg", {
    viewBox: "0 0 400 400",
    class: "medalhao-svg",
    role: "img",
    "aria-label": "Medalhão com dois anéis de alfabeto",
  });
  const defs = criarNoSvg("defs");
  defs.innerHTML = `
      <radialGradient id="medalhao-grad-latao" cx="40%" cy="35%" r="75%">
        <stop offset="0%" stop-color="#b59a63"/><stop offset="55%" stop-color="#7d6438"/><stop offset="100%" stop-color="#3f3019"/>
      </radialGradient>
      <radialGradient id="medalhao-grad-ferro" cx="40%" cy="35%" r="80%">
        <stop offset="0%" stop-color="#8b877d"/><stop offset="60%" stop-color="#55524b"/><stop offset="100%" stop-color="#26241f"/>
      </radialGradient>
      <radialGradient id="medalhao-grad-centro" cx="45%" cy="40%" r="70%">
        <stop offset="0%" stop-color="#5a4a30"/><stop offset="100%" stop-color="#1d170e"/>
      </radialGradient>
      <mask id="medalhao-mascara-externo"><rect width="400" height="400" fill="black"/><circle cx="200" cy="200" r="192" fill="white"/><circle cx="200" cy="200" r="150" fill="black"/></mask>
      <mask id="medalhao-mascara-interno"><rect width="400" height="400" fill="black"/><circle cx="200" cy="200" r="146" fill="white"/><circle cx="200" cy="200" r="104" fill="black"/></mask>
      <filter id="medalhao-gravado" x="-20%" y="-20%" width="140%" height="140%">
        <feOffset dx="0.6" dy="0.8" in="SourceAlpha" result="sombra"/>
        <feFlood flood-color="#f3e2b5" flood-opacity="0.35"/>
        <feComposite in2="sombra" operator="in" result="luz"/>
        <feMerge><feMergeNode in="luz"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>`;
  raiz.append(defs);
  raiz.append(criarNoSvg("circle", { cx: 200, cy: 200, r: 198, class: "medalhao-aro" }));

  const externo = montarAnelSvg({
    raioExterno: 192,
    raioInterno: 150,
    raioLetra: 171,
    classe: "anel-externo",
    tamanhoLetra: 22,
  });
  const interno = montarAnelSvg({
    raioExterno: 146,
    raioInterno: 104,
    raioLetra: 125,
    classe: "anel-interno",
    tamanhoLetra: 20,
  });
  raiz.append(externo, interno);
  raiz.append(criarNoSvg("circle", { cx: 200, cy: 200, r: 100, class: "medalhao-centro" }));
  raiz.append(criarNoSvg("circle", { cx: 200, cy: 200, r: 18, class: "medalhao-eixo" }));
  raiz.append(criarNoSvg("path", { d: "M200 14 L193 1 L207 1 Z", class: "medalhao-ponteiro" }));
  return { raiz, externo, interno };
}

function montarMedalhao(
  corpo,
  rodape,
  { permitirColeta, aoAtualizarCena, aoFechar, nasMaos = false } = {}
) {
  const estado = obterEstado();
  // No inventário: sempre começa com A alinhado no ponteiro dos dois anéis
  const posicoes = nasMaos ? [0, 0] : [estado.anelExterno, estado.anelInterno];

  const palco = document.createElement("div");
  palco.className = "medalhao-palco";

  const medalhao = document.createElement("div");
  medalhao.className = "medalhao";

  const base = document.createElement("div");
  base.className = "medalhao-base";

  const { raiz, externo, interno } = montarSvgMedalhao();
  const gruposAnel = [externo, interno];

  externo.tabIndex = 0;
  externo.setAttribute("role", "slider");
  externo.setAttribute("aria-label", "Anel externo");
  externo.setAttribute("aria-valuemin", "0");
  externo.setAttribute("aria-valuemax", "25");

  interno.tabIndex = 0;
  interno.setAttribute("role", "slider");
  interno.setAttribute("aria-label", "Anel interno");
  interno.setAttribute("aria-valuemin", "0");
  interno.setAttribute("aria-valuemax", "25");

  const brilho = document.createElement("div");
  brilho.className = "medalhao-brilho";
  medalhao.append(base, raiz, brilho);
  palco.append(medalhao);

  carregarTexturaMedalhao(TEXTURA_MEDALHAO).then((imagem) => {
    if (!imagem) {
      return;
    }
    // Textura PNG transparente por cima do bronze — sem fundo preto
    base.style.backgroundImage = `url("${imagem.src}"), radial-gradient(circle at 38% 32%, #8f7a52 0%, #5a4828 45%, #2a2013 100%)`;
    base.style.backgroundSize = "cover, cover";
    base.style.backgroundPosition = "center, center";
    base.style.backgroundRepeat = "no-repeat, no-repeat";
    [
      [externo, "medalhao-mascara-externo", 0],
      [interno, "medalhao-mascara-interno", 137],
    ].forEach(([grupo, mascara, giro]) => {
      const textura = criarNoSvg("image", {
        href: imagem.src,
        x: 0,
        y: 0,
        width: 400,
        height: 400,
        mask: `url(#${mascara})`,
        transform: `rotate(${giro} 200 200)`,
        preserveAspectRatio: "xMidYMid slice",
      });
      grupo.insertBefore(textura, grupo.firstChild);
    });
    medalhao.classList.add("com-textura");
  });

  // Leitura, dicas e setas só fora do modo “nas mãos” (inventário)
  let leitura = null;
  let deslocamento = null;
  let grupos = null;
  if (!nasMaos) {
    leitura = document.createElement("p");
    leitura.className = "medalhao-leitura";
    leitura.setAttribute("aria-live", "polite");
    deslocamento = document.createElement("p");
    deslocamento.className = "medalhao-deslocamento";
    grupos = document.createElement("div");
    grupos.className = "medalhao-grupos";
    grupos.append(
      criarGrupoDePinos("Anel externo", 0, (direcao) => girarAnel(0, direcao)),
      criarGrupoDePinos("Anel interno", 1, (direcao) => girarAnel(1, direcao))
    );
  }

  let arraste = null;

  function aplicarAnel(qual, animar = true) {
    const grupo = gruposAnel[qual];
    grupo.style.transition =
      animar && !movimentoReduzido()
        ? "transform 0.35s cubic-bezier(.3,.7,.3,1)"
        : "none";
    grupo.style.transform = `rotate(${-posicoes[qual] * PASSO_MEDALHAO}deg)`;
    for (const letra of grupo.querySelectorAll(".anel-letra")) {
      letra.classList.toggle("alinhada", Number(letra.dataset.indice) === posicoes[qual]);
    }
    grupo.setAttribute("aria-valuenow", String(posicoes[qual]));
    grupo.setAttribute("aria-valuetext", letraNoIndice(posicoes[qual]));
  }

  function redesenhar(animar = true) {
    aplicarAnel(0, animar);
    aplicarAnel(1, animar);
    if (!leitura || !deslocamento) {
      return;
    }
    const externa = letraNoIndice(posicoes[0]);
    const interna = letraNoIndice(posicoes[1]);
    leitura.textContent = `${externa} no anel externo está alinhado a ${interna} no anel interno.`;
    const delta = deslocamentoEntre(posicoes[0], posicoes[1]);
    deslocamento.textContent =
      delta === -3 || delta === 3
        ? `Deslocamento: ${formatarDeslocamento(delta)} — César −3`
        : `Deslocamento: ${formatarDeslocamento(delta)}`;
  }

  function persistirAneis() {
    // Giro no inventário é só visual — não altera o estado do enigma
    if (nasMaos) {
      return;
    }
    definirAnelExterno(posicoes[0]);
    definirAnelInterno(posicoes[1]);
  }

  function girarAnel(qual, direcao) {
    posicoes[qual] = girarIndice(posicoes[qual], direcao);
    tocar("giro");
    redesenhar(true);
    persistirAneis();
  }

  function pontoNoSvg(evento) {
    const caixa = raiz.getBoundingClientRect();
    const cx = caixa.left + caixa.width / 2;
    const cy = caixa.top + caixa.height / 2;
    const escala = 400 / Math.max(caixa.width, 1);
    const dx = (evento.clientX - cx) * escala;
    const dy = (evento.clientY - cy) * escala;
    return { angulo: Math.atan2(dy, dx), raio: Math.hypot(dx, dy) };
  }

  function anelSobOPonteiro(evento) {
    const { raio } = pontoNoSvg(evento);
    if (raio >= 148 && raio <= 198) {
      return 0;
    }
    if (raio >= 100 && raio < 148) {
      return 1;
    }
    return -1;
  }

  function aoSeta(evento, qual) {
    if (evento.key === "ArrowRight" || evento.key === "ArrowUp") {
      evento.preventDefault();
      girarAnel(qual, 1);
    } else if (evento.key === "ArrowLeft" || evento.key === "ArrowDown") {
      evento.preventDefault();
      girarAnel(qual, -1);
    }
  }

  externo.addEventListener("keydown", (evento) => aoSeta(evento, 0));
  interno.addEventListener("keydown", (evento) => aoSeta(evento, 1));

  if (!movimentoReduzido()) {
    palco.addEventListener("pointermove", (evento) => {
      if (arraste) {
        return;
      }
      const caixa = palco.getBoundingClientRect();
      const dx = (evento.clientX - caixa.left) / caixa.width - 0.5;
      const dy = (evento.clientY - caixa.top) / caixa.height - 0.5;
      medalhao.style.setProperty("--rx", `${(-dy * 16).toFixed(2)}deg`);
      medalhao.style.setProperty("--ry", `${(dx * 16).toFixed(2)}deg`);
      brilho.style.setProperty("--bx", `${(50 + dx * 60).toFixed(1)}%`);
      brilho.style.setProperty("--by", `${(50 + dy * 60).toFixed(1)}%`);
    });
    palco.addEventListener("pointerleave", () => {
      medalhao.style.setProperty("--rx", "0deg");
      medalhao.style.setProperty("--ry", "0deg");
    });
  }

  raiz.addEventListener("pointerdown", (evento) => {
    if (evento.button !== 0) {
      return;
    }
    const anel = anelSobOPonteiro(evento);
    if (anel < 0) {
      return;
    }
    evento.preventDefault();
    raiz.setPointerCapture(evento.pointerId);
    arraste = {
      anel,
      angulo: pontoNoSvg(evento).angulo,
      origem: posicoes[anel],
    };
    medalhao.classList.add("girando");
  });

  raiz.addEventListener("pointermove", (evento) => {
    if (!arraste) {
      return;
    }
    let delta = pontoNoSvg(evento).angulo - arraste.angulo;
    while (delta > Math.PI) {
      delta -= Math.PI * 2;
    }
    while (delta < -Math.PI) {
      delta += Math.PI * 2;
    }
    const passosHorarios = Math.round(delta / ((Math.PI * 2) / 26));
    const nova = girarIndice(arraste.origem, -passosHorarios);
    if (nova === posicoes[arraste.anel]) {
      return;
    }
    posicoes[arraste.anel] = nova;
    tocar("giro");
    redesenhar(false);
    persistirAneis();
  });

  const soltar = () => {
    if (!arraste) {
      return;
    }
    arraste = null;
    medalhao.classList.remove("girando");
    redesenhar(true);
  };
  raiz.addEventListener("pointerup", soltar);
  raiz.addEventListener("pointercancel", soltar);

  const podeColetar = permitirColeta && !temItem("medalhao");
  if (nasMaos) {
    corpo.append(palco);
  } else if (podeColetar) {
    const botaoColetar = document.createElement("button");
    botaoColetar.type = "button";
    botaoColetar.className = "botao-texto";
    botaoColetar.textContent = "Coletar medalhão";
    botaoColetar.addEventListener("click", () => {
      coletarMedalhao();
      botaoColetar.remove();
      rodape.textContent = "O medalhão foi guardado no Inventário.";
      window.dispatchEvent(new CustomEvent("oum:inventario"));
      import("./inventario.js").then(({ anunciarItem }) => {
        anunciarItem("medalhao");
      });
      if (aoAtualizarCena) {
        aoAtualizarCena();
      }
      window.setTimeout(() => {
        if (aoFechar) {
          aoFechar();
        }
      }, 700);
    });
    corpo.append(palco, leitura, deslocamento, grupos, botaoColetar);
  } else {
    corpo.append(palco, leitura, deslocamento, grupos);
  }

  if (!nasMaos) {
    rodape.textContent =
      "Arraste cada anel, use as travas ou as setas. O índice no alto mostra as letras alinhadas.";
  }

  redesenhar(false);
}

function criarGrupoDePinos(nome, indice, aoGirar) {
  const grupo = document.createElement("div");
  grupo.className = "medalhao-grupo";
  const titulo = document.createElement("p");
  titulo.textContent = nome;
  const pinos = document.createElement("div");
  pinos.className = "pinos";
  pinos.append(
    criarPino("Letra anterior", indice, -1, "chevron-esquerda", aoGirar),
    criarPino("Letra seguinte", indice, 1, "chevron-direita", aoGirar)
  );
  grupo.append(titulo, pinos);
  return grupo;
}

function criarPino(acao, indice, direcao, classeChevron, aoGirar) {
  const botao = document.createElement("button");
  botao.type = "button";
  botao.className = "pino";
  const anel = indice === 0 ? "anel externo" : "anel interno";
  botao.setAttribute("aria-label", `${acao} do ${anel}`);
  const chevron = document.createElement("span");
  chevron.className = `chevron ${classeChevron}`;
  chevron.setAttribute("aria-hidden", "true");
  botao.append(chevron);
  botao.addEventListener("click", () => aoGirar(direcao));
  return botao;
}

// Direção mais curta no alfabeto para animar a roda ao digitar
function direcaoGiroEntre(de, para) {
  const origem = ALFABETO.indexOf(String(de || "A").toUpperCase());
  const destino = ALFABETO.indexOf(String(para || "A").toUpperCase());
  if (origem < 0 || destino < 0 || origem === destino) {
    return 0;
  }
  let delta = destino - origem;
  if (delta > 13) {
    delta -= 26;
  }
  if (delta < -13) {
    delta += 26;
  }
  return delta > 0 ? 1 : -1;
}

function normalizarCombinacao(valor, quantidade) {
  return String(valor || "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, quantidade);
}

// Risquinhos sob o cadeado: digita em qualquer lugar com o examinador aberto
function criarDigitacaoCadeado({
  quantidade,
  letrasIniciais,
  desabilitado = false,
  aoAlterar,
  aoConfirmar,
}) {
  const raiz = document.createElement("div");
  raiz.className = "cadeado-digitacao";
  raiz.style.setProperty("--cadeado-digitos", String(quantidade));
  raiz.setAttribute("role", "group");
  raiz.setAttribute("aria-label", "Digite a combinação do cadeado");

  const slots = document.createElement("div");
  slots.className = "cadeado-digitacao__slots";
  const celulas = [];
  const letras = normalizarCombinacao((letrasIniciais || []).join(""), quantidade)
    .padEnd(quantidade, "A")
    .slice(0, quantidade)
    .split("");
  let posicao = 0;
  let ativo = !desabilitado;

  for (let indice = 0; indice < quantidade; indice += 1) {
    const slot = document.createElement("button");
    slot.type = "button";
    slot.className = "cadeado-digitacao__slot";
    slot.setAttribute("aria-label", `Letra ${indice + 1}`);
    const letraEl = document.createElement("span");
    letraEl.className = "cadeado-digitacao__letra";
    const risco = document.createElement("span");
    risco.className = "cadeado-digitacao__risco";
    slot.append(letraEl, risco);
    slot.addEventListener("click", () => {
      if (!ativo) {
        return;
      }
      posicao = indice;
      pintarSlots();
    });
    slots.append(slot);
    celulas.push({ slot, letra: letraEl });
  }

  function pintarSlots() {
    for (let indice = 0; indice < quantidade; indice += 1) {
      celulas[indice].letra.textContent = letras[indice] || "";
      celulas[indice].slot.classList.toggle("preenchido", Boolean(letras[indice]));
      celulas[indice].slot.classList.toggle("ativo", ativo && posicao === indice);
      celulas[indice].slot.disabled = !ativo;
    }
  }

  function aoTeclarDocumento(evento) {
    if (!ativo || !raiz.isConnected) {
      if (!raiz.isConnected) {
        document.removeEventListener("keydown", aoTeclarDocumento);
        document.removeEventListener("paste", aoColarDocumento);
      }
      return;
    }

    // Não intercepta se o foco estiver em outro campo de texto real
    const alvo = evento.target;
    if (
      alvo &&
      (alvo.tagName === "INPUT" ||
        alvo.tagName === "TEXTAREA" ||
        alvo.isContentEditable)
    ) {
      return;
    }

    // Setas nas rodas do cadeado continuam controlando as rodas
    if (
      alvo &&
      alvo.classList &&
      alvo.classList.contains("roda") &&
      evento.key.startsWith("Arrow")
    ) {
      return;
    }

    if (evento.key === "Enter") {
      evento.preventDefault();
      if (typeof aoConfirmar === "function") {
        aoConfirmar();
      }
      return;
    }

    if (evento.key === "Backspace" || evento.key === "Delete") {
      evento.preventDefault();
      if (evento.key === "Backspace") {
        // Apaga a letra atual; se já for A, volta uma casa e apaga a anterior
        if (letras[posicao] !== "A") {
          letras[posicao] = "A";
        } else if (posicao > 0) {
          posicao -= 1;
          letras[posicao] = "A";
        }
      } else {
        letras[posicao] = "A";
      }
      if (typeof aoAlterar === "function") {
        aoAlterar(letras.slice());
      }
      pintarSlots();
      return;
    }

    if (evento.key === "ArrowLeft") {
      evento.preventDefault();
      posicao = Math.max(0, posicao - 1);
      pintarSlots();
      return;
    }

    if (evento.key === "ArrowRight") {
      evento.preventDefault();
      posicao = Math.min(quantidade - 1, posicao + 1);
      pintarSlots();
      return;
    }

    if (evento.key.length !== 1 || !/[a-zA-Z]/.test(evento.key)) {
      return;
    }

    evento.preventDefault();
    const letra = evento.key.toUpperCase();
    letras[posicao] = letra;
    if (typeof aoAlterar === "function") {
      aoAlterar(letras.slice());
    }
    if (posicao < quantidade - 1) {
      posicao += 1;
    }
    pintarSlots();
  }

  function aoColarDocumento(evento) {
    if (!ativo || !raiz.isConnected) {
      return;
    }
    const texto = normalizarCombinacao(
      (evento.clipboardData || window.clipboardData)?.getData("text") || "",
      quantidade
    );
    if (!texto) {
      return;
    }
    evento.preventDefault();
    for (let indice = 0; indice < texto.length; indice += 1) {
      letras[indice] = texto[indice];
    }
    if (typeof aoAlterar === "function") {
      aoAlterar(letras.slice());
    }
    posicao = Math.min(quantidade - 1, texto.length);
    if (texto.length >= quantidade) {
      posicao = quantidade - 1;
    }
    pintarSlots();
  }

  if (!desabilitado) {
    document.addEventListener("keydown", aoTeclarDocumento);
    document.addEventListener("paste", aoColarDocumento);
  }

  raiz.append(slots);
  pintarSlots();

  return {
    elemento: raiz,
    atualizar(novasLetras) {
      const texto = normalizarCombinacao((novasLetras || []).join(""), quantidade);
      for (let indice = 0; indice < quantidade; indice += 1) {
        letras[indice] = texto[indice] || letras[indice] || "A";
      }
      pintarSlots();
    },
    desabilitar() {
      ativo = false;
      document.removeEventListener("keydown", aoTeclarDocumento);
      document.removeEventListener("paste", aoColarDocumento);
      pintarSlots();
    },
  };
}

function montarCadeado(corpo, rodape, { aoFechar, aoAtualizarCena }) {
  const estado = obterEstado();
  const rodas = [...estado.rodasE00];
  let travada = estado.e00Resolvido;
  const temporizadores = [];
  let digitacao = null;

  const cadeado = document.createElement("div");
  cadeado.className = "cadeado";

  const argola = document.createElement("div");
  argola.className = "cadeado-argola";
  argola.setAttribute("aria-hidden", "true");

  const caixa = document.createElement("div");
  caixa.className = "cadeado-corpo";
  if (travada) {
    caixa.classList.add("aberto");
  }

  const rebites = document.createElement("div");
  rebites.className = "cadeado-rebites";
  rebites.setAttribute("aria-hidden", "true");
  for (let i = 0; i < 4; i += 1) {
    rebites.append(document.createElement("span"));
  }

  const janela = document.createElement("div");
  janela.className = "cadeado-janela";
  const elementos = [];

  function pintar(indice, direcao) {
    const botao = elementos[indice];
    const letra = rodas[indice];
    botao.querySelector(".roda-anterior").textContent = girarLetra(letra, -1);
    botao.querySelector(".roda-atual").textContent = letra;
    botao.querySelector(".roda-seguinte").textContent = girarLetra(letra, 1);
    botao.setAttribute("aria-label", `Roda ${indice + 1}, letra ${letra}`);
    botao.dataset.letra = letra;
    if (!direcao) {
      return;
    }
    const atual = botao.querySelector(".roda-atual");
    atual.classList.remove("rola-sobe", "rola-desce");
    void atual.offsetWidth;
    atual.classList.add(direcao > 0 ? "rola-sobe" : "rola-desce");
  }

  function girar(indice, direcao) {
    if (travada) {
      return;
    }
    rodas[indice] = girarLetra(rodas[indice], direcao);
    tocar("giro");
    pintar(indice, direcao);
    definirRodas(rodas.slice());
    if (digitacao) {
      digitacao.atualizar(rodas);
    }
  }

  function instalarRoda(botao, indice) {
    let origemY = null;
    let arrastou = false;

    botao.addEventListener("pointerdown", (evento) => {
      if (evento.button !== 0 || travada) {
        return;
      }
      botao.setPointerCapture(evento.pointerId);
      origemY = evento.clientY;
      arrastou = false;
    });

    botao.addEventListener("pointermove", (evento) => {
      if (origemY == null || travada) {
        return;
      }
      const dy = evento.clientY - origemY;
      if (Math.abs(dy) < 16) {
        return;
      }
      arrastou = true;
      girar(indice, dy < 0 ? 1 : -1);
      origemY = evento.clientY;
    });

    botao.addEventListener("pointerup", () => {
      origemY = null;
    });
    botao.addEventListener("pointercancel", () => {
      origemY = null;
    });

    botao.addEventListener("click", (evento) => {
      if (arrastou) {
        arrastou = false;
        return;
      }
      if (travada || evento.detail === 0) {
        return;
      }
      const rect = botao.getBoundingClientRect();
      const acima = evento.clientY < rect.top + rect.height / 2;
      girar(indice, acima ? 1 : -1);
    });

    botao.addEventListener("keydown", (evento) => {
      if (evento.key === "ArrowUp") {
        evento.preventDefault();
        girar(indice, 1);
      } else if (evento.key === "ArrowDown") {
        evento.preventDefault();
        girar(indice, -1);
      } else if (evento.key === "ArrowRight" || evento.key === "ArrowLeft") {
        evento.preventDefault();
        const delta = evento.key === "ArrowRight" ? 1 : -1;
        elementos[(indice + delta + 5) % 5].focus();
      }
    });
  }

  for (let indice = 0; indice < 5; indice += 1) {
    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = "roda";
    botao.dataset.indice = String(indice);
    const anterior = document.createElement("span");
    anterior.className = "roda-letra roda-anterior";
    const atual = document.createElement("span");
    atual.className = "roda-letra roda-atual";
    const seguinte = document.createElement("span");
    seguinte.className = "roda-letra roda-seguinte";
    botao.append(anterior, atual, seguinte);
    janela.append(botao);
    elementos.push(botao);
    instalarRoda(botao, indice);
  }

  const lingueta = document.createElement("button");
  lingueta.type = "button";
  lingueta.className = "lingueta";
  lingueta.setAttribute("aria-label", "Acionar lingueta");
  const haste = document.createElement("span");
  haste.className = "lingueta-haste";
  lingueta.append(haste);

  caixa.append(rebites, janela, lingueta);
  cadeado.append(argola, caixa);

  digitacao = criarDigitacaoCadeado({
    quantidade: 5,
    letrasIniciais: rodas,
    desabilitado: travada,
    aoAlterar(letrasDigitadas) {
      if (travada) {
        return;
      }
      let mudou = false;
      for (let indice = 0; indice < rodas.length; indice += 1) {
        const nova = letrasDigitadas[indice];
        if (!nova || nova === rodas[indice]) {
          continue;
        }
        const direcao = direcaoGiroEntre(rodas[indice], nova) || 1;
        rodas[indice] = nova;
        pintar(indice, direcao);
        mudou = true;
      }
      if (mudou) {
        tocar("giro");
        definirRodas(rodas.slice());
      }
    },
    aoConfirmar() {
      lingueta.click();
    },
  });

  function maisTarde(fn, atraso) {
    const id = window.setTimeout(fn, atraso);
    temporizadores.push(id);
  }

  lingueta.addEventListener("click", () => {
    if (travada) {
      return;
    }

    haste.classList.add("puxada");
    const resultado = validarCadeado(rodas, true);

    if (!resultado.ok) {
      tocar("erro");
      maisTarde(() => {
        if (!haste.isConnected) {
          return;
        }
        haste.classList.remove("puxada");
        haste.classList.add("recua");
      }, 180);
      maisTarde(() => {
        if (haste.isConnected) {
          haste.classList.remove("recua");
        }
      }, 380);
      return;
    }

    travada = true;
    digitacao.desabilitar();
    tocar("acerto");
    haste.classList.add("presa");
    caixa.classList.add("aberto");
    concluirE00();
    if (aoAtualizarCena) {
      aoAtualizarCena();
    }
    maisTarde(() => {
      for (const id of temporizadores) {
        window.clearTimeout(id);
      }
      aoFechar();
    }, 900);
  });

  corpo.append(cadeado, digitacao.elemento);
  rodape.textContent = "";
  rodas.forEach((_, indice) => pintar(indice, 0));
}

function montarCadeadoArmario(corpo, rodape, { aoFechar, aoAtualizarCena }) {
  const estado = obterEstado();
  const rodas = [...estado.rodasE02];
  let travada = estado.e02Resolvido;
  const temporizadores = [];
  let digitacao = null;

  const cadeado = document.createElement("div");
  cadeado.className = "cadeado";

  const argola = document.createElement("div");
  argola.className = "cadeado-argola";
  argola.setAttribute("aria-hidden", "true");

  const caixa = document.createElement("div");
  caixa.className = "cadeado-corpo";
  if (travada) {
    caixa.classList.add("aberto");
  }

  const rebites = document.createElement("div");
  rebites.className = "cadeado-rebites";
  rebites.setAttribute("aria-hidden", "true");
  for (let i = 0; i < 4; i += 1) {
    rebites.append(document.createElement("span"));
  }

  const janela = document.createElement("div");
  janela.className = "cadeado-janela";
  const elementos = [];

  function pintar(indice, direcao) {
    const botao = elementos[indice];
    const letra = rodas[indice];
    botao.querySelector(".roda-anterior").textContent = girarLetra(letra, -1);
    botao.querySelector(".roda-atual").textContent = letra;
    botao.querySelector(".roda-seguinte").textContent = girarLetra(letra, 1);
    botao.setAttribute("aria-label", `Roda ${indice + 1}, letra ${letra}`);
    botao.dataset.letra = letra;
    if (!direcao) {
      return;
    }
    const atual = botao.querySelector(".roda-atual");
    atual.classList.remove("rola-sobe", "rola-desce");
    void atual.offsetWidth;
    atual.classList.add(direcao > 0 ? "rola-sobe" : "rola-desce");
  }

  function girar(indice, direcao) {
    if (travada) {
      return;
    }
    rodas[indice] = girarLetra(rodas[indice], direcao);
    tocar("giro");
    pintar(indice, direcao);
    definirRodasE02(rodas.slice());
    if (digitacao) {
      digitacao.atualizar(rodas);
    }
  }

  function instalarRoda(botao, indice) {
    let origemY = null;
    let arrastou = false;

    botao.addEventListener("pointerdown", (evento) => {
      if (evento.button !== 0 || travada) {
        return;
      }
      botao.setPointerCapture(evento.pointerId);
      origemY = evento.clientY;
      arrastou = false;
    });

    botao.addEventListener("pointermove", (evento) => {
      if (origemY == null || travada) {
        return;
      }
      const dy = evento.clientY - origemY;
      if (Math.abs(dy) < 16) {
        return;
      }
      arrastou = true;
      girar(indice, dy < 0 ? 1 : -1);
      origemY = evento.clientY;
    });

    botao.addEventListener("pointerup", () => {
      origemY = null;
    });
    botao.addEventListener("pointercancel", () => {
      origemY = null;
    });

    botao.addEventListener("click", (evento) => {
      if (arrastou) {
        arrastou = false;
        return;
      }
      if (travada || evento.detail === 0) {
        return;
      }
      const rect = botao.getBoundingClientRect();
      const acima = evento.clientY < rect.top + rect.height / 2;
      girar(indice, acima ? 1 : -1);
    });

    botao.addEventListener("keydown", (evento) => {
      if (evento.key === "ArrowUp") {
        evento.preventDefault();
        girar(indice, 1);
      } else if (evento.key === "ArrowDown") {
        evento.preventDefault();
        girar(indice, -1);
      } else if (evento.key === "ArrowRight" || evento.key === "ArrowLeft") {
        evento.preventDefault();
        const delta = evento.key === "ArrowRight" ? 1 : -1;
        elementos[(indice + delta + 5) % 5].focus();
      }
    });
  }

  for (let indice = 0; indice < 5; indice += 1) {
    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = "roda";
    botao.dataset.indice = String(indice);
    const anterior = document.createElement("span");
    anterior.className = "roda-letra roda-anterior";
    const atual = document.createElement("span");
    atual.className = "roda-letra roda-atual";
    const seguinte = document.createElement("span");
    seguinte.className = "roda-letra roda-seguinte";
    botao.append(anterior, atual, seguinte);
    janela.append(botao);
    elementos.push(botao);
    instalarRoda(botao, indice);
  }

  const lingueta = document.createElement("button");
  lingueta.type = "button";
  lingueta.className = "lingueta";
  lingueta.setAttribute("aria-label", "Acionar lingueta");
  const haste = document.createElement("span");
  haste.className = "lingueta-haste";
  lingueta.append(haste);

  caixa.append(rebites, janela, lingueta);
  cadeado.append(argola, caixa);

  digitacao = criarDigitacaoCadeado({
    quantidade: 5,
    letrasIniciais: rodas,
    desabilitado: travada,
    aoAlterar(letrasDigitadas) {
      if (travada) {
        return;
      }
      let mudou = false;
      for (let indice = 0; indice < rodas.length; indice += 1) {
        const nova = letrasDigitadas[indice];
        if (!nova || nova === rodas[indice]) {
          continue;
        }
        const direcao = direcaoGiroEntre(rodas[indice], nova) || 1;
        rodas[indice] = nova;
        pintar(indice, direcao);
        mudou = true;
      }
      if (mudou) {
        tocar("giro");
        definirRodasE02(rodas.slice());
      }
    },
    aoConfirmar() {
      lingueta.click();
    },
  });

  function maisTarde(fn, atraso) {
    const id = window.setTimeout(fn, atraso);
    temporizadores.push(id);
  }

  lingueta.addEventListener("click", () => {
    if (travada) {
      return;
    }

    haste.classList.add("puxada");
    const resultado = validarCadeadoE02(rodas, true);

    if (!resultado.ok) {
      tocar("erro");
      maisTarde(() => {
        if (!haste.isConnected) {
          return;
        }
        haste.classList.remove("puxada");
        haste.classList.add("recua");
      }, 180);
      maisTarde(() => {
        if (haste.isConnected) {
          haste.classList.remove("recua");
        }
      }, 380);
      return;
    }

    travada = true;
    digitacao.desabilitar();
    tocar("acerto");
    haste.classList.add("presa");
    caixa.classList.add("aberto");
    concluirE02();
    if (aoAtualizarCena) {
      aoAtualizarCena();
    }
    maisTarde(() => {
      for (const id of temporizadores) {
        window.clearTimeout(id);
      }
      aoFechar();
    }, 900);
  });

  corpo.append(cadeado, digitacao.elemento);
  rodape.textContent = "";
  rodas.forEach((_, indice) => pintar(indice, 0));
}

function montarCadeadoCartas(corpo, rodape, { aoFechar, aoAtualizarCena }) {
  const estado = obterEstado();
  const rodas = [...estado.rodasE01];
  let travada = estado.e01Resolvido || estado.gavetaCartasAberta;
  const temporizadores = [];
  let digitacao = null;

  const cadeado = document.createElement("div");
  cadeado.className = "cadeado cadeado--quatro";

  const argola = document.createElement("div");
  argola.className = "cadeado-argola";
  argola.setAttribute("aria-hidden", "true");

  const caixa = document.createElement("div");
  caixa.className = "cadeado-corpo";
  if (travada) {
    caixa.classList.add("aberto");
  }

  const rebites = document.createElement("div");
  rebites.className = "cadeado-rebites";
  rebites.setAttribute("aria-hidden", "true");
  for (let i = 0; i < 4; i += 1) {
    rebites.append(document.createElement("span"));
  }

  const janela = document.createElement("div");
  janela.className = "cadeado-janela";
  const elementos = [];

  function pintar(indice, direcao) {
    const botao = elementos[indice];
    const letra = rodas[indice];
    botao.querySelector(".roda-anterior").textContent = girarLetra(letra, -1);
    botao.querySelector(".roda-atual").textContent = letra;
    botao.querySelector(".roda-seguinte").textContent = girarLetra(letra, 1);
    botao.setAttribute("aria-label", `Roda ${indice + 1}, letra ${letra}`);
    botao.dataset.letra = letra;
    if (!direcao) {
      return;
    }
    const atual = botao.querySelector(".roda-atual");
    atual.classList.remove("rola-sobe", "rola-desce");
    void atual.offsetWidth;
    atual.classList.add(direcao > 0 ? "rola-sobe" : "rola-desce");
  }

  function girar(indice, direcao) {
    if (travada) {
      return;
    }
    rodas[indice] = girarLetra(rodas[indice], direcao);
    tocar("giro");
    pintar(indice, direcao);
    definirRodasE01(rodas.slice());
    if (digitacao) {
      digitacao.atualizar(rodas);
    }
  }

  function instalarRoda(botao, indice) {
    let origemY = null;
    let arrastou = false;

    botao.addEventListener("pointerdown", (evento) => {
      if (evento.button !== 0 || travada) {
        return;
      }
      botao.setPointerCapture(evento.pointerId);
      origemY = evento.clientY;
      arrastou = false;
    });

    botao.addEventListener("pointermove", (evento) => {
      if (origemY == null || travada) {
        return;
      }
      const dy = evento.clientY - origemY;
      if (Math.abs(dy) < 16) {
        return;
      }
      arrastou = true;
      girar(indice, dy < 0 ? 1 : -1);
      origemY = evento.clientY;
    });

    botao.addEventListener("pointerup", () => {
      origemY = null;
    });
    botao.addEventListener("pointercancel", () => {
      origemY = null;
    });

    botao.addEventListener("click", (evento) => {
      if (arrastou) {
        arrastou = false;
        return;
      }
      if (travada || evento.detail === 0) {
        return;
      }
      const rect = botao.getBoundingClientRect();
      const acima = evento.clientY < rect.top + rect.height / 2;
      girar(indice, acima ? 1 : -1);
    });

    botao.addEventListener("keydown", (evento) => {
      if (evento.key === "ArrowUp") {
        evento.preventDefault();
        girar(indice, 1);
      } else if (evento.key === "ArrowDown") {
        evento.preventDefault();
        girar(indice, -1);
      } else if (evento.key === "ArrowRight" || evento.key === "ArrowLeft") {
        evento.preventDefault();
        const delta = evento.key === "ArrowRight" ? 1 : -1;
        elementos[(indice + delta + 4) % 4].focus();
      }
    });
  }

  for (let indice = 0; indice < 4; indice += 1) {
    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = "roda";
    botao.dataset.indice = String(indice);
    const anterior = document.createElement("span");
    anterior.className = "roda-letra roda-anterior";
    const atual = document.createElement("span");
    atual.className = "roda-letra roda-atual";
    const seguinte = document.createElement("span");
    seguinte.className = "roda-letra roda-seguinte";
    botao.append(anterior, atual, seguinte);
    janela.append(botao);
    elementos.push(botao);
    instalarRoda(botao, indice);
  }

  const lingueta = document.createElement("button");
  lingueta.type = "button";
  lingueta.className = "lingueta";
  lingueta.setAttribute("aria-label", "Acionar lingueta");
  const haste = document.createElement("span");
  haste.className = "lingueta-haste";
  lingueta.append(haste);

  caixa.append(rebites, janela, lingueta);
  cadeado.append(argola, caixa);

  digitacao = criarDigitacaoCadeado({
    quantidade: 4,
    letrasIniciais: rodas,
    desabilitado: travada,
    aoAlterar(letrasDigitadas) {
      if (travada) {
        return;
      }
      let mudou = false;
      for (let indice = 0; indice < rodas.length; indice += 1) {
        const nova = letrasDigitadas[indice];
        if (!nova || nova === rodas[indice]) {
          continue;
        }
        const direcao = direcaoGiroEntre(rodas[indice], nova) || 1;
        rodas[indice] = nova;
        pintar(indice, direcao);
        mudou = true;
      }
      if (mudou) {
        tocar("giro");
        definirRodasE01(rodas.slice());
      }
    },
    aoConfirmar() {
      lingueta.click();
    },
  });

  function maisTarde(fn, atraso) {
    const id = window.setTimeout(fn, atraso);
    temporizadores.push(id);
  }

  lingueta.addEventListener("click", () => {
    if (travada) {
      return;
    }

    haste.classList.add("puxada");
    const resultado = validarCadeadoE01(rodas, true);

    if (!resultado.ok) {
      tocar("erro");
      maisTarde(() => {
        if (!haste.isConnected) {
          return;
        }
        haste.classList.remove("puxada");
        haste.classList.add("recua");
      }, 180);
      maisTarde(() => {
        if (haste.isConnected) {
          haste.classList.remove("recua");
        }
      }, 380);
      return;
    }

    travada = true;
    digitacao.desabilitar();
    tocar("acerto");
    haste.classList.add("presa");
    caixa.classList.add("aberto");
    concluirE01();
    if (aoAtualizarCena) {
      aoAtualizarCena();
    }
    maisTarde(() => {
      for (const id of temporizadores) {
        window.clearTimeout(id);
      }
      aoFechar();
    }, 900);
  });

  corpo.append(cadeado, digitacao.elemento);
  rodape.textContent = "";
  rodas.forEach((_, indice) => pintar(indice, 0));
}
