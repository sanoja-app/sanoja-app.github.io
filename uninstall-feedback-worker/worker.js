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

async function handleSubmit(request, env) {
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
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }
    if (request.method === "POST") {
      return handleSubmit(request, env);
    }
    if (request.method === "GET") {
      return handleList(request, env);
    }
    return new Response("Method not allowed", { status: 405, headers: corsHeaders() });
  },
};
