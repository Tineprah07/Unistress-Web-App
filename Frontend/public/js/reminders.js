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
    async function apiPut(url, body) {
        const res = await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(body) });
        if (res.status === 401) { window.location.href = '/views/auth.html'; return null; }
        return res.json();
    }
    async function apiPatch(url) {
        const res = await fetch(url, { method: 'PATCH', credentials: 'include' });
        if (res.status === 401) { window.location.href = '/views/auth.html'; return null; }
        return res.json();
    }
    async function apiDelete(url) {
        const res = await fetch(url, { method: 'DELETE', credentials: 'include' });
        if (res.status === 401) { window.location.href = '/views/auth.html'; return null; }
        return res.json();
    }

    // In-memory cache
    let reminders = [];

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

    const today = new Date().toISOString().split('T')[0];
    if (reminderDateIn) reminderDateIn.value = today;

    function mapEntry(e) {
        return {
            id: String(e.id),
            text: e.text,
            date: e.due_date ? e.due_date.split('T')[0] : today,
            time: e.due_time || '09:00',
            category: e.category || 'Other',
            repeat: e.repeat || 'none',
            priority: e.priority || 'medium',
            completed: e.completed || false,
            createdAt: e.created_at,
            updatedAt: e.updated_at
        };
    }

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
    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = reminderTextIn.value.trim();
        if (!text) return;

        const id = reminderIdIn.value;

        const payload = {
            text,
            due_date: reminderDateIn.value,
            due_time: reminderTimeIn.value,
            category: reminderCatIn.value,
            repeat: reminderRepIn.value,
            priority: reminderPriIn.value,
        };

        if (id) {
            const result = await apiPut('/api/reminders/' + id, payload);
            if (result && !result.error) {
                const idx = reminders.findIndex(r => r.id === id);
                if (idx !== -1) reminders[idx] = mapEntry(result);
            }
        } else {
            const result = await apiPost('/api/reminders', payload);
            if (result && !result.error) {
                reminders.unshift(mapEntry(result));
            }
        }

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
        const active = reminders.filter(r => !r.completed);
        const completed = reminders.filter(r => r.completed);

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
    async function handleListClick(e) {
        const checkBtn = e.target.closest('.reminder-check');
        const editBtn = e.target.closest('.edit-btn');
        const deleteBtn = e.target.closest('.delete-btn');

        if (checkBtn) {
            const result = await apiPatch('/api/reminders/' + checkBtn.dataset.id + '/complete');
            if (result && !result.error) {
                const idx = reminders.findIndex(r => r.id === checkBtn.dataset.id);
                if (idx !== -1) reminders[idx] = mapEntry(result);
            }
            renderAll();
            return;
        }
        if (editBtn) {
            const rem = reminders.find(r => r.id === editBtn.dataset.id);
            if (rem) editReminder(rem);
            return;
        }
        if (deleteBtn) {
            await apiDelete('/api/reminders/' + deleteBtn.dataset.id);
            reminders = reminders.filter(r => r.id !== deleteBtn.dataset.id);
            renderAll();
            return;
        }
    }

    activeList?.addEventListener('click', handleListClick);
    completedList?.addEventListener('click', handleListClick);

    clearCompletedBtn?.addEventListener('click', async () => {
        if (!confirm('Clear all completed reminders?')) return;
        await apiDelete('/api/reminders/completed');
        reminders = reminders.filter(r => !r.completed);
        renderAll();
    });

    // =============================
    // STATS
    // =============================
    function renderStats() {
        const active = reminders.filter(r => !r.completed);
        const completed = reminders.filter(r => r.completed);
        const dueToday = active.filter(r => r.date === today);
        const recurring = active.filter(r => r.repeat !== 'none');

        if (activeCountEl) activeCountEl.textContent = active.length;
        if (completedCountEl) completedCountEl.textContent = completed.length;
        if (todayCountEl) todayCountEl.textContent = dueToday.length;
        if (recurringCountEl) recurringCountEl.textContent = recurring.length;
        if (activeBadge) activeBadge.textContent = active.length;

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
    // RENDER ALL & INIT
    // =============================
    function renderAll() { renderStats(); renderLists(); }

    async function init() {
        const data = await apiGet('/api/reminders');
        if (data && Array.isArray(data)) {
            reminders = data.map(mapEntry);
        }
        renderAll();
    }

    init();

});