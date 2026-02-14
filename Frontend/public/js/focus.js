document.addEventListener('DOMContentLoaded', () => {

    // =========================
    // API HELPERS
    // =========================
    async function apiGet(url) {
        const res = await fetch(url, { credentials: 'include' });
        if (res.status === 401) { window.location.href = '/views/auth.html'; return null; }
        return res.json();
    }
    async function apiPost(url, body) {
        const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(body) });
        if (res.status === 401) { window.location.href = '/views/auth.html'; return null; }
        return res.json();
    }
    async function apiDelete(url) {
        const res = await fetch(url, { method: 'DELETE', credentials: 'include' });
        if (res.status === 401) { window.location.href = '/views/auth.html'; return null; }
        return res.json();
    }
    async function apiPatch(url) {
        const res = await fetch(url, { method: 'PATCH', credentials: 'include' });
        if (res.status === 401) { window.location.href = '/views/auth.html'; return null; }
        return res.json();
    }

    // In-memory cache for focus sessions (from API)
    let entries = [];

    // In-memory cache for tasks (from API)
    let tasks = [];
    const WEEKLY_GOAL = 120;
    const DAILY_GOAL_SESSIONS = 4;

    // Timer state
    let timerInterval = null;
    let timeLeft = 25 * 60;
    let totalTime = 25 * 60;
    let isRunning = false;
    let currentMode = 'focus';
    let pomodoroCount = 0;

    // Elements
    const modeTabs    = document.getElementById('modeTabs');
    const timerDigits = document.getElementById('timerDigits');
    const timerLabel  = document.getElementById('timerLabel');
    const timerRing   = document.getElementById('timerRingFill');
    const startBtn    = document.getElementById('startBtn');
    const pauseBtn    = document.getElementById('pauseBtn');
    const resetBtn    = document.getElementById('resetBtn');
    const timeInput   = document.getElementById('timeInput');
    const timeUpBtn   = document.getElementById('timeUp');
    const timeDownBtn = document.getElementById('timeDown');
    const pomDots     = [document.getElementById('pom1'), document.getElementById('pom2'), document.getElementById('pom3'), document.getElementById('pom4')];
    const pomLabel    = document.getElementById('pomLabel');

    const todayMinEl     = document.getElementById('todayMinutes');
    const todaySessEl    = document.getElementById('todaySessions');
    const currentStreakEl = document.getElementById('currentStreak');
    const totalSessionsEl = document.getElementById('totalSessions');
    const heroRingFill   = document.getElementById('heroRingFill');
    const heroRingValue  = document.getElementById('heroRingValue');
    const heroSubtitle   = document.getElementById('heroSubtitle');
    const goalText       = document.getElementById('goalText');
    const goalBar        = document.getElementById('goalBar');
    const chartBars      = document.getElementById('chartBars');
    const chartLabels    = document.getElementById('chartLabels');
    const historyList    = document.getElementById('historyList');
    const historyEmpty   = document.getElementById('historyEmpty');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');

    const taskForm  = document.getElementById('taskForm');
    const taskInput = document.getElementById('taskInput');
    const taskList  = document.getElementById('taskList');
    const taskEmpty = document.getElementById('taskEmpty');

    const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const MODE_LABELS = { focus: 'Focus Time', short: 'Short Break', long: 'Long Break' };
    const MODE_TIMES = { focus: 25, short: 5, long: 15 };

    function todayStr() { return new Date().toISOString().split('T')[0]; }
    function formatDate(d) { const dt = new Date(d); return dt.getDate() + ' ' + MONTHS[dt.getMonth()]; }
    function formatTime(d) { const dt = new Date(d); return dt.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}); }

    function mapEntry(e) {
        return {
            id: String(e.id),
            mode: e.mode || 'focus',
            duration: e.duration_minutes,
            date: e.created_at
        };
    }

    // =============================
    // 1. TIMER
    // =============================
    function updateDisplay() {
        const m = Math.floor(timeLeft / 60);
        const s = timeLeft % 60;
        timerDigits.textContent = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');

        const circumference = 628.32;
        const pct = 1 - (timeLeft / totalTime);
        timerRing.style.strokeDashoffset = circumference * (1 - pct);

        document.title = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0') + ' — UniStress Focus';
    }

    function startTimer() {
        if (isRunning) return;
        isRunning = true;
        startBtn.classList.add('hidden');
        pauseBtn.classList.remove('hidden');

        timerInterval = setInterval(() => {
            timeLeft--;
            updateDisplay();

            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                timerInterval = null;
                isRunning = false;
                startBtn.classList.remove('hidden');
                pauseBtn.classList.add('hidden');
                onTimerComplete();
            }
        }, 1000);
    }

    function pauseTimer() {
        if (!isRunning) return;
        clearInterval(timerInterval);
        timerInterval = null;
        isRunning = false;
        startBtn.classList.remove('hidden');
        pauseBtn.classList.add('hidden');
    }

    function resetTimer() {
        pauseTimer();
        timeLeft = totalTime;
        updateDisplay();
    }

    function setMode(mode) {
        pauseTimer();
        currentMode = mode;
        totalTime = MODE_TIMES[mode] * 60;
        timeLeft = totalTime;
        timerLabel.textContent = MODE_LABELS[mode];

        if (timeInput) timeInput.value = MODE_TIMES[mode];

        timerRing.classList.remove('short-break', 'long-break');
        if (mode === 'short') timerRing.classList.add('short-break');
        if (mode === 'long') timerRing.classList.add('long-break');

        modeTabs.querySelectorAll('.mode-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.mode === mode);
        });

        updateDisplay();
    }

    async function onTimerComplete() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.frequency.value = 800; osc.type = 'sine';
            gain.gain.value = 0.15;
            osc.start(); osc.stop(ctx.currentTime + 0.3);
        } catch {}

        if (currentMode === 'focus') {
            // Log focus session to API
            const result = await apiPost('/api/focus', {
                duration_minutes: MODE_TIMES.focus,
                mode: 'focus'
            });

            if (result && !result.error) {
                entries.unshift(mapEntry(result));
            }

            pomodoroCount++;
            updatePomDots();
            renderAll();

            if (pomodoroCount >= 4) {
                pomodoroCount = 0;
                updatePomDots();
                setMode('long');
            } else {
                setMode('short');
            }
        } else {
            setMode('focus');
        }
    }

    function updatePomDots() {
        pomDots.forEach((dot, i) => {
            if (dot) dot.classList.toggle('done', i < pomodoroCount);
        });
        if (pomLabel) pomLabel.textContent = pomodoroCount + ' / 4 pomodoros';
    }

    startBtn?.addEventListener('click', startTimer);
    pauseBtn?.addEventListener('click', pauseTimer);
    resetBtn?.addEventListener('click', resetTimer);

    modeTabs?.querySelectorAll('.mode-tab').forEach(tab => {
        tab.addEventListener('click', () => setMode(tab.dataset.mode));
    });

    function setCustomTime(minutes) {
        if (isRunning) return;
        minutes = Math.max(1, Math.min(120, minutes));
        totalTime = minutes * 60;
        timeLeft = totalTime;
        if (timeInput) timeInput.value = minutes;
        MODE_TIMES[currentMode] = minutes;
        updateDisplay();
    }

    timeUpBtn?.addEventListener('click', () => {
        const current = Math.round(totalTime / 60);
        setCustomTime(current + 5);
    });

    timeDownBtn?.addEventListener('click', () => {
        const current = Math.round(totalTime / 60);
        setCustomTime(current - 5);
    });

    timeInput?.addEventListener('change', () => {
        const val = parseInt(timeInput.value, 10);
        if (!isNaN(val) && val >= 1) setCustomTime(val);
    });

    timeInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); timeInput.blur(); }
    });

    // =============================
    // 2. STATS
    // =============================
    function renderStats() {
        const today = todayStr();
        const todayEntries = entries.filter(e => e.date.split('T')[0] === today && e.mode === 'focus');
        const todayMin = todayEntries.reduce((s, e) => s + e.duration, 0);
        const todaySess = todayEntries.length;

        if (todayMinEl) todayMinEl.innerHTML = todayMin + '<small>min</small>';
        if (todaySessEl) todaySessEl.textContent = todaySess;
        if (totalSessionsEl) totalSessionsEl.textContent = entries.filter(e => e.mode === 'focus').length;

        if (heroRingFill) {
            const circ = 326.73;
            const pct = Math.min(todaySess / DAILY_GOAL_SESSIONS, 1);
            heroRingFill.style.strokeDashoffset = circ - (pct * circ);
        }
        if (heroRingValue) heroRingValue.textContent = todaySess;

        if (heroSubtitle) {
            if (todaySess >= DAILY_GOAL_SESSIONS) heroSubtitle.textContent = "Amazing focus today! Take a well-deserved break.";
            else if (todaySess > 0) heroSubtitle.textContent = (DAILY_GOAL_SESSIONS - todaySess) + " more session" + (DAILY_GOAL_SESSIONS - todaySess > 1 ? "s" : "") + " to hit today's goal.";
            else heroSubtitle.textContent = "Structure your study, boost your productivity.";
        }

        const { current } = calcStreaks();
        if (currentStreakEl) currentStreakEl.textContent = current;

        const weekMin = getWeekData().reduce((s, d) => s + d, 0);
        if (goalText) goalText.textContent = weekMin + ' / ' + WEEKLY_GOAL + ' min';
        if (goalBar) { goalBar.max = WEEKLY_GOAL; goalBar.value = Math.min(weekMin, WEEKLY_GOAL); }
    }

    function calcStreaks() {
        const focusEntries = entries.filter(e => e.mode === 'focus');
        if (focusEntries.length === 0) return { current: 0 };
        const uniqueDates = [...new Set(focusEntries.map(e => e.date.split('T')[0]))].sort().reverse();
        const today = todayStr();
        const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
        const yStr = yesterday.toISOString().split('T')[0];
        let current = 0;
        if (uniqueDates[0] === today || uniqueDates[0] === yStr) {
            for (let i = 0; i < uniqueDates.length; i++) {
                const exp = new Date();
                exp.setDate(exp.getDate() - (uniqueDates[0] === today ? i : i + 1));
                if (uniqueDates[i] === exp.toISOString().split('T')[0]) current++;
                else break;
            }
        }
        return { current };
    }

    // =============================
    // 3. CHART
    // =============================
    function getWeekData() {
        const now = new Date();
        const dow = now.getDay();
        const data = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(now); d.setDate(now.getDate() - dow + i);
            const ds = d.toISOString().split('T')[0];
            const min = entries.filter(e => e.date.split('T')[0] === ds && e.mode === 'focus').reduce((s, e) => s + e.duration, 0);
            data.push(min);
        }
        return data;
    }

    function renderChart() {
        const now = new Date();
        const dow = now.getDay();
        const weekData = getWeekData();
        const maxVal = Math.max(...weekData, 30);

        if (chartBars) {
            chartBars.innerHTML = weekData.map(min => {
                const pct = min > 0 ? Math.max((min / maxVal) * 100, 5) : 5;
                const cls = min === 0 ? ' empty' : '';
                return '<section class="chart-bar-wrap"><span class="chart-bar-value">' + (min > 0 ? min : '') + '</span><span class="chart-bar' + cls + '" style="height:' + pct + '%"></span></section>';
            }).join('');
        }
        if (chartLabels) {
            chartLabels.innerHTML = DAYS.map((d, i) => '<span class="chart-label' + (i === dow ? ' today' : '') + '">' + d + '</span>').join('');
        }
    }

    // =============================
    // 4. TASKS (API-backed)
    // =============================
    function mapTask(t) {
        return { id: String(t.id), name: t.name, done: t.done || false };
    }

    function renderTasks() {
        taskList?.querySelectorAll('.task-item').forEach(el => el.remove());

        if (tasks.length === 0) {
            if (taskEmpty) taskEmpty.style.display = 'flex';
            return;
        }
        if (taskEmpty) taskEmpty.style.display = 'none';

        tasks.forEach(task => {
            const li = document.createElement('li');
            li.className = 'task-item' + (task.done ? ' completed' : '');
            li.innerHTML = `
                <button class="task-check" data-id="${task.id}"><i class="fa-solid fa-check"></i></button>
                <span class="task-name">${task.name}</span>
                <button class="task-delete" data-id="${task.id}"><i class="fa-solid fa-xmark"></i></button>
            `;
            taskList?.insertBefore(li, taskEmpty);
        });
    }

    taskForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = taskInput.value.trim();
        if (!name) return;
        const result = await apiPost('/api/tasks', { name });
        if (result && !result.error) {
            tasks.push(mapTask(result));
        }
        taskInput.value = '';
        renderTasks();
    });

    taskList?.addEventListener('click', async (e) => {
        const checkBtn = e.target.closest('.task-check');
        const deleteBtn = e.target.closest('.task-delete');

        if (checkBtn) {
            const result = await apiPatch('/api/tasks/' + checkBtn.dataset.id + '/toggle');
            if (result && !result.error) {
                const idx = tasks.findIndex(t => t.id === checkBtn.dataset.id);
                if (idx !== -1) tasks[idx] = mapTask(result);
            }
            renderTasks();
        }

        if (deleteBtn) {
            await apiDelete('/api/tasks/' + deleteBtn.dataset.id);
            tasks = tasks.filter(t => t.id !== deleteBtn.dataset.id);
            renderTasks();
        }
    });

    // =============================
    // 5. HISTORY
    // =============================
    function renderHistory() {
        historyList?.querySelectorAll('.history-item').forEach(el => el.remove());

        if (entries.length === 0) {
            if (historyEmpty) historyEmpty.style.display = 'flex';
            return;
        }
        if (historyEmpty) historyEmpty.style.display = 'none';

        entries.slice(0, 20).forEach(entry => {
            const item = document.createElement('article');
            item.className = 'history-item';
            const modeClass = entry.mode === 'focus' ? 'mb-focus' : entry.mode === 'short' ? 'mb-short' : 'mb-long';
            const modeLabel = entry.mode === 'focus' ? 'Focus' : entry.mode === 'short' ? 'Short Break' : 'Long Break';

            item.innerHTML = `
                <span class="history-icon-wrap"><i class="fa-solid fa-book-open"></i></span>
                <section class="history-details">
                    <p class="history-type">${entry.duration} min</p>
                    <p class="history-meta"><span class="mode-badge ${modeClass}">${modeLabel}</span></p>
                </section>
                <time class="history-date">${formatDate(entry.date)}<br>${formatTime(entry.date)}</time>
                <button class="history-delete" data-id="${entry.id}"><i class="fa-solid fa-trash-can"></i></button>
            `;
            historyList?.insertBefore(item, historyEmpty);
        });
    }

    historyList?.addEventListener('click', async (e) => {
        const btn = e.target.closest('.history-delete');
        if (!btn) return;
        await apiDelete('/api/focus/' + btn.dataset.id);
        entries = entries.filter(en => en.id !== btn.dataset.id);
        renderAll();
    });

    clearHistoryBtn?.addEventListener('click', async () => {
        if (confirm('Clear all focus session history?')) {
            await apiDelete('/api/focus');
            entries = [];
            renderAll();
        }
    });

    // =============================
    // 6. RENDER ALL & INIT
    // =============================
    function renderAll() { renderStats(); renderChart(); renderHistory(); renderTasks(); }

    async function init() {
        const [focusData, tasksData] = await Promise.all([
            apiGet('/api/focus?limit=200'),
            apiGet('/api/tasks')
        ]);
        if (focusData && Array.isArray(focusData)) {
            entries = focusData.map(mapEntry);
        }
        if (tasksData && Array.isArray(tasksData)) {
            tasks = tasksData.map(mapTask);
        }
        updateDisplay();
        updatePomDots();
        renderAll();
    }

    init();

});