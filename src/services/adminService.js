import { collection, deleteDoc, doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'

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

  return onSnapshot(
    collection(db, 'reviews'),
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
