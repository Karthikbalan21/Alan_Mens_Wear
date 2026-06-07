import { initializeApp } from 'firebase/app'
import { getAnalytics, isSupported } from 'firebase/analytics'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

const requiredConfigKeys = [
  'apiKey',
  'authDomain',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId',
]

const hasValidFirebaseConfig = requiredConfigKeys.every((key) => {
  const value = firebaseConfig[key]
  return value && !value.startsWith('your_')
})

const app = hasValidFirebaseConfig ? initializeApp(firebaseConfig) : null
export const analyticsPromise = app
  ? isSupported().then((supported) => (supported ? getAnalytics(app) : null))
  : Promise.resolve(null)

if (!hasValidFirebaseConfig) {
  console.warn(
    'Firebase is not configured. Create a .env file with your Firebase web app config values.',
  )
}

export const auth = app ? getAuth(app) : null
export const db = app ? getFirestore(app) : null
export const storage = app ? getStorage(app) : null
export default app
