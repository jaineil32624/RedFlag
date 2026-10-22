/*
 * systems/settings.js
 * Player preferences (theme, accessibility, audio, timers) persisted in the
 * save file and reflected onto <html> as data-attributes that the CSS uses.
 */
(function (RF) {
  'use strict';

  function prefersReducedMotion() {
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; }
  }
  function prefersLight() {
    try { return window.matchMedia('(prefers-color-scheme: light)').matches; } catch (e) { return false; }
  }

  var DEFAULTS = {
    theme: 'auto',          // auto | dark | light
    contrast: false,        // high-contrast theme
    largeText: false,       // family mode: bigger text
    reducedMotion: null,    // null = follow the OS
    sfx: true, sfxVol: 0.7,
    music: false, musicVol: 0.35,
    haptics: true,
    timer: 'normal',        // normal | relaxed | off  (off = practice)
    speechRate: 1
  };

  function data() {
    var s = RF.store.data.settings;
    Object.keys(DEFAULTS).forEach(function (k) { if (!(k in s)) s[k] = DEFAULTS[k]; });
    return s;
  }

  var Settings = {
    get: function (k) { return data()[k]; },
    set: function (k, v) {
      data()[k] = v;
      RF.store.save();
      Settings.apply();
      RF.bus.emit('settings', { key: k, value: v });
    },
    reducedMotion: function () {
      var v = data().reducedMotion;
      return v == null ? prefersReducedMotion() : !!v;
    },
    /** Timer multiplier: relaxed gives 1.8x time, off = no timer. */
    timerFactor: function () {
      var t = data().timer;
      return t === 'off' ? 0 : t === 'relaxed' ? 1.8 : 1;
    },
    resolvedTheme: function () {
      var t = data().theme;
      return t === 'auto' ? (prefersLight() ? 'light' : 'dark') : t;
    },
    apply: function () {
      var el = document.documentElement, s = data();
      el.setAttribute('data-theme', Settings.resolvedTheme());
      el.toggleAttribute('data-contrast', !!s.contrast);
      el.toggleAttribute('data-large', !!s.largeText);
      el.toggleAttribute('data-reduced-motion', Settings.reducedMotion());
      var meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', Settings.resolvedTheme() === 'light' ? '#f4f1fb' : '#130f24');
    }
  };

  try {
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', function () { Settings.apply(); });
  } catch (e) { /* old browsers */ }

  RF.settings = Settings;
})(window.RedFlag);
