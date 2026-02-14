document.addEventListener('DOMContentLoaded', () => {

    const STORAGE_KEY = 'unistress_breathe';

    // Techniques: arrays of {phase, seconds}
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

    function todayStr() { return new Date().toISOString().split('T')[0]; }
    function formatDate(d) { const dt = new Date(d); return dt.getDate() + ' ' + MONTHS[dt.getMonth()]; }
    function formatTime(d) { const dt = new Date(d); return dt.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}); }
    function getEntries() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; } }
    function saveEntries(d) { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); }

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

    // Cycle picker
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
                // Cycle complete
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

            // Adjust ring transition to match phase duration
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

    function onComplete() {
        stopBreathing();

        const elapsed = Math.round((Date.now() - sessionStartTime) / 1000);
        const durationMin = Math.round(elapsed / 60 * 10) / 10;
        const tech = TECHNIQUES[currentTechnique];

        const entry = {
            id: Date.now().toString(),
            technique: currentTechnique,
            techniqueName: tech.name,
            cycles: targetCycles,
            durationSec: elapsed,
            date: new Date().toISOString()
        };

        const entries = getEntries();
        entries.unshift(entry);
        saveEntries(entries);

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
        const entries = getEntries();
        const today = todayStr();
        const todayEntries = entries.filter(e => e.date.split('T')[0] === today);
        const totalMin = Math.round(entries.reduce((s, e) => s + (e.durationSec || 0), 0) / 60);

        if (totalSessionsEl) totalSessionsEl.textContent = entries.length;
        if (totalMinutesEl) totalMinutesEl.innerHTML = totalMin + '<small>min</small>';
        if (todaySessionsEl) todaySessionsEl.textContent = todayEntries.length;

        // Hero ring (based on today's sessions, goal = 3)
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
            const yStr = yesterday.toISOString().split('T')[0];
            if (uniqueDates[0] === today || uniqueDates[0] === yStr) {
                for (let i = 0; i < uniqueDates.length; i++) {
                    const exp = new Date();
                    exp.setDate(exp.getDate() - (uniqueDates[0] === today ? i : i + 1));
                    if (uniqueDates[i] === exp.toISOString().split('T')[0]) streak++;
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
        const entries = getEntries();
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

    historyList?.addEventListener('click', (e) => {
        const btn = e.target.closest('.history-delete');
        if (!btn) return;
        let entries = getEntries();
        entries = entries.filter(en => en.id !== btn.dataset.id);
        saveEntries(entries);
        renderAll();
    });

    clearHistoryBtn?.addEventListener('click', () => {
        if (confirm('Clear all breathing session history?')) { saveEntries([]); renderAll(); }
    });

    // =============================
    // RENDER ALL
    // =============================
    function renderAll() { renderStats(); renderHistory(); }
    renderAll();

});