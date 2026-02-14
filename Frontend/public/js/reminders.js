document.addEventListener('DOMContentLoaded', () => {

    const STORAGE_KEY = 'unistress_reminders';

    const form          = document.getElementById('reminderForm');
    const formTitle     = document.getElementById('formTitle');
    const reminderIdIn  = document.getElementById('reminderId');
    const reminderTextIn = document.getElementById('reminderText');
    const reminderDateIn = document.getElementById('reminderDate');
    const reminderTimeIn = document.getElementById('reminderTime');
    const reminderCatIn  = document.getElementById('reminderCategory');
    const reminderRepIn  = document.getElementById('reminderRepeat');
    const reminderPriIn  = document.getElementById('reminderPriority');
    const categoryPicker = document.getElementById('categoryPicker');
    const repeatPicker   = document.getElementById('repeatPicker');
    const priorityPicker = document.getElementById('priorityPicker');
    const cancelEditBtn  = document.getElementById('cancelEdit');

    const activeList     = document.getElementById('activeList');
    const activeEmpty    = document.getElementById('activeEmpty');
    const completedList  = document.getElementById('completedList');
    const completedEmpty = document.getElementById('completedEmpty');
    const clearCompletedBtn = document.getElementById('clearCompletedBtn');

    const activeCountEl    = document.getElementById('activeCount');
    const completedCountEl = document.getElementById('completedCount');
    const todayCountEl     = document.getElementById('todayCount');
    const recurringCountEl = document.getElementById('recurringCount');
    const activeBadge      = document.getElementById('activeBadge');
    const heroRingFill     = document.getElementById('heroRingFill');
    const heroRingValue    = document.getElementById('heroRingValue');
    const heroSubtitle     = document.getElementById('heroSubtitle');

    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const CAT_ICONS = {
        Hydration: 'fa-droplet', Exercise: 'fa-dumbbell', Sleep: 'fa-moon',
        Study: 'fa-book-open', Stress: 'fa-heart-pulse', Other: 'fa-ellipsis'
    };

    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    if (reminderDateIn) reminderDateIn.value = today;

    function getReminders() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; } }
    function saveReminders(d) { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); }

    function formatDate(d) { const dt = new Date(d); return dt.getDate() + ' ' + MONTHS[dt.getMonth()]; }
    function formatTime12(t) {
        if (!t) return '';
        const [h, m] = t.split(':').map(Number);
        const ampm = h >= 12 ? 'PM' : 'AM';
        return ((h % 12) || 12) + ':' + String(m).padStart(2, '0') + ' ' + ampm;
    }

    // =============================
    // PICKERS
    // =============================
    function setupPicker(container, hiddenInput) {
        container?.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', () => {
                container.querySelectorAll('button').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const val = btn.dataset.cat || btn.dataset.repeat || btn.dataset.priority;
                hiddenInput.value = val;
            });
        });
    }
    setupPicker(categoryPicker, reminderCatIn);
    setupPicker(repeatPicker, reminderRepIn);
    setupPicker(priorityPicker, reminderPriIn);

    // =============================
    // FORM SUBMIT
    // =============================
    form?.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = reminderTextIn.value.trim();
        if (!text) return;

        const reminders = getReminders();
        const id = reminderIdIn.value;

        const data = {
            text,
            date: reminderDateIn.value,
            time: reminderTimeIn.value,
            category: reminderCatIn.value,
            repeat: reminderRepIn.value,
            priority: reminderPriIn.value,
        };

        if (id) {
            const rem = reminders.find(r => r.id === id);
            if (rem) Object.assign(rem, data, { updatedAt: new Date().toISOString() });
        } else {
            reminders.unshift({
                id: Date.now().toString(),
                ...data,
                completed: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
        }

        saveReminders(reminders);
        resetForm();
        renderAll();
    });

    function resetForm() {
        reminderIdIn.value = '';
        reminderTextIn.value = '';
        reminderDateIn.value = today;
        reminderTimeIn.value = '09:00';
        reminderCatIn.value = 'Hydration';
        reminderRepIn.value = 'none';
        reminderPriIn.value = 'medium';
        formTitle.textContent = 'New Reminder';
        cancelEditBtn?.classList.add('hidden');

        categoryPicker?.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.cat === 'Hydration'));
        repeatPicker?.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.repeat === 'none'));
        priorityPicker?.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.priority === 'medium'));
    }

    cancelEditBtn?.addEventListener('click', resetForm);

    // =============================
    // EDIT
    // =============================
    function editReminder(rem) {
        reminderIdIn.value = rem.id;
        reminderTextIn.value = rem.text;
        reminderDateIn.value = rem.date;
        reminderTimeIn.value = rem.time;
        reminderCatIn.value = rem.category;
        reminderRepIn.value = rem.repeat;
        reminderPriIn.value = rem.priority;
        formTitle.textContent = 'Edit Reminder';
        cancelEditBtn?.classList.remove('hidden');

        categoryPicker?.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.cat === rem.category));
        repeatPicker?.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.repeat === rem.repeat));
        priorityPicker?.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.priority === rem.priority));

        reminderTextIn.focus();
        form?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // =============================
    // RENDER LISTS
    // =============================
    function renderItem(rem, container) {
        const item = document.createElement('article');
        item.className = 'reminder-item priority-' + rem.priority + (rem.completed ? ' completed' : '');

        const repeatHtml = rem.repeat !== 'none' ? `<span class="repeat-badge">${rem.repeat}</span>` : '';

        item.innerHTML = `
            <button class="reminder-check" data-id="${rem.id}"><i class="fa-solid fa-check"></i></button>
            <section class="reminder-info">
                <p class="reminder-text">${escapeHtml(rem.text)}</p>
                <section class="reminder-meta">
                    <span class="rem-cat-badge rcat-${rem.category}"><i class="fa-solid ${CAT_ICONS[rem.category] || 'fa-ellipsis'}"></i> ${rem.category}</span>
                    <span class="time-badge"><i class="fa-regular fa-clock"></i> ${formatDate(rem.date)} · ${formatTime12(rem.time)}</span>
                    ${repeatHtml}
                </section>
            </section>
            <section class="reminder-actions">
                ${!rem.completed ? `<button class="rem-action-btn edit-btn" data-id="${rem.id}" title="Edit"><i class="fa-solid fa-pen"></i></button>` : ''}
                <button class="rem-action-btn delete-btn" data-id="${rem.id}" title="Delete"><i class="fa-solid fa-trash-can"></i></button>
            </section>
        `;

        container?.appendChild(item);
    }

    function renderLists() {
        const reminders = getReminders();
        const active = reminders.filter(r => !r.completed);
        const completed = reminders.filter(r => r.completed);

        // Sort active: high priority first, then by date
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        active.sort((a, b) => {
            if (priorityOrder[a.priority] !== priorityOrder[b.priority])
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            return new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time);
        });

        // Active
        activeList?.querySelectorAll('.reminder-item').forEach(el => el.remove());
        if (active.length === 0) {
            if (activeEmpty) activeEmpty.style.display = 'flex';
        } else {
            if (activeEmpty) activeEmpty.style.display = 'none';
            active.forEach(r => renderItem(r, activeList));
        }

        // Completed
        completedList?.querySelectorAll('.reminder-item').forEach(el => el.remove());
        if (completed.length === 0) {
            if (completedEmpty) completedEmpty.style.display = 'flex';
        } else {
            if (completedEmpty) completedEmpty.style.display = 'none';
            completed.forEach(r => renderItem(r, completedList));
        }
    }

    function escapeHtml(str) { const d = document.createElement('div'); d.textContent = str; return d.innerHTML; }

    // =============================
    // LIST ACTIONS
    // =============================
    function handleListClick(e) {
        const checkBtn = e.target.closest('.reminder-check');
        const editBtn = e.target.closest('.edit-btn');
        const deleteBtn = e.target.closest('.delete-btn');

        if (checkBtn) {
            const reminders = getReminders();
            const rem = reminders.find(r => r.id === checkBtn.dataset.id);
            if (rem) rem.completed = !rem.completed;
            saveReminders(reminders);
            renderAll();
            return;
        }
        if (editBtn) {
            const reminders = getReminders();
            const rem = reminders.find(r => r.id === editBtn.dataset.id);
            if (rem) editReminder(rem);
            return;
        }
        if (deleteBtn) {
            let reminders = getReminders();
            reminders = reminders.filter(r => r.id !== deleteBtn.dataset.id);
            saveReminders(reminders);
            renderAll();
            return;
        }
    }

    activeList?.addEventListener('click', handleListClick);
    completedList?.addEventListener('click', handleListClick);

    clearCompletedBtn?.addEventListener('click', () => {
        if (!confirm('Clear all completed reminders?')) return;
        let reminders = getReminders();
        reminders = reminders.filter(r => !r.completed);
        saveReminders(reminders);
        renderAll();
    });

    // =============================
    // STATS
    // =============================
    function renderStats() {
        const reminders = getReminders();
        const active = reminders.filter(r => !r.completed);
        const completed = reminders.filter(r => r.completed);
        const dueToday = active.filter(r => r.date === today);
        const recurring = active.filter(r => r.repeat !== 'none');

        if (activeCountEl) activeCountEl.textContent = active.length;
        if (completedCountEl) completedCountEl.textContent = completed.length;
        if (todayCountEl) todayCountEl.textContent = dueToday.length;
        if (recurringCountEl) recurringCountEl.textContent = recurring.length;
        if (activeBadge) activeBadge.textContent = active.length;

        // Hero ring
        if (heroRingFill) {
            const circ = 326.73;
            const maxRing = Math.max(active.length + completed.length, 1);
            const pct = completed.length / maxRing;
            heroRingFill.style.strokeDashoffset = circ - (pct * circ);
        }
        if (heroRingValue) heroRingValue.textContent = active.length;

        if (heroSubtitle) {
            if (dueToday.length > 0) heroSubtitle.textContent = dueToday.length + ' reminder' + (dueToday.length > 1 ? 's' : '') + ' due today.';
            else if (active.length === 0) heroSubtitle.textContent = 'All clear! Create a reminder to stay on track.';
            else heroSubtitle.textContent = 'Stay on track with your wellbeing habits.';
        }
    }

    // =============================
    // RENDER ALL
    // =============================
    function renderAll() { renderStats(); renderLists(); }
    renderAll();

});