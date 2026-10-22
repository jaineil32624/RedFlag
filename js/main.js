/*
 * main.js
 * Boot sequence: load save -> apply settings -> init UI -> handle challenge
 * links -> onboarding -> register the service worker (http/https only).
 */
(function (RF) {
  'use strict';

  function handleChallengeHash() {
    var ch = RF.challenge.parse(location.hash);
    if (!ch) return false;
    RF.pendingChallenge = ch;
    // Clean the URL so a refresh doesn't keep re-triggering the banner.
    try { history.replaceState(null, '', location.href.split('#')[0]); } catch (e) { /* file:// */ }
    return true;
  }

  function boot() {
    RF.store.load();
    RF.settings.apply();
    RF.ui.init();
    var hasChallenge = handleChallengeHash();
    RF.ui.go('home', null, { reset: true });

    if (!RF.store.data.onboarded) {
      RF.onboarding.show(function () { if (hasChallenge) RF.ui.refresh(); });
    }
    if (hasChallenge && RF.store.data.onboarded) RF.ui.toast('A friend challenged you - tap Play!', '🎯', 3500);
    RF.badges.check();

    window.addEventListener('hashchange', function () {
      if (handleChallengeHash()) RF.ui.go('home', null, { reset: true });
    });

    // PWA: only over http(s) - service workers don't exist on file://
    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
      window.addEventListener('load', function () {
        navigator.serviceWorker.register('sw.js').catch(function (e) { console.warn('SW registration failed', e); });
      });
    }
    document.documentElement.classList.add('ready');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window.RedFlag);
