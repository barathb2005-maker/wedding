const crypto = require('crypto');
const { redis, listAll } = require('./_store');

function authorised(req) {
  const want = process.env.ADMIN_PASSWORD || '';
  const got = String(req.headers['x-admin-password'] || '');
  if (!want || !got) return false;
  const a = crypto.createHash('sha256').update(want).digest();
  const b = crypto.createHash('sha256').update(got).digest();
  return crypto.timingSafeEqual(a, b);
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    if (!authorised(req)) return res.status(401).json({ error: 'Wrong password' });
    if (req.method === 'GET') return res.status(200).json({ items: await listAll() });
    if (req.method === 'DELETE') {
      const id = String((req.query && req.query.id) || '');
      if (!id) return res.status(400).json({ error: 'Missing id' });
      await redis(['HDEL', 'blessings', id]);
      return res.status(200).json({ ok: true });
    }
    res.setHeader('Allow', 'GET, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: 'Server error' });
  }
};
