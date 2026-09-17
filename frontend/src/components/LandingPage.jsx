/**
 * LandingPage Component — Cinematic Motion-Design Film Experience
 *
 * Core Visual Direction:
 * - Palette: Near-black (#080604 / #0D0A07), Warm Brown (#3A2517 / #5A3920 / #704722),
 *   Cream (#F2E5B8 / #E9D99F / #FFF1C7), Muted Warm Gray (#8D8272).
 * - Typography: Ultra-heavy condensed display font (Anton / Bebas Neue / Oswald) with extreme scale.
 * - Architecture: Large inset rounded .cinematic-frame (92vw width) containing layered atmospheric visuals.
 * - Choreography: Pinned scroll scenes, floating editorial artifact collages, and sequential agent loop storytelling.
 * - Zero blue / zero purple SaaS gradients.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowRight,
  Play,
  Terminal,
  Brain,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Search,
  FolderGit2,
  ShieldCheck,
  ChevronDown,
  ExternalLink,
  Code2,
  Sparkles,
  Command
} from 'lucide-react';
import { useAuth } from '../services/authContext.jsx';

// 8-Stage Sequential Agent Loop Story Data
const AGENT_LOOP_FILM_STAGES = [
  {
    id: 'task',
    step: '01',
    name: 'TASK',
    headline: 'THE OBJECTIVE',
    subtext: 'A developer reports an unhandled KeyError in production token payload.',
    technicalMeta: 'REPRODUCE_OBJECTIVE: test_login_500 in tests/test_auth.py',
    accent: 'cream'
  },
  {
    id: 'plan',
    step: '02',
    name: 'PLAN',
    headline: 'FORMULATE HYPOTHESIS',
    subtext: 'Agent generates multi-step diagnostic sub-goals and maps AST symbol dependencies.',
    technicalMeta: 'DECOMPOSE_GOAL: 3 sub-goals generated, depth-3 call tree isolated',
    accent: 'cream'
  },
  {
    id: 'act',
    step: '03',
    name: 'ACT',
    headline: 'DISPATCH SANDBOX TOOL',
    subtext: 'Executes isolated test command to observe runtime failure behavior.',
    technicalMeta: 'EXECUTE: subprocess("pytest tests/test_auth.py") in Docker container',
    accent: 'warm-brown'
  },
  {
    id: 'observe',
    step: '04',
    name: 'OBSERVE',
    headline: 'CAPTURE RAW REALITY',
    subtext: 'Intercepts non-zero exit code and extracts runtime stack trace from stderr.',
    technicalMeta: 'PARSED: KeyError: "jwt_secret" at auth_service.py:42',
    accent: 'warm-gold'
  },
  {
    id: 'failure',
    step: '05',
    name: 'FAILURE',
    headline: 'THE TURNING POINT',
    subtext: 'Initial hypothesis falsified. Normal bots halt here. RepoPilot reflects.',
    technicalMeta: 'STATE: FAULT_INTERCEPTED (exit_code=1) -> DISPATCHING COGNITIVE MONITOR',
    accent: 'error'
  },
  {
    id: 'reflect',
    step: '06',
    name: 'REFLECT',
    headline: 'SELF-CORRECT STRATEGY',
    subtext: 'Agent deduces that config key name differs between modules and queries codebase.',
    technicalMeta: 'REFLECTION: "jwt_secret missing from active env. Will inspect settings.py defaults."',
    accent: 'warm-amber'
  },
  {
    id: 'replan',
    step: '07',
    name: 'REPLAN',
    headline: 'EXECUTE NEW ACTION',
    subtext: 'Searches canonical definitions and synthesizes AST-validated unified diff.',
    technicalMeta: 'ACTION: apply_diff("config.py", fallback_defaults) -> 1 file modified',
    accent: 'warm-gold'
  },
  {
    id: 'success',
    step: '08',
    name: 'SUCCESS',
    headline: 'VERIFIED ZERO REGRESSIONS',
    subtext: 'Re-runs reproduction test suite. All assertions pass. Resolution mathematically proven.',
    technicalMeta: 'ASSERTION: 5 passed in 0.18s -> TASK_COMPLETED_SUCCESSFULLY',
    accent: 'success'
  }
];

// The 6-Step Failure & Recovery Turning Point Sequence
const TURNING_POINT_STEPS = [
  {
    num: '01',
    label: 'Tool fails',
    headline: 'SANDBOX TEST FAILS',
    detail: 'Pytest exits with code 1 due to KeyError: "jwt_secret" in token payload handler.',
    code: '$ pytest tests/test_auth.py\nFAILED tests/test_auth.py::test_login_500 - KeyError: "jwt_secret"\nExit code: 1',
    badge: 'FAULT_DETECTED'
  },
  {
    num: '02',
    label: 'Agent notices failure',
    headline: 'MONITOR INTERCEPTS FAULT',
    detail: 'The cognitive monitor intercepts non-zero exit code and falsifies the active hypothesis.',
    code: '[COGNITIVE MONITOR] Intercepted exit_code=1 from container.\n[EVALUATION] Initial hypothesis invalid. Key does not exist in environment dict.',
    badge: 'HYPOTHESIS_FALSIFIED'
  },
  {
    num: '03',
    label: 'Agent reflects',
    headline: 'AUTONOMOUS SELF-CORRECTION',
    detail: 'Rather than crashing or spamming retries, the agent reasons about the root cause.',
    code: '[AUTONOMOUS REFLECTION]\n"The test fails because secret_key is missing. I must inspect settings.py and provide default fallback handling."',
    badge: 'REASONING_PIVOT'
  },
  {
    num: '04',
    label: 'Agent changes strategy',
    headline: 'FORMULATES ALTERNATIVE PLAN',
    detail: 'Shifts strategy from direct assertion to canonical codebase reference search.',
    code: '[STRATEGY PIVOT]\nTarget: Search codebase for canonical key name references across settings module.',
    badge: 'STRATEGY_SHIFT'
  },
  {
    num: '05',
    label: 'Agent selects another action',
    headline: 'DISPATCHES SURGICAL PATCH',
    detail: 'Dispatches search_codebase and synthesizes a safe fallback getter via AST diff.',
    code: '$ repopilot.apply_diff("config.py", fallback_defaults)\nUpdated config.py: +4 -1 lines.\nEnsures safe dictionary retrieval with fallback.',
    badge: 'ACTION_DISPATCHED'
  },
  {
    num: '06',
    label: 'Task succeeds',
    headline: 'VERIFIED GREEN ASSERTIONS',
    detail: 'Re-runs the isolated test suite to confirm complete resolution with zero regressions.',
    code: '$ pytest tests/test_auth.py\n======================== 5 passed in 0.18s ========================\n✓ VERIFIED: All tests passing cleanly. Zero regressions detected.',
    badge: 'VERIFIED_SUCCESS'
  }
];

export default function LandingPage({
  onStartDebugging,
  onViewDemo,
  onOpenLogin,
  onOpenDocs,
  onOpenSettings,
}) {
  const { user, isAuthenticated } = useAuth();

  // Mouse coordinate state for restrained atmospheric lighting
  const [mousePos, setMousePos] = useState({ x: 50, y: 30 });
  const [scrollY, setScrollY] = useState(0);

  // Active step in the Agent Loop Film Story
  const [activeLoopIndex, setActiveLoopIndex] = useState(0);

  // Active step in the Failure Turning Point Stepper
  const [activeTurningStep, setActiveTurningStep] = useState(0);

  // Track mouse coordinates over the window
  useEffect(() => {
    const handleMouseMove = (e) => {
      const xPercent = (e.clientX / window.innerWidth) * 100;
      const yPercent = (e.clientY / window.innerHeight) * 100;
      setMousePos({ x: Math.round(xPercent), y: Math.round(yPercent) });
    };

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Compute scroll progress for Scene 1 to Scene 2 transition
  const heroScale = Math.max(0.85, 1 - scrollY * 0.00035);
  const heroTranslateY = Math.min(60, scrollY * 0.12);

  return (
    <div className="film-experience-root">
      {/* 1. ATMOSPHERIC BACKGROUND LAYERS (Warm Brown / Black Ambient) */}
      <div
        className="film-ambient-spotlight"
        style={{
          background: `radial-gradient(circle 800px at ${mousePos.x}% ${mousePos.y}%, rgba(112, 71, 34, 0.22) 0%, rgba(58, 37, 23, 0.08) 45%, transparent 70%)`
        }}
      />
      <div className="film-grain-overlay" />
      <div className="film-vignette-mask" />

      {/* 2. MINIMAL FILM NAVBAR (Understated & Integrated) */}
      <header className={`film-navbar ${scrollY > 50 ? 'film-navbar-scrolled' : ''}`}>
        <div className="film-navbar-inner">
          {/* Logo / Wordmark */}
          <div className="film-nav-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="film-brand-beacon" />
            <span className="film-brand-title">REPOPILOT</span>
            <span className="film-brand-tag">AUTONOMOUS</span>
          </div>

          {/* Minimal Center Navigation Links */}
          <nav className="film-nav-center">
            <a
              href="#scene-hero"
              className="film-nav-link"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('scene-hero')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Overview
            </a>
            <a
              href="#scene-story"
              className="film-nav-link"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('scene-story')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              How It Works
            </a>
            <a
              href="#scene-artifacts"
              className="film-nav-link"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('scene-artifacts')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Artifacts
            </a>
            <a
              href="#scene-loop"
              className="film-nav-link"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('scene-loop')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              The Loop
            </a>
          </nav>

          {/* Compact Right Actions */}
          <div className="film-nav-right">
            {isAuthenticated && user ? (
              <div className="film-user-pill" onClick={onStartDebugging} title="Signed In. Open Workspace">
                <span className="user-dot" />
                <span className="user-name">{user.name.split(' ')[0]}</span>
              </div>
            ) : (
              <button type="button" className="film-nav-signin-btn" onClick={onOpenLogin}>
                Sign In
              </button>
            )}

            <button type="button" className="film-nav-cta-btn" onClick={onStartDebugging}>
              <span>START DEBUGGING</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </header>

      {/* ====================================================================
          3. SCENE 1: THE HERO CINEMATIC FRAME
          Inset 92vw frame containing the atmospheric celestial orb visual and
          oversized condensed typography.
          ==================================================================== */}
      <section id="scene-hero" className="scene-hero-viewport">
        <div className="cinematic-frame hero-main-frame">
          {/* Internal Atmospheric Background: Warm Volumetric Orb Visual */}
          <div className="hero-atmosphere-stage">
            <div className="cinematic-orb-visual" />
            <div className="cinematic-orb-secondary" />
            <div className="volumetric-haze-layer" />
            <div className="frame-inner-grid-lines" />
          </div>

          {/* Hero Content Layer */}
          <div
            className="hero-frame-content"
            style={{
              transform: `translate3d(0, ${heroTranslateY}px, 0) scale(${heroScale})`,
              transition: 'transform 100ms cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            {/* Tiny Technical Eyebrow Label */}
            <div className="hero-micro-eyebrow">
              <span className="eyebrow-accent-line" />
              <span className="eyebrow-mono-text">REPOPILOT // AUTONOMOUS SOFTWARE DEBUGGING COGNITION</span>
            </div>

            {/* Oversized Condensed Headline */}
            <div className="hero-display-typography-wrap">
              <h1 className="hero-condensed-headline">
                BUILD THE BRAIN.<br />
                <span className="headline-cream-highlight">DEBUG ON AUTOPILOT.</span>
              </h1>
            </div>

            {/* Supporting Editorial Copy & Minimal CTAs */}
            <div className="hero-supporting-row">
              <p className="hero-editorial-copy">
                RepoPilot investigates the codebase, forms a plan, uses the right tools,
                observes what actually happened, recovers from failures,
                and replans until the task is verified.
              </p>

              <div className="hero-actions-cluster">
                <button
                  type="button"
                  className="film-primary-action-btn"
                  onClick={onStartDebugging}
                >
                  <span>LAUNCH YOUR AGENT</span>
                  <ArrowRight size={14} />
                </button>

                <button
                  type="button"
                  className="film-secondary-action-btn"
                  onClick={() => {
                    document.getElementById('scene-story')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <Play size={13} />
                  <span>SEE HOW IT WORKS</span>
                </button>
              </div>
            </div>

            {/* Micro Technical Metadata Footer inside Frame */}
            <div className="hero-frame-footer-meta">
              <div className="meta-point">
                <span className="meta-bullet" />
                <span>AST SYMBOL GRAPH: DEPTH-3 INDEX</span>
              </div>
              <div className="meta-point">
                <span className="meta-bullet" />
                <span>SANDBOX: ISOLATED RUNTIME RUNNER</span>
              </div>
              <div className="meta-point">
                <span className="meta-bullet" />
                <span>ZERO BABYSITTING: SELF-HEALING REGRESSION CHECKS</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          4. SCENE 2: FIRST PINNED SCROLL TRANSITION & BUSINESS STORY
          "WHAT CAN YOUR AGENT DO?" -> "YOUR CODEBASE. ON AUTOPILOT."
          ==================================================================== */}
      <section id="scene-story" className="scene-pinned-transition-viewport">
        <div className="cinematic-frame story-transition-frame">
          <div className="story-frame-decorations">
            <span className="frame-corner-mark top-left">+</span>
            <span className="frame-corner-mark top-right">+</span>
            <span className="frame-corner-mark bottom-left">+</span>
            <span className="frame-corner-mark bottom-right">+</span>
          </div>

          <div className="story-editorial-stage">
            <span className="story-scene-counter">ACT I // THE INVESTIGATION</span>
            <h2 className="story-question-display">
              WHAT CAN YOUR<br />
              <span className="text-amber-glow">AGENT DO?</span>
            </h2>

            <div className="story-shift-block">
              <h3 className="story-statement-display">
                YOUR CODEBASE.<br />
                <span className="text-cream-glow">ON AUTOPILOT.</span>
              </h3>
              <p className="story-body-paragraph">
                Debugging is not chat. It is an adversarial, multi-step investigation against broken
                environments, falsified hypotheses, and silent edge cases. RepoPilot runs inside an isolated
                sandbox container, inspects call trees, applies targeted diffs, and does not stop until every test passes.
              </p>

              <div className="story-features-ribbon">
                <div className="ribbon-card">
                  <span className="ribbon-num">01</span>
                  <h4 className="ribbon-title">DEEP CODEBASE INGESTION</h4>
                  <p className="ribbon-text">Extracts AST symbol call graphs to isolate fault domains before acting.</p>
                </div>
                <div className="ribbon-card">
                  <span className="ribbon-num">02</span>
                  <h4 className="ribbon-title">DETERMINISTIC TOOLS</h4>
                  <p className="ribbon-text">Invokes pytest, ripgrep, and AST parser tools inside a protected sandbox.</p>
                </div>
                <div className="ribbon-card">
                  <span className="ribbon-num">03</span>
                  <h4 className="ribbon-title">AUTONOMOUS REPLANNING</h4>
                  <p className="ribbon-text">When tool calls fail, the agent reasons about the error and adjusts strategy.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          5. SCENE 3: FLOATING IMAGE / ARTIFACT COLLAGE
          Editorial image panels / floating artifacts with varying sizes, depth,
          rotation, and parallax.
          ==================================================================== */}
      <section id="scene-artifacts" className="scene-floating-collage-viewport">
        <div className="cinematic-frame collage-main-frame">
          <div className="collage-header-block">
            <span className="collage-eyebrow">TACTILE ARTIFACTS // EVIDENCE STREAM</span>
            <h2 className="collage-huge-title">
              LIVE INVESTIGATION<br />
              <span className="headline-cream-highlight">ARTIFACTS.</span>
            </h2>
            <p className="collage-subtext">
              Real telemetry captured during an autonomous debugging session. Hover over any artifact to inspect its runtime payload.
            </p>
          </div>

          {/* 4 Floating Rectangular Visual Modules */}
          <div className="floating-artifacts-canvas">
            {/* Artifact 1: Code Investigation */}
            <div
              className="floating-card card-investigation"
              style={{
                transform: `translate3d(${(mousePos.x - 50) * 0.15}px, ${(mousePos.y - 50) * 0.15}px, 0) rotate(-2.5deg)`
              }}
            >
              <div className="artifact-card-topbar">
                <span className="artifact-index-badge">01</span>
                <span className="artifact-type-tag">CODE INVESTIGATION</span>
                <FileCode size={13} className="artifact-icon" />
              </div>
              <div className="artifact-visual-content">
                <span className="artifact-file-title">src/auth/jwt_handler.py</span>
                <pre className="artifact-code-snippet">
                  <code>
                    {`def verify_token_payload(payload, config):\n  # Target boundary\n  secret = config["jwt_secret"]\n  return jwt.decode(payload, secret)`}
                  </code>
                </pre>
                <div className="artifact-annotation">
                  <span className="anno-bullet" />
                  <span>AST indexed: 42 symbols, 14 callers isolated</span>
                </div>
              </div>
            </div>

            {/* Artifact 2: Tool Execution */}
            <div
              className="floating-card card-execution"
              style={{
                transform: `translate3d(${(mousePos.x - 50) * -0.18}px, ${(mousePos.y - 50) * 0.18}px, 0) rotate(1.8deg)`
              }}
            >
              <div className="artifact-card-topbar">
                <span className="artifact-index-badge">02</span>
                <span className="artifact-type-tag">TOOL EXECUTION</span>
                <Terminal size={13} className="artifact-icon" />
              </div>
              <div className="artifact-visual-content">
                <span className="artifact-file-title">sandbox-runner // pytest -v</span>
                <pre className="artifact-code-snippet">
                  <code>
                    {`$ pytest tests/test_auth.py\n[sandbox-isolated-env]\nExecuting: pytest -v --tb=short\nCaptured runtime pid: 14088`}
                  </code>
                </pre>
                <div className="artifact-annotation">
                  <span className="anno-bullet" />
                  <span>Sandbox: Docker Python 3.14 environment</span>
                </div>
              </div>
            </div>

            {/* Artifact 3: Failure Detected */}
            <div
              className="floating-card card-failure"
              style={{
                transform: `translate3d(${(mousePos.x - 50) * 0.22}px, ${(mousePos.y - 50) * -0.16}px, 0) rotate(-1.5deg)`
              }}
            >
              <div className="artifact-card-topbar">
                <span className="artifact-index-badge red">03</span>
                <span className="artifact-type-tag error">FAILURE DETECTED</span>
                <AlertTriangle size={13} className="artifact-icon red" />
              </div>
              <div className="artifact-visual-content">
                <span className="artifact-file-title">exception-traceback // KeyError</span>
                <pre className="artifact-code-snippet error">
                  <code>
                    {`FAILED tests/test_auth.py::test_login_500\nKeyError: 'jwt_secret'\nExit Code: 1 (Test Suite Failed)`}
                  </code>
                </pre>
                <div className="artifact-annotation error">
                  <span className="anno-bullet red" />
                  <span>Hypothesis falsified: parameter missing from config</span>
                </div>
              </div>
            </div>

            {/* Artifact 4: Reflection & Replan */}
            <div
              className="floating-card card-reflection"
              style={{
                transform: `translate3d(${(mousePos.x - 50) * -0.2}px, ${(mousePos.y - 50) * -0.2}px, 0) rotate(2deg)`
              }}
            >
              <div className="artifact-card-topbar">
                <span className="artifact-index-badge gold">04</span>
                <span className="artifact-type-tag amber">REFLECTION / REPLAN</span>
                <RotateCcw size={13} className="artifact-icon gold" />
              </div>
              <div className="artifact-visual-content">
                <span className="artifact-file-title">surgical-patch // unified-diff</span>
                <pre className="artifact-code-snippet gold">
                  <code>
                    {`--- a/src/auth/jwt_handler.py\n+++ b/src/auth/jwt_handler.py\n-  secret = config["jwt_secret"]\n+  secret = config.get("JWT_SECRET_KEY") or config.get("jwt_secret")`}
                  </code>
                </pre>
                <div className="artifact-annotation gold">
                  <span className="anno-bullet gold" />
                  <span>Verified pass: 5 passed in 0.08s (0 regressions)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          6. SCENE 4: THE AGENT LOOP AS A VISUAL FILM STORY
          Sequential progression:
          TASK -> PLAN -> ACT -> OBSERVE -> FAILURE -> REFLECT -> REPLAN -> SUCCESS
          Words appear huge sequentially, temperature shifts at failure, composition reorganizes.
          ==================================================================== */}
      <section id="scene-loop" className="scene-agent-loop-viewport">
        <div className="cinematic-frame loop-story-frame">
          <div className="loop-story-header">
            <span className="loop-eyebrow">COGNITIVE TIMELINE // THE 8-ACT REASONING FILM</span>
            <h2 className="loop-huge-title">
              THE AGENT LOOP,<br />
              <span className="headline-cream-highlight">STEP BY STEP.</span>
            </h2>
            <p className="loop-subtext">
              Watch how RepoPilot’s autonomous brain transitions from user prompt to mathematical verification. Click any stage to inspect the state machine.
            </p>
          </div>

          {/* Sequential Stage Navigation Strip */}
          <div className="film-stage-pills-strip">
            {AGENT_LOOP_FILM_STAGES.map((stage, idx) => {
              const isActive = activeLoopIndex === idx;
              return (
                <button
                  key={stage.id}
                  type="button"
                  className={`film-stage-pill ${isActive ? 'active' : ''} accent-${stage.accent}`}
                  onClick={() => setActiveLoopIndex(idx)}
                >
                  <span className="pill-step-num">{stage.step}</span>
                  <span className="pill-stage-name">{stage.name}</span>
                </button>
              );
            })}
          </div>

          {/* Large Editorial Stage Projection Area */}
          <div className={`loop-active-stage-card accent-${AGENT_LOOP_FILM_STAGES[activeLoopIndex].accent}`}>
            <div className="active-stage-content-col">
              <div className="active-stage-meta-row">
                <span className="active-stage-badge">
                  ACT {AGENT_LOOP_FILM_STAGES[activeLoopIndex].step} OF 08
                </span>
                <span className="active-stage-name-small">
                  STATE: {AGENT_LOOP_FILM_STAGES[activeLoopIndex].name}
                </span>
              </div>

              <h3 className="active-stage-headline">
                {AGENT_LOOP_FILM_STAGES[activeLoopIndex].headline}
              </h3>

              <p className="active-stage-subtext">
                {AGENT_LOOP_FILM_STAGES[activeLoopIndex].subtext}
              </p>

              <div className="active-stage-stepper-btns">
                <button
                  type="button"
                  className="film-step-btn prev"
                  disabled={activeLoopIndex === 0}
                  onClick={() => setActiveLoopIndex(Math.max(0, activeLoopIndex - 1))}
                >
                  ← PREVIOUS ACT
                </button>
                <button
                  type="button"
                  className="film-step-btn next"
                  disabled={activeLoopIndex === AGENT_LOOP_FILM_STAGES.length - 1}
                  onClick={() => setActiveLoopIndex(Math.min(AGENT_LOOP_FILM_STAGES.length - 1, activeLoopIndex + 1))}
                >
                  NEXT ACT →
                </button>
              </div>
            </div>

            {/* Right Telemetry Terminal Box */}
            <div className="active-stage-telemetry-col">
              <div className="telemetry-terminal-topbar">
                <div className="terminal-dots-row">
                  <span className="t-dot warm-red" />
                  <span className="t-dot warm-amber" />
                  <span className="t-dot warm-green" />
                </div>
                <span className="terminal-filename-mono">
                  repopilot://agent_state/{AGENT_LOOP_FILM_STAGES[activeLoopIndex].id}.log
                </span>
              </div>
              <pre className="telemetry-terminal-body">
                <code>{`// COGNITIVE DISPATCH // ACT ${AGENT_LOOP_FILM_STAGES[activeLoopIndex].step}\n${AGENT_LOOP_FILM_STAGES[activeLoopIndex].technicalMeta}\n\n[STATUS]: ${AGENT_LOOP_FILM_STAGES[activeLoopIndex].name}_DISPATCHED\n[CONTAINER]: sandbox-isolated\n[REGRESSIONS]: 0`}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          7. SCENE 5: THE FAILURE & RECOVERY SEQUENCE (The Turning Point)
          RUNNING TESTS -> 2 TESTS FAILED -> OBSERVES FAILURE -> REFLECTING...
          -> NEW PLAN -> RUNNING AGAIN -> ALL TESTS PASSED
          ==================================================================== */}
      <section className="scene-turning-point-viewport">
        <div className="cinematic-frame turning-point-frame">
          <div className="turning-point-header">
            <span className="turning-eyebrow">CRUCIAL HACKATHON CONCEPT // AUTONOMOUS RECOVERY</span>
            <h2 className="turning-huge-title">
              "THE FIRST PLAN CAN FAIL.<br />
              <span className="headline-cream-highlight">BUT THE AGENT DOESN'T STOP."</span>
            </h2>
            <p className="turning-subtext">
              Real bugs fight back. Watch the 6-step turning point sequence that separates RepoPilot from toy chatbots.
            </p>
          </div>

          {/* Stepper Navigation */}
          <div className="turning-steps-nav">
            {TURNING_POINT_STEPS.map((s, idx) => {
              const isSelected = activeTurningStep === idx;
              return (
                <button
                  key={s.num}
                  type="button"
                  className={`turning-step-selector ${isSelected ? 'selected' : ''}`}
                  onClick={() => setActiveTurningStep(idx)}
                >
                  <span className="step-num-mono">{s.num}</span>
                  <span className="step-label-text">{s.label}</span>
                </button>
              );
            })}
          </div>

          {/* Active Turning Point Detail Card */}
          <div className="turning-detail-card">
            <div className="turning-detail-left">
              <div className="turning-badge-line">
                <span className="badge-technical-mono">
                  {TURNING_POINT_STEPS[activeTurningStep].badge}
                </span>
                <span className="badge-step-counter">
                  PHASE {TURNING_POINT_STEPS[activeTurningStep].num} OF 06
                </span>
              </div>

              <h3 className="turning-detail-headline">
                {TURNING_POINT_STEPS[activeTurningStep].headline}
              </h3>

              <p className="turning-detail-copy">
                {TURNING_POINT_STEPS[activeTurningStep].detail}
              </p>

              <div className="turning-button-row">
                <button
                  type="button"
                  className="film-nav-cta-btn"
                  onClick={onStartDebugging}
                >
                  <span>TEST IN WORKSPACE</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>

            <div className="turning-detail-right">
              <div className="turning-code-box">
                <div className="code-box-header">
                  <span className="code-box-title">RUNTIME LOG BUFFER</span>
                </div>
                <pre className="code-box-content">
                  <code>{TURNING_POINT_STEPS[activeTurningStep].code}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          8. SCENE 6: FINAL CLIMAX STATEMENT & CTA
          Enormous condensed typography:
          "STOP BABYSITTING YOUR CODE."
          Small warm CTA: "START DEBUGGING ->"
          ==================================================================== */}
      <section className="scene-final-climax-viewport">
        <div className="cinematic-frame final-climax-frame">
          <div className="climax-atmosphere-glow" />

          <div className="climax-content-center">
            <span className="climax-eyebrow">REPOPILOT // READY TO RUN</span>

            <h2 className="climax-enormous-headline">
              STOP BABYSITTING<br />
              <span className="headline-cream-highlight">YOUR CODE.</span>
            </h2>

            <p className="climax-subtext">
              Connect your repository. Provide a bug report or failing test.
              Let the autonomous brain investigate, self-heal, and reach verified solutions.
            </p>

            <div className="climax-cta-cluster">
              <button
                type="button"
                className="film-primary-action-btn climax-main-btn"
                onClick={onStartDebugging}
              >
                <span>START DEBUGGING →</span>
              </button>

              <button
                type="button"
                className="film-secondary-action-btn"
                onClick={onOpenLogin}
              >
                <span>SIGN IN TO WORKSPACE</span>
              </button>
            </div>

            <div className="climax-footer-row">
              <span>RepoPilot Cognitive System v2.4</span>
              <span>•</span>
              <span>Autonomous AST & Sandbox Debugging</span>
              <span>•</span>
              <span>Zero Babysitting Guaranteed</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
