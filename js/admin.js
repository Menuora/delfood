(function () {
  'use strict';

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
    try { if (window.App) await window.App.logout(); } catch (err) {}
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

  function bindFormValues(form, data) {
    Object.entries(data || {}).forEach(([k, v]) => {
      const el = form.elements[k];
      if (el) el.value = v || '';
    });
  }

  function escapeHtml(value = '') {
    return String(value).replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[char]));
  }

  async function refreshAdmin() {
    if (!window.App || !window.App.isConfigured) return;

    // Load Settings
    try {
      const settings = await window.App.getSettings();
      
      // Update header values on the admin dashboard
      document.querySelectorAll('[data-restaurant-name]').forEach(el => {
        el.textContent = settings.restaurantName || 'Delfood';
      });
      document.querySelectorAll('[data-opening-hours]').forEach(el => {
        el.textContent = (settings.openingTime || '10:00 AM') + ' - ' + (settings.closingTime || '10:00 PM');
      });

      // Bind settings & homepage images form values
      bindFormValues($('#settingsForm'), settings);
      bindFormValues($('#imagesForm'), settings);
    } catch (err) {
      console.error('Error loading settings:', err);
    }

    // Load Bookings
    try {
      const bookings = await window.App.getBookings();
      $('#bookingCount').textContent = bookings.length;
      $('#bookings').innerHTML = bookings.map(b => `
        <tr>
          <td><strong>${escapeHtml(b.date)}</strong><span>${escapeHtml(b.time)}</span></td>
          <td><strong>${escapeHtml(b.name)}</strong><span>${escapeHtml(b.email || 'No email')}</span></td>
          <td>${escapeHtml(b.phone)}</td>
          <td><span class="admin-pill">${escapeHtml(b.guests)}</span></td>
          <td>${escapeHtml(b.message || 'No message')}</td>
          <td><button data-del-booking="${escapeHtml(b.id)}" class="btn btn-sm admin-danger">Delete</button></td>
        </tr>
      `).join('') || `
        <tr>
          <td colspan="6">
            <div class="admin-empty">No bookings yet. New table requests will appear here.</div>
          </td>
        </tr>
      `;
    } catch (err) {
      console.error('Error loading bookings:', err);
      $('#bookings').innerHTML = `<tr><td colspan="6"><div class="admin-error">Failed to load bookings: ${escapeHtml(err.message)}</div></td></tr>`;
    }

    // Load Images
    try {
      const images = await window.App.getImages();
      $('#imageCount').textContent = images.length;
      $('#adminImages').innerHTML = images.map(i => `
        <div class="admin-thumb">
          <img src="${escapeHtml(i.imageUrl)}" alt="">
          <div>
            <strong>${escapeHtml(i.title || 'Untitled')}</strong>
            <span>${escapeHtml(i.type === 'menu' ? 'Full menu image' : 'Item image')}</span>
          </div>
          <button data-del-image="${escapeHtml(i.id)}" class="btn btn-sm admin-danger">Delete</button>
        </div>
      `).join('') || '<div class="admin-empty">No gallery images yet. Upload a file or paste a Cloudinary URL.</div>';
    } catch (err) {
      console.error('Error loading images:', err);
      $('#adminImages').innerHTML = `<div class="admin-error">Failed to load images: ${escapeHtml(err.message)}</div>`;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    // ── Login Form Submission ──
    $('#loginForm').addEventListener('submit', async e => {
      e.preventDefault();
      $('#loginStatus').textContent = 'Authenticating...';
      $('#loginStatus').className = 'admin-status';
      const email = e.target.elements.email.value;
      const password = e.target.elements.password.value;
      try {
        await window.App.login(email, password);
        $('#loginStatus').textContent = '';
      } catch (err) {
        $('#loginStatus').textContent = err.message;
        $('#loginStatus').className = 'admin-status text-danger';
      }
    });

    // ── Logout Button ──
    $('#logoutBtn').addEventListener('click', async () => {
      if (!window.confirm('Logout from admin dashboard?')) return;
      allowingAdminLeave = true;
      try {
        await window.App.logout();
      } catch (err) {
        console.error('Error logging out:', err);
      }
      allowingAdminLeave = false;
    });

    // ── Save Settings Form ──
    $('#settingsForm').addEventListener('submit', async e => {
      e.preventDefault();
      $('#settingsStatus').textContent = 'Saving settings...';
      $('#settingsStatus').className = 'admin-status';
      try {
        const formData = Object.fromEntries(new FormData(e.target).entries());
        await window.App.saveSettings(formData);
        $('#settingsStatus').textContent = 'Settings saved.';
        $('#settingsStatus').className = 'admin-status text-success';
        refreshAdmin();
      } catch (err) {
        $('#settingsStatus').textContent = err.message;
        $('#settingsStatus').className = 'admin-status text-danger';
      }
    });

    // ── Save Homepage Images Form ──
    $('#imagesForm').addEventListener('submit', async e => {
      e.preventDefault();
      $('#homeImagesStatus').textContent = 'Saving images...';
      $('#homeImagesStatus').className = 'admin-status';
      try {
        const formData = Object.fromEntries(new FormData(e.target).entries());
        await window.App.saveSettings(formData);
        $('#homeImagesStatus').textContent = 'Homepage images saved.';
        $('#homeImagesStatus').className = 'admin-status text-success';
        refreshAdmin();
      } catch (err) {
        $('#homeImagesStatus').textContent = err.message;
        $('#homeImagesStatus').className = 'admin-status text-danger';
      }
    });

    // ── Upload/Save New Image Form ──
    $('#uploadForm').addEventListener('submit', async e => {
      e.preventDefault();
      $('#uploadStatus').textContent = 'Uploading...';
      $('#uploadStatus').className = 'admin-status';
      try {
        const title = e.target.elements.title.value;
        const type = e.target.elements.type.value;
        let imageUrl = e.target.elements.imageUrl.value.trim();
        const file = e.target.elements.image.files[0];

        if (file) {
          imageUrl = await window.App.uploadImageToCloudinary(file);
        }

        if (!imageUrl) {
          throw new Error('Please select an image file or paste an image URL.');
        }

        await window.App.addImageMetadata({
          title,
          type,
          imageUrl
        });

        e.target.reset();
        $('#uploadStatus').textContent = 'Image saved successfully.';
        $('#uploadStatus').className = 'admin-status text-success';
        refreshAdmin();
      } catch (err) {
        $('#uploadStatus').textContent = err.message;
        $('#uploadStatus').className = 'admin-status text-danger';
      }
    });

    // ── Change Password Form ──
    $('#changePasswordForm').addEventListener('submit', async e => {
      e.preventDefault();
      $('#changePasswordStatus').textContent = 'Changing password...';
      $('#changePasswordStatus').className = 'admin-status';
      const newPassword = e.target.elements.newPassword.value;
      if (!newPassword || newPassword.length < 6) {
        $('#changePasswordStatus').textContent = 'Password must be at least 6 characters.';
        $('#changePasswordStatus').className = 'admin-status text-danger';
        return;
      }
      try {
        await window.App.changePassword(newPassword);
        e.target.reset();
        $('#changePasswordStatus').textContent = 'Password changed successfully.';
        $('#changePasswordStatus').className = 'admin-status text-success';
      } catch (err) {
        $('#changePasswordStatus').textContent = err.message;
        $('#changePasswordStatus').className = 'admin-status text-danger';
      }
    });

    // ── Delete Actions (Bookings & Images) ──
    document.addEventListener('click', async e => {
      if (e.target.dataset.delBooking) {
        if (!window.confirm('Delete this booking request?')) return;
        const id = e.target.dataset.delBooking;
        try {
          e.target.disabled = true;
          e.target.textContent = '...';
          await window.App.deleteBooking(id);
          refreshAdmin();
        } catch (err) {
          alert('Failed to delete booking: ' + err.message);
          e.target.disabled = false;
          e.target.textContent = 'Delete';
        }
      }
      
      if (e.target.dataset.delImage) {
        if (!window.confirm('Delete this image?')) return;
        const id = e.target.dataset.delImage;
        try {
          e.target.disabled = true;
          e.target.textContent = '...';
          await window.App.deleteImageMetadata(id);
          refreshAdmin();
        } catch (err) {
          alert('Failed to delete image: ' + err.message);
          e.target.disabled = false;
          e.target.textContent = 'Delete';
        }
      }
    });

    // ── Auth State Change Listener ──
    if (window.App && window.App.isConfigured) {
      window.App.auth.onAuthStateChanged(user => {
        if (user) {
          adminAuthenticated = true;
          history.replaceState({ adminGuard: true }, '', location.href);
          $('#loginPanel').style.display = 'none';
          $('#dashboard').style.display = 'block';
          refreshAdmin();
        } else {
          adminAuthenticated = false;
          $('#loginPanel').style.display = 'block';
          $('#dashboard').style.display = 'none';
        }
      });
    } else {
      $('#loginStatus').textContent = 'Firebase is not configured. Please fill js/env.js first.';
      $('#loginStatus').className = 'admin-status text-danger';
    }
  });
})();
