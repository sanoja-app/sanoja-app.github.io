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

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
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
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
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
