import { useEffect, useMemo, useState } from 'react'
import StarRating from '../components/StarRating'
import { deleteReview, subscribeAdminReviews } from '../services/adminService'

function formatDate(review) {
  const date = review.createdAt?.toDate?.()
  return date ? date.toLocaleDateString('en-IN') : 'Pending'
}

function ReviewManagement() {
  const [reviews, setReviews] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [ratingFilter, setRatingFilter] = useState('All')
  const [productFilter, setProductFilter] = useState('All')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => (
    subscribeAdminReviews(
      (reviewList) => {
        setReviews(reviewList)
        setLoading(false)
        setError('')
      },
      (loadError) => {
        setError(loadError.message)
        setLoading(false)
      },
    )
  ), [])

  const productOptions = useMemo(
    () => ['All', ...new Set(reviews.map((review) => review.productName).filter(Boolean))],
    [reviews],
  )

  const filteredReviews = reviews.filter((review) => {
    const searchableText = [
      review.id,
      review.userName,
      review.productName,
      review.review,
    ].join(' ').toLowerCase()
    const matchesSearch = searchableText.includes(searchTerm.trim().toLowerCase())
    const matchesRating = ratingFilter === 'All' || Number(review.rating) === Number(ratingFilter)
    const matchesProduct = productFilter === 'All' || review.productName === productFilter

    return matchesSearch && matchesRating && matchesProduct
  })

  const handleDelete = async (review) => {
    const confirmed = window.confirm(`Delete review from ${review.userName || 'customer'}?`)

    if (!confirmed) {
      return
    }

    try {
      await deleteReview(review.id)
      setMessage('Review deleted successfully.')
      setError('')
    } catch (deleteError) {
      setError(deleteError.message)
      setMessage('')
    }
  }

  return (
    <section className="admin-panel review-management">
      <div className="admin-panel-heading">
        <h2>Customer Reviews</h2>
        <strong>{reviews.length}</strong>
      </div>

      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-box">{error}</p>}

      <div className="order-admin-tools">
        <label className="search-box">
          Search Reviews
          <input
            type="search"
            placeholder="Review ID, customer, product..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </label>
        <label className="search-box">
          Rating
          <select value={ratingFilter} onChange={(event) => setRatingFilter(event.target.value)}>
            <option value="All">All</option>
            {[5, 4, 3, 2, 1].map((rating) => (
              <option value={rating} key={rating}>{rating} stars</option>
            ))}
          </select>
        </label>
        <label className="search-box">
          Product
          <select value={productFilter} onChange={(event) => setProductFilter(event.target.value)}>
            {productOptions.map((product) => (
              <option value={product} key={product}>{product}</option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <p>Loading reviews...</p>
      ) : filteredReviews.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>Review ID</th>
              <th>User</th>
              <th>Product</th>
              <th>Rating</th>
              <th>Review</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredReviews.map((review) => (
              <tr key={review.id}>
                <td>#{review.id.slice(0, 8)}</td>
                <td>
                  <strong>{review.userName || 'Customer'}</strong>
                  <span className="table-subtext">{review.userId || 'Unknown user'}</span>
                </td>
                <td>{review.productName || review.productId}</td>
                <td><StarRating value={review.rating} /> {Number(review.rating).toFixed(1)}</td>
                <td>{review.review}</td>
                <td>{formatDate(review)}</td>
                <td>
                  <button className="text-button" type="button" onClick={() => handleDelete(review)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="empty-state">
          <h2>No reviews found</h2>
          <p>Customer feedback will appear here after delivered orders are rated.</p>
        </div>
      )}
    </section>
  )
}

export default ReviewManagement
