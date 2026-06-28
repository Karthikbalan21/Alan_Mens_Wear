import { FiSearch } from 'react-icons/fi'

const filterOptions = [
  ['all', 'All Customers'],
  ['active', 'Active Customers'],
  ['withOrders', 'Customers With Orders'],
  ['withoutOrders', 'Customers Without Orders'],
  ['recent', 'Recently Registered'],
]

function CustomerFilters({ filters, onChange }) {
  const updateFilter = (name, value) => onChange({ ...filters, [name]: value })

  return (
    <section className="customer-filter-panel">
      <div className="customer-filter-tabs" aria-label="Customer filters">
        {filterOptions.map(([value, label]) => (
          <button
            className={filters.type === value ? 'active' : ''}
            key={value}
            type="button"
            onClick={() => updateFilter('type', value)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="customer-search-grid">
        <label>
          <FiSearch aria-hidden />
          <span className="sr-only">Search by name</span>
          <input
            type="search"
            placeholder="Search by name"
            value={filters.name}
            onChange={(event) => updateFilter('name', event.target.value)}
          />
        </label>
        <label>
          <FiSearch aria-hidden />
          <span className="sr-only">Search by email</span>
          <input
            type="search"
            placeholder="Search by email"
            value={filters.email}
            onChange={(event) => updateFilter('email', event.target.value)}
          />
        </label>
        <label>
          <FiSearch aria-hidden />
          <span className="sr-only">Search by phone</span>
          <input
            type="search"
            placeholder="Search by phone"
            value={filters.phone}
            onChange={(event) => updateFilter('phone', event.target.value)}
          />
        </label>
      </div>
    </section>
  )
}

export default CustomerFilters
