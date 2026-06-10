// Gol! — Main App Logic

const APP = {
  team: localStorage.getItem('gol_team') || null,
  lang: localStorage.getItem('gol_lang') || 'en',
};

// Boot the app
document.addEventListener('DOMContentLoaded', () => {
  if (!APP.team) {
    showTeamPicker();
  } else {
    showApp();
  }
  registerSW();
});

// Register service worker
function registerSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js');
  }
}

// Show team picker on first launch
function showTeamPicker() {
  const teams = [
    {code:'ARG',name:'Argentina',color:'#74ACDF'},
    {code:'BRA',name:'Brazil',color:'#009C3B'},
    {code:'ENG',name:'England',color:'#CF111B'},
    {code:'FRA',name:'France',color:'#002395'},
    {code:'GER',name:'Germany',color:'#000000'},
    {code:'ESP',name:'Spain',color:'#AA151B'},
    {code:'POR',name:'Portugal',color:'#006600'},
    {code:'NED',name:'Netherlands',color:'#FF6600'},
    {code:'ITA',name:'Italy',color:'#003399'},
    {code:'BEL',name:'Belgium',color:'#EF3340'},
    {code:'CRO',name:'Croatia',color:'#FF0000'},
    {code:'URU',name:'Uruguay',color:'#5EB6E4'},
    {code:'MEX',name:'Mexico',color:'#006847'},
    {code:'USA',name:'USA',color:'#B22234'},
    {code:'CAN',name:'Canada',color:'#FF0000'},
    {code:'JAP',name:'Japan',color:'#BC002D'},
    {code:'KOR',name:'South Korea',color:'#003478'},
    {code:'MAR',name:'Morocco',color:'#C1272D'},
    {code:'SEN',name:'Senegal',color:'#00853F'},
    {code:'AUS',name:'Australia',color:'#FFCD00'},
    {code:'SUI',name:'Switzerland',color:'#FF0000'},
    {code:'DEN',name:'Denmark',color:'#C60C30'},
    {code:'POL',name:'Poland',color:'#DC143C'},
    {code:'ECU',name:'Ecuador',color:'#FFD100'},
    {code:'QAT',name:'Qatar',color:'#8D1B3D'},
    {code:'SAU',name:'Saudi Arabia',color:'#006C35'},
    {code:'GHA',name:'Ghana',color:'#006B3F'},
    {code:'CAM',name:'Cameroon',color:'#007A5E'},
    {code:'SRB',name:'Serbia',color:'#C6363C'},
    {code:'WAL',name:'Wales',color:'#C8102E'},
    {code:'IRN',name:'Iran',color:'#239F40'},
    {code:'TUN',name:'Tunisia',color:'#E70013'},
  ];

  document.getElementById('app').innerHTML = `
    <div style="min-height:100vh;background:#0d0d1a;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:2rem">
      <div style="font-size:3rem;margin-bottom:0.5rem">⚽</div>
      <h1 style="font-size:2rem;font-weight:900;color:#fff;margin-bottom:0.25rem">Gol!</h1>
      <p style="color:#aaa;margin-bottom:2rem">Pick your team to get started</p>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:0.75rem;max-width:480px;width:100%">
        ${teams.map(t => `
          <button onclick="selectTeam('${t.code}','${t.name}','${t.color}')"
            style="background:#1a1a2e;border:2px solid #333;border-radius:12px;padding:0.75rem 0.5rem;cursor:pointer;color:#fff;font-size:0.7rem;text-align:center;transition:all 0.2s"
            onmouseover="this.style.borderColor='${t.color}'"
            onmouseout="this.style.borderColor='#333'">
            <div style="font-size:1.5rem">🏳️</div>
            <div style="margin-top:0.25rem">${t.name}</div>
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

function selectTeam(code, name, color) {
  APP.team = code;
  APP.teamName = name;
  APP.teamColor = color;
  localStorage.setItem('gol_team', code);
  localStorage.setItem('gol_team_name', name);
  localStorage.setItem('gol_team_color', color);
  showApp();
}

function showApp() {
  APP.teamName = localStorage.getItem('gol_team_name') || APP.team;
  APP.teamColor = localStorage.getItem('gol_team_color') || '#fff';

  document.getElementById('app').innerHTML = `
    <div style="max-width:600px;margin:0 auto;padding:1rem">
      <header style="display:flex;align-items:center;justify-content:space-between;padding:1rem 0;border-bottom:2px solid ${APP.teamColor}">
        <div>
          <span style="font-size:1.5rem;font-weight:900;color:${APP.teamColor}">Gol!</span>
          <span style="color:#aaa;font-size:0.8rem;margin-left:0.5rem">WC 2026</span>
        </div>
        <div style="color:#aaa;font-size:0.8rem">🏳️ ${APP.teamName}</div>
      </header>
      <nav style="display:flex;gap:0.5rem;margin:1rem 0;overflow-x:auto">
        <button onclick="showTab('matches')" id="tab-matches" style="padding:0.5rem 1rem;border-radius:20px;border:none;background:${APP.teamColor};color:#000;font-weight:700;cursor:pointer">Matches</button>
        <button onclick="showTab('predict')" id="tab-predict" style="padding:0.5rem 1rem;border-radius:20px;border:2px solid #333;background:transparent;color:#fff;cursor:pointer">Predict</button>
        <button onclick="showTab('watch')" id="tab-watch" style="padding:0.5rem 1rem;border-radius:20px;border:2px solid #333;background:transparent;color:#fff;cursor:pointer">Watch</button>
      </nav>
      <div id="tab-content"></div>
    </div>
  `;
  showTab('matches');
}

function showTab(tab) {
  const content = document.getElementById('tab-content');
  if (tab === 'matches') {
    content.innerHTML = `
      <div style="text-align:center;padding:3rem;color:#aaa">
        <div style="font-size:3rem">📅</div>
        <p style="margin-top:1rem">Match schedule loading...</p>
        <p style="font-size:0.8rem;margin-top:0.5rem">Full schedule coming soon!</p>
      </div>`;
  } else if (tab === 'predict') {
    content.innerHTML = `
      <div style="text-align:center;padding:3rem;color:#aaa">
        <div style="font-size:3rem">🎯</div>
        <p style="margin-top:1rem">Predictions coming soon!</p>
      </div>`;
  } else if (tab === 'watch') {
    content.innerHTML = `
      <div style="padding:1rem">
        <h2 style="color:#fff;margin-bottom:1rem">📺 Where to Watch in India</h2>
        <div style="background:#1a1a2e;border-radius:12px;padding:1rem;margin-bottom:0.75rem">
          <div style="font-size:1.2rem;font-weight:700;color:#00b4d8">JioCinema</div>
          <div style="color:#aaa;font-size:0.9rem;margin-top:0.25rem">Free streaming — jiocinema.com</div>
        </div>
        <div style="background:#1a1a2e;border-radius:12px;padding:1rem;margin-bottom:0.75rem">
          <div style="font-size:1.2rem;font-weight:700;color:#ff6b35">Sports18</div>
          <div style="color:#aaa;font-size:0.9rem;margin-top:0.25rem">TV broadcast — check your cable provider</div>
        </div>
        <div style="background:#1a1a2e;border-radius:12px;padding:1rem">
          <div style="font-size:1.2rem;font-weight:700;color:#4cc9f0">DD Sports</div>
          <div style="color:#aaa;font-size:0.9rem;margin-top:0.25rem">Free TV — DD Free Dish channel 64</div>
        </div>
      </div>`;
  }
}