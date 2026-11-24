const cache = new Map();

function normalizarHotspot(bruto) {
  return {
    id: String(bruto.id || ""),
    left: Number(bruto.left) || 0,
    top: Number(bruto.top) || 0,
    width: Math.max(1, Number(bruto.width) || 1),
    height: Math.max(1, Number(bruto.height) || 1),
    zIndex: Number.isFinite(Number(bruto.zIndex)) ? Number(bruto.zIndex) : 2,
  };
}

function normalizarAmbiente(dados) {
  const copia = { ...dados };
  copia.hotspots = Array.isArray(dados.hotspots)
    ? dados.hotspots.map(normalizarHotspot).filter((h) => h.id)
    : [];
  copia.interacoes = Array.isArray(dados.interacoes) ? [...dados.interacoes] : [];
  return copia;
}

export async function carregarAmbiente(id) {
  const chave = String(id || "").toUpperCase();
  if (cache.has(chave)) {
    return cache.get(chave);
  }

  const resposta = await fetch(`ambientes/${chave}.json`, { cache: "no-store" });
  if (!resposta.ok) {
    throw new Error(`Ambiente ${chave} não encontrado (${resposta.status})`);
  }

  const dados = normalizarAmbiente(await resposta.json());
  cache.set(chave, dados);
  return dados;
}

export function obterAmbiente(id) {
  return cache.get(String(id || "").toUpperCase()) || null;
}

export function obterHotspot(ambiente, idHotspot) {
  if (!ambiente?.hotspots) {
    return null;
  }
  return ambiente.hotspots.find((h) => h.id === idHotspot) || null;
}

export function ambienteTemHotspot(ambiente, idHotspot) {
  return Boolean(obterHotspot(ambiente, idHotspot));
}

export function estiloDeHotspot(ambiente, idHotspot, fallback = null) {
  const hotspot = obterHotspot(ambiente, idHotspot) || fallback;
  if (!hotspot) {
    return {};
  }
  return {
    left: `${hotspot.left}%`,
    top: `${hotspot.top}%`,
    width: `${hotspot.width}%`,
    height: `${hotspot.height}%`,
    zIndex: String(hotspot.zIndex ?? 2),
  };
}

export function atualizarHotspotsNoCache(id, hotspots) {
  const chave = String(id || "").toUpperCase();
  const atual = cache.get(chave);
  if (!atual) {
    return null;
  }
  atual.hotspots = hotspots.map(normalizarHotspot);
  cache.set(chave, atual);
  return atual;
}

export function removerHotspotDoCache(id, idHotspot) {
  const chave = String(id || "").toUpperCase();
  const atual = cache.get(chave);
  if (!atual) {
    return null;
  }
  atual.hotspots = (atual.hotspots || []).filter((h) => h.id !== idHotspot);
  atual.interacoes = (atual.interacoes || []).filter((i) => i.id !== idHotspot);
  cache.set(chave, atual);
  return atual;
}

export async function salvarHotspotsAmbiente(id, hotspots) {
  const chave = String(id || "").toUpperCase();
  const normalizados = hotspots.map(normalizarHotspot);

  const resposta = await fetch(`/api/ambientes/${chave}/hotspots`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hotspots: normalizados }),
  });

  if (!resposta.ok) {
    const detalhe = await resposta.text().catch(() => "");
    const erro = new Error(
      `Falha ao salvar ${chave}: ${resposta.status} ${detalhe}`.trim()
    );
    erro.status = resposta.status;
    throw erro;
  }

  atualizarHotspotsNoCache(chave, normalizados);
  return normalizados;
}

export async function apagarHotspotAmbiente(id, idHotspot) {
  const chave = String(id || "").toUpperCase();
  const resposta = await fetch(
    `/api/ambientes/${chave}/hotspots/${encodeURIComponent(idHotspot)}`,
    { method: "DELETE" }
  );

  if (!resposta.ok) {
    const detalhe = await resposta.text().catch(() => "");
    const erro = new Error(
      `Falha ao apagar ${idHotspot}: ${resposta.status} ${detalhe}`.trim()
    );
    erro.status = resposta.status;
    throw erro;
  }

  const corpo = await resposta.json().catch(() => ({}));
  removerHotspotDoCache(chave, idHotspot);
  return corpo;
}

export function aplicarEstilosHotspotsNaCena(cena, ambiente) {
  if (!cena || !ambiente?.hotspots) {
    return;
  }
  for (const hotspot of ambiente.hotspots) {
    const estilo = estiloDeHotspot(ambiente, hotspot.id);
    const botao = cena.querySelector(`[data-hotspot="${hotspot.id}"]`);
    if (botao) {
      Object.assign(botao.style, estilo);
    }
    // Props visuais (ex.: medalhão overlay) acompanham a caixa do hotspot no modo dev
    const prop = cena.querySelector(`[data-prop="${hotspot.id}"]`);
    if (prop) {
      Object.assign(prop.style, estilo);
    }
  }
}

export function removerHotspotDaCena(cena, idHotspot) {
  if (!cena) {
    return;
  }
  cena.querySelector(`[data-hotspot="${idHotspot}"]`)?.remove();
}
