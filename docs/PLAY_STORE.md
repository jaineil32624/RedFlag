# 🚀 RedFlag - Google Play Store Kit

Everything needed to publish **RedFlag: The Scam Detective Game** on Google Play.

---

## 📛 App title (≤ 30 chars)

```
RedFlag: Scam Detective Game
```
*(28 characters)*

## ✏️ Short description (≤ 80 chars)

```
Swipe to spot scams! Train your scam radar and check suspicious texts safely.
```
*(77 characters)*

## 📝 Full description (≤ 4000 chars)

```
🚩 Spot the scam before it spots you.

Scams steal over a TRILLION dollars a year - through fake delivery texts, "Hi Mum, new number" messages, AI voice-clone calls, fake tech support, romance scams, crypto "mentors", job offers that need a fee, marketplace overpayments and sneaky QR codes. RedFlag turns scam-spotting into a fast, addictive swipe game so everyone - from teens to grandparents - builds the reflex to stop and think.

📱 INBOX RUSH
Messages land on a realistic phone screen: texts, emails, DMs, voicemails, marketplace chats, job offers, crypto pitches and QR posters. Swipe LEFT for Scam 🚩 or RIGHT for Legit ✅. Beat the timer, build combos, keep your lives - and see exactly what gave each one away.

🔍 FLAG HUNT
Tap the suspicious words BEFORE you swipe - lookalike links, urgent threats, gift-card demands, requests for codes - and earn bonus points for every real red flag you find.

✅ NOT EVERYTHING IS A SCAM
Real fraud alerts, real 2FA codes you asked for, real delivery notices on the official site… RedFlag teaches you to tell the difference, so you stay safe without panicking at every message.

🗂️ STORY MODE: CASE FILES
Six chapters, each ending in an interactive BOSS: talk your way out of a voice-clone "Mum, I'm in trouble" call, a fake tech-support call with a rising pressure meter, a romance scammer over several days, a crypto mentor, a job that needs a fee and an overpaying buyer. Good choices end the scam safely. Bad choices show what you'd have lost - and why.

⚡ LOOKALIKE LIGHTNING
30 seconds. Pick the REAL website or sender from the fakes: n0vabank.com, novabank-secure.co, novabank.com.verify-id.xyz… How many can you spot?

📅 DAILY CASE
Ten new cards every day - the same for everyone. Keep your streak alive!

🎯 CHALLENGE YOUR FRIENDS & FAMILY
Send a link that gives your friend - or your parents! - the exact same 10 cards and your score to beat. Share your Scam IQ card anywhere.

🛡️ CHECK A MESSAGE (REAL TOOL)
Got a suspicious text or link? Paste it in. RedFlag's on-device checker highlights red flags in plain language - urgency, code requests, gift cards and crypto, lookalike and shortened links, "new number" claims, remote-access requests and more - then tells you exactly what to do next. Nothing is uploaded, ever. (It's a helpful heuristic, not a guarantee - always verify through official channels.)

📚 FIELD GUIDE
A searchable encyclopedia of scam types that unlocks as you play: how each scam works, its red flags and what to do.

🏅 LEVEL UP
XP and ranks from Rookie to Legend, a difficulty-weighted Scam IQ, 35 badges, per-category stats and "train your weak spot" suggestions.

👪 MADE FOR EVERYONE
• Large text mode
• High-contrast theme
• Read-aloud for messages and explanations
• Relaxed timers or no-timer Practice
• Reduced motion
• Light & dark themes

🔒 PRIVATE BY DESIGN
No account. No ads. No tracking. No data collected. Everything - your progress and the message checker - stays on your device. Works offline.

All companies, people, links and phone numbers in the game are fictional and used only for education.

Download RedFlag, sharpen your scam radar, and send it to someone you love. 💙
```

## 🗂️ Category & tags

- **Category:** Education *(alternative: Games → Educational / Trivia)*
- **Tags:** Education, Puzzle, Trivia, Family
- **Target audience:** 13+ primary, suitable for all ages with family features. *(If you opt into the "Teacher Approved" / Families programme, review the Families policy first - the app already has no ads, no data collection and no third-party SDKs.)*

## 🧾 Content rating notes (IARC questionnaire)

- Violence: **None**. Sexual content: **None**. Profanity: **None**. Drugs/alcohol/tobacco: **None**. Gambling: **None** (no real or simulated gambling; "crypto" appears only as scam examples).
- User-generated content / user interaction: **No** (no chat with other users; the "Check a Message" tool analyses text locally and shares nothing).
- Shares location / personal info: **No**.
- Digital purchases: **No**.
- Note for reviewers: the app *depicts* scam messages (phishing, romance, impersonation) for **educational and defensive purposes**. All brands, domains and phone numbers are fictional (555-01xx range). Links are not clickable.
- Expected rating: **Everyone / PEGI 3** (possibly PEGI 7 / Everyone 10+ for mild themes of fraud).

## 🔐 Privacy summary (Data safety form)

| Question | Answer |
|---|---|
| Does the app collect or share user data? | **No** |
| Data encrypted in transit? | N/A - no data is transmitted |
| Can users request deletion? | Yes - all data is local; *Settings → Reset progress* or clear app data |
| Third-party SDKs / analytics / ads | **None** |
| Permissions | None required (vibration is optional and needs no runtime permission) |

Privacy policy URL: host `privacy-policy.html` (e.g. `https://<you>.github.io/RedFlag/privacy-policy.html`).

## 🎨 Feature graphic concept (1024 × 500)

- **Background:** deep purple → crimson diagonal gradient (`#2a1752 → #5a1645 → #ff4d6d`) with soft blurred glow blobs.
- **Left:** the app icon (magnifying glass with a red flag) + wordmark **RedFlag** in heavy white type, tagline *"Spot the scam before it spots you."*
- **Right:** a tilted phone showing a scam text mid-swipe, with a big red rubber-stamp **"SCAM!"** and a floating chip **"Scam IQ 128 🧠"**; a second card peeking behind with a green **"LEGIT"** stamp.
- No small text (it's unreadable at thumbnail size); keep key art inside the central safe area.

**Screenshots to capture (phone, 1080×1920+):** Home · Inbox Rush card · Feedback sheet with highlighted red flags · Boss call with pressure meter · Lookalike Lightning · Check a Message result · Profile with badges · Share card.

## 🔎 Keyword list

scam, scam detector, phishing, phishing test, fraud, fraud prevention, scam text, spam text, smishing, quishing, QR code scam, romance scam, voice clone, AI scam, hi mum scam, tech support scam, crypto scam, job scam, marketplace scam, gift card scam, online safety, cyber security game, digital literacy, internet safety for seniors, family safety, security awareness training, swipe game, educational game, trivia, brain game

---

## 📦 Wrapping for Android with Capacitor

RedFlag is plain HTML/CSS/JS with no build step, so the project root *is* the web app.

> ⚠️ These are instructions only - nothing has been installed in this repo.

```bash
# 1) In the project folder (needs Node.js LTS + Android Studio)
npm init -y
npm i @capacitor/core @capacitor/cli @capacitor/android

# 2) Initialise Capacitor (app name, app id) - webDir is the project root
npx cap init "RedFlag" "com.jaineilrana.redflag" --web-dir "."

# 3) Add the Android platform
npx cap add android

# 4) Copy web assets into the native project (re-run after every web change)
npx cap copy android      # or: npx cap sync android

# 5) Open in Android Studio
npx cap open android
```

Then in Android Studio:

1. Set the app icon: *File → New → Image Asset* using `icons/icon-maskable-512.png` (adaptive icon foreground/background).
2. Set `versionCode` / `versionName` in `android/app/build.gradle`.
3. Lock to portrait (optional): in `AndroidManifest.xml` add `android:screenOrientation="portrait"` to the main activity.
4. **Build → Generate Signed Bundle / APK → Android App Bundle (.aab)**, create/use an upload keystore (keep it safe - never commit it; `.gitignore` already excludes `*.jks`, `*.keystore`, `*.aab`).
5. Upload the `.aab` to Play Console → Internal testing → Production.

Notes:
- If `webDir: "."` copies unwanted files, move the web app into a `www/` folder and set `webDir` to `www` in `capacitor.config.json`, or add the extra folders to `.gitignore`/delete them from `android/app/src/main/assets/public` after copying.
- The service worker isn't needed inside Capacitor (assets are local) - it's harmless, and the app works offline either way.
- Android's back button maps to the browser history, which RedFlag already uses for navigation.
