import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiDownload, FiNavigation, FiStar } from 'react-icons/fi'
import { toast } from 'react-toastify'
import StarRating from '../components/StarRating'
import { useAuth } from '../context/useAuth'
import { downloadInvoice } from '../services/invoiceService'
import { orderStatuses, subscribeUserOrders } from '../services/orderService'
import { addProductReview, getUserReviews } from '../services/reviewService'

function formatOrderDate(order) {
  const date = order.createdAt?.toDate?.()
  return date ? date.toLocaleDateString('en-IN') : 'Pending'
}

function getItemReviewId(item) {
  return item.productId || item.id
}

function getReviewKey(order, item) {
  return `${order.id}-${getItemReviewId(item)}`
}

function Orders() {
  const { currentUser } = useAuth()
  const [orders, setOrders] = useState([])
  const [reviews, setReviews] = useState([])
  const [activeReviewKey, setActiveReviewKey] = useState('')
  const [reviewText, setReviewText] = useState('')
  const [rating, setRating] = useState(5)
  const [loading, setLoading] = useState(Boolean(currentUser))
  const [savingReview, setSavingReview] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!currentUser) {
      return undefined
    }

    const unsubscribe = subscribeUserOrders(
      currentUser.uid,
      (orderList) => {
        setOrders(orderList)
        setError('')
        setLoading(false)
      },
      (loadError) => {
        setError(loadError.message)
        toast.error(loadError.message)
        setLoading(false)
      },
    )

    return unsubscribe
  }, [currentUser])

  useEffect(() => {
    if (!currentUser) {
      return
    }

    getUserReviews(currentUser.uid)
      .then(setReviews)
      .catch((loadError) => setError(loadError.message))
  }, [currentUser, message])

  const reviewedKeys = useMemo(
    () => new Set(reviews.map((review) => `${review.orderId}-${review.productId}`)),
    [reviews],
  )

  const canDownloadInvoice = (order) => (
    order.status === 'Delivered'
    && order.items?.length > 0
    && order.items.every((item) => reviewedKeys.has(getReviewKey(order, item)))
  )

  if (!currentUser) {
    return (
      <section className="container page-section centered">
        <h1>My Orders</h1>
        <p>Login to view your order status updates.</p>
        <Link className="btn primary" to="/login">Login</Link>
      </section>
    )
  }

  const handleReviewSubmit = async (event, order, item) => {
    event.preventDefault()
    setSavingReview(true)
    setMessage('')
    setError('')

    try {
      if (order.status !== 'Delivered') {
        throw new Error('Feedback is available after delivery.')
      }

      await addProductReview({
        user: currentUser,
        orderId: order.id,
        product: item,
        rating,
        review: reviewText,
      })
      setMessage('Review submitted successfully.')
      toast.success('Review submitted successfully.')
      setActiveReviewKey('')
      setReviewText('')
      setRating(5)
    } catch (reviewError) {
      setError(reviewError.message)
      toast.error(reviewError.message)
    } finally {
      setSavingReview(false)
    }
  }

  const handleInvoiceDownload = (order) => {
    if (order.status !== 'Delivered') {
      toast.info('Invoice download is available after your order is delivered and reviewed.')
      return
    }

    if (!canDownloadInvoice(order)) {
      toast.info('Please submit feedback and rating for every product before downloading the invoice.')
      return
    }

    downloadInvoice(order)
  }

  return (
    <section className="container page-section">
      <div className="section-heading">
        <p className="eyebrow">Orders</p>
        <h1>My Orders</h1>
        <p>Track payment, dispatch, shipping, delivery, and product feedback.</p>
      </div>

      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-box">{error}</p>}

      {loading ? (
        <div className="empty-state">
          <h2>Loading orders...</h2>
        </div>
      ) : orders.length > 0 ? (
        <div className="order-card-list">
          {orders.map((order) => (
            <article className="order-card" key={order.id}>
              <div className="order-card-header">
                <div>
                  <p className="category">Order #{order.id.slice(0, 8)}</p>
                  <h2>{order.status}</h2>
                  <span>{formatOrderDate(order)}</span>
                </div>
                <strong>Rs. {Number(order.totalAmount).toLocaleString('en-IN')}</strong>
              </div>

              <div className="order-timeline" aria-label={`Tracking for order ${order.id}`}>
                {orderStatuses.map((status) => {
                  const currentIndex = orderStatuses.indexOf(order.status || 'Pending')
                  const statusIndex = orderStatuses.indexOf(status)

                  return (
                    <span className={statusIndex <= currentIndex ? 'complete' : ''} key={status}>
                      {status}
                    </span>
                  )
                })}
              </div>

              <ul className="order-items detailed-order-items">
                {order.items?.map((item) => {
                  const reviewKey = getReviewKey(order, item)
                  const canReview = order.status === 'Delivered' && !reviewedKeys.has(reviewKey)

                  return (
                    <li key={item.productId}>
                      {item.image && <img src={item.image} alt={item.name} />}
                      <div>
                        <span>{item.name}</span>
                        <small>Qty {item.quantity} • Rs. {Number(item.price).toLocaleString('en-IN')}</small>
                      </div>
                      <strong>Rs. {(Number(item.price) * item.quantity).toLocaleString('en-IN')}</strong>

                      {canReview && (
                        <button
                          className="btn small"
                          type="button"
                          onClick={() => setActiveReviewKey(reviewKey)}
                        >
                          <FiStar aria-hidden="true" />
                          Rate Product
                        </button>
                      )}

                      {reviewedKeys.has(reviewKey) && <span className="reviewed-badge">Reviewed</span>}

                      {activeReviewKey === reviewKey && (
                        <form
                          className="review-form"
                          onSubmit={(event) => handleReviewSubmit(event, order, item)}
                        >
                          <StarRating interactive value={rating} onChange={setRating} />
                          <textarea
                            rows="3"
                            placeholder="Share your fit, fabric, and delivery experience"
                            value={reviewText}
                            onChange={(event) => setReviewText(event.target.value)}
                          />
                          <button className="btn primary small" disabled={savingReview} type="submit">
                            {savingReview ? 'Submitting...' : 'Submit Review'}
                          </button>
                        </form>
                      )}
                    </li>
                  )
                })}
              </ul>

              <div className="order-actions">
                <button
                  className="btn small"
                  type="button"
                  onClick={() => handleInvoiceDownload(order)}
                  title="Submit delivery feedback and ratings before downloading the invoice"
                >
                  <FiDownload aria-hidden="true" />
                  Download Invoice
                </button>
                <button className="btn small" type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                  <FiNavigation aria-hidden="true" />
                  Track Order
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>No orders yet</h2>
          <p>Your placed orders will appear here.</p>
          <Link className="btn primary" to="/products">Shop Products</Link>
        </div>
      )}
    </section>
  )
}

export default Orders
