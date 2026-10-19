Live at: `https://sanoja-uninstall-feedback.shahzainhtc.workers.dev`

One Worker does four jobs:

| Route | Who calls it | What happens |
|---|---|---|
| `POST /` | uninstall survey page (`docs/uninstall.html`) | saves the answer to KV, pings Telegram (optional) and Slack `#sanoja-hq` |
| `PUT/GET /sync/<id>` | "Practice on phone" | word-list sync, unchanged |
| `POST /event` | extension, once per install | Slack `#sanoja-hq`: install |
| `GET /bye` | Chrome, when Sanoja is uninstalled (`setUninstallURL`) | Slack `#sanoja-hq`: uninstall, then 302 to the survey page |
| `POST /error` | extension, when something breaks | counted, Slack `#sanoja-hq` on new errors and spikes |
| `GET /?token=` | you | all survey answers as JSON, newest first |

The extension already has host permission for this Worker (phone sync), so
the new reports need no new permission and existing users won't get a
re-approval prompt on update.

## What lands in Slack

```
#sanoja-hq
🟢 New install · v2.5.0 · Chrome 141 · UI fi · `e95d63e7`
🔴 Uninstall · v2.5.0 · kept 3 days · `e95d63e7`
📝 Uninstall survey · Translations weren't accurate · `e95d63e7`
   > wrong words for compound nouns

⚠️ New error in `translate` · v2.5.0 · Chrome 141
   > Translate request failed: 429
🔥 Error spike in `translate` · 50 reports from 12 users this hour · v2.5.0 · Chrome 141
   > Translate request failed: 429
```

The 8-character code matches an install to its uninstall and survey
answer. Unpacked or dev builds show up prefixed `[dev]`.

Noise limits (all in `worker.js`, top of the Slack section):
- An install ID posts once, even if the ping is retried. Uninstalls are deduped the same way.
- An error alerts the first time it's seen (and again after a quiet 24 h), then only when its count within one clock hour reaches 10, 50, 200 or 1000.
- At most 60 install/uninstall/survey messages and 20 error alerts an hour. Past that, messages are dropped.
- The extension itself sends at most 3 reports of the same error, and 10 in total, per user per hour, and none while offline.

The counters live in `AlertGate`, a Durable Object. It's included in the
Workers Free plan, and unlike KV it counts reliably.

## Setup (one-time; you do the sign-ins)

### 1. Slack channels and webhooks

Everything posts to one private channel, `#sanoja-hq` in "Shahzain's Workspace", through the Slack app "Claude Sanoja" (formerly "Sanoja"). It's already set up. The steps below are only for redoing it.

1. Create the private channel `#sanoja-hq` (it was `#sanoja-live`, renamed).
2. Go to https://api.slack.com/apps and either open the existing **Job Loop** app or **Create New App → From scratch** (e.g. "Sanoja"). A separate app keeps the Sanoja webhooks easy to revoke on their own.
3. **Incoming Webhooks** → turn on → **Add New Webhook to Workspace** → pick `#sanoja-hq` → Allow. Copy the URL.
4. Use that one URL for both secrets below. (The code keeps two secrets so errors could move to their own channel later.)

### 2. Deploy

From this folder, logged in to Cloudflare (`npx wrangler login` opens a browser window to sign in):

```bash
cd ~/Desktop/sanoja-finnish-word-reader/uninstall-feedback-worker
npx wrangler secret put SLACK_WEBHOOK_LIVE      # paste the #sanoja-hq URL
npx wrangler secret put SLACK_WEBHOOK_ALERTS    # paste the same #sanoja-hq URL
npx wrangler deploy
```

The first deploy creates the `AlertGate` Durable Object (the `[[migrations]]`
block in `wrangler.toml`). Deploying the Worker is safe before the extension
update ships: the current extension never calls the new routes, and survey
answers simply start appearing in Slack too.

Missing secret = that kind of Slack message is skipped. Nothing else breaks.

### 3. Ship the extension update

Only after the Worker is deployed (otherwise install pings from the new
version get a 400 and are dropped):

1. Bump `version` in `manifest.json` (e.g. 2.5.0) and build the CWS zip as usual, **adding the new file `telemetry.js`**. The service worker loads it with `importScripts`, so a zip without it breaks translation entirely. Check with `unzip -l sanoja-cws-submission.zip | grep telemetry`.
2. Update the **Privacy practices** tab (see below) **in the same submission**.
3. Push `docs/` (privacy policy + uninstall page) **before or at the same time as** the Web Store submission. The reviewer reads the live privacy policy.

## Chrome Web Store: Privacy practices tab

What changes compared with today:

- **Data usage → "What user data do you plan to collect?"** Tick nothing new. Install ID, version numbers, UI language and scrubbed error messages are anonymous technical data. As I read Google's categories (PII, health, financial, authentication, personal communications, location, web history, user activity, website content), none of these fields fit any of them. Nothing identifies a person, and nothing describes what they browse or do on a page. This is my reading, not a statement from Google, so look at the category definitions on the form yourself.
  - *Judgment call:* if you want zero reviewer risk, tick **"Website content"**. The existing uninstall survey has always sent free text the user types, and the phone-sync word list is arguably "website content". That was true before this change too.
- Keep all three certifications ticked (no selling, no unrelated use, no creditworthiness). All three still hold.
- **Host permission justification** for `sanoja-uninstall-feedback.shahzainhtc.workers.dev`: paste the updated text from `store-assets/STORE_LISTING.md`.
- **Privacy policy URL**: unchanged (`https://sanoja-app.github.io/privacy.html`), but the page must be updated first (done in `docs/privacy.html` and `PRIVACY.md` on this branch).
- **Store description**: the "no tracking / never sent anywhere automatically" paragraph has been reworded in `STORE_LISTING.md`. Paste it in. The old wording would now be inaccurate, and reviewers do compare it against the code.

What the privacy policy now says (already written): what's sent and when
(install, uninstall, errors), the exact fields, what's never sent (words,
word list, pages, IP), that it goes via Cloudflare to Slack, and the
purpose. "No telemetry" and "no user identifiers" were removed, because
both would now be false.

## Test plan

Automated, already run on this branch:
- Worker under `wrangler dev`, with a fake local Slack receiver:
  - store-origin install → posted, repeat install → deduped
  - unpacked build → `[dev]`, no extension origin → 403, bad payload → 400
  - uninstall with date → "kept 3 days", repeat → deduped, no params → still redirects
  - survey with `<!channel>` and a link → escaped
  - 12 identical errors from 3 users → one "new" alert plus one spike at 10, scrubbed URL in the message
  - sync PUT/GET unchanged
- Extension loaded unpacked in Chromium, pointed at the local Worker: install → `[dev]` install posted, install ID and date stored; an error quoting a word and a URL arrives as `Unexpected token <text> <url>`; 5 identical errors → 3 sent; popup error reported; `uninstallSelf()` → uninstall posted, survey page opened with `?i=`.
- `tests/smoke.mjs`: 31 passed, 0 failed (no regression in translate, speak or save).

Manual, after you deploy (about 5 minutes):
1. `chrome://extensions` → Developer mode → **Load unpacked** this repo folder. `#sanoja-hq` should show `[dev] 🟢 New install` within seconds.
2. Open the service worker console ("Inspect views: service worker") and run `reportError("test", new Error("hello from devtools"))`. `#sanoja-hq` should show `[dev] ⚠️ New error in test`.
3. Click **Remove** on the extension. `#sanoja-hq` should show `[dev] 🔴 Uninstall · kept less than a day`, and the survey page should open. Answer it, and `📝 Uninstall survey` should appear with the same code.
4. Optional: `curl -X POST https://sanoja-uninstall-feedback.shahzainhtc.workers.dev/event -d '{}'` → 403 (proves outsiders can't post installs without an extension origin).

If nothing arrives: `npx wrangler tail` shows live Worker logs. Check the secret names match exactly.

## Push notifications via Telegram (older, optional)

Survey answers can also go to Telegram, which was set up before Slack.
Set `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` as secrets. To get them:
message **@BotFather** with `/newbot`, send your bot any message, then read
your chat ID from `https://api.telegram.org/bot<TOKEN>/getUpdates`.
ntfy.sh was tried first, but its public quota is shared across all Worker
egress IPs, so it fails for reasons unrelated to Sanoja.
