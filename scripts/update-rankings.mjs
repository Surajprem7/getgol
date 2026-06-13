// update-rankings.mjs
// Runs in GitHub Actions (server-side, no CORS limit). Fetches the latest
// official FIFA World Ranking, keeps the 48 World Cup 2026 teams, and writes
// them to Firebase at wc2026/rankings. The app reads that path and falls back
// to its built-in list if it's ever missing — so a failed run never breaks the UI.

import admin from 'firebase-admin';

const DB_URL = 'https://getgol7-default-rtdb.asia-southeast1.firebasedatabase.app';
const UA = { 'User-Agent': 'Mozilla/5.0 (compatible; getgol-rankings-bot)' };

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
  'Congo DR': 'DR Congo', 'Congo': 'DR Congo',
  'Czech Republic': 'Czechia',
};
const norm = n => FIFA_NAME_MAP[n] || n;

async function getFifaRankings() {
  // The ranking page embeds the latest edition's dateId. We scrape that id,
  // then call FIFA's own overview API for the full table.
  const page = await fetch('https://inside.fifa.com/fifa-world-ranking/men', { headers: UA });
  if (!page.ok) throw new Error(`FIFA page returned HTTP ${page.status}`);
  const html = await page.text();

  const m = html.match(/"dateId"\s*:\s*"(id\d+)"/) || html.match(/(id1\d{4,})/);
  if (!m) throw new Error('Could not find a dateId on the FIFA ranking page (structure changed?)');
  const dateId = m[1] || m[0];

  const api = await fetch(
    `https://inside.fifa.com/api/ranking-overview?locale=en&dateId=${dateId}`,
    { headers: UA }
  );
  if (!api.ok) throw new Error(`FIFA ranking API returned HTTP ${api.status}`);
  const json = await api.json();

  if (!Array.isArray(json.rankings) || !json.rankings.length) {
    throw new Error('FIFA ranking API returned an empty list');
  }

  const updated = json.rankings[0]?.rankingItem?.lastUpdateDate || null;
  const all = json.rankings.map(r => ({
    name: norm(r.rankingItem?.name),
    rank: r.rankingItem?.rank,
    points: r.rankingItem?.totalPoints,
  }));
  return { all, updated, dateId };
}

function toWcTable(all) {
  // Keep only the 48 WC teams, order by global FIFA rank, renumber 1..48
  return all
    .filter(r => r.name && WC_TEAMS.has(r.name) && Number.isFinite(r.rank))
    .sort((a, b) => a.rank - b.rank)
    .map((r, i) => ({ rank: i + 1, name: r.name, points: r.points ?? null }));
}

async function main() {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT secret is not set');
  }
  const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({ credential: admin.credential.cert(sa), databaseURL: DB_URL });

  const { all, updated, dateId } = await getFifaRankings();
  const table = toWcTable(all);

  // Sanity gate: if we matched far fewer than 48 teams, the name map or source
  // likely drifted — abort rather than overwrite good data with garbage.
  if (table.length < 40) {
    throw new Error(`Only matched ${table.length}/48 WC teams — aborting to protect existing data`);
  }

  await admin.database().ref('wc2026/rankings').set(table);
  await admin.database().ref('wc2026/rankingsMeta').set({
    updated: updated || new Date().toISOString(),
    syncedAt: Date.now(),
    count: table.length,
    source: `FIFA official (${dateId})`,
  });

  console.log(`✅ Wrote ${table.length} WC team rankings — FIFA update ${updated} (${dateId})`);
  process.exit(0);
}

main().catch(e => {
  console.error('❌ Rankings sync failed:', e.message);
  process.exit(1);
});
