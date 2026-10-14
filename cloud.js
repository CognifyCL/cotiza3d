import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import {
  getAuth, onAuthStateChanged, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, signOut, sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import {
  getFirestore, doc, collection, getDoc, getDocs, setDoc, deleteDoc
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

// Firebase web configuration is public. Access is protected by Authentication and Firestore rules.
const app = initializeApp({
  apiKey: "AIzaSyDssl3BgcGb-UyB6BVz9Y4BfITRohtfu7k",
  authDomain: "cotiza3d-cognifycl.firebaseapp.com",
  projectId: "cotiza3d-cognifycl",
  appId: "1:1096832303243:web:35e86b1633f7aeda4a548e"
});
const auth = getAuth(app), db = getFirestore(app), bridge = window.cotiza3dBridge;
const PENDING_PREFIX = "cotiza3d-pending-v1-";
let activeUid = null, authVersion = 0, flushing = false;

function pending(uid) {
  try {
    const saved = JSON.parse(localStorage.getItem(PENDING_PREFIX + uid));
    if (saved && typeof saved === "object") return {
      profile: saved.profile || null, upserts: saved.upserts || {}, deletes: saved.deletes || {}
    };
  } catch {}
  return {profile:null,upserts:{},deletes:{}};
}
function storePending(uid, value) {
  try { localStorage.setItem(PENDING_PREFIX + uid, JSON.stringify(value)); }
  catch { bridge.setStatus("No se pudo guardar la cola de sincronización en este navegador."); }
}
function profileRef(uid) { return doc(db,"users",uid); }
function quoteRef(uid,id) { return doc(db,"users",uid,"quotes",id); }

async function flush(uid) {
  if (flushing || uid !== activeUid || !auth.currentUser) return;
  flushing = true;
  try {
    while (uid === activeUid && auth.currentUser) {
      const work = pending(uid);
      if (work.profile) {
        const snapshot = JSON.stringify(work.profile);
        await setDoc(profileRef(uid),work.profile);
        const latest = pending(uid);
        if (JSON.stringify(latest.profile) === snapshot) latest.profile = null;
        storePending(uid,latest);
        continue;
      }
      const upsert = Object.entries(work.upserts)[0];
      if (upsert) {
        const [id,record] = upsert;
        await setDoc(quoteRef(uid,id),record);
        const latest = pending(uid);
        if (JSON.stringify(latest.upserts[id]) === JSON.stringify(record)) delete latest.upserts[id];
        storePending(uid,latest);
        continue;
      }
      const deletedId = Object.keys(work.deletes)[0];
      if (deletedId) {
        await deleteDoc(quoteRef(uid,deletedId));
        const latest = pending(uid);
        if (latest.deletes[deletedId]) delete latest.deletes[deletedId];
        storePending(uid,latest);
        continue;
      }
      bridge.setStatus("Datos sincronizados con tu cuenta.");
      break;
    }
  } catch {
    bridge.setStatus("Sin conexión con la nube. Los cambios siguen guardados aquí y se enviarán al reconectar.");
  } finally {
    flushing = false;
    if (activeUid && activeUid !== uid) void flush(activeUid);
  }
}

function queueProfile(profile) {
  if (!activeUid) return;
  const work = pending(activeUid);work.profile = profile;storePending(activeUid,work);
  void flush(activeUid);
}
function queueQuote(record) {
  if (!activeUid) return;
  const work = pending(activeUid);work.upserts[record.id] = record;
  delete work.deletes[record.id];storePending(activeUid,work);void flush(activeUid);
}
function queueDelete(id) {
  if (!activeUid) return;
  const work = pending(activeUid);delete work.upserts[id];work.deletes[id] = true;
  storePending(activeUid,work);void flush(activeUid);
}

bridge.setHooks({
  register:(email,password)=>createUserWithEmailAndPassword(auth,email,password),
  login:(email,password)=>signInWithEmailAndPassword(auth,email,password),
  logout:()=>signOut(auth),
  resetPassword:email=>sendPasswordResetEmail(auth,email),
  saveProfile:queueProfile,saveQuote:queueQuote,deleteQuote:queueDelete
});

onAuthStateChanged(auth,async user=>{
  const version = ++authVersion;
  if (!user) {
    const hadAccount = !!activeUid;activeUid = null;
    if (hadAccount) bridge.exitAccount();
    else bridge.setStatus("Usando solo este navegador. Inicia sesión para sincronizar.");
    return;
  }
  const uid = user.uid;activeUid = uid;
  bridge.setStatus("Cargando tus datos…");
  try {
    const [profile,quotes] = await Promise.all([
      getDoc(profileRef(uid)),getDocs(collection(db,"users",uid,"quotes"))
    ]);
    if (version !== authVersion) return;
    let snapshot;
    if (profile.exists()) {
      const p = profile.data();
      snapshot = {name:p.name,filaments:p.filaments,tariffs:p.tariffs,
        quotes:quotes.docs.map(item=>item.data())};
    } else {
      // A new account imports the local guest work once. Existing accounts use cloud data.
      snapshot = bridge.guestSnapshot();
      queueProfile({name:snapshot.name,filaments:snapshot.filaments,tariffs:snapshot.tariffs});
      snapshot.quotes.forEach(queueQuote);
    }
    const work = pending(uid);
    if (work.profile) Object.assign(snapshot,work.profile);
    const records = new Map(snapshot.quotes.map(q=>[q.id,q]));
    Object.values(work.upserts).forEach(q=>records.set(q.id,q));
    Object.keys(work.deletes).forEach(id=>records.delete(id));
    snapshot.quotes=[...records.values()].sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)));
    bridge.enterAccount(uid,user.email||"",snapshot,"Datos sincronizados con tu cuenta.");
    void flush(uid);
  } catch {
    if (version !== authVersion) return;
    bridge.enterAccount(uid,user.email||"",bridge.cachedSnapshot(uid),
      "Sin conexión con la nube. Puedes seguir trabajando; sincronizaremos al reconectar.");
  }
},error=>bridge.setStatus("No se pudo iniciar la sesión: "+(error.message||"error de conexión")));

window.addEventListener("online",()=>{if(activeUid)void flush(activeUid);});
