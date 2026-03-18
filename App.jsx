// api/sheets.js — Vercel serverless function
// Keeps Google credentials safe on the server side

const SHEET_ID = process.env.SHEET_ID;
const CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

// Create JWT for Google OAuth
async function getAccessToken() {
  const header = { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: CLIENT_EMAIL,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const encode = (obj) =>
    btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const header64 = encode(header);
  const claim64 = encode(claim);
  const toSign = `${header64}.${claim64}`;

  // Import private key
  const pemBody = PRIVATE_KEY
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');
  const binaryKey = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8', binaryKey.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false, ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5', cryptoKey,
    new TextEncoder().encode(toSign)
  );

  const sig64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const jwt = `${toSign}.${sig64}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const tokenData = await tokenRes.json();
  return tokenData.access_token;
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const token = await getAccessToken();
    const { action, sheet, row, range } = req.body || {};
    const base = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}`;

    if (action === 'append') {
      const r = await fetch(`${base}/values/${encodeURIComponent(sheet + '!A:Z')}:append?valueInputOption=USER_ENTERED`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: [row] }),
      });
      const data = await r.json();
      return res.status(200).json({ success: !data.error, error: data.error?.message });
    }

    if (action === 'read') {
      const r = await fetch(`${base}/values/${encodeURIComponent(sheet + '!A:Z')}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await r.json();
      return res.status(200).json({ success: !data.error, rows: data.values || [], error: data.error?.message });
    }

    if (action === 'setup') {
      // Create sheets if they don't exist
      const getRes = await fetch(`${base}?fields=sheets.properties.title`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const sheetData = await getRes.json();
      const existing = (sheetData.sheets || []).map(s => s.properties.title);
      const needed = ['Ingresos', 'Gastos'];
      const toAdd = needed.filter(n => !existing.includes(n));

      if (toAdd.length > 0) {
        await fetch(`${base}:batchUpdate`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requests: toAdd.map(title => ({ addSheet: { properties: { title } } }))
          }),
        });
      }

      // Add headers to Ingresos
      await fetch(`${base}/values/Ingresos!A1:G1?valueInputOption=USER_ENTERED`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: [['Fecha', 'Alumno', 'Concepto', 'Mes', 'Monto', 'Nota', 'Timestamp']] }),
      });
      // Add headers to Gastos
      await fetch(`${base}/values/Gastos!A1:F1?valueInputOption=USER_ENTERED`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: [['Fecha', 'Concepto', 'Categoría', 'Monto', 'Nota', 'Timestamp']] }),
      });

      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ success: false, error: 'Acción no reconocida' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
