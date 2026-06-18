# Moving Cost Tracker / מערכת ניהול הוצאות מעבר דירה

This repository provides a simple tool to track and update the costs associated with moving house. It is designed to work in both English and Hebrew.

## Features / תכונות
- List of typical moving‑related items (movers, packing supplies, appliances, furniture, …)
- Store price, currency and optional notes for each item
- CLI script (`scripts/update_prices.py`) to view the list and update prices
- JSON data file that can be edited manually or via the script
- Ready for further extensions (web UI, export to CSV/Excel, etc.)

## Quick start / איך להתחיל
```bash
# Clone the repo (or copy the folder)
git clone <repo‑url>
cd moving_cost_tracker

# Install Python 3 (if not present) and run the script
python3 scripts/update_prices.py          # show current table
python3 scripts/update_prices.py --set 2 1500   # update price of entry #2
```

## Extending / הרחבה
- Add more items to `data/items.json` following the same schema.
- Implement a web UI or a spreadsheet export.
- Add currency conversion, receipt image attachment, etc.

---

For any design improvements, edit the docs in `docs/` or open an issue.
