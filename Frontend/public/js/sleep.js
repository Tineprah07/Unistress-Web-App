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

    // Fitbit state
    let fitbitConnected = false;
    let fitbitSleepData = null; // Today's Fitbit sleep data
    let fitbitWeeklySleep = {}; // Keyed by date string YYYY-MM-DD -> hours

    const SLEEP_GOAL = 8;

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

    // Load Fitbit sleep data
    async function loadFitbitSleep() {
        if (!window.Fitbit || !Fitbit.connected) {
            fitbitConnected = false;
            fitbitSleepData = null;
            fitbitWeeklySleep = {};
            renderFitbitSleep();
            return;
        }
        fitbitConnected = true;

        try {
            const sleepData = await Fitbit.getSleep();
            if (sleepData && sleepData.total_minutes > 0) {
                fitbitSleepData = sleepData;

                const todayDate = new Date().toISOString().split('T')[0];
                fitbitWeeklySleep[todayDate] = parseFloat(sleepData.total_hours) || 0;
            }
        } catch (e) {
            console.warn('Failed to load Fitbit sleep:', e);
        }
        renderFitbitSleep();
    }

    // Render the Fitbit sleep card data
    function renderFitbitSleep() {
        const sleepCard = document.getElementById('fitbitSleepCard');
        if (!sleepCard) return;

        sleepCard.classList.toggle('connected', fitbitConnected);

        if (!fitbitConnected || !fitbitSleepData) return;

        const data = fitbitSleepData;

        if (window.Fitbit) {
            Fitbit.animateValue(document.getElementById('fbSleepHours'), parseFloat(data.total_hours) || 0, '<small>hrs</small>');
            Fitbit.animateValue(document.getElementById('fbSleepEfficiency'), data.efficiency || 0, '<small>%</small>');
            const inBedHrs = data.time_in_bed ? (data.time_in_bed / 60).toFixed(1) : 0;
            Fitbit.animateValue(document.getElementById('fbTimeInBed'), parseFloat(inBedHrs), '<small>hrs</small>');
        }

        // Bedtime and wake time
        const timesEl = document.getElementById('fbSleepTimes');
        const bedtimeEl = document.getElementById('fbBedtime');
        const wakeEl = document.getElementById('fbWakeTime');
        if (timesEl && data.start_time && data.end_time) {
            timesEl.style.display = 'flex';
            if (bedtimeEl) bedtimeEl.textContent = new Date(data.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            if (wakeEl) wakeEl.textContent = new Date(data.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        // Sleep stages
        const stagesWrap = document.getElementById('sleepStagesWrap');
        const stagesBar = document.getElementById('sleepStagesBar');
        const stagesLegend = document.getElementById('sleepStagesLegend');

        if (stagesWrap && stagesBar && data.stages) {
            const stages = data.stages;
            const total = (stages.deep || 0) + (stages.light || 0) + (stages.rem || 0) + (stages.wake || 0);

            if (total > 0) {
                stagesWrap.style.display = 'block';

                const deepPct = ((stages.deep || 0) / total * 100).toFixed(1);
                const lightPct = ((stages.light || 0) / total * 100).toFixed(1);
                const remPct = ((stages.rem || 0) / total * 100).toFixed(1);
                const wakePct = ((stages.wake || 0) / total * 100).toFixed(1);

                stagesBar.innerHTML =
                    `<span class="stage-segment stage-deep" style="width:${deepPct}%" title="Deep: ${stages.deep} min"></span>` +
                    `<span class="stage-segment stage-light" style="width:${lightPct}%" title="Light: ${stages.light} min"></span>` +
                    `<span class="stage-segment stage-rem" style="width:${remPct}%" title="REM: ${stages.rem} min"></span>` +
                    `<span class="stage-segment stage-wake" style="width:${wakePct}%" title="Awake: ${stages.wake} min"></span>`;

                if (stagesLegend) {
                    stagesLegend.innerHTML =
                        `<span class="stage-legend-item"><span class="stage-legend-dot stage-deep"></span>Deep ${stages.deep}m</span>` +
                        `<span class="stage-legend-item"><span class="stage-legend-dot stage-light"></span>Light ${stages.light}m</span>` +
                        `<span class="stage-legend-item"><span class="stage-legend-dot stage-rem"></span>REM ${stages.rem}m</span>` +
                        `<span class="stage-legend-item"><span class="stage-legend-dot stage-wake"></span>Awake ${stages.wake}m</span>`;
                }
            }
        }

        const syncLabel = document.getElementById('fbSleepLastSync');
        if (syncLabel) syncLabel.textContent = 'Updated ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
        applySmartDefaults();
        showToast();
        renderAll();
    });

    // Stats
    function renderStats() {
        // Last night
        if (lastSleepEl) {
            if (fitbitConnected && fitbitSleepData && fitbitSleepData.total_minutes > 0) {
                lastSleepEl.textContent = formatHours(parseFloat(fitbitSleepData.total_hours));
            } else if (entries.length > 0) {
                lastSleepEl.textContent = formatHours(entries[0].duration);
            } else {
                lastSleepEl.textContent = '0';
            }
        }

        // Weekly average
        const weekData = getWeekData();
        const totals = weekData.map(d => d.total);
        const daysWithData = totals.filter(d => d > 0).length || 1;
        const weekTotal = totals.reduce((s, d) => s + d, 0);
        const avg = Math.round((weekTotal / daysWithData) * 10) / 10;

        if (weekAvgEl) weekAvgEl.innerHTML = avg + '<small>hrs</small>';
        if (goalText) goalText.textContent = 'Avg: ' + avg + ' hrs';
        if (goalBar) { goalBar.max = SLEEP_GOAL; goalBar.value = Math.min(avg, SLEEP_GOAL); }

        // Hero ring — last night's sleep
        let lastNight = 0;
        if (fitbitConnected && fitbitSleepData && fitbitSleepData.total_minutes > 0) {
            lastNight = Math.round((parseFloat(fitbitSleepData.total_hours) || 0) * 10) / 10;
        } else if (entries.length > 0) {
            lastNight = Math.round(entries[0].duration * 10) / 10;
        }

        if (heroRingFill) {
            const circumference = 326.73;
            const pct = Math.min(lastNight / SLEEP_GOAL, 1);
            heroRingFill.style.strokeDashoffset = circumference - (pct * circumference);
        }
        if (heroRingValue) heroRingValue.textContent = lastNight;

        if (heroSubtitle) {
            if (lastNight >= 7 && lastNight <= 9) heroSubtitle.textContent = "Great sleep last night! You're in the healthy range.";
            else if (lastNight > 0 && lastNight < 7) heroSubtitle.textContent = "Last night was short — aim for 7-9 hours tonight.";
            else if (lastNight > 9) heroSubtitle.textContent = "Long sleep last night. Consistency matters most.";
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
            const manualHrs = entries.filter(e => e.date.split('T')[0] === ds).reduce((s, e) => s + e.duration, 0);
            const fitbitHrs = fitbitConnected ? (fitbitWeeklySleep[ds] || 0) : 0;
            data.push({
                manual: Math.round(manualHrs * 10) / 10,
                fitbit: Math.round(fitbitHrs * 10) / 10,
                total: Math.round((manualHrs + fitbitHrs) * 10) / 10
            });
        }
        return data;
    }

    function renderChart() {
        const now = new Date();
        const dow = now.getDay();
        const weekData = getWeekData();
        const maxVal = Math.max(...weekData.map(d => d.total), SLEEP_GOAL);

        if (chartBars) {
            chartBars.innerHTML = weekData.map(d => {
                const pct = d.total > 0 ? Math.max((d.total / maxVal) * 100, 5) : 5;
                const emptyClass = d.total === 0 ? ' empty' : '';

                if (d.fitbit > 0 && d.manual > 0) {
                    const manualPct = (d.manual / d.total) * 100;
                    const fitbitPct = (d.fitbit / d.total) * 100;
                    return `<section class="chart-bar-wrap">
                        <span class="chart-bar-value">${formatHours(d.total)}</span>
                        <span class="chart-bar chart-bar-stacked" style="height:${pct}%" title="Manual: ${formatHours(d.manual)} + Fitbit: ${formatHours(d.fitbit)}">
                            <span class="bar-segment bar-fitbit-sleep" style="height:${fitbitPct}%"></span>
                            <span class="bar-segment bar-manual-sleep" style="height:${manualPct}%"></span>
                        </span>
                    </section>`;
                } else if (d.fitbit > 0) {
                    return `<section class="chart-bar-wrap">
                        <span class="chart-bar-value">${formatHours(d.fitbit)}</span>
                        <span class="chart-bar bar-fitbit-only${emptyClass}" style="height:${pct}%" title="Fitbit: ${formatHours(d.fitbit)}"></span>
                    </section>`;
                } else {
                    return `<section class="chart-bar-wrap">
                        <span class="chart-bar-value">${d.manual > 0 ? formatHours(d.manual) : ''}</span>
                        <span class="chart-bar${emptyClass}" style="height:${pct}%" title="${formatHours(d.manual)}"></span>
                    </section>`;
                }
            }).join('');
        }

        if (chartLabels) {
            chartLabels.innerHTML = DAYS.map((day, i) => '<span class="chart-label' + (i === dow ? ' today' : '') + '">' + day + '</span>').join('');
        }

        // Chart legend
        const legendEl = document.getElementById('chartLegend');
        if (legendEl) {
            if (fitbitConnected && Object.keys(fitbitWeeklySleep).length > 0) {
                legendEl.innerHTML = '<span class="legend-item"><span class="legend-dot legend-manual"></span>Manual</span><span class="legend-item"><span class="legend-dot legend-fitbit"></span>Fitbit</span>';
                legendEl.style.display = 'flex';
            } else {
                legendEl.style.display = 'none';
            }
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

    function renderAll() { renderStats(); renderChart(); renderHistory(); renderFitbitSleep(); }

    function applySmartDefaults() {
        if (entries.length === 0) return;

        const last = entries[0];
        if (last.bedtime && bedtimeInput) bedtimeInput.value = last.bedtime;
        if (last.wakeTime && wakeTimeInput) wakeTimeInput.value = last.wakeTime;

        // Set quality to last entry's quality
        const q = last.quality || 3;
        if (qualityInput) qualityInput.value = q;
        qualityPicker?.querySelectorAll('.quality-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.quality, 10) === q);
        });
    }

    async function init() {
        const data = await apiGet('/api/sleep?limit=200');
        if (data && Array.isArray(data)) entries = data.map(mapEntry);
        applySmartDefaults();
        renderAll();
        if (window.Fitbit) {
            await Fitbit.ready;
            await loadFitbitSleep();
            renderAll();
        }
    }

    init();

    // Listen for Fitbit connect/disconnect
    if (window.Fitbit) {
        Fitbit.onStatusChange(async function (connected, refresh) {
            fitbitConnected = connected;
            if (connected) {
                await loadFitbitSleep();
                renderAll();
            } else {
                fitbitSleepData = null;
                fitbitWeeklySleep = {};
                renderAll();
            }
        });
    }

});