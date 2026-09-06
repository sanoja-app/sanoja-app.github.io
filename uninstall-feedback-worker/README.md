Deploy this once from your machine (I can't deploy Workers from here — only list/read them):

```bash
cd uninstall-feedback-worker
npx wrangler login
npx wrangler deploy
```

`wrangler login` opens a browser to authorize; `deploy` will print the live URL, something like:

```
https://sanoja-uninstall-feedback.<your-subdomain>.workers.dev
```

Then:

1. Set the admin token so you can read submissions later:
   ```bash
   npx wrangler secret put ADMIN_TOKEN
   ```
   (enter any password-like string when prompted)

2. Open `docs/uninstall.html`, find the line:
   ```js
   var ENDPOINT = 'https://sanoja-uninstall-feedback.WORKERS_SUBDOMAIN.workers.dev';
   ```
   and replace `WORKERS_SUBDOMAIN` with your actual subdomain from the deploy output. Commit and push.

To read submissions later:
```
https://sanoja-uninstall-feedback.<your-subdomain>.workers.dev/?token=<the ADMIN_TOKEN you set>
```
Returns JSON, newest first.
