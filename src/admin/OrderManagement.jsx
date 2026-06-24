import { useEffect, useState } from 'react'
import {
  orderStatuses,
  subscribeAllOrders,
  updateOrderStatus,
} from '../services/orderService'
import { toast } from 'react-toastify'
import ImageModal from '../components/ImageModal'
import { exportOrdersToExcel, exportOrdersToPdf } from '../services/exportService'

function formatOrderDate(order) {
  const date = order.createdAt?.toDate?.()
  return date ? date.toLocaleDateString('en-IN') : 'Pending'
}

function OrderManagement({ onSummaryChange }) {
  const [orders, setOrders] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [loading, setLoading] = useState(true)
  const [updatingOrderId, setUpdatingOrderId] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [selectedScreenshot, setSelectedScreenshot] = useState(null)

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

  useEffect(() => {
    const totalOrders = orders.length
    const deliveredOrders = orders.filter((order) => order.status === 'Delivered').length
    const pendingOrders = orders.filter((order) => order.status !== 'Delivered').length
    const totalRevenue = orders.reduce(
      (total, order) => total + (order.status === 'Delivered' ? Number(order.totalAmount || 0) : 0),
      0,
    )

    onSummaryChange?.({
      totalOrders,
      deliveredOrders,
      pendingOrders,
      totalRevenue,
    })
  }, [orders, onSummaryChange])

  const handleStatusChange = async (orderId, status) => {
    setUpdatingOrderId(orderId)
    setMessage('')
    setError('')

    try {
      await updateOrderStatus(orderId, status)
      setMessage('Order status updated successfully.')
      toast.success(`Order updated to ${status}.`)
    } catch (statusError) {
      setError(statusError.message)
      toast.error(statusError.message)
    } finally {
      setUpdatingOrderId('')
    }
  }

  const filteredOrders = orders.filter((order) => {
    const searchableText = [
      order.id,
      order.customerName,
      order.customerEmail,
      ...(order.items || []).map((item) => item.name),
    ].join(' ').toLowerCase()
    const matchesSearch = searchableText.includes(searchTerm.trim().toLowerCase())
    const matchesStatus = statusFilter === 'All' || order.status === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <section className="admin-panel order-management">
      <div className="admin-panel-heading">
        <h2>Order Management</h2>
        <strong>{orders.length}</strong>
      </div>

      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-box">{error}</p>}

      <div className="order-admin-tools">
        <label className="search-box">
          Search Orders
          <input
            type="search"
            placeholder="Order ID, customer, product..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </label>
        <label className="search-box">
          Filter Status
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="All">All</option>
            {orderStatuses.map((status) => (
              <option value={status} key={status}>{status}</option>
            ))}
          </select>
        </label>
        <div className="admin-export-actions">
          <button
            className="btn secondary"
            type="button"
            onClick={() => exportOrdersToExcel(filteredOrders)}
            disabled={!filteredOrders.length}
          >
            Export Excel
          </button>
          <button
            className="btn secondary"
            type="button"
            onClick={() => exportOrdersToPdf(filteredOrders)}
            disabled={!filteredOrders.length}
          >
            Export PDF
          </button>
        </div>
      </div>

      {loading ? (
        <p>Loading orders...</p>
      ) : filteredOrders.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Products</th>
              <th>Total</th>
              <th>Date</th>
              <th>Payment</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr key={order.id}>
                <td>
                  <strong>#{order.id.slice(0, 8)}</strong>
                  {order.userCode && <span className="table-subtext">{order.userCode}</span>}
                </td>
                <td>
                  <strong>{order.customerName}</strong>
                  <span className="table-subtext">{order.customerEmail}</span>
                </td>
                <td>
                  <div className="order-products-list">
                    {(order.items || []).map((item) => (
                      <div key={`${item.productId}-${item.quantity}`}>
                        <strong>{item.name}</strong>
                        <span>{item.productCode || item.productId} × {item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </td>
                <td>₹ {Number(order.totalAmount).toLocaleString('en-IN')}</td>
                <td>{formatOrderDate(order)}</td>
                <td>
                  {order.payment?.screenshotUrl ? (
                    <button
                      className="text-button"
                      type="button"
                      onClick={() => setSelectedScreenshot(order.payment.screenshotUrl)}
                    >
                      View Screenshot
                    </button>
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

      <ImageModal
        imageUrl={selectedScreenshot}
        title="Payment Screenshot"
        onClose={() => setSelectedScreenshot(null)}
      />
    </section>
  )
}

export default OrderManagement
