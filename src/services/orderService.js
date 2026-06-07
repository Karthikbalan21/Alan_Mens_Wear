import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import {
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from 'firebase/storage'
import { db, storage } from '../firebase'

export function uploadPaymentScreenshot(file, onProgress) {
  if (!storage) {
    throw new Error('Firebase Storage is not configured.')
  }

  const screenshotPath = `payment-screenshots/${Date.now()}-${file.name}`
  const screenshotRef = ref(storage, screenshotPath)
  const uploadTask = uploadBytesResumable(screenshotRef, file)

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
        )
        onProgress(progress)
      },
      reject,
      async () => {
        const screenshotUrl = await getDownloadURL(uploadTask.snapshot.ref)
        resolve({ screenshotPath, screenshotUrl })
      },
    )
  })
}

export const orderStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered']
export const paymentVerificationStatuses = ['pending', 'verified', 'rejected']

const mapOrderDoc = (orderDoc) => ({
  id: orderDoc.id,
  ...orderDoc.data(),
})

const sortOrdersByDate = (orders) =>
  orders.sort((first, second) => {
    const firstDate = first.createdAt?.toMillis?.() || 0
    const secondDate = second.createdAt?.toMillis?.() || 0
    return secondDate - firstDate
  })

export async function getAllOrders() {
  if (!db) {
    throw new Error('Firebase Firestore is not configured.')
  }

  const snapshot = await getDocs(
    query(collection(db, 'orders'), orderBy('createdAt', 'desc')),
  )

  return snapshot.docs.map(mapOrderDoc)
}

export function subscribeAllOrders(onOrders, onError) {
  if (!db) {
    onError(new Error('Firebase Firestore is not configured.'))
    return () => {}
  }

  return onSnapshot(
    query(collection(db, 'orders'), orderBy('createdAt', 'desc')),
    (snapshot) => onOrders(snapshot.docs.map(mapOrderDoc)),
    onError,
  )
}

export async function getUserOrders(userId) {
  if (!db) {
    throw new Error('Firebase Firestore is not configured.')
  }

  if (!userId) {
    return []
  }

  const snapshot = await getDocs(
    query(collection(db, 'orders'), where('userId', '==', userId)),
  )

  return sortOrdersByDate(snapshot.docs.map(mapOrderDoc))
}

export function subscribeUserOrders(userId, onOrders, onError) {
  if (!db) {
    onError(new Error('Firebase Firestore is not configured.'))
    return () => {}
  }

  if (!userId) {
    onOrders([])
    return () => {}
  }

  return onSnapshot(
    query(collection(db, 'orders'), where('userId', '==', userId)),
    (snapshot) => onOrders(sortOrdersByDate(snapshot.docs.map(mapOrderDoc))),
    onError,
  )
}

export async function updateOrderStatus(orderId, status) {
  if (!db) {
    throw new Error('Firebase Firestore is not configured.')
  }

  if (!orderStatuses.includes(status)) {
    throw new Error('Invalid order status.')
  }

  await updateDoc(doc(db, 'orders', orderId), {
    status,
    updatedAt: serverTimestamp(),
  })
}

export async function updatePaymentVerificationStatus(orderId, verificationStatus) {
  if (!db) {
    throw new Error('Firebase Firestore is not configured.')
  }

  if (!paymentVerificationStatuses.includes(verificationStatus)) {
    throw new Error('Invalid payment verification status.')
  }

  await updateDoc(doc(db, 'orders', orderId), {
    'payment.verificationStatus': verificationStatus,
    updatedAt: serverTimestamp(),
  })
}

export async function placeOrder(cartItems, paymentProof, user) {
  if (!db) {
    throw new Error('Firebase Firestore is not configured.')
  }

  if (!paymentProof?.screenshotUrl) {
    throw new Error('Payment screenshot is required before placing an order.')
  }

  const orderItems = cartItems.map((item) => ({
    productId: item.id,
    name: item.name,
    price: Number(item.price),
    quantity: Number(item.quantity),
  }))

  const totalAmount = orderItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  )

  return runTransaction(db, async (transaction) => {
    const productRefs = orderItems.map((item) => doc(db, 'products', item.productId))
    const productSnapshots = []

    for (const productRef of productRefs) {
      productSnapshots.push(await transaction.get(productRef))
    }

    productSnapshots.forEach((productSnap, index) => {
      const item = orderItems[index]

      if (!productSnap.exists()) {
        throw new Error(`${item.name} is no longer available.`)
      }

      const currentStock = Number(productSnap.data().stock || 0)

      if (currentStock <= 0) {
        throw new Error(`${item.name} is out of stock.`)
      }

      if (currentStock < item.quantity) {
        throw new Error(
          `Only ${currentStock} item(s) left for ${item.name}. Please update your cart.`,
        )
      }
    })

    productSnapshots.forEach((productSnap, index) => {
      const item = orderItems[index]
      const nextStock = Number(productSnap.data().stock || 0) - item.quantity

      transaction.update(productRefs[index], {
        stock: nextStock,
        updatedAt: serverTimestamp(),
      })
    })

    const orderRef = doc(collection(db, 'orders'))
    transaction.set(orderRef, {
      items: orderItems,
      userId: user?.uid || null,
      customerName: user?.displayName || user?.email || 'Guest Customer',
      customerEmail: user?.email || '',
      payment: {
        method: 'UPI',
        screenshotUrl: paymentProof.screenshotUrl,
        screenshotPath: paymentProof.screenshotPath,
        verificationStatus: 'pending',
      },
      totalAmount,
      status: 'Pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    return {
      id: orderRef.id,
      items: orderItems,
      userId: user?.uid || null,
      customerName: user?.displayName || user?.email || 'Guest Customer',
      customerEmail: user?.email || '',
      payment: {
        method: 'UPI',
        screenshotUrl: paymentProof.screenshotUrl,
        screenshotPath: paymentProof.screenshotPath,
        verificationStatus: 'pending',
      },
      totalAmount,
      status: 'Pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  })
}
