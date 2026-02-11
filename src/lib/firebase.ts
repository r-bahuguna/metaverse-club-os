import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyDOUo6sh6R1Qyi0e8EK6Am9hIxjzmF-dQA",
    authDomain: "risky-desires.firebaseapp.com",
    projectId: "risky-desires",
    storageBucket: "risky-desires.firebasestorage.app",
    messagingSenderId: "137944336308",
    appId: "1:137944336308:web:5570c9ed4287e8df2d14e1",
    measurementId: "G-2ZM1MEEWKE",
};

// Initialize Firebase (prevent duplicate init in dev hot-reload)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export default app;
