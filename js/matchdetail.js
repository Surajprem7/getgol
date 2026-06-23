// matchdetail.js — expandable match detail: line-ups (formation pitch), stats,
// and a goals/cards timeline. Data from ESPN's free summary endpoint.

const ESPN_SUMMARY = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary?event=';
const ESPN_SB      = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=';

const MD = { match: null, data: null, tab: 'lineups', team: 'home' };

// National-kit shirt image for a player. Works whether the data came from the
// pre-fetched Firebase payload (athlete.kit) or a live ESPN summary (jerseyImages).
function mdKitImg(p) {
  const a = p.athlete || {};
  if (a.kit) return a.kit;
  const ji = a.jerseyImages || [];
  const dark = ji.find(x => (x.rel || []).includes('dark')) || ji[0];
  return dark ? dark.href : '';
}

function mdGlass() {
  return 'background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:16px';
}

// Resolve the ESPN event id for one of our matches.
async function mdResolveEventId(m) {
  const cached = window.LIVE && window.LIVE.scores[m.id] && window.LIVE.scores[m.id].espnId;
  if (cached) return cached;
  // Fall back to the scoreboard, matching by team names. Query a ±1 day range
  // because our IST match dates can sit on a different US calendar day than ESPN.
  try {
    const base = new Date(m.date);
    const fmt = d => d.toISOString().slice(0, 10).replace(/-/g, '');
    const from = new Date(base); from.setDate(from.getDate() - 1);
    const to = new Date(base);   to.setDate(to.getDate() + 1);
    const res = await fetch(`${ESPN_SB}${fmt(from)}-${fmt(to)}`, { cache: 'no-store' });
    const data = await res.json();
    const norm = (typeof normName === 'function') ? normName : (x => x);
    for (const ev of (data.events || [])) {
      const comp = ev.competitions?.[0];
      const names = (comp?.competitors || []).map(c => norm(c.team?.displayName));
      if (names.includes(m.home) && names.includes(m.away)) return ev.id;
    }
  } catch (e) { /* ignore */ }
  return null;
}

// Read a pre-fetched line-up from Firebase (/lineups/<id>), if present.
async function mdStoredLineup(matchId) {
  try {
    if (typeof db === 'undefined') return null;
    const snap = await db.ref('lineups/' + matchId).once('value');
    return snap.val();
  } catch (e) { return null; }
}

async function openMatchDetail(matchId) {
  const m = MATCHES.find(x => String(x.id) === String(matchId));
  if (!m) return;
  MD.match = m; MD.data = null; MD.tab = 'lineups'; MD.team = 'home';

  // Close any already-open detail first so overlays can't stack (duplicate ids
  // would otherwise leak and each would keep firing its own ESPN fetches).
  closeMatchDetail();

  // Build shell with loading state
  const overlay = document.createElement('div');
  overlay.id = 'md-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:1100;display:flex;flex-direction:column;justify-content:flex-end';
  overlay.innerHTML = `
    <div onclick="closeMatchDetail()" style="position:absolute;inset:0;background:rgba(0,0,0,0.65)"></div>
    <div style="position:relative;z-index:1;background:linear-gradient(180deg,#0c0c1c 0%,#080812 100%);border-radius:24px 24px 0 0;max-height:92vh;max-height:92dvh;overflow-y:auto;-webkit-overflow-scrolling:touch;border-top:1px solid rgba(255,255,255,0.1)">
      <div style="width:40px;height:4px;background:rgba(255,255,255,0.15);border-radius:2px;margin:0.75rem auto 0"></div>
      <div id="md-body" style="padding:1rem 1rem 2rem">
        <div style="text-align:center;padding:3rem 1rem;color:rgba(255,255,255,0.5)">Loading match details…</div>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  // Firebase-first: the sync Action pre-fetches line-ups into /lineups/<id>, so
  // most opens are instant with no ESPN call. Read per-match (.once) so we don't
  // stream every match's line-up to every client.
  // The sync Action's cron runs unreliably (GitHub throttles high-frequency
  // schedules), so during a LIVE match the cache can be stale by hours — skip
  // it and go straight to ESPN if it's more than 2 minutes old.
  const stored = await mdStoredLineup(m.id);
  const isLive = window.LIVE && window.LIVE.score(m.id)?.status === 'LIVE';
  const stale = isLive && (!stored?.syncedAt || Date.now() - stored.syncedAt > 120000);
  if (stored && stored.rosters && stored.rosters.length && !stale) {
    MD.data = stored;
    renderMatchDetail(MD.data);
    return;
  }

  // Fallback: fetch directly from ESPN (e.g. line-up not synced yet).
  const eventId = await mdResolveEventId(m);
  if (!eventId) { renderMatchDetail(null); return; }
  try {
    const res = await fetch(ESPN_SUMMARY + eventId, { cache: 'no-store' });
    MD.data = await res.json();
  } catch (e) { MD.data = null; }
  renderMatchDetail(MD.data);
}

function closeMatchDetail() {
  const el = document.getElementById('md-overlay');
  if (el) el.remove();
}

function mdTab(tab) { MD.tab = tab; renderMatchDetail(MD.data); }
function mdTeam(side) { MD.team = side; renderMatchDetail(MD.data); }

function renderMatchDetail(data) {
  const body = document.getElementById('md-body');
  if (!body) return;
  const m = MD.match;
  const accent = APP.teamColor || '#f0a500';
  const sc = window.LIVE && window.LIVE.score(m.id);
  const norm = (typeof normName === 'function') ? normName : (x => x);

  // ── Header (always shown) ──
  const scoreMid = (sc && (sc.status === 'FT' || sc.status === 'LIVE'))
    ? `<div style="font-size:2rem;font-weight:900;color:#fff;line-height:1">${sc.home >= 0 ? sc.home : 0}–${sc.away >= 0 ? sc.away : 0}</div>
       <div style="font-size:0.6rem;font-weight:700;letter-spacing:1px;margin-top:2px;color:${sc.status === 'LIVE' ? '#4ade80' : 'rgba(255,255,255,0.4)'}">${sc.status === 'LIVE' ? '● LIVE ' + (sc.clock || '') : 'FULL TIME'}</div>`
    : `<div style="font-size:1.4rem;font-weight:900;color:rgba(255,255,255,0.25);letter-spacing:2px">VS</div>
       <div style="font-size:0.62rem;font-weight:700;color:#f0a500;margin-top:4px">${formatIST(m.date, m.time)}</div>`;

  const header = `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:0.75rem;margin-bottom:0.25rem">
      <span style="font-size:0.62rem;font-weight:700;color:#f0a500">Group ${m.group}</span>
      <button onclick="closeMatchDetail()" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:50%;width:1.9rem;height:1.9rem;color:rgba(255,255,255,0.6);font-size:0.9rem;cursor:pointer">✕</button>
    </div>
    <div style="display:flex;align-items:center;justify-content:space-between;gap:0.5rem;padding:0.5rem 0 0.75rem">
      <div style="flex:1;text-align:center">
        <img src="https://flagcdn.com/56x42/${getCountryCode(m.home)}.png" width="56" height="42" style="border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,0.4)" onerror="this.style.display='none'">
        <div style="font-size:0.82rem;color:#fff;font-weight:700;margin-top:0.4rem">${m.home}</div>
      </div>
      <div style="text-align:center;min-width:80px">${scoreMid}</div>
      <div style="flex:1;text-align:center">
        <img src="https://flagcdn.com/56x42/${getCountryCode(m.away)}.png" width="56" height="42" style="border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,0.4)" onerror="this.style.display='none'">
        <div style="font-size:0.82rem;color:#fff;font-weight:700;margin-top:0.4rem">${m.away}</div>
      </div>
    </div>
    <div style="text-align:center;font-size:0.62rem;color:rgba(255,255,255,0.3);margin-bottom:0.75rem">📍 ${m.venue}</div>
    ${(sc && (sc.status === 'FT' || sc.status === 'LIVE')) ? `
      <div style="text-align:center;margin-bottom:1rem">
        <button id="md-share-btn" onclick="shareMatchPoster(${m.id})" style="background:${accent};border:none;border-radius:22px;color:#000;font-weight:800;font-size:0.82rem;padding:0.55rem 1.4rem;cursor:pointer;box-shadow:0 4px 16px ${accent}55">📤 Share result</button>
      </div>` : ''}
  `;

  // No data available (future match / not posted yet)
  if (!data || !data.rosters || !data.rosters.length) {
    body.innerHTML = header + `
      <div style="${mdGlass()};padding:2rem 1rem;text-align:center">
        <div style="font-size:2rem;margin-bottom:0.5rem">⏳</div>
        <div style="color:#fff;font-weight:700;font-size:0.9rem">Line-ups & stats not out yet</div>
        <div style="color:rgba(255,255,255,0.4);font-size:0.75rem;margin-top:0.35rem">Team sheets are usually published about an hour before kick-off. Check back closer to the match.</div>
      </div>`;
    return;
  }

  // ── Tab bar ──
  const tabBtn = (id, label) => `
    <button onclick="mdTab('${id}')" style="flex:1;padding:0.5rem;border:none;border-radius:12px;cursor:pointer;font-size:0.78rem;font-weight:700;transition:all 0.2s;
      background:${MD.tab === id ? accent : 'transparent'};color:${MD.tab === id ? '#000' : 'rgba(255,255,255,0.6)'}">${label}</button>`;
  const tabs = `
    <div style="display:flex;gap:0.4rem;background:rgba(255,255,255,0.05);padding:0.3rem;border-radius:16px;margin-bottom:1rem">
      ${tabBtn('lineups', 'Line-ups')}${tabBtn('stats', 'Stats')}${tabBtn('summary', 'Summary')}
    </div>`;

  let content = '';
  if (MD.tab === 'lineups')      content = mdRenderLineups(data, norm);
  else if (MD.tab === 'stats')   content = mdRenderStats(data, norm);
  else                           content = mdRenderSummary(data, norm);

  body.innerHTML = header + tabs + content;
}

// ── Line-ups: formation pitch + subs ──────────────────────────────────────────────
function mdRenderLineups(data, norm) {
  const accent = APP.teamColor || '#f0a500';
  const rosters = data.rosters;
  const sideRoster = rosters.find(r => r.homeAway === MD.team) || rosters[0];
  if (!sideRoster || !(sideRoster.roster || []).length) {
    return `<div style="${mdGlass()};padding:1.5rem;text-align:center;color:rgba(255,255,255,0.4);font-size:0.8rem">No line-up available for this side.</div>`;
  }

  const toggle = `
    <div style="display:flex;gap:0.4rem;margin-bottom:1rem">
      ${rosters.map(r => `
        <button onclick="mdTeam('${r.homeAway}')" style="flex:1;padding:0.45rem;border-radius:10px;cursor:pointer;font-size:0.74rem;font-weight:700;border:1px solid ${MD.team === r.homeAway ? accent : 'rgba(255,255,255,0.1)'};background:${MD.team === r.homeAway ? accent + '22' : 'transparent'};color:${MD.team === r.homeAway ? accent : 'rgba(255,255,255,0.6)'}">
          ${norm(r.team?.displayName || '')}
        </button>`).join('')}
    </div>`;

  const all = sideRoster.roster;
  const starters = all.filter(p => p.starter);
  const subs = all.filter(p => !p.starter);
  const formation = sideRoster.formation || '';

  // Place players by their real position codes (G / RB / CD / DM / CM / F …),
  // NOT by ESPN's formationPlace index — that index isn't a back-to-front,
  // row-major layout, so slicing it produced scrambled lines (a defensive mid
  // in the back four, a winger alone up top, etc).
  const bandOf = (abbr) => {
    const a = (abbr || '').toUpperCase();
    if (a === 'G' || a === 'GK') return 'GK';
    if (/DM/.test(a))            return 'DM';   // defensive mid (before generic M)
    if (/AM/.test(a))            return 'AM';   // attacking mid
    if (a.endsWith('B') || /^C?[DB]/.test(a)) return 'DEF';  // RB/LB/WB/CB/CD…
    if (/F$|^F|ST|CF|FW|W$/.test(a)) return 'FWD';
    return 'MID';
  };
  // Left→right ordering inside a line: wide roles sit further out than central.
  const horiz = (abbr) => {
    const a = (abbr || '').toUpperCase();
    const side = /(^L|-L$|L$)/.test(a) ? -1 : /(^R|-R$|R$)/.test(a) ? 1 : 0;
    const wide = /^[LR](B|WB|M|W|F)/.test(a);
    return side * (wide ? 2 : 1);
  };

  const bands = { GK: [], DEF: [], DM: [], MID: [], AM: [], FWD: [] };
  starters.forEach(p => { (bands[bandOf(p.position?.abbreviation)] || bands.MID).push(p); });
  Object.values(bands).forEach(b => b.sort((x, y) =>
    horiz(x.position?.abbreviation) - horiz(y.position?.abbreviation)
    || (parseInt(x.formationPlace) || 99) - (parseInt(y.formationPlace) || 99)
  ));

  let rows = [bands.GK, bands.DEF, bands.DM, bands.MID, bands.AM, bands.FWD].filter(r => r.length);

  // If position data is too sparse to band (everyone landed in MID), fall back
  // to slicing the formation string so we still show sensible rows.
  const nonEmpty = rows.filter(r => r.length).length;
  if (nonEmpty <= 1) {
    const ordered = [...starters].sort((a, b) => (parseInt(a.formationPlace) || 99) - (parseInt(b.formationPlace) || 99));
    const sizes = formation.split('-').map(n => parseInt(n)).filter(n => n > 0);
    if (ordered.length && sizes.length && sizes.reduce((a, b) => a + b, 0) === ordered.length - 1) {
      rows = [[ordered[0]]];
      let idx = 1;
      sizes.forEach(sz => { rows.push(ordered.slice(idx, idx + sz)); idx += sz; });
    }
  }

  const token = (p) => {
    const name = p.athlete?.shortName || p.athlete?.displayName || '';
    const num = p.jersey || '';
    const kit = mdKitImg(p);
    // National-kit shirt (the image already carries the number); the number text
    // sits behind it as a fallback if the image is missing or fails to load.
    return `
      <div style="display:flex;flex-direction:column;align-items:center;width:64px;flex-shrink:0">
        <div style="position:relative;width:48px;height:48px;display:flex;align-items:center;justify-content:center">
          <span style="font-size:0.82rem;font-weight:800;color:#fff">${num}</span>
          ${kit ? `<img src="${kit}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain" onerror="this.remove()">` : ''}
        </div>
        <div style="font-size:0.55rem;color:#fff;margin-top:0.2rem;text-align:center;line-height:1.05;max-width:64px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${name}</div>
      </div>`;
  };

  // Pitch: attacking rows at top → GK at bottom
  const pitchRows = [...rows].reverse().map(r => `
    <div style="display:flex;justify-content:space-around;align-items:center;width:100%">${r.map(token).join('')}</div>
  `).join('');

  const pitch = `
    <div style="${mdGlass()};background:linear-gradient(180deg,#0f3d1e,#0a2e16);padding:1rem 0.5rem;margin-bottom:1rem;position:relative;overflow:hidden">
      <div style="position:absolute;top:50%;left:0;right:0;height:1px;background:rgba(255,255,255,0.12)"></div>
      <div style="position:absolute;top:50%;left:50%;width:60px;height:60px;border:1px solid rgba(255,255,255,0.12);border-radius:50%;transform:translate(-50%,-50%)"></div>
      <div style="position:relative;display:flex;flex-direction:column;gap:1.1rem;min-height:300px;justify-content:space-between">
        ${pitchRows}
      </div>
    </div>
    ${formation ? `<div style="text-align:center;font-size:0.7rem;color:rgba(255,255,255,0.4);margin-bottom:1rem">Formation <b style="color:${accent}">${formation}</b></div>` : ''}`;

  const subsList = subs.length ? `
    <div style="${mdGlass()};padding:0.85rem">
      <div style="font-size:0.65rem;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,0.4);margin-bottom:0.6rem">Substitutes</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem 0.75rem">
        ${subs.map(p => {
          const name = p.athlete?.shortName || p.athlete?.displayName || '';
          const num = p.jersey || '';
          const kit = mdKitImg(p);
          return `
          <div style="display:flex;align-items:center;gap:0.5rem;font-size:0.72rem;color:rgba(255,255,255,0.8)">
            <div style="position:relative;width:32px;height:32px;flex-shrink:0;display:flex;align-items:center;justify-content:center">
              <span style="font-size:0.6rem;font-weight:800;color:#fff">${num}</span>
              ${kit ? `<img src="${kit}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain" onerror="this.remove()">` : ''}
            </div>
            <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${name}</span>
          </div>`;
        }).join('')}
      </div>
    </div>` : '';

  return toggle + pitch + subsList;
}

// ── Stats: comparison bars ────────────────────────────────────────────────────────
function mdRenderStats(data, norm) {
  const teams = data.boxscore?.teams || [];
  const home = teams.find(t => t.homeAway === 'home') || teams[0];
  const away = teams.find(t => t.homeAway === 'away') || teams[1];
  if (!home || !away) return `<div style="${mdGlass()};padding:1.5rem;text-align:center;color:rgba(255,255,255,0.4);font-size:0.8rem">Stats not available yet.</div>`;

  const val = (team, name) => {
    const s = (team.statistics || []).find(x => x.name === name);
    return s ? s.displayValue : null;
  };
  const wanted = [
    ['possessionPct', 'Possession %', true],
    ['totalShots', 'Shots'],
    ['shotsOnTarget', 'Shots on Target'],
    ['wonCorners', 'Corners'],
    ['foulsCommitted', 'Fouls'],
    ['yellowCards', 'Yellow Cards'],
    ['offsides', 'Offsides'],
    ['saves', 'Saves'],
  ];
  const accent = APP.teamColor || '#f0a500';

  const rows = wanted.map(([name, label]) => {
    const hRaw = val(home, name), aRaw = val(away, name);
    if (hRaw == null && aRaw == null) return '';
    const h = parseFloat(hRaw) || 0, a = parseFloat(aRaw) || 0;
    const tot = h + a;
    const hPct = tot > 0 ? (h / tot) * 100 : 50;
    return `
      <div style="margin-bottom:0.9rem">
        <div style="display:flex;justify-content:space-between;font-size:0.78rem;font-weight:700;color:#fff;margin-bottom:0.25rem">
          <span>${hRaw ?? '0'}</span>
          <span style="color:rgba(255,255,255,0.45);font-weight:600;font-size:0.7rem">${label}</span>
          <span>${aRaw ?? '0'}</span>
        </div>
        <div style="display:flex;height:6px;border-radius:4px;overflow:hidden;background:rgba(255,255,255,0.06)">
          <div style="width:${hPct}%;background:${accent}"></div>
          <div style="width:${100 - hPct}%;background:#4cc9f0"></div>
        </div>
      </div>`;
  }).join('');

  return `<div style="${mdGlass()};padding:1rem">${rows || '<div style="text-align:center;color:rgba(255,255,255,0.4);font-size:0.8rem">No stats yet.</div>'}</div>`;
}

// ── Summary: goals, cards & subs timeline ────────────────────────────────────
function mdRenderSummary(data, norm) {
  const events = data.keyEvents || [];
  const rosters = data.rosters || [];
  const homeId = rosters.find(r => r.homeAway === 'home')?.team?.id;

  const icon = (t) => {
    if (/own goal/i.test(t)) return '⚽';
    if (/goal/i.test(t)) return '⚽';
    if (/yellow/i.test(t)) return '🟨';
    if (/red/i.test(t)) return '🟥';
    if (/substitution/i.test(t)) return '🔁';
    return '•';
  };
  const keep = events.filter(e => /goal|card|substitution/i.test(e.type?.text || ''));
  if (!keep.length) return `<div style="${mdGlass()};padding:1.5rem;text-align:center;color:rgba(255,255,255,0.4);font-size:0.8rem">No goals or cards recorded yet.</div>`;

  const rows = keep.map(e => {
    const t = e.type?.text || '';
    const isHome = e.team?.id && String(e.team.id) === String(homeId);
    const who = e.participants?.[0]?.athlete?.displayName || '';
    const min = e.clock?.displayValue || '';
    const ic = icon(t);
    const line = `<span style="font-size:0.62rem;color:rgba(255,255,255,0.35)">${min}</span> <span style="font-size:0.75rem;color:#fff;font-weight:600">${ic} ${who}</span> <span style="font-size:0.6rem;color:rgba(255,255,255,0.3)">${t}</span>`;
    return `
      <div style="display:flex;${isHome ? '' : 'flex-direction:row-reverse;text-align:right'};padding:0.45rem 0;border-bottom:1px solid rgba(255,255,255,0.05)">
        <div style="flex:1;${isHome ? '' : 'text-align:right'}">${line}</div>
      </div>`;
  }).join('');

  return `<div style="${mdGlass()};padding:0.5rem 1rem">${rows}</div>`;
}
