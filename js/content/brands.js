/*
 * content/brands.js
 * The fictional world RedFlag's scenarios take place in.
 * IMPORTANT: every brand, bank, courier, app and domain here is
 * FICTIONAL. We never impersonate real companies. Phone numbers use
 * the reserved fictional 555-01xx range.
 */
(function (RF) {
  'use strict';

  // type -> list of fictional brands. `domain` is the one true official domain.
  var BRANDS = {
    bank: [
      { name: 'NovaBank', domain: 'novabank.com' },
      { name: 'Crestline Credit Union', short: 'Crestline', domain: 'crestlinecu.org' },
      { name: 'Harborstone Bank', short: 'Harborstone', domain: 'harborstone.com' },
      { name: 'Bluefern Bank', short: 'Bluefern', domain: 'bluefernbank.com' }
    ],
    courier: [
      { name: 'ParcelGo', domain: 'parcelgo.com' },
      { name: 'Kestrel Express', short: 'Kestrel', domain: 'kestrelexpress.com' },
      { name: 'BoxHop', domain: 'boxhop.com' }
    ],
    shop: [
      { name: 'ShopSphere', domain: 'shopsphere.com' },
      { name: 'CartWave', domain: 'cartwave.com' },
      { name: 'Lumen Market', short: 'Lumen', domain: 'lumenmarket.com' }
    ],
    stream: [
      { name: 'StreamNest', domain: 'streamnest.tv' },
      { name: 'Flickbox', domain: 'flickbox.tv' },
      { name: 'TuneTide', domain: 'tunetide.com' }
    ],
    social: [
      { name: 'Chatter', domain: 'chatter.app' },
      { name: 'Snapline', domain: 'snapline.app' },
      { name: 'FriendHub', domain: 'friendhub.com' }
    ],
    pay: [
      { name: 'PayPing', domain: 'payping.com' },
      { name: 'CashDash', domain: 'cashdash.app' }
    ],
    tech: [
      { name: 'Orbix', domain: 'orbix.com' },
      { name: 'Pixelware', domain: 'pixelware.com' }
    ],
    gov: [
      { name: 'National Revenue Office', short: 'Revenue Office', domain: 'revenueoffice.gov' }
    ],
    toll: [
      { name: 'MetroToll', domain: 'metrotoll.org' },
      { name: 'CityPark', domain: 'citypark.org' }
    ],
    telecom: [
      { name: 'Skyline Mobile', short: 'Skyline', domain: 'skylinemobile.com' }
    ],
    crypto: [
      { name: 'CoinVault', domain: 'coinvault.io' },
      { name: 'BitHarbor', domain: 'bitharbor.io' }
    ],
    market: [
      { name: 'SwapSpot', domain: 'swapspot.com' }
    ],
    job: [
      { name: 'HireHub', domain: 'hirehub.com' },
      { name: 'TalentLoop', domain: 'talentloop.io' }
    ],
    dating: [
      { name: 'Kindred', domain: 'kindreddating.com' }
    ],
    utility: [
      { name: 'BrightGrid Energy', short: 'BrightGrid', domain: 'brightgrid.com' }
    ],
    charity: [
      { name: 'Open Hands Relief', short: 'Open Hands', domain: 'openhandsrelief.org' }
    ],
    gift: [
      { name: 'PlayVault', domain: 'playvault.com' },
      { name: 'ShopSphere', domain: 'shopsphere.com' }
    ]
  };

  // Which "app" a channel is shown in (all fictional).
  var CHANNEL_APPS = {
    sms: { app: 'Messages', icon: '💬' },
    email: { app: 'Mail', icon: '✉️' },
    dm: { app: 'Chatter', icon: '🗨️' },
    market: { app: 'SwapSpot', icon: '🛒' },
    voicemail: { app: 'Voicemail', icon: '📞' },
    qr: { app: 'Camera · QR scan', icon: '📷' },
    job: { app: 'HireHub Inbox', icon: '💼' },
    crypto: { app: 'Chatter', icon: '📈' }
  };

  var FIRST = ['Alex', 'Sam', 'Jordan', 'Taylor', 'Morgan', 'Riley', 'Casey', 'Jamie', 'Priya', 'Mateo',
    'Aisha', 'Chen', 'Sofia', 'Liam', 'Noah', 'Emma', 'Olivia', 'Ava', 'Ethan', 'Maya', 'Kai',
    'Zara', 'Leo', 'Nina', 'Omar', 'Grace', 'Hana', 'Diego', 'Ruth', 'Frank', 'Linda', 'Raj'];
  var LAST = ['Rivera', 'Patel', 'Kim', 'Nguyen', 'Okafor', 'Smith', 'Garcia', 'Johnson', 'Lee',
    'Brown', 'Haddad', 'Novak', 'Silva', 'Walker', 'Cohen', 'Moreau', 'Tanaka', 'Mensah', 'Ellis'];
  var KIDS = ['Mia', 'Jake', 'Ella', 'Ben', 'Lucy', 'Sam', 'Chloe', 'Max', 'Zoe', 'Tom', 'Ana', 'Dev'];
  var CITIES = ['Riverside', 'Maple Falls', 'Northbridge', 'Lakeview', 'Cedar Point', 'Brookhaven',
    'Port Ellis', 'Westfield', 'Oakmont', 'Silver Bay'];
  var ITEMS = [
    { item: 'vintage road bike', price: 240 }, { item: 'gaming console', price: 310 },
    { item: 'oak dining table', price: 180 }, { item: 'used iPhone-style phone', price: 220 },
    { item: 'baby stroller', price: 90 }, { item: 'electric guitar', price: 350 },
    { item: 'standing desk', price: 160 }, { item: 'designer sofa', price: 420 },
    { item: 'mountain bike', price: 380 }, { item: 'camera lens', price: 270 }
  ];
  var REMOTE_APPS = ['AnyAssist', 'QuickHelp Remote', 'DeskBridge'];
  var COINS = ['BTC', 'USDT', 'ETH'];
  // Fictional link shortener + fictional free-mail provider (non-working, display only).
  var SHORTENER = 'qik.lnk';
  var FREEMAIL = ['mailzap.com', 'inboxly.net', 'postbox-mail.com'];

  RF.world = {
    BRANDS: BRANDS, CHANNEL_APPS: CHANNEL_APPS, FIRST: FIRST, LAST: LAST, KIDS: KIDS,
    CITIES: CITIES, ITEMS: ITEMS, REMOTE_APPS: REMOTE_APPS, COINS: COINS,
    SHORTENER: SHORTENER, FREEMAIL: FREEMAIL,
    /** Every official domain - handy for the analyzer and lookalike rounds. */
    allBrands: function () {
      var out = [];
      Object.keys(BRANDS).forEach(function (t) {
        BRANDS[t].forEach(function (b) { if (out.indexOf(b) < 0) out.push(b); });
      });
      return out;
    }
  };
})(window.RedFlag);
