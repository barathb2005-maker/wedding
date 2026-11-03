const crypto = require('crypto');

function authorised(req) {
  const want = (process.env.ADMIN_PASSWORD || '').trim();
  const got = String(req.headers['x-admin-password'] || '').trim();
  if (!want || !got) return false;
  const a = crypto.createHash('sha256').update(want).digest();
  const b = crypto.createHash('sha256').update(got).digest();
  return crypto.timingSafeEqual(a, b);
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    if (!authorised(req)) return res.status(401).json({ error: 'Wrong password' });

    const supabaseUrl = (process.env.SUPABASE_URL || '').trim().replace(/\/$/, '');
    const supabaseKey = (process.env.SUPABASE_ANON_KEY || '').trim();

    if (!supabaseUrl.startsWith('http') || !supabaseKey) {
      return res.status(500).json({ error: 'Missing or invalid SUPABASE_URL / SUPABASE_ANON_KEY' });
    }

    const headers = {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    };

    if (req.method === 'GET') {
      const r = await fetch(`${supabaseUrl}/rest/v1/blessings?select=*&order=id.desc`, { headers });
      if (!r.ok) throw new Error(await r.text());
      const rows = await r.json();
      const items = rows.map(d => ({
        id: d.id,
        name: d.name || 'A friend',
        relation: d.relation || '',
        attend: d.attend || d.attendance || '',
        guests: d.guests || '',
        message: d.message || '',
        at: d.at || d.created_at || new Date().toISOString()
      }));
      return res.status(200).json({ items });
    }

    if (req.method === 'DELETE') {
      const id = String((req.query && req.query.id) || '');
      if (!id) return res.status(400).json({ error: 'Missing id' });
      const r = await fetch(`${supabaseUrl}/rest/v1/blessings?id=eq.${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers
      });
      if (!r.ok) throw new Error(await r.text());
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Server error' });
  }
};
