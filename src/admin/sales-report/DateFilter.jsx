import { FiCalendar, FiSearch } from 'react-icons/fi'

const ranges = [
  ['today', 'Today'],
  ['week', 'This Week'],
  ['month', 'This Month'],
  ['year', 'This Year'],
  ['custom', 'Custom Date Range'],
]

const sortOptions = [
  ['latest', 'Latest First'],
  ['highest', 'Highest Revenue'],
  ['lowest', 'Lowest Revenue'],
]

function DateFilter({ filters, onChange }) {
  const updateFilter = (name, value) => onChange({ ...filters, [name]: value })

  return (
    <section className="sales-filter-panel">
      <div className="sales-range-buttons" aria-label="Sales date filters">
        {ranges.map(([value, label]) => (
          <button
            className={filters.range === value ? 'active' : ''}
            key={value}
            type="button"
            onClick={() => updateFilter('range', value)}
          >
            {label}
          </button>
        ))}
      </div>

      {filters.range === 'custom' && (
        <div className="sales-custom-dates">
          <label>
            <FiCalendar aria-hidden />
            <span className="sr-only">Start date</span>
            <input
              type="date"
              value={filters.startDate}
              onChange={(event) => updateFilter('startDate', event.target.value)}
            />
          </label>
          <label>
            <FiCalendar aria-hidden />
            <span className="sr-only">End date</span>
            <input
              type="date"
              value={filters.endDate}
              onChange={(event) => updateFilter('endDate', event.target.value)}
            />
          </label>
        </div>
      )}

      <div className="sales-search-grid">
        <label>
          <FiSearch aria-hidden />
          <span className="sr-only">Search customer name</span>
          <input
            type="search"
            placeholder="Search customer name"
            value={filters.customer}
            onChange={(event) => updateFilter('customer', event.target.value)}
          />
        </label>
        <label>
          <FiSearch aria-hidden />
          <span className="sr-only">Search order ID</span>
          <input
            type="search"
            placeholder="Search order ID"
            value={filters.orderId}
            onChange={(event) => updateFilter('orderId', event.target.value)}
          />
        </label>
        <label>
          <span className="sr-only">Sort report</span>
          <select value={filters.sortBy} onChange={(event) => updateFilter('sortBy', event.target.value)}>
            {sortOptions.map(([value, label]) => (
              <option value={value} key={value}>{label}</option>
            ))}
          </select>
        </label>
      </div>
    </section>
  )
}

export default DateFilter
