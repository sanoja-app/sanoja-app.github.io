// Sanoja telemetry: tells the developer (via Slack) when someone installs
// or uninstalls Sanoja, and when something breaks. Loaded into the service
// worker by background.js with importScripts.
//
// What's sent is deliberately minimal and anonymous: a random install ID
// generated here (not tied to any account), the extension version, the
// Chrome major version, Chrome's UI language, and for errors a short,
// scrubbed error message. Never the words you look up, page URLs, or
// anything about your browsing. See PRIVACY.md.
//
// It goes to the same Cloudflare Worker that phone sync already uses, so
// this needs no new host permission (a new one would make Chrome disable
// the extension on update until the user re-approves it).

const TELEMETRY_ENDPOINT = "https://sanoja-uninstall-feedback.shahzainhtc.workers.dev";

// Web Store installs have an update_url in their manifest; an unpacked
// build loaded from a folder doesn't. Flagged so test installs show up as
// [dev] in Slack instead of looking like real users.
const IS_DEV_BUILD = !("update_url" in chrome.runtime.getManifest());

const ERROR_REPORTS_PER_HOUR = 10;
const ERROR_REPORTS_PER_KIND_PER_HOUR = 3;

function chromeMajorVersion() {
  return (navigator.userAgent.match(/Chrome\/(\d+)/) || [])[1] || "";
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

// Installs from before this version have no install date, so "kept for N
// days" is only known for installs made after it shipped.
let installInfoPromise = null;
function getInstallInfo() {
  if (!installInfoPromise) {
    installInfoPromise = chrome.storage.local
      .get(["sanojaInstallId", "sanojaInstalledOn"])
      .then(async (stored) => {
        if (stored.sanojaInstallId) {
          return { id: stored.sanojaInstallId, installedOn: stored.sanojaInstalledOn || null };
        }
        const id = crypto.randomUUID();
        await chrome.storage.local.set({ sanojaInstallId: id });
        return { id, installedOn: null };
      })
      .catch((err) => {
        installInfoPromise = null; // try again next time rather than caching the failure
        throw err;
      });
  }
  return installInfoPromise;
}

// Chrome opens this URL when the extension is removed. The Worker posts
// the uninstall to Slack, then redirects to the "why did you leave?" page.
async function refreshUninstallUrl() {
  const { id, installedOn } = await getInstallInfo();
  const params = new URLSearchParams({ i: id, v: chrome.runtime.getManifest().version });
  if (installedOn) params.set("d", installedOn);
  if (IS_DEV_BUILD) params.set("dev", "1");
  await chrome.runtime.setUninstallURL(`${TELEMETRY_ENDPOINT}/bye?${params}`);
}

// Kept pending in storage until the Worker accepts it, so an install made
// while offline is still reported the next time the service worker starts.
async function flushInstallPing() {
  const { sanojaInstallPingPending } = await chrome.storage.local.get("sanojaInstallPingPending");
  if (!sanojaInstallPingPending) return;
  const { id } = await getInstallInfo();
  const res = await fetch(`${TELEMETRY_ENDPOINT}/event`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "install",
      id,
      v: chrome.runtime.getManifest().version,
      cv: chromeMajorVersion(),
      lang: chrome.i18n.getUILanguage(),
      dev: IS_DEV_BUILD,
    }),
  });
  // A 4xx means the Worker will never accept this ping, so retrying forever
  // would just repeat the same request on every startup.
  if (res.ok || (res.status >= 400 && res.status < 500)) {
    await chrome.storage.local.remove("sanojaInstallPingPending");
  }
}

async function handleInstalled(reason) {
  if (reason === "install") {
    const info = await getInstallInfo();
    info.installedOn = todayIso();
    await chrome.storage.local.set({ sanojaInstalledOn: info.installedOn, sanojaInstallPingPending: true });
  }
  await refreshUninstallUrl();
  await flushInstallPing();
}

// Error messages can quote what they failed on (a JSON parse error quotes
// the response, a URL can carry the looked-up word in ?q=), so anything in
// quotes and every URL is dropped before the message leaves the browser.
function scrubErrorMessage(raw) {
  return String(raw || "")
    .replace(/(chrome-extension|https?):\/\/\S+/g, "<url>")
    .replace(/(["'“”‘’«»`]).*?\1/g, "<text>")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 300);
}

// Best-effort and self-limiting: a broken translation endpoint would
// otherwise send a report for every word a user looks up. The budget lives
// in storage.session because the service worker itself is restarted every
// time it goes idle, which would reset an in-memory counter.
async function reportError(where, err) {
  try {
    if (!navigator.onLine) return; // the user's connection, not a Sanoja bug
    const message = scrubErrorMessage(err && err.message ? err.message : err);
    if (!message) return;

    const key = `${where}|${message}`;
    const hour = Math.floor(Date.now() / 3_600_000);
    const { sanojaErrorBudget: saved } = await chrome.storage.session.get("sanojaErrorBudget");
    const budget = saved && saved.hour === hour ? saved : { hour, total: 0, byKey: {} };
    if (budget.total >= ERROR_REPORTS_PER_HOUR) return;
    if ((budget.byKey[key] || 0) >= ERROR_REPORTS_PER_KIND_PER_HOUR) return;
    budget.total += 1;
    budget.byKey[key] = (budget.byKey[key] || 0) + 1;
    await chrome.storage.session.set({ sanojaErrorBudget: budget });

    const { id } = await getInstallInfo();
    await fetch(`${TELEMETRY_ENDPOINT}/error`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        v: chrome.runtime.getManifest().version,
        cv: chromeMajorVersion(),
        where,
        msg: message,
        dev: IS_DEV_BUILD,
      }),
    });
  } catch {
    // Reporting must never throw, or it would report its own failure.
  }
}

// Where an error came from, as accepted from other extension pages.
const REPORTABLE_SOURCES = new Set(["content", "popup", "phone-sync", "history"]);
