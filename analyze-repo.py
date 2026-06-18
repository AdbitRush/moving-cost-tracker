import os, subprocess, json, re

os.chdir("/root/.openclaw/workspace/repos/whatsapp-deals-bot")

print("=== COMMITS LAST 2 MONTHS ===")
result = subprocess.run(["git", "log", "--oneline", "--since=2026-04-01"], capture_output=True, text=True)
print(result.stdout[:2000])

print("\n=== FILES MODIFIED IN LAST 10 COMMITS ===")
result = subprocess.run(["git", "diff", "HEAD~10..HEAD", "--stat"], capture_output=True, text=True)
print(result.stdout)

print("\n=== ENV VARS USED IN CODE ===")
src_vars = set()
for root, dirs, files in os.walk("src"):
    for f in files:
        if f.endswith(".js"):
            path = os.path.join(root, f)
            with open(path) as fh:
                content = fh.read()
            for m in re.finditer(r'process\.env\.(\w+)', content):
                src_vars.add(m.group(1))
for v in sorted(src_vars):
    print(f"  {v}")

print("\n=== ENV VARS IN app.js ===")
with open("app.js") as f:
    for m in re.finditer(r'process\.env\.(\w+)', f.read()):
        print(f"  {m.group(1)}")

print("\n=== ENV VARS IN scripts ===")
for fname in ["scripts-whatsapp-cloud-test.mjs", "src/mercado-livre/resources/generateAffiliateLinks.js", "src/mercado-livre/config/constants.js"]:
    try:
        with open(fname) as f:
            for m in re.finditer(r'process\.env\.(\w+)', f.read()):
                print(f"  {m.group(1)} (from {fname})")
    except: pass

print("\n=== WHAT DOES THE BOT REALLY DO? ===")
print("Based on src/index.js and src/mercado-livre:")
print("- It searches Mercado Livre API for products matching a search term (TERMO_DE_BUSCA)")
print("- The search term is configurable via env var - NOT hardcoded to coffee")
print("- It generates affiliate links for found products")
print("- It creates AI content via Groq (llama-3.3-70b) with customizable prompt.json")
print("- Sends to WhatsApp group via whatsapp-web.js (needs QR scan)")
print("- Runs on a timer (app.js sets 2h intervals)")
print("- Also has a separate WhatsApp Cloud API test script")
print("- Requires PostgreSQL for storing products, offers, auth tokens, AI content")

print("\n=== DATABASE FILES NEEDED ===")
# Check if db files exist
db_dir = "src/database"
if os.path.exists(db_dir):
    for root, dirs, files in os.walk(db_dir):
        for f in files:
            print(f"  {os.path.join(root, f)}")
else:
    print("  MISSING: src/database/ directory does not exist!")
    print("  Files referenced in code:")
    print("    - database/repositories/authRepository.js")
    print("    - database/repositories/productRepository.js")
    print("    - database/repositories/contentRepository.js")
    print("    - database/schema.sql (referenced in docker-compose.yml)")
    print("  .gitignore has src/database/ listed!")

print("\n=== TODO/FIXME IN CODE ===")
for root, dirs, files in os.walk("."):
    if "node_modules" in root or ".git" in root:
        continue
    for f in files:
        if f.endswith(".js") or f.endswith(".mjs"):
            path = os.path.join(root, f)
            with open(path) as fh:
                content = fh.read()
            for m in re.finditer(r'(TODO|FIXME|HACK|BUG):?\s*(.*)', content, re.I):
                print(f"  {os.path.join(root,f)}: {m.group(0).strip()}")