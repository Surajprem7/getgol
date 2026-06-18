// live.js — fetches real match data from ESPN public API, syncs to Firebase

const ESPN_SCOREBOARD = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard';
const ESPN_STANDINGS  = 'https://site.api.espn.com/apis/v2/sports/soccer/fifa.world/standings?season=2026';

// ESPN team name → our app name
const ESPN_NAME_MAP = {
  'United States':                    'USA',
  'Korea Republic':                   'South Korea',
  'Republic of Korea':                'South Korea',
  'Czech Republic':                   'Czechia',
  'Bosnia and Herzegovina':           'Bosnia',
  'Bosnia-Herzegovina':               'Bosnia',
  "Côte d'Ivoire":                    'Ivory Coast',
  "Cote d'Ivoire":                    'Ivory Coast',
  'DR Congo':                         'DR Congo',
  'Congo - Kinshasa':                 'DR Congo',
  'Congo DR':                         'DR Congo',
  'Democratic Republic of the Congo': 'DR Congo',
  'Türkiye':                          'Turkey',
  'Turkiye':                          'Turkey',
  'Curaçao':                          'Curacao',
  'Curacao':                          'Curacao',
  'Cape Verde Islands':               'Cape Verde',
};

function normName(n) {
  return ESPN_NAME_MAP[n] || n || '';
}

// Build date range string covering tournament start → today + 3 days
function buildDateRange() {
  const start = '20260611';
  const end = new Date();
  end.setDate(end.getDate() + 3);
  const endStr = end.toISOString().slice(0, 10).replace(/-/g, '');
  return `${start}-${endStr}`;
}

// ── Fetch & parse ESPN standings ────────────────────────────────────────────

async function fetchESPNStandings() {
  try {
    const res = await fetch(ESPN_STANDINGS, { cache: 'no-store' });
    if (!res.ok) return null;
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
          d:   s.ties          || s.draws  || 0,
          l:   s.losses        || 0,
          gf:  s.pointsFor     || s.goalsFor     || 0,
          ga:  s.pointsAgainst || s.goalsAgainst || 0,
          pts: s.points        || 0,
        };
      }).filter(t => t.name);
    });

    return Object.keys(out).length ? out : null;
  } catch (e) {
    console.warn('[Gol] Standings fetch failed:', e.message);
    return null;
  }
}

// ── Fetch & parse ESPN scoreboard (full tournament date range) ──────────────

async function fetchESPNScores() {
  try {
    const dateRange = buildDateRange();
    const url = `${ESPN_SCOREBOARD}?dates=${dateRange}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
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
      const hScore   = parseInt(hComp.score ?? '-1');
      const aScore   = parseInt(aComp.score ?? '-1');
      // ESPN soccer uses many status.type.name values (STATUS_FULL_TIME,
      // STATUS_FIRST_HALF, STATUS_HALFTIME, etc). The reliable cross-sport
      // signal is status.type.state: 'pre' | 'in' | 'post'.
      const type     = event.status?.type || {};
      const state    = type.state || 'pre';                 // pre | in | post
      const done     = type.completed === true || state === 'post';
      const status   = done ? 'FT' : (state === 'in' ? 'LIVE' : 'SCHEDULED');
      const clock    = type.shortDetail || event.status?.displayClock || '';

      const match = MATCHES.find(m =>
        (m.home === espnHome && m.away === espnAway) ||
        (m.home === espnAway && m.away === espnHome)
      );
      if (!match) return;

      const swapped  = match.home === espnAway;
      const finalHome = swapped ? aScore : hScore;
      const finalAway = swapped ? hScore : aScore;

      out[match.id] = { home: finalHome, away: finalAway, status, clock, espnId: event.id };

      if (status === 'FT') {
        localStorage.setItem('result_' + match.id, `${finalHome}-${finalAway}`);
      }
    });

    return Object.keys(out).length ? out : null;
  } catch (e) {
    console.warn('[Gol] Scores fetch failed:', e.message);
    return null;
  }
}

// ── Sync to Firebase ────────────────────────────────────────────────────────

async function syncLiveDataToFirebase(standings, scores) {
  try {
    const ref = firebase.database().ref('wc2026');
    // Use granular path updates so each match score is written independently
    // — this prevents a partial fetch from wiping previously stored results
    const updates = { _updated: Date.now() };
    if (standings) updates.standings = standings;
    if (scores) {
      Object.entries(scores).forEach(([id, sc]) => {
        updates[`scores/${id}`] = sc;
      });
    }
    await ref.update(updates);
  } catch (e) {
    console.warn('[Gol] Firebase sync failed:', e.message);
  }
}

// ── In-memory cache (used by app.js) ───────────────────────────────────────

window.LIVE = {
  standings: null,
  scores:    {},
  rankings:  null,   // [{rank,name,points}] — synced from FIFA via GitHub Action
  rankingsMeta: null,
  updatedAt: null,

  score(matchId) { return this.scores[matchId] || null; },

  localStandings() {
    const groupTeams = {};
    MATCHES.forEach(m => {
      if (!groupTeams[m.group]) groupTeams[m.group] = {};
      [m.home, m.away].forEach(t => {
        if (!groupTeams[m.group][t]) groupTeams[m.group][t] = {name:t,p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0};
      });
    });
    MATCHES.forEach(m => {
      const res = localStorage.getItem('result_' + m.id);
      if (!res) return;
      const [hg, ag] = res.split('-').map(Number);
      const h = groupTeams[m.group][m.home];
      const a = groupTeams[m.group][m.away];
      h.p++; a.p++; h.gf += hg; h.ga += ag; a.gf += ag; a.ga += hg;
      if (hg > ag)      { h.w++; h.pts += 3; a.l++; }
      else if (hg < ag) { a.w++; a.pts += 3; h.l++; }
      else              { h.d++; h.pts++; a.d++; a.pts++; }
    });
    const out = {};
    Object.keys(groupTeams).sort().forEach(g => {
      out[g] = Object.values(groupTeams[g]).sort((a,b) =>
        b.pts - a.pts || (b.gf-b.ga)-(a.gf-a.ga) || b.gf-a.gf
      );
    });
    return out;
  },

  getStandings() { return this.standings || this.localStandings(); },
};

// ── Subscribe to Firebase for real-time push ────────────────────────────────

function subscribeFirebaseLive() {
  firebase.database().ref('wc2026').on('value', snap => {
    const val = snap.val();
    if (!val) return;

    if (val.standings) window.LIVE.standings = val.standings;
    // Merge, never replace — so a partial push doesn't wipe older results
    let matchJustEnded = false;
    if (val.scores) {
      window.LIVE.scores = { ...window.LIVE.scores, ...val.scores };
      // Detect kickoff/goal/full-time and fire local notifications (Tier 1)
      if (typeof notifyScoreChanges === 'function') notifyScoreChanges(window.LIVE.scores);
      matchJustEnded = detectNewlyFinished(window.LIVE.scores);
    }
    if (val.rankings)     window.LIVE.rankings     = val.rankings;
    if (val.rankingsMeta) window.LIVE.rankingsMeta = val.rankingsMeta;
    if (val._updated)  window.LIVE.updatedAt = val._updated;

    const activeTab = window._activeTab;
    if (activeTab === 'groups')   renderGroupsFromLive();
    if (activeTab === 'matches')  refreshMatchScores();
    if (activeTab === 'rankings') showTab('rankings');
    if (activeTab === 'knockout') {
      // A finished match can change who advances → pull a fresh ESPN bracket;
      // otherwise just re-render the provisional teams from cache (network-free).
      if (matchJustEnded) { window._koData = null; rebuildKnockoutFromLive(); }
      else renderKnockoutFromLive();
    }
  });
}

// True only when a match newly flips to Full Time (event-driven, not polling).
let _ftSeen = null;
function detectNewlyFinished(scores) {
  const now = new Set(Object.entries(scores).filter(([, s]) => s.status === 'FT').map(([id]) => id));
  if (_ftSeen === null) { _ftSeen = now; return false; }  // baseline on first load
  let isNew = false;
  now.forEach(id => { if (!_ftSeen.has(id)) isNew = true; });
  _ftSeen = now;
  return isNew;
}

// Refetch the ESPN bracket (real teams + scores) after a match ends.
function rebuildKnockoutFromLive() {
  try {
    if (typeof buildKnockoutTab !== 'function') return;
    const content = document.getElementById('tab-content');
    if (!content) return;
    const glass = 'background:rgba(255,255,255,0.05);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.1);border-radius:16px';
    buildKnockoutTab(content, glass);
  } catch (e) { /* never break the live loop */ }
}

function renderGroupsFromLive() {
  const content = document.getElementById('tab-content');
  if (!content) return;
  const glass = 'background:rgba(255,255,255,0.05);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.1);border-radius:16px';
  buildStandingsTab(content, glass);
}

// Re-render the knockout bracket from cached ESPN data so the provisional
// teams refresh against the latest standings on every live update. Cheap and
// network-free (guarded so a missing cache or function can't throw).
function renderKnockoutFromLive() {
  try {
    if (!window._koData || typeof renderKnockout !== 'function') return;
    const content = document.getElementById('tab-content');
    if (!content) return;
    const glass = 'background:rgba(255,255,255,0.05);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.1);border-radius:16px';
    renderKnockout(content, glass, window._koData);
  } catch (e) { /* never let a re-render break the live loop */ }
}

function refreshMatchScores() {
  // Updates every score element — full match cards and the compact "your
  // fixtures" rows — from window.LIVE. data-vs holds the match id; data-vs-style
  // picks the layout. Using attributes (not unique ids) lets the same match
  // appear in both places without id collisions.
  document.querySelectorAll('[data-vs]').forEach(el => {
    const id = el.dataset.vs;
    if (el.dataset.vsStyle === 'mini') {
      if (typeof shortScoreHTML === 'function') el.innerHTML = shortScoreHTML(id);
    } else {
      if (typeof renderVS === 'function') el.innerHTML = renderVS(id);
    }
  });
}

// ── Bootstrap ───────────────────────────────────────────────────────────────

async function liveRefreshCycle() {
  const [standings, scores] = await Promise.all([fetchESPNStandings(), fetchESPNScores()]);
  if (standings) window.LIVE.standings = standings;
  if (scores)    window.LIVE.scores    = { ...window.LIVE.scores, ...scores };
  window.LIVE.updatedAt = Date.now();

  // Update visible UI immediately
  const activeTab = window._activeTab;
  if (activeTab === 'groups')  renderGroupsFromLive();
  if (activeTab === 'matches') refreshMatchScores();

  await syncLiveDataToFirebase(standings, scores);

  const hasLive = Object.values(window.LIVE.scores).some(s => s.status === 'LIVE');
  setTimeout(liveRefreshCycle, hasLive ? 45000 : 300000);
}

document.addEventListener('DOMContentLoaded', () => {
  subscribeFirebaseLive();
  liveRefreshCycle();
});
