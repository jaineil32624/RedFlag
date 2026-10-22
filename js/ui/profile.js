/*
 * ui/profile.js
 * Profile: rank, Scam IQ, lifetime stats, per-category accuracy with a
 * "train this" suggestion, and the badge cabinet.
 */
(function (RF) {
  'use strict';

  var U = RF.util, h = U.h;

  RF.screens.profile = {
    tab: 'profile',
    render: function () {
      var p = RF.progress.data, info = RF.progress.levelInfo(), rank = RF.progress.rank(info.level), iq = RF.progress.iq();
      var daily = RF.daily.status();
      var acc = p.total ? Math.round(p.correct / p.total * 100) : 0;
      var weak = RF.progress.weakest();

      var cats = RF.progress.categoryStats().sort(function (a, b) { return (b.seen ? 1 : 0) - (a.seen ? 1 : 0) || (a.acc || 0) - (b.acc || 0); });
      var catList = h('div.cat-bars', null, cats.map(function (c) {
        var pct = c.acc == null ? 0 : Math.round(c.acc * 100);
        return h('div.cat-bar' + (c.seen ? '' : '.unseen'), null, [
          h('span.cb-label', null, [h('span', { text: c.icon + ' ' + c.name }), h('small', { text: c.seen ? pct + '% · ' + c.seen + ' seen' : 'not met yet' })]),
          h('div.cb-track', null, [h('div.cb-fill', { style: { transform: 'scaleX(' + (pct / 100) + ')', background: pct >= 80 ? 'var(--green)' : pct >= 55 ? 'var(--amber)' : 'var(--red)' } })])
        ]);
      }));

      var badgeGrid = h('div.badge-grid', null, RF.badges.LIST.map(function (b) {
        var has = RF.badges.has(b.id);
        return h('button.badge' + (has ? '.has' : ''), { type: 'button', 'aria-label': b.name + (has ? ' (earned)' : ' (locked)') + ': ' + b.desc,
          onclick: function () { RF.ui.toast(b.name + ' - ' + b.desc, has ? b.icon : '🔒'); } }, [
          h('span.badge-ico', { text: has ? b.icon : '🔒', 'aria-hidden': 'true' }), h('small', { text: b.name })]);
      }));

      function stat(icon, val, label) { return h('div.tile', null, [h('span.tile-ico', { text: icon, 'aria-hidden': 'true' }), h('strong', { text: String(val) }), h('small', { text: label })]); }

      return h('section.screen.pad.profile', null, [
        RF.ui.header('Your Profile', { noBack: true, right: h('button.icon-btn', { type: 'button', 'aria-label': 'Settings', onclick: function () { RF.ui.go('settings'); } }, [h('span', { text: '⚙️' })]) }),
        h('div.profile-hero', null, [
          h('div.rank-badge.lg', { text: rank.icon, 'aria-hidden': 'true' }),
          h('div', null, [h('small', { text: 'LEVEL ' + info.level }), h('h2', { text: rank.name }),
            h('div.xpbar', null, [h('div.xpbar-fill', { style: { transform: 'scaleX(' + info.pct + ')' } })]),
            h('small.muted', { text: U.fmt(p.xp) + ' XP total' })]),
          h('div.iq-big', null, [h('small', { text: 'SCAM IQ' }), h('strong', { text: iq != null ? String(iq) : '—' }), h('small.muted', { text: iq != null ? 'last ' + Math.min(60, p.answers.length) + ' cards' : 'answer 5 cards' })])
        ]),
        h('div.stat-tiles', null, [
          stat('🃏', U.fmt(p.total), 'Cards'), stat('🎯', acc + '%', 'Accuracy'), stat('🔥', 'x' + p.bestCombo, 'Best streak'),
          stat('🔍', U.fmt(p.flagsFound), 'Flags found'), stat('📅', daily.streak, 'Daily streak'), stat('🏆', U.fmt(p.bestRun || 0), 'Best run')
        ]),
        h('button.btn.btn-primary.block', { type: 'button', onclick: function () {
          var c = RF.share.renderCard({ iq: iq, rank: rank, correct: p.correct, total: p.total, best: p.bestCombo });
          RF.share.shareImage(c, 'My Scam IQ: ' + (iq || '?') + ' 🧠🚩 Can you beat me?', null).then(function (r) {
            if (r === 'downloaded') RF.ui.toast('Share card saved!', '🖼️');
          });
        } }, ['📣 Share my Scam IQ card']),
        h('h3.section-title', { text: '📊 Accuracy by scam family' }),
        weak ? h('button.train-tip', { type: 'button', onclick: function () { RF.game.train(weak.id); } }, [
          h('span', { text: weak.icon }), h('span', null, [h('strong', { text: 'Train this: ' + weak.name }), h('small', { text: 'Your weakest family right now' })]), h('span.chev', { text: '›' })]) : null,
        catList,
        h('h3.section-title', { text: '🏅 Badges ' + RF.badges.count() + ' / ' + RF.badges.LIST.length }),
        badgeGrid
      ]);
    }
  };
})(window.RedFlag);
