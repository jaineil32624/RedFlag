/*
 * sw.js - RedFlag service worker (offline support for the PWA).
 * Only registered when served over http(s) (see js/main.js).
 * Strategy: pre-cache the app shell; serve cache-first, fall back to the
 * network and cache new same-origin GETs. Bump CACHE when files change.
 */
'use strict';

var CACHE = 'redflag-v1.0.0';
var ASSETS = [
  './', './index.html', './privacy-policy.html', './manifest.webmanifest', './css/styles.css',
  './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png',
  './js/core/namespace.js', './js/core/rng.js', './js/core/storage.js',
  './js/content/brands.js', './js/content/domains.js', './js/content/taxonomy.js',
  './js/content/templates-scam.js', './js/content/templates-legit.js', './js/content/generator.js',
  './js/content/fieldguide.js', './js/content/stories.js',
  './js/systems/settings.js', './js/systems/audio.js', './js/systems/feedback.js', './js/systems/progress.js',
  './js/systems/badges.js', './js/systems/daily.js', './js/systems/share.js',
  './js/analyzer/analyzer.js',
  './js/ui/dom.js', './js/ui/fx.js', './js/ui/cardview.js', './js/ui/swipe.js', './js/ui/onboarding.js',
  './js/ui/home.js', './js/ui/check.js', './js/ui/guide.js', './js/ui/profile.js', './js/ui/settings.js',
  './js/game/run.js', './js/game/story.js', './js/game/lookalike.js',
  './js/main.js'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(function (hit) {
      if (hit) return hit;
      return fetch(req).then(function (res) {
        if (res && res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
        return res;
      }).catch(function () {
        if (req.mode === 'navigate') return caches.match('./index.html');
      });
    })
  );
});
