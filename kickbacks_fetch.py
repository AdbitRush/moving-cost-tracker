# kickbacks_fetch.py – Fetch Kickbacks earnings using Playwright
# This script is intended to be run as a sub‑agent. It reads credentials
# from kickbacks_settings.env, logs into Kickbacks, extracts the balance,
# and writes the result to /tmp/kickbacks_balance.json.

import os
import json
import subprocess
import random
import time
import re
from pathlib import Path

# Load environment variables from the .env file if present
env_path = Path("/root/.openclaw/workspace/kickbacks_settings.env")
if env_path.is_file():
    for line in env_path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if "=" in line:
            key, val = line.split("=", 1)
            os.environ.setdefault(key.strip(), val.strip())

USERNAME = os.getenv("KICKBACKS_USER")
PASSWORD = os.getenv("KICKBACKS_PASS")
OUTFILE = "/tmp/kickbacks_balance.json"

if not USERNAME or not PASSWORD:
    raise RuntimeError("Kickbacks credentials not set – please fill kickbacks_settings.env")

# Random delay to avoid a fixed pattern
delay_secs = random.uniform(30, 300)
print(f"[INFO] Sleeping for {delay_secs:.1f}s before Kickbacks login")
time.sleep(delay_secs)

def ensure_playwright():
    try:
        import playwright.sync_api  # noqa: F401
    except Exception:
        subprocess.check_call(["python3", "-m", "pip", "install", "playwright"])
        subprocess.check_call(["playwright", "install", "chromium"])

ensure_playwright()
from playwright.sync_api import sync_playwright

def fetch_balance():
    """Log in to Kickbacks and return the displayed balance as a string."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("https://kickbacks.ai/login", wait_until="networkidle")
        # If a Google ID token is supplied, use it via a cookie
        if os.getenv("KICKBACKS_GOOGLE_IDTOKEN"):
            page.context.add_cookies([{"name": "id_token", "value": os.getenv("KICKBACKS_GOOGLE_IDTOKEN"), "domain": "kickbacks.ai", "path": "/", "httpOnly": False, "secure": True}])
            page.goto("https://kickbacks.ai/me", wait_until="networkidle")
        else:
            # Standard email/password login
            if page.query_selector('input[name="email"]'):
                page.fill('input[name="email"]', USERNAME)
                page.fill('input[name="password"]', PASSWORD)
                submit_btn = page.query_selector('button[type="submit"]') or page.query_selector('button')
                if submit_btn:
                    submit_btn.click()
                else:
                    page.keyboard.press("Enter")
                page.wait_for_url("**/me", timeout=15000)
                page.wait_for_load_state("networkidle")
            else:
                raise RuntimeError("Login page does not contain email/password fields.")
        # Try to locate the balance element
        balance_el = page.query_selector('.balance') or page.query_selector('[data-testid="balance"]')
        if balance_el:
            balance_text = balance_el.inner_text().strip()
        else:
            # Fallback: search the whole page for a dollar amount
            content = page.content()
            match = re.search(r'\$\s*\d[\d,]*\.?\d*', content)
            balance_text = match.group(0).strip() if match else None
        if not balance_text:
            raise RuntimeError("Unable to locate balance on the account page.")
        return balance_text

if __name__ == "__main__":
    try:
        bal = fetch_balance()
        with open(OUTFILE, "w", encoding="utf-8") as f:
            json.dump({"balance": bal}, f)
        print(f"[INFO] Balance saved to {OUTFILE}: {bal}")
    except Exception as e:
        with open(OUTFILE, "w", encoding="utf-8") as f:
            json.dump({"error": str(e)}, f)
        print(f"[ERROR] Failed to fetch balance: {e}")
        raise
