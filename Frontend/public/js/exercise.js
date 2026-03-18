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

    // Fitbit state
    let fitbitConnected = false;

    // =========================
    // CONSTANTS & ELEMENTS
    // =========================
    let WEEKLY_GOAL = 150;
    let DAILY_GOAL  = 30;

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

    // Goal loading and editing
    async function loadGoals() {
        try {
            const goals = await apiGet('/api/goals');
            if (goals && !goals.error) {
                if (goals.exercise_weekly_min) WEEKLY_GOAL = goals.exercise_weekly_min;
                DAILY_GOAL = Math.round(WEEKLY_GOAL / 7);
            }
        } catch (e) { /* use defaults */ }
    }

    function openGoalPopover() {
        document.querySelector('.goal-popover')?.remove();
        const btn = document.getElementById('editGoalsBtn');
        const rect = btn.getBoundingClientRect();

        const pop = document.createElement('div');
        pop.className = 'goal-popover';
        pop.innerHTML = `
            <header class="goal-popover-header">
                <span class="goal-popover-title"><i class="fa-solid fa-bullseye"></i> Exercise Goals</span>
                <button class="goal-popover-close" type="button"><i class="fa-solid fa-xmark"></i></button>
            </header>
            <div class="goal-popover-divider">
                <div class="goal-field">
                    <label class="goal-field-label">Daily <span class="goal-field-hint">min/day</span></label>
                    <input class="goal-field-input" type="number" id="goalDaily" min="1" max="300" value="${DAILY_GOAL}">
                </div>
                <div class="goal-field">
                    <label class="goal-field-label">Weekly <span class="goal-field-hint">min/week</span></label>
                    <input class="goal-field-input" type="number" id="goalWeekly" min="7" max="2100" value="${WEEKLY_GOAL}">
                </div>
            </div>
            <div class="goal-popover-actions">
                <button class="goal-save-btn" type="button">Save</button>
                <button class="goal-cancel-btn" type="button">Cancel</button>
            </div>
        `;
        document.body.appendChild(pop);

        let left = rect.left;
        if (left + 290 > window.innerWidth - 12) left = window.innerWidth - 302;
        if (left < 12) left = 12;
        pop.style.top  = (rect.bottom + 8) + 'px';
        pop.style.left = left + 'px';

        const dailyIn  = pop.querySelector('#goalDaily');
        const weeklyIn = pop.querySelector('#goalWeekly');
        dailyIn.addEventListener('input',  () => { weeklyIn.value = Math.round(parseFloat(dailyIn.value  || 0) * 7); });
        weeklyIn.addEventListener('input', () => { dailyIn.value  = Math.round(parseFloat(weeklyIn.value || 0) / 7); });

        function close() { pop.remove(); document.removeEventListener('mousedown', outside); }
        function outside(e) { if (!pop.contains(e.target) && e.target !== btn) close(); }
        setTimeout(() => document.addEventListener('mousedown', outside), 0);
        pop.querySelector('.goal-popover-close').addEventListener('click', close);
        pop.querySelector('.goal-cancel-btn').addEventListener('click', close);

        pop.querySelector('.goal-save-btn').addEventListener('click', () => {
            const d = parseInt(dailyIn.value, 10);
            const w = parseInt(weeklyIn.value, 10);
            if (!d || d < 1 || !w || w < 7) return;
            DAILY_GOAL = d; WEEKLY_GOAL = w;
            renderAll(); close();
            fetch('/api/goals', { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ exercise_weekly_min: w }) }).catch(() => {});
        });
    }

    document.getElementById('editGoalsBtn')?.addEventListener('click', openGoalPopover);

    const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    function todayStr() { return new Date().toISOString().split('T')[0]; }
    function formatDate(dateStr) { const d = new Date(dateStr); return d.getDate() + ' ' + MONTHS[d.getMonth()]; }
    function formatTime(dateStr) { const d = new Date(dateStr); return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }

    function typeIcon(type) {
        const map = { Walking: 'fa-person-walking', Running: 'fa-person-running', Cycling: 'fa-bicycle', Gym: 'fa-dumbbell', Yoga: 'fa-spa', Swimming: 'fa-water-ladder', Other: 'fa-ellipsis' };
        return map[type] || 'fa-dumbbell';
    }

    // Convert Fitbit steps to estimated active minutes (100 steps = 1 minute)
    const STEPS_PER_MINUTE = 100;
    function stepsToMinutes(steps) {
        return Math.round((steps || 0) / STEPS_PER_MINUTE);
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

    // Fitbit daily data: { steps, activeMinutes, estimatedMinutes }
    let fitbitDayData = {};

    // Load Fitbit activity data for the current week
    async function loadFitbitWeeklyData() {
        if (!window.Fitbit || !Fitbit.connected) {
            fitbitConnected = false;
            fitbitDayData = {};
            return;
        }
        fitbitConnected = true;

        try {
            const now = new Date();
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay());
            const start = startOfWeek.toISOString().split('T')[0];
            const end = now.toISOString().split('T')[0];

            // Build array of dates for the week (Sun to today)
            const weekDates = [];
            for (let d = new Date(startOfWeek); d <= now; d.setDate(d.getDate() + 1)) {
                weekDates.push(d.toISOString().split('T')[0]);
            }

            // Fetch steps for the week AND activity for each day in parallel
            const [stepsData, ...activityResults] = await Promise.all([
                Fitbit.getSteps(start, end),
                ...weekDates.map(date => Fitbit.getActivity(false, date))
            ]);

            fitbitDayData = {};

            // Populate steps for each day
            if (stepsData && Array.isArray(stepsData)) {
                stepsData.forEach(d => {
                    fitbitDayData[d.date] = {
                        steps: d.steps || 0,
                        activeMinutes: 0,
                        estimatedMinutes: stepsToMinutes(d.steps || 0)
                    };
                });
            }

            // Override with real active minutes for each day
            activityResults.forEach((activity, i) => {
                if (activity && activity.active_minutes > 0) {
                    const dateStr = weekDates[i];
                    if (!fitbitDayData[dateStr]) {
                        fitbitDayData[dateStr] = { steps: activity.steps || 0, activeMinutes: 0, estimatedMinutes: 0 };
                    }
                    fitbitDayData[dateStr].activeMinutes = activity.active_minutes;
                    if (activity.steps && !fitbitDayData[dateStr].steps) {
                        fitbitDayData[dateStr].steps = activity.steps;
                        fitbitDayData[dateStr].estimatedMinutes = stepsToMinutes(activity.steps);
                    }
                }
            });
        } catch (e) {
            console.warn('Failed to load Fitbit weekly data:', e);
        }
    }

    // Get Fitbit contribution in minutes for a given date.
    // Uses active minutes (watch) if available, otherwise falls back to steps estimate.
    function getFitbitMinutes(dateStr) {
        const data = fitbitDayData[dateStr];
        if (!data) return 0;
        return data.activeMinutes > 0 ? data.activeMinutes : data.estimatedMinutes;
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

        const weekData = getWeekMinutes(exercises);
        const weekMinutes = weekData.total;
        if (weekTotalEl) weekTotalEl.innerHTML = weekMinutes + '<small>min</small>';

        const { current, best } = calculateStreaks(exercises);
        if (currentStreakEl) currentStreakEl.textContent = current;
        if (bestStreakEl) bestStreakEl.textContent = best;

        if (goalProgress) {
            if (fitbitConnected && weekData.fitbit > 0) {
                goalProgress.textContent = weekMinutes + ' / ' + WEEKLY_GOAL + ' min (Manual: ' + weekData.manual + ' + Fitbit: ' + weekData.fitbit + ')';
            } else {
                goalProgress.textContent = weekMinutes + ' / ' + WEEKLY_GOAL + ' min';
            }
        }
        if (goalBar) { goalBar.max = WEEKLY_GOAL; goalBar.value = Math.min(weekMinutes, WEEKLY_GOAL); }

        const heroTitle = document.getElementById('heroTitle');
        const heroSubtitle = document.getElementById('heroSubtitle');
        const heroRingFill = document.getElementById('heroRingFill');
        const heroRingValue = document.getElementById('heroRingValue');
        const heroRingTotal = document.getElementById('heroRingTotal');

        if (heroTitle) heroTitle.textContent = 'Exercise Tracker';

        const todayManual = exercises.filter(e => e.date.split('T')[0] === todayStr()).reduce((sum, e) => sum + e.duration, 0);
        const todayFitbit = fitbitConnected ? getFitbitMinutes(todayStr()) : 0;
        const todayTotal  = todayManual + todayFitbit;

        if (heroSubtitle) {
            if (todayTotal >= DAILY_GOAL) heroSubtitle.textContent = "Daily goal hit! Great work today.";
            else if (todayTotal > 0) heroSubtitle.textContent = (DAILY_GOAL - todayTotal) + " min left to hit today's goal.";
            else heroSubtitle.textContent = "Stay active, stay sharp. Log today's exercise.";
        }

        if (heroRingFill) {
            const circumference = 326.73;
            const pct = Math.min(todayTotal / DAILY_GOAL, 1);
            heroRingFill.style.strokeDashoffset = circumference - (pct * circumference);
        }
        if (heroRingValue) heroRingValue.textContent = todayTotal;
        if (heroRingTotal) heroRingTotal.textContent = '/' + DAILY_GOAL;
    }

    function getWeekMinutes(exs) {
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        // Manual exercise minutes
        const manualMin = exs.filter(e => new Date(e.date) >= startOfWeek).reduce((sum, e) => sum + e.duration, 0);

        // Fitbit minutes (active minutes from watch, or estimated from steps)
        let fitbitMin = 0;
        if (fitbitConnected) {
            for (let i = 0; i < 7; i++) {
                const d = new Date(now); d.setDate(now.getDate() - now.getDay() + i);
                const ds = d.toISOString().split('T')[0];
                if (d <= now) fitbitMin += getFitbitMinutes(ds);
            }
        }

        return { manual: manualMin, fitbit: fitbitMin, total: manualMin + fitbitMin };
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
            const manualMin = exercises.filter(e => e.date.split('T')[0] === dateStr).reduce((sum, e) => sum + e.duration, 0);
            const fitbitMin = fitbitConnected ? getFitbitMinutes(dateStr) : 0;
            weekData.push({ day: DAYS[i], dateStr, manual: manualMin, fitbit: fitbitMin, total: manualMin + fitbitMin, isToday: i === dayOfWeek });
        }
        const maxMin = Math.max(...weekData.map(d => d.total), 30);

        if (chartBars) {
            chartBars.innerHTML = weekData.map(d => {
                const totalPct = d.total > 0 ? Math.max((d.total / maxMin) * 100, 5) : 5;
                const manualPct = d.total > 0 ? (d.manual / d.total) * 100 : 0;
                const fitbitPct = d.total > 0 ? (d.fitbit / d.total) * 100 : 0;
                const emptyClass = d.total === 0 ? ' empty' : '';

                if (d.fitbit > 0 && d.manual > 0) {
                    return `<section class="chart-bar-wrap">
                        <span class="chart-bar-value">${d.total}</span>
                        <span class="chart-bar chart-bar-stacked${emptyClass}" style="height:${totalPct}%" title="Manual: ${d.manual} min + Fitbit: ${d.fitbit} min">
                            <span class="bar-segment bar-fitbit" style="height:${fitbitPct}%"></span>
                            <span class="bar-segment bar-manual" style="height:${manualPct}%"></span>
                        </span>
                    </section>`;
                } else if (d.fitbit > 0) {
                    return `<section class="chart-bar-wrap">
                        <span class="chart-bar-value">${d.fitbit}</span>
                        <span class="chart-bar bar-fitbit-only${emptyClass}" style="height:${totalPct}%" title="Fitbit: ${d.fitbit} min (${Fitbit.formatNumber((fitbitDayData[d.dateStr] && fitbitDayData[d.dateStr].steps) || 0)} steps)"></span>
                    </section>`;
                } else {
                    return `<section class="chart-bar-wrap">
                        <span class="chart-bar-value">${d.manual > 0 ? d.manual : ''}</span>
                        <span class="chart-bar${emptyClass}" style="height:${totalPct}%" title="${d.manual} min"></span>
                    </section>`;
                }
            }).join('');
        }
        if (chartLabels) {
            chartLabels.innerHTML = weekData.map(d => `<span class="chart-label${d.isToday ? ' today' : ''}">${d.day}</span>`).join('');
        }

        // Add chart legend if Fitbit data exists
        const legendEl = document.getElementById('chartLegend');
        if (legendEl) {
            if (fitbitConnected && Object.keys(fitbitDayData).length > 0) {
                legendEl.innerHTML = '<span class="legend-item"><span class="legend-dot legend-manual"></span>Manual</span><span class="legend-item"><span class="legend-dot legend-fitbit"></span>Fitbit Steps</span>';
                legendEl.style.display = 'flex';
            } else {
                legendEl.style.display = 'none';
            }
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
        await loadGoals();
        const data = await apiGet('/api/exercise?limit=200');
        if (data && Array.isArray(data)) exercises = data.map(mapEntry);
        applySmartDefaults();
        renderAll();
        if (window.Fitbit) {
            await Fitbit.ready;
            await loadFitbitWeeklyData();
            renderAll();
        }
    }

    init();

    // =========================
    // FITBIT INTEGRATION
    // =========================
    var STEP_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    function getWeekRange() {
        var now = new Date();
        var dates = [];
        for (var i = 6; i >= 0; i--) {
            var d = new Date(now);
            d.setDate(now.getDate() - i);
            dates.push(d.toISOString().split('T')[0]);
        }
        return dates;
    }

    async function loadFitbitActivity(refresh) {
        if (!window.Fitbit || !Fitbit.connected) return;

        var weekDates = getWeekRange();
        var startDate = weekDates[0];
        var endDate = weekDates[6];

        // Fetch activity + 7-day steps in parallel
        var activity, stepsData;
        try {
            var results = await Promise.all([
                Fitbit.getActivity(refresh),
                Fitbit.getSteps(startDate, endDate, refresh)
            ]);
            activity = results[0];
            stepsData = results[1];
        } catch (e) {
            console.warn('Fitbit activity fetch error:', e);
            return;
        }

        // ── Animated stat counters ──
        if (activity) {
            Fitbit.animateValue(document.getElementById('fbSteps'), activity.steps || 0, '');
            Fitbit.animateValue(document.getElementById('fbCalories'), activity.calories || 0, '');
            Fitbit.animateValue(document.getElementById('fbActiveMin'), activity.active_minutes || 0, '<small>min</small>');
        }

        // ── 7-Day Step Area Chart ──
        var svgEl = document.getElementById('fbAreaSvg');
        var dotsEl = document.getElementById('fbAreaDots');
        var tooltipsEl = document.getElementById('fbAreaTooltips');
        var labelsEl = document.getElementById('fbStepLabels');
        var avgEl = document.getElementById('fbStepAvg');

        if (svgEl && stepsData && Array.isArray(stepsData)) {
            var todayStr = new Date().toISOString().split('T')[0];
            var stepMap = {};
            stepsData.forEach(function (d) { stepMap[d.date] = d.steps; });

            var stepValues = weekDates.map(function (dt) { return stepMap[dt] || 0; });
            var maxSteps = Math.max.apply(null, stepValues.concat([1000]));
            var totalSteps = stepValues.reduce(function (s, v) { return s + v; }, 0);
            var daysWithData = stepValues.filter(function (v) { return v > 0; }).length || 1;

            if (avgEl) avgEl.textContent = 'Avg: ' + Fitbit.formatNumber(Math.round(totalSteps / daysWithData));

            // Chart dimensions (matching viewBox 300x120)
            var W = 300, H = 120, padX = 20, padY = 12;
            var chartW = W - padX * 2;
            var chartH = H - padY * 2;

            // Calculate points
            var points = stepValues.map(function (val, i) {
                var x = padX + (i / 6) * chartW;
                var y = padY + chartH - (val / maxSteps) * chartH;
                return { x: x, y: y, val: val };
            });

            // Build smooth line path using cardinal spline
            var linePath = 'M' + points.map(function (p) { return p.x + ',' + p.y; }).join(' L');

            // Area path (line + close to bottom)
            var areaPath = linePath + ' L' + points[points.length - 1].x + ',' + (H - padY) + ' L' + points[0].x + ',' + (H - padY) + ' Z';

            // Grid lines
            var gridLines = '';
            for (var g = 0; g <= 3; g++) {
                var gy = padY + (g / 3) * chartH;
                gridLines += '<line class="fitbit-area-grid" x1="' + padX + '" y1="' + gy + '" x2="' + (W - padX) + '" y2="' + gy + '"/>';
            }

            svgEl.innerHTML =
                '<defs>' +
                    '<linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">' +
                        '<stop offset="0%" stop-color="#00B0B9" stop-opacity="0.5"/>' +
                        '<stop offset="100%" stop-color="#00D4AA" stop-opacity="0.05"/>' +
                    '</linearGradient>' +
                '</defs>' +
                gridLines +
                '<path class="fitbit-area-fill" d="' + areaPath + '"/>' +
                '<path class="fitbit-area-line" d="' + linePath + '"/>';

            // Dots and tooltips overlay
            if (dotsEl) {
                dotsEl.innerHTML = points.map(function (p, i) {
                    var isToday = weekDates[i] === todayStr;
                    var isEmpty = p.val === 0;
                    var cls = 'fitbit-area-dot' + (isToday ? ' today' : '') + (isEmpty ? ' empty' : '');
                    var left = (p.x / W * 100).toFixed(2) + '%';
                    var top = (p.y / H * 100).toFixed(2) + '%';
                    return '<span class="' + cls + '" style="left:' + left + ';top:' + top + '"></span>';
                }).join('');
            }

            if (tooltipsEl) {
                tooltipsEl.innerHTML = points.map(function (p, i) {
                    var valText = p.val > 0 ? (p.val >= 1000 ? (p.val / 1000).toFixed(1) + 'k' : p.val) : '';
                    var left = (p.x / W * 100).toFixed(2) + '%';
                    var top = (p.y / H * 100).toFixed(2) + '%';
                    var vis = p.val > 0 ? ' visible' : '';
                    return '<span class="fitbit-area-tooltip' + vis + '" style="left:' + left + ';top:' + top + '">' + valText + '</span>';
                }).join('');
            }

            if (labelsEl) {
                labelsEl.innerHTML = weekDates.map(function (dt) {
                    var d = new Date(dt + 'T12:00:00');
                    var isToday = dt === todayStr;
                    return '<span' + (isToday ? ' class="today"' : '') + '>' + STEP_DAYS[d.getDay()] + '</span>';
                }).join('');
            }
        }

        var syncLabel = document.getElementById('fbExerciseLastSync');
        if (syncLabel) syncLabel.textContent = 'Updated ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    if (window.Fitbit) {
        Fitbit.onStatusChange(async function (connected, refresh) {
            fitbitConnected = connected;
            try {
                if (connected) {
                    loadFitbitActivity(refresh);
                    await loadFitbitWeeklyData();
                    renderAll();
                } else {
                    fitbitDayData = {};
                    renderAll();
                }
            } catch (e) { console.warn('Fitbit activity load error:', e); }
        });
    }

});