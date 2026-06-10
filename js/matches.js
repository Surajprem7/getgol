const MATCHES = [
  // GROUP A: Mexico, South Africa, South Korea, Czech Republic
  {id:1,group:'A',home:'Mexico',away:'South Africa',date:'2026-06-11',time:'00:30',venue:'Estadio Azteca, Mexico City'},
  {id:2,group:'A',home:'South Korea',away:'Czech Republic',date:'2026-06-11',time:'07:30',venue:'Estadio Akron, Zapopan'},
  {id:3,group:'A',home:'Czech Republic',away:'South Africa',date:'2026-06-18',time:'21:30',venue:'Mercedes-Benz Stadium, Atlanta'},
  {id:4,group:'A',home:'Mexico',away:'South Korea',date:'2026-06-19',time:'06:30',venue:'Estadio Akron, Zapopan'},
  {id:5,group:'A',home:'Czech Republic',away:'Mexico',date:'2026-06-25',time:'06:30',venue:'Estadio Azteca, Mexico City'},
  {id:6,group:'A',home:'South Africa',away:'South Korea',date:'2026-06-25',time:'06:30',venue:'Estadio BBVA, Monterrey'},

  // GROUP B: Canada, Switzerland, Bosnia & Herzegovina, Qatar
  {id:7,group:'B',home:'Canada',away:'Bosnia',date:'2026-06-12',time:'00:30',venue:'BMO Field, Toronto'},
  {id:8,group:'B',home:'Qatar',away:'Switzerland',date:'2026-06-13',time:'00:30',venue:'Levi\'s Stadium, Santa Clara'},
  {id:9,group:'B',home:'Switzerland',away:'Bosnia',date:'2026-06-18',time:'00:30',venue:'SoFi Stadium, Los Angeles'},
  {id:10,group:'B',home:'Canada',away:'Qatar',date:'2026-06-18',time:'03:30',venue:'BC Place, Vancouver'},
  {id:11,group:'B',home:'Bosnia',away:'Qatar',date:'2026-06-24',time:'03:30',venue:'BC Place, Vancouver'},
  {id:12,group:'B',home:'Switzerland',away:'Canada',date:'2026-06-24',time:'03:30',venue:'BC Place, Vancouver'},

  // GROUP C: Brazil, Morocco, Haiti, Scotland
  {id:13,group:'C',home:'Morocco',away:'Haiti',date:'2026-06-13',time:'06:30',venue:'Mercedes-Benz Stadium, Atlanta'},
  {id:14,group:'C',home:'Scotland',away:'Brazil',date:'2026-06-13',time:'06:30',venue:'Hard Rock Stadium, Miami'},
  {id:15,group:'C',home:'Brazil',away:'Morocco',date:'2026-06-19',time:'03:30',venue:'Gillette Stadium, Boston'},
  {id:16,group:'C',home:'Haiti',away:'Scotland',date:'2026-06-19',time:'06:30',venue:'AT&T Stadium, Dallas'},
  {id:17,group:'C',home:'Haiti',away:'Brazil',date:'2026-06-25',time:'21:30',venue:'Hard Rock Stadium, Miami'},
  {id:18,group:'C',home:'Scotland',away:'Morocco',date:'2026-06-25',time:'21:30',venue:'Lincoln Financial, Philadelphia'},

  // GROUP D: USA, Paraguay, Australia, Turkey
  {id:19,group:'D',home:'USA',away:'Paraguay',date:'2026-06-12',time:'21:30',venue:'SoFi Stadium, Los Angeles'},
  {id:20,group:'D',home:'Australia',away:'Turkey',date:'2026-06-13',time:'00:30',venue:'AT&T Stadium, Dallas'},
  {id:21,group:'D',home:'USA',away:'Australia',date:'2026-06-19',time:'00:30',venue:'SoFi Stadium, Los Angeles'},
  {id:22,group:'D',home:'Paraguay',away:'Turkey',date:'2026-06-19',time:'03:30',venue:'AT&T Stadium, Dallas'},
  {id:23,group:'D',home:'Turkey',away:'USA',date:'2026-06-25',time:'06:30',venue:'SoFi Stadium, Los Angeles'},
  {id:24,group:'D',home:'Paraguay',away:'Australia',date:'2026-06-25',time:'06:30',venue:'AT&T Stadium, Dallas'},

  // GROUP E: Germany, Curaçao, Ivory Coast, Ecuador
  {id:25,group:'E',home:'Curacao',away:'Ivory Coast',date:'2026-06-14',time:'06:30',venue:'Lincoln Financial, Philadelphia'},
  {id:26,group:'E',home:'Ecuador',away:'Germany',date:'2026-06-14',time:'06:30',venue:'MetLife Stadium, New Jersey'},
  {id:27,group:'E',home:'Germany',away:'Ivory Coast',date:'2026-06-20',time:'03:30',venue:'SoFi Stadium, Los Angeles'},
  {id:28,group:'E',home:'Curacao',away:'Ecuador',date:'2026-06-20',time:'06:30',venue:'MetLife Stadium, New Jersey'},
  {id:29,group:'E',home:'Ivory Coast',away:'Ecuador',date:'2026-06-26',time:'06:30',venue:'MetLife Stadium, New Jersey'},
  {id:30,group:'E',home:'Germany',away:'Curacao',date:'2026-06-26',time:'06:30',venue:'BC Place, Vancouver'},

  // GROUP F: Netherlands, Japan, Tunisia, Sweden
  {id:31,group:'F',home:'Tunisia',away:'Netherlands',date:'2026-06-14',time:'06:30',venue:'Arrowhead Stadium, Kansas City'},
  {id:32,group:'F',home:'Japan',away:'Sweden',date:'2026-06-15',time:'00:30',venue:'Levi\'s Stadium, Santa Clara'},
  {id:33,group:'F',home:'Netherlands',away:'Japan',date:'2026-06-20',time:'21:30',venue:'Arrowhead Stadium, Kansas City'},
  {id:34,group:'F',home:'Sweden',away:'Tunisia',date:'2026-06-21',time:'00:30',venue:'Levi\'s Stadium, Santa Clara'},
  {id:35,group:'F',home:'Sweden',away:'Netherlands',date:'2026-06-26',time:'21:30',venue:'Arrowhead Stadium, Kansas City'},
  {id:36,group:'F',home:'Tunisia',away:'Japan',date:'2026-06-26',time:'21:30',venue:'Levi\'s Stadium, Santa Clara'},

  // GROUP G: Belgium, Egypt, Iran, New Zealand
  {id:37,group:'G',home:'Belgium',away:'Egypt',date:'2026-06-15',time:'03:30',venue:'Lumen Field, Seattle'},
  {id:38,group:'G',home:'Iran',away:'New Zealand',date:'2026-06-15',time:'06:30',venue:'SoFi Stadium, Los Angeles'},
  {id:39,group:'G',home:'Belgium',away:'Iran',date:'2026-06-21',time:'03:30',venue:'Lumen Field, Seattle'},
  {id:40,group:'G',home:'Egypt',away:'New Zealand',date:'2026-06-21',time:'06:30',venue:'SoFi Stadium, Los Angeles'},
  {id:41,group:'G',home:'New Zealand',away:'Belgium',date:'2026-06-27',time:'03:30',venue:'Lumen Field, Seattle'},
  {id:42,group:'G',home:'Egypt',away:'Iran',date:'2026-06-27',time:'03:30',venue:'SoFi Stadium, Los Angeles'},

  // GROUP H: Spain, Cape Verde, Saudi Arabia, Uruguay
  {id:43,group:'H',home:'Spain',away:'Cape Verde',date:'2026-06-15',time:'21:30',venue:'Mercedes-Benz Stadium, Atlanta'},
  {id:44,group:'H',home:'Saudi Arabia',away:'Uruguay',date:'2026-06-15',time:'03:30',venue:'Hard Rock Stadium, Miami'},
  {id:45,group:'H',home:'Spain',away:'Saudi Arabia',date:'2026-06-21',time:'21:30',venue:'Hard Rock Stadium, Miami'},
  {id:46,group:'H',home:'Cape Verde',away:'Uruguay',date:'2026-06-22',time:'00:30',venue:'Mercedes-Benz Stadium, Atlanta'},
  {id:47,group:'H',home:'Uruguay',away:'Spain',date:'2026-06-27',time:'06:30',venue:'Hard Rock Stadium, Miami'},
  {id:48,group:'H',home:'Cape Verde',away:'Saudi Arabia',date:'2026-06-27',time:'06:30',venue:'Mercedes-Benz Stadium, Atlanta'},

  // GROUP I: France, Senegal, Norway, Iraq
  {id:49,group:'I',home:'France',away:'Senegal',date:'2026-06-16',time:'00:30',venue:'MetLife Stadium, New Jersey'},
  {id:50,group:'I',home:'Iraq',away:'Norway',date:'2026-06-16',time:'03:30',venue:'Gillette Stadium, Boston'},
  {id:51,group:'I',home:'France',away:'Iraq',date:'2026-06-22',time:'00:30',venue:'MetLife Stadium, New Jersey'},
  {id:52,group:'I',home:'Norway',away:'Senegal',date:'2026-06-22',time:'03:30',venue:'Gillette Stadium, Boston'},
  {id:53,group:'I',home:'Norway',away:'France',date:'2026-06-27',time:'21:30',venue:'MetLife Stadium, New Jersey'},
  {id:54,group:'I',home:'Senegal',away:'Iraq',date:'2026-06-27',time:'21:30',venue:'Gillette Stadium, Boston'},

  // GROUP J: Argentina, Algeria, Austria, Jordan
  {id:55,group:'J',home:'Argentina',away:'Algeria',date:'2026-06-16',time:'06:30',venue:'Arrowhead Stadium, Kansas City'},
  {id:56,group:'J',home:'Austria',away:'Jordan',date:'2026-06-17',time:'02:00',venue:'Levi\'s Stadium, Santa Clara'},
  {id:57,group:'J',home:'Argentina',away:'Austria',date:'2026-06-22',time:'06:30',venue:'Arrowhead Stadium, Kansas City'},
  {id:58,group:'J',home:'Algeria',away:'Jordan',date:'2026-06-23',time:'00:30',venue:'Levi\'s Stadium, Santa Clara'},
  {id:59,group:'J',home:'Jordan',away:'Argentina',date:'2026-06-28',time:'03:30',venue:'Arrowhead Stadium, Kansas City'},
  {id:60,group:'J',home:'Algeria',away:'Austria',date:'2026-06-28',time:'03:30',venue:'Levi\'s Stadium, Santa Clara'},

  // GROUP K: Portugal, Uzbekistan, Colombia, DR Congo
  {id:61,group:'K',home:'Portugal',away:'DR Congo',date:'2026-06-17',time:'00:30',venue:'NRG Stadium, Houston'},
  {id:62,group:'K',home:'Uzbekistan',away:'Colombia',date:'2026-06-17',time:'03:30',venue:'Estadio Azteca, Mexico City'},
  {id:63,group:'K',home:'Portugal',away:'Uzbekistan',date:'2026-06-22',time:'21:30',venue:'NRG Stadium, Houston'},
  {id:64,group:'K',home:'Colombia',away:'DR Congo',date:'2026-06-23',time:'03:30',venue:'Estadio Azteca, Mexico City'},
  {id:65,group:'K',home:'Colombia',away:'Portugal',date:'2026-06-28',time:'06:30',venue:'NRG Stadium, Houston'},
  {id:66,group:'K',home:'DR Congo',away:'Uzbekistan',date:'2026-06-28',time:'06:30',venue:'Estadio Azteca, Mexico City'},

  // GROUP L: England, Croatia, Ghana, Panama
  {id:67,group:'L',home:'England',away:'Ghana',date:'2026-06-17',time:'06:30',venue:'Gillette Stadium, Boston'},
  {id:68,group:'L',home:'Panama',away:'Croatia',date:'2026-06-18',time:'00:30',venue:'Gillette Stadium, Boston'},
  {id:69,group:'L',home:'England',away:'Croatia',date:'2026-06-23',time:'01:30',venue:'AT&T Stadium, Dallas'},
  {id:70,group:'L',home:'Ghana',away:'Panama',date:'2026-06-23',time:'04:00',venue:'BMO Field, Toronto'},
  {id:71,group:'L',home:'Panama',away:'England',date:'2026-06-28',time:'03:30',venue:'MetLife Stadium, New Jersey'},
  {id:72,group:'L',home:'Croatia',away:'Ghana',date:'2026-06-28',time:'03:30',venue:'AT&T Stadium, Dallas'},
];

function getFlag(team) {
  const codes = {
    'Mexico':'mx','South Africa':'za','South Korea':'kr','Czech Republic':'cz',
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
  const code = codes[team];
  if (!code) return '🏳️';
  return `<img src="https://flagcdn.com/40x30/${code}.png" width="40" height="30" style="border-radius:3px" alt="${team}">`;
}

function getTeamMatches(team) {
  return MATCHES.filter(m => m.home === team || m.away === team);
}

function formatIST(date, time) {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const d = new Date(date);
  return `${d.getDate()} ${months[d.getMonth()]} • ${time} IST`;
}