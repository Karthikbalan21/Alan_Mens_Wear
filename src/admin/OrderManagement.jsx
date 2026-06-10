import { useEffect, useState } from 'react'
import {
  orderStatuses,
  subscribeAllOrders,
  updateOrderStatus,
} from '../services/orderService'

function formatOrderDate(order) {
  const date = order.createdAt?.toDate?.()
  return date ? date.toLocaleDateString('en-IN') : 'Pending'
}

function OrderManagement() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingOrderId, setUpdatingOrderId] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const unsubscribe = subscribeAllOrders(
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
  }, [])

  const handleStatusChange = async (orderId, status) => {
    setUpdatingOrderId(orderId)
    setMessage('')
    setError('')

    try {
      await updateOrderStatus(orderId, status)
      setMessage('Order status updated successfully.')
    } catch (statusError) {
      setError(statusError.message)
    } finally {
      setUpdatingOrderId('')
    }
  }

  return (
    <section className="admin-panel order-management">
      <div className="admin-panel-heading">
        <h2>Order Management</h2>
        <strong>{orders.length}</strong>
      </div>

      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-box">{error}</p>}

      {loading ? (
        <p>Loading orders...</p>
      ) : orders.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Date</th>
              <th>Payment</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>#{order.id.slice(0, 8)}</td>
                <td>
                  <strong>{order.customerName}</strong>
                  <span className="table-subtext">{order.customerEmail}</span>
                </td>
                <td>₹ {Number(order.totalAmount).toLocaleString('en-IN')}</td>
                <td>{formatOrderDate(order)}</td>
                <td>
                  {order.payment?.screenshotUrl ? (
                    <a href={order.payment.screenshotUrl} target="_blank" rel="noreferrer">
                      View Screenshot
                    </a>
                  ) : (
                    'Not uploaded'
                  )}
                </td>
                <td>
                  <select
                    value={order.status || 'Pending'}
                    disabled={updatingOrderId === order.id}
                    onChange={(event) => handleStatusChange(order.id, event.target.value)}
                  >
                    {orderStatuses.map((status) => (
                      <option value={status} key={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="empty-state">
          <h2>No orders yet</h2>
          <p>Customer orders will appear here.</p>
        </div>
      )}
    </section>
  )
}

export default OrderManagement
