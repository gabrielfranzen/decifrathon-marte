// Etapa 1: G00A (vista distante) → G00 (portão) → C01 (salão)
export const imagensAmbientes = {
  g00a: "assets/G00A/G00A-castelo-floresta-longe.jpg",
  g00aAberto: "assets/G00A/G00A-castelo-floresta-longe-aberto.jpg",
  // Fundo fixo do portão (sem medalhão baked-in)
  g00: "assets/G00/G00-portao-sem-medalhao.png",
  // Prop overlay do medalhão (some na coleta)
  g00Medalhao: "assets/G00/G00-medalhao.png",
  // Carta no chão com desenho do relógio às 3h (some na coleta)
  g00CartaRelogio: "assets/G00/G00-carta-relogio.png",
  g00Aberto: "assets/G00/G00-portao-aberto.jpg",
  c01: "assets/C01/C01-salao-armarios-trancado.jpg",
  c01AbertoEspada: "assets/C01/C01-salao-armarios-aberto-espada.jpg",
  c01AbertoVazio: "assets/C01/C01-salao-armarios-aberto-vazio.jpg",
  c02: "assets/C02/C02-sala-cartas.jpg",
  // Gaveta sem cadeado (após abrir o cadeado das cartas)
  c02Aberta: "assets/C02/C02-sala-cartas-aberta.jpg",
  // Madeira vazia: nichos, pistas e cartas são overlays HTML (não baked na foto)
  c02Mesa: "assets/C02/C02-mesa-cartas-lisa.jpg",
  c03: "assets/C03/C03-sala-gavetas.jpg",
  // Frame one-shot: perseguidor terminando de subir (primeira entrada)
  c01Perseguidor: "assets/C01/C01-perseguidor-03.jpg",
  // Galeria superior desativada; C01B jogável é o corredor vazio pós-fuga
  c01b: "assets/C01B/C01B-corredor-morte-fundo.jpg",
  c01bCorredor: "assets/C01B/C01B-corredor-morte-fundo.jpg",
  // Sem espada: cai direto na espadada
  c01bMorteEspadada: "assets/C01B/C01B-morte-espadada.jpg",
  // Com espada: luta → fuga → corredor vazio (avançar / voltar)
  c01bLuta01: "assets/C01B/C01B-luta-01.jpg",
  c01bLuta02: "assets/C01B/C01B-luta-02.jpg",
  c01bLutaFuga: "assets/C01B/C01B-luta-fuga.jpg",
  // Antecâmara da porta de pedra (após o corredor)
  c01c: "assets/C01C/C01C-antecamara.jpg",
  c01cPortaAberta: "assets/C01C/C01C-antecamara-porta-entreaberta.png",
  alavancaBase: "assets/C01C/alavanca-base.jpg",
  alavancaHaste: "assets/C01C/alavanca-haste.jpg",
  alavancaLigada: "assets/C01C/alavanca-ligada.jpg",
  alavancaDesligada: "assets/C01C/alavanca-desligada.jpg",
  paredeTochas: "assets/C01C/C01C-parede-tochas.jpg",
  adagaCima: "assets/C01C/adaga-cima.jpg",
  adagaBaixo: "assets/C01C/adaga-baixo.jpg",
  cartaAdagas: "assets/C01C/C01C-carta-adagas.jpg",
  // Sala do perseguidor + fundo da revelação final
  c01d: "assets/C01D/C01D-sala-perseguidor.jpg",
  c01dRevelacao: "assets/C01D/C01D-capacete-mesa.jpg",
  // Fundo dos créditos: retorno a Véspera com o elmo
  finalVilaCelebracao: "assets/final/final-image.png",
};

export function obterImagemG00A({ portaPrincipalAberta }) {
  return portaPrincipalAberta
    ? imagensAmbientes.g00aAberto
    : imagensAmbientes.g00a;
}

// Fundo da G00: não depende do medalhão (ele é overlay separado)
export function obterImagemG00({ portaPrincipalAberta } = {}) {
  return portaPrincipalAberta
    ? imagensAmbientes.g00Aberto
    : imagensAmbientes.g00;
}

export function obterImagemMedalhaoG00() {
  return imagensAmbientes.g00Medalhao;
}

export function obterImagemCartaRelogioG00() {
  return imagensAmbientes.g00CartaRelogio;
}

export function obterImagemC01({ armarioAberto = false, espadaColetada = false } = {}) {
  if (espadaColetada) {
    return imagensAmbientes.c01AbertoVazio;
  }
  if (armarioAberto) {
    return imagensAmbientes.c01AbertoEspada;
  }
  return imagensAmbientes.c01;
}

export function obterImagemC02({ gavetaAberta } = {}) {
  return gavetaAberta ? imagensAmbientes.c02Aberta : imagensAmbientes.c02;
}

export function obterImagemC02Mesa() {
  return imagensAmbientes.c02Mesa;
}

export function obterImagemC03() {
  return imagensAmbientes.c03;
}

export function obterFramesPerseguidorC01() {
  return [imagensAmbientes.c01Perseguidor];
}

export function obterImagemC01B() {
  return imagensAmbientes.c01bCorredor;
}

export function obterImagemCorredorC01B() {
  return imagensAmbientes.c01bCorredor;
}

export function obterImagemMorteEspadadaC01B() {
  return imagensAmbientes.c01bMorteEspadada;
}

export function obterImagemMorteC01B() {
  return obterImagemMorteEspadadaC01B();
}

export function obterFramesLutaC01B() {
  return [
    imagensAmbientes.c01bLuta01,
    imagensAmbientes.c01bLuta02,
    imagensAmbientes.c01bLutaFuga,
  ];
}

export function obterImagemC01C({ portaPedraAberta = false } = {}) {
  return portaPedraAberta
    ? imagensAmbientes.c01cPortaAberta
    : imagensAmbientes.c01c;
}

export function obterImagemAdaga(ligada) {
  return ligada ? imagensAmbientes.adagaCima : imagensAmbientes.adagaBaixo;
}

export function obterImagemCartaAdagas() {
  return imagensAmbientes.cartaAdagas;
}

export function obterImagemAlavancaBase() {
  return imagensAmbientes.alavancaBase;
}

export function obterImagemAlavancaHaste() {
  return imagensAmbientes.alavancaHaste;
}

export function obterImagemAlavanca(ligada) {
  return ligada
    ? imagensAmbientes.alavancaLigada
    : imagensAmbientes.alavancaDesligada;
}

export function obterImagemParedeTochas() {
  return imagensAmbientes.paredeTochas;
}

export function obterImagemC01D() {
  return imagensAmbientes.c01d;
}

export function obterImagemRevelacaoC01D() {
  return imagensAmbientes.c01dRevelacao;
}

export function obterImagemFinalVilaCelebracao() {
  return imagensAmbientes.finalVilaCelebracao;
}
