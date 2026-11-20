import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';

// Public Web Firebase Configuration (Shares Project with Android)
const firebaseConfig = {
  apiKey: "AIzaSyBr4YdTL9rsUFtlzGLdDNtr5WcgabCz8HI",
  authDomain: "gen-lang-client-0372725226.firebaseapp.com",
  projectId: "gen-lang-client-0372725226",
  storageBucket: "gen-lang-client-0372725226.firebasestorage.app",
  messagingSenderId: "1040323956723",
  appId: "1:1040323956723:android:20d9c6c16ba833f165cc86"
};

// Named Firestore Database ID matching Android applet configuration
const FIRESTORE_DATABASE_ID = "ai-studio-android-idea2imp-27a0e16e-68ee-4e10-8402-a68b66d41031";

// Safe initialization
let app = null;
let auth = null;
let db = null;

try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app, FIRESTORE_DATABASE_ID);
} catch (err) {
  console.warn('Firebase initialization notice:', err.message);
}

export { app, auth, db };

// Google Sign-In with Firebase Auth
export async function signInWithGoogle() {
  if (!auth) throw new Error('Firebase Auth is not initialized');
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(auth, provider);
  const idToken = await result.user.getIdToken();
  return {
    user: result.user,
    idToken,
    email: result.user.email,
    displayName: result.user.displayName,
    photoURL: result.user.photoURL,
    uid: result.user.uid
  };
}

export async function signOutFirebase() {
  if (auth && auth.currentUser) {
    await fbSignOut(auth).catch(() => {});
  }
}

// User Presence Heartbeat
export async function setOnlinePresence(userId, isOnline = true) {
  if (!db || !userId) return;
  try {
    const presenceRef = doc(db, 'presence', userId);
    await setDoc(presenceRef, {
      userId,
      isOnline,
      lastSeen: serverTimestamp()
    }, { merge: true });
  } catch (err) {
    // Graceful fallback
  }
}

// Real-Time Messaging: Subscribe to User Conversations
export function subscribeUserConversations(userId, onUpdate) {
  if (!db || !userId) return () => {};
  try {
    const q = query(
      collection(db, 'conversations'),
      where('participantUids', 'array-contains', userId)
    );
    return onSnapshot(q, (snapshot) => {
      const convos = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      onUpdate(convos);
    }, (err) => {
      console.warn('Conversations listener fallback:', err.message);
    });
  } catch {
    return () => {};
  }
}

// Real-Time Messaging: Subscribe to Conversation Messages
export function subscribeMessages(conversationId, onUpdate) {
  if (!db || !conversationId) return () => {};
  try {
    const q = query(
      collection(db, 'conversations', conversationId, 'messages'),
      orderBy('createdAt', 'asc')
    );
    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      onUpdate(messages);
    }, (err) => {
      console.warn('Messages listener fallback:', err.message);
    });
  } catch {
    return () => {};
  }
}

// Send Message into Conversation
export async function sendChatMessage(conversationId, { senderId, senderName, text, type = 'TEXT' }) {
  if (!db || !conversationId) return null;
  const msgData = {
    conversationId,
    senderId,
    senderName,
    text,
    type,
    createdAt: serverTimestamp()
  };
  const docRef = await addDoc(collection(db, 'conversations', conversationId, 'messages'), msgData);
  // Update last message preview on parent conversation
  await updateDoc(doc(db, 'conversations', conversationId), {
    lastMessage: text,
    lastSenderId: senderId,
    updatedAt: serverTimestamp()
  }).catch(() => {});
  return docRef.id;
}

// Real-Time Collaboration Tasks: Subscribe to Project Tasks
export function subscribeProjectTasks(projectId, onUpdate) {
  if (!db || !projectId) return () => {};
  try {
    const q = query(
      collection(db, 'collaboration_projects', projectId, 'tasks'),
      orderBy('createdAt', 'asc')
    );
    return onSnapshot(q, (snapshot) => {
      const tasks = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      onUpdate(tasks);
    }, (err) => {
      console.warn('Tasks listener fallback:', err.message);
    });
  } catch {
    return () => {};
  }
}

// Create or Move a Collaboration Task
export async function saveProjectTask(projectId, taskData) {
  if (!db || !projectId) return null;
  if (taskData.id) {
    const taskRef = doc(db, 'collaboration_projects', projectId, 'tasks', taskData.id);
    await updateDoc(taskRef, {
      ...taskData,
      updatedAt: serverTimestamp()
    });
    return taskData.id;
  } else {
    const colRef = collection(db, 'collaboration_projects', projectId, 'tasks');
    const docRef = await addDoc(colRef, {
      ...taskData,
      status: taskData.status || 'TODO',
      priority: taskData.priority || 'MEDIUM',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  }
}

// Real-Time Notifications: Subscribe to In-App Alerts
export function subscribeNotifications(userId, onUpdate) {
  if (!db || !userId) return () => {};
  try {
    const q = query(
      collection(db, 'app_notifications'),
      where('recipientId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      onUpdate(notifs);
    }, (err) => {
      console.warn('Notifications listener fallback:', err.message);
    });
  } catch {
    return () => {};
  }
}
