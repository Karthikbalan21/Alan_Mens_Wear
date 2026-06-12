import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import StarRating from '../components/StarRating'
import { getProducts } from '../services/productService'
import { subscribeLatestReviews } from '../services/reviewService'

const categories = [
  {
    name: 'Shirts',
    image: 'https://images.unsplash.com/photo-1598032895397-b9472444bf93?auto=format&fit=crop&w=700&q=80',
  },
  {
    name: 'T-Shirts',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=700&q=80',
  },
  {
    name: 'Jeans',
    image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=700&q=80',
  },
  {
    name: 'Trousers',
    image: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=700&q=80',
  },
  {
    name: 'Formals',
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=700&q=80',
  },
]

const fadeUp = {
  hidden: { opacity: 0, y: 34 },
  visible: { opacity: 1, y: 0 },
}

function AnimatedCounter({ value, suffix = '' }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!isInView) {
      return undefined
    }

    const duration = 1200
    const start = performance.now()

    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration)
      setCount(Math.round(value * progress))

      if (progress < 1) {
        requestAnimationFrame(tick)
      }
    }

    const frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [isInView, value])

  return <strong ref={ref}>{count.toLocaleString('en-IN')}{suffix}</strong>
}

function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [reviews, setReviews] = useState([])
  const [reviewError, setReviewError] = useState('')
  const [activeReview, setActiveReview] = useState(0)

  useEffect(() => {
    const loadFeaturedProducts = async () => {
      try {
        const productList = await getProducts()
        setFeaturedProducts(productList.slice(0, 3))
      } catch {
        setFeaturedProducts([])
      }
    }

    loadFeaturedProducts()
  }, [])

  useEffect(() => {
    const unsubscribe = subscribeLatestReviews(
      (reviewList) => {
        setReviews(reviewList)
        setReviewError('')
      },
      (loadError) => {
        setReviews([])
        setReviewError(loadError.message)
      },
    )

    return unsubscribe
  }, [])

  useEffect(() => {
    if (!reviews.length) {
      setActiveReview(0)
      return undefined
    }

    const intervalId = window.setInterval(() => {
      setActiveReview((current) => (current + 1) % reviews.length)
    }, 3600)

    return () => window.clearInterval(intervalId)
  }, [reviews.length])

  const totalProducts = featuredProducts.length || 12

  return (
    <>
      <motion.section
        className="hero-section premium-hero"
        initial="hidden"
        animate="visible"
        variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
        transition={{ duration: 0.65 }}
      >
        <div className="floating-shape shape-one"></div>
        <div className="floating-shape shape-two"></div>
        <div className="container hero-content premium-hero-grid">
          <motion.div
            className="hero-copy"
            variants={fadeUp}
            transition={{ duration: 0.7, delay: 0.12 }}
          >
            <motion.p className="eyebrow" variants={fadeUp}>Premium Men's Fashion</motion.p>
            <motion.h1 variants={fadeUp}>Trending Collections</motion.h1>
            <motion.p variants={fadeUp}>
              Tailored essentials, polished casualwear, and sharp occasion pieces
              selected for a modern men's wardrobe.
            </motion.p>
            <motion.div className="hero-actions" variants={fadeUp}>
              <motion.div whileHover={{ y: -3, scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link className="btn primary" to="/products">Shop Now</Link>
              </motion.div>
              <motion.div whileHover={{ y: -3, scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link className="btn secondary" to="/products">Explore Collection</Link>
              </motion.div>
            </motion.div>
          </motion.div>

          <motion.div
            className="hero-image-panel"
            initial={{ opacity: 0, x: 64, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.75, delay: 0.22 }}
          >
            <img
              src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=900&q=80"
              alt="Premium menswear collection"
            />
          </motion.div>
        </div>
      </motion.section>

      <motion.section
        className="container section"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={fadeUp}
        transition={{ duration: 0.55 }}
      >
        <div className="section-heading">
          <p className="eyebrow">Shop by style</p>
          <h2>Categories</h2>
          <p>Everything a modern wardrobe needs, organized for quick browsing.</p>
        </div>

        <div className="category-grid">
          {categories.map((category, index) => (
            <motion.div
              key={category.name}
              variants={fadeUp}
              transition={{ delay: index * 0.06 }}
              whileHover={{ y: -8 }}
            >
              <Link className="category-card" to="/products">
                <img src={category.image} alt={category.name} />
                <span>{category.name}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.section>

      <motion.section
        className="container section"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.18 }}
        variants={fadeUp}
        transition={{ duration: 0.55 }}
      >
        <div className="section-heading">
          <p className="eyebrow">Featured products</p>
          <h2>Best Sellers</h2>
          <p>Customer favorites selected for fit, quality, and easy styling.</p>
        </div>

        <div className="product-grid">
          {featuredProducts.map((product, index) => (
            <motion.article
              className="product-card animated-product-card"
              key={product.id}
              variants={fadeUp}
              transition={{ delay: index * 0.08 }}
              whileHover={{ y: -10, scale: 1.01 }}
            >
              <img src={product.image} alt={product.name} />
              <div>
                <p className="category">{product.category}</p>
                <h3>{product.name}</h3>
                <p>{product.description}</p>
                <StarRating value={product.rating || 0} />
                <p className="price">
                  Rs. {Number(product.price).toLocaleString('en-IN')}
                </p>
                <Link className="btn small" to={`/products/${product.id}`}>View Details</Link>
              </div>
            </motion.article>
          ))}
        </div>
      </motion.section>

      <motion.section
        className="stats-band"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.25 }}
        variants={fadeUp}
      >
        <div className="container dashboard-grid">
          <article className="stat-card"><p>Total Customers</p><AnimatedCounter value={1250} suffix="+" /></article>
          <article className="stat-card"><p>Total Orders</p><AnimatedCounter value={840} suffix="+" /></article>
          <article className="stat-card"><p>Total Products</p><AnimatedCounter value={totalProducts} /></article>
          <article className="stat-card"><p>Average Rating</p><AnimatedCounter value={49} suffix="/10" /></article>
        </div>
      </motion.section>

      <section className="reviews-band">
        <div className="container section">
          <div className="section-heading">
            <p className="eyebrow">Customer reviews</p>
            <h2>Trusted by Style-Focused Men</h2>
          </div>

          {reviewError ? (
            <p className="error-box">Unable to load reviews: {reviewError}</p>
          ) : !reviews.length ? (
            <div className="empty-state">
              <h2>Real customer feedback is coming soon</h2>
              <p>Browse our collection and check back for fresh reviews from verified customers.</p>
            </div>
          ) : (
            <div className="testimonial-slider">
              {reviews.map((review, index) => (
                <motion.article
                  className={`review-card testimonial-card ${activeReview === index ? 'active' : ''}`}
                  key={review.id}
                  animate={{
                    opacity: activeReview === index ? 1 : 0,
                    x: activeReview === index ? 0 : 26,
                    pointerEvents: activeReview === index ? 'auto' : 'none',
                  }}
                  transition={{ duration: 0.45 }}
                >
                  {review.userPhotoURL ? (
                    <img className="review-avatar review-avatar-image" src={review.userPhotoURL} alt={review.userName || 'Customer'} />
                  ) : (
                    <div className="review-avatar">{(review.userName || 'C').slice(0, 1)}</div>
                  )}
                  <div className="review-header">
                    <div>
                      <StarRating value={Number(review.rating)} />
                      <strong>{Number(review.rating).toFixed(1)}/5</strong>
                    </div>
                    <span>{review.createdAt?.toDate ? review.createdAt.toDate().toLocaleDateString('en-IN') : ''}</span>
                  </div>
                  <p>"{review.review || review.text}"</p>
                  <h3>{review.userName || 'Customer'}</h3>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}

export default Home
