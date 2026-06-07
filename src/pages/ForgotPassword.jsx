import { useState } from 'react'
import { sendPasswordResetEmail } from 'firebase/auth'
import { Link } from 'react-router-dom'
import { auth } from '../firebase'

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!email.trim()) {
      setError('Email is required.')
      setMessage('')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email address.')
      setMessage('')
      return
    }

    if (!auth) {
      setError('Firebase Authentication is not configured.')
      setMessage('')
      return
    }

    try {
      await sendPasswordResetEmail(auth, email)
      setError('')
      setMessage('Password reset link sent. Please check your email.')
      setEmail('')
    } catch (firebaseError) {
      setMessage('')
      setError(getResetErrorMessage(firebaseError.code))
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

        <button className="btn primary" type="submit">Send Reset Link</button>
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
