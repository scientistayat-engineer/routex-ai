import { firebaseEnabled, initFirebase, fb } from "./firebase.js";
import { $, toast } from "./ui.js";

export const session = { user: null };
const listeners = [];
export const onAuthChange = fn => listeners.push(fn);
const emit = () => listeners.forEach(fn => fn(session.user));

const modal = () => $("#authModal");
const setError = m => { $("#authError").textContent = m || ""; };
const friendly = e => (e.code || e.message || "Something went wrong").replace("auth/", "").replace(/-/g, " ");

function render() {
  const u = session.user;
  $("#authBtn").textContent = u ? (u.email || "Account").split("@")[0] : "Sign in";
  $("#authForms").hidden = !!u; $("#authUser").hidden = !u;
  $("#authEmail").textContent = u ? `Signed in as ${u.email}` : "";
  $("#authTitle").textContent = u ? "Your account" : "Welcome to ROUTEX";
  if (!firebaseEnabled) $("#authNote").textContent = "Demo mode: add your Firebase config in js/config.js to enable login and cloud history.";
}

export async function initAuth() {
  $("#authBtn").onclick = () => { modal().classList.add("open"); render(); };
  $("#authClose").onclick = () => modal().classList.remove("open");
  modal().onclick = e => { if (e.target === modal()) modal().classList.remove("open"); };
  render();
  if (!firebaseEnabled) return;
  await initFirebase();
  const { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } = fb.A;
  onAuthStateChanged(fb.auth, u => { session.user = u; render(); emit(); });

  const run = fn => async () => {
    setError("");
    try { await fn(); modal().classList.remove("open"); toast("Signed in ✓"); } catch (e) { setError(friendly(e)); }
  };
  const creds = () => [fb.auth, $("#email").value.trim(), $("#password").value];
  $("#googleBtn").onclick = run(() => signInWithPopup(fb.auth, new GoogleAuthProvider()));
  $("#signInBtn").onclick = run(() => signInWithEmailAndPassword(...creds()));
  $("#signUpBtn").onclick = run(() => createUserWithEmailAndPassword(...creds()));
  $("#signOutBtn").onclick = async () => { await signOut(fb.auth); modal().classList.remove("open"); toast("Signed out"); };
}
