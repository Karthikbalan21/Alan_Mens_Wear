import { useCallback, useEffect, useRef, useState } from 'react'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, sendPasswordResetEmail } from 'firebase/auth'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { motion } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import {
  FiBell,
  FiChevronDown,
  FiGrid,
  FiMenu,
  FiMoon,
  FiPackage,
  FiSearch,
  FiShoppingBag,
  FiStar,
  FiSun,
  FiUsers,
  FiX,
} from 'react-icons/fi'
import {
  addProduct,
  deleteProduct,
  getProducts,
  updateProduct,
} from '../services/productService'
import { useAuth } from '../context/useAuth'
import { auth, db } from '../firebase'
import { deleteUserRecord, subscribeAdminReviews, subscribeAdminUsers } from '../services/adminService'
import { getNextUserCode } from '../services/idService'
import OrderManagement from './OrderManagement'
import ReviewManagement from './ReviewManagement'
import AdminLogout from '../components/AdminLogout'
import { getSizePrice } from '../utils/productPricing'

const emptyForm = {
  name: '',
  category: '',
  price: '',
  rating: '',
  sizeInventory: {
    S: '',
    M: '',
    L: '',
    XL: '',
    XXL: '',
  },
  sizePrices: {
    S: '',
    M: '',
    L: '',
    XL: '',
    XXL: '',
  },
  description: '',
}

const sizeOptions = ['S', 'M', 'L', 'XL', 'XXL']

const emptyAuthForm = {
  name: '',
  email: '',
  password: '',
}

const adminNavItems = [
  { id: 'dashboard-section', label: 'Dashboard', path: '/admin#dashboard-section', Icon: FiGrid },
  { id: 'products-section', label: 'Products', path: '/admin#products-section', Icon: FiPackage },
  { id: 'users-section', label: 'Users', path: '/admin#users-section', Icon: FiUsers },
  { id: 'orders-section', label: 'Order Management', path: '/admin#orders-section', Icon: FiShoppingBag },
  { id: 'reviews-section', label: 'Customer Reviews', path: '/admin#reviews-section', Icon: FiStar },
]

function AdminDashboard() {
  const { currentUser, userProfile, loading: authLoading } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [users, setUsers] = useState([])
  const [ordersSummary, setOrdersSummary] = useState(null)
  const [reviews, setReviews] = useState([])
  const [userStack, setUserStack] = useState([])
  const [formData, setFormData] = useState(emptyForm)
  const [imageFile, setImageFile] = useState(null)
  const [editingProduct, setEditingProduct] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState(null)
  const [activeSection, setActiveSection] = useState('dashboard-section')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [adminSearchTerm, setAdminSearchTerm] = useState('')
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('alan-admin-theme') === 'dark')
  const sidebarRef = useRef(null)
  const profileMenuRef = useRef(null)

  const showNotice = useCallback((type, text) => {
    setNotice({ type, text })
    if (type === 'success') {
      toast.success(text)
    } else {
      toast.error(text)
    }
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
      (userList) => {
        setUsers(userList)
        setUserStack(userList)
      },
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

  useEffect(() => {
    localStorage.setItem('alan-admin-theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  useEffect(() => {
    const hashSection = location.hash.replace('#', '')

    if (!hashSection) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => {
      setActiveSection(hashSection)
      document.getElementById(hashSection)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)

    return () => window.clearTimeout(timeoutId)
  }, [location.hash])

  useEffect(() => {
    const handleScroll = () => {
      const visibleSection = adminNavItems.find(({ id }) => {
        const section = document.getElementById(id)
        if (!section) return false

        const rect = section.getBoundingClientRect()
        return rect.top <= 150 && rect.bottom >= 150
      })

      if (visibleSection) {
        setActiveSection(visibleSection.id)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (sidebarOpen && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setSidebarOpen(false)
      }

      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false)
      }
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setSidebarOpen(false)
        setProfileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [sidebarOpen])

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

  const handleSizeInventoryChange = (size, value) => {
    setFormData((current) => ({
      ...current,
      sizeInventory: {
        ...current.sizeInventory,
        [size]: value,
      },
    }))
  }

  const handleSizePriceChange = (size, value) => {
    setFormData((current) => ({
      ...current,
      sizePrices: {
        ...current.sizePrices,
        [size]: value,
      },
    }))
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    setImageFile(null)
    setFormData({
      name: product.name || '',
      category: product.category || '',
      price: product.price || '',
      rating: product.rating || '',
      sizeInventory: sizeOptions.reduce((inventory, size) => {
        const legacySizeSelected = Array.isArray(product.sizes) && product.sizes.includes(size)
        inventory[size] = product.sizeInventory?.[size] ?? (legacySizeSelected ? product.stock : '')
        return inventory
      }, {}),
      sizePrices: sizeOptions.reduce((prices, size) => {
        const legacySizeSelected = Array.isArray(product.sizes) && product.sizes.includes(size)
        const hasSizeStock = Number(product.sizeInventory?.[size] || 0) > 0 || legacySizeSelected
        prices[size] = hasSizeStock ? getSizePrice(product, size) : ''
        return prices
      }, {}),
      description: product.description || '',
    })
    document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleAdminNavClick = (sectionId) => {
    setActiveSection(sectionId)
    setSidebarOpen(false)
    navigate(`/admin#${sectionId}`, { replace: false })
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!currentUser) {
      showNotice('error', 'Sign in before uploading product images.')
      return
    }

    const totalSizeStock = Object.values(formData.sizeInventory).reduce(
      (total, amount) => total + Number(amount || 0),
      0,
    )

    if (totalSizeStock <= 0) {
      showNotice('error', 'Enter stock quantity for at least one size.')
      return
    }

    const missingSizePrice = sizeOptions.find(
      (size) => Number(formData.sizeInventory[size] || 0) > 0
        && Number(formData.sizePrices[size] || 0) <= 0,
    )

    if (missingSizePrice) {
      showNotice('error', `Enter a price for size ${missingSizePrice}.`)
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

  const handleSendPasswordReset = async (user) => {
    if (!user.email) {
      showNotice('error', 'This user does not have an email address.')
      return
    }

    try {
      setNotice(null)
      await sendPasswordResetEmail(auth, user.email)
      showNotice('success', `Password reset email sent to ${user.email}`)
    } catch (resetError) {
      showNotice('error', resetError.message)
    }
  }

  const handleRemoveUser = async (user) => {
    if (user.id === currentUser.uid) {
      showNotice('error', 'You cannot remove your own admin profile here.')
      return
    }

    const confirmed = window.confirm(`Remove ${user.email || user.name || 'this user'} from admin records?`)

    if (!confirmed) {
      return
    }

    try {
      setNotice(null)
      await deleteUserRecord(user.id)
      setUserStack((currentStack) => currentStack.filter((stackUser) => stackUser.id !== user.id))
      showNotice('success', 'User record removed successfully.')
    } catch (deleteError) {
      showNotice('error', deleteError.message)
    }
  }

  const handlePushUser = (user) => {
    setUserStack((currentStack) => [...currentStack.filter((stackUser) => stackUser.id !== user.id), user])
    showNotice('success', `Pushed ${user.email || user.name} onto stack`)
  }

  const handlePopUser = () => {
    setUserStack((currentStack) => {
      if (currentStack.length === 0) {
        showNotice('error', 'Stack is empty.')
        return currentStack
      }

      const poppedUser = currentStack[currentStack.length - 1]
      showNotice('success', `Popped ${poppedUser.email || poppedUser.name} from stack`)
      return currentStack.slice(0, -1)
    })
  }

  const cleanupAdminState = () => {
    setProducts([])
    setUsers([])
    setOrdersSummary(null)
    setReviews([])
    setUserStack([])
    resetForm()
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
  const adminName = userProfile?.name || currentUser.displayName || 'Admin'
  const adminEmail = currentUser.email || userProfile?.email || 'admin@alanmenswear.com'
  const adminInitial = adminName.trim().charAt(0).toUpperCase() || 'A'
  const notificationCount = pendingOrders + reviews.length
  const searchPlaceholder = `Search ${products.length} products, ${users.length} users, ${totalOrders} orders`

  return (
    <motion.section
      className={`admin-shell ${darkMode ? 'dark' : ''}`}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.48 }}
    >
      <button
        className={`admin-mobile-overlay ${sidebarOpen ? 'open' : ''}`}
        type="button"
        aria-label="Close admin menu"
        onClick={() => setSidebarOpen(false)}
      />

      <aside
        ref={sidebarRef}
        className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}
        aria-label="Admin sidebar"
      >
        <div className="admin-sidebar-brand">
          <div className="admin-brand-mark" aria-hidden>AM</div>
          <div>
            <strong>Alan Mens Wear</strong>
            <span>Seller Console</span>
          </div>
          <button
            className="admin-sidebar-close"
            type="button"
            aria-label="Close admin menu"
            onClick={() => setSidebarOpen(false)}
          >
            <FiX aria-hidden />
          </button>
        </div>

        <div className="admin-identity-card">
          <div className="admin-avatar" aria-hidden>{adminInitial}</div>
          <div>
            <strong>{adminName}</strong>
            <span>{adminEmail}</span>
          </div>
        </div>

        <nav className="admin-sidebar-nav" aria-label="Admin sections">
          {adminNavItems.map(({ id, label, Icon }) => (
            <button
              className={activeSection === id ? 'active' : ''}
              key={id}
              type="button"
              aria-current={activeSection === id ? 'page' : undefined}
              onClick={() => handleAdminNavClick(id)}
            >
              <Icon aria-hidden />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <AdminLogout onCleanup={cleanupAdminState} />
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <button
            className="admin-icon-button menu-button"
            type="button"
            aria-label="Open admin menu"
            aria-expanded={sidebarOpen}
            onClick={() => setSidebarOpen(true)}
          >
            <FiMenu aria-hidden />
          </button>

          <label className="admin-search">
            <FiSearch aria-hidden />
            <span className="sr-only">Search admin dashboard</span>
            <input
              type="search"
              placeholder={searchPlaceholder}
              value={adminSearchTerm}
              onChange={(event) => setAdminSearchTerm(event.target.value)}
            />
          </label>

          <div className="admin-topbar-actions">
            <button
              className="admin-icon-button notification-button"
              type="button"
              aria-label={`${notificationCount} notifications`}
              onClick={() => toast.info(`${pendingOrders} pending orders and ${reviews.length} reviews`)}
            >
              <FiBell aria-hidden />
              <span>{notificationCount}</span>
            </button>

            <button
              className="admin-icon-button"
              type="button"
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              onClick={() => setDarkMode((enabled) => !enabled)}
            >
              {darkMode ? <FiSun aria-hidden /> : <FiMoon aria-hidden />}
            </button>

            <div className="admin-profile-menu" ref={profileMenuRef}>
              <button
                className="admin-profile-trigger"
                type="button"
                aria-label="Open admin profile menu"
                aria-expanded={profileMenuOpen}
                onClick={() => setProfileMenuOpen((open) => !open)}
              >
                <span className="admin-avatar small" aria-hidden>{adminInitial}</span>
                <span>{adminName}</span>
                <FiChevronDown aria-hidden />
              </button>

              {profileMenuOpen && (
                <div className="admin-profile-dropdown" role="menu" aria-label="Admin profile menu">
                  <strong>{adminName}</strong>
                  <span>{adminEmail}</span>
                  <AdminLogout onCleanup={cleanupAdminState} />
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="admin-content">
          <div className="section-heading admin-heading-row">
            <div>
              <p className="eyebrow">Admin</p>
              <h1>Dashboard</h1>
              <p>Manage products, users, orders, reviews, and store activity from one place.</p>
            </div>
          </div>

          <MessageBox notice={notice} onClose={() => setNotice(null)} />

      <motion.section
        id="dashboard-section"
        className="dashboard-grid admin-metrics-grid"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        {[
          ['Total Products', products.length],
          ['Total Users', users.length],
          ['Total Orders', totalOrders],
          ['Delivered Orders', deliveredOrders],
          ['Pending Orders', pendingOrders],
          ['Total Revenue', `Rs. ${totalRevenue.toLocaleString('en-IN')}`],
          ['Average Rating', averageRating.toFixed(1)],
        ].map(([label, value], index) => (
          <motion.article
            className="stat-card admin-metric-card"
            key={label}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.42, delay: index * 0.05 }}
            whileHover={{ y: -6, boxShadow: '0 24px 50px rgba(16, 22, 32, 0.14)' }}
          >
            <p>{label}</p>
            <strong>{value}</strong>
          </motion.article>
        ))}
      </motion.section>

      <motion.div
        id="products-section"
        className="admin-layout"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.08 }}
      >
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
              Default Price
              <input
                name="price"
                min="0"
                placeholder="Optional fallback"
                type="number"
                value={formData.price}
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
          </div>

          <fieldset className="size-inventory-fieldset">
            <legend>Size-wise Stock and Price</legend>
            <p>Enter stock and price for every size you want to sell. Leave stock as 0 or blank to hide a size.</p>
            <div className="size-inventory-grid">
              {sizeOptions.map((size) => (
                <label key={size}>
                  <span>{size}</span>
                  <input
                    min="0"
                    type="number"
                    inputMode="numeric"
                    placeholder="Stock"
                    value={formData.sizeInventory[size]}
                    onChange={(event) => handleSizeInventoryChange(size, event.target.value)}
                  />
                  <input
                    min="0"
                    type="number"
                    inputMode="decimal"
                    placeholder="Price"
                    value={formData.sizePrices[size]}
                    onChange={(event) => handleSizePriceChange(size, event.target.value)}
                  />
                </label>
              ))}
            </div>
          </fieldset>

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
                  <th>Size Stock</th>
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
                    <td>Rs. {Number(product.price).toLocaleString('en-IN')}</td>
                    <td>
                      <div className="size-stock-tags">
                        {getSizeInventoryEntries(product).map(([size, amount]) => (
                          <span key={size}>
                            {size}: {amount} / Rs. {getSizePrice(product, size).toLocaleString('en-IN')}
                          </span>
                        ))}
                      </div>
                    </td>
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
      </motion.div>

      <div id="users-section" className="admin-panel users-panel">
        <div className="admin-panel-heading">
          <div>
            <h2>Users</h2>
            <p>Customer records shown with stack controls. Top item follows LIFO order.</p>
          </div>
          <strong>{users.length}</strong>
        </div>

        {users.length > 0 ? (
          <>
            <table>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Mobile</th>
                  <th>Password</th>
                  <th>Role</th>
                  <th>User Code</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name || user.displayName || '-'}</td>
                    <td>{user.email || '-'}</td>
                    <td>
                      {user.phone || '-'}
                      {user.phoneVerified && <span className="table-subtext">OTP verified</span>}
                    </td>
                    <td>{user.passwordStatus || 'Secured in Firebase Auth'}</td>
                    <td>{user.role || 'customer'}</td>
                    <td>{user.userCode || user.id.slice(0, 8)}</td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td>
                      <div className="table-actions">
                        <button type="button" onClick={() => handleSendPasswordReset(user)}>
                          Reset Password
                        </button>
                        <button type="button" onClick={() => handlePushUser(user)}>
                          Push Stack
                        </button>
                        <button
                          className="danger"
                          type="button"
                          disabled={user.id === currentUser.uid}
                          onClick={() => handleRemoveUser(user)}
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="stack-panel">
              <div className="admin-panel-heading">
                <div>
                  <h2>User Stack</h2>
                  <p>LIFO view: the last pushed user appears first.</p>
                </div>
                <div className="table-actions">
                  <button type="button" onClick={handlePopUser}>
                    Pop
                  </button>
                  <button type="button" onClick={() => setUserStack([])}>
                    Clear
                  </button>
                </div>
              </div>

              {userStack.length === 0 ? (
                <p className="empty-state">Stack is empty.</p>
              ) : (
                <ol className="user-stack-list">
                  {userStack.slice().reverse().map((stackUser, index) => (
                    <li key={stackUser.id}>
                      <strong>{index === 0 ? 'Top' : `#${index + 1}`}</strong>
                      <span>{stackUser.name || 'Unknown user'}</span>
                      <small>{stackUser.email || stackUser.phone || stackUser.id}</small>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </>
        ) : (
          <div className="empty-state">
            <h2>No users found</h2>
            <p>Users are loaded from the Firestore users collection.</p>
          </div>
        )}
      </div>

      <div id="orders-section" className="admin-section-anchor">
        <OrderManagement onSummaryChange={setOrdersSummary} />
      </div>
      <div id="reviews-section" className="admin-section-anchor">
        <ReviewManagement />
      </div>

        </main>
      </div>
    </motion.section>
  )
}

function formatDate(value) {
  if (!value) {
    return '-'
  }

  if (value.toDate) {
    return value.toDate().toLocaleString()
  }

  return String(value)
}

function getSizeInventoryEntries(product) {
  if (product.sizeInventory && typeof product.sizeInventory === 'object') {
    return sizeOptions
      .filter((size) => Number(product.sizeInventory[size] || 0) > 0)
      .map((size) => [size, Number(product.sizeInventory[size])])
  }

  if (Array.isArray(product.sizes)) {
    return product.sizes.map((size) => [size, product.stock || 0])
  }

  return []
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

