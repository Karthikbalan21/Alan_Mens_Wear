import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

function ImageModal({ imageUrl, title = 'Image preview', onClose }) {
  useEffect(() => {
    if (!imageUrl) {
      return undefined
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [imageUrl, onClose])

  return (
    <AnimatePresence>
      {imageUrl && (
        <motion.div
          className="image-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="image-modal"
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ duration: 0.2 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="image-modal-header">
              <h3>{title}</h3>
              <div>
                <a className="text-button" href={imageUrl} download target="_blank" rel="noreferrer">
                  Download
                </a>
                <button type="button" aria-label="Close image preview" onClick={onClose}>
                  x
                </button>
              </div>
            </div>
            <img src={imageUrl} alt={title} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ImageModal
