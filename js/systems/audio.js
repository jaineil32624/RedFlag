/*
 * systems/audio.js
 * 100% procedural sound: Web Audio SFX + a gentle generative music loop.
 * No audio files. The AudioContext is only created after the first user
 * gesture (browser autoplay rules) and music pauses when the tab is hidden.
 */
(function (RF) {
  'use strict';

  var ctx = null, master = null, sfxBus = null, musicBus = null, noiseBuf = null;
  var unlocked = false;
  var music = { playing: false, timer: null, step: 0, nextTime: 0 };

  function ensure() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
      sfxBus = ctx.createGain(); sfxBus.connect(master);
      musicBus = ctx.createGain(); musicBus.connect(master);
      // 1s of white noise for whooshes and stamps
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      var d = noiseBuf.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      applyVolumes();
    } catch (e) { ctx = null; }
    return ctx;
  }

  function applyVolumes() {
    if (!ctx) return;
    sfxBus.gain.value = RF.settings.get('sfx') ? RF.settings.get('sfxVol') : 0;
    musicBus.gain.value = RF.settings.get('musicVol') * 0.5;
  }

  /** Simple enveloped oscillator note. */
  function tone(freq, start, dur, type, vol, bus, glideTo) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, start);
    if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, start + dur);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(vol || 0.2, start + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.connect(g); g.connect(bus || sfxBus);
    o.start(start); o.stop(start + dur + 0.05);
  }
  function noise(start, dur, freq, q, vol, sweepTo) {
    var s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf;
    f.type = 'bandpass'; f.frequency.setValueAtTime(freq, start); f.Q.value = q || 1;
    if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, start + dur);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(vol || 0.3, start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    s.connect(f); f.connect(g); g.connect(sfxBus);
    s.start(start); s.stop(start + dur + 0.05);
  }

  /* ---------- Sound effects library ---------- */
  var SFX = {
    tap: function (t) { tone(660, t, 0.06, 'triangle', 0.12); },
    flag: function (t) { tone(880, t, 0.08, 'square', 0.06); tone(1320, t + 0.05, 0.1, 'triangle', 0.08); },
    unflag: function (t) { tone(520, t, 0.07, 'triangle', 0.07); },
    swipe: function (t) { noise(t, 0.28, 600, 0.8, 0.25, 3000); },
    stamp: function (t) { noise(t, 0.12, 180, 0.7, 0.6); tone(90, t, 0.15, 'sine', 0.35, null, 50); },
    correct: function (t) { tone(660, t, 0.12, 'triangle', 0.18); tone(990, t + 0.09, 0.22, 'triangle', 0.18); },
    wrong: function (t) { tone(220, t, 0.22, 'sawtooth', 0.08, null, 150); tone(160, t + 0.12, 0.3, 'sawtooth', 0.08, null, 90); },
    combo: function (t) { [523, 659, 784, 1046].forEach(function (f, i) { tone(f, t + i * 0.06, 0.16, 'triangle', 0.14); }); },
    tick: function (t) { tone(1200, t, 0.03, 'square', 0.04); },
    timeout: function (t) { tone(400, t, 0.4, 'sine', 0.15, null, 120); },
    levelup: function (t) { [392, 523, 659, 784, 1046].forEach(function (f, i) { tone(f, t + i * 0.09, 0.3, 'triangle', 0.16); }); },
    badge: function (t) { [784, 988, 1175, 1568].forEach(function (f, i) { tone(f, t + i * 0.07, 0.35, 'sine', 0.14); }); noise(t + 0.25, 0.4, 6000, 2, 0.06); },
    whoosh: function (t) { noise(t, 0.35, 300, 0.6, 0.18, 2500); },
    ring: function (t) { for (var i = 0; i < 2; i++) { tone(440, t + i * 0.25, 0.18, 'sine', 0.1); tone(480, t + i * 0.25, 0.18, 'sine', 0.1); } },
    end: function (t) { [523, 494, 440, 523].forEach(function (f, i) { tone(f, t + i * 0.12, 0.25, 'triangle', 0.14); }); }
  };

  function play(name) {
    if (!unlocked || !RF.settings.get('sfx')) return;
    if (!ensure() || !SFX[name]) return;
    try { SFX[name](ctx.currentTime + 0.005); } catch (e) { /* ignore */ }
  }

  /* ---------- Generative background music ----------
   * A mellow lo-fi-ish loop: 4-chord progression, soft pad, plucky arpeggio
   * and a light hat, scheduled ahead with a lookahead timer. */
  var CHORDS = [[57, 60, 64, 67], [53, 57, 60, 64], [48, 52, 55, 59], [55, 59, 62, 65]]; // Am7 Fmaj7 Cmaj7 G7
  var BPM = 84, STEP = 60 / BPM / 2; // eighth notes
  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  function scheduleStep(step, t) {
    var bar = Math.floor(step / 8) % CHORDS.length, chord = CHORDS[bar], s = step % 8;
    if (s === 0) chord.forEach(function (n) { tone(mtof(n), t, STEP * 8, 'sine', 0.035, musicBus); });
    if (s === 0 || s === 4) tone(mtof(chord[0] - 12), t, STEP * 3.5, 'triangle', 0.06, musicBus);
    var arp = [0, 2, 1, 3, 2, 1, 3, 2];
    if ((step * 7) % 3 !== 0 || s % 2 === 0) tone(mtof(chord[arp[s]] + 12), t, STEP * 0.9, 'triangle', 0.03, musicBus);
    if (s % 2 === 1) {
      var src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      src.buffer = noiseBuf; f.type = 'highpass'; f.frequency.value = 7000;
      g.gain.setValueAtTime(0.02, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
      src.connect(f); f.connect(g); g.connect(musicBus); src.start(t); src.stop(t + 0.06);
    }
  }
  function scheduler() {
    while (music.nextTime < ctx.currentTime + 0.25) {
      scheduleStep(music.step, music.nextTime);
      music.step++; music.nextTime += STEP;
    }
  }
  function startMusic() {
    if (music.playing || !unlocked || !RF.settings.get('music') || document.hidden) return;
    if (!ensure()) return;
    music.playing = true;
    music.nextTime = ctx.currentTime + 0.1;
    music.timer = setInterval(scheduler, 90);
  }
  function stopMusic() {
    music.playing = false;
    if (music.timer) clearInterval(music.timer);
    music.timer = null;
  }

  /** Call on first user gesture. */
  function unlock() {
    if (unlocked) return;
    unlocked = true;
    if (ensure() && ctx.state === 'suspended') { try { ctx.resume(); } catch (e) { /* ignore */ } }
    startMusic();
  }

  ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) {
    window.addEventListener(ev, unlock, { once: false, passive: true });
  });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { stopMusic(); if (ctx && ctx.state === 'running') ctx.suspend(); }
    else if (unlocked) { if (ctx) ctx.resume(); startMusic(); }
  });
  RF.bus.on('settings', function (e) {
    applyVolumes();
    if (e.key === 'music') { if (e.value) startMusic(); else stopMusic(); }
  });

  RF.audio = { play: play, unlock: unlock, startMusic: startMusic, stopMusic: stopMusic,
    get unlocked() { return unlocked; }, get musicPlaying() { return music.playing; } };
})(window.RedFlag);
