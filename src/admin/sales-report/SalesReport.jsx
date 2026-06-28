import { useEffect, useMemo, useState } from 'react'
import { FiAward, FiBarChart2, FiShoppingBag, FiUsers } from 'react-icons/fi'
import { toast } from 'react-toastify'
import { getDeliveredOrders } from '../../services/salesReportService'
import DateFilter from './DateFilter'
import ExportButtons from './ExportButtons'
import SalesCharts from './SalesCharts'
import SalesSummaryCards from './SalesSummaryCards'
import SalesTable from './SalesTable'

const initialFilters = {
  range: 'month',
  startDate: '',
  endDate: '',
  customer: '',
  orderId: '',
  sortBy: 'latest',
}

const formatCurrency = (amount) => `Rs. ${Number(amount || 0).toLocaleString('en-IN')}`

function SalesReport() {
  const [orders, setOrders] = useState([])
  const [filters, setFilters] = useState(initialFilters)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    async function loadSales() {
      try {
        setLoading(true)
        const deliveredOrders = await getDeliveredOrders()

        if (mounted) {
          setOrders(deliveredOrders.map(normalizeOrder).filter(Boolean))
          setError('')
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError.message)
          toast.error(loadError.message)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadSales()

    return () => {
      mounted = false
    }
  }, [])

  const filteredOrders = useMemo(() => filterAndSortOrders(orders, filters), [orders, filters])
  const productStats = useMemo(() => getProductStats(filteredOrders), [filteredOrders])
  const summary = useMemo(() => getSummary(filteredOrders, productStats), [filteredOrders, productStats])

  if (loading) {
    return <SalesReportSkeleton />
  }

  return (
    <section className="sales-report">
      <div className="sales-report-hero">
        <div>
          <p className="eyebrow">Reports</p>
          <h2>Sales Report</h2>
          <p>Revenue, order trends, product performance, and export-ready delivered sales data.</p>
        </div>
        <ExportButtons
          orders={filteredOrders}
          summary={summary}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
        />
      </div>

      {error && <p className="error-box">{error}</p>}

      <SalesSummaryCards summary={summary} formatCurrency={formatCurrency} />
      <DateFilter filters={filters} onChange={setFilters} />

      {filteredOrders.length === 0 ? (
        <EmptySalesState />
      ) : (
        <>
          <section className="sales-stats-strip">
            <StatPill Icon={FiBarChart2} label="Gross Revenue" value={formatCurrency(summary.grossRevenue)} />
            <StatPill Icon={FiShoppingBag} label="Total Products Sold" value={summary.totalProductsSold} />
            <StatPill Icon={FiUsers} label="Total Customers Purchased" value={summary.totalCustomersPurchased} />
            <StatPill Icon={FiAward} label="Highest Selling Product" value={summary.highestSellingProduct} />
            <StatPill Icon={FiAward} label="Lowest Selling Product" value={summary.lowestSellingProduct} />
          </section>

          <SalesCharts orders={filteredOrders} productStats={productStats} />

          <div className="sales-lower-grid">
            <TopProducts products={productStats.slice(0, 5)} />
            <RecentTransactions orders={filteredOrders.slice(0, 6)} />
          </div>

          <SalesTable orders={filteredOrders} formatCurrency={formatCurrency} formatDate={formatDate} />
        </>
      )}
    </section>
  )
}

function normalizeOrder(order) {
  const products = Array.isArray(order.products) ? order.products : order.items || []
  const date = toDate(order.orderDate || order.createdAt || order.date)
  const orderStatus = order.orderStatus || order.status || ''

  if (orderStatus !== 'Delivered' || !date) {
    return null
  }

  const normalizedProducts = products.map((product) => {
    const quantity = Number(product.quantity || 0)
    const price = Number(product.price || 0)

    return {
      productId: product.productId || product.id || product.productCode || product.name,
      name: product.name || product.productName || 'Unknown Product',
      image: product.image || product.productImage || '',
      category: product.category || 'Uncategorized',
      quantity,
      revenue: Number(product.total || product.totalAmount || price * quantity || 0),
    }
  })

  return {
    id: order.id || order.orderId,
    orderId: order.orderId || order.id?.slice?.(0, 8) || 'N/A',
    userId: order.userId || '',
    customerName: order.customerName || order.customer?.name || 'Guest Customer',
    products: normalizedProducts,
    totalAmount: Number(order.totalAmount || normalizedProducts.reduce((total, product) => total + product.revenue, 0)),
    quantity: Number(order.quantity || normalizedProducts.reduce((total, product) => total + product.quantity, 0)),
    paymentStatus: normalizePaymentStatus(order.paymentStatus || order.payment?.verificationStatus || order.payment?.status),
    orderStatus,
    date,
  }
}

function filterAndSortOrders(orders, filters) {
  const { start, end } = getDateRange(filters)
  const customerQuery = filters.customer.trim().toLowerCase()
  const orderQuery = filters.orderId.trim().toLowerCase()

  return orders
    .filter((order) => {
      const inDateRange = (!start || order.date >= start) && (!end || order.date <= end)
      const matchesCustomer = !customerQuery || order.customerName.toLowerCase().includes(customerQuery)
      const matchesOrder = !orderQuery || String(order.orderId).toLowerCase().includes(orderQuery)

      return inDateRange && matchesCustomer && matchesOrder
    })
    .sort((first, second) => {
      if (filters.sortBy === 'highest') {
        return second.totalAmount - first.totalAmount
      }

      if (filters.sortBy === 'lowest') {
        return first.totalAmount - second.totalAmount
      }

      return second.date.getTime() - first.date.getTime()
    })
}

function getDateRange(filters) {
  const now = new Date()
  let start = null
  let end = endOfDay(now)

  if (filters.range === 'today') {
    start = startOfDay(now)
  } else if (filters.range === 'week') {
    start = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()))
  } else if (filters.range === 'month') {
    start = new Date(now.getFullYear(), now.getMonth(), 1)
  } else if (filters.range === 'year') {
    start = new Date(now.getFullYear(), 0, 1)
  } else if (filters.range === 'custom') {
    start = filters.startDate ? startOfDay(new Date(filters.startDate)) : null
    end = filters.endDate ? endOfDay(new Date(filters.endDate)) : null
  }

  return { start, end }
}

function getProductStats(orders) {
  const stats = new Map()

  orders.forEach((order) => {
    order.products.forEach((product) => {
      const key = product.productId || product.name
      const current = stats.get(key) || {
        id: key,
        name: product.name,
        image: product.image,
        category: product.category,
        unitsSold: 0,
        revenue: 0,
      }

      current.unitsSold += product.quantity
      current.revenue += product.revenue
      current.image = current.image || product.image
      stats.set(key, current)
    })
  })

  return Array.from(stats.values()).sort((first, second) => second.unitsSold - first.unitsSold)
}

function getSummary(orders, productStats) {
  const totalRevenue = orders.reduce((total, order) => total + order.totalAmount, 0)
  const totalOrders = orders.length
  const today = new Date()
  const startToday = startOfDay(today)
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  const customerKeys = new Set(orders.map((order) => order.userId || order.customerName))
  const lowestProduct = productStats.length
    ? productStats.reduce((lowest, product) => (product.unitsSold < lowest.unitsSold ? product : lowest), productStats[0])
    : null

  return {
    totalRevenue,
    totalOrders,
    completedOrders: totalOrders,
    averageOrderValue: totalOrders ? totalRevenue / totalOrders : 0,
    todaysSales: orders
      .filter((order) => order.date >= startToday)
      .reduce((total, order) => total + order.totalAmount, 0),
    monthSales: orders
      .filter((order) => order.date >= monthStart)
      .reduce((total, order) => total + order.totalAmount, 0),
    grossRevenue: totalRevenue,
    totalProductsSold: orders.reduce((total, order) => total + order.quantity, 0),
    totalCustomersPurchased: customerKeys.size,
    highestSellingProduct: productStats[0]?.name || '-',
    lowestSellingProduct: lowestProduct?.name || '-',
  }
}

function TopProducts({ products }) {
  return (
    <section className="sales-glass-card top-products-panel">
      <div className="admin-panel-heading">
        <h2>Top 5 Best Selling Products</h2>
      </div>
      <div className="top-products-list">
        {products.map((product) => (
          <article key={product.id} className="top-product-row">
            <div className="top-product-image">
              {product.image ? <img src={product.image} alt={product.name} /> : <span>{product.name.charAt(0)}</span>}
            </div>
            <div>
              <strong>{product.name}</strong>
              <span>{product.unitsSold} units sold</span>
            </div>
            <strong>{formatCurrency(product.revenue)}</strong>
          </article>
        ))}
      </div>
    </section>
  )
}

function RecentTransactions({ orders }) {
  return (
    <section className="sales-glass-card recent-sales-panel">
      <div className="admin-panel-heading">
        <h2>Recent Transactions</h2>
      </div>
      <div className="recent-sales-list">
        {orders.map((order) => (
          <article key={order.id}>
            <div>
              <strong>#{order.orderId}</strong>
              <span>{order.customerName} • {formatDate(order.date)}</span>
            </div>
            <strong>{formatCurrency(order.totalAmount)}</strong>
          </article>
        ))}
      </div>
    </section>
  )
}

function StatPill({ Icon, label, value }) {
  return (
    <article className="sales-stat-pill">
      <Icon aria-hidden />
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </article>
  )
}

function SalesReportSkeleton() {
  return (
    <section className="sales-report">
      <div className="sales-report-hero skeleton-block tall" />
      <div className="sales-summary-grid">
        {Array.from({ length: 6 }, (_, index) => (
          <div className="sales-glass-card sales-summary-card skeleton-block" key={index} />
        ))}
      </div>
      <div className="sales-charts-grid">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="sales-glass-card sales-chart-card skeleton-block chart" key={index} />
        ))}
      </div>
    </section>
  )
}

function EmptySalesState() {
  return (
    <section className="sales-empty-state">
      <div className="sales-empty-illustration" aria-hidden>
        <span />
        <span />
        <span />
      </div>
      <h2>No Sales Data Available</h2>
      <p>Delivered orders matching your filters will appear here.</p>
    </section>
  )
}

function toDate(value) {
  if (!value) {
    return null
  }

  if (value.toDate) {
    return value.toDate()
  }

  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function endOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
}

function normalizePaymentStatus(status = 'Pending') {
  return String(status).replace(/^\w/, (letter) => letter.toUpperCase())
}

function formatDate(value) {
  return value ? value.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'
}

export default SalesReport
