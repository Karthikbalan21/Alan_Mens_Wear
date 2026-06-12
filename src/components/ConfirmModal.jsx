import { motion } from 'framer-motion'

function ConfirmModal({ open, title, description, confirmLabel = 'Confirm', onConfirm, onCancel, isLoading = false }) {
  if (!open) return null

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <motion.div
        className="confirm-modal"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.22 }}
      >
        <div className="confirm-modal-icon" aria-hidden>
          ⏻
        </div>
        <h2>{title}</h2>
        <p>{description}</p>

        <div className="confirm-modal-actions">
          <button className="btn secondary" type="button" onClick={onCancel} disabled={isLoading}>
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
