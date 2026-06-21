async function loadSiteSettings() {
  try {
    const res = await fetch('/api/settings');
    const data = await res.json();
    const s = data.settings || {}; const h = data.homepageImages || {};
    document.querySelectorAll('[data-restaurant-name]').forEach(el => { el.textContent = s.restaurantName || 'Delfood'; });
    document.querySelectorAll('[data-opening-hours]').forEach(el => { el.textContent = (s.openingTime || '10:00 AM') + ' - ' + (s.closingTime || '10:00 PM'); });
    [['facebookLink','facebook'],['instagramLink','instagram'],['twitterLink','twitter']].forEach(([key,name]) => document.querySelectorAll('[data-social="'+name+'"]').forEach(a => { a.href = s[key] || '#'; }));
    document.querySelectorAll('[data-map-frame]').forEach(frame => { if (s.googleMapsEmbed) frame.src = s.googleMapsEmbed; });
    Object.keys(h).forEach(key => document.querySelectorAll('[data-home-image="'+key+'"]').forEach(img => { if (h[key]) img.src = h[key]; }));
    if (h.heroImage1) document.documentElement.style.setProperty('--hero-bg', 'url("' + h.heroImage1 + '")');
  } catch (err) { console.warn('Settings unavailable', err); }
}
document.addEventListener('DOMContentLoaded', loadSiteSettings);
