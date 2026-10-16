// Builds the Chrome Web Store promo tiles from the real extension:
//   small tile   440x280
//   marquee     1400x560
//
//   CHROMIUM_PATH="/path/to/Chrome for Testing" node tools/screenshots/promo.mjs [outDir]
//
// Captures the real on-page popup (live Google Translate), crops it, and composes it
// onto the brand gradient. Output defaults to store-assets/promo-v2/.

import { createRequire } from "node:module";
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "..", "..");
const require = createRequire(path.join(repo, "tests", "x.js"));
const { chromium } = require("playwright");

const outDir = path.resolve(process.argv[2] || path.join(repo, "store-assets", "promo-v2"));
fs.mkdirSync(outDir, { recursive: true });

const server = await new Promise((res) => {
  const s = http.createServer((q, r) => {
    const f = path.join(here, decodeURIComponent(q.url.split("?")[0]).replace(/^\/+/, ""));
    if (f.startsWith(here) && fs.existsSync(f) && fs.statSync(f).isFile()) r.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(fs.readFileSync(f));
    else r.writeHead(404).end();
  });
  s.listen(0, "127.0.0.1", () => res(s));
});
const base = `http://127.0.0.1:${server.address().port}`;

const context = await chromium.launchPersistentContext(fs.mkdtempSync(path.join(os.tmpdir(), "sanoja-promo-")), {
  channel: "chromium",
  ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
  headless: true,
  deviceScaleFactor: 3,
  viewport: { width: 760, height: 500 },
  args: [`--disable-extensions-except=${repo}`, `--load-extension=${repo}`],
});

// Mark the first-run "Saved for later" hint as already seen so it doesn't clutter the art.
const sw = context.serviceWorkers()[0] || (await context.waitForEvent("serviceworker"));
await sw.evaluate(() => chrome.storage.sync.set({ sanojaSeenSaveHint: true }));

// Capture the popup on the Finnish article and crop to the sentence + popup.
const page = await context.newPage();
await page.goto(`${base}/news-fi.html`);
await page.waitForTimeout(1500);
const word = await page.locator("#target").boundingBox();
await page.mouse.dblclick(word.x + word.width / 2, word.y + word.height / 2);
await page.waitForFunction(() => {
  const el = document.querySelector("#sanoja-popup .sanoja-translated");
  return el && !el.classList.contains("sanoja-skeleton");
}, null, { timeout: 15000 });
await page.waitForTimeout(400);
const pop = await page.locator("#sanoja-popup").boundingBox();
const clip = {
  x: Math.max(0, word.x - 215),
  y: word.y - 22,
  width: 540,
  height: pop.y + pop.height - word.y + 52,
};
const cropFile = path.join(os.tmpdir(), `sanoja-promo-crop-${Date.now()}.png`);
await page.screenshot({ path: cropFile, clip });
const tightClip = { x: Math.max(0, word.x - 190), y: word.y - 8, width: 360, height: pop.y + pop.height + 6 - (word.y - 8) };
const tightFile = path.join(os.tmpdir(), `sanoja-promo-tight-${Date.now()}.png`);
await page.screenshot({ path: tightFile, clip: tightClip });
await page.close();

const b64 = (f) => "data:image/png;base64," + fs.readFileSync(f).toString("base64");
const crop = b64(cropFile);
const tight = b64(tightFile);
const logo = b64(path.join(repo, "docs", "assets", "icon512.png"));
const FONT = `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`;
const BG = `linear-gradient(135deg,#2f6bff 0%,#1d44d8 100%)`;

const marquee = `<style>
  *{box-sizing:border-box;margin:0}
  body{width:1400px;height:560px;overflow:hidden;font-family:${FONT};color:#fff;background:${BG};position:relative}
  .glow{position:absolute;right:-180px;top:-260px;width:900px;height:900px;border-radius:50%;background:rgba(255,255,255,.07)}
  .left{position:absolute;left:96px;top:0;bottom:0;width:620px;display:flex;flex-direction:column;justify-content:center}
  .brand{display:flex;align-items:center;gap:22px}
  .brand img{width:84px;height:84px;border-radius:50%;box-shadow:0 10px 26px rgba(5,20,90,.35)}
  .brand span{font-size:78px;font-weight:800;letter-spacing:-0.025em}
  h2{font-size:38px;line-height:1.2;font-weight:700;margin-top:30px;letter-spacing:-0.01em}
  p{font-size:24px;line-height:1.4;margin-top:16px;color:rgba(255,255,255,.86)}
  .card{position:absolute;right:92px;top:112px;width:580px;background:#fff;border-radius:20px;padding:0;overflow:hidden;
        transform:rotate(-2.2deg);box-shadow:0 30px 70px rgba(5,20,90,.5)}
  .card img{display:block;width:100%}
</style>
<div class="glow"></div>
<div class="left">
  <div class="brand"><img src="${logo}"><span>Sanoja</span></div>
  <h2>Learn Finnish from the pages you already read.</h2>
  <p>Translate any word, hear it, and review it later with flashcards.</p>
</div>
<div class="card"><img src="${crop}"></div>`;

const small = `<style>
  *{box-sizing:border-box;margin:0}
  body{width:440px;height:280px;overflow:hidden;font-family:${FONT};color:#fff;background:${BG};position:relative}
  .brand{position:absolute;left:28px;top:20px;display:flex;align-items:center;gap:12px}
  .brand img{width:44px;height:44px;border-radius:50%;box-shadow:0 6px 16px rgba(5,20,90,.35)}
  .brand span{font-size:32px;font-weight:800;letter-spacing:-0.02em}
  .tag{position:absolute;left:28px;top:70px;font-size:15px;color:rgba(255,255,255,.88)}
  .card{position:absolute;left:28px;right:28px;top:104px;bottom:0;background:#fff;border-radius:14px 14px 0 0;
        overflow:hidden;box-shadow:0 18px 40px rgba(5,20,90,.45)}
  .card img{display:block;width:100%}
</style>
<div class="brand"><img src="${logo}"><span>Sanoja</span></div>
<div class="tag">Finnish translator &amp; dictionary</div>
<div class="card"><img src="${tight}"></div>`;

const composer = await context.newPage();
const jobs = [
  { file: "promo-marquee-1400x560.png", html: marquee, w: 1400, h: 560 },
  { file: "promo-small-tile-440x280.png", html: small, w: 440, h: 280 },
];
for (const j of jobs) {
  await composer.setViewportSize({ width: j.w, height: j.h });
  await composer.setContent(`<!doctype html><meta charset="utf-8">${j.html}`);
  await composer.waitForTimeout(200);
  await composer.screenshot({ path: path.join(outDir, j.file), scale: "css" });
  console.log("wrote", path.relative(repo, path.join(outDir, j.file)));
}

await context.close();
server.close();
