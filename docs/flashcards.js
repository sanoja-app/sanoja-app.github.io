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
const progressRow = document.getElementById("progressRow");
const progressFill = document.getElementById("progressFill");
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

let toastTimer;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 1800);
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

function wordsFor(name) {
  const now = new Date();
  if (name === "due") return words.filter((w) => !w.mastered && (!w.nextReview || new Date(w.nextReview) <= now));
  if (name === "mastered") return words.filter((w) => w.mastered);
  return words.slice();
}

function setFilter(name) {
  filter = name;
  [...filtersEl.children].forEach((c) => {
    c.classList.toggle("active", c.dataset.filter === name);
    c.setAttribute("aria-pressed", String(c.dataset.filter === name));
  });
  applyFilter();
}

function applyFilter() {
  filtered = wordsFor(filter);
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

const ICON_BOOK = '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14z"/><path d="M6.5 17A2.5 2.5 0 0 0 4 19.5 2.5 2.5 0 0 0 6.5 22H20v-5"/></svg>';
const ICON_CHECK = '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="4,12.5 9,17.5 20,6"/></svg>';

function emptyState(icon, title, body, button) {
  return `
    <div class="empty">
      <div class="emptyIcon${icon === ICON_CHECK ? " done" : ""}">${icon}</div>
      <h2>${title}</h2>
      <p>${body}</p>
      ${button ? `<button class="actionBtn primary" id="emptyAction">${button}</button>` : ""}
    </div>`;
}

function render(animateFlip) {
  const hasWords = words.length > 0;
  filtersEl.hidden = !hasWords;
  const showCards = hasWords && filtered.length > 0;
  controls.hidden = !showCards;
  progressRow.hidden = !showCards;
  shuffleBtn.hidden = !showCards || filtered.length < 2;
  // "Know it" means nothing on the Known list, so Next takes the full width there.
  masteredBtn.hidden = filter === "mastered";
  controls.classList.toggle("single", filter === "mastered");

  document.querySelectorAll("[data-count]").forEach((el) => {
    el.textContent = hasWords ? wordsFor(el.dataset.count).length : "";
  });

  if (!hasWords) {
    cardArea.innerHTML = emptyState(
      ICON_BOOK,
      "No words yet",
      "On your computer, open the Sanoja extension and choose “Practice on phone”, then scan the QR code with this phone."
    );
    return;
  }

  if (filtered.length === 0) {
    if (filter === "due") {
      cardArea.innerHTML = emptyState(ICON_CHECK, "All caught up", "Nothing is due for review right now. You can still go through every word.", "Practice all words");
      document.getElementById("emptyAction").addEventListener("click", () => setFilter("all"));
    } else if (filter === "mastered") {
      cardArea.innerHTML = emptyState(ICON_CHECK, "No known words yet", "Tap “Know it” on a card and it moves here.");
    } else {
      cardArea.innerHTML = emptyState(ICON_BOOK, "Nothing here", "Look up more words on your computer, then tap refresh at the top.");
    }
    return;
  }

  const card = filtered[index];
  progressEl.textContent = `${index + 1} / ${filtered.length}`;
  progressFill.style.width = `${((index + 1) / filtered.length) * 100}%`;

  // The example sentence is in Finnish, same as the desktop quiz — shown on
  // the front too, since seeing it doesn't give away the English answer.
  const contextHtml = card.context
    ? `<div class="context">“${escapeHtml(card.context)}”</div>`
    : "";

  cardArea.innerHTML = `
    <div class="card${flipped ? " flipped" : ""}${animateFlip ? " flipIn" : ""}" id="cardEl" role="button" tabindex="0"
         aria-label="${flipped ? "English answer" : "Finnish word, tap to show the English"}">
      <div class="lang">${flipped ? "English" : "Finnish"}</div>
      <div class="word">${escapeHtml(flipped ? card.english : card.finnish)}</div>
      ${flipped ? "" : contextHtml}
      <div class="hint">${flipped ? "Tap to flip back" : filtered.length > 1 ? "Tap to reveal · swipe for next" : "Tap to reveal"}</div>
    </div>`;
  attachCardGestures(document.getElementById("cardEl"));
}

function flip() {
  flipped = !flipped;
  render(true);
}

// Tap flips; a horizontal swipe moves to the next (left) or previous (right) card.
// Swiping never marks a word known, so a stray swipe can't lose anything.
function attachCardGestures(el) {
  let startX = null;
  let startY = 0;
  let dx = 0;
  let dragging = false;
  el.addEventListener("pointerdown", (e) => {
    startX = e.clientX;
    startY = e.clientY;
    dx = 0;
    dragging = false;
  });
  el.addEventListener("pointermove", (e) => {
    if (startX === null) return;
    dx = e.clientX - startX;
    if (!dragging && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(e.clientY - startY)) {
      dragging = true;
      el.classList.add("dragging");
      el.setPointerCapture(e.pointerId);
    }
    if (dragging) el.style.transform = `translateX(${dx}px) rotate(${dx / 30}deg)`;
  });
  const end = () => {
    if (startX === null) return;
    startX = null;
    if (!dragging) return;
    el.classList.remove("dragging");
    if (Math.abs(dx) > 80 && filtered.length > 1) {
      if (dx < 0) next();
      else prev();
    } else {
      el.classList.add("settle");
      el.style.transform = "";
    }
  };
  el.addEventListener("pointerup", end);
  el.addEventListener("pointercancel", end);
  el.addEventListener("click", () => {
    if (dragging) {
      dragging = false;
      return;
    }
    flip();
  });
  el.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      flip();
    }
  });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function next() {
  if (filtered.length === 0) return;
  index = (index + 1) % filtered.length;
  if (index === 0 && filtered.length > 1) showToast("That's the whole list. Starting again");
  flipped = false;
  render();
}

function prev() {
  if (filtered.length === 0) return;
  index = (index - 1 + filtered.length) % filtered.length;
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
    // The server snapshot knows nothing about "known" marks made on this phone, so
    // carry those over — otherwise every Refresh would bring known words back.
    const wordKey = (w) => `${w.finnish}\u0000${w.english}`;
    const knownHere = new Set(loadCached().filter((w) => w.mastered).map(wordKey));
    fetched.forEach((w) => {
      if (knownHere.has(wordKey(w))) w.mastered = true;
    });
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
  if (btn) setFilter(btn.dataset.filter);
});

refreshBtn.addEventListener("click", async () => {
  refreshBtn.classList.add("spinning");
  await refresh(true);
  refreshBtn.classList.remove("spinning");
});
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

// Keyboard shortcuts for when the page is open on a computer.
document.addEventListener("keydown", (e) => {
  if (e.target.closest("button, [role=button]") && (e.key === "Enter" || e.key === " ")) return;
  if (e.key === "ArrowRight") next();
  else if (e.key === "ArrowLeft") prev();
  else if (e.key === " ") {
    e.preventDefault();
    if (filtered.length) flip();
  }
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}

refresh(false);
