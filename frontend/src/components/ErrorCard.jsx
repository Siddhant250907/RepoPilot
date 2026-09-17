/**
 * ErrorCard Component.
 *
 * Prominently distinguishes tool failures and demonstrates the agent's
 * autonomous failure recovery loop.
 * Styled with crimson red error borders and amber reflective recovery callout.
 */

import React, { useState } from 'react';
import { 
  AlertTriangle, 
  RotateCcw, 
  Terminal, 
  Copy, 
  Check, 
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useToast } from '../services/ToastContext.jsx';

export default function ErrorCard({
  tool = 'shell',
  error = 'Execution failed with non-zero exit status',
  recoveryPlan,
  data,
}) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const resolvedTool = data?.tool || data?.toolName || tool;
  const resolvedError = data?.error || data?.message || data?.output || error;
  const resolvedRecovery = data?.recoveryPlan || data?.recovery || recoveryPlan;

  const handleCopy = () => {
    navigator.clipboard.writeText(resolvedError);
    setCopied(true);
    toast.info('Copied error traceback');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="error-card-component" role="alert">
      {/* 1. Failure Header */}
      <div className="error-card-header">
        <div className="error-card-title">
          <div className="error-icon-pill">
            <AlertTriangle size={16} />
          </div>
          <div className="error-headings">
            <span className="error-badge-text">TOOL FAULT DETECTED</span>
            <span className="error-sub-text">Exit code non-zero • Triggering autonomous self-correction</span>
          </div>
        </div>

        <div className="error-actions-group">
          <button
            type="button"
            className="error-copy-btn"
            onClick={handleCopy}
            title="Copy error output"
            aria-label="Copy error output"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <span className="error-severity-tag">FAILURE DETECTED</span>
        </div>
      </div>

      {/* 2. Failure Body */}
      <div className="error-card-body">
        <div className="error-field">
          <div className="field-label-group">
            <Terminal size={14} />
            <span className="field-label">Failed Tool:</span>
            <code className="field-value tool-name-val">{resolvedTool}</code>
          </div>
        </div>

        <div className="error-field">
          <span className="field-label">Diagnostic Output & Traceback:</span>
          <div className="field-value error-message-box">
            <pre className="error-pre">{resolvedError}</pre>
          </div>
        </div>

        {/* 3. Autonomous Reflective Recovery Box */}
        {resolvedRecovery && (
          <div className="error-recovery-box">
            <div className="recovery-header">
              <Sparkles size={16} className="recovery-sparkle-icon" />
              <span className="recovery-label">Autonomous Self-Correction Formulated:</span>
            </div>
            <p className="recovery-text">{resolvedRecovery}</p>
          </div>
        )}
      </div>
    </div>
  );
}
