// update-rankings.mjs
// Runs in GitHub Actions (server-side). Uses a headless Chrome browser to load
// the FIFA ranking page — this satisfies Akamai's JS challenge, allowing the
// page to make a successful /api/ranking-overview request. We intercept that
// response and write the WC team subset to Firebase.
//
// Why headless browser: FIFA migrated ranking editions to a new dateId format
// (FRS_Male_Football_YYYYMMDD) in late 2025. The old id14xxx API (Spain #1,
// Sep 2025) still responds but is stale. The new format is protected by
// Akamai bot detection that requires real JavaScript execution — direct
// server-side fetch always returns {"rankings":[]}.

import admin from 'firebase-admin';
import puppeteerExtra from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteerExtra.use(StealthPlugin());

const DB_URL = 'https://getgol7-default-rtdb.asia-southeast1.firebasedatabase.app';

// Chrome path on GitHub Actions ubuntu-latest runner (pre-installed).
const CHROME_PATH = process.env.CHROME_PATH || '/usr/bin/google-chrome-stable';

// The 48 FIFA World Cup 2026 teams, in this app's naming convention
const WC_TEAMS = new Set([
  'Mexico','South Africa','South Korea','Czechia','Canada','Bosnia','Qatar','Switzerland',
  'Brazil','Morocco','Haiti','Scotland','USA','Paraguay','Australia','Turkey','Germany',
  'Curacao','Ivory Coast','Ecuador','Netherlands','Japan','Tunisia','Sweden','Belgium',
  'Egypt','Iran','New Zealand','Spain','Cape Verde','Saudi Arabia','Uruguay','France',
  'Senegal','Norway','Iraq','Argentina','Algeria','Austria','Jordan','Portugal',
  'Uzbekistan','Colombia','DR Congo','England','Croatia','Ghana','Panama',
]);

// FIFA display name → app name
const FIFA_NAME_MAP = {
  'United States': 'USA', 'USA': 'USA',
  'Korea Republic': 'South Korea', 'Republic of Korea': 'South Korea',
  'IR Iran': 'Iran',
  'Türkiye': 'Turkey', 'Turkiye': 'Turkey',
  "Côte d'Ivoire": 'Ivory Coast', "Cote d'Ivoire": 'Ivory Coast',
  'Bosnia and Herzegovina': 'Bosnia',
  'Cabo Verde': 'Cape Verde',
  'Curaçao': 'Curacao',
  'Congo DR': 'DR Congo',
  'Czech Republic': 'Czechia',
};
const norm = n => FIFA_NAME_MAP[n] || n;

async function getFifaRankings() {
  console.log('Launching headless Chrome…');
  const browser = await puppeteerExtra.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
    );

    // Resolve when the page makes a successful /api/ranking-overview call
    // that returns actual rankings (not empty). Reject after 45s.
    const rankingPromise = new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error('Timed out waiting for ranking API response (60s)')),
        60000
      );
      page.on('response', async response => {
        if (!response.url().includes('/api/ranking-overview')) return;
        if (response.status() !== 200) return;
        try {
          const json = await response.json();
          if (Array.isArray(json.rankings) && json.rankings.length > 0) {
            clearTimeout(timer);
            resolve(json);
          }
        } catch { /* ignore parse errors on unrelated responses */ }
      });
    });

    console.log('Navigating to FIFA ranking page…');
    await page.goto('https://inside.fifa.com/fifa-world-ranking/men', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    const data = await rankingPromise;
    console.log(`Intercepted ranking response — ${data.rankings.length} teams`);

    const updated = data.rankings[0]?.rankingItem?.lastUpdateDate || new Date().toISOString();
    const all = data.rankings.map(r => ({
      name: norm(r.rankingItem?.name),
      rank: r.rankingItem?.rank,
      points: r.rankingItem?.totalPoints,
    }));

    return { all, updated };
  } finally {
    await browser.close();
  }
}

function toWcTable(all) {
  const sorted = all
    .filter(r => r.name && WC_TEAMS.has(r.name) && Number.isFinite(r.rank))
    .sort((a, b) => a.rank - b.rank);

  // Dedup by name (keep best-ranked) so alias collisions can't produce duplicates.
  const seen = new Set();
  const unique = [];
  for (const r of sorted) {
    if (seen.has(r.name)) continue;
    seen.add(r.name);
    unique.push(r);
  }

  return unique.map((r, i) => ({ rank: i + 1, name: r.name, points: r.points ?? null }));
}

async function main() {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT secret is not set');
  }
  const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({ credential: admin.credential.cert(sa), databaseURL: DB_URL });

  const { all, updated } = await getFifaRankings();
  const table = toWcTable(all);

  if (table.length < 40) {
    throw new Error(`Only matched ${table.length}/48 WC teams — aborting to protect existing data`);
  }

  await admin.database().ref('wc2026/rankings').set(table);
  await admin.database().ref('wc2026/rankingsMeta').set({
    updated,
    syncedAt: Date.now(),
    count: table.length,
    source: 'FIFA official (puppeteer)',
  });

  console.log(`✅ Wrote ${table.length} WC team rankings — FIFA update ${updated}`);
  process.exit(0);
}

main().catch(e => {
  console.error('❌ Rankings sync failed:', e.message);
  process.exit(1);
});
