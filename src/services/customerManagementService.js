import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'

const mapDoc = (snapshotDoc) => ({
  id: snapshotDoc.id,
  ...snapshotDoc.data(),
})

export function subscribeCustomerManagementData(onData, onError) {
  if (!db) {
    onError(new Error('Firebase Firestore is not configured.'))
    return () => {}
  }

  let users = []
  let orders = []
  let usersLoaded = false
  let ordersLoaded = false

  const emit = () => {
    if (usersLoaded && ordersLoaded) {
      onData({ users, orders })
    }
  }

  const unsubscribeUsers = onSnapshot(
    collection(db, 'users'),
    (snapshot) => {
      users = snapshot.docs.map(mapDoc)
      usersLoaded = true
      emit()
    },
    onError,
  )

  const unsubscribeOrders = onSnapshot(
    collection(db, 'orders'),
    (snapshot) => {
      orders = snapshot.docs.map(mapDoc)
      ordersLoaded = true
      emit()
    },
    onError,
  )

  return () => {
    unsubscribeUsers()
    unsubscribeOrders()
  }
}
