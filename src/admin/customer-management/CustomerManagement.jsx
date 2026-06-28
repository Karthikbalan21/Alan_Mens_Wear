import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { deleteCustomerAccount, updateCustomerAccountStatus } from '../../services/adminService'
import { subscribeCustomerManagementData } from '../../services/customerManagementService'
import CustomerCards from './CustomerCards'
import CustomerDetailsModal from './CustomerDetailsModal'
import CustomerFilters from './CustomerFilters'
import CustomerTable from './CustomerTable'

const initialFilters = {
  type: 'all',
  name: '',
  email: '',
  phone: '',
}

const formatCurrency = (amount) => `Rs. ${Number(amount || 0).toLocaleString('en-IN')}`

function CustomerManagement() {
  const [customers, setCustomers] = useState([])
  const [filters, setFilters] = useState(initialFilters)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const unsubscribe = subscribeCustomerManagementData(
      ({ users, orders }) => {
        setCustomers(buildCustomerRows(users, orders))
        setError('')
        setLoading(false)
      },
      (loadError) => {
        setError(loadError.message)
        setLoading(false)
        toast.error(loadError.message)
      },
    )

    return unsubscribe
  }, [])

  const filteredCustomers = useMemo(() => filterCustomers(customers, filters), [customers, filters])
  const summary = useMemo(() => getCustomerSummary(customers), [customers])

  const handleToggleStatus = async (customer) => {
    try {
      await updateCustomerAccountStatus(customer.id, !customer.isActive)
      toast.success(`${customer.name} ${customer.isActive ? 'disabled' : 'enabled'} successfully.`)
    } catch (statusError) {
      toast.error(statusError.message)
    }
  }

  const handleDelete = async (customer) => {
    const confirmed = window.confirm(`Permanently delete ${customer.name || customer.email}?`)

    if (!confirmed) {
      return
    }

    try {
      await deleteCustomerAccount(customer.id)
      setSelectedCustomer(null)
      toast.success('Customer account deleted successfully.')
    } catch (deleteError) {
      toast.error(deleteError.message)
    }
  }

  if (loading) {
    return <CustomerSkeleton />
  }

  return (
    <section className="customer-management">
      <div className="customer-hero">
        <div>
          <p className="eyebrow">Customers</p>
          <h2>Customer Management</h2>
          <p>Review customer profiles, purchase activity, account status, and order history.</p>
        </div>
      </div>

      {error && <p className="error-box">{error}</p>}

      <CustomerCards summary={summary} />
      <CustomerFilters filters={filters} onChange={setFilters} />

      {filteredCustomers.length ? (
        <CustomerTable
          customers={filteredCustomers}
          onView={setSelectedCustomer}
          onToggleStatus={handleToggleStatus}
          onDelete={handleDelete}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
        />
      ) : (
        <EmptyCustomers />
      )}

      <CustomerDetailsModal
        customer={selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        onToggleStatus={handleToggleStatus}
        onDelete={handleDelete}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
      />
    </section>
  )
}

function buildCustomerRows(users, orders) {
  const customerOrders = new Map()

  orders.map(normalizeOrder).filter(Boolean).forEach((order) => {
    const key = order.userId

    if (!key) {
      return
    }

    const current = customerOrders.get(key) || []
    current.push(order)
    customerOrders.set(key, current)
  })

  return users
    .filter((user) => (user.role || 'customer').toLowerCase() === 'customer')
    .map((user) => {
      const id = user.uid || user.id
      const ordersForUser = (customerOrders.get(id) || []).sort((first, second) => second.date - first.date)
      const deliveredOrders = ordersForUser.filter((order) => order.status === 'Delivered')
      const totalAmountSpent = deliveredOrders.reduce((total, order) => total + order.amount, 0)

      return {
        id,
        uid: id,
        name: user.name || user.displayName || 'Unnamed Customer',
        email: user.email || '-',
        phone: user.phone || '-',
        address: formatAddress(user.address),
        gender: user.gender || '-',
        createdAt: toDate(user.createdAt),
        profileImage: user.profileImage || user.photoURL || '',
        role: user.role || 'customer',
        isActive: user.disabled !== true && (user.accountStatus || 'active') !== 'disabled',
        totalOrders: ordersForUser.length,
        totalAmountSpent,
        deliveredOrders: deliveredOrders.length,
        pendingOrders: ordersForUser.filter((order) => order.status !== 'Delivered').length,
        lastPurchaseDate: ordersForUser[0]?.date || null,
        orders: ordersForUser,
      }
    })
    .sort((first, second) => (second.createdAt?.getTime?.() || 0) - (first.createdAt?.getTime?.() || 0))
}

function normalizeOrder(order) {
  const date = toDate(order.orderDate || order.createdAt || order.date)
  const products = Array.isArray(order.products) ? order.products : order.items || []

  if (!date) {
    return null
  }

  const normalizedProducts = products.map((product) => {
    const quantity = Number(product.quantity || 0)
    const price = Number(product.price || 0)

    return {
      productId: product.productId || product.id || product.productCode || product.name,
      name: product.name || product.productName || 'Unknown Product',
      quantity,
      amount: Number(product.total || product.totalAmount || price * quantity || 0),
    }
  })

  return {
    id: order.id || order.orderId,
    orderId: order.orderId || order.id?.slice?.(0, 8) || 'N/A',
    userId: order.userId || '',
    status: order.orderStatus || order.status || 'Pending',
    amount: Number(order.totalAmount || normalizedProducts.reduce((total, product) => total + product.amount, 0)),
    date,
    products: normalizedProducts,
  }
}

function filterCustomers(customers, filters) {
  const nameQuery = filters.name.trim().toLowerCase()
  const emailQuery = filters.email.trim().toLowerCase()
  const phoneQuery = filters.phone.trim().toLowerCase()
  const recentCutoff = new Date()
  recentCutoff.setDate(recentCutoff.getDate() - 30)

  return customers.filter((customer) => {
    const matchesName = !nameQuery || customer.name.toLowerCase().includes(nameQuery)
    const matchesEmail = !emailQuery || customer.email.toLowerCase().includes(emailQuery)
    const matchesPhone = !phoneQuery || String(customer.phone).toLowerCase().includes(phoneQuery)
    const matchesType = filters.type === 'all'
      || (filters.type === 'active' && customer.isActive)
      || (filters.type === 'withOrders' && customer.totalOrders > 0)
      || (filters.type === 'withoutOrders' && customer.totalOrders === 0)
      || (filters.type === 'recent' && customer.createdAt && customer.createdAt >= recentCutoff)

    return matchesName && matchesEmail && matchesPhone && matchesType
  })
}

function getCustomerSummary(customers) {
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)

  return {
    totalCustomers: customers.length,
    activeCustomers: customers.filter((customer) => customer.isActive).length,
    newThisMonth: customers.filter((customer) => customer.createdAt && customer.createdAt >= monthStart).length,
    customersWithOrders: customers.filter((customer) => customer.totalOrders > 0).length,
  }
}

function CustomerSkeleton() {
  return (
    <section className="customer-management">
      <div className="customer-hero skeleton-block tall" />
      <div className="customer-cards-grid">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="customer-glass-card customer-summary-card skeleton-block" key={index} />
        ))}
      </div>
      <div className="customer-table-panel customer-glass-card skeleton-block customer-table-skeleton" />
    </section>
  )
}

function EmptyCustomers() {
  return (
    <section className="customer-empty-state">
      <div className="customer-empty-illustration" aria-hidden>
        <span />
        <span />
        <span />
      </div>
      <h2>No Registered Customers Found</h2>
      <p>Registered customers matching your filters will appear here.</p>
    </section>
  )
}

function formatAddress(address) {
  if (!address) {
    return '-'
  }

  if (typeof address === 'string') {
    return address
  }

  return [address.line1, address.line2, address.city, address.state, address.pincode]
    .filter(Boolean)
    .join(', ') || '-'
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

function formatDate(value) {
  return value ? value.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'
}

export default CustomerManagement
