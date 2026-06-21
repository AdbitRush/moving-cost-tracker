const REPO = 'AdbitRush/moving-cost-tracker';
const FILES = {
  items:      'moving_cost_tracker/data/items.json',
  config:     'moving_cost_tracker/data/config.json',
  categories: 'moving_cost_tracker/data/categories.json',
  sales:      'moving_cost_tracker/data/sales.json',
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

  if (!body.password || body.password !== process.env.SYNC_PASSWORD) {
    return res.status(401).json({ error: 'סיסמה שגויה' });
  }

  const token = process.env.GH_TOKEN;
  if (!token) return res.status(500).json({ error: 'GH_TOKEN not configured' });

  const ghHeaders = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
    'User-Agent': 'moving-cost-tracker',
  };

  for (const [key, path] of Object.entries(FILES)) {
    const data = body[key];
    if (data === undefined) continue;

    const url = `https://api.github.com/repos/${REPO}/contents/${path}`;
    const getR = await fetch(url, { headers: ghHeaders });
    const existing = getR.ok ? await getR.json() : null;
    const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');

    const putR = await fetch(url, {
      method: 'PUT',
      headers: ghHeaders,
      body: JSON.stringify({
        message: `sync: ${new Date().toISOString().slice(0, 16)}`,
        content,
        ...(existing?.sha ? { sha: existing.sha } : {}),
      }),
    });

    if (!putR.ok) {
      const err = await putR.json().catch(() => ({}));
      return res.status(500).json({ error: err.message || `failed to save ${key}` });
    }
  }

  return res.json({ ok: true });
}
