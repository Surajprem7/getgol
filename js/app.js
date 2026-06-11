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
  if (!APP.team) {
    showTeamPicker();
  } else {
    showApp();
  }
  registerSW();
});

function registerSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js');
  }
}

function showTeamPicker() {
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

  document.getElementById('app').innerHTML = `
    <div style="min-height:100vh;background:#0d0d1a;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:2rem">
      <div style="font-size:3rem">⚽</div>
      <h1 style="font-size:2.5rem;font-weight:900;color:#fff;margin-bottom:0.1rem">Gol!</h1>
      <p style="color:#aaa;margin-bottom:0.1rem">FIFA World Cup 2026</p>
      <p style="color:#f0a500;font-size:0.9rem;font-style:italic;margin-bottom:0.4rem">¡Pasion por el Gol!</p>
      <p style="color:#666;font-size:0.8rem;margin-bottom:2rem">48 teams • 12 groups • 104 matches</p>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:0.75rem;max-width:520px;width:100%">
        ${teams.map(t => `
          <button onclick="selectTeam('${t.name}','${t.color}')"
            style="background:#1a1a2e;border:2px solid #333;border-radius:12px;padding:0.75rem 0.5rem;cursor:pointer;color:#fff;font-size:0.65rem;text-align:center"
            onmouseover="this.style.borderColor='${t.color}'"
            onmouseout="this.style.borderColor='#333'">
            <img src="https://flagcdn.com/40x30/${getCountryCode(t.name)}.png" width="40" height="30" style="border-radius:3px;display:block;margin:0 auto" onerror="this.style.display='none'">
            <div style="margin-top:0.4rem;line-height:1.2">${t.name}</div>
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

function selectTeam(name, color) {
  APP.team = name;
  APP.teamName = name;
  APP.teamColor = color;
  localStorage.setItem('gol_team', name);
  localStorage.setItem('gol_team_name', name);
  localStorage.setItem('gol_team_color', color);
  showApp();
}

function showApp() {
  document.getElementById('app').innerHTML = `
    <div style="max-width:600px;margin:0 auto;padding:1rem">
      <header style="display:flex;align-items:center;justify-content:space-between;padding:1rem 0;border-bottom:2px solid ${APP.teamColor}">
        <div>
          <span style="font-size:1.5rem;font-weight:900;color:${APP.teamColor}">Gol!</span>
          <span style="color:#f0a500;font-size:0.7rem;font-style:italic;margin-left:0.4rem">¡Pasion por el Gol!</span>
        </div>
        <div style="display:flex;align-items:center;gap:0.5rem;color:#aaa;font-size:0.8rem;cursor:pointer" onclick="resetTeam()">
          <img src="https://flagcdn.com/24x18/${getCountryCode(APP.teamName)}.png" style="border-radius:2px" onerror="this.style.display='none'">
          ${APP.teamName} ✕
        </div>
      </header>
      <nav style="display:flex;gap:0.5rem;margin:1rem 0;overflow-x:auto">
        <button onclick="showTab('matches')" style="padding:0.5rem 1rem;border-radius:20px;border:none;background:${APP.teamColor};color:#000;font-weight:700;cursor:pointer;white-space:nowrap">Matches</button>
        <button onclick="showTab('predict')" style="padding:0.5rem 1rem;border-radius:20px;border:2px solid #333;background:transparent;color:#fff;cursor:pointer;white-space:nowrap">Predict</button>
        <button onclick="showTab('watch')" style="padding:0.5rem 1rem;border-radius:20px;border:2px solid #333;background:transparent;color:#fff;cursor:pointer;white-space:nowrap">Watch</button>
      </nav>
      <div id="tab-content"></div>
    </div>
  `;
  showTab('matches');
}

function showTab(tab) {
  const content = document.getElementById('tab-content');

  if (tab === 'matches') {
    const myMatches = getTeamMatches(APP.teamName);
    const otherMatches = MATCHES.filter(m => m.home !== APP.teamName && m.away !== APP.teamName);

    const renderMatch = (m, highlight) => `
      <div style="background:${highlight ? APP.teamColor+'22' : '#1a1a2e'};border:1px solid ${highlight ? APP.teamColor : '#333'};border-radius:12px;padding:1rem;margin-bottom:0.75rem">
        <div style="font-size:0.7rem;color:#aaa;margin-bottom:0.5rem">Group ${m.group} • ${formatIST(m.date, m.time)}</div>
        <div style="display:flex;align-items:center;justify-content:space-between">
          <div style="text-align:center;flex:1">
            <img src="https://flagcdn.com/40x30/${getCountryCode(m.home)}.png" width="40" height="30" style="border-radius:3px" onerror="this.style.display='none'">
            <div style="font-size:0.85rem;color:#fff;margin-top:0.25rem">${m.home}</div>
          </div>
          <div style="font-size:1.2rem;font-weight:900;color:#aaa;padding:0 1rem">VS</div>
          <div style="text-align:center;flex:1">
            <img src="https://flagcdn.com/40x30/${getCountryCode(m.away)}.png" width="40" height="30" style="border-radius:3px" onerror="this.style.display='none'">
            <div style="font-size:0.85rem;color:#fff;margin-top:0.25rem">${m.away}</div>
          </div>
        </div>
        <div style="font-size:0.7rem;color:#666;margin-top:0.5rem;text-align:center">${m.venue}</div>
      </div>
    `;

    content.innerHTML = `
      ${myMatches.length > 0 ? `
        <div style="color:${APP.teamColor};font-weight:700;margin-bottom:0.75rem">
          <img src="https://flagcdn.com/24x18/${getCountryCode(APP.teamName)}.png" style="border-radius:2px;vertical-align:middle;margin-right:4px" onerror="this.style.display='none'">
          ${APP.teamName} matches
        </div>
        ${myMatches.map(m => renderMatch(m, true)).join('')}
        <div style="color:#aaa;font-weight:700;margin:1rem 0 0.75rem">All other matches</div>
      ` : ''}
      ${otherMatches.map(m => renderMatch(m, false)).join('')}
    `;

  } else if (tab === 'predict') {
    content.innerHTML = `
      <div style="margin-bottom:1rem">
        <h2 style="color:#fff;margin-bottom:0.25rem">🎯 Predict & Win</h2>
        <p style="color:#aaa;font-size:0.85rem">Who will win these matches?</p>
      </div>
      ${MATCHES.map(m => `
        <div style="background:#1a1a2e;border:1px solid #333;border-radius:12px;padding:1rem;margin-bottom:0.75rem">
          <div style="font-size:0.7rem;color:#aaa;margin-bottom:0.75rem">Group ${m.group} • ${formatIST(m.date, m.time)}</div>
          <div style="display:flex;gap:0.5rem">
            <button onclick="predict(${m.id},'${m.home}')" id="pred-${m.id}-home"
              style="flex:1;padding:0.6rem;border-radius:8px;border:2px solid #333;background:#0d0d1a;color:#fff;cursor:pointer;font-size:0.75rem;text-align:center">
              <img src="https://flagcdn.com/32x24/${getCountryCode(m.home)}.png" style="border-radius:2px;display:block;margin:0 auto 4px" onerror="this.style.display='none'">
              ${m.home}
            </button>
            <button onclick="predict(${m.id},'draw')" id="pred-${m.id}-draw"
              style="padding:0.6rem;border-radius:8px;border:2px solid #333;background:#0d0d1a;color:#aaa;cursor:pointer;font-size:0.75rem">
              Draw
            </button>
            <button onclick="predict(${m.id},'${m.away}')" id="pred-${m.id}-away"
              style="flex:1;padding:0.6rem;border-radius:8px;border:2px solid #333;background:#0d0d1a;color:#fff;cursor:pointer;font-size:0.75rem;text-align:center">
              <img src="https://flagcdn.com/32x24/${getCountryCode(m.away)}.png" style="border-radius:2px;display:block;margin:0 auto 4px" onerror="this.style.display='none'">
              ${m.away}
            </button>
          </div>
        </div>
      `).join('')}
    `;
    MATCHES.forEach(m => {
      const saved = localStorage.getItem('pred_'+m.id);
      if (saved) highlightPrediction(m.id, saved);
    });

  } else if (tab === 'watch') {
    content.innerHTML = `
      <div style="padding:0.5rem 0">
        <h2 style="color:#fff;margin-bottom:1rem">📺 Where to Watch in India</h2>
        <div style="background:#1a1a2e;border-radius:12px;padding:1.25rem;margin-bottom:0.75rem;display:flex;align-items:center;gap:1rem">
          <div style="font-size:2rem">📱</div>
          <div>
            <div style="font-size:1.1rem;font-weight:700;color:#00b4d8">JioCinema</div>
            <div style="color:#aaa;font-size:0.85rem;margin-top:0.25rem">Free streaming online & app</div>
            <div style="color:#555;font-size:0.75rem">jiocinema.com</div>
          </div>
        </div>
        <div style="background:#1a1a2e;border-radius:12px;padding:1.25rem;margin-bottom:0.75rem;display:flex;align-items:center;gap:1rem">
          <div style="font-size:2rem">📺</div>
          <div>
            <div style="font-size:1.1rem;font-weight:700;color:#ff6b35">Sports18</div>
            <div style="color:#aaa;font-size:0.85rem;margin-top:0.25rem">TV broadcast on cable & DTH</div>
            <div style="color:#555;font-size:0.75rem">Check your cable provider</div>
          </div>
        </div>
        <div style="background:#1a1a2e;border-radius:12px;padding:1.25rem;margin-bottom:0.75rem;display:flex;align-items:center;gap:1rem">
          <div style="font-size:2rem">🆓</div>
          <div>
            <div style="font-size:1.1rem;font-weight:700;color:#4cc9f0">DD Sports</div>
            <div style="color:#aaa;font-size:0.85rem;margin-top:0.25rem">Free TV - no subscription needed</div>
            <div style="color:#555;font-size:0.75rem">DD Free Dish channel 64</div>
          </div>
        </div>
        <div style="background:#1a1a2e;border-radius:12px;padding:1.25rem;display:flex;align-items:center;gap:1rem">
          <div style="font-size:2rem">💬</div>
          <div>
            <div style="font-size:1.1rem;font-weight:700;color:#25D366">Share Gol!</div>
            <div style="color:#aaa;font-size:0.85rem;margin-top:0.25rem">Tell your friends about this app</div>
            <button onclick="shareApp()" style="margin-top:0.5rem;padding:0.4rem 1rem;background:#25D366;border:none;border-radius:8px;color:#000;font-weight:700;cursor:pointer;font-size:0.8rem">Share via WhatsApp</button>
          </div>
        </div>
      </div>
    `;
  }
}

function predict(matchId, pick) {
  localStorage.setItem('pred_'+matchId, pick);
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
    b.style.borderColor = '#333';
    b.style.background = '#0d0d1a';
  });
  if (pick === m.home) { homeBtn.style.borderColor = APP.teamColor; homeBtn.style.background = APP.teamColor+'33'; }
  else if (pick === 'draw') { drawBtn.style.borderColor = '#aaa'; drawBtn.style.background = '#ffffff22'; }
  else if (pick === m.away) { awayBtn.style.borderColor = APP.teamColor; awayBtn.style.background = APP.teamColor+'33'; }
}

function shareApp() {
  const text = `⚽ I'm using Gol! to follow FIFA World Cup 2026! Check it out: https://getgol.in`;
  window.open('https://wa.me/?text='+encodeURIComponent(text), '_blank');
}

function resetTeam() {
  localStorage.clear();
  location.reload();
}