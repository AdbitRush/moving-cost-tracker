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

### ⚠️ The VPS checkout has forked from GitHub — resolve before the next deploy

As of 2026-07-30 `/root/repos/moving-cost-tracker` is **13 commits ahead and 8
behind** `origin/main`, with ~91 lines staged-but-uncommitted on top. The extra
commits are all automated `sync: <timestamp>` snapshots, and they touch the same
frontend files as the GitHub history — so `git pull` fails with
*"Not possible to fast-forward"*.

Because of that, the PWA files were deployed to the VPS **surgically, not by pull**:
the six new files were copied in, and `index.html` / `server.js` were patched at
anchors that are identical on both sides. Backups:
`/root/mct-index.html.pre-pwa-2026-07-30` and `/root/mct-server.js.pre-pwa-2026-07-30`.
Those two files are now modified on the VPS and **not committed anywhere**.

Someone has to decide which side is authoritative and reconcile — merge the sync
commits into `origin/main`, or reset the VPS to origin and accept losing them. Until
then every deploy here is hand-surgery. Whatever writes the `sync:` commits is not
in cron (`/etc/cron.d` has only espresso-pull, wed-studio-pull, sysstat, e2scrub);
find it before reconciling or it will fork again.

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
