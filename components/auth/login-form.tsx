"use client"

import React, { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { GraduationCap, Eye, EyeOff, Loader2, AlertCircle, BookOpen, Users, BarChart3 } from "lucide-react"

import { Role } from "@/lib/types"

interface LoginFormProps {
  role: Role
  onSwitch: () => void
  onSuccess: () => void
}

export function LoginForm({ role, onSwitch, onSuccess }: LoginFormProps) {
  const { login, loginWithGoogle } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [emailFocused, setEmailFocused] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    // Safety timeout to prevent infinite loading state in UI
    const timeoutId = setTimeout(() => {
        if (loading) {
            setLoading(false)
            setError("Request timed out. The server might be slow or unreachable.")
        }
    }, 10000)

    try {
      const result = await login(email, password)
      clearTimeout(timeoutId)
      
      if (result.success) {
        onSuccess()
      } else {
        setError(result.error || "Invalid credentials. Please try again.")
      }
    } catch (err: any) {
      clearTimeout(timeoutId)
      setError(err?.message || "An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-split-screen">
      {/* ─── LEFT: BRANDING PANEL ─── */}
      <div className="login-branding">
        <div className="login-branding-bg" />
        <div className="login-branding-overlay" />
        <div className="login-branding-content">
          {/* Logo */}
          <div className="login-logo">
            <GraduationCap className="login-logo-icon" />
          </div>

          {/* Title */}
          <h1 className="login-brand-title">
            Faculty Analytics System
          </h1>
          <p className="login-brand-subtitle">
            Track Teaching Progress
          </p>
          <p className="login-brand-desc">
            Manage Attendance and Monitor Syllabus Completion
          </p>

          {/* Feature Pills */}
          <div className="login-feature-pills">
            <div className="login-pill">
              <BarChart3 className="login-pill-icon" />
              <span>Real-time Analytics</span>
            </div>
            <div className="login-pill">
              <Users className="login-pill-icon" />
              <span>Faculty Management</span>
            </div>
            <div className="login-pill">
              <BookOpen className="login-pill-icon" />
              <span>Syllabus Tracking</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── RIGHT: LOGIN FORM ─── */}
      <div className="login-form-panel">
        <div className="login-card">
          {/* Card Header */}
          <div className="login-card-header">
            <div className="login-card-icon">
              <GraduationCap className="login-card-icon-svg" />
            </div>
            <h2 className="login-card-title capitalize">{role} Login</h2>
            <p className="login-card-subtitle">Sign in to access your {role} dashboard</p>
          </div>

          {/* Error */}
          {error && (
            <div className="login-error">
              <AlertCircle className="login-error-icon" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="login-form">
            {/* Email */}
            <div className="login-field">
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                required
                className="login-input"
                autoComplete="email"
              />
              <label
                htmlFor="login-email"
                className={`login-float-label ${emailFocused || email ? "login-float-label--active" : ""}`}
              >
                Email Address
              </label>
              <div className={`login-input-bar ${emailFocused ? "login-input-bar--active" : ""}`} />
            </div>

            {/* Password */}
            <div className="login-field">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                required
                className="login-input login-input--password"
                autoComplete="current-password"
              />
              <label
                htmlFor="login-password"
                className={`login-float-label ${passwordFocused || password ? "login-float-label--active" : ""}`}
              >
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="login-eye-btn"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="login-eye-icon" /> : <Eye className="login-eye-icon" />}
              </button>
              <div className={`login-input-bar ${passwordFocused ? "login-input-bar--active" : ""}`} />
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="login-submit"
              disabled={loading || googleLoading}
            >
              {loading ? (
                <>
                  <Loader2 className="login-spinner" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="login-divider">
            <span>or</span>
          </div>

          {/* Google Sign-In */}
          <button
            type="button"
            className="login-google-btn"
            disabled={loading || googleLoading}
            onClick={async () => {
              setError("")
              setGoogleLoading(true)
              try {
                const result = await loginWithGoogle()
                if (result.success) {
                  onSuccess()
                } else {
                  setError(result.error || "Google sign-in failed. Please try again.")
                }
              } catch {
                setError("An unexpected error occurred during Google sign-in.")
              } finally {
                setGoogleLoading(false)
              }
            }}
          >
            {googleLoading ? (
              <Loader2 className="login-spinner" />
            ) : (
              <svg className="login-google-icon" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
            <span>Continue with Google</span>
          </button>

          {/* Register Link */}
          {role !== "admin" && (
            <p className="login-register">
              Don&apos;t have an account?{" "}
              <button type="button" onClick={onSwitch} className="login-register-link">
                Register
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
