# Privacy Policy — Sanoja

_Last updated: October 2026_

Sanoja is a small personal project for learning Finnish vocabulary while
browsing. This page explains exactly what it does and does not do with your
data.

## What Sanoja does

- When you select or double-click a word or short phrase on a webpage,
  that text is sent to Google's public translation service
  (`translate.googleapis.com`) to get a translation. This only happens
  when you actively select text — Sanoja never reads or transmits a
  page's content on its own.
- When the text you select is a single word, it is also looked
  up on English Wiktionary (`en.wiktionary.org`) to find its dictionary
  form (for example "talossa" → "talo"). Only that one word is sent.
- When you press the speaker icon (or turn on automatic pronunciation),
  the Finnish word or phrase is sent to Google Translate's speech service
  (`translate.google.com`) to fetch its pronunciation audio. Only that
  text is sent.
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
- **Anonymous install, uninstall and error reports.** So the one person
  building Sanoja knows when it's installed, removed, or broken, it sends
  a few small reports to that same Cloudflare Worker, which forwards them
  as a message to the developer's private Slack workspace: once when you
  install it, once when you uninstall it (Chrome opens a page on that
  server, which then shows an optional "why did you leave?" question),
  and when something goes wrong, e.g. a translation request fails (at
  most a few times an hour). Each report contains only: a random ID
  created when Sanoja was installed (not linked to you, your Google
  account or any other identifier), the Sanoja version, your Chrome
  version number, Chrome's display language (e.g. "fi" or "en-GB"), the
  date you installed it (to know how long it was kept), and, for errors,
  a short technical error message with any quoted text and web addresses
  removed. **It never includes the words you look up, your word list,
  the pages you visit, or your IP address** (Cloudflare sees the IP
  address of any connection, as with every website, but Sanoja doesn't
  record or forward it). If you answer the uninstall question, your
  answer and any comment you type are sent too, together with that same
  random ID.

## What Sanoja does not do

- No analytics or tracking of what you read or look up, and no tracking
  across websites. The only reports are the anonymous install, uninstall
  and error reports described above.
- No accounts or sign-in, and no identifiers beyond the random install
  ID described above.
- No advertising.
- No data is sold or shared with anyone.
- No data collection beyond the word/phrase you explicitly select for
  translation, the anonymous reports described above, and — only if you
  choose to use it — the word list sent by "Practice on phone".

## Third-party services

Google's translation and speech endpoints are used solely to translate
the text you select and to fetch its pronunciation, subject to [Google's own privacy
policy](https://policies.google.com/privacy). Sanoja has no relationship
with Google beyond calling this public endpoint. Wiktionary's public
API is used solely to look up the dictionary form of a single word you
select, subject to the [Wikimedia privacy
policy](https://foundation.wikimedia.org/wiki/Policy:Privacy_policy).
The only other network
service involved is the Cloudflare Worker described above, which Sanoja
itself operates, used for the optional phone-sync feature, the uninstall
question, and the anonymous install/uninstall/error reports. Those reports
are delivered to the developer through Slack (subject to [Slack's privacy
policy](https://slack.com/trust/privacy/privacy-policy)) and are used only
to find and fix problems and to understand whether Sanoja is useful.

## Permissions

- **storage** — to save your word list and settings locally, as described
  above.
- **Access to `translate.googleapis.com`** — to perform translations.
- **Access to `sanoja-uninstall-feedback.shahzainhtc.workers.dev`** — used
  when you tap "Practice on phone", to sync your word list to the phone
  flashcard page; for the optional feedback question when you uninstall;
  and for the anonymous install, uninstall and error reports described
  above.
- **offscreen** — to play pronunciation audio in a hidden extension page.
  It shows no warning and gives Sanoja no access to your data.
- **Content script on all pages** — to detect when you select or
  double-click a word so a translation popup can appear. It only acts on
  text you've explicitly selected.

## Contact

This is an independent personal project, not affiliated with Google or Yle.
For questions, open an issue on the GitHub repository this policy is
published alongside.
