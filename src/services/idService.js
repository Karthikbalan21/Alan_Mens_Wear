import { doc, increment, runTransaction, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

export async function getNextCode(counterName, prefix) {
  if (!db) {
    throw new Error('Firebase Firestore is not configured.')
  }

  const counterRef = doc(db, 'counters', counterName)

  return runTransaction(db, async (transaction) => {
    const counterSnap = await transaction.get(counterRef)
    const currentValue = counterSnap.exists() ? Number(counterSnap.data().value || 0) : 0
    const nextValue = currentValue + 1

    transaction.set(
      counterRef,
      {
        value: increment(1),
        prefix,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )

    return `${prefix}${nextValue}`
  })
}

export const getNextUserCode = () => getNextCode('users', 'AMWU')
export const getNextProductCode = () => getNextCode('products', 'AMWP')
