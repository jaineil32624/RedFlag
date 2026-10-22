/*
 * ui/home.js
 * Home screen: player card (rank, level, Scam IQ), challenge banner,
 * the big Inbox Rush button and the grid of other modes.
 */
(function (RF) {
  'use strict';

  var U = RF.util, h = U.h;

  RF.pendingChallenge = null; // set by main.js when a #challenge link is opened

  RF.screens.home = {
    tab: 'home',
    render: function () {
      var info = RF.progress.levelInfo(), rank = RF.progress.rank(info.level), iq = RF.progress.iq();
      var daily = RF.daily.status();
      var story = RF.store.data.story, done = RF.story.CHAPTERS.filter(function (c) { return story[c.id] && story[c.id].done; }).length;
      var weak = RF.progress.weakest();
      var next = RF.progress.nextRank();

      var player = h('div.player-card', null, [
        h('div.rank-badge', { text: rank.icon, 'aria-hidden': 'true' }),
        h('div.player-info', null, [
          h('small', { text: 'LEVEL ' + info.level }),
          h('strong', { text: rank.name }),
          h('div.xpbar', { role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': info.need, 'aria-valuenow': info.into, 'aria-label': 'XP to next level' }, [
            h('div.xpbar-fill', { style: { transform: 'scaleX(' + info.pct + ')' } })]),
          h('small.muted', { text: U.fmt(info.into) + ' / ' + U.fmt(info.need) + ' XP' + (next ? ' · ' + next.name + ' at Lv ' + next.min : '') })
        ]),
        h('button.iq-pill', { type: 'button', 'aria-label': 'Scam IQ ' + (iq || 'not yet measured') + '. Open profile', onclick: function () { RF.ui.go('profile', null, { reset: true }); } }, [
          h('small', { text: 'SCAM IQ' }), h('strong', { text: iq != null ? String(iq) : '—' })])
      ]);

      var ch = RF.pendingChallenge;
      var banner = ch ? h('div.challenge-banner', null, [
        h('div.cb-emoji', { text: '🎯', 'aria-hidden': 'true' }),
        h('div', null, [h('strong', { text: 'You’ve been challenged!' }),
          h('small', { text: ch.score != null ? 'Beat ' + U.fmt(ch.score) + ' points on the same 10 cards.' : 'Play the same 10 cards as your friend.' })]),
        h('button.btn.btn-primary', { type: 'button', onclick: function () { RF.pendingChallenge = null; RF.game.challenge(ch.seed, ch.score, true); } }, ['Play'])
      ]) : null;

      function tile(icon, title, sub, onclick, extra) {
        return h('button.mode-tile' + (extra ? '.' + extra : ''), { type: 'button', onclick: function () { RF.audio.play('tap'); onclick(); } }, [
          h('span.mode-ico', { text: icon, 'aria-hidden': 'true' }), h('strong', { text: title }), h('small', { text: sub })]);
      }

      return h('section.screen.home', null, [
        h('header.home-head', null, [
          h('div.logo', null, [h('span.logo-flag', { text: '🚩', 'aria-hidden': 'true' }), h('div', null, [h('h1', { text: 'RedFlag' }), h('small', { text: 'Spot the scam before it spots you.' })])]),
          h('button.icon-btn', { type: 'button', 'aria-label': 'Settings', onclick: function () { RF.audio.play('tap'); RF.ui.go('settings'); } }, [h('span', { text: '⚙️' })])
        ]),
        player,
        banner,
        h('button.hero-play', { type: 'button', onclick: function () { RF.audio.play('tap'); RF.game.rush(); } }, [
          h('div.hero-cards', { 'aria-hidden': 'true' }, [h('span.hc1', { text: '💬' }), h('span.hc2', { text: '✉️' }), h('span.hc3', { text: '📞' })]),
          h('div', null, [h('strong', { text: '▶ Inbox Rush' }), h('small', { text: 'Swipe ← Scam · Legit → · 3 lives' })])
        ]),
        h('div.mode-grid', null, [
          tile('📅', 'Daily Case', daily.playedToday ? '✓ Solved · 🔥 ' + daily.streak + ' day streak' : (daily.streak ? '🔥 ' + daily.streak + ' day streak - keep it!' : 'Same 10 cards for everyone'), RF.game.daily, daily.playedToday ? 'done' : 'glow'),
          tile('🗂️', 'Case Files', done + '/' + RF.story.CHAPTERS.length + ' cases · boss fights', RF.game.story),
          tile('⚡', 'Lookalike Lightning', '30s · spot the real link', RF.game.lookalike),
          tile('🧘', 'Practice', 'No timer · no lives', RF.game.practice),
          tile('🎯', 'Challenge a Friend', 'Send your 10 cards to a parent!', RF.game.createChallenge),
          tile('🛡️', 'Check a Message', 'Real tool · on-device', function () { RF.ui.go('check', null, { reset: true }); }, 'tool')
        ]),
        weak ? h('button.train-tip', { type: 'button', onclick: function () { RF.game.train(weak.id); } }, [
          h('span', { text: weak.icon }),
          h('span', null, [h('strong', { text: 'Train this: ' + weak.name }), h('small', { text: Math.round(weak.acc * 100) + '% accuracy - your weakest family' })]),
          h('span.chev', { text: '›' })
        ]) : null,
        h('p.foot-note', { text: '🔒 100% on-device. No accounts, no ads, no data collected.' })
      ]);
    }
  };
})(window.RedFlag);
