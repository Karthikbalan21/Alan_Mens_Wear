import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getProducts } from '../services/productService'

function Products() {
  const [products, setProducts] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const productList = await getProducts()
        setProducts(productList)
        setError('')
      } catch (loadError) {
        setError(loadError.message)
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [])

  const categories = useMemo(
    () => ['All', ...new Set(products.map((product) => product.category))],
    [products],
  )

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchTerm.trim().toLowerCase())
    const matchesCategory =
      selectedCategory === 'All' || product.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  return (
    <section className="container page-section">
      <div className="listing-header">
        <div className="section-heading">
          <p className="eyebrow">Collection</p>
          <h1>Product Listing</h1>
          <p>Search and filter Alan Mens Wear essentials by category.</p>
        </div>

        <div className="listing-tools">
          <label className="search-box">
            Search Products
            <input
              type="search"
              placeholder="Search shirts, jeans, formals..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>

          <div className="filter-group" aria-label="Filter products by category">
            {categories.map((category) => (
              <button
                className={selectedCategory === category ? 'active' : ''}
                type="button"
                key={category}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && <p className="error-box">{error}</p>}

      {loading ? (
        <div className="empty-state">
          <h2>Loading products...</h2>
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="product-grid listing-grid">
          {filteredProducts.map((product) => (
            <article className="product-card listing-card" key={product.id}>
              <img src={product.image} alt={product.name} />
              <div>
                <p className="category">{product.category}</p>
                <h3>{product.name}</h3>
                <p className="price">
                  ₹ {Number(product.price).toLocaleString('en-IN')}
                </p>
                <p
                  className={
                    Number(product.stock) <= 0
                      ? 'stock out-stock'
                      : Number(product.stock) <= 8
                        ? 'stock low-stock'
                        : 'stock'
                  }
                >
                  {Number(product.stock) <= 0
                    ? 'Out of Stock'
                    : `Available Stock: ${product.stock}`}
                </p>
                <Link
                  className={`btn small ${Number(product.stock) <= 0 ? 'disabled-link' : ''}`}
                  to={`/products/${product.id}`}
                  aria-disabled={Number(product.stock) <= 0}
                >
                  View Details
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>No products found</h2>
          <p>Try a different search term or category.</p>
        </div>
      )}
    </section>
  )
}

export default Products
