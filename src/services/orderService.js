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
import { db } from '../firebase'
import { getSizePrice } from '../utils/productPricing'

const maxPaymentProofBytes = 650 * 1024
const maxPaymentProofDimension = 1200

function getDataUrlStorageSize(dataUrl) {
  return new Blob([dataUrl]).size
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    const objectUrl = URL.createObjectURL(file)

    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(image)
    }

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Could not read the payment screenshot. Try another image.'))
    }

    image.src = objectUrl
  })
}

function canvasToDataUrl(canvas, quality) {
  return canvas.toDataURL('image/jpeg', quality)
}

function getScaledSize(width, height, maxDimension) {
  const scale = Math.min(1, maxDimension / Math.max(width, height))

  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

async function compressPaymentScreenshot(file, onProgress) {
  onProgress?.(15)

  const image = await loadImage(file)
  onProgress?.(35)

  let maxDimension = maxPaymentProofDimension
  let quality = 0.82

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const { width, height } = getScaledSize(
      image.naturalWidth,
      image.naturalHeight,
      maxDimension,
    )
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')

    if (!context) {
      throw new Error('Your browser could not prepare the screenshot.')
    }

    canvas.width = width
    canvas.height = height
    context.drawImage(image, 0, 0, width, height)

    const screenshotUrl = canvasToDataUrl(canvas, quality)

    if (getDataUrlStorageSize(screenshotUrl) <= maxPaymentProofBytes) {
      onProgress?.(100)
      return screenshotUrl
    }

    quality = Math.max(0.5, quality - 0.08)
    maxDimension = Math.round(maxDimension * 0.82)
    onProgress?.(Math.min(95, 45 + attempt * 5))
  }

  throw new Error('Payment screenshot is too large. Crop it or choose a smaller image.')
}

export async function uploadPaymentScreenshot(file, onProgress) {
  const screenshotUrl = await compressPaymentScreenshot(file, onProgress)
  const safeFileName = file.name.replace(/[^a-z0-9._-]/gi, '-').toLowerCase()

  return {
    screenshotPath: `payment-screenshots/${Date.now()}-${safeFileName}`,
    screenshotUrl,
    screenshotStorage: 'firestore',
  }
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

  const updatePayload = {
    status,
    updatedAt: serverTimestamp(),
  }

  if (status === 'Delivered') {
    updatePayload['payment.verificationStatus'] = 'verified'
  }

  await updateDoc(doc(db, 'orders', orderId), updatePayload)
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

export async function placeOrder(cartItems, paymentProof, user, userProfile = {}) {
  if (!db) {
    throw new Error('Firebase Firestore is not configured.')
  }

  if (!paymentProof?.screenshotUrl) {
    throw new Error('Payment screenshot is required before placing an order.')
  }

  const orderItems = cartItems.map((item) => ({
    productId: item.productId || item.id,
    productCode: item.productCode || item.productId || item.id,
    name: item.name,
    image: item.image || '',
    category: item.category || '',
    selectedSize: item.selectedSize || '',
    price: Number(item.price),
    quantity: Number(item.quantity),
  }))

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

      const productData = productSnap.data()
      const currentStock = getOrderItemStock(productData, item.selectedSize)
      item.price = getSizePrice(productData, item.selectedSize)

      if (currentStock <= 0) {
        throw new Error(`${item.name}${item.selectedSize ? ` (${item.selectedSize})` : ''} is out of stock.`)
      }

      if (currentStock < item.quantity) {
        throw new Error(
          `Only ${currentStock} item(s) left for ${item.name}${item.selectedSize ? ` (${item.selectedSize})` : ''}. Please update your cart.`,
        )
      }
    })

    const totalAmount = orderItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    )

    productSnapshots.forEach((productSnap, index) => {
      const item = orderItems[index]
      const productData = productSnap.data()
      const sizeInventory = productData.sizeInventory && typeof productData.sizeInventory === 'object'
        ? { ...productData.sizeInventory }
        : null
      const currentStock = getOrderItemStock(productData, item.selectedSize)
      const nextStock = currentStock - item.quantity
      const updatePayload = {
        stock: Number(productData.stock || 0) - item.quantity,
        updatedAt: serverTimestamp(),
      }

      if (item.selectedSize && sizeInventory) {
        sizeInventory[item.selectedSize] = nextStock
        updatePayload.sizeInventory = sizeInventory
        updatePayload.sizes = Object.entries(sizeInventory)
          .filter(([, amount]) => Number(amount || 0) > 0)
          .map(([size]) => size)
        updatePayload.stock = Object.values(sizeInventory).reduce(
          (total, amount) => total + Number(amount || 0),
          0,
        )
      }

      transaction.update(productRefs[index], updatePayload)
    })

    const orderRef = doc(collection(db, 'orders'))
    transaction.set(orderRef, {
      items: orderItems,
      userId: user?.uid || null,
      userCode: userProfile?.userCode || user?.userCode || null,
      customerName: userProfile?.name || user?.displayName || user?.email || 'Guest Customer',
      customerEmail: user?.email || '',
      payment: {
        method: 'UPI',
        screenshotUrl: paymentProof.screenshotUrl,
        screenshotPath: paymentProof.screenshotPath,
        screenshotStorage: paymentProof.screenshotStorage || 'storage',
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
      userCode: userProfile?.userCode || user?.userCode || null,
      customerName: userProfile?.name || user?.displayName || user?.email || 'Guest Customer',
      customerEmail: user?.email || '',
      payment: {
        method: 'UPI',
        screenshotUrl: paymentProof.screenshotUrl,
        screenshotPath: paymentProof.screenshotPath,
        screenshotStorage: paymentProof.screenshotStorage || 'storage',
        verificationStatus: 'pending',
      },
      totalAmount,
      status: 'Pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  })
}

function getOrderItemStock(productData, selectedSize = '') {
  if (selectedSize && productData.sizeInventory && typeof productData.sizeInventory === 'object') {
    return Number(productData.sizeInventory[selectedSize] || 0)
  }

  return Number(productData.stock || 0)
}
