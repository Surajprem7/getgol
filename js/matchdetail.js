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

// Open match detail for a knockout match using ESPN event ID directly
async function openKOMatchDetail(espnId) {
  if (!espnId) return;
  // Find the KO event in cached data to build a match object
  let koEv = null;
  if (window._koData) {
    for (const list of Object.values(window._koData)) {
      koEv = list.find(e => String(e.espnId) === String(espnId));
      if (koEv) break;
    }
  }
  const hName = koEv?.home?.name || '?';
  const aName = koEv?.away?.name || '?';
  const istDate = koEv?.date ? new Date(new Date(koEv.date).getTime() + 5.5*60*60*1000).toISOString().slice(0,10) : '';
  const istTime = koEv?.date ? new Intl.DateTimeFormat('en-IN',{timeZone:'Asia/Kolkata',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(koEv.date)) : '';
  // Synthetic match object compatible with renderMatchDetail
  MD.match = { id: `ko-${espnId}`, home: hName, away: aName, date: istDate, time: istTime, group: koEv?.round?.replace(/-/g,' ') || 'Knockout', venue: koEv?.venue || '' };
  MD.data = null; MD.tab = 'lineups'; MD.team = 'home';
  closeMatchDetail();
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
  try {
    const res = await fetch(ESPN_SUMMARY + espnId, { cache: 'no-store' });
    MD.data = await res.json();
  } catch (e) { MD.data = null; }
  renderMatchDetail(MD.data);
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
      <span style="font-size:0.62rem;font-weight:700;color:#f0a500">${m.group && m.group.length === 1 ? 'Group ' + m.group : (m.group || '')}</span>
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
  const homeId  = rosters.find(r => r.homeAway === 'home')?.team?.id;
  const m       = MD.match;
  const accent  = APP.teamColor || '#f0a500';

  // Keep all meaningful events; filter out pure noise (kickoff, delay pairs)
  const keep = events.filter(e => {
    const t = (e.type?.text || '').toLowerCase();
    if (/^kickoff$/i.test(e.type?.text || '')) return false;
    if (/^end delay$/i.test(e.type?.text || '')) return false; // end-delay is noise; start-delay carries the text
    return /goal|card|substitution|penalty|halftime|start 2nd|end regular|start delay/i.test(e.type?.text || '');
  });

  if (!keep.length) return `
    <div style="${mdGlass()};padding:2rem 1rem;text-align:center">
      <div style="font-size:2rem;margin-bottom:0.5rem">📋</div>
      <div style="color:rgba(255,255,255,0.45);font-size:0.8rem">No match events recorded yet.</div>
    </div>`;

  // Running score
  let hGoals = 0, aGoals = 0;

  const rows = keep.map(e => {
    const typeText = e.type?.text || '';
    const isHome   = e.team?.id && String(e.team.id) === String(homeId);
    const min      = e.clock?.displayValue || '';
    const parts    = e.participants || [];
    const espnText = e.text || ''; // rich description from ESPN

    // ── Dividers ──
    if (/halftime/i.test(typeText)) {
      return `
        <div style="display:flex;align-items:center;gap:0.5rem;margin:0.6rem 0">
          <div style="flex:1;height:1px;background:rgba(255,255,255,0.1)"></div>
          <div style="font-size:0.6rem;font-weight:700;color:rgba(255,255,255,0.35);letter-spacing:1px;white-space:nowrap">HALF TIME · ${hGoals}–${aGoals}</div>
          <div style="flex:1;height:1px;background:rgba(255,255,255,0.1)"></div>
        </div>`;
    }
    if (/start 2nd half/i.test(typeText)) {
      return `
        <div style="display:flex;align-items:center;gap:0.5rem;margin:0.6rem 0">
          <div style="flex:1;height:1px;background:rgba(167,139,250,0.15)"></div>
          <div style="font-size:0.6rem;font-weight:700;color:rgba(167,139,250,0.5);letter-spacing:1px;white-space:nowrap">2ND HALF</div>
          <div style="flex:1;height:1px;background:rgba(167,139,250,0.15)"></div>
        </div>`;
    }
    if (/end regular time/i.test(typeText)) {
      return `
        <div style="display:flex;align-items:center;gap:0.5rem;margin:0.6rem 0">
          <div style="flex:1;height:1px;background:rgba(255,255,255,0.08)"></div>
          <div style="font-size:0.6rem;font-weight:700;color:rgba(255,255,255,0.3);letter-spacing:1px;white-space:nowrap">EXTRA TIME</div>
          <div style="flex:1;height:1px;background:rgba(255,255,255,0.08)"></div>
        </div>`;
    }

    // ── Delay (drinks break / VAR check) ──
    if (/start delay/i.test(typeText)) {
      const isVAR = /var/i.test(espnText);
      const label = isVAR ? '🖥️ VAR Check' : '⏸️ ' + (espnText || 'Delay');
      const teamName = e.team?.displayName || '';
      return `
        <div style="display:flex;align-items:center;gap:0.5rem;margin:0.3rem 0">
          <div style="flex:1;height:1px;background:rgba(255,255,255,0.05)"></div>
          <div style="font-size:0.58rem;color:rgba(255,255,255,0.25);letter-spacing:0.5px;white-space:nowrap">${min ? min + ' · ' : ''}${label}${teamName ? ' · ' + teamName : ''}</div>
          <div style="flex:1;height:1px;background:rgba(255,255,255,0.05)"></div>
        </div>`;
    }

    let iconEl = '', detail = '', subDetail = '';

    // ── Goals ──
    if (/goal/i.test(typeText) && !/penalty\s*-\s*(miss|saved)/i.test(typeText)) {
      const isOG     = /own goal/i.test(typeText);
      const isPK     = /penalty\s*-\s*scored/i.test(typeText);
      const isHeader = /header/i.test(typeText);
      const isFree   = /free.?kick/i.test(espnText);
      const scorer   = parts[0]?.athlete?.displayName || '';
      const assister = parts[1]?.athlete?.displayName || '';
      if (isHome) hGoals++; else aGoals++;
      iconEl = `<div style="width:22px;height:22px;border-radius:50%;background:${isOG ? 'rgba(255,255,255,0.12)' : '#fff'};display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:0.75rem">${isOG ? '🙈' : '⚽'}</div>`;
      const badges = [
        isOG     ? `<span style="background:rgba(255,255,255,0.12);color:rgba(255,255,255,0.5);font-size:0.58rem;padding:1px 5px;border-radius:4px;font-weight:700">OG</span>` : '',
        isPK     ? `<span style="background:rgba(240,165,0,0.18);color:#f0a500;font-size:0.58rem;padding:1px 5px;border-radius:4px;font-weight:700">PEN</span>` : '',
        isHeader ? `<span style="background:rgba(96,165,250,0.15);color:#60a5fa;font-size:0.58rem;padding:1px 5px;border-radius:4px;font-weight:700">HDR</span>` : '',
        isFree   ? `<span style="background:rgba(167,139,250,0.15);color:#a78bfa;font-size:0.58rem;padding:1px 5px;border-radius:4px;font-weight:700">FK</span>` : '',
      ].filter(Boolean).join(' ');
      detail = `<div style="font-size:0.8rem;font-weight:700;color:#fff;display:flex;align-items:center;gap:4px;flex-wrap:wrap">${scorer} ${badges}</div>`;
      if (assister) subDetail += `<div style="font-size:0.63rem;color:rgba(255,255,255,0.4);margin-top:1px">▶ ${assister}</div>`;
      subDetail += `<div style="font-size:0.63rem;color:${accent};font-weight:800;margin-top:2px">${hGoals}–${aGoals}</div>`;

    // ── Cards ──
    } else if (/yellow.*red|red.*yellow/i.test(typeText)) {
      const player = parts[0]?.athlete?.displayName || '';
      const reason = espnText.match(/for\s+(.+?)\.?\s*$/i)?.[1] || '';
      iconEl = `<div style="position:relative;width:16px;height:20px;flex-shrink:0"><div style="position:absolute;width:12px;height:16px;background:#f59e0b;border-radius:2px;top:0;left:0"></div><div style="position:absolute;width:12px;height:16px;background:#ef4444;border-radius:2px;top:4px;left:4px"></div></div>`;
      detail = `<div style="font-size:0.78rem;font-weight:700;color:#fff">${player}</div>`;
      subDetail = `<div style="font-size:0.62rem;color:rgba(255,255,255,0.4)">2nd Yellow / Red${reason ? ' · ' + reason : ''}</div>`;
    } else if (/red/i.test(typeText)) {
      const player = parts[0]?.athlete?.displayName || '';
      const reason = espnText.match(/for\s+(.+?)\.?\s*$/i)?.[1] || '';
      iconEl = `<div style="width:14px;height:18px;background:#ef4444;border-radius:2px;flex-shrink:0"></div>`;
      detail = `<div style="font-size:0.78rem;font-weight:700;color:#fff">${player}</div>`;
      subDetail = `<div style="font-size:0.62rem;color:#ef4444">Red Card${reason ? ' · ' + reason : ''}</div>`;
    } else if (/yellow/i.test(typeText)) {
      const player = parts[0]?.athlete?.displayName || '';
      const reason = espnText.match(/for\s+(.+?)\.?\s*$/i)?.[1] || '';
      iconEl = `<div style="width:14px;height:18px;background:#f59e0b;border-radius:2px;flex-shrink:0"></div>`;
      detail = `<div style="font-size:0.78rem;font-weight:700;color:#fff">${player}</div>`;
      subDetail = `<div style="font-size:0.62rem;color:#f59e0b">Yellow Card${reason ? ' · ' + reason : ''}</div>`;

    // ── Penalty events (non-goal) ──
    } else if (/penalty\s*-\s*miss/i.test(typeText)) {
      const player = parts[0]?.athlete?.displayName || '';
      iconEl = `<div style="width:22px;height:22px;border-radius:50%;background:rgba(239,68,68,0.15);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:0.8rem">❌</div>`;
      detail = `<div style="font-size:0.78rem;font-weight:700;color:rgba(255,255,255,0.7)">${player}</div>`;
      subDetail = `<div style="font-size:0.62rem;color:#ef4444;font-weight:700">Penalty Missed</div>`;
    } else if (/penalty\s*-\s*saved/i.test(typeText)) {
      const taker  = parts[0]?.athlete?.displayName || '';
      // Try to extract keeper name from espnText "saved by X"
      const keeperMatch = espnText.match(/saved.*?by\s+([A-ZÀ-ÖØ-öø-ÿ][^\(\.]+)/i);
      const keeper = keeperMatch?.[1]?.trim() || parts[1]?.athlete?.displayName || '';
      iconEl = `<div style="width:22px;height:22px;border-radius:50%;background:rgba(74,222,128,0.12);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:0.8rem">🧤</div>`;
      detail = `<div style="font-size:0.78rem;font-weight:700;color:rgba(255,255,255,0.7)">${taker}</div>`;
      subDetail = `<div style="font-size:0.62rem;color:#4ade80;font-weight:700">Penalty Saved${keeper ? ' · ' + keeper : ''}</div>`;
    } else if (/penalty/i.test(typeText)) {
      const player = parts[0]?.athlete?.displayName || '';
      iconEl = `<div style="width:22px;height:22px;border-radius:50%;background:rgba(240,165,0,0.1);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:0.8rem">🥅</div>`;
      detail = `<div style="font-size:0.78rem;font-weight:700;color:#f0a500">${player}</div>`;
      subDetail = `<div style="font-size:0.62rem;color:rgba(255,255,255,0.4)">${typeText}</div>`;

    // ── Substitutions ──
    } else if (/substitution/i.test(typeText)) {
      const off = parts[0]?.athlete?.displayName || '';
      const on  = parts[1]?.athlete?.displayName || '';
      // Check if ESPN text mentions injury
      const isInjury = /injury|injur/i.test(espnText);
      iconEl = `<div style="font-size:1rem;flex-shrink:0;line-height:1">${isInjury ? '🚑' : '🔁'}</div>`;
      detail = on
        ? `<div style="font-size:0.73rem;font-weight:700;color:#4ade80">▲ ${on}</div><div style="font-size:0.73rem;color:rgba(255,255,255,0.45)">▼ ${off}</div>`
        : `<div style="font-size:0.73rem;font-weight:700;color:#fff">${off}</div>`;
      if (isInjury) subDetail = `<div style="font-size:0.58rem;color:rgba(248,113,113,0.7);margin-top:1px">Injury</div>`;
    } else {
      const player = parts[0]?.athlete?.displayName || '';
      iconEl = `<div style="font-size:0.75rem;flex-shrink:0">•</div>`;
      detail = `<div style="font-size:0.75rem;color:#fff">${player ? player + ' — ' : ''}${typeText}</div>`;
    }

    // Skip empty detail (dividers handled above already returned)
    if (!detail) return '';

    const minBadge = `<div style="font-size:0.6rem;font-weight:700;color:rgba(255,255,255,0.35);white-space:nowrap;min-width:28px;text-align:center">${min}</div>`;

    // Home: icon-left; Away: icon-right (mirrored)
    const evRow = isHome
      ? `<div style="display:flex;align-items:flex-start;gap:0.4rem">
           ${iconEl}
           <div style="flex:1">${detail}${subDetail}</div>
           <div style="flex:1"></div>
           ${minBadge}
         </div>`
      : `<div style="display:flex;align-items:flex-start;gap:0.4rem">
           ${minBadge}
           <div style="flex:1"></div>
           <div style="flex:1;text-align:right">${detail}${subDetail}</div>
           ${iconEl}
         </div>`;

    return `<div style="padding:0.5rem 0;border-bottom:1px solid rgba(255,255,255,0.05)">${evRow}</div>`;
  }).filter(Boolean).join('');

  // Column headers
  const headers = `
    <div style="display:flex;justify-content:space-between;margin-bottom:0.5rem;padding-bottom:0.4rem;border-bottom:1px solid rgba(255,255,255,0.08)">
      <div style="font-size:0.65rem;font-weight:800;color:${accent};letter-spacing:0.5px">${m.home}</div>
      <div style="font-size:0.65rem;font-weight:800;color:#4cc9f0;letter-spacing:0.5px">${m.away}</div>
    </div>`;

  return `<div style="${mdGlass()};padding:0.75rem 1rem">${headers}${rows || '<div style="text-align:center;color:rgba(255,255,255,0.4);font-size:0.8rem;padding:1rem">No events yet.</div>'}</div>`;
}
