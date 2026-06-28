import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../firebase'

const mapOrderDoc = (orderDoc) => ({
  id: orderDoc.id,
  ...orderDoc.data(),
})

export async function getDeliveredOrders() {
  if (!db) {
    throw new Error('Firebase Firestore is not configured.')
  }

  const ordersRef = collection(db, 'orders')
  const deliveredQueries = [
    query(ordersRef, where('orderStatus', '==', 'Delivered')),
    query(ordersRef, where('status', '==', 'Delivered')),
  ]

  const snapshots = await Promise.all(deliveredQueries.map((deliveredQuery) => getDocs(deliveredQuery)))
  const deliveredOrders = new Map()

  snapshots.forEach((snapshot) => {
    snapshot.docs.forEach((orderDoc) => {
      deliveredOrders.set(orderDoc.id, mapOrderDoc(orderDoc))
    })
  })

  return Array.from(deliveredOrders.values())
}
