/*
 * systems/badges.js
 * Achievement badges. Each badge has a pure `test(state)` function; call
 * RF.badges.check() after anything notable and newly earned badges are
 * stored and announced on the bus ('badge') for the unlock animation.
 * Add a badge: append an object to LIST. That's it.
 */
(function (RF) {
  'use strict';

  function C(name) { return RF.progress.counter(name); }

  var LIST = [
    { id: 'first_swipe', icon: '👆', name: 'First Swipe', desc: 'Answer your first card.', test: function (s) { return s.p.total >= 1; } },
    { id: 'first_catch', icon: '🚩', name: 'Gotcha!', desc: 'Catch your first scam.', test: function (s) { return s.p.scamCorrect >= 1; } },
    { id: 'combo10', icon: '🔥', name: 'On Fire', desc: 'Reach a 10x streak.', test: function (s) { return s.p.bestCombo >= 10; } },
    { id: 'combo25', icon: '☄️', name: 'Unstoppable', desc: 'Reach a 25x streak.', test: function (s) { return s.p.bestCombo >= 25; } },
    { id: 'flags10', icon: '🔍', name: 'Flag Hunter', desc: 'Tap 10 red flags before swiping.', test: function (s) { return s.p.flagsFound >= 10; } },
    { id: 'flags100', icon: '🦅', name: 'Eagle Eye', desc: 'Tap 100 red flags before swiping.', test: function (s) { return s.p.flagsFound >= 100; } },
    { id: 'legit25', icon: '✅', name: 'Not Everything’s a Scam', desc: 'Correctly trust 25 legit messages.', test: function (s) { return s.p.legitCorrect >= 25; } },
    { id: 'cards100', icon: '💯', name: 'Century', desc: 'Answer 100 cards.', test: function (s) { return s.p.total >= 100; } },
    { id: 'cards1000', icon: '🏛️', name: 'Archivist', desc: 'Answer 1,000 cards.', test: function (s) { return s.p.total >= 1000; } },
    { id: 'quick', icon: '⚡', name: 'Quick Draw', desc: 'Answer 10 cards correctly in under 2 seconds.', test: function () { return C('speedy') >= 10; } },
    { id: 'level5', icon: '🕵️', name: 'Fraud Spotter', desc: 'Reach level 5.', test: function (s) { return s.level >= 5; } },
    { id: 'level10', icon: '🛡️', name: 'Scam Buster', desc: 'Reach level 10.', test: function (s) { return s.level >= 10; } },
    { id: 'level15', icon: '🛰️', name: 'Cyber Sentinel', desc: 'Reach level 15.', test: function (s) { return s.level >= 15; } },
    { id: 'level25', icon: '👑', name: 'Legend', desc: 'Reach level 25.', test: function (s) { return s.level >= 25; } },
    { id: 'iq130', icon: '🧠', name: 'Big Brain', desc: 'Reach a Scam IQ of 130.', test: function (s) { return s.p.bestIQ >= 130; } },
    { id: 'daily1', icon: '📅', name: 'Daily Detective', desc: 'Solve a Daily Case.', test: function (s) { return (s.daily.played || 0) >= 1; } },
    { id: 'streak3', icon: '🗓️', name: 'Three-peat', desc: 'Daily Case streak of 3 days.', test: function (s) { return (s.daily.best || 0) >= 3; } },
    { id: 'streak7', icon: '📆', name: 'Week Warrior', desc: 'Daily Case streak of 7 days.', test: function (s) { return (s.daily.best || 0) >= 7; } },
    { id: 'daily_perfect', icon: '⭐', name: 'Flawless Case', desc: 'Score 10/10 on a Daily Case.', test: function () { return C('dailyPerfect') >= 1; } },
    { id: 'story1', icon: '📁', name: 'Case Opened', desc: 'Finish your first Case File.', test: function (s) { return s.storyDone >= 1; } },
    { id: 'story_all', icon: '🗂️', name: 'Case Closed', desc: 'Finish every Case File.', test: function (s) { return s.storyDone >= s.storyTotal && s.storyTotal > 0; } },
    { id: 'boss_safe', icon: '🏆', name: 'Untouchable', desc: 'Beat a boss without losing a cent.', test: function () { return C('bossSafe') >= 1; } },
    { id: 'stars_all', icon: '🌟', name: 'Star Detective', desc: 'Earn 3 stars on 3 Case Files.', test: function (s) { return s.threeStars >= 3; } },
    { id: 'look10', icon: '🌩️', name: 'Lightning Eyes', desc: 'Score 10 in Lookalike Lightning.', test: function () { return C('lookBest') >= 10; } },
    { id: 'look20', icon: '🧿', name: 'Domain Wizard', desc: 'Score 20 in Lookalike Lightning.', test: function () { return C('lookBest') >= 20; } },
    { id: 'analyzer1', icon: '🧪', name: 'Second Opinion', desc: 'Check a real message with the analyzer.', test: function () { return C('analyzerUses') >= 1; } },
    { id: 'analyzer10', icon: '🔬', name: 'Lab Regular', desc: 'Check 10 messages with the analyzer.', test: function () { return C('analyzerUses') >= 10; } },
    { id: 'challenger', icon: '📨', name: 'Challenger', desc: 'Send a challenge link.', test: function () { return C('challengesSent') >= 1; } },
    { id: 'accepted', icon: '🤝', name: 'Challenge Accepted', desc: 'Play a friend’s challenge.', test: function () { return C('challengesPlayed') >= 1; } },
    { id: 'share', icon: '📣', name: 'Spread the Word', desc: 'Share your Scam IQ card.', test: function () { return C('shares') >= 1; } },
    { id: 'guide10', icon: '📚', name: 'Bookworm', desc: 'Unlock 10 Field Guide entries.', test: function (s) { return s.guideCount >= 10; } },
    { id: 'all_cats', icon: '🌍', name: 'Seen It All', desc: 'Meet every scam family.', test: function (s) { return s.catsSeen >= s.catsTotal; } },
    { id: 'practice', icon: '🧘', name: 'Zen Mode', desc: 'Finish a no-timer Practice run.', test: function () { return C('practiceRuns') >= 1; } },
    { id: 'night_owl', icon: '🦉', name: 'Night Owl', desc: 'Play between midnight and 5 AM.', test: function () { return C('nightOwl') >= 1; } },
    { id: 'for_all', icon: '♿', name: 'Made For Everyone', desc: 'Try Large Text, High Contrast or Read Aloud.', test: function () { return C('a11y') >= 1; } }
  ];

  function snapshot() {
    var d = RF.store.data, story = d.story || {};
    var chapters = RF.story ? RF.story.CHAPTERS : [];
    var done = 0, three = 0;
    chapters.forEach(function (c) { var s = story[c.id]; if (s && s.done) done++; if (s && s.stars >= 3) three++; });
    var stats = d.stats || {};
    return {
      p: RF.progress.data, level: RF.progress.level(), daily: d.daily || {},
      storyDone: done, storyTotal: chapters.length, threeStars: three,
      guideCount: Object.keys(d.guide || {}).length,
      catsSeen: Object.keys(stats).filter(function (k) { return stats[k].seen > 0; }).length,
      catsTotal: Object.keys(RF.taxonomy.CATEGORIES).length
    };
  }

  var Badges = {
    LIST: LIST,
    has: function (id) { return !!RF.store.data.badges[id]; },
    count: function () { return Object.keys(RF.store.data.badges).length; },
    /** Evaluate all badges; announce new ones. Returns newly earned list. */
    check: function () {
      var s = snapshot(), earned = [];
      LIST.forEach(function (b) {
        if (Badges.has(b.id)) return;
        var ok = false;
        try { ok = b.test(s); } catch (e) { ok = false; }
        if (ok) { RF.store.data.badges[b.id] = Date.now(); earned.push(b); }
      });
      if (earned.length) {
        RF.store.save();
        earned.forEach(function (b) { RF.bus.emit('badge', b); });
      }
      return earned;
    }
  };

  RF.badges = Badges;
})(window.RedFlag);
