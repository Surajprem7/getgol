// sync-live-data.mjs
// Runs in GitHub Actions (server-side). Fetches live match scores, group
// standings, and team line-ups from ESPN's public API and writes them to
// Firebase. This is meant to be the SINGLE writer of live data, so browser
// clients can be read-only instead of every visitor hammering ESPN.
//
// Writes:
//   wc2026/standings, wc2026/scores/<id>, wc2026/_updated   (small, streamed to clients)
//   lineups/<id>   (bulky line-up/stats JSON, read per-match on demand by clients)
//
// Mirrors the parsing logic in js/live.js + js/matchdetail.js so the shapes
// match what the app already reads. A failed run never overwrites good data.

import admin from 'firebase-admin';
import { readFileSync } from 'node:fs';

const DB_URL = 'https://getgol7-default-rtdb.asia-southeast1.firebasedatabase.app';

const ESPN_SCOREBOARD = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard';
const ESPN_STANDINGS  = 'https://site.api.espn.com/apis/v2/sports/soccer/fifa.world/standings?season=2026';
const ESPN_SUMMARY    = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary?event=';

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

// ── Standings ────────────────────────────────────────────────────────────────
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

// ── Scoreboard (fetched once, reused for scores + schedule + line-up ids) ─────
// Covers the full tournament (group stage + knockout) using a dynamic end date.
async function fetchScoreboardEvents() {
  const url = `${ESPN_SCOREBOARD}?dates=${buildDateRange()}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`ESPN scoreboard HTTP ${res.status}`);
  const data = await res.json();
  return data.events || [];
}

// IST date ('YYYY-MM-DD') + time ('HH:MM') for an ISO timestamp.
function istDateTime(iso) {
  const f = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date(iso));
  const g = t => f.find(x => x.type === t).value;
  const hh = g('hour') === '24' ? '00' : g('hour');
  return { date: `${g('year')}-${g('month')}-${g('day')}`, time: `${hh}:${g('minute')}` };
}

// Authoritative date/time per match id, in IST.
function buildSchedule(mapped) {
  const out = {};
  mapped.forEach(({ matchId, event }) => { out[matchId] = istDateTime(event.date); });
  return out;
}

// Map each ESPN event to one of our matches → { matchId, event, swapped }
function mapEvents(events, MATCHES) {
  const mapped = [];
  events.forEach(event => {
    const comp = event.competitions?.[0];
    if (!comp) return;
    const hComp = comp.competitors?.find(c => c.homeAway === 'home');
    const aComp = comp.competitors?.find(c => c.homeAway === 'away');
    if (!hComp || !aComp) return;

    const espnHome = normName(hComp.team?.displayName);
    const espnAway = normName(aComp.team?.displayName);
    const match = MATCHES.find(m =>
      (m.home === espnHome && m.away === espnAway) ||
      (m.home === espnAway && m.away === espnHome)
    );
    if (!match) return;
    mapped.push({ matchId: match.id, event, hComp, aComp, swapped: match.home === espnAway });
  });
  return mapped;
}

function parseScores(mapped) {
  const out = {};
  mapped.forEach(({ matchId, event, hComp, aComp, swapped }) => {
    const hScore = parseInt(hComp.score ?? '-1');
    const aScore = parseInt(aComp.score ?? '-1');
    const type   = event.status?.type || {};
    const state  = type.state || 'pre';
    const done   = type.completed === true || state === 'post';
    const status = done ? 'FT' : (state === 'in' ? 'LIVE' : 'SCHEDULED');
    const clock  = type.shortDetail || event.status?.displayClock || '';
    out[matchId] = {
      home: swapped ? aScore : hScore,
      away: swapped ? hScore : aScore,
      status, clock, espnId: String(event.id),
    };
  });
  return Object.keys(out).length ? out : null;
}

// ── Line-ups ─────────────────────────────────────────────────────────────────

// Trim an ESPN summary down to exactly what js/matchdetail.js reads, so the
// stored payload is small and the client code works unchanged.
// Pick the national-kit shirt image (prefer the dark-mode variant for our UI).
function pickKit(jerseyImages) {
  const ji = jerseyImages || [];
  const dark = ji.find(x => (x.rel || []).includes('dark')) || ji[0];
  return dark ? dark.href : '';
}

function slimSummary(d) {
  if (!d) return null;
  const rosters = (d.rosters || []).map(r => ({
    homeAway: r.homeAway,
    formation: r.formation || '',
    team: { id: r.team?.id ?? null, displayName: r.team?.displayName || '' },
    roster: (r.roster || []).map(p => ({
      starter: !!p.starter,
      jersey: p.jersey || '',
      formationPlace: p.formationPlace || '',
      position: { abbreviation: p.position?.abbreviation || '' },
      athlete: {
        id: p.athlete?.id ?? null,
        shortName: p.athlete?.shortName || '',
        displayName: p.athlete?.displayName || '',
        // National-kit shirt image (dark-mode variant suits the dark UI).
        kit: pickKit(p.athlete?.jerseyImages),
      },
    })),
  })).filter(r => r.roster.length);

  if (!rosters.length) return null;   // line-up not posted yet → don't store

  const teams = (d.boxscore?.teams || []).map(t => ({
    homeAway: t.homeAway,
    statistics: (t.statistics || []).map(s => ({ name: s.name, displayValue: s.displayValue })),
  }));

  const keyEvents = (d.keyEvents || [])
    .filter(e => /goal|card|substitution/i.test(e.type?.text || ''))
    .map(e => ({
      type: { text: e.type?.text || '' },
      team: { id: e.team?.id ?? null },
      participants: (e.participants || []).slice(0, 1).map(pt => ({
        athlete: { displayName: pt.athlete?.displayName || '' },
      })),
      clock: { displayValue: e.clock?.displayValue || '' },
    }));

  return { rosters, boxscore: { teams }, keyEvents, syncedAt: Date.now() };
}

// Fetch summaries for all mapped events, with a small concurrency pool.
async function fetchLineups(mapped) {
  const out = {};
  const pool = 6;
  let i = 0;
  async function worker() {
    while (i < mapped.length) {
      const { matchId, event } = mapped[i++];
      try {
        const res = await fetch(ESPN_SUMMARY + event.id, { cache: 'no-store' });
        if (!res.ok) continue;
        const slim = slimSummary(await res.json());
        if (slim) out[matchId] = slim;
      } catch { /* skip this one */ }
    }
  }
  await Promise.all(Array.from({ length: pool }, worker));
  return out;
}

// ── Elo ranking calculation ───────────────────────────────────────────────────
// FIFA formula: New Points = Old Points + K × (Result − 1/(1 + 10^(−ΔPoints/600)))
// K = 60 for WC group stage (no penalties in group stage, so W = 1 / 0.5 / 0 only).
const ELO_K = 60;

function eloExpected(ptsA, ptsB) {
  return 1 / (1 + Math.pow(10, -(ptsA - ptsB) / 600));
}

function applyEloMatch(rankMap, homeTeam, awayTeam, homeGoals, awayGoals) {
  const home = rankMap[homeTeam];
  const away = rankMap[awayTeam];
  if (!home || !away) {
    console.warn(`Elo skip — team not in rankings: "${homeTeam}" vs "${awayTeam}"`);
    return false;
  }
  const W_e = eloExpected(home.points, away.points);
  const W_home = homeGoals > awayGoals ? 1 : homeGoals < awayGoals ? 0 : 0.5;
  home.points = Math.round((home.points + ELO_K * (W_home - W_e)) * 100) / 100;
  away.points = Math.round((away.points + ELO_K * ((1 - W_home) - (1 - W_e))) * 100) / 100;
  return true;
}

function reRankAll(rankMap) {
  return Object.values(rankMap)
    .sort((a, b) => b.points - a.points)
    .map((t, i) => ({ rank: i + 1, name: t.name, points: t.points }));
}

// Build a flat list of all FT events from ESPN (group stage + knockout).
function extractFtEvents(events) {
  return events
    .map(event => {
      const comp = event.competitions?.[0];
      if (!comp) return null;
      const hComp = comp.competitors?.find(c => c.homeAway === 'home');
      const aComp = comp.competitors?.find(c => c.homeAway === 'away');
      if (!hComp || !aComp) return null;
      const type = event.status?.type || {};
      const done = type.completed === true || type.state === 'post';
      if (!done) return null;
      const hScore = parseInt(hComp.score ?? '-1');
      const aScore = parseInt(aComp.score ?? '-1');
      if (hScore < 0 || aScore < 0) return null;
      // For penalty shootouts (knockout), ESPN shortDetail contains "PKs" or "PK".
      // FIFA Elo treats a PK win as 0.75, loss as 0.25.
      const detail = (type.shortDetail || '').toLowerCase();
      const isPK = detail.includes('pk') || detail.includes('penalt');
      return {
        id: `espn_${event.id}`,
        home: normName(hComp.team?.displayName),
        away: normName(aComp.team?.displayName),
        hScore, aScore, isPK,
      };
    })
    .filter(Boolean);
}

async function updateEloRankings(db, events) {
  const snapshot = await db.ref('wc2026/rankings').once('value');
  const existing = snapshot.val();
  if (!Array.isArray(existing) || existing.length === 0) {
    console.log('Elo: no baseline rankings in Firebase — skipping');
    return;
  }

  const rankMap = {};
  existing.forEach(t => { rankMap[t.name] = { ...t }; });

  const calcSnap = await db.ref('wc2026/rankingsCalcMeta').once('value');
  const calcMeta = calcSnap.val() || {};
  const processed = new Set(Object.keys(calcMeta.processed || {}));

  const ftEvents = extractFtEvents(events);
  let changed = 0;
  const newlyProcessed = {};

  for (const ev of ftEvents) {
    if (processed.has(ev.id)) continue;
    // For PK matches, use 0.75/0.25 instead of 1/0 (FIFA rule for extra-time results).
    let hGoals = ev.hScore, aGoals = ev.aScore;
    if (ev.isPK && ev.hScore === ev.aScore) {
      // Scores are tied — winner decided on pens. We don't know who won from scores alone;
      // treat as 0.75/0.25 based on ESPN's winner flag if available, else skip.
      // ESPN doesn't expose PK score directly here so we conservatively skip to avoid errors.
      newlyProcessed[ev.id] = Date.now(); // mark as seen so we don't retry
      console.log(`Elo: PK match ${ev.home} vs ${ev.away} — skipped (scores tied, PK winner unknown)`);
      continue;
    }
    const applied = applyEloMatch(rankMap, ev.home, ev.away, hGoals, aGoals);
    if (applied) {
      newlyProcessed[ev.id] = Date.now();
      changed++;
      console.log(`Elo: ${ev.home} ${ev.hScore}–${ev.aScore} ${ev.away}${ev.isPK ? ' (AET)' : ''}`);
    }
  }

  if (changed === 0) {
    console.log('Elo: no new FT matches to process');
    return;
  }

  const updatedTable = reRankAll(rankMap);
  await db.ref('wc2026/rankings').set(updatedTable);
  await db.ref('wc2026/rankingsCalcMeta').set({
    processed: { ...(calcMeta.processed || {}), ...newlyProcessed },
    source: 'elo-calculated',
    updatedAt: Date.now(),
    matchCount: Object.keys({ ...(calcMeta.processed || {}), ...newlyProcessed }).length,
  });

  console.log(`Elo: updated ${changed} match(es) — top 3: ${updatedTable.slice(0, 3).map(t => `${t.name} ${t.points}`).join(', ')}`);
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT secret is not set');
  }
  const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({ credential: admin.credential.cert(sa), databaseURL: DB_URL });

  const MATCHES = loadMatches();
  const db = admin.database();

  const [standings, events] = await Promise.all([
    fetchESPNStandings().catch(e => { console.warn('standings:', e.message); return null; }),
    fetchScoreboardEvents().catch(e => { console.warn('scoreboard:', e.message); return []; }),
  ]);

  const mapped = mapEvents(events, MATCHES);
  const scores = parseScores(mapped);
  const schedule = buildSchedule(mapped);
  const lineups = mapped.length
    ? await fetchLineups(mapped).catch(e => { console.warn('lineups:', e.message); return {}; })
    : {};

  if (!standings && !scores && !Object.keys(lineups).length) {
    throw new Error('All ESPN fetches failed — leaving existing data untouched');
  }

  // Small, streamed-to-clients data under wc2026 (granular per-match score writes).
  const wcUpdates = { _updated: Date.now() };
  if (standings) wcUpdates.standings = standings;
  if (scores) Object.entries(scores).forEach(([id, sc]) => { wcUpdates[`scores/${id}`] = sc; });
  if (Object.keys(schedule).length) wcUpdates.schedule = schedule;
  await db.ref('wc2026').update(wcUpdates);

  // Bulky line-up data in its own node, read per-match on demand by clients.
  if (Object.keys(lineups).length) {
    await db.ref('lineups').update(lineups);
  }

  // Recalculate Elo rankings from all FT ESPN events (group stage + knockout).
  if (events.length) {
    await updateEloRankings(db, events).catch(e => console.warn('Elo rankings:', e.message));
  }

  const liveCount = scores ? Object.values(scores).filter(s => s.status === 'LIVE').length : 0;
  console.log(`✅ Synced — standings:${standings ? Object.keys(standings).length + ' groups' : 'skipped'}, scores:${scores ? Object.keys(scores).length : 0} (${liveCount} live), schedule:${Object.keys(schedule).length}, lineups:${Object.keys(lineups).length}`);
  process.exit(0);
}

main().catch(e => {
  console.error('❌ Live sync failed:', e.message);
  process.exit(1);
});
