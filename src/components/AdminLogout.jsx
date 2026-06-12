import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import ConfirmModal from './ConfirmModal'

function AdminLogout({ onCleanup }) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      await logout()
      if (typeof onCleanup === 'function') onCleanup()
      navigate('/admin/login', { replace: true, state: { successMessage: 'Logged out successfully' } })
    } catch (err) {
      // basic fallback error handling
      // keep UI simple: alert (project has MessageBox in admin - handled by parent)
      // eslint-disable-next-line no-alert
      alert(err?.message || 'Unable to logout. Please try again.')
    } finally {
      setIsLoading(false)
      setOpen(false)
    }
  }

  return (
    <div className="admin-logout-wrapper">
      <motion.button
        className="btn secondary admin-logout-btn"
        type="button"
        onClick={() => setOpen(true)}
        whileHover={{ y: -2, scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
      >
        <span className="logout-icon" aria-hidden>
          ⏻
        </span>
        Logout
      </motion.button>

      <ConfirmModal
        open={open}
        title="Confirm Logout"
        description="Are you sure you want to logout from the admin dashboard?"
        confirmLabel="Logout"
        onCancel={() => setOpen(false)}
        onConfirm={handleConfirm}
        isLoading={isLoading}
      />
    </div>
  )
}

export default AdminLogout
