/*
 * ui/settings.js
 * Settings & Family/Accessibility mode: themes, high contrast, large text,
 * reduced motion, timers (incl. no-timer practice), audio, haptics, speech.
 */
(function (RF) {
  'use strict';

  var h = RF.util.h;
  var S = function (k) { return RF.settings.get(k); };
  function set(k, v) { RF.settings.set(k, v); }

  function slider(label, key, enabledKey) {
    var id = 'sl-' + key;
    var input = h('input', { type: 'range', id: id, min: 0, max: 1, step: 0.05 });
    input.value = S(key);
    input.addEventListener('input', function () { set(key, parseFloat(input.value)); });
    input.addEventListener('change', function () { RF.audio.play('tap'); });
    return h('div.set-row.slider-row', null, [h('label.set-label', { for: id }, [h('span', { text: label })]), input]);
  }

  RF.screens.settings = {
    tab: 'profile',
    render: function () {
      return h('section.screen.pad.settings', null, [
        RF.ui.header('Settings'),

        h('h3.section-title', { text: '👪 Family & accessibility' }),
        h('div.set-group', null, [
          h('div.set-row.col', null, [h('span.set-label', null, [h('span', { text: 'Theme' })]),
            RF.ui.segmented('Theme', [['auto', 'Auto'], ['dark', 'Dark'], ['light', 'Light']], S('theme'), function (v) { set('theme', v); })]),
          RF.ui.toggleRow('Large text', 'Bigger, easier-to-read text everywhere', S('largeText'), function (v) { set('largeText', v); if (v) RF.progress.counter('a11y', 1); }),
          RF.ui.toggleRow('High contrast', 'Stronger colours and outlines', S('contrast'), function (v) { set('contrast', v); if (v) RF.progress.counter('a11y', 1); }),
          RF.ui.toggleRow('Reduce motion', 'Fewer animations, no shake or confetti', RF.settings.reducedMotion(), function (v) { set('reducedMotion', v); }),
          h('div.set-row.col', null, [h('span.set-label', null, [h('span', { text: 'Card timer' }), h('small', { text: 'Relaxed = almost twice the time. Off = calm practice everywhere.' })]),
            RF.ui.segmented('Card timer', [['normal', 'Normal'], ['relaxed', 'Relaxed'], ['off', 'Off']], S('timer'), function (v) { set('timer', v); })]),
          h('div.set-row.col', null, [h('span.set-label', null, [h('span', { text: 'Read-aloud speed' }), h('small', { text: RF.speech.supported ? 'Used by the 🔊 buttons' : 'Read-aloud is not supported on this device' })]),
            RF.ui.segmented('Read-aloud speed', [[0.8, 'Slow'], [1, 'Normal'], [1.25, 'Fast']], S('speechRate'), function (v) { set('speechRate', v); RF.speech.say('This is how fast I will read.'); })])
        ]),

        h('h3.section-title', { text: '🔊 Sound & feel' }),
        h('div.set-group', null, [
          RF.ui.toggleRow('Sound effects', null, S('sfx'), function (v) { set('sfx', v); if (v) RF.audio.play('correct'); }),
          slider('Effects volume', 'sfxVol'),
          RF.ui.toggleRow('Background music', 'Gentle generated soundtrack', S('music'), function (v) { set('music', v); }),
          slider('Music volume', 'musicVol'),
          RF.ui.toggleRow('Vibration', RF.haptics.supported ? 'Haptic feedback on answers' : 'Not supported on this device', S('haptics'), function (v) { set('haptics', v); RF.haptics.buzz('correct'); })
        ]),

        h('h3.section-title', { text: 'ℹ️ About' }),
        h('div.set-group', null, [
          h('button.set-link', { type: 'button', onclick: function () { RF.onboarding.show(); } }, ['📖 Replay the tutorial']),
          h('a.set-link', { href: 'privacy-policy.html', target: '_blank', rel: 'noopener' }, ['🔒 Privacy policy (we collect nothing)']),
          h('button.set-link.danger', { type: 'button', onclick: function () {
            RF.ui.confirm('Reset all progress?', 'This deletes your XP, badges, stats, streaks and story progress on this device. It can’t be undone.', 'Reset everything', function () {
              RF.store.reset(); RF.settings.apply(); RF.ui.toast('Progress reset', '🧹'); RF.ui.go('home', null, { reset: true });
            }, true);
          } }, ['🧹 Reset progress'])
        ]),
        h('p.foot-note', { text: 'RedFlag v' + RF.VERSION + ' · All brands, people and numbers in the game are fictional. ' + (RF.store.available ? 'Progress is saved on this device only.' : 'Storage is unavailable - progress will reset when you close the app.') })
      ]);
    }
  };
})(window.RedFlag);
