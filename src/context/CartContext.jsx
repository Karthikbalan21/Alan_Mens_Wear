import { useCallback, useEffect, useMemo, useState } from 'react'
import { clearUserCart, removeCartItem, saveCartItem, subscribeCart } from '../services/cartService'
import { useAuth } from './useAuth'
import { CartContext } from './cartContext'

export function CartProvider({ children }) {
  const { currentUser } = useAuth()
  const [cartItems, setCartItems] = useState([])
  const [cartError, setCartError] = useState('')

  useEffect(() => {
    if (!currentUser) {
      const timeoutId = window.setTimeout(() => setCartItems([]), 0)
      return () => window.clearTimeout(timeoutId)
    }

    return subscribeCart(
      currentUser.uid,
      (items) => {
        setCartItems(items)
        setCartError('')
      },
      (error) => setCartError(error.message),
    )
  }, [currentUser])

  const persistCartItem = useCallback(
    async (item) => {
      if (currentUser) {
        await saveCartItem(currentUser.uid, item)
      }
    },
    [currentUser],
  )

  const addToCart = useCallback(async (product, quantity) => {
    const requestedQuantity = Number(quantity)
    const availableStock = Number(product.stock || 0)
    const existingItem = cartItems.find((item) => item.id === product.id)
    const currentQuantity = Number(existingItem?.quantity || 0)
    const nextQuantity = currentQuantity + requestedQuantity

    if (availableStock <= 0 || nextQuantity > availableStock) {
      return {
        ok: false,
        message: `Only ${availableStock} items available in stock`,
      }
    }

    const nextItem = {
      ...product,
      quantity: nextQuantity,
    }

    setCartItems((items) => {
      if (existingItem) {
        return items.map((item) => (item.id === product.id ? nextItem : item))
      }

      return [...items, nextItem]
    })

    await persistCartItem(nextItem)

    return {
      ok: true,
      message: 'Product added to cart.',
    }
  }, [cartItems, persistCartItem])

  const updateQuantity = useCallback(async (productId, change) => {
    const currentItem = cartItems.find((item) => item.id === productId)

    if (!currentItem) {
      return { ok: false, message: 'Product is no longer in your cart.' }
    }

    const nextQuantity = Number(currentItem.quantity) + Number(change)
    const availableStock = Number(currentItem.stock || 0)

    if (nextQuantity > availableStock) {
      return {
        ok: false,
        message: `Only ${availableStock} items available in stock`,
      }
    }

    const nextItem = {
      ...currentItem,
      quantity: Math.max(1, nextQuantity),
    }

    setCartItems((items) =>
      items.map((item) => (item.id === productId ? nextItem : item)),
    )

    await persistCartItem(nextItem)

    return { ok: true, message: '' }
  }, [cartItems, persistCartItem])

  const removeItem = useCallback(async (productId) => {
    setCartItems((items) => items.filter((item) => item.id !== productId))
    if (currentUser) {
      await removeCartItem(currentUser.uid, productId)
    }
  }, [currentUser])

  const clearCart = useCallback(async () => {
    const itemsToClear = cartItems
    setCartItems([])
    if (currentUser) {
      await clearUserCart(currentUser.uid, itemsToClear)
    }
  }, [cartItems, currentUser])

  const syncCartProducts = useCallback((products) => {
    const itemsToPersist = []
    const itemsToRemove = []

    setCartItems((items) =>
      items
        .map((item) => {
          const freshProduct = products.find((product) => product.id === item.id)

          if (!freshProduct) {
            itemsToRemove.push(item.id)
            return null
          }

          const nextItem = {
            ...item,
            ...freshProduct,
            quantity: Math.min(Number(freshProduct.stock), Number(item.quantity)),
          }

          itemsToPersist.push(nextItem)
          return nextItem
        })
        .filter((item) => item && Number(item.stock) > 0 && Number(item.quantity) > 0),
    )

    if (currentUser) {
      itemsToPersist.forEach((item) => saveCartItem(currentUser.uid, item))
      itemsToRemove.forEach((productId) => removeCartItem(currentUser.uid, productId))
    }
  }, [currentUser])

  const totalItems = cartItems.reduce(
    (total, item) => total + Number(item.quantity || 0),
    0,
  )

  const value = useMemo(
    () => ({
      cartItems,
      cartError,
      totalItems,
      addToCart,
      updateQuantity,
      removeItem,
      clearCart,
      syncCartProducts,
    }),
    [
      addToCart,
      cartItems,
      cartError,
      clearCart,
      removeItem,
      syncCartProducts,
      totalItems,
      updateQuantity,
    ],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
