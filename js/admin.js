const $ = (s) => document.querySelector(s);
let adminAuthenticated = false;
let allowingAdminLeave = false;
async function confirmAdminExit() {
  if (!adminAuthenticated || allowingAdminLeave) return true;
  const leave = window.confirm('You are logged in to admin. Logout before leaving this dashboard?');
  if (!leave) {
    history.pushState({ adminGuard: true }, '', location.href);
    return false;
  }
  allowingAdminLeave = true;
  try { await api('/api/admin/logout', { method: 'POST' }); } catch (err) {}
  return true;
}
window.addEventListener('popstate', async () => {
  const ok = await confirmAdminExit();
  if (ok) history.back();
});
window.addEventListener('beforeunload', (event) => {
  if (adminAuthenticated && !allowingAdminLeave) {
    event.preventDefault();
    event.returnValue = '';
  }
});
async function api(url, options = {}) { const res = await fetch(url, options); const data = await res.json().catch(() => ({})); if (!res.ok) throw new Error(data.error || 'Request failed'); return data; }
function bindFormValues(form, data) { Object.entries(data || {}).forEach(([k,v]) => { const el = form.elements[k]; if (el) el.value = v || ''; }); }
function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}
async function refreshAdmin() {
  const me = await api('/api/admin/me'); adminAuthenticated = me.authenticated; if (me.authenticated) history.replaceState({ adminGuard: true }, '', location.href); $('#loginPanel').style.display = me.authenticated ? 'none' : 'block'; $('#dashboard').style.display = me.authenticated ? 'block' : 'none';
  if (!me.authenticated) return;
  const pub = await api('/api/settings'); bindFormValues($('#settingsForm'), pub.settings); bindFormValues($('#imagesForm'), pub.homepageImages);
  const bookings = await api('/api/admin/bookings');
  $('#bookingCount').textContent = bookings.bookings.length;
  $('#bookings').innerHTML = bookings.bookings.map(b => '<tr><td><strong>'+escapeHtml(b.date)+'</strong><span>'+escapeHtml(b.time)+'</span></td><td><strong>'+escapeHtml(b.name)+'</strong><span>'+escapeHtml(b.email || 'No email')+'</span></td><td>'+escapeHtml(b.phone)+'</td><td><span class="admin-pill">'+escapeHtml(b.guests)+'</span></td><td>'+escapeHtml(b.message || 'No message')+'</td><td><button data-del-booking="'+escapeHtml(b.id)+'" class="btn btn-sm admin-danger">Delete</button></td></tr>').join('') || '<tr><td colspan="6"><div class="admin-empty">No bookings yet. New table requests will appear here.</div></td></tr>';
  const imgs = await api('/api/images');
  $('#imageCount').textContent = imgs.images.length;
  $('#adminImages').innerHTML = imgs.images.map(i => '<div class="admin-thumb"><img src="'+escapeHtml(i.imageUrl)+'" alt=""><div><strong>'+escapeHtml(i.title)+'</strong><span>'+escapeHtml(i.type === 'menu' ? 'Full menu image' : 'Item image')+'</span></div><button data-del-image="'+escapeHtml(i.id)+'" class="btn btn-sm admin-danger">Delete</button></div>').join('') || '<div class="admin-empty">No gallery images yet. Upload a file or paste a Cloudinary URL.</div>';
}
document.addEventListener('DOMContentLoaded', () => {
  $('#loginForm').addEventListener('submit', async e => { e.preventDefault(); try { await api('/api/admin/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(Object.fromEntries(new FormData(e.target).entries())) }); $('#loginStatus').textContent=''; refreshAdmin(); } catch(err) { $('#loginStatus').textContent = err.message; } });
  $('#logoutBtn').addEventListener('click', async () => { if (!window.confirm('Logout from admin dashboard?')) return; allowingAdminLeave = true; await api('/api/admin/logout', { method:'POST' }); adminAuthenticated = false; allowingAdminLeave = false; refreshAdmin(); });
  $('#settingsForm').addEventListener('submit', async e => { e.preventDefault(); await api('/api/admin/settings', { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(Object.fromEntries(new FormData(e.target).entries())) }); $('#settingsStatus').textContent='Settings saved.'; refreshAdmin(); });
  $('#imagesForm').addEventListener('submit', async e => { e.preventDefault(); await api('/api/admin/homepage-images', { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(Object.fromEntries(new FormData(e.target).entries())) }); $('#homeImagesStatus').textContent='Homepage images saved.'; refreshAdmin(); });
  $('#uploadForm').addEventListener('submit', async e => { e.preventDefault(); const fd = new FormData(e.target); await api('/api/admin/images', { method:'POST', body: fd }); e.target.reset(); $('#uploadStatus').textContent='Image saved.'; refreshAdmin(); });
  document.addEventListener('click', async e => { if (e.target.dataset.delBooking) { await api('/api/admin/bookings/'+e.target.dataset.delBooking, { method:'DELETE' }); refreshAdmin(); } if (e.target.dataset.delImage) { await api('/api/admin/images/'+e.target.dataset.delImage, { method:'DELETE' }); refreshAdmin(); } });
  refreshAdmin().catch(err => { $('#loginStatus').textContent = err.message; });
});
