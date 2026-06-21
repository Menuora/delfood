# Delfood Sellable Hotel / Restaurant Template

This version runs as a Vercel-ready restaurant website with a private admin dashboard, booking storage, Cloudinary image uploads, public gallery, and editable website settings.

## Local setup

1. Install dependencies:

   npm install

2. Copy the environment file:

   copy .env.example .env

3. Fill these values in .env:

   ADMIN_USERNAME
   ADMIN_PASSWORD
   SESSION_SECRET
   CLOUDINARY_CLOUD_NAME
   CLOUDINARY_API_KEY
   CLOUDINARY_API_SECRET

4. Run locally:

   npm run dev

5. Open:

   http://localhost:3000
   http://localhost:3000/admin

The local dev server is plain Node/Express and does not ask for Vercel login.

## Deploy to Vercel

1. Push this folder to GitHub.
2. Import the project in Vercel.
3. Add the same environment variables from .env.example in Vercel Project Settings.
4. Deploy.
5. Give the hotel owner the /admin URL and the admin username/password.

## Notes

- Public navigation does not show admin. Admin is only available by manually opening /admin.
- Bookings are shown in the admin dashboard.
- Cloudinary is used for image uploads and for syncing the small JSON data store in production.
- If Cloudinary credentials are missing locally, pasted image URLs still work, but file upload requires Cloudinary credentials.
- GitHub Pages can host only the static pages. Use Vercel for bookings, admin login, uploads, and editable settings.

## Checks

Run syntax checks:

   npm run check

Run route smoke test:

   npm run smoke
