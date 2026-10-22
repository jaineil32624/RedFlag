/*
 * content/generator.js
 * Procedural card generator.
 *   template + seeded RNG + player level  ->  a concrete "card"
 *
 * A card looks like:
 * {
 *   uid, tid, cat, ch, scam, diff,
 *   brand: {name, domain}, app: {app, icon},
 *   fields: { from: Segs, addr: Segs, subject: Segs, qr: Segs, ctx: Segs },
 *   lines:  [{ me: bool, segs: Segs }],          // message body
 *   flags:  [{ id, type, text, note }],           // red flags (scam cards)
 *   greens: [{ id, type, text, note }],           // green flags (legit cards)
 *   listing: {item, price} | null, lesson
 * }
 * where Segs = [{ text, f?: redFlagId, g?: greenFlagId }]
 */
(function (RF) {
  'use strict';

  var W = RF.world, U = RF.util;
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  var AREAS = ['212', '415', '312', '206', '617', '303', '702', '404', '305', '512'];
  var PATHS = ['/verify', '/pay', '/login', '/secure', '/claim', '/update', '/track', '/account/confirm', '/id-check'];

  function money(n) { return '$' + U.fmt(n); }

  /**
   * Build the per-card variable resolver. Values are cached so the same
   * {{var}} produces the same value everywhere in one card.
   */
  function makeCtx(tpl, rng, opts) {
    var cache = {};
    var brandCache = {};
    var fakeCache = {};
    var tier = U.clamp(tpl.diff + ((opts.level || 1) >= 10 && rng.chance(0.3) ? 1 : 0), 1, 3);

    function brandOf(type) {
      type = type || tpl.brand || 'bank';
      if (!brandCache[type]) {
        var list = W.BRANDS[type] || W.BRANDS.bank;
        brandCache[type] = rng.pick(list);
      }
      return brandCache[type];
    }
    function fakeOf(type) {
      type = type || tpl.brand || 'bank';
      if (!fakeCache[type]) fakeCache[type] = RF.domains.mutate(brandOf(type), tier, rng);
      return fakeCache[type];
    }
    function person() {
      if (!cache.__p1) cache.__p1 = { f: rng.pick(W.FIRST), l: rng.pick(W.LAST) };
      return cache.__p1;
    }
    function itemOf() {
      if (!cache.__item) cache.__item = rng.pick(W.ITEMS);
      return cache.__item;
    }

    var VARS = {
      brand: function (a) { return brandOf(a).name; },
      brandShort: function (a) { var b = brandOf(a); return b.short || b.name; },
      brandUpper: function (a) { return brandOf(a).name.toUpperCase(); },
      domain: function (a) { return brandOf(a).domain; },
      slug: function (a) { return brandOf(a).domain.split('.')[0]; },
      fake: function (a) { return fakeOf(a).d; },
      fakeUrl: function (a) {
        var scheme = tier === 1 && rng.chance(0.4) ? 'http://' : 'https://';
        var p = rng.pick(PATHS);
        if (p === '/track') p += '?id=' + rng.alnum(6);
        return scheme + fakeOf(a).d + p;
      },
      realUrl: function (a) { return 'https://' + brandOf(a).domain + rng.pick(['/account', '/help', '/track', '']); },
      fm: function (a) {
        if (tier === 1 && rng.chance(0.5)) return brandOf(a).domain.split('.')[0] + '.helpdesk@' + rng.pick(W.FREEMAIL);
        return rng.pick(['security', 'support', 'no-reply', 'alerts', 'service', 'billing']) + '@' + fakeOf(a).d;
      },
      rm: function (a) { return 'no-reply@' + brandOf(a).domain; },
      freemail: function () {
        var p = { f: rng.pick(W.FIRST), l: rng.pick(W.LAST) };
        return p.f.toLowerCase() + '.' + p.l.toLowerCase() + rng.digits(2) + '@' + rng.pick(W.FREEMAIL);
      },
      short: function () { return W.SHORTENER + '/' + rng.alnum(5, true); },
      gift: function () { return brandOf('gift').name; },
      coin: function () { return rng.pick(W.COINS); },
      remote: function () { return rng.pick(W.REMOTE_APPS); },
      you: function () { return rng.pick(W.FIRST); },
      p1: function () { var p = person(); return p.f + ' ' + p.l; },
      p1f: function () { return person().f; },
      kid: function () { return rng.pick(W.KIDS); },
      city: function () { return rng.pick(W.CITIES); },
      item: function () { return itemOf().item; },
      price: function () { return money(itemOf().price); },
      price2: function () { return money(itemOf().price + rng.int(25, 60) * 10); },
      amt: function () { return money(rng.int(49, 899)); },
      amt2: function () { return money(rng.int(9, 60) * 50); },
      small: function () { return '$' + rng.int(1, 4) + '.' + rng.pick(['25', '49', '95', '99']); },
      big: function () { return money(rng.int(12, 98) * 100); },
      huge: function () { return money(rng.int(25, 850) * 1000); },
      daily: function () { return money(rng.int(3, 9) * 100); },
      sub: function () { return rng.pick(['$7.99', '$9.99', '$12.99', '$15.49']); },
      code: function () { return rng.digits(6); },
      trk: function () {
        var n = brandOf('courier').name.replace(/[^A-Z]/g, '') || 'PK';
        return (n + 'X').slice(0, 2) + rng.digits(9);
      },
      ref: function () { return rng.alnum(3) + '-' + rng.digits(6); },
      last4: function () { return rng.digits(4); },
      num: function () { return String(rng.int(2, 9)); },
      date: function () { return MONTHS[rng.int(0, 11)] + ' ' + rng.int(1, 28); },
      day: function () { return rng.pick(DAYS); },
      time: function () { return rng.int(1, 12) + ':' + rng.pick(['05', '15', '30', '42', '58']) + ' ' + rng.pick(['AM', 'PM']); },
      hours: function () { return String(rng.pick([12, 24, 48])); },
      year: function () { return String(rng.pick([2024, 2025])); },
      phone: function () { return '(' + rng.pick(AREAS) + ') 555-01' + rng.digits(2); }
    };
    // Short aliases for cross-brand references: {{b:shop}}, {{d:shop}} ...
    VARS.b = VARS.brand; VARS.d = VARS.domain; VARS.f = VARS.fake; VARS.fu = VARS.fakeUrl; VARS.ru = VARS.realUrl;

    return {
      tier: tier,
      brandOf: brandOf,
      fakeOf: fakeOf,
      fakes: function () { return Object.keys(fakeCache).map(function (k) { return fakeCache[k]; }); },
      resolve: function (name, arg) {
        var key = name + ':' + (arg || '');
        if (!(key in cache)) {
          var fn = VARS[name];
          if (!fn) throw new Error('Unknown template variable {{' + name + '}} in ' + tpl.id);
          cache[key] = String(fn(arg));
        }
        return cache[key];
      }
    };
  }

  /** Replace {{var}} / {{var:arg}} placeholders. */
  function fill(str, ctx) {
    return String(str).replace(/\{\{(\w+)(?::(\w+))?\}\}/g, function (_, n, a) { return ctx.resolve(n, a); });
  }

  /**
   * Parse [[type|text]] / [[+type|text]] markup into segments, registering
   * each flag on the card.
   */
  function parse(str, card, ctx, field) {
    var segs = [], re = /\[\[(\+?)(\w+)\|([\s\S]*?)\]\]/g, last = 0, m;
    while ((m = re.exec(str))) {
      if (m.index > last) segs.push({ text: str.slice(last, m.index) });
      var green = m[1] === '+', type = m[2], text = m[3];
      var defs = green ? RF.taxonomy.GREENS : RF.taxonomy.FLAGS;
      if (!defs[type]) throw new Error('Unknown flag type "' + type + '" in ' + card.tid);
      var note = defs[type].note;
      if (!green && type === 'link') {
        ctx.fakes().forEach(function (fk) { if (text.indexOf(fk.d) >= 0) note = fk.why + ' ' + note; });
      }
      var list = green ? card.greens : card.flags;
      var id = (green ? 'g' : 'f') + list.length;
      list.push({ id: id, type: type, text: text, note: note, field: field });
      var seg = { text: text };
      seg[green ? 'g' : 'f'] = id;
      segs.push(seg);
      last = re.lastIndex;
    }
    if (last < str.length) segs.push({ text: str.slice(last) });
    return segs;
  }

  /** Generate a concrete card from one template. */
  function generate(tpl, rng, opts) {
    opts = opts || {};
    var ctx = makeCtx(tpl, rng, opts);
    var card = {
      uid: tpl.id + '-' + rng.alnum(6),
      tid: tpl.id, cat: tpl.cat, ch: tpl.ch, scam: !!tpl.scam, diff: tpl.diff,
      brand: ctx.brandOf(tpl.brand), app: W.CHANNEL_APPS[tpl.ch] || W.CHANNEL_APPS.sms,
      fields: {}, lines: [], flags: [], greens: [], listing: null,
      lesson: fill(tpl.lesson || '', ctx)
    };
    ['ctx', 'from', 'addr', 'subject', 'qr'].forEach(function (f) {
      if (tpl[f]) card.fields[f] = parse(fill(tpl[f], ctx), card, ctx, f);
    });
    fill(tpl.body || '', ctx).split('\n').forEach(function (line) {
      var me = /^me:\s*/.test(line);
      if (me) line = line.replace(/^me:\s*/, '');
      if (line.trim()) card.lines.push({ me: me, segs: parse(line, card, ctx, 'body') });
    });
    if (tpl.listing) card.listing = { item: ctx.resolve('item'), price: ctx.resolve('price') };
    return card;
  }

  /** Plain text of a card (read-aloud, analyzer tests). */
  function plainText(card, opts) {
    opts = opts || {};
    function s(segs) { return (segs || []).map(function (x) { return x.text; }).join(''); }
    var parts = [];
    if (opts.withCtx && card.fields.ctx) parts.push(s(card.fields.ctx));
    if (card.fields.from) parts.push('From: ' + s(card.fields.from) + (card.fields.addr ? ' <' + s(card.fields.addr) + '>' : ''));
    if (card.fields.subject) parts.push('Subject: ' + s(card.fields.subject));
    card.lines.forEach(function (l) { parts.push(s(l.segs)); });
    if (card.fields.qr) parts.push('QR code link: ' + s(card.fields.qr));
    return parts.join('\n');
  }

  /* ---------------- Deck building ---------------- */

  /** Difficulty weights by player level: later levels lean subtle. */
  function diffWeights(level) {
    if (level < 3) return { 1: 4, 2: 1.2, 3: 0.2 };
    if (level < 6) return { 1: 2, 2: 3, 3: 1 };
    if (level < 10) return { 1: 1, 2: 3, 3: 3 };
    return { 1: 0.5, 2: 2, 3: 4 };
  }

  function allTemplates() { return RF.templates.scam.concat(RF.templates.legit); }

  /**
   * Pick a template.
   * @param {object} o - { rng, level, scam: bool, cats: [ids], recent: [tids] }
   */
  function pickTemplate(o) {
    var pool = (o.scam ? RF.templates.scam : RF.templates.legit);
    if (o.cats && o.cats.length) {
      var f = pool.filter(function (t) { return o.cats.indexOf(t.cat) >= 0; });
      if (f.length) pool = f;
    }
    var w = diffWeights(o.level || 1);
    var recent = o.recent || [];
    var weights = pool.map(function (t) {
      var x = w[t.diff] || 1;
      var r = recent.indexOf(t.id);
      if (r >= 0) x *= 0.02 + (r / Math.max(1, recent.length)) * 0.1; // avoid repeats
      return x;
    });
    return o.rng.weighted(pool, weights);
  }

  /**
   * Build a deck of n cards.
   * @param {object} o - { rng, n, level, scamRatio, cats, recent }
   */
  function deck(o) {
    var rng = o.rng, out = [], recent = (o.recent || []).slice(-14);
    var ratio = o.scamRatio == null ? 0.55 : o.scamRatio;
    for (var i = 0; i < o.n; i++) {
      var scam = rng.chance(ratio);
      // avoid 4 of the same answer in a row - keeps players honest
      if (out.length >= 3 && out.slice(-3).every(function (c) { return c.scam === scam; })) scam = !scam;
      var tpl = pickTemplate({ rng: rng, level: o.level, scam: scam, cats: o.cats, recent: recent });
      recent.push(tpl.id); if (recent.length > 14) recent.shift();
      out.push(generate(tpl, rng.fork(i + ':' + tpl.id), { level: o.level }));
    }
    return out;
  }

  function byId(id) {
    var all = allTemplates();
    for (var i = 0; i < all.length; i++) if (all[i].id === id) return all[i];
    return null;
  }

  RF.generator = {
    generate: generate, deck: deck, pickTemplate: pickTemplate, plainText: plainText,
    allTemplates: allTemplates, byId: byId, fill: fill, makeCtx: makeCtx
  };
})(window.RedFlag);
