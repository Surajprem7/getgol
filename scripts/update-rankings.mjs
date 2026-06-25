// update-rankings.mjs
// Runs in GitHub Actions. Uses headless Chrome + stealth plugin to load the
// FIFA ranking page, establish Akamai session cookies, then fetches the
// ranking API directly (two-step navigation so cookies carry over).

import admin from 'firebase-admin';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const DB_URL = 'https://getgol7-default-rtdb.asia-southeast1.firebasedatabase.app';
const CHROME = process.env.CHROME_PATH || '/usr/bin/google-chrome-stable';

const WC_TEAMS = new Set([
  'Mexico','South Africa','South Korea','Czechia','Canada','Bosnia','Qatar','Switzerland',
  'Brazil','Morocco','Haiti','Scotland','USA','Paraguay','Australia','Turkey','Germany',
  'Curacao','Ivory Coast','Ecuador','Netherlands','Japan','Tunisia','Sweden','Belgium',
  'Egypt','Iran','New Zealand','Spain','Cape Verde','Saudi Arabia','Uruguay','France',
  'Senegal','Norway','Iraq','Argentina','Algeria','Austria','Jordan','Portugal',
  'Uzbekistan','Colombia','DR Congo','England','Croatia','Ghana','Panama',
]);

const FIFA_NAME_MAP = {
  'United States':'USA','Korea Republic':'South Korea','Republic of Korea':'South Korea',
  'IR Iran':'Iran','Türkiye':'Turkey','Turkiye':'Turkey',
  "Côte d'Ivoire":'Ivory Coast',"Cote d'Ivoire":'Ivory Coast',
  'Bosnia and Herzegovina':'Bosnia','Cabo Verde':'Cape Verde',
  'Curaçao':'Curacao','Congo DR':'DR Congo','Czech Republic':'Czechia',
};
const norm = n => FIFA_NAME_MAP[n] || n;

async function getFifaRankings() {
  console.log('Launching headless Chrome with stealth…');
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage','--disable-gpu'],
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
    );

    // ── Step 1: load main page so Akamai sets its session cookies ──────────
    console.log('Step 1: loading FIFA ranking page to establish Akamai cookies…');
    await page.goto('https://inside.fifa.com/fifa-world-ranking/men', {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });

    // Extract the latest dateId from the embedded Next.js page data
    const latestDateId = await page.evaluate(() => {
      try {
        const raw = document.getElementById('__NEXT_DATA__')?.textContent;
        if (!raw) return null;
        const j = JSON.parse(raw);
        const str = JSON.stringify(j);
        const dates = [...str.matchAll(/"id":"(FRS_Male_Football_\d+)"/g)].map(m => m[1]);
        // Return the one with the highest numeric suffix (most recent)
        return dates.sort((a, b) => {
          const na = parseInt(a.replace('FRS_Male_Football_', ''));
          const nb = parseInt(b.replace('FRS_Male_Football_', ''));
          return nb - na;
        })[0] || null;
      } catch { return null; }
    });
    console.log('Latest dateId from page:', latestDateId);

    // Wait a few seconds to let Akamai JS fully execute + cookies settle
    await new Promise(r => setTimeout(r, 4000));

    const dateId = latestDateId || 'FRS_Male_Football_20260401';

    // ── Step 2: navigate directly to the API URL (cookies carry over) ──────
    const apiUrl = `https://inside.fifa.com/api/ranking-overview?locale=en&dateId=${dateId}`;
    console.log('Step 2: fetching ranking API:', apiUrl);
    await page.goto(apiUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log('API response preview:', bodyText.slice(0, 120));

    let data;
    try { data = JSON.parse(bodyText); }
    catch (e) { throw new Error(`API response was not JSON: ${bodyText.slice(0, 200)}`); }

    if (!Array.isArray(data.rankings) || data.rankings.length === 0) {
      throw new Error(
        'FIFA API returned empty rankings — Akamai is likely blocking this cloud IP. ' +
        'Response: ' + bodyText.slice(0, 200)
      );
    }

    console.log(`Got ${data.rankings.length} teams from FIFA API`);
    const updated = data.rankings[0]?.rankingItem?.lastUpdateDate || new Date().toISOString();
    const all = data.rankings.map(r => ({
      name: norm(r.rankingItem?.name),
      rank: r.rankingItem?.rank,
      points: r.rankingItem?.totalPoints,
    }));
    return { all, updated, dateId };

  } finally {
    await browser.close();
  }
}

function toWcTable(all) {
  const sorted = all
    .filter(r => r.name && WC_TEAMS.has(r.name) && Number.isFinite(r.rank))
    .sort((a, b) => a.rank - b.rank);
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
  if (!process.env.FIREBASE_SERVICE_ACCOUNT)
    throw new Error('FIREBASE_SERVICE_ACCOUNT secret is not set');

  const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({ credential: admin.credential.cert(sa), databaseURL: DB_URL });

  const { all, updated, dateId } = await getFifaRankings();
  const table = toWcTable(all);

  if (table.length < 40)
    throw new Error(`Only matched ${table.length}/48 WC teams — aborting to protect existing data`);

  await admin.database().ref('wc2026/rankings').set(table);
  await admin.database().ref('wc2026/rankingsMeta').set({
    updated, syncedAt: Date.now(), count: table.length,
    source: `FIFA official (${dateId})`,
  });

  console.log(`✅ Wrote ${table.length} WC team rankings — FIFA update ${updated} (${dateId})`);
  process.exit(0);
}

main().catch(e => {
  console.error('❌ Rankings sync failed:', e.message);
  process.exit(1);
});
