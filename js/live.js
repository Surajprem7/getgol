// live.js — fetches real match data from ESPN public API, syncs to Firebase

const ESPN_SCOREBOARD = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard';
const ESPN_STANDINGS  = 'https://site.api.espn.com/apis/v2/sports/soccer/fifa.world/standings?season=2026';

// ESPN uses different team names — map them to ours
const ESPN_NAME_MAP = {
  'United States':                    'USA',
  'Korea Republic':                   'South Korea',
  'Republic of Korea':                'South Korea',
  'Czech Republic':                   'Czechia',
  'Bosnia and Herzegovina':           'Bosnia',
  "Côte d'Ivoire":                    'Ivory Coast',
  "Cote d'Ivoire":                    'Ivory Coast',
  'DR Congo':                         'DR Congo',
  'Congo - Kinshasa':                 'DR Congo',
  'Congo DR':                         'DR Congo',
  'Democratic Republic of the Congo': 'DR Congo',
};

function normName(n) {
  return ESPN_NAME_MAP[n] || n || '';
}

// ── Fetch & parse ESPN standings ────────────────────────────────────────────

async function fetchESPNStandings() {
  try {
    const res = await fetch(ESPN_STANDINGS, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();

    const out = {};  // { A: [{name,p,w,d,l,gf,ga,pts}, …], … }

    // ESPN can nest groups under data.children or data.standings.groups
    const children = data.children
      || data.standings?.groups
      || (data.standings ? [data.standings] : []);

    children.forEach(group => {
      // Extract the single letter from names like "Group A", "A", etc.
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

// ── Fetch & parse ESPN scoreboard ──────────────────────────────────────────

async function fetchESPNScores() {
  try {
    const res = await fetch(ESPN_SCOREBOARD, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();

    const out = {};  // { matchId: {home, away, status, clock} }

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
      const status   = event.status?.type?.name || '';   // STATUS_FINAL | STATUS_IN_PROGRESS | STATUS_SCHEDULED
      const clock    = event.status?.displayClock || '';

      // Match against our MATCHES list
      const match = MATCHES.find(m =>
        (m.home === espnHome && m.away === espnAway) ||
        (m.home === espnAway && m.away === espnHome)
      );
      if (!match) return;

      const swapped = match.home === espnAway;
      const finalHome = swapped ? aScore : hScore;
      const finalAway = swapped ? hScore : aScore;

      out[match.id] = { home: finalHome, away: finalAway, status, clock };

      // Cache final scores locally so standings can fall back to localStorage
      if (status === 'STATUS_FINAL') {
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
    const updates = { _updated: Date.now() };
    if (standings) updates.standings = standings;
    if (scores)    updates.scores    = scores;
    await ref.update(updates);
  } catch (e) {
    console.warn('[Gol] Firebase sync failed:', e.message);
  }
}

// ── In-memory cache (used by app.js) ───────────────────────────────────────

window.LIVE = {
  standings: null,   // { A: [{name,p,w,d,l,gf,ga,pts}], … }
  scores:    {},     // { matchId: {home,away,status,clock} }
  updatedAt: null,

  score(matchId) { return this.scores[matchId] || null; },

  // Compute standings from our own match list + cached local results (fallback)
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

  // Best available standings: ESPN > localStorage
  getStandings() { return this.standings || this.localStandings(); },
};

// ── Subscribe to Firebase for real-time push ────────────────────────────────

function subscribeFirebaseLive() {
  firebase.database().ref('wc2026').on('value', snap => {
    const val = snap.val();
    if (!val) return;

    if (val.standings) window.LIVE.standings = val.standings;
    if (val.scores)    window.LIVE.scores    = val.scores;
    if (val._updated)  window.LIVE.updatedAt = val._updated;

    // Re-render current tab if Groups or Matches is visible
    const activeTab = window._activeTab;
    if (activeTab === 'groups')  renderGroupsFromLive();
    if (activeTab === 'matches') refreshMatchScores();
  });
}

function renderGroupsFromLive() {
  const content = document.getElementById('tab-content');
  if (!content) return;
  const glass = 'background:rgba(255,255,255,0.05);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.1);border-radius:16px';
  buildStandingsTab(content, glass);
}

function refreshMatchScores() {
  // Update VS → score display for any visible match cards
  Object.entries(window.LIVE.scores).forEach(([id, sc]) => {
    const vsEl = document.getElementById('vs-' + id);
    if (!vsEl) return;
    if (sc.status === 'STATUS_FINAL' || sc.status === 'STATUS_IN_PROGRESS') {
      const live = sc.status === 'STATUS_IN_PROGRESS';
      vsEl.innerHTML = `
        ${live ? `<div style="font-size:0.55rem;color:#4ade80;font-weight:700;letter-spacing:1px;animation:pulse 1.5s infinite">● LIVE ${sc.clock}</div>` : ''}
        <div style="font-size:1.4rem;font-weight:900;color:#fff;letter-spacing:1px">${sc.home} – ${sc.away}</div>
        ${!live ? `<div style="font-size:0.6rem;color:rgba(255,255,255,0.3);margin-top:2px">Full Time</div>` : ''}
      `;
    }
  });
}

// ── Bootstrap ───────────────────────────────────────────────────────────────

async function liveRefreshCycle() {
  const [standings, scores] = await Promise.all([fetchESPNStandings(), fetchESPNScores()]);
  if (standings) window.LIVE.standings = standings;
  if (scores)    window.LIVE.scores    = { ...window.LIVE.scores, ...scores };
  window.LIVE.updatedAt = Date.now();
  await syncLiveDataToFirebase(standings, scores);

  // Reschedule: 45s if any live match, else 5 min
  const hasLive = Object.values(window.LIVE.scores).some(s => s.status === 'STATUS_IN_PROGRESS');
  setTimeout(liveRefreshCycle, hasLive ? 45000 : 300000);
}

// Start once Firebase auth is ready
document.addEventListener('DOMContentLoaded', () => {
  subscribeFirebaseLive();   // instant push from Firebase cache
  liveRefreshCycle();        // then fetch fresh ESPN data
});
