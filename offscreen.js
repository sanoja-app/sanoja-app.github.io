// Sanoja offscreen audio player.
//
// The service worker can't play audio, and an <audio> element created by the
// content script would be subject to the webpage's Content-Security-Policy
// (many sites block media from other origins). This hidden extension page
// has neither problem, and media elements don't need CORS or
// host_permissions, so playing Google Translate's Finnish voice adds no
// permission warning.

const TTS_URL = "https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=";
// If nothing is audible by then (offline, blocked, endpoint changed), report
// failure so the caller can fall back to the browser's own voice.
const START_TIMEOUT_MS = 3000;

let current = null;

// Replaced by a newer word: report it as handled (started) so the earlier
// caller doesn't fall back to the browser voice on top of the new word.
function stop() {
  if (!current) return;
  current.audio.pause();
  current.finish(false, true);
  current = null;
}

function play(text, lang) {
  stop();
  return new Promise((resolve) => {
    const audio = new Audio(TTS_URL + encodeURIComponent(lang) + "&q=" + encodeURIComponent(text));
    let settled = false;
    const finish = (ok, interrupted = false, reason = "") => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (current && current.audio === audio) current = null;
      resolve({ ok, started: interrupted || audio.currentTime > 0, ...(reason ? { reason } : {}) });
    };
    const timer = setTimeout(() => {
      if (audio.currentTime === 0) {
        audio.pause();
        finish(false, false, "timeout");
      }
    }, START_TIMEOUT_MS);
    current = { audio, finish };
    audio.addEventListener("ended", () => finish(true));
    audio.addEventListener("error", () => finish(false, false, `media error ${audio.error && audio.error.code}`));
    audio.play().catch((err) => finish(false, false, `play() rejected: ${err && err.name}`));
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || message.type !== "sanoja-offscreen-play") return false;
  play(message.text, message.lang || "fi").then(sendResponse);
  return true;
});
