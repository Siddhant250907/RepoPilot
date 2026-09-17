/**
 * LandingPage Component — Cinematic AI Developer Platform Experience
 *
 * Requirements:
 * - Navbar: RepoPilot logo, Product, How it works, Demo, Docs, Log in, Start debugging
 * - Hero:
 *   - Small label: "AUTONOMOUS SOFTWARE DEBUGGING"
 *   - Large headline: "YOUR CODEBASE.\nON AUTOPILOT."
 *   - Supporting text: "RepoPilot investigates bugs, chooses the right tools, learns from failures, and keeps working toward a solution."
 *   - Buttons: "Start debugging", "Watch demo"
 *   - Sophisticated agent visualization beside/behind hero:
 *     PLAN -> ACT -> OBSERVE -> REFLECT -> RECOVER -> RESOLVE
 *     Using floating technical UI elements instead of generic cards
 * - Large storytelling section while scrolling:
 *   - "THE BUG ISN'T THE PROBLEM."
 *   - Transition into: "THE INVESTIGATION IS."
 *   - Introduction to RepoPilot (Investigative agent, not a puppet)
 * - "How RepoPilot works" section:
 *   - 01 Understand
 *   - 02 Act
 *   - 03 Observe
 *   - 04 Recover
 *   - 05 Resolve
 *   - Large typography and visual composition (NOT a generic card grid)
 * - Strong final CTA:
 *   - "READY TO LET IT INVESTIGATE?"
 *   - "Start debugging"
 */

import React, { useState } from 'react';
import { 
  Bot, 
  Sparkles, 
  ArrowRight, 
  Play, 
  Brain, 
  Terminal, 
  Eye, 
  AlertTriangle, 
  RotateCcw, 
  CheckCircle2, 
  ShieldCheck, 
  FolderGit2, 
  FileCode, 
  Command, 
  Layers, 
  Activity, 
  GitBranch, 
  Lock,
  Cpu,
  Search,
  FileDiff,
  Flame,
  ArrowDown
} from 'lucide-react';
import { useAuth } from '../services/authContext.jsx';

export default function LandingPage({
  onStartDebugging,
  onViewDemo,
  onOpenLogin,
  onOpenDocs,
  onOpenSettings,
}) {
  const { user, isAuthenticated, logout } = useAuth();
  const [activeStage, setActiveStage] = useState('reflect');
  const [activeStoryTab, setActiveStoryTab] = useState('04');

  // The 6-Stage Autonomous Cognitive Flow
  const workflowStages = [
    {
      id: 'plan',
      name: 'PLAN',
      label: 'Decompose & Strategize',
      tagline: 'AST Call Graph Ingestion',
      code: 'plan.formulate(repo="auth-api", fault="KeyError: jwt_secret")',
      subtext: 'Builds targeted diagnostic hypothesis without human prompt intervention.',
      metric: '3 Sub-goals Formulated',
      accent: 'indigo',
    },
    {
      id: 'act',
      name: 'ACT',
      label: 'Execute Tools in Sandbox',
      tagline: 'Deterministic Tool Execution',
      code: '$ pytest tests/test_auth.py::test_login_500 --capture=no',
      subtext: 'Dispatches real shell commands and AST symbol readers in isolated Docker containers.',
      metric: 'exit_code: 1',
      accent: 'purple',
    },
    {
      id: 'observe',
      name: 'OBSERVE',
      label: 'Analyze Trace & Symptoms',
      tagline: 'Raw Output Telemetry',
      code: 'FAIL: KeyError in auth_service.py:42: config["JWT_SECRET"]',
      subtext: 'Captures stderr, exit codes, and environment deltas into working memory.',
      metric: '1 Fault Isolated',
      accent: 'blue',
    },
    {
      id: 'reflect',
      name: 'REFLECT',
      label: 'Autonomous Self-Correction',
      tagline: 'Cognitive OODA Pivot',
      code: 'Reflection: "Production config missing DEFAULT_SECRET fallback; patch config.py"',
      subtext: 'Pauses upon failure, identifies the faulty assumption, and updates hypotheses.',
      metric: 'Brain, Not Puppet',
      accent: 'amber',
      highlight: true,
    },
    {
      id: 'recover',
      name: 'RECOVER',
      label: 'Synthesize & Apply Patch',
      tagline: 'Targeted Unified Diff',
      code: 'diff: + JWT_SECRET = os.getenv("JWT_SECRET", "dev_fallback_key")',
      subtext: 'Applies atomic, precision edits directly to target files inside the sandbox.',
      metric: '1 File Modified',
      accent: 'amber',
    },
    {
      id: 'resolve',
      name: 'RESOLVE',
      label: 'Deterministic Verification',
      tagline: 'Zero Regressions Proven',
      code: '======== 5 passed in 0.14s (0 regressions, exit code 0) ========',
      subtext: 'Runs full reproduction suite until mathematical correctness is confirmed.',
      metric: 'Verified Fixed',
      accent: 'green',
    },
  ];

  const howItWorksSteps = [
    {
      id: '01',
      num: '01',
      title: 'Understand',
      subtitle: 'AST call graphs & error domain isolation',
      description:
        'RepoPilot parses full codebase syntax trees, traces variable definitions, and maps stack frames across dependencies. It isolates the exact fault perimeter rather than reading raw text blindly.',
      technicalArtifact: {
        file: 'repo_analyzer/ast_graph.py',
        preview: `ast_indexer.resolve_symbol_refs(
  entrypoint="api/routes/auth.py",
  dependencies=["services/auth_service.py", "config.py"],
  symbol="generate_jwt_token"
) -> CallGraph(depth=3, references=14)`,
        badge: 'AST INDEXED',
      },
    },
    {
      id: '02',
      num: '02',
      title: 'Act',
      subtitle: 'Deterministic tool dispatch in isolated sandboxes',
      description:
        'Instead of hallucinating advice in a chatbot window, RepoPilot executes real developer tools: ripgrep searches, file inspectors, and automated test runners inside a secured Docker virtualenv.',
      technicalArtifact: {
        file: 'sandbox/executor.py',
        preview: `$ pytest tests/test_auth.py::test_login_endpoint
[sandbox-01] RUNNING test_login_endpoint ... FAIL
[sandbox-01] Stderr: KeyError: 'JWT_SECRET' in config.py:18`,
        badge: 'SANDBOX ISOLATED',
      },
    },
    {
      id: '03',
      num: '03',
      title: 'Observe',
      subtitle: 'Telemetry ingestion & stdout/stderr stream parsing',
      description:
        'Every tool dispatch returns structured observations. RepoPilot parses return codes, compiler warnings, assertion diffs, and database error states into structured working memory.',
      technicalArtifact: {
        file: 'telemetry/observation_stream.json',
        preview: `{
  "step": 3,
  "status": "OBSERVED",
  "tool": "pytest",
  "exit_code": 1,
  "root_exception": "KeyError",
  "line_culprit": "auth_service.py:42"
}`,
        badge: 'STREAM PARSED',
      },
    },
    {
      id: '04',
      num: '04',
      title: 'Recover',
      subtitle: 'Autonomous reflection when tools or hypotheses fail',
      description:
        'When a tool fails or an assertion breaks, naive models give up or crash. RepoPilot pauses, reflects on the fault mechanism, adjusts its diagnostic hypothesis, and pivots autonomously.',
      technicalArtifact: {
        file: 'cognitive/reflection_loop.py',
        preview: `def reflect_on_tool_failure(fault_trace):
    hypothesis = "Root cause is KeyError on unset ENV var"
    recovery_plan = "Add DEFAULT_SECRET fallback in config.py"
    return RecoveryAction(target="config.py", line=18)`,
        badge: 'SELF-CORRECTED',
      },
    },
    {
      id: '05',
      num: '05',
      title: 'Resolve',
      subtitle: 'Mathematical regression verification & atomic pull requests',
      description:
        'No guesswork. Every generated patch must pass the complete reproduction test suite with 0 regressions before it is ever presented to you. Clean, atomic, and production-ready.',
      technicalArtifact: {
        file: 'patch/unified_diff.patch',
        preview: `--- a/config.py
+++ b/config.py
@@ -18,1 +18,2 @@
-JWT_SECRET = os.environ["JWT_SECRET"]
+JWT_SECRET = os.getenv("JWT_SECRET", "default_dev_secret")
# Verification: 5 passed in 0.12s (Exit 0)`,
        badge: 'ZERO REGRESSIONS',
      },
    },
  ];

  const currentStageObj = workflowStages.find((s) => s.id === activeStage) || workflowStages[3];

  return (
    <div className="cinematic-landing-root">
      {/* Background Atmosphere Lighting Elements */}
      <div className="ambient-beam-top"></div>
      <div className="ambient-glow-indigo"></div>
      <div className="ambient-glow-violet"></div>
      <div className="hairline-grid-pattern"></div>

      {/* ====================================================================
          1. CINEMATIC NAVBAR
          Left: RepoPilot
          Center: Product, How it works, Demo, Docs
          Right: Log in, Start debugging
          ==================================================================== */}
      <header className="cinematic-navbar">
        <div className="navbar-container">
          {/* Brand Logo */}
          <div
            className="navbar-brand-group"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="brand-vector-mark">
              <Bot size={18} className="brand-bot-icon" />
              <span className="brand-ambient-ring"></span>
            </div>
            <span className="brand-title-text">RepoPilot</span>
            <span className="brand-version-pill">v0.1 AI</span>
          </div>

          {/* Center Links */}
          <nav className="navbar-center-nav">
            <button
              type="button"
              className="cinematic-nav-link"
              onClick={() => {
                const elem = document.getElementById('story-section');
                if (elem) elem.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Product
            </button>
            <button
              type="button"
              className="cinematic-nav-link"
              onClick={() => {
                const elem = document.getElementById('how-it-works-section');
                if (elem) elem.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              How it works
            </button>
            <button
              type="button"
              className="cinematic-nav-link"
              onClick={onViewDemo}
            >
              Demo
            </button>
            <button
              type="button"
              className="cinematic-nav-link"
              onClick={onOpenDocs}
            >
              Docs
            </button>
          </nav>

          {/* Right Action CTAs */}
          <div className="navbar-right-ctas">
            {isAuthenticated && user ? (
              <div className="user-logged-pill" onClick={onOpenSettings}>
                <img src={user.avatar} alt={user.name} className="user-nav-avatar" />
                <span className="user-nav-name">{user.name.split(' ')[0]}</span>
              </div>
            ) : (
              <button
                type="button"
                className="cinematic-login-btn"
                onClick={onOpenLogin}
              >
                Log in
              </button>
            )}

            <button
              type="button"
              className="cinematic-primary-btn nav-cta-btn"
              onClick={onStartDebugging}
            >
              <span>Start debugging</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* ====================================================================
          2. HERO SECTION
          - Small label: AUTONOMOUS SOFTWARE DEBUGGING
          - Large headline: "YOUR CODEBASE.\nON AUTOPILOT."
          - Supporting text
          - Buttons: Start debugging, Watch demo
          - Sophisticated Agent Visualization (PLAN -> ACT -> OBSERVE -> REFLECT -> RECOVER -> RESOLVE)
          ==================================================================== */}
      <section className="cinematic-hero-section">
        <div className="hero-content-wrapper">
          {/* Left Column: Editorial Headline & Actions */}
          <div className="hero-copy-col">
            <div className="hero-eyebrow-badge">
              <span className="eyebrow-pulse-dot"></span>
              <span className="eyebrow-text">AUTONOMOUS SOFTWARE DEBUGGING</span>
            </div>

            <h1 className="hero-editorial-headline">
              YOUR CODEBASE.<br />
              <span className="headline-gradient-span">ON AUTOPILOT.</span>
            </h1>

            <p className="hero-editorial-subtext">
              RepoPilot investigates bugs, chooses the right tools, learns from failures,
              and keeps working toward a solution.
            </p>

            <div className="hero-cta-buttons-row">
              <button
                type="button"
                className="cinematic-primary-btn hero-main-cta"
                onClick={onStartDebugging}
              >
                <span>Start debugging</span>
                <ArrowRight size={15} />
              </button>

              <button
                type="button"
                className="cinematic-secondary-btn hero-demo-cta"
                onClick={onViewDemo}
              >
                <Play size={14} fill="currentColor" />
                <span>Watch demo</span>
              </button>
            </div>

            {/* Micro Technical Metadata Strip */}
            <div className="hero-technical-strip">
              <div className="tech-strip-item">
                <Brain size={13} className="strip-icon indigo" />
                <span>Autonomous OODA Loop</span>
              </div>
              <span className="strip-dot">•</span>
              <div className="tech-strip-item">
                <Terminal size={13} className="strip-icon purple" />
                <span>Sandboxed Execution</span>
              </div>
              <span className="strip-dot">•</span>
              <div className="tech-strip-item">
                <CheckCircle2 size={13} className="strip-icon green" />
                <span>0-Regression Guarantee</span>
              </div>
            </div>
          </div>

          {/* Right Column: Sophisticated Agent Visualization (Floating Technical UI) */}
          <div className="hero-visual-col">
            <div className="agent-visualization-container">
              {/* Floating Technical Badge 1 */}
              <div className="floating-telemetry-chip chip-top-left">
                <Cpu size={12} />
                <span>AST SYMBOLS: 42 INDEXED</span>
              </div>

              {/* Floating Technical Badge 2 */}
              <div className="floating-telemetry-chip chip-top-right">
                <span className="live-dot-green"></span>
                <span>SANDBOX: ISOLATED EXIT 0</span>
              </div>

              {/* The Vertical Cognitive Flow Stages */}
              <div className="agent-pipeline-flow">
                <div className="pipeline-stages-ladder">
                  {workflowStages.map((stage, idx) => {
                    const isActive = activeStage === stage.id;
                    return (
                      <div
                        key={stage.id}
                        className={`pipeline-stage-node ${stage.accent} ${
                          isActive ? 'active-node' : ''
                        }`}
                        onClick={() => setActiveStage(stage.id)}
                        title={`Click to inspect ${stage.name} state`}
                      >
                        <div className="node-marker-pill">
                          <span className="node-index">0{idx + 1}</span>
                          <span className="node-name">{stage.name}</span>
                        </div>
                        {idx < workflowStages.length - 1 && (
                          <div className="node-connector-line">
                            <span className="connector-arrow">↓</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Floating Live Inspector Terminal for the Active Stage */}
                <div className="stage-telemetry-inspector">
                  <div className="inspector-top-bar">
                    <div className="inspector-left">
                      <span className={`inspector-status-dot ${currentStageObj.accent}`}></span>
                      <span className="inspector-stage-tag">{currentStageObj.name} STAGE</span>
                    </div>
                    <span className="inspector-metric-tag">{currentStageObj.metric}</span>
                  </div>

                  <div className="inspector-body">
                    <div className="inspector-desc-row">
                      <strong>{currentStageObj.label}</strong>
                      <p>{currentStageObj.subtext}</p>
                    </div>

                    <div className="inspector-code-box">
                      <div className="code-box-header">
                        <Terminal size={12} />
                        <span>{currentStageObj.tagline}</span>
                      </div>
                      <code className="code-text-line">{currentStageObj.code}</code>
                    </div>
                  </div>

                  <div className="inspector-footer-bar">
                    <span className="inspector-hint">
                      Click any stage node to inspect autonomous telemetry
                    </span>
                  </div>
                </div>
              </div>

              {/* Floating Technical Badge 3 */}
              <div className="floating-telemetry-chip chip-bottom-center">
                <Sparkles size={12} className="amber" />
                <span>AUTONOMOUS SELF-CORRECTION ARMED</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          3. LARGE STORYTELLING SCROLL TRANSITION
          "THE BUG ISN'T THE PROBLEM."
          ↓
          "THE INVESTIGATION IS."
          ↓
          "MEET REPOPILOT. BUILD THE BRAIN, NOT THE PUPPET."
          ==================================================================== */}
      <section id="story-section" className="cinematic-storytelling-section">
        <div className="story-container">
          {/* Transition 1: THE BUG ISN'T THE PROBLEM */}
          <div className="story-block block-stark">
            <span className="story-eyebrow">01 / THE REALITY OF MODERN CODEBASES</span>
            <h2 className="story-editorial-title text-muted-gradient">
              THE BUG ISN'T<br />
              <span className="white-glow">THE PROBLEM.</span>
            </h2>
            <p className="story-narrative-lead">
              Every production system breaks. Software systems are distributed, asynchronous, and
              interdependent. Finding a null pointer or an unhandled KeyError takes three seconds once
              you know where to look.
            </p>
          </div>

          <div className="story-divider-arrow">
            <div className="arrow-line"></div>
            <ArrowDown size={18} className="arrow-icon" />
          </div>

          {/* Transition 2: THE INVESTIGATION IS. */}
          <div className="story-block block-pivot">
            <span className="story-eyebrow accent-amber">02 / THE COST OF INVESTIGATION</span>
            <h2 className="story-editorial-title text-amber-gradient">
              THE INVESTIGATION<br />
              <span className="accent-glow">IS.</span>
            </h2>
            <p className="story-narrative-lead">
              Engineers spend 70% of debugging time playing detective: reading obscure tracebacks,
              re-running repro scripts in virtual environments, trying naive fixes that cause
              collateral regressions, and waiting on CI pipelines.
            </p>
          </div>

          <div className="story-divider-arrow">
            <div className="arrow-line"></div>
            <ArrowDown size={18} className="arrow-icon" />
          </div>

          {/* Transition 3: Introduce RepoPilot */}
          <div className="story-block block-heroic">
            <span className="story-eyebrow accent-indigo">03 / THE AUTONOMOUS SHIFT</span>
            <h2 className="story-editorial-title text-indigo-gradient">
              MEET REPOPILOT.<br />
              <span>BUILD THE BRAIN, NOT THE PUPPET.</span>
            </h2>
            <p className="story-narrative-lead">
              A standard LLM is a puppet—it requires human prompts, copies of files, and gives up the
              moment its first suggestion fails. RepoPilot is an autonomous engineer: it ingests ASTs,
              executes shell tools, catches its own errors, reflects on what went wrong, and verifies
              its own fixes.
            </p>

            <div className="story-action-wrap">
              <button
                type="button"
                className="cinematic-primary-btn"
                onClick={onStartDebugging}
              >
                <span>Launch investigation</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          4. "HOW REPOPILOT WORKS" SECTION
          01 Understand
          02 Act
          03 Observe
          04 Recover
          05 Resolve
          (Large typography, visual composition, NOT a generic card grid)
          ==================================================================== */}
      <section id="how-it-works-section" className="cinematic-how-it-works-section">
        <div className="how-header-row">
          <span className="how-eyebrow">COGNITIVE ARCHITECTURE</span>
          <h2 className="how-main-title">How RepoPilot works</h2>
          <p className="how-subtitle">
            Five deterministic phases engineered for zero hallucinations and autonomous failure recovery.
          </p>
        </div>

        <div className="how-composition-layout">
          {/* Left Column: Five Large Typography Steps */}
          <div className="how-steps-timeline">
            {howItWorksSteps.map((step) => {
              const isSelected = activeStoryTab === step.id;
              return (
                <div
                  key={step.id}
                  className={`how-timeline-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => setActiveStoryTab(step.id)}
                >
                  <div className="how-item-left">
                    <span className="how-step-number">{step.num}</span>
                  </div>
                  <div className="how-item-content">
                    <h3 className="how-step-title">{step.title}</h3>
                    <span className="how-step-lead">{step.subtitle}</span>
                    <p className="how-step-desc">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Floating Technical Artifact Display */}
          <div className="how-interactive-telemetry">
            {(() => {
              const currentStep =
                howItWorksSteps.find((s) => s.id === activeStoryTab) || howItWorksSteps[3];
              return (
                <div className="telemetry-display-panel">
                  <div className="telemetry-panel-header">
                    <div className="panel-file-info">
                      <FileCode size={14} className="file-icon" />
                      <span className="file-name">{currentStep.technicalArtifact.file}</span>
                    </div>
                    <span className="telemetry-verified-badge">
                      {currentStep.technicalArtifact.badge}
                    </span>
                  </div>

                  <div className="telemetry-code-canvas">
                    <pre className="telemetry-raw-code">
                      <code>{currentStep.technicalArtifact.preview}</code>
                    </pre>
                  </div>

                  <div className="telemetry-panel-footer">
                    <div className="footer-status-row">
                      <span className="footer-pulse-dot"></span>
                      <span className="footer-status-text">
                        Phase {currentStep.num} Active in Docker Sandbox
                      </span>
                    </div>
                    <button
                      type="button"
                      className="inspect-step-btn"
                      onClick={onViewDemo}
                    >
                      <span>Simulate trace</span>
                      <Play size={11} fill="currentColor" />
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </section>

      {/* ====================================================================
          5. STRONG FINAL CTA SECTION
          "READY TO LET IT INVESTIGATE?"
          Start debugging
          ==================================================================== */}
      <section className="cinematic-final-cta-section">
        <div className="final-cta-glow-mesh"></div>
        <div className="final-cta-inner">
          <span className="final-eyebrow">PERSISTENT AUTONOMY</span>
          <h2 className="final-cta-headline">
            READY TO LET IT<br />
            <span className="cta-indigo-gradient">INVESTIGATE?</span>
          </h2>
          <p className="final-cta-subtext">
            Give your repository an autonomous debugging engineer that investigates root causes,
            reflects on tool errors, and proves 0 regressions.
          </p>

          <div className="final-actions-group">
            <button
              type="button"
              className="cinematic-primary-btn final-big-btn"
              onClick={onStartDebugging}
            >
              <span>Start debugging</span>
              <ArrowRight size={16} />
            </button>

            <button
              type="button"
              className="cinematic-secondary-btn final-demo-btn"
              onClick={onViewDemo}
            >
              <Play size={14} fill="currentColor" />
              <span>Watch demo</span>
            </button>
          </div>

          <div className="final-reassurance-row">
            <span>✓ Zero backend changes required</span>
            <span className="sep">•</span>
            <span>✓ Isolated Docker virtual environments</span>
            <span className="sep">•</span>
            <span>✓ OODA cognitive failure recovery</span>
          </div>
        </div>
      </section>

      {/* ====================================================================
          6. PROFESSIONAL MINIMAL DEVELOPER FOOTER
          ==================================================================== */}
      <footer className="cinematic-footer">
        <div className="footer-content-grid">
          <div className="footer-col-brand">
            <div className="footer-brand-title">
              <Bot size={16} />
              <span>RepoPilot</span>
            </div>
            <p className="footer-tagline">
              Autonomous AI software debugging engineer. Built for production codebases.
            </p>
            <span className="footer-track-badge">Build the Brain, Not the Puppet</span>
          </div>

          <div className="footer-col-links">
            <span className="footer-col-heading">Product</span>
            <button type="button" onClick={onStartDebugging}>AI Workspace</button>
            <button type="button" onClick={onViewDemo}>Live Demo</button>
            <button type="button" onClick={onOpenDocs}>OODA Architecture</button>
          </div>

          <div className="footer-col-links">
            <span className="footer-col-heading">Resources</span>
            <button type="button" onClick={onOpenDocs}>Tool Registry</button>
            <button type="button" onClick={onOpenSettings}>Simulation Config</button>
            <button type="button" onClick={onOpenLogin}>Session Auth</button>
          </div>

          <div className="footer-col-links">
            <span className="footer-col-heading">Environment</span>
            <span className="footer-meta-pill">Python 3.11 • pytest</span>
            <span className="footer-meta-pill">Docker Sandbox #01</span>
            <span className="footer-meta-pill">Localhost 5173</span>
          </div>
        </div>

        <div className="footer-bottom-line">
          <span>© 2026 RepoPilot Autonomous Systems. All rights reserved.</span>
          <div className="footer-system-status">
            <span className="status-dot-green"></span>
            <span>Agent Core System Online</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
