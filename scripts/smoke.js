const app = require('../api/index');
const required = ['ADMIN_USERNAME','ADMIN_PASSWORD','SESSION_SECRET'];
for (const key of required) process.env[key] = process.env[key] || (key === 'ADMIN_USERNAME' ? 'admin' : key === 'ADMIN_PASSWORD' ? 'pass' : 'secret');
const server = app.listen(0, async () => {
  const base = 'http://127.0.0.1:' + server.address().port;
  try {
    const admin = await fetch(base + '/admin/me');
    const blocked = await fetch(base + '/admin/bookings');
    const settings = await fetch(base + '/settings');
    const booking = await fetch(base + '/bookings', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name:'Test Guest', phone:'1234567890', date:'2026-06-14', time:'19:00', guests:'2' }) });
    const login = await fetch(base + '/admin/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ username:process.env.ADMIN_USERNAME, password:process.env.ADMIN_PASSWORD }) });
    const cookie = login.headers.get('set-cookie');
    const bookings = await fetch(base + '/admin/bookings', { headers: { cookie } });
    console.log(JSON.stringify({ admin: admin.status, blocked: blocked.status, settings: settings.status, booking: booking.status, login: login.status, bookings: bookings.status }));
  } finally { server.close(); }
});
