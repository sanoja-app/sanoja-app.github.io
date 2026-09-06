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

## Email notifications (optional)

Without this, feedback only shows up when you visit the URL above. To get an
email the moment someone submits:

1. Sign up free at [resend.com](https://resend.com) and grab an API key
   from the dashboard (no domain verification needed — this sends from
   Resend's own shared address, only to your own inbox).
2. Set it as a secret:
   ```bash
   npx wrangler secret put RESEND_API_KEY
   ```
3. That's it — `worker.js` already checks for `env.RESEND_API_KEY` and
   sends to `shahzainhtc@gmail.com` on every submission if it's set. No
   key set means no email attempt, submissions still save to KV either way.
