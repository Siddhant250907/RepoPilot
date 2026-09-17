/**
 * LoginScreen Component — Premium Cinematic Authentication Experience
 *
 * Matches the landing page aesthetic:
 * - Deep black/navy atmospheric canvas with subtle glow and hairline grid
 * - Form validation (email format, password min length)
 * - Show / hide password toggle
 * - Loading state with spinner
 * - Error state with helpful message
 * - Successful login transition to workspace
 * - Quick fill demo credentials button
 * - Stored in localStorage session
 */

import React, { useState } from 'react';
import { useAuth } from '../services/authContext.jsx';
import { useToast } from '../services/ToastContext.jsx';
import { 
  Bot, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ShieldCheck,
  KeyRound,
  ArrowLeft
} from 'lucide-react';

export default function LoginScreen({ onLoginSuccess, onBackToLanding }) {
  const { login, isLoading } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState('alex.rivera@devcorp.io');
  const [password, setPassword] = useState('pilotSecret2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const validateForm = () => {
    if (!email.trim()) {
      setError('Please enter your work or personal email.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address (e.g. name@company.com).');
      return false;
    }
    if (!password) {
      setError('Please enter your password.');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return false;
    }
    setError(null);
    return true;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;

    try {
      setError(null);
      const user = await login({ email: email.trim(), password });
      setIsSuccess(true);
      toast.success(`Welcome back, ${user.name}!`);

      setTimeout(() => {
        if (onLoginSuccess) {
          onLoginSuccess(user);
        }
      }, 500);
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
      toast.error('Failed to authenticate');
    }
  };

  const handleFillDemo = () => {
    setEmail('alex.rivera@devcorp.io');
    setPassword('pilotSecret2026!');
    setError(null);
    toast.info('Demo credentials populated');
  };

  return (
    <div className="cinematic-login-screen-root">
      {/* Background Atmosphere */}
      <div className="ambient-beam-top" />
      <div className="ambient-glow-indigo" />
      <div className="hairline-grid-pattern" />

      {/* Top Bar: Back to Landing */}
      <div className="login-screen-topbar">
        <button
          type="button"
          className="login-back-btn"
          onClick={onBackToLanding}
          title="Return to Landing Page"
        >
          <ArrowLeft size={16} />
          <span>Back to overview</span>
        </button>

        <div className="topbar-brand">
          <div className="brand-vector-mark small">
            <Bot size={16} />
          </div>
          <span className="brand-title-text">RepoPilot</span>
        </div>
      </div>

      {/* Main Login Card Container */}
      <div className="login-screen-center-container">
        <div className="cinematic-login-card">
          {/* Card Brand Header */}
          <div className="login-card-header">
            <div className="login-card-logo-wrap">
              <Bot size={24} className="login-bot-icon" />
              <span className="login-logo-glow-ring" />
            </div>
            <h1 className="login-title-heading">Sign in to RepoPilot</h1>
            <p className="login-subtitle-copy">
              Autonomous cognitive software debugging agent. Enter the workspace.
            </p>
          </div>

          {/* Quick Demo Helper Pill */}
          <div className="demo-credentials-banner">
            <div className="banner-left">
              <KeyRound size={14} className="key-icon" />
              <span>Demo Mode active: Instant credential autofill</span>
            </div>
            <button
              type="button"
              className="quick-demo-fill-btn"
              onClick={handleFillDemo}
              disabled={isLoading || isSuccess}
            >
              Fill Demo
            </button>
          </div>

          {/* Error Message Box */}
          {error && (
            <div className="login-error-alert animate-shake">
              <AlertCircle size={15} className="error-alert-icon" />
              <span className="error-alert-text">{error}</span>
            </div>
          )}

          {/* Success Message Box */}
          {isSuccess && (
            <div className="login-success-alert animate-fade">
              <CheckCircle2 size={16} className="success-alert-icon" />
              <span className="success-alert-text">
                Session verified. Entering AI Workspace...
              </span>
            </div>
          )}

          {/* Login Form */}
          <form className="login-form-fields" onSubmit={handleSubmit} noValidate>
            {/* Email Field */}
            <div className="login-input-group">
              <label htmlFor="login-email-input" className="login-field-label">
                Work or Personal Email
              </label>
              <div className="input-with-icon-wrap">
                <Mail size={16} className="field-prefix-icon" />
                <input
                  id="login-email-input"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="alex.rivera@devcorp.io"
                  disabled={isLoading || isSuccess}
                  className="login-text-input"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="login-input-group">
              <div className="label-with-hint-row">
                <label htmlFor="login-password-input" className="login-field-label">
                  Password
                </label>
                <span className="field-hint-mono">Min 6 characters</span>
              </div>
              <div className="input-with-icon-wrap">
                <Lock size={16} className="field-prefix-icon" />
                <input
                  id="login-password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="••••••••••••"
                  disabled={isLoading || isSuccess}
                  className="login-text-input password-input"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="login-submit-cta-btn"
              disabled={isLoading || isSuccess}
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="button-spin-icon" />
                  <span>Verifying session...</span>
                </>
              ) : isSuccess ? (
                <>
                  <CheckCircle2 size={16} />
                  <span>Entering Workspace...</span>
                </>
              ) : (
                <>
                  <span>Sign in to Workspace</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Footer Security Badges */}
          <div className="login-card-footer">
            <div className="security-tag">
              <ShieldCheck size={13} className="shield-icon" />
              <span>Session stored securely in localStorage</span>
            </div>
            <span className="security-track-tag">Track 2: Autonomous Agent</span>
          </div>
        </div>
      </div>
    </div>
  );
}
