/*
 * content/taxonomy.js
 * Shared vocabulary: red-flag types, green-flag types and scam categories.
 * Templates reference these ids; the UI and Field Guide read the labels.
 */
(function (RF) {
  'use strict';

  /** Red flags - things that should make you suspicious. */
  var FLAGS = {
    urgency: { icon: '⏰', label: 'Urgency or threat', note: 'Scammers rush you with deadlines and threats so you act before you think. Real organisations give you time.' },
    link: { icon: '🔗', label: 'Lookalike link', note: 'The link is not the company’s official domain. Read domains from the right - the part before the first “/” is what counts.' },
    payment: { icon: '💳', label: 'Odd payment method', note: 'Gift cards, crypto, wire transfers and payment-app “safe accounts” are untraceable. No real business or agency demands them.' },
    codes: { icon: '🔑', label: 'Asks for codes or passwords', note: 'One-time codes, PINs and passwords are keys to your account. Nobody legitimate will ever ask you to read them out or send them.' },
    tgtbt: { icon: '🎁', label: 'Too good to be true', note: 'Huge prizes, easy money and guaranteed returns are bait. If you didn’t enter, you didn’t win.' },
    sender: { icon: '👤', label: 'Unknown or mismatched sender', note: 'The sender doesn’t match who they claim to be - a random number, a free-mail address or an unofficial account.' },
    tone: { icon: '✍️', label: 'Grammar or tone mismatch', note: 'Odd spelling, strange capitalisation or a tone that doesn’t fit the company (or the person) is a warning sign.' },
    emotion: { icon: '💔', label: 'Emotional pressure', note: 'Fear, love, guilt or panic are used to switch off your careful thinking.' },
    secrecy: { icon: '🤫', label: 'Secrecy', note: '“Don’t tell anyone” isolates you from people who would spot the scam.' },
    overpay: { icon: '💸', label: 'Overpayment or refund trick', note: 'They “accidentally” send too much and ask you to send the difference back. The original payment later vanishes.' },
    remote: { icon: '🖥️', label: 'Remote-access request', note: 'Installing a remote-control app gives a stranger full control of your device and bank sessions.' },
    info: { icon: '🪪', label: 'Asks for personal info', note: 'Requests for ID numbers, card details or selfies-with-ID enable identity theft.' }
  };

  /** Green flags - signals that a message is genuine. */
  var GREENS = {
    official: { icon: '✅', label: 'Official domain / sender', note: 'Comes from (or points to) the organisation’s real, exact domain or verified sender.' },
    noask: { icon: '🛡️', label: 'No request for codes or money', note: 'It doesn’t ask you to share codes, passwords or pay in an unusual way.' },
    expected: { icon: '📬', label: 'You started this', note: 'It matches something YOU just did - a login, an order, a sign-up.' },
    verify: { icon: '☎️', label: 'Tells you to verify independently', note: 'It suggests using the official app or the number on your card instead of a link.' },
    calm: { icon: '🧘', label: 'No pressure', note: 'Calm, informative tone with no threats or impossible deadlines.' },
    known: { icon: '🤝', label: 'Known contact, consistent details', note: 'From a saved contact, with details that match what you already know.' }
  };

  /** Scam families. `story` links a category to its Case File chapter. */
  var CATEGORIES = {
    delivery: { name: 'Fake Delivery', icon: '📦' },
    bank: { name: 'Bank Impersonation', icon: '🏦' },
    otp: { name: 'Code Theft (OTP)', icon: '🔢' },
    tech: { name: 'Fake Tech Support', icon: '🖥️' },
    romance: { name: 'Romance Scam', icon: '💘' },
    family: { name: 'Family Emergency & Voice Clone', icon: '📱' },
    job: { name: 'Job & Task Scam', icon: '💼' },
    crypto: { name: 'Crypto Investment', icon: '📈' },
    market: { name: 'Marketplace Scam', icon: '🛒' },
    qr: { name: 'QR Code Scam', icon: '📷' },
    prize: { name: 'Prize & Giveaway', icon: '🎉' },
    gov: { name: 'Tax, Toll & Government', icon: '🏛️' },
    account: { name: 'Account & Subscription', icon: '🔐' },
    invoice: { name: 'Fake Invoice & Refund', icon: '🧾' },
    charity: { name: 'Fake Charity', icon: '🤲' }
  };

  RF.taxonomy = { FLAGS: FLAGS, GREENS: GREENS, CATEGORIES: CATEGORIES };
})(window.RedFlag);
