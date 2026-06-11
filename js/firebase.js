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

// Save prediction to Firebase
function savePrediction(matchId, pick) {
  localStorage.setItem('pred_' + matchId, pick);
  
  // Save user's personal prediction
  if (currentUser) {
    db.ref('userPredictions/' + currentUser.uid + '/' + matchId).set(pick);
  }
  
  // Save to community count
  db.ref('predictions/' + matchId + '/' + pick).transaction(count => (count || 0) + 1);
}

// Get community prediction counts for a match
function getPredictionCounts(matchId, callback) {
  db.ref('predictions/' + matchId).on('value', snapshot => {
    callback(snapshot.val() || {});
  });
}