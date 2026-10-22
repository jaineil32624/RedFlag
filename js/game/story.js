/*
 * game/story.js
 * Story Mode: Case Files. Chapter list -> intro -> themed card round ->
 * interactive BOSS (branching chat or phone call) -> stars + unlocks.
 */
(function (RF) {
  'use strict';

  var U = RF.util, h = U.h;
  function S() { return RF.store.data.story; }
  function chapters() { return RF.story.CHAPTERS; }
  function isUnlocked(i) { return i === 0 || !!(S()[chapters()[i - 1].id] || {}).done; }

  /* ---------- Chapter list ---------- */
  RF.screens.story = {
    tab: 'home',
    render: function () {
      var totalStars = 0;
      var list = h('div.case-list');
      chapters().forEach(function (ch, i) {
        var s = S()[ch.id] || {}, open = isUnlocked(i);
        totalStars += s.stars || 0;
        var stars = h('div.stars', { 'aria-label': (s.stars || 0) + ' of 3 stars' }, [1, 2, 3].map(function (n) {
          return h('span' + (n <= (s.stars || 0) ? '.on' : ''), { text: '★' });
        }));
        list.appendChild(h('button.case-card' + (open ? '' : '.locked') + (s.done ? '.done' : ''), {
          type: 'button', disabled: !open, 'aria-label': 'Case ' + ch.num + ': ' + ch.title + (open ? '' : ' (locked)'),
          onclick: function () { RF.audio.play('tap'); RF.ui.go('chapter', { idx: i }); }
        }, [
          h('div.case-num', { text: open ? ch.icon : '🔒' }),
          h('div.case-info', null, [h('small', { text: 'CASE FILE ' + ch.num }), h('strong', { text: ch.title }),
            open ? stars : h('small.muted', { text: 'Finish Case ' + (ch.num - 1) + ' to unlock' })]),
          h('span.chev', { text: '›' })
        ]));
      });
      return h('section.screen.pad', null, [
        RF.ui.header('Case Files'),
        h('p.lead', { text: 'Six scam families. Each case ends with a boss: a live scam you have to talk your way out of.' }),
        h('div.star-total', { text: '★ ' + totalStars + ' / ' + chapters().length * 3 + ' stars' }),
        list
      ]);
    }
  };

  /* ---------- Chapter intro ---------- */
  RF.screens.chapter = {
    tab: 'home',
    render: function (p) {
      var ch = chapters()[p.idx], s = S()[ch.id] || {};
      return h('section.screen.pad.chapter', null, [
        RF.ui.header('Case File ' + ch.num),
        h('div.chapter-hero', null, [h('div.chapter-icon', { text: ch.icon, 'aria-hidden': 'true' }), h('h2', { text: ch.title })]),
        h('p.lead', { text: ch.intro }),
        h('ol.chapter-steps', null, [
          h('li', null, [h('strong', { text: '6 evidence cards' }), h('span', { text: ' - swipe and flag, no lives lost.' })]),
          h('li', null, [h('strong', { text: 'Boss: ' + ch.boss.name }), h('span', { text: ch.boss.type === 'call' ? ' - a live call with a rising pressure meter.' : ' - a branching chat. Choose your replies.' })])
        ]),
        h('div.star-rules', null, [h('span', { text: '★ finish' }), h('span', { text: '★ 80%+ cards' }), h('span', { text: '★ beat the boss safely' })]),
        s.stars ? h('p.muted.center', { text: 'Best: ' + '★'.repeat(s.stars) + '☆'.repeat(3 - s.stars) }) : null,
        h('button.btn.btn-primary.btn-lg.block', { type: 'button', onclick: function () { start(p.idx); } }, [s.done ? '🔁 Replay case' : '▶ Open the case']),
        h('button.btn.block.mt', { type: 'button', onclick: function () { start(p.idx, true); } }, ['⏩ Skip to the boss'])
      ]);
    }
  };

  function start(idx, skipCards) {
    RF.audio.play('tap');
    var ch = chapters()[idx];
    if (skipCards) return RF.ui.go('boss', { idx: idx, cardAcc: 0, skipped: true });
    var deck = RF.generator.deck({ rng: RF.rng.create(), n: 6, level: Math.max(4, RF.progress.level()), cats: ch.cats, scamRatio: 0.65, recent: RF.progress.data.recent });
    RF.ui.go('run', { mode: 'story', title: 'Case ' + ch.num + ' · ' + ch.title, deck: deck, total: 6, lives: 0, timer: 14,
      onDone: function (r) { RF.ui.go('boss', { idx: idx, cardAcc: r.total ? r.correct / r.total : 0 }, { replace: true }); },
      onQuit: function () { RF.ui.back(); } });
  }

  /* ---------- Boss simulation ---------- */
  var bossTimers = [];
  function later(fn, ms) { var t = setTimeout(fn, ms); bossTimers.push(t); return t; }

  RF.screens.boss = {
    fullscreen: true,
    render: function (p) {
      var ch = chapters()[p.idx], boss = ch.boss, call = boss.type === 'call';
      var st = { loss: 0, bad: 0, good: 0, node: null, seconds: 0, done: false };
      var fast = RF.settings.reducedMotion();

      var feed = h('div.boss-feed', { 'aria-live': 'polite' });
      var choicesEl = h('div.boss-choices');
      var meterFill = h('div.meter-fill');
      var meterVal = h('span', { text: '0%' });
      var clock = h('span.call-clock', { text: '00:00' });
      var lossEl = h('div.loss-chip', { text: '💸 $0 lost' });

      var head = call ? h('div.call-head', null, [
        h('div.caller', null, [h('div.caller-avatar', { text: boss.avatar, 'aria-hidden': 'true' }), h('div', null, [h('strong', { text: boss.name }), h('small', null, [boss.subtitle + ' · ', clock])])]),
        h('div.pressure', { 'aria-label': 'Pressure meter' }, [h('div.pressure-label', null, [h('span', { text: '😰 Pressure' }), meterVal]), h('div.meter', null, [meterFill])])
      ]) : h('div.chat-head', null, [
        h('div.avatar', { style: { '--h': RF.rng.hash(boss.name) % 360 }, text: boss.avatar, 'aria-hidden': 'true' }),
        h('div', null, [h('strong', { text: boss.name }), h('small', { text: boss.subtitle })])
      ]);

      var root = h('section.screen.boss' + (call ? '.is-call' : '.is-chat'), null, [
        h('div.boss-top', null, [
          h('button.icon-btn', { type: 'button', 'aria-label': 'Leave case', onclick: function () {
            RF.ui.confirm('Leave this case?', 'You can replay it any time.', 'Leave', function () { RF.ui.go('story', null, { reset: true }); }, true);
          } }, [h('span', { text: '✕' })]),
          h('div.boss-title', null, [h('small', { text: 'BOSS · CASE ' + ch.num }), h('strong', { text: ch.title })]),
          lossEl
        ]),
        head, feed, choicesEl
      ]);

      if (call) {
        RF.audio.play('ring');
        var clockT = setInterval(function () {
          if (st.done) return clearInterval(clockT);
          st.seconds++; var m = Math.floor(st.seconds / 60), s = st.seconds % 60;
          clock.textContent = (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
        }, 1000);
        bossTimers.push(clockT);
      }

      function scroll() { feed.scrollTop = feed.scrollHeight; }
      function bubble(from, text, cls) {
        var b = h('div.bb.' + from + (cls ? '.' + cls : ''), null, [h('span', { text: text })]);
        feed.appendChild(b); scroll();
        return b;
      }
      function setPressure(v) {
        meterFill.style.transform = 'scaleX(' + v / 100 + ')';
        meterFill.style.background = v > 80 ? 'var(--red)' : v > 50 ? 'var(--amber)' : 'var(--green)';
        meterVal.textContent = v + '%';
        if (v > 80) RF.haptics.buzz([30, 40, 30]);
      }

      function showNode(id) {
        var node = boss.nodes[id];
        st.node = node;
        choicesEl.innerHTML = '';
        if (node.end) return finish(node);
        if (node.day) feed.appendChild(h('div.day-sep', { text: node.day }));
        if (call && node.pressure != null) setPressure(node.pressure);
        var msgs = node.msgs.slice();
        (function nextMsg() {
          if (!msgs.length) return showChoices(node);
          var m = msgs.shift();
          var typing = m.from === 'them' ? bubble('them', '', 'typing') : null;
          if (typing) typing.innerHTML = '<span class="dots"><i></i><i></i><i></i></span>';
          later(function () {
            if (typing) typing.remove();
            bubble(m.from, m.text);
            RF.audio.play(m.from === 'them' ? 'tap' : 'whoosh');
            nextMsg();
          }, fast ? 120 : Math.min(1700, 500 + m.text.length * 11));
        })();
      }

      function showChoices(node) {
        var opts = RF.rng.create().shuffle(node.choices);
        choicesEl.appendChild(h('div.choose-label', { text: call ? 'What do you say?' : 'Your reply:' }));
        opts.forEach(function (c, i) {
          choicesEl.appendChild(h('button.choice', { type: 'button', onclick: function () { pick(c); } }, [h('span.choice-k', { text: String(i + 1) }), h('span', { text: c.text })]));
        });
      }

      function pick(c) {
        if (st.done) return;
        choicesEl.innerHTML = '';
        bubble('me', c.text);
        if (c.loss) {
          st.loss += c.loss;
          lossEl.textContent = '💸 ' + U.money(st.loss) + ' lost';
          lossEl.classList.add('hit');
          RF.fx.floatText('-' + U.money(c.loss), 'bad', lossEl);
        }
        if (c.good === true) { st.good++; RF.audio.play('correct'); }
        else if (c.good === false) { st.bad++; RF.audio.play('wrong'); RF.haptics.buzz('wrong'); if (c.loss) RF.fx.shake(root); }
        later(function () {
          bubble('coach', (c.good === true ? '✅ ' : c.good === false ? '⚠️ ' : '💭 ') + c.note, c.good === true ? 'good' : c.good === false ? 'bad' : 'meh');
          later(function () { showNode(c.next); }, fast ? 200 : 900);
        }, fast ? 100 : 450);
      }

      function finish(end) {
        st.done = true;
        var outcome = end.end === 'safe' ? (st.loss > 0 ? 'partial' : 'safe') : 'lost';
        var stars = 1 + (p.cardAcc >= 0.8 ? 1 : 0) + (outcome === 'safe' ? 1 : 0);
        var rec = S()[ch.id] || {};
        var firstClear = !rec.done;
        S()[ch.id] = { done: true, stars: Math.max(rec.stars || 0, stars), best: outcome === 'safe' ? 'safe' : (rec.best || outcome) };
        RF.store.save();
        if (outcome === 'safe' && st.bad === 0) RF.progress.counter('bossSafe', 1);
        RF.guide.unlock(ch.cat);
        RF.progress.addXP(40 + (outcome === 'safe' ? 60 : outcome === 'partial' ? 25 : 0));
        if (call) setPressure(outcome === 'lost' ? 100 : 0);
        RF.badges.check();
        if (outcome === 'safe') { RF.audio.play('levelup'); RF.fx.confetti({ count: 140 }); } else RF.audio.play('end');

        var next = p.idx + 1 < chapters().length ? p.idx + 1 : null;
        var card = h('div.ending.' + outcome, null, [
          h('div.ending-icon', { text: outcome === 'safe' ? '🛡️' : outcome === 'partial' ? '😮‍💨' : '💸', 'aria-hidden': 'true' }),
          h('h2', { text: end.title }),
          h('div.ending-loss', { text: st.loss ? 'You lost ' + U.money(st.loss) + ' (fictional)' : 'You lost $0 🎉' }),
          h('p', { text: end.text }),
          h('div.stars.big', { 'aria-label': stars + ' of 3 stars' }, [1, 2, 3].map(function (n) { return h('span' + (n <= stars ? '.on' : ''), { text: '★' }); })),
          h('small.muted', { text: 'Cards ' + Math.round((p.cardAcc || 0) * 100) + '%' + (p.skipped ? ' (skipped)' : '') + ' · ' + st.good + ' smart move' + (st.good === 1 ? '' : 's') + ' · ' + st.bad + ' risky' }),
          firstClear && next != null ? h('p.unlock-note', { text: '🔓 Case ' + (next + 1) + ' unlocked!' }) : null,
          h('div.ending-actions', null, [
            next != null ? h('button.btn.btn-primary.btn-lg', { type: 'button', onclick: function () { RF.ui.go('chapter', { idx: next }, { replace: true }); } }, ['Next case ➜']) : null,
            h('button.btn', { type: 'button', onclick: function () { RF.ui.go('boss', { idx: p.idx, cardAcc: p.cardAcc, skipped: p.skipped }, { replace: true }); } }, ['🔁 Retry boss']),
            h('button.btn', { type: 'button', onclick: function () { RF.ui.go('story', null, { reset: true }); } }, ['🗂️ Case files'])
          ])
        ]);
        choicesEl.appendChild(card);
        later(function () { card.scrollIntoView({ behavior: fast ? 'auto' : 'smooth', block: 'end' }); }, 50);
      }

      function onKey(e) {
        if (RF.ui.hasOverlay()) return;
        var n = parseInt(e.key, 10);
        if (n >= 1 && n <= 4) { var b = choicesEl.querySelectorAll('.choice')[n - 1]; if (b) b.click(); }
      }
      document.addEventListener('keydown', onKey);
      bossTimers.push({ key: onKey });

      if (call) bubble('sys', '📞 Incoming call…');
      later(function () { showNode(boss.start); }, fast ? 100 : 700);
      return root;
    },
    leave: function () {
      bossTimers.forEach(function (t) {
        if (t && t.key) document.removeEventListener('keydown', t.key);
        else { clearTimeout(t); clearInterval(t); }
      });
      bossTimers = [];
    }
  };

  RF.game.story = function () { RF.ui.go('story'); };
})(window.RedFlag);
