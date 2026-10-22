/*
 * ui/swipe.js
 * Pointer/touch drag with card physics. The card follows the finger,
 * tilts with velocity, and either flies off (past threshold or on a fast
 * flick) or springs back. Short presses are reported as taps so words can
 * be flagged without accidentally swiping.
 *
 * attach(el, { onSwipe(dir: 'left'|'right'), onTap(target), enabled() })
 * Sets CSS var --drag (-1..1) on el so the SCAM/LEGIT hint labels can fade in.
 */
(function (RF) {
  'use strict';

  function attach(el, o) {
    var start = null, x = 0, y = 0, lastX = 0, lastT = 0, vx = 0, dragging = false, pid = null;
    var TAP_SLOP = 9;

    function setPos(dx, dy, animate) {
      var w = el.offsetWidth || 320;
      var rot = Math.max(-18, Math.min(18, dx / w * 22));
      el.style.transition = animate ? 'transform .35s cubic-bezier(.2,.9,.3,1.2)' : 'none';
      el.style.transform = 'translate(' + dx + 'px,' + dy + 'px) rotate(' + rot + 'deg)';
      el.style.setProperty('--drag', Math.max(-1, Math.min(1, dx / (w * 0.4))).toFixed(3));
    }

    function down(e) {
      if (o.enabled && !o.enabled()) return;
      if (e.button != null && e.button !== 0) return;
      if (e.target.closest && e.target.closest('button')) return;
      start = { x: e.clientX, y: e.clientY, t: performance.now(), target: e.target };
      x = 0; y = 0; lastX = e.clientX; lastT = start.t; vx = 0; dragging = false; pid = e.pointerId;
    }
    function move(e) {
      if (!start || e.pointerId !== pid) return;
      var dx = e.clientX - start.x, dy = e.clientY - start.y;
      if (!dragging && Math.hypot(dx, dy) > TAP_SLOP) {
        // horizontal intent => drag the card; vertical => let the content scroll
        if (Math.abs(dx) > Math.abs(dy)) {
          dragging = true;
          try { el.setPointerCapture(pid); } catch (err) { /* ignore */ }
          el.classList.add('dragging');
        } else { start = null; return; }
      }
      if (!dragging) return;
      e.preventDefault();
      var now = performance.now();
      vx = (e.clientX - lastX) / Math.max(1, now - lastT);
      lastX = e.clientX; lastT = now;
      x = dx; y = dy * 0.25;
      setPos(x, y, false);
    }
    function up(e) {
      if (!start || (e.pointerId !== pid && e.type !== 'pointercancel')) return;
      var s = start; start = null;
      el.classList.remove('dragging');
      if (!dragging) {
        if (e.type !== 'pointercancel' && o.onTap) o.onTap(s.target, e);
        return;
      }
      dragging = false;
      var w = el.offsetWidth || 320;
      if (Math.abs(x) > w * 0.33 || (Math.abs(vx) > 0.6 && Math.abs(x) > 30)) {
        fling(x > 0 ? 'right' : 'left');
      } else {
        setPos(0, 0, true);
      }
    }
    /** Animate off-screen then report. Also used by buttons/keyboard. */
    function fling(dir) {
      var w = (el.parentNode && el.parentNode.offsetWidth) || 400;
      var reduced = RF.settings.reducedMotion();
      el.style.transition = reduced ? 'opacity .2s' : 'transform .38s cubic-bezier(.3,.6,.4,1), opacity .38s';
      if (reduced) el.style.opacity = '0';
      else el.style.transform = 'translate(' + (dir === 'right' ? 1 : -1) * (w * 1.3) + 'px,' + (y - 30) + 'px) rotate(' + (dir === 'right' ? 24 : -24) + 'deg)';
      el.style.setProperty('--drag', dir === 'right' ? 1 : -1);
      RF.audio.play('swipe');
      if (o.onSwipe) o.onSwipe(dir);
    }

    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move, { passive: false });
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.style.touchAction = 'pan-y';

    return { fling: fling, reset: function () { setPos(0, 0, true); } };
  }

  RF.swipe = { attach: attach };
})(window.RedFlag);
