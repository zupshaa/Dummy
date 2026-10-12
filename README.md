# Our Little Café Scrapbook

Plain HTML/CSS/JS. No build step, no accounts beyond GitHub.

## Publish (all in the browser)
1. Repo → **Add file → Upload files**. Drag in `index.html`, `styles.css`, `script.js`, `README.md` and the `data` folder (keep `data/cafes.json` in `data/`). **Commit**.
2. **Settings → Pages → Build and deployment**: Source *Deploy from a branch*, branch `main`, folder `/ (root)`. Save.
3. After ~1 min your site is at `https://YOUR-USERNAME.github.io/REPO-NAME/`. Send that link to your friend. Paths are relative, so it works under the repo name.

## What is stored where
| Action | Where it lives |
|---|---|
| Browsing, search, filters, sorting | Local only, in the visitor's browser. Nothing is saved. |
| Cafés, visits, memories, links everyone sees | The public `data/cafes.json`. |
| Friend's contribution form | Nowhere. It makes a text draft they send you themselves. |
| Adding that draft to the list | **You**, manually, by editing `data/cafes.json` on GitHub. |

Everything in the repo is public. No tokens, logins or databases are used.

## Applying a contribution
1. Open the draft your friend sent (a JSON block).
2. On GitHub open `data/cafes.json` → pencil icon (Edit).
3. **New café:** copy the object into `"cafes": [...]`, add `"image":""`, `"createdAt"`, `"updatedAt"`, and `"visits":[]`. **New visit:** paste the `visit` object into that café's `"visits"` array and add a unique `"id"`. **Mark visited:** set `"status":"visited"`. Watch the commas.
4. Before committing, open `https://YOUR-SITE/#/owner`, paste the whole file, click **Validate**. It catches broken JSON, duplicate IDs, missing dates, and links that don't match YouTube/TikTok.
5. **Commit changes.** The site updates after the Pages deploy finishes (about a minute). A red banner on the site also appears if the live file has problems.

## Data format (`data/cafes.json`)
```json
{ "id":"unique-slug", "name":"", "location":"", "mapsUrl":"https://…", "image":"https://… or empty",
  "reason":"", "status":"want | visited", "plannedDate":"YYYY-MM-DD or null",
  "createdAt":"ISO time", "updatedAt":"ISO time", "addedBy":"",
  "visits":[{ "id":"slug-v1", "date":"YYYY-MM-DD", "author":"", "ordered":["…"], "experience":"",
    "conversation":"", "funny":"", "notes":"", "keepsakes":["…"],
    "links":[{ "platform":"youtube | tiktok", "url":"https://…", "title":"", "description":"" }] }] }
```

## Redesign or add a database later
`script.js` reads data only through `loadData()` at the top. Replace it with any API returning `{cafes:[…]}` and the UI is unchanged. Views are separate functions in `views`.

## Tested / not tested
I did not run this in a browser or click through it, so give it a quick check after upload: navigation, search/filters, the contribution form, copy/share (native share works mainly on phones), and external links.
