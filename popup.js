const enabledEl = document.getElementById("enabled");
const autoSpeakEl = document.getElementById("autoSpeak");
const reviewBtn = document.getElementById("reviewWords");
const statLine = document.getElementById("statLine");
const feedbackLink = document.getElementById("feedbackLink");
const phoneBtn = document.getElementById("phoneBtn");
const phonePanel = document.getElementById("phonePanel");
const phoneStatus = document.getElementById("phoneStatus");

const SYNC_ENDPOINT = "https://sanoja-uninstall-feedback.shahzainhtc.workers.dev/sync/";
const FLASHCARDS_URL = "https://sanoja-app.github.io/flashcards.html";

phoneBtn.innerHTML = `${iconSvg("phone", 16)}Practice on phone`;

chrome.storage.sync.get(
  { sanojaEnabled: true, sanojaAutoSpeak: false },
  (items) => {
    enabledEl.checked = items.sanojaEnabled;
    autoSpeakEl.checked = items.sanojaAutoSpeak;
  }
);

enabledEl.addEventListener("change", () => {
  chrome.storage.sync.set({ sanojaEnabled: enabledEl.checked });
});

autoSpeakEl.addEventListener("change", () => {
  chrome.storage.sync.set({ sanojaAutoSpeak: autoSpeakEl.checked });
});

reviewBtn.addEventListener("click", () => {
  chrome.tabs.create({ url: chrome.runtime.getURL("history.html") });
});

feedbackLink.addEventListener("click", (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: "https://sanoja-app.github.io/feedback.html" });
});

function getSyncId() {
  return new Promise((resolve) => {
    chrome.storage.local.get({ sanojaSyncId: null }, ({ sanojaSyncId }) => {
      if (sanojaSyncId) return resolve(sanojaSyncId);
      const id = crypto.randomUUID();
      chrome.storage.local.set({ sanojaSyncId: id }, () => resolve(id));
    });
  });
}

phoneBtn.addEventListener("click", async () => {
  phoneBtn.disabled = true;
  phonePanel.classList.remove("hidden");
  phoneStatus.textContent = "Syncing your words…";
  document.getElementById("qrcode").innerHTML = "";

  try {
    const id = await getSyncId();
    const { sanojaWords } = await new Promise((resolve) =>
      chrome.storage.local.get({ sanojaWords: {} }, resolve)
    );
    // Slim payload — only what the flashcard view needs, not full history.
    const words = Object.values(sanojaWords).map((w) => ({
      finnish: w.finnish,
      english: w.english,
      mastered: !!w.mastered,
      nextReview: w.nextReview || null,
    }));

    const res = await fetch(SYNC_ENDPOINT + id, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ words }),
    });
    if (!res.ok) throw new Error(`Sync failed (${res.status})`);

    new QRCode(document.getElementById("qrcode"), {
      text: `${FLASHCARDS_URL}?sync=${id}`,
      width: 176,
      height: 176,
      correctLevel: QRCode.CorrectLevel.M,
    });
    phoneStatus.textContent = `${words.length} word${words.length === 1 ? "" : "s"} synced. Scan with your phone camera, then add the page to your home screen. Re-open this panel any time to refresh.`;
  } catch (err) {
    phoneStatus.textContent = "Couldn't sync right now — check your connection and try again.";
  } finally {
    phoneBtn.disabled = false;
  }
});

chrome.storage.local.get({ sanojaWords: {}, sanojaStreak: null }, ({ sanojaWords, sanojaStreak }) => {
  const words = Object.values(sanojaWords);
  const now = new Date();
  const dueCount = words.filter((w) => !w.mastered && (!w.nextReview || new Date(w.nextReview) <= now)).length;
  const masteredCount = words.filter((w) => w.mastered).length;

  // Leads with what's known, not a backlog count — same reasoning as the
  // word-log page: "3 known" feels like progress, "12 due" feels like a chore.
  const streakBadge =
    sanojaStreak && sanojaStreak.count > 0
      ? `<span class="streak">${iconSvg("flame", 12)}${sanojaStreak.count}</span>`
      : "";
  statLine.innerHTML = `${words.length} word${words.length === 1 ? "" : "s"}` +
    (masteredCount > 0 ? ` · ${masteredCount} known` : "") + streakBadge;

  reviewBtn.innerHTML = dueCount > 0
    ? `${iconSvg("book", 16)}Practice (${dueCount})`
    : `${iconSvg("book", 16)}Browse words`;
});
