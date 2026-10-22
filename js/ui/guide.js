/*
 * ui/guide.js
 * Field Guide: searchable encyclopedia of scam types. Entries unlock as
 * you meet each scam family in the game.
 */
(function (RF) {
  'use strict';

  var U = RF.util, h = U.h;

  function entryCard(e) {
    var open = RF.guide.isUnlocked(e);
    if (!open) {
      return h('div.guide-entry.locked', null, [h('span.g-ico', { text: '🔒', 'aria-hidden': 'true' }),
        h('div', null, [h('strong', { text: '???' }), h('small', { text: 'Meet this scam in a game to unlock it.' })])]);
    }
    var cat = e.cat ? RF.taxonomy.CATEGORIES[e.cat] : null;
    var stats = e.cat ? (RF.store.data.stats[e.cat] || { seen: 0, ok: 0 }) : null;
    var d = h('details.guide-entry', null, [
      h('summary', null, [h('span.g-ico', { text: e.icon, 'aria-hidden': 'true' }), h('div', null, [h('strong', { text: e.title }),
        h('small', { text: e.basic ? 'Basics' : (stats.seen ? 'Seen ' + stats.seen + ' · ' + Math.round(stats.ok / stats.seen * 100) + '% correct' : cat.name) })]), h('span.chev', { text: '›' })]),
      h('div.g-body', null, [
        h('h4', { text: 'How it works' }), h('p', { text: e.how }),
        h('h4', { text: '🚩 Red flags' }), h('ul', null, e.flags.map(function (f) { return h('li', { text: f }); })),
        h('h4', { text: '✅ What to do' }), h('ul', null, e.todo.map(function (f) { return h('li', { text: f }); })),
        h('div.g-actions', null, [
          h('button.btn', { type: 'button', onclick: function () { RF.speech.say(e.title + '. ' + e.how + ' Red flags: ' + e.flags.join('. ') + '. What to do: ' + e.todo.join('. '), { toggle: true }); RF.progress.counter('a11y', 1); } }, ['🔊 Read aloud']),
          e.cat ? h('button.btn.btn-primary', { type: 'button', onclick: function () { RF.game.train(e.cat); } }, ['🎯 Practice this']) : null
        ])
      ])
    ]);
    d.addEventListener('toggle', function () { if (d.open) RF.audio.play('tap'); });
    return d;
  }

  RF.screens.guide = {
    tab: 'guide',
    render: function () {
      var q = h('input.search', { type: 'search', placeholder: 'Search scams, e.g. “gift card”, “code”, “QR”…', 'aria-label': 'Search the Field Guide' });
      var list = h('div.guide-list');
      var count = RF.guide.count(), total = RF.guide.ENTRIES.length;

      function draw() {
        var term = q.value.trim().toLowerCase();
        list.innerHTML = '';
        var shown = RF.guide.ENTRIES.filter(function (e) {
          if (!term) return true;
          if (!RF.guide.isUnlocked(e)) return false;
          return (e.title + ' ' + e.how + ' ' + e.flags.join(' ') + ' ' + e.todo.join(' ')).toLowerCase().indexOf(term) >= 0;
        });
        if (!shown.length) list.appendChild(h('p.muted.center', { text: 'No unlocked entries match “' + q.value + '”.' }));
        shown.forEach(function (e) { list.appendChild(entryCard(e)); });
      }
      q.addEventListener('input', draw);
      draw();

      return h('section.screen.pad.guide', null, [
        RF.ui.header('Field Guide', { noBack: true }),
        h('p.lead', { text: 'Your scam encyclopedia. New entries unlock as you meet each scam family.' }),
        h('div.guide-progress', null, [h('div.xpbar', null, [h('div.xpbar-fill', { style: { transform: 'scaleX(' + count / total + ')' } })]),
          h('small', { text: count + ' / ' + total + ' unlocked' })]),
        q, list
      ]);
    }
  };
})(window.RedFlag);
