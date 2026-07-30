# Moving Cost Tracker — Handoff
**Updated:** 2026-06-19 (session 68)  
**Repo:** `AdbitRush/moving-cost-tracker`  
**Live:** GitHub Pages  
**Last commit:** `2e2bc4c`

> **For the next Claude session:** Read this file first. It's the single source of truth.

---

## What This App Does

Tracks all moving expenses: items, costs, categories, rooms, appointments, selling
items, plus an IKEA picks list. Hebrew RTL with an EN toggle, light/dark themes.

⚠️ **It is NOT "localStorage only, no backend"** (as this file used to claim).
There is a Node backend — `moving_cost_tracker/backend/server.js` — that serves the
frontend *and* a REST API (`/api/items`, `/api/categories`, `/api/sales`,
`/api/config`, `/api/rooms`, `/api/ikeapicks`) persisting to JSON files in
`moving_cost_tracker/data/`. **Your data lives on the server, not in the browser**,
so it is not deployable to GitHub Pages as-is and it does not work offline by
copying the folder.

**Files:** `moving_cost_tracker/frontend/` (`index.html`, `style.css`, `script.js`,
`i18n.js`, `rooms.js`, `ikea.js`) · `moving_cost_tracker/backend/server.js`

---

## Where it runs

| | |
|---|---|
| **Public** | **https://178-105-148-72.sslip.io** — the bare sslip host, Caddy → `localhost:3456` |
| Local | http://127.0.0.1:3456 — pm2 **`moving-cost`** |
| VPS | systemd **`moving-cost`**, `/root/repos/moving-cost-tracker` |

Installable PWA since 2026-07-30: `icon.svg` + PNG icons + `apple-touch-icon.png`,
`manifest.webmanifest`, and `sw.js`. The worker caches the **shell and assets only —
`/api/*` is never cached**, because a cached budget would quietly show yesterday's
numbers as today's. Offline you get the frame and an empty state.
**Bump `V` in `sw.js`** whenever you change `style.css`, `script.js`, `i18n.js`,
`rooms.js`, `ikea.js` or an icon, or installed phones keep the old bundle.

### The VPS fork — resolved 2026-07-30, and why it happened

`/root/repos/moving-cost-tracker` had drifted to **13 commits ahead / 8 behind**
`origin/main`, so `git pull` failed with *"Not possible to fast-forward"*. Now
**0 / 0**: `git pull` works again and deploys are a normal pull + restart.

**What the fork actually was.** The 13 extra commits were automated
`sync: <timestamp>` snapshots and they contained **nothing unique in code** — the
VPS's `.js`/`.css`/`.html` were already byte-identical to `origin/main` (origin even
had a *later* sync, 19:25 vs the VPS's 19:10). The only real difference was
`moving_cost_tracker/data/*.json` — **the live expense data**, which on the VPS held
**21 items to origin's 13**. A naive `git reset --hard origin/main` would have
silently destroyed 8 real entries.

**How it was resolved:** code reset to `origin/main`, then the live data copied back
over the top. Verified after: 21 items, 8 sales, 12 categories, site up.

**Why it will not recur:** the six `data/*.json` files are now marked
`--skip-worktree` on the VPS, so git ignores local changes to them and the
automated committer cannot pick them up and re-diverge.
- Check with `git ls-files -v moving_cost_tracker/data` — an `S` flag means skipped.
- **Caveat:** if anyone ever commits those files upstream again, `git pull` on the
  VPS will refuse to overwrite them. Undo with
  `git update-index --no-skip-worktree moving_cost_tracker/data/*.json`.

**Nothing was thrown away.** All of it is still on the box:
| | |
|---|---|
| `backup/vps-fork-2026-07-30` | branch pinning all 13 original commits |
| `wip/vps-uncommitted-2026-07-30` | branch at the same point for the uncommitted work |
| `/root/mct-repo-backup-2026-07-30.tgz` | full tarball of the repo incl. `.git` |
| `/root/mct-live-data-2026-07-30/` | the live JSON data as it was |
| `/root/mct-index.html.pre-pwa-…`, `/root/mct-server.js.pre-pwa-…` | pre-PWA file backups |

Delete those once you're satisfied things are healthy.

### 🔴 Still open: this is a PUBLIC repo and it tracks your real expense data

`moving_cost_tracker/data/*.json` — items, prices, sales, budget — are **committed
to a public GitHub repo**. Skip-worktree stops *new* data reaching it, but what is
already in the history is public and stays public until someone rewrites it.

Two decisions for the owner:
1. **Untrack the data** (`git rm --cached moving_cost_tracker/data/*.json` +
   `.gitignore`) so each machine keeps its own. ⚠️ Do it carefully: other clones
   pulling that commit will have their local `data/*.json` **deleted** — back them
   up on every machine first. This is why it wasn't done unattended.
2. **Or make the repo private**, which is the one-click option if the data is meant
   to be shared between your own machines.

Also unresolved: whatever writes the `sync:` commits is **not in cron**
(`/etc/cron.d` has only espresso-pull, wed-studio-pull, sysstat, e2scrub). Find it
before relying on the fix — skip-worktree neutralises the data half, but an unknown
committer running on the box is still an unknown.

---

## Data Model (localStorage)

| Key | Type | Description |
|-----|------|-------------|
| `mct-items` | `Item[]` | Expense items |
| `mct-categories` | `Category[]` | Expense-type categories |
| `mct-config` | `Config` | Budget + currency |
| `mct-sales` | `SaleItem[]` | Items being sold |

**Item fields:** `id, name, price, currency, category_id, room, notes, status, model, contact_name, contact_phone, appointment, selected, quotes[]`

**SaleItem fields:** `id, name, askPrice, soldPrice, status (forsale/sold/removed), notes`

**Quote fields (inside item.quotes[]):** `id, supplier, price`

---

## Architecture

### Tabs (5)
| Tab | ID | What it does |
|-----|----|-------------|
| 📊 לוח בקרה | `tab-dashboard` | Budget hero, KPI cards, upcoming appts (7 days), category spend bars |
| 📅 לוח זמנים | `tab-calendar` | Weekly calendar (1 or 2 weeks), defaults to week of 15.7.2026 |
| 📋 פריטים | `tab-items` | Item cards with sort/filter/drag, add form |
| 🏷 קטגוריות | `tab-cats` | Expense-type category management |
| 💵 מכירות | `tab-sales` | Items for sale, income tracking |

### Key JS functions
- `updateSummary()` — recomputes all KPIs + hero; calls `renderCalendar`, `renderUpcoming`, `renderCatBreakdown`
- `renderItemsTable()` — renders item cards with sort, group headers, drag-drop
- `sortedItems(vis)` — applies `currentSort` (manual/price-desc/price-asc/room/cat)
- `salesIncome()` — sum of `soldPrice` for all sold items → flows into `effectiveBudget`
- `cycleStatus(id)` / `cycleSaleStatus(id)` — cycle through status states
- `patch(id, key, value)` — update any item field + save

---

## Features (as of session 68)

### Items tab
- Card grid: category chip + room chip in card top, name/price/phone in body, status badge in footer
- **Category chip** = expense type (הובלה, ריהוט, חשמל...) — colorful, changes card background (`cat-card-N`)
- **Room chip** = apartment room (כללי, חדר שינה, מטבח...) — 9-color palette (`room-chip-N`), separate from category
- **Sort bar:** ⠿ ידני (drag), ₪ יורד, ₪ עולה, 🏠 חדר (grouped), 🏷 קטגוריה (grouped)
- **Drag-to-reorder:** `⠿` handle, HTML5 drag-drop, reorders `items[]` array in localStorage
- **Group headers** shown between card groups in room/cat sort mode
- **Expand (⋯):** model, supplier name, phone, appointment datetime, notes, category change, inline new-category, quote comparison
- **Quote comparison:** multiple supplier prices, auto-highlights cheapest (⭐ הכי זול), "✓ הגדר" copies to item
- **Phone on card face:** `📞 tel:` link visible without expanding
- **Status cycle:** ממתין → שולם → בוטל (click badge)
- **Appointment badge** + calendar entry (datetime-local in expand row)
- **Filter:** הכל / ⏳ ממתין / ✅ שולם / ❌ בוטל + search

### Categories tab
- Expense-type categories only (NOT rooms — rooms are a per-item field)
- Add/delete categories; each gets a color from `CAT_COLORS` cycle
- Inline add-from-item: type new name in expanded item detail → Enter → creates + assigns

### Sales tab (מכירות)
- Add items for sale: name, asking price, notes
- Status: `למכירה` → (click "✅ קיבלתי את הכסף!") → `נמכר` → (undo) → back
- When marked sold: `soldPrice` auto-filled from `askPrice`; editable if actual differs
- Sales income integrates into budget: `effectiveBudget = budget + salesIncome()`
- Dashboard hero shows sales row when income > 0; sidebar shows "הכנסות מכירות ₪X"

### Dashboard
- Budget hero: total spent / effective budget, progress bar (amber >80%, red >100%)
- 4 KPI cards: total items, paid, pending, remaining
- Upcoming appointments widget (next 7 days)
- Category spend bar chart

### Calendar
- Weekly grid (1 or 2 weeks), Prev/Today/Next navigation
- Events from `item.appointment` — click event → expands that item in פריטים tab

---

## Constants

```js
const ROOM_PRESETS = [
  'כללי', 'חדר שינה ראשי', 'חדר ילדים', 'חדר תינוק',
  'סלון', 'מטבח', 'מרפסת', 'חדר עבודה', 'חדר אמבטיה',
];
const CAT_COLORS  = ['cat-0'…'cat-7'];           // 8 category colors
const ROOM_OPTION_STYLES = [...];                  // 9 inline styles for room dropdown options
const CAT_OPTION_STYLES  = [...];                  // 8 inline styles for category dropdown options
```

---

## Session History

### 2026-06-19 session 68 — room field + sort bar + drag-to-reorder
- Room split from category: `item.room` (string) vs `item.category_id` (expense type)
- Room chip select in every card top (9-color palette)
- Sort bar: manual drag, price ↑↓, group by room, group by category
- Drag-to-reorder cards (HTML5 drag-drop, reorders `items[]` array)
- Group headers in room/cat sort modes
- Room field in add-item form; CSV export includes Room column
- Categories tab: removed room-preset button, added explanatory note

### 2026-06-19 session 67 — sales tab + quotes + category UX
- 💵 מכירות tab: add items for sale, status cycle, green "✅ קיבלתי את הכסף!" button
- `soldPrice` auto-filled from `askPrice` on status → sold (bug fix: income now shows immediately)
- Sales income integrated into effectiveBudget + dashboard hero + sidebar
- Quote comparison in expanded item detail (multi-supplier, cheapest highlighted)
- Phone visible on card face as clickable `tel:` link
- Category chip → inline `<select>` (change category without expanding)
- Inline add-category from expanded detail
- Category-colored cards (`cat-card-N` classes)
- Colorful dropdown options (inline `style=` on `<option>`)
- Room preset categories (9 rooms) — later moved to per-item field in session 68

### 2026-06-19 session 66 — v3 full redesign
- Warm tan bg, orange→purple gradient hero, 4 colored KPI cards
- Fixed sidebar RTL (dark, right side, always visible)
- 4 tabbed pages (no scroll): dashboard, calendar, items, categories
- 12 seeded expense categories + 24 pre-seeded items
- Appointment/datetime per item → calendar integration
- CSV export with appointment column
- localStorage only, works on GitHub Pages
