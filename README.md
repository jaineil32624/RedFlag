# 🚩 RedFlag: The Scam Detective Game

> **Spot the scam before it spots you.**

Scams - phishing texts, fake delivery notices, romance scams, fake tech support, job and crypto scams, AI voice-clone *"it's me, Mum"* calls, marketplace overpayments, QR-code tricks - steal **over $1 trillion a year**. RedFlag turns scam-spotting into a fast, addictive, swipeable game so people of every age build the reflex... **and** ships a real, private, on-device tool to check suspicious messages. 🛡️

Built to go big on Google Play (Education / Family) and spread through *"send this to your parents"* challenge links. 📲💙

- ⚡ Pure HTML + CSS + vanilla JS - **no libraries, no CDN, no build step**
- 📂 Runs straight from `index.html` (yes, even `file://`)
- 📲 Installable **PWA** with offline support when served over https (e.g. GitHub Pages)
- 🔒 **Zero data collected** - everything happens on your device

---

## ✨ Features

| | |
|---|---|
| 📱 **Inbox Rush** | A realistic phone shows one message at a time - SMS, email, social DM, marketplace chat, voicemail transcript, QR poster, job offer, crypto pitch. **Swipe ← Scam 🚩 / Legit ✅ →** (touch drag with card physics, arrow keys, or buttons). Timer, combo multiplier, 3 lives. |
| 🔍 **Flag Hunt** | Tap suspicious words *before* swiping for bonus points: urgency, lookalike links, gift-card/crypto/wire payments, code & password requests, too-good-to-be-true offers, unknown senders, tone mismatches, emotional pressure, secrecy, overpayment… |
| 💡 **Instant lessons** | After every card a sheet reveals the red flags (or the green flags proving it's legit) highlighted right inside the message. |
| ✅ **Not everything is a scam** | Tricky *scary-but-real* messages: genuine fraud alerts that say "we will never ask for your code", 2FA codes you requested, real delivery notices on the official domain. |
| ♾️ **Procedural content** | **69 scam templates across 15 scam families + 30 legit templates**, with randomised names, amounts, dates, fictional brands and lookalike-domain mutations. Difficulty scales with your level (subtler lookalikes, fewer typos, more convincing fakes). |
| 🗂️ **Story Mode: Case Files** | 6 chapters, each ending in an interactive **boss**: "Hi Mum" voice-clone call, overpaying marketplace buyer, fake tech support (with a rising **pressure meter**), the job that needs a fee, a multi-day romance scammer, and a crypto mentor. Good choices end the scam safely; bad ones show what you'd have lost - and why. Stars + unlocks. |
| ⚡ **Lookalike Lightning** | 30-second speed round: pick the real domain/sender from homoglyphs (`n0vabank.com`), extra words, wrong endings and subdomain tricks (`novabank.com.verify-id.xyz`). |
| 📅 **Daily Case** | A date-seeded set of 10 cards - the same for everyone that day - with streak tracking. |
| 🛡️ **Check a Message** | Paste any text or link. The on-device analyzer scores risk 0-100, highlights red flags inline and explains them in plain language, inspects links (real owner domain, IP links, shorteners, punycode, odd endings, brand-in-subdomain, `@` tricks) and ends with a **"What to do now"** checklist. Honest: heuristic, *not a guarantee*. |
| 📚 **Field Guide** | Searchable encyclopedia of scam types that unlocks as you meet them: how it works, red flags, what to do. |
| 🏅 **Progression** | XP & levels, ranks (**Rookie → Fraud Spotter → Scam Buster → Cyber Sentinel → Legend**), a difficulty-weighted **Scam IQ**, **35 badges** with unlock animations, per-category accuracy and "train your weak spot". |
| 📣 **Viral loop** | Beautiful **share card** rendered to canvas → PNG (Web Share with files, or download). **Challenge links** (`#challenge=SEED&score=N`) give a friend the *exact same 10 cards* and your score to beat. Copy-link fallback. |
| 👪 **Family & accessibility** | Large text, high contrast, reduced motion, **read-aloud** (SpeechSynthesis) for cards & explanations, relaxed timers or no-timer Practice, light/dark themes. |
| 🎆 **Juice** | Swipe physics, SCAM!/LEGIT rubber stamps, screen shake, confetti, procedural Web Audio SFX + optional generative music (remembers toggle & volume, starts after first tap, pauses when hidden), haptics. **No audio or image assets needed.** |

---

## 🎮 How to play

1. **Read the message.** Who sent it? Where does the link *really* go? What are they asking for?
2. **Flag Hunt (optional):** tap anything suspicious for bonus points. 🔍
3. **Swipe left** if it's a scam 🚩, **swipe right** if it's legit ✅ (or use ← / → keys or the big buttons).
4. **Learn** from the feedback sheet, build your combo, and climb from Rookie to Legend. 👑
5. **Challenge** your friends and family to beat your Scam IQ. 🎯

---

## ▶️ How to run

**Easiest:** double-click `index.html`. That's it. 🎉

**As a PWA (installable, offline):** serve the folder over http(s), e.g.

```bash
# any static server works
npx serve .            # or: python -m http.server 8000
```

then open `http://localhost:8000`. On GitHub Pages, enable Pages for the repo and visit `https://<you>.github.io/RedFlag/` - the browser will offer **Install app**.

**Android (Google Play):** see [`docs/PLAY_STORE.md`](docs/PLAY_STORE.md) for the store listing kit and Capacitor wrapping steps.

---

## 🏗️ Architecture

One global namespace (`window.RedFlag`), classic `<script>` tags in a fixed order - no modules, no bundler, works on `file://`.

```
RedFlag/
├── index.html                 # shell + script order
├── css/styles.css             # design tokens, themes (dark/light/contrast/large/reduced-motion)
├── js/
│   ├── core/                  # namespace + utils + event bus, seeded RNG, versioned storage
│   ├── content/
│   │   ├── brands.js          # the FICTIONAL world: banks, couriers, apps, domains, names
│   │   ├── domains.js         # lookalike-domain generator (3 difficulty tiers)
│   │   ├── taxonomy.js        # red-flag & green-flag types, scam categories
│   │   ├── templates-scam.js  # 69 scam templates
│   │   ├── templates-legit.js # 30 legit templates (incl. scary-but-real)
│   │   ├── generator.js       # template + seed + level → card; deck building
│   │   ├── fieldguide.js      # encyclopedia entries
│   │   └── stories.js         # Case Files + branching boss scripts
│   ├── systems/               # settings, audio (procedural), haptics/speech, progress (XP/IQ/stats),
│   │                          # badges, daily + challenge seeds, share card
│   ├── analyzer/analyzer.js   # on-device "Check a Message" heuristics
│   ├── ui/                    # router & dialogs, fx, card renderer, swipe physics, screens
│   ├── game/                  # run engine (Rush/Daily/Challenge/Practice/Story rounds), story, lookalike
│   └── main.js                # boot
├── sw.js                      # offline cache (only registered over http/https)
├── manifest.webmanifest       # PWA manifest (injected only over http/https)
├── icons/                     # 192, 512, maskable 512 PNG + SVG
├── privacy-policy.html        # "we collect nothing"
└── docs/PLAY_STORE.md         # store listing + Capacitor steps
```

Key ideas:
- **Seeded RNG** (`core/rng.js`) makes Daily Cases and Challenge links reproducible - the same seed always builds the same deck.
- **Storage** (`core/storage.js`) keeps one versioned JSON blob in `localStorage`, wrapped in try/catch; if storage is blocked the game runs in memory.
- **Event bus** (`RedFlag.bus`) decouples systems from UI - e.g. `badge` and `levelup` events trigger the unlock animations.
- **Screens** register in `RedFlag.screens` and are navigated with `RedFlag.ui.go(name, params)`; the browser/Android back button is wired to history.

---

## ➕ How to add a scam template

Open `js/content/templates-scam.js` (or `templates-legit.js`) and add an object:

```js
{ id: 'del-locker-sms',            // unique id
  cat: 'delivery',                 // category from taxonomy.js
  ch: 'sms',                       // sms | email | dm | market | voicemail | qr | job | crypto
  diff: 2,                         // 1 obvious … 3 subtle
  brand: 'courier',                // brand type used by {{brand}}, {{domain}}, {{fakeUrl}}…
  from: '[[sender|{{phone}}]]',
  body: '{{brand}}: your parcel {{trk}} is waiting in locker #{{num}}. ' +
        '[[urgency|Collect within 12h]] after paying {{small}}: [[link|{{fakeUrl}}]]',
  lesson: 'Parcel lockers never need a payment link by text.' }
```

- `{{var}}` inserts random values - see `VARS` in `js/content/generator.js` (`{{brand}}`, `{{fakeUrl}}`, `{{amt}}`, `{{p1}}`, `{{code}}`, `{{b:shop}}`…).
- `[[type|text]]` marks a **red flag** span (types in `taxonomy.js`: `urgency`, `link`, `payment`, `codes`, `tgtbt`, `sender`, `tone`, `emotion`, `secrecy`, `overpay`, `remote`, `info`).
- `[[+type|text]]` marks a **green flag** span for legit templates (`official`, `noask`, `expected`, `verify`, `calm`, `known`).
- Lines in `body` are separated by `\n`; a line starting with `me:` becomes your own chat bubble. Optional fields: `addr`, `subject`, `qr`, `ctx` (situational context), `listing: true`.
- ⚠️ Keep it **fictional and defensive**: only fictional brands/domains from `brands.js`, phone numbers via `{{phone}}` (555-01xx), and never real working links.

---

## 🔒 Privacy

No accounts, no analytics, no ads, no network calls. Progress lives in your browser's local storage; the message checker never uploads anything. See [`privacy-policy.html`](privacy-policy.html).

## ⚠️ Disclaimer

RedFlag is an educational game. The message checker is a heuristic helper, **not a guarantee** - always verify through the organisation's official app, website or phone number. All companies, people, domains and numbers in the game are **fictional**.

## 📄 License

[MIT](LICENSE) © 2026 Jaineil Rana
