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
    const profilePanel   = document.getElementById('profilePanel');
    const profilePanelOverlay = document.getElementById('profilePanelOverlay');
    const openProfilePanelBtn = document.getElementById('openProfilePanelBtn');
    const closeProfilePanelBtn = document.getElementById('closeProfilePanelBtn');
    const profileEditBtn = document.getElementById('profileEditBtn');
    const profileEditPanel = document.getElementById('profileEditPanel');
    const profileEditCancelBtn = document.getElementById('profileEditCancelBtn');
    const profileNameInput = document.getElementById('profileNameInput');
    const profileHandleInput = document.getElementById('profileHandleInput');
    const profileColorInput = document.getElementById('profileColorInput');
    const navItems       = document.querySelectorAll('.nav-item');
    const body           = document.body;

    const SIDEBAR_KEY = 'unistress_sidebar';
    const THEME_KEY   = 'unistress_theme';
    const todayISO    = new Date().toISOString().slice(0, 10);
    const MONTHS      = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    let currentProfile = {
        id: null,
        name: 'Student',
        email: '',
        handle: '',
        avatar_color: '#4e54c8'
    };

    // =========================
    // API HELPERS
    // =========================
    async function apiGet(url) {
        try {
            const res = await fetch(url, { credentials: 'include' });
            if (res.status === 401) { window.location.href = '/views/auth.html'; return []; }
            if (!res.ok) return [];
            return await res.json();
        } catch { return []; }
    }

    function showToast(message, iconClass = 'fa-circle-info') {
        if (!message) return;
        let toast = document.querySelector('.toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'toast';
            document.body.appendChild(toast);
        }
        toast.innerHTML = '<i class="fa-solid ' + iconClass + '"></i><span>' + message + '</span>';
        toast.classList.add('show');
        clearTimeout(showToast._timer);
        showToast._timer = setTimeout(() => toast.classList.remove('show'), 2600);
    }

    // =========================
    // 1. SIDEBAR TOGGLE
    // =========================
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    body.appendChild(overlay);

    function isMobile() { return window.innerWidth <= 768; }
    function isProfileMobileView() { return window.innerWidth <= 768; }

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

    sidebarToggle?.addEventListener('click', () => sidebar.classList.contains('expanded') ? closeSidebar() : openSidebar());
    overlay.addEventListener('click', closeSidebar);
    if (!isMobile() && localStorage.getItem(SIDEBAR_KEY) === 'expanded') sidebar.classList.add('expanded');
    window.addEventListener('resize', () => { if (isMobile() && sidebar.classList.contains('expanded')) closeSidebar(); });

    function openProfilePanelMobile() {
        if (!isProfileMobileView() || !profilePanel) return;
        profilePanel.classList.add('mobile-open');
        profilePanelOverlay?.classList.add('active');
        closePopover();
        closeSidebar();
    }

    function closeProfilePanelMobile() {
        profilePanel?.classList.remove('mobile-open');
        profilePanelOverlay?.classList.remove('active');
    }

    openProfilePanelBtn?.addEventListener('click', openProfilePanelMobile);
    closeProfilePanelBtn?.addEventListener('click', closeProfilePanelMobile);
    profilePanelOverlay?.addEventListener('click', closeProfilePanelMobile);
    window.addEventListener('resize', () => { if (!isProfileMobileView()) closeProfilePanelMobile(); });

    // =========================
    // 2. ACTIVE NAV ITEM
    // =========================
    navItems.forEach(item => {
        item.querySelector('.nav-link')?.addEventListener('click', () => {
            navItems.forEach(i => i.classList.remove('active'));
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
        settingsPopover.style.left = (sidebarRect.left + 8) + 'px';
        settingsPopover.style.width = Math.max(sidebarRect.width - 16, 220) + 'px';
        settingsPopover.style.bottom = (window.innerHeight - btnRect.top + 8) + 'px';
        settingsPopover.style.top = 'auto';
    }

    function openPopover() { positionPopover(); settingsPopover?.classList.add('open'); }
    function closePopover() { settingsPopover?.classList.remove('open'); }

    settingsBtn?.addEventListener('click', e => { e.stopPropagation(); settingsPopover?.classList.contains('open') ? closePopover() : openPopover(); });
    window.addEventListener('resize', () => { if (settingsPopover?.classList.contains('open')) positionPopover(); });
    document.addEventListener('click', e => { if (!settingsPopover?.contains(e.target) && !settingsBtn?.contains(e.target)) closePopover(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closePopover(); });

    // =========================
    // 4. THEME TOGGLE
    // =========================
    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(THEME_KEY, theme);
        if (themeSwitch) themeSwitch.setAttribute('aria-checked', theme === 'dark' ? 'true' : 'false');
    }
    setTheme(localStorage.getItem(THEME_KEY) || 'light');
    themeSwitch?.addEventListener('click', () => setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'));

    // =========================
    // 4b. NOTIFICATION TOGGLE (persisted in database)
    // =========================
    const notifSwitch = document.getElementById('notifSwitch');
    let notifEnabledDB = false; // tracks the DB value

    function updateNotifSwitch() {
        if (!notifSwitch) return;
        const on = 'Notification' in window && Notification.permission === 'granted' && notifEnabledDB;
        notifSwitch.setAttribute('aria-checked', on ? 'true' : 'false');
    }

    async function saveNotifPref(enabled) {
        try {
            const res = await fetch('/api/auth/notifications', {
                method: 'PUT', credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enabled })
            });
            if (!res.ok) return;
            const data = await res.json();
            notifEnabledDB = data.notification_enabled || false;
        } catch { /* ignore */ }
        updateNotifSwitch();
    }

    notifSwitch?.addEventListener('click', async () => {
        if (notifEnabledDB && 'Notification' in window && Notification.permission === 'granted') {
            await saveNotifPref(false);
            return;
        }
        if (!('Notification' in window)) { alert('Your browser does not support notifications.'); return; }
        if (Notification.permission === 'denied') { alert('Notifications are blocked. Please allow notifications for this site in your browser settings, then try again.'); return; }
        if (Notification.permission === 'default') { await Notification.requestPermission(); }
        if (Notification.permission === 'granted') {
            await saveNotifPref(true);
            try {
                const test = new Notification('Notifications enabled', { body: 'You will now receive reminder alerts.', tag: 'unistress-test' });
                setTimeout(() => test.close(), 4000);
            } catch (e) { /* ignore */ }
        }
    });

    updateNotifSwitch();

    // =========================
    // 5. FETCH CURRENT USER
    // =========================
    async function loadUser() {
        try {
            const res = await fetch('/api/auth/me', { credentials: 'include' });
            if (res.status === 401) {
                window.location.href = '/views/auth.html';
                return;
            }
            if (!res.ok) return;
            const data = await res.json();
            if (data.user) {
                currentProfile = {
                    id: data.user.id || null,
                    name: data.user.name || 'Student',
                    email: data.user.email || '',
                    handle: data.user.handle || '',
                    avatar_color: data.user.avatar_color || '#4e54c8'
                };
                notifEnabledDB = data.user.notification_enabled || false;
                updateNotifSwitch();
                applyProfileData();
            }
        } catch (err) { console.error('Failed to fetch user:', err); }
    }
    loadUser();

    function normalizeHandle(value, fallbackName) {
        const raw = (value || '').trim().replace(/^@+/, '');
        if (raw) return '@' + raw.toLowerCase().replace(/\s+/g, '');
        return '@' + fallbackName.toLowerCase().replace(/\s+/g, '');
    }

    function hexToRgb(hex) {
        const clean = (hex || '#4e54c8').replace('#', '');
        const full = clean.length === 3 ? clean.split('').map(ch => ch + ch).join('') : clean;
        const int = parseInt(full, 16);
        if (Number.isNaN(int)) return { r: 78, g: 84, b: 200 };
        return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
    }

    function lightenHex(hex, amt) {
        const { r, g, b } = hexToRgb(hex);
        const mix = channel => Math.round(channel + (255 - channel) * amt);
        return 'rgb(' + mix(r) + ', ' + mix(g) + ', ' + mix(b) + ')';
    }

    function applyProfileData() {
        const finalName = currentProfile.name || 'Student';
        const firstName = finalName.split(' ')[0] || 'Student';
        const finalHandle = normalizeHandle(currentProfile.handle || '', firstName);
        const profileName = document.getElementById('profileName');
        const profileHandle = document.getElementById('profileHandle');
        const avatarCircle = document.getElementById('avatarCircle');

        if (userNameEl) userNameEl.textContent = firstName;
        if (profileName) profileName.textContent = finalName;
        if (profileHandle) profileHandle.textContent = finalHandle;
        if (avatarCircle) {
            avatarCircle.innerHTML = '<span class="avatar-letter">' + finalName.charAt(0).toUpperCase() + '</span>';
            avatarCircle.style.background = 'linear-gradient(135deg, ' + lightenHex(currentProfile.avatar_color, 0.35) + ', ' + currentProfile.avatar_color + ')';
            avatarCircle.style.boxShadow = '0 8px 16px rgba(0,0,0,0.12)';
        }
    }

    function openProfileEditor() {
        if (!profileEditPanel) return;
        profileNameInput.value = currentProfile.name || 'Student';
        profileHandleInput.value = currentProfile.handle || '';
        profileColorInput.value = currentProfile.avatar_color || '#4e54c8';
        profileEditPanel.classList.add('active');
        profileEditBtn.textContent = 'Editing';
    }

    function closeProfileEditor() {
        profileEditPanel?.classList.remove('active');
        if (profileEditBtn) profileEditBtn.textContent = 'Edit';
    }

    profileEditBtn?.addEventListener('click', () => {
        if (profileEditPanel?.classList.contains('active')) return;
        openProfileEditor();
    });

    profileEditCancelBtn?.addEventListener('click', closeProfileEditor);

    profileEditPanel?.addEventListener('submit', async e => {
        e.preventDefault();
        const payload = {
            name: (profileNameInput?.value || '').trim(),
            handle: (profileHandleInput?.value || '').trim().replace(/^@+/, ''),
            avatar_color: profileColorInput?.value || '#4e54c8'
        };
        try {
            const res = await fetch('/api/auth/profile', {
                method: 'PUT',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                showToast(data.error || 'Failed to update profile.', 'fa-triangle-exclamation');
                return;
            }
            if (data.user) {
                currentProfile = {
                    id: data.user.id || currentProfile.id,
                    name: data.user.name || currentProfile.name,
                    email: data.user.email || currentProfile.email,
                    handle: data.user.handle || '',
                    avatar_color: data.user.avatar_color || '#4e54c8'
                };
                applyProfileData();
            }
            closeProfileEditor();
        } catch {
            showToast('Failed to update profile.', 'fa-triangle-exclamation');
        }
    });
    applyProfileData();

    // =========================
    // 6. LOGOUT
    // =========================
    logoutBtn?.addEventListener('click', async () => {
        try {
            const res = await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
            if (res.ok) window.location.href = '/views/auth.html';
        } catch (err) { console.error('Logout failed:', err); }
    });

    // =========================
    // 7. MOBILE HAMBURGER
    // =========================
    function createMobileHamburger() {
        if (document.getElementById('mobileHamburger')) return;
        const btn = document.createElement('button');
        btn.id = 'mobileHamburger'; btn.className = 'mobile-hamburger'; btn.type = 'button';
        btn.setAttribute('aria-label', 'Open menu');
        btn.innerHTML = '<i class="fa-solid fa-bars"></i>';
        btn.addEventListener('click', openSidebar);
        body.appendChild(btn);
    }
    function handleMobileHamburger() { isMobile() ? createMobileHamburger() : document.getElementById('mobileHamburger')?.remove(); }
    handleMobileHamburger();
    window.addEventListener('resize', handleMobileHamburger);

    if (!document.getElementById('mobileHamburgerStyle')) {
        const ms = document.createElement('style'); ms.id = 'mobileHamburgerStyle';
        ms.textContent = ".mobile-hamburger{position:fixed;top:1rem;left:1rem;z-index:98;width:40px;height:40px;border-radius:10px;border:1px solid var(--border-color);background:var(--card-bg);color:var(--text-primary);font-size:1.05rem;cursor:pointer;display:grid;place-items:center;box-shadow:var(--shadow-sm);transition:background .2s,color .2s}.mobile-hamburger:hover{background:var(--primary-glow);color:var(--primary)}.sidebar.expanded~.mobile-hamburger{display:none}";
        document.head.appendChild(ms);
    }

    // =========================
    // 8. TOPBAR DATE
    // =========================
    const topbarDate = document.getElementById('topbarDate');
    if (topbarDate) {
        topbarDate.textContent = new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }

    // =========================
    // 9. CALENDAR
    // =========================
    const calBody = document.getElementById('calBody');
    const calMonthYear = document.getElementById('calMonthYear');
    const calPrev = document.getElementById('calPrev');
    const calNext = document.getElementById('calNext');
    let calDate = new Date();
    let reminderDates = new Set();

    function renderCalendar() {
        if (!calBody) return;
        const year = calDate.getFullYear(), month = calDate.getMonth(), today = new Date();
        calMonthYear.textContent = MONTHS[month] + ', ' + year;
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrev = new Date(year, month, 0).getDate();
        let html = '', day = 1, nextDay = 1;
        for (let row = 0; row < 6; row++) {
            html += '<tr>';
            for (let col = 0; col < 7; col++) {
                const idx = row * 7 + col;
                if (idx < firstDay) {
                    html += '<td><span class="other-month">' + (daysInPrev - firstDay + col + 1) + '</span></td>';
                } else if (day > daysInMonth) {
                    html += '<td><span class="other-month">' + (nextDay++) + '</span></td>';
                } else {
                    const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                    const dateStr = year + '-' + String(month+1).padStart(2,'0') + '-' + String(day).padStart(2,'0');
                    const hasRem = reminderDates.has(dateStr);
                    let cls = '';
                    if (isToday && hasRem) cls = ' class="today has-reminder"';
                    else if (isToday) cls = ' class="today"';
                    else if (hasRem) cls = ' class="has-reminder"';
                    html += '<td><span' + cls + ' data-date="' + dateStr + '">' + day + '</span></td>';
                    day++;
                }
            }
            html += '</tr>';
            if (day > daysInMonth) break;
        }
        calBody.innerHTML = html;
    }

    calPrev?.addEventListener('click', () => { calDate.setMonth(calDate.getMonth() - 1); renderCalendar(); });
    calNext?.addEventListener('click', () => { calDate.setMonth(calDate.getMonth() + 1); renderCalendar(); });
    renderCalendar();

    // =========================
    // 10. MOTIVATION SLIDER
    // =========================
    const slideEls = document.querySelectorAll('.motivation-slide');
    const dotEls = document.querySelectorAll('.motivation-dots .dot');
    let curSlide = 0, slideInt;

    function showSlide(i) {
        slideEls.forEach((s, idx) => s.classList.toggle('active', idx === i));
        dotEls.forEach((d, idx) => d.classList.toggle('active', idx === i));
        curSlide = i;
    }
    function startAuto() { slideInt = setInterval(() => showSlide((curSlide + 1) % slideEls.length), 5000); }
    dotEls.forEach(d => d.addEventListener('click', () => { showSlide(parseInt(d.dataset.index, 10)); clearInterval(slideInt); startAuto(); }));
    if (slideEls.length > 0) startAuto();


    // =====================================================
    // 12. DASHBOARD – Load All Data & Render
    // =====================================================

    function isTodayEntry(dateStr) {
        return dateStr && dateStr.slice(0, 10) === todayISO;
    }

    function getWeekDates() {
        const dates = [];
        const d = new Date();
        const dayOfWeek = d.getDay();
        const sun = new Date(d);
        sun.setDate(d.getDate() - dayOfWeek);
        for (let i = 0; i < 7; i++) {
            const dd = new Date(sun);
            dd.setDate(sun.getDate() + i);
            dates.push(dd.toISOString().slice(0, 10));
        }
        return dates;
    }

    function formatDateShort(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.getDate() + ' ' + MONTHS[d.getMonth()].slice(0, 3);
    }

    function timeAgo(dateStr) {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return mins + 'm ago';
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return hrs + 'h ago';
        return Math.floor(hrs / 24) + 'd ago';
    }

    // ── ANIMATE VALUE ──
    function animateValue(el, target, suffix) {
        if (!el) return;
        const duration = 800;
        const startTime = performance.now();
        const isFloat = String(target).includes('.');
        function tick(now) {
            const progress = Math.min((now - startTime) / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3);
            const current = target * ease;
            if (isFloat) {
                el.innerHTML = current.toFixed(1) + (suffix || '');
            } else {
                el.innerHTML = Math.round(current) + (suffix || '');
            }
            if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    }


    // ── State for weekly chart ──
    let _dashWeekDates = [], _dashWeekStressVals = [], _dashWeekExerciseVals = [], _dashWeekSleepVals = [];

    // ── Grouped Bar Chart Renderer (matches other page charts) ──
    function renderDashBarChart(containerEl, datasets) {
        if (!containerEl || !_dashWeekDates.length) return;
        var html = '';
        for (var i = 0; i < _dashWeekDates.length; i++) {
            html += '<div class="dash-bar-group">';
            datasets.forEach(function(ds) {
                var v = ds.vals[i] || 0;
                var pct = ds.max > 0 ? Math.min((v / ds.max) * 100, 100) : 0;
                var isEmpty = v <= 0;
                html += '<div class="dash-mini-bar ' + ds.barClass + (isEmpty ? ' empty' : '') + '" style="height:' + (isEmpty ? '4' : Math.max(4, Math.round(pct))) + '%"></div>';
            });
            html += '</div>';
        }
        containerEl.innerHTML = html;
    }

    async function loadDashboard(refresh) {
        const weekDates = getWeekDates();

        const [stress, exercise, sleep_data, hydration, focus, breathe, reminders] = await Promise.all([
            apiGet('/api/stress?limit=200'),
            apiGet('/api/exercise?limit=200'),
            apiGet('/api/sleep?limit=200'),
            apiGet('/api/hydration?limit=200'),
            apiGet('/api/focus?limit=200'),
            apiGet('/api/breathe?limit=200'),
            apiGet('/api/reminders')
        ]);

        const $ = id => document.getElementById(id);

        // ──────── TODAY STATS ────────
        const tStress    = (stress    || []).filter(e => isTodayEntry(e.created_at));
        const tExercise  = (exercise  || []).filter(e => isTodayEntry(e.created_at));
        const tSleep     = (sleep_data|| []).filter(e => isTodayEntry(e.created_at));
        const tHydration = (hydration || []).filter(e => isTodayEntry(e.created_at));
        const tFocus     = (focus     || []).filter(e => isTodayEntry(e.created_at));
        const tBreathe   = (breathe   || []).filter(e => isTodayEntry(e.created_at));

        const avgStress     = tStress.length ? Math.round(tStress.reduce((s, e) => s + (e.stress_level || 0), 0) / tStress.length) : 0;
        const totalExercise = tExercise.reduce((s, e) => s + (e.duration || 0), 0);
        const totalSleep    = tSleep.reduce((s, e) => s + (parseFloat(e.duration_hours) || 0), 0);
        const totalGlasses  = tHydration.reduce((s, e) => s + (e.glasses || 0), 0);
        const totalFocus    = tFocus.reduce((s, e) => s + (e.duration_minutes || 0), 0);
        const totalBreathe  = tBreathe.length;

        // ──────── FETCH FITBIT DATA (before any rendering) ────────
        const fitbitConnected = window.Fitbit && Fitbit.connected;
        let fitbitActivity = null, fitbitSleep = null, fitbitHR = null, fitbitStepsData = null;

        if (fitbitConnected) {
            try {
                const fbResults = await Promise.all([
                    Fitbit.getActivity(refresh),
                    Fitbit.getSleep(refresh),
                    Fitbit.getHeartRate(refresh)
                ]);
                fitbitActivity  = fbResults[0];
                fitbitSleep     = fbResults[1];
                fitbitHR        = fbResults[2];
                if (weekDates.length === 7) {
                    fitbitStepsData = await Fitbit.getSteps(weekDates[0], weekDates[6], refresh);
                }
            } catch (e) {
                console.warn('Fitbit dashboard fetch error:', e);
            }
        }

        // ──────── MERGED VALUES ────────
        const fitbitActiveMins = fitbitActivity ? (fitbitActivity.active_minutes || 0) : 0;
        const fitbitSleepHrs   = fitbitSleep ? (parseFloat(fitbitSleep.total_hours) || 0) : 0;
        const fitbitHRVal      = fitbitHR ? (fitbitHR.resting_heart_rate || 0) : 0;
        const mergedExercise   = totalExercise + fitbitActiveMins;
        const mergedSleep      = Math.max(totalSleep, fitbitSleepHrs);

        // ──────── RENDER STAT CARDS (once, with merged values) ────────
        animateValue($('statStress'),    avgStress,      '');
        animateValue($('statExercise'),  mergedExercise, '<small>min</small>');
        animateValue($('statSleep'),     mergedSleep,    '<small>hrs</small>');
        animateValue($('statHydration'), totalGlasses,   '');
        animateValue($('statFocus'),     totalFocus,     '<small>min</small>');
        animateValue($('statBreathe'),   totalBreathe,   '');

        // ──────── FITBIT BANNER + EXTRA STAT CARDS ────────
        var titleEl   = document.getElementById('fbDashTitle');
        var metricsEl = document.getElementById('fbDashMetrics');
        var btnEl     = document.getElementById('fbDashBtn');
        var statCards = document.querySelector('.stat-cards');

        if (fitbitConnected) {
            if (titleEl) titleEl.textContent = 'Fitbit Activity Today';
            if (btnEl) {
                btnEl.textContent = 'View Details';
                btnEl.onclick = function () { window.location.href = '/views/exercise.html'; };
            }
            if (statCards) statCards.classList.add('fitbit-connected');
            if (metricsEl) {
                var bHtml = '';
                if (fitbitActivity) {
                    bHtml += '<span class="fitbit-dash-metric"><strong>' + Fitbit.formatNumber(fitbitActivity.steps) + '</strong> steps</span>';
                    bHtml += '<span class="fitbit-dash-metric"><strong>' + fitbitActiveMins + '</strong> active min</span>';
                }
                if (fitbitSleepHrs > 0) {
                    bHtml += '<span class="fitbit-dash-metric"><strong>' + fitbitSleep.total_hours + '</strong> hrs sleep</span>';
                }
                if (fitbitHRVal) {
                    bHtml += '<span class="fitbit-dash-metric"><strong>' + fitbitHRVal + '</strong> bpm resting</span>';
                }
                if (bHtml) metricsEl.innerHTML = bHtml;
            }
            var stepsEl = document.getElementById('statFitbitSteps');
            var hrEl    = document.getElementById('statFitbitHR');
            if (fitbitActivity && stepsEl) animateValue(stepsEl, fitbitActivity.steps || 0, '');
            if (fitbitHRVal && hrEl) animateValue(hrEl, fitbitHRVal, '<small>bpm</small>');
            else if (hrEl) hrEl.innerHTML = '--';
        } else {
            if (titleEl) titleEl.textContent = 'Connect Fitbit';
            if (metricsEl) metricsEl.innerHTML = '<span class="fitbit-dash-metric">Sync your activity, sleep, and heart rate data automatically.</span>';
            if (btnEl) {
                btnEl.textContent = 'Connect';
                btnEl.onclick = function () { if (window.Fitbit) Fitbit.connect(); };
            }
            if (statCards) statCards.classList.remove('fitbit-connected');
            var stepsElR = document.getElementById('statFitbitSteps');
            var hrElR    = document.getElementById('statFitbitHR');
            if (stepsElR) stepsElR.textContent = '--';
            if (hrElR) hrElR.textContent = '--';
        }

        // ──────── TREND INDICATORS ────────
        const yesterdayISO = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        const yStress    = (stress    || []).filter(e => e.created_at?.slice(0,10) === yesterdayISO);
        const yExercise  = (exercise  || []).filter(e => e.created_at?.slice(0,10) === yesterdayISO);
        const ySleep     = (sleep_data|| []).filter(e => e.created_at?.slice(0,10) === yesterdayISO);
        const yHydration = (hydration || []).filter(e => e.created_at?.slice(0,10) === yesterdayISO);
        const yFocus     = (focus     || []).filter(e => e.created_at?.slice(0,10) === yesterdayISO);

        const yAvgStress     = yStress.length    ? Math.round(yStress.reduce((s,e) => s + (e.stress_level||0), 0) / yStress.length) : null;
        const yTotalExercise = yExercise.length  ? yExercise.reduce((s,e) => s + (e.duration||0), 0) : null;
        const yTotalSleep    = ySleep.length     ? ySleep.reduce((s,e) => s + (parseFloat(e.duration_hours)||0), 0) : null;
        const yTotalGlasses  = yHydration.length ? yHydration.reduce((s,e) => s + (e.glasses||0), 0) : null;
        const yTotalFocus    = yFocus.length     ? yFocus.reduce((s,e) => s + (e.duration_minutes||0), 0) : null;

        function renderTrend(id, today, yesterday, isInverse) {
            const el = $(id);
            if (!el) return;
            if (yesterday === null || (today === 0 && yesterday === 0)) { el.innerHTML = ''; return; }
            if (today === yesterday) { el.innerHTML = ''; return; }
            const up  = today > yesterday;
            const cls = isInverse ? (up ? 'trend-down' : 'trend-up') : (up ? 'trend-up' : 'trend-down');
            const icon = up ? 'fa-arrow-up' : 'fa-arrow-down';
            const pct  = yesterday > 0 ? Math.round(Math.abs(today - yesterday) / yesterday * 100) : '';
            el.className = 'stat-trend ' + cls;
            el.innerHTML = '<i class="fa-solid ' + icon + '"></i>' + (pct ? pct + '%' : '');
        }

        renderTrend('trendStress',    avgStress,      yAvgStress,     true);
        renderTrend('trendExercise',  mergedExercise, yTotalExercise, false);
        renderTrend('trendSleep',     mergedSleep,    yTotalSleep,    false);
        renderTrend('trendHydration', totalGlasses,   yTotalGlasses,  false);
        renderTrend('trendFocus',     totalFocus,     yTotalFocus,    false);


        // ──────── WELLBEING SCORE ────────
        const hrBonus        = fitbitHRVal > 0 && fitbitHRVal < 60 ? 5 : fitbitHRVal >= 60 && fitbitHRVal < 75 ? 3 : 0;
        const stressScore    = tStress.length ? Math.max(0, 20 - (avgStress * 2)) : 0;
        const exerciseScore  = Math.min(20, (mergedExercise / 30) * 20);
        const sleepScore     = Math.min(20, (mergedSleep / 7) * 20);
        const hydrationScore = Math.min(20, (totalGlasses / 8) * 20);
        const focusScore     = Math.min(20, (totalFocus / 25) * 20);
        const wb = Math.min(100, Math.round(stressScore + exerciseScore + sleepScore + hydrationScore + focusScore + hrBonus));

        fetch('/api/summary/wellbeing', {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ score: wb })
        }).catch(() => {});

        _wbLiveSet = true;
        setWbRing(wb, true);

        let msg = 'Start tracking to build your score!';
        if (wb >= 80) msg = "Outstanding! You're taking great care of yourself today.";
        else if (wb >= 60) msg = "Good progress! Keep up the healthy habits.";
        else if (wb >= 40) msg = "Not bad! A few more healthy activities will boost your score.";
        else if (wb > 0)  msg = "Getting started! Every small step counts.";
        $('wbMessage') && ($('wbMessage').textContent = msg);


        // ──────── WEEKLY CHART ────────
        const dayLabels = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
        const barsEl = $('dashChartBars');
        const labelsEl = $('dashChartLabels');
        let fitbitWeekExercise = 0;

        if (barsEl && labelsEl) {
            _dashWeekDates        = weekDates;
            _dashWeekStressVals   = [];
            _dashWeekExerciseVals = [];
            _dashWeekSleepVals    = [];

            weekDates.forEach(dateStr => {
                const dayStress   = (stress    || []).filter(e => e.created_at?.slice(0,10) === dateStr);
                const dayExercise = (exercise  || []).filter(e => e.created_at?.slice(0,10) === dateStr);
                const daySleep    = (sleep_data|| []).filter(e => e.created_at?.slice(0,10) === dateStr);
                _dashWeekStressVals.push(dayStress.length ? dayStress.reduce((s,e) => s + (e.stress_level||0), 0) / dayStress.length : 0);
                _dashWeekExerciseVals.push(dayExercise.reduce((s,e) => s + (e.duration||0), 0));
                _dashWeekSleepVals.push(daySleep.reduce((s,e) => s + (parseFloat(e.duration_hours)||0), 0));
            });

            // ── Enrich chart with Fitbit steps ──
            if (fitbitConnected && fitbitStepsData && Array.isArray(fitbitStepsData)) {
                fitbitStepsData.forEach(function(d) {
                    var idx = _dashWeekDates.indexOf(d.date);
                    if (idx < 0) return;
                    var stepsMin = Math.round((d.steps || 0) / 100);
                    var contribution = (d.date === todayISO && fitbitActiveMins > stepsMin)
                        ? fitbitActiveMins : stepsMin;
                    _dashWeekExerciseVals[idx] += contribution;
                    fitbitWeekExercise += contribution;
                });
                var todayIdx = _dashWeekDates.indexOf(todayISO);
                if (todayIdx >= 0 && fitbitSleepHrs > _dashWeekSleepVals[todayIdx]) {
                    _dashWeekSleepVals[todayIdx] = fitbitSleepHrs;
                }
            }

            renderDashBarChart(barsEl, [
                { vals: _dashWeekStressVals,   max: Math.max(..._dashWeekStressVals,   10), barClass: 'bar-stress' },
                { vals: _dashWeekExerciseVals, max: Math.max(..._dashWeekExerciseVals, 30), barClass: 'bar-exercise' },
                { vals: _dashWeekSleepVals,    max: Math.max(..._dashWeekSleepVals,    8),  barClass: 'bar-sleep' },
            ]);

            let labelsHTML = '';
            weekDates.forEach((dateStr, i) => {
                labelsHTML += '<span' + (dateStr === todayISO ? ' class="today"' : '') + '>' + dayLabels[i] + '</span>';
            });
            labelsEl.innerHTML = labelsHTML;
        }


        // ──────── RECENT ACTIVITY ────────
        const activityList = $('activityList');
        if (activityList) {
            const activities = [];
            (stress || []).forEach(e => {
                if (isTodayEntry(e.created_at))
                    activities.push({ icon: 'fa-heart-pulse', cls: 'ai-stress', text: 'Stress check-in: Level ' + e.stress_level + (e.mood ? ' (' + e.mood + ')' : ''), time: e.created_at });
            });
            (exercise || []).forEach(e => {
                if (isTodayEntry(e.created_at))
                    activities.push({ icon: 'fa-dumbbell', cls: 'ai-exercise', text: (e.exercise_type || 'Exercise') + ' \u2014 ' + e.duration + ' min', time: e.created_at });
            });
            (sleep_data || []).forEach(e => {
                if (isTodayEntry(e.created_at))
                    activities.push({ icon: 'fa-moon', cls: 'ai-sleep', text: 'Sleep logged \u2014 ' + parseFloat(e.duration_hours).toFixed(1) + ' hrs', time: e.created_at });
            });
            (hydration || []).forEach(e => {
                if (isTodayEntry(e.created_at))
                    activities.push({ icon: 'fa-droplet', cls: 'ai-hydration', text: 'Drank ' + e.glasses + ' glass' + (e.glasses !== 1 ? 'es' : ''), time: e.created_at });
            });
            (focus || []).forEach(e => {
                if (isTodayEntry(e.created_at))
                    activities.push({ icon: 'fa-book-open', cls: 'ai-focus', text: 'Focus session \u2014 ' + e.duration_minutes + ' min', time: e.created_at });
            });
            (breathe || []).forEach(e => {
                if (isTodayEntry(e.created_at))
                    activities.push({ icon: 'fa-wind', cls: 'ai-breathe', text: (e.technique_name || 'Breathing') + ' session', time: e.created_at });
            });

            activities.sort((a, b) => new Date(b.time) - new Date(a.time));

            if (activities.length === 0) {
                activityList.innerHTML = '<p class="activity-empty">No activity yet today. Start tracking!</p>';
            } else {
                activityList.innerHTML = activities.slice(0, 8).map(a =>
                    '<article class="activity-item">' +
                        '<span class="activity-icon ' + a.cls + '"><i class="fa-solid ' + a.icon + '"></i></span>' +
                        '<section class="activity-info">' +
                            '<p class="activity-text">' + a.text + '</p>' +
                            '<p class="activity-time">' + timeAgo(a.time) + '</p>' +
                        '</section>' +
                    '</article>'
                ).join('');
            }
        }


        // ──────── WEEKLY SUMMARY ────────
        const weekSummaryStart = new Date();
        weekSummaryStart.setDate(weekSummaryStart.getDate() - weekSummaryStart.getDay());
        weekSummaryStart.setHours(0, 0, 0, 0);

        function isThisWeek(dateStr) {
            if (!dateStr) return false;
            return new Date(dateStr) >= weekSummaryStart;
        }

        const wStress    = (stress    || []).filter(e => isThisWeek(e.created_at));
        const wExercise  = (exercise  || []).filter(e => isThisWeek(e.created_at));
        const wSleep     = (sleep_data|| []).filter(e => isThisWeek(e.created_at));
        const wHydration = (hydration || []).filter(e => isThisWeek(e.created_at));
        const wFocus     = (focus     || []).filter(e => isThisWeek(e.created_at));

        const wAvgStress    = wStress.length ? (wStress.reduce((s,e) => s + (e.stress_level||0), 0) / wStress.length).toFixed(1) : '0';
        const wTotalExercise= wExercise.reduce((s,e) => s + (e.duration||0), 0);
        const sleepDays     = new Set(wSleep.map(e => e.created_at?.slice(0,10)));
        const hydDays       = new Set(wHydration.map(e => e.created_at?.slice(0,10)));
        const wAvgSleep     = sleepDays.size ? (wSleep.reduce((s,e) => s + (parseFloat(e.duration_hours)||0), 0) / sleepDays.size).toFixed(1) : '0';
        const wAvgHydration = hydDays.size ? Math.round(wHydration.reduce((s,e) => s + (e.glasses||0), 0) / hydDays.size) : 0;
        const wTotalFocus   = wFocus.reduce((s,e) => s + (e.duration_minutes||0), 0);

        $('weekExercise') && ($('weekExercise').textContent = (wTotalExercise + fitbitWeekExercise) + ' min');
        $('weekStress')   && ($('weekStress').textContent = wAvgStress + '/10');
        $('weekSleep')    && ($('weekSleep').textContent = (fitbitSleepHrs > parseFloat(wAvgSleep) ? fitbitSleepHrs.toFixed(1) : wAvgSleep) + ' hrs');
        $('weekHydration')&& ($('weekHydration').textContent = wAvgHydration + ' glasses');
        $('weekFocus')    && ($('weekFocus').textContent = wTotalFocus + ' min');


        // ──────── SCHEDULED (from reminders API) ────────
        const scheduledList = $('scheduledList');
        const allReminders = (reminders || []).filter(r => !r.completed);

        if (scheduledList && !scheduledList.dataset.expandBound) {
            scheduledList.addEventListener('click', (event) => {
                const toggle = event.target.closest('.scheduled-expand');
                if (!toggle) return;
                const card = toggle.closest('.scheduled-card');
                if (!card) return;
                const isExpanded = card.classList.toggle('expanded');
                toggle.textContent = isExpanded ? 'Show less' : 'Show more';
                toggle.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
            });
            scheduledList.dataset.expandBound = 'true';
        }

        const upcoming = allReminders
            .filter(r => r.due_date && r.due_date.slice(0, 10) >= todayISO)
            .sort((a, b) => {
                const dateA = a.due_date + (a.due_time || '');
                const dateB = b.due_date + (b.due_time || '');
                return dateA.localeCompare(dateB);
            })
            .slice(0, 6);

        // Build reminder dates for calendar dots
        reminderDates.clear();
        allReminders.forEach(r => {
            if (r.due_date) reminderDates.add(r.due_date.slice(0, 10));
        });
        renderCalendar();

        if (scheduledList) {
            if (upcoming.length === 0) {
                scheduledList.innerHTML = '<p class="scheduled-empty">No upcoming schedules.</p>';
            } else {
                const catConfig = {
                    hydration: { tag: 'tag-hydration', card: 'card-gray' },
                    exercise:  { tag: 'tag-exercise',  card: 'card-gray' },
                    sleep:     { tag: 'tag-sleep',     card: 'card-gray' },
                    study:     { tag: 'tag-study',     card: 'card-gray' },
                    stress:    { tag: 'tag-stress',    card: 'card-gray' },
                    focus:     { tag: 'tag-focus',     card: 'card-gray' },
                    breathe:   { tag: 'tag-breathe',   card: 'card-gray' },
                    notes:     { tag: 'tag-other',     card: 'card-gray' },
                    other:     { tag: 'tag-other',     card: 'card-gray' }
                };

                scheduledList.innerHTML = upcoming.map(r => {
                    const catRaw = (r.category || 'other').trim();
                    const catKey = catRaw.toLowerCase();
                    const cfg = catConfig[catKey] || catConfig.other;
                    const catLabel = catRaw.charAt(0).toUpperCase() + catRaw.slice(1).toLowerCase();
                    const isReminderToday = r.due_date && r.due_date.slice(0, 10) === todayISO;
                    const dateLabel = isReminderToday ? 'Today' : formatDateShort(r.due_date);
                    const timeLabel = r.due_time ? r.due_time.slice(0, 5) : '';
                    const reminderText = (r.text || 'Reminder');
                    const isLongMessage = reminderText.length > 70;

                    return '<article class="scheduled-card ' + cfg.card + '">' +
                        '<header class="scheduled-card-top">' +
                            '<span class="scheduled-tag ' + cfg.tag + '">' + catLabel + '</span>' +
                        '</header>' +
                        '<footer class="scheduled-card-bottom">' +
                            '<p class="scheduled-name' + (isLongMessage ? ' is-collapsible' : '') + '">' + reminderText + '</p>' +
                            (isLongMessage ? '<button class="scheduled-expand" type="button" aria-expanded="false">Show more</button>' : '') +
                            '<time class="scheduled-date">' + dateLabel + (timeLabel ? ' \u00B7 ' + timeLabel : '') + '</time>' +
                        '</footer>' +
                    '</article>';
                }).join('');
            }
        }
    }

    // Guard: set to true once live dashboard data has painted the ring,
    // so a slow-resolving restoreWbCache fetch cannot overwrite it.
    let _wbLiveSet = false;

    // Single helper for all wellbeing ring updates — eliminates transition race conditions.
    // animate=false: instant snap (used by cache restore); animate=true: smooth transition.
    function setWbRing(score, animate) {
        const circ = 2 * Math.PI * 52;
        const ringEl = document.getElementById('wbRingFill');
        if (!ringEl) return;
        const offset = circ - (circ * score / 100);
        if (animate) {
            ringEl.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)';
            requestAnimationFrame(() => { ringEl.style.strokeDashoffset = offset; });
        } else {
            ringEl.style.transition = 'none';
            ringEl.style.strokeDashoffset = offset;
        }
        const scoreEl = document.getElementById('wbScore');
        const pctEl = document.getElementById('wbRingPct');
        if (scoreEl) scoreEl.textContent = score + '/100';
        if (pctEl) pctEl.textContent = score + '%';
    }

    // Restore cached wellbeing score from DB so the ring doesn't flash 0 on refresh
    async function restoreWbCache() {
        try {
            const res = await fetch('/api/summary/wellbeing', { credentials: 'include' });
            if (!res.ok) return;
            const { score, date } = await res.json();
            if (!date || date.slice(0, 10) !== todayISO || typeof score !== 'number') return;
            // If live data has already painted the ring, don't overwrite it
            if (_wbLiveSet) return;
            setWbRing(score, false);
        } catch (e) { /* ignore */ }
    }

    restoreWbCache();
    loadDashboard().catch(() => { /* Not on dashboard page — safe to ignore */ });

    // =========================
    // FITBIT DASHBOARD
    // =========================
    async function loadFitbitDashboard(refresh) {
        await loadDashboard(refresh);
    }

    function resetFitbitDashboard() {
        loadDashboard();
    }

    // Dashboard Fitbit button handler
    var fbDashBtn = document.getElementById('fbDashBtn');
    if (fbDashBtn) {
        fbDashBtn.addEventListener('click', function () {
            if (window.Fitbit && Fitbit.connected) {
                window.location.href = '/views/exercise.html';
            } else if (window.Fitbit) {
                Fitbit.connect();
            }
        });
    }

    if (window.Fitbit) {
        Fitbit.onStatusChange(function (connected, refresh) {
            try {
                if (connected) loadFitbitDashboard(refresh);
                else resetFitbitDashboard();
            } catch (e) { console.warn('Fitbit dashboard error:', e); }
        });
    }

    // =========================
    // COLLAPSIBLE HISTORY (shared across pages)
    // =========================
    document.querySelectorAll('.history-card .card-header').forEach(header => {
        header.addEventListener('click', (e) => {
            if (e.target.closest('.btn-text')) return; // don't toggle when clicking Clear All
            header.closest('.history-card').classList.toggle('open');
        });
    });

    // =========================
    // GLOBAL NOTIFICATION CHECKER (runs on every page)
    // =========================
    const notifiedIds = new Set(JSON.parse(localStorage.getItem('unistress_notified') || '[]'));

    function isNotifOn() {
        return 'Notification' in window && Notification.permission === 'granted' && notifEnabledDB;
    }

    function saveNotifiedIds() {
        const arr = [...notifiedIds].slice(-200);
        localStorage.setItem('unistress_notified', JSON.stringify(arr));
    }

    async function checkGlobalReminders() {
        if (!isNotifOn()) return;
        try {
            const res = await fetch('/api/reminders', { credentials: 'include' });
            if (!res.ok) return;
            const data = await res.json();
            if (!data || !Array.isArray(data)) return;

            const now = new Date();

            data.filter(r => !r.completed).forEach(r => {
                const id = String(r.id);
                if (notifiedIds.has(id)) return;

                const dateStr = r.due_date ? r.due_date.split('T')[0] : '';
                if (!dateStr) return;

                const timeStr = (r.due_time || '09:00');
                const fullTime = timeStr.length === 5 ? timeStr + ':00' : timeStr;

                const [year, month, day] = dateStr.split('-').map(Number);
                const [hours, mins, secs] = fullTime.split(':').map(Number);
                const dueTime = new Date(year, month - 1, day, hours, mins, secs || 0);

                const diffMs = now.getTime() - dueTime.getTime();

                if (diffMs >= 0 && diffMs < 120000) {
                    try {
                        const cat = r.category || 'Reminder';
                        const notif = new Notification('UniStress — ' + cat + ' Reminder', {
                            body: r.text || 'Time for your reminder!',
                            icon: '/assets/images/stress.png',
                            tag: 'unistress-' + id,
                            requireInteraction: true
                        });
                        notif.onclick = () => {
                            window.focus();
                            window.location.href = '/views/reminders.html';
                            notif.close();
                        };
                    } catch (e) { /* notification blocked */ }
                    notifiedIds.add(id);
                    saveNotifiedIds();
                }
            });
        } catch (e) { /* network error, skip */ }
    }

    checkGlobalReminders();
    setInterval(checkGlobalReminders, 15000);

});

