/*
 * game/run.js
 * The swipe "run" engine shared by every card mode (Inbox Rush, Daily Case,
 * Challenge, Practice, Training and Story rounds) + the results screen.
 *
 * Run config:
 * {
 *   mode: 'rush'|'daily'|'challenge'|'practice'|'train'|'story',
 *   title, deck: [cards] (fixed) OR gen: function(i) -> card (endless),
 *   total: number|Infinity, lives: number (0 = unlimited), timer: base seconds (0 = none),
 *   seed, toBeat, incoming (challenge received), onDone(result) (optional)
 * }
 */
(function (RF) {
  'use strict';

  var U = RF.util, h = U.h;
  RF.game = RF.game || {};

  var active = null; // current run controller (for cleanup)

  function wordsIn(card) { return RF.generator.plainText(card).split(/\s+/).length; }

  /* ================================================================== */
  /*  Run screen                                                         */
  /* ================================================================== */
  RF.screens.run = {
    fullscreen: true,
    render: function (cfg) {
      var st = {
        i: 0, card: null, score: 0, combo: 0, best: 0, lives: cfg.lives || 0, correct: 0, answered: 0,
        answers: [], flags: 0, xp: 0, timeLeft: 0, timeMax: 0, resolving: false, over: false, shownAt: 0,
        lastTick: 0, raf: 0, swipe: null, shell: null
      };
      var factor = RF.settings.timerFactor();
      var timed = cfg.timer > 0 && factor > 0;
      if (new Date().getHours() < 5) RF.progress.counter('nightOwl', 1);

      /* ---------- DOM ---------- */
      var livesEl = h('div.lives', { 'aria-label': 'Lives' });
      var scoreEl = h('div.score', { 'aria-live': 'polite', text: '0' });
      var progEl = h('div.run-progress');
      var timerFill = h('div.timer-fill');
      var timerBar = h('div.timer' + (timed ? '' : '.off'), { 'aria-hidden': 'true' }, [timerFill]);
      var comboEl = h('div.combo-chip', { 'aria-live': 'polite' });
      var stage = h('div.stage');
      var hint = h('div.run-hint', { html: '🔍 <b>Flag Hunt:</b> tap suspicious words for bonus points' });

      var btnScam = h('button.big-choice.scam', { type: 'button', 'aria-label': 'Scam (left arrow)', onclick: function () { choose('left'); } }, [h('span', { text: '🚩' }), h('b', { text: 'Scam' })]);
      var btnLegit = h('button.big-choice.legit', { type: 'button', 'aria-label': 'Legit (right arrow)', onclick: function () { choose('right'); } }, [h('span', { text: '✅' }), h('b', { text: 'Legit' })]);
      var btnRead = h('button.round-btn', { type: 'button', 'aria-label': 'Read message aloud', title: 'Read aloud', onclick: function () {
        if (st.card) { RF.progress.counter('a11y', 1); RF.speech.say(RF.generator.plainText(st.card, { withCtx: true }), { toggle: true }); }
      } }, [h('span', { text: '🔊' })]);
      if (!RF.speech.supported) btnRead.disabled = true;

      var root = h('section.screen.run', null, [
        h('div.run-top', null, [
          h('button.icon-btn', { type: 'button', 'aria-label': 'Quit run', onclick: quit }, [h('span', { text: '✕' })]),
          h('div.run-title', null, [h('strong', { text: cfg.title || 'Inbox Rush' }), progEl]),
          cfg.lives ? livesEl : h('div.lives.inf', { text: cfg.mode === 'practice' ? '🧘' : '∞' }),
          scoreEl
        ]),
        timerBar,
        cfg.toBeat != null ? h('div.to-beat', { text: '🎯 Score to beat: ' + U.fmt(cfg.toBeat) }) : null,
        comboEl,
        stage,
        hint,
        h('div.controls', null, [btnScam, btnRead, btnLegit]),
        h('div.kbd-hint', { text: '← Scam   ·   → Legit   ·   tap words to flag' })
      ]);

      function renderHud() {
        if (cfg.lives) {
          livesEl.innerHTML = '';
          for (var i = 0; i < cfg.lives; i++) livesEl.appendChild(h('span' + (i < st.lives ? '' : '.lost'), { text: '❤️' }));
          livesEl.setAttribute('aria-label', st.lives + ' lives left');
        }
        scoreEl.textContent = U.fmt(st.score);
        progEl.textContent = cfg.total === Infinity ? 'Card ' + (st.i + 1) : (Math.min(st.i + 1, cfg.total)) + ' / ' + cfg.total;
        var mult = multiplier();
        comboEl.textContent = st.combo >= 2 ? '🔥 ' + st.combo + ' streak · x' + mult : '';
        comboEl.classList.toggle('show', st.combo >= 2);
        comboEl.classList.toggle('hot', mult >= 3);
      }
      function multiplier() { return 1 + Math.min(4, Math.floor(st.combo / 3)); }

      /* ---------- Card flow ---------- */
      function getCard(i) {
        if (cfg.deck) return cfg.deck[i];
        return cfg.gen(i);
      }

      function nextCard() {
        if (st.over) return;
        if ((cfg.lives && st.lives <= 0) || st.i >= cfg.total || (cfg.deck && st.i >= cfg.deck.length)) return finish();
        st.card = getCard(st.i);
        st.resolving = false;
        stage.innerHTML = '';
        stage.appendChild(h('div.ghost.g2')); stage.appendChild(h('div.ghost.g1'));
        var shell = h('div.swipe-card.enter', null, [
          h('div.swipe-label.l', { text: 'SCAM 🚩', 'aria-hidden': 'true' }),
          h('div.swipe-label.r', { text: 'LEGIT ✅', 'aria-hidden': 'true' }),
          RF.cardview.render(st.card, { mode: 'play' })
        ]);
        stage.appendChild(shell);
        st.shell = shell;
        requestAnimationFrame(function () { requestAnimationFrame(function () { shell.classList.remove('enter'); }); });
        st.swipe = RF.swipe.attach(shell, {
          enabled: function () { return !st.resolving && !RF.ui.hasOverlay(); },
          onTap: onTap,
          onSwipe: function (dir) { resolve(dir); }
        });
        hint.classList.toggle('dim', st.i > 2);
        if (timed) {
          var base = cfg.timer + Math.min(7, wordsIn(st.card) / 9);
          st.timeMax = st.timeLeft = base * factor;
        }
        st.shownAt = performance.now();
        st.lastTick = 0;
        renderHud();
      }

      function onTap(target) {
        var w = target.closest && target.closest('.w');
        if (!w || st.resolving) return;
        var on = w.classList.toggle('marked');
        RF.audio.play(on ? 'flag' : 'unflag');
        RF.haptics.buzz('tap');
      }

      function choose(dir) {
        if (!st.card || st.resolving || st.over || RF.ui.hasOverlay()) return;
        st.swipe.fling(dir); // fling -> onSwipe -> resolve
      }

      /* ---------- Timer ---------- */
      var last = performance.now();
      function loop(now) {
        st.raf = requestAnimationFrame(loop);
        var dt = (now - last) / 1000; last = now;
        if (!timed || st.resolving || st.over || !st.card || document.hidden || RF.ui.hasOverlay()) return;
        st.timeLeft -= Math.min(dt, 0.1);
        var pct = Math.max(0, st.timeLeft / st.timeMax);
        timerFill.style.transform = 'scaleX(' + pct + ')';
        timerBar.classList.toggle('low', st.timeLeft < 3.5);
        var sec = Math.ceil(st.timeLeft);
        if (st.timeLeft < 3.5 && sec !== st.lastTick && sec > 0) { st.lastTick = sec; RF.audio.play('tick'); }
        if (st.timeLeft <= 0) resolve('timeout');
      }
      st.raf = requestAnimationFrame(loop);

      /* ---------- Resolve an answer ---------- */
      function resolve(dir) {
        if (st.resolving || st.over) return;
        st.resolving = true;
        var card = st.card;
        var guessScam = dir === 'left';
        var ok = dir !== 'timeout' && guessScam === card.scam;
        var marked = U.$$('.w.marked', st.shell);
        var hitIds = {}, falseTaps = 0;
        marked.forEach(function (w) { var f = w.getAttribute('data-f'); if (f) hitIds[f] = 1; else falseTaps++; });
        var flagsHit = card.scam && ok ? Object.keys(hitIds).length : 0;
        var elapsed = performance.now() - st.shownAt;

        var pts = 0;
        if (ok) {
          st.combo++;
          if (st.combo > st.best) st.best = st.combo;
          var base = 100 + 50 * (card.diff - 1);
          var tb = timed ? Math.round(60 * Math.max(0, st.timeLeft) / st.timeMax) : 0;
          pts = Math.max(0, Math.round((base + tb) * multiplier() + 40 * flagsHit - 10 * falseTaps));
          st.correct++;
          if (timed && elapsed < 2000) RF.progress.counter('speedy', 1);
        } else {
          st.combo = 0;
          if (cfg.lives) st.lives--;
        }
        st.score += pts;
        st.flags += flagsHit;
        st.answered++;
        st.answers.push({ d: card.diff, ok: ok, c: card.cat, tid: card.tid, card: card });
        st.xp += RF.progress.recordAnswer({ card: card, ok: ok, flagsHit: flagsHit, combo: st.combo });

        // ---- juice ----
        if (dir === 'timeout') { RF.audio.play('timeout'); st.swipe.fling(card.scam ? 'left' : 'right'); }
        var stamp = RF.fx.stamp(stage, card.scam ? 'scam' : 'legit');
        setTimeout(function () { stamp.remove(); }, 1100);
        if (ok) {
          RF.audio.play('correct'); RF.haptics.buzz('correct'); RF.fx.flash('good');
          RF.fx.floatText('+' + U.fmt(pts), 'good', scoreEl);
          if (st.combo > 0 && st.combo % 5 === 0) { RF.audio.play('combo'); RF.fx.confetti({ count: 70, y: 0.3 }); }
        } else {
          RF.audio.play('wrong'); RF.haptics.buzz('wrong'); RF.fx.flash('bad'); RF.fx.shake(root);
        }
        renderHud();
        setTimeout(function () { showFeedback(card, ok, dir, pts, flagsHit, falseTaps); }, RF.settings.reducedMotion() ? 200 : 650);
      }

      /* ---------- Feedback sheet ---------- */
      function showFeedback(card, ok, dir, pts, flagsHit, falseTaps) {
        if (st.over) return;
        var truth = card.scam ? 'a SCAM' : 'LEGIT';
        var head = ok ? (card.scam ? 'Nailed it - it’s a scam! 🚩' : 'Correct - it’s legit! ✅')
          : dir === 'timeout' ? 'Time’s up! This was ' + truth + '.' : 'Oops - this was ' + truth + '.';
        var detail = [];
        if (ok) detail.push('+' + U.fmt(pts) + ' pts');
        if (st.combo >= 3) detail.push('x' + multiplier() + ' combo');
        if (flagsHit) detail.push('🔍 ' + flagsHit + ' flag' + (flagsHit > 1 ? 's' : '') + ' found');
        if (falseTaps && ok) detail.push(falseTaps + ' false tap' + (falseTaps > 1 ? 's' : ''));
        if (!ok && cfg.lives) detail.push(st.lives > 0 ? '❤️ ' + st.lives + ' left' : '💔 no lives left');

        var lessonText = card.lesson;
        var body = h('div.fb', null, [
          h('div.fb-verdict' + (ok ? '.good' : '.bad'), null, [
            h('span.fb-icon', { text: ok ? '🎯' : '💥', 'aria-hidden': 'true' }),
            h('div', null, [h('strong', { text: head }), h('small', { text: detail.join(' · ') })])
          ]),
          h('div.fb-card', null, [RF.cardview.render(card, { mode: 'reveal' })]),
          h('h3.fb-sub', { text: card.scam ? 'Red flags 🚩' : 'Why it’s legit ✅' }),
          RF.cardview.flagList(card),
          h('div.lesson', null, [h('span', { text: '💡', 'aria-hidden': 'true' }), h('p', { text: lessonText })])
        ]);
        var m = RF.ui.modal({
          sheet: true, dismissable: false, className: 'feedback', body: body,
          actions: [
            { label: '🔊 Read', onClick: function () {
              RF.progress.counter('a11y', 1);
              RF.speech.say(head + '. ' + (card.scam ? card.flags : card.greens).map(function (f) {
                return (card.scam ? RF.taxonomy.FLAGS : RF.taxonomy.GREENS)[f.type].label + ': ' + f.note;
              }).join(' ') + ' ' + lessonText, { toggle: true });
              return true;
            } },
            { label: (cfg.lives && st.lives <= 0) || st.i + 1 >= cfg.total ? 'See results ➜' : 'Next ➜', primary: true, onClick: function () { next(); } }
          ]
        });
        st.feedback = m;
        RF.badges.check();
      }
      function next() {
        st.feedback = null;
        RF.speech.stop();
        st.i++;
        nextCard();
      }

      /* ---------- Finish ---------- */
      function finish() {
        if (st.over) return;
        st.over = true;
        cancelAnimationFrame(st.raf);
        RF.audio.play('end');
        if (cfg.mode === 'practice') RF.progress.counter('practiceRuns', 1);
        if (cfg.mode === 'challenge' && cfg.incoming) RF.progress.counter('challengesPlayed', 1);
        if (cfg.mode === 'daily') RF.daily.record(st.score, st.correct);
        var p = RF.progress.data;
        if (st.score > (p.bestRun || 0)) { p.bestRun = st.score; RF.store.save(); }
        RF.badges.check();
        var result = {
          mode: cfg.mode, title: cfg.title, score: st.score, correct: st.correct, total: st.answered,
          best: st.best, flags: st.flags, xp: st.xp, answers: st.answers,
          iq: RF.progress.iqOf(st.answers, 3), toBeat: cfg.toBeat, seed: cfg.seed, incoming: cfg.incoming,
          cats: cfg.cats, cfg: cfg
        };
        if (cfg.onDone) cfg.onDone(result);
        else RF.ui.go('results', result, { replace: true });
      }

      function quit() {
        RF.audio.play('tap');
        RF.ui.confirm('Leave this run?', 'Your score for this run won’t be saved (XP you earned is kept).', 'Leave', function () {
          st.over = true; cancelAnimationFrame(st.raf);
          if (cfg.onQuit) cfg.onQuit(); else RF.ui.back();
        }, true);
      }

      /* ---------- Keyboard ---------- */
      function onKey(e) {
        if (e.target && /input|textarea/i.test(e.target.tagName)) return;
        if (st.feedback) {
          if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') { e.preventDefault(); st.feedback.close(); next(); }
          return;
        }
        if (RF.ui.hasOverlay()) return;
        if (e.key === 'ArrowLeft') { e.preventDefault(); choose('left'); }
        else if (e.key === 'ArrowRight') { e.preventDefault(); choose('right'); }
        else if (e.key === 'Escape') quit();
      }
      document.addEventListener('keydown', onKey);

      active = {
        cleanup: function () {
          st.over = true; cancelAnimationFrame(st.raf);
          document.removeEventListener('keydown', onKey);
          if (st.feedback) st.feedback.close();
        },
        state: st
      };

      renderHud();
      // Defer first card until mounted so widths are measurable.
      setTimeout(nextCard, 30);
      return root;
    },
    leave: function () { if (active) { active.cleanup(); active = null; } }
  };

  /* ================================================================== */
  /*  Results screen                                                     */
  /* ================================================================== */
  RF.screens.results = {
    fullscreen: true,
    render: function (r) {
      var lvl = RF.progress.levelInfo(), rank = RF.progress.rank(lvl.level);
      var iq = r.iq != null ? r.iq : RF.progress.iq();
      var acc = r.total ? Math.round(r.correct / r.total * 100) : 0;
      var won = r.toBeat != null ? r.score > r.toBeat : null;
      var titles = { rush: 'Run complete!', daily: 'Daily Case solved!', challenge: 'Challenge complete!', practice: 'Practice done!', train: 'Training done!' };

      if (r.score > 0 && (acc >= 80 || won)) setTimeout(function () { RF.fx.confetti({ count: 120 }); }, 300);

      var tiles = h('div.stat-tiles', null, [
        tile('✅', r.correct + '/' + r.total, 'Spotted'),
        tile('🔥', 'x' + r.best, 'Best streak'),
        tile('🧠', iq != null ? iq : '—', 'Scam IQ'),
        tile('⭐', '+' + r.xp, 'XP')
      ]);

      var mistakes = r.answers.filter(function (a) { return !a.ok; });
      var review = mistakes.length ? h('details.review', null, [
        h('summary', { text: '📝 Review your ' + mistakes.length + ' mistake' + (mistakes.length > 1 ? 's' : '') }),
        h('ul', null, mistakes.slice(0, 8).map(function (a) {
          var cat = RF.taxonomy.CATEGORIES[a.c];
          return h('li', null, [h('strong', { text: cat.icon + ' ' + (a.card.scam ? 'Scam' : 'Legit') + ' · ' + cat.name }), h('p', { text: a.card.lesson })]);
        }))
      ]) : null;

      // weakest category in this run -> training suggestion
      var wrongCats = {};
      mistakes.forEach(function (a) { wrongCats[a.c] = (wrongCats[a.c] || 0) + 1; });
      var weakCat = Object.keys(wrongCats).sort(function (a, b) { return wrongCats[b] - wrongCats[a]; })[0];

      var actions = h('div.result-actions', null, [
        h('button.btn.btn-primary.btn-lg', { type: 'button', onclick: function () { shareResult(r, iq, rank); } }, ['📣 Share my Scam IQ']),
        h('button.btn.btn-lg', { type: 'button', onclick: function () { challengeFrom(r); } }, [r.incoming ? '↩️ Challenge them back' : '🎯 Challenge a friend / parent']),
        h('div.row2', null, [
          h('button.btn', { type: 'button', onclick: function () { RF.audio.play('tap'); replay(r); } }, ['🔁 Play again']),
          h('button.btn', { type: 'button', onclick: function () { RF.audio.play('tap'); RF.ui.go('home', null, { reset: true }); } }, ['🏠 Home'])
        ])
      ]);

      return h('section.screen.results', null, [
        h('div.results-hero', null, [
          h('div.results-emoji', { text: won === true ? '🏆' : won === false ? '🎯' : acc >= 80 ? '🕵️' : acc >= 50 ? '🔍' : '📚', 'aria-hidden': 'true' }),
          h('h1', { text: won === true ? 'You beat the challenge!' : won === false ? 'So close!' : (titles[r.mode] || 'Nice work!') }),
          h('div.big-score', null, [h('span', { text: U.fmt(r.score) }), h('small', { text: 'points' })]),
          r.toBeat != null ? h('p.vs', { text: 'Score to beat: ' + U.fmt(r.toBeat) + (won ? ' - you won by ' + U.fmt(r.score - r.toBeat) + '!' : ' - try again or challenge them back!') }) : null,
          h('p.acc', { text: acc + '% accuracy · ' + rank.icon + ' ' + rank.name + ' · Lv ' + lvl.level })
        ]),
        tiles,
        weakCat ? h('button.train-tip', { type: 'button', onclick: function () { RF.game.train(weakCat); } }, [
          h('span', { text: RF.taxonomy.CATEGORIES[weakCat].icon }),
          h('span', null, [h('strong', { text: 'Train your weak spot' }), h('small', { text: RF.taxonomy.CATEGORIES[weakCat].name + ' tripped you up' })]),
          h('span.chev', { text: '›' })
        ]) : null,
        review,
        actions
      ]);
    }
  };

  function tile(icon, val, label) {
    return h('div.tile', null, [h('span.tile-ico', { text: icon, 'aria-hidden': 'true' }), h('strong', { text: String(val) }), h('small', { text: label })]);
  }

  function replay(r) {
    var m = r.mode;
    if (m === 'rush') RF.game.rush();
    else if (m === 'daily') RF.game.daily();
    else if (m === 'challenge') RF.game.challenge(r.seed, r.toBeat, r.incoming);
    else if (m === 'practice') RF.game.practice();
    else if (m === 'train') RF.game.train(r.cats && r.cats[0]);
    else RF.ui.go('home', null, { reset: true });
  }

  /** Share card preview modal. */
  function shareResult(r, iq, rank) {
    RF.audio.play('tap');
    var canvas = RF.share.renderCard({ iq: iq, rank: rank, correct: r.correct, total: r.total, best: r.best, title: 'My Scam IQ' });
    var img = h('img.share-preview', { alt: 'Your Scam IQ share card', src: canvas.toDataURL('image/png') });
    var text = 'My Scam IQ: ' + (iq != null ? iq : '?') + ' 🧠🚩 Can you beat me? Spot the scam before it spots you.';
    RF.ui.modal({ title: 'Your share card', body: h('div', null, [img, h('p.muted.center', { text: 'Share it - or challenge someone to beat you!' })]),
      actions: [
        { label: 'Close' },
        { label: '📣 Share image', primary: true, onClick: function () {
          RF.share.shareImage(canvas, text, null).then(function (res) {
            if (res === 'downloaded') RF.ui.toast('Image saved - post it anywhere!', '🖼️');
            else if (res === 'shared') RF.ui.toast('Shared! Thanks for spreading the word.', '📣');
          });
          return true;
        } }
      ] });
  }

  /** Make (or re-send) a challenge link from a result. */
  function challengeFrom(r) {
    RF.audio.play('tap');
    if (r.seed) return sendChallenge(r.seed, r.score);
    // Rush/practice are random - create a fresh 10-card challenge to play first.
    RF.ui.modal({ title: '🎯 Challenge a friend', body: h('p.modal-body', { text: 'You’ll play 10 cards first. Then we’ll make a link that gives your friend (or your parents!) the exact same 10 cards - and your score to beat.' }),
      actions: [{ label: 'Not now' }, { label: 'Play 10 cards ➜', primary: true, onClick: function () { RF.game.createChallenge(); } }] });
  }

  function sendChallenge(seed, score) {
    var url = RF.challenge.link(seed, score);
    var text = 'I scored ' + U.fmt(score) + ' on RedFlag - can you spot the scams better than me? 🚩';
    var input = h('input.link-input', { type: 'text', readonly: true, value: url, 'aria-label': 'Challenge link' });
    input.addEventListener('focus', function () { input.select(); });
    RF.ui.modal({ title: '🎯 Send your challenge', body: h('div', null, [
        h('p.modal-body', { text: 'Your friend gets the exact same 10 cards and sees your score (' + U.fmt(score) + ') to beat.' }), input]),
      actions: [
        { label: '📋 Copy link', onClick: function () {
          RF.share.copy(text + ' ' + url).then(function (ok) { RF.ui.toast(ok ? 'Link copied!' : 'Select the link and copy it', ok ? '📋' : '✋'); });
          RF.progress.counter('challengesSent', 1); RF.badges.check(); return true;
        } },
        { label: '📤 Share', primary: true, onClick: function () {
          RF.share.shareLink(url, text).then(function (res) {
            if (res === 'copied') RF.ui.toast('Link copied - paste it in a chat!', '📋');
            else if (res === 'failed') { input.focus(); RF.ui.toast('Copy the link above', '✋'); }
          });
          RF.progress.counter('challengesSent', 1); RF.badges.check(); return true;
        } }
      ] });
  }

  /* ================================================================== */
  /*  Mode launchers                                                     */
  /* ================================================================== */
  function endlessGen(o) {
    var rng = RF.rng.create();
    return function () {
      var lvl = RF.progress.level();
      return RF.generator.deck({ rng: rng.fork(RF.util.now() + ':' + Math.random()), n: 1, level: lvl, cats: o && o.cats,
        recent: RF.progress.data.recent, scamRatio: o && o.scamRatio })[0];
    };
  }

  RF.game.rush = function () {
    var lvl = RF.progress.level();
    RF.ui.go('run', { mode: 'rush', title: 'Inbox Rush', gen: endlessGen(), total: Infinity, lives: 3,
      timer: Math.max(7, 12 - lvl * 0.25) }, { replace: RF.ui.current && RF.ui.current.name === 'results' });
  };
  RF.game.practice = function () {
    RF.ui.go('run', { mode: 'practice', title: 'Practice (no timer)', gen: endlessGen(), total: 12, lives: 0, timer: 0 },
      { replace: RF.ui.current && RF.ui.current.name === 'results' });
  };
  RF.game.train = function (cat) {
    if (!cat) return RF.game.practice();
    var c = RF.taxonomy.CATEGORIES[cat];
    RF.ui.go('run', { mode: 'train', title: 'Train: ' + c.name, gen: endlessGen({ cats: [cat], scamRatio: 0.6 }), total: 10, lives: 0, timer: 14, cats: [cat] },
      { replace: RF.ui.current && RF.ui.current.name === 'results' });
  };
  RF.game.daily = function () {
    var key = RF.util.dateKey();
    RF.ui.go('run', { mode: 'daily', title: 'Daily Case', deck: RF.daily.deck(key), total: 10, lives: 0, timer: 12, seed: RF.challenge.dailySeed(key) },
      { replace: RF.ui.current && RF.ui.current.name === 'results' });
  };
  RF.game.challenge = function (seed, toBeat, incoming) {
    RF.ui.go('run', { mode: 'challenge', title: incoming ? 'Friend’s Challenge' : 'Challenge', deck: RF.challenge.deck(seed), total: 10, lives: 0,
      timer: 12, seed: seed, toBeat: toBeat, incoming: incoming }, { replace: RF.ui.current && RF.ui.current.name === 'results' });
  };
  RF.game.createChallenge = function () {
    var seed = RF.challenge.newSeed();
    RF.ui.go('run', { mode: 'challenge', title: 'Your Challenge', deck: RF.challenge.deck(seed), total: 10, lives: 0, timer: 12, seed: seed,
      onDone: function (r) { RF.ui.go('results', r, { replace: true }); setTimeout(function () { sendChallenge(seed, r.score); }, 700); } },
      { replace: RF.ui.current && RF.ui.current.name === 'results' });
  };
  RF.game.sendChallenge = sendChallenge;
})(window.RedFlag);
