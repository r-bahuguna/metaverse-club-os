import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyDTN4Fxr0eIK1sjXtcQUSiDtc-g92Vjch0",
    authDomain: "metaverse-club-os.firebaseapp.com",
    projectId: "metaverse-club-os",
    storageBucket: "metaverse-club-os.firebasestorage.app",
    messagingSenderId: "1072419752297",
    appId: "1:1072419752297:web:8664575aeb72d8c71e15f8",
};

// Initialize Firebase (prevent duplicate init in dev hot-reload)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
