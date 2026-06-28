function SalesTable({ orders, formatCurrency, formatDate }) {
  return (
    <section className="sales-table-panel sales-glass-card">
      <div className="admin-panel-heading">
        <div>
          <h2>Sales Orders</h2>
          <p>Delivered orders only</p>
        </div>
        <strong>{orders.length}</strong>
      </div>

      <div className="sales-table-wrap">
        <table className="sales-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer Name</th>
              <th>Products Purchased</th>
              <th>Quantity</th>
              <th>Total Amount</th>
              <th>Payment Status</th>
              <th>Order Status</th>
              <th>Order Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td><strong>#{order.orderId}</strong></td>
                <td>{order.customerName}</td>
                <td>
                  <div className="sales-product-list">
                    {order.products.map((product) => (
                      <span key={`${order.id}-${product.productId}-${product.name}`}>
                        {product.name} x {product.quantity}
                      </span>
                    ))}
                  </div>
                </td>
                <td>{order.quantity}</td>
                <td>{formatCurrency(order.totalAmount)}</td>
                <td><span className="sales-status neutral">{order.paymentStatus}</span></td>
                <td><span className="sales-status success">{order.orderStatus}</span></td>
                <td>{formatDate(order.date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default SalesTable
