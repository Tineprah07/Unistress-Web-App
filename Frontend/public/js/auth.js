document.addEventListener('DOMContentLoaded', () => {
  // =========================
  // Constants
  // =========================
  const TAB_KEY = 'unistress_auth_tab'; // 'login' | 'register' | 'forgot'
  const FORGOT_EMAIL_KEY = 'unistress_forgot_email';

  // =========================
  // Elements
  // =========================
  const banner = document.getElementById('notificationBanner');
  const bannerMsg = document.getElementById('bannerMessage');
  const bannerIcon = document.getElementById('bannerIcon');

  const imgSlides = document.querySelectorAll('.img-slide');
  const textSlides = document.querySelectorAll('.text-slide');
  const dots = document.querySelectorAll('.dot');
  const carousel = document.querySelector('.carousel-container');

  const tabLogin = document.querySelector('#tabLogin');
  const tabRegister = document.querySelector('#tabRegister');
  const authBanner = document.querySelector('.auth-banner');

  const loginForm = document.querySelector('#loginForm');
  const registerForm = document.querySelector('#registerForm');
  const forgotForm = document.querySelector('#forgotForm');
  const resetPasswordForm = document.querySelector('#resetPasswordForm');

  const authTitle = document.querySelector('#authTitle');
  const authDescription = document.querySelector('.auth-description');
  const authSubtitle = document.querySelector('#authSubtitle');

  const forgotLink = document.querySelector('#forgotPasswordLink');
  const forgotSuccessTemplate = document.getElementById('forgotSuccessTemplate');

  const mobileGetStartedBtn = document.querySelector('#mobileGetStarted');

  const regPasswordInput = document.getElementById('registerPasswordInput');
  const hint = document.querySelector('.password-hint');

  const resetPassInput = document.getElementById('resetPasswordInput');
  const resetHint = document.getElementById('resetPasswordHint');

  // =========================
  // Helpers
  // =========================
  const showBanner = (message, type = 'error') => {
    if (!banner || !bannerMsg || !bannerIcon) return;

    banner.className = `notification-banner ${type} show`;
    bannerMsg.textContent = message;

    bannerIcon.className =
      type === 'success'
        ? 'fa-solid fa-circle-check'
        : 'fa-solid fa-circle-exclamation';

    setTimeout(() => banner.classList.remove('show'), 4000);
  };

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const setTabActive = (tab) => {
    tabLogin?.classList.remove('active');
    tabRegister?.classList.remove('active');

    if (tab === 'login') tabLogin?.classList.add('active');
    if (tab === 'register') tabRegister?.classList.add('active');
  };

  const hideAllViews = () => {
    if (loginForm) loginForm.style.display = 'none';
    if (registerForm) registerForm.style.display = 'none';
    if (forgotForm) forgotForm.style.display = 'none';
    if (resetPasswordForm) resetPasswordForm.style.display = 'none';
  };

  const showAuthBanner = (show) => {
    if (!authBanner) return;
    authBanner.style.display = show ? 'flex' : 'none';
  };

  const focusFirstInput = (formEl) => {
    const first = formEl?.querySelector('input, button, a, [tabindex]:not([tabindex="-1"])');
    first?.focus?.();
  };

  const setBtnLoading = (btn, loadingText) => {
    if (!btn) return () => {};
    const originalText = btn.textContent;
    btn.textContent = loadingText;
    btn.disabled = true;

    return () => {
      btn.textContent = originalText;
      btn.disabled = false;
    };
  };

  const getResetTokenFromUrl = () => {
    const hashQuery = window.location.hash.includes('?') ? window.location.hash.split('?')[1] : '';
    const urlQuery = window.location.search?.slice(1) || '';
    const params = new URLSearchParams(hashQuery || urlQuery);
    return params.get('token');
  };

  // =========================
  // Carousel (images + text)
  // =========================
  let currentIndex = 0;
  const intervalTime = 5000;
  let slideInterval;

  function changeSlide(index) {
    [imgSlides, textSlides, dots].forEach((group) => {
      group.forEach((el) => el.classList.remove('active'));
    });

    if (imgSlides[index]) imgSlides[index].classList.add('active');
    if (textSlides[index]) textSlides[index].classList.add('active');
    if (dots[index]) dots[index].classList.add('active');

    currentIndex = index;
  }

  function nextSlide() {
    const nextIndex = (currentIndex + 1) % imgSlides.length;
    changeSlide(nextIndex);
  }

  function startTimer() {
    if (slideInterval) clearInterval(slideInterval);
    slideInterval = setInterval(nextSlide, intervalTime);
  }

  function stopTimer() {
    if (slideInterval) clearInterval(slideInterval);
  }

  function setInitialCarouselState() {
    if (!imgSlides.length) return;
    changeSlide(0);
    startTimer();
  }

  const hasLottie = document.querySelector('dotlottie-player');
  if (hasLottie) {
    window.addEventListener('load', setInitialCarouselState, { once: true });
  } else {
    setInitialCarouselState();
  }

  if (carousel) {
    carousel.addEventListener('mouseenter', stopTimer);
    carousel.addEventListener('mouseleave', startTimer);
  }

  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      changeSlide(index);
      startTimer();
    });
  });

  // =========================
  // Password toggle
  // =========================
  function setupPasswordToggle(toggleSelector, inputSelector) {
    const toggleIcon = document.querySelector(toggleSelector);
    const passwordInput = document.querySelector(inputSelector);

    if (!toggleIcon || !passwordInput) return;

    function syncIcon() {
      const isHidden = passwordInput.type === 'password';
      toggleIcon.classList.toggle('fa-eye', isHidden);
      toggleIcon.classList.toggle('fa-eye-slash', !isHidden);
      toggleIcon.setAttribute('aria-label', isHidden ? 'Show password' : 'Hide password');
    }

    function toggleVisibility() {
      passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
      syncIcon();
    }

    syncIcon();
    toggleIcon.addEventListener('click', toggleVisibility);

    toggleIcon.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleVisibility();
      }
    });
  }

  setupPasswordToggle('#togglePassword', '#passwordInput');
  setupPasswordToggle('#toggleRegisterPassword', '#registerPasswordInput');
  setupPasswordToggle('#toggleResetPassword', '#resetPasswordInput');

  // =========================
  // Register password strength
  // =========================
  const checkStrength = (password) => {
    let score = 0;
    if (!password) return { label: 'Short', color: '#6b7280' };

    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (password.length < 8) return { label: 'Weak (Too short)', color: '#dc2626' };
    if (score <= 2) return { label: 'Fair', color: '#f59e0b' };
    if (score <= 4) return { label: 'Strong', color: '#16a34a' };
    return { label: 'Very strong', color: '#1d4ed8' };
  };

  regPasswordInput?.addEventListener('input', (e) => {
    const strength = checkStrength(e.target.value);
    if (!hint) return;

    hint.style.color = strength.color;
    hint.style.fontWeight = '600';
    hint.textContent = `Strength: ${strength.label}`;
  });

  resetPassInput?.addEventListener('input', (e) => {
    const strength = checkStrength(e.target.value);
    if (!resetHint) return;

    resetHint.style.color = strength.color;
    resetHint.style.fontWeight = '600';
    resetHint.textContent = `Strength: ${strength.label}`;
  });

  // =========================
  // Inline links binder (safe after innerHTML changes)
  // =========================
  function bindInlineLinks() {
    const inlineRegister = document.querySelector('#inlineRegister');
    const inlineLogin = document.querySelector('#inlineLogin');

    inlineRegister?.addEventListener('click', (e) => {
      e.preventDefault();
      showRegister();
    });

    inlineLogin?.addEventListener('click', (e) => {
      e.preventDefault();
      showLogin();
    });
  }

  // =========================
  // Views
  // =========================
  function showLogin() {
    hideAllViews();
    showAuthBanner(true);
    setTabActive('login');

    if (loginForm) loginForm.style.display = 'grid';

    if (authTitle) authTitle.textContent = 'Welcome to UniStress';
    if (authDescription) {
      authDescription.textContent =
        'Your companion for academic balance. Track your habits, stay energised, and master your student life.';
    }
    if (authSubtitle) {
      authSubtitle.innerHTML =
        'Don’t have an account? <a class="link" href="#" id="inlineRegister">Create a new account</a>';
    }

    localStorage.setItem(TAB_KEY, 'login');
    bindInlineLinks();
    focusFirstInput(loginForm);
  }

  function showRegister() {
    hideAllViews();
    showAuthBanner(true);
    setTabActive('register');

    if (registerForm) registerForm.style.display = 'grid';

    if (authTitle) authTitle.textContent = 'Join UniStress';
    if (authDescription) {
      authDescription.textContent =
        'Create your account today to start tracking your daily wellbeing, setting goals, and staying consistent.';
    }
    if (authSubtitle) {
      authSubtitle.innerHTML =
        'Already have an account? <a class="link" href="#" id="inlineLogin">Sign in here</a>';
    }

    localStorage.setItem(TAB_KEY, 'register');
    bindInlineLinks();
    focusFirstInput(registerForm);
  }

  function resetForgotToForm() {
    if (!forgotForm) return;
    forgotForm.querySelector('.success-state')?.remove();
    const baseEls = forgotForm.querySelectorAll('.field, button[type="submit"], .form-footer');
    baseEls.forEach((el) => (el.style.display = ''));

    const submitBtn = forgotForm.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Reset Link';
    }
  }

  function showForgot() {
    hideAllViews();
    showAuthBanner(false);
    if (forgotForm) forgotForm.style.display = 'grid';
    resetForgotToForm();

    if (authTitle) authTitle.textContent = 'Recover Account';
    if (authDescription) {
      authDescription.textContent =
        'Enter your email address and we will send a secure link to reset your password.';
    }
    if (authSubtitle) {
      authSubtitle.innerHTML =
        'Remembered your password? <a class="link" href="#" id="inlineLogin">Back to sign in</a>';
    }

    localStorage.setItem(TAB_KEY, 'forgot');
    bindInlineLinks();

    focusFirstInput(forgotForm);
  }

  function showResetView() {
    hideAllViews();
    showAuthBanner(false);
    if (resetPasswordForm) resetPasswordForm.style.display = 'grid';

    if (authTitle) authTitle.textContent = 'Set New Password';
    if (authDescription) {
      authDescription.textContent = 'Choose a strong, unique password to secure your account.';
    }
    if (authSubtitle) authSubtitle.innerHTML = '';

    focusFirstInput(resetPasswordForm);
  }

  // =========================
  // Tabs + links
  // =========================
  tabLogin?.addEventListener('click', (e) => {
    e.preventDefault();
    showLogin();
  });

  tabRegister?.addEventListener('click', (e) => {
    e.preventDefault();
    showRegister();
  });

  forgotLink?.addEventListener('click', (e) => {
    e.preventDefault();
    showForgot();
  });

  // Back to login from Forgot Form
  document.querySelector('#backToLogin')?.addEventListener('click', (e) => {
    e.preventDefault();
    showLogin();
  });

  // Back to login from Reset Form
  document.querySelector('#backToLoginFromReset')?.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.hash = ''; // Clear the #reset token
    showLogin();
  });

  // This ensures the links like "Sign in here" or "Create account" 
  // embedded in paragraphs work correctly.
  bindInlineLinks();

  // =========================
  // Persist view on refresh
  // =========================
  // 1. Clear the saved tab preference immediately on load
  localStorage.removeItem(TAB_KEY);

  // 2. Check if we are specifically here to reset a password via a link
  if (window.location.hash.startsWith('#reset')) {
    showResetView();
  } else {
    // 3. For every other case (refresh, new open, etc.), always show Login
    showLogin();
    // Force the hash to be empty so mobile views also reset
    if (window.location.hash === '#auth') {
       window.location.hash = '';
    }
  }

  // =========================
  // Submission Handlers
  // =========================

  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const emailInput = loginForm.querySelector('input[name="email"]');
    const passwordInput = loginForm.querySelector('input[name="password"]');

    const email = emailInput?.value?.trim();
    const password = passwordInput?.value;

    if (!email || !password) {
      showBanner('Please fill in your email and password.');
      return;
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        // Direct redirect without waiting for UI changes
        window.location.href = '/views/homepage.html';
      } else {
        showBanner(data.error || 'Invalid email or password.');
      }
    } catch (error) {
      showBanner('Server connection lost.');
    }
  });

  registerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = registerForm.querySelector('input[name="name"]')?.value?.trim();
    const email = registerForm.querySelector('input[name="email"]')?.value?.trim();
    const password = regPasswordInput?.value;

    if (!name || !email || !password) {
      showBanner('Please fill in all fields.');
      return;
    }

    if (password.length < 8) {
      showBanner('Password must be at least 8 characters long.');
      return;
    }

    const submitBtn = registerForm.querySelector('button[type="submit"]');
    const restoreBtn = setBtnLoading(submitBtn, 'Creating account...');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        window.location.href = '/views/homepage.html';
      } else {
        showBanner(data.error || 'Registration failed.');
        restoreBtn();
      }
    } catch (error) {
      showBanner('Unable to connect to the server.');
      restoreBtn();
    }
  });

  forgotForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const emailInput = forgotForm.querySelector('input[name="email"]');
    const submitBtn = forgotForm.querySelector('button[type="submit"]');
    const email = emailInput?.value?.trim();

    if (!email || !isValidEmail(email)) {
      showBanner('Please enter a valid email address.');
      return;
    }


    const restoreBtn = setBtnLoading(submitBtn, 'Sending...');

    try {
      const response = await fetch('/api/auth/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        const baseEls = forgotForm.querySelectorAll('.field, button[type="submit"], .form-footer');
        baseEls.forEach((el) => (el.style.display = 'none'));

        if (forgotSuccessTemplate) {
          const clone = forgotSuccessTemplate.content.cloneNode(true);

          const emailDisplay = clone.querySelector('.user-email-display');
          if (emailDisplay) emailDisplay.textContent = email;

          clone.querySelector('#backToLoginBtn')?.addEventListener('click', () => {
            localStorage.removeItem(FORGOT_EMAIL_KEY);
            showLogin();
          });

          clone.querySelector('#retryForgot')?.addEventListener('click', (ev) => {
            ev.preventDefault();
            resetForgotToForm();
            focusFirstInput(forgotForm);
          });

          forgotForm.appendChild(clone);
        }
      } else {
        const data = await response.json().catch(() => ({}));
        showBanner(data.error || 'Failed to send reset link.');
        restoreBtn();
      }
    } catch (error) {
      showBanner('Something went wrong. Please try again.');
      restoreBtn();
    }
  });

  resetPasswordForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const newPassword = document.getElementById('resetPasswordInput')?.value;
    const submitBtn = resetPasswordForm.querySelector('button[type="submit"]');

    if (!newPassword || newPassword.length < 8) {
      showBanner('Password must be at least 8 characters long.');
      return;
    }

    const token = getResetTokenFromUrl();
    if (!token) {
      showBanner('Invalid or missing reset token.');
      return;
    }

    try {
      const response = await fetch('/api/auth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        setTimeout(() => {
          window.location.hash = '';
          showLogin();
        }, 500);
      } else {
        showBanner(data.error || 'Failed to reset password.');
        restoreBtn();
      }
    } catch (error) {
      showBanner('Server connection lost.');
      restoreBtn();
    }
  });

  // New function to show the Reset view inside auth.html
  function showResetView() {
      hideAllViews(); // This function already exists in your auth.js
      showAuthBanner(false); // Hide the Login/Register toggle
      
      const resetPasswordForm = document.querySelector('#resetPasswordForm');
      if (resetPasswordForm) resetPasswordForm.style.display = 'grid';

      if (authTitle) authTitle.textContent = 'Set New Password';
      if (authDescription) {
          authDescription.textContent = 'Choose a strong, unique password to secure your account.';
      }
      if (authSubtitle) authSubtitle.innerHTML = '';
  }

// Logic to check for the token on page load
const hash = window.location.hash;
if (hash.startsWith('#reset')) {
    showResetView();
}

  // =========================
  // Mobile: Get Started flow
  // =========================
  mobileGetStartedBtn?.addEventListener('click', () => {
    document.body.classList.add('mobile-auth-open');
    window.location.hash = 'auth';
  });

  window.addEventListener('hashchange', () => {
    if (window.location.hash.startsWith('#reset')) {
      showResetView();
    } else if (window.location.hash !== '#auth') {
      document.body.classList.remove('mobile-auth-open');
    }
  });
});
