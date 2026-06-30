import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import QRCode from 'qrcode'
import { FiCheckCircle, FiFileText, FiMinus, FiPlus, FiShoppingBag, FiTrash2, FiUploadCloud } from 'react-icons/fi'
import { HiSparkles } from 'react-icons/hi2'
import { toast } from 'react-toastify'
import { useAuth } from '../context/useAuth'
import { useCart } from '../context/useCart'
import { placeOrder, uploadPaymentScreenshot } from '../services/orderService'
import { getProducts } from '../services/productService'

const validPaymentImageTypes = ['image/jpeg', 'image/png', 'image/webp']
const upiId = 'karthikbalan.r@okhdfcbank'
const upiPayeeName = 'R.KARTHIK BALAN'

function Cart() {
  const [loading, setLoading] = useState(true)
  const [placingOrder, setPlacingOrder] = useState(false)
  const [paymentScreenshot, setPaymentScreenshot] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [upiQrCode, setUpiQrCode] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const { currentUser, userProfile } = useAuth()
  const {
    cartItems,
    updateQuantity,
    removeItem,
    clearCart,
    cartError,
    syncCartProducts,
  } = useCart()
  const paymentPreviewUrl = useMemo(
    () => (paymentScreenshot ? URL.createObjectURL(paymentScreenshot) : ''),
    [paymentScreenshot],
  )

  useEffect(() => (
    () => {
      if (paymentPreviewUrl) {
        URL.revokeObjectURL(paymentPreviewUrl)
      }
    }
  ), [paymentPreviewUrl])

  useEffect(() => {
    const loadCartItems = async () => {
      try {
        const productList = await getProducts()
        syncCartProducts(productList)
        setError('')
      } catch (loadError) {
        setError(loadError.message)
      } finally {
        setLoading(false)
      }
    }

    loadCartItems()
  }, [syncCartProducts])

  const handlePaymentScreenshotChange = (event) => {
    const file = event.target.files[0]
    setMessage('')
    setUploadProgress(0)

    if (!file) {
      setPaymentScreenshot(null)
      return
    }

    if (!validPaymentImageTypes.includes(file.type)) {
      const errorMessage = 'Upload a valid payment screenshot: JPG, PNG, or WEBP.'
      setPaymentScreenshot(null)
      setError(errorMessage)
      toast.error(errorMessage)
      event.target.value = ''
      return
    }

    setError('')
    setPaymentScreenshot(file)
    toast.success('Payment screenshot selected.')
  }

  const handlePlaceOrder = async () => {
    setPlacingOrder(true)
    setMessage('')
    setError('')

    try {
      if (!currentUser) {
        throw new Error('Please log in before placing an order.')
      }

      if (!paymentScreenshot) {
        throw new Error('Upload your UPI payment screenshot before placing the order.')
      }

      const paymentProof = await uploadPaymentScreenshot(
        paymentScreenshot,
        setUploadProgress,
      )
      toast.success('Payment proof uploaded.')

      await placeOrder(cartItems, paymentProof, currentUser, userProfile)
      await clearCart()
      setPaymentScreenshot(null)
      setUploadProgress(0)
      setMessage('Order placed successfully. Track status from My Orders. Invoice download unlocks after delivery feedback.')
      toast.success('Order placed successfully.')
    } catch (orderError) {
      setError(orderError.message)
      toast.error(orderError.message)
    } finally {
      setPlacingOrder(false)
    }
  }

  const subtotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  )
  const deliveryCharge = cartItems.length > 0 ? 0 : 0
  const totalAmount = subtotal + deliveryCharge
  const formattedTotalAmount = totalAmount.toFixed(2)

  useEffect(() => {
    let isCurrent = true

    if (totalAmount <= 0) {
      return undefined
    }

    const upiPaymentUrl = [
      'upi://pay',
      `pa=${encodeURIComponent(upiId)}`,
      `pn=${encodeURIComponent(upiPayeeName)}`,
      `am=${formattedTotalAmount}`,
      'cu=₹',
      `tn=${encodeURIComponent('Alan Mens Wear order payment')}`,
    ].join('&').replace('upi://pay&', 'upi://pay?')

    QRCode.toDataURL(upiPaymentUrl, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 320,
    })
      .then((qrCodeUrl) => {
        if (isCurrent) {
          setUpiQrCode(qrCodeUrl)
        }
      })
      .catch(() => {
        if (isCurrent) {
          setUpiQrCode('')
        }
      })

    return () => {
      isCurrent = false
    }
  }, [formattedTotalAmount, totalAmount])

  return (
    <section className="container page-section">
      <div className="section-heading">
        <p className="eyebrow">Checkout</p>
        <h1>Shopping Cart</h1>
        <p>Review selected products, adjust quantities, and continue to checkout.</p>
      </div>

      {message && <p className="success-message">{message}</p>}
      {(error || cartError) && <p className="error-box">{error || cartError}</p>}

      {loading ? (
        <div className="empty-state">
          <h2>Loading cart...</h2>
        </div>
      ) : cartItems.length > 0 ? (
        <div className="cart-layout">
          <div className="cart-items">
            {cartItems.map((item) => (
              <article className="cart-item" key={item.id}>
                <img src={item.image} alt={item.name} />

                <div className="cart-item-info">
                  <p className="category">{item.category}</p>
                  <h3>{item.name}</h3>
                  {item.selectedSize && <p className="cart-size">Size: {item.selectedSize}</p>}
                  <p className={item.stock <= 0 ? 'cart-stock out-stock' : 'cart-stock'}>
                    {item.stock <= 0 ? 'Out of Stock' : `Available Stock: ${item.stock}`}
                  </p>
                  <strong>₹ {Number(item.price).toLocaleString('en-IN')}</strong>
                </div>

                <div className="cart-actions">
                  <div className="cart-quantity" aria-label={`Quantity for ${item.name}`}>
                    <button
                      type="button"
                      disabled={item.quantity <= 1}
                      onClick={async () => {
                        const result = await updateQuantity(item.id, -1)
                        if (!result.ok) {
                          setError(result.message)
                          toast.error(result.message)
                        }
                      }}
                      aria-label="Decrease quantity"
                    >
                      <FiMinus aria-hidden="true" />
                    </button>
                    <strong>{item.quantity}</strong>
                    <button
                      type="button"
                      disabled={item.quantity >= item.stock}
                      onClick={async () => {
                        const result = await updateQuantity(item.id, 1)
                        if (!result.ok) {
                          setError(result.message)
                          toast.error(result.message)
                        }
                      }}
                      aria-label="Increase quantity"
                    >
                      <FiPlus aria-hidden="true" />
                    </button>
                  </div>

                  <p className="line-total">
                    ₹ {(Number(item.price) * item.quantity).toLocaleString('en-IN')}
                  </p>

                  <button
                    className="remove-btn"
                    type="button"
                    onClick={async () => {
                      try {
                        await removeItem(item.id)
                        toast.info(`${item.name} removed from cart.`)
                      } catch (removeError) {
                        setError(removeError.message)
                        toast.error(removeError.message)
                      }
                    }}
                  >
                    <FiTrash2 aria-hidden="true" />
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>

          <aside className="summary-card cart-summary">
            <h2>Order Summary</h2>
            <p>Subtotal <strong>₹ {subtotal.toLocaleString('en-IN')}</strong></p>
            <p>Delivery <strong>Free</strong></p>
            <p className="grand-total">
              Total <strong>₹ {totalAmount.toLocaleString('en-IN')}</strong>
            </p>

            <div className="upi-payment-box">
              {upiQrCode && (
                <img
                  src={upiQrCode}
                  alt={`UPI QR code for ₹ ${formattedTotalAmount}`}
                />
              )}
              <strong>Scan and pay ₹ {totalAmount.toLocaleString('en-IN')}</strong>
              <span>UPI ID: {upiId}</span>
              <span>The QR includes the exact cart total.</span>
            </div>

            <label className={`payment-upload ${paymentScreenshot ? 'is-ready' : ''}`}>
              <span className="payment-upload-heading">
                <FiUploadCloud aria-hidden="true" />
                Payment Screenshot
              </span>
              <input
                accept="image/png,image/jpeg,image/webp"
                type="file"
                onChange={handlePaymentScreenshotChange}
              />
              <span>Upload JPG, PNG, or WEBP proof after payment.</span>
            </label>

            {paymentScreenshot && (
              <div className="payment-proof-ready">
                <div className="payment-proof-preview">
                  {paymentPreviewUrl ? (
                    <img src={paymentPreviewUrl} alt="Selected payment screenshot preview" />
                  ) : (
                    <FiFileText aria-hidden="true" />
                  )}
                  <span className="sparkle sparkle-one"><HiSparkles aria-hidden="true" /></span>
                  <span className="sparkle sparkle-two"><HiSparkles aria-hidden="true" /></span>
                </div>
                <div>
                  <p className="payment-file">
                    <FiCheckCircle aria-hidden="true" />
                    {paymentScreenshot.name}
                  </p>
                  <span>Ready to upload with your order.</span>
                </div>
              </div>
            )}

            {placingOrder && (
              <div className="upload-progress" aria-label="Payment screenshot upload progress">
                <span style={{ width: `${uploadProgress}%` }}></span>
                <strong>{uploadProgress}%</strong>
              </div>
            )}

            <button
              className="btn primary"
              disabled={
                placingOrder ||
                !currentUser ||
                !paymentScreenshot ||
                cartItems.some((item) => item.stock <= 0)
              }
              type="button"
              onClick={handlePlaceOrder}
            >
              {!placingOrder && currentUser && <FiShoppingBag aria-hidden="true" />}
              {placingOrder
                ? 'Placing Order...'
                : currentUser
                  ? 'Place Order'
                  : 'Login to Place Order'}
            </button>
            {!currentUser && <Link className="forgot-link" to="/login">Login first</Link>}
          </aside>
        </div>
      ) : (
        <div className="empty-state">
          <h2>Your cart is empty</h2>
          <p>Add menswear essentials from the product collection.</p>
          <Link className="btn primary" to="/products">Shop Products</Link>
        </div>
      )}
    </section>
  )
}

export default Cart
