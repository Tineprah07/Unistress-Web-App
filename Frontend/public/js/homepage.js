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

    const SIDEBAR_KEY = 'unistress_sidebar';
    const THEME_KEY   = 'unistress_theme';
    const todayISO    = new Date().toISOString().slice(0, 10);
    const MONTHS      = ['January','February','March','April','May','June','July','August','September','October','November','December'];

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

    // =========================
    // 1. SIDEBAR TOGGLE
    // =========================
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    body.appendChild(overlay);

    function isMobile() { return window.innerWidth <= 768; }

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
    // 5. FETCH CURRENT USER
    // =========================
    async function loadUser() {
        try {
            const res = await fetch('/api/auth/me', { credentials: 'include' });
            const data = await res.json();
            if (data.user) {
                const fullName = data.user.name || 'Student';
                const firstName = fullName.split(' ')[0];
                if (userNameEl) userNameEl.textContent = firstName;
                const profileName = document.getElementById('profileName');
                const profileHandle = document.getElementById('profileHandle');
                const avatarCircle = document.getElementById('avatarCircle');
                if (profileName) profileName.textContent = fullName;
                if (profileHandle) profileHandle.textContent = '@' + firstName.toLowerCase();
                if (avatarCircle) {
                    avatarCircle.innerHTML = '<span class="avatar-letter">' + fullName.charAt(0).toUpperCase() + '</span>';
                    if (!document.getElementById('avatarLetterStyle')) {
                        const s = document.createElement('style');
                        s.id = 'avatarLetterStyle';
                        s.textContent = ".avatar-letter{font-size:2rem;font-weight:700;color:var(--primary);font-family:'Poppins',sans-serif;}";
                        document.head.appendChild(s);
                    }
                }
            }
        } catch (err) { console.error('Failed to fetch user:', err); }
    }
    loadUser();

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

    // ── SPARKLINE ──
    function renderSparkline(containerId, values, color) {
        const el = document.getElementById(containerId);
        if (!el) return;
        const pts = values.length ? values : [0,0,0,0,0,0,0];
        const max = Math.max(...pts, 1);
        const w = 60, h = 28, pad = 2;
        const step = (w - pad * 2) / (pts.length - 1 || 1);
        let path = '';
        pts.forEach((v, i) => {
            const x = pad + i * step;
            const y = h - pad - ((v / max) * (h - pad * 2));
            path += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1);
        });
        el.innerHTML = '<svg viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none"><path d="' + path + '" fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
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


    async function loadDashboard() {
        const [stress, exercise, sleep, hydration, focus, breathe, reminders] = await Promise.all([
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
        const tStress    = (stress || []).filter(e => isTodayEntry(e.created_at));
        const tExercise  = (exercise || []).filter(e => isTodayEntry(e.created_at));
        const tSleep     = (sleep || []).filter(e => isTodayEntry(e.created_at));
        const tHydration = (hydration || []).filter(e => isTodayEntry(e.created_at));
        const tFocus     = (focus || []).filter(e => isTodayEntry(e.created_at));
        const tBreathe   = (breathe || []).filter(e => isTodayEntry(e.created_at));

        const avgStress     = tStress.length ? Math.round(tStress.reduce((s, e) => s + (e.stress_level || 0), 0) / tStress.length) : 0;
        const totalExercise = tExercise.reduce((s, e) => s + (e.duration || 0), 0);
        const totalSleep    = tSleep.reduce((s, e) => s + (parseFloat(e.duration_hours) || 0), 0);
        const totalGlasses  = tHydration.reduce((s, e) => s + (e.glasses || 0), 0);
        const totalFocus    = tFocus.reduce((s, e) => s + (e.duration_minutes || 0), 0);
        const totalBreathe  = tBreathe.length;

        animateValue($('statStress'), avgStress, '');
        animateValue($('statExercise'), totalExercise, '<small>min</small>');
        animateValue($('statSleep'), totalSleep, '<small>hrs</small>');
        animateValue($('statHydration'), totalGlasses, '');
        animateValue($('statFocus'), totalFocus, '<small>min</small>');
        animateValue($('statBreathe'), totalBreathe, '');


        // ──────── SPARKLINES ────────
        const weekDates = getWeekDates();
        function getLast7(data, field) {
            return weekDates.map(d => {
                const dayItems = (data || []).filter(e => e.created_at && e.created_at.slice(0,10) === d);
                if (field === 'avg_stress') return dayItems.length ? dayItems.reduce((s,e) => s + (e.stress_level||0), 0) / dayItems.length : 0;
                return dayItems.reduce((s,e) => s + (parseFloat(e[field])||0), 0);
            });
        }
        renderSparkline('sparkStress', getLast7(stress, 'avg_stress'), '#ef4444');
        renderSparkline('sparkExercise', getLast7(exercise, 'duration'), '#10b981');
        renderSparkline('sparkSleep', getLast7(sleep, 'duration_hours'), '#6366f1');
        renderSparkline('sparkHydration', getLast7(hydration, 'glasses'), '#3b82f6');
        renderSparkline('sparkFocus', getLast7(focus, 'duration_minutes'), '#f59e0b');
        renderSparkline('sparkBreathe', getLast7(breathe, 'cycles'), '#8b5cf6');


        // ──────── WELLBEING SCORE ────────
        const stressScore    = tStress.length ? Math.max(0, 20 - (avgStress * 2)) : 0;
        const exerciseScore  = Math.min(20, (totalExercise / 30) * 20);
        const sleepScore     = Math.min(20, (totalSleep / 7) * 20);
        const hydrationScore = Math.min(20, (totalGlasses / 8) * 20);
        const focusScore     = Math.min(20, (totalFocus / 25) * 20);
        const wb = Math.round(stressScore + exerciseScore + sleepScore + hydrationScore + focusScore);
        const circumference = 2 * Math.PI * 52;

        $('wbScore').textContent = wb + '/100';
        $('wbRingPct').textContent = wb + '%';

        const ringFill = $('wbRingFill');
        if (ringFill) {
            const offset = circumference - (circumference * wb / 100);
            setTimeout(() => { ringFill.style.strokeDashoffset = offset; }, 100);
        }

        let msg = 'Start tracking to build your score!';
        if (wb >= 80) msg = "Outstanding! You're taking great care of yourself today.";
        else if (wb >= 60) msg = "Good progress! Keep up the healthy habits.";
        else if (wb >= 40) msg = "Not bad! A few more healthy activities will boost your score.";
        else if (wb > 0)  msg = "Getting started! Every small step counts.";
        $('wbMessage').textContent = msg;


        // ──────── WEEKLY CHART ────────
        const dayLabels = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
        const barsEl = $('dashChartBars');
        const labelsEl = $('dashChartLabels');

        if (barsEl && labelsEl) {
            let barsHTML = '', labelsHTML = '';
            weekDates.forEach((dateStr, i) => {
                const dayStress   = (stress || []).filter(e => e.created_at && e.created_at.slice(0,10) === dateStr);
                const dayExercise = (exercise || []).filter(e => e.created_at && e.created_at.slice(0,10) === dateStr);
                const daySleep    = (sleep || []).filter(e => e.created_at && e.created_at.slice(0,10) === dateStr);

                const sVal = dayStress.length ? dayStress.reduce((s,e) => s + (e.stress_level||0), 0) / dayStress.length : 0;
                const eVal = dayExercise.reduce((s,e) => s + (e.duration||0), 0);
                const slVal = daySleep.reduce((s,e) => s + (parseFloat(e.duration_hours)||0), 0);

                barsHTML += '<div class="chart-bar-group">' +
                    '<div class="chart-mini-bar bar-stress" style="height:' + Math.max(4, (sVal/10)*100) + '%"></div>' +
                    '<div class="chart-mini-bar bar-exercise" style="height:' + Math.max(4, (eVal/60)*100) + '%"></div>' +
                    '<div class="chart-mini-bar bar-sleep" style="height:' + Math.max(4, (slVal/10)*100) + '%"></div>' +
                    '</div>';
                labelsHTML += '<span' + (dateStr === todayISO ? ' class="today"' : '') + '>' + dayLabels[i] + '</span>';
            });
            barsEl.innerHTML = barsHTML;
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
            (sleep || []).forEach(e => {
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
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        weekStart.setHours(0, 0, 0, 0);

        function isThisWeek(dateStr) {
            if (!dateStr) return false;
            return new Date(dateStr) >= weekStart;
        }

        const wStress    = (stress || []).filter(e => isThisWeek(e.created_at));
        const wExercise  = (exercise || []).filter(e => isThisWeek(e.created_at));
        const wSleep     = (sleep || []).filter(e => isThisWeek(e.created_at));
        const wHydration = (hydration || []).filter(e => isThisWeek(e.created_at));
        const wFocus     = (focus || []).filter(e => isThisWeek(e.created_at));

        const wAvgStress = wStress.length ? (wStress.reduce((s,e) => s + (e.stress_level||0), 0) / wStress.length).toFixed(1) : '0';
        const wTotalExercise = wExercise.reduce((s,e) => s + (e.duration||0), 0);
        const sleepDays = new Set(wSleep.map(e => e.created_at?.slice(0,10)));
        const hydDays = new Set(wHydration.map(e => e.created_at?.slice(0,10)));
        const wAvgSleep = sleepDays.size ? (wSleep.reduce((s,e) => s + (parseFloat(e.duration_hours)||0), 0) / sleepDays.size).toFixed(1) : '0';
        const wAvgHydration = hydDays.size ? Math.round(wHydration.reduce((s,e) => s + (e.glasses||0), 0) / hydDays.size) : 0;
        const wTotalFocus = wFocus.reduce((s,e) => s + (e.duration_minutes||0), 0);

        $('weekExercise').textContent = wTotalExercise + ' min';
        $('weekStress').textContent = wAvgStress + '/10';
        $('weekSleep').textContent = wAvgSleep + ' hrs';
        $('weekHydration').textContent = wAvgHydration + ' glasses';
        $('weekFocus').textContent = wTotalFocus + ' min';


        // ──────── SCHEDULED (from reminders API) ────────
        const scheduledList = $('scheduledList');
        const allReminders = (reminders || []).filter(r => !r.completed);

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
                scheduledList.innerHTML = '<p class="scheduled-empty">No upcoming schedules. Tap + to add one!</p>';
            } else {
                const catConfig = {
                    hydration: { tag: 'tag-hydration', card: 'card-blue' },
                    exercise:  { tag: 'tag-exercise',  card: 'card-green' },
                    sleep:     { tag: 'tag-sleep',     card: 'card-purple' },
                    study:     { tag: 'tag-study',     card: 'card-amber' },
                    stress:    { tag: 'tag-stress',    card: 'card-pink' },
                    other:     { tag: 'tag-other',     card: 'card-gray' }
                };

                scheduledList.innerHTML = upcoming.map(r => {
                    const cat = r.category || 'other';
                    const cfg = catConfig[cat] || catConfig.other;
                    const isReminderToday = r.due_date && r.due_date.slice(0, 10) === todayISO;
                    const dateLabel = isReminderToday ? 'Today' : formatDateShort(r.due_date);
                    const timeLabel = r.due_time ? r.due_time.slice(0, 5) : '';

                    return '<article class="scheduled-card ' + cfg.card + '">' +
                        '<header class="scheduled-card-top">' +
                            '<span class="scheduled-tag ' + cfg.tag + '">' + cat.charAt(0).toUpperCase() + cat.slice(1) + '</span>' +
                            '<button class="scheduled-menu" type="button" aria-label="More options"><i class="fa-solid fa-ellipsis"></i></button>' +
                        '</header>' +
                        '<footer class="scheduled-card-bottom">' +
                            '<p class="scheduled-name">' + (r.text || 'Reminder') + '</p>' +
                            '<time class="scheduled-date">' + dateLabel + (timeLabel ? ' \u00B7 ' + timeLabel : '') + '</time>' +
                        '</footer>' +
                    '</article>';
                }).join('');
            }
        }
    }

    loadDashboard();

});