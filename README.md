# Message Vault — Skate Lite

A super-simple personal message library built for **GitHub Pages + Google Sheets + Apps Script**.

## What it does

- Organizes messages by **Project** and **Category**
- Lets you **search** all messages fast
- Gives every message card a big **COPY MESSAGE** button
- Works well on **iPhone** and desktop
- Uses **Google Sheets** as the message source

---

## Files

- `index.html` — app layout
- `style.css` — 90s skate-inspired UI
- `app.js` — filtering, loading, copying, modal
- `Code.gs` — Apps Script endpoint
- `Messages-template.xlsx` — starter spreadsheet
- `Messages-template.csv` — CSV version of the starter spreadsheet

---

## Sheet structure

Create a Google Sheet tab named:

`Messages`

Use these columns:

| ID | Project | Category | Title | Message | Active | Sort |
|----|---------|----------|-------|---------|--------|------|

Example row:

| 1 | Seek & Scale | Cold Outreach | First Contact | Hey! I came across your business... | TRUE | 1 |

---

## Apps Script setup

1. Open your Google Sheet.
2. Go to **Extensions → Apps Script**.
3. Replace the default file contents with the contents of `Code.gs`.
4. Save the project.
5. Click **Deploy → New deployment**.
6. Choose **Web app**.
7. Execute as: **Me**.
8. Who has access: **Anyone**.
9. Deploy and copy the `/exec` URL.

---

## Frontend setup

1. Open `app.js`.
2. Replace this line:

```js
const APP_SCRIPT_URL = 'PASTE_YOUR_APPS_SCRIPT_EXEC_URL_HERE';
```

with your real Apps Script `/exec` URL.

---

## GitHub Pages setup

1. Create a new GitHub repo.
2. Upload these files to the repo root:
   - `index.html`
   - `style.css`
   - `app.js`
3. In GitHub, go to **Settings → Pages**.
4. Under **Build and deployment**, set:
   - Source: **Deploy from a branch**
   - Branch: **main**
   - Folder: **/root**
5. Save.
6. Wait for GitHub Pages to publish.

---

## Notes

- This app is for **personal use**.
- Do **not** store sensitive information in the Sheet.
- The deployed Apps Script endpoint returns your active messages to the app, so treat it as a reusable message library, not secure storage.

---

## Workflow

**Open → Search → Filter → Copy → Paste**
