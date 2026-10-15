// Checks the generated "X in Finnish" pages under docs/words/ for the mistakes that
// quietly hurt search results: broken links, bad titles/descriptions, invalid JSON-LD,
// leftover markup, missing sitemap entries.
//
// Run:  node tests/seo-check.mjs        (exit code 1 on any problem; no browser needed)

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const docs = path.resolve(here, "..", "docs");
const wordsDir = path.join(docs, "words");
const SITE = "https://sanoja-app.github.io";

const problems = [];
const bad = (file, msg) => problems.push(`${file}: ${msg}`);

const files = fs.readdirSync(wordsDir).filter((f) => f.endsWith(".html"));
const sitemap = fs.readFileSync(path.join(docs, "sitemap.xml"), "utf8");
const titles = new Map();
const descriptions = new Map();

for (const f of files) {
  const html = fs.readFileSync(path.join(wordsDir, f), "utf8");
  const url = f === "index.html" ? `${SITE}/words/` : `${SITE}/words/${f}`;

  const unescape = (t) => t.replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
  const title = unescape((html.match(/<title>(.*?)<\/title>/s) || [])[1] || "");
  const desc = unescape((html.match(/<meta name="description" content="(.*?)"/s) || [])[1] || "");
  if (!title) bad(f, "missing <title>");
  if (title.length > 70) bad(f, `title is ${title.length} chars (keep under ~70): ${title}`);
  if (desc.length < 70 || desc.length > 175) bad(f, `meta description is ${desc.length} chars (aim for 70-175)`);
  if (titles.has(title)) bad(f, `duplicate title with ${titles.get(title)}`);
  if (descriptions.has(desc)) bad(f, `duplicate description with ${descriptions.get(desc)}`);
  titles.set(title, f);
  descriptions.set(desc, f);

  if ((html.match(/<h1[ >]/g) || []).length !== 1) bad(f, "page should have exactly one <h1>");
  if (!html.includes(`<link rel="canonical" href="${url}"`)) bad(f, `canonical should be ${url}`);
  if (!sitemap.includes(`<loc>${url}</loc>`)) bad(f, "not in sitemap.xml");
  if (html.includes("[[") || html.includes("]]")) bad(f, "unconverted [[ ]] Finnish markers in output");
  if (/undefined|\[object/.test(html)) bad(f, "contains 'undefined' or '[object'");

  // JSON-LD must parse
  for (const m of html.matchAll(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/g)) {
    try {
      JSON.parse(m[1]);
    } catch (e) {
      bad(f, `invalid JSON-LD: ${e.message}`);
    }
  }

  // Every internal link and asset must exist on disk
  for (const m of html.matchAll(/(?:href|src)="([^"#]+)(?:#[^"]*)?"/g)) {
    const ref = m[1];
    if (/^(https?:|mailto:|data:)/.test(ref)) continue;
    const target = path.resolve(wordsDir, ref.split("?")[0]);
    const resolved = fs.existsSync(target) && fs.statSync(target).isDirectory() ? path.join(target, "index.html") : target;
    if (!fs.existsSync(resolved)) bad(f, `broken link/asset: ${ref}`);
  }

  // The store link must carry its campaign tag so the Web Store dashboard can attribute installs
  const storeLinks = [...html.matchAll(/href="(https:\/\/chromewebstore\.google\.com[^"]+)"/g)].map((m) => m[1]);
  if (!storeLinks.length) bad(f, "no Web Store install link");
  for (const l of storeLinks) if (!l.includes("utm_source=sanoja_site")) bad(f, `untagged store link: ${l}`);
}

console.log(`Checked ${files.length} pages.`);
if (problems.length) {
  console.log(`\n${problems.length} problem(s):`);
  for (const p of problems) console.log(" - " + p);
  process.exit(1);
}
console.log("No problems found.");
