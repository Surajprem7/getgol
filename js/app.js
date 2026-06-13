function getCountryCode(team) {
  const codes = {
    'Mexico':'mx','South Africa':'za','South Korea':'kr','Czechia':'cz',
    'Canada':'ca','Bosnia':'ba','Qatar':'qa','Switzerland':'ch',
    'Brazil':'br','Morocco':'ma','Haiti':'ht','Scotland':'gb-sct',
    'USA':'us','Paraguay':'py','Australia':'au','Turkey':'tr',
    'Curacao':'cw','Ivory Coast':'ci','Ecuador':'ec','Germany':'de',
    'Netherlands':'nl','Japan':'jp','Tunisia':'tn','Sweden':'se',
    'Belgium':'be','Egypt':'eg','Iran':'ir','New Zealand':'nz',
    'Spain':'es','Cape Verde':'cv','Saudi Arabia':'sa','Uruguay':'uy',
    'France':'fr','Senegal':'sn','Norway':'no','Iraq':'iq',
    'Argentina':'ar','Algeria':'dz','Austria':'at','Jordan':'jo',
    'Portugal':'pt','Uzbekistan':'uz','Colombia':'co','DR Congo':'cd',
    'England':'gb-eng','Croatia':'hr','Ghana':'gh','Panama':'pa',
  };
  return codes[team] || 'un';
}

const APP = {
  team: localStorage.getItem('gol_team') || null,
  teamName: localStorage.getItem('gol_team_name') || null,
  teamColor: localStorage.getItem('gol_team_color') || null,
};

document.addEventListener('DOMContentLoaded', () => {
  showApp();
  if (!APP.team) showTeamPickerModal();
  registerSW();
});

function registerSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js');
  }
}

function showTeamPickerModal() {
  const teams = [
    {name:'Mexico',color:'#006847'},
    {name:'South Africa',color:'#007A4D'},
    {name:'South Korea',color:'#003478'},
    {name:'Czechia',color:'#D7141A'},
    {name:'Canada',color:'#FF0000'},
    {name:'Bosnia',color:'#002395'},
    {name:'Qatar',color:'#8D1B3D'},
    {name:'Switzerland',color:'#FF0000'},
    {name:'Brazil',color:'#009C3B'},
    {name:'Morocco',color:'#C1272D'},
    {name:'Haiti',color:'#00209F'},
    {name:'Scotland',color:'#003F87'},
    {name:'USA',color:'#B22234'},
    {name:'Paraguay',color:'#D52B1E'},
    {name:'Australia',color:'#FFCD00'},
    {name:'Turkey',color:'#E30A17'},
    {name:'Germany',color:'#FFD700'},
    {name:'Curacao',color:'#002B7F'},
    {name:'Ivory Coast',color:'#F77F00'},
    {name:'Ecuador',color:'#FFD100'},
    {name:'Netherlands',color:'#FF6600'},
    {name:'Japan',color:'#BC002D'},
    {name:'Tunisia',color:'#E70013'},
    {name:'Sweden',color:'#006AA7'},
    {name:'Belgium',color:'#EF3340'},
    {name:'Egypt',color:'#CE1126'},
    {name:'Iran',color:'#239F40'},
    {name:'New Zealand',color:'#00247D'},
    {name:'Spain',color:'#AA151B'},
    {name:'Cape Verde',color:'#003893'},
    {name:'Saudi Arabia',color:'#006C35'},
    {name:'Uruguay',color:'#5EB6E4'},
    {name:'France',color:'#002395'},
    {name:'Senegal',color:'#00853F'},
    {name:'Norway',color:'#EF2B2D'},
    {name:'Iraq',color:'#007A3D'},
    {name:'Argentina',color:'#74ACDF'},
    {name:'Algeria',color:'#006233'},
    {name:'Austria',color:'#ED2939'},
    {name:'Jordan',color:'#007A3D'},
    {name:'Portugal',color:'#006600'},
    {name:'Uzbekistan',color:'#1EB53A'},
    {name:'Colombia',color:'#FCD116'},
    {name:'DR Congo',color:'#007FFF'},
    {name:'England',color:'#CF111B'},
    {name:'Croatia',color:'#FF0000'},
    {name:'Ghana',color:'#006B3F'},
    {name:'Panama',color:'#005293'},
  ];

  const overlay = document.createElement('div');
  overlay.id = 'team-picker-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:1000;display:flex;flex-direction:column;justify-content:flex-end';

  overlay.innerHTML = `
    <!-- Dim backdrop -->
    <div onclick="closeTeamPicker()" style="position:absolute;inset:0;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px)"></div>

    <!-- Slide-up sheet -->
    <div style="position:relative;z-index:1;background:linear-gradient(180deg,#12122a 0%,#0d0d1e 100%);border-radius:24px 24px 0 0;padding:1.25rem 1.25rem 2rem;max-height:85vh;overflow-y:auto;border-top:1px solid rgba(255,255,255,0.1);box-shadow:0 -20px 60px rgba(0,0,0,0.6)">

      <!-- Handle bar -->
      <div style="width:40px;height:4px;background:rgba(255,255,255,0.15);border-radius:2px;margin:0 auto 1rem"></div>

      <!-- Brand banner -->
      <div style="text-align:center;padding:0.5rem 0 1.25rem;position:relative">
        <div style="font-size:3rem;filter:drop-shadow(0 0 20px #f0a500);margin-bottom:0.25rem">⚽</div>
        <div style="font-size:2.8rem;font-weight:900;color:#fff;text-shadow:0 0 30px #f0a50066;letter-spacing:-1px;line-height:1">Gol!</div>
        <div style="color:rgba(255,255,255,0.5);font-size:0.85rem;margin-top:0.1rem">FIFA World Cup 2026</div>
        <div style="color:#f0a500;font-size:0.9rem;font-style:italic;margin-top:0.15rem;text-shadow:0 0 12px #f0a50066">¡Pasion por el Gol!</div>
        <div style="color:rgba(255,255,255,0.25);font-size:0.72rem;margin-top:0.3rem">48 teams • 12 groups • 104 matches</div>

        <!-- SKIP button top-right -->
        <button onclick="closeTeamPicker()" style="position:absolute;top:0;right:0;background:transparent;border:1px solid rgba(255,255,255,0.2);border-radius:20px;color:rgba(255,255,255,0.5);font-size:0.75rem;font-weight:600;letter-spacing:0.5px;padding:0.3rem 0.85rem;cursor:pointer;transition:all 0.2s"
          onmouseover="this.style.color='#fff';this.style.borderColor='rgba(255,255,255,0.5)'"
          onmouseout="this.style.color='rgba(255,255,255,0.5)';this.style.borderColor='rgba(255,255,255,0.2)'">SKIP</button>
      </div>

      <!-- Pick your team label -->
      <div style="font-size:0.72rem;font-weight:700;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:1px;margin-bottom:0.65rem">Pick your team <span style="font-weight:400;text-transform:none;letter-spacing:0">(optional)</span></div>

      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:0.6rem">
        ${teams.map(t => `
          <button onclick="selectTeam('${t.name}','${t.color}')"
            style="background:rgba(255,255,255,0.05);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.1);border-radius:14px;padding:0.65rem 0.4rem;cursor:pointer;color:#fff;font-size:0.62rem;text-align:center;transition:all 0.2s"
            onmouseover="this.style.background='rgba(255,255,255,0.12)';this.style.borderColor='${t.color}';this.style.boxShadow='0 0 16px ${t.color}44'"
            onmouseout="this.style.background='rgba(255,255,255,0.05)';this.style.borderColor='rgba(255,255,255,0.1)';this.style.boxShadow='none'">
            <img src="https://flagcdn.com/40x30/${getCountryCode(t.name)}.png" width="40" height="30" style="border-radius:4px;display:block;margin:0 auto;box-shadow:0 2px 8px rgba(0,0,0,0.3)" onerror="this.style.display='none'">
            <div style="margin-top:0.35rem;line-height:1.2;color:rgba(255,255,255,0.9)">${t.name}</div>
          </button>
        `).join('')}
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
}

function closeTeamPicker() {
  const el = document.getElementById('team-picker-overlay');
  if (el) el.remove();
}

function browseRankings() {
  closeTeamPicker();
  showApp('groups');
}

function selectTeam(name, color) {
  APP.team = name;
  APP.teamName = name;
  APP.teamColor = color;
  localStorage.setItem('gol_team', name);
  localStorage.setItem('gol_team_name', name);
  localStorage.setItem('gol_team_color', color);
  closeTeamPicker();
  showApp();
}

function showApp(startTab) {
  const accentColor = APP.teamColor || '#f0a500';
  const headerRight = APP.teamName
    ? `<div style="display:flex;align-items:center;gap:0.5rem;color:rgba(255,255,255,0.6);font-size:0.8rem;cursor:pointer;background:rgba(255,255,255,0.05);padding:0.4rem 0.75rem;border-radius:20px;border:1px solid rgba(255,255,255,0.1)" onclick="resetTeam()">
         <img src="https://flagcdn.com/24x18/${getCountryCode(APP.teamName)}.png" style="border-radius:2px" onerror="this.style.display='none'">
         ${APP.teamName} ✕
       </div>`
    : `<button onclick="showTeamPickerModal()" style="background:rgba(240,165,0,0.15);border:1px solid rgba(240,165,0,0.4);border-radius:20px;color:#f0a500;font-size:0.8rem;font-weight:600;padding:0.4rem 0.9rem;cursor:pointer">⚽ Pick your team</button>`;

  document.getElementById('app').innerHTML = `
    <div style="min-height:100vh;background:linear-gradient(135deg,#0a0a1a 0%,#1a0a2e 40%,#0a1a2e 100%);position:relative">

      <!-- Background glow effects -->
      <div style="position:fixed;top:-20%;left:-20%;width:60%;height:60%;background:radial-gradient(circle,${accentColor}10 0%,transparent 70%);pointer-events:none;z-index:0"></div>
      <div style="position:fixed;bottom:-20%;right:-20%;width:60%;height:60%;background:radial-gradient(circle,#4cc9f010 0%,transparent 70%);pointer-events:none;z-index:0"></div>

      <div style="max-width:600px;margin:0 auto;padding:1rem;position:relative;z-index:1">
        <header style="display:flex;align-items:center;justify-content:space-between;padding:1rem 0;border-bottom:1px solid rgba(255,255,255,0.1);margin-bottom:0.5rem;backdrop-filter:blur(10px)">
          <div>
            <span style="font-size:1.8rem;font-weight:900;color:${accentColor};text-shadow:0 0 20px ${accentColor}88">Gol!</span>
            <span style="color:#f0a500;font-size:0.7rem;font-style:italic;margin-left:0.4rem;opacity:0.8">¡Pasion por el Gol!</span>
          </div>
          ${headerRight}
        </header>
        
        <nav style="display:flex;gap:0.5rem;margin:1rem 0;overflow-x:auto;background:rgba(255,255,255,0.05);padding:0.4rem;border-radius:20px;border:1px solid rgba(255,255,255,0.08)">
          <button onclick="showTab('matches')" id="nav-matches" style="flex:1;padding:0.5rem 1rem;border-radius:16px;border:none;background:transparent;color:rgba(255,255,255,0.6);cursor:pointer;white-space:nowrap;transition:all 0.3s">Matches</button>
          <button onclick="showTab('groups')" id="nav-groups" style="flex:1;padding:0.5rem 1rem;border-radius:16px;border:none;background:transparent;color:rgba(255,255,255,0.6);cursor:pointer;white-space:nowrap;transition:all 0.3s">Groups</button>
          <button onclick="showTab('rankings')" id="nav-rankings" style="flex:1;padding:0.5rem 1rem;border-radius:16px;border:none;background:transparent;color:rgba(255,255,255,0.6);cursor:pointer;white-space:nowrap;transition:all 0.3s">Rankings</button>
          <button onclick="showTab('watch')" id="nav-watch" style="flex:1;padding:0.5rem 1rem;border-radius:16px;border:none;background:transparent;color:rgba(255,255,255,0.6);cursor:pointer;white-space:nowrap;transition:all 0.3s">Watch</button>
        </nav>

        <div id="tab-content"></div>
      </div>
    </div>
  `;
  showTab(startTab || 'matches');
}

function jumpToDate(date) {
  const header = document.querySelector(`[data-date-header="${date}"]`);
  if (header) header.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Highlight the timeline node whose group is most visible in the viewport
function updateTimelineActive() {
  const headers = document.querySelectorAll('[data-date-header]');
  let activeDate = null;
  const mid = window.innerHeight * 0.4;
  headers.forEach(h => {
    const rect = h.getBoundingClientRect();
    if (rect.top <= mid) activeDate = h.dataset.dateHeader;
  });
  if (!activeDate) return;

  const accent = APP.teamColor || '#f0a500';
  const tlDates = [...new Set([...MATCHES].sort((a,b) => a.date.localeCompare(b.date)).map(m => m.date))];
  const activeIdx = tlDates.indexOf(activeDate);
  if (activeIdx < 0) return;

  const pct = tlDates.length === 1 ? 50 : (activeIdx / (tlDates.length - 1)) * 100;

  const bloom = document.getElementById('tl-bloom');
  const fill  = document.getElementById('tl-fill');
  const tl    = document.getElementById('match-timeline');
  if (tl) {
    const nodePx = (pct / 100) * tl.offsetHeight;
    if (bloom) bloom.style.top = (nodePx - 35) + 'px';
    if (fill)  fill.style.height = pct + '%';
  }

  tlDates.forEach((date, i) => {
    const node  = document.getElementById('tl-node-' + date);
    const dayEl = document.getElementById('tl-day-' + date);
    if (!node) return;
    const isActive = date === activeDate;
    const isPast   = i < activeIdx;
    node.style.background  = isActive ? accent : '#0d0d1e';
    node.style.borderColor = isActive ? accent : isPast ? accent + '55' : 'rgba(255,255,255,0.15)';
    node.style.boxShadow   = isActive ? `0 0 8px ${accent}99` : 'none';
    node.style.transform   = `translateY(-50%) scale(${isActive ? 1.35 : 1})`;
    if (dayEl) {
      const dayNum = dayEl.firstElementChild;
      const monNum = dayEl.lastElementChild;
      if (dayNum) { dayNum.style.color = isActive ? accent : isPast ? accent+'88' : 'rgba(255,255,255,0.3)'; dayNum.style.fontSize = isActive ? '0.68rem' : '0.58rem'; }
      if (monNum) { monNum.style.color = isActive ? accent+'cc' : 'rgba(255,255,255,0.18)'; }
    }
  });
}

let _tlScrollHandler = null;

function renderVS(matchId) {
  const sc = window.LIVE && window.LIVE.score(matchId);
  if (sc && (sc.status === 'STATUS_FINAL' || sc.status === 'STATUS_IN_PROGRESS')) {
    const live = sc.status === 'STATUS_IN_PROGRESS';
    return `${live ? `<div style="font-size:0.52rem;color:#4ade80;font-weight:700;letter-spacing:1px">● LIVE</div>` : ''}
      <div style="font-size:1.3rem;font-weight:900;color:#fff;letter-spacing:1px;line-height:1.1">${sc.home}–${sc.away}</div>
      ${!live ? `<div style="font-size:0.58rem;color:rgba(255,255,255,0.3);margin-top:1px">FT</div>` : `<div style="font-size:0.58rem;color:#4ade80">${sc.clock||''}</div>`}`;
  }
  return `<div style="font-size:1rem;font-weight:900;color:rgba(255,255,255,0.2);letter-spacing:2px">VS</div>`;
}

function showTab(tab) {
  window._activeTab = tab;
  if (tab !== 'matches' && _tlScrollHandler) {
    window.removeEventListener('scroll', _tlScrollHandler);
    _tlScrollHandler = null;
  }
  const content = document.getElementById('tab-content');

  // Update nav buttons
  ['matches','groups','rankings','watch'].forEach(t => {
    const btn = document.getElementById('nav-'+t);
    if (!btn) return;
    if (t === tab) {
      btn.style.background = APP.teamColor;
      btn.style.color = '#000';
      btn.style.fontWeight = '700';
    } else {
      btn.style.background = 'transparent';
      btn.style.color = 'rgba(255,255,255,0.6)';
      btn.style.fontWeight = '400';
    }
  });

  const glass = 'background:rgba(255,255,255,0.05);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.1);border-radius:16px';

  if (tab === 'matches') {
    const accentColor = APP.teamColor || '#f0a500';

    // Sort ALL matches chronologically by date+time
    const sortedMatches = [...MATCHES].sort((a, b) =>
      (a.date + a.time).localeCompare(b.date + b.time)
    );

    const renderMatch = (m) => {
      const isMyMatch = APP.teamName && (m.home === APP.teamName || m.away === APP.teamName);
      return `
      <div data-date="${m.date}" data-group="${m.group}" style="${glass};margin-bottom:0.75rem;overflow:hidden;${isMyMatch ? 'border-color:'+accentColor+'66;box-shadow:0 0 24px '+accentColor+'22' : ''}">

        <!-- Date badge — centered, attractive -->
        <div style="text-align:center;padding:0.6rem 1rem 0;display:flex;align-items:center;justify-content:center;gap:0.5rem">
          <span style="background:linear-gradient(90deg,rgba(240,165,0,0.18),rgba(76,201,240,0.12));border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:0.3rem 0.9rem;font-size:0.72rem;font-weight:700;letter-spacing:0.5px;color:rgba(255,255,255,0.85)">
            Group ${m.group}
          </span>
          <span style="color:rgba(255,255,255,0.25);font-size:0.65rem">•</span>
          <span style="font-size:0.72rem;font-weight:600;color:#f0a500;letter-spacing:0.3px">${formatIST(m.date, m.time)}</span>
        </div>

        <!-- Teams row -->
        <div style="display:flex;align-items:center;justify-content:space-between;padding:0.9rem 1rem 0.5rem">
          <div style="text-align:center;flex:1">
            <img src="https://flagcdn.com/48x36/${getCountryCode(m.home)}.png" width="48" height="36" style="border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,0.4)" onerror="this.style.display='none'">
            <div style="font-size:0.85rem;color:#fff;margin-top:0.4rem;font-weight:600">${m.home}</div>
          </div>
          <div id="vs-${m.id}" style="text-align:center;padding:0 0.5rem;min-width:56px">${renderVS(m.id)}</div>
          <div style="text-align:center;flex:1">
            <img src="https://flagcdn.com/48x36/${getCountryCode(m.away)}.png" width="48" height="36" style="border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,0.4)" onerror="this.style.display='none'">
            <div style="font-size:0.85rem;color:#fff;margin-top:0.4rem;font-weight:600">${m.away}</div>
          </div>
        </div>

        <!-- Venue -->
        <div style="font-size:0.62rem;color:rgba(255,255,255,0.25);text-align:center;padding:0 1rem 0.75rem">${m.venue}</div>

        <!-- Inline prediction -->
        <div style="border-top:1px solid rgba(255,255,255,0.06);padding:0.65rem 0.75rem 0.5rem">
          <div style="display:flex;gap:0.4rem;margin-bottom:0.5rem">
            <button onclick="predict(${m.id},'${m.home}')" id="pred-${m.id}-home"
              style="flex:1;padding:0.45rem 0.25rem;border-radius:10px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.8);cursor:pointer;font-size:0.72rem;font-weight:600;transition:all 0.25s">
              ${m.home}
            </button>
            <button onclick="predict(${m.id},'draw')" id="pred-${m.id}-draw"
              style="padding:0.45rem 0.65rem;border-radius:10px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.45);cursor:pointer;font-size:0.72rem;font-weight:600;transition:all 0.25s">
              Draw
            </button>
            <button onclick="predict(${m.id},'${m.away}')" id="pred-${m.id}-away"
              style="flex:1;padding:0.45rem 0.25rem;border-radius:10px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.8);cursor:pointer;font-size:0.72rem;font-weight:600;transition:all 0.25s">
              ${m.away}
            </button>
          </div>
          <div id="counts-${m.id}" style="font-size:0.7rem;color:rgba(255,255,255,0.25);text-align:center;min-height:1rem"></div>
        </div>
      </div>
    `; };

    // Unique match dates sorted chronologically for the timeline
    const tlDates = [...new Set(sortedMatches.map(m => m.date))].sort();
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    // Group matches by date for rendering with date headers
    const byDate = {};
    sortedMatches.forEach(m => {
      if (!byDate[m.date]) byDate[m.date] = [];
      byDate[m.date].push(m);
    });

    content.innerHTML = `
      <style>
        @keyframes bloomPulse {
          0%,100% { opacity:0.7; }
          50%      { opacity:1; }
        }
        @keyframes tlFadeIn { from{opacity:0} to{opacity:1} }
      </style>

      <div style="display:flex;gap:0.5rem;align-items:flex-start">

        <!-- Match cards column — sorted by date -->
        <div style="flex:1;min-width:0">
          ${tlDates.map(date => {
            const d = new Date(date);
            const dateLabel = `${d.getDate()} ${months[d.getMonth()]}`;
            const dayMatches = byDate[date] || [];
            return `
              <div data-date-header="${date}" style="display:flex;align-items:center;gap:0.5rem;margin:1rem 0 0.5rem">
                <div style="font-size:0.78rem;font-weight:700;color:${accentColor};white-space:nowrap">${dateLabel}</div>
                <div style="flex:1;height:1px;background:linear-gradient(90deg,${accentColor}44,transparent)"></div>
              </div>
              ${dayMatches.map(m => renderMatch(m)).join('')}
            `;
          }).join('')}
        </div>

        <!-- Ruler timeline — sticky -->
        <div id="match-timeline" style="width:48px;flex-shrink:0;position:sticky;top:0.5rem;align-self:flex-start;height:calc(100vh - 5rem);overflow:hidden;animation:tlFadeIn 0.4s ease">
          <div style="position:relative;width:100%;height:100%">

            <!-- Dim background line (full height) -->
            <div style="position:absolute;right:8px;top:0;bottom:0;width:1.5px;background:rgba(255,255,255,0.08);border-radius:2px"></div>

            <!-- Bright filled line above active (updated by JS) -->
            <div id="tl-fill" style="position:absolute;right:8px;top:0;width:2px;height:0%;background:linear-gradient(180deg,${accentColor}44,${accentColor});border-radius:2px;transition:height 0.4s cubic-bezier(0.4,0,0.2,1)"></div>

            <!-- Horizontal glow bloom at active node -->
            <div id="tl-bloom" style="position:absolute;right:-6px;width:46px;height:70px;
              background:radial-gradient(ellipse 23px 35px at 75% 50%, ${accentColor}55 0%, ${accentColor}22 45%, transparent 70%);
              top:0;transition:top 0.4s cubic-bezier(0.4,0,0.2,1);
              animation:bloomPulse 2.5s ease-in-out infinite;pointer-events:none"></div>

            <!-- Ruler tick marks + date nodes -->
            ${tlDates.map((date, i) => {
              const pct = tlDates.length === 1 ? 50 : (i / (tlDates.length - 1)) * 100;
              const d = new Date(date);
              const day = d.getDate();
              const mon = months[d.getMonth()];
              const minorTicks = i < tlDates.length - 1 ? [1,2].map(t => {
                const mp = pct + (t / 3) * (100 / (tlDates.length - 1));
                return `<div style="position:absolute;right:10px;top:${mp}%;width:4px;height:1px;background:rgba(255,255,255,0.1);transform:translateY(-50%)"></div>`;
              }).join('') : '';
              return `
                ${minorTicks}
                <div style="position:absolute;right:10px;top:${pct}%;width:8px;height:1px;background:rgba(255,255,255,0.25);transform:translateY(-50%)"></div>
                <div id="tl-day-${date}" style="position:absolute;right:20px;top:${pct}%;transform:translateY(-50%);text-align:right;line-height:1.1;pointer-events:none">
                  <div style="font-size:0.58rem;font-weight:700;color:rgba(255,255,255,0.3);transition:all 0.3s">${day}</div>
                  <div style="font-size:0.42rem;color:rgba(255,255,255,0.18);transition:all 0.3s">${mon}</div>
                </div>
                <div id="tl-node-${date}" onclick="jumpToDate('${date}')"
                  style="position:absolute;right:0;top:${pct}%;transform:translateY(-50%);
                  width:14px;height:14px;border-radius:50%;cursor:pointer;
                  background:#0d0d1e;border:1.5px solid rgba(255,255,255,0.15);
                  transition:all 0.3s;box-sizing:border-box;z-index:2"></div>
              `;
            }).join('')}

          </div>
        </div>
      </div>
    `;

    // Load saved picks + live vote counts for every visible match
    MATCHES.forEach(m => {
      const saved = localStorage.getItem('pred_'+m.id);
      if (saved) highlightPrediction(m.id, saved);
      getPredictionCounts(m.id, (counts) => {
        const countsEl = document.getElementById('counts-'+m.id);
        if (!countsEl) return;
        const total = Object.values(counts).reduce((a,b) => a+b, 0);
        if (total === 0) { countsEl.innerHTML = '<span style="color:rgba(255,255,255,0.18)">Be the first to predict!</span>'; return; }
        const homeP = Math.round((counts[m.home]||0)/total*100);
        const drawP = Math.round((counts['draw']||0)/total*100);
        const awayP = Math.round((counts[m.away]||0)/total*100);
        countsEl.innerHTML = `
          <div style="display:flex;gap:2px;margin-bottom:4px;height:4px;border-radius:4px;overflow:hidden;background:rgba(255,255,255,0.05)">
            <div style="flex:${homeP||1};background:${accentColor};opacity:0.9"></div>
            <div style="flex:${drawP||1};background:rgba(255,255,255,0.2)"></div>
            <div style="flex:${awayP||1};background:#4cc9f0;opacity:0.9"></div>
          </div>
          <div style="display:flex;justify-content:space-between;padding:0 2px;font-size:0.65rem">
            <span style="color:${accentColor};font-weight:700">${homeP}%</span>
            <span style="color:rgba(255,255,255,0.25)">${total} vote${total>1?'s':''}</span>
            <span style="color:#4cc9f0;font-weight:700">${awayP}%</span>
          </div>
        `;
      });
    });

    // Start scroll listener for timeline node highlighting
    if (_tlScrollHandler) window.removeEventListener('scroll', _tlScrollHandler);
    _tlScrollHandler = updateTimelineActive;
    window.addEventListener('scroll', _tlScrollHandler, { passive: true });
    updateTimelineActive();
    if (typeof refreshMatchScores === 'function') refreshMatchScores();

  } else if (tab === 'groups') {
    buildStandingsTab(content, glass);

  } else if (tab === 'rankings') {
    const FIFA_RANKINGS = [
      {rank:1,  name:'Argentina'},
      {rank:2,  name:'France'},
      {rank:3,  name:'Spain'},
      {rank:4,  name:'England'},
      {rank:5,  name:'Brazil'},
      {rank:6,  name:'Portugal'},
      {rank:7,  name:'Netherlands'},
      {rank:8,  name:'Belgium'},
      {rank:9,  name:'Germany'},
      {rank:10, name:'Uruguay'},
      {rank:11, name:'Colombia'},
      {rank:12, name:'Japan'},
      {rank:13, name:'Morocco'},
      {rank:14, name:'USA'},
      {rank:15, name:'Switzerland'},
      {rank:16, name:'Mexico'},
      {rank:17, name:'Croatia'},
      {rank:18, name:'Iran'},
      {rank:19, name:'Senegal'},
      {rank:20, name:'Ecuador'},
      {rank:21, name:'South Korea'},
      {rank:22, name:'Australia'},
      {rank:23, name:'Sweden'},
      {rank:24, name:'Turkey'},
      {rank:25, name:'Austria'},
      {rank:26, name:'Norway'},
      {rank:27, name:'Canada'},
      {rank:28, name:'Egypt'},
      {rank:29, name:'Tunisia'},
      {rank:30, name:'Algeria'},
      {rank:31, name:'Scotland'},
      {rank:32, name:'Ghana'},
      {rank:33, name:'Saudi Arabia'},
      {rank:34, name:'Ivory Coast'},
      {rank:35, name:'New Zealand'},
      {rank:36, name:'Paraguay'},
      {rank:37, name:'South Africa'},
      {rank:38, name:'Czechia'},
      {rank:39, name:'Bosnia'},
      {rank:40, name:'Qatar'},
      {rank:41, name:'Panama'},
      {rank:42, name:'Jordan'},
      {rank:43, name:'DR Congo'},
      {rank:44, name:'Iraq'},
      {rank:45, name:'Cape Verde'},
      {rank:46, name:'Haiti'},
      {rank:47, name:'Uzbekistan'},
      {rank:48, name:'Curacao'},
    ];

    const userEntry = FIFA_RANKINGS.find(r => r.name === APP.teamName);
    const userRank = userEntry ? userEntry.rank : null;
    const accentColor = APP.teamColor || '#f0a500';

    const medal = r => r === 1 ? '🥇' : r === 2 ? '🥈' : r === 3 ? '🥉' : '';

    const renderRankingRow = (r, query) => {
      const isUser = r.name === APP.teamName;
      const m = medal(r.rank);
      const highlight = query && r.name.toLowerCase().includes(query.toLowerCase());
      return `
        <div class="rank-row" data-name="${r.name.toLowerCase()}" style="${glass};padding:0.75rem 1rem;margin-bottom:0.5rem;display:flex;align-items:center;gap:0.75rem;transition:all 0.2s;${isUser ? 'border-color:'+accentColor+'88;box-shadow:0 0 20px '+accentColor+'22;background:'+accentColor+'12' : highlight ? 'border-color:rgba(240,165,0,0.5);background:rgba(240,165,0,0.08)' : ''}">
          <div style="width:2rem;text-align:center;font-size:${m ? '1.2rem' : '0.9rem'};font-weight:700;color:${m ? 'inherit' : isUser ? accentColor : 'rgba(255,255,255,0.3)'}">
            ${m || '#'+r.rank}
          </div>
          <img src="https://flagcdn.com/32x24/${getCountryCode(r.name)}.png" style="border-radius:3px;box-shadow:0 2px 6px rgba(0,0,0,0.3)" onerror="this.style.display='none'">
          <div style="flex:1;font-size:0.9rem;font-weight:${isUser ? '700' : '500'};color:${isUser ? accentColor : '#fff'}">
            ${r.name}${isUser ? ' ← You' : ''}
          </div>
          ${!APP.teamName ? `<button onclick="selectTeam('${r.name}','${getTeamColor(r.name)}')" style="background:rgba(240,165,0,0.15);border:1px solid rgba(240,165,0,0.35);border-radius:12px;color:#f0a500;font-size:0.7rem;padding:0.25rem 0.6rem;cursor:pointer;white-space:nowrap">Pick ⚽</button>` : ''}
        </div>
      `;
    };

    content.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.75rem;gap:0.75rem">
        <div style="color:rgba(255,255,255,0.4);font-size:0.8rem;text-transform:uppercase;letter-spacing:1px">FIFA Rankings • June 2026</div>
        <div style="position:relative">
          <input id="rank-search" type="text" placeholder="🔍 Search team…" oninput="filterRankings(this.value)"
            style="background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.15);border-radius:20px;padding:0.4rem 0.75rem 0.4rem 0.75rem;color:#fff;font-size:0.8rem;outline:none;width:160px;transition:all 0.2s"
            onfocus="this.style.borderColor='rgba(240,165,0,0.6)';this.style.background='rgba(255,255,255,0.1)'"
            onblur="this.style.borderColor='rgba(255,255,255,0.15)';this.style.background='rgba(255,255,255,0.07)'">
        </div>
      </div>

      ${userRank ? `
        <div style="${glass};padding:1.25rem;margin-bottom:1rem;border-color:${accentColor}66;box-shadow:0 0 30px ${accentColor}22;text-align:center">
          <img src="https://flagcdn.com/48x36/${getCountryCode(APP.teamName)}.png" style="border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,0.4);margin-bottom:0.5rem" onerror="this.style.display='none'">
          <div style="color:rgba(255,255,255,0.6);font-size:0.8rem;margin-bottom:0.25rem">Your team is ranked</div>
          <div style="font-size:2.8rem;font-weight:900;color:${accentColor};text-shadow:0 0 30px ${accentColor}88;line-height:1">#${userRank}</div>
          <div style="color:#fff;font-weight:700;font-size:1rem;margin-top:0.25rem">${APP.teamName}</div>
          <div style="color:rgba(255,255,255,0.3);font-size:0.75rem;margin-top:0.25rem">FIFA World Ranking • June 2026</div>
        </div>
      ` : `
        <div style="${glass};padding:1rem;margin-bottom:1rem;text-align:center;border-color:rgba(240,165,0,0.2)">
          <div style="font-size:1.5rem;margin-bottom:0.25rem">🏅</div>
          <div style="color:rgba(255,255,255,0.5);font-size:0.85rem">Pick a team to see your ranking highlighted</div>
        </div>
      `}

      <div id="rank-list">
        ${FIFA_RANKINGS.map(r => renderRankingRow(r, '')).join('')}
      </div>
    `;

    window._rankData = FIFA_RANKINGS;
    window._rankGlass = glass;
    window._renderRankingRow = renderRankingRow;

  } else if (tab === 'watch') {
    const watchItems = [
      {
        icon:'📱', name:'JioHotstar', badge:'FREE', badgeColor:'#4ade80',
        color:'#00b4d8', desc:'Official streaming — all 64 matches live & free',
        sub:'Download app or visit hotstar.com', url:'https://www.hotstar.com/in/sports/football',
        highlight: true,
      },
      {
        icon:'📺', name:'Sports18 / Star Sports', badge:'TV', badgeColor:'#f0a500',
        color:'#ff6b35', desc:'Live TV broadcast — cable, DTH & Tata Play',
        sub:'Check your local cable / DTH provider', url: null,
      },
      {
        icon:'🆓', name:'DD Sports', badge:'FREE TV', badgeColor:'#4ade80',
        color:'#4cc9f0', desc:'Free-to-air — no subscription needed',
        sub:'DD Free Dish · Channel 64', url:'https://www.ddindia.gov.in',
      },
    ];
    content.innerHTML = `
      <div style="margin-bottom:1rem">
        <div style="font-size:1.1rem;font-weight:700;color:#fff">📺 Where to Watch in India</div>
        <div style="font-size:0.72rem;color:rgba(255,255,255,0.35);margin-top:0.25rem">All FIFA WC 2026 matches · Official broadcasters only</div>
      </div>
      ${watchItems.map(w => `
        <div style="${glass};padding:1.25rem;margin-bottom:0.75rem;${w.highlight ? 'border-color:#4ade8033;box-shadow:0 0 24px #4ade8011' : ''}">
          <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:${w.url ? '0.75rem' : '0'}">
            <div style="font-size:2rem;filter:drop-shadow(0 0 8px ${w.color}66)">${w.icon}</div>
            <div style="flex:1">
              <div style="display:flex;align-items:center;gap:0.5rem">
                <span style="font-size:1rem;font-weight:700;color:${w.color}">${w.name}</span>
                <span style="font-size:0.6rem;font-weight:800;background:${w.badgeColor}22;color:${w.badgeColor};border:1px solid ${w.badgeColor}55;border-radius:8px;padding:0.1rem 0.4rem;letter-spacing:0.5px">${w.badge}</span>
              </div>
              <div style="color:rgba(255,255,255,0.6);font-size:0.8rem;margin-top:0.15rem">${w.desc}</div>
              <div style="color:rgba(255,255,255,0.3);font-size:0.7rem;margin-top:0.1rem">${w.sub}</div>
            </div>
          </div>
          ${w.url ? `<a href="${w.url}" target="_blank" rel="noopener noreferrer" style="display:block;text-align:center;padding:0.55rem;background:${w.color}22;border:1px solid ${w.color}44;border-radius:10px;color:${w.color};font-weight:700;font-size:0.82rem;text-decoration:none">Watch Now →</a>` : ''}
        </div>
      `).join('')}
      <div style="${glass};padding:1rem;margin-top:0.5rem;border-color:rgba(255,255,255,0.06)">
        <div style="font-size:0.7rem;color:rgba(255,255,255,0.25);text-align:center;line-height:1.6">
          ℹ️ JioHotstar holds official broadcast rights for India.<br>
          Sports18 & Star Sports on TV. DD Sports free-to-air as per Indian law.
        </div>
      </div>
      <div style="${glass};padding:1.25rem;margin-top:0.75rem;display:flex;align-items:center;gap:1rem;border-color:rgba(37,211,102,0.3)">
        <div style="font-size:2rem">💬</div>
        <div>
          <div style="font-size:1.1rem;font-weight:700;color:#25D366">Share Gol!</div>
          <div style="color:rgba(255,255,255,0.6);font-size:0.85rem;margin-top:0.2rem">Tell your friends about the app!</div>
          <button onclick="shareApp()" style="margin-top:0.5rem;padding:0.4rem 1.25rem;background:#25D366;border:none;border-radius:20px;color:#000;font-weight:700;cursor:pointer;font-size:0.85rem">Share via WhatsApp</button>
        </div>
      </div>
    `;
  }
}

function predict(matchId, pick) {
  savePrediction(matchId, pick);
  highlightPrediction(matchId, pick);
}

function highlightPrediction(matchId, pick) {
  const m = MATCHES.find(x => x.id === matchId);
  if (!m) return;
  const homeBtn = document.getElementById('pred-'+matchId+'-home');
  const drawBtn = document.getElementById('pred-'+matchId+'-draw');
  const awayBtn = document.getElementById('pred-'+matchId+'-away');
  if (!homeBtn) return;
  [homeBtn, drawBtn, awayBtn].forEach(b => {
    b.style.borderColor = 'rgba(255,255,255,0.1)';
    b.style.background = 'rgba(255,255,255,0.05)';
    b.style.boxShadow = 'none';
  });
  if (pick === m.home) {
    homeBtn.style.borderColor = APP.teamColor;
    homeBtn.style.background = APP.teamColor+'33';
    homeBtn.style.boxShadow = '0 0 20px '+APP.teamColor+'44';
  } else if (pick === 'draw') {
    drawBtn.style.borderColor = 'rgba(255,255,255,0.4)';
    drawBtn.style.background = 'rgba(255,255,255,0.15)';
  } else if (pick === m.away) {
    awayBtn.style.borderColor = APP.teamColor;
    awayBtn.style.background = APP.teamColor+'33';
    awayBtn.style.boxShadow = '0 0 20px '+APP.teamColor+'44';
  }
}

function shareApp() {
  const text = `⚽ I'm using Gol! to follow FIFA World Cup 2026! Check it out: https://getgol.in`;
  window.open('https://wa.me/?text='+encodeURIComponent(text), '_blank');
}

function resetTeam() {
  localStorage.removeItem('gol_team');
  localStorage.removeItem('gol_team_name');
  localStorage.removeItem('gol_team_color');
  APP.team = null; APP.teamName = null; APP.teamColor = '#f0a500';
  showApp();
  showTeamPickerModal();
}

function buildStandingsTab(content, glass) {
  // Use live ESPN data if available, else compute from cached local results
  const liveData = window.LIVE ? window.LIVE.getStandings() : null;

  // Derive group order from MATCHES
  const groupTeams = {};
  MATCHES.forEach(m => {
    if (!groupTeams[m.group]) groupTeams[m.group] = new Set();
    groupTeams[m.group].add(m.home);
    groupTeams[m.group].add(m.away);
  });
  const groups = Object.keys(groupTeams).sort();

  // Build standings: prefer live data, fill missing teams with 0s
  const standings = {};
  groups.forEach(g => {
    if (liveData && liveData[g] && liveData[g].length) {
      // Fill any missing teams (ESPN might omit teams with 0 played)
      const liveNames = liveData[g].map(r => r.name);
      const allTeams = [...groupTeams[g]];
      const missing = allTeams.filter(t => !liveNames.includes(t))
        .map(t => ({name:t, p:0, w:0, d:0, l:0, gf:0, ga:0, pts:0}));
      standings[g] = [...liveData[g], ...missing];
    } else {
      // Fall back to computing from cached local results
      const table = {};
      [...groupTeams[g]].forEach(t => { table[t] = {name:t, p:0, w:0, d:0, l:0, gf:0, ga:0, pts:0}; });
      MATCHES.filter(m => m.group === g).forEach(m => {
        const res = localStorage.getItem('result_' + m.id);
        if (!res) return;
        const [hg, ag] = res.split('-').map(Number);
        const h = table[m.home], a = table[m.away];
        h.p++; a.p++; h.gf += hg; h.ga += ag; a.gf += ag; a.ga += hg;
        if (hg > ag)      { h.w++; h.pts += 3; a.l++; }
        else if (hg < ag) { a.w++; a.pts += 3; h.l++; }
        else              { h.d++; h.pts++; a.d++; a.pts++; }
      });
      standings[g] = Object.values(table).sort((a,b) =>
        b.pts - a.pts || (b.gf-b.ga)-(a.gf-a.ga) || b.gf-a.gf
      );
    }
  });

  const updatedAt = window.LIVE?.updatedAt;
  const updatedStr = updatedAt
    ? 'Updated ' + new Date(updatedAt).toLocaleTimeString('en-IN', {hour:'2-digit', minute:'2-digit'})
    : 'Fetching live data…';

  // Map every team to its group for search
  const teamToGroup = {};
  groups.forEach(g => [...groupTeams[g]].forEach(t => { teamToGroup[t.toLowerCase()] = g; }));

  const accentColor = APP.teamColor || '#f0a500';

  const renderGroup = (g) => {
    const rows = standings[g];
    const playedAny = rows.some(r => r.p > 0);
    return `
      <div id="group-${g}" style="${glass};margin-bottom:1rem;overflow:hidden">
        <div style="padding:0.6rem 1rem;background:rgba(255,255,255,0.04);border-bottom:1px solid rgba(255,255,255,0.07);display:flex;align-items:center;justify-content:space-between">
          <span style="font-weight:700;color:#fff;font-size:0.9rem">Group ${g}</span>
          <span style="font-size:0.65rem;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:1px">Top 2 advance</span>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:0.78rem">
          <thead>
            <tr style="color:rgba(255,255,255,0.35);font-size:0.65rem;text-transform:uppercase;letter-spacing:0.5px">
              <th style="text-align:left;padding:0.4rem 0.75rem;font-weight:600">Team</th>
              <th style="padding:0.4rem 0.3rem;text-align:center;font-weight:600">P</th>
              <th style="padding:0.4rem 0.3rem;text-align:center;font-weight:600">W</th>
              <th style="padding:0.4rem 0.3rem;text-align:center;font-weight:600">D</th>
              <th style="padding:0.4rem 0.3rem;text-align:center;font-weight:600">L</th>
              <th style="padding:0.4rem 0.3rem;text-align:center;font-weight:600">GF</th>
              <th style="padding:0.4rem 0.3rem;text-align:center;font-weight:600">GA</th>
              <th style="padding:0.4rem 0.3rem;text-align:center;font-weight:600">GD</th>
              <th style="padding:0.4rem 0.5rem;text-align:center;font-weight:700;color:rgba(255,255,255,0.6)">Pts</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map((r,i) => {
              const isUser = r.name === APP.teamName;
              const advance = i < 2;
              const maybe = i === 2;
              const gd = r.gf - r.ga;
              const borderLeft = advance ? 'border-left:3px solid #4ade80' : maybe ? 'border-left:3px solid #f0a500' : 'border-left:3px solid transparent';
              const rowBg = isUser ? 'background:'+accentColor+'18' : advance && playedAny ? 'background:rgba(74,222,128,0.04)' : '';
              return `
                <tr style="${borderLeft};${rowBg};border-bottom:1px solid rgba(255,255,255,0.05)">
                  <td style="padding:0.55rem 0.75rem;display:flex;align-items:center;gap:0.5rem">
                    <img src="https://flagcdn.com/24x18/${getCountryCode(r.name)}.png" style="border-radius:2px;flex-shrink:0" onerror="this.style.display='none'">
                    <span style="color:${isUser ? accentColor : '#fff'};font-weight:${isUser ? '700' : '500'}">${r.name}</span>
                  </td>
                  <td style="text-align:center;padding:0.55rem 0.3rem;color:rgba(255,255,255,0.7)">${r.p}</td>
                  <td style="text-align:center;padding:0.55rem 0.3rem;color:rgba(255,255,255,0.7)">${r.w}</td>
                  <td style="text-align:center;padding:0.55rem 0.3rem;color:rgba(255,255,255,0.7)">${r.d}</td>
                  <td style="text-align:center;padding:0.55rem 0.3rem;color:rgba(255,255,255,0.7)">${r.l}</td>
                  <td style="text-align:center;padding:0.55rem 0.3rem;color:rgba(255,255,255,0.7)">${r.gf}</td>
                  <td style="text-align:center;padding:0.55rem 0.3rem;color:rgba(255,255,255,0.7)">${r.ga}</td>
                  <td style="text-align:center;padding:0.55rem 0.3rem;color:${gd>0?'#4ade80':gd<0?'#f87171':'rgba(255,255,255,0.5)'}">${gd>0?'+'+gd:gd}</td>
                  <td style="text-align:center;padding:0.55rem 0.5rem;font-weight:700;color:${isUser ? accentColor : '#fff'}">${r.pts}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        <div style="padding:0.4rem 0.75rem;display:flex;gap:1rem;font-size:0.62rem;color:rgba(255,255,255,0.25);border-top:1px solid rgba(255,255,255,0.05)">
          <span><span style="display:inline-block;width:8px;height:8px;background:#4ade80;border-radius:1px;margin-right:3px"></span>Advance to R16</span>
          <span><span style="display:inline-block;width:8px;height:8px;background:#f0a500;border-radius:1px;margin-right:3px"></span>Best 3rd (maybe)</span>
        </div>
      </div>
    `;
  };

  content.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;gap:0.75rem">
      <div>
        <div style="color:#fff;font-weight:700;font-size:1rem">Group Stage</div>
        <div style="color:rgba(255,255,255,0.35);font-size:0.72rem;display:flex;align-items:center;gap:0.35rem">
          <span style="display:inline-block;width:6px;height:6px;background:#4ade80;border-radius:50%"></span>
          ${updatedStr}
        </div>
      </div>
      <div style="position:relative">
        <input id="standings-search" type="text" placeholder="🔍 Find team…" oninput="jumpToTeamGroup(this.value)"
          style="background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.15);border-radius:20px;padding:0.4rem 0.75rem;color:#fff;font-size:0.8rem;outline:none;width:150px;transition:all 0.2s"
          onfocus="this.style.borderColor='rgba(240,165,0,0.6)';this.style.background='rgba(255,255,255,0.1)'"
          onblur="this.style.borderColor='rgba(255,255,255,0.15)';this.style.background='rgba(255,255,255,0.07)'"
          autocomplete="off">
        <div id="search-suggestions" style="position:absolute;right:0;top:110%;background:#1a1a2e;border:1px solid rgba(255,255,255,0.12);border-radius:12px;min-width:170px;z-index:100;display:none;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,0.5)"></div>
      </div>
    </div>

    <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:1rem">
      ${groups.map(g => `
        <button onclick="document.getElementById('group-${g}').scrollIntoView({behavior:'smooth',block:'start'})"
          style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:rgba(255,255,255,0.7);font-size:0.75rem;font-weight:600;padding:0.3rem 0.65rem;cursor:pointer">
          ${g}
        </button>
      `).join('')}
    </div>


    ${groups.map(g => renderGroup(g)).join('')}
  `;

  // Store team→group map for search
  window._teamToGroup = teamToGroup;
  window._allTeams = Object.keys(groupTeams).flatMap(g => [...groupTeams[g]]);
}

function jumpToTeamGroup(query) {
  const sugBox = document.getElementById('search-suggestions');
  if (!query.trim()) { sugBox.style.display = 'none'; return; }
  const q = query.trim().toLowerCase();
  const matches = (window._allTeams || []).filter(t => t.toLowerCase().includes(q));
  if (!matches.length) { sugBox.style.display = 'none'; return; }
  sugBox.style.display = 'block';
  sugBox.innerHTML = matches.map(t => `
    <div onclick="selectStandingsTeam('${t}')"
      style="padding:0.6rem 0.9rem;cursor:pointer;display:flex;align-items:center;gap:0.6rem;border-bottom:1px solid rgba(255,255,255,0.06);color:#fff;font-size:0.82rem"
      onmouseover="this.style.background='rgba(255,255,255,0.08)'"
      onmouseout="this.style.background='transparent'">
      <img src="https://flagcdn.com/24x18/${getCountryCode(t)}.png" style="border-radius:2px" onerror="this.style.display='none'">
      ${t}
      <span style="margin-left:auto;font-size:0.65rem;color:rgba(255,255,255,0.35)">Group ${(window._teamToGroup||{})[t.toLowerCase()]||''}</span>
    </div>
  `).join('');
}

function selectStandingsTeam(team) {
  const groupId = (window._teamToGroup || {})[team.toLowerCase()];
  if (groupId) {
    const el = document.getElementById('group-'+groupId);
    if (el) el.scrollIntoView({behavior:'smooth', block:'start'});
  }
  const inp = document.getElementById('standings-search');
  if (inp) inp.value = team;
  const sug = document.getElementById('search-suggestions');
  if (sug) sug.style.display = 'none';
}

function filterRankings(query) {
  const list = document.getElementById('rank-list');
  if (!list || !window._rankData) return;
  const q = query.trim().toLowerCase();
  list.innerHTML = window._rankData
    .filter(r => !q || r.name.toLowerCase().includes(q))
    .map(r => window._renderRankingRow(r, q))
    .join('');
}

function getTeamColor(name) {
  const colorMap = {
    'Mexico':'#006847','South Africa':'#007A4D','South Korea':'#003478','Czechia':'#D7141A',
    'Canada':'#FF0000','Bosnia':'#002395','Qatar':'#8D1B3D','Switzerland':'#FF0000',
    'Brazil':'#009C3B','Morocco':'#C1272D','Haiti':'#00209F','Scotland':'#003F87',
    'USA':'#B22234','Paraguay':'#D52B1E','Australia':'#FFCD00','Turkey':'#E30A17',
    'Germany':'#FFD700','Curacao':'#002B7F','Ivory Coast':'#F77F00','Ecuador':'#FFD100',
    'Netherlands':'#FF6600','Japan':'#BC002D','Tunisia':'#E70013','Sweden':'#006AA7',
    'Belgium':'#EF3340','Egypt':'#CE1126','Iran':'#239F40','New Zealand':'#00247D',
    'Spain':'#AA151B','Cape Verde':'#003893','Saudi Arabia':'#006C35','Uruguay':'#5EB6E4',
    'France':'#002395','Senegal':'#00853F','Norway':'#EF2B2D','Iraq':'#007A3D',
    'Argentina':'#74ACDF','Algeria':'#006233','Austria':'#ED2939','Jordan':'#007A3D',
    'Portugal':'#006600','Uzbekistan':'#1EB53A','Colombia':'#FCD116','DR Congo':'#007FFF',
    'England':'#CF111B','Croatia':'#FF0000','Ghana':'#006B3F','Panama':'#005293',
  };
  return colorMap[name] || '#f0a500';
}