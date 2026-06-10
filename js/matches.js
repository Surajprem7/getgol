// All FIFA World Cup 2026 matches in IST
const MATCHES = [
  // Group A
  {id:1, group:'A', home:'USA', away:'Panama', date:'2026-06-12', time:'00:30', venue:'SoFi Stadium, LA'},
  {id:2, group:'A', home:'Mexico', away:'Ecuador', date:'2026-06-13', time:'03:30', venue:'Rose Bowl, LA'},
  {id:3, group:'A', home:'USA', away:'Ecuador', date:'2026-06-17', time:'00:30', venue:'Levi\'s Stadium, SF'},
  {id:4, group:'A', home:'Panama', away:'Mexico', date:'2026-06-17', time:'03:30', venue:'Rose Bowl, LA'},
  {id:5, group:'A', home:'Ecuador', away:'Panama', date:'2026-06-21', time:'00:30', venue:'SoFi Stadium, LA'},
  {id:6, group:'A', home:'Mexico', away:'USA', date:'2026-06-21', time:'00:30', venue:'Levi\'s Stadium, SF'},

  // Group B
  {id:7, group:'B', home:'Argentina', away:'Albania', date:'2026-06-13', time:'00:30', venue:'MetLife, NJ'},
  {id:8, group:'B', home:'Morocco', away:'Uzbekistan', date:'2026-06-13', time:'21:30', venue:'Empower Field, Denver'},
  {id:9, group:'B', home:'Argentina', away:'Uzbekistan', date:'2026-06-17', time:'21:30', venue:'MetLife, NJ'},
  {id:10, group:'B', home:'Albania', away:'Morocco', date:'2026-06-18', time:'00:30', venue:'Empower Field, Denver'},
  {id:11, group:'B', home:'Uzbekistan', away:'Albania', date:'2026-06-22', time:'00:30', venue:'MetLife, NJ'},
  {id:12, group:'B', home:'Morocco', away:'Argentina', date:'2026-06-22', time:'00:30', venue:'Empower Field, Denver'},

  // Group C
  {id:13, group:'C', home:'Brazil', away:'Croatia', date:'2026-06-13', time:'06:30', venue:'AT&T Stadium, Dallas'},
  {id:14, group:'C', home:'Japan', away:'Chile', date:'2026-06-14', time:'00:30', venue:'SoFi Stadium, LA'},
  {id:15, group:'C', home:'Brazil', away:'Chile', date:'2026-06-18', time:'03:30', venue:'SoFi Stadium, LA'},
  {id:16, group:'C', home:'Croatia', away:'Japan', date:'2026-06-18', time:'06:30', venue:'AT&T Stadium, Dallas'},
  {id:17, group:'C', home:'Chile', away:'Croatia', date:'2026-06-22', time:'21:30', venue:'AT&T Stadium, Dallas'},
  {id:18, group:'C', home:'Japan', away:'Brazil', date:'2026-06-22', time:'21:30', venue:'SoFi Stadium, LA'},

  // Group D
  {id:19, group:'D', home:'England', away:'Serbia', date:'2026-06-14', time:'03:30', venue:'MetLife, NJ'},
  {id:20, group:'D', home:'Denmark', away:'Senegal', date:'2026-06-14', time:'21:30', venue:'Lincoln Financial, Philadelphia'},
  {id:21, group:'D', home:'England', away:'Senegal', date:'2026-06-19', time:'00:30', venue:'Lincoln Financial, Philadelphia'},
  {id:22, group:'D', home:'Serbia', away:'Denmark', date:'2026-06-19', time:'03:30', venue:'MetLife, NJ'},
  {id:23, group:'D', home:'Senegal', away:'Serbia', date:'2026-06-23', time:'00:30', venue:'MetLife, NJ'},
  {id:24, group:'D', home:'Denmark', away:'England', date:'2026-06-23', time:'00:30', venue:'Lincoln Financial, Philadelphia'},

  // Group E
  {id:25, group:'E', home:'France', away:'Guatemala', date:'2026-06-14', time:'06:30', venue:'Levi\'s Stadium, SF'},
  {id:26, group:'E', home:'Germany', away:'Saudi Arabia', date:'2026-06-15', time:'00:30', venue:'Allegiant Stadium, LV'},
  {id:27, group:'E', home:'France', away:'Saudi Arabia', date:'2026-06-19', time:'06:30', venue:'Allegiant Stadium, LV'},
  {id:28, group:'E', home:'Guatemala', away:'Germany', date:'2026-06-19', time:'21:30', venue:'Levi\'s Stadium, SF'},
  {id:29, group:'E', home:'Saudi Arabia', away:'Guatemala', date:'2026-06-23', time:'21:30', venue:'Levi\'s Stadium, SF'},
  {id:30, group:'E', home:'Germany', away:'France', date:'2026-06-23', time:'21:30', venue:'Allegiant Stadium, LV'},

  // Group F
  {id:31, group:'F', home:'Spain', away:'South Korea', date:'2026-06-15', time:'03:30', venue:'Hard Rock, Miami'},
  {id:32, group:'F', home:'Belgium', away:'New Zealand', date:'2026-06-15', time:'21:30', venue:'Gillette Stadium, Boston'},
  {id:33, group:'F', home:'Spain', away:'New Zealand', date:'2026-06-19', time:'21:30', venue:'Gillette Stadium, Boston'},
  {id:34, group:'F', home:'South Korea', away:'Belgium', date:'2026-06-20', time:'00:30', venue:'Hard Rock, Miami'},
  {id:35, group:'F', home:'New Zealand', away:'South Korea', date:'2026-06-24', time:'00:30', venue:'Hard Rock, Miami'},
  {id:36, group:'F', home:'Belgium', away:'Spain', date:'2026-06-24', time:'00:30', venue:'Gillette Stadium, Boston'},

  // Group G
  {id:37, group:'G', home:'Portugal', away:'Hungary', date:'2026-06-15', time:'06:30', venue:'Estadio Azteca, Mexico'},
  {id:38, group:'G', home:'Netherlands', away:'Iraq', date:'2026-06-16', time:'00:30', venue:'AT&T Stadium, Dallas'},
  {id:39, group:'G', home:'Portugal', away:'Iraq', date:'2026-06-20', time:'03:30', venue:'AT&T Stadium, Dallas'},
  {id:40, group:'G', home:'Hungary', away:'Netherlands', date:'2026-06-20', time:'06:30', venue:'Estadio Azteca, Mexico'},
  {id:41, group:'G', home:'Iraq', away:'Hungary', date:'2026-06-24', time:'21:30', venue:'Estadio Azteca, Mexico'},
  {id:42, group:'G', home:'Netherlands', away:'Portugal', date:'2026-06-24', time:'21:30', venue:'AT&T Stadium, Dallas'},

  // Group H
  {id:43, group:'H', home:'Italy', away:'Ecuador2', date:'2026-06-16', time:'03:30', venue:'Estadio BBVA, Monterrey'},
  {id:44, group:'H', home:'Uruguay', away:'Tanzania', date:'2026-06-16', time:'21:30', venue:'BC Place, Vancouver'},
  {id:45, group:'H', home:'Italy', away:'Tanzania', date:'2026-06-20', time:'21:30', venue:'BC Place, Vancouver'},
  {id:46, group:'H', home:'Ecuador2', away:'Uruguay', date:'2026-06-21', time:'00:30', venue:'Estadio BBVA, Monterrey'},
  {id:47, group:'H', home:'Tanzania', away:'Ecuador2', date:'2026-06-25', time:'00:30', venue:'Estadio BBVA, Monterrey'},
  {id:48, group:'H', home:'Uruguay', away:'Italy', date:'2026-06-25', time:'00:30', venue:'BC Place, Vancouver'},
];

// Flag emojis for teams
const FLAGS = {
  'USA':'🇺🇸','Mexico':'🇲🇽','Panama':'🇵🇦','Ecuador':'🇪🇨',
  'Argentina':'🇦🇷','Albania':'🇦🇱','Morocco':'🇲🇦','Uzbekistan':'🇺🇿',
  'Brazil':'🇧🇷','Croatia':'🇭🇷','Japan':'🇯🇵','Chile':'🇨🇱',
  'England':'🏴󠁧󠁢󠁥󠁮󠁧󠁿','Serbia':'🇷🇸','Denmark':'🇩🇰','Senegal':'🇸🇳',
  'France':'🇫🇷','Guatemala':'🇬🇹','Germany':'🇩🇪','Saudi Arabia':'🇸🇦',
  'Spain':'🇪🇸','South Korea':'🇰🇷','Belgium':'🇧🇪','New Zealand':'🇳🇿',
  'Portugal':'🇵🇹','Hungary':'🇭🇺','Netherlands':'🇳🇱','Iraq':'🇮🇶',
  'Italy':'🇮🇹','Uruguay':'🇺🇾','Tanzania':'🇹🇿',
};

function getFlag(team) {
  return FLAGS[team] || '🏳️';
}

function getTeamMatches(teamName) {
  return MATCHES.filter(m => m.home === teamName || m.away === teamName);
}

function formatIST(date, time) {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const d = new Date(date);
  return `${d.getDate()} ${months[d.getMonth()]} • ${time} IST`;
}