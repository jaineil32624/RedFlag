/*
 * content/templates-legit.js
 * LEGIT scenario templates - including tricky "scary but real" ones
 * (genuine fraud alerts, real 2FA codes you requested, real delivery
 * notices on the official domain) so the game never teaches
 * "everything is a scam". Same markup as templates-scam.js; green
 * flags use [[+type|text]].
 */
(function (RF) {
  'use strict';

  var T = [
    /* 📦 Delivery */
    { id: 'L-del-eta-sms', cat: 'delivery', ch: 'sms', diff: 1, brand: 'courier',
      ctx: 'You ordered shoes from {{b:shop}} two days ago.',
      from: '[[+official|{{brand}}]]',
      body: '{{brand}}: Your parcel {{trk}} from {{b:shop}} arrives {{day}} between 1-5 PM. [[+verify|Track it in the {{brand}} app or at {{domain}}]]. [[+noask|No action needed.]]',
      lesson: 'Expected order, official domain, nothing to pay, no pressure. A normal delivery update.' },
    { id: 'L-del-done-email', cat: 'delivery', ch: 'email', diff: 2, brand: 'courier',
      ctx: 'You’re expecting a parcel today.',
      from: '{{brand}}', addr: '[[+official|notifications@{{domain}}]]',
      subject: 'Delivered: your parcel {{trk}}',
      body: 'Hi {{you}},\nYour parcel was delivered at {{time}} and left in your safe place (front porch).\n[[+calm|If something’s wrong, you can report it any time in the {{brand}} app.]]\n[[+noask|We’ll never ask for payment or card details by email or text.]]',
      lesson: 'Exact official domain, matches what you expected, and it explicitly says it never asks for payment.' },
    { id: 'L-del-card-qr', cat: 'delivery', ch: 'qr', diff: 3, brand: 'courier',
      ctx: 'You were out when a delivery was attempted; this card was in your mailbox.',
      body: '{{brand}} - Sorry we missed you.\nWe’ll try again tomorrow, or rebook for free.\n[[+noask|There is no fee to rebook. We never ask for payment by text or QR.]]',
      qr: '[[+official|https://{{domain}}/rebook]]',
      lesson: 'The QR goes to the exact official domain and there’s no fee - but still prefer typing the address or using the app.' },

    /* 🏦 Bank */
    { id: 'L-bank-yn-sms', cat: 'bank', ch: 'sms', diff: 2, brand: 'bank',
      from: '[[+official|{{brand}}]]',
      body: '{{brand}} Fraud Alert: Did you try to pay {{amt}} at {{b:shop}} on {{date}}? Reply Y or N. [[+noask|We will never ask for your PIN, password or a one-time code.]] [[+verify|Questions? Call the number on the back of your card.]]',
      lesson: 'Real fraud alerts ask a simple yes/no, include no links, and tell you to use the number on your card.' },
    { id: 'L-bank-statement-email', cat: 'bank', ch: 'email', diff: 2, brand: 'bank',
      from: '{{brand}}', addr: '[[+official|statements@{{domain}}]]',
      subject: 'Your monthly statement is ready',
      body: 'Hi {{you}},\nYour statement for the account ending {{last4}} is ready.\n[[+verify|To view it, open the {{brand}} app or type {{domain}} into your browser.]]\n[[+noask|This email contains no links and we will never ask for your details by email.]]',
      lesson: 'No links, no requests - it points you to the app you already trust.' },
    { id: 'L-bank-callback-vm', cat: 'bank', ch: 'voicemail', diff: 3, brand: 'bank',
      from: '{{brand}}',
      body: 'Hello, this is an automated message from {{brand}} about your card ending {{last4}}. We’ve noticed an unusual payment. [[+verify|Please call us using the number on the back of your card or in the {{brand}} app.]] [[+noask|We will never ask you to move money or share passcodes.]]',
      lesson: 'Scary topic, but it sends you to a number YOU already have and asks for nothing.' },

    /* 🔢 Codes */
    { id: 'L-otp-code-sms', cat: 'otp', ch: 'sms', diff: 1, brand: 'social',
      ctx: '[[+expected|You just tapped “Log in” on {{brand}} on your phone.]]',
      from: '{{brand}}',
      body: '{{code}} is your {{brand}} login code. [[+noask|Don’t share it with anyone - {{brand}} staff will never ask for it.]]',
      lesson: 'You requested it, and it tells you not to share it. Type it into the app yourself - that’s exactly what it’s for.' },
    { id: 'L-otp-newsignin-email', cat: 'otp', ch: 'email', diff: 2, brand: 'stream',
      ctx: '[[+expected|You just signed in on a new TV.]]',
      from: '{{brand}}', addr: '[[+official|account@{{domain}}]]',
      subject: 'New sign-in to your account',
      body: 'We noticed a new sign-in from a TV in {{city}}.\n[[+calm|If this was you, you don’t need to do anything.]]\n[[+verify|If not, open the {{brand}} app and go to Settings › Security to change your password.]]',
      lesson: 'Matches what you just did, sends you to the app (not a link), no pressure.' },

    /* 🖥️ Tech */
    { id: 'L-tech-pwchange-email', cat: 'tech', ch: 'email', diff: 2, brand: 'tech',
      ctx: '[[+expected|You changed your {{brand}} password two minutes ago.]]',
      from: '{{brand}} Account', addr: '[[+official|no-reply@{{domain}}]]',
      subject: 'Your password was changed',
      body: 'Hi {{you}}, the password for your {{brand}} account was changed on {{date}} at {{time}}.\n[[+verify|If you didn’t do this, go to {{domain}}/security by typing it into your browser.]]',
      lesson: 'Security notices after something YOU did are normal - they point to the official domain.' },
    { id: 'L-tech-ticket-sms', cat: 'tech', ch: 'sms', diff: 3, brand: 'tech',
      ctx: '[[+expected|You opened a support ticket on the {{brand}} website yesterday.]]',
      from: '{{brand}}',
      body: '{{brand}} Support: Ticket #{{ref}} has been answered. View the reply in your account at {{domain}}. [[+noask|We never call unsolicited or ask for remote access.]]',
      lesson: 'You started the conversation, and it sends you to your account on the official site.' },

    /* 💘 Romance (healthy) */
    { id: 'L-rom-coffee-dm', cat: 'romance', ch: 'dm', diff: 2, brand: 'dating',
      ctx: 'You matched with {{p1f}} on {{brand}} last week and video-chatted twice.',
      from: '[[+known|{{p1f}}]]',
      body: 'I had a lot of fun on our video call 😊\n[[+calm|Want to grab coffee at the Corner Café on {{day}}? Somewhere public is good for a first meet.]]',
      lesson: 'Video calls happened, they suggest a public place, and money never comes up. That’s a normal date.' },

    /* 📱 Family */
    { id: 'L-fam-landed-sms', cat: 'family', ch: 'sms', diff: 1, brand: 'bank',
      from: '[[+known|Mom ❤️ (saved contact)]]',
      body: 'Landed safe! Call you after dinner 😘 [[+noask|Don’t forget to water my plants!]]',
      lesson: 'A saved contact, normal news, nothing requested.' },
    { id: 'L-fam-late-vm', cat: 'family', ch: 'voicemail', diff: 3, brand: 'bank',
      from: '[[+known|{{kid}} (saved contact)]]',
      body: 'Hey, it’s me - phone’s on 5% so quick one. Practice ran late, I’ll be home around 8. [[+noask|No need to call back,]] love you!',
      lesson: 'Calls from a saved number with no request for money or secrecy are fine. (If something feels off, call them back.)' },
    { id: 'L-fam-pickup-sms', cat: 'family', ch: 'sms', diff: 3, brand: 'bank',
      from: '[[+known|{{kid}} 🏀 (saved contact)]]',
      body: 'Can you pick me up at 6 instead of 5? Coach kept us late. [[+calm|If not I’ll get the bus, no stress]]',
      lesson: 'Known number, ordinary request, no pressure, no money.' },

    /* 💼 Job */
    { id: 'L-job-interview-job', cat: 'job', ch: 'job', diff: 2, brand: 'job',
      ctx: '[[+expected|You applied for a Junior Designer role at {{b:shop}} via {{brand}}.]]',
      from: '[[+official|{{p1}} · {{b:shop}} Talent Team (verified employer)]]',
      subject: 'Interview invitation',
      body: 'Hi {{you}}, thanks for your application! We’d love to book a 30-minute video interview with our design lead on {{day}}.\nPlease pick a slot in the {{brand}} app.\n[[+noask|There is never a fee to apply or interview with us.]]',
      lesson: 'You applied, it’s a verified employer, and there’s an actual interview - with no fees.' },
    { id: 'L-job-offer-email', cat: 'job', ch: 'email', diff: 3, brand: 'shop',
      ctx: '[[+expected|You had two video interviews with {{brand}} last week.]]',
      from: '{{brand}} People Team', addr: '[[+official|careers@{{domain}}]]',
      subject: 'Your offer from {{brand}}',
      body: 'Hi {{you}}, we’re delighted to offer you the role we discussed!\nYour formal offer letter is waiting in the candidate portal on {{domain}}.\n[[+noask|You don’t need to pay for anything - equipment is provided on your first day.]]',
      lesson: 'Real interviews came first, official domain, and they cover equipment rather than charging for it.' },

    /* 📈 Crypto */
    { id: 'L-cry-withdraw-email', cat: 'crypto', ch: 'email', diff: 2, brand: 'crypto',
      ctx: '[[+expected|You just requested a withdrawal in the {{brand}} app.]]',
      from: '{{brand}}', addr: '[[+official|no-reply@{{domain}}]]',
      subject: 'Withdrawal confirmed',
      body: 'Your withdrawal of 0.05 {{coin}} has been processed.\n[[+noask|{{brand}} staff will never ask for your password, 2FA codes or recovery phrase.]]',
      lesson: 'Matches your action, official domain, and a clear “we never ask” statement.' },
    { id: 'L-cry-alert-crypto', cat: 'crypto', ch: 'crypto', diff: 2, brand: 'crypto',
      ctx: '[[+expected|You set a price alert in the {{brand}} app last month.]]',
      from: '{{brand}} App',
      body: 'Price alert: {{coin}} moved 5% in the last 24 hours. [[+calm|Open the app to view your alert settings.]]',
      lesson: 'An alert you set yourself, no link, no promises, no pressure.' },

    /* 🛒 Marketplace */
    { id: 'L-mkt-cash-market', cat: 'market', ch: 'market', diff: 2, brand: 'market', listing: true,
      ctx: 'You are selling a {{item}} on SwapSpot.',
      from: '[[+known|{{p1f}} · ★4.9 (52 reviews)]]',
      body: 'Hi! Is the {{item}} still available?\n[[+calm|Could I come and see it on {{day}} afternoon? I’d pay the asking price in person if it’s as described.]]',
      lesson: 'Wants to see it first, pays in person, has a track record. Classic genuine buyer.' },
    { id: 'L-mkt-checkout-market', cat: 'market', ch: 'market', diff: 3, brand: 'market', listing: true,
      ctx: 'You are selling a {{item}} on SwapSpot.',
      from: '{{p1f}} · ★4.7 (18 reviews)',
      body: 'Hey, I’m keen on the {{item}}! [[+official|I’ll pay through SwapSpot checkout so we both get buyer/seller protection.]] [[+noask|You’ll get the notification in the app.]]',
      lesson: 'Paying inside the official app keeps protection on - the opposite of the off-platform push scammers use.' },

    /* 🔳 QR */
    { id: 'L-qr-menu-qr', cat: 'qr', ch: 'qr', diff: 2, brand: 'shop',
      ctx: 'This code is printed on the till screen inside a {{brand}} store.',
      body: '{{brand}} - Today’s specials\nScan to see this week’s deals.\n[[+noask|No login or payment needed.]]',
      qr: '[[+official|https://{{domain}}/deals]]',
      lesson: 'Printed in-store, decodes to the exact official domain, and asks for nothing.' },
    { id: 'L-qr-parking-qr', cat: 'qr', ch: 'qr', diff: 3, brand: 'toll',
      ctx: 'The code is printed into the metal sign (not a sticker).',
      body: '{{brand}} - Pay for parking\n[[+verify|Use the official {{brand}} app or {{domain}}. Check that this code isn’t a sticker before scanning.]]',
      qr: '[[+official|https://{{domain}}/zone/{{num}}{{num}}]]',
      lesson: 'Official domain, printed into the sign, and it even reminds you to check for stickers.' },

    /* 🎉 Prize */
    { id: 'L-prz-raffle-email', cat: 'prize', ch: 'email', diff: 3, brand: 'shop',
      ctx: '[[+expected|You entered a raffle at the {{brand}} store in {{city}} last weekend.]]',
      from: '{{brand}} {{city}}', addr: '[[+official|events@{{domain}}]]',
      subject: 'You won our in-store raffle! 🎉',
      body: 'Hi {{you}}, congratulations - you won the {{amt}} store voucher from our {{city}} raffle!\n[[+noask|Just bring your raffle ticket to the store to collect. There are no fees.]]',
      lesson: 'You DID enter, it’s from the official domain, and collecting costs nothing.' },

    /* 🏛️ Gov */
    { id: 'L-gov-received-email', cat: 'gov', ch: 'email', diff: 2, brand: 'gov',
      ctx: '[[+expected|You filed your tax return online last week.]]',
      from: '{{brand}}', addr: '[[+official|no-reply@{{domain}}]]',
      subject: 'We received your tax return',
      body: 'Thank you, your return for {{year}} was received and is being processed.\n[[+verify|To check its status, sign in at {{domain}} by typing the address yourself.]]\n[[+noask|We never ask for payment by gift card, crypto or wire.]]',
      lesson: 'Expected, official domain, no links, and it states how they do NOT ask for payment.' },
    { id: 'L-gov-toll-sms', cat: 'gov', ch: 'sms', diff: 3, brand: 'toll',
      ctx: 'You have a {{brand}} toll account with autopay.',
      from: '{{brand}}',
      body: '{{brand}}: Your monthly statement is ready in the {{brand}} app. Autopay will cover {{small}} on {{date}}. [[+noask|We never text payment links.]]',
      lesson: 'Matches your account, no link, nothing to do.' },

    /* 🔐 Account */
    { id: 'L-acc-receipt-email', cat: 'account', ch: 'email', diff: 1, brand: 'stream',
      ctx: '[[+expected|You pay for a {{brand}} subscription every month.]]',
      from: '{{brand}}', addr: '[[+official|billing@{{domain}}]]',
      subject: 'Your receipt from {{brand}}',
      body: 'Thanks {{you}}! We charged {{sub}} for your monthly plan.\n[[+calm|Manage your plan any time in Account settings.]]',
      lesson: 'An ordinary receipt for something you pay for, from the official domain.' },
    { id: 'L-acc-reset-sms', cat: 'account', ch: 'sms', diff: 2, brand: 'social',
      ctx: '[[+expected|You just tapped “Forgot password” in the {{brand}} app.]]',
      from: '{{brand}}',
      body: '{{code}} is your {{brand}} password reset code. [[+noask|Don’t share this code with anyone.]]',
      lesson: 'You asked for it - enter it in the app and nowhere else.' },
    { id: 'L-acc-shipped-email', cat: 'account', ch: 'email', diff: 3, brand: 'shop',
      ctx: '[[+expected|You ordered headphones on {{brand}} yesterday.]]',
      from: '{{brand}}', addr: '[[+official|orders@{{domain}}]]',
      subject: 'Your order #{{ref}} has shipped',
      body: 'Good news {{you}} - your headphones are on the way!\n[[+verify|Track your order under Your Orders in the {{brand}} app.]]',
      lesson: 'Same subject line scammers copy - but this matches your real order and comes from the exact domain.' },

    /* 🧾 Invoice */
    { id: 'L-inv-bill-email', cat: 'invoice', ch: 'email', diff: 2, brand: 'utility',
      ctx: 'You are a {{brand}} customer.',
      from: '{{brand}}', addr: '[[+official|bills@{{domain}}]]',
      subject: 'Your bill is ready',
      body: 'Hi {{you}}, your bill of {{amt}} is ready and due on {{date}}.\n[[+verify|Pay in the {{brand}} app or at {{domain}}.]] [[+calm|Need more time? Payment plans are available.]]',
      lesson: 'Normal bill, normal due date, normal ways to pay - and even offers more time.' },

    /* 🤲 Charity */
    { id: 'L-cha-receipt-email', cat: 'charity', ch: 'email', diff: 2, brand: 'charity',
      ctx: '[[+expected|You donated to {{brand}} on their website last week.]]',
      from: '{{brand}}', addr: '[[+official|receipts@{{domain}}]]',
      subject: 'Thank you for your donation',
      body: 'Dear {{you}}, thank you for your gift of {{amt}}. Your receipt number is {{ref}}.\n[[+calm|There’s nothing else you need to do.]]',
      lesson: 'A receipt for a donation you made, from the exact official domain.' }
  ];

  T.forEach(function (t) { t.scam = false; });
  RF.templates = RF.templates || {};
  RF.templates.legit = T;
})(window.RedFlag);
