import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../firebase'

const productsCollection = 'products'

const ensureFirebaseReady = () => {
  if (!db) {
    throw new Error('Firebase Firestore must be configured first.')
  }
}

const buildProductPayload = (product) => ({
  name: product.name.trim(),
  category: product.category.trim(),
  price: Number(product.price),
  stock: Number(product.stock),
  rating: Number(product.rating || 0),
  sizes: product.sizes
    .split(',')
    .map((size) => size.trim())
    .filter(Boolean),
  description: product.description.trim(),
})

const loadImage = (sourceUrl) =>
  new Promise((resolve, reject) => {
    const image = new Image()

    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Unable to read product image.'))
    image.src = sourceUrl
  })

const buildProductImage = async (imageFile) => {
  if (!imageFile.type.startsWith('image/')) {
    throw new Error('Upload a valid product image.')
  }

  const sourceUrl = URL.createObjectURL(imageFile)

  try {
    const image = await loadImage(sourceUrl)
    const maxSize = 900
    const scale = Math.min(1, maxSize / Math.max(image.width, image.height))
    const canvas = document.createElement('canvas')

    canvas.width = Math.round(image.width * scale)
    canvas.height = Math.round(image.height * scale)

    const context = canvas.getContext('2d')
    context.drawImage(image, 0, 0, canvas.width, canvas.height)

    const imageUrl = canvas.toDataURL('image/jpeg', 0.72)

    if (imageUrl.length > 900000) {
      throw new Error('Product image is too large. Choose a smaller image.')
    }

    return { imagePath: null, imageUrl }
  } finally {
    URL.revokeObjectURL(sourceUrl)
  }
}

export async function getProducts() {
  if (!db) {
    throw new Error('Firebase Firestore is not configured.')
  }

  const productsRef = collection(db, productsCollection)
  const snapshot = await getDocs(query(productsRef, orderBy('createdAt', 'desc')))

  return snapshot.docs.map((productDoc) => ({
    id: productDoc.id,
    ...productDoc.data(),
  }))
}

export async function getProduct(productId) {
  if (!db) {
    throw new Error('Firebase Firestore is not configured.')
  }

  const productSnap = await getDoc(doc(db, productsCollection, productId))

  if (!productSnap.exists()) {
    return null
  }

  return {
    id: productSnap.id,
    ...productSnap.data(),
  }
}

export async function addProduct(product, imageFile) {
  ensureFirebaseReady()

  if (!imageFile) {
    throw new Error('Product image is required.')
  }

  const image = await buildProductImage(imageFile)
  const productPayload = buildProductPayload(product)

  await addDoc(collection(db, productsCollection), {
    ...productPayload,
    image: image.imageUrl,
    imagePath: image.imagePath,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function updateProduct(productId, product, imageFile) {
  ensureFirebaseReady()

  const productPayload = buildProductPayload(product)
  const updates = {
    ...productPayload,
    updatedAt: serverTimestamp(),
  }

  if (imageFile) {
    const image = await buildProductImage(imageFile)
    updates.image = image.imageUrl
    updates.imagePath = image.imagePath
  }

  await updateDoc(doc(db, productsCollection, productId), updates)
}

export async function deleteProduct(productId) {
  ensureFirebaseReady()

  await deleteDoc(doc(db, productsCollection, productId))
}
