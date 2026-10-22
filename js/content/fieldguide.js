/*
 * content/fieldguide.js
 * The Field Guide: an encyclopedia of scam types. Category entries unlock
 * the first time you meet that scam family in a game; "basics" entries are
 * open from the start.
 */
(function (RF) {
  'use strict';

  var ENTRIES = [
    /* --- Basics (always unlocked) --- */
    { id: 'basics-links', basic: true, icon: '🔗', title: 'How to read a link',
      how: 'The part of a web address that matters is the domain just before the first single “/”. Read it from the RIGHT: in novabank.com.verify-id.xyz the real owner is verify-id.xyz - not NovaBank.',
      flags: ['Extra words: novabank-secure.com is NOT novabank.com', 'Lookalike letters: n0vabank (zero), rnovabank (r+n looks like m)', 'Odd endings like .xyz, .top, .click', 'Shortened links hide where they go', '“@” inside a link - everything before it is ignored'],
      todo: ['Don’t tap links in unexpected messages', 'Type the official address yourself or use the official app', 'Long-press (don’t tap) to preview a link'] },
    { id: 'basics-codes', basic: true, icon: '🔑', title: 'One-time codes (2FA)',
      how: 'A one-time code is sent to YOU to prove it is really you logging in. If someone asks you for that code, they are trying to log in as you - right now.',
      flags: ['“I sent my code to your number by mistake”', 'A caller asks you to “read back” or “confirm” a code', 'A buyer wants to “verify you’re real” with a code'],
      todo: ['Only type codes into the app/site YOU are logging into', 'Never read them out, forward or screenshot them', 'Got a code you didn’t request? Change your password'] },
    { id: 'basics-verify', basic: true, icon: '☎️', title: 'How to verify anything',
      how: 'The golden rule: hang up / close the message, then contact the organisation or person through a channel YOU already trust.',
      flags: ['Caller ID and sender names can be faked', 'Phone numbers inside the message may lead to the scammer'],
      todo: ['Use the number on the back of your card, a bill, or the official app', 'For family: call their usual number, or ask a question only they’d know', 'Agree a family “safe word” for emergencies'] },
    { id: 'basics-help', basic: true, icon: '🆘', title: 'If you’ve been scammed',
      how: 'It happens to smart people every day - scammers are professionals. Acting fast can stop payments and protect your accounts.',
      flags: ['Shame keeps people silent - that only helps the scammer'],
      todo: ['Call your bank or card issuer immediately using the number on your card', 'Change passwords (start with email) and turn on 2FA', 'If you installed a remote-access app, disconnect from the internet and get help', 'Report it to your local police / national fraud-reporting service', 'Warn friends and family - scammers often retry'] },

    /* --- Scam families (unlock on encounter) --- */
    { id: 'delivery', cat: 'delivery', icon: '📦', title: 'Fake delivery notices',
      how: 'A text or card says your parcel is stuck and asks for a tiny fee or “address confirmation”. The link steals your card details - the small amount makes you relax.',
      flags: ['Random sender number', 'Small fee ($1-$4) to “redeliver”', 'Link that isn’t the courier’s real domain', 'You aren’t expecting anything'],
      todo: ['Check tracking in the store or courier app you actually used', 'Redelivery is normally free', 'Report and delete'] },
    { id: 'bank', cat: 'bank', icon: '🏦', title: 'Bank impersonation & “safe account”',
      how: 'Scammers pose as your bank’s fraud team, often spoofing the caller ID. They create panic about a fake fraud, then get you to share codes or move money into a “safe account” they control.',
      flags: ['Asks you to move money to “protect” it', 'Asks for PIN, password or codes', 'Tells you not to trust branch staff', 'Links to “verify your account”'],
      todo: ['Hang up and call the number on the back of your card', 'Your bank will never ask you to move money to keep it safe'] },
    { id: 'otp', cat: 'otp', icon: '🔢', title: 'Code theft (OTP scams)',
      how: 'The scammer triggers a real login code to your phone, then tricks you into sharing it - pretending to be a friend, a buyer, a bank or a contest.',
      flags: ['Any request to send, read or forward a code', 'A real-looking code text followed by a call'],
      todo: ['Never share codes', 'Secure the account if you get codes you didn’t request'] },
    { id: 'tech', cat: 'tech', icon: '🖥️', title: 'Fake tech support',
      how: 'A pop-up, call or email claims your device is infected or your account was hacked. They get you to install a remote-access app, then “find” problems, take payment or move money from your bank.',
      flags: ['Unsolicited call about a virus', 'Asks you to install a remote-access app', 'Fake refund “overpayment” you must return in gift cards'],
      todo: ['Hang up - real companies don’t cold-call about viruses', 'Never install apps a caller asks for', 'Close pop-ups (force-quit the browser if needed)'] },
    { id: 'romance', cat: 'romance', icon: '💘', title: 'Romance scams',
      how: 'A charming stranger builds an intense online relationship over weeks. There’s always a reason they can’t video call or meet. Eventually an emergency or an “investment” needs your money.',
      flags: ['Love-bombing very early', 'Never available for video calls', 'Works far away (oil rig, military, overseas doctor)', 'Money requests, gift cards, crypto', 'Asks you to keep it secret'],
      todo: ['Reverse-image-search their photos', 'Never send money to someone you haven’t met in person', 'Talk to a friend you trust'] },
    { id: 'family', cat: 'family', icon: '📱', title: '“Hi Mum” & AI voice clones',
      how: 'A “new number” text or a panicked call that sounds exactly like a loved one (AI can clone voices from short clips) says they’re in trouble and need money fast - and secretly.',
      flags: ['New number / new account', 'Emergency + urgency', 'Secrecy (“don’t tell Dad”)', 'Unusual payment: transfer to a friend, cash courier, gift cards'],
      todo: ['Hang up and call them on their usual number', 'Ask a question only they would know', 'Set a family safe word today'] },
    { id: 'job', cat: 'job', icon: '💼', title: 'Job & task scams',
      how: 'Fake recruiters offer easy remote work. Either you pay “fees” for equipment/training, or you do “tasks” and see fake earnings that need deposits to unlock.',
      flags: ['Job offered without an interview', 'Pay to start, pay to withdraw', 'Chat-only “interviews”', 'Checks to deposit and forward'],
      todo: ['Real employers never charge you', 'Look up the company yourself', 'Never deposit a check and send money back'] },
    { id: 'crypto', cat: 'crypto', icon: '📈', title: 'Crypto investment scams',
      how: 'Fake mentors, trading groups and slick platforms show huge “profits” on a dashboard. When you try to withdraw, new taxes and fees appear - and the money never comes out.',
      flags: ['Guaranteed or huge returns', 'Unsolicited “mentor”', 'Platform you’ve never heard of', 'Fees or “tax” to withdraw', 'Asks for your recovery phrase'],
      todo: ['Never share your recovery phrase', 'Only use well-known platforms you find yourself', 'If you can’t withdraw, stop depositing'] },
    { id: 'market', cat: 'market', icon: '🛒', title: 'Marketplace scams',
      how: 'Buyers “overpay” with fake payments, push you to fake payment-app emails, or ask for a verification code. Sellers demand payment off-platform for items that never arrive.',
      flags: ['Overpayment + “send the difference”', 'Fake payment emails asking for fees', 'Won’t see the item / won’t meet', '“Friends & family” payments only', 'Asks for a code to “prove you’re real”'],
      todo: ['Use in-app checkout or meet in a public place', 'Check payments in the real app, not via email', 'Never share codes'] },
    { id: 'qr', cat: 'qr', icon: '🔳', title: 'QR code scams (“quishing”)',
      how: 'Fake QR stickers on parking meters, posters or unexpected mail lead to lookalike payment or login pages.',
      flags: ['Sticker placed over another code', 'Code in unexpected mail', 'The link preview isn’t the official domain'],
      todo: ['Check the preview link before opening', 'Use the official app or type the address', 'Report tampered codes to the operator'] },
    { id: 'prize', cat: 'prize', icon: '🎉', title: 'Prize & giveaway scams',
      how: 'You “won” something you never entered. To claim it you pay a fee, share card details, or log in on a fake page.',
      flags: ['You never entered', 'Pay to receive a prize', 'Copycat giveaway accounts'],
      todo: ['If you have to pay, it’s not a prize', 'Check the organiser’s official page yourself'] },
    { id: 'gov', cat: 'gov', icon: '🏛️', title: 'Tax, toll & government scams',
      how: 'Messages claim you owe a toll, a fine or tax - or that a refund is waiting. Calls threaten arrest. All push you to pay fast via links or untraceable methods.',
      flags: ['Threats of arrest, fines or license loss', 'Gift cards / crypto / wire', 'Surprise refunds needing bank details'],
      todo: ['Government agencies write first and never take gift cards', 'Log in to the official site by typing it yourself'] },
    { id: 'account', cat: 'account', icon: '🔐', title: 'Account & subscription phishing',
      how: 'Fake “payment failed”, “account suspended”, “copyright violation” or “big order” messages send you to lookalike login pages to steal your password.',
      flags: ['Suspension threats with deadlines', 'Lookalike sender and links', 'Fake orders you’re meant to “cancel”'],
      todo: ['Open the official app to check', 'Turn on 2FA everywhere', 'Use a password manager - it won’t autofill on fake sites'] },
    { id: 'invoice', cat: 'invoice', icon: '🧾', title: 'Fake invoices & refunds',
      how: '“Callback phishing”: a fake invoice for something expensive makes you call their “refund desk”. Then they ask for remote access or bank details.',
      flags: ['Invoice for something you never bought', 'Phone number to “cancel”', 'Free-mail sender address'],
      todo: ['Check your real account/bank statement', 'Never call numbers from suspicious invoices'] },
    { id: 'charity', cat: 'charity', icon: '🤲', title: 'Fake charities',
      how: 'After disasters, fake charities and lookalike donation pages appear, using emotional stories and pressure.',
      flags: ['Gift cards / crypto only', 'Guilt-tripping', 'Thanks you for a pledge you never made', 'Lookalike names'],
      todo: ['Give through the charity’s official site you type yourself', 'Check it’s a registered charity'] }
  ];

  function G() { return RF.store.data.guide; }

  RF.guide = {
    ENTRIES: ENTRIES,
    isUnlocked: function (e) { return e.basic || !!G()[e.cat]; },
    unlock: function (cat) {
      if (!cat || G()[cat]) return false;
      G()[cat] = Date.now(); RF.store.save();
      RF.bus.emit('guide-unlock', cat);
      return true;
    },
    count: function () { return ENTRIES.filter(RF.guide.isUnlocked).length; },
    byCat: function (cat) { return ENTRIES.filter(function (e) { return e.cat === cat; })[0] || null; }
  };
})(window.RedFlag);
