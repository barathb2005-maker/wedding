module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const supabaseUrl = (process.env.SUPABASE_URL || '').trim().replace(/\/$/, '');
    const supabaseKey = (process.env.SUPABASE_ANON_KEY || '').trim();

    if (!supabaseUrl.startsWith('http') || !supabaseKey) {
      return res.status(500).json({ error: 'Missing Supabase credentials' });
    }

    const headers = {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
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

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const payload = {
        name: String(body.name || 'A friend').slice(0, 120),
        relation: body.relation ? String(body.relation).slice(0, 120) : null,
        attend: body.attend || body.attendance || null,
        attendance: body.attendance || body.attend || null,
        guests: body.guests ? String(body.guests) : null,
        message: String(body.message || '').slice(0, 2000)
      };

      const r = await fetch(`${supabaseUrl}/rest/v1/blessings`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      if (!r.ok) throw new Error(await r.text());
      const saved = await r.json();
      const d = saved[0] || payload;
      return res.status(200).json({
        ok: true,
        item: {
          id: d.id,
          name: d.name,
          relation: d.relation || '',
          attend: d.attend || d.attendance || '',
          guests: d.guests || '',
          message: d.message || '',
          at: d.at || d.created_at || new Date().toISOString()
        }
      });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Server error' });
  }
};
