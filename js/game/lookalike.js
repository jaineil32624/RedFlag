/*
 * game/lookalike.js
 * Lookalike Lightning: a 30-second speed round. Pick the REAL website or
 * sender from 3-4 lookalikes (homoglyphs, extra words, wrong endings,
 * subdomain tricks). Wrong answers cost 3 seconds; difficulty ramps up.
 */
(function (RF) {
  'use strict';

  var U = RF.util, h = U.h;
  var DURATION = 30;
  var active = null;

  function question(rng, streak) {
    var brands = RF.world.allBrands();
    var b = rng.pick(brands);
    var tier = streak < 3 ? rng.int(1, 2) : streak < 7 ? rng.int(2, 3) : 3;
    var nFakes = streak < 4 ? 2 : 3;
    var fakes = RF.domains.fakeSet(b, nFakes, rng, tier);
    var kind = rng.pick(['site', 'site', 'email']);
    var local = rng.pick(['support', 'help', 'account', 'no-reply']);
    function fmt(d) { return kind === 'email' ? local + '@' + d : 'https://' + d + '/' + rng.pick(['login', 'account', 'track', 'help', '']); }
    var opts = [{ text: fmt(b.domain), real: true, why: 'This is the official ' + b.domain + '.' }]
      .concat(fakes.map(function (f) { return { text: fmt(f.d), real: false, why: f.why }; }));
    return { brand: b, kind: kind, opts: rng.shuffle(opts) };
  }

  RF.screens.lookalike = {
    fullscreen: true,
    render: function () {
      var rng = RF.rng.create();
      var st = { score: 0, streak: 0, best: 0, time: DURATION, over: false, q: null, raf: 0, last: performance.now(), lock: false, started: false };

      var timeEl = h('div.ll-time', { text: DURATION + 's' });
      var fill = h('div.timer-fill');
      var scoreEl = h('div.score', { text: '0' });
      var prompt = h('div.ll-prompt');
      var optsEl = h('div.ll-opts');
      var why = h('div.ll-why', { 'aria-live': 'polite' });

      var root = h('section.screen.lookalike', null, [
        h('div.run-top', null, [
          h('button.icon-btn', { type: 'button', 'aria-label': 'Quit', onclick: function () { st.over = true; RF.ui.back(); } }, [h('span', { text: '✕' })]),
          h('div.run-title', null, [h('strong', { text: '⚡ Lookalike Lightning' }), h('div.run-progress', { text: 'Pick the REAL one' })]),
          timeEl, scoreEl
        ]),
        h('div.timer', null, [fill]),
        prompt, optsEl, why,
        h('div.ll-tip', { 'aria-hidden': 'true' }, [
          h('small', { text: 'HOW TO READ A LINK' }),
          h('div.ll-url', null, [h('span.u-dim', { text: 'https://' }), h('span.u-sub', { text: 'login.' }), h('span.u-own', { text: 'novabank.com' }), h('span.u-dim', { text: '/help' })]),
          h('div.ll-legend', null, [h('span.u-sub', { text: 'subdomain' }), h('span.u-own', { text: 'the real owner' }), h('span.u-dim', { text: 'path (ignore)' })])
        ]),
        h('div.kbd-hint', { text: 'Keys 1-4 · read domains from the right!' })
      ]);

      function render() {
        st.q = question(rng, st.streak);
        st.lock = false;
        var b = st.q.brand;
        prompt.innerHTML = '';
        prompt.appendChild(h('span.ll-brand', { text: b.name }));
        prompt.appendChild(h('span', { text: st.q.kind === 'email' ? 'Which email address is REALLY from ' + b.name + '?' : 'Which link is the REAL ' + b.name + ' website?' }));
        optsEl.innerHTML = '';
        st.q.opts.forEach(function (o, i) {
          var btn = h('button.ll-opt', { type: 'button', onclick: function () { answer(o, btn); } }, [h('span.choice-k', { text: String(i + 1) }), h('code', { text: o.text })]);
          optsEl.appendChild(btn);
        });
        optsEl.classList.remove('pop'); void optsEl.offsetWidth; optsEl.classList.add('pop');
      }

      function answer(o, btn) {
        if (st.lock || st.over) return;
        st.lock = true;
        var buttons = U.$$('.ll-opt', optsEl);
        if (o.real) {
          st.streak++; st.best = Math.max(st.best, st.streak);
          st.score++;
          btn.classList.add('right');
          RF.audio.play(st.streak % 5 === 0 ? 'combo' : 'correct'); RF.haptics.buzz('correct');
          RF.fx.floatText('+1', 'good', btn);
          why.textContent = '✅ ' + (st.streak >= 3 ? '🔥 ' + st.streak + ' in a row!' : 'Correct!');
          why.className = 'll-why good';
          setTimeout(render, 380);
        } else {
          st.streak = 0;
          st.time -= 3;
          btn.classList.add('wrong');
          buttons.forEach(function (b, i) { if (st.q.opts[i].real) b.classList.add('right'); });
          RF.audio.play('wrong'); RF.haptics.buzz('wrong'); RF.fx.shake(optsEl);
          why.textContent = '❌ −3s · ' + o.why;
          why.className = 'll-why bad';
          setTimeout(render, 1500);
        }
        scoreEl.textContent = st.score;
      }

      function loop(now) {
        st.raf = requestAnimationFrame(loop);
        var dt = (now - st.last) / 1000; st.last = now;
        if (st.over || document.hidden || RF.ui.hasOverlay()) return;
        st.time -= Math.min(dt, 0.1);
        fill.style.transform = 'scaleX(' + Math.max(0, st.time / DURATION) + ')';
        timeEl.textContent = Math.max(0, Math.ceil(st.time)) + 's';
        timeEl.classList.toggle('low', st.time < 6);
        if (st.time <= 0) end();
      }

      function end() {
        if (st.over) return;
        st.over = true;
        cancelAnimationFrame(st.raf);
        var prevBest = RF.progress.counter('lookBest');
        if (st.score > prevBest) RF.store.data.counters.lookBest = st.score;
        RF.progress.addXP(st.score * 6);
        RF.guide.unlock('account');
        RF.badges.check();
        RF.audio.play('end');
        if (st.score > prevBest && st.score > 0) RF.fx.confetti({ count: 100 });
        RF.ui.modal({
          title: '⚡ Time!', dismissable: false,
          body: h('div.center', null, [
            h('div.big-score', null, [h('span', { text: String(st.score) }), h('small', { text: 'real ones spotted' })]),
            h('p', { text: 'Best streak: ' + st.best + ' · Personal best: ' + Math.max(prevBest, st.score) + (st.score > prevBest ? ' 🎉 NEW!' : '') }),
            h('p.muted', { text: 'Tip: the real owner of a link is the part right before the first “/”. Read it from the right.' })
          ]),
          actions: [
            { label: '🏠 Home', onClick: function () { RF.ui.go('home', null, { reset: true }); } },
            { label: '🔁 Again', primary: true, onClick: function () { RF.ui.go('lookalike', null, { replace: true }); } }
          ]
        });
      }

      function onKey(e) {
        if (RF.ui.hasOverlay()) return;
        var n = parseInt(e.key, 10);
        if (n >= 1 && n <= 4) { var b = U.$$('.ll-opt', optsEl)[n - 1]; if (b) b.click(); }
        if (e.key === 'Escape') { st.over = true; RF.ui.back(); }
      }
      document.addEventListener('keydown', onKey);
      active = function () { st.over = true; cancelAnimationFrame(st.raf); document.removeEventListener('keydown', onKey); };

      render();
      st.raf = requestAnimationFrame(loop);
      return root;
    },
    leave: function () { if (active) { active(); active = null; } }
  };

  RF.game.lookalike = function () { RF.ui.go('lookalike'); };
})(window.RedFlag);
