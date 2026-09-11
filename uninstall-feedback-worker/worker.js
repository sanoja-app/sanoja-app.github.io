const ALLOWED_ORIGIN = "https://sanoja-app.github.io";
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

async function handleSubmit(request, env, ctx) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400, headers: corsHeaders() });
  }

  const reason = typeof body.reason === "string" ? body.reason.slice(0, 100) : "";
  const message = typeof body.message === "string" ? body.message.slice(0, MAX_MESSAGE_LEN) : "";

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
