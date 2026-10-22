/*
 * ui/cardview.js
 * Renders a generated card as a realistic phone-app message.
 *
 * Modes:
 *   play   - every word is a tappable <span class="w"> (Flag Hunt). Flag
 *            spans are NOT visually distinguished, so nothing is given away.
 *   reveal - red flags and green flags are highlighted with notes.
 *
 * Links are never real anchors - just styled text.
 */
(function (RF) {
  'use strict';

  var U = RF.util, h = U.h;

  /** Render segments into a parent element. */
  function renderSegs(parent, segs, mode) {
    (segs || []).forEach(function (seg) {
      var isFlag = seg.f != null, isGreen = seg.g != null;
      var host = parent;
      if (mode === 'reveal' && (isFlag || isGreen)) {
        host = h('mark.hl' + (isFlag ? '.hl-red' : '.hl-green'), { 'data-id': isFlag ? seg.f : seg.g });
        parent.appendChild(host);
      }
      var linky = /^(https?:\/\/|www\.)|^[a-z0-9-]+\.[a-z]{2,}\/\S*$|^qik\.lnk\//i.test(seg.text.trim());
      seg.text.split(/(\s+)/).forEach(function (tok) {
        if (!tok) return;
        if (/^\s+$/.test(tok)) { host.appendChild(document.createTextNode(tok)); return; }
        if (mode === 'play') {
          var w = h('span.w', { text: tok });
          if (isFlag) w.setAttribute('data-f', seg.f);
          if (linky || /^https?:\/\//.test(tok)) w.classList.add('linkish');
          host.appendChild(w);
        } else {
          host.appendChild(linky || /^https?:\/\//.test(tok) ? h('span.linkish', { text: tok }) : document.createTextNode(tok));
        }
      });
    });
    return parent;
  }

  function segText(segs) { return (segs || []).map(function (s) { return s.text; }).join(''); }

  function initials(name) {
    var clean = name.replace(/[^A-Za-z0-9 ]/g, ' ').trim();
    if (/^\(?\d/.test(clean) || !clean) return '#';
    var p = clean.split(/\s+/);
    return (p[0][0] + (p[1] ? p[1][0] : '')).toUpperCase();
  }
  function hue(str) { return RF.rng.hash(str) % 360; }

  /** Deterministic fake QR code SVG (decorative only - not scannable). */
  function qrSvg(seed) {
    var r = RF.rng.create(seed), n = 25, cells = '';
    function finder(x, y) {
      return '<rect x="' + x + '" y="' + y + '" width="7" height="7" fill="currentColor"/>' +
        '<rect x="' + (x + 1) + '" y="' + (y + 1) + '" width="5" height="5" fill="var(--qr-bg)"/>' +
        '<rect x="' + (x + 2) + '" y="' + (y + 2) + '" width="3" height="3" fill="currentColor"/>';
    }
    for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) {
      var inFinder = (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9);
      if (!inFinder && r.chance(0.48)) cells += '<rect x="' + x + '" y="' + y + '" width="1.02" height="1.02"/>';
    }
    return '<svg viewBox="-2 -2 ' + (n + 4) + ' ' + (n + 4) + '" class="qr-svg" aria-hidden="true" fill="currentColor">' +
      '<rect x="-2" y="-2" width="' + (n + 4) + '" height="' + (n + 4) + '" fill="var(--qr-bg)"/>' +
      cells + finder(0, 0) + finder(n - 7, 0) + finder(0, n - 7) + '</svg>';
  }

  /**
   * Build the card element.
   * @param {object} card
   * @param {object} opts - { mode: 'play'|'reveal' }
   */
  function render(card, opts) {
    opts = opts || {};
    var mode = opts.mode || 'play';
    var f = card.fields;
    var el = h('article.msg-card.ch-' + card.ch, { 'aria-label': card.app.app + ' message' });

    // App chrome
    el.appendChild(h('div.mc-app', null, [
      h('span.mc-app-icon', { text: card.app.icon, 'aria-hidden': 'true' }),
      h('span.mc-app-name', { text: card.ch === 'dm' || card.ch === 'crypto' ? 'Chatter' : card.app.app }),
      h('span.mc-time', { text: 'now' })
    ]));

    var bodyWrap = h('div.mc-scroll');
    el.appendChild(bodyWrap);

    if (f.ctx) bodyWrap.appendChild(renderSegs(h('div.mc-ctx', null, [h('span.ctx-ico', { text: '🧭 ', 'aria-hidden': 'true' })]), f.ctx, mode));

    if (card.ch === 'qr') {
      var poster = h('div.qr-poster');
      card.lines.forEach(function (l, i) { poster.appendChild(renderSegs(h(i === 0 ? 'div.qr-title' : 'p.qr-line'), l.segs, mode)); });
      var q = h('div.qr-code', { html: qrSvg(card.uid) });
      poster.appendChild(q);
      bodyWrap.appendChild(poster);
      if (f.qr) bodyWrap.appendChild(h('div.qr-preview', null, [
        h('small', { text: '📷 Camera preview - this code opens:' }),
        renderSegs(h('div.qr-url'), f.qr, mode)
      ]));
      return el;
    }

    // Sender block
    if (f.from) {
      var fromName = segText(f.from);
      var av = card.ch === 'voicemail' ? '📞' : initials(fromName);
      bodyWrap.appendChild(h('div.mc-sender', null, [
        h('div.avatar', { style: { '--h': hue(fromName) }, text: av, 'aria-hidden': 'true' }),
        h('div.mc-sender-text', null, [
          renderSegs(h('div.mc-from'), f.from, mode),
          f.addr ? renderSegs(h('div.mc-addr'), f.addr, mode) : (card.ch === 'voicemail' ? h('div.mc-addr', { text: 'Voicemail · 0:' + (20 + card.lines.length * 9) }) : null)
        ])
      ]));
    }
    if (card.listing) {
      bodyWrap.appendChild(h('div.listing', null, [
        h('span.listing-img', { text: '🖼️', 'aria-hidden': 'true' }),
        h('span', null, [h('strong', { text: card.listing.item }), h('small', { text: card.listing.price + ' · SwapSpot listing' })])
      ]));
    }
    if (f.subject) bodyWrap.appendChild(renderSegs(h('div.mc-subject'), f.subject, mode));

    var body = h('div.mc-body');
    if (card.ch === 'voicemail') {
      var wave = h('div.vm-player', null, [
        h('button.vm-play', { type: 'button', 'aria-label': 'Play voicemail (read aloud)', text: '▶',
          onclick: function (e) { e.stopPropagation(); RF.speech.say(RF.generator.plainText(card).split('\n').slice(1).join(' '), { toggle: true }); } }),
        h('div.vm-wave', { 'aria-hidden': 'true' }, Array.apply(null, Array(28)).map(function (_, i) {
          return h('i', { style: { height: (20 + ((RF.rng.hash(card.uid + i) % 70))) + '%' } });
        }))
      ]);
      body.appendChild(wave);
      body.appendChild(h('div.vm-label', { text: 'Transcript' }));
      card.lines.forEach(function (l) { body.appendChild(renderSegs(h('p.vm-line'), l.segs, mode)); });
    } else if (card.ch === 'email' || card.ch === 'job') {
      card.lines.forEach(function (l) { body.appendChild(renderSegs(h('p.em-line'), l.segs, mode)); });
    } else {
      if (card.ch === 'sms' && mode === 'play') {
        var hh = 7 + RF.rng.hash(card.uid) % 12, mm = RF.rng.hash(card.uid + 'm') % 60;
        body.appendChild(h('div.mc-meta', { text: 'Text Message · Today ' + (hh > 12 ? hh - 12 : hh) + ':' + (mm < 10 ? '0' : '') + mm + (hh >= 12 ? ' PM' : ' AM') }));
      }
      card.lines.forEach(function (l) { body.appendChild(renderSegs(h('div.bubble' + (l.me ? '.me' : '')), l.segs, mode)); });
    }
    bodyWrap.appendChild(body);
    if (mode === 'play') el.appendChild(footer(card.ch));
    return el;
  }

  /** Decorative app footer (compose bar / mail actions / call-back) for realism. */
  function footer(ch) {
    if (ch === 'email' || ch === 'job') {
      return h('div.mc-foot.mail', { 'aria-hidden': 'true' }, [h('span', { text: '↩ Reply' }), h('span', { text: '↪ Forward' }), h('span', { text: '🗑' })]);
    }
    if (ch === 'voicemail') {
      return h('div.mc-foot.mail', { 'aria-hidden': 'true' }, [h('span', { text: '📞 Call back' }), h('span', { text: '💬 Message' }), h('span', { text: '🗑' })]);
    }
    return h('div.mc-foot.compose', { 'aria-hidden': 'true' }, [h('span.cf-plus', { text: '+' }), h('span.cf-input', { text: ch === 'market' ? 'Message seller/buyer…' : 'Message' }), h('span.cf-mic', { text: '🎙' })]);
  }

  /** List of revealed flags (for the feedback sheet). */
  function flagList(card) {
    var list = h('ul.flag-list');
    var items = card.scam ? card.flags : card.greens;
    var defs = card.scam ? RF.taxonomy.FLAGS : RF.taxonomy.GREENS;
    items.forEach(function (fl) {
      var d = defs[fl.type];
      list.appendChild(h('li.flag-item' + (card.scam ? '.red' : '.green'), null, [
        h('span.flag-ico', { text: d.icon, 'aria-hidden': 'true' }),
        h('div', null, [h('strong', { text: d.label }), h('q', { text: fl.text.length > 90 ? fl.text.slice(0, 87) + '…' : fl.text }), h('p', { text: fl.note })])
      ]));
    });
    return list;
  }

  RF.cardview = { render: render, flagList: flagList, qrSvg: qrSvg, renderSegs: renderSegs };
})(window.RedFlag);
