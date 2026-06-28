import { FiEye, FiPower, FiTrash2 } from 'react-icons/fi'

function CustomerTable({ customers, onView, onToggleStatus, onDelete, formatCurrency, formatDate }) {
  return (
    <section className="customer-table-panel customer-glass-card">
      <div className="admin-panel-heading">
        <div>
          <h2>Customers</h2>
          <p>Registered customer accounts and purchase activity</p>
        </div>
        <strong>{customers.length}</strong>
      </div>

      <div className="customer-table-wrap">
        <table className="customer-table">
          <thead>
            <tr>
              <th>Profile Photo</th>
              <th>Customer Name</th>
              <th>Email</th>
              <th>Phone Number</th>
              <th>Address</th>
              <th>Registration Date</th>
              <th>Total Orders</th>
              <th>Total Amount Spent</th>
              <th>Last Purchase Date</th>
              <th>Account Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id} onClick={() => onView(customer)}>
                <td>
                  <CustomerAvatar customer={customer} />
                </td>
                <td><strong>{customer.name}</strong></td>
                <td>{customer.email}</td>
                <td>{customer.phone}</td>
                <td className="customer-address-cell">{customer.address}</td>
                <td>{formatDate(customer.createdAt)}</td>
                <td>{customer.totalOrders}</td>
                <td>{formatCurrency(customer.totalAmountSpent)}</td>
                <td>{formatDate(customer.lastPurchaseDate)}</td>
                <td>
                  <span className={`customer-status ${customer.isActive ? 'active' : 'disabled'}`}>
                    {customer.isActive ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td onClick={(event) => event.stopPropagation()}>
                  <div className="customer-row-actions">
                    <button type="button" aria-label="View customer details" onClick={() => onView(customer)}>
                      <FiEye aria-hidden />
                    </button>
                    <button
                      type="button"
                      aria-label={customer.isActive ? 'Disable customer account' : 'Enable customer account'}
                      onClick={() => onToggleStatus(customer)}
                    >
                      <FiPower aria-hidden />
                    </button>
                    <button
                      className="danger"
                      type="button"
                      aria-label="Delete customer"
                      onClick={() => onDelete(customer)}
                    >
                      <FiTrash2 aria-hidden />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function CustomerAvatar({ customer }) {
  return (
    <div className="customer-avatar">
      {customer.profileImage ? (
        <img src={customer.profileImage} alt={customer.name} />
      ) : (
        <span>{customer.name.charAt(0).toUpperCase()}</span>
      )}
    </div>
  )
}

export default CustomerTable
