// Smoke test for the Sanoja phone flashcards page (docs/flashcards.html).
//
// Serves docs/ locally, opens the page in a mobile-emulated browser, mocks the sync
// server so results are deterministic, and checks layout, the card flow, offline use,
// installability and whether a deployed update actually reaches an installed phone.
//
// Run:  cd tests && npm run phone      (set CHROMIUM_PATH to reuse a downloaded Chromium)
// Output: a table on stdout, phone-report.json, exit code 1 on any FAIL.

import { chromium, devices } from "playwright";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const docsDir = path.resolve(here, "..", "docs");

const SYNC_URL = "https://sanoja-uninstall-feedback.shahzainhtc.workers.dev/sync/**";
const FUTURE = new Date(Date.now() + 5 * 86400000).toISOString();
const PAST = new Date(Date.now() - 86400000).toISOString();
const WORDS = [
  { finnish: "talo", english: "house", context: "Talo on iso ja vanha.", nextReview: PAST },
  { finnish: "kissa", english: "cat" },
  { finnish: "koira", english: "dog", mastered: true },
  { finnish: "auto", english: "car", nextReview: FUTURE },
];
// Expected: Due = talo, kissa | All = 4 | Known = 1.

// ---- tiny local server for docs/, with a switch to simulate a deployed update ------
const state = { deployedUpdate: false };
function serveDocs() {
  const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".webmanifest": "application/manifest+json", ".png": "image/png" };
  const server = http.createServer((req, res) => {
    const rel = decodeURIComponent(req.url.split("?")[0]).replace(/^\/+/, "") || "index.html";
    const file = path.join(docsDir, rel);
    if (!file.startsWith(docsDir)) return res.writeHead(403).end();
    fs.readFile(file, (err, data) => {
      if (err) return res.writeHead(404).end("not found");
      let body = data;
      if (state.deployedUpdate && rel === "flashcards.js") {
        body = Buffer.concat([data, Buffer.from("\nwindow.__SANOJA_UPDATE__ = true;\n")]);
      }
      res.writeHead(200, { "content-type": types[path.extname(file)] || "application/octet-stream" }).end(body);
    });
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server)));
}

const results = [];
function record(group, name, status, note = "") {
  results.push({ group, name, status, note });
}
async function check(group, name, fn) {
  try {
    const out = await fn();
    if (out && out.skip) record(group, name, "SKIP", out.skip);
    else if (out && out.fail) record(group, name, "FAIL", out.fail);
    else record(group, name, "PASS", (out && out.note) || "");
  } catch (e) {
    record(group, name, "FAIL", e.message.split("\n")[0]);
  }
}

const server = await serveDocs();
const base = `http://127.0.0.1:${server.address().port}`;

const { defaultBrowserType, ...phone } = devices["iPhone 13"]; // 390x844, touch, mobile UA
const browser = await chromium.launch({
  ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
});

async function newPhone() {
  const context = await browser.newContext({ ...phone, serviceWorkers: "allow" });
  await context.route(SYNC_URL, (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ words: WORDS }) })
  );
  const page = await context.newPage();
  return { context, page };
}
const text = (page, sel) => page.locator(sel).first().innerText();

// ======================= Layout =====================================================
{
  const { context, page } = await newPhone();
  await page.goto(`${base}/flashcards.html?sync=test-id`);
  await page.locator("#cardEl").waitFor();

  await check("layout", "no horizontal scroll at 390px", async () => {
    const o = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
    return o.sw > o.iw ? { fail: `page is ${o.sw}px wide in a ${o.iw}px viewport` } : {};
  });

  await check("layout", "buttons are at least 44x44px (Apple's tap-target guideline)", async () => {
    const small = await page.evaluate(() =>
      [...document.querySelectorAll("button")]
        .filter((b) => b.offsetParent !== null)
        .map((b) => ({ id: b.id || b.textContent.trim(), r: b.getBoundingClientRect() }))
        .filter((b) => b.r.width < 44 || b.r.height < 44)
        .map((b) => `${b.id} (${Math.round(b.r.width)}x${Math.round(b.r.height)})`)
    );
    return small.length ? { fail: small.join(", ") } : {};
  });

  await check("layout", "every button has an accessible name", async () => {
    const unnamed = await page.evaluate(() =>
      [...document.querySelectorAll("button")]
        .filter((b) => !(b.getAttribute("aria-label") || b.textContent.trim()))
        .map((b) => b.id || b.className)
    );
    return unnamed.length ? { fail: `unlabelled: ${unnamed.join(", ")}` } : {};
  });
  await context.close();
}

// ======================= Card flow ==================================================
{
  const { context, page } = await newPhone();
  await page.goto(`${base}/flashcards.html?sync=test-id`);
  await page.locator("#cardEl").waitFor();

  await check("flow", "sync loads the Due list (2 of 4 words)", async () => {
    const progress = await text(page, "#progress");
    return progress.trim() === "1 / 2" ? { note: progress } : { fail: `progress reads "${progress}", expected "1 / 2"` };
  });
  await check("flow", "front shows the word and example sentence, not the answer", async () => {
    const card = await text(page, "#cardEl");
    if (!/talo/i.test(card)) return { fail: `front is "${card.replace(/\n/g, " ")}"` };
    if (!/Talo on iso/.test(card)) return { fail: "example sentence missing on the front" };
    if (/house/i.test(card)) return { fail: "English answer is visible before tapping" };
  });
  await check("flow", "tapping the card reveals the English answer", async () => {
    await page.tap("#cardEl");
    const card = await text(page, "#cardEl");
    return /house/i.test(card) ? {} : { fail: `back is "${card.replace(/\n/g, " ")}"` };
  });
  await check("flow", "Next advances and wraps around", async () => {
    await page.tap("#nextBtn");
    const a = (await text(page, "#progress")).trim();
    await page.tap("#nextBtn");
    const b = (await text(page, "#progress")).trim();
    return a === "2 / 2" && b === "1 / 2" ? {} : { fail: `saw "${a}" then "${b}"` };
  });
  await check("flow", "filters show All (4) and Known (1)", async () => {
    await page.tap('.filter[data-filter="all"]');
    const all = (await text(page, "#progress")).trim();
    await page.tap('.filter[data-filter="mastered"]');
    const known = (await text(page, "#progress")).trim();
    await page.tap('.filter[data-filter="due"]');
    return all.endsWith("/ 4") && known.endsWith("/ 1") ? {} : { fail: `All="${all}", Known="${known}"` };
  });
  await check("flow", "sync id is removed from the visible URL", async () => {
    const url = page.url();
    return url.includes("sync=") ? { fail: url } : {};
  });
  await check("flow", "Mark known removes the card and shows a toast", async () => {
    await page.tap("#masteredBtn");
    const progress = (await text(page, "#progress")).trim();
    const toastShown = await page.locator("#toast.show").count();
    return progress === "1 / 1" && toastShown ? {} : { fail: `progress "${progress}", toast shown: ${!!toastShown}` };
  });
  await check("flow", "Known marks survive a Refresh", async () => {
    await page.tap("#refreshBtn");
    await page.waitForTimeout(400);
    const progress = (await text(page, "#progress")).trim();
    return progress === "1 / 1"
      ? {}
      : { fail: `after Refresh the Due list is "${progress}": the word marked known came back, because Refresh replaces the list with the server snapshot and drops local marks` };
  });
  await context.close();
}

// ======================= Offline ====================================================
{
  const { context, page } = await newPhone();
  await page.goto(`${base}/flashcards.html?sync=test-id`);
  await page.locator("#cardEl").waitFor();

  await check("offline", "service worker installs and controls the page", async () => {
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    await page.locator("#cardEl").waitFor();
    const controlled = await page.evaluate(() => !!navigator.serviceWorker.controller);
    return controlled ? {} : { fail: "page is not controlled by a service worker after reload" };
  });
  await check("offline", "opens with cached words with no network", async () => {
    await context.setOffline(true);
    await page.reload();
    await page.locator("#cardEl").waitFor({ timeout: 8000 });
    const progress = (await text(page, "#progress")).trim();
    return progress.endsWith("/ 2") ? {} : { fail: `offline progress is "${progress}"` };
  });
  await check("offline", "Refresh while offline says so and keeps the words", async () => {
    // A mocked response would keep succeeding even with the network off; make the
    // sync call fail the way a real outage does.
    await context.unroute(SYNC_URL);
    await context.route(SYNC_URL, (route) => route.abort("internetdisconnected"));
    await page.tap("#refreshBtn");
    await page.waitForTimeout(500);
    const toast = (await text(page, "#toast")).trim();
    return /offline/i.test(toast) ? { note: toast } : { fail: `toast reads "${toast}"` };
  });
  await context.setOffline(false);
  await context.close();
}

// ======================= Installability =============================================
{
  const { context, page } = await newPhone();
  await page.goto(`${base}/flashcards.html?sync=test-id`);
  await page.locator("#cardEl").waitFor();

  await check("install", "Chrome reports the page as installable", async () => {
    const cdp = await context.newCDPSession(page);
    await page.waitForTimeout(800);
    const { installabilityErrors } = await cdp.send("Page.getInstallabilityErrors");
    // "in-incognito" is the test browser's own context, not a problem with the page.
    const real = installabilityErrors.filter((e) => e.errorId !== "in-incognito");
    return real.length
      ? { fail: `${real.map((e) => e.errorId).join(", ")}: the manifest's only icon is 128x128, and Chrome needs one of at least 144x144 to offer "Add to Home screen"` }
      : {};
  });
  await check("install", "iOS home-screen icon is declared (apple-touch-icon)", async () => {
    const has = await page.locator('link[rel="apple-touch-icon"]').count();
    return has ? {} : { fail: "no <link rel=apple-touch-icon>, so iOS will use a page screenshot as the icon" };
  });
  await check("install", "home-screen icon is at least 180x180 and fully opaque", async () => {
    const href = await page.locator('link[rel="apple-touch-icon"]').getAttribute("href");
    const res = await context.request.get(new URL(href, page.url()).href);
    if (!res.ok()) return { fail: `${href} returned ${res.status()}` };
    const png = await res.body();
    const width = png.readUInt32BE(16);
    const height = png.readUInt32BE(20);
    const colorType = png[25]; // 4 = grey+alpha, 6 = RGBA
    const hasAlpha = colorType === 4 || colorType === 6 || png.includes(Buffer.from("tRNS"));
    if (width < 180 || height < 180) return { fail: `${href} is ${width}x${height}; iOS wants 180x180, and a smaller image is stretched and looks pixelated` };
    if (hasAlpha) return { fail: `${href} has transparency; iOS fills transparent areas with black` };
    return { note: `${width}x${height}, opaque` };
  });
  await check("install", "every icon in the manifest loads, and one is maskable", async () => {
    const manifestUrl = new URL(await page.locator('link[rel="manifest"]').getAttribute("href"), page.url()).href;
    const manifest = await (await context.request.get(manifestUrl)).json();
    for (const icon of manifest.icons) {
      const r = await context.request.get(new URL(icon.src, manifestUrl).href);
      if (!r.ok()) return { fail: `${icon.src} returned ${r.status()}` };
    }
    return manifest.icons.some((i) => (i.purpose || "").includes("maskable"))
      ? {}
      : { fail: "no icon with purpose \"maskable\", so Android crops the logo's edges with its own shape" };
  });
  await context.close();
}

// ======================= Updates reach installed phones =============================
{
  const { context, page } = await newPhone();
  await page.goto(`${base}/flashcards.html?sync=test-id`);
  await page.locator("#cardEl").waitFor();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload(); // now running under the service worker, like an installed phone
  await check("updates", "a deployed change to flashcards.js reaches a phone that already has the page", async () => {
    state.deployedUpdate = true;
    for (let i = 0; i < 3; i++) {
      await page.reload();
      await page.locator("#cardEl").waitFor();
      await page.waitForTimeout(800);
    }
    const gotUpdate = await page.evaluate(() => window.__SANOJA_UPDATE__ === true);
    return gotUpdate
      ? {}
      : { fail: "after the server changed flashcards.js and the page was reloaded 3 times, the phone still ran the old code: sw.js serves cached files first and its cache name never changes" };
  });
  state.deployedUpdate = false;
  await context.close();
}

await browser.close();
server.close();

const icon = { PASS: "ok  ", FAIL: "FAIL", SKIP: "skip" };
console.log(`\nSanoja phone flashcards smoke test — ${new Date().toISOString()}\n`);
let group = "";
for (const r of results) {
  if (r.group !== group) {
    group = r.group;
    console.log(group);
  }
  console.log(`   ${icon[r.status]}  ${r.name}${r.note ? `\n         ${r.note}` : ""}`);
}
const n = (s) => results.filter((r) => r.status === s).length;
console.log(`\n${n("PASS")} passed, ${n("FAIL")} failed, ${n("SKIP")} skipped`);
fs.writeFileSync(path.join(here, "phone-report.json"), JSON.stringify({ ranAt: new Date().toISOString(), results }, null, 2));
process.exit(n("FAIL") ? 1 : 0);
