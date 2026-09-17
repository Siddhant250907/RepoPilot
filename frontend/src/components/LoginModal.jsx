/**
 * LoginModal Component.
 *
 * Polished authentication modal with input validation, show/hide password,
 * loading states, demo notice, and seamless integration with AuthContext.
 */

import React, { useState } from 'react';
import { useAuth } from '../services/authContext.jsx';
import { useToast } from '../services/ToastContext.jsx';
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  X, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  ShieldCheck
} from 'lucide-react';

export default function LoginModal({ isOpen, onClose }) {
  const { login, isLoading } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState('alex.rivera@devcorp.io');
  const [password, setPassword] = useState('pilotSecret2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Please enter your work or personal email.');
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      setError('Please enter a valid email address format.');
      return;
    }

    if (!password || password.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }

    try {
      const user = await login({ email, password });
      setSuccess(true);
      toast.success(`Welcome back, ${user.name}!`);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 700);
    } catch (err) {
      setError(err.message || 'Failed to authenticate. Please verify credentials.');
      toast.error('Authentication failed');
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick} role="dialog" aria-modal="true">
      <div className="modal-dialog login-modal-card">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-brand">
            <div className="brand-icon-wrap">
              <Sparkles size={18} className="brand-glow-icon" />
            </div>
            <div>
              <h3 className="modal-title">Sign in to RepoPilot</h3>
              <p className="modal-subtitle">Autonomous cognitive software debugging agent</p>
            </div>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            disabled={isLoading}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Demo Mode Notice */}
        <div className="demo-auth-banner">
          <ShieldCheck size={16} className="demo-shield-icon" />
          <div className="demo-banner-text">
            <strong>Demo Authentication Mode:</strong>
            <span> Session persists locally in <code>localStorage</code>. Any valid email will authenticate for testing.</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="form-error-alert" role="alert">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="form-success-alert" role="status">
              <CheckCircle2 size={16} />
              <span>Authenticated successfully! Redirecting...</span>
            </div>
          )}

          <div className="form-field">
            <label htmlFor="login-email">Work Email</label>
            <div className="input-with-icon">
              <Mail size={16} className="input-left-icon" />
              <input
                id="login-email"
                type="email"
                className="modal-input"
                placeholder="developer@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading || success}
                autoFocus
                required
              />
            </div>
          </div>

          <div className="form-field">
            <div className="field-label-row">
              <label htmlFor="login-password">Password</label>
              <button
                type="button"
                className="forgot-password-link"
                onClick={() => toast.info('For demo evaluation, any password ≥ 6 characters is accepted.')}
              >
                Demo hint?
              </button>
            </div>
            <div className="input-with-icon">
              <Lock size={16} className="input-left-icon" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="modal-input has-right-action"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading || success}
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="submit"
              className="primary-login-btn"
              disabled={isLoading || success}
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : success ? (
                <>
                  <CheckCircle2 size={16} />
                  <span>Success!</span>
                </>
              ) : (
                <span>Sign In to Workspace</span>
              )}
            </button>
          </div>

          <div className="modal-footer-note">
            <span>By continuing, you agree to autonomous agent telemetry logging.</span>
          </div>
        </form>
      </div>
    </div>
  );
}
