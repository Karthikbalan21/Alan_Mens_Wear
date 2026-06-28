import { FiCalendar, FiCheckCircle, FiShoppingBag, FiUsers } from 'react-icons/fi'

const cards = [
  { key: 'totalCustomers', label: 'Total Registered Customers', Icon: FiUsers },
  { key: 'activeCustomers', label: 'Active Customers', Icon: FiCheckCircle },
  { key: 'newThisMonth', label: 'New Customers This Month', Icon: FiCalendar },
  { key: 'customersWithOrders', label: 'Customers with Orders', Icon: FiShoppingBag },
]

function CustomerCards({ summary }) {
  return (
    <section className="customer-cards-grid" aria-label="Customer summary">
      {cards.map(({ key, label, Icon }) => (
        <article className="customer-glass-card customer-summary-card" key={key}>
          <span className="customer-card-icon" aria-hidden>
            <Icon />
          </span>
          <div>
            <p>{label}</p>
            <strong>{summary[key]}</strong>
          </div>
        </article>
      ))}
    </section>
  )
}

export default CustomerCards
