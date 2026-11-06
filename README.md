# The Daily Blossom · Babeeni SS27

Post-launch landing page for The Daily Blossom collection. This repository is independent of the countdown site.

## Publish with GitHub Pages

In **Settings → Pages**, choose **Deploy from a branch**, branch **main**, folder **/ (root)**, then Save.
Expected project URL: https://maxbabeeni.github.io/the-daily-blossom-launch/

## Campaign

Launch: 5 November 2026, 00:00 GMT+7 (4 November 2026, 17:00 UTC).
`launchMode: live` keeps this site permanently in the launched collection phase, even before the campaign launch timestamp. Intro, story, six preview looks, unlock cards and enquiry form are enabled.
This production build has preview controls disabled. URL query parameters cannot enable preview mode.

## Required before collecting real registrations

`config.js` currently has `formMode: 'unconfigured'` and no endpoint.
GitHub Pages hosts static files; it does not process or store form submissions.
Supply an HTTPS backend in `formEndpoint` and set `formMode: 'endpoint'`.
The backend must validate and store the lead, then return `{ "ok": true, "receiptId": "stored-submission-id" }`.
Do not put private keys, service account credentials or private Sheet data in this repository.
Until configured, the form offers email and WhatsApp contact options and does not claim registration success.

## Catalogue and product preview

Six preview looks plus three catalogue-unlock cards. Colour and Pattern filters remain available.
The current 64-page catalogue is hosted on Google Drive; Heyzine is used for the online reader. The historical file in `downloads/` is retained but is not the current download target.
Accepted registrants see the Heyzine viewer and receive one automatic download request; a visible PDF download link is the fallback when browser settings prevent automatic saving.
The locally remembered registration flag is a marketing gate, not access control for the public PDF.

## Editing

- Page layout and static copy: `index.html`, `styles.css`
- Campaign, contact links and form connection: `config.js`
- Shared campaign text and confirmed detail labels: `content.js`
- Product data: `products.js`
- Lily motion: `flower.js`, `lily-reference-flow.js`, approved images in `assets/`

Self-hosted Google Fonts licences are included in `assets/`. Classic Vogue is not bundled; the serif fallback is used.


Lead form: required Name, Phone (international country code), Email and Country. Optional Company Legal Name (`company`), Business Type/Role (`businessRole`), Number of Retail Locations (`retailLocations`: Online only / 1 store / 2–5 stores / 6+ stores), and Message/Specific Requirements (`message`). Email updates consent remains optional and unchecked. Map these fields when connecting the lead endpoint.


## 6 November launching refresh

Updated approved section imagery, collection copy, six-look filter scope, optional colourways, detail magnifier and responsive layouts. Current online reader: https://heyzine.com/flip-book/490dbb64d6.html . PDF: https://drive.google.com/file/d/1FUKRrjYrIxtHLfVwsMkqhHQe9voY7Iah/view .

The working Google Sheets connector belongs to the LadiPage-hosted site. It cannot be enabled by copying LadiPage JavaScript into GitHub Pages. This static repository intentionally keeps `formMode: unconfigured` until a dedicated acknowledged HTTPS lead endpoint is supplied. No private spreadsheet ID, lead rows, OAuth tokens, service-account keys or LadiPage account settings are included. `ladi-form-adapter.js` is inactive on this GitHub build.
