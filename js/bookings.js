document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('[data-booking-form]'); if (!form) return;
  const status = form.querySelector('[data-booking-status]');
  form.addEventListener('submit', async (event) => {
    event.preventDefault(); status.textContent = 'Sending booking...';
    const body = Object.fromEntries(new FormData(form).entries());
    const res = await fetch('/api/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { status.textContent = data.error || 'Could not save booking.'; return; }
    form.reset(); status.textContent = 'Booking request saved. We will contact you soon.';
  });
});
