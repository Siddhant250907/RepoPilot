/**
 * LandingPage Component — Premium Cinematic Interactive AI Developer Platform Experience
 *
 * Implements:
 * 1. Navbar with scroll-driven surface & blur transitions
 * 2. Atmospheric background with mouse-tracking spotlight & subtle animated radial beams
 * 3. Scene 1: Scroll-driven typography ("YOUR CODEBASE." -> "ON AUTOPILOT.") revealing agent visual
 * 4. Pinned Agent Visual Section: Sticky viewport canvas synchronized with 7 narrative stages
 *    (UNDERSTAND -> ACT -> OBSERVE -> FAIL -> REFLECT -> RECOVER -> RESOLVE)
 * 5. Autonomous Loop Visual: PLAN -> ACT -> OBSERVE -> REFLECT -> REPLAN with illuminated state connectors
 * 6. The Failure Sequence: "THE FIRST PLAN CAN FAIL." (quieter error) -> "BUT THE AGENT DOESN'T STOP." (recovery -> success)
 * 7. Interactive In-Page Demo ("SEE IT WORK"): Progressive 9-step simulation with Run, Run Again, Reset
 * 8. Strong Final CTA: "READY TO LET IT INVESTIGATE?" + functional buttons
 * 9. Accessibility: Full prefers-reduced-motion support and clean responsive layouts
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  ArrowDown,
  RefreshCw,
  Clock,
  ChevronRight,
  Sliders,
  Check,
  XCircle,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../services/authContext.jsx';

// 7-Stage Pinned Narrative Workflow Data
const PINNED_WORKFLOW_STAGES = [
  {
    id: 'understand',
    number: '01',
    title: 'UNDERSTAND',
    label: 'Codebase Ingestion & Symbol Graph',
    subtitle: 'Extracts full AST semantics before executing any action',
    tagline: 'AST Call Graph Ingestion',
    codeSnippet: `// 1. Ingest repo symbols & error boundary
const ast = await repopilot.inspect_ast({
  target: "src/auth/jwt_handler.py",
  extract_call_graph: true,
  depth: 3
});
// AST Indexed: 42 symbols, 14 callers isolated`,
    visualMeta: {
      activeNode: 'PLAN',
      status: 'INDEXING',
      accent: 'indigo',
      badge: 'AST SYMBOLS: 42 INDEXED',
      details: 'Isolated exception boundary in jwt_handler.py at function verify_token_payload().'
    }
  },
  {
    id: 'act',
    number: '02',
    title: 'ACT',
    label: 'Deterministic Tool Execution',
    subtitle: 'Chooses and executes terminal tools inside an isolated sandbox',
    tagline: 'Subprocess Sandbox Runner',
    codeSnippet: `$ pytest tests/test_auth.py::test_login_500 --capture=no
[sandbox-isolated-env]
Executing command: pytest -v --tb=short
Captured runtime pid: 14088`,
    visualMeta: {
      activeNode: 'ACT',
      status: 'EXECUTING',
      accent: 'purple',
      badge: 'SANDBOX: ISOLATED EXIT',
      details: 'Dispatching tool: shell_tool("pytest tests/test_auth.py")'
    }
  },
  {
    id: 'observe',
    number: '03',
    title: 'OBSERVE',
    label: 'Raw Telemetry & Output Parsing',
    subtitle: 'Parses raw stdout/stderr into structured working memory',
    tagline: 'Structured Output Stream',
    codeSnippet: `FAILED tests/test_auth.py::test_login_500 - KeyError: 'jwt_secret'
Traceback (most recent call last):
  File "src/auth/jwt_handler.py", line 42, in verify_token_payload
    secret = config["jwt_secret"]
KeyError: 'jwt_secret'`,
    visualMeta: {
      activeNode: 'OBSERVE',
      status: 'CAPTURED',
      accent: 'blue',
      badge: 'FAULT: KEY_ERROR 42',
      details: 'Stderr parsed: KeyError on config dictionary access in jwt_handler.py:42.'
    }
  },
  {
    id: 'fail',
    number: '04',
    title: 'FAIL',
    label: 'Fault State Acknowledged',
    subtitle: 'The first plan encounters runtime reality. The visual quiets down.',
    tagline: 'Diagnostic Discrepancy',
    codeSnippet: `[AGENT COGNITIVE MONITOR]
Status: PLAN_FAILED
Hypothesis: "Key exists in environment payload" -> FALSIFIED
Exit Code: 1 (Test Suite Failed)`,
    visualMeta: {
      activeNode: 'FAIL',
      status: 'FAULT',
      accent: 'red',
      badge: 'HYPOTHESIS FALSIFIED',
      details: 'Agent acknowledges tool error without panic or infinite retry loop.'
    }
  },
  {
    id: 'reflect',
    number: '05',
    title: 'REFLECT',
    label: 'Autonomous Self-Correction',
    subtitle: 'Re-evaluates assumptions. Builds a smarter second hypothesis.',
    tagline: 'Cognitive OODA Pivot',
    codeSnippet: `[AUTONOMOUS REFLECTION]
"The environment config defines 'JWT_SECRET_KEY', not 'jwt_secret'.
Inspecting config schema in settings.py.
Switching strategy: search codebase for canonical key name."`,
    visualMeta: {
      activeNode: 'REFLECT',
      status: 'RETHINKING',
      accent: 'amber',
      badge: 'BRAIN, NOT PUPPET',
      details: 'Autonomous reflection dispatches codebase search to verify canonical key name.'
    }
  },
  {
    id: 'recover',
    number: '06',
    title: 'RECOVER',
    label: 'Secondary Tool & Precision Patch',
    subtitle: 'Executes recovery tool and applies minimal surgical diff',
    tagline: 'Targeted Unified Diff',
    codeSnippet: `--- a/src/auth/jwt_handler.py
+++ b/src/auth/jwt_handler.py
@@ -41,3 +41,3 @@
-    secret = config["jwt_secret"]
+    secret = config.get("JWT_SECRET_KEY") or config.get("jwt_secret")`,
    visualMeta: {
      activeNode: 'REPLAN',
      status: 'PATCHING',
      accent: 'amber',
      badge: '1 FILE PATCHED',
      details: 'Unified diff synthesized. 1 line replaced with fallback compatibility.'
    }
  },
  {
    id: 'resolve',
    number: '07',
    title: 'RESOLVE',
    label: 'Deterministic Verification',
    subtitle: 'Re-runs reproduction test suite to confirm mathematical fix',
    tagline: 'Verification Suite Pass',
    codeSnippet: `$ pytest tests/test_auth.py::test_login_500
tests/test_auth.py::test_login_500 PASSED                    [100%]
======== 1 passed in 0.08s (0 regressions detected) ========
Agent state: TASK_COMPLETED_SUCCESSFULLY`,
    visualMeta: {
      activeNode: 'RESOLVE',
      status: 'VERIFIED',
      accent: 'green',
      badge: 'VERIFIED: ZERO REGRESSIONS',
      details: 'All tests green. Memory state archived to execution trace.'
    }
  }
];

// 9-Step Interactive Live Demo Data
const DEMO_SIMULATION_STEPS = [
  {
    step: 1,
    type: 'PLAN',
    title: 'Decompose failure objective',
    desc: 'Analyzing reported bug: test_login_500 in tests/test_auth.py',
    tag: 'COGNITIVE_DECOMPOSE',
    output: 'Sub-goal 1: Inspect test failure line. Sub-goal 2: Run AST call graph check.',
    accent: 'indigo'
  },
  {
    step: 2,
    type: 'FILE READER',
    title: 'Read auth_service.py:35-55',
    desc: 'Inspecting JWT verification handler and configuration parameters',
    tag: 'TOOL: file_tool',
    output: 'Read 21 lines. Identified dictionary lookup: secret = config["jwt_secret"]',
    accent: 'purple'
  },
  {
    step: 3,
    type: 'OBSERVATION',
    title: 'Evaluate configuration syntax',
    desc: 'Potential KeyError detected if jwt_secret is absent from environment',
    tag: 'OBSERVATION',
    output: 'Key reference verified. Formulating reproduction test execution.',
    accent: 'blue'
  },
  {
    step: 4,
    type: 'PYTEST',
    title: 'Execute test suite in sandbox',
    desc: 'Running $ pytest tests/test_auth.py -k test_login_500',
    tag: 'TOOL: shell_tool',
    output: '$ pytest tests/test_auth.py::test_login_500\nExecution started in isolated container.',
    accent: 'purple'
  },
  {
    step: 5,
    type: 'ERROR',
    title: 'Captured KeyError fault',
    desc: 'Test failed with exit code 1. KeyError: "jwt_secret"',
    tag: 'FAULT_DETECTED',
    output: 'FAIL: KeyError in auth_service.py:42: config["jwt_secret"] not found in dict.',
    accent: 'red'
  },
  {
    step: 6,
    type: 'REFLECTION',
    title: 'Autonomous self-correction',
    desc: 'Hypothesis falsified. Inspecting settings.py to find canonical secret variable',
    tag: 'COGNITIVE_REFLECT',
    output: 'Observation: Settings defines JWT_SECRET_KEY. Modifying recovery strategy.',
    accent: 'amber'
  },
  {
    step: 7,
    type: 'SEARCH',
    title: 'Search codebase for references',
    desc: 'Executing ripgrep search for JWT_SECRET_KEY across config files',
    tag: 'TOOL: search_tool',
    output: 'Found 3 references in config/settings.py: JWT_SECRET_KEY = os.environ.get(...)',
    accent: 'indigo'
  },
  {
    step: 8,
    type: 'SUCCESS',
    title: 'Apply patch & re-verify test',
    desc: 'Updated auth_service.py:42 with safe key getter. Re-running pytest suite.',
    tag: 'TOOL: patch_verify',
    output: 'tests/test_auth.py::test_login_500 PASSED [100%]\n======== 1 passed in 0.07s ========',
    accent: 'green'
  },
  {
    step: 9,
    type: 'FINAL RESULT',
    title: 'Issue resolved autonomously',
    desc: 'Complete solution generated in 8 steps with 1 self-correction. Zero regressions.',
    tag: 'RESOLVED',
    output: 'Bug successfully eliminated. Clean unified patch ready for developer review.',
    accent: 'green'
  }
];

// The 6-Step Failure & Autonomous Recovery Lifecycle
const FAILURE_RECOVERY_LIFECYCLE_STEPS = [
  {
    step: 1,
    title: 'Tool fails',
    tag: 'FAULT ENCOUNTERED',
    badge: 'red',
    desc: 'Subprocess pytest returns non-zero exit code with unhandled KeyError.',
    telemetry: `$ pytest tests/test_auth.py\nFAILED tests/test_auth.py::test_login_500 - KeyError: 'jwt_secret'\nExit code: 1 (Execution halted)`
  },
  {
    step: 2,
    title: 'Agent notices failure',
    tag: 'OODA MONITOR',
    badge: 'amber',
    desc: 'The autonomous loop intercepts runtime failure telemetry and falsifies the initial plan.',
    telemetry: `[MONITOR] Captured exit_code=1 from sandbox container.\n[EVALUATION] Initial hypothesis falsified: parameter does not exist in active config dictionary.`
  },
  {
    step: 3,
    title: 'Agent reflects',
    tag: 'COGNITIVE REFLECTION',
    badge: 'amber',
    desc: 'The agent enters self-correction to deduce the real root cause rather than halting.',
    telemetry: `[REFLECTION] "The tests failed because secret_key is missing from the active config. I will inspect config.py and provide default configuration fallback."`
  },
  {
    step: 4,
    title: 'Agent changes strategy',
    tag: 'STRATEGY SHIFT',
    badge: 'purple',
    desc: 'Instead of brute forcing, the agent formulates a new search and patching sub-goal.',
    telemetry: `[NEW GOAL] Search codebase for canonical key name references across settings module.\n[DISPATCH TARGET] config.py & app.py fallback handling.`
  },
  {
    step: 5,
    title: 'Agent selects another action',
    tag: 'NEW ACTION DISPATCH',
    badge: 'purple',
    desc: 'Dispatches search_codebase and applies an AST-validated unified diff.',
    telemetry: `$ repopilot.apply_diff("config.py", fallback_defaults)\nUpdated config.py: +4 -1 lines.\nEnsures safe dictionary retrieval with fallback.`
  },
  {
    step: 6,
    title: 'Task succeeds',
    tag: 'AUTONOMOUS VERIFICATION',
    badge: 'green',
    desc: 'Re-runs the isolated test suite to confirm complete resolution with zero regressions.',
    telemetry: `$ pytest tests/test_auth.py\n======================== 5 passed in 0.18s ========================\n✓ VERIFIED: All tests passing cleanly. Zero regressions detected.`
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

  // Scroll position & Navbar state
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  // Scene 1 Typography scroll transition state (0 = YOUR CODEBASE, 1 = ON AUTOPILOT)
  const [scene1Progress, setScene1Progress] = useState(0);

  // Pinned section active stage
  const [pinnedActiveIndex, setPinnedActiveIndex] = useState(4); // default to REFLECT

  // Failure sequence interactive state ('error' | 'recovering' | 'success')
  const [failureSequencePhase, setFailureSequencePhase] = useState('error');
  // Interactive 6-step recovery index (0 to 5)
  const [recoveryStepIndex, setRecoveryStepIndex] = useState(2); // default to 'Agent reflects'

  // Interactive Live Demo simulation state
  const [demoStatus, setDemoStatus] = useState('idle'); // 'idle' | 'running' | 'completed'
  const [demoVisibleSteps, setDemoVisibleSteps] = useState([]);
  const [demoActiveStepIndex, setDemoActiveStepIndex] = useState(0);
  const demoIntervalRef = useRef(null);

  // Mouse position for subtle spotlight physics
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const landingRootRef = useRef(null);

  // Handle subtle mouse movement
  const handleMouseMove = (e) => {
    if (!landingRootRef.current) return;
    const rect = landingRootRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  };

  // Scroll listener with requestAnimationFrame for 60fps responsiveness
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScroll = window.scrollY || document.documentElement.scrollTop;
          setScrollY(currentScroll);
          setIsScrolled(currentScroll > 40);

          // Scene 1 progress calculation (between 0px and 450px)
          const s1 = Math.min(1, Math.max(0, currentScroll / 360));
          setScene1Progress(s1);

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Interactive Demo runner
  const handleRunInteractiveDemo = () => {
    if (demoStatus === 'running') return;
    setDemoStatus('running');
    setDemoVisibleSteps([DEMO_SIMULATION_STEPS[0]]);
    setDemoActiveStepIndex(0);

    let currentIndex = 0;
    if (demoIntervalRef.current) clearInterval(demoIntervalRef.current);

    demoIntervalRef.current = setInterval(() => {
      currentIndex += 1;
      if (currentIndex < DEMO_SIMULATION_STEPS.length) {
        setDemoVisibleSteps(DEMO_SIMULATION_STEPS.slice(0, currentIndex + 1));
        setDemoActiveStepIndex(currentIndex);
      } else {
        clearInterval(demoIntervalRef.current);
        setDemoStatus('completed');
      }
    }, 850);
  };

  const handleResetDemo = () => {
    if (demoIntervalRef.current) clearInterval(demoIntervalRef.current);
    setDemoStatus('idle');
    setDemoVisibleSteps([]);
    setDemoActiveStepIndex(0);
  };

  useEffect(() => {
    return () => {
      if (demoIntervalRef.current) clearInterval(demoIntervalRef.current);
    };
  }, []);

  const activePinnedStage = PINNED_WORKFLOW_STAGES[pinnedActiveIndex];

  return (
    <div
      ref={landingRootRef}
      className="cinematic-landing-root"
      onMouseMove={handleMouseMove}
      style={{
        '--mouse-x': `${mousePos.x}%`,
        '--mouse-y': `${mousePos.y}%`
      }}
    >
      {/* Dynamic Atmospheric Spotlight & Subtle Glows */}
      <div className="ambient-spotlight-pointer" />
      <div className="ambient-beam-top" />
      <div className="ambient-glow-indigo" />
      <div className="ambient-glow-violet" />
      <div className="hairline-grid-pattern" />

      {/* ====================================================================
          1. MINIMAL CINEMATIC NAVBAR (Scroll-reactive glass surface)
          ==================================================================== */}
      <header className={`cinematic-navbar ${isScrolled ? 'navbar-scrolled' : ''}`}>
        <div className="navbar-container">
          {/* Left: Brand */}
          <div
            className="navbar-brand-group"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="brand-vector-mark">
              <Bot size={18} />
              <span className="brand-ambient-ring" />
            </div>
            <span className="brand-title-text">RepoPilot</span>
            <span className="brand-version-pill">v0.2</span>
          </div>

          {/* Center: Navigation Links */}
          <nav className="navbar-center-nav">
            <a
              href="#scene-hero"
              className="cinematic-nav-link"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('scene-hero')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Product
            </a>
            <a
              href="#pinned-agent-story"
              className="cinematic-nav-link"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('pinned-agent-story')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              How It Works
            </a>
            <a
              href="#interactive-demo-section"
              className="cinematic-nav-link"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('interactive-demo-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Demo
            </a>
          </nav>

          {/* Right: Actions */}
          <div className="navbar-right-ctas">
            {isAuthenticated && user ? (
              <div
                className="user-logged-pill"
                onClick={onStartDebugging}
                title="Signed in. Open workspace"
              >
                <img
                  src={user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&fit=crop'}
                  alt={user.name}
                  className="user-nav-avatar"
                />
                <span className="user-nav-name">{user.name.split(' ')[0]}</span>
              </div>
            ) : (
              <button
                type="button"
                className="cinematic-login-btn"
                onClick={onOpenLogin}
              >
                Sign In
              </button>
            )}

            <button
              type="button"
              className="cinematic-primary-btn"
              onClick={onStartDebugging}
            >
              <span>Start Debugging</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* ====================================================================
          2. SCENE 1: CONTINUOUS SCROLL-DRIVEN HERO REVEAL
          "YOUR CODEBASE." -> "ON AUTOPILOT." -> REVEALS CENTRAL AGENT LOOP
          ==================================================================== */}
      {/* ====================================================================
          2. HERO EXPERIENCE: REPOPILOT AUTONOMOUS DEBUGGING
          ==================================================================== */}
      <section id="scene-hero" className="scene-hero-wrapper">
        <div className="scene-hero-container">
          {/* Eyebrow Label */}
          <div className="hero-eyebrow-badge">
            <span className="eyebrow-pulse-dot" />
            <span className="eyebrow-text">REPOPILOT</span>
          </div>

          {/* Large Editorial Headline */}
          <div className="cinematic-hero-headline-wrap">
            <h1 className="hero-editorial-headline">
              Autonomous debugging,<br />
              <span className="headline-gradient-span">without the babysitting.</span>
            </h1>
          </div>

          {/* Supporting Pitch Text */}
          <p className="hero-editorial-subtext">
            RepoPilot investigates your codebase, formulates multi-step plans, invokes terminal and AST tools,
            observes runtime reality, handles failures autonomously, replans dynamically, and reaches verified solutions.
          </p>

          {/* Action CTAs */}
          <div className="hero-cta-buttons-row">
            <button
              type="button"
              className="cinematic-primary-btn hero-main-cta"
              onClick={onStartDebugging}
            >
              <Terminal size={16} />
              <span>Start Debugging</span>
              <ArrowRight size={15} />
            </button>

            <button
              type="button"
              className="cinematic-secondary-btn hero-demo-cta"
              onClick={() => {
                document.getElementById('interactive-demo-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <Play size={15} />
              <span>See How It Works</span>
            </button>
          </div>

          {/* Subtle Technical Indicators */}
          <div className="hero-technical-strip">
            <div className="tech-strip-item">
              <Cpu size={13} className="strip-icon indigo" />
              <span>AST Index: 42 symbols mapped</span>
            </div>
            <span className="strip-dot">•</span>
            <div className="tech-strip-item">
              <Activity size={13} className="strip-icon purple" />
              <span>Cognitive Trace: Active OODA Loop</span>
            </div>
            <span className="strip-dot">•</span>
            <div className="tech-strip-item">
              <ShieldCheck size={13} className="strip-icon green" />
              <span>Sandbox: Isolated Docker Runtime</span>
            </div>
          </div>
        </div>

        {/* Visual Agent System Around Hero: TASK -> PLAN -> ACT -> OBSERVE -> REFLECT -> REPLAN -> SUCCESS */}
        <div className="scene-central-system-showcase">
          <div className="central-system-ring-ambient" />
          <div className="central-agent-system-card">
            <div className="system-card-topbar">
              <div className="system-status-indicator">
                <span className="indicator-core-dot active-indigo" />
                <span className="system-status-title">AUTONOMOUS COGNITIVE ENGINE</span>
              </div>
              <div className="system-telemetry-pill">
                <code>AGENT_STATE: REFLECT_ACTIVE</code>
              </div>
            </div>

            {/* The 7-State Visual Flow: TASK -> PLAN -> ACT -> OBSERVE -> REFLECT -> REPLAN -> SUCCESS */}
            <div className="autonomous-state-loop-diagram hero-seven-state-loop">
              <div className="loop-node-box node-task">
                <span className="node-badge-tag">01</span>
                <span className="node-name-text">TASK</span>
                <span className="node-sub-meta">User Objective</span>
              </div>

              <div className="loop-connector-arrow">
                <ArrowRight size={13} />
              </div>

              <div className="loop-node-box node-plan">
                <span className="node-badge-tag">02</span>
                <span className="node-name-text">PLAN</span>
                <span className="node-sub-meta">Subgoals</span>
              </div>

              <div className="loop-connector-arrow">
                <ArrowRight size={13} />
              </div>

              <div className="loop-node-box node-act">
                <span className="node-badge-tag">03</span>
                <span className="node-name-text">ACT</span>
                <span className="node-sub-meta">Tool Dispatch</span>
              </div>

              <div className="loop-connector-arrow">
                <ArrowRight size={13} />
              </div>

              <div className="loop-node-box node-observe">
                <span className="node-badge-tag">04</span>
                <span className="node-name-text">OBSERVE</span>
                <span className="node-sub-meta">Raw Output</span>
              </div>

              <div className="loop-connector-arrow error-branch">
                <ArrowRight size={13} />
              </div>

              <div className="loop-node-box node-reflect illuminated-amber">
                <span className="node-badge-tag">05</span>
                <span className="node-name-text">REFLECT</span>
                <span className="node-sub-meta">Self-Correction</span>
                <span className="node-beacon-glow" />
              </div>

              <div className="loop-connector-arrow">
                <ArrowRight size={13} />
              </div>

              <div className="loop-node-box node-replan">
                <span className="node-badge-tag">06</span>
                <span className="node-name-text">REPLAN</span>
                <span className="node-sub-meta">New Action</span>
              </div>

              <div className="loop-connector-arrow">
                <ArrowRight size={13} />
              </div>

              <div className="loop-node-box node-success illuminated-green">
                <span className="node-badge-tag">07</span>
                <span className="node-name-text">SUCCESS</span>
                <span className="node-sub-meta">Verified Diff</span>
              </div>
            </div>

            {/* Active Live Terminal Execution Simulation Box */}
            <div className="hero-runtime-preview-terminal">
              <div className="terminal-header-line">
                <div className="terminal-dots">
                  <span className="t-dot red" />
                  <span className="t-dot yellow" />
                  <span className="t-dot green" />
                </div>
                <span className="terminal-filename">repopilot-agent // auth_service.py:42</span>
                <span className="terminal-status-chip">RECOVERED (0 REGRESSIONS)</span>
              </div>
              <pre className="terminal-code-body">
                <code>
                  <span className="c-dim">$ pytest tests/test_auth.py -v</span>{'\n'}
                  <span className="c-err">FAILED: KeyError: 'jwt_secret' in verify_token_payload()</span>{'\n'}
                  <span className="c-amber">⚡ REFLECTION: KeyError caught. Evaluating config.py fallback defaults.</span>{'\n'}
                  <span className="c-purple">→ ACTION: apply_diff("config.py", fallback_defaults)</span>{'\n'}
                  <span className="c-green">✓ SUCCESS: 5 passed in 0.18s. All test assertions green.</span>
                </code>
              </pre>
            </div>

            <div className="system-card-footer">
              <span className="footer-system-desc">
                Continuous feedback cycle: Autonomous tools self-correct upon tool exception or test failure.
              </span>
              <button
                type="button"
                className="system-interact-btn"
                onClick={onStartDebugging}
              >
                <span>Launch in AI Workspace</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          3. PINNED AGENT VISUAL SECTION (Continuous Pinned Scrolling Story)
          Text transforms on the left while Central Telemetry Canvas remains pinned
          ==================================================================== */}
      <section id="pinned-agent-story" className="cinematic-pinned-workflow-section">
        <div className="pinned-section-header">
          <span className="pinned-eyebrow">REASONING ARCHITECTURE</span>
          <h2 className="pinned-main-title">
            The Autonomous Loop, <span className="text-indigo-gradient">Pinned in Action.</span>
          </h2>
          <p className="pinned-subtitle">
            Scroll to follow the agent through each cognitive transformation—from AST ingestion
            to verified patch resolution.
          </p>
        </div>

        <div className="pinned-split-composition">
          {/* LEFT: Scrollable Stage Narratives */}
          <div className="pinned-narrative-col">
            {PINNED_WORKFLOW_STAGES.map((stage, idx) => {
              const isCurrent = pinnedActiveIndex === idx;
              return (
                <div
                  key={stage.id}
                  className={`narrative-stage-card ${isCurrent ? 'stage-card-active' : ''}`}
                  onClick={() => setPinnedActiveIndex(idx)}
                >
                  <div className="stage-card-left-rail">
                    <span className="stage-number-mono">{stage.number}</span>
                    <div className={`stage-active-pip ${isCurrent ? 'pip-lit' : ''}`} />
                  </div>

                  <div className="stage-card-content">
                    <div className="stage-header-row">
                      <h3 className="stage-action-title">{stage.title}</h3>
                      <span className={`stage-tagline-chip ${stage.visualMeta.accent}`}>
                        {stage.tagline}
                      </span>
                    </div>
                    <h4 className="stage-label-text">{stage.label}</h4>
                    <p className="stage-desc-copy">{stage.subtitle}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* RIGHT: Pinned Sticky Visual Canvas (Remains anchored in viewport) */}
          <div className="pinned-visual-anchor-col">
            <div className="sticky-pinned-telemetry-target">
              <div className="pinned-telemetry-canvas">
                {/* Canvas Top Bar */}
                <div className="canvas-header-bar">
                  <div className="canvas-header-left">
                    <span className={`canvas-status-dot ${activePinnedStage.visualMeta.accent}`} />
                    <span className="canvas-stage-badge">
                      STAGE {activePinnedStage.number}: {activePinnedStage.title}
                    </span>
                  </div>
                  <div className="canvas-header-right">
                    <span className="canvas-meta-chip">
                      {activePinnedStage.visualMeta.badge}
                    </span>
                  </div>
                </div>

                {/* Live Code / Telemetry Canvas */}
                <div className="canvas-code-viewport">
                  <div className="canvas-terminal-header">
                    <div className="terminal-dots-row">
                      <span className="dot red" />
                      <span className="dot yellow" />
                      <span className="dot green" />
                    </div>
                    <span className="terminal-filename-mono">
                      repopilot://agent_trace/{activePinnedStage.id}.log
                    </span>
                  </div>

                  <pre className="canvas-code-text">
                    <code>{activePinnedStage.codeSnippet}</code>
                  </pre>
                </div>

                {/* Canvas Footer Bar */}
                <div className="canvas-footer-bar">
                  <div className="canvas-footer-details">
                    <Activity size={14} className="footer-act-icon" />
                    <span className="footer-details-text">
                      {activePinnedStage.visualMeta.details}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="canvas-step-jump-btn"
                    onClick={onStartDebugging}
                  >
                    <span>Run step</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          4. THE FAILURE & RECOVERY SEQUENCE (Core Differentiator)
          USER TASK → PLAN → TOOL CALL → TOOL RESULT → FAILURE → REFLECTION → NEW PLAN → SUCCESS
          Tool fails ↓ Agent notices failure ↓ Agent reflects ↓ Agent changes strategy ↓ Agent selects another action ↓ Task succeeds
          ==================================================================== */}
      <section className="cinematic-failure-sequence-section">
        <div className="failure-sequence-container">
          <div className="failure-section-header-block">
            <span className="sequence-eyebrow accent-amber">THE AUTONOMOUS TURNING POINT</span>
            <h2 className="sequence-huge-headline">
              "THE FIRST PLAN CAN FAIL.<br />
              <span className="text-indigo-gradient">BUT THE AGENT DOESN'T STOP."</span>
            </h2>
            <p className="sequence-subtext">
              Real software bugs are messy. Tools timeout, dependencies break, and first hypotheses get falsified.
              Watch how RepoPilot catches the failure, reflects, pivots strategy, and reaches a verified solution.
            </p>

            {/* 8-Stage Flow Strip: USER TASK → PLAN → TOOL CALL → TOOL RESULT → FAILURE → REFLECTION → NEW PLAN → SUCCESS */}
            <div className="sequence-eight-stage-strip">
              {[
                { num: '01', title: 'USER TASK', type: 'task' },
                { num: '02', title: 'AGENT PLAN', type: 'plan' },
                { num: '03', title: 'TOOL CALL', type: 'tool' },
                { num: '04', title: 'TOOL RESULT', type: 'result' },
                { num: '05', title: 'FAILURE', type: 'fail', isError: true },
                { num: '06', title: 'REFLECTION', type: 'reflect', isRecovery: true },
                { num: '07', title: 'NEW PLAN', type: 'replan', isRecovery: true },
                { num: '08', title: 'SUCCESS', type: 'success', isSuccess: true }
              ].map((stage, sIdx) => (
                <React.Fragment key={stage.num}>
                  <div className={`eight-stage-node ${stage.isError ? 'node-error' : stage.isRecovery ? 'node-recovery' : stage.isSuccess ? 'node-success' : ''}`}>
                    <span className="node-num-pill">{stage.num}</span>
                    <span className="node-title-text">{stage.title}</span>
                  </div>
                  {sIdx < 7 && <div className="eight-stage-arrow"><ArrowRight size={11} /></div>}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* The 6-Step Failure/Recovery Turning Point Cards */}
          <div className="interactive-failure-recovery-card">
            <div className="recovery-lifecycle-nav">
              <span className="recovery-nav-label">FAILURE & RECOVERY PROGRESSION:</span>
              <div className="recovery-step-pills-row">
                {FAILURE_RECOVERY_LIFECYCLE_STEPS.map((item, idx) => {
                  const isActive = recoveryStepIndex === idx;
                  return (
                    <button
                      key={item.step}
                      type="button"
                      className={`recovery-nav-pill ${isActive ? 'active' : ''} badge-${item.badge}`}
                      onClick={() => setRecoveryStepIndex(idx)}
                    >
                      <span className="pill-step-num">0{item.step}</span>
                      <span className="pill-step-title">{item.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Recovery Stage Detail View */}
            <div className="recovery-stage-detail-body">
              <div className="recovery-stage-left">
                <div className="stage-badge-row">
                  <span className={`recovery-tag-pill ${FAILURE_RECOVERY_LIFECYCLE_STEPS[recoveryStepIndex].badge}`}>
                    {FAILURE_RECOVERY_LIFECYCLE_STEPS[recoveryStepIndex].tag}
                  </span>
                  <span className="stage-step-count">
                    Step {recoveryStepIndex + 1} of {FAILURE_RECOVERY_LIFECYCLE_STEPS.length}
                  </span>
                </div>
                <h3 className="recovery-stage-title">
                  {FAILURE_RECOVERY_LIFECYCLE_STEPS[recoveryStepIndex].title}
                </h3>
                <p className="recovery-stage-desc">
                  {FAILURE_RECOVERY_LIFECYCLE_STEPS[recoveryStepIndex].desc}
                </p>

                <div className="stage-step-navigation-btns">
                  <button
                    type="button"
                    className="step-nav-btn prev"
                    disabled={recoveryStepIndex === 0}
                    onClick={() => setRecoveryStepIndex(Math.max(0, recoveryStepIndex - 1))}
                  >
                    ← Previous Phase
                  </button>
                  <button
                    type="button"
                    className="step-nav-btn next"
                    disabled={recoveryStepIndex === FAILURE_RECOVERY_LIFECYCLE_STEPS.length - 1}
                    onClick={() =>
                      setRecoveryStepIndex(
                        Math.min(FAILURE_RECOVERY_LIFECYCLE_STEPS.length - 1, recoveryStepIndex + 1)
                      )
                    }
                  >
                    Next Phase →
                  </button>
                </div>
              </div>

              {/* Right Side: Live Terminal Telemetry Box */}
              <div className="recovery-stage-right">
                <div className="telemetry-box-header">
                  <div className="terminal-dots">
                    <span className="t-dot red" />
                    <span className="t-dot yellow" />
                    <span className="t-dot green" />
                  </div>
                  <span className="telemetry-box-title">
                    sandbox-telemetry // {FAILURE_RECOVERY_LIFECYCLE_STEPS[recoveryStepIndex].title.toLowerCase().replace(/\s+/g, '_')}.log
                  </span>
                </div>
                <pre className={`recovery-telemetry-code ${FAILURE_RECOVERY_LIFECYCLE_STEPS[recoveryStepIndex].badge}`}>
                  <code>{FAILURE_RECOVERY_LIFECYCLE_STEPS[recoveryStepIndex].telemetry}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          5. INTERACTIVE LIVE DEMO ("SEE IT WORK")
          Interactive in-page simulator with progressive step-by-step playback
          ==================================================================== */}
      <section id="interactive-demo-section" className="cinematic-interactive-demo-section">
        <div className="interactive-demo-container">
          <div className="demo-header-col">
            <span className="demo-eyebrow">LIVE SIMULATOR</span>
            <h2 className="demo-main-title">SEE IT WORK.</h2>
            <p className="demo-subtitle">
              Run an autonomous debugging trace right inside your browser. Watch the cognitive loop
              diagnose, fail, reflect, and verify.
            </p>
          </div>

          {/* Demo Controller Card */}
          <div className="interactive-demo-surface">
            {/* Top Bar: Target scenario details */}
            <div className="demo-surface-header">
              <div className="demo-target-info">
                <div className="demo-icon-wrap">
                  <Terminal size={16} />
                </div>
                <div>
                  <span className="demo-target-title">Target Scenario:</span>
                  <span className="demo-target-desc">Fix the broken authentication test</span>
                </div>
              </div>

              <div className="demo-controls-group">
                {demoStatus === 'idle' && (
                  <button
                    type="button"
                    className="demo-action-btn run-btn"
                    onClick={handleRunInteractiveDemo}
                  >
                    <Play size={14} />
                    <span>RUN DEMO</span>
                  </button>
                )}

                {demoStatus === 'running' && (
                  <div className="demo-running-indicator">
                    <RefreshCw size={14} className="spin-icon" />
                    <span>Investigating (Step {demoActiveStepIndex + 1}/9)...</span>
                  </div>
                )}

                {demoStatus === 'completed' && (
                  <div className="demo-completed-actions">
                    <button
                      type="button"
                      className="demo-action-btn repeat-btn"
                      onClick={handleRunInteractiveDemo}
                    >
                      <RotateCcw size={13} />
                      <span>Run again</span>
                    </button>
                    <button
                      type="button"
                      className="demo-action-btn reset-btn"
                      onClick={handleResetDemo}
                    >
                      <span>Reset</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="demo-progress-track">
              <div
                className="demo-progress-bar"
                style={{
                  width: `${demoVisibleSteps.length ? (demoVisibleSteps.length / 9) * 100 : 0}%`
                }}
              />
            </div>

            {/* Progressive Events Output Area */}
            <div className="demo-events-stream-viewport">
              {demoVisibleSteps.length === 0 ? (
                <div className="demo-empty-placeholder">
                  <Bot size={32} className="empty-bot-icon" />
                  <p className="placeholder-title">Ready to dispatch autonomous trace.</p>
                  <span className="placeholder-hint">
                    Click <strong>RUN DEMO</strong> above to watch RepoPilot execute tools, handle
                    exceptions, and synthesize the fix.
                  </span>
                </div>
              ) : (
                <div className="demo-steps-ladder">
                  {demoVisibleSteps.map((step) => (
                    <div
                      key={step.step}
                      className={`demo-step-row step-accent-${step.accent} animate-step-in`}
                    >
                      <div className="step-badge-col">
                        <span className="step-index-badge">{step.step}</span>
                        <span className="step-type-pill">{step.type}</span>
                      </div>

                      <div className="step-details-col">
                        <div className="step-top-line">
                          <h4 className="step-title-text">{step.title}</h4>
                          <span className="step-tag-pill">{step.tag}</span>
                        </div>
                        <p className="step-desc-text">{step.desc}</p>
                        <div className="step-output-box">
                          <code>{step.output}</code>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Bar: Action into Full Workspace */}
            <div className="demo-surface-footer">
              <span className="footer-prompt-hint">
                Need to debug your own repository? Connect your codebase in the full AI workspace.
              </span>
              <button
                type="button"
                className="footer-open-workspace-btn"
                onClick={onStartDebugging}
              >
                <span>Launch in AI Workspace</span>
                <ExternalLink size={13} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          6. STRONG FINAL CTA
          "READY TO LET IT INVESTIGATE?" + Action Buttons
          ==================================================================== */}
      <section className="cinematic-final-cta-section">
        <div className="final-cta-glow-mesh" />
        <div className="final-cta-inner">
          <span className="final-eyebrow">NO MORE PLAYING PUPPETEER</span>
          <h2 className="final-cta-headline">
            READY TO LET IT <span className="cta-indigo-gradient">INVESTIGATE?</span>
          </h2>
          <p className="final-cta-subtext">
            Connect your local repository or explore the interactive demo environment. Zero API keys
            required for mock exploration.
          </p>

          <div className="final-actions-group">
            <button
              type="button"
              className="cinematic-primary-btn final-big-btn"
              onClick={onStartDebugging}
            >
              <Terminal size={16} />
              <span>Start debugging</span>
              <ArrowRight size={16} />
            </button>

            <button
              type="button"
              className="cinematic-secondary-btn final-demo-btn"
              onClick={onViewDemo}
            >
              <Play size={15} />
              <span>Watch demo</span>
            </button>
          </div>

          <div className="final-reassurance-row">
            <span>✓ Deterministic Tool Verification</span>
            <span className="strip-dot">•</span>
            <span>✓ Full AST Semantic Call Graph</span>
            <span className="strip-dot">•</span>
            <span>✓ Zero Hallucinated Diffs</span>
          </div>
        </div>
      </section>

      {/* ====================================================================
          7. MINIMAL PROFESSIONAL DEVELOPER FOOTER
          ==================================================================== */}
      <footer className="cinematic-footer">
        <div className="footer-content-grid">
          <div className="footer-col-brand">
            <div className="footer-brand-title">
              <Bot size={18} />
              <span>RepoPilot</span>
            </div>
            <p className="footer-tagline">
              Autonomous software debugging agent. Build the brain, not the puppet.
            </p>
            <div className="footer-track-badge">
              <span>Track 2: Autonomous Problem-Solving Agent</span>
            </div>
          </div>

          <div className="footer-col-links">
            <span className="footer-col-heading">Product</span>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => document.getElementById('pinned-agent-story')?.scrollIntoView({ behavior: 'smooth' })}
            >
              How it works
            </button>
            <button
              type="button"
              onClick={() => document.getElementById('interactive-demo-section')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Interactive Demo
            </button>
            <button type="button" onClick={onStartDebugging}>
              Task Composer
            </button>
          </div>

          <div className="footer-col-links">
            <span className="footer-col-heading">Architecture</span>
            <button type="button" onClick={onOpenDocs}>
              Agent Loop Spec
            </button>
            <button type="button" onClick={onOpenDocs}>
              Failure Recovery
            </button>
            <button type="button" onClick={onOpenDocs}>
              Tool Registry
            </button>
            <button type="button" onClick={onOpenDocs}>
              Sandbox Runner
            </button>
          </div>

          <div className="footer-col-links">
            <span className="footer-col-heading">Session</span>
            <span className="footer-meta-pill">Environment: Local Sandbox</span>
            <span className="footer-meta-pill">Engine: OODA Loop v0.2</span>
            {isAuthenticated ? (
              <span className="footer-meta-pill">User: {user?.name}</span>
            ) : (
              <button type="button" onClick={onOpenLogin}>
                Sign In
              </button>
            )}
          </div>
        </div>

        <div className="footer-bottom-line">
          <span>&copy; 2026 RepoPilot Team (Person 1, Person 2, Person 3). All rights reserved.</span>
          <div className="footer-system-status">
            <span className="status-dot-green" />
            <span>All systems nominal</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
