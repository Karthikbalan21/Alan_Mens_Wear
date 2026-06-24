const preferredSizeOrder = ['S', 'M', 'L', 'XL', 'XXL']

export function getSizePrice(product, selectedSize = '') {
  if (selectedSize && product?.sizePrices && typeof product.sizePrices === 'object') {
    const selectedPrice = Number(product.sizePrices[selectedSize] || 0)

    if (selectedPrice > 0) {
      return selectedPrice
    }
  }

  return Number(product?.price || 0)
}

export function getOrderedSizePrices(product) {
  if (!product?.sizePrices || typeof product.sizePrices !== 'object') {
    return []
  }

  const sizes = preferredSizeOrder
    .filter((size) => Number(product.sizePrices[size] || 0) > 0)
    .concat(
      Object.keys(product.sizePrices)
        .filter((size) => !preferredSizeOrder.includes(size) && Number(product.sizePrices[size] || 0) > 0),
    )

  return sizes.map((size) => [size, Number(product.sizePrices[size])])
}

export function getPriceRange(product) {
  const prices = getOrderedSizePrices(product).map(([, price]) => price)

  if (!prices.length) {
    const price = Number(product?.price || 0)
    return { min: price, max: price, hasRange: false }
  }

  const min = Math.min(...prices)
  const max = Math.max(...prices)

  return {
    min,
    max,
    hasRange: min !== max,
  }
}

export function formatPrice(product) {
  const { min, max, hasRange } = getPriceRange(product)

  if (hasRange) {
    return `Rs. ${min.toLocaleString('en-IN')} - Rs. ${max.toLocaleString('en-IN')}`
  }

  return `Rs. ${min.toLocaleString('en-IN')}`
}
