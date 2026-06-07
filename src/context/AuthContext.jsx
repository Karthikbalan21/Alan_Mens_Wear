import { useEffect, useMemo, useState } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { AuthContext } from './authContext'

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(Boolean(auth))

  useEffect(() => {
    if (!auth) {
      return undefined
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user)

      if (user && db) {
        const profileSnap = await getDoc(doc(db, 'users', user.uid))
        setUserProfile(profileSnap.exists() ? profileSnap.data() : null)
      } else {
        setUserProfile(null)
      }

      setLoading(false)
    })

    return unsubscribe
  }, [])

  const logout = async () => {
    if (!auth) {
      throw new Error('Firebase Authentication is not configured.')
    }

    await signOut(auth)
  }

  const value = useMemo(
    () => ({
      currentUser,
      userProfile,
      loading,
      logout,
    }),
    [currentUser, userProfile, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
