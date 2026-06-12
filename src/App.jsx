import { Route, Routes, useLocation, Navigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import { useAuth } from './context/useAuth'
import ScrollToTop from './components/ScrollToTop'
import Home from './pages/Home'
import Products from './pages/Products'
import ProductDetails from './pages/ProductDetails'
import Cart from './pages/Cart'
import Orders from './pages/Orders'
import Profile from './pages/Profile'
import Login from './pages/Login'
import AdminLogin from './pages/AdminLogin'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import AdminDashboard from './admin/AdminDashboard.jsx'
import './App.css'

function App() {
  const location = useLocation()
  const { pathname } = location
  const isAdminRoute = pathname.startsWith('/admin')
  
  function RequireAdminRoute({ children }) {
    const { currentUser, userProfile, loading } = useAuth()
    const locationRef = useLocation()

    // If auth is still initializing or we have a signed-in user but no profile yet,
    // show a brief checking state so we don't redirect prematurely before the
    // user's profile (and role) is loaded from Firestore.
    if (loading || (currentUser && userProfile === null)) {
      return (
        <section className="container page-section centered">
          <h1>Checking admin access...</h1>
        </section>
      )
    }

    if (!currentUser || userProfile?.role !== 'admin') {
      return <Navigate to={`/admin/login?redirect=${encodeURIComponent(locationRef.pathname)}`} replace />
    }

    return children
  }

  return (
    <div className="app-shell">
      <ScrollToTop />
      {!isAdminRoute && <Navbar />}
      <main>
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            transition={{ duration: 0.28 }}
          >
            <Routes location={location} key={pathname}>
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/:id" element={<ProductDetails />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/login" element={<Login />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route
                path="/admin"
                element={
                  <RequireAdminRoute>
                    <AdminDashboard />
                  </RequireAdminRoute>
                }
              />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>
      {!isAdminRoute && <Footer />}
    </div>
  )
}

export default App
