import { FiPower, FiTrash2, FiX } from 'react-icons/fi'

function CustomerDetailsModal({ customer, onClose, onToggleStatus, onDelete, formatCurrency, formatDate }) {
  if (!customer) {
    return null
  }

  return (
    <div className="modal-overlay customer-modal-overlay" role="presentation" onMouseDown={onClose}>
      <section
        className="customer-details-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="customer-details-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="customer-modal-header">
          <div className="customer-modal-profile">
            <div className="customer-avatar large">
              {customer.profileImage ? (
                <img src={customer.profileImage} alt={customer.name} />
              ) : (
                <span>{customer.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div>
              <p className="eyebrow">Customer Profile</p>
              <h2 id="customer-details-title">{customer.name}</h2>
              <span className={`customer-status ${customer.isActive ? 'active' : 'disabled'}`}>
                {customer.isActive ? 'Active' : 'Disabled'}
              </span>
            </div>
          </div>
          <button className="admin-icon-button" type="button" aria-label="Close customer details" onClick={onClose}>
            <FiX aria-hidden />
          </button>
        </header>

        <div className="customer-modal-actions">
          <button type="button" onClick={() => onToggleStatus(customer)}>
            <FiPower aria-hidden />
            {customer.isActive ? 'Disable Account' : 'Enable Account'}
          </button>
          <button className="danger" type="button" onClick={() => onDelete(customer)}>
            <FiTrash2 aria-hidden />
            Delete Customer
          </button>
        </div>

        <div className="customer-modal-grid">
          <InfoPanel title="Personal Information">
            <InfoRow label="Name" value={customer.name} />
            <InfoRow label="Email" value={customer.email} />
            <InfoRow label="Phone" value={customer.phone} />
            <InfoRow label="Address" value={customer.address} />
            <InfoRow label="Registration Date" value={formatDate(customer.createdAt)} />
          </InfoPanel>

          <InfoPanel title="Purchase Information">
            <InfoRow label="Total Orders" value={customer.totalOrders} />
            <InfoRow label="Total Amount Spent" value={formatCurrency(customer.totalAmountSpent)} />
            <InfoRow label="Delivered Orders" value={customer.deliveredOrders} />
            <InfoRow label="Pending Orders" value={customer.pendingOrders} />
            <InfoRow label="Last Purchase Date" value={formatDate(customer.lastPurchaseDate)} />
          </InfoPanel>
        </div>

        <section className="customer-order-history">
          <div className="admin-panel-heading">
            <h2>Order History</h2>
            <strong>{customer.orders.length}</strong>
          </div>
          {customer.orders.length ? (
            <div className="customer-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Product Name</th>
                    <th>Quantity</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {customer.orders.flatMap((order) =>
                    order.products.map((product) => (
                      <tr key={`${order.id}-${product.productId}-${product.name}`}>
                        <td>#{order.orderId}</td>
                        <td>{product.name}</td>
                        <td>{product.quantity}</td>
                        <td>{formatCurrency(product.amount)}</td>
                        <td>{order.status}</td>
                        <td>{formatDate(order.date)}</td>
                      </tr>
                    )),
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="customer-modal-empty">No order history for this customer.</p>
          )}
        </section>
      </section>
    </div>
  )
}

function InfoPanel({ title, children }) {
  return (
    <section className="customer-info-panel">
      <h3>{title}</h3>
      <div>{children}</div>
    </section>
  )
}

function InfoRow({ label, value }) {
  return (
    <p>
      <span>{label}</span>
      <strong>{value || '-'}</strong>
    </p>
  )
}

export default CustomerDetailsModal
