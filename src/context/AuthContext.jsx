import { useEffect, useMemo, useState } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
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

    let unsubscribeProfile = () => {}

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
      unsubscribeProfile()

      if (user && db) {
        unsubscribeProfile = onSnapshot(
          doc(db, 'users', user.uid),
          (profileSnap) => {
            setUserProfile(profileSnap.exists() ? profileSnap.data() : null)
            setLoading(false)
          },
          () => {
            setUserProfile(null)
            setLoading(false)
          },
        )
      } else {
        setUserProfile(null)
        setLoading(false)
      }
    })

    return () => {
      unsubscribeProfile()
      unsubscribe()
    }
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
