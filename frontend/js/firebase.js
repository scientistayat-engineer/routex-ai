// Firebase bootstrap. If no apiKey is set, the app runs in demo mode (localStorage only).
import { CONFIG } from "./config.js";

const V = "10.14.1";
export const firebaseEnabled = !!CONFIG.FIREBASE.apiKey;
export let fb = null;

export async function initFirebase() {
  if (!firebaseEnabled || fb) return fb;
  const base = `https://www.gstatic.com/firebasejs/${V}`;
  const [{ initializeApp }, auth, store] = await Promise.all([
    import(`${base}/firebase-app.js`),
    import(`${base}/firebase-auth.js`),
    import(`${base}/firebase-firestore.js`)
  ]);
  const app = initializeApp(CONFIG.FIREBASE);
  fb = { app, auth: auth.getAuth(app), db: store.getFirestore(app), A: auth, S: store };
  return fb;
}
