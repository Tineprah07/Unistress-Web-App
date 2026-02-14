document.addEventListener('DOMContentLoaded', () => {

    // =========================
    // CONSTANTS & ELEMENTS
    // =========================
    const STORAGE_KEY = 'unistress_hydration';
    const DAILY_GOAL  = 8; // glasses per day
    const ML_PER_GLASS = 250;

    const glassCountEl   = document.getElementById('glassCount');
    const glassGoalEl    = document.getElementById('glassGoal');
    const waterMlEl      = document.getElementById('waterMl');
    const waterGlassBig  = document.getElementById('waterGlassBig');
    const todayGlassesEl = document.getElementById('todayGlasses');
    const currentStreakEl = document.getElementById('currentStreak');
    const bestStreakEl    = document.getElementById('bestStreak');
    const weekAvgEl      = document.getElementById('weekAvg');
    const goalText       = document.getElementById('goalText');
    const goalBar        = document.getElementById('goalBar');
    const heroRingFill   = document.getElementById('heroRingFill');
    const heroRingValue  = document.getElementById('heroRingValue');
    const heroRingTotal  = document.getElementById('heroRingTotal');
    const heroSubtitle   = document.getElementById('heroSubtitle');
    const chartBars      = document.getElementById('chartBars');
    const chartLabels    = document.getElementById('chartLabels');
    const historyList    = document.getElementById('historyList');
    const historyEmpty   = document.getElementById('historyEmpty');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    const undoBtn        = document.getElementById('undoBtn');
    const customForm     = document.getElementById('customForm');
    const customAmount   = document.getElementById('customAmount');
    const toast          = document.getElementById('toast');
    const toastMsg       = document.getElementById('toastMsg');

    const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // =========================
    // HELPERS
    // =========================
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

    function getEntries() {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
        catch { return []; }
    }

    function saveEntries(data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    function getTodayGlasses(entries) {
        const today = todayStr();
        return entries
            .filter(e => e.date.split('T')[0] === today)
            .reduce((sum, e) => sum + e.glasses, 0);
    }

    function showToast(msg) {
        if (toastMsg) toastMsg.textContent = msg || 'Water logged!';
        toast?.classList.add('show');
        setTimeout(() => toast?.classList.remove('show'), 2500);
    }

    function animateGlass() {
        waterGlassBig?.classList.add('animate');
        setTimeout(() => waterGlassBig?.classList.remove('animate'), 400);
    }


    // =========================
    // 1. ADD WATER
    // =========================
    function addWater(glasses) {
        if (!glasses || glasses < 1) return;

        const entry = {
            id: Date.now().toString(),
            glasses: glasses,
            ml: glasses * ML_PER_GLASS,
            date: new Date().toISOString()
        };

        const entries = getEntries();
        entries.unshift(entry);
        saveEntries(entries);

        animateGlass();
        showToast('+' + glasses + ' glass' + (glasses > 1 ? 'es' : '') + ' added!');
        renderAll();
    }

    // Quick-add buttons
    document.querySelectorAll('.quick-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const amount = parseInt(btn.dataset.amount, 10);
            addWater(amount);
        });
    });

    // Custom add
    customForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const val = parseInt(customAmount.value, 10);
        if (val >= 1) {
            addWater(val);
            customAmount.value = '';
        }
    });

    // Undo last
    undoBtn?.addEventListener('click', () => {
        const entries = getEntries();
        if (entries.length === 0) return;
        entries.shift();
        saveEntries(entries);
        showToast('Last entry undone');
        renderAll();
    });


    // =========================
    // 2. RENDER STATS
    // =========================
    function renderStats() {
        const entries = getEntries();
        const todayGlasses = getTodayGlasses(entries);

        // Today's count
        if (glassCountEl) glassCountEl.textContent = todayGlasses;
        if (glassGoalEl) glassGoalEl.textContent = DAILY_GOAL;
        if (waterMlEl) waterMlEl.textContent = (todayGlasses * ML_PER_GLASS) + ' ml';
        if (todayGlassesEl) todayGlassesEl.textContent = todayGlasses;

        // Goal progress
        if (goalText) goalText.textContent = todayGlasses + ' / ' + DAILY_GOAL + ' glasses';
        if (goalBar) {
            goalBar.max = DAILY_GOAL;
            goalBar.value = Math.min(todayGlasses, DAILY_GOAL);
        }

        // Hero ring
        if (heroRingFill) {
            const circumference = 326.73;
            const pct = Math.min(todayGlasses / DAILY_GOAL, 1);
            heroRingFill.style.strokeDashoffset = circumference - (pct * circumference);
        }
        if (heroRingValue) heroRingValue.textContent = todayGlasses;
        if (heroRingTotal) heroRingTotal.textContent = '/' + DAILY_GOAL;

        // Hero subtitle
        if (heroSubtitle) {
            if (todayGlasses >= DAILY_GOAL) {
                heroSubtitle.textContent = "Goal reached! Keep it up!";
            } else {
                const remaining = DAILY_GOAL - todayGlasses;
                heroSubtitle.textContent = remaining + ' more glass' + (remaining !== 1 ? 'es' : '') + ' to reach your goal.';
            }
        }

        // Streaks
        const { current, best } = calculateStreaks(entries);
        if (currentStreakEl) currentStreakEl.textContent = current;
        if (bestStreakEl) bestStreakEl.textContent = best;

        // Weekly average
        const weekData = getWeekData(entries);
        const daysWithData = weekData.filter(d => d > 0).length || 1;
        const weekTotal = weekData.reduce((s, d) => s + d, 0);
        if (weekAvgEl) weekAvgEl.textContent = Math.round(weekTotal / daysWithData);
    }

    function calculateStreaks(entries) {
        if (entries.length === 0) return { current: 0, best: 0 };

        // Get unique dates where goal was met
        const dateGlasses = {};
        entries.forEach(e => {
            const d = e.date.split('T')[0];
            dateGlasses[d] = (dateGlasses[d] || 0) + e.glasses;
        });

        const metDates = Object.keys(dateGlasses)
            .filter(d => dateGlasses[d] >= DAILY_GOAL)
            .sort()
            .reverse();

        if (metDates.length === 0) return { current: 0, best: 0 };

        const today = todayStr();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        let current = 0;
        if (metDates[0] === today || metDates[0] === yesterdayStr) {
            for (let i = 0; i < metDates.length; i++) {
                const expected = new Date();
                expected.setDate(expected.getDate() - (metDates[0] === today ? i : i + 1));
                if (metDates[i] === expected.toISOString().split('T')[0]) {
                    current++;
                } else break;
            }
        }

        const allSorted = metDates.slice().sort();
        let best = 1, temp = 1;
        for (let i = 1; i < allSorted.length; i++) {
            const diff = (new Date(allSorted[i]) - new Date(allSorted[i - 1])) / (1000 * 60 * 60 * 24);
            if (diff === 1) { temp++; best = Math.max(best, temp); }
            else temp = 1;
        }

        best = Math.max(best, current);
        return { current, best };
    }


    // =========================
    // 3. RENDER WEEKLY CHART
    // =========================
    function getWeekData(entries) {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const data = [];

        for (let i = 0; i < 7; i++) {
            const d = new Date(now);
            d.setDate(now.getDate() - dayOfWeek + i);
            const dateStr = d.toISOString().split('T')[0];
            const glasses = entries
                .filter(e => e.date.split('T')[0] === dateStr)
                .reduce((sum, e) => sum + e.glasses, 0);
            data.push(glasses);
        }
        return data;
    }

    function renderChart() {
        const entries = getEntries();
        const now = new Date();
        const dayOfWeek = now.getDay();
        const weekData = getWeekData(entries);
        const maxVal = Math.max(...weekData, DAILY_GOAL);

        if (chartBars) {
            chartBars.innerHTML = weekData.map((glasses, i) => {
                const heightPct = glasses > 0 ? Math.max((glasses / maxVal) * 100, 5) : 5;
                const emptyClass = glasses === 0 ? ' empty' : '';
                return `
                    <section class="chart-bar-wrap">
                        <span class="chart-bar-value">${glasses > 0 ? glasses : ''}</span>
                        <span class="chart-bar${emptyClass}" style="height: ${heightPct}%" title="${glasses} glasses"></span>
                    </section>
                `;
            }).join('');
        }

        if (chartLabels) {
            chartLabels.innerHTML = DAYS.map((day, i) => {
                const todayClass = i === dayOfWeek ? ' today' : '';
                return `<span class="chart-label${todayClass}">${day}</span>`;
            }).join('');
        }
    }


    // =========================
    // 4. RENDER HISTORY
    // =========================
    function renderHistory() {
        const entries = getEntries();

        if (entries.length === 0) {
            if (historyEmpty) historyEmpty.style.display = 'flex';
            historyList?.querySelectorAll('.history-item').forEach(el => el.remove());
            return;
        }

        if (historyEmpty) historyEmpty.style.display = 'none';
        historyList?.querySelectorAll('.history-item').forEach(el => el.remove());

        const recent = entries.slice(0, 20);
        recent.forEach(entry => {
            const item = document.createElement('article');
            item.className = 'history-item';

            item.innerHTML = `
                <span class="history-icon-wrap">
                    <i class="fa-solid fa-glass-water"></i>
                </span>
                <section class="history-details">
                    <p class="history-type">${entry.glasses} Glass${entry.glasses > 1 ? 'es' : ''}</p>
                    <p class="history-meta">${entry.ml} ml</p>
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
        let entries = getEntries();
        entries = entries.filter(en => en.id !== deleteBtn.dataset.id);
        saveEntries(entries);
        renderAll();
    });

    // Clear all
    clearHistoryBtn?.addEventListener('click', () => {
        if (confirm('Clear all hydration history?')) {
            saveEntries([]);
            renderAll();
        }
    });


    // =========================
    // 5. RENDER ALL
    // =========================
    function renderAll() {
        renderStats();
        renderChart();
        renderHistory();
    }

    renderAll();

});