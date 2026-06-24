import { useState } from 'react'
import { sendPasswordResetEmail } from 'firebase/auth'
import { Link } from 'react-router-dom'
import { FiSend } from 'react-icons/fi'
import { toast } from 'react-toastify'
import { auth } from '../firebase'

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!email.trim()) {
      const errorMessage = 'Email is required.'
      setError(errorMessage)
      setMessage('')
      toast.error(errorMessage)
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      const errorMessage = 'Enter a valid email address.'
      setError(errorMessage)
      setMessage('')
      toast.error(errorMessage)
      return
    }

    if (!auth) {
      const errorMessage = 'Firebase Authentication is not configured.'
      setError(errorMessage)
      setMessage('')
      toast.error(errorMessage)
      return
    }

    try {
      await sendPasswordResetEmail(auth, email)
      setError('')
      setMessage('Password reset link sent. Please check your email.')
      toast.success('Password reset link sent.')
      setEmail('')
    } catch (firebaseError) {
      setMessage('')
      const errorMessage = getResetErrorMessage(firebaseError.code)
      setError(errorMessage)
      toast.error(errorMessage)
    }
  }

  return (
    <section className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit} noValidate>
        <p className="eyebrow">Account help</p>
        <h1>Forgot Password</h1>

        {message && <p className="success-message">{message}</p>}
        {error && <p className="error-box">{error}</p>}

        <label>
          Email
          <input
            className={error ? 'input-error' : ''}
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value)
              setError('')
              setMessage('')
            }}
          />
        </label>

        <button className="btn primary" type="submit">
          <FiSend aria-hidden="true" />
          Send Reset Link
        </button>
        <p>Remembered it? <Link to="/login">Back to login</Link></p>
      </form>
    </section>
  )
}

function getResetErrorMessage(code) {
  if (code === 'auth/user-not-found') {
    return 'No account found with this email.'
  }

  if (code === 'auth/invalid-email') {
    return 'Enter a valid email address.'
  }

  return 'Unable to send password reset email. Please try again.'
}

export default ForgotPassword
