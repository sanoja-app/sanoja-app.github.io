// Builds the static "X in Finnish" pages for the Sanoja site.
//
//   node tools/seo/build.mjs
//
// Reads words.mjs and writes docs/words/*.html, docs/words/index.html,
// docs/words/words.css, docs/sitemap.xml and the word-guide section of docs/llms.txt.
// Output is plain static HTML for GitHub Pages; no runtime scripts.
//
// To add pages, append entries to WORDS in words.mjs and rerun.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { WORDS, CATEGORIES } from "./words.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const docs = path.resolve(here, "..", "..", "docs");
const outDir = path.join(docs, "words");
const SITE = "https://sanoja-app.github.io";
const STORE = "https://chromewebstore.google.com/detail/sanoja-read-words-in-finn/eoiodkapeakjcapimphbcjmijddaadjk";
const TODAY = new Date().toISOString().slice(0, 10);

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
// Escape first, then turn [[finnish]] markers into language-tagged spans.
const fi = (s) => esc(s).replace(/\[\[(.+?)\]\]/g, '<span lang="fi" class="fi">$1</span>');
const plain = (s) => String(s).replace(/\[\[(.+?)\]\]/g, "$1");
const storeLink = (slug) => `${STORE}?utm_source=sanoja_site&utm_medium=seo&utm_campaign=${slug}`;
const bySlug = Object.fromEntries(WORDS.map((w) => [w.slug, w]));

const CSS = `:root {
  color-scheme: light;
  --page: #ffffff; --surface-alt: #f7f8fa; --text-primary: #0b0e14; --text-secondary: #57606f;
  --gridline: #e7e9ee; --accent: #2962ff; --accent-dark: #1a3fd6; --accent-soft: #e8edff;
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--page); color: var(--text-primary); line-height: 1.6;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
a { color: var(--accent); }
.wrap { max-width: 760px; margin: 0 auto; padding: 0 20px; }
header.nav { padding: 16px 0; border-bottom: 1px solid var(--gridline); }
header.nav .wrap { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.brand { display: flex; align-items: center; gap: 10px; font-weight: 700; font-size: 17px; color: var(--text-primary); text-decoration: none; }
.brand img { width: 28px; height: 28px; border-radius: 50%; }
.nav-links { display: flex; align-items: center; gap: 20px; font-size: 14px; font-weight: 600; }
.nav-links a { color: var(--text-secondary); text-decoration: none; }
.nav-links a:hover { color: var(--accent); }
.nav-links .nav-cta { background: var(--accent); color: #fff; padding: 8px 16px; border-radius: 999px; font-weight: 700; }
.nav-links .nav-cta:hover { background: var(--accent-dark); color: #fff; }
.crumbs { font-size: 13px; color: var(--text-secondary); padding: 18px 0 0; }
.crumbs a { color: var(--text-secondary); }
h1 { font-size: 34px; line-height: 1.2; letter-spacing: -0.02em; margin: 10px 0 18px; }
h2 { font-size: 22px; margin: 36px 0 8px; letter-spacing: -0.01em; }
.fi { font-style: normal; font-weight: 600; }
.answer { background: var(--accent-soft); border: 1px solid #c9d6ff; border-radius: 14px; padding: 18px 20px; margin: 0 0 8px; }
.answer .big { font-size: 30px; font-weight: 800; color: var(--accent-dark); line-height: 1.2; }
.answer .say { font-size: 14px; color: var(--text-secondary); margin: 2px 0 10px; }
.answer p { margin: 0; font-size: 17px; }
.tablewrap { overflow-x: auto; margin: 12px 0; border: 1px solid var(--gridline); border-radius: 12px; }
table { border-collapse: collapse; width: 100%; font-size: 15px; }
th, td { text-align: left; padding: 10px 14px; border-bottom: 1px solid var(--gridline); vertical-align: top; }
th { background: var(--surface-alt); font-size: 13px; color: var(--text-secondary); font-weight: 600; }
tr:last-child td { border-bottom: none; }
.examples { list-style: none; padding: 0; margin: 12px 0; display: grid; gap: 10px; }
.examples li { background: var(--surface-alt); border: 1px solid var(--gridline); border-radius: 12px; padding: 12px 16px; }
.examples .f { font-weight: 700; display: block; }
.examples .e { color: var(--text-secondary); font-size: 15px; }
details { border: 1px solid var(--gridline); border-radius: 12px; padding: 12px 16px; margin: 8px 0; }
summary { cursor: pointer; font-weight: 600; }
details p { margin: 8px 0 0; color: var(--text-secondary); }
.related { display: flex; flex-wrap: wrap; gap: 8px; list-style: none; padding: 0; margin: 12px 0; }
.related a { display: inline-block; padding: 8px 14px; border: 1px solid var(--gridline); border-radius: 999px; text-decoration: none; font-size: 14px; color: var(--text-primary); }
.related a:hover { border-color: var(--accent); color: var(--accent); }
.cta { background: var(--surface-alt); border: 1px solid var(--gridline); border-radius: 16px; padding: 22px; margin: 40px 0 0; }
.cta h2 { margin-top: 0; font-size: 20px; }
.cta p { color: var(--text-secondary); margin: 6px 0 14px; }
.btn { display: inline-block; background: var(--accent); color: #fff; padding: 11px 22px; border-radius: 999px; font-weight: 700; text-decoration: none; }
.btn:hover { background: var(--accent-dark); }
.cat-list { list-style: none; padding: 0; margin: 8px 0 0; }
.cat-list li { padding: 10px 0; border-bottom: 1px solid var(--gridline); }
.cat-list a { font-weight: 600; text-decoration: none; }
.cat-list .w { color: var(--text-secondary); font-size: 14px; margin-left: 6px; }
footer { padding: 36px 0 48px; margin-top: 40px; border-top: 1px solid var(--gridline); font-size: 13px; color: var(--text-secondary); }
footer a { color: var(--text-secondary); margin-right: 16px; }
@media (max-width: 520px) { h1 { font-size: 27px; } .answer .big { font-size: 25px; } }
`;

function head({ title, desc, canonical, ld = [] }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}" />
<link rel="canonical" href="${canonical}" />
<link rel="icon" href="../assets/icon128.png" />
<meta property="og:type" content="article" />
<meta property="og:site_name" content="Sanoja" />
<meta property="og:url" content="${canonical}" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(desc)}" />
<meta name="twitter:card" content="summary" />
<meta name="twitter:title" content="${esc(title)}" />
<meta name="twitter:description" content="${esc(desc)}" />
${ld.map((o) => `<script type="application/ld+json">\n${JSON.stringify(o, null, 2)}\n</script>`).join("\n")}
<link rel="stylesheet" href="words.css" />
</head>
<body>`;
}

function nav(campaign) {
  return `  <header class="nav">
    <div class="wrap">
      <a class="brand" href="../"><img src="../assets/icon128.png" alt="" />Sanoja</a>
      <nav class="nav-links">
        <a href="./">All Finnish words</a>
        <a class="nav-cta" href="${storeLink(campaign)}">Install Sanoja</a>
      </nav>
    </div>
  </header>`;
}

function foot() {
  return `  <footer>
    <div class="wrap">
      <a href="../">Sanoja</a><a href="./">Finnish words</a><a href="../privacy.html">Privacy</a><a href="../feedback.html">Feedback</a>
      <p>Sanoja is an independent, free, open-source Finnish translator and dictionary extension for Chrome, Edge and Brave.</p>
    </div>
  </footer>
</body>
</html>
`;
}

function block(b) {
  if (b.h) return `<h2>${fi(b.h)}</h2>`;
  if (b.p) return `<p>${fi(b.p)}</p>`;
  if (b.list) return `<ul>${b.list.map((i) => `<li>${fi(i)}</li>`).join("")}</ul>`;
  if (b.table) {
    const { head: h, rows } = b.table;
    return `<div class="tablewrap"><table>
<thead><tr>${h.map((c) => `<th>${esc(c)}</th>`).join("")}</tr></thead>
<tbody>
${rows.map((r) => `<tr>${r.map((c) => `<td>${fi(c)}</td>`).join("")}</tr>`).join("\n")}
</tbody></table></div>`;
  }
  throw new Error("unknown block " + JSON.stringify(b));
}

function wordPage(w) {
  const url = `${SITE}/words/${w.slug}.html`;
  const cat = CATEGORIES.find((c) => c.id === w.cat);
  const ld = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Sanoja", item: `${SITE}/` },
        { "@type": "ListItem", position: 2, name: "Finnish words", item: `${SITE}/words/` },
        { "@type": "ListItem", position: 3, name: w.h1.replace(/^"|"$/g, ""), item: url },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: w.faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
    },
  ];
  return `${head({ title: w.tag, desc: w.desc, canonical: url, ld })}
${nav(w.slug)}
  <main class="wrap">
    <p class="crumbs"><a href="../">Sanoja</a> › <a href="./">Finnish words</a> › ${esc(cat.name)}</p>
    <h1>${fi(w.h1)}</h1>

    <div class="answer">
      <div class="big"><span lang="fi" class="fi">${esc(w.word)}</span></div>
      <div class="say">Say it: ${esc(w.respell)}. In Finnish, stress is always on the first syllable.</div>
      <p>${fi(w.answer)}</p>
    </div>

    ${w.body.map(block).join("\n    ")}

    <h2>Example sentences</h2>
    <ul class="examples">
${w.examples.map(([f, e]) => `      <li><span class="f" lang="fi">${esc(f)}</span><span class="e">${esc(e)}</span></li>`).join("\n")}
    </ul>

    <h2>Common questions</h2>
${w.faq.map(([q, a]) => `    <details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("\n")}

    <h2>Related words</h2>
    <ul class="related">
${w.related.map((s) => `      <li><a href="${s}.html">${esc(plain(bySlug[s].h1))}</a></li>`).join("\n")}
    </ul>

    <section class="cta">
      <h2>Meet a Finnish word you don't know?</h2>
      <p>Sanoja is a free browser extension: select any word on a page to see its translation, hear it, and save it to a spaced-repetition list. No account, no ads, no tracking.</p>
      <a class="btn" href="${storeLink(w.slug)}">Add Sanoja to Chrome</a>
    </section>
  </main>
${foot()}`;
}

function hubPage() {
  const url = `${SITE}/words/`;
  const title = "Finnish words and phrases explained | Sanoja";
  const desc = "Plain-English guides to common Finnish words and phrases: greetings, thank you, numbers, days, and the words you need for daily life in Finland.";
  const ld = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Finnish words and phrases explained",
      url,
      hasPart: WORDS.map((w) => ({ "@type": "WebPage", name: plain(w.h1), url: `${SITE}/words/${w.slug}.html` })),
    },
  ];
  return `${head({ title, desc, canonical: url, ld })}
${nav("words_hub")}
  <main class="wrap">
    <p class="crumbs"><a href="../">Sanoja</a> › Finnish words</p>
    <h1>Finnish words and phrases explained</h1>
    <p>Short guides to the Finnish words you meet first, with pronunciation, example sentences and the grammar that makes them change shape. Written for English speakers learning Finnish or living in Finland.</p>
${CATEGORIES.map((c) => {
  const items = WORDS.filter((w) => w.cat === c.id);
  if (!items.length) return "";
  return `    <h2>${esc(c.name)}</h2>
    <ul class="cat-list">
${items.map((w) => `      <li><a href="${w.slug}.html">${esc(plain(w.h1))}</a><span class="w" lang="fi">${esc(w.word)}</span></li>`).join("\n")}
    </ul>`;
}).join("\n")}

    <section class="cta">
      <h2>Learn the words you actually read</h2>
      <p>Sanoja translates any word you select on a web page, reads it aloud, and saves it for review. Free, with no account and no tracking.</p>
      <a class="btn" href="${storeLink("words_hub")}">Add Sanoja to Chrome</a>
    </section>
  </main>
${foot()}`;
}

// ── write files ─────────────────────────────────────────────────────────────────
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "words.css"), CSS);
for (const w of WORDS) fs.writeFileSync(path.join(outDir, `${w.slug}.html`), wordPage(w));
fs.writeFileSync(path.join(outDir, "index.html"), hubPage());

// sitemap: the existing static pages plus the word guides
const urls = [
  { loc: `${SITE}/`, freq: "monthly", pri: "1.0" },
  { loc: `${SITE}/words/`, freq: "monthly", pri: "0.8" },
  ...WORDS.map((w) => ({ loc: `${SITE}/words/${w.slug}.html`, freq: "monthly", pri: "0.7" })),
  { loc: `${SITE}/privacy.html`, freq: "yearly", pri: "0.3" },
  { loc: `${SITE}/feedback.html`, freq: "yearly", pri: "0.3" },
];
fs.writeFileSync(
  path.join(docs, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${TODAY}</lastmod>\n    <changefreq>${u.freq}</changefreq>\n    <priority>${u.pri}</priority>\n  </url>`).join("\n")}
</urlset>
`
);

// llms.txt: keep a "Finnish word guides" section in sync
const llmsPath = path.join(docs, "llms.txt");
let llms = fs.readFileSync(llmsPath, "utf8");
llms = llms.replace(/## Finnish word guides[\s\S]*?(?=\n## |$)/, "").replace(/\n{3,}/g, "\n\n");
const section = `## Finnish word guides\n\n${WORDS.map((w) => `- [${plain(w.h1)}](${SITE}/words/${w.slug}.html): ${w.word}`).join("\n")}\n`;
llms = llms.includes("\n## Optional") ? llms.replace("\n## Optional", `\n${section}\n## Optional`) : llms.trimEnd() + "\n\n" + section;
fs.writeFileSync(llmsPath, llms);

console.log(`Built ${WORDS.length} word pages + hub, sitemap and llms.txt (${urls.length} URLs).`);
