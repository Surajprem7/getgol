// selfcheck.js — dev-only integrity checks across every data layer of the app.
// Off for normal users. Enable on localhost, with ?audit in the URL, or by
// setting localStorage.gol_debug = '1'. Results print to the browser console.

function selfChecksEnabled() {
  return /^(localhost|127\.0\.0\.1)$/.test(location.hostname)
    || location.search.includes('audit')
    || localStorage.getItem('gol_debug');
}

// ── 1. Match data (structural, no network) ───────────────────────────────────
function checkMatchData() {
  const issues = [];
  if (MATCHES.length !== 72) issues.push(`Expected 72 matches, found ${MATCHES.length}`);

  const ids = MATCHES.map(m => m.id);
  if (new Set(ids).size !== ids.length) issues.push('Duplicate match ids present');

  const groups = {};
  MATCHES.forEach(m => { (groups[m.group] = groups[m.group] || []).push(m); });

  const groupKeys = Object.keys(groups).sort().join('');
  if (groupKeys !== 'ABCDEFGHIJKL') issues.push(`Groups: expected A–L, got "${groupKeys}"`);

  Object.entries(groups).forEach(([g, ms]) => {
    if (ms.length !== 6) issues.push(`Group ${g}: ${ms.length} matches (expected 6)`);
    const teams = new Set();
    const plays = {};
    ms.forEach(m => {
      if (m.home === m.away) issues.push(`Match ${m.id}: home === away (${m.home})`);
      [m.home, m.away].forEach(t => { teams.add(t); plays[t] = (plays[t] || 0) + 1; });
    });
    if (teams.size !== 4) issues.push(`Group ${g}: ${teams.size} teams (expected 4) — ${[...teams].join(', ')}`);
    Object.entries(plays).forEach(([t, c]) => { if (c !== 3) issues.push(`Group ${g}: ${t} plays ${c} games (expected 3)`); });
  });

  MATCHES.forEach(m => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(m.date)) issues.push(`Match ${m.id}: bad date "${m.date}"`);
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(m.time)) issues.push(`Match ${m.id}: bad time "${m.time}"`);
    if (!m.venue) issues.push(`Match ${m.id}: missing venue`);
  });

  return issues;
}

// ── 2. Team coverage: flags + count ──────────────────────────────────────────
function checkTeamCoverage() {
  const issues = [];
  const teams = [...new Set(MATCHES.flatMap(m => [m.home, m.away]))];
  if (teams.length !== 48) issues.push(`Expected 48 unique teams, found ${teams.length}`);
  teams.forEach(t => {
    if (typeof getCountryCode === 'function' && getCountryCode(t) === 'un') {
      issues.push(`No flag code for "${t}" (getCountryCode → 'un')`);
    }
  });
  return issues;
}

// ── 3. FIFA rankings ─────────────────────────────────────────────────────────
function checkRankings() {
  const ranks = window.LIVE && window.LIVE.rankings;
  if (!Array.isArray(ranks) || !ranks.length) return ['(info) live rankings not loaded — app is using its built-in fallback'];

  const issues = [];
  if (ranks.length < 40) issues.push(`Only ${ranks.length} ranked teams`);
  const nums = ranks.map(r => r.rank);
  if (new Set(nums).size !== nums.length) issues.push('Duplicate rank numbers');

  const wcTeams = new Set(MATCHES.flatMap(m => [m.home, m.away]));
  const ranked = new Set(ranks.map(r => r.name));
  [...wcTeams].forEach(t => { if (!ranked.has(t)) issues.push(`Missing from rankings: "${t}" (name drift?)`); });
  return issues;
}

// ── 4. Standings vs ESPN (only when live data is present) ─────────────────────
function checkStandings() {
  if (!window.LIVE || !window.LIVE.standings) return ['(info) live ESPN standings not loaded yet'];
  const issues = [];

  const groupTeams = {};
  MATCHES.forEach(m => {
    (groupTeams[m.group] = groupTeams[m.group] || new Set()).add(m.home);
    groupTeams[m.group].add(m.away);
  });

  Object.entries(window.LIVE.standings).forEach(([g, rows]) => {
    const expected = groupTeams[g];
    if (!expected) { issues.push(`Standings: unexpected group "${g}"`); return; }
    const got = new Set((rows || []).map(r => r.name));
    [...expected].forEach(t => { if (!got.has(t)) issues.push(`Standings ${g}: "${t}" missing (ESPN name drift?)`); });
  });
  return issues;
}

// ── 5. Schedule vs ESPN kickoff times (IST) ──────────────────────────────────
async function checkScheduleVsESPN() {
  try {
    const res = await fetch(`${ESPN_SCOREBOARD}?dates=20260611-20260720`, { cache: 'no-store' });
    if (!res.ok) return [`(info) ESPN scoreboard HTTP ${res.status} — skipped`];
    const data = await res.json();

    const istParts = (iso) => {
      const f = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit',
        day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
      }).formatToParts(new Date(iso));
      const g = t => f.find(x => x.type === t).value;
      const hh = g('hour') === '24' ? '00' : g('hour');
      return { date: `${g('year')}-${g('month')}-${g('day')}`, time: `${hh}:${g('minute')}` };
    };

    const issues = [];
    (data.events || []).forEach(ev => {
      const c = ev.competitions?.[0];
      if (!c) return;
      const names = (c.competitors || []).map(x => normName(x.team?.displayName));
      const m = MATCHES.find(x => names.includes(x.home) && names.includes(x.away));
      if (!m) return;
      const espn = istParts(ev.date);
      if (espn.date !== m.date || espn.time !== m.time) {
        issues.push(`#${m.id} ${m.home} v ${m.away}: ours ${m.date} ${m.time} → ESPN ${espn.date} ${espn.time}`);
      }
    });
    return issues;
  } catch (e) {
    return [`(info) schedule check skipped: ${e.message}`];
  }
}

// ── Runner ───────────────────────────────────────────────────────────────────
async function runSelfChecks() {
  if (!selfChecksEnabled()) return;

  const results = [
    ['Match data',        checkMatchData()],
    ['Team flags',        checkTeamCoverage()],
    ['Rankings',          checkRankings()],
    ['Standings vs ESPN', checkStandings()],
    ['Schedule vs ESPN',  await checkScheduleVsESPN()],
  ];

  let problems = 0;
  console.groupCollapsed('%c[Gol] Self-check', 'font-weight:bold;color:#f0a500');
  results.forEach(([name, list]) => {
    const real = list.filter(s => !s.startsWith('(info)'));
    const info = list.filter(s => s.startsWith('(info)'));
    if (real.length) {
      problems += real.length;
      console.warn(`⚠️ ${name}: ${real.length} issue(s)`);
      console.table(real);
    } else {
      console.log(`✓ ${name}${info.length ? '  ' + info.join('; ') : ''}`);
    }
  });
  console.log(problems
    ? `%c${problems} issue(s) found — see warnings above`
    : '%c✓ All checks passed', `font-weight:bold;color:${problems ? '#f87171' : '#4ade80'}`);
  console.groupEnd();
}

// Run once after live data has had a moment to load.
document.addEventListener('DOMContentLoaded', () => {
  if (selfChecksEnabled()) setTimeout(runSelfChecks, 5000);
});
