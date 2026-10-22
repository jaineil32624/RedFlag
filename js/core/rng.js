/*
 * core/rng.js
 * Seedable pseudo-random number generator (mulberry32) plus helpers.
 * Seeded RNG makes the Daily Case and Challenge links reproducible:
 * the same seed always yields the exact same deck of cards.
 */
(function (RF) {
  'use strict';

  /** Hash any string into a 32-bit unsigned seed (FNV-1a). */
  function hashString(str) {
    var h = 2166136261 >>> 0;
    str = String(str);
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h >>> 0;
  }

  /**
   * Create an RNG object.
   * @param {number|string} seed - optional; random if omitted.
   */
  function create(seed) {
    var s = seed == null ? (Math.random() * 4294967296) >>> 0
      : (typeof seed === 'number' ? seed >>> 0 : hashString(seed));
    if (s === 0) s = 0x9e3779b9;
    var state = s;

    function next() {
      state = (state + 0x6D2B79F5) >>> 0;
      var t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    var api = {
      seed: s,
      next: next,
      /** integer in [min, max] inclusive */
      int: function (min, max) { return min + Math.floor(next() * (max - min + 1)); },
      /** float in [min, max) */
      range: function (min, max) { return min + next() * (max - min); },
      chance: function (p) { return next() < p; },
      pick: function (arr) { return arr[Math.floor(next() * arr.length)]; },
      /** pick using weights array (same length as arr) */
      weighted: function (arr, weights) {
        var total = 0, i;
        for (i = 0; i < weights.length; i++) total += weights[i];
        var r = next() * total;
        for (i = 0; i < arr.length; i++) { r -= weights[i]; if (r <= 0) return arr[i]; }
        return arr[arr.length - 1];
      },
      shuffle: function (arr) {
        var a = arr.slice();
        for (var i = a.length - 1; i > 0; i--) {
          var j = Math.floor(next() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t;
        }
        return a;
      },
      /** n random digits as string */
      digits: function (n) { var o = ''; for (var i = 0; i < n; i++) o += Math.floor(next() * 10); return o; },
      /** random uppercase letters/digits */
      alnum: function (n, lower) {
        var c = lower ? 'abcdefghjkmnpqrstuvwxyz23456789' : 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', o = '';
        for (var i = 0; i < n; i++) o += c[Math.floor(next() * c.length)];
        return o;
      },
      /** derive an independent child RNG */
      fork: function (salt) { return create(hashString(s + ':' + salt)); }
    };
    return api;
  }

  RF.rng = { create: create, hash: hashString };
})(window.RedFlag);
