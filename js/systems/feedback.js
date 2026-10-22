/*
 * systems/feedback.js
 * Haptics (navigator.vibrate, toggleable) and read-aloud (SpeechSynthesis).
 * Both degrade silently on platforms that don't support them.
 */
(function (RF) {
  'use strict';

  var PATTERNS = { tap: 8, correct: [12, 40, 12], wrong: [60, 40, 90], badge: [20, 30, 20, 30, 40], stamp: 25 };

  RF.haptics = {
    supported: typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function',
    buzz: function (name) {
      if (!RF.haptics.supported || !RF.settings.get('haptics')) return;
      // Browsers block vibration until the user has interacted with the page.
      if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
      try { navigator.vibrate(PATTERNS[name] || name); } catch (e) { /* ignore */ }
    }
  };

  var synth = window.speechSynthesis || null;
  RF.speech = {
    supported: !!synth && typeof window.SpeechSynthesisUtterance === 'function',
    speaking: function () { return !!synth && synth.speaking; },
    /** Speak text (emoji stripped). Calling again while speaking stops it. */
    say: function (text, opts) {
      if (!RF.speech.supported) return false;
      try {
        if (synth.speaking && !(opts && opts.queue)) { synth.cancel(); if (opts && opts.toggle) return false; }
        var clean = String(text)
          .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu, '')
          .replace(/https?:\/\//g, '').replace(/\s+/g, ' ').trim();
        var u = new SpeechSynthesisUtterance(clean);
        u.rate = RF.settings.get('speechRate') || 1;
        synth.speak(u);
        return true;
      } catch (e) { return false; }
    },
    stop: function () { try { if (synth) synth.cancel(); } catch (e) { /* ignore */ } }
  };
})(window.RedFlag);
