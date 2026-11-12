// History storage: Firestore when signed in, localStorage otherwise. Same API either way.
import { firebaseEnabled, fb } from "./firebase.js";
import { session } from "./auth.js";

const KEY = "routex.history.v1";
const local = {
  read: () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } },
  write: v => localStorage.setItem(KEY, JSON.stringify(v.slice(-200)))
};
const cloud = () => firebaseEnabled && fb && session.user;
const col = () => fb.S.collection(fb.db, "users", session.user.uid, "queries");

export async function loadHistory() {
  if (!cloud()) return local.read();
  const q = fb.S.query(col(), fb.S.orderBy("ts", "asc"), fb.S.limitToLast(200));
  const snap = await fb.S.getDocs(q);
  return snap.docs.map(d => d.data());
}

export async function saveRecord(rec) {
  if (!cloud()) { const all = local.read(), i = all.findIndex(r => r.id === rec.id); i >= 0 ? (all[i] = rec) : all.push(rec); local.write(all); return; }
  await fb.S.setDoc(fb.S.doc(col(), rec.id), rec);
}

export async function clearHistory() {
  if (!cloud()) return localStorage.removeItem(KEY);
  const snap = await fb.S.getDocs(col());
  await Promise.all(snap.docs.map(d => fb.S.deleteDoc(d.ref)));
}
