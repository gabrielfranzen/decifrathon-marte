import { chromium } from "playwright";

const BASE = process.env.OUM_URL || "http://127.0.0.1:3456";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const falhas = [];

  function ok(mensagem) {
    console.log("ok:", mensagem);
  }

  function falha(mensagem) {
    falhas.push(mensagem);
    console.error("FALHA:", mensagem);
  }

  try {
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: "networkidle" });

    await page.getByRole("button", { name: "Iniciar" }).click();
    await page.getByRole("button", { name: "Pular" }).click();
    await page.waitForSelector(".g00.cena--visivel", { timeout: 5000 });
    ok("após intro cai direto em G00");

    if ((await page.locator(".g00a").count()) === 0) {
      ok("visão distante G00A ausente do fluxo");
    } else {
      falha("G00A ainda aparece após a introdução");
    }

    if ((await page.locator('[data-hotspot="relogio"]').count()) === 1) {
      ok("relógio examinável");
    } else {
      falha("hotspot do relógio ausente");
    }

    if ((await page.locator('[data-hotspot="inscricao"]').count()) === 1) {
      ok("inscrição examinável");
    } else {
      falha("hotspot da inscrição ausente");
    }

    await page.getByRole("button", { name: "Examinar relógio" }).click({ force: true });
    await page.waitForSelector(".relogio-falso");
    const rodapeRelogio = await page.locator(".examinador__rodape").textContent();
    if (rodapeRelogio && rodapeRelogio.includes("três horas")) {
      ok("exame do relógio em 03:00");
    } else {
      falha("texto do relógio inesperado: " + rodapeRelogio);
    }
    await page.getByRole("button", { name: "Fechar" }).click();

    await page.getByRole("button", { name: "Ler inscrição" }).click({ force: true });
    await page.waitForSelector(".inscricao-falsa__letras");
    const letras = (await page.locator(".inscricao-falsa__letras").textContent()).trim();
    if (letras === "IHUUR") {
      ok("inscrição IHUUR legível");
    } else {
      falha("inscrição inesperada: " + letras);
    }
    await page.getByRole("button", { name: "Fechar" }).click();

    await page.getByRole("button", { name: "Recolher medalhão" }).click({ force: true });
    await page.waitForTimeout(200);

    if ((await page.getByRole("button", { name: /Relíquias/ }).textContent()).includes("1")) {
      ok("medalhão no inventário");
    } else {
      falha("inventário sem medalhão");
    }

    const legenda = await page.locator(".legenda.visivel").textContent();
    if (legenda && legenda.includes("inventário")) {
      ok("aviso de uso no inventário");
    } else {
      falha("aviso de inventário ausente: " + legenda);
    }

    if ((await page.locator('[data-hotspot="medalhao"]').count()) === 0) {
      ok("hotspot do medalhão sumiu após coleta");
    } else {
      falha("hotspot do medalhão ainda presente");
    }

    await page.getByRole("button", { name: "Examinar cadeado" }).click({ force: true });
    await page.waitForSelector(".cadeado");

    const alvos = ["F", "E", "R", "R", "O"];
    for (let i = 0; i < 5; i += 1) {
      const roda = page.locator(".roda").nth(i);
      for (let tentativa = 0; tentativa < 40; tentativa += 1) {
        const atual = (await roda.locator(".roda-atual").textContent()).trim();
        if (atual === alvos[i]) {
          break;
        }
        await roda.click({ position: { x: 20, y: 18 } });
        await page.waitForTimeout(20);
      }
    }

    await page.getByRole("button", { name: "Acionar lingueta" }).click();
    await page.waitForSelector('[data-hotspot="entrar"]', { timeout: 5000 });
    ok("portão aberto com Entrar disponível");

    if ((await page.getByRole("button", { name: /Voltar/ }).count()) === 0) {
      ok("sem botão Voltar para floresta");
    } else {
      falha("botão Voltar ainda presente");
    }

    await page.waitForTimeout(800);
    await page.locator('[data-hotspot="entrar"]').evaluate((el) => el.click());
    await page.waitForFunction(
      () => {
        const texto =
          "A continuação será desenvolvida na próxima etapa.";
        const flutuante = document.querySelector(".mensagem-flutuante");
        const legenda = document.querySelector(".legenda.visivel");
        return (
          (flutuante && flutuante.textContent.includes(texto)) ||
          (legenda && legenda.textContent.includes(texto))
        );
      },
      { timeout: 8000 }
    );
    ok("aviso de continuação sem C01");

    await page.reload({ waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.waitForSelector(".g00.cena--visivel", { timeout: 5000 });
    await page.waitForSelector('[data-hotspot="entrar"]', { timeout: 5000 });
    ok("reload mantém portão aberto");
  } catch (erro) {
    falha(String(erro && erro.stack ? erro.stack : erro));
  } finally {
    await browser.close();
  }

  if (falhas.length) {
    console.error(`\n${falhas.length} falha(s) de UI.`);
    process.exit(1);
  }

  console.log("\nPercurso UI da Etapa 1 validado.");
}

main();
