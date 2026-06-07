import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getProducts } from '../services/productService'

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

const reviews = [
  {
    name: 'Rohan Shah',
    text: 'The blazer fit was sharp right out of the box. Clean fabric, quick delivery, and easy styling.',
    rating: '5.0',
  },
  {
    name: 'Arjun Mehta',
    text: 'Great collection for office wear. The shirts feel premium and hold their shape after washing.',
    rating: '4.8',
  },
  {
    name: 'Kabir Singh',
    text: 'I ordered chinos and polos together. The colors look refined and the fit feels comfortable all day.',
    rating: '4.9',
  },
]

function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([])

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

  return (
    <>
      <section className="hero-section">
        <div className="container hero-content">
          <div className="hero-copy">
            <p className="eyebrow">Flat 30% off on new arrivals</p>
            <h1>Alan Mens Wear</h1>
            <p>
              Upgrade your wardrobe with crisp shirts, elevated casualwear, sharp
              trousers, and occasion-ready formals.
            </p>
            <div className="hero-actions">
              <Link className="btn primary" to="/products">Shop Now</Link>
              <Link className="btn secondary" to="/register">Get Member Deals</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container section">
        <div className="section-heading">
          <p className="eyebrow">Shop by style</p>
          <h2>Categories</h2>
          <p>Everything a modern wardrobe needs, organized for quick browsing.</p>
        </div>

        <div className="category-grid">
          {categories.map((category) => (
            <Link className="category-card" to="/products" key={category.name}>
              <img src={category.image} alt={category.name} />
              <span>{category.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="container section">
        <div className="section-heading">
          <p className="eyebrow">Featured products</p>
          <h2>Best Sellers</h2>
          <p>Customer favorites selected for fit, quality, and easy styling.</p>
        </div>

        <div className="product-grid">
          {featuredProducts.map((product) => (
            <article className="product-card" key={product.id}>
              <img src={product.image} alt={product.name} />
              <div>
                <p className="category">{product.category}</p>
                <h3>{product.name}</h3>
                <p>{product.description}</p>
                <p className="price">
                  INR {Number(product.price).toLocaleString('en-IN')}
                </p>
                <Link className="btn small" to={`/products/${product.id}`}>View Details</Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="reviews-band">
        <div className="container section">
          <div className="section-heading">
            <p className="eyebrow">Customer reviews</p>
            <h2>Trusted by Style-Focused Men</h2>
          </div>

          <div className="review-grid">
            {reviews.map((review) => (
              <article className="review-card" key={review.name}>
                <strong>{review.rating}/5</strong>
                <p>"{review.text}"</p>
                <h3>{review.name}</h3>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

export default Home
