document.addEventListener('DOMContentLoaded', () => {

    // =========================
    // CONSTANTS & ELEMENTS
    // =========================
    const STORAGE_KEY  = 'unistress_exercises';
    const GOAL_KEY     = 'unistress_exercise_goal';
    const WEEKLY_GOAL  = 150; // minutes per week (WHO recommendation)

    const form           = document.getElementById('exerciseForm');
    const typePicker     = document.getElementById('typePicker');
    const intensityPicker = document.getElementById('intensityPicker');
    const exerciseTypeInput = document.getElementById('exerciseType');
    const intensityInput = document.getElementById('intensity');
    const durationInput  = document.getElementById('duration');
    const notesInput     = document.getElementById('notes');
    const submitBtn      = document.getElementById('submitBtn');
    const toast          = document.getElementById('toast');

    const currentStreakEl = document.getElementById('currentStreak');
    const bestStreakEl    = document.getElementById('bestStreak');
    const weekTotalEl    = document.getElementById('weekTotal');
    const totalSessionsEl = document.getElementById('totalSessions');

    const chartBars      = document.getElementById('chartBars');
    const chartLabels    = document.getElementById('chartLabels');
    const goalProgress   = document.getElementById('goalProgress');
    const goalBar        = document.getElementById('goalBar');

    const historyList    = document.getElementById('historyList');
    const historyEmpty   = document.getElementById('historyEmpty');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');

    const pageDateEl     = document.getElementById('pageDate');

    // =========================
    // HELPERS
    // =========================
    const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    function todayStr() {
        return new Date().toISOString().split('T')[0];
    }

    function formatDate(dateStr) {
        const d = new Date(dateStr);
        return d.getDate() + ' ' + MONTHS[d.getMonth()];
    }

    function formatTime(dateStr) {
        const d = new Date(dateStr);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    function getExercises() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        } catch { return []; }
    }

    function saveExercises(data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    // Icon map for exercise types
    function typeIcon(type) {
        const map = {
            Walking: 'fa-person-walking',
            Running: 'fa-person-running',
            Cycling: 'fa-bicycle',
            Gym: 'fa-dumbbell',
            Yoga: 'fa-spa',
            Swimming: 'fa-water-ladder',
            Other: 'fa-ellipsis'
        };
        return map[type] || 'fa-dumbbell';
    }


    // =========================
    // 1. SET PAGE DATE
    // =========================
    if (pageDateEl) {
        const now = new Date();
        pageDateEl.textContent = DAYS[now.getDay()] + ', ' + now.getDate() + ' ' + MONTHS[now.getMonth()] + ' ' + now.getFullYear();
    }


    // =========================
    // 2. TYPE & INTENSITY PICKERS
    // =========================
    typePicker?.querySelectorAll('.type-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            typePicker.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            exerciseTypeInput.value = btn.dataset.type;
        });
    });

    intensityPicker?.querySelectorAll('.intensity-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            intensityPicker.querySelectorAll('.intensity-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            intensityInput.value = btn.dataset.intensity;
        });
    });


    // =========================
    // 3. SUBMIT EXERCISE
    // =========================
    form?.addEventListener('submit', (e) => {
        e.preventDefault();

        const duration = parseInt(durationInput.value, 10);
        if (!duration || duration < 1) return;

        const entry = {
            id: Date.now().toString(),
            type: exerciseTypeInput.value,
            duration: duration,
            intensity: intensityInput.value,
            notes: notesInput.value.trim(),
            date: new Date().toISOString()
        };

        const exercises = getExercises();
        exercises.unshift(entry);
        saveExercises(exercises);

        // Reset form
        durationInput.value = '';
        notesInput.value = '';

        // Show toast
        showToast();

        // Refresh UI
        renderAll();
    });

    function showToast() {
        toast?.classList.add('show');
        setTimeout(() => toast?.classList.remove('show'), 2500);
    }


    // =========================
    // 4. RENDER STATS
    // =========================
    function renderStats() {
        const exercises = getExercises();

        // Total sessions
        if (totalSessionsEl) totalSessionsEl.textContent = exercises.length;

        // This week's total minutes
        const weekMinutes = getWeekMinutes(exercises);
        if (weekTotalEl) weekTotalEl.innerHTML = weekMinutes + '<small>min</small>';

        // Streaks
        const { current, best } = calculateStreaks(exercises);
        if (currentStreakEl) currentStreakEl.textContent = current;
        if (bestStreakEl) bestStreakEl.textContent = best;

        // Weekly goal (in chart card)
        if (goalProgress) goalProgress.textContent = weekMinutes + ' / ' + WEEKLY_GOAL + ' min';
        if (goalBar) {
            goalBar.max = WEEKLY_GOAL;
            goalBar.value = Math.min(weekMinutes, WEEKLY_GOAL);
        }

        // Hero banner
        const heroTitle = document.getElementById('heroTitle');
        const heroSubtitle = document.getElementById('heroSubtitle');
        const heroRingFill = document.getElementById('heroRingFill');
        const heroRingValue = document.getElementById('heroRingValue');
        const heroRingTotal = document.getElementById('heroRingTotal');

        const totalMinutes = exercises.reduce((sum, e) => sum + e.duration, 0);
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        const timeStr = hours > 0 ? hours + ' hour' + (hours > 1 ? 's ' : ' ') + mins + ' min' : totalMinutes + ' minutes total';

        if (heroTitle) heroTitle.textContent = exercises.length + ' Exercise' + (exercises.length !== 1 ? 's' : '');
        if (heroSubtitle) heroSubtitle.textContent = timeStr;

        // Ring progress (circumference = 2 * PI * 52 = 326.73)
        if (heroRingFill) {
            const circumference = 326.73;
            const pct = Math.min(weekMinutes / WEEKLY_GOAL, 1);
            const offset = circumference - (pct * circumference);
            heroRingFill.style.strokeDashoffset = offset;
        }

        if (heroRingValue) heroRingValue.textContent = weekMinutes;
        if (heroRingTotal) heroRingTotal.textContent = '/' + WEEKLY_GOAL;
    }

    function getWeekMinutes(exercises) {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - dayOfWeek);
        startOfWeek.setHours(0, 0, 0, 0);

        return exercises
            .filter(e => new Date(e.date) >= startOfWeek)
            .reduce((sum, e) => sum + e.duration, 0);
    }

    function calculateStreaks(exercises) {
        if (exercises.length === 0) return { current: 0, best: 0 };

        // Get unique dates (sorted newest first)
        const uniqueDates = [...new Set(exercises.map(e => e.date.split('T')[0]))].sort().reverse();

        let current = 0;
        let best = 0;
        let streak = 0;
        const today = todayStr();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        // Check if streak includes today or yesterday
        if (uniqueDates[0] === today || uniqueDates[0] === yesterdayStr) {
            for (let i = 0; i < uniqueDates.length; i++) {
                const expected = new Date();
                expected.setDate(expected.getDate() - (uniqueDates[0] === today ? i : i + 1));
                const expectedStr = expected.toISOString().split('T')[0];

                if (uniqueDates[i] === expectedStr) {
                    streak++;
                } else {
                    break;
                }
            }
            current = streak;
        }

        // Calculate best streak from all dates
        const allDates = [...new Set(exercises.map(e => e.date.split('T')[0]))].sort();
        let tempStreak = 1;
        best = 1;

        for (let i = 1; i < allDates.length; i++) {
            const prev = new Date(allDates[i - 1]);
            const curr = new Date(allDates[i]);
            const diff = (curr - prev) / (1000 * 60 * 60 * 24);

            if (diff === 1) {
                tempStreak++;
                best = Math.max(best, tempStreak);
            } else {
                tempStreak = 1;
            }
        }

        best = Math.max(best, current);
        return { current, best };
    }


    // =========================
    // 5. RENDER WEEKLY CHART
    // =========================
    function renderChart() {
        const exercises = getExercises();
        const now = new Date();
        const dayOfWeek = now.getDay();

        // Build array of 7 days (Sun–Sat)
        const weekData = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(now);
            d.setDate(now.getDate() - dayOfWeek + i);
            const dateStr = d.toISOString().split('T')[0];
            const minutes = exercises
                .filter(e => e.date.split('T')[0] === dateStr)
                .reduce((sum, e) => sum + e.duration, 0);

            weekData.push({
                day: DAYS[i],
                minutes: minutes,
                isToday: i === dayOfWeek
            });
        }

        const maxMin = Math.max(...weekData.map(d => d.minutes), 30);

        // Bars
        if (chartBars) {
            chartBars.innerHTML = weekData.map(d => {
                const heightPct = d.minutes > 0 ? Math.max((d.minutes / maxMin) * 100, 5) : 5;
                const emptyClass = d.minutes === 0 ? ' empty' : '';
                return `
                    <section class="chart-bar-wrap">
                        <span class="chart-bar-value">${d.minutes > 0 ? d.minutes : ''}</span>
                        <span class="chart-bar${emptyClass}" style="height: ${heightPct}%" title="${d.minutes} min"></span>
                    </section>
                `;
            }).join('');
        }

        // Labels
        if (chartLabels) {
            chartLabels.innerHTML = weekData.map(d => {
                const todayClass = d.isToday ? ' today' : '';
                return `<span class="chart-label${todayClass}">${d.day}</span>`;
            }).join('');
        }
    }


    // =========================
    // 6. RENDER HISTORY
    // =========================
    function renderHistory() {
        const exercises = getExercises();

        if (exercises.length === 0) {
            if (historyEmpty) historyEmpty.style.display = 'flex';
            // Remove all history items
            historyList?.querySelectorAll('.history-item').forEach(el => el.remove());
            return;
        }

        if (historyEmpty) historyEmpty.style.display = 'none';

        // Remove old items
        historyList?.querySelectorAll('.history-item').forEach(el => el.remove());

        // Render latest 20
        const recent = exercises.slice(0, 20);
        recent.forEach(entry => {
            const item = document.createElement('article');
            item.className = 'history-item';
            item.dataset.id = entry.id;

            const badgeClass = entry.intensity === 'Light' ? 'badge-light' :
                               entry.intensity === 'Moderate' ? 'badge-moderate' : 'badge-intense';

            item.innerHTML = `
                <span class="history-icon-wrap">
                    <i class="fa-solid ${typeIcon(entry.type)}"></i>
                </span>
                <section class="history-details">
                    <p class="history-type">${entry.type}</p>
                    <section class="history-meta">
                        <span>${entry.duration} min</span>
                        <span class="intensity-badge ${badgeClass}">${entry.intensity}</span>
                        ${entry.notes ? '<span>' + entry.notes + '</span>' : ''}
                    </section>
                </section>
                <time class="history-date">${formatDate(entry.date)}<br>${formatTime(entry.date)}</time>
                <button class="history-delete" type="button" aria-label="Delete" data-id="${entry.id}">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            `;

            historyList?.insertBefore(item, historyEmpty);
        });
    }

    // Delete single entry
    historyList?.addEventListener('click', (e) => {
        const deleteBtn = e.target.closest('.history-delete');
        if (!deleteBtn) return;

        const id = deleteBtn.dataset.id;
        let exercises = getExercises();
        exercises = exercises.filter(ex => ex.id !== id);
        saveExercises(exercises);
        renderAll();
    });

    // Clear all
    clearHistoryBtn?.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all exercise history?')) {
            saveExercises([]);
            renderAll();
        }
    });


    // =========================
    // 7. RENDER ALL
    // =========================
    function renderAll() {
        renderStats();
        renderChart();
        renderHistory();
    }

    renderAll();

});