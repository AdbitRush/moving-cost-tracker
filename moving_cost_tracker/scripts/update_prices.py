#!/usr/bin/env python3
"""Simple CLI for managing moving expenses.

Usage examples:
  python3 scripts/update_prices.py               # List all items with current prices
  python3 scripts/update_prices.py --set 3 250   # Set price of item with ID 3 to 250
  python3 scripts/update_prices.py --note 3 "Bought second-hand"  # Add a note
  python3 scripts/update_prices.py --list         # Same as without args

The data file is stored in ``data/items.json`` relative to the repository root.
All changes are written back to this JSON file.
"""

import argparse
import json
import os
import sys
from pathlib import Path
from typing import List, Dict

# Path to the JSON data file (repo root / data/items.json)
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_FILE = BASE_DIR / "data" / "items.json"

def load_items() -> List[Dict]:
    if not DATA_FILE.is_file():
        print(f"Data file not found: {DATA_FILE}", file=sys.stderr)
        sys.exit(1)
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def save_items(items: List[Dict]):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, indent=2)

def list_items(items: List[Dict]):
    # Simple table output
    header = f"{'ID':<4} {'EN':<25} {'HE':<25} {'Price':<10} {'Currency':<8} Note"
    print(header)
    print('-' * len(header))
    for it in items:
        note = it.get('notes', '').replace('\n', ' ')
        print(f"{it['id']:<4} {it['name_en']:<25} {it['name_he']:<25} {it['price']:<10} {it['currency']:<8} {note}")

def set_price(items: List[Dict], item_id: int, price: float):
    for it in items:
        if it['id'] == item_id:
            it['price'] = price
            return True
    return False

def set_note(items: List[Dict], item_id: int, note: str):
    for it in items:
        if it['id'] == item_id:
            it['notes'] = note
            return True
    return False

def main():
    parser = argparse.ArgumentParser(description="Moving cost tracker CLI")
    parser.add_argument('--list', action='store_true', help='List all items (default)')
    parser.add_argument('--set', nargs=2, metavar=('ID', 'PRICE'), help='Set price for an item')
    parser.add_argument('--note', nargs=2, metavar=('ID', 'NOTE'), help='Add/replace note for an item')
    args = parser.parse_args()

    items = load_items()

    changed = False
    if args.set:
        try:
            item_id = int(args.set[0])
            price = float(args.set[1])
        except ValueError:
            print('Invalid ID or PRICE for --set', file=sys.stderr)
            sys.exit(1)
        if set_price(items, item_id, price):
            print(f"Price of item {item_id} set to {price}")
            changed = True
        else:
            print(f"Item with ID {item_id} not found", file=sys.stderr)
            sys.exit(1)
    if args.note:
        try:
            item_id = int(args.note[0])
            note = args.note[1]
        except ValueError:
            print('Invalid ID for --note', file=sys.stderr)
            sys.exit(1)
        if set_note(items, item_id, note):
            print(f"Note for item {item_id} updated")
            changed = True
        else:
            print(f"Item with ID {item_id} not found", file=sys.stderr)
            sys.exit(1)
    if changed:
        save_items(items)
    # By default or if --list provided, show the table
    if args.list or not (args.set or args.note):
        list_items(items)

if __name__ == "__main__":
    main()
"