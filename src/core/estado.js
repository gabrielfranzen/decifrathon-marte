const CHAVE_SAVE = "oum-etapa1";
const VERSAO_SAVE = 1;

const ALFABETO = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export const ESTADO_INICIAL = Object.freeze({
  versao: VERSAO_SAVE,
  salaAtual: "tela-inicial",
  e00Resolvido: false,
  portaPrincipalAberta: false,
  rodasE00: ["A", "A", "A", "A", "A"],
  medalhaoColetado: false,
  anelExterno: 0,
  anelInterno: 3,
  inventario: [],
  e01Resolvido: false,
  gavetaCartasAberta: false,
  papelArquivoColetado: false,
  casasCartas: [null, null, null, null],
  rodasE01: ["A", "A", "A", "A"],
  e02Resolvido: false,
  buscaGavetasOk: false,
  rodasE02: ["A", "A", "A", "A", "A"],
  gavetasAbertas: [],
  espadaColetada: false,
  viuPerseguidorC01: false,
  lutaCorredorConcluida: false,
  e03Resolvido: false,
  portaPedraAberta: false,
  alavancasE03: [false, false, false, false, false, false, false, false],
});

let estado = estruturarEstado({});
const ouvintes = new Set();

function normalizarCasasCartas(casas) {
  if (!Array.isArray(casas) || casas.length !== 4) {
    return [...ESTADO_INICIAL.casasCartas];
  }
  return casas.map((id) => {
    if (id === null || id === undefined || id === "") {
      return null;
    }
    return String(id);
  });
}

function normalizarGavetasAbertas(abertas) {
  if (!Array.isArray(abertas)) {
    return [...ESTADO_INICIAL.gavetasAbertas];
  }
  const vistas = new Set();
  const normalizadas = [];
  for (const valor of abertas) {
    const posicao = Number(valor);
    if (!Number.isInteger(posicao) || posicao < 1 || posicao > 40) {
      continue;
    }
    if (vistas.has(posicao)) {
      continue;
    }
    vistas.add(posicao);
    normalizadas.push(posicao);
  }
  return normalizadas;
}

function normalizarAlavancasE03(estados) {
  if (!Array.isArray(estados) || estados.length !== 8) {
    return [...ESTADO_INICIAL.alavancasE03];
  }
  return estados.map((valor) => Boolean(valor));
}

function estruturarEstado(parcial) {
  const base = {
    ...ESTADO_INICIAL,
    ...parcial,
    rodasE00: normalizarRodas(parcial.rodasE00, 5),
    rodasE01: normalizarRodas(parcial.rodasE01, 4),
    rodasE02: normalizarRodas(parcial.rodasE02, 5),
    inventario: Array.isArray(parcial.inventario)
      ? [...parcial.inventario]
      : [...ESTADO_INICIAL.inventario],
    casasCartas: normalizarCasasCartas(parcial.casasCartas),
    gavetasAbertas: normalizarGavetasAbertas(parcial.gavetasAbertas),
    alavancasE03: normalizarAlavancasE03(parcial.alavancasE03),
  };

  base.versao = VERSAO_SAVE;
  base.e00Resolvido = Boolean(base.e00Resolvido);
  base.portaPrincipalAberta = Boolean(base.portaPrincipalAberta);
  base.medalhaoColetado = Boolean(base.medalhaoColetado);
  base.e01Resolvido = Boolean(base.e01Resolvido);
  base.gavetaCartasAberta = Boolean(base.gavetaCartasAberta);
  base.papelArquivoColetado = Boolean(base.papelArquivoColetado);
  base.e02Resolvido = Boolean(base.e02Resolvido);
  base.buscaGavetasOk = Boolean(base.buscaGavetasOk);
  base.espadaColetada = Boolean(base.espadaColetada);
  base.viuPerseguidorC01 = Boolean(base.viuPerseguidorC01);
  base.lutaCorredorConcluida = Boolean(base.lutaCorredorConcluida);
  base.e03Resolvido = Boolean(base.e03Resolvido);
  base.portaPedraAberta = Boolean(base.portaPedraAberta);
  base.anelExterno = normalizarIndice(base.anelExterno);
  base.anelInterno = normalizarIndice(base.anelInterno);

  if (base.e00Resolvido) {
    base.portaPrincipalAberta = true;
  }

  if (base.e01Resolvido) {
    base.gavetaCartasAberta = true;
  }

  if (base.e02Resolvido) {
    base.buscaGavetasOk = true;
  }

  if (base.e03Resolvido) {
    base.portaPedraAberta = true;
  }

  if (base.medalhaoColetado && !base.inventario.includes("medalhao")) {
    base.inventario.push("medalhao");
  }

  if (base.papelArquivoColetado && !base.inventario.includes("papel-arquivo")) {
    base.inventario.push("papel-arquivo");
  }

  if (base.espadaColetada && !base.inventario.includes("espada")) {
    base.inventario.push("espada");
  }

  return base;
}

function normalizarIndice(valor) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) {
    return 0;
  }
  return ((Math.round(numero) % 26) + 26) % 26;
}

function normalizarRodas(rodas, quantidade = 5) {
  const fallback =
    quantidade === 4
      ? [...ESTADO_INICIAL.rodasE01]
      : [...ESTADO_INICIAL.rodasE00];
  if (!Array.isArray(rodas) || rodas.length !== quantidade) {
    return fallback;
  }

  return rodas.map((letra) => {
    const maiuscula = String(letra || "A").toUpperCase();
    return ALFABETO.includes(maiuscula) ? maiuscula : "A";
  });
}

function notificar() {
  const foto = obterEstado();
  for (const ouvinte of ouvintes) {
    ouvinte(foto);
  }
}

function persistir() {
  try {
    window.localStorage.setItem(CHAVE_SAVE, JSON.stringify(estado));
  } catch {
    // Persistência opcional se o navegador bloquear storage
  }
}

export function obterEstado() {
  return {
    ...estado,
    rodasE00: [...estado.rodasE00],
    rodasE01: [...estado.rodasE01],
    rodasE02: [...estado.rodasE02],
    inventario: [...estado.inventario],
    casasCartas: [...estado.casasCartas],
    gavetasAbertas: [...estado.gavetasAbertas],
  };
}

export function assinarEstado(ouvinte) {
  ouvintes.add(ouvinte);
  return () => ouvintes.delete(ouvinte);
}

export function carregarEstado() {
  try {
    const bruto = window.localStorage.getItem(CHAVE_SAVE);
    if (!bruto) {
      estado = estruturarEstado({});
      return obterEstado();
    }

    const lido = JSON.parse(bruto);
    estado = estruturarEstado(lido && typeof lido === "object" ? lido : {});
  } catch {
    estado = estruturarEstado({});
  }

  return obterEstado();
}

export function reiniciarEstado() {
  estado = estruturarEstado({});
  persistir();
  notificar();
  return obterEstado();
}

export function definirSalaAtual(salaAtual) {
  estado.salaAtual = salaAtual;
  persistir();
  notificar();
}

export function definirRodas(rodas) {
  estado.rodasE00 = normalizarRodas(rodas, 5);
  persistir();
  notificar();
}

export function definirRodasE01(rodas) {
  estado.rodasE01 = normalizarRodas(rodas, 4);
  persistir();
  notificar();
}

export function definirAnelExterno(indice) {
  estado.anelExterno = normalizarIndice(indice);
  persistir();
  notificar();
}

export function definirAnelInterno(indice) {
  estado.anelInterno = normalizarIndice(indice);
  persistir();
  notificar();
}

export function coletarMedalhao() {
  estado.medalhaoColetado = true;
  if (!estado.inventario.includes("medalhao")) {
    estado.inventario.push("medalhao");
  }
  persistir();
  notificar();
}

export function concluirE00() {
  estado.e00Resolvido = true;
  estado.portaPrincipalAberta = true;
  persistir();
  notificar();
}

export function definirCasasCartas(casas) {
  estado.casasCartas = normalizarCasasCartas(casas);
  persistir();
  notificar();
}

export function concluirE01() {
  estado.e01Resolvido = true;
  estado.gavetaCartasAberta = true;
  persistir();
  notificar();
}

export function coletarPapelArquivo() {
  estado.papelArquivoColetado = true;
  if (!estado.inventario.includes("papel-arquivo")) {
    estado.inventario.push("papel-arquivo");
  }
  persistir();
  notificar();
}

export function definirRodasE02(rodas) {
  estado.rodasE02 = normalizarRodas(rodas, 5);
  persistir();
  notificar();
}

export function definirBuscaGavetasOk(valor) {
  estado.buscaGavetasOk = Boolean(valor);
  persistir();
  notificar();
}

export function definirGavetasAbertas(abertas) {
  estado.gavetasAbertas = normalizarGavetasAbertas(abertas);
  persistir();
  notificar();
}

export function concluirE02() {
  estado.e02Resolvido = true;
  estado.buscaGavetasOk = true;
  persistir();
  notificar();
}

export function coletarEspada() {
  estado.espadaColetada = true;
  if (!estado.inventario.includes("espada")) {
    estado.inventario.push("espada");
  }
  persistir();
  notificar();
}

export function registrarPerseguidorC01Visto() {
  estado.viuPerseguidorC01 = true;
  persistir();
  notificar();
}

export function registrarLutaCorredorConcluida() {
  estado.lutaCorredorConcluida = true;
  persistir();
  notificar();
}

export function definirAlavancasE03(estados) {
  estado.alavancasE03 = normalizarAlavancasE03(estados);
  persistir();
  notificar();
}

export function concluirE03() {
  estado.e03Resolvido = true;
  estado.portaPedraAberta = true;
  estado.alavancasE03 = normalizarAlavancasE03([
    true,
    false,
    false,
    true,
    false,
    true,
    false,
    true,
  ]);
  persistir();
  notificar();
}

export function temItem(idItem) {
  return estado.inventario.includes(idItem);
}

export function obterAlfabeto() {
  return ALFABETO;
}
