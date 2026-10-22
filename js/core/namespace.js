/*
 * RedFlag: The Scam Detective Game
 * ---------------------------------------------------------------
 * core/namespace.js
 * Creates the single global namespace `window.RedFlag` and a few
 * tiny, dependency-free helpers used everywhere.
 *
 * The app deliberately uses classic <script> tags (no ES modules)
 * so it runs straight from file:// as well as over https.
 * Every file attaches itself to RedFlag.<Something>.
 */
(function (global) {
  'use strict';

  var RF = global.RedFlag = global.RedFlag || {};
  RF.VERSION = '1.0.0';

  /* ---------- Small utilities ---------- */
  var U = RF.util = {};

  /** Escape text for safe insertion into innerHTML. */
  U.esc = function (s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };
  U.clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  U.lerp = function (a, b, t) { return a + (b - a) * t; };
  U.now = function () { return (global.performance && performance.now) ? performance.now() : Date.now(); };

  /** Format a number with thousands separators. */
  U.fmt = function (n) {
    n = Math.round(Number(n) || 0);
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };
  /** Format money like $1,234 or $12.50 */
  U.money = function (n, cents) {
    if (cents) return '$' + Number(n).toFixed(2);
    return '$' + U.fmt(n);
  };

  /** Local date key YYYY-MM-DD (used by Daily Case & streaks). */
  U.dateKey = function (d) {
    d = d || new Date();
    var m = d.getMonth() + 1, day = d.getDate();
    return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (day < 10 ? '0' : '') + day;
  };
  /** Difference in whole days between two YYYY-MM-DD keys (b - a). */
  U.dayDiff = function (a, b) {
    function parse(k) { var p = k.split('-'); return Date.UTC(+p[0], +p[1] - 1, +p[2]); }
    return Math.round((parse(b) - parse(a)) / 86400000);
  };

  /** Query helpers */
  U.$ = function (sel, root) { return (root || document).querySelector(sel); };
  U.$$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /**
   * Hyperscript-style element builder.
   * h('div.card#main', {onclick: fn, 'aria-label': 'x'}, [children...])
   */
  U.h = function (tag, attrs, children) {
    var m = tag.match(/^([a-z0-9]+)?((?:[.#][\w-]+)*)$/i) || [];
    var el = document.createElement(m[1] || 'div');
    (m[2] || '').replace(/([.#])([\w-]+)/g, function (_, t, v) {
      if (t === '.') el.classList.add(v); else el.id = v;
    });
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v == null || v === false) return;
        if (k.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(k.slice(2), v);
        else if (k === 'html') el.innerHTML = v;
        else if (k === 'text') el.textContent = v;
        else if (k === 'class') el.className += ' ' + v;
        else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
        else el.setAttribute(k, v === true ? '' : v);
      });
    }
    if (children != null) {
      (Array.isArray(children) ? children : [children]).forEach(function (c) {
        if (c == null || c === false) return;
        el.appendChild(typeof c === 'object' ? c : document.createTextNode(String(c)));
      });
    }
    return el;
  };

  /* ---------- Tiny event bus (decouples systems from UI) ---------- */
  var handlers = {};
  RF.bus = {
    on: function (evt, fn) { (handlers[evt] = handlers[evt] || []).push(fn); },
    off: function (evt, fn) { handlers[evt] = (handlers[evt] || []).filter(function (f) { return f !== fn; }); },
    emit: function (evt, data) {
      (handlers[evt] || []).slice().forEach(function (fn) {
        try { fn(data); } catch (e) { if (global.console) console.error('[RedFlag bus]', evt, e); }
      });
    }
  };
})(window);
