const crypto = require('crypto');
const { redis, listAll } = require('./_store');

const ATTEND = ['yes', 'maybe', 'no'];
const clean = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, n);

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    if (req.method === 'GET') {
      if (process.env.HIDE_WALL === 'true') return res.status(200).json({ items: [] });
      const items = (await listAll()).map(({ name, relation, attend, message, at }) => ({ name, relation, attend, message, at }));
      return res.status(200).json({ items });
    }

    if (req.method === 'POST') {
      const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      if (b.website) return res.status(200).json({ ok: true }); // honeypot: pretend success to bots

      const name = clean(b.name, 60);
      const message = clean(b.message, 1000);
      if (!name) return res.status(400).json({ error: 'Name is required' });

      const ip = String(req.headers['x-forwarded-for'] || 'unknown').split(',')[0].trim();
      const key = 'rl:' + crypto.createHash('sha1').update(ip).digest('hex').slice(0, 16);
      const n = await redis(['INCR', key]);
      if (n === 1) await redis(['EXPIRE', key, '3600']);
      if (n > 10) return res.status(429).json({ error: 'Too many messages' });

      if ((await redis(['HLEN', 'blessings'])) >= 5000) return res.status(507).json({ error: 'Memory book is full' });

      const entry = {
        name,
        relation: clean(b.relation, 60),
        attend: ATTEND.includes(b.attend) ? b.attend : 'yes',
        guests: Math.min(Math.max(parseInt(b.guests, 10) || 1, 1), 5),
        message,
        at: new Date().toISOString(),
      };
      const id = Date.now().toString(36) + crypto.randomBytes(4).toString('hex');
      await redis(['HSET', 'blessings', id, JSON.stringify(entry)]);
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: 'Server error' });
  }
};
