/*
 * systems/progress.js
 * XP, levels, ranks, the "Scam IQ" score and per-category stats.
 *
 * Scam IQ = rolling, difficulty-weighted accuracy over the last 60 answers,
 * mapped onto a friendly IQ-like scale (~55 .. ~155). Subtle (diff 3) cards
 * count three times as much as obvious ones, so you can't farm easy wins.
 */
(function (RF) {
  'use strict';

  var RANKS = [
    { min: 1, name: 'Rookie', icon: '🔍' },
    { min: 5, name: 'Fraud Spotter', icon: '🕵️' },
    { min: 10, name: 'Scam Buster', icon: '🛡️' },
    { min: 15, name: 'Cyber Sentinel', icon: '🛰️' },
    { min: 25, name: 'Legend', icon: '👑' }
  ];
  var WINDOW = 60;

  function P() {
    var p = RF.store.data.progress;
    if (p.xp == null) {
      p.xp = 0; p.answers = []; p.total = 0; p.correct = 0; p.recent = []; p.bestCombo = 0;
      p.legitCorrect = 0; p.scamCorrect = 0; p.flagsFound = 0; p.bestRun = 0; p.bestIQ = 0;
    }
    return p;
  }
  function S() { return RF.store.data.stats; }

  /** XP needed to go from level L to L+1. */
  function stepXP(L) { return 100 + 50 * (L - 1); }
  function levelInfo(xp) {
    var L = 1, need = stepXP(1), rem = xp;
    while (rem >= need) { rem -= need; L++; need = stepXP(L); }
    return { level: L, into: rem, need: need, pct: rem / need };
  }
  function rankFor(level) {
    var r = RANKS[0];
    RANKS.forEach(function (x) { if (level >= x.min) r = x; });
    return r;
  }

  /** IQ from a list of {d: difficulty, ok: bool}. null if too few answers. */
  function iqOf(list, minCount) {
    if (!list || list.length < (minCount == null ? 5 : minCount)) return null;
    var wsum = 0, okw = 0;
    list.forEach(function (a) { var w = a.d || 1; wsum += w; if (a.ok) okw += w; });
    var wacc = okw / wsum, avgD = wsum / list.length;
    return Math.round(55 + 75 * wacc + 12 * (avgD - 1));
  }

  var Progress = {
    RANKS: RANKS,
    get xp() { return P().xp; },
    level: function () { return levelInfo(P().xp).level; },
    levelInfo: function () { return levelInfo(P().xp); },
    rank: function (lvl) { return rankFor(lvl || Progress.level()); },
    nextRank: function () {
      var l = Progress.level();
      for (var i = 0; i < RANKS.length; i++) if (RANKS[i].min > l) return RANKS[i];
      return null;
    },
    iq: function () { return iqOf(P().answers.slice(-WINDOW)); },
    iqOf: iqOf,
    get data() { return P(); },

    /** Record recently-seen template ids so new decks avoid repeats. */
    noteSeen: function (tid) {
      var p = P(); p.recent.push(tid); if (p.recent.length > 20) p.recent.shift();
    },

    addXP: function (n) {
      var p = P(), before = levelInfo(p.xp).level;
      p.xp += Math.max(0, Math.round(n));
      var after = levelInfo(p.xp).level;
      RF.store.save();
      if (after > before) RF.bus.emit('levelup', { level: after, rank: rankFor(after), rankChanged: rankFor(after) !== rankFor(before) });
      return after > before;
    },

    /**
     * Record one swipe answer.
     * @param {object} a - { card, ok, flagsHit, combo }
     * @returns {number} xp gained
     */
    recordAnswer: function (a) {
      var p = P(), st = S(), c = a.card;
      p.total++; if (a.ok) p.correct++;
      if (a.ok && c.scam) p.scamCorrect++;
      if (a.ok && !c.scam) p.legitCorrect++;
      p.flagsFound += a.flagsHit || 0;
      p.answers.push({ d: c.diff, ok: !!a.ok, c: c.cat });
      if (p.answers.length > WINDOW) p.answers.splice(0, p.answers.length - WINDOW);
      if ((a.combo || 0) > p.bestCombo) p.bestCombo = a.combo;
      var cs = st[c.cat] = st[c.cat] || { seen: 0, ok: 0 };
      cs.seen++; if (a.ok) cs.ok++;
      Progress.noteSeen(c.tid);
      var iq = Progress.iq(); if (iq && iq > p.bestIQ) p.bestIQ = iq;
      // unlock the Field Guide entry for this category
      if (RF.guide) RF.guide.unlock(c.cat);
      var xp = a.ok ? 10 + 5 * c.diff + 4 * (a.flagsHit || 0) : 2;
      Progress.addXP(xp);
      return xp;
    },

    /** Per-category accuracy list, sorted weakest first. */
    categoryStats: function () {
      var st = S(), cats = RF.taxonomy.CATEGORIES;
      return Object.keys(cats).map(function (k) {
        var s = st[k] || { seen: 0, ok: 0 };
        return { id: k, name: cats[k].name, icon: cats[k].icon, seen: s.seen, ok: s.ok, acc: s.seen ? s.ok / s.seen : null };
      });
    },
    /** Weakest category with enough data, or null. */
    weakest: function () {
      var list = Progress.categoryStats().filter(function (c) { return c.seen >= 3; });
      if (!list.length) return null;
      list.sort(function (a, b) { return a.acc - b.acc; });
      return list[0].acc < 0.9 ? list[0] : null;
    },
    counter: function (name, inc) {
      var c = RF.store.data.counters;
      if (inc) { c[name] = (c[name] || 0) + inc; RF.store.save(); }
      return c[name] || 0;
    }
  };

  RF.progress = Progress;
})(window.RedFlag);
