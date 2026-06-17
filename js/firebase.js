const firebaseConfig = {
  apiKey: "AIzaSyD8A3QjR4y846DnoKppoF6x6WMUkSUm2-c",
  authDomain: "getgol7.firebaseapp.com",
  databaseURL: "https://getgol7-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "getgol7",
  storageBucket: "getgol7.firebasestorage.app",
  messagingSenderId: "348385567552",
  appId: "1:348385567552:web:6044919c6d0163b7a110a5"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const auth = firebase.auth();

// Sign in anonymously
let currentUser = null;
auth.signInAnonymously().then(result => {
  currentUser = result.user;
  initPresence(currentUser.uid);
  countUserOnce(currentUser.uid);
}).catch(err => console.log('Auth error:', err));

// ── Live presence: mark this user "online" while a tab is open ──
// Firebase removes the node automatically when the connection drops (onDisconnect),
// so counting the children of /presence gives a live "online now" number.
function initPresence(uid) {
  const myPresence = db.ref('presence/' + uid);
  db.ref('.info/connected').on('value', snap => {
    if (snap.val() === true) {
      myPresence.onDisconnect().remove();
      myPresence.set(true);
    }
  });
}

// Count each device once toward the total-fans stat (localStorage guard keeps it
// from re-counting the same device on every visit).
function countUserOnce() {
  if (localStorage.getItem('gol_counted')) return;
  // Only mark this device "counted" once the increment actually commits, so a
  // denied/failed write (e.g. rules not yet published) is retried on next visit.
  db.ref('stats/totalUsers').transaction(count => (count || 0) + 1)
    .then(res => { if (res.committed) localStorage.setItem('gol_counted', '1'); })
    .catch(() => {});
}

// Live "online now" count.
// off() first so re-opening the Stats tab doesn't stack duplicate listeners.
function getOnlineCount(callback) {
  const ref = db.ref('presence');
  ref.off('value');
  ref.on('value', snap => callback(snap.numChildren()));
}

// Total registered fans (public counter).
function getTotalUsers(callback) {
  const ref = db.ref('stats/totalUsers');
  ref.off('value');
  ref.on('value', snap => callback(snap.val() || 0));
}

// Aggregate prediction stats: total votes + the most-predicted match.
function getOverallStats(callback) {
  const ref = db.ref('predictions');
  ref.off('value');
  ref.on('value', snap => {
    const data = snap.val() || {};
    let totalVotes = 0, topMatchId = null, topVotes = 0;
    Object.entries(data).forEach(([matchId, picks]) => {
      const sum = Object.values(picks).reduce((a, b) => a + (b || 0), 0);
      totalVotes += sum;
      if (sum > topVotes) { topVotes = sum; topMatchId = Number(matchId); }
    });
    callback({ totalVotes, topMatchId, topVotes });
  });
}

// Save prediction to Firebase — one vote per user per match.
// The user's per-uid record is the source of truth (localStorage can be cleared,
// but the anonymous Firebase uid persists), so a user can't inflate the counts by
// clicking repeatedly. Changing the pick moves the vote instead of adding one.
function savePrediction(matchId, pick) {
  localStorage.setItem('pred_' + matchId, pick);

  const applyVote = (uid) => {
    const userRef = db.ref('userPredictions/' + uid + '/' + matchId);
    userRef.once('value').then(snap => {
      const prev = snap.val();
      if (prev === pick) return;            // already voted this way → no recount
      userRef.set(pick);
      if (prev) {                           // switching pick → remove the old vote
        db.ref('predictions/' + matchId + '/' + prev)
          .transaction(count => Math.max((count || 0) - 1, 0));
      }
      db.ref('predictions/' + matchId + '/' + pick)
        .transaction(count => (count || 0) + 1);
    });
  };

  if (currentUser) {
    applyVote(currentUser.uid);
  } else {
    // Auth may not have resolved yet on a fast first click — sign in, then apply.
    auth.signInAnonymously()
      .then(result => { currentUser = result.user; applyVote(currentUser.uid); })
      .catch(err => console.log('Auth error:', err));
  }
}

// Get community prediction counts for a match
function getPredictionCounts(matchId, callback) {
  const ref = db.ref('predictions/' + matchId);
  ref.off('value');  // detach any previous listener so tab re-renders don't stack them
  ref.on('value', snapshot => {
    callback(snapshot.val() || {});
  });
}