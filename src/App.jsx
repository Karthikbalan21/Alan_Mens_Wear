import { Route, Routes, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Products from './pages/Products'
import ProductDetails from './pages/ProductDetails'
import Cart from './pages/Cart'
import Orders from './pages/Orders'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import AdminDashboard from './admin/AdminDashboard.jsx'
import './App.css'

function App() {
  const { pathname } = useLocation()
  const isAdminRoute = pathname.startsWith('/admin')

  return (
    <div className="app-shell">
      {!isAdminRoute && <Navbar />}
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetails />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </main>
      {!isAdminRoute && <Footer />}
    </div>
  )
}

export default App
