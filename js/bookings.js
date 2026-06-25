document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('[data-booking-form]'); if (!form) return;
  const status = form.querySelector('[data-booking-status]');
  form.addEventListener('submit', async (event) => {
    event.preventDefault(); status.textContent = 'Sending booking...';
    const body = Object.fromEntries(new FormData(form).entries());
    try {
      if (!window.App) throw new Error('App helper not loaded.');
      await window.App.addBooking(body);
      form.reset();
      status.textContent = 'Booking request saved. We will contact you soon.';
    } catch (err) {
      status.textContent = err.message || 'Could not save booking.';
    }
  });
});
