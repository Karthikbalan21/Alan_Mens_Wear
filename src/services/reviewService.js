import {
  addDoc,
  collection,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore'
import { db } from '../firebase'

const mapReviewDoc = (reviewDoc) => ({
  id: reviewDoc.id,
  ...reviewDoc.data(),
})

export function subscribeProductReviews(productId, onReviews, onError) {
  if (!db || !productId) {
    onReviews([])
    return () => {}
  }

  return onSnapshot(
    query(
      collection(db, 'reviews'),
      where('productId', '==', productId),
    ),
    (snapshot) => onReviews(snapshot.docs.map(mapReviewDoc)),
    onError,
  )
}

export async function getUserReviews(userId) {
  if (!db || !userId) {
    return []
  }

  const snapshot = await getDocs(
    query(collection(db, 'reviews'), where('userId', '==', userId)),
  )

  return snapshot.docs.map(mapReviewDoc)
}

export async function addProductReview({ user, orderId, product, rating, review }) {
  if (!db || !user) {
    throw new Error('Login before rating a product.')
  }

  const normalizedRating = Number(rating)

  if (normalizedRating < 1 || normalizedRating > 5) {
    throw new Error('Choose a rating from 1 to 5 stars.')
  }

  if (!review.trim()) {
    throw new Error('Write a short review before submitting.')
  }

  await addDoc(collection(db, 'reviews'), {
    userId: user.uid,
    userName: user.displayName || user.email || 'Customer',
    orderId,
    productId: product.productId,
    productName: product.name,
    rating: normalizedRating,
    review: review.trim(),
    createdAt: serverTimestamp(),
  })
}
