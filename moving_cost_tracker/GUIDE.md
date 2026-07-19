# מעקב מעבר דירה — Moving Cost Tracker — Complete Guide

**Run:** `node backend/server.js` (port 3456, `PORT` env-overridable) · pm2-less local +
Hetzner systemd. UI: http://127.0.0.1:3456 · in-app guide: `/guide.html`

## Tabs
| Tab | What |
|---|---|
| 📊 לוח בקרה | budget vs spend, totals |
| 📅 לוח זמנים | appointments w/ start→finish times |
| 🚪 **תכנון חדרים** | **NEW (2026-07-19):** per-room planning — add ANY room ("החדר של גלי"...), per-person wishlists, priority (חובה/רגיל/אם יוצא), check-off, progress bars |
| 📋 פריטים | items + costs per category |
| 🏷 קטגוריות | cost categories |
| 💵 מכירות | items you're selling |
| 📈 גרפים | charts |

## Rooms API
`GET/POST /api/rooms`, `PUT/DELETE /api/rooms/:id` (delete cascades items),
`POST /api/room-items`, `PUT/DELETE /api/room-items/:id`. Data: `data/rooms.json`.
All data JSON files sync to git via `/api/sync`.
