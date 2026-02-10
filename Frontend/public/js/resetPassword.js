document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('#resetPasswordForm');
  const passwordInput = document.querySelector('input[name="newPassword"]');
  const banner = document.querySelector('#notificationBanner');
  const bannerMsg = document.querySelector('#bannerMessage');

  const showBanner = (msg) => {
    if (!banner || !bannerMsg) return;
    bannerMsg.textContent = msg;
    banner.classList.add('show');
    setTimeout(() => banner.classList.remove('show'), 4000);
  };

  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');

  if (!token) {
    showBanner('Missing reset token. Please request a new reset link.');
    form?.querySelector('button[type="submit"]')?.setAttribute('disabled', 'true');
    return;
  }

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const newPassword = passwordInput?.value || '';
    if (newPassword.length < 8) {
      showBanner('Password must be at least 8 characters long.');
      return;
    }

    try {
      const res = await fetch('/api/auth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        showBanner('Password updated. Redirecting to sign in...');
        setTimeout(() => {
          window.location.href = '/views/auth.html';
        }, 1200);
      } else {
        showBanner(data.error || 'Reset failed. Please request a new link.');
      }
    } catch (err) {
      showBanner('Server connection lost. Try again.');
    }
  });
});
