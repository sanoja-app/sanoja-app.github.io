// Builds the five captioned Chrome Web Store screenshots (1280x800) from the real
// extension: loads it into Chromium, seeds realistic words, captures real UI, then
// composes each capture under a caption.
//
//   CHROMIUM_PATH="/path/to/Chrome for Testing" node tools/screenshots/make.mjs [outDir]
//
// Needs the tests/ dependencies (cd tests && npm install). Output defaults to
// store-assets/screenshots-v2/. Captures use live Google Translate for the on-page popup.

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

const outDir = path.resolve(process.argv[2] || path.join(repo, "store-assets", "screenshots-v2"));
const rawDir = fs.mkdtempSync(path.join(os.tmpdir(), "sanoja-shots-"));
fs.mkdirSync(outDir, { recursive: true });

// ── sample data: accurate Finnish, one example sentence per word ─────────────────
const DAY = 86400000;
const iso = (offsetDays) => new Date(Date.now() + offsetDays * DAY).toISOString();
const SAMPLE = [
  ["kirjasto", "library", "Uusi kirjasto avataan ensi kuussa.", "The new library opens next month.", 2, -1],
  ["vuokra", "rent", "Vuokra maksetaan kuun alussa.", "The rent is paid at the start of the month.", 1, -1],
  ["lääkäri", "doctor", "Minulla on aika lääkärille torstaina.", "I have an appointment with the doctor on Thursday.", 3, -1],
  ["kauppa", "shop", "Kauppa on auki sunnuntaisin.", "The shop is open on Sundays.", 2, -1],
  ["ystävä", "friend", "Ystäväni asuu Tampereella.", "My friend lives in Tampere.", 4, 6],
  ["sää", "weather", "Huomenna sää on aurinkoinen.", "Tomorrow the weather will be sunny.", 1, -1],
  ["juna", "train", "Juna lähtee kello kahdeksan.", "The train leaves at eight o'clock.", 2, -1],
  ["kahvi", "coffee", "Juon kahvia joka aamu.", "I drink coffee every morning.", 5, 20],
  ["talvi", "winter", "Talvi on pitkä ja pimeä.", "Winter is long and dark.", 3, 4],
  ["sauna", "sauna", "Lauantaina menemme saunaan.", "On Saturday we go to the sauna.", 4, 9],
  ["työ", "work", "Työ alkaa yhdeksältä.", "Work starts at nine.", 2, -1],
  ["pankki", "bank", "Pankki sulkeutuu kello neljä.", "The bank closes at four o'clock.", 1, -1],
  ["lumi", "snow", "Lumi sulaa keväällä.", "The snow melts in spring.", 3, 3],
  ["kesä", "summer", "Kesä on lyhyt mutta kaunis.", "Summer is short but beautiful.", 2, -1],
];
function seedWords() {
  const words = {};
  SAMPLE.forEach(([fi, en, ctx, ctxEn, box, dueIn], i) => {
    words[fi] = {
      finnish: fi,
      english: en,
      count: 1 + (i % 4),
      firstSeen: iso(-20 + i),
      lastSeen: iso(-1 - (i % 5)),
      box,
      nextReview: iso(dueIn),
      context: ctx,
      contextTranslation: ctxEn,
    };
  });
  return words;
}

// ── tiny static server for fixtures and the phone page ────────────────────────────
function serve() {
  const roots = [here, path.join(repo, "docs")];
  const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".png": "image/png", ".webmanifest": "application/manifest+json" };
  const s = http.createServer((q, r) => {
    const rel = decodeURIComponent(q.url.split("?")[0]).replace(/^\/+/, "");
    for (const root of roots) {
      const f = path.join(root, rel);
      if (f.startsWith(root) && fs.existsSync(f) && fs.statSync(f).isFile()) {
        return r.writeHead(200, { "content-type": types[path.extname(f)] || "application/octet-stream" }).end(fs.readFileSync(f));
      }
    }
    r.writeHead(404).end();
  });
  return new Promise((res) => s.listen(0, "127.0.0.1", () => res(s)));
}

const server = await serve();
const base = `http://127.0.0.1:${server.address().port}`;

const context = await chromium.launchPersistentContext(fs.mkdtempSync(path.join(os.tmpdir(), "sanoja-prof-")), {
  channel: "chromium",
  ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
  headless: true,
  deviceScaleFactor: 2,
  viewport: { width: 760, height: 500 },
  args: [`--disable-extensions-except=${repo}`, `--load-extension=${repo}`],
});
const sw = context.serviceWorkers()[0] || (await context.waitForEvent("serviceworker"));
const extId = new URL(sw.url()).host;

async function popupShot(file, name, targetSelector) {
  const page = await context.newPage();
  await page.goto(`${base}/${file}`);
  await page.waitForTimeout(1500);
  const box = await page.locator(targetSelector).boundingBox();
  await page.mouse.dblclick(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForFunction(() => {
    const el = document.querySelector("#sanoja-popup .sanoja-translated");
    return el && !el.classList.contains("sanoja-skeleton");
  }, null, { timeout: 15000 });
  await page.waitForTimeout(400);
  const out = path.join(rawDir, name);
  await page.screenshot({ path: out });
  await page.close();
  return out;
}

const raw = {};
raw.fi = await popupShot("news-fi.html", "fi.png", "#target");
raw.en = await popupShot("news-en.html", "en.png", "#target");

// Seed the words and streak, then capture the extension's own pages.
await sw.evaluate(
  ([words, lastPracticeDate]) => chrome.storage.local.set({ sanojaWords: words, sanojaStreak: { count: 9, lastPracticeDate } }),
  [seedWords(), new Date(Date.now() - DAY).toISOString().slice(0, 10)]
);

const hist = await context.newPage();
await hist.setViewportSize({ width: 700, height: 760 });
await hist.goto(`chrome-extension://${extId}/history.html`);
await hist.waitForTimeout(800);

// Quiz: start a due round, show the answer so the example sentence and its translation are visible.
await hist.locator("#segPractice").click();
await hist.locator("#startDueBtn").click();
await hist.locator("#startModeBtn").click();
await hist.locator("#showAnswerBtn").waitFor();
await hist.locator("#showAnswerBtn").click();
await hist.waitForTimeout(500);
raw.quiz = path.join(rawDir, "quiz.png");
await hist.screenshot({ path: raw.quiz });

// Word list, hovering a context eye so the example sentence tooltip is showing.
await hist.reload();
await hist.waitForTimeout(600);
await hist.locator("#segWords").click();
await hist.waitForTimeout(400);
const eyes = hist.locator(".context-tip");
if (await eyes.count()) {
  await eyes.nth(2).hover();
  await hist.waitForTimeout(500);
}
raw.words = path.join(rawDir, "words.png");
await hist.screenshot({ path: raw.words });
await hist.close();

// Phone flashcards with a mocked sync, at 3x for a crisp phone frame.
const phoneBrowser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const phoneCtx = await phoneBrowser.newContext({
  viewport: { width: 390, height: 780 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
});
await phoneCtx.route("https://sanoja-uninstall-feedback.shahzainhtc.workers.dev/**", (route) =>
  route.fulfill({
    contentType: "application/json",
    body: JSON.stringify({
      words: SAMPLE.map(([finnish, english, context, contextTranslation, , dueIn]) => ({
        finnish,
        english,
        context,
        contextTranslation,
        nextReview: iso(dueIn),
      })),
    }),
  })
);
const phone = await phoneCtx.newPage();
await phone.goto(`${base}/flashcards.html?sync=demo`);
await phone.locator("#cardEl").waitFor();
await phone.waitForTimeout(500);
raw.phone = path.join(rawDir, "phone.png");
await phone.screenshot({ path: raw.phone });
await phoneCtx.close();
await phoneBrowser.close();

// ── compose ───────────────────────────────────────────────────────────────────────
const b64 = (f) => "data:image/png;base64," + fs.readFileSync(f).toString("base64");
const FONT = `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`;
const base_css = `
  *{box-sizing:border-box;margin:0}
  body{width:1280px;height:800px;overflow:hidden;font-family:${FONT};
       background:linear-gradient(135deg,#2f6bff 0%,#1d44d8 100%);color:#fff;position:relative}
  .cap{position:absolute;left:72px;top:54px;width:1136px}
  h1{font-size:50px;line-height:1.1;font-weight:800;letter-spacing:-0.02em}
  p{font-size:23px;margin-top:14px;color:rgba(255,255,255,.88);line-height:1.4}
  .win{position:absolute;left:50%;transform:translateX(-50%);top:218px;width:880px;background:#fff;
       border-radius:18px 18px 0 0;box-shadow:0 30px 70px rgba(5,20,90,.45);overflow:hidden}
  .win img{display:block;width:100%}
`;
const LAYOUTS = {
  window: ({ caption, sub, img, crop }) => `<style>${base_css}
    .win{height:${800 - 218}px}.win img{${crop || ""}}</style>
    <div class="cap"><h1>${caption}</h1><p>${sub}</p></div>
    <div class="win"><img src="${b64(img)}"></div>`,
  phone: ({ caption, sub, img }) => `<style>${base_css}
    .cap{width:560px;top:230px}
    .frame{position:absolute;right:130px;top:70px;width:372px;height:780px;background:#0d1020;border-radius:56px;
           padding:14px;box-shadow:0 30px 70px rgba(5,20,90,.5)}
    .screen{width:100%;height:100%;border-radius:44px;overflow:hidden;background:#fff}
    .screen img{width:100%;display:block}
    </style>
    <div class="cap"><h1>${caption}</h1><p>${sub}</p></div>
    <div class="frame"><div class="screen"><img src="${b64(img)}"></div></div>`,
};
const SHOTS = [
  { file: "01-select-any-word.png", layout: "window", img: raw.fi, caption: "Select any Finnish word. See it instantly.", sub: "Translation and pronunciation, right on the page you're reading." },
  { file: "02-works-both-ways.png", layout: "window", img: raw.en, caption: "Know the English? Find the Finnish.", sub: "No language picker. The direction is detected for you." },
  { file: "03-flashcards.png", layout: "window", img: raw.quiz, caption: "Never forget a word you looked up.", sub: "Spaced-repetition flashcards bring each word back at the right time.", crop: "margin-top:-30px" },
  { file: "04-word-list.png", layout: "window", img: raw.words, caption: "Every word saved, with its sentence.", sub: "A searchable list that remembers where each word came from.", crop: "margin-top:-30px" },
  { file: "05-phone.png", layout: "phone", img: raw.phone, caption: "Keep practicing on your phone.", sub: "Scan a QR code. No app to install." },
];

const composer = await context.newPage();
await composer.setViewportSize({ width: 1280, height: 800 });
for (const s of SHOTS) {
  await composer.setContent(`<!doctype html><meta charset="utf-8">${LAYOUTS[s.layout](s)}`);
  await composer.waitForTimeout(150);
  await composer.screenshot({ path: path.join(outDir, s.file), scale: "css" });
  console.log("wrote", path.join(path.relative(repo, outDir), s.file));
}

await context.close();
server.close();
