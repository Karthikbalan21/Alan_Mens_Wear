import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { FiLogOut, FiMenu, FiShoppingBag, FiX } from 'react-icons/fi'
import { toast } from 'react-toastify'
import { useCart } from '../context/useCart'
import { useAuth } from '../context/useAuth'

function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [logoutError, setLogoutError] = useState('')
  const { currentUser, userProfile, logout } = useAuth()
  const { totalItems } = useCart()

  const closeMenu = () => setIsOpen(false)

  const handleLogout = async () => {
    try {
      await logout()
      setLogoutError('')
      toast.success('Logged out successfully.')
      closeMenu()
    } catch (error) {
      setLogoutError(error.message)
      toast.error(error.message)
    }
  }

  return (
    <header className="site-header">
      <nav className="navbar container">
        <Link className="brand" to="/" onClick={closeMenu}>
          Alan Mens Wear
        </Link>

        <button
          className="menu-toggle"
          type="button"
          aria-label="Toggle navigation"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((open) => !open)}
        >
          {isOpen ? <FiX aria-hidden="true" /> : <FiMenu aria-hidden="true" />}
        </button>

        <div className={`nav-links ${isOpen ? 'open' : ''}`}>
          <NavLink to="/" onClick={closeMenu}>Home</NavLink>
          <NavLink to="/products" onClick={closeMenu}>Products</NavLink>
          <NavLink to="/cart" onClick={closeMenu}>
            <FiShoppingBag aria-hidden="true" />
            Cart{totalItems > 0 ? ` (${totalItems})` : ''}
          </NavLink>
          
          {currentUser && <NavLink to="/orders" onClick={closeMenu}>My Orders</NavLink>}
          {currentUser && <NavLink to="/profile" onClick={closeMenu}>Profile</NavLink>}
          {currentUser ? (
            <>
              <Link className="user-chip" to="/profile" onClick={closeMenu}>
                {userProfile?.name || currentUser.displayName || currentUser.email}
              </Link>
              <button className="logout-btn" type="button" onClick={handleLogout}>
                <FiLogOut aria-hidden="true" />
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" onClick={closeMenu}>Login</NavLink>
              <NavLink to="/register" onClick={closeMenu}>Register</NavLink>
            </>
          )}
        </div>
      </nav>
      {logoutError && <p className="nav-error">{logoutError}</p>}
    </header>
  )
}

export default Navbar
