# Sanoja tests

Two browser smoke tests. Neither is part of the extension package.

```bash
cd tests
npm install
npx playwright install chromium   # or set CHROMIUM_PATH to an existing Chrome for Testing binary
npm run smoke   # the extension, loaded unpacked into Chromium
npm run phone   # the phone flashcards page (docs/flashcards.html), iPhone-sized
node seo-check.mjs   # the generated docs/words/ pages: links, titles, JSON-LD, sitemap (no browser needed)
```

Each prints a table, writes a JSON report (`report.json`, `phone-report.json`, git-ignored) and exits 1 if anything FAILs.

- **PASS / FAIL**: the product did / didn't do what it should.
- **SKIP**: the check couldn't run (page didn't load, no word to select). A SKIP is not a pass; read the note.

`smoke` hits real sites (fi.wikipedia.org, yle.fi, kela.fi, ...) and Google Translate, so a live-site failure can be the site changing rather than a regression. The local fixtures in `fixtures/` are the deterministic part. `phone` mocks the sync server.

Known gaps: the live tori.fi check always skips (a cookie modal covers the page, and the test won't accept cookies), so the shadow-DOM regression is covered by `fixtures/shadow-fi.html` instead. Real-phone behaviour (camera QR scan, Add to Home Screen, Safari storage eviction) is not covered.

## The Finnish word pages

`docs/words/` is generated, not hand-edited. Content lives in `tools/seo/words.mjs`; run `node tools/seo/build.mjs` to rebuild the pages, `sitemap.xml` and the word section of `llms.txt`, then `node tests/seo-check.mjs`. Every Web Store link on those pages carries `utm_campaign=<page slug>`, so installs show up per page in the dashboard's Impressions > Campaigns panel.
