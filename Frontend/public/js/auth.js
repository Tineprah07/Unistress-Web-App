document.addEventListener('DOMContentLoaded', () => {
    // Select all necessary elements
    const imgSlides = document.querySelectorAll('.img-slide');
    const textSlides = document.querySelectorAll('.text-slide');
    const dots = document.querySelectorAll('.dot');
    const carousel = document.querySelector('.carousel-container');

    let currentIndex = 0;
    const intervalTime = 5000; // 5 seconds per slide
    let slideInterval;

    // Function to switch to a specific slide index
    function changeSlide(index) {
        // 1. Reset all active states
        [imgSlides, textSlides, dots].forEach(group => {
            group.forEach(el => el.classList.remove('active'));
        });

        // 2. Set new active states
        if (imgSlides[index]) imgSlides[index].classList.add('active');
        if (textSlides[index]) textSlides[index].classList.add('active');
        if (dots[index]) dots[index].classList.add('active');
        
        currentIndex = index;
    }

    // Function to advance to the next slide automatically
    function nextSlide() {
        let nextIndex = (currentIndex + 1) % imgSlides.length;
        changeSlide(nextIndex);
    }

    // Start the automatic slideshow
    function startTimer() {
        if (slideInterval) clearInterval(slideInterval);
        slideInterval = setInterval(nextSlide, intervalTime);
    }

    // Stop timer
    function stopTimer() {
        if (slideInterval) clearInterval(slideInterval);
    }

    // Initialize the timer
    startTimer();

    // Pause on hover
    if (carousel) {
        carousel.addEventListener('mouseenter', stopTimer);
        carousel.addEventListener('mouseleave', startTimer);
    }

    // Add click events to dots for manual control
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            changeSlide(index);
            startTimer(); // Restart timer
        });
    });

    // -------------------------
    // Password Visibility Toggle (correct icon logic)
    // -------------------------
    const togglePassword = document.querySelector('#togglePassword');
    const passwordInput = document.querySelector('#passwordInput');

    function syncPasswordIcon() {
        const isHidden = passwordInput.getAttribute('type') === 'password';

        // Hidden => show "eye" (clicking will reveal)
        // Visible => show "eye-slash" (clicking will hide)
        togglePassword.classList.toggle('fa-eye', isHidden);
        togglePassword.classList.toggle('fa-eye-slash', !isHidden);

        togglePassword.setAttribute(
            'aria-label',
            isHidden ? 'Show password' : 'Hide password'
        );
    }

    function togglePasswordVisibility() {
        const isHidden = passwordInput.getAttribute('type') === 'password';
        passwordInput.setAttribute('type', isHidden ? 'text' : 'password');
        syncPasswordIcon();
    }

    if (togglePassword && passwordInput) {
        // Ensure correct icon on page load
        syncPasswordIcon();

        togglePassword.addEventListener('click', togglePasswordVisibility);

        // Keyboard accessibility (Enter / Space)
        togglePassword.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            togglePasswordVisibility();
            }
        });
    }


    const tabLogin = document.getElementById('tabLogin');
    const tabRegister = document.getElementById('tabRegister');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const authTitle = document.getElementById('authTitle');
    const authSubtitle = document.getElementById('authSubtitle');

    /* --- Updated Form Toggle Logic --- */

    function showRegister(e) {
        if(e) e.preventDefault();
        loginForm.style.display = 'none';
        registerForm.style.display = 'grid';
        tabLogin.classList.remove('active');
        tabRegister.classList.add('active');
        
        authTitle.textContent = "Join UniStress";
        document.querySelector('.auth-description').textContent = "Create your account today to start tracking your daily wellbeing, setting study goals, and mastering your student life.";
        
        // 1. Update the HTML
        authSubtitle.innerHTML = 'Already have an account? <a class="link" href="#" id="inlineLogin">Sign in here</a>';
        
        // 2. RE-BIND the listener to the brand new link just created
        document.getElementById('inlineLogin').addEventListener('click', showLogin);
    }

    function showLogin(e) {
        if(e) e.preventDefault();
        loginForm.style.display = 'grid';
        registerForm.style.display = 'none';
        tabRegister.classList.remove('active');
        tabLogin.classList.add('active');
        
        authTitle.textContent = "Welcome to UniStress";
        
        // Updated short version here:
        document.querySelector('.auth-description').textContent = "Your companion for academic balance. Track your habits, stay energized, and master your student life.";
        
        authSubtitle.innerHTML = 'Don’t have an account? <a class="link" href="#" id="inlineRegister">Create a new account</a>';
        document.getElementById('inlineRegister').addEventListener('click', showRegister);
    }

    // Initial event listeners for the tabs and the starting link
    tabLogin.addEventListener('click', showLogin);
    tabRegister.addEventListener('click', showRegister);
    // Use a check to prevent errors if the element isn't there initially
    const initialLink = document.getElementById('inlineRegister');
    if (initialLink) initialLink.addEventListener('click', showRegister);

});