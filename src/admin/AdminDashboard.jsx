import { useCallback, useEffect, useState } from 'react'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { motion } from 'framer-motion'
import {
  addProduct,
  deleteProduct,
  getProducts,
  updateProduct,
} from '../services/productService'
import { useAuth } from '../context/useAuth'
import { auth, db } from '../firebase'
import { subscribeAdminReviews, subscribeAdminUsers } from '../services/adminService'
import { getNextUserCode } from '../services/idService'
import OrderManagement from './OrderManagement'
import ReviewManagement from './ReviewManagement'

const emptyForm = {
  name: '',
  category: '',
  price: '',
  stock: '',
  rating: '',
  sizes: '',
  description: '',
}

const emptyAuthForm = {
  name: '',
  email: '',
  password: '',
}

function AdminDashboard() {
  const { currentUser, loading: authLoading } = useAuth()
  const [products, setProducts] = useState([])
  const [users, setUsers] = useState([])
  const [ordersSummary, setOrdersSummary] = useState(null)
  const [reviews, setReviews] = useState([])
  const [formData, setFormData] = useState(emptyForm)
  const [imageFile, setImageFile] = useState(null)
  const [editingProduct, setEditingProduct] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState(null)

  const showNotice = useCallback((type, text) => {
    setNotice({ type, text })
  }, [])

  const loadProducts = useCallback(async () => {
    setLoading(true)

    try {
      const productList = await getProducts()
      setProducts(productList)
    } catch (loadError) {
      showNotice('error', loadError.message)
    } finally {
      setLoading(false)
    }
  }, [showNotice])

  useEffect(() => {
    if (authLoading || !currentUser) {
      return
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProducts()
  }, [authLoading, currentUser, loadProducts])

  useEffect(() => {
    if (authLoading || !currentUser) {
      return undefined
    }

    const unsubscribeUsers = subscribeAdminUsers(
      (userList) => setUsers(userList),
      (loadError) => showNotice('error', loadError.message),
    )
    const unsubscribeReviews = subscribeAdminReviews(
      (reviewList) => setReviews(reviewList),
      (loadError) => showNotice('error', loadError.message),
    )

    return () => {
      unsubscribeUsers()
      unsubscribeReviews()
    }
  }, [authLoading, currentUser, showNotice])

  const resetForm = () => {
    setFormData(emptyForm)
    setImageFile(null)
    setEditingProduct(null)
  }

  const handleInputChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    setImageFile(null)
    setFormData({
      name: product.name || '',
      category: product.category || '',
      price: product.price || '',
      stock: product.stock || '',
      rating: product.rating || '',
      sizes: Array.isArray(product.sizes) ? product.sizes.join(', ') : '',
      description: product.description || '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!currentUser) {
      showNotice('error', 'Sign in before uploading product images.')
      return
    }

    setSaving(true)
    setNotice(null)

    try {
      if (editingProduct) {
        await updateProduct(
          editingProduct.id,
          formData,
          imageFile,
        )
        showNotice('success', 'Product updated successfully.')
      } else {
        await addProduct(formData, imageFile)
        showNotice('success', 'Product added successfully.')
      }

      resetForm()
      await loadProducts()
    } catch (saveError) {
      showNotice('error', saveError.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (product) => {
    const confirmed = window.confirm(`Delete ${product.name}?`)

    if (!confirmed) {
      return
    }

    try {
      setNotice(null)
      await deleteProduct(product.id)
      showNotice('success', 'Product deleted successfully.')
      await loadProducts()
    } catch (deleteError) {
      showNotice('error', deleteError.message)
    }
  }

  if (authLoading) {
    return (
      <section className="container page-section centered">
        <h1>Checking admin access...</h1>
      </section>
    )
  }

  if (!currentUser) {
    return <AdminAuth />
  }

  const totalOrders = ordersSummary?.totalOrders || 0
  const deliveredOrders = ordersSummary?.deliveredOrders || 0
  const pendingOrders = ordersSummary?.pendingOrders || 0
  const totalRevenue = ordersSummary?.totalRevenue || 0
  const averageRating = reviews.length
    ? reviews.reduce((total, review) => total + Number(review.rating || 0), 0) / reviews.length
    : 0

  return (
    <section className="container page-section">
      <div className="section-heading">
        <p className="eyebrow">Admin</p>
        <h1>Product Management</h1>
        <p>Add, view, edit, and delete Firestore products.</p>
      </div>

      <MessageBox notice={notice} onClose={() => setNotice(null)} />

      <div className="dashboard-grid admin-metrics-grid">
        {[
          ['Total Products', products.length],
          ['Total Users', users.length],
          ['Total Orders', totalOrders],
          ['Delivered Orders', deliveredOrders],
          ['Pending Orders', pendingOrders],
          ['Total Revenue', `Rs. ${totalRevenue.toLocaleString('en-IN')}`],
          ['Average Rating', averageRating.toFixed(1)],
        ].map(([label, value]) => (
          <motion.article
            className="stat-card admin-metric-card"
            key={label}
            whileHover={{ y: -5, boxShadow: '0 24px 50px rgba(16, 22, 32, 0.14)' }}
          >
            <p>{label}</p>
            <strong>{value}</strong>
          </motion.article>
        ))}
      </div>

      <div className="admin-layout">
        <form className="admin-panel product-form" onSubmit={handleSubmit}>
          <div className="admin-panel-heading">
            <h2>{editingProduct ? 'Update Product' : 'Add Product'}</h2>
            {editingProduct && (
              <button className="text-button" type="button" onClick={resetForm}>
                Cancel Edit
              </button>
            )}
          </div>

          <div className="form-grid">
            <label>
              Product Name
              <input
                name="name"
                required
                type="text"
                value={formData.name}
                onChange={handleInputChange}
              />
            </label>

            <label>
  Category
  <select
    name="category"
    required
    value={formData.category}
    onChange={handleInputChange}
  >
    <option value="">Select Category</option>
    <option value="Shirt">Shirt</option>
    <option value="T-Shirt">T-Shirt</option>
    <option value="Jeans">Jeans</option>
    <option value="Trouser">Trouser</option>
    <option value="Hoodie">Hoodie</option>
    <option value="Jacket">Jacket</option>
    <option value="Kurta">Kurta</option>
    <option value="Shorts">Shorts</option>
  </select>
</label>

            <label>
              Price
              <input
                name="price"
                required
                min="0"
                type="number"
                value={formData.price}
                onChange={handleInputChange}
              />
            </label>

            <label>
              Stock
              <input
                name="stock"
                required
                min="0"
                type="number"
                value={formData.stock}
                onChange={handleInputChange}
              />
            </label>

            <label>
              Rating
              <input
                name="rating"
                max="5"
                min="0"
                step="0.1"
                type="number"
                value={formData.rating}
                onChange={handleInputChange}
              />
            </label>

            <label>
  Sizes
  <select
    name="sizes"
    required
    value={formData.sizes}
    onChange={handleInputChange}
  >
    <option value="">Select Size</option>
    <option value="S">S</option>
    <option value="M">M</option>
    <option value="L">L</option>
    <option value="XL">XL</option>
    <option value="XXL">XXL</option>
  </select>
</label>
          </div>

          <label>
            Description
            <textarea
              name="description"
              required
              rows="4"
              value={formData.description}
              onChange={handleInputChange}
            />
          </label>

          <label>
            Product Image
            <input
              accept="image/*"
              required={!editingProduct}
              type="file"
              onChange={(event) => setImageFile(event.target.files[0])}
            />
          </label>

          {editingProduct?.image && (
            <div className="current-image">
              <img src={editingProduct.image} alt={editingProduct.name} />
              <span>Current image</span>
            </div>
          )}

          <button className="btn primary" disabled={saving} type="submit">
            {saving
              ? 'Saving...'
              : editingProduct
                ? 'Update Product'
                : 'Add Product'}
          </button>
        </form>

        <div className="admin-panel product-table-panel">
          <div className="admin-panel-heading">
            <h2>Products</h2>
            <strong>{products.length}</strong>
          </div>

          {loading ? (
            <p>Loading products...</p>
          ) : products.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Product ID</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <img
                        className="table-image"
                        src={product.image}
                        alt={product.name}
                      />
                    </td>
                    <td>{product.productCode || product.id.slice(0, 8)}</td>
                    <td>{product.name}</td>
                    <td>{product.category}</td>
                    <td>₹ {Number(product.price).toLocaleString('en-IN')}</td>
                    <td>{product.stock}</td>
                    <td>
                      <div className="table-actions">
                        <button type="button" onClick={() => handleEdit(product)}>
                          Edit
                        </button>
                        <button
                          className="danger"
                          type="button"
                          onClick={() => handleDelete(product)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <h2>No products yet</h2>
              <p>Add your first product using the form.</p>
            </div>
          )}
        </div>
      </div>

      <OrderManagement onSummaryChange={setOrdersSummary} />
      <ReviewManagement />
    </section>
  )
}

function MessageBox({ notice, onClose }) {
  useEffect(() => {
    if (!notice) {
      return undefined
    }

    const timeoutId = window.setTimeout(onClose, 4500)

    return () => window.clearTimeout(timeoutId)
  }, [notice, onClose])

  if (!notice) {
    return null
  }

  return (
    <div
      className={`admin-message-box ${notice.type}`}
      role="alert"
      aria-live="polite"
    >
      <div>
        <strong>{notice.type === 'success' ? 'Success' : 'Error'}</strong>
        <p>{notice.text}</p>
      </div>
      <button type="button" aria-label="Close message" onClick={onClose}>
        x
      </button>
    </div>
  )
}

function AdminAuth() {
  const [mode, setMode] = useState('login')
  const [formData, setFormData] = useState(emptyAuthForm)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isRegistering = mode === 'register'

  const handleModeChange = (nextMode) => {
    setMode(nextMode)
    setFormData(emptyAuthForm)
    setError('')
    setMessage('')
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
    setError('')
    setMessage('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!auth || !db) {
      setError('Firebase is not configured. Add your Firebase values to .env.')
      return
    }

    if (isRegistering && formData.name.trim().length < 3) {
      setError('Name must be at least 3 characters.')
      return
    }

    if (!formData.email.trim() || !formData.password) {
      setError('Email and password are required.')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    try {
      setIsSubmitting(true)
      setError('')

      if (isRegistering) {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.password,
        )

        await updateProfile(userCredential.user, {
          displayName: formData.name,
        })

        const userCode = await getNextUserCode()

        await setDoc(doc(db, 'users', userCredential.user.uid), {
          userCode,
          name: formData.name,
          email: formData.email,
          role: 'admin',
          createdAt: serverTimestamp(),
        })

        setMessage('Admin account created. Opening dashboard...')
      } else {
        await signInWithEmailAndPassword(auth, formData.email, formData.password)
        setMessage('Login successful. Opening dashboard...')
      }
    } catch (authError) {
      setMessage('')
      setError(getAdminAuthErrorMessage(authError.code))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit} noValidate>
        <p className="eyebrow">Admin</p>
        <h1>{isRegistering ? 'Register' : 'Login'}</h1>

        <div className="filter-group" aria-label="Admin auth mode">
          <button
            className={!isRegistering ? 'active' : ''}
            type="button"
            onClick={() => handleModeChange('login')}
          >
            Login
          </button>
          <button
            className={isRegistering ? 'active' : ''}
            type="button"
            onClick={() => handleModeChange('register')}
          >
            Register
          </button>
        </div>

        {message && <p className="success-message">{message}</p>}
        {error && <p className="error-box">{error}</p>}

        {isRegistering && (
          <label>
            Name
            <input
              name="name"
              placeholder="Admin name"
              type="text"
              value={formData.name}
              onChange={handleChange}
            />
          </label>
        )}

        <label>
          Email
          <input
            name="email"
            placeholder="admin@example.com"
            type="email"
            value={formData.email}
            onChange={handleChange}
          />
        </label>

        <label>
          Password
          <div className="password-field">
            <input
              name="password"
              placeholder="Enter password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
            />
            <button type="button" onClick={() => setShowPassword((visible) => !visible)}>
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </label>

        <button className="btn primary" disabled={isSubmitting} type="submit">
          {isSubmitting
            ? isRegistering
              ? 'Creating account...'
              : 'Logging in...'
            : isRegistering
              ? 'Create Account'
              : 'Login'}
        </button>
      </form>
    </section>
  )
}

function getAdminAuthErrorMessage(code) {
  if (code === 'auth/email-already-in-use') {
    return 'An account already exists with this email.'
  }

  if (code === 'auth/invalid-credential') {
    return 'Invalid email or password.'
  }

  if (code === 'auth/weak-password') {
    return 'Password is too weak. Use at least 6 characters.'
  }

  if (code === 'auth/invalid-email') {
    return 'Enter a valid email address.'
  }

  return 'Unable to continue. Please check your Firebase setup and try again.'
}

export default AdminDashboard
