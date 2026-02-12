document.addEventListener('DOMContentLoaded', () => {

    // =========================
    // Element References
    // =========================
    const sidebar        = document.getElementById('sidebar');
    const sidebarToggle  = document.getElementById('sidebarToggle');
    const settingsBtn    = document.getElementById('settingsBtn');
    const settingsPopover = document.getElementById('settingsPopover');
    const themeSwitch    = document.getElementById('themeSwitch');
    const logoutBtn      = document.getElementById('logoutBtn');
    const userNameEl     = document.getElementById('userName');
    const navItems       = document.querySelectorAll('.nav-item');
    const body           = document.body;

    // =========================
    // Storage Keys
    // =========================
    const SIDEBAR_KEY = 'unistress_sidebar';
    const THEME_KEY   = 'unistress_theme';


    // =========================
    // 1. SIDEBAR TOGGLE
    // =========================
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    body.appendChild(overlay);

    function isMobile() {
        return window.innerWidth <= 768;
    }

    function openSidebar() {
        sidebar.classList.add('expanded');
        if (!isMobile()) localStorage.setItem(SIDEBAR_KEY, 'expanded');
        if (isMobile()) {
            overlay.classList.add('active');
            const mobileBtn = document.getElementById('mobileHamburger');
            if (mobileBtn) mobileBtn.style.display = 'none';
        }
    }

    function closeSidebar() {
        sidebar.classList.remove('expanded');
        if (!isMobile()) localStorage.setItem(SIDEBAR_KEY, 'collapsed');
        overlay.classList.remove('active');
        const mobileBtn = document.getElementById('mobileHamburger');
        if (mobileBtn) mobileBtn.style.display = 'grid';
    }

    function toggleSidebar() {
        sidebar.classList.contains('expanded') ? closeSidebar() : openSidebar();
    }

    sidebarToggle?.addEventListener('click', toggleSidebar);
    overlay.addEventListener('click', closeSidebar);

    // Restore state (desktop only)
    if (!isMobile() && localStorage.getItem(SIDEBAR_KEY) === 'expanded') {
        sidebar.classList.add('expanded');
    }

    // On resize: close sidebar if switching to mobile
    window.addEventListener('resize', () => {
        if (isMobile() && sidebar.classList.contains('expanded')) {
            closeSidebar();
        }
    });


    // =========================
    // 2. ACTIVE NAV ITEM
    // =========================
    navItems.forEach((item) => {
        item.querySelector('.nav-link')?.addEventListener('click', () => {
            navItems.forEach((i) => i.classList.remove('active'));
            item.classList.add('active');
            if (isMobile()) closeSidebar();
        });
    });


    // =========================
    // 3. SETTINGS POPOVER
    // =========================
    function positionPopover() {
        if (!settingsBtn || !settingsPopover) return;

        const btnRect = settingsBtn.getBoundingClientRect();
        const sidebarRect = sidebar.getBoundingClientRect();

        // Anchor horizontally to the sidebar (with padding)
        const left = sidebarRect.left + 8;

        // Width matches sidebar width minus padding
        const width = Math.max(sidebarRect.width - 16, 220);

        // Sits above the settings button, floating on top of the sidebar
        settingsPopover.style.left = left + 'px';
        settingsPopover.style.width = width + 'px';
        settingsPopover.style.bottom = (window.innerHeight - btnRect.top + 8) + 'px';
        settingsPopover.style.top = 'auto';
    }

    function openPopover() {
        positionPopover();
        settingsPopover?.classList.add('open');
    }

    function closePopover() {
        settingsPopover?.classList.remove('open');
    }

    function togglePopover() {
        settingsPopover?.classList.contains('open') ? closePopover() : openPopover();
    }

    settingsBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePopover();
    });

    // Reposition on resize
    window.addEventListener('resize', () => {
        if (settingsPopover?.classList.contains('open')) positionPopover();
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
        if (!settingsPopover?.contains(e.target) && !settingsBtn?.contains(e.target)) {
            closePopover();
        }
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closePopover();
    });


    // =========================
    // 4. THEME TOGGLE (inside popover)
    // =========================
    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(THEME_KEY, theme);

        if (themeSwitch) {
            themeSwitch.setAttribute('aria-checked', theme === 'dark' ? 'true' : 'false');
        }
    }

    // Initialise
    const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
    setTheme(savedTheme);

    themeSwitch?.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        setTheme(current === 'dark' ? 'light' : 'dark');
    });


    // =========================
    // 5. FETCH CURRENT USER
    // =========================
    async function loadUser() {
        try {
            const res = await fetch('/api/auth/me', { credentials: 'include' });
            const data = await res.json();

            if (data.user && userNameEl) {
                const firstName = data.user.name.split(' ')[0];
                userNameEl.textContent = firstName;
            }
        } catch (err) {
            console.error('Failed to fetch user:', err);
        }
    }

    loadUser();


    // =========================
    // 6. LOGOUT
    // =========================
    logoutBtn?.addEventListener('click', async () => {
        try {
            const res = await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include',
            });
            if (res.ok) {
                window.location.href = '/views/auth.html';
            }
        } catch (err) {
            console.error('Logout failed:', err);
        }
    });


    // =========================
    // 7. MOBILE HAMBURGER
    // =========================
    function createMobileHamburger() {
        if (document.getElementById('mobileHamburger')) return;

        const btn = document.createElement('button');
        btn.id = 'mobileHamburger';
        btn.className = 'mobile-hamburger';
        btn.type = 'button';
        btn.setAttribute('aria-label', 'Open menu');
        btn.innerHTML = '<i class="fa-solid fa-bars"></i>';
        btn.addEventListener('click', openSidebar);
        body.appendChild(btn);
    }

    function removeMobileHamburger() {
        document.getElementById('mobileHamburger')?.remove();
    }

    function handleMobileHamburger() {
        isMobile() ? createMobileHamburger() : removeMobileHamburger();
    }

    handleMobileHamburger();
    window.addEventListener('resize', handleMobileHamburger);

    // Inject mobile hamburger styles once
    const mobileStyle = document.createElement('style');
    mobileStyle.textContent = `
        .mobile-hamburger {
            position: fixed;
            top: 1rem;
            left: 1rem;
            z-index: 98;
            width: 40px;
            height: 40px;
            border-radius: 10px;
            border: 1px solid var(--border-color);
            background: var(--card-bg);
            color: var(--text-primary);
            font-size: 1.05rem;
            cursor: pointer;
            display: grid;
            place-items: center;
            box-shadow: var(--shadow-sm);
            transition: background 0.2s ease, color 0.2s ease;
        }
        .mobile-hamburger:hover {
            background: var(--primary-glow);
            color: var(--primary);
        }
        /* Hide when sidebar is open */
        .sidebar.expanded ~ .mobile-hamburger {
            display: none;
        }
    `;
    document.head.appendChild(mobileStyle);

});