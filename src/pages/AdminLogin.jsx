import { useEffect, useState } from 'react'
import {
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence,
  signInWithEmailAndPassword,
} from 'firebase/auth'
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { auth } from '../firebase'
import { useAuth } from '../context/useAuth'

const initialForm = {
  email: '',
  password: '',
}

function AdminLogin() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const redirectPath = getRedirectPath(searchParams.get('redirect')) || '/admin'
  const { currentUser, userProfile } = useAuth()
  const [formData, setFormData] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState(location.state?.successMessage || '')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pendingRedirect, setPendingRedirect] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
    setMessage('')
  }

  const validateForm = () => {
    const nextErrors = {}

    if (!formData.email.trim()) {
      nextErrors.email = 'Email is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      nextErrors.email = 'Enter a valid email address.'
    }

    if (!formData.password) {
      nextErrors.password = 'Password is required.'
    } else if (formData.password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters.'
    }

    return nextErrors
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = validateForm()

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      setMessage('')
      return
    }

    if (!auth) {
      setMessage('')
      setErrors({
        form: 'Firebase is not configured. Add your Firebase web app values to a .env file.',
      })
      return
    }

    try {
      setIsSubmitting(true)
      setErrors({})
      await setPersistence(
        auth,
        rememberMe ? browserLocalPersistence : browserSessionPersistence,
      )
      await signInWithEmailAndPassword(auth, formData.email, formData.password)
      setMessage('Login successful.')
      setFormData(initialForm)
      setPendingRedirect(true)
    } catch (error) {
      setMessage('')
      setErrors({ form: getAuthErrorMessage(error.code) })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Wait for profile to load before performing redirect; ensures admin role is present.
  useEffect(() => {
    if (!pendingRedirect) return

    if (currentUser && userProfile !== null) {
      if (userProfile?.role === 'admin') {
        navigate(redirectPath || '/admin', { replace: true })
      } else {
        setErrors({ form: 'You are not authorized to access the admin dashboard.' })
      }

      setPendingRedirect(false)
    }
  }, [pendingRedirect, currentUser, userProfile, redirectPath, navigate])

  return (
    <section className="auth-page premium-auth-page">
      <div className="auth-visual-panel">
        <p className="eyebrow">Admin Area</p>
        <h2>Admin sign in</h2>
      </div>

      <form className="auth-card glass-auth-card" onSubmit={handleSubmit} noValidate>
        <p className="eyebrow">Admin access</p>
        <h1>Admin Login</h1>

        {message && <p className="success-message">{message}</p>}
        {errors.form && <p className="error-box">{errors.form}</p>}

        <label>
          Email
          <input
            className={errors.email ? 'input-error' : ''}
            type="email"
            name="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleChange}
          />
          {errors.email && <span className="error-message">{errors.email}</span>}
        </label>

        <label>
          Password
          <div className="password-field">
            <input
              className={errors.password ? 'input-error' : ''}
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Enter password"
              value={formData.password}
              onChange={handleChange}
            />
            <button type="button" onClick={() => setShowPassword((visible) => !visible)}>
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {errors.password && <span className="error-message">{errors.password}</span>}
        </label>

        <label className="checkbox-row">
          <input
            checked={rememberMe}
            type="checkbox"
            onChange={(event) => setRememberMe(event.target.checked)}
          />
          Remember me on this device
        </label>
        <button className="btn primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? <span className="loading-spinner">Logging in...</span> : 'Login'}
        </button>
      </form>
    </section>
  )
}

function getRedirectPath(path) {
  if (path?.startsWith('/') && !path.startsWith('//')) {
    return path
  }

  return null
}

function getAuthErrorMessage(code) {
  if (code === 'auth/invalid-credential') {
    return 'Invalid email or password.'
  }

  if (code === 'auth/user-disabled') {
    return 'This account has been disabled.'
  }

  if (code === 'auth/invalid-email') {
    return 'Enter a valid email address.'
  }

  return 'Unable to login. Please check your Firebase setup and try again.'
}

export default AdminLogin
