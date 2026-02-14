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
    let entries = [];

    const SLEEP_GOAL  = 8;

    const form          = document.getElementById('sleepForm');
    const qualityPicker = document.getElementById('qualityPicker');
    const qualityInput  = document.getElementById('quality');
    const bedtimeInput  = document.getElementById('bedtime');
    const wakeTimeInput = document.getElementById('wakeTime');
    const notesInput    = document.getElementById('sleepNotes');
    const toast         = document.getElementById('toast');

    const lastSleepEl    = document.getElementById('lastSleep');
    const weekAvgEl      = document.getElementById('weekAvg');
    const currentStreakEl = document.getElementById('currentStreak');
    const bestStreakEl    = document.getElementById('bestStreak');
    const goalText       = document.getElementById('goalText');
    const goalBar        = document.getElementById('goalBar');
    const heroRingFill   = document.getElementById('heroRingFill');
    const heroRingValue  = document.getElementById('heroRingValue');
    const heroSubtitle   = document.getElementById('heroSubtitle');

    const chartBars      = document.getElementById('chartBars');
    const chartLabels    = document.getElementById('chartLabels');
    const historyList    = document.getElementById('historyList');
    const historyEmpty   = document.getElementById('historyEmpty');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');

    const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const QUALITY_LABELS = ['', 'Very Poor', 'Poor', 'Okay', 'Good', 'Excellent'];
    const QUALITY_EMOJIS = ['', '😫', '😕', '😐', '😊', '😴'];

    function todayStr() { return new Date().toISOString().split('T')[0]; }
    function formatDate(d) { const dt = new Date(d); return dt.getDate() + ' ' + MONTHS[dt.getMonth()]; }

    function mapEntry(e) {
        return {
            id: String(e.id),
            bedtime: e.bedtime,
            wakeTime: e.wake_time,
            duration: parseFloat(e.duration_hours),
            quality: parseInt(e.quality, 10),
            notes: e.notes || '',
            date: e.created_at
        };
    }

    function calcDuration(bedtime, wakeTime) {
        const [bh, bm] = bedtime.split(':').map(Number);
        const [wh, wm] = wakeTime.split(':').map(Number);
        let bedMin = bh * 60 + bm;
        let wakeMin = wh * 60 + wm;
        if (wakeMin <= bedMin) wakeMin += 24 * 60;
        return (wakeMin - bedMin) / 60;
    }

    function formatHours(h) {
        const hrs = Math.floor(h);
        const mins = Math.round((h - hrs) * 60);
        if (mins === 0) return hrs + 'h';
        return hrs + 'h ' + mins + 'm';
    }

    function showToast() {
        toast?.classList.add('show');
        setTimeout(() => toast?.classList.remove('show'), 2500);
    }

    // Quality picker
    qualityPicker?.querySelectorAll('.quality-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            qualityPicker.querySelectorAll('.quality-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            qualityInput.value = btn.dataset.quality;
        });
    });

    // Submit
    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const bedtime = bedtimeInput.value;
        const wakeTime = wakeTimeInput.value;
        if (!bedtime || !wakeTime) return;

        const duration = calcDuration(bedtime, wakeTime);
        if (duration <= 0 || duration > 24) return;

        const body = {
            bedtime: bedtime,
            wake_time: wakeTime,
            duration_hours: Math.round(duration * 100) / 100,
            quality: parseInt(qualityInput.value, 10),
            notes: notesInput.value.trim()
        };

        const result = await apiPost('/api/sleep', body);
        if (!result || result.error) return;

        entries.unshift(mapEntry(result));
        notesInput.value = '';
        showToast();
        renderAll();
    });

    // Stats
    function renderStats() {
        // Last night
        if (lastSleepEl) {
            if (entries.length > 0) {
                lastSleepEl.textContent = formatHours(entries[0].duration);
            } else {
                lastSleepEl.textContent = '0';
            }
        }

        // Weekly average
        const weekData = getWeekData();
        const daysWithData = weekData.filter(d => d > 0).length || 1;
        const weekTotal = weekData.reduce((s, d) => s + d, 0);
        const avg = Math.round((weekTotal / daysWithData) * 10) / 10;

        if (weekAvgEl) weekAvgEl.innerHTML = avg + '<small>hrs</small>';
        if (goalText) goalText.textContent = 'Avg: ' + avg + ' hrs';
        if (goalBar) { goalBar.max = SLEEP_GOAL; goalBar.value = Math.min(avg, SLEEP_GOAL); }

        // Hero ring
        if (heroRingFill) {
            const circumference = 326.73;
            const pct = Math.min(avg / SLEEP_GOAL, 1);
            heroRingFill.style.strokeDashoffset = circumference - (pct * circumference);
        }
        if (heroRingValue) heroRingValue.textContent = avg;

        if (heroSubtitle) {
            if (avg >= 7 && avg <= 9) heroSubtitle.textContent = "Great! You're in the healthy sleep range.";
            else if (avg > 0 && avg < 7) heroSubtitle.textContent = "Try to get more sleep — aim for 7-9 hours.";
            else if (avg > 9) heroSubtitle.textContent = "You're sleeping well! Watch for oversleeping.";
            else heroSubtitle.textContent = "Track your rest, improve your focus.";
        }

        const { current, best } = calcStreaks();
        if (currentStreakEl) currentStreakEl.textContent = current;
        if (bestStreakEl) bestStreakEl.textContent = best;
    }

    function calcStreaks() {
        if (entries.length === 0) return { current: 0, best: 0 };

        const dateDuration = {};
        entries.forEach(e => {
            const d = e.date.split('T')[0];
            dateDuration[d] = (dateDuration[d] || 0) + e.duration;
        });

        const metDates = Object.keys(dateDuration).filter(d => dateDuration[d] >= 7).sort().reverse();
        if (metDates.length === 0) return { current: 0, best: 0 };

        const today = todayStr();
        const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
        const yStr = yesterday.toISOString().split('T')[0];

        let current = 0;
        if (metDates[0] === today || metDates[0] === yStr) {
            for (let i = 0; i < metDates.length; i++) {
                const exp = new Date();
                exp.setDate(exp.getDate() - (metDates[0] === today ? i : i + 1));
                if (metDates[i] === exp.toISOString().split('T')[0]) current++;
                else break;
            }
        }

        const sorted = metDates.slice().sort();
        let best = 1, temp = 1;
        for (let i = 1; i < sorted.length; i++) {
            const diff = (new Date(sorted[i]) - new Date(sorted[i - 1])) / 86400000;
            if (diff === 1) { temp++; best = Math.max(best, temp); }
            else temp = 1;
        }
        return { current, best: Math.max(best, current) };
    }

    // Weekly chart
    function getWeekData() {
        const now = new Date();
        const dow = now.getDay();
        const data = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(now); d.setDate(now.getDate() - dow + i);
            const ds = d.toISOString().split('T')[0];
            const hrs = entries.filter(e => e.date.split('T')[0] === ds).reduce((s, e) => s + e.duration, 0);
            data.push(Math.round(hrs * 10) / 10);
        }
        return data;
    }

    function renderChart() {
        const now = new Date();
        const dow = now.getDay();
        const weekData = getWeekData();
        const maxVal = Math.max(...weekData, SLEEP_GOAL);

        if (chartBars) {
            chartBars.innerHTML = weekData.map((hrs) => {
                const pct = hrs > 0 ? Math.max((hrs / maxVal) * 100, 5) : 5;
                const cls = hrs === 0 ? ' empty' : '';
                return '<section class="chart-bar-wrap"><span class="chart-bar-value">' + (hrs > 0 ? formatHours(hrs) : '') + '</span><span class="chart-bar' + cls + '" style="height:' + pct + '%" title="' + hrs + ' hrs"></span></section>';
            }).join('');
        }

        if (chartLabels) {
            chartLabels.innerHTML = DAYS.map((day, i) => '<span class="chart-label' + (i === dow ? ' today' : '') + '">' + day + '</span>').join('');
        }
    }

    // History
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
            const q = entry.quality || 3;

            item.innerHTML = `
                <span class="history-icon-wrap"><i class="fa-solid fa-moon"></i></span>
                <section class="history-details">
                    <p class="history-type">${formatHours(entry.duration)}</p>
                    <section class="history-meta">
                        <span>${entry.bedtime} → ${entry.wakeTime}</span>
                        <span class="quality-badge qb-${q}">${QUALITY_EMOJIS[q]} ${QUALITY_LABELS[q]}</span>
                    </section>
                </section>
                <time class="history-date">${formatDate(entry.date)}</time>
                <button class="history-delete" type="button" data-id="${entry.id}"><i class="fa-solid fa-trash-can"></i></button>
            `;
            historyList?.insertBefore(item, historyEmpty);
        });
    }

    historyList?.addEventListener('click', async (e) => {
        const btn = e.target.closest('.history-delete');
        if (!btn) return;
        await apiDelete('/api/sleep/' + btn.dataset.id);
        entries = entries.filter(en => en.id !== btn.dataset.id);
        renderAll();
    });

    clearHistoryBtn?.addEventListener('click', async () => {
        if (confirm('Clear all sleep history?')) {
            await apiDelete('/api/sleep');
            entries = [];
            renderAll();
        }
    });

    function renderAll() { renderStats(); renderChart(); renderHistory(); }

    async function init() {
        const data = await apiGet('/api/sleep?limit=200');
        if (data && Array.isArray(data)) {
            entries = data.map(mapEntry);
        }
        renderAll();
    }

    init();

});