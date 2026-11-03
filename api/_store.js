// Tiny Redis-over-HTTP client (works with Upstash Redis from the Vercel Marketplace).
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

async function redis(cmd) {
  if (!URL_ || !TOKEN) throw new Error('Storage is not connected');
  const r = await fetch(URL_, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd),
  });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.result;
}

async function listAll() {
  const raw = (await redis(['HGETALL', 'blessings'])) || [];
  const items = [];
  for (let i = 0; i < raw.length; i += 2) {
    try { items.push({ id: raw[i], ...JSON.parse(raw[i + 1]) }); } catch (e) {}
  }
  items.sort((a, b) => String(b.at).localeCompare(String(a.at)));
  return items;
}

module.exports = { redis, listAll };
