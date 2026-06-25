async function loadSiteSettings() {
  try {
    if (!window.App) return;
    const s = await window.App.getSettings();
    document.querySelectorAll('[data-restaurant-name]').forEach(el => { el.textContent = s.restaurantName || 'Delfood'; });
    document.querySelectorAll('[data-opening-hours]').forEach(el => { el.textContent = (s.openingTime || '10:00 AM') + ' - ' + (s.closingTime || '10:00 PM'); });
    [['facebookLink','facebook'],['instagramLink','instagram'],['twitterLink','twitter']].forEach(([key,name]) => document.querySelectorAll('[data-social="'+name+'"]').forEach(a => { a.href = s[key] || '#'; }));
    
    // Process map iframe
    var mapUrl = s.googleMapsEmbed || '';
    var iframeMatch = String(mapUrl).match(/src=["']([^"']+)["']/i);
    if (iframeMatch) mapUrl = iframeMatch[1];
    document.querySelectorAll('[data-map-frame]').forEach(frame => {
      if (mapUrl) {
        frame.src = mapUrl;
        frame.style.display = 'block';
      } else {
        frame.style.display = 'none';
      }
    });

    const imageKeys = [
      'heroImage1', 'heroImage1Secondary', 'heroImage2', 'heroImage2Secondary',
      'aboutImage1', 'aboutImage2', 'bookingSideImage',
      'menuHeaderImage', 'galleryHeaderImage', 'contactHeaderImage'
    ];
    imageKeys.forEach(key => document.querySelectorAll('[data-home-image="'+key+'"]').forEach(img => { if (s[key]) img.src = s[key]; }));
    if (s.heroImage1) document.documentElement.style.setProperty('--hero-bg', 'url("' + s.heroImage1 + '")');
  } catch (err) { console.warn('Settings unavailable', err); }
}
document.addEventListener('DOMContentLoaded', loadSiteSettings);
