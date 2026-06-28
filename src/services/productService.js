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
import { deleteObject, ref } from 'firebase/storage'
import { db, storage } from '../firebase'
import { getNextProductCode } from './idService'

const productsCollection = 'products'
const defaultSizeOrder = ['S', 'M', 'L', 'XL', 'XXL']

const ensureFirebaseReady = () => {
  if (!db) {
    throw new Error('Firebase Firestore must be configured first.')
  }
}

const buildSizeInventory = (product) => {
  if (product.sizeInventory && typeof product.sizeInventory === 'object') {
    return Object.entries(product.sizeInventory).reduce((inventory, [size, amount]) => {
      const normalizedSize = size.trim().toUpperCase()
      const quantity = Number(amount || 0)

      if (normalizedSize && quantity > 0) {
        inventory[normalizedSize] = quantity
      }

      return inventory
    }, {})
  }

  return String(product.sizes || '')
    .split(',')
    .map((size) => size.trim().toUpperCase())
    .filter(Boolean)
    .reduce((inventory, size) => {
      inventory[size] = Number(product.stock || 0)
      return inventory
    }, {})
}

const buildSizePrices = (product, sizeInventory) => {
  const defaultPrice = Number(product.price || 0)

  if (product.sizePrices && typeof product.sizePrices === 'object') {
    return Object.keys(sizeInventory).reduce((prices, size) => {
      const enteredPrice = Number(product.sizePrices[size] || 0)
      const price = enteredPrice > 0 ? enteredPrice : defaultPrice

      if (price > 0) {
        prices[size] = price
      }

      return prices
    }, {})
  }

  return Object.keys(sizeInventory).reduce((prices, size) => {
    if (defaultPrice > 0) {
      prices[size] = defaultPrice
    }

    return prices
  }, {})
}

const buildProductPayload = (product) => {
  const sizeInventory = buildSizeInventory(product)
  const sizePrices = buildSizePrices(product, sizeInventory)
  const sizes = defaultSizeOrder
    .filter((size) => sizeInventory[size] > 0)
    .concat(Object.keys(sizeInventory).filter((size) => !defaultSizeOrder.includes(size)))
  const stock = Object.values(sizeInventory).reduce(
    (total, quantity) => total + Number(quantity || 0),
    0,
  )
  const activePrices = Object.values(sizePrices).filter((price) => Number(price || 0) > 0)
  const productPrice = activePrices.length
    ? Math.min(...activePrices)
    : Number(product.price || 0)

  return {
    name: product.name.trim(),
    category: product.category.trim(),
    price: productPrice,
    stock,
    rating: Number(product.rating || 0),
    sizes,
    sizeInventory,
    sizePrices,
    description: product.description.trim(),
  }
}

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
  const productCode = await getNextProductCode()

  await addDoc(collection(db, productsCollection), {
    ...productPayload,
    productCode,
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

export async function deleteProduct(product) {
  ensureFirebaseReady()

  const productId = typeof product === 'string' ? product : product.id
  const imagePath = typeof product === 'string' ? null : product.imagePath

  await deleteDoc(doc(db, productsCollection, productId))

  if (storage && imagePath) {
    try {
      await deleteObject(ref(storage, imagePath))
    } catch (error) {
      if (error.code !== 'storage/object-not-found') {
        throw error
      }
    }
  }
}
