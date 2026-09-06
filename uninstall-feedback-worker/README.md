Live at: `https://sanoja-uninstall-feedback.shahzainhtc.workers.dev`

Redeploy after editing `worker.js`:
```bash
cd uninstall-feedback-worker
npx wrangler deploy
```

Read submissions anytime:
```
https://sanoja-uninstall-feedback.shahzainhtc.workers.dev/?token=<ADMIN_TOKEN>
```
Returns JSON, newest first.

## Push notifications (optional, via Telegram)

Without this, feedback only shows up when you visit the URL above.

Tried ntfy.sh first — no signup needed, but its free public instance shares
a daily message quota across every anonymous user on the same IP, and
Cloudflare Workers all share a rotating pool of egress IPs across every
customer's Workers. So the quota gets exhausted by completely unrelated
traffic, not anything you did — unreliable from inside a Worker specifically.

Telegram doesn't have that problem (a bot token isn't shared with anyone
else's traffic) and setup is still just a chat, no website signup:

1. In Telegram, message **@BotFather**, send `/newbot`, give it any name
   and a username ending in `bot`.
2. It replies with a token like `123456789:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`.
3. Send your new bot any message (e.g. "hi") — required so it's allowed to
   message you back.
4. Find your chat ID:
   ```bash
   curl -s "https://api.telegram.org/bot<TOKEN>/getUpdates"
   ```
   Look for `"chat":{"id":...}` in the response.
5. Set both as secrets:
   ```bash
   npx wrangler secret put TELEGRAM_BOT_TOKEN
   npx wrangler secret put TELEGRAM_CHAT_ID
   ```

No key set means no push attempt — submissions still save to KV either way.
