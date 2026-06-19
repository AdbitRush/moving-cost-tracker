# Moving Cost Tracker — Handoff
**Updated:** 2026-06-19 (session 68)  
**Repo:** `AdbitRush/moving-cost-tracker`  
**Live:** GitHub Pages  
**Last commit:** `2e2bc4c`

> **For the next Claude session:** Read this file first. It's the single source of truth.

---

## What This App Does

Pure static frontend (HTML/CSS/JS, localStorage only — no backend, no server).  
Tracks all moving expenses: items, costs, categories, rooms, appointments, selling items.  
Works offline, deployable to GitHub Pages as-is.

**Files:** `moving_cost_tracker/frontend/index.html`, `style.css`, `script.js`

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
