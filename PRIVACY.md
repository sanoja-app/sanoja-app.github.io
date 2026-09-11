# Privacy Policy — Sanoja

_Last updated: September 2026_

Sanoja is a small personal project for learning Finnish vocabulary while
browsing. This page explains exactly what it does and does not do with your
data.

## What Sanoja does

- When you select or double-click a word or short phrase on a webpage,
  that text is sent to Google's public translation service
  (`translate.googleapis.com`) to get a translation. This only happens
  when you actively select text — Sanoja never reads or transmits a
  page's content on its own.
- Words you look up, along with your review schedule, quiz history, and
  streak, are saved using Chrome's local extension storage
  (`chrome.storage.local`) on your own computer. This data is never
  uploaded anywhere unless you explicitly use "Practice on phone" (see
  below).
- Your two toggle settings (enabled / speak automatically) are saved using
  `chrome.storage.sync`, which is Chrome's own built-in settings sync (the
  same mechanism used by e.g. your bookmarks, if you have Chrome sync
  turned on). This is handled entirely by Google's Chrome sync
  infrastructure, not by Sanoja.
- **If you tap "Practice on phone"** in the extension popup, Sanoja sends
  your Finnish word, its English translation, and whether you've marked it
  known to a small server Sanoja runs (a Cloudflare Worker), so the QR
  code it shows can load them into the flashcard page at
  `sanoja-app.github.io/flashcards.html` on your phone. This only happens
  when you tap that button — it's never automatic. The data is stored
  under a random, unguessable link tied to your browser install, not to
  any account or identity, and is automatically deleted 90 days after your
  last sync. No other extension data (browsing history, quiz history,
  streak) is included in this sync.

## What Sanoja does not do

- No analytics, tracking, or telemetry of any kind.
- No accounts, sign-in, or user identifiers.
- No advertising.
- No data is sold or shared with anyone.
- No data collection beyond the word/phrase you explicitly select for
  translation, and — only if you choose to use it — the word list sent by
  "Practice on phone".

## Third-party services

Google's translation endpoint is used solely to translate the text you
select, subject to [Google's own privacy
policy](https://policies.google.com/privacy). Sanoja has no relationship
with Google beyond calling this public endpoint. The only other network
service involved is the Cloudflare Worker described above, which Sanoja
itself operates, used solely for the optional phone-sync feature.

## Permissions

- **storage** — to save your word list and settings locally, as described
  above.
- **Access to `translate.googleapis.com`** — to perform translations.
- **Access to `sanoja-uninstall-feedback.shahzainhtc.workers.dev`** — used
  only when you tap "Practice on phone", to sync your word list to the
  phone flashcard page, and (separately) to submit optional feedback if
  you choose to uninstall the extension.
- **Content script on all pages** — to detect when you select or
  double-click a word so a translation popup can appear. It only acts on
  text you've explicitly selected.

## Contact

This is an independent personal project, not affiliated with Google or Yle.
For questions, open an issue on the GitHub repository this policy is
published alongside.
