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

    // Techniques
    const TECHNIQUES = {
        '478':      { name: '4-7-8 Relaxing Breath', badge: '4-7-8', steps: [{phase:'inhale',s:4},{phase:'hold',s:7},{phase:'exhale',s:8}] },
        'box':      { name: 'Box Breathing', badge: 'Box', steps: [{phase:'inhale',s:4},{phase:'hold',s:4},{phase:'exhale',s:4},{phase:'hold',s:4}] },
        'deep':     { name: 'Deep Breathing', badge: 'Deep', steps: [{phase:'inhale',s:5},{phase:'exhale',s:5}] },
        'energise': { name: 'Energising Breath', badge: 'Quick', steps: [{phase:'inhale',s:3},{phase:'exhale',s:3}] },
        'calm':     { name: 'Calm Exhale', badge: 'Calm', steps: [{phase:'inhale',s:4},{phase:'exhale',s:8}] }
    };

    let currentTechnique = '478';
    let targetCycles = 4;
    let currentCycle = 0;
    let isRunning = false;
    let breatheTimeout = null;
    let tickInterval = null;
    let sessionStartTime = null;

    const circle      = document.getElementById('breatheCircle');
    const label        = document.getElementById('breatheLabel');
    const timerEl      = document.getElementById('breatheTimer');
    const cycleCountEl = document.getElementById('cycleCount');
    const techniqueBadge = document.getElementById('techniqueBadge');
    const startBtn     = document.getElementById('startBtn');
    const stopBtn      = document.getElementById('stopBtn');
    const techniqueList = document.getElementById('techniqueList');
    const cyclePicker  = document.getElementById('cyclePicker');

    const totalSessionsEl = document.getElementById('totalSessions');
    const totalMinutesEl  = document.getElementById('totalMinutes');
    const currentStreakEl  = document.getElementById('currentStreak');
    const todaySessionsEl = document.getElementById('todaySessions');
    const heroRingFill    = document.getElementById('heroRingFill');
    const heroRingValue   = document.getElementById('heroRingValue');
    const heroSubtitle    = document.getElementById('heroSubtitle');
    const historyList     = document.getElementById('historyList');
    const historyEmpty    = document.getElementById('historyEmpty');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');

    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    function _localDate(d) { return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); }
    function todayStr() { return _localDate(new Date()); }
    function formatDate(d) { const dt = new Date(d); return dt.getDate() + ' ' + MONTHS[dt.getMonth()]; }
    function formatTime(d) { const dt = new Date(d); return dt.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}); }

    function mapEntry(e) {
        return {
            id: String(e.id),
            technique: e.technique,
            techniqueName: e.technique_name || TECHNIQUES[e.technique]?.name || 'Breathing',
            cycles: e.cycles,
            durationSec: e.duration_seconds,
            date: e.created_at
        };
    }

    // =============================
    // TECHNIQUE SELECTION
    // =============================
    techniqueList?.querySelectorAll('.technique-item').forEach(item => {
        item.addEventListener('click', () => {
            if (isRunning) return;
            techniqueList.querySelectorAll('.technique-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            currentTechnique = item.dataset.technique;
            techniqueBadge.textContent = TECHNIQUES[currentTechnique].badge;
        });
    });

    cyclePicker?.querySelectorAll('.dur-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (isRunning) return;
            cyclePicker.querySelectorAll('.dur-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            targetCycles = parseInt(btn.dataset.cycles, 10);
            cycleCountEl.textContent = '0 / ' + targetCycles + ' cycles';
        });
    });

    // =============================
    // BREATHING ENGINE
    // =============================
    function startBreathing() {
        if (isRunning) return;
        isRunning = true;
        currentCycle = 0;
        sessionStartTime = Date.now();
        startBtn.classList.add('hidden');
        stopBtn.classList.remove('hidden');
        updateCycleCount();
        runCycle();
    }

    function stopBreathing() {
        isRunning = false;
        clearTimeout(breatheTimeout);
        clearInterval(tickInterval);
        startBtn.classList.remove('hidden');
        stopBtn.classList.add('hidden');
        circle.className = 'breathe-circle';
        label.textContent = 'Ready';
        timerEl.textContent = '';
    }

    function runCycle() {
        if (!isRunning) return;
        const tech = TECHNIQUES[currentTechnique];
        let stepIndex = 0;

        function runStep() {
            if (!isRunning) return;
            if (stepIndex >= tech.steps.length) {
                currentCycle++;
                updateCycleCount();
                if (currentCycle >= targetCycles) {
                    onComplete();
                    return;
                }
                stepIndex = 0;
            }

            const step = tech.steps[stepIndex];
            circle.className = 'breathe-circle ' + step.phase;

            circle.querySelectorAll('.breathe-ring').forEach(ring => {
                ring.style.transitionDuration = step.s + 's';
            });

            label.textContent = step.phase === 'hold' ? 'Hold' : step.phase === 'inhale' ? 'Breathe In' : 'Breathe Out';

            let remaining = step.s;
            timerEl.textContent = remaining;

            clearInterval(tickInterval);
            tickInterval = setInterval(() => {
                remaining--;
                if (remaining > 0) timerEl.textContent = remaining;
                else timerEl.textContent = '';
            }, 1000);

            breatheTimeout = setTimeout(() => {
                clearInterval(tickInterval);
                stepIndex++;
                runStep();
            }, step.s * 1000);
        }

        runStep();
    }

    async function onComplete() {
        stopBreathing();

        const elapsed = Math.round((Date.now() - sessionStartTime) / 1000);
        const tech = TECHNIQUES[currentTechnique];

        const result = await apiPost('/api/breathe', {
            technique: currentTechnique,
            technique_name: tech.name,
            cycles: targetCycles,
            duration_seconds: elapsed
        });

        if (result && !result.error) {
            entries.unshift(mapEntry(result));
        }

        label.textContent = 'Done ✓';
        setTimeout(() => { label.textContent = 'Ready'; }, 2500);

        renderAll();
    }

    function updateCycleCount() {
        if (cycleCountEl) cycleCountEl.textContent = currentCycle + ' / ' + targetCycles + ' cycles';
    }

    startBtn?.addEventListener('click', startBreathing);
    stopBtn?.addEventListener('click', stopBreathing);

    // =============================
    // STATS
    // =============================
    function renderStats() {
        const today = todayStr();
        const todayEntries = entries.filter(e => e.date.split('T')[0] === today);
        const totalMin = Math.round(entries.reduce((s, e) => s + (e.durationSec || 0), 0) / 60);

        if (totalSessionsEl) totalSessionsEl.textContent = entries.length;
        if (totalMinutesEl) totalMinutesEl.innerHTML = totalMin + '<small>min</small>';
        if (todaySessionsEl) todaySessionsEl.textContent = todayEntries.length;

        if (heroRingFill) {
            const circ = 326.73;
            const pct = Math.min(todayEntries.length / 3, 1);
            heroRingFill.style.strokeDashoffset = circ - (pct * circ);
        }
        if (heroRingValue) heroRingValue.textContent = entries.length;

        if (heroSubtitle) {
            if (todayEntries.length >= 3) heroSubtitle.textContent = "Well done! You've completed today's breathing goal.";
            else if (todayEntries.length > 0) heroSubtitle.textContent = "Keep going — " + (3 - todayEntries.length) + " more session" + (3 - todayEntries.length > 1 ? 's' : '') + " today.";
            else heroSubtitle.textContent = "Calm your mind, one breath at a time.";
        }

        // Streak
        const uniqueDates = [...new Set(entries.map(e => e.date.split('T')[0]))].sort().reverse();
        let streak = 0;
        if (uniqueDates.length > 0) {
            const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
            const yStr = _localDate(yesterday);
            if (uniqueDates[0] === today || uniqueDates[0] === yStr) {
                for (let i = 0; i < uniqueDates.length; i++) {
                    const exp = new Date();
                    exp.setDate(exp.getDate() - (uniqueDates[0] === today ? i : i + 1));
                    if (uniqueDates[i] === _localDate(exp)) streak++;
                    else break;
                }
            }
        }
        if (currentStreakEl) currentStreakEl.textContent = streak;
    }

    // =============================
    // HISTORY
    // =============================
    function renderHistory() {
        historyList?.querySelectorAll('.history-item').forEach(el => el.remove());

        if (entries.length === 0) {
            if (historyEmpty) historyEmpty.style.display = 'flex';
            return;
        }
        if (historyEmpty) historyEmpty.style.display = 'none';

        entries.slice(0, 20).forEach(entry => {
            const min = Math.round((entry.durationSec || 0) / 60 * 10) / 10;
            const item = document.createElement('article');
            item.className = 'history-item';
            item.innerHTML = `
                <span class="history-icon-wrap"><i class="fa-solid fa-wind"></i></span>
                <section class="history-details">
                    <p class="history-type">${entry.techniqueName || 'Breathing'}</p>
                    <p class="history-meta">${entry.cycles} cycles · ${min} min</p>
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
        await apiDelete('/api/breathe/' + btn.dataset.id);
        entries = entries.filter(en => en.id !== btn.dataset.id);
        renderAll();
    });

    clearHistoryBtn?.addEventListener('click', async () => {
        if (confirm('Clear all breathing session history?')) {
            await apiDelete('/api/breathe');
            entries = [];
            renderAll();
        }
    });

    // =============================
    // RENDER ALL & INIT
    // =============================
    function renderAll() { renderStats(); renderHistory(); }

    async function init() {
        const data = await apiGet('/api/breathe?limit=200');
        if (data && Array.isArray(data)) {
            entries = data.map(mapEntry);
        }
        renderAll();
    }

    init();

});