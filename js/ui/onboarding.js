/*
 * ui/onboarding.js
 * 3-screen intro: swipe to judge, tap to Flag Hunt, learn & level up.
 * Skippable; replayable from Settings.
 */
(function (RF) {
  'use strict';

  var h = RF.util.h;

  var SLIDES = [
    { art: 'swipe', title: 'Swipe to judge', text: 'Messages land in your phone one by one. Swipe LEFT if it’s a scam 🚩, RIGHT if it’s legit ✅. Or use the buttons / arrow keys.' },
    { art: 'hunt', title: 'Flag Hunt for bonus', text: 'Before you swipe, tap the suspicious words - fake links, urgent threats, gift-card demands. Every real red flag you find = bonus points.' },
    { art: 'learn', title: 'Learn. Level up. Protect people.', text: 'After each card you’ll see exactly what gave it away. Build your Scam IQ, then challenge your friends and family to beat it.' }
  ];

  function art(kind) {
    if (kind === 'swipe') return h('div.ob-art.swipe', { 'aria-hidden': 'true' }, [
      h('span.ob-l', { text: '🚩 SCAM' }), h('div.ob-card', null, [h('b', { text: '💬 +1 (555) 0142' }), h('span', { text: 'Your parcel is on hold. Pay $1.99 now…' })]), h('span.ob-r', { text: 'LEGIT ✅' })]);
    if (kind === 'hunt') return h('div.ob-art.hunt', { 'aria-hidden': 'true' }, [
      h('div.ob-card', null, [h('span', null, ['Your account is ', h('mark', { text: 'SUSPENDED' }), '. Verify at ', h('mark', { text: 'n0vabank.co' })]), h('i.ob-finger', { text: '👆' })])]);
    return h('div.ob-art.learn', { 'aria-hidden': 'true' }, [h('span', { text: '🧠' }), h('span', { text: '📈' }), h('span', { text: '🏅' })]);
  }

  function show(onDone) {
    var i = 0;
    var wrap = h('div.onboarding', { role: 'dialog', 'aria-modal': 'true', 'aria-label': 'How to play' });
    var body = h('div.ob-body');
    var dots = h('div.ob-dots');
    var nextBtn = h('button.btn.btn-primary.btn-lg', { type: 'button' });
    var skip = h('button.ob-skip', { type: 'button', text: 'Skip' });
    wrap.appendChild(skip); wrap.appendChild(body); wrap.appendChild(dots); wrap.appendChild(nextBtn);

    function draw() {
      var s = SLIDES[i];
      body.innerHTML = '';
      body.appendChild(art(s.art));
      body.appendChild(h('h2', { text: s.title }));
      body.appendChild(h('p', { text: s.text }));
      dots.innerHTML = '';
      SLIDES.forEach(function (_, k) { dots.appendChild(h('span' + (k === i ? '.on' : ''))); });
      nextBtn.textContent = i < SLIDES.length - 1 ? 'Next ➜' : 'Let’s play! 🚩';
      body.classList.remove('in'); void body.offsetWidth; body.classList.add('in');
      try { nextBtn.focus(); } catch (e) { /* ignore */ }
    }
    function close() {
      RF.store.data.onboarded = true; RF.store.save();
      wrap.classList.remove('show');
      document.removeEventListener('keydown', onKey);
      setTimeout(function () { wrap.remove(); if (onDone) onDone(); }, 300);
    }
    function onKey(e) {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') { e.preventDefault(); nextBtn.click(); }
      if (e.key === 'ArrowLeft' && i > 0) { i--; draw(); }
    }
    nextBtn.addEventListener('click', function () { RF.audio.play('tap'); if (i < SLIDES.length - 1) { i++; draw(); } else close(); });
    skip.addEventListener('click', close);
    document.addEventListener('keydown', onKey);
    document.getElementById('app').appendChild(wrap);
    draw();
    requestAnimationFrame(function () { wrap.classList.add('show'); });
  }

  RF.onboarding = { show: show };
})(window.RedFlag);
