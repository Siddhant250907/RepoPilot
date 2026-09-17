/**
 * DocsModal Component.
 *
 * Provides developers and evaluators with a concise reference for RepoPilot's
 * autonomous cognitive loop, architecture, and tool specification.
 */

import React from 'react';
import { X, BookOpen, Brain, Terminal, RotateCcw, ShieldCheck, Cpu } from 'lucide-react';

export default function DocsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()} role="dialog">
      <div className="modal-dialog docs-modal-card">
        <div className="modal-header">
          <div className="modal-brand">
            <div className="brand-icon-wrap docs">
              <BookOpen size={18} />
            </div>
            <div>
              <h3 className="modal-title">RepoPilot Documentation</h3>
              <p className="modal-subtitle">Cognitive architecture & autonomous debugging loop</p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body docs-body">
          <div className="docs-section">
            <h4 className="docs-heading">
              <Brain size={16} />
              <span>Cognitive Architecture: "Build the Brain, Not the Puppet"</span>
            </h4>
            <p>
              Traditional AI coding assistants act as static script runners. RepoPilot operates as an
              autonomous agent driven by an internal <strong>Observe-Orient-Decide-Act (OODA)</strong> cognitive cycle:
            </p>
            <div className="docs-flow-diagram">
              <div className="docs-chip plan">1. PLAN</div>
              <span className="docs-arrow">→</span>
              <div className="docs-chip act">2. ACT (TOOL)</div>
              <span className="docs-arrow">→</span>
              <div className="docs-chip obs">3. OBSERVE</div>
              <span className="docs-arrow">→</span>
              <div className="docs-chip recover">4. REFLECT & RECOVER</div>
              <span className="docs-arrow">→</span>
              <div className="docs-chip final">5. VERIFIED FIX</div>
            </div>
          </div>

          <div className="docs-section">
            <h4 className="docs-heading">
              <RotateCcw size={16} />
              <span>Autonomous Failure Recovery</span>
            </h4>
            <p>
              When a tool invocation produces an error (such as a failing test, missing key, or compiler diagnostic),
              RepoPilot does not crash or ask the user for help. It parses the traceback, reflects on the fault mechanism,
              formulates an updated hypothesis, and dispatches a corrective tool call.
            </p>
          </div>

          <div className="docs-section">
            <h4 className="docs-heading">
              <Terminal size={16} />
              <span>Supported Tools</span>
            </h4>
            <ul className="docs-tool-list">
              <li><code>file_reader(path)</code>: Static code structure and line-by-line inspection</li>
              <li><code>file_writer(path, patch)</code>: Atomic AST-preserving code modifications</li>
              <li><code>shell(command)</code>: Isolated execution of test suites (e.g. pytest, npm test)</li>
              <li><code>web_search(query)</code>: Zero-shot troubleshooting of external dependency errors</li>
            </ul>
          </div>

          <div className="docs-section">
            <h4 className="docs-heading">
              <ShieldCheck size={16} />
              <span>Deterministic Verification</span>
            </h4>
            <p>
              No fix is marked completed until the reproduction test suite confirms a passing exit status (code 0)
              with zero regressions.
            </p>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="secondary-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
