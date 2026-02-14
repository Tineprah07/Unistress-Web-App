document.addEventListener('DOMContentLoaded', () => {

    const STORAGE_KEY = 'unistress_stress';

    const checkinForm = document.getElementById('checkinForm');
    const stressSlider = document.getElementById('stressSlider');
    const sliderValue = document.getElementById('sliderValue');
    const moodFace = document.getElementById('moodFace');
    const moodWord = document.getElementById('moodWord');
    const moodPicker = document.getElementById('moodPicker');
    const moodInput = document.getElementById('moodInput');
    const triggerPicker = document.getElementById('triggerPicker');
    const checkinNotes = document.getElementById('checkinNotes');
    const checkinTime = document.getElementById('checkinTime');
    const toast = document.getElementById('toast');

    const avgStressEl = document.getElementById('avgStress');
    const todayCheckinsEl = document.getElementById('todayCheckins');
    const currentStreakEl = document.getElementById('currentStreak');
    const totalCheckinsEl = document.getElementById('totalCheckins');
    const heroRingFill = document.getElementById('heroRingFill');
    const heroRingValue = document.getElementById('heroRingValue');
    const heroSubtitle = document.getElementById('heroSubtitle');

    const chartBars = document.getElementById('chartBars');
    const chartLabels = document.getElementById('chartLabels');
    const weekAvgText = document.getElementById('weekAvgText');
    const goalBar = document.getElementById('goalBar');

    const triggersBars = document.getElementById('triggersBars');
    const triggersEmpty = document.getElementById('triggersEmpty');
    const calendarMonth = document.getElementById('calendarMonth');
    const calHeader = document.getElementById('calHeader');
    const moodCalendar = document.getElementById('moodCalendar');
    const affirmationText = document.getElementById('affirmationText');
    const refreshAffirmation = document.getElementById('refreshAffirmation');

    const historyList = document.getElementById('historyList');
    const historyEmpty = document.getElementById('historyEmpty');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');

    const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const DAY_SHORT = ['S','M','T','W','T','F','S'];
    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const MONTHS_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];

    const FACES = { 1:'😌', 2:'😊', 3:'🙂', 4:'😐', 5:'😕', 6:'😟', 7:'😣', 8:'😤', 9:'😰', 10:'🤯' };
    const FACE_WORDS = { 1:'Very Calm', 2:'Calm', 3:'At Ease', 4:'Neutral', 5:'Slight Tension', 6:'Uneasy', 7:'Stressed', 8:'Very Stressed', 9:'Overwhelmed', 10:'Burnout' };

    const AFFIRMATIONS = [
        "You're doing better than you think. One step at a time.",
        "It's okay to have a tough day. Tomorrow is a fresh start.",
        "Your feelings are valid. Be kind to yourself today.",
        "Progress isn't always visible. Trust the process.",
        "Taking a moment to check in shows real strength.",
        "You don't have to have it all figured out right now.",
        "Rest is productive. You deserve a break.",
        "Small steps still move you forward.",
        "You've survived 100% of your worst days so far.",
        "Asking for help is a sign of courage, not weakness.",
        "You are more than your grades or your to-do list.",
        "Breathe. This moment will pass.",
        "Comparison is the thief of joy. Your journey is yours.",
        "Even the smallest act of self-care is a victory.",
        "You are enough, exactly as you are right now."
    ];

    function todayStr() { return new Date().toISOString().split('T')[0]; }
    function formatDate(d) { const dt = new Date(d); return dt.getDate() + ' ' + MONTHS[dt.getMonth()]; }
    function formatTime(d) { const dt = new Date(d); return dt.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}); }
    function getEntries() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; } }
    function saveEntries(d) { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); }

    // Show current time
    function updateClock() {
        if (checkinTime) checkinTime.textContent = new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
    }
    updateClock();
    setInterval(updateClock, 30000);

    // =============================
    // SLIDER — Dynamic Face
    // =============================
    stressSlider?.addEventListener('input', () => {
        const val = parseInt(stressSlider.value, 10);
        if (sliderValue) sliderValue.textContent = val;
        if (moodFace) { moodFace.textContent = FACES[val]; moodFace.style.animation = 'none'; void moodFace.offsetWidth; moodFace.style.animation = 'face-pop 0.3s ease'; }
        if (moodWord) moodWord.textContent = FACE_WORDS[val];
    });

    // =============================
    // MOOD PICKER
    // =============================
    moodPicker?.querySelectorAll('.mood-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            moodPicker.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            moodInput.value = btn.dataset.mood;
        });
    });

    // =============================
    // TRIGGER PICKER (multi-select)
    // =============================
    triggerPicker?.querySelectorAll('.trigger-btn').forEach(btn => {
        btn.addEventListener('click', () => btn.classList.toggle('active'));
    });

    function getSelectedTriggers() {
        return [...triggerPicker.querySelectorAll('.trigger-btn.active')].map(b => b.dataset.trigger);
    }

    // =============================
    // FORM SUBMIT
    // =============================
    checkinForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const entry = {
            id: Date.now().toString(),
            stress: parseInt(stressSlider.value, 10),
            mood: moodInput.value,
            moodEmoji: moodPicker.querySelector('.mood-btn.active')?.dataset.emoji || '😐',
            triggers: getSelectedTriggers(),
            notes: checkinNotes.value.trim(),
            date: new Date().toISOString()
        };
        const entries = getEntries();
        entries.unshift(entry);
        saveEntries(entries);

        // Reset form
        stressSlider.value = 5; sliderValue.textContent = '5';
        moodFace.textContent = '😐'; moodWord.textContent = 'Neutral';
        moodPicker.querySelectorAll('.mood-btn').forEach(b => b.classList.toggle('active', b.dataset.mood === 'Neutral'));
        moodInput.value = 'Neutral';
        triggerPicker.querySelectorAll('.trigger-btn').forEach(b => b.classList.remove('active'));
        checkinNotes.value = '';

        // Toast
        toast?.classList.remove('hidden');
        setTimeout(() => toast?.classList.add('hidden'), 2500);

        renderAll();
    });

    // =============================
    // AFFIRMATIONS
    // =============================
    function showAffirmation() {
        const idx = Math.floor(Math.random() * AFFIRMATIONS.length);
        if (affirmationText) affirmationText.textContent = AFFIRMATIONS[idx];
    }
    showAffirmation();
    refreshAffirmation?.addEventListener('click', showAffirmation);

    // =============================
    // STATS
    // =============================
    function renderStats() {
        const entries = getEntries();
        const today = todayStr();
        const todayEntries = entries.filter(e => e.date.split('T')[0] === today);

        if (totalCheckinsEl) totalCheckinsEl.textContent = entries.length;
        if (todayCheckinsEl) todayCheckinsEl.textContent = todayEntries.length;

        // Average stress (last 7 days)
        const week = entries.filter(e => {
            const d = new Date(e.date); const now = new Date();
            return (now - d) / 86400000 <= 7;
        });
        const avg = week.length > 0 ? (week.reduce((s, e) => s + e.stress, 0) / week.length).toFixed(1) : 0;
        if (avgStressEl) avgStressEl.textContent = avg;

        // Hero ring (today check-ins vs goal 3)
        if (heroRingFill) {
            const circ = 326.73;
            const pct = Math.min(todayEntries.length / 3, 1);
            heroRingFill.style.strokeDashoffset = circ - (pct * circ);
        }
        if (heroRingValue) heroRingValue.textContent = todayEntries.length;

        if (heroSubtitle) {
            if (todayEntries.length >= 3) heroSubtitle.textContent = "Great self-awareness today! Keep tracking your patterns.";
            else if (todayEntries.length > 0) heroSubtitle.textContent = "Good start. Try checking in again later to spot trends.";
            else heroSubtitle.textContent = "Understand your stress, take back control.";
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
    // WEEKLY CHART
    // =============================
    function stressColor(val) {
        if (val <= 3) return '#10b981';
        if (val <= 6) return '#f59e0b';
        return '#ef4444';
    }

    function renderChart() {
        const entries = getEntries();
        const now = new Date();
        const dow = now.getDay();
        const weekData = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(now); d.setDate(now.getDate() - dow + i);
            const ds = d.toISOString().split('T')[0];
            const dayEntries = entries.filter(e => e.date.split('T')[0] === ds);
            const avg = dayEntries.length > 0 ? dayEntries.reduce((s, e) => s + e.stress, 0) / dayEntries.length : 0;
            weekData.push(Math.round(avg * 10) / 10);
        }

        if (chartBars) {
            chartBars.innerHTML = weekData.map(val => {
                const pct = val > 0 ? Math.max((val / 10) * 100, 8) : 5;
                const cls = val === 0 ? ' empty' : '';
                const bg = val > 0 ? `background:${stressColor(val)}` : '';
                return `<section class="chart-bar-wrap"><span class="chart-bar-value">${val > 0 ? val : ''}</span><span class="chart-bar${cls}" style="height:${pct}%;${bg}"></span></section>`;
            }).join('');
        }
        if (chartLabels) {
            chartLabels.innerHTML = DAYS.map((d, i) => `<span class="chart-label${i === dow ? ' today' : ''}">${d}</span>`).join('');
        }

        const weekVals = weekData.filter(v => v > 0);
        const weekAvg = weekVals.length > 0 ? (weekVals.reduce((s, v) => s + v, 0) / weekVals.length).toFixed(1) : 0;
        if (weekAvgText) weekAvgText.textContent = weekAvg + ' / 10';
        if (goalBar) { goalBar.value = weekAvg; }
    }

    // =============================
    // TOP TRIGGERS
    // =============================
    function renderTriggers() {
        const entries = getEntries();
        const counts = {};
        entries.forEach(e => { (e.triggers || []).forEach(t => { counts[t] = (counts[t] || 0) + 1; }); });

        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
        if (sorted.length === 0) {
            if (triggersEmpty) triggersEmpty.style.display = 'block';
            triggersBars?.querySelectorAll('.trigger-bar-item').forEach(el => el.remove());
            return;
        }
        if (triggersEmpty) triggersEmpty.style.display = 'none';
        triggersBars?.querySelectorAll('.trigger-bar-item').forEach(el => el.remove());

        const maxCount = sorted[0][1];
        sorted.forEach(([trigger, count]) => {
            const pct = (count / maxCount) * 100;
            const item = document.createElement('section');
            item.className = 'trigger-bar-item';
            item.innerHTML = `
                <span class="trigger-bar-label">${trigger}</span>
                <section class="trigger-bar-track"><span class="trigger-bar-fill" style="width:${pct}%"></span></section>
                <span class="trigger-bar-count">${count}</span>
            `;
            triggersBars?.insertBefore(item, triggersEmpty);
        });
    }

    // =============================
    // MOOD CALENDAR HEATMAP
    // =============================
    function renderCalendar() {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        if (calendarMonth) calendarMonth.textContent = MONTHS_FULL[month] + ' ' + year;

        // Header (day names)
        if (calHeader) {
            calHeader.innerHTML = DAY_SHORT.map(d => `<span class="cal-header-day">${d}</span>`).join('');
        }

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const todayDate = now.getDate();
        const entries = getEntries();

        // Build day averages
        const dayAvg = {};
        for (let d = 1; d <= daysInMonth; d++) {
            const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const dayEntries = entries.filter(e => e.date.split('T')[0] === ds);
            if (dayEntries.length > 0) {
                dayAvg[d] = dayEntries.reduce((s, e) => s + e.stress, 0) / dayEntries.length;
            }
        }

        if (moodCalendar) {
            let cells = '';
            // Empty cells before first day
            for (let i = 0; i < firstDay; i++) cells += '<span class="cal-cell"></span>';
            for (let d = 1; d <= daysInMonth; d++) {
                const isToday = d === todayDate;
                let level = '';
                if (dayAvg[d] !== undefined) {
                    if (dayAvg[d] <= 3) level = ' level-1';
                    else if (dayAvg[d] <= 6) level = ' level-2';
                    else level = ' level-3';
                }
                cells += `<span class="cal-cell${level}${isToday ? ' today' : ''}" title="${d} ${MONTHS[month]}${dayAvg[d] !== undefined ? ' — Stress: ' + dayAvg[d].toFixed(1) : ''}">${d}</span>`;
            }
            moodCalendar.innerHTML = cells;
        }
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

        entries.slice(0, 25).forEach(entry => {
            const item = document.createElement('article');
            item.className = 'history-item';
            const sbClass = entry.stress <= 3 ? 'sb-low' : entry.stress <= 6 ? 'sb-mid' : 'sb-high';
            const sbLabel = entry.stress <= 3 ? 'Low' : entry.stress <= 6 ? 'Medium' : 'High';
            const triggerStr = (entry.triggers || []).length > 0 ? entry.triggers.join(', ') : '';

            item.innerHTML = `
                <span class="history-mood">${entry.moodEmoji || '😐'}</span>
                <section class="history-details">
                    <p class="history-mood-label">${entry.mood} <span class="stress-badge ${sbClass}">${entry.stress}/10 ${sbLabel}</span></p>
                    <section class="history-meta">
                        ${triggerStr ? `<span class="history-triggers">${triggerStr}</span>` : ''}
                    </section>
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
        if (confirm('Clear all stress check-in history?')) { saveEntries([]); renderAll(); }
    });

    // =============================
    // RENDER ALL
    // =============================
    function renderAll() { renderStats(); renderChart(); renderTriggers(); renderCalendar(); renderHistory(); }
    renderAll();

});