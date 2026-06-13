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
    <div style="min-height:100vh;background:linear-gradient(135deg,#0a0a1a 0%,#1a0a2e 40%,#0a1a2e 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:2rem;position:relative;overflow:hidden">
      
      <!-- Background glow effects -->
      <div style="position:fixed;top:-20%;left:-20%;width:60%;height:60%;background:radial-gradient(circle,#f0a50015 0%,transparent 70%);pointer-events:none;z-index:0"></div>
      <div style="position:fixed;bottom:-20%;right:-20%;width:60%;height:60%;background:radial-gradient(circle,#4cc9f015 0%,transparent 70%);pointer-events:none;z-index:0"></div>
      
      <div style="position:relative;z-index:1;width:100%;max-width:520px;display:flex;flex-direction:column;align-items:center">
        <div style="font-size:4rem;filter:drop-shadow(0 0 30px #f0a500);margin-bottom:0.5rem">⚽</div>
        <h1 style="font-size:3.5rem;font-weight:900;color:#fff;margin-bottom:0.1rem;text-shadow:0 0 40px #f0a50066;letter-spacing:-1px">Gol!</h1>
        <p style="color:rgba(255,255,255,0.6);margin-bottom:0.1rem;font-size:0.9rem">FIFA World Cup 2026</p>
        <p style="color:#f0a500;font-size:1rem;font-style:italic;margin-bottom:0.5rem;text-shadow:0 0 15px #f0a50088">¡Pasion por el Gol!</p>
        <p style="color:rgba(255,255,255,0.3);font-size:0.8rem;margin-bottom:2rem">48 teams • 12 groups • 104 matches</p>
        
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:0.75rem;width:100%">
          ${teams.map(t => `
            <button onclick="selectTeam('${t.name}','${t.color}')"
              style="background:rgba(255,255,255,0.05);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:0.75rem 0.5rem;cursor:pointer;color:#fff;font-size:0.65rem;text-align:center;transition:all 0.3s"
              onmouseover="this.style.background='rgba(255,255,255,0.12)';this.style.borderColor='${t.color}';this.style.boxShadow='0 0 20px ${t.color}44'"
              onmouseout="this.style.background='rgba(255,255,255,0.05)';this.style.borderColor='rgba(255,255,255,0.1)';this.style.boxShadow='none'">
              <img src="https://flagcdn.com/40x30/${getCountryCode(t.name)}.png" width="40" height="30" style="border-radius:4px;display:block;margin:0 auto;box-shadow:0 2px 8px rgba(0,0,0,0.3)" onerror="this.style.display='none'">
              <div style="margin-top:0.4rem;line-height:1.2;color:rgba(255,255,255,0.9)">${t.name}</div>
            </button>
          `).join('')}
        </div>
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
    <div style="min-height:100vh;background:linear-gradient(135deg,#0a0a1a 0%,#1a0a2e 40%,#0a1a2e 100%);position:relative">
      
      <!-- Background glow effects -->
      <div style="position:fixed;top:-20%;left:-20%;width:60%;height:60%;background:radial-gradient(circle,${APP.teamColor}10 0%,transparent 70%);pointer-events:none;z-index:0"></div>
      <div style="position:fixed;bottom:-20%;right:-20%;width:60%;height:60%;background:radial-gradient(circle,#4cc9f010 0%,transparent 70%);pointer-events:none;z-index:0"></div>
      
      <div style="max-width:600px;margin:0 auto;padding:1rem;position:relative;z-index:1">
        <header style="display:flex;align-items:center;justify-content:space-between;padding:1rem 0;border-bottom:1px solid rgba(255,255,255,0.1);margin-bottom:0.5rem;backdrop-filter:blur(10px)">
          <div>
            <span style="font-size:1.8rem;font-weight:900;color:${APP.teamColor};text-shadow:0 0 20px ${APP.teamColor}88">Gol!</span>
            <span style="color:#f0a500;font-size:0.7rem;font-style:italic;margin-left:0.4rem;opacity:0.8">¡Pasion por el Gol!</span>
          </div>
          <div style="display:flex;align-items:center;gap:0.5rem;color:rgba(255,255,255,0.6);font-size:0.8rem;cursor:pointer;background:rgba(255,255,255,0.05);padding:0.4rem 0.75rem;border-radius:20px;border:1px solid rgba(255,255,255,0.1)" onclick="resetTeam()">
            <img src="https://flagcdn.com/24x18/${getCountryCode(APP.teamName)}.png" style="border-radius:2px" onerror="this.style.display='none'">
            ${APP.teamName} ✕
          </div>
        </header>
        
        <nav style="display:flex;gap:0.5rem;margin:1rem 0;overflow-x:auto;background:rgba(255,255,255,0.05);padding:0.4rem;border-radius:20px;border:1px solid rgba(255,255,255,0.08)">
          <button onclick="showTab('matches')" id="nav-matches" style="flex:1;padding:0.5rem 1rem;border-radius:16px;border:none;background:${APP.teamColor};color:#000;font-weight:700;cursor:pointer;white-space:nowrap;transition:all 0.3s">Matches</button>
          <button onclick="showTab('predict')" id="nav-predict" style="flex:1;padding:0.5rem 1rem;border-radius:16px;border:none;background:transparent;color:rgba(255,255,255,0.6);cursor:pointer;white-space:nowrap;transition:all 0.3s">Predict</button>
          <button onclick="showTab('rankings')" id="nav-rankings" style="flex:1;padding:0.5rem 1rem;border-radius:16px;border:none;background:transparent;color:rgba(255,255,255,0.6);cursor:pointer;white-space:nowrap;transition:all 0.3s">Rankings</button>
          <button onclick="showTab('watch')" id="nav-watch" style="flex:1;padding:0.5rem 1rem;border-radius:16px;border:none;background:transparent;color:rgba(255,255,255,0.6);cursor:pointer;white-space:nowrap;transition:all 0.3s">Watch</button>
        </nav>
        
        <div id="tab-content"></div>
      </div>
    </div>
  `;
  showTab('matches');
}

function showTab(tab) {
  const content = document.getElementById('tab-content');

  // Update nav buttons
  ['matches','predict','rankings','watch'].forEach(t => {
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
    const myMatches = getTeamMatches(APP.teamName);
    const otherMatches = MATCHES.filter(m => m.home !== APP.teamName && m.away !== APP.teamName);

    const renderMatch = (m, highlight) => `
      <div style="${glass};padding:1rem;margin-bottom:0.75rem;${highlight ? 'border-color:'+APP.teamColor+'66;box-shadow:0 0 20px '+APP.teamColor+'22' : ''}">
        <div style="font-size:0.7rem;color:rgba(255,255,255,0.4);margin-bottom:0.75rem;text-align:center;background:rgba(255,255,255,0.05);padding:0.25rem 0.5rem;border-radius:8px;display:inline-block">Group ${m.group} • ${formatIST(m.date, m.time)}</div>
        <div style="display:flex;align-items:center;justify-content:space-between">
          <div style="text-align:center;flex:1">
            <img src="https://flagcdn.com/48x36/${getCountryCode(m.home)}.png" width="48" height="36" style="border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,0.4)" onerror="this.style.display='none'">
            <div style="font-size:0.85rem;color:#fff;margin-top:0.4rem;font-weight:600">${m.home}</div>
          </div>
          <div style="font-size:1rem;font-weight:900;color:rgba(255,255,255,0.2);padding:0 1rem;letter-spacing:2px">VS</div>
          <div style="text-align:center;flex:1">
            <img src="https://flagcdn.com/48x36/${getCountryCode(m.away)}.png" width="48" height="36" style="border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,0.4)" onerror="this.style.display='none'">
            <div style="font-size:0.85rem;color:#fff;margin-top:0.4rem;font-weight:600">${m.away}</div>
          </div>
        </div>
        <div style="font-size:0.65rem;color:rgba(255,255,255,0.3);margin-top:0.5rem;text-align:center">${m.venue}</div>
      </div>
    `;

    content.innerHTML = `
      ${myMatches.length > 0 ? `
        <div style="color:${APP.teamColor};font-weight:700;margin-bottom:0.75rem;font-size:0.95rem;display:flex;align-items:center;gap:0.5rem">
          <img src="https://flagcdn.com/24x18/${getCountryCode(APP.teamName)}.png" style="border-radius:3px" onerror="this.style.display='none'">
          ${APP.teamName} matches
        </div>
        ${myMatches.map(m => renderMatch(m, true)).join('')}
        <div style="color:rgba(255,255,255,0.4);font-weight:600;margin:1.5rem 0 0.75rem;font-size:0.85rem;text-transform:uppercase;letter-spacing:1px">All matches</div>
      ` : ''}
      ${otherMatches.map(m => renderMatch(m, false)).join('')}
    `;

  } else if (tab === 'predict') {
    content.innerHTML = `
      <div style="${glass};padding:1.5rem;margin-bottom:1.5rem;text-align:center;border-color:rgba(240,165,0,0.3);box-shadow:0 0 40px rgba(240,165,0,0.1)">
        <div style="font-size:2.5rem;filter:drop-shadow(0 0 15px #f0a500)">🏆</div>
        <h2 style="color:#f0a500;font-size:1.3rem;font-weight:900;margin:0.5rem 0 0.25rem;text-shadow:0 0 20px #f0a50066">Predict & Win</h2>
        <p style="color:rgba(255,255,255,0.5);font-size:0.85rem">Who will win? See what the world thinks!</p>
      </div>
      ${MATCHES.map(m => `
        <div style="${glass};padding:1.25rem;margin-bottom:1rem;box-shadow:0 8px 32px rgba(0,0,0,0.3)">
          <div style="font-size:0.72rem;color:rgba(255,255,255,0.4);margin-bottom:1rem;text-align:center;background:rgba(255,255,255,0.05);padding:0.3rem 0.75rem;border-radius:20px">Group ${m.group} • ${formatIST(m.date, m.time)}</div>
          <div style="display:flex;gap:0.5rem;margin-bottom:0.75rem">
            <button onclick="predict(${m.id},'${m.home}')" id="pred-${m.id}-home"
              style="flex:1;padding:1rem 0.5rem;border-radius:14px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05);backdrop-filter:blur(10px);color:#fff;cursor:pointer;font-size:0.8rem;text-align:center;transition:all 0.3s">
              <img src="https://flagcdn.com/48x36/${getCountryCode(m.home)}.png" style="border-radius:5px;display:block;margin:0 auto 8px;box-shadow:0 4px 12px rgba(0,0,0,0.4)" onerror="this.style.display='none'">
              <div style="font-weight:600">${m.home}</div>
            </button>
            <button onclick="predict(${m.id},'draw')" id="pred-${m.id}-draw"
              style="padding:1rem 0.75rem;border-radius:14px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05);backdrop-filter:blur(10px);color:rgba(255,255,255,0.6);cursor:pointer;font-size:0.8rem;font-weight:600;transition:all 0.3s">
              Draw
            </button>
            <button onclick="predict(${m.id},'${m.away}')" id="pred-${m.id}-away"
              style="flex:1;padding:1rem 0.5rem;border-radius:14px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05);backdrop-filter:blur(10px);color:#fff;cursor:pointer;font-size:0.8rem;text-align:center;transition:all 0.3s">
              <img src="https://flagcdn.com/48x36/${getCountryCode(m.away)}.png" style="border-radius:5px;display:block;margin:0 auto 8px;box-shadow:0 4px 12px rgba(0,0,0,0.4)" onerror="this.style.display='none'">
              <div style="font-weight:600">${m.away}</div>
            </button>
          </div>
          <div id="counts-${m.id}" style="font-size:0.75rem;color:rgba(255,255,255,0.3);text-align:center">Loading...</div>
        </div>
      `).join('')}
    `;

    MATCHES.forEach(m => {
      const saved = localStorage.getItem('pred_'+m.id);
      if (saved) highlightPrediction(m.id, saved);
      getPredictionCounts(m.id, (counts) => {
        const countsEl = document.getElementById('counts-'+m.id);
        if (!countsEl) return;
        const total = Object.values(counts).reduce((a,b) => a+b, 0);
        if (total === 0) {
          countsEl.innerHTML = '<span style="color:rgba(255,255,255,0.2)">Be the first to predict!</span>';
          return;
        }
        const homeCount = counts[m.home] || 0;
        const drawCount = counts['draw'] || 0;
        const awayCount = counts[m.away] || 0;
        const homeP = Math.round(homeCount/total*100);
        const drawP = Math.round(drawCount/total*100);
        const awayP = Math.round(awayCount/total*100);
        countsEl.innerHTML = `
          <div style="display:flex;gap:2px;margin-bottom:6px;height:6px;border-radius:6px;overflow:hidden;background:rgba(255,255,255,0.05)">
            <div style="flex:${homeP||1};background:${APP.teamColor};border-radius:6px 0 0 6px;opacity:0.9"></div>
            <div style="flex:${drawP||1};background:rgba(255,255,255,0.2)"></div>
            <div style="flex:${awayP||1};background:#4cc9f0;border-radius:0 6px 6px 0;opacity:0.9"></div>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:0.7rem;padding:0 2px">
            <span style="color:${APP.teamColor};font-weight:600">${homeP}%</span>
            <span style="color:rgba(255,255,255,0.3)">${total} vote${total>1?'s':''}</span>
            <span style="color:#4cc9f0;font-weight:600">${awayP}%</span>
          </div>
        `;
      });
    });

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

    const medal = r => r === 1 ? '🥇' : r === 2 ? '🥈' : r === 3 ? '🥉' : '';

    content.innerHTML = `
      ${userRank ? `
        <div style="${glass};padding:1.25rem;margin-bottom:1rem;border-color:${APP.teamColor}66;box-shadow:0 0 30px ${APP.teamColor}22;text-align:center">
          <img src="https://flagcdn.com/48x36/${getCountryCode(APP.teamName)}.png" style="border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,0.4);margin-bottom:0.5rem" onerror="this.style.display='none'">
          <div style="color:rgba(255,255,255,0.6);font-size:0.8rem;margin-bottom:0.25rem">Your team is ranked</div>
          <div style="font-size:2.8rem;font-weight:900;color:${APP.teamColor};text-shadow:0 0 30px ${APP.teamColor}88;line-height:1">#${userRank}</div>
          <div style="color:#fff;font-weight:700;font-size:1rem;margin-top:0.25rem">${APP.teamName}</div>
          <div style="color:rgba(255,255,255,0.3);font-size:0.75rem;margin-top:0.25rem">FIFA World Ranking • June 2026</div>
        </div>
      ` : ''}
      <div style="color:rgba(255,255,255,0.4);font-weight:600;font-size:0.8rem;text-transform:uppercase;letter-spacing:1px;margin-bottom:0.75rem">All 48 WC 2026 Teams</div>
      ${FIFA_RANKINGS.map(r => {
        const isUser = r.name === APP.teamName;
        const m = medal(r.rank);
        return `
          <div style="${glass};padding:0.75rem 1rem;margin-bottom:0.5rem;display:flex;align-items:center;gap:0.75rem;${isUser ? 'border-color:'+APP.teamColor+'88;box-shadow:0 0 20px '+APP.teamColor+'22;background:'+APP.teamColor+'12' : ''}">
            <div style="width:2rem;text-align:center;font-size:${m ? '1.2rem' : '0.9rem'};font-weight:700;color:${m ? 'inherit' : isUser ? APP.teamColor : 'rgba(255,255,255,0.3)'}">
              ${m || '#'+r.rank}
            </div>
            <img src="https://flagcdn.com/32x24/${getCountryCode(r.name)}.png" style="border-radius:3px;box-shadow:0 2px 6px rgba(0,0,0,0.3)" onerror="this.style.display='none'">
            <div style="flex:1;font-size:0.9rem;font-weight:${isUser ? '700' : '500'};color:${isUser ? APP.teamColor : '#fff'}">
              ${r.name}${isUser ? ' ← You' : ''}
            </div>
          </div>
        `;
      }).join('')}
    `;

  } else if (tab === 'watch') {
    const watchItems = [
      {icon:'📱',name:'JioCinema',color:'#00b4d8',desc:'Free streaming online & app',sub:'jiocinema.com'},
      {icon:'📺',name:'Sports18',color:'#ff6b35',desc:'TV broadcast on cable & DTH',sub:'Check your cable provider'},
      {icon:'🆓',name:'DD Sports',color:'#4cc9f0',desc:'Free TV - no subscription needed',sub:'DD Free Dish channel 64'},
    ];
    content.innerHTML = `
      <h2 style="color:#fff;margin-bottom:1rem;font-size:1.1rem">📺 Where to Watch in India</h2>
      ${watchItems.map(w => `
        <div style="${glass};padding:1.25rem;margin-bottom:0.75rem;display:flex;align-items:center;gap:1rem">
          <div style="font-size:2rem;filter:drop-shadow(0 0 8px ${w.color}66)">${w.icon}</div>
          <div>
            <div style="font-size:1.1rem;font-weight:700;color:${w.color}">${w.name}</div>
            <div style="color:rgba(255,255,255,0.6);font-size:0.85rem;margin-top:0.2rem">${w.desc}</div>
            <div style="color:rgba(255,255,255,0.3);font-size:0.75rem">${w.sub}</div>
          </div>
        </div>
      `).join('')}
      <div style="${glass};padding:1.25rem;display:flex;align-items:center;gap:1rem;border-color:rgba(37,211,102,0.3)">
        <div style="font-size:2rem">💬</div>
        <div>
          <div style="font-size:1.1rem;font-weight:700;color:#25D366">Share Gol!</div>
          <div style="color:rgba(255,255,255,0.6);font-size:0.85rem;margin-top:0.2rem">Tell your friends!</div>
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
  localStorage.clear();
  location.reload();
}