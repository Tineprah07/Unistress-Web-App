document.addEventListener('DOMContentLoaded', () => {

    const STORAGE_KEY = 'unistress_focus';
    const TASKS_KEY   = 'unistress_tasks';
    const WEEKLY_GOAL = 120; // minutes
    const DAILY_GOAL_SESSIONS = 4;

    // Timer state
    let timerInterval = null;
    let timeLeft = 25 * 60;
    let totalTime = 25 * 60;
    let isRunning = false;
    let currentMode = 'focus'; // focus | short | long
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

    function getEntries() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; } }
    function saveEntries(d) { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); }
    function getTasks() { try { return JSON.parse(localStorage.getItem(TASKS_KEY)) || []; } catch { return []; } }
    function saveTasks(d) { localStorage.setItem(TASKS_KEY, JSON.stringify(d)); }

    // =============================
    // 1. TIMER
    // =============================
    function updateDisplay() {
        const m = Math.floor(timeLeft / 60);
        const s = timeLeft % 60;
        timerDigits.textContent = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');

        // Ring progress (circumference = 2*PI*100 = 628.32)
        const circumference = 628.32;
        const pct = 1 - (timeLeft / totalTime);
        timerRing.style.strokeDashoffset = circumference * (1 - pct);

        // Update title
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

        // Sync custom time input
        if (timeInput) timeInput.value = MODE_TIMES[mode];

        // Update ring colour
        timerRing.classList.remove('short-break', 'long-break');
        if (mode === 'short') timerRing.classList.add('short-break');
        if (mode === 'long') timerRing.classList.add('long-break');

        // Update tabs
        modeTabs.querySelectorAll('.mode-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.mode === mode);
        });

        updateDisplay();
    }

    function onTimerComplete() {
        // Play a subtle notification
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
            // Log focus session
            const entry = {
                id: Date.now().toString(),
                mode: 'focus',
                duration: MODE_TIMES.focus,
                date: new Date().toISOString()
            };
            const entries = getEntries();
            entries.unshift(entry);
            saveEntries(entries);

            pomodoroCount++;
            updatePomDots();
            renderAll();

            // Auto switch to break
            if (pomodoroCount >= 4) {
                pomodoroCount = 0;
                updatePomDots();
                setMode('long');
            } else {
                setMode('short');
            }
        } else {
            // Break complete — back to focus
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

    // Custom time controls
    function updateTimeInput() {
        if (timeInput) timeInput.value = Math.round(totalTime / 60);
    }

    function setCustomTime(minutes) {
        if (isRunning) return; // don't change while running
        minutes = Math.max(1, Math.min(120, minutes));
        totalTime = minutes * 60;
        timeLeft = totalTime;
        if (timeInput) timeInput.value = minutes;
        // Update the MODE_TIMES for the current mode so it logs correctly
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
        if (e.key === 'Enter') {
            e.preventDefault();
            timeInput.blur();
        }
    });

    // =============================
    // 2. STATS
    // =============================
    function renderStats() {
        const entries = getEntries();
        const today = todayStr();
        const todayEntries = entries.filter(e => e.date.split('T')[0] === today && e.mode === 'focus');
        const todayMin = todayEntries.reduce((s, e) => s + e.duration, 0);
        const todaySess = todayEntries.length;

        if (todayMinEl) todayMinEl.innerHTML = todayMin + '<small>min</small>';
        if (todaySessEl) todaySessEl.textContent = todaySess;
        if (totalSessionsEl) totalSessionsEl.textContent = entries.filter(e => e.mode === 'focus').length;

        // Hero ring
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

        // Streak
        const { current } = calcStreaks(entries);
        if (currentStreakEl) currentStreakEl.textContent = current;

        // Weekly goal
        const weekMin = getWeekData(entries).reduce((s, d) => s + d, 0);
        if (goalText) goalText.textContent = weekMin + ' / ' + WEEKLY_GOAL + ' min';
        if (goalBar) { goalBar.max = WEEKLY_GOAL; goalBar.value = Math.min(weekMin, WEEKLY_GOAL); }
    }

    function calcStreaks(entries) {
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
    function getWeekData(entries) {
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
        const entries = getEntries();
        const now = new Date();
        const dow = now.getDay();
        const weekData = getWeekData(entries);
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
    // 4. TASKS
    // =============================
    function renderTasks() {
        const tasks = getTasks();
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

    taskForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = taskInput.value.trim();
        if (!name) return;
        const tasks = getTasks();
        tasks.push({ id: Date.now().toString(), name, done: false });
        saveTasks(tasks);
        taskInput.value = '';
        renderTasks();
    });

    taskList?.addEventListener('click', (e) => {
        const checkBtn = e.target.closest('.task-check');
        const deleteBtn = e.target.closest('.task-delete');

        if (checkBtn) {
            let tasks = getTasks();
            const t = tasks.find(t => t.id === checkBtn.dataset.id);
            if (t) t.done = !t.done;
            saveTasks(tasks);
            renderTasks();
        }

        if (deleteBtn) {
            let tasks = getTasks();
            tasks = tasks.filter(t => t.id !== deleteBtn.dataset.id);
            saveTasks(tasks);
            renderTasks();
        }
    });

    // =============================
    // 5. HISTORY
    // =============================
    function renderHistory() {
        const entries = getEntries();
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

    historyList?.addEventListener('click', (e) => {
        const btn = e.target.closest('.history-delete');
        if (!btn) return;
        let entries = getEntries();
        entries = entries.filter(en => en.id !== btn.dataset.id);
        saveEntries(entries);
        renderAll();
    });

    clearHistoryBtn?.addEventListener('click', () => {
        if (confirm('Clear all focus session history?')) { saveEntries([]); renderAll(); }
    });

    // =============================
    // 6. RENDER ALL
    // =============================
    function renderAll() { renderStats(); renderChart(); renderHistory(); renderTasks(); }

    updateDisplay();
    updatePomDots();
    renderAll();

});