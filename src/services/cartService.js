import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../firebase'

const cartItemsRef = (userId) => collection(db, 'carts', userId, 'items')
const cartItemRef = (userId, productId) => doc(db, 'carts', userId, 'items', productId)

export function subscribeCart(userId, onItems, onError) {
  if (!db || !userId) {
    onItems([])
    return () => {}
  }

  return onSnapshot(
    cartItemsRef(userId),
    (snapshot) => {
      onItems(snapshot.docs.map((itemDoc) => ({ id: itemDoc.id, ...itemDoc.data() })))
    },
    onError,
  )
}

export async function saveCartItem(userId, item) {
  if (!db || !userId) {
    return
  }

  await setDoc(
    cartItemRef(userId, item.id),
    {
      ...item,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}

export async function removeCartItem(userId, productId) {
  if (!db || !userId) {
    return
  }

  await deleteDoc(cartItemRef(userId, productId))
}

export async function clearUserCart(userId, items) {
  if (!db || !userId || items.length === 0) {
    return
  }

  const batch = writeBatch(db)
  items.forEach((item) => batch.delete(cartItemRef(userId, item.id)))
  await batch.commit()
}
