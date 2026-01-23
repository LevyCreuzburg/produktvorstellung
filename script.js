// Endpoint zur Netlify Function
const endpoint = '/.netlify/functions/login';

// Im submit-handler:
const res = await fetch(endpoint, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password, forwardToFormspree: true })
});
const data = await res.json().catch(()=>({}));
if (res.ok && data.ok) {
  localStorage.setItem('laufhaufen_token', data.token);
  localStorage.setItem('laufhaufen_email', email);
  showDashboard(email);
} else {
  message.textContent = data.error || 'Anmeldung fehlgeschlagen.';
}
