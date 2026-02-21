// =========================================
//   FITBIT INTEGRATION – UniStress
//   Shared connection & API module
//   Loaded on all pages that use Fitbit
// =========================================
(function () {
    'use strict';

    var Fitbit = {
        connected: false,
        fitbitUserId: null,
        _listeners: [],
        _initDone: false,
        _readyResolve: null,
        ready: null,

        // ── API Methods ──

        async checkStatus() {
            try {
                var res = await fetch('/api/fitbit/status', { credentials: 'include' });
                if (!res.ok) return false;
                var data = await res.json();
                this.connected = data.connected;
                this.fitbitUserId = data.fitbit_user_id;
                return data.connected;
            } catch (e) { return false; }
        },

        async connect() {
            try {
                var res = await fetch('/api/fitbit/connect', { credentials: 'include' });
                if (!res.ok) return;
                var data = await res.json();
                if (data.url) window.location.href = data.url;
            } catch (e) { console.error('Fitbit connect:', e); }
        },

        async disconnect() {
            if (!confirm('Disconnect Fitbit? Your data will no longer sync.')) return;
            try {
                var res = await fetch('/api/fitbit/disconnect', { method: 'DELETE', credentials: 'include' });
                if (!res.ok) return;
                this.connected = false;
                this.fitbitUserId = null;
                this._updateCards();
                this._fire(false);
            } catch (e) { console.error('Fitbit disconnect:', e); }
        },

        async getActivity() {
            try { var r = await fetch('/api/fitbit/activity', { credentials: 'include' }); return r.ok ? r.json() : null; }
            catch (e) { return null; }
        },

        async getSleep() {
            try { var r = await fetch('/api/fitbit/sleep', { credentials: 'include' }); return r.ok ? r.json() : null; }
            catch (e) { return null; }
        },

        async getHeartRate() {
            try { var r = await fetch('/api/fitbit/heart-rate', { credentials: 'include' }); return r.ok ? r.json() : null; }
            catch (e) { return null; }
        },

        async getSteps(start, end) {
            try {
                var r = await fetch('/api/fitbit/steps?start=' + start + '&end=' + end, { credentials: 'include' });
                return r.ok ? r.json() : null;
            } catch (e) { return null; }
        },

        // ── Listener System ──

        onStatusChange: function (fn) {
            this._listeners.push(fn);
            if (this._initDone) fn(this.connected);
        },

        _fire: function (connected) {
            this._listeners.forEach(function (fn) {
                try { fn(connected); } catch (e) { console.error(e); }
            });
        },

        // ── UI Updates ──

        _updateCards: function () {
            // Toggle .connected class on all Fitbit cards
            document.querySelectorAll('.fitbit-card').forEach(function (c) {
                c.classList.toggle('connected', Fitbit.connected);
            });

            // Dashboard banner
            var banner = document.getElementById('fitbitDashBanner');
            if (banner) banner.classList.toggle('connected', this.connected);

            // Settings popover Fitbit item
            var dot = document.querySelector('.fitbit-status-dot');
            if (dot) dot.classList.toggle('connected', this.connected);
            var txt = document.querySelector('.popover-fitbit-status-text');
            if (txt) txt.textContent = this.connected ? 'Connected' : 'Not connected';
            var btn = document.querySelector('.popover-fitbit-btn');
            if (btn) {
                btn.textContent = this.connected ? 'Disconnect' : 'Connect';
                btn.classList.toggle('disconnect', this.connected);
            }
        },

        // Dynamically inject Fitbit item into settings popover
        _injectSettings: function () {
            var list = document.querySelector('.popover-list');
            if (!list || list.querySelector('.popover-fitbit-item')) return;

            var li = document.createElement('li');
            li.className = 'popover-item popover-fitbit-item';
            li.innerHTML =
                '<span class="popover-label"><i class="fa-solid fa-heart-pulse" style="color:#00B0B9"></i> Fitbit</span>' +
                '<span class="popover-fitbit-status">' +
                    '<span class="fitbit-status-dot"></span>' +
                    '<span class="popover-fitbit-status-text">...</span>' +
                    '<button class="popover-fitbit-btn" type="button">Connect</button>' +
                '</span>';

            // Insert after the notifications item (2nd popover item)
            var items = list.querySelectorAll('.popover-item');
            var after = items[1] || items[0];
            if (after && after.nextSibling) list.insertBefore(li, after.nextSibling);
            else list.appendChild(li);

            var self = this;
            li.querySelector('.popover-fitbit-btn').addEventListener('click', function () {
                self.connected ? self.disconnect() : self.connect();
            });
        },

        // ── Initialization ──

        async init() {
            var self = this;

            // Bind static connect buttons (cards only, not dashboard)
            document.querySelectorAll('.fitbit-connect-btn').forEach(function (b) {
                b.addEventListener('click', function (e) { e.preventDefault(); self.connect(); });
            });

            // Bind disconnect buttons
            document.querySelectorAll('.fitbit-disconnect-btn').forEach(function (b) {
                b.addEventListener('click', function (e) { e.preventDefault(); self.disconnect(); });
            });

            // Bind sync buttons
            document.querySelectorAll('.fitbit-sync-btn').forEach(function (b) {
                b.addEventListener('click', async function (e) {
                    e.preventDefault();
                    b.classList.add('syncing');
                    self._fire(self.connected);
                    setTimeout(function () { b.classList.remove('syncing'); }, 1200);
                });
            });

            // Inject Fitbit into settings popover
            this._injectSettings();

            // Check connection status
            await this.checkStatus();
            this._updateCards();

            this._initDone = true;
            this._fire(this.connected);

            if (this._readyResolve) this._readyResolve(this.connected);

            // Clean up ?fitbit=connected URL param after OAuth redirect
            if (new URLSearchParams(location.search).get('fitbit') === 'connected') {
                history.replaceState({}, '', location.pathname);
            }
        },

        // ── Helpers ──

        formatNumber: function (n) {
            return (n || 0).toLocaleString();
        },

        // Animated count-up for stat values
        animateValue: function (el, target, suffix) {
            if (!el || target === 0) { if (el) el.innerHTML = '0' + (suffix || ''); return; }
            var duration = 900;
            var startTime = performance.now();
            var isFloat = String(target).includes('.');
            var self = this;
            function tick(now) {
                var progress = Math.min((now - startTime) / duration, 1);
                var ease = 1 - Math.pow(1 - progress, 3);
                var current = target * ease;
                if (isFloat) el.innerHTML = current.toFixed(1) + (suffix || '');
                else el.innerHTML = self.formatNumber(Math.round(current)) + (suffix || '');
                if (progress < 1) requestAnimationFrame(tick);
            }
            requestAnimationFrame(tick);
        }
    };

    // Ready promise – resolves after first status check
    Fitbit.ready = new Promise(function (resolve) { Fitbit._readyResolve = resolve; });

    window.Fitbit = Fitbit;

    // Auto-init when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () { Fitbit.init(); });
    } else {
        Fitbit.init();
    }
})();
