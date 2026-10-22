/*
 * systems/share.js
 * Viral loop: renders a shareable "Scam IQ" card to a <canvas>, exports a
 * PNG, and shares it via the Web Share API (with files) when available -
 * otherwise downloads it. Also shares/copies challenge links.
 */
(function (RF) {
  'use strict';

  function roundRect(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  }

  /**
   * Draw the share card.
   * @param {object} o - { iq, rank:{name,icon}, correct, total, best, title, toBeat }
   * @returns {HTMLCanvasElement}
   */
  function renderCard(o) {
    var W = 1080, H = 1350;
    var c = document.createElement('canvas'); c.width = W; c.height = H;
    var g = c.getContext('2d');
    var FONT = '"Segoe UI", system-ui, -apple-system, Roboto, "Helvetica Neue", Arial, sans-serif';
    var EMOJI = '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif';

    // Background
    var bg = g.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#1b1036'); bg.addColorStop(0.55, '#3a1248'); bg.addColorStop(1, '#7a1530');
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    // glow blobs
    [[200, 260, 420, 'rgba(255,77,109,0.35)'], [900, 1100, 480, 'rgba(124,92,255,0.35)'], [880, 220, 260, 'rgba(255,196,0,0.18)']].forEach(function (b) {
      var rg = g.createRadialGradient(b[0], b[1], 0, b[0], b[1], b[2]);
      rg.addColorStop(0, b[3]); rg.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = rg; g.fillRect(0, 0, W, H);
    });
    // subtle dot grid
    g.fillStyle = 'rgba(255,255,255,0.05)';
    for (var y = 30; y < H; y += 44) for (var x = 30; x < W; x += 44) { g.beginPath(); g.arc(x, y, 2, 0, 6.283); g.fill(); }

    // Brand
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = '#fff'; g.font = '88px ' + EMOJI; g.fillText('🚩', W / 2 - 205, 150);
    g.font = '900 96px ' + FONT; g.fillStyle = '#fff'; g.fillText('RedFlag', W / 2 + 40, 152);
    g.font = '600 34px ' + FONT; g.fillStyle = 'rgba(255,255,255,0.7)';
    g.fillText('The Scam Detective Game', W / 2, 232);

    // Panel
    roundRect(g, 90, 300, W - 180, 700, 56);
    g.fillStyle = 'rgba(255,255,255,0.09)'; g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = 3; g.stroke();

    g.font = '800 44px ' + FONT; g.fillStyle = '#ffd1dc';
    g.fillText((o.title || 'MY SCAM IQ').toUpperCase(), W / 2, 385);
    var iqText = o.iq != null ? String(o.iq) : '—';
    var ig = g.createLinearGradient(0, 430, 0, 690);
    ig.addColorStop(0, '#ffffff'); ig.addColorStop(1, '#ffb3c3');
    g.fillStyle = ig; g.font = '900 260px ' + FONT;
    g.fillText(iqText, W / 2, 570);
    g.fillStyle = '#fff'; g.font = '86px ' + EMOJI; g.fillText('🧠🚩', W / 2, 735);

    if (o.rank) {
      g.font = '700 46px ' + FONT;
      var label = o.rank.name;
      var tw = g.measureText(label).width + 130;
      roundRect(g, W / 2 - tw / 2, 800, tw, 86, 43);
      g.fillStyle = '#ff4d6d'; g.fill();
      g.fillStyle = '#fff'; g.font = '44px ' + EMOJI; g.fillText(o.rank.icon || '🔍', W / 2 - tw / 2 + 55, 845);
      g.font = '700 46px ' + FONT; g.fillText(label, W / 2 + 30, 845);
    }
    if (o.total) {
      g.font = '600 40px ' + FONT; g.fillStyle = 'rgba(255,255,255,0.85)';
      g.fillText(o.correct + '/' + o.total + ' spotted' + (o.best ? '  ·  best streak x' + o.best : ''), W / 2, 950);
    }

    g.font = '900 72px ' + FONT; g.fillStyle = '#fff';
    g.fillText(o.toBeat != null ? 'Beat ' + o.toBeat + ' points!' : 'Can you beat me?', W / 2, 1100);
    g.font = '600 36px ' + FONT; g.fillStyle = 'rgba(255,255,255,0.75)';
    g.fillText('Spot the scam before it spots you.', W / 2, 1180);
    g.font = '600 30px ' + FONT; g.fillStyle = 'rgba(255,255,255,0.55)';
    g.fillText('Free · No ads · Nothing leaves your phone', W / 2, 1250);
    return c;
  }

  function toBlob(canvas) {
    return new Promise(function (res) {
      if (canvas.toBlob) canvas.toBlob(function (b) { res(b); }, 'image/png');
      else res(null);
    });
  }

  function download(blob, name) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a'); a.href = url; a.download = name || 'redflag-scam-iq.png';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  /** Share the image (Web Share with files) or download it. Resolves 'shared' | 'downloaded' | 'failed'. */
  function shareImage(canvas, text, url) {
    return toBlob(canvas).then(function (blob) {
      if (!blob) return 'failed';
      var file = null;
      try { file = new File([blob], 'redflag-scam-iq.png', { type: 'image/png' }); } catch (e) { file = null; }
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
        return navigator.share({ files: [file], title: 'My Scam IQ', text: text + (url ? ' ' + url : '') })
          .then(function () { return 'shared'; })
          .catch(function (e) { return e && e.name === 'AbortError' ? 'cancelled' : (download(blob), 'downloaded'); });
      }
      download(blob);
      return 'downloaded';
    }).then(function (r) { if (r === 'shared' || r === 'downloaded') RF.progress.counter('shares', 1); RF.badges.check(); return r; });
  }

  /** Copy text to clipboard with fallbacks. Resolves true/false. */
  function copy(text) {
    if (navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return legacyCopy(text); });
    }
    return Promise.resolve(legacyCopy(text));
  }
  function legacyCopy(text) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      var ok = document.execCommand('copy'); ta.remove(); return !!ok;
    } catch (e) { return false; }
  }

  /** Share a link via Web Share, else copy. Resolves 'shared' | 'copied' | 'failed'. */
  function shareLink(url, text) {
    if (navigator.share) {
      return navigator.share({ title: 'RedFlag challenge', text: text, url: url })
        .then(function () { return 'shared'; })
        .catch(function (e) {
          if (e && e.name === 'AbortError') return 'cancelled';
          return copy(text + ' ' + url).then(function (ok) { return ok ? 'copied' : 'failed'; });
        });
    }
    return copy(text + ' ' + url).then(function (ok) { return ok ? 'copied' : 'failed'; });
  }

  RF.share = { renderCard: renderCard, shareImage: shareImage, shareLink: shareLink, copy: copy };
})(window.RedFlag);
