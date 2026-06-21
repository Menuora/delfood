const express = require('express');
const session = require('express-session');
const fileUpload = require('express-fileupload');
const cloudinary = require('cloudinary').v2;
const fs = require('fs/promises');
const path = require('path');

const app = express();
const dataFile = path.join(process.cwd(), 'data', 'db.json');
const cloudConfigured = Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

if (cloudConfigured) {
  cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET });
}

const defaults = {
  bookings: [],
  images: [],
  settings: {
    restaurantName: 'Delfood', facebookLink: '', instagramLink: '', twitterLink: '', googleMapsEmbed: '', openingTime: '10:00 AM', closingTime: '10:00 PM'
  },
  homepageImages: {
    heroImage1: 'images/slider-img1.png', heroImage1Secondary: 'images/slider-img2.png', heroImage2: 'images/slider-img3.png', heroImage2Secondary: 'images/slider-img4.png', aboutImage1: 'images/about-img.jpg', aboutImage2: 'images/r1.jpg', bookingSideImage: 'images/app-bg.png', menuHeaderImage: 'images/hero-bg.jpg', galleryHeaderImage: 'images/hero-bg.jpg', contactHeaderImage: 'images/hero-bg.jpg'
  }
};

app.use(express.json({ limit: '1mb' }));
app.use(fileUpload({ limits: { fileSize: 10 * 1024 * 1024 } }));
app.use(session({ name: 'delfood.sid', secret: process.env.SESSION_SECRET || 'dev-only-change-me', resave: false, saveUninitialized: false, cookie: { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 1000 * 60 * 60 * 8 } }));

function cleanMapInput(value = '') {
  const match = String(value).match(/src=["']([^"']+)["']/i);
  return match ? match[1] : String(value).trim();
}
function mergeDb(db) {
  return { ...defaults, ...db, settings: { ...defaults.settings, ...(db.settings || {}) }, homepageImages: { ...defaults.homepageImages, ...(db.homepageImages || {}) } };
}
async function readLocal() {
  try { return mergeDb(JSON.parse(await fs.readFile(dataFile, 'utf8'))); } catch { return mergeDb({}); }
}
async function writeLocal(db) {
  await fs.mkdir(path.dirname(dataFile), { recursive: true });
  await fs.writeFile(dataFile, JSON.stringify(db, null, 2));
}
async function readDb() {
  if (!cloudConfigured) return readLocal();
  try {
    const url = cloudinary.url('delfood/data', { resource_type: 'raw', type: 'upload', secure: true, sign_url: true, version: Math.floor(Date.now() / 1000) });
    const res = await fetch(url);
    if (!res.ok) return readLocal();
    return mergeDb(await res.json());
  } catch { return readLocal(); }
}
async function writeDb(db) {
  const finalDb = mergeDb(db);
  await writeLocal(finalDb);
  if (cloudConfigured) {
    await cloudinary.uploader.upload('data:application/json;base64,' + Buffer.from(JSON.stringify(finalDb, null, 2)).toString('base64'), { resource_type: 'raw', public_id: 'delfood/data', overwrite: true, invalidate: true });
  }
  return finalDb;
}
function requireAdmin(req, res, next) { if (req.session && req.session.admin) return next(); res.status(401).json({ error: 'Login required' }); }

app.get('/settings', async (req, res) => { const db = await readDb(); res.json({ settings: db.settings, homepageImages: db.homepageImages }); });
app.get('/images', async (req, res) => { const db = await readDb(); res.json({ images: db.images }); });
app.post('/bookings', async (req, res) => {
  const { name, phone, email = '', date, time, guests, message = '' } = req.body || {};
  if (!name || !phone || !date || !time || !guests) return res.status(400).json({ error: 'Name, phone, date, time, and guests are required.' });
  const db = await readDb();
  db.bookings.unshift({ id: Date.now().toString(36), name, phone, email, date, time, guests, message, createdAt: new Date().toISOString() });
  await writeDb(db);
  res.status(201).json({ ok: true });
});
app.post('/admin/login', (req, res) => {
  if (req.body?.username === process.env.ADMIN_USERNAME && req.body?.password === process.env.ADMIN_PASSWORD) { req.session.admin = true; return res.json({ ok: true }); }
  res.status(401).json({ error: 'Invalid login' });
});
app.post('/admin/logout', requireAdmin, (req, res) => req.session.destroy(() => res.json({ ok: true })));
app.get('/admin/me', (req, res) => res.json({ authenticated: Boolean(req.session && req.session.admin) }));
app.get('/admin/bookings', requireAdmin, async (req, res) => { const db = await readDb(); res.json({ bookings: db.bookings }); });
app.delete('/admin/bookings/:id', requireAdmin, async (req, res) => { const db = await readDb(); db.bookings = db.bookings.filter(b => b.id !== req.params.id); await writeDb(db); res.json({ ok: true }); });
app.put('/admin/settings', requireAdmin, async (req, res) => { const db = await readDb(); db.settings = { ...db.settings, ...req.body, googleMapsEmbed: cleanMapInput(req.body.googleMapsEmbed) }; await writeDb(db); res.json({ settings: db.settings }); });
app.put('/admin/homepage-images', requireAdmin, async (req, res) => { const db = await readDb(); db.homepageImages = { ...db.homepageImages, ...req.body }; await writeDb(db); res.json({ homepageImages: db.homepageImages }); });
app.post('/admin/images', requireAdmin, async (req, res) => {
  const title = req.body.title || 'Menu image'; const type = req.body.type === 'item' ? 'item' : 'menu'; let imageUrl = req.body.imageUrl;
  if (req.files?.image) {
    if (!cloudConfigured) return res.status(400).json({ error: 'Cloudinary credentials are required for file uploads.' });
    const upload = await cloudinary.uploader.upload('data:' + req.files.image.mimetype + ';base64,' + req.files.image.data.toString('base64'), { folder: 'delfood/menu' });
    imageUrl = upload.secure_url;
  }
  if (!imageUrl) return res.status(400).json({ error: 'Upload a file or paste an image URL.' });
  const db = await readDb(); const image = { id: Date.now().toString(36), title, type, imageUrl, createdAt: new Date().toISOString() };
  db.images.unshift(image); await writeDb(db); res.status(201).json({ image });
});
app.delete('/admin/images/:id', requireAdmin, async (req, res) => { const db = await readDb(); db.images = db.images.filter(i => i.id !== req.params.id); await writeDb(db); res.json({ ok: true }); });

module.exports = app;
