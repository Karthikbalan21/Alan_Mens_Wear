import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { downloadInvoice } from '../services/invoiceService'
import { subscribeUserOrders } from '../services/orderService'

function formatOrderDate(order) {
  const date = order.createdAt?.toDate?.()
  return date ? date.toLocaleDateString('en-IN') : 'Pending'
}

function Orders() {
  const { currentUser } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(Boolean(currentUser))
  const [error, setError] = useState('')

  useEffect(() => {
    if (!currentUser) {
      return undefined
    }

    const unsubscribe = subscribeUserOrders(
      currentUser.uid,
      (orderList) => {
        setOrders(orderList)
        setError('')
        setLoading(false)
      },
      (loadError) => {
        setError(loadError.message)
        setLoading(false)
      },
    )

    return unsubscribe
  }, [currentUser])

  if (!currentUser) {
    return (
      <section className="container page-section centered">
        <h1>My Orders</h1>
        <p>Login to view your order status updates.</p>
        <Link className="btn primary" to="/login">Login</Link>
      </section>
    )
  }

  return (
    <section className="container page-section">
      <div className="section-heading">
        <p className="eyebrow">Orders</p>
        <h1>My Orders</h1>
        <p>Track payment, dispatch, shipping, and delivery status.</p>
      </div>

      {error && <p className="error-box">{error}</p>}

      {loading ? (
        <div className="empty-state">
          <h2>Loading orders...</h2>
        </div>
      ) : orders.length > 0 ? (
        <div className="order-card-list">
          {orders.map((order) => (
            <article className="order-card" key={order.id}>
              <div className="order-card-header">
                <div>
                  <p className="category">Order #{order.id.slice(0, 8)}</p>
                  <h2>{order.status}</h2>
                  <span>{formatOrderDate(order)}</span>
                </div>
                <strong>₹ {Number(order.totalAmount).toLocaleString('en-IN')}</strong>
              </div>

              <ul className="order-items">
                {order.items?.map((item) => (
                  <li key={item.productId}>
                    <span>{item.name}</span>
                    <strong>Qty {item.quantity}</strong>
                  </li>
                ))}
              </ul>

              <button
                className="btn small"
                type="button"
                onClick={() => downloadInvoice(order)}
              >
                Download Invoice
              </button>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>No orders yet</h2>
          <p>Your placed orders will appear here.</p>
          <Link className="btn primary" to="/products">Shop Products</Link>
        </div>
      )}
    </section>
  )
}

export default Orders
