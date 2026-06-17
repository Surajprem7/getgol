// sync-live-data.mjs
// Runs in GitHub Actions (server-side). Fetches live match scores and group
// standings from ESPN's public API and writes them to Firebase at wc2026/.
// This is meant to be the SINGLE writer of live data, so browser clients can be
// read-only (see note in the PR / live.js) instead of every visitor hammering
// ESPN and writing to the database.
//
// Mirrors the parsing logic in js/live.js so the shapes written here match what
// the app already reads. A failed run never overwrites good data (granular
// per-match writes + structural guards).

import admin from 'firebase-admin';
import { readFileSync } from 'node:fs';

const DB_URL = 'https://getgol7-default-rtdb.asia-southeast1.firebasedatabase.app';

const ESPN_SCOREBOARD = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard';
const ESPN_STANDINGS  = 'https://site.api.espn.com/apis/v2/sports/soccer/fifa.world/standings?season=2026';

// ESPN team name → our app name (kept in sync with js/live.js)
const ESPN_NAME_MAP = {
  'United States': 'USA',
  'Korea Republic': 'South Korea',
  'Republic of Korea': 'South Korea',
  'Czech Republic': 'Czechia',
  'Bosnia and Herzegovina': 'Bosnia',
  'Bosnia-Herzegovina': 'Bosnia',
  "Côte d'Ivoire": 'Ivory Coast',
  "Cote d'Ivoire": 'Ivory Coast',
  'DR Congo': 'DR Congo',
  'Congo - Kinshasa': 'DR Congo',
  'Congo DR': 'DR Congo',
  'Democratic Republic of the Congo': 'DR Congo',
  'Türkiye': 'Turkey',
  'Turkiye': 'Turkey',
  'Curaçao': 'Curacao',
  'Curacao': 'Curacao',
  'Cape Verde Islands': 'Cape Verde',
};
const normName = n => ESPN_NAME_MAP[n] || n || '';

// Load the canonical MATCHES list from the browser file (single source of truth).
// js/matches.js declares `const MATCHES = [...]`; evaluate it and hand back the array.
function loadMatches() {
  const src = readFileSync(new URL('../js/matches.js', import.meta.url), 'utf8');
  // eslint-disable-next-line no-new-func
  return Function(`${src}\n;return MATCHES;`)();
}

function buildDateRange() {
  const start = '20260611';
  const end = new Date();
  end.setDate(end.getDate() + 3);
  const endStr = end.toISOString().slice(0, 10).replace(/-/g, '');
  return `${start}-${endStr}`;
}

async function fetchESPNStandings() {
  const res = await fetch(ESPN_STANDINGS, { cache: 'no-store' });
  if (!res.ok) throw new Error(`ESPN standings HTTP ${res.status}`);
  const data = await res.json();

  const out = {};
  const children = data.children
    || data.standings?.groups
    || (data.standings ? [data.standings] : []);

  children.forEach(group => {
    const raw = group.abbreviation || group.name || group.shortName || '';
    const letter = raw.replace(/^Group\s*/i, '').trim().toUpperCase();
    if (!letter || letter.length !== 1) return;

    const entries = group.standings?.entries || group.entries || [];
    out[letter] = entries.map(entry => {
      const name = normName(entry.team?.displayName || entry.team?.shortDisplayName || '');
      const s = {};
      (entry.stats || []).forEach(st => { s[st.name] = Number(st.value || 0); });
      return {
        name,
        p:   s.gamesPlayed   || 0,
        w:   s.wins          || 0,
        d:   s.ties          || s.draws || 0,
        l:   s.losses        || 0,
        gf:  s.pointsFor     || s.goalsFor || 0,
        ga:  s.pointsAgainst || s.goalsAgainst || 0,
        pts: s.points        || 0,
      };
    }).filter(t => t.name);
  });

  return Object.keys(out).length ? out : null;
}

async function fetchESPNScores(MATCHES) {
  const url = `${ESPN_SCOREBOARD}?dates=${buildDateRange()}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`ESPN scoreboard HTTP ${res.status}`);
  const data = await res.json();

  const out = {};
  (data.events || []).forEach(event => {
    const comp = event.competitions?.[0];
    if (!comp) return;
    const hComp = comp.competitors?.find(c => c.homeAway === 'home');
    const aComp = comp.competitors?.find(c => c.homeAway === 'away');
    if (!hComp || !aComp) return;

    const espnHome = normName(hComp.team?.displayName);
    const espnAway = normName(aComp.team?.displayName);
    const hScore = parseInt(hComp.score ?? '-1');
    const aScore = parseInt(aComp.score ?? '-1');

    const type   = event.status?.type || {};
    const state  = type.state || 'pre';
    const done   = type.completed === true || state === 'post';
    const status = done ? 'FT' : (state === 'in' ? 'LIVE' : 'SCHEDULED');
    const clock  = type.shortDetail || event.status?.displayClock || '';

    const match = MATCHES.find(m =>
      (m.home === espnHome && m.away === espnAway) ||
      (m.home === espnAway && m.away === espnHome)
    );
    if (!match) return;

    const swapped = match.home === espnAway;
    out[match.id] = {
      home: swapped ? aScore : hScore,
      away: swapped ? hScore : aScore,
      status, clock, espnId: String(event.id),
    };
  });

  return Object.keys(out).length ? out : null;
}

async function main() {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT secret is not set');
  }
  const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({ credential: admin.credential.cert(sa), databaseURL: DB_URL });

  const MATCHES = loadMatches();

  // Fetch both; tolerate one source failing so a standings hiccup doesn't block scores.
  const [standings, scores] = await Promise.all([
    fetchESPNStandings().catch(e => { console.warn('standings:', e.message); return null; }),
    fetchESPNScores(MATCHES).catch(e => { console.warn('scores:', e.message); return null; }),
  ]);

  if (!standings && !scores) {
    throw new Error('Both ESPN fetches failed — leaving existing data untouched');
  }

  // Granular update: each match score written independently, so a partial fetch
  // can never wipe previously stored results.
  const updates = { _updated: Date.now() };
  if (standings) updates.standings = standings;
  if (scores) {
    Object.entries(scores).forEach(([id, sc]) => { updates[`scores/${id}`] = sc; });
  }

  await admin.database().ref('wc2026').update(updates);

  const liveCount = scores ? Object.values(scores).filter(s => s.status === 'LIVE').length : 0;
  console.log(`✅ Synced — standings:${standings ? Object.keys(standings).length + ' groups' : 'skipped'}, scores:${scores ? Object.keys(scores).length : 0} (${liveCount} live)`);
  process.exit(0);
}

main().catch(e => {
  console.error('❌ Live sync failed:', e.message);
  process.exit(1);
});
