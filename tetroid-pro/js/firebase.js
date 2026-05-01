/** @module firebase - Firebase config, leaderboard submission and fetching.
 *  This module uses CDN dynamic imports for Firebase SDK.
 *  Functions are exposed on `window` for use by the HTML onclick handlers.
 */

/** Firebase project configuration */
const FB_CONFIG = {
  apiKey:            "AIzaSyAGPCLdpjc2C3Xp-jZ2EibrZ9ZKIM-SMew",
  authDomain:        "tetroid-game.firebaseapp.com",
  projectId:         "tetroid-game",
  storageBucket:     "tetroid-game.firebasestorage.app",
  messagingSenderId: "787044407287",
  appId:             "1:787044407287:web:1d20ce08e701e5039980f2"
};

const FIREBASE_ENABLED = FB_CONFIG.apiKey && FB_CONFIG.apiKey !== "" && !FB_CONFIG.apiKey.startsWith("VOTRE");

// Offline fallbacks
window.submitScore = async function () {
  console.log('[Tetroid] Leaderboard offline');
};
window.fetchLeaderboard = async function () { return []; };
window.firebaseReady = false;

/**
 * @description Initialize Firebase and wire up submitScore / fetchLeaderboard on window
 */
export function initFirebase() {
  if (!FIREBASE_ENABLED) {
    console.log('[Tetroid] Firebase non configure — mode hors-ligne');
    return;
  }

  Promise.all([
    import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js')
  ]).then(([appMod, fsMod]) => {
    const app = appMod.initializeApp(FB_CONFIG);
    const db  = fsMod.getFirestore(app);
    const { collection, addDoc, getDocs, query, orderBy, limit, where, Timestamp } = fsMod;

    window.submitScore = async function (pseudo, score, weekly) {
      try {
        await addDoc(collection(db, 'scores'), {
          pseudo: pseudo.trim().substring(0, 20),
          score,
          weekly,
          ts: Timestamp.now()
        });
      } catch (e) { console.warn('Score non soumis:', e); }
    };

    window.fetchLeaderboard = async function (mode) {
      try {
        let q;
        if (mode === 'weekly') {
          const since = Timestamp.fromMillis(Date.now() - 7 * 24 * 3600 * 1000);
          q = query(
            collection(db, 'scores'),
            where('ts', '>', since),
            orderBy('ts', 'desc'),
            limit(500)
          );
        } else {
          q = query(collection(db, 'scores'), orderBy('score', 'desc'), limit(500));
        }
        const snap = await getDocs(q);
        const docs = snap.docs.map(d => d.data());
        return docs.sort((a, b) => b.score - a.score).slice(0, 100);
      } catch (e) { console.warn('Leaderboard error:', e); return []; }
    };

    window.firebaseReady = true;
    console.log('[Tetroid] Firebase connecte !');
  }).catch(e => {
    console.warn('[Tetroid] Firebase non disponible:', e.message);
  });
}
