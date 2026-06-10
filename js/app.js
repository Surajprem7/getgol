// Gol! — Main App Logic

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
    {code:'Argentina',color:'#74ACDF'},{code:'Brazil',color:'#009C3B'},
    {code:'England',color:'#CF111B'},{code:'France',color:'#002395'},
    {code:'Germany',color:'#000000'},{code:'Spain',color:'#AA151B'},
    {code:'Portugal',color:'#006600'},{code:'Netherlands',color:'#FF6600'},
    {code:'Italy',color:'#003399'},{code:'Belgium',color:'#EF3340'},
    {code:'Croatia',color:'#FF0000'},{code:'Uruguay',color:'#5EB6E4'},
    {code:'Mexico',color:'#006847'},{code:'USA',color:'#B22234'},
    {code:'Japan',color:'#BC002D'},{code:'South Korea',color:'#003478'},
    {code:'Morocco',color:'#C1272D'},{code:'Senegal',color:'#00853F'},
    {code:'Denmark',color:'#C60C30'},{code:'Serbia',color:'#C6363C'},
    {code:'Poland',color:'#DC143C'},{code:'Ecuador',color:'#FFD100'},
    {code:'Saudi Arabia',color:'#006C35'},{code:'Ghana',color:'#006B3F'},
    {code:'Australia',color:'#FFCD00'},{code:'Switzerland',color:'#FF0000'},
    {code:'Chile',color:'#D52B1E'},{code:'Hungary',color:'#CE2939'},
    {code:'Albania',color:'#E41E20'},{code:'New Zealand',color:'#00247D'},
    {code:'Guatemala',color:'#4997D0'},{code:'Panama',color:'#005293'},
  ];

  document.getElementById('app').innerHTML = `
    <div style="min-height:100vh;background:#0d0d1a;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:2rem">
      <div style="font-size:3rem">⚽</div>
      <h1 style="font-size:2rem;font-weight:900;color:#fff;margin-bottom:0.25rem">Gol!</h1>
      <p style="color:#aaa;margin-bottom:2rem">Pick your team to get started</p>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:0.75rem;max-width:480px;width:100%">
        ${teams.map(t => `
          <button onclick="selectTeam('${t.code}','${t.color}')"
            style="background:#1a1a2e;border:2px solid #333;border-radius:12px;padding:0.75rem 0.5rem;cursor:pointer;color:#fff;font-size:0.7rem;text-align:center"
            onmouseover="this.style.borderColor='${t.color}'"
            onmouseout="this.style.borderColor='#333'">
            <div style="font-size:1.5rem">${getFlag(t.code)}</div>
            <div style="margin-top:0.25rem">${t.code}</div>
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
          <span style="color:#aaa;font-size:0.8rem;margin-left:0.5rem">WC 2026</span>
        </div>
        <div style="color:#aaa;font-size:0.8rem;cursor:pointer" onclick="resetTeam()">${getFlag(APP.teamName)} ${APP.teamName} ✕</div>
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
    const myMatches = getTeamMatches(APP.teamName);
    const otherMatches = MATCHES.filter(m => m.home !== APP.teamName && m.away !== APP.teamName);

    const renderMatch = (m, highlight) => `
      <div style="background:${highlight ? APP.teamColor+'22' : '#1a1a2e'};border:1px solid ${highlight ? APP.teamColor : '#333'};border-radius:12px;padding:1rem;margin-bottom:0.75rem">
        <div style="font-size:0.7rem;color:#aaa;margin-bottom:0.5rem">Group ${m.group} • ${formatIST(m.date, m.time)}</div>
        <div style="display:flex;align-items:center;justify-content:space-between">
          <div style="text-align:center;flex:1">
            <div style="font-size:1.5rem">${getFlag(m.home)}</div>
            <div style="font-size:0.85rem;color:#fff;margin-top:0.25rem">${m.home}</div>
          </div>
          <div style="font-size:1.2rem;font-weight:900;color:#aaa;padding:0 1rem">VS</div>
          <div style="text-align:center;flex:1">
            <div style="font-size:1.5rem">${getFlag(m.away)}</div>
            <div style="font-size:0.85rem;color:#fff;margin-top:0.25rem">${m.away}</div>
          </div>
        </div>
        <div style="font-size:0.7rem;color:#666;margin-top:0.5rem;text-align:center">${m.venue}</div>
      </div>
    `;

    content.innerHTML = `
      ${myMatches.length > 0 ? `
        <div style="color:${APP.teamColor};font-weight:700;margin-bottom:0.75rem">${getFlag(APP.teamName)} ${APP.teamName} matches</div>
        ${myMatches.map(m => renderMatch(m, true)).join('')}
        <div style="color:#aaa;font-weight:700;margin:1rem 0 0.75rem">All other matches</div>
      ` : ''}
      ${otherMatches.map(m => renderMatch(m, false)).join('')}
    `;
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

function resetTeam() {
  localStorage.clear();
  location.reload();
}