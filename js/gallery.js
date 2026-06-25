document.addEventListener('DOMContentLoaded', async () => {
  const menu = document.querySelector('[data-menu-images]'); const items = document.querySelector('[data-item-images]'); if (!menu || !items) return;
  const render = (target, rows) => { target.innerHTML = rows.length ? rows.map(img => '<div class="col-sm-6 col-md-4"><div class="gallery-card"><img src="'+img.imageUrl+'" alt="'+(img.title||'Menu image')+'"><h5>'+ (img.title||'Menu image') +'</h5></div></div>').join('') : '<div class="col-12 text-center"><p>No images have been added yet.</p></div>'; };
  try {
    if (!window.App) throw new Error('App helper not loaded.');
    const images = await window.App.getImages();
    render(menu, images.filter(i => i.type === 'menu'));
    render(items, images.filter(i => i.type === 'item'));
  } catch {
    render(menu, []);
    render(items, []);
  }
});
