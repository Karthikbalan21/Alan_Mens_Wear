import { useCallback, useEffect, useMemo, useState } from 'react'
import { CartContext } from './cartContext'

const cartStorageKey = 'alanMensWearCart'

function loadStoredCart() {
  try {
    const storedCart = localStorage.getItem(cartStorageKey)
    return storedCart ? JSON.parse(storedCart) : []
  } catch {
    return []
  }
}

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(loadStoredCart)

  useEffect(() => {
    localStorage.setItem(cartStorageKey, JSON.stringify(cartItems))
  }, [cartItems])

  const addToCart = useCallback((product, quantity) => {
    setCartItems((items) => {
      const existingItem = items.find((item) => item.id === product.id)

      if (existingItem) {
        return items.map((item) => {
          if (item.id !== product.id) {
            return item
          }

          return {
            ...item,
            ...product,
            quantity: Math.min(
              Number(product.stock),
              Number(item.quantity) + Number(quantity),
            ),
          }
        })
      }

      return [
        ...items,
        {
          ...product,
          quantity: Math.min(Number(product.stock), Number(quantity)),
        },
      ]
    })
  }, [])

  const updateQuantity = useCallback((productId, change) => {
    setCartItems((items) =>
      items.map((item) => {
        if (item.id !== productId) {
          return item
        }

        return {
          ...item,
          quantity: Math.min(
            Number(item.stock),
            Math.max(1, Number(item.quantity) + change),
          ),
        }
      }),
    )
  }, [])

  const removeItem = useCallback((productId) => {
    setCartItems((items) => items.filter((item) => item.id !== productId))
  }, [])

  const clearCart = useCallback(() => {
    setCartItems([])
  }, [])

  const syncCartProducts = useCallback((products) => {
    setCartItems((items) =>
      items
        .map((item) => {
          const freshProduct = products.find((product) => product.id === item.id)

          if (!freshProduct) {
            return null
          }

          return {
            ...item,
            ...freshProduct,
            quantity: Math.min(Number(freshProduct.stock), Number(item.quantity)),
          }
        })
        .filter((item) => item && Number(item.stock) > 0 && Number(item.quantity) > 0),
    )
  }, [])

  const totalItems = cartItems.reduce(
    (total, item) => total + Number(item.quantity || 0),
    0,
  )

  const value = useMemo(
    () => ({
      cartItems,
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
      clearCart,
      removeItem,
      syncCartProducts,
      totalItems,
      updateQuantity,
    ],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
