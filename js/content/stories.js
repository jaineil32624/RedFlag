/*
 * content/stories.js
 * Story Mode "Case Files". Each chapter = a short themed card round
 * followed by an interactive BOSS: a branching chat or phone call.
 *
 * Boss node format:
 *   { day?, pressure?, msgs: [{from:'them'|'sys', text}], choices: [
 *       { text, next, good: true|false|null, loss?: dollars, note } ] }
 * Ending node: { end: 'safe'|'lost', title, text }
 * A 'safe' ending reached after losing money becomes a "partial" result.
 * All names, companies and amounts are fictional.
 */
(function (RF) {
  'use strict';

  var CHAPTERS = [
    /* ───────────── Case 1: Hi Mum ───────────── */
    { id: 'c1', num: 1, icon: '📱', title: 'Hi Mum, New Number', cat: 'family', cats: ['family', 'otp'],
      intro: 'Families are being targeted by “new number” texts and AI-cloned voices that sound exactly like a loved one. Spot the fakes, then survive the call.',
      boss: { type: 'call', name: 'Unknown number', subtitle: 'Incoming call · Mobile', avatar: '📞', start: 'n1',
        nodes: {
          n1: { pressure: 30, msgs: [
              { from: 'them', text: 'Mum? Mum, it’s me… I’m so sorry, I’m in a real mess.' },
              { from: 'sys', text: 'It sounds EXACTLY like your daughter, Mia. The number is unknown.' }],
            choices: [
              { text: 'I’ll call you right back on your usual number.', next: 'safe1', good: true, note: 'Perfect. Calling back on a number you already know beats any voice clone.' },
              { text: 'Mia? What’s wrong? Whose phone is this?', next: 'n2', good: null, note: 'A natural reaction - but the unknown number is already a warning sign.' },
              { text: 'Oh no! How much do you need?', next: 'n2', good: false, note: 'Offering money before verifying plays right into the script.' }] },
          n2: { pressure: 55, msgs: [
              { from: 'them', text: 'I crashed into someone’s car. The police took my phone - this is the lawyer’s. I need $3,000 for bail right now or I stay in a cell tonight.' }],
            choices: [
              { text: 'Before anything: what’s our family safe word?', next: 'safe2', good: true, note: 'A family safe word is the best defence against AI voice clones.' },
              { text: 'Put the lawyer on.', next: 'n3', good: null, note: 'A second “official” voice adds fake authority - a classic step.' },
              { text: 'Okay, how do I pay?', next: 'n3', good: false, note: 'Panic is the scammer’s best friend. Slow down and verify.' }] },
          n3: { pressure: 75, msgs: [
              { from: 'them', text: 'Ma’am, Daniel Grant, public defender. Bail must be paid in cash today. A courier will collect it from your house within the hour.' },
              { from: 'them', text: 'And please don’t tell anyone - the case has a gag order.' }],
            choices: [
              { text: 'A courier collecting cash from my home? That’s not how bail works. I’m hanging up.', next: 'safe3', good: true, note: 'Exactly. Cash couriers + secrecy = scam, every time.' },
              { text: 'Can I pay by card instead?', next: 'n4', good: false, note: 'They’ll refuse traceable payments - or switch to gift cards.' },
              { text: 'I’ll withdraw the cash now.', next: 'n4', good: false, loss: 3000, note: 'The “courier” takes $3,000. Real bail is never collected at your door.' }] },
          n4: { pressure: 95, msgs: [
              { from: 'them', text: 'The courier is on the way. Also the other driver’s hospital bill - another $2,000. Buy PlayVault gift cards and read me the codes, quickly!' }],
            choices: [
              { text: 'Stop. I’m calling Mia’s real number first.', next: 'safe4', good: true, note: 'Mia answers from school, confused and totally fine.' },
              { text: 'Buy the gift cards and read out the codes.', next: 'lost', good: false, loss: 2000, note: 'Gift-card codes are spent within minutes and can’t be recovered.' }] },
          safe1: { end: 'safe', title: 'Call verified - scam stopped!', text: 'You called Mia’s usual number. She was at school, totally fine. The voice was an AI clone made from her social videos.' },
          safe2: { end: 'safe', title: 'Safe word saved the day!', text: '“Safe word? Uh…” - the line goes dead. Set up a family safe word today; it costs nothing and beats any clone.' },
          safe3: { end: 'safe', title: 'You hung up - smart move!', text: 'You hang up and call Mia. She’s fine. Real legal processes never send couriers to collect cash.' },
          safe4: { end: 'safe', title: 'You finally verified', text: 'Mia was safe all along. Report the number to your carrier and police, and warn family members.' },
          lost: { end: 'lost', title: 'The money is gone', text: 'Mia calls that evening - she was never in trouble. Voice cloning needs only seconds of audio. Next time: hang up, call back on a known number, use a safe word.' }
        } } },

    /* ───────────── Case 2: Marketplace ───────────── */
    { id: 'c2', num: 2, icon: '🛒', title: 'The Overpaying Buyer', cat: 'market', cats: ['market', 'otp'],
      intro: 'Selling stuff online? Scammers posing as buyers love fake payments, overpayments and “verification codes”. Learn the moves, then sell a bike safely.',
      boss: { type: 'chat', name: 'Jordan_buys_fast', subtitle: 'SwapSpot · Your listing: Vintage road bike · $240', avatar: '🛒', start: 'n1',
        nodes: {
          n1: { msgs: [{ from: 'them', text: 'Hi! Is the bike still available? I’ll take it, no need to see it 😊' }],
            choices: [
              { text: 'Sure! Come see it first - cash on pickup.', next: 'n2', good: true, note: 'Inviting an in-person, cash or in-app sale is the safest move.' },
              { text: 'Yes! How do you want to pay?', next: 'n2', good: null, note: 'Fine - but watch what payment method they suggest.' },
              { text: 'Yes, send me the money and I’ll ship it anywhere.', next: 'n2', good: false, note: 'Shipping to strangers off-platform removes your protection.' }] },
          n2: { msgs: [{ from: 'them', text: 'I work offshore so my mover will collect it. I’m sending $640 via PayPing - the extra $400 is for the mover, you just send it to him 👍' }],
            choices: [
              { text: 'No overpayments. Exact price through SwapSpot checkout, or no deal.', next: 'safe1', good: true, note: 'Overpayment is THE red flag. Insisting on in-app checkout ends the scam.' },
              { text: 'Okay, send it over.', next: 'n3', good: null, note: 'Careful - the “payment” that arrives may not be real.' },
              { text: 'Sure, what’s the mover’s account?', next: 'n3', good: false, note: 'Agreeing to forward money is exactly what they want.' }] },
          n3: { msgs: [
              { from: 'sys', text: '📧 New email from service@payping-secure-mail.com: “Payment of $640 pending. Seller must send $400 to the buyer’s agent to release funds.”' },
              { from: 'them', text: 'Did you get the PayPing email? Please send the $400 quickly, the mover is waiting!' }],
            choices: [
              { text: 'Check my balance in the real PayPing app.', next: 'safe2', good: true, note: 'Always check the real app. The balance shows $0 - the email was fake.' },
              { text: 'Tap the link in the email.', next: 'n4', good: false, note: 'That address isn’t payping.com - it’s a lookalike.' },
              { text: 'Send the $400 to the mover.', next: 'lost', good: false, loss: 400, note: 'There was never any $640. Your $400 is gone.' }] },
          n4: { msgs: [
              { from: 'sys', text: 'The page asks for your PayPing password and the 6-digit code just texted to you.' },
              { from: 'them', text: 'Just log in and confirm the code, then the funds release!' }],
            choices: [
              { text: 'Close it, block and report the buyer.', next: 'safe3', good: true, note: 'Good recovery. Never enter logins or codes on pages from links.' },
              { text: 'Enter my password and the code.', next: 'lost', good: false, loss: 1200, note: 'With your password AND code they took over your account and drained $1,200.' }] },
          safe1: { end: 'safe', title: 'Scammer gave up!', text: '“Never mind 🙄” - they vanish. A real buyer who pays through checkout bought the bike two days later.' },
          safe2: { end: 'safe', title: 'Fake payment exposed!', text: 'Your real PayPing balance: $0. The email came from a lookalike domain. You report and block the “buyer”.' },
          safe3: { end: 'safe', title: 'Close call!', text: 'You backed out before entering anything. Report the email as phishing and the buyer on SwapSpot.' },
          lost: { end: 'lost', title: 'Sold… to a scammer', text: 'The “payment” was a fake email all along. Rules to remember: no overpayments, check payments in the real app, never share codes.' }
        } } },

    /* ───────────── Case 3: Tech support ───────────── */
    { id: 'c3', num: 3, icon: '🖥️', title: 'Fake Tech Support', cat: 'tech', cats: ['tech', 'invoice'],
      intro: 'Pop-ups, invoices and calls claim your device is hacked. The goal: remote access to your computer and your bank. Watch the pressure meter - they’ll push hard.',
      boss: { type: 'call', name: '“Orbix Support”', subtitle: 'Incoming call · (206) 555-0143', avatar: '🖥️', start: 'n1',
        nodes: {
          n1: { pressure: 30, msgs: [{ from: 'them', text: 'Hello, this is David from Orbix Technical Department. Our servers show your computer is sending virus alerts. Are you in front of your computer now?' }],
            choices: [
              { text: 'Orbix doesn’t cold-call people. I’m hanging up.', next: 'safe1', good: true, note: 'Correct - tech companies never call you about viruses.' },
              { text: 'Yes… what’s wrong?', next: 'n2', good: null, note: 'Staying on the line gives them a chance to build fear.' },
              { text: 'Oh no! Is my data okay?!', next: 'n2', good: false, note: 'Panic is exactly what they’re going for.' }] },
          n2: { pressure: 55, msgs: [{ from: 'them', text: 'Very serious - hackers are inside right now. Press the Windows key and R, then type what I say so I can show you the infection.' }],
            choices: [
              { text: 'I’ll get it checked by someone I trust. Goodbye.', next: 'safe2', good: true, note: 'Great. Never follow typing instructions from an unsolicited caller.' },
              { text: 'What’s your callback number?', next: 'n3', good: null, note: 'They’ll happily give you a number - that leads straight back to them.' },
              { text: 'Okay, I typed it.', next: 'n3', good: false, note: 'Those “errors” they show you are normal system logs.' }] },
          n3: { pressure: 75, msgs: [{ from: 'them', text: 'You see all those errors? Now please install AnyAssist from anyassist-help.top so our engineer can repair it. It is free.' }],
            choices: [
              { text: 'No. I’m not installing anything a caller asks for.', next: 'safe3', good: true, note: 'Exactly right. Remote access = they control everything.' },
              { text: 'Installing now…', next: 'n4', good: false, note: 'They now have full control of your computer.' }] },
          n4: { pressure: 95, msgs: [
              { from: 'them', text: 'Fixed! Now we refund $199 for the trouble. Log in to your bank so I can deposit it…' },
              { from: 'them', text: 'OH NO! I typed $1,999 by mistake! You must return $1,800 in gift cards or I lose my job!!' }],
            choices: [
              { text: 'Unplug the internet, hang up and call my bank on the number on my card.', next: 'safe4', good: true, note: 'Best possible recovery. The “refund” was your own money moved between accounts.' },
              { text: 'Buy the gift cards to help him.', next: 'lost', good: false, loss: 1800, note: 'The “overpayment” was faked using remote access. The gift cards are gone.' }] },
          safe1: { end: 'safe', title: 'Hung up - scam stopped!', text: 'The fastest win. Real tech companies don’t monitor your PC and call you.' },
          safe2: { end: 'safe', title: 'You walked away!', text: 'No damage done. Block the number and report it.' },
          safe3: { end: 'safe', title: 'Access denied!', text: 'You refused remote access - the scam collapses. Still, run your normal antivirus and change any passwords you typed.' },
          safe4: { end: 'safe', title: 'Damage contained', text: 'You disconnected and called your bank, who froze the transfers. Get the computer cleaned and change passwords from another device.' },
          lost: { end: 'lost', title: 'Refund scam complete', text: 'They used remote access to move money between your accounts to fake an “overpayment”. Never install apps for callers; never pay with gift cards.' }
        } } },

    /* ───────────── Case 4: Job fee ───────────── */
    { id: 'c4', num: 4, icon: '💼', title: 'The Job That Needs a Fee', cat: 'job', cats: ['job', 'crypto'],
      intro: 'Easy money, no interview, start today… then the fees begin. Learn to spot fake recruiters before they spot your bank account.',
      boss: { type: 'chat', name: 'Laura Chen · Recruiter', subtitle: 'HireHub · Account created 3 days ago', avatar: '💼', start: 'n1',
        nodes: {
          n1: { msgs: [{ from: 'them', text: 'Hi! Your profile is impressive 🌟 We have a remote Data Entry role: $450/day, flexible hours. Interested?' }],
            choices: [
              { text: 'Which company? I’ll look it up and apply on their official site.', next: 'n2', good: true, note: 'Great instinct - real roles are listed on the company’s own careers page.' },
              { text: 'Yes!! When can I start?', next: 'n2', good: false, note: '$450/day for data entry is far above normal pay - too good to be true.' },
              { text: 'What exactly would I do?', next: 'n2', good: null, note: 'Fair question. Notice how vague the answer is.' }] },
          n2: { msgs: [{ from: 'them', text: 'It’s a confidential client 😊 No interview needed - you’re pre-approved! Just fill in this onboarding form with your ID, date of birth and bank details.' }],
            choices: [
              { text: 'Real jobs interview you first. I won’t send my ID.', next: 'safe1', good: true, note: 'Right. “No interview” + ID request = identity theft risk.' },
              { text: 'Can we do a video interview first?', next: 'n3', good: null, note: 'Smart test - watch them dodge it.' },
              { text: 'Sends ID, date of birth and bank details.', next: 'n3', good: false, note: 'Your identity can now be used to open accounts. Monitor your credit.' }] },
          n3: { msgs: [
              { from: 'them', text: 'Manager is travelling, no calls this week 🙏 To receive your work laptop, pay a refundable $180 equipment fee via CashDash. Reimbursed with your first paycheck!' }],
            choices: [
              { text: 'Employers never charge you to start. No.', next: 'safe2', good: true, note: 'The #1 rule of job scams: you never pay to get paid.' },
              { text: 'Pay the $180.', next: 'n4', good: false, loss: 180, note: 'There is no laptop. And now they know you’ll pay.' }] },
          n4: { msgs: [{ from: 'them', text: 'Payment received ✅ Last step: training certification, $350. Then you’re live! Offer expires today ⏰' }],
            choices: [
              { text: 'This is a scam. Report and block.', next: 'safe3', good: true, note: 'Good save - the fees would never have stopped.' },
              { text: 'Pay the $350.', next: 'lost', good: false, loss: 350, note: 'Each payment unlocks a new “fee”. It never ends.' }] },
          safe1: { end: 'safe', title: 'Fake recruiter blocked!', text: 'You kept your identity safe. Report the profile to HireHub.' },
          safe2: { end: 'safe', title: 'No fee, no deal!', text: 'The “recruiter” deletes their account. Real employers provide equipment for free.' },
          safe3: { end: 'safe', title: 'You stopped the bleeding', text: 'Report the payments to CashDash and your bank immediately - fast reports sometimes recover money.' },
          lost: { end: 'lost', title: 'The job never existed', text: 'Job scams chain fee after fee. Remember: no interview, vague company, upfront fees = scam.' }
        } } },

    /* ───────────── Case 5: Romance ───────────── */
    { id: 'c5', num: 5, icon: '💘', title: 'The Romance Scammer', cat: 'romance', cats: ['romance', 'crypto'],
      intro: 'Romance scams take weeks and feel completely real. Follow a relationship over several days and decide when the story stops adding up.',
      boss: { type: 'chat', name: 'Daniel ✈️', subtitle: 'Chatter · New connection', avatar: '💘', start: 'n1',
        nodes: {
          n1: { day: 'Day 1', msgs: [{ from: 'them', text: 'Hi! Sorry to message out of the blue - your smile in the hiking group photo made my day 😊 I’m Daniel, an engineer on a project overseas.' }],
            choices: [
              { text: 'Reverse-image-search his photos first.', next: 'n2', good: true, note: 'Smart. Scammers often steal photos from real people’s profiles.' },
              { text: 'Aww, thank you! Tell me about yourself 😊', next: 'n2', good: null, note: 'Friendly is fine - just keep your guard up.' },
              { text: 'You’re so handsome, I can’t believe you messaged me ❤️', next: 'n2', good: false, note: 'Fast emotional connection is exactly what the script aims for.' }] },
          n2: { day: 'Day 6', msgs: [{ from: 'them', text: 'I’ve never felt this way so fast. You’re my everything ❤️ My camera is broken on the rig so no video yet 😔 Let’s move to another app, this one is glitchy.' }],
            choices: [
              { text: 'If it’s real, it can wait for a video call. I’ll stay on this app.', next: 'n3', good: true, note: 'Moving apps hides them from the platform’s scam detection.' },
              { text: 'Sure, here’s my number!', next: 'n3', good: null, note: 'Off-platform chats make it harder to report them.' },
              { text: 'I love you too ❤️', next: 'n3', good: false, note: 'Love-bombing in week one is a hallmark of romance scams.' }] },
          n3: { day: 'Day 19', msgs: [{ from: 'them', text: 'Disaster, my love 😢 My payroll card is blocked and customs is holding my equipment. I need $2,500 to clear it or I lose the contract. I’ll repay you double when I land next month, I promise.' }],
            choices: [
              { text: 'Report the profile and block.', next: 'safe1', good: true, note: 'A stranger you’ve never seen on video asking for money = scam.' },
              { text: 'I don’t send money to people I haven’t met. Let’s talk about it with my sister.', next: 'n4', good: true, note: 'Bringing in someone you trust breaks the isolation they rely on.' },
              { text: 'I’ll send it now.', next: 'n4', good: false, loss: 2500, note: 'The money goes straight to a scam ring. And they’ll ask again.' }] },
          n4: { day: 'Day 23', msgs: [{ from: 'them', text: 'Why don’t you trust me?? After everything?? I’m desperate. PlayVault gift cards work too. And please don’t tell your family - they’ll ruin us.' }],
            choices: [
              { text: 'Secrecy + gift cards = scam. Reporting and blocking.', next: 'safe2', good: true, note: 'Guilt, secrecy and gift cards - three red flags in one message.' },
              { text: 'Buy the gift cards.', next: 'lost', good: false, loss: 1500, note: 'Gift cards are untraceable. The requests will keep coming.' }] },
          safe1: { end: 'safe', title: 'Heart protected!', text: 'His photos belonged to a real (married) dentist. You reported the fake profile.' },
          safe2: { end: 'safe', title: 'You broke the spell', text: 'Talking to someone you trust is powerful. Report the profile and, if you sent anything, contact your bank.' },
          lost: { end: 'lost', title: 'Heartbroken - and robbed', text: 'Romance scams cost victims more than almost any other scam. Never send money to someone you haven’t met in person, no matter how real it feels.' }
        } } },

    /* ───────────── Case 6: Crypto mentor ───────────── */
    { id: 'c6', num: 6, icon: '📈', title: 'The Crypto Mentor', cat: 'crypto', cats: ['crypto', 'romance', 'prize'],
      intro: 'Friendly “mentors”, trading signals and dashboards full of profit. The final case: can you spot the platform that only goes one way?',
      boss: { type: 'chat', name: 'Sophie | Crypto Mentor 📈', subtitle: 'Chatter · Investing Beginners group', avatar: '📈', start: 'n1',
        nodes: {
          n1: { msgs: [{ from: 'them', text: 'Hey! Saw your comment in Investing Beginners 👋 I run a small free mentorship. My students made 30% LAST WEEK 📈 Want me to show you how?' }],
            choices: [
              { text: '30% a week isn’t real. No thanks.', next: 'safe1', good: true, note: 'Correct. Unrealistic returns are the bait.' },
              { text: 'Sure, show me!', next: 'n2', good: false, note: 'Unsolicited mentors are the front door of investment scams.' },
              { text: 'How does it work?', next: 'n2', good: null, note: 'Listen carefully to where they want your money to go.' }] },
          n2: { msgs: [{ from: 'them', text: 'Easy: open an account on BitHarbor Pro → bitharbor-pro.io and deposit $500 to start. I’ll send you signals 🚀' }],
            choices: [
              { text: 'That’s not BitHarbor’s real domain (bitharbor.io). I’m out.', next: 'safe2', good: true, note: 'Sharp eyes - the hyphen and “pro” make it a different site.' },
              { text: 'Deposit $500.', next: 'n3', good: false, loss: 500, note: 'Money sent to a fake platform is just a number on their screen.' },
              { text: 'Can I start with just $50?', next: 'n3', good: false, loss: 50, note: 'Small tests are how they hook you - early “profits” are fake.' }] },
          n3: { msgs: [
              { from: 'sys', text: 'Your dashboard shows +$1,900 profit 🚀' },
              { from: 'them', text: 'See?! Add $5,000 now for the VIP pool. Offer ends TONIGHT!' }],
            choices: [
              { text: 'Let me try withdrawing my profit first.', next: 'n4', good: true, note: 'Great test - fake platforms always block withdrawals.' },
              { text: 'Deposit $5,000.', next: 'n4', good: false, loss: 5000, note: 'Deadline pressure + bigger deposits = the “butchering” phase.' }] },
          n4: { msgs: [{ from: 'them', text: 'Withdrawals need a 20% tax first 🙏 Pay $1,200 in USDT and everything unlocks.' }],
            choices: [
              { text: 'Real platforms don’t hold your money hostage. Stop, report, call my bank.', next: 'safe3', good: true, note: 'The withdrawal “tax” is the final tell. Stop paying.' },
              { text: 'Pay the “tax”.', next: 'lost', good: false, loss: 1200, note: 'After the tax comes a “verification fee”, then an “anti-money-laundering deposit”…' }] },
          safe1: { end: 'safe', title: 'Not falling for it!', text: 'You spotted the too-good-to-be-true pitch instantly.' },
          safe2: { end: 'safe', title: 'Lookalike spotted!', text: 'bitharbor-pro.io ≠ bitharbor.io. You reported the account to the group admins.' },
          safe3: { end: 'safe', title: 'You stopped paying', text: 'Report to your bank and fraud-reporting service. Beware “recovery agents” who promise to get your money back - that’s scam #2.' },
          lost: { end: 'lost', title: 'The platform was fake', text: 'The profits were never real. Rules: no guaranteed returns, only use platforms you find yourself, and if you can’t withdraw - stop depositing.' }
        } } }
  ];

  RF.story = { CHAPTERS: CHAPTERS };
})(window.RedFlag);
