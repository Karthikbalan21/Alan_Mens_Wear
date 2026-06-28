import { collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from '../firebase'

const mapDoc = (snapshotDoc) => ({
  id: snapshotDoc.id,
  ...snapshotDoc.data(),
})

export function subscribeAdminUsers(onUsers, onError) {
  if (!db) {
    onError(new Error('Firebase Firestore is not configured.'))
    return () => {}
  }

  return onSnapshot(
    collection(db, 'users'),
    (snapshot) => onUsers(snapshot.docs.map(mapDoc)),
    onError,
  )
}

export function subscribeAdminReviews(onReviews, onError) {
  if (!db) {
    onError(new Error('Firebase Firestore is not configured.'))
    return () => {}
  }

  const reviewQuery = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'))

  return onSnapshot(
    reviewQuery,
    (snapshot) => onReviews(snapshot.docs.map(mapDoc)),
    onError,
  )
}

export async function deleteReview(reviewId) {
  if (!db) {
    throw new Error('Firebase Firestore is not configured.')
  }

  await deleteDoc(doc(db, 'reviews', reviewId))
}

export async function deleteCustomerAccount(userId) {
  if (!functions) {
    throw new Error('Firebase Functions is not configured.')
  }

  const deleteAccount = httpsCallable(functions, 'deleteCustomerAccount')
  await deleteAccount({ userId })
}

export async function updateCustomerAccountStatus(userId, enabled) {
  if (!db) {
    throw new Error('Firebase Firestore is not configured.')
  }

  await updateDoc(doc(db, 'users', userId), {
    accountStatus: enabled ? 'active' : 'disabled',
    disabled: !enabled,
    updatedAt: serverTimestamp(),
  })
}
