import {
  pararTrilhaBatalha,
  tocarHitEspada,
  tocarParryAleatorio,
  tocarTrilhaBatalha,
} from "../core/audio.js";

const DURACAO_BATALHA_MS = 35000;
const VIDAS_INICIAIS = 3;
const MARGEM_PCT = 10;
const DISTANCIA_MIN_PCT = 18;
const DISTANCIA_ESPALHADA_PCT = 28;
// Spawn rápido às vezes vira cluster; na maioria das vezes espalha pela tela
const SPAWN_RAPIDO_MS = 620;
const CHANCE_CLUSTER_NO_RAPIDO = 0.35;
const DISTANCIA_PERTO_MIN = 9;
const DISTANCIA_PERTO_MAX = 16;
// Gap mínimo entre momentos de clique (anel encostando) — dá pra acertar em sequência
const GAP_CLIQUE_MS = 380;
// Fração do tempo total em que o anel já está na zona válida (halo → centro)
const JANELA_ACERTO_FRACAO = 0.28;
// Anel nasce bem maior (sensação de encolher mais rápido), mas chega no halo no mesmo tempo
const ESCALA_ANEL_INICIO = 3.55;
// Halo fixo (área válida) — não cresce com o start do anel
const ESCALA_ZONA = 1.65;
// Folga pra “encostar” na borda já contar como válido
const FOLGA_TOQUE_HALO = 0.05;
// % da animação em que o anel toca o halo (mesmo pacing de antes)
const PROGRESSO_TOQUE_HALO = 1 - JANELA_ACERTO_FRACAO;
const MAX_ALVOS = 5;

// Momento em que o anel externo encosta na borda do halo
function intervaloAcertoMs(janelaMs) {
  const inicio = janelaMs * Math.max(0, PROGRESSO_TOQUE_HALO - FOLGA_TOQUE_HALO);
  const fim = janelaMs * 1.08;
  return { inicio, fim };
}

// Progresso 0..1 ao longo dos 35s → dificuldade (ainda jogável)
function obterDificuldade(progresso) {
  const p = Math.min(1, Math.max(0, progresso));
  // Janela do anel: 1,25s → 0,78s
  const janelaMs = 1250 - p * 470;
  // Vários na tela cedo; sobe até 5 no fim
  const maxSimultaneos = Math.min(MAX_ALVOS, 2 + Math.floor(p * 3.1));
  // Delay base entre spawns (sempre escalonado, nunca no mesmo frame)
  const intervaloSpawnMs = 780 - p * 380;
  return { janelaMs, maxSimultaneos, intervaloSpawnMs };
}

function aleatorioEntre(min, max) {
  return min + Math.random() * (max - min);
}

function limitarPosicao(left, top) {
  return {
    left: Math.min(100 - MARGEM_PCT, Math.max(MARGEM_PCT, left)),
    top: Math.min(100 - MARGEM_PCT - 6, Math.max(MARGEM_PCT + 4, top)),
  };
}

function posicaoPertoDe(origem, ocupados) {
  for (let tentativa = 0; tentativa < 24; tentativa += 1) {
    const angulo = Math.random() * Math.PI * 2;
    const dist = aleatorioEntre(DISTANCIA_PERTO_MIN, DISTANCIA_PERTO_MAX);
    const candidata = limitarPosicao(
      origem.left + Math.cos(angulo) * dist,
      origem.top + Math.sin(angulo) * dist
    );
    const ok = ocupados.every((o) => {
      const dx = o.left - candidata.left;
      const dy = o.top - candidata.top;
      return Math.hypot(dx, dy) >= DISTANCIA_MIN_PCT * 0.7;
    });
    if (ok) {
      return candidata;
    }
  }
  return limitarPosicao(
    origem.left + aleatorioEntre(-10, 10),
    origem.top + aleatorioEntre(-10, 10)
  );
}

function distanciaMinimaAte(candidata, ocupados) {
  if (!ocupados.length) {
    return Number.POSITIVE_INFINITY;
  }
  let menor = Number.POSITIVE_INFINITY;
  for (const o of ocupados) {
    const d = Math.hypot(o.left - candidata.left, o.top - candidata.top);
    if (d < menor) {
      menor = d;
    }
  }
  return menor;
}

function posicaoLivre(ocupados, distanciaMin = DISTANCIA_MIN_PCT) {
  for (let tentativa = 0; tentativa < 28; tentativa += 1) {
    const left = aleatorioEntre(MARGEM_PCT, 100 - MARGEM_PCT);
    const top = aleatorioEntre(MARGEM_PCT + 4, 100 - MARGEM_PCT - 6);
    if (distanciaMinimaAte({ left, top }, ocupados) >= distanciaMin) {
      return { left, top };
    }
  }
  return {
    left: aleatorioEntre(MARGEM_PCT, 100 - MARGEM_PCT),
    top: aleatorioEntre(MARGEM_PCT + 4, 100 - MARGEM_PCT - 6),
  };
}

// Prefere outro canto / lado da tela em relação ao último spawn
function posicaoEspalhada(ocupados, ultima) {
  const melhor = { left: 50, top: 50, score: -1 };
  for (let tentativa = 0; tentativa < 36; tentativa += 1) {
    let left = aleatorioEntre(MARGEM_PCT, 100 - MARGEM_PCT);
    let top = aleatorioEntre(MARGEM_PCT + 4, 100 - MARGEM_PCT - 6);
    // Empurra para o lado oposto do último alvo (~metade das tentativas)
    if (ultima && Math.random() < 0.55) {
      left =
        ultima.left < 50
          ? aleatorioEntre(55, 100 - MARGEM_PCT)
          : aleatorioEntre(MARGEM_PCT, 45);
      top =
        ultima.top < 50
          ? aleatorioEntre(55, 100 - MARGEM_PCT - 6)
          : aleatorioEntre(MARGEM_PCT + 4, 45);
    }
    const candidata = { left, top };
    const dist = distanciaMinimaAte(candidata, ocupados);
    if (dist < DISTANCIA_MIN_PCT) {
      continue;
    }
    if (dist > melhor.score) {
      melhor.left = left;
      melhor.top = top;
      melhor.score = dist;
    }
    if (dist >= DISTANCIA_ESPALHADA_PCT) {
      return candidata;
    }
  }
  if (melhor.score > 0) {
    return { left: melhor.left, top: melhor.top };
  }
  return posicaoLivre(ocupados, DISTANCIA_MIN_PCT);
}

function escolherPosicaoSpawn({
  ocupados,
  ultimaPosicao,
  spawnRapido,
  clustersSeguidos,
}) {
  // Cluster só de vez em quando (e no máx. 2 seguidos)
  const podeCluster =
    spawnRapido &&
    ultimaPosicao &&
    clustersSeguidos < 2 &&
    Math.random() < CHANCE_CLUSTER_NO_RAPIDO;

  if (podeCluster) {
    return { pos: posicaoPertoDe(ultimaPosicao, ocupados), foiCluster: true };
  }
  return {
    pos: posicaoEspalhada(ocupados, ultimaPosicao),
    foiCluster: false,
  };
}

// Momento em que o anel encosta (pico do clique)
function momentoCliqueDe(alvo) {
  return alvo.nascidoEm + alvo.janelaMs;
}

function montarInstrucoes(overlay, aoContinuar) {
  const painel = document.createElement("div");
  painel.className = "minigame-aparadas__painel";

  const titulo = document.createElement("h2");
  titulo.className = "minigame-aparadas__titulo";
  titulo.textContent = "Apare os ataques!";

  const texto = document.createElement("p");
  texto.className = "minigame-aparadas__texto";
  texto.textContent =
    "Mova o mouse até o alvo e clique quando o anel externo entrar na área clara ao redor do círculo.";

  const dicas = document.createElement("div");
  dicas.className = "minigame-aparadas__dicas";
  dicas.innerHTML = `
    <div class="minigame-aparadas__dica">
      <span class="minigame-aparadas__dica-icone minigame-aparadas__dica-icone--alvo" aria-hidden="true">
        <span class="minigame-aparadas__dica-zona"></span>
        <span class="minigame-aparadas__dica-nucleo"><span class="minigame-aparadas__dica-espada" aria-hidden="true"></span></span>
      </span>
    </div>
    <div class="minigame-aparadas__dica">
      <span class="minigame-aparadas__dica-icone minigame-aparadas__dica-icone--anel" aria-hidden="true">
        <span class="minigame-aparadas__dica-zona"></span>
        <span class="minigame-aparadas__dica-nucleo"><span class="minigame-aparadas__dica-espada" aria-hidden="true"></span></span>
        <span class="minigame-aparadas__dica-anel"></span>
      </span>
    </div>
    <div class="minigame-aparadas__dica">
      <span class="minigame-aparadas__dica-icone minigame-aparadas__dica-icone--encaixe" aria-hidden="true">
        <span class="minigame-aparadas__dica-zona minigame-aparadas__dica-zona--pronta"></span>
        <span class="minigame-aparadas__dica-nucleo minigame-aparadas__dica-nucleo--pronto"><span class="minigame-aparadas__dica-espada" aria-hidden="true"></span></span>
        <span class="minigame-aparadas__dica-anel minigame-aparadas__dica-anel--encaixe"></span>
      </span>
    </div>
  `;

  const botao = document.createElement("button");
  botao.type = "button";
  botao.className = "minigame-aparadas__continuar";
  botao.textContent = "Continuar";
  botao.addEventListener("click", () => {
    aoContinuar();
  });

  painel.append(titulo, texto, dicas, botao);
  overlay.append(painel);
  return painel;
}

function montarHudVidas(overlay, vidas) {
  const hud = document.createElement("div");
  hud.className = "minigame-aparadas__vidas";
  hud.setAttribute("aria-label", `Vidas: ${vidas}`);
  for (let i = 0; i < VIDAS_INICIAIS; i += 1) {
    const icone = document.createElement("span");
    icone.className = "minigame-aparadas__vida";
    if (i >= vidas) {
      icone.classList.add("minigame-aparadas__vida--perdida");
    }
    hud.append(icone);
  }
  overlay.append(hud);
  return hud;
}

function atualizarHudVidas(hud, vidas) {
  const icones = hud.querySelectorAll(".minigame-aparadas__vida");
  icones.forEach((icone, indice) => {
    icone.classList.toggle("minigame-aparadas__vida--perdida", indice >= vidas);
  });
  hud.setAttribute("aria-label", `Vidas: ${vidas}`);
}

/**
 * Overlay de instruções → batalha 35s com ramp.
 * @returns {Promise<"vitoria" | "derrota">}
 */
export function abrirMinigameAparadas() {
  return new Promise((resolver) => {
    const existente = document.querySelector(".minigame-aparadas");
    if (existente) {
      existente.remove();
    }

    const overlay = document.createElement("div");
    overlay.className = "minigame-aparadas";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");

    const escurecido = document.createElement("div");
    escurecido.className = "minigame-aparadas__escurecido";
    overlay.append(escurecido);

    const area = document.createElement("div");
    area.className = "minigame-aparadas__area";
    overlay.append(area);

    document.getElementById("app")?.append(overlay);

    let finalizado = false;
    let vidas = VIDAS_INICIAIS;
    let hudVidas = null;
    let alvos = [];
    let timerBatalha = null;
    let timerSpawn = null;
    let inicioBatalha = 0;
    let animFrame = 0;
    let ultimoSpawnEm = 0;
    let ultimaPosicaoSpawn = null;
    let clustersSeguidos = 0;

    function limparAlvos() {
      for (const alvo of alvos) {
        alvo.el.remove();
      }
      alvos = [];
    }

    function encerrar(resultado) {
      if (finalizado) {
        return;
      }
      finalizado = true;
      window.cancelAnimationFrame(animFrame);
      if (timerBatalha) {
        window.clearTimeout(timerBatalha);
      }
      if (timerSpawn) {
        window.clearTimeout(timerSpawn);
      }
      limparAlvos();
      pararTrilhaBatalha();
      overlay.remove();
      resolver(resultado);
    }

    function perderVida() {
      if (finalizado) {
        return;
      }
      vidas -= 1;
      tocarHitEspada();
      if (hudVidas) {
        atualizarHudVidas(hudVidas, vidas);
      }
      overlay.classList.remove("minigame-aparadas--hit");
      void overlay.offsetWidth;
      overlay.classList.add("minigame-aparadas--hit");
      if (vidas <= 0) {
        encerrar("derrota");
      }
    }

    function removerAlvo(alvo, comAcerto) {
      const indice = alvos.indexOf(alvo);
      if (indice >= 0) {
        alvos.splice(indice, 1);
      }
      if (comAcerto) {
        alvo.el.classList.add("minigame-aparadas__alvo--acerto");
        window.setTimeout(() => alvo.el.remove(), 160);
      } else {
        alvo.el.classList.add("minigame-aparadas__alvo--erro");
        window.setTimeout(() => alvo.el.remove(), 180);
      }
    }

    function spawnAlvo() {
      if (finalizado) {
        return;
      }
      const agora = performance.now();
      const progresso = (agora - inicioBatalha) / DURACAO_BATALHA_MS;
      const dificuldade = obterDificuldade(progresso);
      if (alvos.length >= dificuldade.maxSimultaneos) {
        return;
      }

      const deltaDesdeUltimo =
        ultimoSpawnEm > 0 ? agora - ultimoSpawnEm : Number.POSITIVE_INFINITY;
      const spawnRapido = deltaDesdeUltimo < SPAWN_RAPIDO_MS;

      // Às vezes cluster; na maior parte espalha pela tela
      const { pos, foiCluster } = escolherPosicaoSpawn({
        ocupados: alvos,
        ultimaPosicao: ultimaPosicaoSpawn,
        spawnRapido,
        clustersSeguidos,
      });
      clustersSeguidos = foiCluster ? clustersSeguidos + 1 : 0;

      // Anéis com tempos diferentes: clique pico não coincide com outro alvo
      let janelaMs = dificuldade.janelaMs * aleatorioEntre(0.92, 1.08);
      const nascidoEm = agora;
      let momentoClique = nascidoEm + janelaMs;
      for (const outro of alvos) {
        if (outro.resolvido) {
          continue;
        }
        const picoOutro = momentoCliqueDe(outro);
        if (Math.abs(momentoClique - picoOutro) < GAP_CLIQUE_MS) {
          momentoClique = picoOutro + GAP_CLIQUE_MS;
          janelaMs = Math.max(720, momentoClique - nascidoEm);
        }
      }

      const el = document.createElement("button");
      el.type = "button";
      el.className = "minigame-aparadas__alvo";
      el.style.left = `${pos.left}%`;
      el.style.top = `${pos.top}%`;
      el.style.setProperty("--escala-zona", String(ESCALA_ZONA));
      el.setAttribute("aria-label", "Aparar");

      // Hitbox = halo inteiro (área válida de aparar)
      const hit = document.createElement("span");
      hit.className = "minigame-aparadas__hit";
      hit.setAttribute("aria-hidden", "true");

      const anel = document.createElement("span");
      anel.className = "minigame-aparadas__anel";
      const zona = document.createElement("span");
      zona.className = "minigame-aparadas__zona";
      const nucleo = document.createElement("span");
      nucleo.className = "minigame-aparadas__nucleo";
      const icone = document.createElement("span");
      icone.className = "minigame-aparadas__icone-espada";
      icone.setAttribute("aria-hidden", "true");
      nucleo.append(icone);
      el.append(hit, anel, zona, nucleo);
      area.append(el);

      const alvo = {
        el,
        left: pos.left,
        top: pos.top,
        nascidoEm,
        janelaMs,
        resolvido: false,
      };
      alvos.push(alvo);
      ultimoSpawnEm = agora;
      ultimaPosicaoSpawn = pos;

      anel.style.setProperty("--janela-ms", `${janelaMs}ms`);
      anel.style.setProperty("--escala-inicio", String(ESCALA_ANEL_INICIO));
      anel.style.setProperty("--escala-zona", String(ESCALA_ZONA));
      anel.style.setProperty(
        "--progresso-toque",
        `${PROGRESSO_TOQUE_HALO * 100}%`
      );
      void anel.offsetWidth;
      anel.classList.add("minigame-aparadas__anel--fecha");

      el.addEventListener("pointerdown", (evento) => {
        evento.preventDefault();
        evento.stopPropagation();
        if (alvo.resolvido || finalizado) {
          return;
        }
        const decorrido = performance.now() - alvo.nascidoEm;
        const { inicio, fim } = intervaloAcertoMs(alvo.janelaMs);
        if (decorrido >= inicio && decorrido <= fim) {
          alvo.resolvido = true;
          tocarParryAleatorio();
          removerAlvo(alvo, true);
        } else {
          alvo.resolvido = true;
          removerAlvo(alvo, false);
          perderVida();
        }
      });
    }

    function agendarProximoSpawn() {
      if (finalizado) {
        return;
      }
      const progresso = (performance.now() - inicioBatalha) / DURACAO_BATALHA_MS;
      const { intervaloSpawnMs } = obterDificuldade(progresso);
      // Mais tempo folgado que cluster: espalha melhor pela tela
      const fator = aleatorioEntre(0.7, 1.45);
      const espera = Math.max(320, intervaloSpawnMs * fator);
      timerSpawn = window.setTimeout(() => {
        spawnAlvo();
        agendarProximoSpawn();
      }, espera);
    }

    function tickAlvos() {
      if (finalizado) {
        return;
      }
      const agora = performance.now();
      for (const alvo of [...alvos]) {
        if (alvo.resolvido) {
          continue;
        }
        const decorrido = agora - alvo.nascidoEm;
        const { inicio, fim } = intervaloAcertoMs(alvo.janelaMs);
        const naJanela = decorrido >= inicio && decorrido <= fim;
        alvo.el.classList.toggle("minigame-aparadas__alvo--pronto", naJanela);

        if (decorrido >= alvo.janelaMs * 1.08) {
          alvo.resolvido = true;
          removerAlvo(alvo, false);
          perderVida();
        }
      }
      animFrame = window.requestAnimationFrame(tickAlvos);
    }

    function iniciarBatalha() {
      const painel = overlay.querySelector(".minigame-aparadas__painel");
      if (painel) {
        painel.remove();
      }
      escurecido.classList.add("minigame-aparadas__escurecido--batalha");
      overlay.classList.add("minigame-aparadas--batalha");

      hudVidas = montarHudVidas(overlay, vidas);
      inicioBatalha = performance.now();
      tocarTrilhaBatalha();

      // Um alvo só no início; os próximos entram com delay
      spawnAlvo();
      agendarProximoSpawn();
      animFrame = window.requestAnimationFrame(tickAlvos);

      timerBatalha = window.setTimeout(() => {
        encerrar("vitoria");
      }, DURACAO_BATALHA_MS);
    }

    area.addEventListener("pointerdown", (evento) => {
      if (!overlay.classList.contains("minigame-aparadas--batalha") || finalizado) {
        return;
      }
      if (evento.target.closest(".minigame-aparadas__alvo")) {
        return;
      }
      if (alvos.length > 0) {
        perderVida();
      }
    });

    montarInstrucoes(overlay, iniciarBatalha);
  });
}
