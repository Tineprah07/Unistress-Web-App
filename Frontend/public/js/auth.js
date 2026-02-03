document.addEventListener('DOMContentLoaded', () => {
  // =========================
  // Carousel (images + text)
  // =========================
  const imgSlides = document.querySelectorAll('.img-slide');
  const textSlides = document.querySelectorAll('.text-slide');
  const dots = document.querySelectorAll('.dot');
  const carousel = document.querySelector('.carousel-container');

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

  // Start carousel after everything is stable (reduces flicker)
  function setInitialCarouselState() {
    changeSlide(0);
    startTimer();
  }

  const hasLottie = document.querySelector('dotlottie-player');
  if (hasLottie) {
    window.addEventListener('load', setInitialCarouselState, { once: true });
  } else {
    setInitialCarouselState();
  }

  // Pause on hover
  if (carousel) {
    carousel.addEventListener('mouseenter', stopTimer);
    carousel.addEventListener('mouseleave', startTimer);
  }

  // Dots manual control
  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      changeSlide(index);
      startTimer();
    });
  });

  // =========================
  // Password visibility toggles (login + register)
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
  // Tabs: Sign In <-> Create Account
  // =========================
  const tabLogin = document.querySelector('#tabLogin');
  const tabRegister = document.querySelector('#tabRegister');
  const loginForm = document.querySelector('#loginForm');
  const registerForm = document.querySelector('#registerForm');
  const authTitle = document.querySelector('#authTitle');
  const authDescription = document.querySelector('.auth-description');
  const authSubtitle = document.querySelector('#authSubtitle');

  // Keep selected tab after refresh
  const TAB_KEY = 'unistress_auth_tab';

  function bindInlineLinks() {
    const inlineRegister = document.querySelector('#inlineRegister');
    const inlineLogin = document.querySelector('#inlineLogin');

    inlineRegister?.addEventListener('click', showRegister);
    inlineLogin?.addEventListener('click', showLogin);
  }

  function showRegister(e) {
    if (e) e.preventDefault();

    loginForm.style.display = 'none';
    registerForm.style.display = 'grid';

    tabLogin.classList.remove('active');
    tabRegister.classList.add('active');

    authTitle.textContent = 'Join UniStress';
    if (authDescription) {
      authDescription.textContent =
        'Create your account today to start tracking your daily wellbeing, setting study goals, and mastering your student life.';
    }

    // Update footer under the login form header
    if (authSubtitle) {
      authSubtitle.innerHTML =
        'Already have an account? <a class="link" href="#" id="inlineLogin">Sign in here</a>';
    }

    localStorage.setItem(TAB_KEY, 'register');
    bindInlineLinks();
  }

  function showLogin(e) {
    if (e) e.preventDefault();

    loginForm.style.display = 'grid';
    registerForm.style.display = 'none';

    tabRegister.classList.remove('active');
    tabLogin.classList.add('active');

    authTitle.textContent = 'Welcome to UniStress';
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
  }

  tabLogin?.addEventListener('click', showLogin);
  tabRegister?.addEventListener('click', showRegister);

  // Initial inline links (from your HTML)
  bindInlineLinks();

  // Restore last open tab on refresh
  const savedTab = localStorage.getItem(TAB_KEY);
  if (savedTab === 'register') showRegister();
  else showLogin();
  
});
