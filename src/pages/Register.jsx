import { useState } from 'react'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { auth, db } from '../firebase'

const initialForm = {
  name: '',
  email: '',
  password: '',
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

    if (!auth || !db) {
      setMessage('')
      setErrors({
        form: 'Firebase is not configured. Add your Firebase web app values to a .env file.',
      })
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

      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name: formData.name,
        email: formData.email,
        role: 'customer',
        createdAt: serverTimestamp(),
      })

      setMessage('Account created successfully.')
      setFormData(initialForm)
      setTimeout(() => navigate(redirectPath), 700)
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
        <p className="eyebrow">Club Alan</p>
        <h1>Register</h1>

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
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {errors.password && <span className="error-message">{errors.password}</span>}
        </label>

        <button className="btn primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account...' : 'Create Account'}
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
