// Sanoja Flashcards — phone-side companion view.
//
// One-way sync: the extension popup pushes a snapshot of the word list to a
// worker-held ID (see uninstall-feedback-worker/worker.js `/sync/:id`); this
// page pulls that snapshot down and caches it in localStorage so it works
// offline afterward. "Known" marks here are local to this device only — they
// don't write back to the extension, since there's no channel for that.

const SYNC_ENDPOINT = "https://sanoja-uninstall-feedback.shahzainhtc.workers.dev/sync/";
const STORAGE_KEY = "sanojaFlashcardsData";
const SYNC_ID_KEY = "sanojaFlashcardsSyncId";

const cardArea = document.getElementById("cardArea");
const controls = document.getElementById("controls");
const filtersEl = document.getElementById("filters");
const progressEl = document.getElementById("progress");
const refreshBtn = document.getElementById("refreshBtn");
const shuffleBtn = document.getElementById("shuffleBtn");
const nextBtn = document.getElementById("nextBtn");
const masteredBtn = document.getElementById("masteredBtn");
const toast = document.getElementById("toast");

let words = [];
let filtered = [];
let index = 0;
let flipped = false;
let filter = "due";

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 1800);
}

function loadCached() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCached(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Storage full or unavailable — the in-memory list still works this session.
  }
}

function getSyncId() {
  const fromUrl = new URLSearchParams(location.search).get("sync");
  if (fromUrl) {
    localStorage.setItem(SYNC_ID_KEY, fromUrl);
    // Drop it from the visible URL so a refresh/share doesn't re-carry it.
    history.replaceState(null, "", location.pathname);
    return fromUrl;
  }
  return localStorage.getItem(SYNC_ID_KEY);
}

async function fetchFromServer(id) {
  const res = await fetch(SYNC_ENDPOINT + id, { cache: "no-store" });
  if (!res.ok) throw new Error(`status ${res.status}`);
  const data = await res.json();
  return Array.isArray(data.words) ? data.words : [];
}

function applyFilter() {
  const now = new Date();
  if (filter === "due") {
    filtered = words.filter((w) => !w.mastered && (!w.nextReview || new Date(w.nextReview) <= now));
  } else if (filter === "mastered") {
    filtered = words.filter((w) => w.mastered);
  } else {
    filtered = words.slice();
  }
  index = 0;
  flipped = false;
  render();
}

function shuffle() {
  for (let i = filtered.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [filtered[i], filtered[j]] = [filtered[j], filtered[i]];
  }
  index = 0;
  flipped = false;
  render();
}

function render() {
  const hasWords = words.length > 0;
  filtersEl.hidden = !hasWords;
  controls.hidden = !hasWords || filtered.length === 0;
  progressEl.hidden = !hasWords || filtered.length === 0;

  if (!hasWords) {
    cardArea.innerHTML = `
      <div class="empty">
        <h2>No words yet</h2>
        <p>Open the Sanoja extension popup on your computer and tap "Practice on phone" to scan a QR code here.</p>
      </div>`;
    return;
  }

  if (filtered.length === 0) {
    cardArea.innerHTML = `
      <div class="empty">
        <h2>Nothing here</h2>
        <p>No words in this list right now. Try a different filter, or pull to refresh once you've added more on desktop.</p>
      </div>`;
    return;
  }

  const card = filtered[index];
  progressEl.hidden = false;
  progressEl.textContent = `${index + 1} / ${filtered.length}`;

  const showFinnishFirst = true;
  const front = showFinnishFirst ? card.finnish : card.english;
  const back = showFinnishFirst ? card.english : card.finnish;
  const frontLang = showFinnishFirst ? "Finnish" : "English";
  const backLang = showFinnishFirst ? "English" : "Finnish";

  // The example sentence is in Finnish, same as the desktop quiz — shown on
  // the front too, since seeing it doesn't give away the English answer.
  const contextHtml = card.context
    ? `<div class="context">“${escapeHtml(card.context)}”</div>`
    : "";

  cardArea.innerHTML = `
    <div class="card${flipped ? " flipped" : ""}" id="cardEl">
      <div>
        <div class="lang">${flipped ? backLang : frontLang}</div>
        <div class="word">${escapeHtml(flipped ? back : front)}</div>
        ${flipped ? "" : contextHtml}
        ${flipped ? "" : '<div class="hint">Tap to reveal</div>'}
      </div>
    </div>`;
  document.getElementById("cardEl").addEventListener("click", () => {
    flipped = !flipped;
    render();
  });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function next() {
  if (filtered.length === 0) return;
  index = (index + 1) % filtered.length;
  flipped = false;
  render();
}

async function refresh(showFeedback) {
  const id = getSyncId();
  if (!id) {
    words = loadCached();
    applyFilter();
    return;
  }
  try {
    const fetched = await fetchFromServer(id);
    words = fetched;
    saveCached(fetched);
    if (showFeedback) showToast(`Synced ${fetched.length} word${fetched.length === 1 ? "" : "s"}`);
  } catch {
    words = loadCached();
    if (showFeedback) showToast(words.length ? "Offline — showing last saved words" : "Couldn't load words");
  }
  applyFilter();
}

filtersEl.addEventListener("click", (e) => {
  const btn = e.target.closest(".filter");
  if (!btn) return;
  filter = btn.dataset.filter;
  [...filtersEl.children].forEach((c) => c.classList.toggle("active", c === btn));
  applyFilter();
});

refreshBtn.addEventListener("click", () => refresh(true));
shuffleBtn.addEventListener("click", shuffle);
nextBtn.addEventListener("click", next);
masteredBtn.addEventListener("click", () => {
  if (filtered.length === 0) return;
  const card = filtered[index];
  card.mastered = true;
  const stored = loadCached();
  const match = stored.find((w) => w.finnish === card.finnish && w.english === card.english);
  if (match) match.mastered = true;
  saveCached(stored);
  showToast("Marked known on this device");
  filtered.splice(index, 1);
  if (index >= filtered.length) index = 0;
  flipped = false;
  render();
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}

refresh(false);
