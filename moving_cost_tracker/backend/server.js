// Simple Node.js server for Moving Cost Tracker
// Serves static frontend files and provides a minimal REST API
// Data is stored in JSON files under ../data

const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const HOST = '0.0.0.0';
const PORT = 3456;

const DATA_DIR    = path.join(__dirname, '..', 'data');
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');
const REPO_DIR    = path.join(__dirname, '..', '..');

function gitPull() {
  try { execSync('git pull origin main', { cwd: REPO_DIR, stdio: 'ignore', timeout: 15000 }); } catch(e) {}
}

function gitPush(msg) {
  try {
    execSync('git add moving_cost_tracker/data/', { cwd: REPO_DIR, stdio: 'ignore' });
    execSync(`git commit -m "sync: ${msg}"`, { cwd: REPO_DIR, stdio: 'ignore' });
    execSync('git push origin main', { cwd: REPO_DIR, stdio: 'ignore', timeout: 30000 });
  } catch(e) {}
}

function jsonResponse(res, data, status = 200) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(body);
}

function notFound(res) {
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
}

function readJson(file) {
  try {
    const raw = fs.readFileSync(path.join(DATA_DIR, file), 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    if (file === 'items.json')      return [];
    if (file === 'categories.json') return [];
    if (file === 'sales.json')      return [];
    if (file === 'config.json')     return { budget: 0, currency: 'ILS' };
    return null;
  }
}

function writeJson(file, obj) {
  fs.writeFileSync(path.join(DATA_DIR, file), JSON.stringify(obj, null, 2), 'utf-8');
}

// Helper to parse request body as JSON
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => (data += chunk));
    req.on('end', () => {
      if (!data) return resolve({});
      try {
        const json = JSON.parse(data);
        resolve(json);
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', err => reject(err));
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;
  // API routes
  if (pathname.startsWith('/api/')) {
    // Enable CORS preflight
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      });
      return res.end();
    }
    // ROUTE: /api/items
    if (pathname === '/api/items') {
      if (req.method === 'GET') {
        const items = readJson('items.json');
        return jsonResponse(res, items);
      }
      if (req.method === 'POST') {
        try {
          const body = await parseBody(req);
          const items = readJson('items.json');
          const newId = items.length ? Math.max(...items.map(i => i.id)) + 1 : 1;
          const newItem = {
            id: newId,
            name_en: body.name_en || '',
            name_he: body.name_he || '',
            price: Number(body.price) || 0,
            currency: body.currency || 'ILS',
            notes: body.notes || '',
            category_id: body.category_id || null,
            selected: false,
            status: body.status || 'pending',
            model: body.model || '',
            contact_name: body.contact_name || '',
            contact_phone: body.contact_phone || '',
          };
          items.push(newItem);
          writeJson('items.json', items);
          return jsonResponse(res, newItem, 201);
        } catch (e) {
          return jsonResponse(res, { error: 'Invalid JSON' }, 400);
        }
      }
      // unsupported method
      return notFound(res);
    }
    // ROUTE: /api/items/:id
    const itemIdMatch = pathname.match(/^\/api\/items\/(\d+)$/);
    if (itemIdMatch) {
      const id = Number(itemIdMatch[1]);
      const items = readJson('items.json');
      const idx = items.findIndex(i => i.id === id);
      if (idx === -1) return notFound(res);
      if (req.method === 'GET') {
        return jsonResponse(res, items[idx]);
      }
      if (req.method === 'PUT') {
        try {
          const body = await parseBody(req);
          // Update allowed fields only
          const allowed = ['name_en', 'name_he', 'price', 'currency', 'notes', 'category_id', 'selected', 'status', 'model', 'contact_name', 'contact_phone'];
          for (const key of allowed) {
            if (key in body) items[idx][key] = body[key];
          }
          writeJson('items.json', items);
          return jsonResponse(res, items[idx]);
        } catch (e) {
          return jsonResponse(res, { error: 'Invalid JSON' }, 400);
        }
      }
      if (req.method === 'DELETE') {
        items.splice(idx, 1);
        writeJson('items.json', items);
        return jsonResponse(res, { success: true });
      }
      return notFound(res);
    }
    // ROUTE: /api/categories
    if (pathname === '/api/categories') {
      if (req.method === 'GET') {
        const cats = readJson('categories.json');
        return jsonResponse(res, cats);
      }
      if (req.method === 'POST') {
        try {
          const body = await parseBody(req);
          const cats = readJson('categories.json');
          const newId = cats.length ? Math.max(...cats.map(c => c.id)) + 1 : 1;
          const newCat = { id: newId, name_en: body.name_en || '', name_he: body.name_he || '' };
          cats.push(newCat);
          writeJson('categories.json', cats);
          return jsonResponse(res, newCat, 201);
        } catch (e) {
          return jsonResponse(res, { error: 'Invalid JSON' }, 400);
        }
      }
      return notFound(res);
    }
    // ROUTE: /api/categories/:id
    const catIdMatch = pathname.match(/^\/api\/categories\/(\d+)$/);
    if (catIdMatch) {
      const id = Number(catIdMatch[1]);
      const cats = readJson('categories.json');
      const idx = cats.findIndex(c => c.id === id);
      if (idx === -1) return notFound(res);
      if (req.method === 'GET') {
        return jsonResponse(res, cats[idx]);
      }
      if (req.method === 'PUT') {
        try {
          const body = await parseBody(req);
          if (body.name_en !== undefined) cats[idx].name_en = body.name_en;
          if (body.name_he !== undefined) cats[idx].name_he = body.name_he;
          writeJson('categories.json', cats);
          return jsonResponse(res, cats[idx]);
        } catch (e) {
          return jsonResponse(res, { error: 'Invalid JSON' }, 400);
        }
      }
      if (req.method === 'DELETE') {
        cats.splice(idx, 1);
        writeJson('categories.json', cats);
        return jsonResponse(res, { success: true });
      }
      return notFound(res);
    }
    // ROUTE: /api/config
    if (pathname === '/api/config') {
      if (req.method === 'GET') {
        const conf = readJson('config.json');
        return jsonResponse(res, conf);
      }
      if (req.method === 'PUT') {
        try {
          const body = await parseBody(req);
          const conf = readJson('config.json');
          if (body.budget !== undefined) conf.budget = Number(body.budget);
          if (body.currency !== undefined) conf.currency = body.currency;
          writeJson('config.json', conf);
          return jsonResponse(res, conf);
        } catch (e) {
          return jsonResponse(res, { error: 'Invalid JSON' }, 400);
        }
      }
      return notFound(res);
    }
    // ROUTE: /api/sync  — bulk load / save all data with password
    if (pathname === '/api/sync') {
      if (req.method === 'GET') {
        gitPull();
        return jsonResponse(res, {
          items:      readJson('items.json'),
          config:     readJson('config.json'),
          categories: readJson('categories.json'),
          sales:      readJson('sales.json'),
        });
      }
      if (req.method === 'POST') {
        try {
          const body = await parseBody(req);
          // No sync password — save-to-server is open (per owner's request).
          if (body.items      !== undefined) writeJson('items.json',      body.items);
          if (body.config     !== undefined) writeJson('config.json',     body.config);
          if (body.categories !== undefined) writeJson('categories.json', body.categories);
          if (body.sales      !== undefined) writeJson('sales.json',      body.sales);
          gitPush(new Date().toISOString().slice(0, 16));
          return jsonResponse(res, { ok: true });
        } catch (e) {
          return jsonResponse(res, { error: 'Invalid JSON' }, 400);
        }
      }
      return notFound(res);
    }

    // Unknown API endpoint
    return notFound(res);
  }

  // Static file serving (frontend)
  let filePath = pathname === '/' ? '/index.html' : pathname;
  // Prevent directory traversal
  filePath = path.normalize(filePath).replace(/^\/\.+/, '/');
  const fullPath = path.join(FRONTEND_DIR, filePath);
  fs.stat(fullPath, (err, stat) => {
    if (err || !stat.isFile()) {
      // fallback to index.html for SPA routes (optional)
      const fallback = path.join(FRONTEND_DIR, 'index.html');
      fs.readFile(fallback, (e, data) => {
        if (e) return notFound(res);
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(data);
      });
      return;
    }
    // Determine content type
    const ext = path.extname(fullPath).toLowerCase();
    const mime = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.svg': 'image/svg+xml',
    }[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime });
    const stream = fs.createReadStream(fullPath);
    stream.pipe(res);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Moving Cost Tracker server listening on http://${HOST}:${PORT}`);
});
