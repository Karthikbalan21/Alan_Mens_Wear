import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { subscribeUserOrders } from '../services/orderService'
import { getUserReviews } from '../services/reviewService'
import { updateUserProfile } from '../services/userService'

function formatJoinDate(currentUser, userProfile) {
  const createdAt = userProfile?.createdAt?.toDate?.() || currentUser?.metadata?.creationTime
  const date = createdAt instanceof Date ? createdAt : createdAt ? new Date(createdAt) : null
  return date ? date.toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Recently joined'
}

function Profile() {
  const { currentUser, userProfile, logout } = useAuth()
  const [orders, setOrders] = useState([])
  const [reviews, setReviews] = useState([])
  const [editing, setEditing] = useState(false)
  const [photoFile, setPhotoFile] = useState(null)
  const [formData, setFormData] = useState({ name: '', phone: '', address: '' })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!currentUser) {
      return undefined
    }

    return subscribeUserOrders(
      currentUser.uid,
      (orderList) => setOrders(orderList),
      (loadError) => setError(loadError.message),
    )
  }, [currentUser])

  useEffect(() => {
    if (!currentUser) {
      return
    }

    getUserReviews(currentUser.uid)
      .then(setReviews)
      .catch((loadError) => setError(loadError.message))
  }, [currentUser])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setFormData({
        name: userProfile?.name || currentUser?.displayName || '',
        phone: userProfile?.phone || '',
        address: userProfile?.address || '',
      })
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [currentUser, userProfile])

  const profileCompletion = useMemo(() => {
    const checks = [
      Boolean(userProfile?.photoURL || currentUser?.photoURL),
      Boolean(formData.phone || userProfile?.phone),
      Boolean(formData.address || userProfile?.address),
      Boolean(formData.name || userProfile?.name || currentUser?.displayName),
    ]

    return Math.round((checks.filter(Boolean).length / checks.length) * 100)
  }, [currentUser, formData, userProfile])

  if (!currentUser) {
    return (
      <section className="container page-section centered">
        <h1>Profile</h1>
        <p>Login to view and update your account dashboard.</p>
        <Link className="btn primary" to="/login">Login</Link>
      </section>
    )
  }

  const deliveredOrders = orders.filter((order) => order.status === 'Delivered').length
  const wishlistItems = userProfile?.wishlist?.length || 0
  const photoURL = userProfile?.photoURL || currentUser.photoURL
  const initials = (formData.name || currentUser.email || 'A').slice(0, 1).toUpperCase()

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
    setMessage('')
    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')

    try {
      await updateUserProfile(currentUser, formData, photoFile)
      setPhotoFile(null)
      setEditing(false)
      setMessage('Profile updated successfully.')
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="profile-page">
      <motion.div
        className="profile-cover"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="container profile-hero">
          <motion.div
            className="profile-avatar"
            initial={{ scale: 0.88, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.55, delay: 0.1 }}
          >
            {photoURL ? <img src={photoURL} alt={formData.name || 'Profile'} /> : initials}
          </motion.div>
          <div>
            <p className="eyebrow">Member Profile</p>
            <h1>{formData.name || currentUser.email}</h1>
            <p>{currentUser.email}</p>
            {userProfile?.userCode && <span className="profile-code">{userProfile.userCode}</span>}
            <span>Joined {formatJoinDate(currentUser, userProfile)}</span>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="container page-section profile-dashboard"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.08 }}
      >
        {message && <p className="success-message">{message}</p>}
        {error && <p className="error-box">{error}</p>}

        <motion.div
          className="dashboard-grid"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.12 }}
        >
          <motion.article whileHover={{ y: -5 }} className="stat-card"><p>Total Orders</p><strong>{orders.length}</strong></motion.article>
          <motion.article whileHover={{ y: -5 }} className="stat-card"><p>Delivered Orders</p><strong>{deliveredOrders}</strong></motion.article>
          <motion.article whileHover={{ y: -5 }} className="stat-card"><p>Wishlist Items</p><strong>{wishlistItems}</strong></motion.article>
          <motion.article whileHover={{ y: -5 }} className="stat-card"><p>Reviews Given</p><strong>{reviews.length}</strong></motion.article>
        </motion.div>

        <motion.div
          className="profile-grid"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.16 }}
        >
          <article className="profile-panel">
            <div className="admin-panel-heading">
              <h2>{profileCompletion}% Profile Complete</h2>
              <button className="text-button" type="button" onClick={() => setEditing((open) => !open)}>
                {editing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>
            <div className="profile-progress"><span style={{ width: `${profileCompletion}%` }}></span></div>
            <p>Add your photo, phone number, address, and name for faster checkout support.</p>

            {editing && (
              <motion.form
                className="product-form profile-form"
                onSubmit={handleSubmit}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <label>
                  Name
                  <input name="name" required value={formData.name} onChange={handleChange} />
                </label>
                <label>
                  Phone Number
                  <input name="phone" value={formData.phone} onChange={handleChange} />
                </label>
                <label>
                  Address
                  <textarea name="address" rows="4" value={formData.address} onChange={handleChange} />
                </label>
                <label>
                  Profile Photo
                  <input accept="image/*" type="file" onChange={(event) => setPhotoFile(event.target.files[0])} />
                </label>
                <button className="btn primary" disabled={saving} type="submit">
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
              </motion.form>
            )}
          </article>

          <article className="profile-panel quick-actions">
            <h2>Quick Actions</h2>
            <Link className="btn primary" to="/orders">My Orders</Link>
            <Link className="btn" to="/orders">My Reviews</Link>
            <button className="btn" type="button" onClick={() => setEditing(true)}>Edit Profile</button>
            <button className="btn secondary-dark" type="button" onClick={logout}>Logout</button>
          </article>
        </motion.div>
      </motion.div>
    </section>
  )
}

export default Profile
