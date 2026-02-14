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
    let notes = [];

    const editorCard   = document.getElementById('editorCard');
    const editorTitle  = document.getElementById('editorTitle');
    const noteForm     = document.getElementById('noteForm');
    const noteIdInput  = document.getElementById('noteId');
    const noteTitleIn  = document.getElementById('noteTitle');
    const noteCatIn    = document.getElementById('noteCategory');
    const noteMoodIn   = document.getElementById('noteMood');
    const noteBodyIn   = document.getElementById('noteBody');
    const categoryPicker = document.getElementById('categoryPicker');
    const moodPicker   = document.getElementById('moodPicker');
    const newNoteBtn   = document.getElementById('newNoteBtn');
    const closeEditor  = document.getElementById('closeEditor');
    const cancelEditor = document.getElementById('cancelEditor');
    const searchInput  = document.getElementById('searchInput');
    const filterTabs   = document.getElementById('filterTabs');
    const notesGrid    = document.getElementById('notesGrid');
    const notesEmpty   = document.getElementById('notesEmpty');

    const totalNotesEl  = document.getElementById('totalNotes');
    const todayNotesEl  = document.getElementById('todayNotes');
    const currentStreakEl = document.getElementById('currentStreak');
    const pinnedCountEl = document.getElementById('pinnedCount');
    const heroRingFill  = document.getElementById('heroRingFill');
    const heroRingValue = document.getElementById('heroRingValue');

    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    let currentFilter = 'all';
    let currentSearch = '';

    function todayStr() { return new Date().toISOString().split('T')[0]; }
    function formatDate(d) { const dt = new Date(d); return dt.getDate() + ' ' + MONTHS[dt.getMonth()] + ' ' + dt.getFullYear(); }

    function mapEntry(e) {
        return {
            id: String(e.id),
            title: e.title,
            body: e.body,
            category: e.category || 'Reflection',
            mood: e.mood || '😐',
            pinned: e.pinned || false,
            createdAt: e.created_at,
            updatedAt: e.updated_at
        };
    }

    // =============================
    // EDITOR
    // =============================
    function openEditor(note) {
        editorCard.classList.remove('hidden');
        if (note) {
            editorTitle.textContent = 'Edit Note';
            noteIdInput.value = note.id;
            noteTitleIn.value = note.title;
            noteBodyIn.value = note.body;
            noteCatIn.value = note.category;
            noteMoodIn.value = note.mood;
            categoryPicker.querySelectorAll('.cat-btn').forEach(b => b.classList.toggle('active', b.dataset.cat === note.category));
            moodPicker.querySelectorAll('.mood-btn').forEach(b => b.classList.toggle('active', b.dataset.mood === note.mood));
        } else {
            editorTitle.textContent = 'New Note';
            noteIdInput.value = '';
            noteTitleIn.value = '';
            noteBodyIn.value = '';
            noteCatIn.value = 'Reflection';
            noteMoodIn.value = '😐';
            categoryPicker.querySelectorAll('.cat-btn').forEach(b => b.classList.toggle('active', b.dataset.cat === 'Reflection'));
            moodPicker.querySelectorAll('.mood-btn').forEach(b => b.classList.toggle('active', b.dataset.mood === '😐'));
        }
        noteTitleIn.focus();
        editorCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function closeEditorFn() { editorCard.classList.add('hidden'); }

    newNoteBtn?.addEventListener('click', () => openEditor(null));
    closeEditor?.addEventListener('click', closeEditorFn);
    cancelEditor?.addEventListener('click', closeEditorFn);

    // Pickers
    categoryPicker?.querySelectorAll('.cat-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            categoryPicker.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            noteCatIn.value = btn.dataset.cat;
        });
    });

    moodPicker?.querySelectorAll('.mood-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            moodPicker.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            noteMoodIn.value = btn.dataset.mood;
        });
    });

    // Save
    noteForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = noteTitleIn.value.trim();
        const body = noteBodyIn.value.trim();
        if (!title || !body) return;

        const id = noteIdInput.value;
        const payload = {
            title, body,
            category: noteCatIn.value,
            mood: noteMoodIn.value
        };

        if (id) {
            // Edit existing
            const result = await apiPut('/api/notes/' + id, payload);
            if (result && !result.error) {
                const idx = notes.findIndex(n => n.id === id);
                if (idx !== -1) notes[idx] = mapEntry(result);
            }
        } else {
            // New note
            const result = await apiPost('/api/notes', payload);
            if (result && !result.error) {
                notes.unshift(mapEntry(result));
            }
        }

        closeEditorFn();
        renderAll();
    });

    // =============================
    // SEARCH & FILTER
    // =============================
    searchInput?.addEventListener('input', () => {
        currentSearch = searchInput.value.trim().toLowerCase();
        renderNotes();
    });

    filterTabs?.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            filterTabs.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentFilter = tab.dataset.filter;
            renderNotes();
        });
    });

    // =============================
    // RENDER NOTES
    // =============================
    function renderNotes() {
        let filtered = [...notes];

        if (currentFilter !== 'all') {
            filtered = filtered.filter(n => n.category === currentFilter);
        }

        if (currentSearch) {
            filtered = filtered.filter(n =>
                n.title.toLowerCase().includes(currentSearch) ||
                n.body.toLowerCase().includes(currentSearch)
            );
        }

        filtered.sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        notesGrid?.querySelectorAll('.note-card').forEach(el => el.remove());

        if (filtered.length === 0) {
            if (notesEmpty) notesEmpty.style.display = 'flex';
            return;
        }
        if (notesEmpty) notesEmpty.style.display = 'none';

        filtered.forEach(note => {
            const card = document.createElement('article');
            card.className = 'note-card' + (note.pinned ? ' pinned' : '');
            card.dataset.id = note.id;

            card.innerHTML = `
                <header class="note-card-header">
                    <h3 class="note-card-title">${escapeHtml(note.title)}</h3>
                    <span class="note-card-mood">${note.mood}</span>
                </header>
                <p class="note-card-body">${escapeHtml(note.body)}</p>
                <footer class="note-card-footer">
                    <section class="note-card-meta">
                        <span class="note-cat-badge cat-${note.category}">${note.category}</span>
                        <span class="note-card-date">${formatDate(note.createdAt)}</span>
                    </section>
                    <section class="note-card-actions">
                        <button class="note-action-btn pin-btn ${note.pinned ? 'pin-active' : ''}" data-id="${note.id}" title="${note.pinned ? 'Unpin' : 'Pin'}">
                            <i class="fa-solid fa-thumbtack"></i>
                        </button>
                        <button class="note-action-btn edit-btn" data-id="${note.id}" title="Edit">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button class="note-action-btn delete-btn" data-id="${note.id}" title="Delete">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </section>
                </footer>
            `;
            notesGrid?.insertBefore(card, notesEmpty);
        });
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // Note actions
    notesGrid?.addEventListener('click', async (e) => {
        const pinBtn = e.target.closest('.pin-btn');
        const editBtn = e.target.closest('.edit-btn');
        const deleteBtn = e.target.closest('.delete-btn');

        if (pinBtn) {
            const result = await apiPatch('/api/notes/' + pinBtn.dataset.id + '/pin');
            if (result && !result.error) {
                const idx = notes.findIndex(n => n.id === pinBtn.dataset.id);
                if (idx !== -1) notes[idx] = mapEntry(result);
            }
            renderAll();
            return;
        }

        if (editBtn) {
            const note = notes.find(n => n.id === editBtn.dataset.id);
            if (note) openEditor(note);
            return;
        }

        if (deleteBtn) {
            if (!confirm('Delete this note?')) return;
            await apiDelete('/api/notes/' + deleteBtn.dataset.id);
            notes = notes.filter(n => n.id !== deleteBtn.dataset.id);
            renderAll();
            return;
        }
    });

    // =============================
    // STATS
    // =============================
    function renderStats() {
        const today = todayStr();

        if (totalNotesEl) totalNotesEl.textContent = notes.length;
        if (todayNotesEl) todayNotesEl.textContent = notes.filter(n => n.createdAt.split('T')[0] === today).length;
        if (pinnedCountEl) pinnedCountEl.textContent = notes.filter(n => n.pinned).length;

        if (heroRingFill) {
            const circ = 326.73;
            const pct = Math.min(notes.length / 50, 1);
            heroRingFill.style.strokeDashoffset = circ - (pct * circ);
        }
        if (heroRingValue) heroRingValue.textContent = notes.length;

        // Streak
        const uniqueDates = [...new Set(notes.map(n => n.createdAt.split('T')[0]))].sort().reverse();
        let current = 0;
        if (uniqueDates.length > 0) {
            const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
            const yStr = yesterday.toISOString().split('T')[0];
            if (uniqueDates[0] === today || uniqueDates[0] === yStr) {
                for (let i = 0; i < uniqueDates.length; i++) {
                    const exp = new Date();
                    exp.setDate(exp.getDate() - (uniqueDates[0] === today ? i : i + 1));
                    if (uniqueDates[i] === exp.toISOString().split('T')[0]) current++;
                    else break;
                }
            }
        }
        if (currentStreakEl) currentStreakEl.textContent = current;
    }

    // =============================
    // RENDER ALL & INIT
    // =============================
    function renderAll() { renderStats(); renderNotes(); }

    async function init() {
        const data = await apiGet('/api/notes?limit=200');
        if (data && Array.isArray(data)) {
            notes = data.map(mapEntry);
        }
        renderAll();
    }

    init();

});