/*
 * systems/daily.js
 * Daily Case (same 10 cards for everyone today, seeded by the date) and
 * Challenge links (#challenge=SEED&score=N -> recipient gets the exact same
 * 10 cards and sees the score to beat).
 */
(function (RF) {
  'use strict';

  var U = RF.util;
  var DECK_LEVEL = 6;  // fixed difficulty so every player gets identical cards

  function D() { return RF.store.data.daily; }

  var Daily = {
    seed: function (key) { return 'daily-' + (key || U.dateKey()); },
    deck: function (key) {
      return RF.generator.deck({ rng: RF.rng.create(Daily.seed(key)), n: 10, level: DECK_LEVEL, recent: [] });
    },
    status: function () {
      var d = D(), today = U.dateKey();
      var streak = d.streak || 0;
      // streak is broken if last play was before yesterday
      if (d.last && U.dayDiff(d.last, today) > 1) streak = 0;
      return { today: today, playedToday: d.last === today, streak: streak, best: d.best || 0,
        todayScore: d.last === today ? d.lastScore : null, todayCorrect: d.last === today ? d.lastCorrect : null };
    },
    /** Record a finished Daily Case; only the first play each day counts for the streak. */
    record: function (score, correct) {
      var d = D(), today = U.dateKey();
      if (d.last === today) return Daily.status();
      d.streak = (d.last && U.dayDiff(d.last, today) === 1) ? (d.streak || 0) + 1 : 1;
      d.best = Math.max(d.best || 0, d.streak);
      d.last = today; d.lastScore = score; d.lastCorrect = correct;
      d.played = (d.played || 0) + 1;
      if (correct >= 10) RF.progress.counter('dailyPerfect', 1);
      RF.store.save();
      return Daily.status();
    }
  };

  var Challenge = {
    newSeed: function () { return RF.rng.create().alnum(8); },
    /** Daily seeds look like D20261022 so a Daily Case can be re-shared as a challenge. */
    dailySeed: function (key) { return 'D' + String(key || U.dateKey()).replace(/-/g, ''); },
    deck: function (seed) {
      var m = String(seed).match(/^D(\d{4})(\d{2})(\d{2})$/);
      if (m) return Daily.deck(m[1] + '-' + m[2] + '-' + m[3]);
      return RF.generator.deck({ rng: RF.rng.create('challenge-' + seed), n: 10, level: DECK_LEVEL, recent: [] });
    },
    baseUrl: function () {
      return String(location.href).split('#')[0];
    },
    link: function (seed, score) {
      return Challenge.baseUrl() + '#challenge=' + encodeURIComponent(seed) + '&score=' + Math.max(0, Math.round(score || 0));
    },
    /** Parse a location hash. Returns {seed, score} or null. */
    parse: function (hash) {
      var h = String(hash || '').replace(/^#/, '');
      var m = h.match(/(?:^|&)challenge=([A-Za-z0-9]{4,16})(?:&|$)/);
      if (!m) return null;
      var s = h.match(/(?:^|&)score=(\d{1,6})(?:&|$)/);
      return { seed: m[1], score: s ? parseInt(s[1], 10) : null };
    }
  };

  RF.daily = Daily;
  RF.challenge = Challenge;
})(window.RedFlag);
