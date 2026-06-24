import { useState } from 'react'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { FiEye, FiEyeOff, FiUserPlus } from 'react-icons/fi'
import { toast } from 'react-toastify'
import { auth, db } from '../firebase'
import { getNextUserCode } from '../services/idService'
import { isValidPhoneNumber, normalizePhoneNumber } from '../services/otpService'

const initialForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
}

function Register() {
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

    if (!formData.name.trim()) {
      nextErrors.name = 'Name is required.'
    } else if (formData.name.trim().length < 3) {
      nextErrors.name = 'Name must be at least 3 characters.'
    }

    if (!formData.email.trim()) {
      nextErrors.email = 'Email is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      nextErrors.email = 'Enter a valid email address.'
    }

    if (!formData.phone.trim()) {
      nextErrors.phone = 'Mobile number is required.'
    } else if (!isValidPhoneNumber(formData.phone)) {
      nextErrors.phone = 'Use a valid mobile number, like +919876543210.'
    }

    if (!formData.password) {
      nextErrors.password = 'Password is required.'
    } else if (formData.password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters.'
    }

    if (formData.confirmPassword !== formData.password) {
      nextErrors.confirmPassword = 'Passwords do not match.'
    }

    return nextErrors
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = validateForm()

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      setMessage('')
      toast.error('Please fix the highlighted registration fields.')
      return
    }

    if (!auth || !db) {
      setMessage('')
      setErrors({
        form: 'Firebase is not configured. Add your Firebase web app values to a .env file.',
      })
      toast.error('Firebase is not configured.')
      return
    }

    try {
      setIsSubmitting(true)
      setErrors({})
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password,
      )

      await updateProfile(userCredential.user, {
        displayName: formData.name,
      })

      const userCode = await getNextUserCode()
      const phone = normalizePhoneNumber(formData.phone)

      await setDoc(doc(db, 'users', userCredential.user.uid), {
        userCode,
        name: formData.name,
        email: formData.email,
        phone,
        phoneVerified: false,
        passwordStatus: 'Stored securely in Firebase Auth',
        role: 'customer',
        createdAt: serverTimestamp(),
      })

      setMessage('Account created successfully.')
      toast.success('Account created successfully.')
      setFormData(initialForm)
      setTimeout(() => navigate(redirectPath), 700)
    } catch (error) {
      setMessage('')
      const errorMessage = getAuthErrorMessage(error.code)
      setErrors({ form: errorMessage })
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="auth-page premium-auth-page">
      <div className="auth-visual-panel register-panel">
        <p className="eyebrow">Club Alan</p>
        <h2>Create a member profile for orders, reviews, and faster checkout.</h2>
      </div>

      <form className="auth-card glass-auth-card" onSubmit={handleSubmit} noValidate>
        <p className="eyebrow">Club Alan</p>
        <h1>Register</h1>
        <div className="auth-steps" aria-hidden="true">
          <span className={formData.name ? 'active' : ''}></span>
          <span className={formData.email ? 'active' : ''}></span>
          <span className={formData.phone ? 'active' : ''}></span>
        </div>

        {message && <p className="success-message">{message}</p>}
        {errors.form && <p className="error-box">{errors.form}</p>}

        <label>
          Name
          <input
            className={errors.name ? 'input-error' : ''}
            type="text"
            name="name"
            placeholder="Alan customer"
            value={formData.name}
            onChange={handleChange}
          />
          {errors.name && <span className="error-message">{errors.name}</span>}
        </label>

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
          Mobile Number
          <input
            className={errors.phone ? 'input-error' : ''}
            type="tel"
            name="phone"
            placeholder="+919876543210"
            value={formData.phone}
            onChange={handleChange}
          />
          {errors.phone && <span className="error-message">{errors.phone}</span>}
        </label>

        <label>
          Password
          <div className="password-field">
            <input
              className={errors.password ? 'input-error' : ''}
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Create password"
              value={formData.password}
              onChange={handleChange}
            />
            <button type="button" onClick={() => setShowPassword((visible) => !visible)}>
              {showPassword ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {errors.password && <span className="error-message">{errors.password}</span>}
        </label>

        <div className="password-strength">
          <span style={{ width: `${getPasswordStrength(formData.password)}%` }}></span>
        </div>

        <label>
          Confirm Password
          <input
            className={errors.confirmPassword ? 'input-error' : ''}
            type="password"
            name="confirmPassword"
            placeholder="Confirm password"
            value={formData.confirmPassword}
            onChange={handleChange}
          />
          {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
        </label>

        <button className="btn primary" type="submit" disabled={isSubmitting}>
          {!isSubmitting && <FiUserPlus aria-hidden="true" />}
          {isSubmitting ? <span className="loading-spinner">Creating account...</span> : 'Create Account'}
        </button>
        <p>
          Already registered?{' '}
          <Link to={`/login?redirect=${encodeURIComponent(redirectPath)}`}>
            Login
          </Link>
        </p>
      </form>
    </section>
  )
}

function getPasswordStrength(password) {
  let score = 0

  if (password.length >= 6) score += 35
  if (/[A-Z]/.test(password)) score += 20
  if (/[0-9]/.test(password)) score += 20
  if (/[^A-Za-z0-9]/.test(password)) score += 25

  return Math.min(100, score)
}

function getRedirectPath(path) {
  if (path?.startsWith('/') && !path.startsWith('//')) {
    return path
  }

  return '/'
}

function getAuthErrorMessage(code) {
  if (code === 'auth/email-already-in-use') {
    return 'An account already exists with this email.'
  }

  if (code === 'auth/weak-password') {
    return 'Password is too weak. Use at least 6 characters.'
  }

  if (code === 'auth/invalid-email') {
    return 'Enter a valid email address.'
  }

  return 'Unable to create account. Please check your Firebase setup and try again.'
}

export default Register
