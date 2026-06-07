import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useCart } from '../context/useCart'
import { getProduct } from '../services/productService'

const fallbackReviews = [
  {
    name: 'Rohan Shah',
    rating: 5,
    comment: 'Excellent fit and premium fabric. It looks sharp without feeling stiff.',
  },
  {
    name: 'Arjun Mehta',
    rating: 4,
    comment: 'Good quality and quick delivery. The sizing was accurate for me.',
  },
  {
    name: 'Kabir Singh',
    rating: 5,
    comment: 'Easy to style for work and evening plans. Worth the price.',
  },
]

function ProductDetails() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [quantity, setQuantity] = useState(1)
  const { addToCart } = useCart()

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const productData = await getProduct(id)
        setProduct(productData)
        setError('')
      } catch (loadError) {
        setError(loadError.message)
      } finally {
        setLoading(false)
      }
    }

    loadProduct()
  }, [id])

  if (loading) {
    return (
      <section className="container page-section centered">
        <h1>Loading Product...</h1>
      </section>
    )
  }

  if (error) {
    return (
      <section className="container page-section centered">
        <h1>Unable to Load Product</h1>
        <p className="error-box">{error}</p>
        <Link className="btn primary" to="/products">Back to Products</Link>
      </section>
    )
  }

  if (!product) {
    return (
      <section className="container page-section centered">
        <h1>Product Not Found</h1>
        <Link className="btn primary" to="/products">Back to Products</Link>
      </section>
    )
  }

  const decreaseQuantity = () => {
    setQuantity((current) => Math.max(1, current - 1))
  }

  const increaseQuantity = () => {
    setQuantity((current) => Math.min(Number(product.stock), current + 1))
  }

  const handleAddToCart = () => {
    addToCart(product, quantity)
    setMessage('Product added to cart.')
  }

  const reviews = product.reviews?.length ? product.reviews : fallbackReviews
  const sizes = Array.isArray(product.sizes) ? product.sizes : []
  const isOutOfStock = Number(product.stock) <= 0

  return (
    <section className="container page-section">
      <div className="detail-layout product-detail">
        <div className="detail-media">
          <img className="detail-image" src={product.image} alt={product.name} />
        </div>

        <div className="detail-copy">
          <p className="eyebrow">{product.category}</p>
          <h1>{product.name}</h1>

          <div className="rating-row">
            <strong>{product.rating}/5</strong>
            <span>Average Rating</span>
          </div>

          <p className="detail-price">
            INR {Number(product.price).toLocaleString('en-IN')}
          </p>
          <p>{product.description}</p>
          {message && <p className="success-message">{message}</p>}

          <div className="detail-meta">
            <span
              className={
                isOutOfStock
                  ? 'stock out-stock'
                  : product.stock <= 8
                    ? 'stock low-stock'
                    : 'stock'
              }
            >
              {isOutOfStock ? 'Out of Stock' : `Available Stock: ${product.stock}`}
            </span>
          </div>

          <div className="size-row" aria-label="Available sizes">
            {sizes.map((size) => (
              <button type="button" key={size}>{size}</button>
            ))}
          </div>

          <div className="quantity-control">
            <span>Quantity</span>
            <div>
              <button type="button" onClick={decreaseQuantity} aria-label="Decrease quantity">
                -
              </button>
              <strong>{quantity}</strong>
              <button
                type="button"
                disabled={quantity >= Number(product.stock)}
                onClick={increaseQuantity}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>

          <button
            className="btn primary add-cart-btn"
            disabled={isOutOfStock}
            type="button"
            onClick={handleAddToCart}
          >
            {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      </div>

      <section className="detail-reviews">
        <div className="section-heading">
          <p className="eyebrow">Customer reviews</p>
          <h2>What Customers Say</h2>
        </div>

        <div className="detail-review-grid">
          {reviews.map((review) => (
            <article className="detail-review-card" key={`${review.name}-${review.rating}`}>
              <strong>{review.rating}/5</strong>
              <p>"{review.comment}"</p>
              <h3>{review.name}</h3>
            </article>
          ))}
        </div>
      </section>
    </section>
  )
}

export default ProductDetails
