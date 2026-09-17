/**
 * Toast Container Component.
 *
 * Renders floating toast notifications with Lucide icons and smooth animations.
 */

import React from 'react';
import { useToast } from '../services/ToastContext.jsx';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

const TOAST_ICONS = {
  success: <CheckCircle2 className="toast-icon success" size={18} />,
  error: <AlertCircle className="toast-icon error" size={18} />,
  warning: <AlertTriangle className="toast-icon warning" size={18} />,
  info: <Info className="toast-icon info" size={18} />,
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast-item toast-${toast.type}`}>
          <div className="toast-icon-wrapper">
            {TOAST_ICONS[toast.type] || TOAST_ICONS.info}
          </div>
          <div className="toast-message">{toast.message}</div>
          <button
            type="button"
            className="toast-close-btn"
            onClick={() => removeToast(toast.id)}
            aria-label="Dismiss notification"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
