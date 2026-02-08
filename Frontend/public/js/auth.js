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

  const authTitle = document.querySelector('#authTitle');
  const authDescription = document.querySelector('.auth-description');
  const authSubtitle = document.querySelector('#authSubtitle');

  const forgotLink = document.querySelector('#forgotPasswordLink');
  const forgotSuccessTemplate = document.getElementById('forgotSuccessTemplate');

  const mobileGetStartedBtn = document.querySelector('#mobileGetStarted');

  const regPasswordInput = document.getElementById('registerPasswordInput');
  const hint = document.querySelector('.password-hint');

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
    // for 'forgot' we leave both inactive
  };

  const hideAllViews = () => {
    if (loginForm) loginForm.style.display = 'none';
    if (registerForm) registerForm.style.display = 'none';
    if (forgotForm) forgotForm.style.display = 'none';
  };

  const showAuthBanner = (show) => {
    if (!authBanner) return;
    authBanner.style.display = show ? 'flex' : 'none';
  };

  const focusFirstInput = (formEl) => {
    const first = formEl?.querySelector('input, button, a, [tabindex]:not([tabindex="-1"])');
    first?.focus?.();
  };

  // =========================
  // Carousel (images + text)
  // =========================
  let currentIndex = 0;
  const intervalTime = 5000;
  let slideInterval;

  function changeSlide(index) {
    [imgSlides, textSlides, dots].forEach(group => {
      group.forEach(el => el.classList.remove('active'));
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

  // =========================
  // Register password strength (nice UX)
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

  // =========================
  // Inline links binder (re-bind after innerHTML updates)
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

    // Remove any previous success state
    forgotForm.querySelector('.success-state')?.remove();

    // Ensure base form controls are visible again
    const baseEls = forgotForm.querySelectorAll('.field, button[type="submit"], .form-footer');
    baseEls.forEach(el => (el.style.display = ''));

    // Reset submit button if needed
    const submitBtn = forgotForm.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Reset Link';
    }
  }

  function showForgot() {
    hideAllViews();
    showAuthBanner(false);
    setTabActive('forgot');

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

    // If they refreshed, keep the email they typed previously (nice UX)
    const savedEmail = localStorage.getItem(FORGOT_EMAIL_KEY);
    const emailInput = forgotForm?.querySelector('input[name="email"]');
    if (emailInput && savedEmail) emailInput.value = savedEmail;

    focusFirstInput(forgotForm);
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

  // Back link inside forgot form
  document.querySelector('#backToLogin')?.addEventListener('click', (e) => {
    e.preventDefault();
    showLogin();
  });

  // =========================
  // Persist view on refresh
  // =========================
  const savedTab = localStorage.getItem(TAB_KEY);
  if (savedTab === 'register') showRegister();
  else if (savedTab === 'forgot') showForgot();
  else showLogin();

  // =========================
  // Login submit (unchanged behaviour)
  // =========================
  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = loginForm.querySelector('input[name="email"]')?.value?.trim();
    const password = document.getElementById('passwordInput')?.value;

    if (!email || !password) {
      showBanner('Please fill in your email and password.');
      return;
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        window.location.href = '/views/homepage.html';
      } else {
        showBanner(data.error || 'Invalid email or password.');
      }
    } catch (error) {
      showBanner('Server connection lost.');
    }
  });

  // =========================
  // Register submit (unchanged behaviour)
  // =========================
  registerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = registerForm.querySelector('input[name="name"]')?.value?.trim();
    const email = registerForm.querySelector('input[name="email"]')?.value?.trim();
    const password = regPasswordInput?.value;

    if (!name || !email || !password) {
      showBanner('Please fill in all fields.');
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        window.location.href = '/views/homepage.html';
      } else {
        showBanner(data.error || 'Registration failed.');
      }
    } catch (error) {
      showBanner('Unable to connect to the server.');
    }
  });

  // =========================
  // Forgot submit (Sending... -> confirmation template)
  // =========================
  forgotForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const emailInput = forgotForm.querySelector('input[name="email"]');
    const submitBtn = forgotForm.querySelector('button[type="submit"]');

    const email = emailInput?.value?.trim();

    if (!email) {
      showBanner('Please enter your email address.');
      return;
    }

    if (!isValidEmail(email)) {
      showBanner('Please enter a valid email address.');
      return;
    }

    // Persist email so refresh keeps it
    localStorage.setItem(FORGOT_EMAIL_KEY, email);

    if (submitBtn) {
      submitBtn.textContent = 'Sending...';
      submitBtn.disabled = true;
    }

    try {
      // Replace this with your real endpoint later:
      // await fetch('/api/auth/forgot', { method:'POST', headers:{...}, body: JSON.stringify({ email }) })
      await new Promise(resolve => setTimeout(resolve, 400));

      // Hide base form content
      const baseEls = forgotForm.querySelectorAll('.field, button[type="submit"], .form-footer');
      baseEls.forEach(el => (el.style.display = 'none'));

      // Render success state from template
      if (forgotSuccessTemplate) {
        const clone = forgotSuccessTemplate.content.cloneNode(true);

        const emailDisplay = clone.querySelector('.user-email-display');
        if (emailDisplay) emailDisplay.textContent = email;

        const backBtn = clone.querySelector('#backToLoginBtn');
        backBtn?.addEventListener('click', () => {
          localStorage.removeItem(FORGOT_EMAIL_KEY);
          showLogin();
        });

        const retry = clone.querySelector('#retryForgot');
        retry?.addEventListener('click', (ev) => {
          ev.preventDefault();
          resetForgotToForm();
          if (submitBtn) {
            submitBtn.textContent = 'Send Reset Link';
            submitBtn.disabled = false;
          }
          focusFirstInput(forgotForm);
        });

        forgotForm.appendChild(clone);
      } else {
        // Fallback if template is missing
        showBanner('Reset link sent (template missing).', 'success');
      }

      // Keep user on this view even after refresh if you want:
      localStorage.setItem(TAB_KEY, 'forgot');

    } catch (error) {
      showBanner('Something went wrong. Please try again.');
      if (submitBtn) {
        submitBtn.textContent = 'Send Reset Link';
        submitBtn.disabled = false;
      }
    }
  });

  // =========================
  // Mobile: Get Started flow
  // =========================
  mobileGetStartedBtn?.addEventListener('click', () => {
    document.body.classList.add('mobile-auth-open');
    window.location.hash = 'auth';
  });

  if (window.location.hash === '#auth') {
    document.body.classList.add('mobile-auth-open');
  }

  window.addEventListener('hashchange', () => {
    if (window.location.hash !== '#auth') {
      document.body.classList.remove('mobile-auth-open');
    }
  });
});
