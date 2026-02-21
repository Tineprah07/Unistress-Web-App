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

    // In-memory cache
    let exercises = [];

    // =========================
    // CONSTANTS & ELEMENTS
    // =========================
    const WEEKLY_GOAL  = 150;

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

    const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    function todayStr() { return new Date().toISOString().split('T')[0]; }
    function formatDate(dateStr) { const d = new Date(dateStr); return d.getDate() + ' ' + MONTHS[d.getMonth()]; }
    function formatTime(dateStr) { const d = new Date(dateStr); return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }

    function typeIcon(type) {
        const map = { Walking: 'fa-person-walking', Running: 'fa-person-running', Cycling: 'fa-bicycle', Gym: 'fa-dumbbell', Yoga: 'fa-spa', Swimming: 'fa-water-ladder', Other: 'fa-ellipsis' };
        return map[type] || 'fa-dumbbell';
    }

    // Map API response to UI format
    function mapEntry(e) {
        return {
            id: String(e.id),
            type: e.exercise_type,
            duration: e.duration,
            intensity: e.intensity || 'Light',
            notes: e.notes || '',
            date: e.created_at
        };
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
    form?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const duration = parseInt(durationInput.value, 10);
        if (!duration || duration < 1) return;

        const body = {
            exercise_type: exerciseTypeInput.value,
            duration: duration,
            intensity: intensityInput.value,
            notes: notesInput.value.trim()
        };

        const result = await apiPost('/api/exercise', body);
        if (!result || result.error) return;

        exercises.unshift(mapEntry(result));

        notesInput.value = '';
        applySmartDefaults();
        showToast();
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
        if (totalSessionsEl) totalSessionsEl.textContent = exercises.length;

        const weekMinutes = getWeekMinutes(exercises);
        if (weekTotalEl) weekTotalEl.innerHTML = weekMinutes + '<small>min</small>';

        const { current, best } = calculateStreaks(exercises);
        if (currentStreakEl) currentStreakEl.textContent = current;
        if (bestStreakEl) bestStreakEl.textContent = best;

        if (goalProgress) goalProgress.textContent = weekMinutes + ' / ' + WEEKLY_GOAL + ' min';
        if (goalBar) { goalBar.max = WEEKLY_GOAL; goalBar.value = Math.min(weekMinutes, WEEKLY_GOAL); }

        const heroTitle = document.getElementById('heroTitle');
        const heroSubtitle = document.getElementById('heroSubtitle');
        const heroRingFill = document.getElementById('heroRingFill');
        const heroRingValue = document.getElementById('heroRingValue');
        const heroRingTotal = document.getElementById('heroRingTotal');

        if (heroTitle) heroTitle.textContent = exercises.length + ' Exercise' + (exercises.length !== 1 ? 's' : '');

        if (heroSubtitle) {
            if (weekMinutes >= WEEKLY_GOAL) heroSubtitle.textContent = "Amazing! You've hit your weekly goal of " + WEEKLY_GOAL + " min!";
            else if (weekMinutes > 0) heroSubtitle.textContent = (WEEKLY_GOAL - weekMinutes) + " min left to reach your " + WEEKLY_GOAL + " min weekly goal.";
            else heroSubtitle.textContent = "Stay active, stay sharp. Track your exercise this week.";
        }

        if (heroRingFill) {
            const circumference = 326.73;
            const pct = Math.min(weekMinutes / WEEKLY_GOAL, 1);
            heroRingFill.style.strokeDashoffset = circumference - (pct * circumference);
        }
        if (heroRingValue) heroRingValue.textContent = weekMinutes;
        if (heroRingTotal) heroRingTotal.textContent = '/' + WEEKLY_GOAL;
    }

    function getWeekMinutes(exs) {
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        return exs.filter(e => new Date(e.date) >= startOfWeek).reduce((sum, e) => sum + e.duration, 0);
    }

    function calculateStreaks(exs) {
        if (exs.length === 0) return { current: 0, best: 0 };
        const uniqueDates = [...new Set(exs.map(e => e.date.split('T')[0]))].sort().reverse();
        let current = 0;
        const today = todayStr();
        const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (uniqueDates[0] === today || uniqueDates[0] === yesterdayStr) {
            for (let i = 0; i < uniqueDates.length; i++) {
                const expected = new Date();
                expected.setDate(expected.getDate() - (uniqueDates[0] === today ? i : i + 1));
                if (uniqueDates[i] === expected.toISOString().split('T')[0]) current++;
                else break;
            }
        }

        const allDates = [...new Set(exs.map(e => e.date.split('T')[0]))].sort();
        let tempStreak = 1, best = 1;
        for (let i = 1; i < allDates.length; i++) {
            const diff = (new Date(allDates[i]) - new Date(allDates[i - 1])) / (1000 * 60 * 60 * 24);
            if (diff === 1) { tempStreak++; best = Math.max(best, tempStreak); }
            else tempStreak = 1;
        }
        best = Math.max(best, current);
        return { current, best };
    }

    // =========================
    // 5. RENDER WEEKLY CHART
    // =========================
    function renderChart() {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const weekData = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(now); d.setDate(now.getDate() - dayOfWeek + i);
            const dateStr = d.toISOString().split('T')[0];
            const minutes = exercises.filter(e => e.date.split('T')[0] === dateStr).reduce((sum, e) => sum + e.duration, 0);
            weekData.push({ day: DAYS[i], minutes, isToday: i === dayOfWeek });
        }
        const maxMin = Math.max(...weekData.map(d => d.minutes), 30);

        if (chartBars) {
            chartBars.innerHTML = weekData.map(d => {
                const heightPct = d.minutes > 0 ? Math.max((d.minutes / maxMin) * 100, 5) : 5;
                const emptyClass = d.minutes === 0 ? ' empty' : '';
                return `<section class="chart-bar-wrap"><span class="chart-bar-value">${d.minutes > 0 ? d.minutes : ''}</span><span class="chart-bar${emptyClass}" style="height: ${heightPct}%" title="${d.minutes} min"></span></section>`;
            }).join('');
        }
        if (chartLabels) {
            chartLabels.innerHTML = weekData.map(d => `<span class="chart-label${d.isToday ? ' today' : ''}">${d.day}</span>`).join('');
        }
    }

    // =========================
    // 6. RENDER HISTORY
    // =========================
    function renderHistory() {
        if (exercises.length === 0) {
            if (historyEmpty) historyEmpty.style.display = 'flex';
            historyList?.querySelectorAll('.history-item').forEach(el => el.remove());
            return;
        }
        if (historyEmpty) historyEmpty.style.display = 'none';
        historyList?.querySelectorAll('.history-item').forEach(el => el.remove());

        exercises.slice(0, 20).forEach(entry => {
            const item = document.createElement('article');
            item.className = 'history-item';
            item.dataset.id = entry.id;
            const badgeClass = entry.intensity === 'Light' ? 'badge-light' : entry.intensity === 'Moderate' ? 'badge-moderate' : 'badge-intense';

            item.innerHTML = `
                <span class="history-icon-wrap"><i class="fa-solid ${typeIcon(entry.type)}"></i></span>
                <section class="history-details">
                    <p class="history-type">${entry.type}</p>
                    <section class="history-meta">
                        <span>${entry.duration} min</span>
                        <span class="intensity-badge ${badgeClass}">${entry.intensity}</span>
                        ${entry.notes ? '<span>' + entry.notes + '</span>' : ''}
                    </section>
                </section>
                <time class="history-date">${formatDate(entry.date)}<br>${formatTime(entry.date)}</time>
                <button class="history-delete" type="button" aria-label="Delete" data-id="${entry.id}"><i class="fa-solid fa-trash-can"></i></button>
            `;
            historyList?.insertBefore(item, historyEmpty);
        });
    }

    historyList?.addEventListener('click', async (e) => {
        const deleteBtn = e.target.closest('.history-delete');
        if (!deleteBtn) return;
        await apiDelete('/api/exercise/' + deleteBtn.dataset.id);
        exercises = exercises.filter(ex => ex.id !== deleteBtn.dataset.id);
        renderAll();
    });

    clearHistoryBtn?.addEventListener('click', async () => {
        if (confirm('Are you sure you want to clear all exercise history?')) {
            await apiDelete('/api/exercise');
            exercises = [];
            renderAll();
        }
    });

    // =========================
    // 7. RENDER ALL & INIT
    // =========================
    function renderAll() { renderStats(); renderChart(); renderHistory(); }

    function applySmartDefaults() {
        if (exercises.length === 0) return;

        const last = exercises[0];

        // Pre-select last exercise type
        if (last.type && typePicker) {
            typePicker.querySelectorAll('.type-btn').forEach(b => b.classList.toggle('active', b.dataset.type === last.type));
            if (exerciseTypeInput) exerciseTypeInput.value = last.type;
        }

        // Pre-select last intensity
        if (last.intensity && intensityPicker) {
            intensityPicker.querySelectorAll('.intensity-btn').forEach(b => b.classList.toggle('active', b.dataset.intensity === last.intensity));
            if (intensityInput) intensityInput.value = last.intensity;
        }

        // Pre-fill average duration for this exercise type
        const sameType = exercises.filter(e => e.type === last.type);
        if (sameType.length > 0 && durationInput) {
            const avgDuration = Math.round(sameType.reduce((s, e) => s + e.duration, 0) / sameType.length);
            durationInput.value = avgDuration;
        }
    }

    async function init() {
        const data = await apiGet('/api/exercise?limit=200');
        if (data && Array.isArray(data)) {
            exercises = data.map(mapEntry);
        }
        applySmartDefaults();
        renderAll();
    }

    init();

    // =========================
    // FITBIT INTEGRATION
    // =========================
    async function loadFitbitActivity() {
        if (!window.Fitbit || !Fitbit.connected) return;

        var activity = await Fitbit.getActivity();
        if (!activity) return;

        var fbSteps = document.getElementById('fbSteps');
        var fbCalories = document.getElementById('fbCalories');
        var fbActiveMin = document.getElementById('fbActiveMin');

        if (fbSteps) fbSteps.textContent = Fitbit.formatNumber(activity.steps);
        if (fbCalories) fbCalories.textContent = Fitbit.formatNumber(activity.calories);
        if (fbActiveMin) fbActiveMin.innerHTML = (activity.active_minutes || 0) + '<small>min</small>';

        var syncLabel = document.getElementById('fbExerciseLastSync');
        if (syncLabel) syncLabel.textContent = 'Updated ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    if (window.Fitbit) {
        Fitbit.onStatusChange(function (connected) {
            if (connected) loadFitbitActivity();
        });
    }

});