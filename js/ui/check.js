/*
 * ui/check.js
 * "Check a Message" - UI for the on-device analyzer (analyzer/analyzer.js).
 * Paste text or a link -> risk score, inline highlights, plain-language
 * explanations, and a "What to do now" checklist. Nothing is sent anywhere.
 */
(function (RF) {
  'use strict';

  var U = RF.util, h = U.h;
  var lastText = '';

  var EXAMPLES = [
    { label: '📦 Parcel text', text: 'ParcelGo: Your parcel PG4471920 is on hold due to an unpaid shipping fee of $1.99. Pay within 24 hours or it will be returned: https://parcelgo-redeliver.xyz/pay' },
    { label: '👩 “Hi Mum”', text: 'Hi Mum, this is my new number, my phone broke 😩 Can you transfer $480 to my friend\'s account? I need to pay a bill today. Please don\'t tell Dad, I\'ll explain later x' },
    { label: '🏦 Bank alert', text: 'NovaBank Security: unusual sign-in detected. Your account will be suspended. Verify your identity now at https://novabank.com.verify-id.xyz/login' },
    { label: '✅ Real 2FA code', text: '482913 is your FriendHub login code. Don\'t share it with anyone - FriendHub will never ask for it.' },
    { label: '🔗 Just a link', text: 'http://n0vabank.com@203.0.113.7/secure' }
  ];

  function gauge(score, level) {
    var r = 52, c = 2 * Math.PI * r, off = c * (1 - score / 100);
    return h('div.gauge.' + level, { role: 'img', 'aria-label': 'Risk score ' + score + ' out of 100' }, [
      h('div', { html: '<svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="' + r + '" class="g-bg"/>' +
        '<circle cx="60" cy="60" r="' + r + '" class="g-fg" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '"/></svg>' }),
      h('div.gauge-num', null, [h('strong', { text: String(score) }), h('small', { text: 'risk' })])
    ]);
  }

  RF.screens.check = {
    tab: 'check',
    render: function () {
      var ta = h('textarea.check-input', { rows: 6, placeholder: 'Paste a suspicious text, email, DM or link here…', 'aria-label': 'Message to check' });
      ta.value = lastText;
      var out = h('div.check-out', { 'aria-live': 'polite' });

      function run() {
        var text = ta.value.trim();
        lastText = ta.value;
        if (!text) { RF.ui.toast('Paste a message first', '✋'); ta.focus(); return; }
        RF.audio.play('whoosh');
        var res = RF.analyzer.analyze(text);
        RF.progress.counter('analyzerUses', 1);
        RF.badges.check();
        renderResult(res);
      }

      function renderResult(res) {
        out.innerHTML = '';
        var FL = RF.taxonomy.FLAGS;
        var head = h('div.risk-head', null, [
          gauge(res.score, res.level),
          h('div', null, [h('small', { text: 'RISK ASSESSMENT' }), h('strong.risk-label.' + res.level, { text: res.label }),
            h('p.muted', { text: res.findings.length ? res.findings.length + ' warning sign' + (res.findings.length > 1 ? 's' : '') + ' found' : 'No common scam patterns detected - that does NOT guarantee it’s safe.' })])
        ]);
        out.appendChild(head);
        out.appendChild(h('div.check-hl', { html: RF.analyzer.highlight(res) }));

        if (res.findings.length) {
          out.appendChild(h('h3', { text: '🚩 What we found' }));
          out.appendChild(h('ul.flag-list', null, res.findings.map(function (f) {
            var d = FL[f.type] || { icon: '⚠️' };
            return h('li.flag-item.red', null, [h('span.flag-ico', { text: d.icon, 'aria-hidden': 'true' }),
              h('div', null, [h('strong', { text: f.title }), f.hits.length && !f.link ? h('q', { text: f.hits.slice(0, 3).join(' · ') }) : null, h('p', { text: f.explain })])]);
          })));
        }
        if (res.links.length || res.emails.length) {
          out.appendChild(h('h3', { text: '🔗 Links & addresses' }));
          out.appendChild(h('ul.link-list', null, res.links.concat(res.emails).map(function (l) {
            return h('li', null, [h('code', { text: l.host }), h('span', { text: l.official ? '✅ matches a known official domain' : 'Owner: ' + (l.registrable || l.host) + (l.issues && l.issues.length ? ' · ⚠️ ' + l.issues.length + ' issue' + (l.issues.length > 1 ? 's' : '') : '') })]);
          })));
        }
        if (res.positives.length) {
          out.appendChild(h('h3', { text: '🟢 Reassuring signs' }));
          out.appendChild(h('ul.plain', null, res.positives.map(function (p) { return h('li', { text: p }); })));
        }
        out.appendChild(h('div.todo', null, [
          h('h3', { text: '✅ What to do now' }),
          h('ol', null, res.advice.map(function (a) { return h('li', { text: a }); }))
        ]));
        out.appendChild(h('p.disclaimer', { text: '⚠️ This check is heuristic and runs only on your device - it is NOT a guarantee. Scammers change tactics, and real messages can look scary. When in doubt, contact the organisation through its official app, website or phone number that you find yourself.' }));
        out.appendChild(h('button.btn.block', { type: 'button', onclick: function () {
          RF.speech.say(res.label + '. Risk ' + res.score + ' out of 100. ' + res.findings.map(function (f) { return f.title + '. ' + f.explain; }).join(' ') + ' What to do now: ' + res.advice.join(' '), { toggle: true });
          RF.progress.counter('a11y', 1);
        } }, ['🔊 Read the results aloud']));
        setTimeout(function () { head.scrollIntoView({ behavior: RF.settings.reducedMotion() ? 'auto' : 'smooth', block: 'start' }); }, 50);
      }

      return h('section.screen.pad.check', null, [
        RF.ui.header('Check a Message', { noBack: true }),
        h('p.lead', { text: 'Got a suspicious text, email or link? Paste it below. Everything is analysed on your device - nothing is uploaded.' }),
        ta,
        h('div.check-actions', null, [
          h('button.btn.btn-primary.btn-lg', { type: 'button', onclick: run }, ['🔍 Check it']),
          h('button.btn', { type: 'button', onclick: function () { ta.value = ''; lastText = ''; out.innerHTML = ''; ta.focus(); } }, ['Clear'])
        ]),
        h('div.examples', null, [h('small', { text: 'Try an example:' })].concat(EXAMPLES.map(function (ex) {
          return h('button.chip', { type: 'button', onclick: function () { RF.audio.play('tap'); ta.value = ex.text; run(); } }, [ex.label]);
        }))),
        out
      ]);
    }
  };
})(window.RedFlag);
