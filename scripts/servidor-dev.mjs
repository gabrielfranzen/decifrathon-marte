import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(__dirname, "..");
const PORTA = Number(process.env.PORT || 3456);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function enviarJson(res, status, corpo) {
  const texto = JSON.stringify(corpo, null, 2);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(texto);
}

function caminhoSeguro(urlPath) {
  const limpo = decodeURIComponent(urlPath.split("?")[0]);
  const relativo = limpo === "/" ? "index.html" : limpo.replace(/^\/+/, "");
  const absoluto = path.resolve(RAIZ, relativo);
  if (!absoluto.startsWith(RAIZ)) {
    return null;
  }
  return absoluto;
}

async function lerCorpo(req) {
  const pedacos = [];
  for await (const pedaco of req) {
    pedacos.push(pedaco);
  }
  return Buffer.concat(pedacos).toString("utf8");
}

async function salvarHotspots(id, hotspots) {
  const arquivo = path.join(RAIZ, "ambientes", `${id}.json`);
  const bruto = await fs.readFile(arquivo, "utf8");
  const dados = JSON.parse(bruto);
  dados.hotspots = hotspots;
  await fs.writeFile(arquivo, `${JSON.stringify(dados, null, 2)}\n`, "utf8");
  return dados;
}

async function servirArquivo(req, res, arquivo) {
  try {
    const dados = await fs.readFile(arquivo);
    const ext = path.extname(arquivo).toLowerCase();
    res.writeHead(200, {
      "Content-Type": MIME[ext] || "application/octet-stream",
      "Cache-Control": ext === ".html" || ext === ".js" || ext === ".css" || ext === ".json"
        ? "no-store"
        : "public, max-age=60",
    });
    res.end(dados);
  } catch (erro) {
    if (erro.code === "ENOENT") {
      res.writeHead(404).end("Not found");
      return;
    }
    res.writeHead(500).end("Erro interno");
  }
}

const servidor = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,PUT,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    res.end();
    return;
  }

  const matchHotspots = url.pathname.match(/^\/api\/ambientes\/([A-Za-z0-9_-]+)\/hotspots$/);
  if (req.method === "PUT" && matchHotspots) {
    try {
      const id = matchHotspots[1].toUpperCase();
      const corpo = JSON.parse(await lerCorpo(req));
      if (!Array.isArray(corpo.hotspots)) {
        enviarJson(res, 400, { ok: false, erro: "hotspots deve ser array" });
        return;
      }
      await salvarHotspots(id, corpo.hotspots);
      enviarJson(res, 200, { ok: true, id, total: corpo.hotspots.length });
    } catch (erro) {
      const status = erro.code === "ENOENT" ? 404 : 500;
      enviarJson(res, status, { ok: false, erro: String(erro.message || erro) });
    }
    return;
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405).end("Method not allowed");
    return;
  }

  const arquivo = caminhoSeguro(url.pathname);
  if (!arquivo) {
    res.writeHead(403).end("Forbidden");
    return;
  }

  let alvo = arquivo;
  try {
    const stat = await fs.stat(alvo);
    if (stat.isDirectory()) {
      alvo = path.join(alvo, "index.html");
    }
  } catch {
    res.writeHead(404).end("Not found");
    return;
  }

  await servirArquivo(req, res, alvo);
});

servidor.listen(PORTA, () => {
  console.log(`Dev server em http://127.0.0.1:${PORTA}`);
  console.log("PUT /api/ambientes/:id/hotspots grava ambientes/:id.json");
});
