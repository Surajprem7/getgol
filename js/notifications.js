// notifications.js — Tier 1: local browser notifications for live match events.
// Fires on kickoff / goal / full-time while the app is open in a tab (foreground
// or background). No backend required. Driven by the same score updates that
// flow through the Firebase listener in live.js.

const NOTIF = {
  prev: {},        // last-seen snapshot: { matchId: {home, away, status} }
  primed: false,   // skip the first snapshot so we don't alert on existing results
};

function notifEnabled() {
  return typeof Notification !== 'undefined'
    && Notification.permission === 'granted'
    && localStorage.getItem('gol_notif') === 'on';
}

// Ask the browser for permission, then remember the choice.
function requestNotifPermission() {
  if (typeof Notification === 'undefined') {
    alert('Your browser does not support notifications.');
    return;
  }
  if (Notification.permission === 'denied') {
    alert('Notifications are blocked. Enable them for this site in your browser settings, then try again.');
    return;
  }
  Notification.requestPermission().then(result => {
    if (result === 'granted') {
      localStorage.setItem('gol_notif', 'on');
      fireNotification('🔔 Notifications on', "You'll get alerts for kickoffs, goals and full-time.", 'gol-welcome');
    }
    updateNotifBell();
  });
}

// Toggle off (without revoking browser permission).
function toggleNotifications() {
  if (!notifEnabled()) {
    requestNotifPermission();
  } else {
    localStorage.setItem('gol_notif', 'off');
    updateNotifBell();
  }
}

function updateNotifBell() {
  const bell = document.getElementById('notif-bell');
  if (!bell) return;
  const on = notifEnabled();
  bell.textContent = on ? '🔔' : '🔕';
  bell.title = on ? 'Match alerts on — tap to mute' : 'Tap to enable match alerts';
  bell.style.opacity = on ? '1' : '0.5';
}

// Show a notification via the service worker if available (more reliable on
// mobile/PWA), else fall back to a page Notification.
function fireNotification(title, body, tag) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  const opts = {
    body,
    tag,
    renotify: true,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
  };
  if (navigator.serviceWorker && navigator.serviceWorker.ready) {
    navigator.serviceWorker.ready
      .then(reg => reg.showNotification(title, opts))
      .catch(() => { try { new Notification(title, opts); } catch (e) {} });
  } else {
    try { new Notification(title, opts); } catch (e) {}
  }
}

function snapshotScores(scores) {
  const snap = {};
  Object.entries(scores || {}).forEach(([id, sc]) => {
    snap[id] = { home: sc.home, away: sc.away, status: sc.status };
  });
  return snap;
}

// Compare the latest scores against the previous snapshot and fire events.
// Called from live.js whenever scores change.
function notifyScoreChanges(scores) {
  // Always keep a baseline so toggling on mid-session doesn't replay history.
  if (!notifEnabled()) { NOTIF.prev = snapshotScores(scores); NOTIF.primed = true; return; }
  if (!NOTIF.primed)   { NOTIF.prev = snapshotScores(scores); NOTIF.primed = true; return; }

  Object.entries(scores).forEach(([id, sc]) => {
    const prev = NOTIF.prev[id];
    const m = (typeof MATCHES !== 'undefined') && MATCHES.find(x => String(x.id) === String(id));
    if (!m) return;

    const scoreStr = `${sc.home >= 0 ? sc.home : 0}–${sc.away >= 0 ? sc.away : 0}`;

    // Kickoff: anything → LIVE
    if (sc.status === 'LIVE' && (!prev || prev.status !== 'LIVE')) {
      fireNotification('🟢 Kick-off!', `${m.home} vs ${m.away} has started`, 'kick-' + id);
    }

    // Goal: score increased while live
    if (sc.status === 'LIVE' && prev && prev.status === 'LIVE') {
      if (sc.home >= 0 && prev.home >= 0 && sc.home > prev.home) {
        fireNotification('⚽ GOAL!', `${m.home} score! ${m.home} ${scoreStr} ${m.away}`, 'goal-' + id);
      }
      if (sc.away >= 0 && prev.away >= 0 && sc.away > prev.away) {
        fireNotification('⚽ GOAL!', `${m.away} score! ${m.home} ${scoreStr} ${m.away}`, 'goal-' + id);
      }
    }

    // Full time: anything → FT
    if (sc.status === 'FT' && (!prev || prev.status !== 'FT')) {
      fireNotification('⏱️ Full Time', `${m.home} ${scoreStr} ${m.away}`, 'ft-' + id);
    }
  });

  NOTIF.prev = snapshotScores(scores);
}

// Keep the bell in sync once the app shell is rendered.
document.addEventListener('DOMContentLoaded', () => setTimeout(updateNotifBell, 0));
