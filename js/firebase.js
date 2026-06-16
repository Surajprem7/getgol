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
}).catch(err => console.log('Auth error:', err));

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