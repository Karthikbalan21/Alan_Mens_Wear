import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { FiAlertTriangle } from 'react-icons/fi'

function ConfirmModal({ open, title, description, confirmLabel = 'Confirm', onConfirm, onCancel, isLoading = false }) {
  const cancelButtonRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined

    cancelButtonRef.current?.focus()

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onCancel?.()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-description"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onCancel?.()
        }
      }}
    >
      <motion.div
        className="confirm-modal"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.22 }}
      >
        <div className="confirm-modal-icon" aria-hidden>
          <FiAlertTriangle />
        </div>
        <h2 id="confirm-modal-title">{title}</h2>
        <p id="confirm-modal-description">{description}</p>

        <div className="confirm-modal-actions">
          <button ref={cancelButtonRef} className="btn secondary" type="button" onClick={onCancel} disabled={isLoading}>
            Cancel
          </button>
          <button className="btn primary" type="button" onClick={onConfirm} disabled={isLoading}>
            {isLoading ? 'Logging out...' : confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default ConfirmModal
