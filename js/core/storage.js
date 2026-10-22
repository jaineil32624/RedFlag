/*
 * core/storage.js
 * Versioned, fault-tolerant persistence on top of localStorage.
 * - Everything lives under ONE key so it is easy to export/reset.
 * - All access is wrapped in try/catch: private mode, disabled storage
 *   or quota errors simply fall back to in-memory state.
 * - `migrate()` upgrades older save formats when SAVE_VERSION changes.
 */
(function (RF) {
  'use strict';

  var KEY = 'redflag.save';
  var SAVE_VERSION = 1;
  var memory = null;      // in-memory copy (source of truth while running)
  var available = false;  // whether localStorage works
  var saveTimer = null;

  function defaults() {
    return {
      v: SAVE_VERSION,
      createdAt: Date.now(),
      onboarded: false,
      settings: {},           // filled by systems/settings.js
      progress: {},           // xp, level, IQ history... (systems/progress.js)
      stats: {},              // per-category stats
      badges: {},             // id -> unlock timestamp
      guide: {},              // field-guide entries unlocked
      story: {},              // chapterId -> {stars, done, bossSafe}
      daily: {},              // streak data
      counters: {}            // misc counters for badges
    };
  }

  function migrate(data) {
    if (!data || typeof data !== 'object') return defaults();
    // Future: if (data.v === 1) { ...upgrade to 2...; data.v = 2; }
    var d = defaults();
    Object.keys(d).forEach(function (k) { if (data[k] == null) data[k] = d[k]; });
    data.v = SAVE_VERSION;
    return data;
  }

  function load() {
    try {
      var test = '__rf_test__';
      window.localStorage.setItem(test, '1');
      window.localStorage.removeItem(test);
      available = true;
      var raw = window.localStorage.getItem(KEY);
      memory = migrate(raw ? JSON.parse(raw) : null);
    } catch (e) {
      available = false;
      memory = defaults();
    }
    return memory;
  }

  /** Write immediately. */
  function flush() {
    if (!available || !memory) return;
    try { window.localStorage.setItem(KEY, JSON.stringify(memory)); }
    catch (e) { /* quota or disabled - keep running in memory */ }
  }

  /** Debounced save so rapid updates don't thrash storage. */
  function save() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(function () { saveTimer = null; flush(); }, 150);
  }

  RF.store = {
    load: load,
    save: save,
    flush: flush,
    get data() { return memory || load(); },
    get available() { return available; },
    /** Wipe all progress (keeps nothing). */
    reset: function () {
      memory = defaults();
      try { window.localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
      flush();
    }
  };

  // Make sure pending writes land when the page is hidden/closed.
  window.addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', function () { if (document.hidden) flush(); });
})(window.RedFlag);
