// Sanoja background service worker.
//
// The content script used to call fetch() directly against
// translate.googleapis.com. That fetch runs in the context of whatever
// webpage you're on, so it's subject to THAT PAGE's CORS policy — declaring
// host_permissions in the manifest doesn't make a content script's own
// fetch() bypass it. That's very likely why translation was failing on
// every page ("Couldn't translate"), not just occasionally.
//
// The service worker doesn't have that restriction, so it does the actual
// network request here, and the content script just asks it for a result.

chrome.runtime.setUninstallURL("https://sanoja-app.github.io/uninstall.html");

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.type === "sanoja-baseform") {
    lookupBaseForm(message.word)
      .then((result) => sendResponse({ ok: true, result }))
      .catch((err) => sendResponse({ ok: false, error: String((err && err.message) || err) }));
    return true;
  }
  if (message && message.type === "sanoja-speak") {
    speakWithGoogleVoice(message.text, message.lang)
      .then(sendResponse)
      .catch(() => sendResponse({ ok: false, started: false }));
    return true;
  }
  if (!message || message.type !== "sanoja-translate") return false;

  translate(message.text, message.targetLang, message.sourceLang)
    .then((result) => sendResponse({ ok: true, ...result }))
    .catch((err) => sendResponse({ ok: false, error: String((err && err.message) || err) }));

  return true; // keep the message channel open for the async sendResponse above
});

// Pronunciation uses Google Translate's voice, which sounds far more natural
// than the Finnish system voices most computers have. The audio plays in an
// offscreen document (see offscreen.js). Responds { ok, started }: ok means
// it played to the end; started=false means nothing was heard, so the
// caller should fall back to speechSynthesis.
const MAX_TTS_LENGTH = 200; // the endpoint rejects longer text

// Chrome closes an AUDIO_PLAYBACK offscreen document after ~30 seconds
// without sound, so check for it on every call rather than remembering
// that one was created.
let creatingOffscreen = null;
async function ensureOffscreen() {
  const existing = await chrome.runtime.getContexts({ contextTypes: ["OFFSCREEN_DOCUMENT"] });
  if (existing.length > 0) return;
  if (!creatingOffscreen) {
    creatingOffscreen = chrome.offscreen
      .createDocument({
        url: "offscreen.html",
        reasons: ["AUDIO_PLAYBACK"],
        justification: "Play the Finnish pronunciation of the selected word",
      })
      .finally(() => {
        creatingOffscreen = null;
      });
  }
  await creatingOffscreen;
}

async function speakWithGoogleVoice(text, lang) {
  text = (text || "").trim();
  if (!text || text.length > MAX_TTS_LENGTH || !chrome.offscreen) return { ok: false, started: false };
  await ensureOffscreen();
  const result = await chrome.runtime.sendMessage({ type: "sanoja-offscreen-play", text, lang: lang || "fi" });
  return result || { ok: false, started: false };
}

// sourceLang defaults to "auto" (let Google guess). The content script can
// pass an explicit source instead when it has a stronger signal than Google's
// own single-word detection — see the pageLang check in translateBidirectional.
async function translate(text, targetLang, sourceLang) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(
    sourceLang || "auto"
  )}&tl=${encodeURIComponent(
    targetLang
  )}&dt=t&q=${encodeURIComponent(text)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Translate request failed: ${res.status}`);
  const data = await res.json();
  // data[0] is an array of [translatedChunk, originalChunk, ...]; data[2] is the detected source language.
  const translatedText = data[0].map((chunk) => chunk[0]).join("");
  const detectedLang = data[2];
  return { translatedText, detectedLang };
}

// Inflected Finnish words ("juokse", "talossa", "kädet") are hard to look up
// for someone who has never seen the word before — the dictionary form
// ("juosta", "talo", "käsi") is what every dictionary and course uses, and
// Google only has real dictionary data for that form. English Wiktionary
// marks inflected forms as "form-of" entries linking to the dictionary form
// ("inessive singular of talo"), so one lookup finds it. Its API sends Access-Control-Allow-Origin: *, so this fetch
// needs no extra host_permissions (which would make Chrome disable the
// extension on update until the user re-approves it).
const WIKTIONARY_API = "https://en.wiktionary.org/api/rest_v1/page/definition/";

// Kept for as long as the service worker lives, so looking at the same word
// again (very common while reading) doesn't hit Wiktionary again — its API
// rate-limits bursts of requests.
const wiktionaryCache = new Map();

async function fetchWiktionaryFinnish(word) {
  if (wiktionaryCache.has(word)) return wiktionaryCache.get(word);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const res = await fetch(WIKTIONARY_API + encodeURIComponent(word), {
      signal: controller.signal,
      headers: { "Api-User-Agent": "Sanoja browser extension" },
    });
    // 404 is a real "no such page" and safe to remember; anything else
    // (429 rate limit, 5xx) is temporary, so don't cache it.
    if (res.status === 404) wiktionaryCache.set(word, null);
    if (!res.ok) return null;
    const data = await res.json();
    const entries = data.fi || null;
    wiktionaryCache.set(word, entries);
    return entries;
  } catch {
    return null; // timeout or network error — treat as "no entry"
  } finally {
    clearTimeout(timer);
  }
}

function htmlToText(html) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"');
}

// Only inflections count — Wiktionary uses the same "form-of" markup for
// synonyms, abbreviations and alternative spellings, which aren't what a
// learner needs here.
const GRAMMAR_WORDS =
  /\b(inflection|singular|plural|connegative|infinitive|participle|indicative|imperative|conditional|potential|passive|nominative|genitive|partitive|essive|translative|inessive|elative|illative|adessive|ablative|allative|abessive|comitative|instructive)\b/i;

// Returns { baseForm, meaning }, or null
// when the word is already a dictionary form or Wiktionary doesn't know it.
async function lookupBaseForm(word) {
  word = (word || "").trim();
  if (!word) return null;
  const candidates = [...new Set([word, word.toLowerCase()])];

  for (const candidate of candidates) {
    const entries = await fetchWiktionaryFinnish(candidate);
    if (!entries) continue;

    for (const entry of entries) {
      // An entry whose first sense is a real meaning is a dictionary form
      // itself ("talo" = house); later senses there are things like
      // synonyms or abbreviations, not inflections.
      const first = ((entry.definitions || [])[0] || {}).definition || "";
      if (!/form-of-definition/.test(first)) continue;

      for (const def of entry.definitions || []) {
        const html = def.definition || "";
        const link = html.match(/form-of-definition-link[\s\S]*?<a [^>]*title="([^"]+)"/);
        if (!link) continue;
        if (!GRAMMAR_WORDS.test(htmlToText(html))) continue;
        const baseForm = link[1];
        if (baseForm.toLowerCase() === candidate.toLowerCase()) continue;

        return { baseForm, meaning: await lookupMeaning(baseForm) };
      }
    }
  }
  return null;
}

// First real (non-form-of) English definition of a dictionary form, e.g.
// "to run (move swiftly)".
async function lookupMeaning(baseForm) {
  try {
    const entries = await fetchWiktionaryFinnish(baseForm);
    for (const entry of entries || []) {
      for (const def of entry.definitions || []) {
        if (/form-of-definition/.test(def.definition || "")) continue;
        let text = htmlToText(def.definition || "")
          .split("\n")[0]
          .replace(/\[[^\]]*\]/g, "") // usage notes like "[with illative]"
          .split(";")[0]
          .replace(/\s+/g, " ")
          .trim();
        // Long glosses read badly in a small card — drop the explanation in
        // parentheses before resorting to cutting the text off.
        if (text.length > 45) text = text.replace(/\s*\([^)]*\)/g, "").trim();
        if (text) return text.length > 60 ? `${text.slice(0, 59).trim()}…` : text;
      }
    }
  } catch {
    // Best-effort — the dictionary form alone is still useful.
  }
  return "";
}
