/**
 * SettingsModal Component.
 *
 * Allows developers and judges to configure backend endpoints, mock simulation
 * interval speed, and agent telemetry options.
 */

import React, { useState } from 'react';
import { X, Sliders, Server, Gauge, Check, RefreshCw } from 'lucide-react';
import { useToast } from '../services/ToastContext.jsx';

export default function SettingsModal({
  isOpen,
  onClose,
  simulationSpeed,
  setSimulationSpeed,
  apiEndpoint,
  setApiEndpoint,
}) {
  const { toast } = useToast();
  const [localSpeed, setLocalSpeed] = useState(simulationSpeed || 1000);
  const [localEndpoint, setLocalEndpoint] = useState(apiEndpoint || 'http://localhost:8000/api');

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    setSimulationSpeed(Number(localSpeed));
    setApiEndpoint(localEndpoint.trim());
    toast.success('Settings saved successfully');
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()} role="dialog">
      <div className="modal-dialog settings-modal-card">
        <div className="modal-header">
          <div className="modal-brand">
            <div className="brand-icon-wrap settings">
              <Sliders size={18} />
            </div>
            <div>
              <h3 className="modal-title">Agent Settings & Diagnostics</h3>
              <p className="modal-subtitle">Configure runtime environment and presentation telemetry</p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="settings-form">
          <div className="form-field">
            <label htmlFor="settings-endpoint">
              <Server size={14} className="field-inline-icon" />
              FastAPI Backend Endpoint (REST / SSE)
            </label>
            <input
              id="settings-endpoint"
              type="text"
              className="modal-input"
              value={localEndpoint}
              onChange={(e) => setLocalEndpoint(e.target.value)}
              placeholder="http://localhost:8000/api"
            />
            <span className="field-hint">
              When backend server is offline, mock simulation automatically activates.
            </span>
          </div>

          <div className="form-field">
            <div className="field-label-row">
              <label htmlFor="settings-speed">
                <Gauge size={14} className="field-inline-icon" />
                Mock Simulation Pace: {localSpeed}ms per step
              </label>
            </div>
            <input
              id="settings-speed"
              type="range"
              min="400"
              max="2500"
              step="200"
              value={localSpeed}
              onChange={(e) => setLocalSpeed(Number(e.target.value))}
              className="range-input"
            />
            <div className="range-ticks">
              <span>Fast (400ms)</span>
              <span>Balanced (1000ms)</span>
              <span>Presentation (2500ms)</span>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="secondary-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary-btn">
              <Check size={16} />
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
