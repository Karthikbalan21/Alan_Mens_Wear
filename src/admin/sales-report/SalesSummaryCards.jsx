import {
  FiCalendar,
  FiCheckCircle,
  FiDollarSign,
  FiShoppingCart,
  FiTrendingUp,
} from 'react-icons/fi'

const cards = [
  { key: 'totalRevenue', label: 'Total Revenue', Icon: FiDollarSign, type: 'currency' },
  { key: 'totalOrders', label: 'Total Orders', Icon: FiShoppingCart },
  { key: 'completedOrders', label: 'Completed Orders', Icon: FiCheckCircle },
  { key: 'averageOrderValue', label: 'Average Order Value', Icon: FiTrendingUp, type: 'currency' },
  { key: 'todaysSales', label: "Today's Sales", Icon: FiCalendar, type: 'currency' },
  { key: 'monthSales', label: "This Month's Sales", Icon: FiTrendingUp, type: 'currency' },
]

function SalesSummaryCards({ summary, formatCurrency }) {
  return (
    <section className="sales-summary-grid" aria-label="Sales summary">
      {cards.map(({ key, label, Icon, type }) => (
        <article className="sales-glass-card sales-summary-card" key={key}>
          <span className="sales-card-icon" aria-hidden>
            <Icon />
          </span>
          <div>
            <p>{label}</p>
            <strong>{type === 'currency' ? formatCurrency(summary[key]) : summary[key]}</strong>
          </div>
        </article>
      ))}
    </section>
  )
}

export default SalesSummaryCards
