import { useState } from 'react'
import { fetchSignInMethodsForEmail, sendPasswordResetEmail } from 'firebase/auth'
import { Link } from 'react-router-dom'
import { FiSend } from 'react-icons/fi'
import { toast } from 'react-toastify'
import { auth } from '../firebase'

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()

    const normalizedEmail = email.trim().toLowerCase()

    if (!normalizedEmail) {
      const errorMessage = 'Email is required.'
      setError(errorMessage)
      setMessage('')
      toast.error(errorMessage)
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
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
      setIsSubmitting(true)
      const signInMethods = await fetchSignInMethodsForEmail(auth, normalizedEmail)

      if (signInMethods.length === 0) {
        const errorMessage = 'No account found with this email. Use the email you registered with.'
        setError(errorMessage)
        setMessage('')
        toast.error(errorMessage)
        return
      }

      await sendPasswordResetEmail(auth, normalizedEmail, {
        url: `${window.location.origin}/login`,
        handleCodeInApp: false,
      })
      setError('')
      setMessage(`Password reset link sent to ${normalizedEmail}. Please check Inbox and Spam.`)
      toast.success('Password reset link sent.')
      setEmail('')
    } catch (firebaseError) {
      setMessage('')
      const errorMessage = getResetErrorMessage(firebaseError.code)
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
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

        <button className="btn primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <span className="loading-spinner">Sending...</span>
          ) : (
            <>
              <FiSend aria-hidden="true" />
              Send Reset Link
            </>
          )}
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

  if (code === 'auth/too-many-requests') {
    return 'Too many reset attempts. Please wait a few minutes and try again.'
  }

  if (code === 'auth/network-request-failed') {
    return 'Network error. Please check your internet connection and try again.'
  }

  if (code === 'auth/unauthorized-continue-uri') {
    return 'This app domain is not authorized in Firebase Authentication settings.'
  }

  return 'Unable to send password reset email. Please try again.'
}

export default ForgotPassword
