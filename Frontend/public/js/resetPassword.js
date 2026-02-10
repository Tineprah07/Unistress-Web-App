document.addEventListener('DOMContentLoaded', () => {
    const resetForm = document.getElementById('resetPasswordForm');
    const passwordInput = document.getElementById('resetPasswordInput');
    const toggleIcon = document.getElementById('toggleResetPassword');
    const banner = document.getElementById('notificationBanner');
    const bannerMessage = document.getElementById('bannerMessage');

    // 1. Show Notifications
    const showBanner = (msg, type = 'error') => {
        banner.className = `notification-banner ${type} show`;
        bannerMessage.textContent = msg;
        setTimeout(() => banner.classList.remove('show'), 4000);
    };

    // 2. Toggle Password Visibility
    toggleIcon?.addEventListener('click', () => {
        const type = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = type;
        toggleIcon.classList.toggle('fa-eye');
        toggleIcon.classList.toggle('fa-eye-slash');
    });

    // 3. Extract Token from URL (#reset?token=...)
    const getUrlToken = () => {
        const hash = window.location.hash;
        if (!hash.includes('token=')) return null;
        return new URLSearchParams(hash.split('?')[1]).get('token');
    };

    // 4. Submit New Password
    resetForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const token = getUrlToken();
        const newPassword = passwordInput.value;

        if (!token) {
            showBanner('Invalid reset link. Please request a new one.');
            return;
        }

        try {
            const response = await fetch('/api/auth/reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword })
            });

            const data = await response.json();

            if (response.ok) {
                showBanner('Password updated successfully! Redirecting...', 'success');
                setTimeout(() => window.location.href = '/views/auth.html', 2000);
            } else {
                showBanner(data.error || 'Failed to reset password.');
            }
        } catch (err) {
            showBanner('Network error. Please try again.');
        }
    });
});