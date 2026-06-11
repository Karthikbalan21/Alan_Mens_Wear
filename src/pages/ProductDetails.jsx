import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import StarRating from '../components/StarRating'
import { useCart } from '../context/useCart'
import { getProduct } from '../services/productService'
import { subscribeProductReviews } from '../services/reviewService'

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
  const [actionError, setActionError] = useState('')
  const [message, setMessage] = useState('')
  const [reviews, setReviews] = useState([])
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

  useEffect(() => (
    subscribeProductReviews(
      id,
      (reviewList) => setReviews(reviewList),
      () => setReviews([]),
    )
  ), [id])

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

  const handleAddToCart = async () => {
    setMessage('')
    setActionError('')

    const result = await addToCart(product, quantity)

    if (result.ok) {
      setMessage(result.message)
    } else {
      setActionError(result.message)
    }
  }

  const visibleReviews = reviews.length
    ? reviews
    : fallbackReviews.map((review) => ({
      userName: review.name,
      rating: review.rating,
      review: review.comment,
    }))
  const averageRating = visibleReviews.length
    ? visibleReviews.reduce((total, review) => total + Number(review.rating || 0), 0) / visibleReviews.length
    : Number(product.rating || 0)
  const ratingBreakdown = [5, 4, 3, 2, 1].map((star) => {
    const count = visibleReviews.filter((review) => Math.round(Number(review.rating)) === star).length
    return {
      star,
      percent: visibleReviews.length ? Math.round((count / visibleReviews.length) * 100) : 0,
    }
  })
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
            <StarRating value={averageRating} />
            <strong>{averageRating.toFixed(1)}/5</strong>
            <span>{visibleReviews.length} Reviews</span>
          </div>

          <p className="detail-price">
            ₹ {Number(product.price).toLocaleString('en-IN')}
          </p>
          <p>{product.description}</p>
          {message && <p className="success-message">{message}</p>}
          {actionError && <p className="error-box">{actionError}</p>}

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
          <div className="rating-breakdown">
            {ratingBreakdown.map((row) => (
              <div key={row.star}>
                <span>{row.star} star</span>
                <strong><i style={{ width: `${row.percent}%` }}></i></strong>
                <em>{row.percent}%</em>
              </div>
            ))}
          </div>
        </div>

        <div className="detail-review-grid">
          {visibleReviews.map((review) => (
            <article className="detail-review-card" key={`${review.userName}-${review.rating}-${review.review}`}>
              <StarRating value={review.rating} />
              <strong>{review.rating}/5</strong>
              <p>"{review.review}"</p>
              <h3>{review.userName}</h3>
            </article>
          ))}
        </div>
      </section>
    </section>
  )
}

export default ProductDetails
