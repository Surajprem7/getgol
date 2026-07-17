const TEAM_COLORS = {
  'Mexico':'#006847','South Africa':'#007A4D','South Korea':'#003478','Czechia':'#D7141A',
  'Canada':'#FF0000','Bosnia':'#002395','Qatar':'#8D1B3D','Switzerland':'#FF0000',
  'Brazil':'#009C3B','Morocco':'#C1272D','Haiti':'#00209F','Scotland':'#003F87',
  'USA':'#B22234','Paraguay':'#D52B1E','Australia':'#FFCD00','Turkey':'#E30A17',
  'Curacao':'#002B7F','Ivory Coast':'#F77F00','Ecuador':'#FFD100','Germany':'#FFD700',
  'Netherlands':'#FF6600','Japan':'#BC002D','Tunisia':'#E70013','Sweden':'#006AA7',
  'Belgium':'#EF3340','Egypt':'#CE1126','Iran':'#239F40','New Zealand':'#00247D',
  'Spain':'#AA151B','Cape Verde':'#003893','Saudi Arabia':'#006C35','Uruguay':'#5EB6E4',
  'France':'#002395','Senegal':'#00853F','Norway':'#EF2B2D','Iraq':'#007A3D',
  'Argentina':'#74ACDF','Algeria':'#006233','Austria':'#ED2939','Jordan':'#007A3D',
  'Portugal':'#006600','Uzbekistan':'#1EB53A','Colombia':'#FCD116','DR Congo':'#007FFF',
  'England':'#CF111B','Croatia':'#FF0000','Ghana':'#006B3F','Panama':'#005293',
};
function getTeamColor(name) { return TEAM_COLORS[name] || '#f0a500'; }

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
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('/sw.js').then(reg => {
    reg.update();
  });
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload();
  });
  // SW posts UPDATE_AVAILABLE on activate — catches old clients that
  // didn't yet have the controllerchange listener
  navigator.serviceWorker.addEventListener('message', e => {
    if (e.data && e.data.type === 'UPDATE_AVAILABLE') window.location.reload();
  });
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
    <div style="position:relative;z-index:1;background:linear-gradient(180deg,#0c0c1c 0%,#080812 100%);border-radius:24px 24px 0 0;padding:1.25rem 1.25rem 2rem;max-height:88vh;max-height:88dvh;overflow-y:auto;-webkit-overflow-scrolling:touch;border-top:1px solid rgba(255,255,255,0.1);box-shadow:0 -20px 60px rgba(0,0,0,0.6)">

      <!-- Handle bar -->
      <div style="width:40px;height:4px;background:rgba(255,255,255,0.15);border-radius:2px;margin:0 auto 1rem"></div>

      <!-- Brand banner -->
      <div style="text-align:center;padding:0.5rem 0 1.25rem;position:relative">
        <div style="font-size:3rem;filter:drop-shadow(0 0 20px #f0a500);margin-bottom:0.25rem">⚽</div>
        <div style="font-size:2.8rem;font-weight:900;color:#fff;text-shadow:0 0 30px #f0a50066;letter-spacing:-1px;line-height:1">Gol!</div>
        <div style="color:rgba(255,255,255,0.5);font-size:0.85rem;margin-top:0.1rem">FIFA World Cup 2026</div>
        <div style="color:#f0a500;font-size:0.9rem;font-style:italic;margin-top:0.15rem;text-shadow:0 0 12px #f0a50066">¡Pasion por el Gol!</div>
        <div style="color:rgba(255,255,255,0.25);font-size:0.72rem;margin-top:0.3rem">48 teams • 12 groups • 72 group matches</div>

        <!-- SKIP button top-right -->
        <button onclick="closeTeamPicker()" style="position:absolute;top:0;right:0;background:transparent;border:1px solid rgba(255,255,255,0.2);border-radius:20px;color:rgba(255,255,255,0.5);font-size:0.75rem;font-weight:600;letter-spacing:0.5px;padding:0.3rem 0.85rem;cursor:pointer;transition:all 0.2s"
          onmouseover="this.style.color='#fff';this.style.borderColor='rgba(255,255,255,0.5)'"
          onmouseout="this.style.color='rgba(255,255,255,0.5)';this.style.borderColor='rgba(255,255,255,0.2)'">Maybe later</button>
      </div>

      <!-- Pick your team label -->
      <div style="font-size:0.72rem;font-weight:700;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:1px;margin-bottom:0.65rem">Pick your team <span style="font-weight:400;text-transform:none;letter-spacing:0">(optional)</span></div>

      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:0.6rem">
        ${teams.map(t => `
          <button onclick="selectTeam('${t.name}','${t.color}')"
            style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:14px;padding:0.65rem 0.4rem;cursor:pointer;color:#fff;font-size:0.62rem;text-align:center;transition:all 0.2s"
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
  if (!localStorage.getItem('gol-tour-v2')) setTimeout(startTour, 600);
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
    <style>
      @keyframes livePulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.7)} }
      @keyframes headerShrink { from{padding:1rem 0} to{padding:0.4rem 0} }
      #gol-header { transition:padding 0.3s,border-color 0.3s; }
      #gol-header.scrolled { padding:0.35rem 0; border-bottom-color:rgba(255,255,255,0.06); }
      #gol-header.scrolled .gol-logo { font-size:1.3rem; }
      #gol-header.scrolled .gol-tagline { display:none; }
    </style>
    <div style="min-height:100vh;background:linear-gradient(135deg,#050510 0%,#100620 40%,#050d18 100%);position:relative">

      <!-- Stadium pitch background -->
      <div style="position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden;opacity:0.22">
        <svg viewBox="0 0 400 620" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" style="width:100%;height:100%">
          <!-- Pitch turf stripes (alternating dark/light green) -->
          <rect width="400" height="620" fill="#071c07"/>
          <rect x="0"   y="0" width="50" height="620" fill="#0a240a"/>
          <rect x="100" y="0" width="50" height="620" fill="#0a240a"/>
          <rect x="200" y="0" width="50" height="620" fill="#0a240a"/>
          <rect x="300" y="0" width="50" height="620" fill="#0a240a"/>
          <!-- All lines in bright grass-green -->
          <!-- Outer boundary -->
          <rect x="18" y="28" width="364" height="564" fill="none" stroke="#4caf50" stroke-width="2.5"/>
          <!-- Centre line -->
          <line x1="18" y1="310" x2="382" y2="310" stroke="#4caf50" stroke-width="2"/>
          <!-- Centre circle -->
          <circle cx="200" cy="310" r="65" fill="none" stroke="#4caf50" stroke-width="2"/>
          <circle cx="200" cy="310" r="4" fill="#4caf50"/>
          <!-- Top penalty area -->
          <rect x="90" y="28" width="220" height="95" fill="none" stroke="#4caf50" stroke-width="2"/>
          <!-- Top goal area -->
          <rect x="143" y="28" width="114" height="36" fill="none" stroke="#4caf50" stroke-width="1.8"/>
          <!-- Top penalty spot -->
          <circle cx="200" cy="90" r="3" fill="#4caf50"/>
          <!-- Top penalty arc -->
          <path d="M150 123 A65 65 0 0 1 250 123" fill="none" stroke="#4caf50" stroke-width="2"/>
          <!-- Top goal net -->
          <rect x="166" y="16" width="68" height="14" fill="none" stroke="#4caf50" stroke-width="1.5" stroke-dasharray="4 3"/>
          <!-- Bottom penalty area -->
          <rect x="90" y="497" width="220" height="95" fill="none" stroke="#4caf50" stroke-width="2"/>
          <!-- Bottom goal area -->
          <rect x="143" y="556" width="114" height="36" fill="none" stroke="#4caf50" stroke-width="1.8"/>
          <!-- Bottom penalty spot -->
          <circle cx="200" cy="530" r="3" fill="#4caf50"/>
          <!-- Bottom penalty arc -->
          <path d="M150 497 A65 65 0 0 0 250 497" fill="none" stroke="#4caf50" stroke-width="2"/>
          <!-- Bottom goal net -->
          <rect x="166" y="590" width="68" height="14" fill="none" stroke="#4caf50" stroke-width="1.5" stroke-dasharray="4 3"/>
          <!-- Corner arcs -->
          <path d="M18 40 A14 14 0 0 1 32 28" fill="none" stroke="#4caf50" stroke-width="1.5"/>
          <path d="M370 28 A14 14 0 0 1 382 40" fill="none" stroke="#4caf50" stroke-width="1.5"/>
          <path d="M18 580 A14 14 0 0 0 32 592" fill="none" stroke="#4caf50" stroke-width="1.5"/>
          <path d="M370 592 A14 14 0 0 0 382 580" fill="none" stroke="#4caf50" stroke-width="1.5"/>
        </svg>
      </div>

      <!-- Background glow effects -->
      <div style="position:fixed;top:-20%;left:-20%;width:60%;height:60%;background:radial-gradient(circle,${accentColor}10 0%,transparent 70%);pointer-events:none;z-index:0"></div>
      <div style="position:fixed;bottom:-20%;right:-20%;width:60%;height:60%;background:radial-gradient(circle,#4cc9f010 0%,transparent 70%);pointer-events:none;z-index:0"></div>

      <div style="max-width:600px;margin:0 auto;padding:1rem 1rem 5rem;position:relative;z-index:1">
        <header id="gol-header" style="display:flex;align-items:center;justify-content:space-between;padding:1rem 0;border-bottom:1px solid rgba(255,255,255,0.1);margin-bottom:0.5rem;backdrop-filter:blur(10px);position:sticky;top:0;z-index:200;background:rgba(5,5,16,0.85)">
          <div>
            <span class="gol-logo" style="font-size:1.8rem;font-weight:900;color:${accentColor};text-shadow:0 0 20px ${accentColor}88;transition:font-size 0.3s">Gol!</span>
            <span class="gol-tagline" style="color:#f0a500;font-size:0.7rem;font-style:italic;margin-left:0.4rem;opacity:0.8;transition:opacity 0.3s">¡Pasion por el Gol!</span>
          </div>
          <div style="display:flex;align-items:center;gap:0.5rem">
            <button id="notif-bell" onclick="toggleNotifications()" title="Tap to enable match alerts"
              style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:20px;font-size:0.78rem;font-weight:600;cursor:pointer;padding:0.4rem 0.75rem;display:flex;align-items:center;gap:0.3rem;flex-shrink:0;white-space:nowrap;color:rgba(255,255,255,0.6)">🔕 Alerts</button>
            ${headerRight}
          </div>
        </header>

        <div id="notif-prompt"></div>
        <div id="tab-content"></div>
      </div>

      <!-- Bottom navigation bar -->
      <nav id="gol-nav" style="position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:600px;z-index:400;
        background:rgba(8,8,24,0.94);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);
        border-top:1px solid rgba(255,255,255,0.09);
        display:flex;justify-content:space-around;padding:0.3rem 0 calc(0.3rem + env(safe-area-inset-bottom,0px))">
        <button onclick="showTab('matches')" id="nav-matches" style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;background:transparent;border:none;cursor:pointer;padding:0.5rem 0.1rem;border-radius:10px;transition:all 0.25s;color:rgba(255,255,255,0.45)">
          <span style="font-size:0.65rem;font-weight:700;letter-spacing:0.3px">Matches</span>
        </button>
        <button onclick="showTab('groups')" id="nav-groups" style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;background:transparent;border:none;cursor:pointer;padding:0.5rem 0.1rem;border-radius:10px;transition:all 0.25s;color:rgba(255,255,255,0.45)">
          <span style="font-size:0.65rem;font-weight:700;letter-spacing:0.3px">Groups</span>
        </button>
        <button onclick="showTab('knockout')" id="nav-knockout" style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;background:transparent;border:none;cursor:pointer;padding:0.5rem 0.1rem;border-radius:10px;transition:all 0.25s;color:rgba(255,255,255,0.45)">
          <span style="font-size:0.65rem;font-weight:700;letter-spacing:0.3px">Knockout</span>
        </button>
        <button onclick="showTab('rankings')" id="nav-rankings" style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;background:transparent;border:none;cursor:pointer;padding:0.5rem 0.1rem;border-radius:10px;transition:all 0.25s;color:rgba(255,255,255,0.45)">
          <span style="font-size:0.65rem;font-weight:700;letter-spacing:0.3px">Rankings</span>
        </button>
        <button onclick="showTab('watch')" id="nav-watch" style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;background:transparent;border:none;cursor:pointer;padding:0.5rem 0.1rem;border-radius:10px;transition:all 0.25s;color:rgba(255,255,255,0.45)">
          <span style="font-size:0.65rem;font-weight:700;letter-spacing:0.3px">Watch</span>
        </button>
        <button onclick="showTab('stats')" id="nav-stats" style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;background:transparent;border:none;cursor:pointer;padding:0.5rem 0.1rem;border-radius:10px;transition:all 0.25s;color:rgba(255,255,255,0.45)">
          <span style="font-size:0.65rem;font-weight:700;letter-spacing:0.3px">Stats</span>
        </button>
      </nav>
    </div>
  `;
  // Header scroll-shrink — direct JS because inline styles beat CSS class rules
  const _applyHeaderScroll = () => {
    const scrolled = window.scrollY > 40;
    const hdr = document.getElementById('gol-header');
    const logo = hdr && hdr.querySelector('.gol-logo');
    const tag = hdr && hdr.querySelector('.gol-tagline');
    if (hdr) hdr.style.padding = scrolled ? '0.3rem 0' : '1rem 0';
    if (logo) logo.style.fontSize = scrolled ? '1.2rem' : '1.8rem';
    if (tag)  { tag.style.opacity = scrolled ? '0' : '0.8'; tag.style.maxWidth = scrolled ? '0' : ''; tag.style.overflow = scrolled ? 'hidden' : ''; }
  };
  window.removeEventListener('scroll', window._headerScrollFn);
  window._headerScrollFn = _applyHeaderScroll;
  window.addEventListener('scroll', window._headerScrollFn, { passive: true });
  showTab(startTab || 'matches');
  if (typeof updateNotifBell === 'function') updateNotifBell();
  // Deep-link from a notification tap: ?match=<id> auto-opens that match detail
  const _notifMatchId = new URLSearchParams(location.search).get('match');
  if (_notifMatchId) {
    setTimeout(() => {
      if (String(_notifMatchId).startsWith('ko-') && typeof openKOMatchDetail === 'function') {
        openKOMatchDetail(String(_notifMatchId).replace('ko-', ''));
      } else if (typeof openMatchDetail === 'function') {
        openMatchDetail(_notifMatchId);
      }
      history.replaceState(null, '', '/');
    }, 600);
  }
  // Start tour only if team picker is not in DOM — else closeTeamPicker() triggers it
  if (!localStorage.getItem('gol-tour-v2')) {
    setTimeout(() => {
      if (!document.getElementById('team-picker-overlay')) startTour();
    }, 900);
  }
}

// ── Spotlight guided tour ─────────────────────────────────────────────────────
function startTour() {
  const TOUR_KEY = 'gol-tour-v2';
  let step = 0;

  const steps = [
    {
      getEl: () => document.getElementById('nav-knockout'),
      emoji: '🏆',
      title: 'Bracket view is here!',
      body: 'See the full tournament tree — tap to explore.',
      btn: 'Show me',
      color: '#f0a500',
      pulse: 'tourPulseGold',
      btnText: '#000',
      after: () => showTab('knockout'),
    },
    {
      getEl: () => {
        const btns = document.querySelectorAll('#tab-content button');
        for (const b of btns) { if (b.textContent.includes('Bracket')) return b; }
        return null;
      },
      emoji: '👆',
      title: 'Tap Bracket',
      body: 'Switch between List and visual Bracket view anytime.',
      btn: 'Got it!',
      color: '#4cc9f0',
      pulse: 'tourPulseBlue',
      btnText: '#000',
      after: null,
    },
  ];

  // Inject keyframes once (one per step color)
  if (!document.getElementById('gol-tour-style')) {
    const st = document.createElement('style');
    st.id = 'gol-tour-style';
    st.textContent = [
      '@keyframes tourPulseGold{0%,100%{box-shadow:0 0 0 4px rgba(240,165,0,0.55),0 0 0 9px rgba(240,165,0,0.15)}50%{box-shadow:0 0 0 7px rgba(240,165,0,0.75),0 0 0 16px rgba(240,165,0,0.07)}}',
      '@keyframes tourPulseBlue{0%,100%{box-shadow:0 0 0 4px rgba(76,201,240,0.55),0 0 0 9px rgba(76,201,240,0.15)}50%{box-shadow:0 0 0 7px rgba(76,201,240,0.75),0 0 0 16px rgba(76,201,240,0.07)}}',
      '@keyframes tourSlideUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}',
    ].join('');
    document.head.appendChild(st);
  }

  function hexRgba(hex, a) {
    const rv = parseInt(hex.slice(1,3),16), gv = parseInt(hex.slice(3,5),16), bv = parseInt(hex.slice(5,7),16);
    return `rgba(${rv},${gv},${bv},${a})`;
  }

  function render(el, s, stepIdx) {
    const r = el.getBoundingClientRect();
    const p = 8;
    const x = r.left - p, y = r.top - p, w = r.width + p*2, h = r.height + p*2;
    const bg = 'rgba(0,0,0,0.72)';
    const total = steps.length;
    const c = s.color;

    // Overlay with hole
    let ov = document.getElementById('gol-tour-ov');
    if (!ov) { ov = document.createElement('div'); ov.id = 'gol-tour-ov'; document.body.appendChild(ov); }
    ov.style.cssText = 'position:fixed;inset:0;z-index:9800;pointer-events:none';
    ov.innerHTML = `
      <div style="position:absolute;left:0;top:0;right:0;height:${y}px;background:${bg}"></div>
      <div style="position:absolute;left:0;top:${y}px;width:${x}px;height:${h}px;background:${bg}"></div>
      <div style="position:absolute;left:${x+w}px;top:${y}px;right:0;height:${h}px;background:${bg}"></div>
      <div style="position:absolute;left:0;top:${y+h}px;right:0;bottom:0;background:${bg}"></div>
      <div style="position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px;
        border-radius:12px;animation:${s.pulse} 1.6s ease-in-out infinite;
        border:2px solid ${c}"></div>`;

    // Floating card — per-step color theme
    let tip = document.getElementById('gol-tour-tip');
    if (!tip) { tip = document.createElement('div'); tip.id = 'gol-tour-tip'; document.body.appendChild(tip); }
    const dots = Array.from({length: total}, (_,i) =>
      `<div style="width:${i===stepIdx?22:6}px;height:6px;border-radius:3px;background:${i===stepIdx?c:'rgba(255,255,255,0.18)'};transition:all 0.35s;box-shadow:${i===stepIdx?`0 0 8px ${hexRgba(c,0.7)}`:'none'}"></div>`
    ).join('');
    tip.style.cssText = `position:fixed;z-index:9900;
      left:16px;right:16px;bottom:80px;
      background:linear-gradient(145deg,${hexRgba(c,0.14)} 0%,rgba(10,10,28,0.96) 55%);
      backdrop-filter:blur(32px);-webkit-backdrop-filter:blur(32px);
      border:1px solid ${hexRgba(c,0.35)};
      border-radius:24px;
      padding:18px;
      pointer-events:auto;
      box-shadow:0 0 0 1px ${hexRgba(c,0.08)},0 8px 40px rgba(0,0,0,0.6),0 0 60px ${hexRgba(c,0.1)};
      animation:tourSlideUp 0.4s cubic-bezier(0.34,1.3,0.64,1) both`;
    tip.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <div style="display:flex;gap:6px;align-items:center">${dots}</div>
        <button onclick="endTour()" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:50%;width:28px;height:28px;color:rgba(255,255,255,0.4);font-size:13px;cursor:pointer;line-height:1">✕</button>
      </div>
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:18px">
        <div style="width:54px;height:54px;flex-shrink:0;border-radius:18px;
          background:${hexRgba(c,0.15)};border:1.5px solid ${hexRgba(c,0.45)};
          display:flex;align-items:center;justify-content:center;font-size:28px;
          box-shadow:0 0 20px ${hexRgba(c,0.25)}">${s.emoji}</div>
        <div style="flex:1">
          <div style="font-size:16px;font-weight:700;color:#fff;line-height:1.25;margin-bottom:5px">${s.title}</div>
          <div style="font-size:12.5px;color:rgba(255,255,255,0.55);line-height:1.55">${s.body}</div>
        </div>
      </div>
      <button onclick="nextTourStep()" style="width:100%;padding:13px;border-radius:14px;border:none;
        background:linear-gradient(90deg,${c},${hexRgba(c,0.8)});
        color:${s.btnText};font-weight:800;font-size:14px;cursor:pointer;
        letter-spacing:0.3px;box-shadow:0 4px 20px ${hexRgba(c,0.45)}">${s.btn}</button>`;
  }

  window.nextTourStep = function() {
    const s = steps[step];
    if (s.after) s.after();
    step++;
    if (step >= steps.length) { endTour(); return; }
    const tryShow = (attempts) => {
      const el = steps[step].getEl();
      if (!el) {
        if (attempts < 15) setTimeout(() => tryShow(attempts + 1), 200);
        else endTour();
        return;
      }
      render(el, steps[step], step);
    };
    setTimeout(() => tryShow(0), 400);
  };

  window.endTour = function() {
    ['gol-tour-ov','gol-tour-tip','gol-tour-style'].forEach(id => { const e = document.getElementById(id); if (e) e.remove(); });
    localStorage.setItem(TOUR_KEY, '1');
  };

  const el = steps[0].getEl();
  if (!el) return;
  render(el, steps[0], 0);
}

function jumpToDate(date) {
  const el = document.querySelector(`[data-date-header="${date}"]`);
  if (!el) return;
  const headerH = document.getElementById('gol-header')?.getBoundingClientRect().height || 60;
  const top = el.getBoundingClientRect().top + window.scrollY - headerH - 8;
  window.scrollTo({ top, behavior: 'smooth' });
}

// Spacing constants for the scrollable timeline
const TL_SPACING = 40; // px between date nodes
const TL_PAD = 24;     // px top/bottom padding

// Highlight the timeline node whose group is most visible in the viewport
function updateTimelineActive() {
  const headers = document.querySelectorAll('[data-date-header]');
  let activeDate = null;
  const headerH = document.getElementById('gol-header')?.getBoundingClientRect().height || 72;
  const mid = headerH + (window.innerHeight - headerH) * 0.35;
  headers.forEach(h => {
    if (h.offsetParent === null) return; // skip headers inside display:none containers
    const rect = h.getBoundingClientRect();
    if (rect.top <= mid) activeDate = h.dataset.dateHeader;
  });
  if (!activeDate) return;

  const accent = APP.teamColor || '#f0a500';
  const baseDates = [...new Set([...MATCHES].sort((a,b) => a.date.localeCompare(b.date)).map(m => m.date))];
  const koDates2 = (() => {
    if (!window._koData) return [];
    const s = new Set();
    const toIST = (iso) => { const d = new Date(new Date(iso).getTime() + 5.5*60*60*1000); return d.toISOString().slice(0,10); };
    Object.values(window._koData).forEach(list => list.forEach(ev => { if (ev.date) s.add(toIST(ev.date)); }));
    return [...s];
  })();
  const tlDates = [...new Set([...baseDates, ...koDates2])].sort();
  const activeIdx = tlDates.indexOf(activeDate);
  if (activeIdx < 0) return;

  const nodePx = TL_PAD + activeIdx * TL_SPACING;

  const bloom = document.getElementById('tl-bloom');
  const fill  = document.getElementById('tl-fill');
  if (bloom) bloom.style.top = (nodePx - 35) + 'px';
  if (fill)  fill.style.height = nodePx + 'px';

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
  if (sc && (sc.status === 'FT' || sc.status === 'LIVE')) {
    const live = sc.status === 'LIVE';
    return `${live ? `<div style="display:inline-flex;align-items:center;gap:3px;background:rgba(239,68,68,0.18);border:1px solid rgba(239,68,68,0.5);border-radius:8px;padding:1px 6px;margin-bottom:3px">
      <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#ef4444;animation:livePulse 1s ease-in-out infinite"></span>
      <span style="font-size:0.55rem;color:#ef4444;font-weight:800;letter-spacing:0.8px">LIVE</span>
    </div>` : ''}
      <div style="font-size:1.3rem;font-weight:900;color:#fff;letter-spacing:1px;line-height:1.1">${sc.home}–${sc.away}</div>
      ${!live ? `<div style="font-size:0.58rem;color:rgba(255,255,255,0.3);margin-top:1px">FT</div>` : `<div style="font-size:0.58rem;color:#f87171;font-weight:600">${sc.clock||''}</div>`}`;
  }
  return `<div style="font-size:1rem;font-weight:900;color:rgba(255,255,255,0.2);letter-spacing:2px">VS</div>`;
}

// Compact score for the "your fixtures" rows (smaller than the full card VS)
function shortScoreHTML(matchId) {
  const sc = window.LIVE && window.LIVE.score(matchId);
  if (sc && (sc.status === 'FT' || sc.status === 'LIVE')) {
    const live = sc.status === 'LIVE';
    const color = live ? '#4ade80' : '#fff';
    return `<span style="font-weight:900;color:${color}">${sc.home >= 0 ? sc.home : 0}–${sc.away >= 0 ? sc.away : 0}</span>${live ? ' <span style="font-size:0.5rem;color:#4ade80">●</span>' : ''}`;
  }
  return `<span style="color:rgba(255,255,255,0.3);font-weight:700;font-size:0.7rem">vs</span>`;
}

function showTab(tab) {
  window._activeTab = tab;
  // Remove any floating hint from knockout tab
  const oldHint = document.getElementById('ko-bracket-hint');
  if (oldHint) oldHint.remove();
  if (tab !== 'matches' && _tlScrollHandler) {
    window.removeEventListener('scroll', _tlScrollHandler);
    _tlScrollHandler = null;
  }
  const content = document.getElementById('tab-content');

  // Update bottom nav active state
  const accent = APP.teamColor || '#f0a500';
  ['matches','groups','knockout','rankings','watch','stats'].forEach(t => {
    const btn = document.getElementById('nav-'+t);
    if (!btn) return;
    if (t === tab) {
      btn.style.color = accent;
      btn.style.background = accent + '18';
    } else {
      btn.style.color = 'rgba(255,255,255,0.45)';
      btn.style.background = 'transparent';
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
      const hc = getTeamColor(m.home);
      const ac = getTeamColor(m.away);
      return `
      <div data-date="${m.date}" data-group="${m.group}" style="${glass};margin-bottom:0.75rem;overflow:hidden;position:relative;${isMyMatch ? 'border-color:'+accentColor+'66;box-shadow:0 0 24px '+accentColor+'22' : ''}">
       <!-- Team color stripe top -->
       <div style="height:3px;background:linear-gradient(90deg,${hc} 0%,${hc} 50%,${ac} 50%,${ac} 100%);opacity:0.85"></div>

       <!-- Cute add-to-calendar chip (top-right, independent of the tap-to-open area) -->
       <button onclick="addToCalendar(${m.id});event.stopPropagation()" title="Add to your calendar" aria-label="Add to calendar"
         style="position:absolute;top:0.5rem;right:0.5rem;z-index:3;width:30px;height:30px;border-radius:10px;background:rgba(240,165,0,0.12);border:1px solid rgba(240,165,0,0.35);cursor:pointer;font-size:0.9rem;line-height:1;display:flex;align-items:center;justify-content:center;transition:all 0.2s"
         onmouseover="this.style.background='rgba(240,165,0,0.25)';this.style.transform='scale(1.1)'"
         onmouseout="this.style.background='rgba(240,165,0,0.12)';this.style.transform='scale(1)'">🗓️</button>

       <div onclick="openMatchDetail(${m.id})" style="cursor:pointer">
        <!-- Date badge — centered, attractive -->
        <div style="text-align:center;padding:0.6rem 1rem 0;display:flex;align-items:center;justify-content:center;gap:0.5rem">
          <span style="font-size:0.72rem;font-weight:600;color:#f0a500;letter-spacing:0.3px">Group ${m.group}</span>
          <span style="color:rgba(255,255,255,0.25);font-size:0.65rem">•</span>
          <span style="font-size:0.72rem;font-weight:600;color:#f0a500;letter-spacing:0.3px">${formatIST(m.date, m.time)}</span>
        </div>

        <!-- Teams row -->
        <div style="display:flex;align-items:center;justify-content:space-between;padding:0.9rem 1rem 0.5rem">
          <div style="text-align:center;flex:1">
            <img src="https://flagcdn.com/48x36/${getCountryCode(m.home)}.png" width="48" height="36" style="border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,0.4)" onerror="this.style.display='none'">
            <div style="font-size:0.85rem;color:#fff;margin-top:0.4rem;font-weight:600">${m.home}</div>
          </div>
          <div data-vs="${m.id}" data-vs-style="full" style="text-align:center;padding:0 0.5rem;min-width:56px">${renderVS(m.id)}</div>
          <div style="text-align:center;flex:1">
            <img src="https://flagcdn.com/48x36/${getCountryCode(m.away)}.png" width="48" height="36" style="border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,0.4)" onerror="this.style.display='none'">
            <div style="font-size:0.85rem;color:#fff;margin-top:0.4rem;font-weight:600">${m.away}</div>
          </div>
        </div>

        <!-- Venue -->
        <div style="font-size:0.72rem;color:rgba(255,255,255,0.72);text-align:center;padding:0 1rem 0.5rem">${m.venue}</div>
        <div style="text-align:center;padding:0 1rem 0.7rem">
          <span style="display:inline-block;font-size:0.68rem;font-weight:700;color:#fff;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);border-radius:14px;padding:0.32rem 0.85rem">👆 Tap for line-ups, stats &amp; summary</span>
        </div>
       </div>

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

    // Group-stage dates
    const tlDates = [...new Set(sortedMatches.map(m => m.date))].sort();

    // Helper: extract unique IST dates from cached knockout data
    const toISTDateStr = (iso) => {
      if (!iso) return '';
      const d = new Date(new Date(iso).getTime() + 5.5 * 60 * 60 * 1000);
      return d.toISOString().slice(0, 10);
    };
    const getKoDates = () => {
      if (!window._koData) return [];
      const s = new Set();
      Object.values(window._koData).forEach(list =>
        list.forEach(ev => { const d = toISTDateStr(ev.date); if (d) s.add(d); })
      );
      return [...s].sort();
    };

    // All timeline dates = group stage + knockout (if cached)
    let allTlDates = [...new Set([...tlDates, ...getKoDates()])].sort();

    // Rebuild just the timeline inner nodes (called after async KO load adds new dates)
    const buildTimelineNodes = (dates) => {
      const inner = document.getElementById('tl-inner');
      if (!inner) return;
      // Remove old nodes (keep first 3 static elements: bgLine, fill, bloom)
      while (inner.children.length > 3) inner.removeChild(inner.lastChild);
      const totalH = TL_PAD * 2 + (dates.length - 1) * TL_SPACING;
      inner.style.height = totalH + 'px';
      // Re-add nodes for full date set
      dates.forEach((date, i) => {
        const top = TL_PAD + i * TL_SPACING;
        const d = new Date(date + 'T00:00:00');
        const day = d.getDate(), mon = months[d.getMonth()];
        // Minor ticks between this and next node
        if (i < dates.length - 1) {
          [1,2].forEach(t => {
            const mp = top + (t/3) * TL_SPACING;
            const tick = document.createElement('div');
            tick.style.cssText = `position:absolute;right:10px;top:${mp}px;width:4px;height:1px;background:rgba(255,255,255,0.1);transform:translateY(-50%)`;
            inner.appendChild(tick);
          });
        }
        // Major tick
        const maj = document.createElement('div');
        maj.style.cssText = `position:absolute;right:10px;top:${top}px;width:8px;height:1px;background:rgba(255,255,255,0.25);transform:translateY(-50%)`;
        inner.appendChild(maj);
        // Label
        const label = document.createElement('div');
        label.id = `tl-day-${date}`;
        label.style.cssText = `position:absolute;right:20px;top:${top}px;transform:translateY(-50%);text-align:right;line-height:1.1;pointer-events:none`;
        label.innerHTML = `<div style="font-size:0.58rem;font-weight:700;color:rgba(255,255,255,0.3);transition:all 0.3s">${day}</div><div style="font-size:0.42rem;color:rgba(255,255,255,0.18);transition:all 0.3s">${mon}</div>`;
        inner.appendChild(label);
        // Node
        const node = document.createElement('div');
        node.id = `tl-node-${date}`;
        node.setAttribute('onclick', `jumpToDate('${date}')`);
        node.style.cssText = `position:absolute;right:0;top:${top}px;transform:translateY(-50%);width:14px;height:14px;border-radius:50%;cursor:pointer;background:#0d0d1e;border:1.5px solid rgba(255,255,255,0.15);transition:all 0.3s;box-sizing:border-box;z-index:2`;
        inner.appendChild(node);
      });
      allTlDates = dates;
      updateTimelineActive();
    };
    window._buildTimelineNodes = buildTimelineNodes;
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    // Group matches by date for rendering with date headers
    const byDate = {};
    sortedMatches.forEach(m => {
      if (!byDate[m.date]) byDate[m.date] = [];
      byDate[m.date].push(m);
    });

    // ── "Your fixtures" section: the selected team's matches, pinned at top ──
    const renderMyRow = (m) => {
      const d = new Date(m.date + 'T00:00:00');
      const dl = `${d.getDate()} ${months[d.getMonth()]}`;
      const isKO = m.isKO;
      const groupLabel = isKO ? (m.group || 'Knockout') : `Grp ${m.group}`;
      const groupColor = isKO ? '#a78bfa' : 'rgba(255,255,255,0.5)';

      // For KO rows: look up live score from _koData
      const koEspnId = isKO ? m.id.replace('ko-', '') : null;
      const koEv = koEspnId && window._koData ? (() => {
        for (const list of Object.values(window._koData)) {
          const found = list.find(e => String(e.espnId) === koEspnId);
          if (found) return found;
        }
        return null;
      })() : null;

      let scoreMid;
      if (isKO) {
        if (koEv && (koEv.status === 'FT' || koEv.status === 'LIVE') && koEv.home.score >= 0) {
          const live = koEv.status === 'LIVE';
          scoreMid = `<span style="font-weight:900;font-size:0.85rem;color:${live ? '#4ade80' : '#fff'}">${koEv.home.score}–${koEv.away.score}</span>`;
        } else {
          scoreMid = `<span style="color:rgba(255,255,255,0.3);font-weight:700;font-size:0.7rem">vs</span>`;
        }
      } else {
        scoreMid = `<span data-vs="${m.id}" data-vs-style="mini" style="min-width:42px;text-align:center;font-size:0.85rem">${shortScoreHTML(m.id)}</span>`;
      }

      const onclick = isKO
        ? `openKOMatchDetail('${koEspnId}')`
        : `jumpToDate('${m.date}')`;

      const hFlag = `<img src="https://flagcdn.com/24x18/${getCountryCode(m.home)}.png" style="border-radius:2px;flex-shrink:0" onerror="this.style.display='none'">`;
      const aFlag = `<img src="https://flagcdn.com/24x18/${getCountryCode(m.away)}.png" style="border-radius:2px;flex-shrink:0" onerror="this.style.display='none'">`;

      return `
        <div onclick="${onclick}" style="padding:0.55rem 0.6rem;border-radius:10px;background:rgba(255,255,255,0.03);margin-bottom:0.4rem;cursor:pointer;transition:background 0.2s"
          onmouseover="this.style.background='rgba(255,255,255,0.07)'" onmouseout="this.style.background='rgba(255,255,255,0.03)'">
          <div style="display:flex;align-items:center;gap:0.4rem;margin-bottom:0.4rem">
            <span style="font-size:0.64rem;font-weight:700;color:rgba(255,255,255,0.75)">${dl}</span>
            <span style="font-size:0.58rem;color:rgba(255,255,255,0.35)">${m.time} IST</span>
            <span style="margin-left:auto;font-size:0.55rem;font-weight:700;color:${groupColor};background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);border-radius:7px;padding:0.12rem 0.45rem;white-space:nowrap">${groupLabel}</span>
          </div>
          <div style="display:flex;align-items:center;gap:0.5rem">
            <span style="flex:1;text-align:right;font-size:0.8rem;color:#fff;font-weight:${m.home === APP.teamName ? '700' : '500'}">${m.home}</span>
            ${hFlag}
            ${scoreMid}
            ${aFlag}
            <span style="flex:1;text-align:left;font-size:0.8rem;color:#fff;font-weight:${m.away === APP.teamName ? '700' : '500'}">${m.away}</span>
          </div>
        </div>`;
    };

    const _koISTDateStr = (iso) => { const d = new Date(new Date(iso).getTime() + 5.5*60*60*1000); return d.toISOString().slice(0,10); };
    const _koTimeFmt = new Intl.DateTimeFormat('en-IN', { timeZone:'Asia/Kolkata', hour:'2-digit', minute:'2-digit', hour12:false });
    const myMatches = APP.teamName ? (() => {
      const groupUpcoming = sortedMatches.filter(m => {
        if (m.home !== APP.teamName && m.away !== APP.teamName) return false;
        const sc = window.LIVE && window.LIVE.score(m.id);
        return !(sc && sc.status === 'FT');
      });
      const koUpcoming = [];
      if (window._koData) {
        Object.entries(window._koData).forEach(([round, list]) => {
          list.forEach(ev => {
            const hName = ev.home?.name || '', aName = ev.away?.name || '';
            if (hName !== APP.teamName && aName !== APP.teamName) return;
            if (ev.status === 'FT') return;
            koUpcoming.push({
              id: `ko-${ev.espnId}`, isKO: true,
              home: hName || 'TBD', away: aName || 'TBD',
              date: _koISTDateStr(ev.date),
              time: _koTimeFmt.format(new Date(ev.date)),
              group: KO_ROUND_LABEL[round] || round,
            });
          });
        });
      }
      return [...groupUpcoming, ...koUpcoming];
    })() : [];
    const mySection = myMatches.length ? `
      <div style="position:sticky;top:56px;z-index:100;margin-bottom:0.75rem">
        <div style="${glass};padding:0.75rem;border-color:${accentColor}55;background:linear-gradient(180deg,${accentColor}18,rgba(8,8,24,0.97));backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px)">
          <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.6rem">
            <img src="https://flagcdn.com/24x18/${getCountryCode(APP.teamName)}.png" style="border-radius:2px" onerror="this.style.display='none'">
            <span style="font-size:0.82rem;font-weight:800;color:${accentColor}">${APP.teamName} — upcoming</span>
            <span style="font-size:0.6rem;color:rgba(255,255,255,0.3);margin-left:auto">${myMatches.length} match${myMatches.length !== 1 ? 'es' : ''}</span>
          </div>
          ${myMatches.map(renderMyRow).join('')}
        </div>
      </div>` : '';

    content.innerHTML = `
      <style>
        @keyframes bloomPulse {
          0%,100% { opacity:0.7; }
          50%      { opacity:1; }
        }
        @keyframes tlFadeIn { from{opacity:0} to{opacity:1} }
        @keyframes comicPop {
          0%   { transform:scale(0.6) rotate(-6deg); opacity:0; }
          60%  { transform:scale(1.06) rotate(2deg); opacity:1; }
          100% { transform:scale(1) rotate(-1.5deg); opacity:1; }
        }
        @keyframes comicWiggle {
          0%,100% { transform:rotate(-1.5deg); }
          50%     { transform:rotate(1.5deg); }
        }
        #cal-hint { animation:comicPop 0.5s cubic-bezier(0.34,1.56,0.64,1) both, comicWiggle 3.5s ease-in-out 0.6s infinite; }
        #cal-hint:hover { animation-play-state:paused; }
      </style>

      <div style="display:flex;gap:0.5rem;align-items:flex-start">

        <!-- Match cards column — sorted by date -->
        <div style="flex:1;min-width:0">
          ${localStorage.getItem('gol_cal_hint') ? '' : `
            <div id="cal-hint" style="position:relative;display:flex;align-items:center;gap:0.7rem;margin:0.4rem 0.3rem 1.1rem;padding:0.75rem 0.9rem;
              background:rgba(240,165,0,0.10);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);
              border:2.5px solid #f0a500;border-radius:18px;box-shadow:4px 4px 0 rgba(240,165,0,0.22);
              font-family:'Comic Sans MS','Comic Sans','Chalkboard SE',cursive">
              <!-- glassy speech-bubble tail (rotated square continuing the outline) pointing DOWN toward the 🗓️ chip on the card below -->
              <div style="position:absolute;bottom:-9px;right:28px;width:15px;height:15px;background:rgba(240,165,0,0.10);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border-right:2.5px solid #f0a500;border-bottom:2.5px solid #f0a500;transform:rotate(45deg)"></div>
              <span style="font-size:1.7rem;line-height:1;filter:drop-shadow(1px 1px 1px rgba(0,0,0,0.4))">🗓️</span>
              <div style="flex:1;line-height:1.15">
                <div style="font-size:0.92rem;font-weight:800;color:#fff;text-transform:uppercase;letter-spacing:0.3px;transform:rotate(-1deg);text-shadow:0 1px 3px rgba(0,0,0,0.5)">Never miss your match!</div>
                <div style="font-size:0.74rem;font-weight:700;color:#f0a500;margin-top:1px;text-shadow:0 1px 2px rgba(0,0,0,0.4)">Add to your Calendar</div>
              </div>
              <button onclick="dismissCalHint()" aria-label="Dismiss" style="flex-shrink:0;width:22px;height:22px;border-radius:50%;background:rgba(240,165,0,0.18);border:2px solid #f0a500;color:#f0a500;font-size:0.7rem;font-weight:800;cursor:pointer;line-height:1">✕</button>
            </div>`}
          ${mySection}
          <!-- Knockout fixtures — shown at top so today's KO matches are immediately visible -->
          <div id="ko-fixtures-section"></div>
          ${(() => {
            const todayCheck = new Date(Date.now() + 5.5*60*60*1000).toISOString().slice(0,10);
            const lastGroupDate = tlDates[tlDates.length - 1] || '2026-06-29';
            const isKOPhase = todayCheck > lastGroupDate;
            const groupHTML = tlDates.map(date => {
              const d = new Date(date + 'T00:00:00');
              const dateLabel = `${d.getDate()} ${months[d.getMonth()]}`;
              const dayMatches = byDate[date] || [];
              return `
                <div data-date-header="${date}" style="display:flex;align-items:center;gap:0.5rem;margin:1rem 0 0.5rem">
                  <div style="font-size:0.78rem;font-weight:700;color:${accentColor};white-space:nowrap">${dateLabel}</div>
                  <div style="flex:1;height:1px;background:linear-gradient(90deg,${accentColor}44,transparent)"></div>
                </div>
                ${dayMatches.map(m => renderMatch(m)).join('')}
              `;
            }).join('');
            if (!isKOPhase) return groupHTML;
            // KO phase — collapse group stage results under a toggle
            return `
              <div style="margin:1rem 0 0.4rem">
                <button id="gs-toggle-btn" onclick="(function(){var c=document.getElementById('gs-content');var b=document.getElementById('gs-toggle-btn');var open=c.style.display!=='none';c.style.display=open?'none':'block';b.innerHTML=open?'▶ Group Stage Results (${sortedMatches.length} matches)':'▼ Group Stage Results (${sortedMatches.length} matches)';})()"
                  style="width:100%;display:flex;align-items:center;gap:0.5rem;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:0.5rem 0.75rem;cursor:pointer;color:rgba(255,255,255,0.45);font-size:0.75rem;font-weight:600;text-align:left">
                  ▶ Group Stage Results (${sortedMatches.length} matches)
                </button>
                <div id="gs-content" style="display:none">${groupHTML}</div>
              </div>`;
          })()}
        </div>

        <!-- Ruler timeline — sticky, scrollable -->
        <div id="match-timeline" style="width:48px;flex-shrink:0;position:sticky;top:80px;align-self:flex-start;
          height:calc(100vh - 9.5rem);overflow-y:scroll;overflow-x:hidden;
          scrollbar-width:none;-ms-overflow-style:none;animation:tlFadeIn 0.4s ease">
          <style>#match-timeline::-webkit-scrollbar{display:none}</style>
          <div id="tl-inner" style="position:relative;width:100%;height:${TL_PAD*2+(allTlDates.length-1)*TL_SPACING}px">

            <!-- Dim background line (full height) -->
            <div style="position:absolute;right:8px;top:0;bottom:0;width:1.5px;background:rgba(255,255,255,0.08);border-radius:2px"></div>

            <!-- Bright filled line above active (updated by JS) -->
            <div id="tl-fill" style="position:absolute;right:8px;top:0;width:2px;height:0;background:linear-gradient(180deg,${accentColor}44,${accentColor});border-radius:2px;transition:height 0.4s cubic-bezier(0.4,0,0.2,1)"></div>

            <!-- Horizontal glow bloom at active node -->
            <div id="tl-bloom" style="position:absolute;right:-6px;width:46px;height:70px;
              background:radial-gradient(ellipse 23px 35px at 75% 50%, ${accentColor}55 0%, ${accentColor}22 45%, transparent 70%);
              top:0;transition:top 0.4s cubic-bezier(0.4,0,0.2,1);
              animation:bloomPulse 2.5s ease-in-out infinite;pointer-events:none"></div>

            <!-- Ruler tick marks + date nodes -->
            ${allTlDates.map((date, i) => {
              const top = TL_PAD + i * TL_SPACING;
              const d = new Date(date + 'T00:00:00');
              const day = d.getDate();
              const mon = months[d.getMonth()];
              const minorTicks = i < allTlDates.length - 1 ? [1,2].map(t => {
                const mp = top + (t / 3) * TL_SPACING;
                return `<div style="position:absolute;right:10px;top:${mp}px;width:4px;height:1px;background:rgba(255,255,255,0.1);transform:translateY(-50%)"></div>`;
              }).join('') : '';
              return `
                ${minorTicks}
                <div style="position:absolute;right:10px;top:${top}px;width:8px;height:1px;background:rgba(255,255,255,0.25);transform:translateY(-50%)"></div>
                <div id="tl-day-${date}" style="position:absolute;right:20px;top:${top}px;transform:translateY(-50%);text-align:right;line-height:1.1;pointer-events:none">
                  <div style="font-size:0.58rem;font-weight:700;color:rgba(255,255,255,0.3);transition:all 0.3s">${day}</div>
                  <div style="font-size:0.42rem;color:rgba(255,255,255,0.18);transition:all 0.3s">${mon}</div>
                </div>
                <div id="tl-node-${date}" onclick="jumpToDate('${date}')"
                  style="position:absolute;right:0;top:${top}px;transform:translateY(-50%);
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
        if (total === 0) { countsEl.innerHTML = '<span style="color:rgba(255,255,255,0.6)">Be the first to predict!</span>'; return; }
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
            <span style="color:rgba(255,255,255,0.75);font-weight:600">${total} vote${total>1?'s':''}</span>
            <span style="color:#4cc9f0;font-weight:700">${awayP}%</span>
          </div>
        `;
      });
    });

    // Start scroll listener for timeline node highlighting
    if (_tlScrollHandler) window.removeEventListener('scroll', _tlScrollHandler);
    _tlScrollHandler = updateTimelineActive;
    window.addEventListener('scroll', _tlScrollHandler, { passive: true });

    // Centre the timeline sidebar on today's node — once only, never repeated
    // (resetting tlEl.scrollTop after initial render breaks date taps near month boundaries)
    setTimeout(() => {
      const todayIST = new Date(Date.now() + 5.5*60*60*1000).toISOString().slice(0,10);
      const activeDate = allTlDates.find(d => d >= todayIST) || allTlDates[allTlDates.length - 1];
      if (!activeDate) return;
      const idx = allTlDates.indexOf(activeDate);
      if (idx >= 0) {
        const tlEl = document.getElementById('match-timeline');
        if (tlEl) {
          const nodePx = TL_PAD + idx * TL_SPACING;
          const tlH = tlEl.offsetHeight || (window.innerHeight * 0.75);
          tlEl.scrollTop = Math.max(0, nodePx - tlH / 2);
        }
      }
      updateTimelineActive();
    }, 80);

    if (typeof refreshMatchScores === 'function') refreshMatchScores();

    // Async: load knockout fixtures and append below group stage
    (async () => {
      try {
        const koData = window._koData || await fetchKnockout();
        if (!koData) return;
        window._koData = koData;
        const section = document.getElementById('ko-fixtures-section');
        if (!section) return;
        const _koStandings = (window.LIVE && window.LIVE.getStandings) ? window.LIVE.getStandings() : {};
        const _koFlagOrSlot = (t) => {
          if (t.real) return `<img src="https://flagcdn.com/48x36/${t.code}.png" width="48" height="36" style="border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,0.4)" onerror="this.style.display='none'">`;
          const cand = koSlotCandidates(t.name, _koStandings);
          if (cand && cand.current) {
            const cc = getCountryCode(cand.current);
            return `<img src="https://flagcdn.com/48x36/${cc}.png" width="48" height="36" style="border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,0.4);opacity:0.7" onerror="this.style.display='none'">`;
          }
          return `<div style="width:48px;height:36px;border-radius:6px;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);display:flex;align-items:center;justify-content:center;font-size:1.1rem">🛡️</div>`;
        };
        const _koDisplayName = (t) => {
          if (t.real) return t.name;
          const cand = koSlotCandidates(t.name, _koStandings);
          if (cand && cand.current) return `<span style="opacity:0.75">${cand.current}</span>`;
          return `<span style="font-size:0.7rem;color:rgba(255,255,255,0.4);font-style:italic">${t.name || 'TBD'}</span>`;
        };

        // Convert ESPN UTC date → IST date string (YYYY-MM-DD)
        const toISTDate = (iso) => {
          if (!iso) return '';
          const d = new Date(new Date(iso).getTime() + 5.5 * 60 * 60 * 1000);
          return d.toISOString().slice(0, 10);
        };

        // Rebuild timeline with newly-loaded knockout IST dates
        const freshKoDates = (() => {
          const s = new Set();
          Object.values(koData).forEach(list => list.forEach(ev => { const d = toISTDate(ev.date); if (d) s.add(d); }));
          return [...s].sort();
        })();
        const newAllDates = [...new Set([...tlDates, ...freshKoDates])].sort();
        if (newAllDates.length !== allTlDates.length && typeof window._buildTimelineNodes === 'function') {
          window._buildTimelineNodes(newAllDates);
        }

        const timeFmt = new Intl.DateTimeFormat('en-IN', { timeZone:'Asia/Kolkata', hour:'2-digit', minute:'2-digit', hour12:false });
        const dayFmt  = new Intl.DateTimeFormat('en-IN', { timeZone:'Asia/Kolkata', day:'numeric', month:'short' });
        const roundLabel = { 'round-of-32':'Round of 32','round-of-16':'Round of 16',
          'quarterfinals':'Quarter-finals','semifinals':'Semi-finals',
          '3rd-place-match':'Third Place','final':'⚽ THE FINAL' };
        const roundOrder = ['round-of-32','round-of-16','quarterfinals','semifinals','3rd-place-match','final'];

        // Flatten all matches sorted by date, tagged with round
        const allMatches = [];
        for (const round of roundOrder) {
          (koData[round] || []).forEach(ev => allMatches.push({ ...ev, round }));
        }
        allMatches.sort((a, b) => new Date(a.date) - new Date(b.date));

        // Group by IST date
        const byISTDate = {};
        allMatches.forEach(ev => {
          const d = toISTDate(ev.date);
          if (d) { if (!byISTDate[d]) byISTDate[d] = []; byISTDate[d].push(ev); }
        });

        let html = `<div style="display:flex;align-items:center;gap:0.5rem;margin:1.5rem 0 0.75rem">
          <div style="font-size:0.78rem;font-weight:700;color:#a78bfa;white-space:nowrap">🏆 Knockout Stage</div>
          <div style="flex:1;height:1px;background:linear-gradient(90deg,#a78bfa44,transparent)"></div>
        </div>`;

        for (const isoDate of Object.keys(byISTDate).sort()) {
          const eventsOnDay = byISTDate[isoDate];
          const d = new Date(isoDate + 'T00:00:00');
          const dayLabel = `${d.getDate()} ${months[d.getMonth()]}`;
          // Date header — used by jumpToDate
          html += `<div data-date-header="${isoDate}" style="display:flex;align-items:center;gap:0.5rem;margin:1rem 0 0.5rem">
            <div style="font-size:0.78rem;font-weight:700;color:#a78bfa;white-space:nowrap">${dayLabel}</div>
            <div style="flex:1;height:1px;background:linear-gradient(90deg,#a78bfa44,transparent)"></div>
          </div>`;
          let lastRound = '';
          for (const ev of eventsOnDay) {
            if (ev.round !== lastRound) {
              html += `<div style="font-size:0.62rem;font-weight:700;color:rgba(167,139,250,0.6);text-transform:uppercase;letter-spacing:1px;margin:0.5rem 0 0.3rem">${roundLabel[ev.round]||ev.round}</div>`;
              lastRound = ev.round;
            }
            const h = ev.home, a = ev.away;
            const hName = h.name || 'TBD', aName = a.name || 'TBD';
            const hc = getTeamColor(h.real ? hName : (koSlotCandidates(hName,_koStandings)?.current || hName));
            const ac2 = getTeamColor(a.real ? aName : (koSlotCandidates(aName,_koStandings)?.current || aName));
            const isLive = ev.status === 'LIVE', isFT = ev.status === 'FT';
            const isMyKO = APP.teamName && (hName === APP.teamName || aName === APP.teamName);
            const timeStr = ev.date ? timeFmt.format(new Date(ev.date)) : '';
            const roundLbl = roundLabel[ev.round] || ev.round || '';
            const flagH = _koFlagOrSlot(h);
            const flagA = _koFlagOrSlot(a);
            const hDisplayName = _koDisplayName(h);
            const aDisplayName = _koDisplayName(a);
            const vsHTML = (isFT || isLive) && h.score >= 0
              ? `${isLive ? `<div style="display:inline-flex;align-items:center;gap:3px;background:rgba(239,68,68,0.18);border:1px solid rgba(239,68,68,0.5);border-radius:8px;padding:1px 6px;margin-bottom:3px"><span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#ef4444;animation:livePulse 1s ease-in-out infinite"></span><span style="font-size:0.55rem;color:#ef4444;font-weight:800;letter-spacing:0.8px">LIVE</span></div>` : ''}
                 <div style="font-size:1.3rem;font-weight:900;color:#fff;letter-spacing:1px;line-height:1.1">${h.score}–${a.score}</div>
                 <div style="font-size:0.58rem;color:${isLive?'#f87171':'rgba(255,255,255,0.3)'};margin-top:1px">${isLive?(ev.clock||''):'FT'}</div>`
              : `<div style="font-size:1rem;font-weight:900;color:rgba(255,255,255,0.2);letter-spacing:2px">VS</div>`;
            const predHTML = (h.real && a.real && !isFT)
              ? `<div style="border-top:1px solid rgba(255,255,255,0.06);padding:0.65rem 0.75rem 0.5rem">
                   <div style="display:flex;gap:0.4rem">
                     <button onclick="predict('ko-${ev.espnId||ev.date}','${hName.replace(/'/g,"\\'")}');event.stopPropagation()" id="pred-ko-${ev.espnId||ev.date}-home"
                       style="flex:1;padding:0.45rem 0.25rem;border-radius:10px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.8);cursor:pointer;font-size:0.72rem;font-weight:600">${hName}</button>
                     <button onclick="predict('ko-${ev.espnId||ev.date}','${aName.replace(/'/g,"\\'")}');event.stopPropagation()" id="pred-ko-${ev.espnId||ev.date}-away"
                       style="flex:1;padding:0.45rem 0.25rem;border-radius:10px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.8);cursor:pointer;font-size:0.72rem;font-weight:600">${aName}</button>
                   </div>
                 </div>`
              : '';
            const detailBtn = ev.espnId
              ? `<div style="text-align:center;padding:0 1rem 0.7rem"><span style="display:inline-block;font-size:0.68rem;font-weight:700;color:#fff;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);border-radius:14px;padding:0.32rem 0.85rem">👆 Tap for line-ups, stats &amp; summary</span></div>`
              : '';
            html += `
            <div style="${glass};margin-bottom:0.75rem;overflow:hidden;position:relative;${isMyKO?'border-color:'+accentColor+'66;box-shadow:0 0 24px '+accentColor+'22':'border-color:rgba(167,139,250,0.2)'}">
              <div style="height:3px;background:linear-gradient(90deg,${hc} 0%,${hc} 50%,${ac2} 50%,${ac2} 100%);opacity:0.85"></div>
              ${ev.espnId && !isFT ? `<button onclick="addToCalendarKO('${ev.espnId}');event.stopPropagation()" title="Add to calendar" style="position:absolute;top:0.5rem;right:0.5rem;z-index:3;width:30px;height:30px;border-radius:10px;background:rgba(240,165,0,0.12);border:1px solid rgba(240,165,0,0.35);cursor:pointer;font-size:0.9rem;display:flex;align-items:center;justify-content:center">🗓️</button>` : ''}
              <div onclick="${ev.espnId?`openKOMatchDetail('${ev.espnId}')`:''}" style="cursor:${ev.espnId?'pointer':'default'}">
                <div style="text-align:center;padding:0.6rem 1rem 0;display:flex;align-items:center;justify-content:center;gap:0.5rem">
                  <span style="font-size:0.72rem;font-weight:600;color:#a78bfa;letter-spacing:0.3px">${roundLbl}</span>
                  <span style="color:rgba(255,255,255,0.25);font-size:0.65rem">•</span>
                  <span style="font-size:0.72rem;font-weight:600;color:#a78bfa;letter-spacing:0.3px">${timeStr} IST</span>
                </div>
                <div style="display:flex;align-items:center;justify-content:space-between;padding:0.9rem 1rem 0.5rem">
                  <div style="text-align:center;flex:1">
                    ${flagH}
                    <div style="font-size:0.85rem;color:${hName===APP.teamName?accentColor:'#fff'};margin-top:0.4rem;font-weight:${hName===APP.teamName?'700':'600'}">${hDisplayName}</div>
                  </div>
                  <div style="text-align:center;padding:0 0.5rem;min-width:56px">${vsHTML}</div>
                  <div style="text-align:center;flex:1">
                    ${flagA}
                    <div style="font-size:0.85rem;color:${aName===APP.teamName?accentColor:'#fff'};margin-top:0.4rem;font-weight:${aName===APP.teamName?'700':'600'}">${aDisplayName}</div>
                  </div>
                </div>
                ${ev.venue ? `<div style="font-size:0.72rem;color:rgba(255,255,255,0.5);text-align:center;padding:0 1rem 0.3rem">${ev.venue}</div>` : ''}
                ${detailBtn}
              </div>
              ${predHTML}
            </div>`;
          }
        }
        section.innerHTML = html;
        // Page scroll to today — fires here (after KO headers are in DOM) so it always works
        // regardless of network speed. Never touches tlEl.scrollTop (that breaks date taps).
        requestAnimationFrame(() => {
          const todayIST = new Date(Date.now() + 5.5*60*60*1000).toISOString().slice(0,10);
          const activeDate = allTlDates.find(d => d >= todayIST) || allTlDates[allTlDates.length - 1];
          if (!activeDate) return;
          const headerEl = document.querySelector(`[data-date-header="${activeDate}"]`);
          const headerH = document.getElementById('gol-header')?.getBoundingClientRect().height || 72;
          if (headerEl) {
            window.scrollTo({ top: headerEl.getBoundingClientRect().top + window.scrollY - headerH - 8 });
          }
          updateTimelineActive();
        });
        // Restore saved KO predictions
        Object.values(koData).forEach(list => list.forEach(ev => {
          const matchId = 'ko-' + (ev.espnId || ev.date);
          const saved = localStorage.getItem('pred_' + matchId);
          if (saved) highlightPrediction(matchId, saved);
        }));
      } catch(e) { /* silently skip */ }
    })();

  } else if (tab === 'groups') {
    buildStandingsTab(content, glass);

  } else if (tab === 'knockout') {
    buildKnockoutTab(content, glass);

  } else if (tab === 'rankings') {
    // Live FIFA rankings (synced to Firebase by the weekly GitHub Action),
    // falling back to this built-in snapshot if the live data isn't present.
    const FIFA_RANKINGS_FALLBACK = [
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

    const liveRanks = window.LIVE && window.LIVE.rankings;
    const FIFA_RANKINGS = (Array.isArray(liveRanks) && liveRanks.length >= 40)
      ? liveRanks : FIFA_RANKINGS_FALLBACK;

    // Label: use the FIFA update date from the live sync if we have it
    const meta = window.LIVE && window.LIVE.rankingsMeta;
    let rankDate = 'June 2026';
    if (meta && meta.updated) {
      const d = new Date(meta.updated);
      if (!isNaN(d)) rankDate = d.toLocaleDateString('en-GB', { month:'long', year:'numeric' });
    }

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
          ${r.points ? `<div style="font-size:0.72rem;font-weight:700;color:${isUser ? accentColor : 'rgba(255,255,255,0.3)'};min-width:44px;text-align:right">${Math.round(r.points)} pts</div>` : ''}
          ${!APP.teamName ? `<button onclick="selectTeam('${r.name}','${getTeamColor(r.name)}')" style="background:rgba(240,165,0,0.15);border:1px solid rgba(240,165,0,0.35);border-radius:12px;color:#f0a500;font-size:0.7rem;padding:0.25rem 0.6rem;cursor:pointer;white-space:nowrap">Pick ⚽</button>` : ''}
        </div>
      `;
    };

    content.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.75rem;gap:0.75rem">
        <div style="color:rgba(255,255,255,0.4);font-size:0.8rem;text-transform:uppercase;letter-spacing:1px">FIFA Rankings • ${rankDate}</div>
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
          <div style="color:rgba(255,255,255,0.3);font-size:0.75rem;margin-top:0.25rem">FIFA World Ranking • ${rankDate}</div>
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
        icon:'📱', name:'ZEE5', badge:'OFFICIAL', badgeColor:'#a78bfa',
        color:'#a78bfa', desc:'Official streaming partner — all FIFA WC 2026 matches',
        sub:'zee5.com · Download ZEE5 app', url:'https://www.zee5.com/sports',
        highlight: true,
      },
      {
        icon:'📺', name:'Zee Network (TV)', badge:'TV', badgeColor:'#f0a500',
        color:'#f0a500', desc:'Live TV broadcast on Zee channels — cable & DTH',
        sub:'Check your cable / DTH provider for Zee channels', url: null,
      },
      {
        icon:'🆓', name:'DD Sports', badge:'FREE TV', badgeColor:'#4ade80',
        color:'#4cc9f0', desc:'Free-to-air broadcast — no subscription needed',
        sub:'DD Free Dish · Channel 64', url:'https://www.ddindia.gov.in',
      },
    ];
    content.innerHTML = `
      <div style="margin-bottom:1rem">
        <div style="font-size:1.1rem;font-weight:700;color:#fff">📺 Where to Watch in India</div>
        <div style="font-size:0.72rem;color:rgba(255,255,255,0.35);margin-top:0.25rem">All FIFA WC 2026 matches · Official broadcasters only</div>
      </div>
      ${watchItems.map(w => `
        <div style="${glass};padding:1.25rem;margin-bottom:0.75rem;${w.highlight ? 'border-color:#a78bfa33;box-shadow:0 0 24px #a78bfa11' : ''}">
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
          ℹ️ ZEE5 holds official FIFA World Cup 2026 streaming rights for India (2026–2034).<br>
          DD Sports carries free-to-air coverage as required by Indian broadcasting law.
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
      <div style="${glass};padding:1.25rem;margin-top:0.75rem;display:flex;align-items:center;gap:1rem;border-color:rgba(37,211,102,0.3)">
        <div style="font-size:2rem">📩</div>
        <div>
          <div style="font-size:1.1rem;font-weight:700;color:#25D366">Contact Us</div>
          <div style="color:rgba(255,255,255,0.6);font-size:0.85rem;margin-top:0.2rem">Suggestions, feedback or feature requests?</div>
          <a href="https://wa.me/919995992458" target="_blank" rel="noopener" style="display:inline-block;margin-top:0.5rem;padding:0.4rem 1.25rem;background:#25D366;border-radius:20px;color:#000;font-weight:700;font-size:0.85rem;text-decoration:none">Message on WhatsApp</a>
        </div>
      </div>
    `;

  } else if (tab === 'stats') {
    const accent = APP.teamColor || '#f0a500';
    const card = (label, id, icon, color) => `
      <div style="${glass};padding:1.1rem 1.25rem;margin-bottom:0.75rem;display:flex;align-items:center;gap:1rem">
        <div style="font-size:1.8rem;filter:drop-shadow(0 0 8px ${color}66)">${icon}</div>
        <div style="flex:1">
          <div id="${id}" style="font-size:1.6rem;font-weight:900;color:${color};line-height:1.1">—</div>
          <div style="font-size:0.75rem;color:rgba(255,255,255,0.5);margin-top:0.1rem">${label}</div>
        </div>
      </div>`;

    content.innerHTML = `
      <div style="margin-bottom:1rem">
        <div style="font-size:1.1rem;font-weight:700;color:#fff">📊 Live Stats</div>
        <div style="font-size:0.72rem;color:rgba(255,255,255,0.35);margin-top:0.25rem">Real-time numbers across all Gol! fans</div>
      </div>
      ${card('Online now', 'stat-online', '🟢', '#4ade80')}
      ${card('Total fans', 'stat-users', '👥', accent)}
      ${card('Predictions made', 'stat-votes', '⚽', '#4cc9f0')}
      <div style="${glass};padding:1.1rem 1.25rem;margin-bottom:0.75rem">
        <div style="font-size:0.75rem;color:rgba(255,255,255,0.5);margin-bottom:0.4rem">🔥 Most-predicted match</div>
        <div id="stat-topmatch" style="font-size:0.95rem;font-weight:700;color:#fff">—</div>
      </div>
      <div style="font-size:0.65rem;color:rgba(255,255,255,0.25);text-align:center;margin-top:0.5rem">Updates live as fans use the app</div>
    `;

    // Wire up live data (helpers attach their own Firebase listeners).
    const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

    if (typeof getOnlineCount === 'function')
      getOnlineCount(n => setText('stat-online', n.toLocaleString()));

    if (typeof getTotalUsers === 'function')
      getTotalUsers(n => setText('stat-users', n.toLocaleString()));

    if (typeof getOverallStats === 'function')
      getOverallStats(({ totalVotes, topMatchId }) => {
        setText('stat-votes', totalVotes.toLocaleString());
        const el = document.getElementById('stat-topmatch');
        if (!el) return;
        const m = MATCHES.find(x => x.id === topMatchId);
        el.textContent = m ? `${m.home} vs ${m.away}` : 'No predictions yet';
      });
  }
}

// Build a Google Calendar "add event" link for a match. Times are IST and we
// pass ctz=Asia/Kolkata so Google places it correctly in each user's calendar.
function gcalUrl(m) {
  const pad = n => String(n).padStart(2, '0');
  const [hh, mm] = m.time.split(':').map(Number);
  const start = `${m.date.replace(/-/g, '')}T${pad(hh)}${pad(mm)}00`;
  // End +2h; roll over to the next day if it crosses midnight.
  let eh = hh + 2, endDate = m.date;
  if (eh >= 24) {
    eh -= 24;
    const d = new Date(m.date + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    // Use local date parts (not toISOString, which shifts to UTC and can roll
    // the date back a day depending on the viewer's timezone).
    endDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
  const end = `${endDate.replace(/-/g, '')}T${pad(eh)}${pad(mm)}00`;
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${m.home} vs ${m.away} — FIFA World Cup 2026`,
    dates: `${start}/${end}`,
    ctz: 'Asia/Kolkata',
    details: `Group ${m.group} · Watch on ZEE5 / DD Sports · via Gol! (getgol.in)`,
    location: m.venue || '',
  });
  return 'https://calendar.google.com/calendar/render?' + params.toString();
}

function addToCalendar(matchId) {
  const m = MATCHES.find(x => x.id === matchId);
  if (m) window.open(gcalUrl(m), '_blank', 'noopener');
}

function addToCalendarKO(espnId) {
  if (!window._koData) return;
  let ev = null, round = null;
  for (const [r, list] of Object.entries(window._koData)) {
    const found = list.find(e => String(e.espnId) === String(espnId));
    if (found) { ev = found; round = r; break; }
  }
  if (!ev || !ev.date) return;
  const pad = n => String(n).padStart(2, '0');
  const ist = new Date(new Date(ev.date).getTime() + 5.5 * 60 * 60 * 1000);
  const ds = `${ist.getFullYear()}${pad(ist.getMonth()+1)}${pad(ist.getDate())}`;
  const hh = ist.getHours(), mm = ist.getMinutes();
  let eh = hh + 2, eds = ds;
  if (eh >= 24) {
    eh -= 24;
    const nd = new Date(ist.getTime() + 86400000);
    eds = `${nd.getFullYear()}${pad(nd.getMonth()+1)}${pad(nd.getDate())}`;
  }
  const KO_LBL = {'round-of-32':'Round of 32','round-of-16':'Round of 16','quarterfinals':'Quarter-finals','semifinals':'Semi-finals','3rd-place-match':'Third Place','final':'THE FINAL'};
  const lbl = KO_LBL[round] || 'Knockout';
  const h = ev.home.real ? ev.home.name : 'TBD';
  const a = ev.away.real ? ev.away.name : 'TBD';
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${h} vs ${a} — FIFA WC 2026 ${lbl}`,
    dates: `${ds}T${pad(hh)}${pad(mm)}00/${eds}T${pad(eh)}${pad(mm)}00`,
    ctz: 'Asia/Kolkata',
    details: `${lbl} · Watch on ZEE5 / DD Sports · via Gol! (getgol.in)`,
    location: ev.venue || '',
  });
  window.open('https://calendar.google.com/calendar/render?' + params.toString(), '_blank', 'noopener');
}

function dismissCalHint() {
  localStorage.setItem('gol_cal_hint', '1');
  const el = document.getElementById('cal-hint');
  if (el) el.remove();
}

function predict(matchId, pick) {
  savePrediction(matchId, pick);
  highlightPrediction(matchId, pick);
}

function highlightPrediction(matchId, pick) {
  const color = APP.teamColor || '#f0a500';
  let homePick, awayPick;

  if (String(matchId).startsWith('ko-')) {
    const key = String(matchId).replace('ko-', '');
    let koEv = null;
    if (window._koData) {
      for (const list of Object.values(window._koData)) {
        const found = list.find(e => String(e.espnId) === key || e.date === key);
        if (found) { koEv = found; break; }
      }
    }
    if (!koEv) return;
    homePick = koEv.home.name;
    awayPick = koEv.away.name;
  } else {
    const m = MATCHES.find(x => String(x.id) === String(matchId));
    if (!m) return;
    homePick = m.home;
    awayPick = m.away;
  }

  const homeBtn = document.getElementById('pred-'+matchId+'-home');
  const drawBtn = document.getElementById('pred-'+matchId+'-draw');
  const awayBtn = document.getElementById('pred-'+matchId+'-away');
  if (!homeBtn) return;
  [homeBtn, drawBtn, awayBtn].filter(Boolean).forEach(b => {
    b.style.borderColor = 'rgba(255,255,255,0.1)';
    b.style.background = 'rgba(255,255,255,0.05)';
    b.style.boxShadow = 'none';
  });
  if (pick === homePick) {
    homeBtn.style.borderColor = color;
    homeBtn.style.background = color + '33';
    homeBtn.style.boxShadow = '0 0 20px ' + color + '44';
  } else if (pick === 'draw') {
    if (drawBtn) { drawBtn.style.borderColor = 'rgba(255,255,255,0.4)'; drawBtn.style.background = 'rgba(255,255,255,0.15)'; }
  } else if (pick === awayPick) {
    awayBtn.style.borderColor = color;
    awayBtn.style.background = color + '33';
    awayBtn.style.boxShadow = '0 0 20px ' + color + '44';
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
  APP.team = null; APP.teamName = null; APP.teamColor = null;
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

  // Standard group-stage ranking: points, then goal difference, then goals scored.
  const byRank = (a, b) =>
    b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf;

  // Build standings: prefer live data, fill missing teams with 0s
  const standings = {};
  groups.forEach(g => {
    if (liveData && liveData[g] && liveData[g].length) {
      // Fill any missing teams (ESPN might omit teams with 0 played)
      const liveNames = liveData[g].map(r => r.name);
      const allTeams = [...groupTeams[g]];
      const missing = allTeams.filter(t => !liveNames.includes(t))
        .map(t => ({name:t, p:0, w:0, d:0, l:0, gf:0, ga:0, pts:0}));
      standings[g] = [...liveData[g], ...missing].sort(byRank);
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
      standings[g] = Object.values(table).sort(byRank);
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
              const maybe = i === 2 && playedAny;
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

// ── Knockout bracket — pulled live from ESPN (auto-fills as groups finish) ────
const KO_ROUND_ORDER = ['round-of-32', 'round-of-16', 'quarterfinals', 'semifinals', '3rd-place-match', 'final'];
const KO_ROUND_LABEL = {
  'round-of-32': 'Round of 32', 'round-of-16': 'Round of 16',
  'quarterfinals': 'Quarter-finals', 'semifinals': 'Semi-finals',
  '3rd-place-match': 'Third place', 'final': 'Final',
};

async function fetchKnockout() {
  try {
    const norm = (typeof normName === 'function') ? normName : (x => x);
    const res = await fetch(`${ESPN_SCOREBOARD}?dates=20260628-20260719`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    const rounds = {};
    (data.events || []).forEach(ev => {
      const c = ev.competitions?.[0];
      if (!c) return;
      const round = ev.season?.slug || '';   // 'round-of-32' | 'round-of-16' | … | 'final'
      if (!KO_ROUND_LABEL[round]) return;
      const h = c.competitors?.find(x => x.homeAway === 'home') || c.competitors?.[0];
      const a = c.competitors?.find(x => x.homeAway === 'away') || c.competitors?.[1];
      const type = ev.status?.type || {};
      const state = type.state || 'pre';
      const status = (type.completed === true || state === 'post') ? 'FT' : (state === 'in' ? 'LIVE' : 'SCHEDULED');
      const slot = (cmp) => {
        const name = norm(cmp?.team?.displayName || '');
        const code = (typeof getCountryCode === 'function') ? getCountryCode(name) : 'un';
        return { name, code, real: code !== 'un', score: parseInt(cmp?.score ?? '-1') };
      };
      (rounds[round] = rounds[round] || []).push({
        date: ev.date, status, espnId: ev.id,
        clock: type.shortDetail || ev.status?.displayClock || '',
        venue: c.venue?.fullName || c.venue?.shortName || '',
        home: slot(h), away: slot(a),
      });
    });
    Object.values(rounds).forEach(list => list.sort((x, y) => new Date(x.date) - new Date(y.date)));
    return Object.keys(rounds).length ? rounds : null;
  } catch (e) { return null; }
}

// Resolve a knockout placeholder ("Group A Winner", "Third Place Group A/B/C/D/F")
// to the teams that could currently fill it, using live group standings.
function koSlotCandidates(name, standings) {
  if (!name || name === 'TBD' || name === '') return null;
  let m;
  if ((m = name.match(/^Group ([A-L]) Winner$/i))) {
    const rows = standings[m[1].toUpperCase()] || [];
    return { current: rows[0]?.name || null, list: rows.map(r => r.name) };
  }
  if ((m = name.match(/^Group ([A-L]) (?:2nd|Runner)/i))) {
    const rows = standings[m[1].toUpperCase()] || [];
    return { current: rows[1]?.name || null, list: rows.map(r => r.name) };
  }
  if ((m = name.match(/Third Place Group ([A-L/]+)/i))) {
    const list = m[1].split('/').map(s => (standings[s.trim().toUpperCase()] || [])[2]?.name).filter(Boolean);
    return { current: null, list };
  }
  return null;
}

// ── Knockout List View ────────────────────────────────────────────────────────
function renderKnockoutList(rounds, glass, accent) {
  const istFmt = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false });
  const standings = (window.LIVE && window.LIVE.getStandings) ? window.LIVE.getStandings() : {};
  const code = (n) => (typeof getCountryCode === 'function') ? getCountryCode(n) : 'un';
  const miniFlag = (n) => `<img src="https://flagcdn.com/16x12/${code(n)}.png" title="${n}" style="border-radius:1px;flex-shrink:0;opacity:0.65" onerror="this.style.display='none'">`;

  const slotHTML = (t, align) => {
    const right = align === 'right';
    if (t.real) {
      const flag = `<img src="https://flagcdn.com/24x18/${t.code}.png" style="border-radius:2px;flex-shrink:0" onerror="this.style.display='none'">`;
      const nm = `<span style="font-size:0.8rem;color:#fff;font-weight:600">${t.name}</span>`;
      return `<div style="flex:1;display:flex;align-items:center;gap:0.4rem;${right ? 'justify-content:flex-end;text-align:right' : ''}">${right ? nm + flag : flag + nm}</div>`;
    }
    const cand = koSlotCandidates(t.name, standings);
    let mainHTML, strip = [];
    if (cand && cand.list.length) {
      if (cand.current) {
        const f = `<img src="https://flagcdn.com/24x18/${code(cand.current)}.png" style="border-radius:2px;flex-shrink:0" onerror="this.style.display='none'">`;
        const n = `<span style="font-size:0.78rem;color:rgba(255,255,255,0.92);font-weight:600">${cand.current}</span>`;
        mainHTML = `<div style="display:flex;align-items:center;gap:0.35rem">${right ? n + f : f + n}</div>`;
        strip = cand.list.filter(x => x !== cand.current);
      } else {
        mainHTML = `<span style="font-size:0.62rem;color:rgba(255,255,255,0.45);font-style:italic">${t.name}</span>`;
        strip = cand.list;
      }
    } else {
      mainHTML = `<span style="font-size:0.64rem;color:rgba(255,255,255,0.4);font-style:italic">${t.name || 'TBD'}</span>`;
    }
    const stripHTML = strip.length
      ? `<div style="display:flex;gap:2px;flex-wrap:wrap;max-width:118px;${right ? 'justify-content:flex-end' : ''}">${strip.map(miniFlag).join('')}</div>`
      : '';
    return `<div style="flex:1;display:flex;flex-direction:column;gap:3px;align-items:${right ? 'flex-end' : 'flex-start'}">${mainHTML}${stripHTML}</div>`;
  };

  const timeFmtKO = new Intl.DateTimeFormat('en-IN', { timeZone:'Asia/Kolkata', hour:'2-digit', minute:'2-digit', hour12:false });
  const matchRow = (ev, roundKey) => {
    const h = ev.home, a = ev.away;
    const hName = h.name || 'TBD', aName = a.name || 'TBD';
    const hc = (typeof getTeamColor === 'function') ? getTeamColor(hName) : accent;
    const ac2 = (typeof getTeamColor === 'function') ? getTeamColor(aName) : accent;
    const isLive = ev.status === 'LIVE', isFT = ev.status === 'FT';
    const isMyKO = APP.teamName && (hName === APP.teamName || aName === APP.teamName);
    const timeStr = ev.date ? timeFmtKO.format(new Date(ev.date)) + ' IST' : '';
    const roundLbl = KO_ROUND_LABEL[roundKey] || roundKey || '';

    const flagOrSlot = (t, side) => {
      if (t.real) {
        return `<img src="https://flagcdn.com/48x36/${t.code}.png" width="48" height="36" style="border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,0.4)" onerror="this.style.display='none'">`;
      }
      const cand = koSlotCandidates(t.name, standings);
      if (cand && cand.current) {
        const cc = (typeof getCountryCode === 'function') ? getCountryCode(cand.current) : 'un';
        return `<img src="https://flagcdn.com/48x36/${cc}.png" width="48" height="36" style="border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,0.4);opacity:0.7" onerror="this.style.display='none'">`;
      }
      return `<div style="width:48px;height:36px;border-radius:6px;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);display:flex;align-items:center;justify-content:center;font-size:1.1rem">🛡️</div>`;
    };

    const displayName = (t) => {
      if (t.real) return t.name;
      const cand = koSlotCandidates(t.name, standings);
      if (cand && cand.current) return `<span style="opacity:0.75">${cand.current}</span>`;
      return `<span style="font-size:0.7rem;color:rgba(255,255,255,0.4);font-style:italic">${t.name || 'TBD'}</span>`;
    };

    const vsHTML = (isFT || isLive) && h.score >= 0
      ? `${isLive ? `<div style="display:inline-flex;align-items:center;gap:3px;background:rgba(239,68,68,0.18);border:1px solid rgba(239,68,68,0.5);border-radius:8px;padding:1px 6px;margin-bottom:3px"><span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#ef4444;animation:livePulse 1s ease-in-out infinite"></span><span style="font-size:0.55rem;color:#ef4444;font-weight:800;letter-spacing:0.8px">LIVE</span></div>` : ''}
         <div style="font-size:1.3rem;font-weight:900;color:#fff;letter-spacing:1px;line-height:1.1">${h.score}–${a.score}</div>
         <div style="font-size:0.58rem;color:${isLive ? '#f87171' : 'rgba(255,255,255,0.3)'};margin-top:1px">${isLive ? (ev.clock || '') : 'FT'}</div>`
      : `<div style="font-size:1rem;font-weight:900;color:rgba(255,255,255,0.2);letter-spacing:2px">VS</div>`;

    const predHTML = (h.real && a.real && !isFT)
      ? `<div style="border-top:1px solid rgba(255,255,255,0.06);padding:0.65rem 0.75rem 0.5rem">
           <div style="display:flex;gap:0.4rem">
             <button onclick="predict('ko-${ev.espnId||ev.date}','${hName.replace(/'/g,"\\'")}');event.stopPropagation()" id="pred-ko-${ev.espnId||ev.date}-home" style="flex:1;padding:0.45rem 0.25rem;border-radius:10px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.8);cursor:pointer;font-size:0.72rem;font-weight:600">${hName}</button>
             <button onclick="predict('ko-${ev.espnId||ev.date}','${aName.replace(/'/g,"\\'")}');event.stopPropagation()" id="pred-ko-${ev.espnId||ev.date}-away" style="flex:1;padding:0.45rem 0.25rem;border-radius:10px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.8);cursor:pointer;font-size:0.72rem;font-weight:600">${aName}</button>
           </div>
         </div>`
      : '';

    const detailBtn = ev.espnId
      ? `<div style="text-align:center;padding:0 1rem 0.7rem"><span style="display:inline-block;font-size:0.68rem;font-weight:700;color:#fff;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);border-radius:14px;padding:0.32rem 0.85rem">👆 Tap for line-ups, stats &amp; summary</span></div>`
      : '';

    return `
      <div style="${glass};margin-bottom:0.75rem;overflow:hidden;position:relative;${isMyKO ? 'border-color:'+accent+'66;box-shadow:0 0 24px '+accent+'22' : 'border-color:rgba(167,139,250,0.2)'}">
        <div style="height:3px;background:linear-gradient(90deg,${hc} 0%,${hc} 50%,${ac2} 50%,${ac2} 100%);opacity:0.85"></div>
        ${ev.espnId && !isFT ? `<button onclick="addToCalendarKO('${ev.espnId}');event.stopPropagation()" title="Add to calendar" style="position:absolute;top:0.5rem;right:0.5rem;z-index:3;width:30px;height:30px;border-radius:10px;background:rgba(240,165,0,0.12);border:1px solid rgba(240,165,0,0.35);cursor:pointer;font-size:0.9rem;display:flex;align-items:center;justify-content:center">🗓️</button>` : ''}
        <div onclick="${ev.espnId ? `openKOMatchDetail('${ev.espnId}')` : ''}" style="cursor:${ev.espnId ? 'pointer' : 'default'}">
          <div style="text-align:center;padding:0.6rem 1rem 0;display:flex;align-items:center;justify-content:center;gap:0.5rem">
            <span style="font-size:0.72rem;font-weight:600;color:#a78bfa">${roundLbl}</span>
            <span style="color:rgba(255,255,255,0.25);font-size:0.65rem">•</span>
            <span style="font-size:0.72rem;font-weight:600;color:#a78bfa">${timeStr}</span>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;padding:0.9rem 1rem 0.5rem">
            <div style="text-align:center;flex:1">
              ${flagOrSlot(h, 'left')}
              <div style="font-size:0.85rem;color:${hName===APP.teamName?accent:'#fff'};margin-top:0.4rem;font-weight:${hName===APP.teamName?'700':'600'}">${displayName(h)}</div>
            </div>
            <div style="text-align:center;padding:0 0.5rem;min-width:56px">${vsHTML}</div>
            <div style="text-align:center;flex:1">
              ${flagOrSlot(a, 'right')}
              <div style="font-size:0.85rem;color:${aName===APP.teamName?accent:'#fff'};margin-top:0.4rem;font-weight:${aName===APP.teamName?'700':'600'}">${displayName(a)}</div>
            </div>
          </div>
          ${ev.venue ? `<div style="font-size:0.72rem;color:rgba(255,255,255,0.5);text-align:center;padding:0 1rem 0.3rem">${ev.venue}</div>` : ''}
          ${detailBtn}
        </div>
        ${predHTML}
      </div>`;
  };

  const sections = KO_ROUND_ORDER.filter(r => rounds[r]).map(r => `
    <div style="margin:1.1rem 0 0.5rem;display:flex;align-items:center;gap:0.5rem">
      <div style="font-size:0.85rem;font-weight:800;color:${accent}">${r === 'final' ? '🏆 ' : ''}${KO_ROUND_LABEL[r]}</div>
      <div style="flex:1;height:1px;background:linear-gradient(90deg,${accent}44,transparent)"></div>
      <span style="font-size:0.6rem;color:rgba(255,255,255,0.3)">${rounds[r].length} match${rounds[r].length > 1 ? 'es' : ''}</span>
    </div>
    ${rounds[r].map(ev => matchRow(ev, r)).join('')}
  `).join('');

  return `
    <div style="margin-bottom:0.5rem">
      <div style="font-size:0.72rem;color:rgba(255,255,255,0.35)">Top 2 of each group + 8 best 3rd-placed teams advance · fills in live as groups finish</div>
    </div>
    ${sections}`;
}

// ── Knockout Bracket View ─────────────────────────────────────────────────────
function renderKnockoutBracket(rounds, accent) {
  const SLOT = 68;   // px per R32 slot
  const CARD = 56;   // match card height (includes date row)
  const N    = 8;    // R32 matches per side
  const H    = N * SLOT; // total column height = 544px

  const code = (n) => (typeof getCountryCode === 'function') ? getCountryCode(n) : 'un';
  const flagByCode = (iso) => iso && iso !== 'un'
    ? `<img src="https://flagcdn.com/16x12/${iso}.png" style="border-radius:1px;flex-shrink:0;width:16px;height:12px" onerror="this.style.display='none'">`
    : `<span style="width:16px;display:inline-block"></span>`;
  const istFmt = new Intl.DateTimeFormat('en-IN', {
    timeZone:'Asia/Kolkata', day:'numeric', month:'short', hour:'2-digit', minute:'2-digit', hour12:false,
  });

  const r32 = rounds['round-of-32'] || [];
  const r16 = rounds['round-of-16'] || [];
  const qf  = rounds['quarterfinals'] || [];
  const sf  = rounds['semifinals'] || [];
  const fin = (rounds['final'] || [])[0] || null;
  const trd = (rounds['3rd-place-match'] || [])[0] || null;

  // Match card — absolutely positioned within its slot
  const card = (m, slotH, isAccent) => {
    const top = Math.round((slotH - CARD) / 2);
    if (!m) return `<div style="position:absolute;top:${top}px;left:0;right:0;height:${CARD}px;border-radius:7px;border:1px dashed rgba(255,255,255,0.1);background:rgba(255,255,255,0.02)"></div>`;
    const ft = m.status === 'FT', live = m.status === 'LIVE';
    const hs = (ft||live) && m.home.score >= 0 ? m.home.score : null;
    const as = (ft||live) && m.away.score >= 0 ? m.away.score : null;
    const hn = m.home.real ? (m.home.name.length > 9 ? m.home.name.slice(0,8)+'…' : m.home.name) : 'TBD';
    const an = m.away.real ? (m.away.name.length > 9 ? m.away.name.slice(0,8)+'…' : m.away.name) : 'TBD';
    const hw = ft && hs !== null && as !== null && hs > as;
    const aw = ft && hs !== null && as !== null && as > hs;
    const bdr = live ? 'rgba(74,222,128,0.55)' : isAccent ? accent + '99' : 'rgba(255,255,255,0.18)';
    const glow = isAccent ? `box-shadow:0 0 14px ${accent}33;` : '';
    const dateStr = m.date ? istFmt.format(new Date(m.date)) + ' IST' : '';
    const row = (name, iso, real, sc, win) => `
      <div style="display:flex;align-items:center;gap:3px;padding:1px 5px;${win ? 'background:rgba(255,255,255,0.1);font-weight:700' : ''}">
        ${flagByCode(real ? iso : null)}
        <span style="flex:1;font-size:0.56rem;color:rgba(255,255,255,${real?'0.9':'0.32'});overflow:hidden;white-space:nowrap">${name}</span>
        ${sc !== null ? `<span style="font-size:0.6rem;font-weight:800;color:${live?'#4ade80':'#fff'}">${sc}</span>` : ''}
      </div>`;
    return `
      <div style="position:absolute;top:${top}px;left:0;right:0;height:${CARD}px;border-radius:7px;border:1px solid ${bdr};background:rgba(255,255,255,0.08);overflow:hidden;${glow}display:flex;flex-direction:column">
        <div style="font-size:0.42rem;text-align:center;padding:1px 2px;color:rgba(255,255,255,0.3);background:rgba(0,0,0,0.15);white-space:nowrap;overflow:hidden">${dateStr}</div>
        <div style="flex:1;display:flex;flex-direction:column;justify-content:space-around">
          ${row(hn, m.home.code, m.home.real, hs, hw)}
          <div style="height:1px;background:rgba(255,255,255,0.07)"></div>
          ${row(an, m.away.code, m.away.real, as, aw)}
        </div>
      </div>`;
  };

  // A round column: slotsPerMatch × SLOT tall per match, absolute-positioned
  const roundCol = (matches, slotsPerMatch, label, isAccent) => {
    const count = N / slotsPerMatch;
    const items = Array.from({length: count}, (_, i) => {
      const slotH = slotsPerMatch * SLOT;
      return `<div style="position:absolute;top:${i * slotH}px;left:0;right:0;height:${slotH}px">${card(matches[i] || null, slotH, isAccent)}</div>`;
    }).join('');
    return `
      <div style="flex-shrink:0;width:88px;display:flex;flex-direction:column">
        <div style="font-size:0.46rem;font-weight:800;letter-spacing:0.05em;text-align:center;padding:2px 0;color:${isAccent ? accent : 'rgba(255,255,255,0.38)'}">${label}</div>
        <div style="position:relative;height:${H}px">${items}</div>
      </div>`;
  };

  // Connector column — draws bracket arms between rounds
  // Each arm covers 2 × slotsPerMatch slots and joins two matches into one
  // side='right' → arm opens right (left half); side='left' → opens left (right half)
  const connCol = (slotsPerMatch, side) => {
    const armH = slotsPerMatch * 2 * SLOT;
    const numArms = H / armH;
    const br = side === 'right' ? 'border-right' : 'border-left';
    const LINE = '1px solid rgba(255,255,255,0.2)';
    const arms = Array.from({length: numArms}, (_, i) => `
      <div style="position:absolute;top:${i * armH}px;left:0;right:0;height:${armH}px;display:flex;flex-direction:column">
        <div style="flex:1;${br}:${LINE};border-bottom:${LINE}"></div>
        <div style="flex:1;${br}:${LINE};border-top:${LINE}"></div>
      </div>`).join('');
    return `
      <div style="flex-shrink:0;width:16px;display:flex;flex-direction:column">
        <div style="font-size:0.46rem;padding:2px 0;color:transparent">·</div>
        <div style="position:relative;height:${H}px">${arms}</div>
      </div>`;
  };

  const thirdHTML = trd ? (() => {
    const ft=trd.status==='FT', live=trd.status==='LIVE';
    const hs=(ft||live)&&trd.home.score>=0?trd.home.score:null;
    const as=(ft||live)&&trd.away.score>=0?trd.away.score:null;
    const hw=ft&&hs!==null&&as!==null&&hs>as, aw=ft&&hs!==null&&as!==null&&as>hs;
    const hn=trd.home.real?(trd.home.name.length>9?trd.home.name.slice(0,8)+'…':trd.home.name):'TBD';
    const an=trd.away.real?(trd.away.name.length>9?trd.away.name.slice(0,8)+'…':trd.away.name):'TBD';
    const dateStr=trd.date?istFmt.format(new Date(trd.date))+' IST':'';
    const row=(name,iso,real,sc,win)=>`<div style="display:flex;align-items:center;gap:3px;padding:2px 5px;${win?'background:rgba(255,255,255,0.1)':''}">
      ${flagByCode(real?iso:null)}<span style="flex:1;font-size:0.56rem;color:rgba(255,255,255,${real?'0.9':'0.3'});overflow:hidden;white-space:nowrap">${name}</span>
      ${sc!==null?`<span style="font-size:0.6rem;font-weight:800;color:#fff">${sc}</span>`:''}
    </div>`;
    return `<div style="margin-top:0.75rem;text-align:center">
      <div style="font-size:0.6rem;color:rgba(255,255,255,0.38);margin-bottom:4px">🥉 Third Place · ${dateStr}</div>
      <div style="max-width:200px;margin:0 auto;border-radius:7px;border:1px solid rgba(255,255,255,0.18);background:rgba(255,255,255,0.07);overflow:hidden;display:flex;flex-direction:column">
        <div style="height:1px;background:rgba(255,255,255,0.07);margin-top:${CARD*0.4}px"></div>
        ${row(hn,trd.home.code,trd.home.real,hs,hw)}
        <div style="height:1px;background:rgba(255,255,255,0.07)"></div>
        ${row(an,trd.away.code,trd.away.real,as,aw)}
      </div>
    </div>`;
  })() : '';

  // Assemble all columns — left half, final, right half
  const MIN_W = 88 * 9 + 16 * 8; // 792 + 128 = 920px
  const cols = [
    roundCol(r32.slice(0,8),  1, 'ROUND OF 32'),
    connCol(1, 'right'),
    roundCol(r16.slice(0,4),  2, 'ROUND OF 16'),
    connCol(2, 'right'),
    roundCol(qf.slice(0,2),   4, 'QUARTER-FINAL'),
    connCol(4, 'right'),
    roundCol(sf.slice(0,1),   8, 'SEMI-FINAL'),
    connCol(8, 'right'),
    roundCol(fin ? [fin] : [], 8, '🏆 FINAL', true),
    connCol(8, 'left'),
    roundCol(sf.slice(1,2),   8, 'SEMI-FINAL'),
    connCol(4, 'left'),
    roundCol(qf.slice(2,4),   4, 'QUARTER-FINAL'),
    connCol(2, 'left'),
    roundCol(r16.slice(4,8),  2, 'ROUND OF 16'),
    connCol(1, 'left'),
    roundCol(r32.slice(8),    1, 'ROUND OF 32'),
  ].join('');

  return `
    <div style="overflow-x:auto;-webkit-overflow-scrolling:touch;padding-bottom:4px;margin:0 -0.1rem">
      <div style="display:flex;min-width:${MIN_W}px">${cols}</div>
    </div>
    ${thirdHTML}`;
}

// ── Knockout dispatcher — adds view toggle, calls list or bracket ─────────────
function renderKnockout(content, glass, rounds) {
  const accent = APP.teamColor || '#f0a500';
  window._koView = window._koView || 'list';

  const toggle = (view) => `
    <button onclick="window._koView='${view}';window._koGlass&&renderKnockout(document.getElementById('tab-content'),window._koGlass,window._koData)"
      style="flex:1;padding:0.35rem;border:none;border-radius:16px;cursor:pointer;font-size:0.75rem;font-weight:700;
             background:${window._koView === view ? accent : 'transparent'};
             color:${window._koView === view ? '#000' : 'rgba(255,255,255,0.5)'}">
      ${view === 'list' ? '📋 List' : '🏆 Bracket'}
    </button>`;

  const viewHTML = window._koView === 'bracket'
    ? renderKnockoutBracket(rounds, accent)
    : renderKnockoutList(rounds, glass, accent);

  content.innerHTML = `
    <div style="margin-bottom:0.75rem">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.5rem">
        <div style="color:#fff;font-weight:700;font-size:1rem">🏆 Knockout Stage</div>
      </div>
      <div style="display:flex;gap:4px;background:rgba(255,255,255,0.05);border-radius:20px;padding:3px">
        ${toggle('list')}${toggle('bracket')}
      </div>
    </div>
    <div id="ko-view-content">${viewHTML}</div>`;

  window._koGlass = glass;

  // Restore saved KO predictions (mirrors the group-stage restore in showMatchesTab)
  if (window._koView === 'list') {
    Object.values(rounds).forEach(list => list.forEach(ev => {
      const matchId = 'ko-' + (ev.espnId || ev.date);
      const saved = localStorage.getItem('pred_' + matchId);
      if (saved) highlightPrediction(matchId, saved);
    }));
  }

  // Show one-time hint pointing to Bracket button
  if (window._koView === 'list' && !localStorage.getItem('gol-hint-bracket')) {
    setTimeout(() => {
      if (window._activeTab !== 'knockout') return;
      const toggleRow = content.querySelector('div[style*="display:flex"][style*="gap:4px"]');
      if (!toggleRow) return;
      const bracketBtn = toggleRow.querySelectorAll('button')[1];
      if (!bracketBtn) return;
      const rect = bracketBtn.getBoundingClientRect();
      const hint = document.createElement('div');
      hint.id = 'ko-bracket-hint';
      hint.style.cssText = `position:fixed;z-index:9999;pointer-events:auto;
        left:${rect.left + rect.width / 2}px;top:${rect.bottom + 10}px;
        transform:translateX(-50%);
        background:#f0a500;color:#000;
        font-size:11px;font-weight:700;
        padding:6px 10px 6px 8px;border-radius:8px;
        white-space:nowrap;
        box-shadow:0 4px 16px rgba(0,0,0,0.5);
        display:flex;align-items:center;gap:6px;cursor:pointer`;
      // Arrow pointing up
      const arrow = document.createElement('div');
      arrow.style.cssText = `position:absolute;top:-6px;left:50%;transform:translateX(-50%);
        width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;
        border-bottom:6px solid #f0a500`;
      hint.appendChild(arrow);
      hint.insertAdjacentHTML('beforeend', '👆 Try the Bracket view! &nbsp;<span style="opacity:0.6;font-weight:400">✕</span>');
      hint.onclick = () => { hint.remove(); localStorage.setItem('gol-hint-bracket', '1'); };
      document.body.appendChild(hint);
      // Auto-dismiss after 6 seconds
      setTimeout(() => { hint.remove(); localStorage.setItem('gol-hint-bracket', '1'); }, 6000);
    }, 400);
  }
}

function notifyKOFinished(prev, next) {
  if (typeof fireNotification !== 'function') return;
  if (typeof notifEnabled !== 'function' || !notifEnabled()) return;
  if (!prev) return;
  Object.values(next).forEach(list => list.forEach(ev => {
    if (ev.status !== 'FT' || !ev.espnId) return;
    let prevEv = null;
    for (const pl of Object.values(prev)) {
      prevEv = pl.find(p => p.espnId === ev.espnId);
      if (prevEv) break;
    }
    if (!prevEv || prevEv.status === 'FT') return;
    const hs = ev.home.score >= 0 ? ev.home.score : 0;
    const as = ev.away.score >= 0 ? ev.away.score : 0;
    fireNotification(
      `⏱️ Full Time · ${hs}–${as}`,
      `${ev.home.name} vs ${ev.away.name} — Tap to see match summary`,
      'ft-ko-' + ev.espnId,
      `/?match=ko-${ev.espnId}`
    );
  }));
}

function buildKnockoutTab(content, glass) {
  if (window._koData) renderKnockout(content, glass, window._koData);
  else content.innerHTML = `<div style="${glass};padding:2.5rem 1rem;text-align:center;color:rgba(255,255,255,0.5)">Loading knockout bracket…</div>`;

  fetchKnockout().then(rounds => {
    if (!rounds) {
      if (!window._koData && window._activeTab === 'knockout') {
        content.innerHTML = `<div style="${glass};padding:2.5rem 1rem;text-align:center;color:rgba(255,255,255,0.5)">Knockout bracket isn't available yet — check back near the end of the group stage.</div>`;
      }
      return;
    }
    notifyKOFinished(window._koData, rounds);
    window._koData = rounds;
    if (window._activeTab === 'knockout') renderKnockout(content, glass, rounds);
  });
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

