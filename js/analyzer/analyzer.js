/*
 * analyzer/analyzer.js
 * "Check a Message" - an on-device, heuristic scam analyzer.
 *
 * - Runs 100% locally: no network requests, nothing leaves the device.
 * - Scores risk 0-100 by combining weighted red-flag rules.
 * - Returns findings with character spans so the UI can highlight them.
 * - It is HONEST: heuristics can miss scams and can flag real messages.
 *   The UI always tells people to verify through official channels.
 *
 * Extend it by adding a rule object to RULES (id, type, title, explain,
 * weight, re, [negatable]) - see the examples below.
 */
(function (RF) {
  'use strict';

  /* ---------- Reference lists ---------- */
  var SHORTENERS = ['bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'is.gd', 'ow.ly', 'cutt.ly', 'rb.gy', 'shorturl.at',
    'tiny.cc', 'buff.ly', 'rebrand.ly', 's.id', 'v.gd', 't.ly', 'qik.lnk', 'shorturl.com', 'bl.ink'];
  var ODD_TLDS = ['xyz', 'top', 'click', 'live', 'online', 'icu', 'buzz', 'rest', 'cam', 'zip', 'mov', 'support',
    'cfd', 'sbs', 'monster', 'gq', 'tk', 'ml', 'cf', 'ga', 'work', 'fit', 'loan', 'win', 'bid', 'country', 'kim',
    'cyou', 'lnk', 'quest', 'bond', 'help', 'vip', 'today', 'site', 'website', 'space', 'fun', 'link'];
  var MILD_TLDS = ['info', 'biz', 'cc', 'ws', 'pw', 'su'];
  var COMMON_TLDS = ['com', 'org', 'net', 'gov', 'edu', 'io', 'co', 'app', 'tv', 'uk', 'us', 'ca', 'au', 'de', 'fr',
    'in', 'me', 'ly', 'gl', 'gd', 'cc', 'nz', 'ie', 'es', 'it', 'nl', 'jp', 'br', 'mx', 'za', 'ai', 'dev', 'love',
    'shop', 'store', 'news', 'mil', 'int', 'eu', 'ch', 'se', 'no', 'dk', 'fi', 'pl', 'be', 'at', 'sg', 'hk', 'ph', 'id', 'at']
    .concat(ODD_TLDS, MILD_TLDS);
  var FREEMAIL = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'aol.com', 'icloud.com', 'proton.me',
    'protonmail.com', 'gmx.com', 'mail.com', 'yandex.com', 'mailzap.com', 'inboxly.net', 'postbox-mail.com'];
  var SCARY_HOST = /(secure|verify|verif|login|log-in|signin|account|update|support|wallet|refund|billing|helpdesk|auth|confirm|unlock|alert|recover|claim|bonus|gift|prize|reward)/i;

  /* ---------- Text rules ---------- */
  // type = taxonomy flag type (for icon + colour). weight 0..1.
  var RULES = [
    { id: 'urgency', type: 'urgency', weight: 0.22, title: 'Urgency or threats',
      explain: 'Deadlines, threats of closure, fines or arrest are designed to make you act before you think. Real organisations give you time and send written notices.',
      re: /\b(urgent(ly)?|immediately|right now|within \d+ ?(hours?|hrs?|h|minutes?|mins?|days?)|in \d+ (hours?|minutes?|mins)|final (notice|warning)|last (chance|warning)|act now|expires? (today|soon|in)|today only|before midnight|by tonight|asap|suspended|suspension|deactivat\w*|(will|may|has|have) been? (closed|locked|deleted|suspended|terminated|cancell?ed|disconnected|cut off|returned|destroyed|frozen|blocked)|(will|may) be (closed|locked|deleted|suspended|terminated|cancell?ed|disconnected|cut off|returned|destroyed|frozen|blocked)|arrest(ed)?|warrant|legal action|lawsuit|penalt(y|ies)|avoid (a )?(fine|penalt\w*|suspension)|permanently (locked|deleted|closed)|only \d+ spots?)\b/gi },
    { id: 'codes', type: 'codes', weight: 0.6, negatable: true, title: 'Asks for a code, PIN or password',
      explain: 'One-time codes, PINs, passwords and recovery phrases are the keys to your accounts. No real company, friend or official will ask you to share them.',
      re: /\b(send|share|give|tell|read|forward|reply (to this (email|message|text) )?with|text|confirm|provide|enter|what('s| is)|dm)\b[^.!?\n]{0,45}?\b(code|otp|one[- ]time (pass)?code|pin|password|passcode|verification code|security code|recovery phrase|seed phrase|12[- ]word|login details|credentials)\b/gi },
    { id: 'phrase', type: 'codes', weight: 0.5, negatable: true, title: 'Mentions your wallet recovery phrase',
      explain: 'A crypto recovery (seed) phrase gives total control of the wallet. Anyone asking for it is stealing.',
      re: /\b(recovery|seed|secret) (phrase|words)\b/gi },
    { id: 'payment', type: 'payment', weight: 0.5, negatable: true, title: 'Untraceable payment method',
      explain: 'Gift cards, crypto, wire transfers, cash couriers and “safe accounts” are favourite scam payments because they are hard to trace or reverse.',
      re: /\b(gift ?cards?|itunes cards?|steam cards?|google play cards?|prepaid (card|debit card)s?|(pay|send|deposit|top up|transfer|settle|payable)\b[^.!?\n]{0,40}\b(bitcoin|btc|usdt|eth|crypto(currency)?)|wire (transfer|it|the money|money|me)|by wire|can you wire|wire \$\d[\d,.]*|transfer \$?\d[\d,.]* to (my|a|our) (friend'?s )?account|western union|money ?gram|safe account|secure (holding )?account|holding account|(bitcoin|crypto|btc|usdt|eth) (atm|kiosk)|friends (&|and) family|cash courier|courier will (come|collect)|(photos?|pictures?) of the (codes?|cards?)|send (me |us )?the codes?)\b/gi },
    { id: 'crypto', type: 'payment', weight: 0.15, title: 'Mentions cryptocurrency',
      explain: 'Crypto payments can’t be reversed. Be very careful with anyone asking you to buy, send or “invest” crypto.',
      re: /\b(bitcoin|btc|usdt|ethereum|crypto(currency)?)\b/gi },
    { id: 'codes2', type: 'codes', weight: 0.55, negatable: true, title: 'Asks you to pass on a code',
      explain: 'Codes are sent to YOU to prove it’s you. A message asking you to send one on is trying to get into your account.',
      re: /\b(code|pin|otp)\b[^.!?\n]{0,60}?\b(send|forward|text|tell|read|give) (it|them|me|us)\b/gi },
    { id: 'invest', type: 'tgtbt', weight: 0.3, title: 'Investment “mentor” or trading pitch',
      explain: 'Unsolicited trading “mentors”, signals and bots are the front door of investment scams.',
      re: /\b(my (trading )?signals|trading (bot|signals|platform)|ai trading|my students|i mentor|investment opportunity|investing group|forex|portfolio (is )?now worth)\b/gi },
    { id: 'offplatform', type: 'sender', weight: 0.3, title: 'Moves you to another app',
      explain: 'Scammers push conversations to private apps where the platform can’t protect you or see their behaviour.',
      re: /\b(another app|other app|whatsapp|telegram|private chat|contact me on|talk on another|text me on|move (this|our chat))\b/gi },
    { id: 'lovebomb', type: 'emotion', weight: 0.2, title: 'Flattery from a stranger',
      explain: 'Over-the-top compliments from someone you’ve never met are the first step of a romance scam.',
      re: /\b(hello (beautiful|gorgeous|dear|handsome)|very lonely|lonely (man|woman)|oil rig|deployed overseas|you are so beautiful)\b/gi },
    { id: 'tgtbt', type: 'tgtbt', weight: 0.35, title: 'Too good to be true',
      explain: 'Prizes you didn’t enter, guaranteed returns and easy money are bait. If it sounds too good to be true, it is.',
      re: /\b(you('ve| have)? won|you are (a |our )?winner|you('re| are) (the )?lucky|free (gift|iphone|phone|smartphone|voucher|money|cash)|guaranteed( \d+%)? (returns?|profit|income|earnings)|guaranteed|\d{2,4}% (returns?|profit|a month|monthly|daily|weekly|last month)|double your|risk[- ]free|earn \$?\d[\d,]*\s*(\/|per|a)\s*(day|hour|week)|make \$\d[\d,]* (a|per) (day|week)|passive income|no experience (needed|required)|lottery|sweepstakes?|jackpot|claim your (prize|reward|gift|bonus)|cash prize|without (any )?interview)\b/gi },
    { id: 'secrecy', type: 'secrecy', weight: 0.45, title: 'Asks you to keep it secret',
      explain: 'Scammers isolate you from people who would recognise the scam. Legitimate requests never need secrecy.',
      re: /\b(don'?t tell|do not tell|keep (this|it) (between us|quiet|secret|confidential|to yourself)|tell no one|don'?t (discuss|mention) (this|it)|do not (discuss|mention)|between (you and me|us)|our (little )?secret|do not hang up|don'?t hang up)\b/gi },
    { id: 'family', type: 'emotion', weight: 0.35, title: 'Family emergency / new number claim',
      explain: '“Hi Mum, new number” and emergency calls (accident, jail, hospital) are classic - and AI voice cloning makes them convincing. Call the person on the number you already have.',
      re: /\b(hi,? (mum|mom|dad|grandma|grandpa|nan)|(this is|it'?s) my new number|new number|my phone (broke|died|is broken|is dead)|lost my phone|i'?m in (big )?trouble|in jail|bail( money)?|crashed the car|car accident|in (the )?hospital)\b/gi },
    { id: 'romance', type: 'emotion', weight: 0.25, title: 'Emotional / romantic pressure',
      explain: 'Love-bombing and guilt are used to lower your guard before a request for money.',
      re: /\b(my love|my dear|sweetheart|darling|god brought us|soul ?mate|be together forever|i love you|it means so much|don'?t scroll past|children are (dying|sleeping|starving))\b/gi },
    { id: 'remote', type: 'remote', weight: 0.5, title: 'Remote-access request',
      explain: 'Remote-access apps let a stranger control your device - including your banking apps. Real support never cold-calls to connect.',
      re: /\b(anydesk|teamviewer|anyassist|quickhelp remote|deskbridge|ultraviewer|remote (access|desktop|support|control|app|helper)|screen ?shar\w*|install [\w ]{0,25}(app|software|helper|program)|let (me|us|our (engineer|technician)) (connect|access|in)|connect to your (pc|computer|device|phone))\b/gi },
    { id: 'overpay', type: 'overpay', weight: 0.5, title: 'Overpayment or refund trick',
      explain: 'They “accidentally” pay or refund too much and ask you to send the difference back. The original payment is fake or gets reversed.',
      re: /\b(overpa(id|y|yment)|paid (you )?too much|sent (you )?too much|refunded too much|by mistake|refund the (difference|extra)|(send|return)( back)? the (difference|remainder|extra|rest)|extra (is )?for (my|the) (courier|shipping|mover|agent)|mail you a (check|cheque)|overcharged)\b/gi },
    { id: 'info', type: 'info', weight: 0.4, negatable: true, title: 'Asks for personal or card details',
      explain: 'Card numbers, CVV, ID numbers, date of birth and security answers enable fraud and identity theft.',
      re: /\b(card number|card details|cvv|cvc|security code on|expiry date|expiration date|social security|ssn|national id|id number|date of birth|bank details|account number|routing number|sort code|mother'?s maiden name|security questions?|selfie with (your )?id|home address and|account pin)\b/gi },
    { id: 'tone', type: 'tone', weight: 0.15, title: 'Generic greeting or odd tone',
      explain: 'Generic greetings and stilted phrases (“Kindly…”, “Dear Customer”) are common in mass phishing.',
      re: /\b(dear (customer|costumer|user|client|valued customer|sir\/madam|account ?holder|member)|kindly|do the needful|valued customer)\b/gi },
    { id: 'cta', type: 'link', weight: 0.12, title: 'Pushes you to act through a link',
      explain: 'Messages that push you to “verify”, “confirm” or “claim” via a link are the main phishing pattern. Go to the official app or site yourself instead.',
      re: /\b(click (here|the link|below)|tap (here|the link)|verify (now|your|here)|confirm (now|your)|update (now|your billing|your payment|your details)|log ?in (now|here|below)|reactivate|unlock (your|now)|claim (now|here|it)|scan (now|to (pay|claim)))\b/gi },
    { id: 'callback', type: 'urgency', weight: 0.15, title: 'Tells you to call a number in the message',
      explain: '“Callback phishing” gets you to call the scammer. Use the number on your card, bill or the official app instead.',
      re: /\b(call (us|now|back|our|me back|the number below|our refund desk)|press 1)\b/gi },
    { id: 'payapp', type: 'payment', weight: 0.15, negatable: true, title: 'Pressure to pay via a payment app',
      explain: 'Payment-app transfers are instant and hard to reverse. Be careful about sending money to people you haven’t met.',
      re: /\b(zelle|venmo|cash ?app|paypal|payping|cashdash|transfer (the )?(money|funds|it)|(processing|release|unlock|equipment|upgrade|rebooking|redelivery|customs|shipping|delivery|unpaid|handling) (fee|duty))\b/gi }
  ];

  var POSITIVE = [
    { re: /\b(we|they|staff|[a-z]+) (will )?never (ask|call|text|email)\b/gi, text: 'States they never ask for codes/payments - typical of genuine messages (but scammers copy this too).' },
    { re: /\b(don'?t|do not|never) share (this|the|your|it)\b/gi, text: 'Warns you not to share the code - typical of genuine one-time-code texts.' },
    { re: /\bnumber on the back of your card\b/gi, text: 'Directs you to the number on your card - the right way to verify.' },
    { re: /\b(open|use|in) the [\w ]{2,20} app\b/gi, text: 'Points you to the official app rather than a link.' }
  ];

  /* ---------- Helpers ---------- */
  function norm(text) {
    // Normalise curly quotes so regexes match; keeps string length identical.
    return text.replace(/[’‘]/g, "'").replace(/[“”]/g, '"');
  }
  function negated(text, idx) {
    var before = text.slice(Math.max(0, idx - 70), idx).toLowerCase();
    return /(\bnever|n't|\bnot|\bno one|\bnobody)\b[^.!?\n]*$/.test(before);
  }
  function brandNamesIn(text) {
    var out = [];
    if (!RF.world) return out;
    RF.world.allBrands().forEach(function (b) {
      var re = new RegExp('\\b' + b.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');
      var short = b.short && new RegExp('\\b' + b.short + '\\b', 'i');
      if (re.test(text) || (short && short.test(text))) out.push(b);
    });
    return out;
  }
  function deleet(s) {
    return s.replace(/rn/g, 'm').replace(/vv/g, 'w').replace(/0/g, 'o').replace(/1/g, 'l').replace(/3/g, 'e')
      .replace(/5/g, 's').replace(/[àáâä]/g, 'a').replace(/[èéêë]/g, 'e').replace(/[ìíîï]/g, 'i').replace(/[òóôö]/g, 'o');
  }
  function editDistance(a, b) {
    if (Math.abs(a.length - b.length) > 2) return 9;
    var d = [], i, j;
    for (i = 0; i <= a.length; i++) { d[i] = [i]; }
    for (j = 0; j <= b.length; j++) d[0][j] = j;
    for (i = 1; i <= a.length; i++) for (j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
    return d[a.length][b.length];
  }

  /* ---------- Link analysis ---------- */
  var URL_RE = /\b((?:https?:\/\/|www\.)[^\s<>"'”)\]]+|(?:[a-z0-9¡-￿](?:[a-z0-9¡-￿-]{0,61}[a-z0-9¡-￿])?\.)+[a-z¡-￿]{2,12}(?:\/[^\s<>"'”)\]]*)?)/gi;
  var EMAIL_RE = /\b[a-z0-9._%+-]+@((?:[a-z0-9¡-￿-]+\.)+[a-z¡-￿]{2,12})\b/gi;

  function findLinks(text) {
    var links = [], m;
    URL_RE.lastIndex = 0;
    while ((m = URL_RE.exec(text))) {
      var raw = m[1].replace(/[.,;:!?]+$/, '');
      var start = m.index;
      if (start > 0 && text[start - 1] === '@') continue;                 // part of an email
      var hasScheme = /^(https?:\/\/|www\.)/i.test(raw);
      var host = raw.replace(/^https?:\/\//i, '').split(/[\/?#]/)[0];
      var userinfo = null;
      if (host.indexOf('@') >= 0) { userinfo = host.slice(0, host.lastIndexOf('@')); host = host.slice(host.lastIndexOf('@') + 1); }
      host = host.replace(/:\d+$/, '').replace(/^www\./i, '').toLowerCase();
      var tld = host.split('.').pop();
      var isIp = /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
      if (!hasScheme && !isIp && COMMON_TLDS.indexOf(tld) < 0 && !/[^\x00-\x7f]/.test(host)) continue; // e.g. "file.txt"
      if (!hasScheme && /^\d+(\.\d+)+$/.test(host) && !isIp) continue; // version numbers / prices
      links.push({ raw: raw, start: start, end: start + raw.length, host: host, tld: tld, isIp: isIp, userinfo: userinfo, scheme: (raw.match(/^https?/i) || [''])[0].toLowerCase() });
    }
    return links;
  }

  function analyzeHost(link, brands, isEmail) {
    var issues = [];
    var host = link.host;
    var reg = RF.domains ? RF.domains.registrable(host) : host;
    var label = reg.split('.')[0];
    link.registrable = reg;
    var official = RF.world ? RF.world.allBrands().filter(function (b) { return b.domain === reg; })[0] : null;
    link.official = !!official;
    function add(w, why) { issues.push({ w: w, why: why }); }

    if (link.isIp) add(0.5, 'Uses a raw IP address instead of a name - legitimate companies use their domain.');
    if (link.userinfo) add(0.5, 'Contains “@”: browsers ignore everything before the @, so the real destination is ' + host + '.');
    if (SHORTENERS.indexOf(reg) >= 0 || SHORTENERS.indexOf(host) >= 0) add(0.3, 'Shortened link - it hides where it really goes.');
    if (/xn--/.test(host) || /[^\x00-\x7f]/.test(host)) add(0.45, 'Contains look-alike international characters (punycode) that can imitate real letters.');
    if (ODD_TLDS.indexOf(link.tld) >= 0) add(0.3, 'Unusual domain ending “.' + link.tld + '” - cheap and popular with scammers.');
    else if (MILD_TLDS.indexOf(link.tld) >= 0) add(0.12, 'Less common domain ending “.' + link.tld + '”.');
    if (/\.(com|org|net|gov|edu|co)\.[a-z0-9-]+\./.test(host + '.') && reg.indexOf('.') === reg.lastIndexOf('.') && !/\.(com|org|net|gov|edu|co)\.[a-z]{2}$/.test(host)) {
      add(0.5, 'Subdomain trick: it starts like a real address, but the site actually belongs to “' + reg + '”. Read domains from the right.');
    }
    if (host.split('.').length >= 4) add(0.12, 'Lots of sub-parts in the address - often used to bury the real domain.');
    if (!official && SCARY_HOST.test(host)) add(0.25, 'Security-sounding words (“verify”, “secure”, “login”…) in the address - real sites rarely need them.');
    if ((label.match(/-/g) || []).length >= 2) add(0.15, 'Several hyphens in the domain name - common in throwaway scam domains.');
    if (/[a-z][0-9]+[a-z]/i.test(label) && /[01]/.test(label)) add(0.3, 'Numbers mixed into the name (like 0 for o or 1 for l) - a homoglyph trick.');
    if (link.scheme === 'http' && !isEmail) add(0.08, 'Not using https.');

    // Brand mismatch: text mentions a known brand but the domain isn't theirs.
    var flat = deleet(label);
    brands.forEach(function (b) {
      if (official && official === b) return;
      var bl = b.domain.split('.')[0];
      if (reg === b.domain) return;
      if (label === bl && reg !== b.domain) add(0.3, 'Right name, wrong ending: ' + b.name + '’s real domain is ' + b.domain + '.');
      else if (label.indexOf(bl) >= 0 || flat.indexOf(bl) >= 0 || host.indexOf(bl) >= 0) add(0.45, 'Uses the name “' + b.name + '” but isn’t ' + b.name + '’s official domain (' + b.domain + ').');
      else if (editDistance(flat.replace(/-/g, ''), bl) <= 2) add(0.45, 'Looks like “' + b.domain + '” but is spelled differently - a typo-squat.');
    });
    // Generic lookalike: label is deleet-different or a near-miss of a known brand even if not mentioned
    if (!official && !brands.length && RF.world) {
      RF.world.allBrands().forEach(function (b) {
        var bl = b.domain.split('.')[0];
        if (label !== bl && (deleet(label) === bl || (bl.length > 5 && editDistance(label.replace(/-/g, ''), bl) === 1))) {
          add(0.4, 'Very close to “' + b.domain + '” but not the same - a lookalike.');
        }
      });
    }
    link.issues = issues;
    return issues;
  }

  /* ---------- Main ---------- */
  function analyze(input) {
    var text = String(input || '');
    var t = norm(text);
    var findings = [];
    var spans = []; // {start,end,type,fi}

    function addFinding(f, s, e) {
      var idx = -1;
      for (var i = 0; i < findings.length; i++) if (findings[i].id === f.id) { idx = i; break; }
      if (idx < 0) { findings.push({ id: f.id, type: f.type, title: f.title, explain: f.explain, weight: f.weight, hits: [], extra: 0 }); idx = findings.length - 1; }
      var fd = findings[idx];
      if (s != null) { fd.hits.push(text.slice(s, e)); spans.push({ start: s, end: e, type: f.type, fi: idx }); }
      return fd;
    }

    RULES.forEach(function (r) {
      r.re.lastIndex = 0;
      var m;
      while ((m = r.re.exec(t))) {
        if (m[0].length === 0) { r.re.lastIndex++; continue; }
        if (r.negatable && negated(t, m.index)) continue;
        addFinding(r, m.index, m.index + m[0].length);
      }
    });

    // Shouting
    var caps = (text.match(/\b[A-Z]{4,}\b/g) || []).filter(function (w) { return ['HTTP', 'HTTPS', 'ATM', 'USDT'].indexOf(w) < 0; });
    if (caps.length >= 2 || /!{2,}/.test(text)) {
      addFinding({ id: 'shout', type: 'tone', weight: 0.12, title: 'Shouting / excessive punctuation', explain: 'ALL-CAPS words and “!!!” are pressure tactics rarely used by real companies.' });
    }

    // Links + emails
    var brands = brandNamesIn(t);
    var links = findLinks(t);
    var linkWeights = [];
    links.forEach(function (l) {
      var issues = analyzeHost(l, brands, false);
      var w = 0;
      issues.forEach(function (i) { w = 1 - (1 - w) * (1 - i.w); });
      l.risk = Math.round(w * 100);
      if (issues.length) {
        var fd = addFinding({ id: 'link:' + l.raw, type: 'link', weight: Math.min(0.75, w), title: 'Suspicious link: ' + l.host,
          explain: issues.map(function (i) { return i.why; }).join(' ') }, l.start, l.end);
        fd.link = l;
        linkWeights.push(w);
      }
    });
    var emails = [], em;
    EMAIL_RE.lastIndex = 0;
    while ((em = EMAIL_RE.exec(t))) {
      var dom = em[1].toLowerCase();
      var e = { raw: em[0], start: em.index, end: em.index + em[0].length, host: dom, tld: dom.split('.').pop(), scheme: '' };
      var issues = analyzeHost(e, brands, true);
      var claimsOrg = /\b(bank|support|security|team|department|service|billing|official|customer care|fraud|recruit|hr|payments?)\b/i.test(t);
      if (FREEMAIL.indexOf(dom) >= 0 && claimsOrg) issues.push({ w: 0.3, why: 'Claims to be an organisation but writes from a free personal email address (' + dom + ').' });
      emails.push(e);
      if (issues.length) {
        var ew = 0; issues.forEach(function (i) { ew = 1 - (1 - ew) * (1 - i.w); });
        addFinding({ id: 'mail:' + e.raw, type: 'sender', weight: Math.min(0.6, ew), title: 'Suspicious sender address: ' + dom,
          explain: issues.map(function (i) { return i.why; }).join(' ') }, e.start, e.end);
      }
    }

    // Positives
    var positives = [];
    POSITIVE.forEach(function (p) {
      p.re.lastIndex = 0;
      if (p.re.test(t)) positives.push(p.text);
    });
    var allOfficial = links.length + emails.length > 0 && links.concat(emails).every(function (l) { return l.official; });
    if (allOfficial) positives.push('All links/addresses match an official domain we know.');

    // Combine: per-type max + small bonus for repeats, then probabilistic OR.
    var byType = {};
    findings.slice().sort(function (a, b) { return b.weight - a.weight; }).forEach(function (f) {
      var w = f.weight + Math.min(0.15, (f.hits.length - 1) * 0.04);
      byType[f.type] = byType[f.type] == null ? w : 1 - (1 - byType[f.type]) * (1 - w * 0.5);
    });
    var risk = 0;
    Object.keys(byType).forEach(function (k) { risk = 1 - (1 - risk) * (1 - Math.min(0.9, byType[k])); });
    var severe = findings.some(function (f) { return f.weight >= 0.4; });
    if (positives.length && !severe) risk *= 0.55;
    else if (positives.length) risk *= 0.85;
    var score = Math.round(Math.max(0, Math.min(1, risk)) * 100);

    var level = score >= 70 ? 'very-high' : score >= 45 ? 'high' : score >= 20 ? 'medium' : 'low';
    var LABELS = { 'very-high': 'Very likely a scam', high: 'Likely a scam', medium: 'Be careful', low: 'Few warning signs found' };

    findings.sort(function (a, b) { return b.weight - a.weight; });
    // re-map span finding indices after sort
    spans.forEach(function (s) { s.f = s.fi; });
    return {
      text: text, score: score, level: level, label: LABELS[level],
      findings: findings, spans: mergeSpans(spans), links: links, emails: emails, positives: positives,
      advice: advice(findings)
    };
  }

  function mergeSpans(spans) {
    spans.sort(function (a, b) { return a.start - b.start || (b.end - b.start) - (a.end - a.start); });
    var out = [];
    spans.forEach(function (s) {
      var last = out[out.length - 1];
      if (last && s.start < last.end) { if (s.end > last.end) last.end = s.end; return; }
      out.push({ start: s.start, end: s.end, type: s.type });
    });
    return out;
  }

  /** "What to do now" checklist, tailored a little to what was found. */
  function advice(findings) {
    var types = {};
    findings.forEach(function (f) { types[f.type] = 1; });
    var a = [
      'Don’t click links, scan codes or call numbers in the message.',
      'Contact the company yourself using its official app, website you type in, or the number on your card/bill.',
      'Never share one-time codes, PINs, passwords or recovery phrases - with anyone.'
    ];
    if (types.emotion) a.push('If it claims to be family or a friend, call them on the number you already have - or ask a question only they’d know. Agree a family code word.');
    if (types.remote) a.push('Don’t install any app a caller asks for. If you already did, disconnect from the internet and get help from someone you trust.');
    a.push('Report it: forward scam texts to your carrier’s spam-report number, use “Report junk/phishing” in your email or app, then block the sender.');
    a.push('Already paid or shared details? Contact your bank or card issuer IMMEDIATELY, change passwords, and report it to your local police or fraud-reporting service.');
    return a;
  }

  /** Render analyzed text with <mark> highlights (escaped). */
  function highlight(res) {
    var esc = RF.util.esc, text = res.text, out = '', pos = 0;
    res.spans.forEach(function (s) {
      out += esc(text.slice(pos, s.start));
      out += '<mark class="af af-' + s.type + '">' + esc(text.slice(s.start, s.end)) + '</mark>';
      pos = s.end;
    });
    out += esc(text.slice(pos));
    return out.replace(/\n/g, '<br>');
  }

  RF.analyzer = { analyze: analyze, highlight: highlight, findLinks: findLinks, RULES: RULES };
})(window.RedFlag);
