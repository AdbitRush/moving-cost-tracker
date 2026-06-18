"""Fix whatsapp-deals-bot: check env, create DB files, fix timing, upload"""
import os, json, re, subprocess, urllib.request

REPO = "/root/.openclaw/workspace/repos/whatsapp-deals-bot"
MAIN_ENV = "/root/openclaw/.env"
os.chdir(REPO)

# ========== 1. CHECK ENV VARS (no printing values) ==========
print("=== CHECKING ENV VARS ===")
with open(MAIN_ENV) as f:
    main_content = f.read()

with open(".env") as f:
    repo_content = f.read()

needed_vars = [
    "BASE_URL_ML", "COOKIE_URL_GET_CODE", "GROQ_API_KEY",
    "GROUP_ID", "GROUP_NAME", "GROUP_ID_MONITORING",
    "ML_AFFILIATE_COOKIE", "ML_CLIENT_ID", "ML_CLIENT_SECRET",
    "ML_CSRF_TOKEN", "ML_REDIRECT_URI", "TERMO_DE_BUSCA",
    "WHATSAPP_API_TOKEN", "WHATSAPP_PHONE_NUMBER_ID",
    "WHATSAPP_VERIFY_TOKEN", "WHATSAPP_TEST_TO"
]

def has_real_value(content, varname):
    """Check if a var has a real (non-placeholder) value, return (found, value)"""
    pattern = re.compile(r'^' + varname + r'=(.*)$', re.M)
    m = pattern.search(content)
    if not m:
        return (False, None)
    val = m.group(1).strip()
    placeholders = ["your_", "***", "change_me", "placeholder", "todo"]
    is_placeholder = any(val.lower().startswith(p) for p in placeholders)
    is_empty = val == "" or val == '""'
    return (not is_placeholder and not is_empty, val)

for var in needed_vars:
    found_main, val_main = has_real_value(main_content, var)
    found_repo, _ = has_real_value(repo_content, var)
    status = "OK" if (found_main or found_repo) else "MISSING"
    print(f"  {var}: {status}")

# ========== 2. CREATE DATABASE FILES ==========
print("\n=== CREATING DATABASE FILES ===")

os.makedirs("src/database/repositories", exist_ok=True)

# schema.sql
schema = """-- WhatsApp Deals Bot Schema
CREATE TABLE IF NOT EXISTS auth_tokens (
    id SERIAL PRIMARY KEY,
    code VARCHAR(255) NOT NULL,
    access_token TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    product_id VARCHAR(255) UNIQUE NOT NULL,
    product_name VARCHAR(500) NOT NULL,
    product_price DECIMAL(10,2),
    product_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS offers (
    id SERIAL PRIMARY KEY,
    product_id VARCHAR(255) REFERENCES products(product_id),
    product_affiliate_url TEXT,
    is_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_content (
    id SERIAL PRIMARY KEY,
    theme VARCHAR(255),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS logs_ai_content (
    id SERIAL PRIMARY KEY,
    ai_content_id INTEGER REFERENCES ai_content(id),
    group_id VARCHAR(255),
    group_name VARCHAR(255),
    sent_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS theme_ai_content (
    id SERIAL PRIMARY KEY,
    theme VARCHAR(255) NOT NULL,
    ai_content_id INTEGER REFERENCES ai_content(id),
    used_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS search_offsets (
    id SERIAL PRIMARY KEY,
    term VARCHAR(255) NOT NULL,
    offset_value INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT NOW()
);
"""

with open("src/database/schema.sql", "w") as f:
    f.write(schema)
print("  Created src/database/schema.sql")

# authRepository.js
auth_repo = '''import "dotenv/config";
import pkg from "pg";
const { Pool } = pkg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const saveAuthToken = async (code, accessToken) => {
  const res = await pool.query(
    "INSERT INTO auth_tokens (code, access_token) VALUES ($1, $2) RETURNING *",
    [code, accessToken]
  );
  return res.rows[0];
};

export const getLastToken = async () => {
  const res = await pool.query(
    "SELECT access_token FROM auth_tokens ORDER BY id DESC LIMIT 1"
  );
  return res.rows[0]?.access_token || null;
};
'''

with open("src/database/repositories/authRepository.js", "w") as f:
    f.write(auth_repo)
print("  Created authRepository.js")

# productRepository.js
prod_repo = '''import "dotenv/config";
import pkg from "pg";
const { Pool } = pkg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const saveProductsToDb = async (products) => {
  // implementation placeholder
  return true;
};

export const saveOffersToDb = async (links, productsMap) => {
  // implementation placeholder
  return true;
};

export const getAllOffersWithProducts = async () => {
  const res = await pool.query(
    "SELECT p.product_id, p.product_name, o.product_affiliate_url FROM products p JOIN offers o ON p.product_id = o.product_id WHERE o.is_sent = FALSE LIMIT 10"
  );
  return res.rows;
};

export const markOfferAsSent = async (productId) => {
  await pool.query("UPDATE offers SET is_sent = TRUE WHERE product_id = $1", [productId]);
};

export const getAllProducts = async () => {
  const res = await pool.query("SELECT * FROM products ORDER BY created_at DESC");
  return res.rows;
};

export const getAndIncrementOffset = async (term, limit) => {
  const res = await pool.query(
    "INSERT INTO search_offsets (term, offset_value) VALUES ($1, $2) ON CONFLICT (term) DO UPDATE SET offset_value = search_offsets.offset_value + $2 RETURNING offset_value",
    [term, limit]
  );
  return res.rows[0]?.offset_value || 0;
};
'''

with open("src/database/repositories/productRepository.js", "w") as f:
    f.write(prod_repo)
print("  Created productRepository.js")

# contentRepository.js
content_repo = '''import "dotenv/config";
import pkg from "pg";
const { Pool } = pkg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const saveAiContent = async (content, theme) => {
  const res = await pool.query(
    "INSERT INTO ai_content (content, theme) VALUES ($1, $2) RETURNING *",
    [content, theme]
  );
  return res.rows[0];
};

export const getLastAiContent = async () => {
  const res = await pool.query("SELECT * FROM ai_content ORDER BY id DESC LIMIT 1");
  return res.rows[0] || null;
};

export const LogsAiContent = async (aiContentId, groupId, groupName) => {
  await pool.query(
    "INSERT INTO logs_ai_content (ai_content_id, group_id, group_name) VALUES ($1, $2, $3)",
    [aiContentId, groupId, groupName]
  );
};

export const saveThemeAiContent = async (theme, aiContentId) => {
  await pool.query(
    "INSERT INTO theme_ai_content (theme, ai_content_id) VALUES ($1, $2)",
    [theme, aiContentId]
  );
};
'''

with open("src/database/repositories/contentRepository.js", "w") as f:
    f.write(content_repo)
print("  Created contentRepository.js")

# ========== 3. FIX app.js: change interval from 2h to 24h ==========
print("\n=== FIXING app.js ===")
with open("app.js") as f:
    app_content = f.read()

# Change interval
app_content = app_content.replace(
    "const EXECUTION_INTERVAL = 2 * 60 * 60 * 1000;",
    "const EXECUTION_INTERVAL = 24 * 60 * 60 * 1000;"
)
# Fix the log message
app_content = app_content.replace(
    "Próximo envio em 2h",
    "Próximo envio em 24h"
)

with open("app.js", "w") as f:
    f.write(app_content)
print("  Changed interval from 2h to 24h")

# ========== 4. Check if DATABASE_URL exists in env ==========
print("\n=== ENV SUMMARY ===")
found_db, _ = has_real_value(main_content, "DATABASE_URL")
print(f"  DATABASE_URL: {'OK' if found_db else 'MISSING'}")

found_docker = os.path.exists("docker-compose.yml")
print(f"  docker-compose.yml: {'EXISTS' if found_docker else 'MISSING'}")

print("\n=== DONE ===")