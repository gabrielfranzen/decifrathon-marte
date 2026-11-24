const CHAVE_MUDO = "oum-mudo";

let contexto = null;
let mestre = null;
let ambienteAtual = null;
let ruidoBuffer = null;
let mudo = false;

try {
  mudo = window.localStorage.getItem(CHAVE_MUDO) === "1";
} catch {
  // Persistência opcional
}

const PERFIS_AMBIENTE = {
  exterior: { corte: 900, volume: 0.16, drone: 55, droneVolume: 0.025, rajadas: true },
  pedra: { corte: 420, volume: 0.1, drone: 49, droneVolume: 0.035, rajadas: false },
};

export function iniciarAudio() {
  if (contexto) {
    if (contexto.state === "suspended") {
      contexto.resume();
    }
    return;
  }

  const Construtor = window.AudioContext || window.webkitAudioContext;
  if (!Construtor) {
    return;
  }

  contexto = new Construtor();
  mestre = contexto.createGain();
  mestre.gain.value = mudo ? 0 : 0.9;
  mestre.connect(contexto.destination);

  const tamanho = contexto.sampleRate * 2;
  ruidoBuffer = contexto.createBuffer(1, tamanho, contexto.sampleRate);
  const dados = ruidoBuffer.getChannelData(0);
  let ultimo = 0;
  for (let i = 0; i < tamanho; i += 1) {
    const branco = Math.random() * 2 - 1;
    ultimo = (ultimo + 0.02 * branco) / 1.02;
    dados[i] = ultimo * 3.5;
  }
}

function fonteRuido(loop = false) {
  const fonte = contexto.createBufferSource();
  fonte.buffer = ruidoBuffer;
  fonte.loop = loop;
  return fonte;
}

function envelope(ganho, inicio, ataque, sustentar, queda, pico) {
  ganho.gain.setValueAtTime(0.0001, inicio);
  ganho.gain.exponentialRampToValueAtTime(pico, inicio + ataque);
  ganho.gain.setValueAtTime(pico, inicio + ataque + sustentar);
  ganho.gain.exponentialRampToValueAtTime(0.0001, inicio + ataque + sustentar + queda);
}

function rajadaRuido({
  inicio,
  duracao,
  frequencia,
  q = 1,
  tipo = "bandpass",
  pico = 0.3,
  ataque = 0.005,
}) {
  const fonte = fonteRuido();
  const filtro = contexto.createBiquadFilter();
  filtro.type = tipo;
  filtro.frequency.value = frequencia;
  filtro.Q.value = q;
  const ganho = contexto.createGain();
  envelope(ganho, inicio, ataque, 0, duracao, pico);
  fonte.connect(filtro).connect(ganho).connect(mestre);
  fonte.start(inicio, Math.random());
  fonte.stop(inicio + duracao + 0.1);
}

function tom({
  inicio,
  frequencia,
  duracao,
  tipo = "sine",
  pico = 0.1,
  ataque = 0.004,
  deslize = null,
}) {
  const osc = contexto.createOscillator();
  osc.type = tipo;
  osc.frequency.setValueAtTime(frequencia, inicio);
  if (deslize) {
    osc.frequency.exponentialRampToValueAtTime(deslize, inicio + duracao);
  }
  const ganho = contexto.createGain();
  envelope(ganho, inicio, ataque, 0, duracao, pico);
  osc.connect(ganho).connect(mestre);
  osc.start(inicio);
  osc.stop(inicio + duracao + 0.1);
}

function metal(inicio, base, pico) {
  [1, 2.76, 5.4, 8.93].forEach((fator, i) => {
    tom({
      inicio,
      frequencia: base * fator,
      duracao: 0.5 / (i + 1) + 0.15,
      tipo: "sine",
      pico: pico / (i + 1.5),
    });
  });
  rajadaRuido({ inicio, duracao: 0.08, frequencia: 2400, q: 2, pico: pico * 1.2 });
}

const SONS = {
  passo(t) {
    rajadaRuido({
      inicio: t,
      duracao: 0.12,
      frequencia: 260,
      q: 0.8,
      tipo: "lowpass",
      pico: 0.35,
    });
  },
  papel(t) {
    rajadaRuido({
      inicio: t,
      duracao: 0.18,
      frequencia: 3200,
      q: 0.6,
      tipo: "highpass",
      pico: 0.12,
    });
    rajadaRuido({
      inicio: t + 0.12,
      duracao: 0.22,
      frequencia: 2600,
      q: 0.6,
      tipo: "highpass",
      pico: 0.08,
    });
  },
  acerto(t) {
    [196, 293.66, 392].forEach((f, i) =>
      tom({ inicio: t + i * 0.09, frequencia: f, duracao: 2.2, tipo: "sine", pico: 0.09 })
    );
    metal(t, 392, 0.04);
  },
  erro(t) {
    tom({
      inicio: t,
      frequencia: 110,
      duracao: 0.25,
      tipo: "triangle",
      pico: 0.18,
      deslize: 70,
    });
    rajadaRuido({
      inicio: t,
      duracao: 0.12,
      frequencia: 200,
      tipo: "lowpass",
      pico: 0.3,
    });
  },
  item(t) {
    metal(t, 520, 0.06);
    tom({ inicio: t + 0.05, frequencia: 784, duracao: 0.9, pico: 0.05 });
  },
  giro(t) {
    rajadaRuido({ inicio: t, duracao: 0.03, frequencia: 3800, q: 3, pico: 0.18 });
    tom({ inicio: t, frequencia: 1800, duracao: 0.05, tipo: "square", pico: 0.015 });
  },
  metalPorta(t) {
    rajadaRuido({
      inicio: t,
      duracao: 0.6,
      frequencia: 120,
      q: 0.6,
      tipo: "lowpass",
      pico: 0.7,
    });
    metal(t + 0.01, 150, 0.12);
  },
  // Passo pesado de placas (perseguidor no C01)
  passoArmadura(t) {
    rajadaRuido({
      inicio: t,
      duracao: 0.18,
      frequencia: 140,
      q: 0.7,
      tipo: "lowpass",
      pico: 0.42,
      ataque: 0.008,
    });
    rajadaRuido({
      inicio: t + 0.02,
      duracao: 0.1,
      frequencia: 420,
      q: 1.1,
      tipo: "bandpass",
      pico: 0.16,
    });
    metal(t + 0.01, 180, 0.055);
  },
};

export function tocar(nome) {
  if (!contexto || mudo) {
    return;
  }
  const som = SONS[nome];
  if (!som) {
    return;
  }
  try {
    som(contexto.currentTime + 0.02);
  } catch {
    // Falhas de áudio não devem travar o jogo
  }
}

function pararAmbiente() {
  if (!ambienteAtual || !contexto) {
    return;
  }
  const atual = ambienteAtual;
  ambienteAtual = null;
  const t = contexto.currentTime;
  atual.ganho.gain.cancelScheduledValues(t);
  atual.ganho.gain.setValueAtTime(atual.ganho.gain.value, t);
  atual.ganho.gain.linearRampToValueAtTime(0, t + 1.2);
  window.setTimeout(() => {
    atual.nos.forEach((no) => {
      try {
        no.stop();
      } catch {
        // Já parado
      }
    });
  }, 1400);
}

export function tocarAmbiente(perfilNome = "exterior") {
  if (!contexto) {
    return;
  }
  if (ambienteAtual && ambienteAtual.perfil === perfilNome) {
    return;
  }
  pararAmbiente();

  const perfil = PERFIS_AMBIENTE[perfilNome] || PERFIS_AMBIENTE.exterior;
  const t = contexto.currentTime;
  const ganho = contexto.createGain();
  ganho.gain.setValueAtTime(0, t);
  ganho.gain.linearRampToValueAtTime(1, t + 2.5);
  ganho.connect(mestre);

  const vento = fonteRuido(true);
  const filtro = contexto.createBiquadFilter();
  filtro.type = "lowpass";
  filtro.frequency.value = perfil.corte;
  const ventoGanho = contexto.createGain();
  ventoGanho.gain.value = perfil.volume;
  vento.connect(filtro).connect(ventoGanho).connect(ganho);
  vento.start();

  const nos = [vento];
  if (perfil.rajadas) {
    const lfo = contexto.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGanho = contexto.createGain();
    lfoGanho.gain.value = perfil.corte * 0.45;
    lfo.connect(lfoGanho).connect(filtro.frequency);
    lfo.start();
    nos.push(lfo);
  }

  const drone = contexto.createOscillator();
  drone.type = "sine";
  drone.frequency.value = perfil.drone;
  const droneGanho = contexto.createGain();
  droneGanho.gain.value = perfil.droneVolume;
  drone.connect(droneGanho).connect(ganho);
  drone.start();
  nos.push(drone);

  ambienteAtual = { perfil: perfilNome, ganho, nos };
}

export function pararAudioAmbiente() {
  pararAmbiente();
}

export function alternarMudo() {
  mudo = !mudo;
  try {
    window.localStorage.setItem(CHAVE_MUDO, mudo ? "1" : "0");
  } catch {
    // Persistência opcional
  }
  if (mestre) {
    mestre.gain.value = mudo ? 0 : 0.9;
  }
  if (audioTrilhaBatalha) {
    audioTrilhaBatalha.volume = mudo ? 0 : 0.75;
  }
  if (audioTrilhaFinal) {
    audioTrilhaFinal.volume = mudo ? 0 : 0.8;
  }
  return mudo;
}

export function estaMudo() {
  return mudo;
}

const AUDIOS_ARQUIVO = {
  returnByDeath: "assets/audios/Return-by-death-sound-effect.mp3",
  knifeSlash: "assets/audios/Knife Slash.mp3",
  bladesClash: "assets/audios/Blades sound effect.mp3",
  knightRunning: "assets/audios/Knight running.mp3",
  bladeParry1: "assets/audios/battle/Blade sound 1.mp3",
  bladeParry2: "assets/audios/battle/Blade sound 2.mp3",
  bladeParry3: "assets/audios/battle/Blade sound 3.mp3",
  bladeHit: "assets/audios/battle/Blade hit sound.mp3",
  battleSoundtrack: "assets/audios/battle/Battle-soundtrack.mp3",
  finalSoundtrack: "assets/Final-soundtrack.mp3",
};

const NOMES_PARRY = ["bladeParry1", "bladeParry2", "bladeParry3"];

// Segundo 2:55 da Final-soundtrack — punchline CAVALEIRO
export const MARCO_CAVALEIRO_SEG = 175;

let audioArquivoAtual = null;
let finalizarArquivoAtual = null;
let audioTrilhaBatalha = null;
let aoFimTrilhaBatalha = null;
let audioTrilhaFinal = null;
let ouvintesMarcoTrilhaFinal = [];

function interromperArquivoAtual() {
  if (audioArquivoAtual) {
    audioArquivoAtual.pause();
    audioArquivoAtual = null;
  }
  if (finalizarArquivoAtual) {
    const finalizar = finalizarArquivoAtual;
    finalizarArquivoAtual = null;
    finalizar();
  }
}

// Para o MP3 atual (ex.: cortar Blades no meio ao ir pra fuga).
export function pararArquivo() {
  interromperArquivoAtual();
}

// Duração conhecida do Battle-soundtrack.mp3 (~35s; fallback se metadata falhar)
export const DURACAO_TRILHA_BATALHA_MS = 35000;

// Soundtrack da batalha (uma passagem); não é interrompida por SFX curtos
// Resolve com a duração em ms pra o minigame sincronizar o fim
export function tocarTrilhaBatalha() {
  pararTrilhaBatalha();
  const url = AUDIOS_ARQUIVO.battleSoundtrack;
  if (!url) {
    return Promise.resolve(DURACAO_TRILHA_BATALHA_MS);
  }
  try {
    const audio = new Audio(encodeURI(url));
    audio.loop = false;
    audio.volume = mudo ? 0 : 0.75;
    audioTrilhaBatalha = audio;
    audio.addEventListener(
      "ended",
      () => {
        if (audioTrilhaBatalha === audio) {
          audioTrilhaBatalha = null;
        }
        const cb = aoFimTrilhaBatalha;
        aoFimTrilhaBatalha = null;
        if (typeof cb === "function") {
          cb();
        }
      },
      { once: true }
    );
    const promessa = audio.play();
    if (promessa && typeof promessa.catch === "function") {
      promessa.catch(() => {
        // Autoplay falhou — não trava o minigame
      });
    }

    return new Promise((resolver) => {
      let resolvido = false;
      const finalizar = () => {
        if (resolvido) {
          return;
        }
        resolvido = true;
        const segundos = audio.duration;
        const ms =
          Number.isFinite(segundos) && segundos > 1
            ? Math.round(segundos * 1000)
            : DURACAO_TRILHA_BATALHA_MS;
        resolver(ms);
      };
      if (audio.readyState >= 1) {
        finalizar();
      } else {
        audio.addEventListener("loadedmetadata", finalizar, { once: true });
        window.setTimeout(finalizar, 900);
      }
    });
  } catch {
    return Promise.resolve(DURACAO_TRILHA_BATALHA_MS);
  }
}

// Vitória no minigame: dispara no fim real da trilha (evento ended)
export function quandoTrilhaBatalhaTerminar(callback) {
  aoFimTrilhaBatalha = typeof callback === "function" ? callback : null;
}

export function pararTrilhaBatalha() {
  aoFimTrilhaBatalha = null;
  if (!audioTrilhaBatalha) {
    return;
  }
  audioTrilhaBatalha.pause();
  audioTrilhaBatalha = null;
}

function aplicarPreservaPitch(audio, preservar) {
  if ("preservesPitch" in audio) {
    audio.preservesPitch = preservar;
  }
  if ("mozPreservesPitch" in audio) {
    audio.mozPreservesPitch = preservar;
  }
  if ("webkitPreservesPitch" in audio) {
    audio.webkitPreservesPitch = preservar;
  }
}

function notificarMarcosTrilhaFinal() {
  if (!audioTrilhaFinal) {
    return;
  }
  const tempo = audioTrilhaFinal.currentTime || 0;
  const restantes = [];
  for (const ouvinte of ouvintesMarcoTrilhaFinal) {
    if (tempo >= ouvinte.segundos) {
      try {
        ouvinte.callback();
      } catch {
        // Callback do marco não deve quebrar o áudio
      }
    } else {
      restantes.push(ouvinte);
    }
  }
  ouvintesMarcoTrilhaFinal = restantes;
}

// Soundtrack do final: começa no fade do xadrez; sem loop
export function tocarTrilhaFinal({ taxa = 1 } = {}) {
  pararTrilhaFinal();
  pararAmbiente();
  const url = AUDIOS_ARQUIVO.finalSoundtrack;
  if (!url) {
    return;
  }
  try {
    const audio = new Audio(encodeURI(url));
    audio.loop = false;
    audio.volume = mudo ? 0 : 0.8;
    const taxaSegura = Number.isFinite(taxa) && taxa > 0 ? taxa : 1;
    audio.playbackRate = taxaSegura;
    // Mantém o tom ao acelerar com o slider dos créditos
    aplicarPreservaPitch(audio, true);
    audioTrilhaFinal = audio;
    audio.addEventListener("timeupdate", notificarMarcosTrilhaFinal);
    const promessa = audio.play();
    if (promessa && typeof promessa.catch === "function") {
      promessa.catch(() => {});
    }
  } catch {
    // Falha de autoplay — a sequência visual segue
  }
}

export function pararTrilhaFinal() {
  ouvintesMarcoTrilhaFinal = [];
  if (!audioTrilhaFinal) {
    return;
  }
  audioTrilhaFinal.pause();
  audioTrilhaFinal = null;
}

export function obterTempoTrilhaFinal() {
  return audioTrilhaFinal?.currentTime || 0;
}

export function trilhaFinalAtiva() {
  return Boolean(audioTrilhaFinal);
}

export function definirTaxaTrilhaFinal(taxa) {
  if (!audioTrilhaFinal) {
    return;
  }
  const taxaSegura = Math.min(5, Math.max(0.5, Number(taxa) || 1));
  audioTrilhaFinal.playbackRate = taxaSegura;
  aplicarPreservaPitch(audioTrilhaFinal, true);
}

// Dispara quando currentTime da faixa atinge `segundos` (posição na track)
export function aoChegarMarcoTrilhaFinal(segundos, callback) {
  const alvo = Number(segundos);
  if (!Number.isFinite(alvo) || typeof callback !== "function") {
    return () => {};
  }
  if (audioTrilhaFinal && audioTrilhaFinal.currentTime >= alvo) {
    callback();
    return () => {};
  }
  const ouvinte = { segundos: alvo, callback };
  ouvintesMarcoTrilhaFinal.push(ouvinte);
  return () => {
    ouvintesMarcoTrilhaFinal = ouvintesMarcoTrilhaFinal.filter(
      (item) => item !== ouvinte
    );
  };
}

// SFX curto que não mata a trilha / tocarArquivo atual
// opcoes.taxa: playbackRate (altera tom se preservesPitch=false)
export function tocarSfxArquivo(nome, opcoes = {}) {
  if (mudo) {
    return;
  }
  const url = AUDIOS_ARQUIVO[nome];
  if (!url) {
    return;
  }
  try {
    const audio = new Audio(encodeURI(url));
    const taxa = Number(opcoes.taxa);
    audio.playbackRate = Number.isFinite(taxa) && taxa > 0 ? taxa : 1;
    // Sem preservar tom: taxa mais alta = metal mais agudo / mais baixo = mais grave
    if ("preservesPitch" in audio) {
      audio.preservesPitch = false;
    }
    if ("mozPreservesPitch" in audio) {
      audio.mozPreservesPitch = false;
    }
    if ("webkitPreservesPitch" in audio) {
      audio.webkitPreservesPitch = false;
    }
    const volumeBase = Number(opcoes.volume);
    audio.volume = Number.isFinite(volumeBase)
      ? Math.min(1, Math.max(0, volumeBase))
      : 0.9;
    const promessa = audio.play();
    if (promessa && typeof promessa.catch === "function") {
      promessa.catch(() => {});
    }
  } catch {
    // Ignora falhas de SFX
  }
}

let indiceParry = 0;

// Perfis distintos pra cada Blade sound (mesmo arquivo-base soa diferente)
const PERFIS_PARRY = [
  { taxa: 0.86, volume: 0.78 },
  { taxa: 1.0, volume: 0.75 },
  { taxa: 1.18, volume: 0.81 },
];

// Alterna 1 → 2 → 3 e aplica tom/velocidade + micro-variação
export function tocarParryAleatorio() {
  const indice = indiceParry % NOMES_PARRY.length;
  indiceParry += 1;
  const perfil = PERFIS_PARRY[indice];
  const jitter = 0.96 + Math.random() * 0.08;
  tocarSfxArquivo(NOMES_PARRY[indice], {
    taxa: perfil.taxa * jitter,
    volume: perfil.volume * (0.94 + Math.random() * 0.08),
  });
}

export function tocarHitEspada() {
  // Hit também varia um pouco pra não ficar robótico
  const jitter = 0.94 + Math.random() * 0.12;
  tocarSfxArquivo("bladeHit", {
    taxa: jitter,
    volume: 0.9,
  });
}

// Toca um MP3/arquivo. Resolve quando termina, erra ou é interrompido.
// opcoes.duracaoMaxMs: corta o áudio após N ms (ex.: Return by Death curto)
export function tocarArquivo(nome, opcoes = {}) {
  const url = AUDIOS_ARQUIVO[nome];
  if (!url) {
    return Promise.resolve();
  }

  try {
    interromperArquivoAtual();

    const audio = new Audio(encodeURI(url));
    audioArquivoAtual = audio;
    // Mudo: volume 0, mas o ended ainda sincroniza a cutscene
    audio.volume = mudo ? 0 : 0.9;

    const duracaoMaxMs = Number(opcoes.duracaoMaxMs);

    return new Promise((resolver) => {
      let finalizado = false;
      let temporizadorCorte = null;
      const finalizar = () => {
        if (finalizado) {
          return;
        }
        finalizado = true;
        if (temporizadorCorte !== null) {
          window.clearTimeout(temporizadorCorte);
          temporizadorCorte = null;
        }
        if (finalizarArquivoAtual === finalizar) {
          finalizarArquivoAtual = null;
        }
        if (audioArquivoAtual === audio) {
          audio.pause();
          audioArquivoAtual = null;
        }
        resolver();
      };

      finalizarArquivoAtual = finalizar;
      audio.addEventListener("ended", finalizar, { once: true });
      audio.addEventListener("error", finalizar, { once: true });

      if (Number.isFinite(duracaoMaxMs) && duracaoMaxMs > 0) {
        temporizadorCorte = window.setTimeout(() => {
          finalizar();
        }, duracaoMaxMs);
      }

      const promessa = audio.play();
      if (promessa && typeof promessa.catch === "function") {
        promessa.catch(() => {
          finalizar();
        });
      }
    });
  } catch {
    // Falhas de áudio não devem travar o jogo
    return Promise.resolve();
  }
}
