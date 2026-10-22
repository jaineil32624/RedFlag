/*
 * content/domains.js
 * Lookalike-domain generator. Given a fictional brand's official
 * domain it produces convincing fakes at three difficulty tiers:
 *   tier 1 - obvious: extra scary words + odd TLDs (novabank-secure-verify.xyz)
 *   tier 2 - plausible: extra word / wrong TLD (novabank-support.com, novabank.co)
 *   tier 3 - subtle: homoglyphs, typos, subdomain tricks (n0vabank.com,
 *            novabank.com.verify-id.xyz)
 * Each fake also returns a short "why" used in teaching feedback.
 */
(function (RF) {
  'use strict';

  var ODD_TLDS = ['xyz', 'top', 'click', 'info', 'live', 'online', 'support', 'icu'];
  var SCARY = ['secure', 'verify', 'login', 'account', 'update', 'alert', 'support', 'help', 'refund', 'billing'];
  var TRICK_TAILS = ['verify-id.xyz', 'secure-login.net', 'account-check.info', 'auth-portal.top', 'session-id.live'];
  var HOMOGLYPHS = [['o', '0'], ['l', '1'], ['m', 'rn'], ['w', 'vv'], ['i', 'l'], ['a', 'à'], ['e', 'é']];

  function split(domain) {
    var i = domain.indexOf('.');
    return { slug: domain.slice(0, i), tld: domain.slice(i + 1) };
  }

  /** Where does the brand name naturally split into two words? (NovaBank -> nova|bank) */
  function wordBoundary(brand, slug) {
    var name = brand.name || '';
    var m = name.match(/^([A-Z][a-z]+)[A-Z ]/);
    if (m && slug.indexOf(m[1].toLowerCase()) === 0 && m[1].length < slug.length) return m[1].length;
    return -1;
  }

  /** Generators per tier. Each returns {d: domain, why: explanation} or null. */
  var T1 = [
    function (s) { return { d: s.slug + '-secure-verify.' + 'xyz', why: 'Scary extra words and an unusual “.xyz” ending.' }; },
    function (s, r) { return { d: s.slug + '.account-update.' + r.pick(['top', 'info']), why: 'The real site name is just a subdomain of “account-update”.' }; },
    function (s) { return { d: 'secure-' + s.slug + '-login.info', why: 'Words like “secure” and “login” are bolted on to look official.' }; },
    function (s, r) { var t = r.pick(['click', 'live']); return { d: s.slug + '-help.' + t, why: 'Odd ending (“.' + t + '”) plus an added word.' }; },
    function (s) { return { d: s.slug + 'support.online', why: 'Not the official domain - “support.online” is a different site.' }; },
    function (s, r) { return { d: s.slug + '-refund.' + r.pick(ODD_TLDS), why: '“Refund” sites are a classic bait; the domain is not the official one.' }; }
  ];
  var T2 = [
    function (s, r) { return { d: s.slug + '-' + r.pick(['support', 'alerts', 'online', 'service']) + '.com', why: 'One extra word makes it a totally different domain.' }; },
    function (s) { return s.tld === 'co' ? null : { d: s.slug + '.co', why: 'Wrong ending: “.co” instead of “.' + s.tld + '”.' }; },
    function (s) { return s.tld === 'com' ? { d: s.slug + '.net', why: 'Wrong ending: “.net” instead of “.com”.' } : { d: s.slug + '.com', why: 'Wrong ending: “.com” instead of “.' + s.tld + '”.' }; },
    function (s, r) { return { d: r.pick(['my', 'get', 'go']) + s.slug + '.com', why: 'A prefix (“my/get/go”) creates a different domain.' }; },
    function (s) { return { d: s.slug + 'help.com', why: '“help” glued onto the name = someone else’s domain.' }; }
  ];
  var T3 = [
    // homoglyph swap (o->0, l->1, m->rn ...)
    function (s, r) {
      var opts = [];
      HOMOGLYPHS.forEach(function (g) {
        var idx = s.slug.indexOf(g[0]);
        if (idx >= 0) opts.push([idx, g]);
      });
      if (!opts.length) return null;
      var o = r.pick(opts);
      var d = s.slug.slice(0, o[0]) + o[1][1] + s.slug.slice(o[0] + 1) + '.' + s.tld;
      return { d: d, why: 'Lookalike characters: “' + o[1][1] + '” is pretending to be “' + o[1][0] + '”.' };
    },
    // swap two adjacent letters
    function (s, r) {
      if (s.slug.length < 5) return null;
      var i = r.int(1, s.slug.length - 3);
      if (s.slug[i] === s.slug[i + 1]) return null;
      var d = s.slug.slice(0, i) + s.slug[i + 1] + s.slug[i] + s.slug.slice(i + 2) + '.' + s.tld;
      return { d: d, why: 'Two letters are swapped - easy to miss when you skim.' };
    },
    // doubled letter
    function (s, r) {
      var i = r.int(1, s.slug.length - 2);
      return { d: s.slug.slice(0, i) + s.slug[i] + s.slug.slice(i) + '.' + s.tld, why: 'A letter is doubled - a classic typo-squat.' };
    },
    // subdomain trick: real domain at the START of a fake one
    function (s, r) {
      var tail = r.pick(TRICK_TAILS);
      return { d: s.slug + '.' + s.tld + '.' + tail, why: 'Read domains from the RIGHT: this site belongs to “' + tail + '”, not ' + s.slug + '.' + s.tld + '.' };
    },
    // hyphen inserted at the word boundary (nova-bank.com)
    function (s, r, brand) {
      var b = wordBoundary(brand, s.slug);
      if (b < 0) return null;
      return { d: s.slug.slice(0, b) + '-' + s.slug.slice(b) + '.' + s.tld, why: 'A hyphen makes it a different domain (the real one has none).' };
    }
  ];
  var TIERS = { 1: T1, 2: T2, 3: T3 };

  /**
   * Make one lookalike for a brand.
   * @returns {{d:string, why:string, tier:number}}
   */
  function mutate(brand, tier, rng) {
    tier = Math.max(1, Math.min(3, tier || 1));
    var s = split(brand.domain);
    for (var attempt = 0; attempt < 30; attempt++) {
      var t = attempt > 20 ? 1 : tier;
      var fn = rng.pick(TIERS[t]);
      var res = fn(s, rng, brand);
      if (res && res.d !== brand.domain) { res.tier = t; return res; }
    }
    return { d: s.slug + '-secure.xyz', why: 'Not the official domain.', tier: 1 };
  }

  /** n distinct fakes for the Lookalike Lightning round. */
  function fakeSet(brand, n, rng, tier) {
    var out = [], seen = {}; seen[brand.domain] = 1;
    for (var i = 0; i < 60 && out.length < n; i++) {
      var t = tier || rng.int(1, 3);
      if (i > 10) t = rng.int(1, 3);
      var f = mutate(brand, t, rng);
      if (!seen[f.d]) { seen[f.d] = 1; out.push(f); }
    }
    return out;
  }

  /**
   * Registrable ("owner") domain of a hostname: last two labels, or last
   * three for well-known two-part suffixes like co.uk. Used by the analyzer.
   */
  var TWO_PART = ['co.uk', 'com.au', 'co.nz', 'co.in', 'com.br', 'co.za', 'com.mx', 'co.jp', 'org.uk', 'gov.uk', 'ac.uk'];
  function registrable(host) {
    host = String(host || '').toLowerCase().replace(/\.$/, '');
    var parts = host.split('.');
    if (parts.length <= 2) return host;
    var last2 = parts.slice(-2).join('.');
    if (TWO_PART.indexOf(last2) >= 0) return parts.slice(-3).join('.');
    return last2;
  }

  RF.domains = { mutate: mutate, fakeSet: fakeSet, registrable: registrable, ODD_TLDS: ODD_TLDS, SCARY: SCARY };
})(window.RedFlag);
