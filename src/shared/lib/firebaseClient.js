import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

export const firebaseConfig = {
    apiKey: "AIzaSyBYLv2Vc7iwdjq-Rx163nqg-4hMx5lxa7w",
    authDomain: "mcops-672d6.firebaseapp.com",
    projectId: "mcops-672d6",
    storageBucket: "mcops-672d6.firebasestorage.app",
    messagingSenderId: "180814574928",
    appId: "1:180814574928:web:be9a603913266add67e855"
}

// Initialize Firebase
export const firebaseApp = initializeApp(firebaseConfig)

// Initialize Firebase Auth
export const auth = getAuth(firebaseApp)

// Initialize Firestore
export const db = getFirestore(firebaseApp)
