// recall.js — "Recall Match Memory" — natural language match query engine.
// Answers questions about WC2026 match results, team stats, and player events
// using local MATCHES/LIVE data + on-demand ESPN summary fetches (cached in localStorage).

const RECALL_CACHE_KEY = 'gol_recall_cache';
const ESPN_SUMMARY_BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary?event=';

// ── Cache helpers ────────────────────────────────────────────────────────────
function recallCache() {
  try { return JSON.parse(localStorage.getItem(RECALL_CACHE_KEY) || '{}'); } catch { return {}; }
}
function recallCacheSave(cache) {
  try { localStorage.setItem(RECALL_CACHE_KEY, JSON.stringify(cache)); } catch {}
}
async function fetchSummary(espnId) {
  const cache = recallCache();
  if (cache[espnId]) return cache[espnId];
  try {
    const res = await fetch(ESPN_SUMMARY_BASE + espnId, { cache: 'no-store' });
    const data = await res.json();
    if (data && data.keyEvents) {
      cache[espnId] = data;
      recallCacheSave(cache);
    }
    return data;
  } catch { return null; }
}

// ── All finished matches (group + KO) ────────────────────────────────────────
function recallAllMatches() {
  const scores = (window.LIVE && window.LIVE.scores) || {};
  const results = [];

  // Group stage
  for (const m of (typeof MATCHES !== 'undefined' ? MATCHES : [])) {
    const sc = scores[m.id];
    if (!sc || sc.status !== 'FT') continue;
    results.push({
      home: m.home, away: m.away,
      homeScore: sc.home, awayScore: sc.away,
      espnId: sc.espnId, group: m.group,
      round: 'Group ' + m.group, date: m.date
    });
  }

  // Knockout
  if (window._koData) {
    for (const list of Object.values(window._koData)) {
      for (const ev of list) {
        if (ev.status !== 'FT') continue;
        results.push({
          home: ev.home.name, away: ev.away.name,
          homeScore: ev.home.score, awayScore: ev.away.score,
          espnId: ev.espnId, group: null,
          round: ev.round || 'Knockout', date: ev.date
        });
      }
    }
  }
  return results;
}

// ── Normalise names for fuzzy matching ───────────────────────────────────────
function recallNorm(s) {
  return (s || '').toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
}
function recallContains(haystack, needle) {
  return recallNorm(haystack).includes(recallNorm(needle));
}

// ── Team stats from local data ────────────────────────────────────────────────
function teamStats(teamName) {
  const matches = recallAllMatches().filter(m =>
    recallContains(m.home, teamName) || recallContains(m.away, teamName)
  );
  if (!matches.length) return null;

  let w = 0, d = 0, l = 0, gf = 0, ga = 0;
  for (const m of matches) {
    const isHome = recallContains(m.home, teamName);
    const myScore = isHome ? m.homeScore : m.awayScore;
    const opScore = isHome ? m.awayScore : m.homeScore;
    gf += myScore; ga += opScore;
    if (myScore > opScore) w++;
    else if (myScore === opScore) d++;
    else l++;
  }
  return { team: matches[0][recallContains(matches[0].home, teamName) ? 'home' : 'away'],
           played: matches.length, w, d, l, gf, ga, matches };
}

// ── Player events across all fetched summaries ────────────────────────────────
async function playerEvents(playerName, eventType) {
  const matches = recallAllMatches();
  const cache = recallCache();
  const espnIds = [...new Set(matches.map(m => m.espnId).filter(Boolean))];

  // Fetch uncached summaries (in parallel, max 6 at a time)
  const uncached = espnIds.filter(id => !cache[id]);
  for (let i = 0; i < uncached.length; i += 6) {
    await Promise.all(uncached.slice(i, i + 6).map(id => fetchSummary(id)));
  }

  const fresh = recallCache();
  const found = [];
  for (const id of espnIds) {
    const data = fresh[id];
    if (!data || !data.keyEvents) continue;
    const matchInfo = matches.find(m => String(m.espnId) === String(id));
    for (const ev of data.keyEvents) {
      const typeText = (ev.type?.text || '').toLowerCase();
      if (eventType && !typeText.includes(eventType.toLowerCase())) continue;
      for (const p of (ev.participants || [])) {
        const name = p.athlete?.displayName || '';
        if (recallContains(name, playerName)) {
          found.push({ name, event: ev.type?.text, minute: ev.clock?.displayValue, match: matchInfo, team: ev.team?.displayName });
        }
      }
    }
  }
  return found;
}

// ── Top scorers across all fetched summaries ──────────────────────────────────
async function topScorers(limit = 10) {
  const matches = recallAllMatches();
  const cache = recallCache();
  const espnIds = [...new Set(matches.map(m => m.espnId).filter(Boolean))];
  const uncached = espnIds.filter(id => !cache[id]);
  for (let i = 0; i < uncached.length; i += 6) {
    await Promise.all(uncached.slice(i, i + 6).map(id => fetchSummary(id)));
  }
  const fresh = recallCache();
  const scorers = {};
  for (const id of espnIds) {
    const data = fresh[id];
    if (!data || !data.keyEvents) continue;
    for (const ev of data.keyEvents) {
      const typeText = (ev.type?.text || '').toLowerCase();
      if (!typeText.includes('goal') || typeText.includes('own goal')) continue;
      const scorer = ev.participants?.[0]?.athlete?.displayName;
      const team = ev.team?.displayName || '';
      if (!scorer) continue;
      if (!scorers[scorer]) scorers[scorer] = { name: scorer, team, goals: 0 };
      scorers[scorer].goals++;
    }
  }
  return Object.values(scorers).sort((a, b) => b.goals - a.goals).slice(0, limit);
}

// ── Intent parser + answer engine ────────────────────────────────────────────
async function recallAnswer(question) {
  const q = recallNorm(question);
  const allMatches = recallAllMatches();

  // Helper: find team name match in question
  const allTeams = [...new Set(allMatches.flatMap(m => [m.home, m.away]))];
  const teamsFound = allTeams.filter(t => q.includes(recallNorm(t)));

  // ── Top scorers ──────────────────────────────────────────────────────────
  if (/top scorer|most goal|leading scorer|golden boot/.test(q)) {
    const scorers = await topScorers(8);
    if (!scorers.length) return { type: 'info', text: 'No goal data cached yet. Try asking about a specific player or team first.' };
    const rows = scorers.map((s, i) => `${i + 1}. ${s.name} (${s.team}) — ${s.goals} goal${s.goals > 1 ? 's' : ''}`).join('\n');
    return { type: 'list', title: '🥇 Top Scorers', text: rows };
  }

  // ── Player goals ──────────────────────────────────────────────────────────
  if (/goal|score|scored/.test(q) && teamsFound.length === 0) {
    // Try to extract player name — words not in stop list
    const stop = new Set(['how','many','goals','scored','score','did','the','a','in','for','by','this','tournament','world','cup','wc','all','matches','game','games']);
    const words = q.split(' ').filter(w => w.length > 2 && !stop.has(w));
    if (words.length) {
      const playerQuery = words.join(' ');
      const events = await playerEvents(playerQuery, 'goal');
      if (!events.length) return { type: 'info', text: `No goals found for "${words.join(' ')}". Check the spelling or try a team name instead.` };
      const byPlayer = {};
      for (const e of events) {
        const key = e.name;
        if (!byPlayer[key]) byPlayer[key] = { name: e.name, team: e.team, goals: [], matches: new Set() };
        byPlayer[key].goals.push(e);
        if (e.match) byPlayer[key].matches.add(`${e.match.home} vs ${e.match.away}`);
      }
      const results = Object.values(byPlayer);
      const lines = results.map(p =>
        `${p.name} (${p.team}) — ${p.goals.length} goal${p.goals.length > 1 ? 's' : ''}\nMatches: ${[...p.matches].join(', ')}`
      ).join('\n\n');
      return { type: 'player', title: `⚽ Goals`, text: lines };
    }
  }

  // ── Player cards / fouls ─────────────────────────────────────────────────
  if (/card|yellow|red|foul|book/.test(q)) {
    const stop = new Set(['how','many','cards','yellow','red','card','did','the','a','in','for','by','foul','fouls','booked','get','got']);
    const words = q.split(' ').filter(w => w.length > 2 && !stop.has(w));
    const cardType = q.includes('red') ? 'red' : q.includes('yellow') ? 'yellow' : 'card';
    if (words.length) {
      const events = await playerEvents(words.join(' '), cardType);
      if (!events.length) return { type: 'info', text: `No ${cardType} cards found for "${words.join(' ')}".` };
      const lines = events.map(e => `${e.name} — ${e.event} (${e.minute || '?'}') vs ${e.match ? (e.match.home + ' v ' + e.match.away) : 'unknown'}`).join('\n');
      return { type: 'player', title: `🟨 Cards`, text: lines };
    }
  }

  // ── Team vs Team ─────────────────────────────────────────────────────────
  if (teamsFound.length >= 2) {
    const [t1, t2] = teamsFound;
    const m = allMatches.find(m =>
      (recallContains(m.home, t1) && recallContains(m.away, t2)) ||
      (recallContains(m.home, t2) && recallContains(m.away, t1))
    );
    if (!m) return { type: 'info', text: `No completed match found between ${t1} and ${t2}.` };
    const winner = m.homeScore > m.awayScore ? m.home : m.awayScore > m.homeScore ? m.away : null;
    return { type: 'result', title: `📋 Match Result`,
      text: `${m.home} ${m.homeScore}–${m.awayScore} ${m.away}\n${winner ? winner + ' won' : 'Draw'} · ${m.round}` };
  }

  // ── Team stats (1 team) ──────────────────────────────────────────────────
  if (teamsFound.length === 1) {
    const stats = teamStats(teamsFound[0]);
    if (!stats) return { type: 'info', text: `No completed matches found for ${teamsFound[0]}.` };
    const { team, played, w, d, l, gf, ga } = stats;

    // Goals scored/conceded sub-intent
    if (/concede|against|let in/.test(q)) {
      return { type: 'stat', title: `🛡️ ${team} — Goals Conceded`, text: `${ga} goals in ${played} match${played > 1 ? 'es' : ''}` };
    }
    if (/score|goal|scored/.test(q)) {
      return { type: 'stat', title: `⚽ ${team} — Goals Scored`, text: `${gf} goals in ${played} match${played > 1 ? 'es' : ''}` };
    }
    if (/win|won|beat/.test(q)) {
      return { type: 'stat', title: `🏆 ${team} — Wins`, text: `${w} win${w !== 1 ? 's' : ''} out of ${played} matches` };
    }

    // Full summary
    const matchLines = stats.matches.map(m => {
      const isHome = recallContains(m.home, teamsFound[0]);
      const opp = isHome ? m.away : m.home;
      const myG = isHome ? m.homeScore : m.awayScore;
      const opG = isHome ? m.awayScore : m.homeScore;
      const res = myG > opG ? 'W' : myG === opG ? 'D' : 'L';
      return `${res} ${myG}–${opG} vs ${opp} (${m.round})`;
    }).join('\n');

    return { type: 'team', title: `📊 ${team}`,
      text: `${played} matches · ${w}W ${d}D ${l}L\nGoals: ${gf} scored, ${ga} conceded\n\n${matchLines}` };
  }

  // ── Who won / beat ───────────────────────────────────────────────────────
  if (/who won|who beat|who scored|winner/.test(q)) {
    return { type: 'info', text: 'Try mentioning a team name, e.g. "Who beat Argentina?" or "Who won the semi-final?"' };
  }

  return { type: 'info', text: 'Try asking about a team ("How many goals did Brazil score?"), a player ("How many goals did Mbappe score?"), or the top scorers ("Who are the top scorers?").' };
}

// ── Render the Recall UI ──────────────────────────────────────────────────────
function renderRecall(container) {
  const accent = APP.teamColor || '#f0a500';
  const glass = 'background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:16px';

  const suggestions = [
    'Top scorers', 'How many goals did Brazil score?',
    'Did France win?', 'Argentina vs France result',
    'How many goals did Mbappe score?', 'Who got red cards?'
  ];

  container.innerHTML = `
    <div style="margin:1.5rem 0 0.75rem;display:flex;align-items:center;gap:0.5rem">
      <div style="font-size:1.1rem;font-weight:700;color:#fff">🧠 Recall Match Memory</div>
    </div>
    <div style="font-size:0.72rem;color:rgba(255,255,255,0.4);margin-bottom:1rem">Ask anything about WC2026 matches</div>

    <div style="position:relative;margin-bottom:0.75rem">
      <input id="recall-input" type="text" placeholder="e.g. How many goals did Mbappe score?"
        style="width:100%;box-sizing:border-box;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.15);border-radius:14px;padding:0.75rem 3rem 0.75rem 1rem;color:#fff;font-size:0.88rem;outline:none;font-family:inherit"
        oninput="recallInputChange(this.value)"
        onkeydown="if(event.key==='Enter')recallAsk()">
      <button onclick="recallAsk()" id="recall-submit"
        style="position:absolute;right:0.5rem;top:50%;transform:translateY(-50%);background:${accent};border:none;border-radius:10px;width:32px;height:32px;cursor:pointer;font-size:1rem;display:flex;align-items:center;justify-content:center">→</button>
    </div>

    <div id="recall-suggestions" style="display:flex;flex-wrap:wrap;gap:0.4rem;margin-bottom:1rem">
      ${suggestions.map(s => `<button onclick="recallSuggest(this.textContent)" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);border-radius:20px;color:rgba(255,255,255,0.65);font-size:0.7rem;padding:0.3rem 0.7rem;cursor:pointer">${s}</button>`).join('')}
    </div>

    <div id="recall-result"></div>
  `;
}

function recallInputChange(val) {
  const btn = document.getElementById('recall-submit');
  if (btn) btn.style.opacity = val.trim() ? '1' : '0.5';
}

function recallSuggest(text) {
  const input = document.getElementById('recall-input');
  if (input) { input.value = text; recallInputChange(text); }
  recallAsk();
}

function recallShowResult(answer) {
  const el = document.getElementById('recall-result');
  if (!el) return;
  const accent = APP.teamColor || '#f0a500';
  const glass = 'background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:16px';
  const color = answer.type === 'info' ? 'rgba(255,255,255,0.4)' : '#fff';
  el.innerHTML = `
    <div style="${glass};padding:1rem 1.1rem">
      ${answer.title ? `<div style="font-size:0.78rem;font-weight:800;color:${accent};margin-bottom:0.5rem">${answer.title}</div>` : ''}
      <div style="font-size:0.82rem;color:${color};white-space:pre-line;line-height:1.6">${answer.text}</div>
    </div>`;
}

async function recallAsk() {
  const input = document.getElementById('recall-input');
  const resultEl = document.getElementById('recall-result');
  if (!input || !resultEl) return;
  const q = input.value.trim();
  if (!q) return;

  const glass = 'background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:16px';
  resultEl.innerHTML = `<div style="${glass};padding:1rem 1.1rem;text-align:center;color:rgba(255,255,255,0.4);font-size:0.82rem">🔍 Searching match data…</div>`;

  const answer = await recallAnswer(q);
  recallShowResult(answer);
}
