/*
 * ui/fx.js
 * Game juice: confetti, screen shake, stamps, floating score text, flashes.
 * Everything respects the reduced-motion setting.
 */
(function (RF) {
  'use strict';

  var canvas = null, g = null, parts = [], running = false;
  var COLORS = ['#ff4d6d', '#ffd166', '#06d6a0', '#7c5cff', '#4cc9f0', '#ffffff'];

  function ensureCanvas() {
    if (canvas) return;
    canvas = document.createElement('canvas');
    canvas.className = 'fx-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    document.getElementById('app').appendChild(canvas);
    g = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
  }
  function resize() {
    if (!canvas) return;
    var r = canvas.parentNode.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = r.width * dpr; canvas.height = r.height * dpr;
    canvas.style.width = r.width + 'px'; canvas.style.height = r.height + 'px';
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function loop() {
    var r = canvas.getBoundingClientRect();
    g.clearRect(0, 0, r.width, r.height);
    parts = parts.filter(function (p) { return p.life > 0 && p.y < r.height + 40; });
    parts.forEach(function (p) {
      p.vy += 0.28; p.vx *= 0.992; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life--;
      g.save(); g.translate(p.x, p.y); g.rotate(p.rot);
      g.globalAlpha = Math.min(1, p.life / 40);
      g.fillStyle = p.c;
      if (p.shape) g.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
      else { g.beginPath(); g.arc(0, 0, p.s / 3, 0, 6.283); g.fill(); }
      g.restore();
    });
    if (parts.length) requestAnimationFrame(loop); else { running = false; g.clearRect(0, 0, r.width, r.height); }
  }

  var FX = {
    /** Confetti burst. o: {count, x (0-1), y (0-1)} */
    confetti: function (o) {
      if (RF.settings.reducedMotion()) return;
      o = o || {};
      ensureCanvas();
      var r = canvas.getBoundingClientRect();
      var x = (o.x == null ? 0.5 : o.x) * r.width, y = (o.y == null ? 0.35 : o.y) * r.height;
      for (var i = 0; i < (o.count || 90); i++) {
        var a = Math.random() * Math.PI * 2, sp = 3 + Math.random() * 9;
        parts.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 6, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4,
          s: 7 + Math.random() * 8, c: COLORS[i % COLORS.length], life: 90 + Math.random() * 60, shape: Math.random() > 0.3 });
      }
      if (!running) { running = true; requestAnimationFrame(loop); }
    },
    shake: function (el) {
      el = el || document.getElementById('view');
      if (RF.settings.reducedMotion() || !el) return;
      el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake');
      setTimeout(function () { el.classList.remove('shake'); }, 500);
    },
    /** Big rubber stamp on an element: type 'scam' | 'legit' | 'timeout' */
    stamp: function (el, type, label) {
      var s = document.createElement('div');
      s.className = 'stamp stamp-' + type;
      s.textContent = label || (type === 'scam' ? 'SCAM!' : type === 'legit' ? 'LEGIT' : 'TIME!');
      s.setAttribute('aria-hidden', 'true');
      el.appendChild(s);
      RF.audio.play('stamp'); RF.haptics.buzz('stamp');
      return s;
    },
    /** Floating "+120" text from an element. */
    floatText: function (text, cls, anchor) {
      var host = document.getElementById('app');
      var f = document.createElement('div');
      f.className = 'float-text ' + (cls || '');
      f.textContent = text;
      var r = (anchor || host).getBoundingClientRect(), hr = host.getBoundingClientRect();
      f.style.left = (r.left - hr.left + r.width / 2) + 'px';
      f.style.top = (r.top - hr.top + r.height / 3) + 'px';
      host.appendChild(f);
      setTimeout(function () { f.remove(); }, 1200);
    },
    flash: function (type) {
      if (RF.settings.reducedMotion()) return;
      var f = document.createElement('div');
      f.className = 'flash flash-' + type;
      document.getElementById('app').appendChild(f);
      setTimeout(function () { f.remove(); }, 500);
    }
  };

  RF.fx = FX;
})(window.RedFlag);
