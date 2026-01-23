// Netlify Function: functions/login.js
// ENV required:
//  - AUTH_SECRET            (z. B. "random-string")
//  - ALLOWED_USERS          (JSON string: { "user@example.com":"<sha256(password+AUTH_SECRET)>" })
// Optional:
//  - FORMSPREE_ENDPOINT     (e.g. "https://formspree.io/f/xxxxx")
const crypto = require('crypto');

const fetchFn = (typeof fetch === 'function')
  ? fetch.bind(globalThis)
  : (...args) => import('node-fetch').then(({ default: fn }) => fn(...args));

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (err) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Ungültiger Request' }) };
  }

  const { email, password, forwardToFormspree } = body;
  if (!email || !password) {
    return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Email und Passwort sind erforderlich' }) };
  }

  const AUTH_SECRET = process.env.AUTH_SECRET || '';
  const allowedJson = process.env.ALLOWED_USERS || '{}';
  let allowed;
  try { allowed = JSON.parse(allowedJson); } catch (e) { allowed = {}; }

  // Hash wie beim Erstellen: sha256(password + AUTH_SECRET)
  const hash = crypto.createHash('sha256').update(password + AUTH_SECRET, 'utf8').digest('hex');
  const expected = allowed[email];

  if (!expected || expected !== hash) {
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Ungültige Zugangsdaten' })
    };
  }

  // Erzeuge ein kurzes Token (HMAC über email+timestamp)
  const token = crypto.createHmac('sha256', AUTH_SECRET).update(email + ':' + Date.now()).digest('hex');

  // Optional: serverseitig an Formspree weiterleiten (wenn gesetzt)
  const formspreeEndpoint = process.env.FORMSPREE_ENDPOINT;
  if (forwardToFormspree && formspreeEndpoint) {
    try {
      await fetchFn(formspreeEndpoint, {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
    } catch (err) {
      console.error('Formspree forward failed', err);
      // kein Abbruch; Auth ist erfolgreich
    }
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ok: true, token })
  };
};
