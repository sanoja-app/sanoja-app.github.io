import { DurableObject } from "cloudflare:workers";

const ALLOWED_ORIGIN = "https://sanoja-app.github.io";
const UNINSTALL_PAGE = "https://sanoja-app.github.io/uninstall.html";
const MAX_MESSAGE_LEN = 2000;
const ALLOWED_REASONS = new Set([
  "Didn't work as expected / bugs",
  "Didn't understand how to use it",
  "Missing a feature I needed",
  "Translations weren't accurate",
  "Found a better alternative",
  "No longer learning Finnish",
  "Just trying it out",
  "Other",
]);

const MAX_SYNC_BYTES = 300_000;
const SYNC_TTL_SECONDS = 60 * 60 * 24 * 90; // 90 days
const SYNC_ID_RE = /^[a-zA-Z0-9_-]{8,64}$/;

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin || ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "POST, GET, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

// A Telegram bot token is scoped to just this bot (not shared across every
// other Cloudflare Worker the way ntfy.sh's anonymous public instance is —
// that's what made ntfy unreliable here), so this doesn't hit any quota
// caused by unrelated traffic.
//
// Best-effort — a failed push must never fail the submission itself. The
// KV write above is the durable record; this is just a convenience ping,
// so any error here is swallowed by the caller via ctx.waitUntil.
async function sendNotificationPush(env, reason, message) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return;
  await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: env.TELEGRAM_CHAT_ID,
      text: `Sanoja uninstall: ${reason}${message ? `\n\n${message}` : ""}`,
    }),
  });
}

// ---------------------------------------------------------------------------
// Slack alerts
//
// Two incoming webhooks, one per channel (Slack ties each webhook to a
// single channel): SLACK_WEBHOOK_LIVE -> #sanoja-live for installs,
// uninstalls and survey answers; SLACK_WEBHOOK_ALERTS -> #sanoja-alerts for
// errors. Either secret missing just means that kind of message is skipped.
//
// Everything goes through AlertGate (a single Durable Object) first. It is
// the one place with consistent counters, which KV can't give (KV is
// eventually consistent, and the free plan only allows 1,000 writes a day).
// ---------------------------------------------------------------------------

const VERSION_RE = /^\d+(\.\d+){0,3}$/;
const CHROME_MAJOR_RE = /^\d{2,4}$/;
const LANG_RE = /^[a-zA-Z]{2,3}(-[a-zA-Z0-9]{2,4})?$/;
const WHERE_RE = /^[a-z0-9:_-]{1,40}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_ERROR_MSG_LEN = 300;

// Caps on Slack messages per hour, so a bug or someone spamming the
// endpoints can't flood the channels. Past the cap, messages are dropped.
const LIVE_MESSAGES_PER_HOUR = 60;
const ALERT_MESSAGES_PER_HOUR = 20;
// An error alerts the first time it's seen (and again if it comes back
// after a quiet day), then again only when its count within one clock hour
// reaches one of these levels.
const ERROR_SPIKE_LEVELS = [10, 50, 200, 1000];
const ERROR_REALERT_MS = 24 * 60 * 60 * 1000;

function hourBucket(now = Date.now()) {
  return Math.floor(now / 3_600_000);
}

export class AlertGate extends DurableObject {
  // True the first time a key is seen, false on every repeat — so a retried
  // install ping, or Chrome opening the uninstall URL twice, posts once.
  async firstTime(key) {
    const storageKey = `seen:${key}`;
    if (await this.ctx.storage.get(storageKey)) return false;
    await this.ctx.storage.put(storageKey, Date.now());
    return true;
  }

  // Takes one message from an hourly budget; false once it's spent.
  async take(name, limit) {
    const bucket = hourBucket();
    const key = `cap:${name}`;
    let cap = await this.ctx.storage.get(key);
    if (!cap || cap.bucket !== bucket) cap = { bucket, n: 0 };
    if (cap.n >= limit) return false;
    cap.n += 1;
    await this.ctx.storage.put(key, cap);
    return true;
  }

  // Counts one report of an error and decides whether it's worth a Slack
  // message. Returns { alert: "new" | "spike" | null, count, users }.
  async noteError(fingerprint, installId) {
    const now = Date.now();
    const bucket = hourBucket(now);
    const key = `err:${fingerprint}`;
    let rec = await this.ctx.storage.get(key);
    if (!rec) rec = { bucket, n: 0, users: [], lastAlert: 0 };
    if (rec.bucket !== bucket) {
      rec.bucket = bucket;
      rec.n = 0;
      rec.users = [];
    }
    rec.n += 1;
    const user = (installId || "").slice(0, 8);
    if (user && !rec.users.includes(user) && rec.users.length < 100) rec.users.push(user);

    let alert = null;
    if (now - rec.lastAlert > ERROR_REALERT_MS) alert = "new";
    else if (ERROR_SPIKE_LEVELS.includes(rec.n)) alert = "spike";
    if (alert && !(await this.take("alerts", ALERT_MESSAGES_PER_HOUR))) alert = null;
    if (alert) rec.lastAlert = now;

    await this.ctx.storage.put(key, rec);
    return { alert, count: rec.n, users: rec.users.length };
  }
}

function gate(env) {
  return env.ALERT_GATE.get(env.ALERT_GATE.idFromName("global"));
}

// Slack treats <, > and & as markup (links, @channel mentions), so anything
// a user or client sent has to be escaped before it goes in a message.
function slackEscape(text) {
  return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function shortId(id) {
  return id ? `\`${id.slice(0, 8)}\`` : "`no id`";
}

async function postSlack(webhookUrl, text) {
  if (!webhookUrl) return;
  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, unfurl_links: false, unfurl_media: false }),
  });
  if (!res.ok) throw new Error(`Slack webhook failed: ${res.status}`);
}

// Installs, uninstalls and survey answers, behind the hourly cap.
async function postLive(env, text) {
  if (!env.SLACK_WEBHOOK_LIVE) return;
  if (!(await gate(env).take("live", LIVE_MESSAGES_PER_HOUR))) return;
  await postSlack(env.SLACK_WEBHOOK_LIVE, text);
}

// Requests from the published extension carry its ID in the Origin header.
// Anything from another extension (an unpacked test build has its own ID)
// is labelled [dev] rather than rejected, so testing still reaches Slack
// without looking like a real user. Requests with no extension origin at
// all are rejected.
function extensionOriginLabel(request, env, bodyDev) {
  const origin = request.headers.get("Origin") || "";
  if (!origin.startsWith("chrome-extension://")) return null;
  const fromStoreBuild = !env.EXTENSION_ID || origin === `chrome-extension://${env.EXTENSION_ID}`;
  return fromStoreBuild && !bodyDev ? "" : "[dev] ";
}

function str(value, re) {
  return typeof value === "string" && re.test(value) ? value : "";
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function noContent(request) {
  return new Response(null, { status: 204, headers: corsHeaders(syncOrigin(request)) });
}

function badRequest(request, text) {
  return new Response(text, { status: 400, headers: corsHeaders(syncOrigin(request)) });
}

// POST /event — the extension's one-time install ping.
async function handleEvent(request, env, ctx) {
  const body = await readJson(request);
  if (!body || body.type !== "install") return badRequest(request, "Invalid event");

  const label = extensionOriginLabel(request, env, body.dev === true);
  if (label === null) return new Response("Forbidden", { status: 403 });

  const id = str(body.id, SYNC_ID_RE);
  const version = str(body.v, VERSION_RE);
  if (!id || !version) return badRequest(request, "Invalid event");
  const chrome = str(body.cv, CHROME_MAJOR_RE);
  const lang = str(body.lang, LANG_RE);

  ctx.waitUntil(
    (async () => {
      if (!(await gate(env).firstTime(`install:${id}`))) return;
      const parts = [`v${version}`];
      if (chrome) parts.push(`Chrome ${chrome}`);
      if (lang) parts.push(`UI ${lang}`);
      await postLive(env, `${label}:large_green_circle: *New install* · ${parts.join(" · ")} · ${shortId(id)}`);
    })().catch(() => {})
  );
  return noContent(request);
}

function daysSince(isoDate) {
  if (!DATE_RE.test(isoDate)) return null;
  const days = Math.floor((Date.now() - Date.parse(`${isoDate}T00:00:00Z`)) / 86_400_000);
  return Number.isFinite(days) && days >= 0 ? days : null;
}

// GET /bye — the URL Chrome opens when Sanoja is uninstalled (set with
// chrome.runtime.setUninstallURL). Always redirects to the survey page,
// even if the parameters are missing or Slack is down: the person leaving
// must never see an error.
async function handleBye(request, env, ctx) {
  const url = new URL(request.url);
  const id = str(url.searchParams.get("i") || "", SYNC_ID_RE);
  const version = str(url.searchParams.get("v") || "", VERSION_RE);
  const days = daysSince(url.searchParams.get("d") || "");
  const label = url.searchParams.get("dev") === "1" ? "[dev] " : "";

  ctx.waitUntil(
    (async () => {
      if (id && !(await gate(env).firstTime(`uninstall:${id}`))) return;
      const parts = [];
      if (version) parts.push(`v${version}`);
      if (days !== null) parts.push(days === 0 ? "kept less than a day" : `kept ${days} day${days === 1 ? "" : "s"}`);
      else if (id) parts.push("install date unknown (installed before v2.5)");
      await postLive(
        env,
        `${label}:red_circle: *Uninstall*${parts.length ? ` · ${parts.join(" · ")}` : ""} · ${shortId(id)}`
      );
    })().catch(() => {})
  );

  const target = new URL(UNINSTALL_PAGE);
  if (id) target.searchParams.set("i", id);
  return Response.redirect(target.toString(), 302);
}

// Same idea as the extension's own scrubbing (telemetry.js), repeated here
// because anyone can POST to this endpoint.
function scrubErrorMessage(raw) {
  return String(raw || "")
    .replace(/(chrome-extension|https?):\/\/\S+/g, "<url>")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_ERROR_MSG_LEN);
}

async function fingerprintOf(where, message) {
  // Numbers vary between otherwise identical errors (status codes aside,
  // which are short and worth keeping apart), so long digit runs are
  // collapsed before hashing.
  const normalized = `${where}|${message.replace(/\d{4,}/g, "#")}`;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(normalized));
  return [...new Uint8Array(digest)].slice(0, 8).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// POST /error — a scrubbed error report from the extension.
async function handleError(request, env, ctx) {
  const body = await readJson(request);
  if (!body) return badRequest(request, "Invalid JSON");

  const label = extensionOriginLabel(request, env, body.dev === true);
  if (label === null) return new Response("Forbidden", { status: 403 });

  const where = str(body.where, WHERE_RE);
  const message = scrubErrorMessage(body.msg);
  if (!where || !message) return badRequest(request, "Invalid report");
  const id = str(body.id, SYNC_ID_RE);
  const version = str(body.v, VERSION_RE);
  const chrome = str(body.cv, CHROME_MAJOR_RE);

  ctx.waitUntil(
    (async () => {
      // Dev builds are counted separately so testing never trips or masks a
      // real spike.
      const fingerprint = (label ? "dev:" : "") + (await fingerprintOf(where, message));
      const { alert, count, users } = await gate(env).noteError(fingerprint, id);
      if (!alert || !env.SLACK_WEBHOOK_ALERTS) return;

      const context = [version && `v${version}`, chrome && `Chrome ${chrome}`].filter(Boolean).join(" · ");
      const headline =
        alert === "new"
          ? `:warning: *New error* in \`${where}\``
          : `:fire: *Error spike* in \`${where}\` · ${count} reports from ${users} user${users === 1 ? "" : "s"} this hour`;
      await postSlack(
        env.SLACK_WEBHOOK_ALERTS,
        `${label}${headline}${context ? ` · ${context}` : ""}\n> ${slackEscape(message)}`
      );
    })().catch(() => {})
  );
  return noContent(request);
}

async function handleSubmit(request, env, ctx) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400, headers: corsHeaders() });
  }

  const reason = typeof body.reason === "string" ? body.reason.slice(0, 100) : "";
  const message = typeof body.message === "string" ? body.message.slice(0, MAX_MESSAGE_LEN) : "";
  const installId = typeof body.i === "string" && SYNC_ID_RE.test(body.i) ? body.i : "";

  if (!ALLOWED_REASONS.has(reason)) {
    return new Response("Invalid reason", { status: 400, headers: corsHeaders() });
  }

  const id = `${Date.now()}-${crypto.randomUUID()}`;
  await env.FEEDBACK.put(
    id,
    JSON.stringify({ reason, message, date: new Date().toISOString() })
  );

  ctx.waitUntil(
    sendNotificationPush(env, reason, message).catch(() => {
      // Nothing to do — the submission is already saved in KV regardless.
    })
  );
  ctx.waitUntil(
    postLive(
      env,
      `:memo: *Uninstall survey* · ${slackEscape(reason)} · ${shortId(installId)}` +
        (message ? `\n> ${slackEscape(message).replace(/\n/g, "\n> ")}` : "")
    ).catch(() => {})
  );

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders() },
  });
}

// Sync lets the extension popup push a snapshot of the user's word list to a
// persistent, unguessable ID, and the phone flashcard page pull it back down.
// No accounts: the random ID itself is the only credential, same trust model
// as the feedback endpoint's write access.
function syncOrigin(request) {
  const origin = request.headers.get("Origin");
  // Extension popups fetch with an Origin of chrome-extension://<id>, which
  // isn't CORS-checked by Chrome once host_permissions grants the host, but
  // we still echo it back so the response isn't rejected in any context that
  // does enforce CORS.
  if (origin && (origin === ALLOWED_ORIGIN || origin.startsWith("chrome-extension://"))) {
    return origin;
  }
  return ALLOWED_ORIGIN;
}

async function handleSyncPut(request, env, id) {
  const origin = syncOrigin(request);
  if (!SYNC_ID_RE.test(id)) {
    return new Response("Invalid id", { status: 400, headers: corsHeaders(origin) });
  }

  const raw = await request.text();
  if (raw.length > MAX_SYNC_BYTES) {
    return new Response("Payload too large", { status: 413, headers: corsHeaders(origin) });
  }

  let words;
  try {
    words = JSON.parse(raw).words;
  } catch {
    return new Response("Invalid JSON", { status: 400, headers: corsHeaders(origin) });
  }
  if (!Array.isArray(words)) {
    return new Response("Invalid payload", { status: 400, headers: corsHeaders(origin) });
  }

  await env.FEEDBACK.put(
    `sync:${id}`,
    JSON.stringify({ words, updatedAt: new Date().toISOString() }),
    { expirationTtl: SYNC_TTL_SECONDS }
  );

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
  });
}

async function handleSyncGet(request, env, id) {
  const origin = syncOrigin(request);
  if (!SYNC_ID_RE.test(id)) {
    return new Response("Invalid id", { status: 400, headers: corsHeaders(origin) });
  }

  const stored = await env.FEEDBACK.get(`sync:${id}`);
  if (!stored) {
    return new Response("Not found", { status: 404, headers: corsHeaders(origin) });
  }

  return new Response(stored, {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
  });
}

async function handleList(request, env) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!env.ADMIN_TOKEN || token !== env.ADMIN_TOKEN) {
    return new Response("Unauthorized", { status: 401 });
  }

  const list = await env.FEEDBACK.list();
  const entries = await Promise.all(
    list.keys.map(async (k) => JSON.parse(await env.FEEDBACK.get(k.name)))
  );
  entries.sort((a, b) => (a.date < b.date ? 1 : -1));

  return new Response(JSON.stringify(entries, null, 2), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const syncMatch = url.pathname.match(/^\/sync\/([^/]+)$/);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(syncOrigin(request)) });
    }
    if (url.pathname === "/event" && request.method === "POST") {
      return handleEvent(request, env, ctx);
    }
    if (url.pathname === "/error" && request.method === "POST") {
      return handleError(request, env, ctx);
    }
    if (url.pathname === "/bye" && request.method === "GET") {
      return handleBye(request, env, ctx);
    }
    if (syncMatch && request.method === "PUT") {
      return handleSyncPut(request, env, syncMatch[1]);
    }
    if (syncMatch && request.method === "GET") {
      return handleSyncGet(request, env, syncMatch[1]);
    }
    if (request.method === "POST") {
      return handleSubmit(request, env, ctx);
    }
    if (request.method === "GET") {
      return handleList(request, env);
    }
    return new Response("Method not allowed", { status: 405, headers: corsHeaders() });
  },
};
