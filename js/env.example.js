// js/env.example.js - RENAME TO env.js AND FILL IN CREDENTIALS FOR YOUR CLIENT
const ENV = {
  // ── Firebase Configuration ──────────────────────────────
  // Get these from Firebase Console -> Project Settings -> General -> Your Apps -> Web App
  firebase: {
    apiKey:            "YOUR_FIREBASE_API_KEY",
    authDomain:        "YOUR_PROJECT.firebaseapp.com",
    projectId:         "YOUR_PROJECT_ID",
    storageBucket:     "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId:             "YOUR_APP_ID"
  },
  // ── Cloudinary Configuration ────────────────────────────
  // Get these from Cloudinary Console. Ensure you have an Unsigned Upload Preset created.
  cloudinary: {
    cloudName:         "YOUR_CLOUD_NAME",
    uploadPreset:      "YOUR_UNSIGNED_PRESET"
  },
  // ── Default Admin User (Auto-Created on first login if auth is empty) ──
  admin: {
    email:             "admin@yourhotel.com",
    password:          "admin123"
  }
};
