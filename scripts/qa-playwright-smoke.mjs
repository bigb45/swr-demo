/**
 * Full-route smoke: visits each locale-prefixed path from qa-route-manifest.json,
 * records document HTTP status, browser console (error level), and failed / 4xx same-origin responses.
 *
 * Usage:
 *   QA_BASE_URL=http://localhost:3000 node scripts/qa-playwright-smoke.mjs
 *
 * Requires: playwright + Chromium (`npx playwright install chromium`).
 */
import { chromium } from "playwright";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "scripts/qa-output");
const manifest = JSON.parse(
  readFileSync(join(ROOT, "scripts/qa-route-manifest.json"), "utf8"),
);

const BASE =
  process.env.QA_BASE_URL?.replace(/\/$/, "") || "http://localhost:3000";
const NAV_TIMEOUT = Number(process.env.QA_NAV_TIMEOUT_MS || 90000);
const SKIP_DYNAMIC = process.env.QA_SKIP_DYNAMIC === "1";

function buildStaticPaths() {
  const paths = new Set();
  for (const p of manifest.staticRoutes) {
    paths.add(p);
  }
  for (const v of manifest.staticRoutes_queryVariants || []) {
    const q = v.query ? `?${v.query}` : "";
    paths.add(`${v.path}${q}`);
  }
  return [...paths];
}

/**
 * @param {import('playwright').Page} page
 * @param {string} locale
 */
async function discoverDynamics(page, locale) {
  const out = {
    sku: null,
    categoryId: null,
    catalogDocId: null,
    fleetMachineId: null,
  };

  try {
    await page.goto(`${BASE}/${locale}/products`, {
      waitUntil: "domcontentloaded",
      timeout: NAV_TIMEOUT,
    });
    await page.waitForTimeout(1500);
    const skuHref = await page
      .locator(`a[href^="/${locale}/products/"]`)
      .first()
      .getAttribute("href")
      .catch(() => null);
    if (skuHref) {
      const m = skuHref.match(/\/products\/([^/?#]+)/);
      if (m) out.sku = decodeURIComponent(m[1]);
    }

    const catHref = await page
      .locator(`a[href^="/${locale}/categories/"]`)
      .first()
      .getAttribute("href")
      .catch(() => null);
    if (catHref) {
      const m = catHref.match(/\/categories\/([^/?#]+)/);
      if (m) out.categoryId = m[1];
    }
  } catch {
    // Magento/catalog unavailable
  }

  try {
    await page.goto(`${BASE}/${locale}/catalog`, {
      waitUntil: "domcontentloaded",
      timeout: NAV_TIMEOUT,
    });
    await page.waitForTimeout(1200);
    const docHref = await page
      .locator(`a[href^="/${locale}/catalog/"]`)
      .first()
      .getAttribute("href")
      .catch(() => null);
    if (docHref) {
      const m = docHref.match(/\/catalog\/([^/?#]+)/);
      if (m) out.catalogDocId = m[1];
    }
  } catch {
    // ignore
  }

  try {
    await page.goto(`${BASE}/${locale}/account/fleet`, {
      waitUntil: "domcontentloaded",
      timeout: NAV_TIMEOUT,
    });
    await page.waitForTimeout(800);
    const fleetHref = await page
      .locator(`a[href^="/${locale}/account/fleet/"]`)
      .first()
      .getAttribute("href")
      .catch(() => null);
    if (fleetHref) {
      const m = fleetHref.match(/\/account\/fleet\/([^/?#]+)/);
      if (m) out.fleetMachineId = m[1];
    }
  } catch {
    // usually redirect to login when anonymous
  }

  return out;
}

/**
 * @param {import('playwright').BrowserContext} context
 * @param {string} pathWithQuery path starting with /
 * @param {string} locale
 */
async function auditRoute(context, pathWithQuery, locale) {
  const url = `${BASE}/${locale}${pathWithQuery.startsWith("/") ? pathWithQuery : `/${pathWithQuery}`}`;

  const consoleErrors = [];
  const networkBad = [];

  const page = await context.newPage();

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });

  page.on("response", async (res) => {
    try {
      const u = res.url();
      if (!u.startsWith(BASE)) return;
      const st = res.status();
      if (st >= 400) {
        const rt = res.request().resourceType();
        if (rt === "document" || rt === "fetch" || rt === "xhr") {
          networkBad.push({ url: u, status: st, type: rt });
        }
      }
    } catch {
      // ignore
    }
  });

  page.on("requestfailed", (req) => {
    const u = req.url();
    if (!u.startsWith(BASE)) return;
    const rt = req.resourceType();
    if (rt === "document" || rt === "fetch" || rt === "xhr") {
      networkBad.push({
        url: u,
        status: "failed",
        type: rt,
        failure: req.failure()?.errorText ?? "unknown",
      });
    }
  });

  let docStatus = null;
  let navError = null;

  try {
    const resp = await page.goto(url, {
      waitUntil: "load",
      timeout: NAV_TIMEOUT,
    });
    docStatus = resp?.status() ?? null;
    await page.waitForTimeout(1200);
  } catch (e) {
    navError = e instanceof Error ? e.message : String(e);
  }

  await page.close();

  const documentOk =
    !navError && docStatus !== null && docStatus >= 200 && docStatus < 400;
  const consoleOk = consoleErrors.length === 0;
  const networkOk = networkBad.length === 0;

  /** Lenient: HTML route returns 2xx/3xx after redirects. */
  const pass = documentOk;
  /** Strict: document + no console.error + no 4xx/failed document|fetch|xhr on origin. */
  const passStrict = documentOk && consoleOk && networkOk;

  return {
    url,
    locale,
    path: pathWithQuery,
    docStatus,
    navError,
    consoleErrors,
    networkIssues: networkBad,
    pass,
    passStrict,
    documentOk,
    consoleOk,
    networkOk,
  };
}

async function checkPublicApis() {
  const results = [];
  for (const path of manifest.apiSmokePublic || []) {
    const url = `${BASE}${path.startsWith("/") ? path : `/${path}`}`;
    try {
      const r = await fetch(url, { redirect: "follow" });
      results.push({
        url,
        status: r.status,
        ok: r.ok,
      });
    } catch (e) {
      results.push({
        url,
        error: e instanceof Error ? e.message : String(e),
        ok: false,
      });
    }
  }
  return results;
}

function mdMatrix(rows) {
  const lines = [
    "| Doc | Strict | Locale | Path | HTTP | Console errs | Net | Notes |",
    "| --- | --- | --- | --- | --- | --- | --- | --- |",
  ];
  for (const r of rows) {
    const docSt = r.pass ? "PASS" : "FAIL";
    const strictSt = r.passStrict ? "PASS" : "FAIL";
    const doc = r.docStatus ?? (r.navError ? "—" : "?");
    const ce = r.consoleErrors?.length ?? 0;
    const ni = r.networkIssues?.length ?? 0;
    const notes = r.navError
      ? `nav: ${String(r.navError).slice(0, 60)}`
      : r.consoleErrors?.[0]
        ? r.consoleErrors[0].slice(0, 100)
        : r.networkIssues?.[0]
          ? `${r.networkIssues[0].status} ${String(r.networkIssues[0].url).slice(-50)}`
          : "";
    lines.push(
      `| ${docSt} | ${strictSt} | ${r.locale} | \`${r.path}\` | ${doc} | ${ce} | ${ni} | ${notes.replace(/\|/g, "/")} |`,
    );
  }
  return lines.join("\n");
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  const staticPaths = buildStaticPaths();
  const primaryLocale = manifest.locales[0] || "de";

  console.error(`QA_BASE_URL=${BASE}`);
  console.error("Launching Chromium…");

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: { width: 1280, height: 800 },
  });

  let dynamics = {
    sku: null,
    categoryId: null,
    catalogDocId: null,
    fleetMachineId: null,
  };

  if (!SKIP_DYNAMIC) {
    const dPage = await context.newPage();
    try {
      dynamics = await discoverDynamics(dPage, primaryLocale);
      console.error("Discovery:", JSON.stringify(dynamics));
    } finally {
      await dPage.close();
    }
  }

  const dynamicPaths = [];
  if (dynamics.sku) {
    dynamicPaths.push(`/products/${encodeURIComponent(dynamics.sku)}`);
  }
  if (dynamics.categoryId) {
    dynamicPaths.push(`/categories/${dynamics.categoryId}`);
  }
  if (dynamics.catalogDocId) {
    dynamicPaths.push(`/catalog/${dynamics.catalogDocId}`);
  }
  if (dynamics.fleetMachineId) {
    dynamicPaths.push(`/account/fleet/${dynamics.fleetMachineId}`);
  }

  /** @type {any[]} */
  const rows = [];

  for (const locale of manifest.locales) {
    for (const p of staticPaths) {
      const result = await auditRoute(context, p, locale);
      rows.push(result);
      const icon = result.passStrict ? "ok" : result.pass ? "warn" : "FAIL";
      console.error(`${icon} ${locale} ${p}`);
    }
    for (const p of dynamicPaths) {
      const result = await auditRoute(context, p, locale);
      rows.push({ ...result, dynamic: true });
      const icon = result.passStrict ? "ok" : result.pass ? "warn" : "FAIL";
      console.error(`${icon} ${locale} ${p} (dynamic)`);
    }
  }

  await browser.close();

  const apiResults = await checkPublicApis();

  const summary = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE,
    discovery: dynamics,
    totals: {
      routes: rows.length,
      passDocument: rows.filter((r) => r.pass).length,
      failDocument: rows.filter((r) => !r.pass).length,
      passStrict: rows.filter((r) => r.passStrict).length,
      failStrict: rows.filter((r) => !r.passStrict).length,
    },
    apiSmokePublic: apiResults,
  };

  const outJson = {
    ...summary,
    routes: rows,
  };

  writeFileSync(
    join(OUT_DIR, "qa-matrix.json"),
    JSON.stringify(outJson, null, 2),
    "utf8",
  );
  writeFileSync(join(OUT_DIR, "qa-matrix.md"), mdMatrix(rows), "utf8");

  console.error(
    `\nWrote ${join(OUT_DIR, "qa-matrix.json")} and qa-matrix.md`,
  );
  console.error(
    `Document OK: ${summary.totals.passDocument}/${summary.totals.routes} — Strict (no console / critical net): ${summary.totals.passStrict}/${summary.totals.routes}\n`,
  );

  const exitFail = summary.totals.failDocument > 0;
  process.exit(exitFail ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
