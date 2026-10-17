// Smoke test for the Sanoja extension.
//
// Loads the unpacked extension (the repo root) into Chromium, visits a fixed list
// of pages, double-clicks a real word on each, and checks the core flow:
//   popup appears -> translation resolves -> speak button works -> word is saved.
//
// Run:  cd tests && npm install && npx playwright install chromium && npm run smoke
// Output: a table on stdout, report.json next to this file, exit code 1 on any FAIL.
//
// Statuses: PASS, FAIL (extension misbehaved), SKIP (couldn't test: page didn't load,
// no word to select, no TTS voices). A SKIP is not a pass — look at the note.

import { chromium } from "playwright";
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
// EXTENSION_PATH lets you test an unzipped store package instead of the working tree.
const extensionPath = process.env.EXTENSION_PATH ? path.resolve(process.env.EXTENSION_PATH) : path.resolve(here, "..");
const fixturesDir = path.join(here, "fixtures");

// Local fixtures are deterministic; live sites catch real-world breakage but can
// flake (consent banners, redirects, network), so a load failure there is a SKIP.
const PAGES = [
  { name: "fixture: plain Finnish", path: "/plain-fi.html" },
  { name: "fixture: plain English", path: "/plain-en.html" },
  { name: "fixture: shadow DOM (tori.fi regression)", path: "/shadow-fi.html" },
  { name: "live: fi.wikipedia.org", url: "https://fi.wikipedia.org/wiki/Suomi", live: true },
  { name: "live: en.wikipedia.org", url: "https://en.wikipedia.org/wiki/Finland", live: true },
  { name: "live: yle.fi", url: "https://yle.fi/uutiset", live: true },
  { name: "live: tori.fi (shadow DOM)", url: "https://www.tori.fi/", live: true, shadowOnly: true },
  { name: "live: kela.fi", url: "https://www.kela.fi/", live: true },
  { name: "live: news.ycombinator.com", url: "https://news.ycombinator.com/", live: true },
];

function serveFixtures() {
  const server = http.createServer((req, res) => {
    const file = path.join(fixturesDir, path.basename(req.url.split("?")[0]));
    fs.readFile(file, (err, data) => {
      if (err) {
        res.writeHead(404).end("not found");
      } else {
        res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(data);
      }
    });
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server)));
}

// Finds a visible word to double-click. Walks open shadow roots too, and avoids
// links/buttons so the click can't navigate. Returns viewport coordinates.
const PICK_WORD = ({ shadowOnly } = {}) => {
  const WORD = /^\p{L}{5,}$/u;
  const BAD_ANCESTOR = "a, button, input, textarea, select, nav, header, footer, script, style, [contenteditable]";

  function* walk(root) {
    for (const el of root.querySelectorAll("*")) {
      yield el;
      if (el.shadowRoot) yield* walk(el.shadowRoot);
    }
  }
  const inShadow = (el) => el.getRootNode() instanceof ShadowRoot;

  // What is really on top at a point, looking through shadow roots. Cookie
  // banners and modals cover the page, and a click there would hit the overlay.
  function topmostAt(x, y) {
    let el = document.elementFromPoint(x, y);
    while (el && el.shadowRoot) {
      const inner = el.shadowRoot.elementFromPoint(x, y);
      if (!inner || inner === el) break;
      el = inner;
    }
    return el;
  }

  for (const el of walk(document)) {
    if (el.closest(BAD_ANCESTOR)) continue;
    if (shadowOnly && !inShadow(el)) continue;
    const textNode = [...el.childNodes].find(
      (n) => n.nodeType === 3 && n.textContent.trim().split(/\s+/).some((w) => WORD.test(w))
    );
    if (!textNode) continue;
    const style = getComputedStyle(el);
    if (style.visibility === "hidden" || style.display === "none" || style.userSelect === "none") continue;

    const word = textNode.textContent.trim().split(/\s+/).find((w) => WORD.test(w));
    const idx = textNode.textContent.indexOf(word);

    // Light DOM: ask a Range for the word's own box. Shadow DOM: Range rects are
    // 0x0 there (the very bug this fixture guards), so aim at the element instead.
    let rect = null;
    if (!inShadow(el)) {
      const range = document.createRange();
      range.setStart(textNode, idx);
      range.setEnd(textNode, idx + word.length);
      rect = range.getBoundingClientRect();
    }
    if (!rect || rect.width === 0) {
      const r = el.getBoundingClientRect();
      rect = { left: r.left, top: r.top, width: Math.min(40, r.width), height: Math.min(r.height, 24) };
    }
    if (rect.width === 0 || rect.height === 0) continue;
    if (rect.top < 0 || rect.top + rect.height > window.innerHeight) continue;
    if (rect.left < 0 || rect.left + rect.width > window.innerWidth) continue;

    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const hit = topmostAt(x, y);
    if (!hit || !(hit === el || el.contains(hit))) continue; // covered by something else

    return { x, y, word };
  }
  return null;
};

async function checkPage(context, serviceWorker, baseUrl, spec) {
  const result = { name: spec.name, url: spec.url || baseUrl + spec.path, checks: {}, notes: [] };
  const skip = (check, why) => (result.checks[check] = { status: "SKIP", note: why });
  const pass = (check, note = "") => (result.checks[check] = { status: "PASS", note });
  const fail = (check, why) => (result.checks[check] = { status: "FAIL", note: why });

  const page = await context.newPage();
  const consoleErrors = [];
  page.on("console", (m) => m.type() === "error" && m.text().includes("Sanoja") && consoleErrors.push(m.text()));
  try {
    try {
      await page.goto(result.url, { waitUntil: "domcontentloaded", timeout: 30000 });
    } catch (e) {
      for (const c of ["popup", "translation", "speak", "save"]) skip(c, `page did not load (${e.message.split("\n")[0]})`);
      return result;
    }
    await page.waitForTimeout(2500); // content script runs at document_idle; let late content render
    await page.mouse.move(0, 0);

    let target = await page.evaluate(PICK_WORD, { shadowOnly: spec.shadowOnly });
    if (!target) {
      await page.mouse.wheel(0, 500);
      await page.waitForTimeout(500);
      target = await page.evaluate(PICK_WORD, { shadowOnly: spec.shadowOnly });
    }
    if (!target) {
      for (const c of ["popup", "translation", "speak", "save"]) skip(c, "no suitable word found on page");
      return result;
    }
    result.word = target.word;

    const wordsBefore = JSON.stringify(
      (await serviceWorker.evaluate(() => chrome.storage.local.get("sanojaWords"))).sanojaWords || {}
    );

    await page.mouse.dblclick(target.x, target.y);
    await page.waitForTimeout(150);
    const selected = await page.evaluate(() => window.getSelection().toString().trim());
    if (!selected) {
      for (const c of ["popup", "translation", "speak", "save"]) skip(c, "double-click did not select any text (test harness issue)");
      return result;
    }
    result.selected = selected;

    // 1. popup
    const popup = page.locator("#sanoja-popup");
    try {
      await popup.waitFor({ state: "attached", timeout: 5000 });
      pass("popup", `selected "${selected}"`);
    } catch {
      fail("popup", `text "${selected}" was selected but no popup appeared`);
      for (const c of ["translation", "speak", "save"]) skip(c, "no popup");
      return result;
    }

    // 2. translation resolves
    try {
      await page.waitForFunction(() => {
        const el = document.querySelector("#sanoja-popup .sanoja-translated");
        return el && !el.classList.contains("sanoja-skeleton");
      }, null, { timeout: 12000 });
      const text = (await page.locator("#sanoja-popup .sanoja-translated").first().textContent()).trim();
      if (/couldn.t translate/i.test(text)) {
        fail("translation", `popup says "${text}"`);
      } else {
        pass("translation", text);
      }
    } catch {
      fail("translation", "popup stayed in loading state for 12s");
    }

    // 3. speak button
    const speakBtn = page.locator("#sanoja-popup .sanoja-speak");
    const voices = await page.evaluate(
      () =>
        new Promise((resolve) => {
          const v = speechSynthesis.getVoices();
          if (v.length) return resolve(v.length);
          speechSynthesis.addEventListener("voiceschanged", () => resolve(speechSynthesis.getVoices().length), { once: true });
          setTimeout(() => resolve(speechSynthesis.getVoices().length), 1500);
        })
    );
    if (!(await speakBtn.count())) {
      fail("speak", "no speak button in popup");
    } else if (await speakBtn.isDisabled()) {
      fail("speak", "speak button still disabled after translation loaded");
    } else if (voices === 0) {
      skip("speak", "button is enabled, but this browser has no TTS voices so audio can't be verified");
      await speakBtn.click();
    } else {
      await speakBtn.click();
      // Google's voice plays in the extension's offscreen page, out of the
      // test's sight; the button's data-voice says which voice played.
      const voice = await page
        .waitForFunction(() => document.querySelector("#sanoja-popup .sanoja-speak")?.dataset.voice, null, { timeout: 8000 })
        .then((h) => h.jsonValue(), () => null);
      const browserStarted =
        voice === "browser" &&
        (await page
          .waitForFunction(() => speechSynthesis.speaking || speechSynthesis.pending, null, { timeout: 3000 })
          .then(() => true, () => false));
      if (voice === "google") pass("speak", "Google voice played");
      else if (browserStarted) pass("speak", `fell back to the browser voice (${voices} voices available)`);
      else fail("speak", voice ? "fell back to the browser voice, but nothing started speaking" : "clicked speak but no voice played");
    }

    // 4. word saved. Sanoja only saves single-word lookups whose translation is also
    // a single word, so a multi-word translation ("In Finnish") is correctly not saved.
    const translatedText = result.checks.translation && result.checks.translation.status === "PASS"
      ? result.checks.translation.note
      : "";
    if (/\s/.test(translatedText.trim())) {
      skip("save", `translation "${translatedText}" is multi-word, which Sanoja intentionally doesn't save`);
      return result;
    }
    let saved = false;
    for (let i = 0; i < 20 && !saved; i++) {
      const now = JSON.stringify(
        (await serviceWorker.evaluate(() => chrome.storage.local.get("sanojaWords"))).sanojaWords || {}
      );
      saved = now !== wordsBefore || now.toLowerCase().includes(selected.toLowerCase());
      if (!saved) await page.waitForTimeout(500);
    }
    saved ? pass("save", "word list updated") : fail("save", `"${selected}" was not added to the word list within 10s`);

    if (consoleErrors.length) result.notes.push(...consoleErrors.slice(0, 3));
  } finally {
    await page.close();
  }
  return result;
}

const server = await serveFixtures();
const baseUrl = `http://127.0.0.1:${server.address().port}`;
const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "sanoja-smoke-"));

let context;
try {
  context = await chromium.launchPersistentContext(userDataDir, {
    channel: "chromium", // new headless mode, which supports extensions
    // Optional: point at an already-downloaded Chrome for Testing instead of the
    // revision this Playwright version expects.
    ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
    headless: true,
    viewport: { width: 1280, height: 800 },
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
  });
} catch (e) {
  console.error("Could not launch Chromium. Try: npx playwright install chromium\n", e.message);
  server.close();
  process.exit(2);
}

const serviceWorker = context.serviceWorkers()[0] || (await context.waitForEvent("serviceworker", { timeout: 10000 }));
const manifest = JSON.parse(fs.readFileSync(path.join(extensionPath, "manifest.json"), "utf8"));

const results = [];
for (const spec of PAGES) {
  process.stderr.write(`… ${spec.name}\n`);
  results.push(await checkPage(context, serviceWorker, baseUrl, spec));
}

await context.close();
server.close();
fs.rmSync(userDataDir, { recursive: true, force: true });

// Report
const CHECKS = ["popup", "translation", "speak", "save"];
const icon = { PASS: "ok  ", FAIL: "FAIL", SKIP: "skip" };
console.log(`\nSanoja ${manifest.version} smoke test — ${new Date().toISOString()}\n`);
for (const r of results) {
  console.log(`${r.name}${r.word ? `  [word: ${r.selected || r.word}]` : ""}`);
  for (const c of CHECKS) {
    const v = r.checks[c];
    if (v) console.log(`   ${icon[v.status]}  ${c.padEnd(11)} ${v.note}`);
  }
  for (const n of r.notes) console.log(`   note  ${n}`);
}
const flat = results.flatMap((r) => Object.values(r.checks));
const count = (s) => flat.filter((v) => v.status === s).length;
console.log(`\n${count("PASS")} passed, ${count("FAIL")} failed, ${count("SKIP")} skipped`);

fs.writeFileSync(
  path.join(here, "report.json"),
  JSON.stringify({ version: manifest.version, ranAt: new Date().toISOString(), results }, null, 2)
);
process.exit(count("FAIL") ? 1 : 0);
