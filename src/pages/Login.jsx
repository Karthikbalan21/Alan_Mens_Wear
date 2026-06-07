import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { auth } from '../firebase'

const initialForm = {
  email: '',
  password: '',
}

function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectPath = getRedirectPath(searchParams.get('redirect'))
  const [formData, setFormData] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

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
      await signInWithEmailAndPassword(auth, formData.email, formData.password)
      setMessage('Login successful.')
      setFormData(initialForm)
      setTimeout(() => navigate(redirectPath), 600)
    } catch (error) {
      setMessage('')
      setErrors({ form: getAuthErrorMessage(error.code) })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit} noValidate>
        <p className="eyebrow">Welcome back</p>
        <h1>Login</h1>

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

        <Link className="forgot-link" to="/forgot-password">Forgot password?</Link>
        <button className="btn primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Logging in...' : 'Login'}
        </button>
        <p>
          New here?{' '}
          <Link to={`/register?redirect=${encodeURIComponent(redirectPath)}`}>
            Create an account
          </Link>
        </p>
      </form>
    </section>
  )
}

function getRedirectPath(path) {
  if (path?.startsWith('/') && !path.startsWith('//')) {
    return path
  }

  return '/'
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

export default Login
