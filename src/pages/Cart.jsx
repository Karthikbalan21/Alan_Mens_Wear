import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import QRCode from 'qrcode'
import { useAuth } from '../context/useAuth'
import { useCart } from '../context/useCart'
import { downloadInvoice } from '../services/invoiceService'
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
  const [latestOrder, setLatestOrder] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const { currentUser } = useAuth()
  const {
    cartItems,
    updateQuantity,
    removeItem,
    clearCart,
    syncCartProducts,
  } = useCart()

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
      setPaymentScreenshot(null)
      setError('Upload a valid payment screenshot: JPG, PNG, or WEBP.')
      event.target.value = ''
      return
    }

    setError('')
    setPaymentScreenshot(file)
  }

  const handlePlaceOrder = async () => {
    setPlacingOrder(true)
    setMessage('')
    setError('')
    setLatestOrder(null)

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

      const order = await placeOrder(cartItems, paymentProof, currentUser)
      clearCart()
      setPaymentScreenshot(null)
      setUploadProgress(0)
      setLatestOrder(order)
      downloadInvoice(order)
      setMessage('Order placed successfully. Track status from My Orders.')
    } catch (orderError) {
      setError(orderError.message)
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
      {error && <p className="error-box">{error}</p>}
      {latestOrder && (
        <button
          className="btn primary invoice-download-btn"
          type="button"
          onClick={() => downloadInvoice(latestOrder)}
        >
          Download Invoice
        </button>
      )}

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
                      onClick={() => updateQuantity(item.id, -1)}
                      aria-label="Decrease quantity"
                    >
                      -
                    </button>
                    <strong>{item.quantity}</strong>
                    <button
                      type="button"
                      disabled={item.quantity >= item.stock}
                      onClick={() => updateQuantity(item.id, 1)}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>

                  <p className="line-total">
                    ₹ {(Number(item.price) * item.quantity).toLocaleString('en-IN')}
                  </p>

                  <button
                    className="remove-btn"
                    type="button"
                    onClick={() => removeItem(item.id)}
                  >
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

            <label className="payment-upload">
              Payment Screenshot
              <input
                accept="image/png,image/jpeg,image/webp"
                type="file"
                onChange={handlePaymentScreenshotChange}
              />
            </label>

            {paymentScreenshot && (
              <p className="payment-file">Selected: {paymentScreenshot.name}</p>
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
