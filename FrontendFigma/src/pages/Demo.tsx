import { useState, useEffect, useRef } from 'react';
import TiltCard from '../components/TiltCard';
import TechnicalSurface from '../components/TechnicalSurface';
import { ColorTheme } from '../components/AppleHeroPedestal';

type Phase = 'compose' | 'running' | 'complete';

interface TraceStep {
  id: number;
  icon: string;
  text: string;
  toolName?: string;
  query?: string;
  detail?: string;
  status: 'done' | 'active' | 'fail' | 'reason' | 'success';
  delay: number;
}

const TRACE: TraceStep[] = [
  {
    id: 0,
    icon: '✓',
    text: 'Plan synthesized',
    toolName: 'AGENT CORE',
    detail: '4 investigative phases planned with static symbol extraction',
    status: 'done',
    delay: 800,
  },
  {
    id: 1,
    icon: '✓',
    text: 'Search codebase',
    toolName: 'SEARCH CODEBASE',
    query: 'login',
    detail: '3 matches found in auth.py, routes.py, and test_auth.py',
    status: 'done',
    delay: 1600,
  },
  {
    id: 2,
    icon: '✓',
    text: 'Inspect auth.py',
    toolName: 'FILE READER',
    query: 'backend/auth.py',
    detail: 'Inspecting token claim validation in authenticate_user() [lines 45-82]',
    status: 'done',
    delay: 2400,
  },
  {
    id: 3,
    icon: '⚠',
    text: 'Shell test failed',
    toolName: 'SHELL',
    query: 'pytest tests/test_auth.py',
    detail: 'exit code 1 — AssertionError: 403 != 200 (Invalid token signature)',
    status: 'fail',
    delay: 3400,
  },
  {
    id: 4,
    icon: '↻',
    text: 'Replanning alternate strategy',
    toolName: 'REASONING ENGINE',
    detail: 'Failure diagnosed: Mock missing for JWT decode public key in test fixture',
    status: 'reason',
    delay: 4300,
  },
  {
    id: 5,
    icon: '✓',
    text: 'Inspect test fixture',
    toolName: 'FILE READER',
    query: 'tests/test_auth.py',
    detail: 'Found unmocked verify_jwt call in test_login_success()',
    status: 'done',
    delay: 5100,
  },
  {
    id: 6,
    icon: '✓',
    text: 'Apply targeted patch',
    toolName: 'FILE WRITER',
    detail: 'Injected monkeypatch for auth.decode_token fixture',
    status: 'done',
    delay: 5900,
  },
  {
    id: 7,
    icon: '✓',
    text: 'Re-run test suite',
    toolName: 'SHELL',
    query: 'pytest -v',
    detail: '12 / 12 test assertions passing cleanly in sandbox environment',
    status: 'done',
    delay: 6700,
  },
  {
    id: 8,
    icon: '✓',
    text: 'Verification confirmed',
    toolName: 'VERIFIER',
    detail: 'Regression resolved. Patch ready for review.',
    status: 'success',
    delay: 7500,
  },
];

const STATUS_COLOR: Record<TraceStep['status'], string> = {
  done: '#F5F5F7',
  active: '#287FEA',
  fail: '#FF453A',
  reason: '#BF5AF2',
  success: '#52D123',
};

/* ─────────────────────────────────────────────────────────
   Left Sidebar: Apple Dark Glass
───────────────────────────────────────────────────────── */
const NAV_ITEMS = [
  { icon: '⊕', label: 'New Task', id: 'new' },
  { icon: '⬡', label: 'Workspace', id: 'ws', active: true },
  { icon: '▶', label: 'Runs', id: 'runs' },
  { icon: '◇', label: 'Repositories', id: 'repos' },
  { icon: '⚙', label: 'Settings', id: 'set' },
];

function Sidebar({ onBack }: { onBack: () => void }) {
  const [activeId, setActiveId] = useState('ws');

  return (
    <aside
      className="hidden md:flex flex-col glass rounded-3xl mx-4 my-4 shrink-0 select-none border border-white/10"
      style={{ width: 210, padding: '20px 14px' }}
    >
      {/* Brand logo & back button */}
      <button
        type="button"
        data-hover
        onClick={onBack}
        className="flex items-center gap-2.5 px-3 py-2 mb-6 rounded-xl hover:bg-white/10 transition-colors cursor-pointer text-left"
        title="Return to Overview"
      >
        <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center shadow-md">
          <span className="text-black text-[10px] font-black mono">RP</span>
        </div>
        <div>
          <div className="font-bold text-white text-xs tracking-tight">RepoPilot</div>
          <div className="text-[9px] mono text-[#86868B]">← Overview</div>
        </div>
      </button>

      {/* Navigation Links */}
      <nav className="flex flex-col gap-1.5 flex-1">
        {NAV_ITEMS.map(item => {
          const isSelected = activeId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              data-hover
              onClick={() => setActiveId(item.id)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all duration-150 cursor-pointer ${
                isSelected
                  ? 'bg-white/15 text-white font-semibold shadow-inner'
                  : 'text-[#86868B] hover:text-white hover:bg-white/5 font-medium'
              }`}
            >
              <span className="text-sm">{item.icon}</span>
              <span className="text-xs">{item.label}</span>
              {isSelected && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />}
            </button>
          );
        })}
      </nav>

      {/* Environment Footnote */}
      <div className="px-3 pt-4 border-t border-white/10 flex items-center gap-2.5">
        <div className="w-2 h-2 rounded-full bg-[#52D123] shadow-[0_0_8px_#52D123]" />
        <div>
          <div className="text-xs font-bold text-white">Apple Sandbox</div>
          <div className="text-[9px] mono text-[#86868B]">daemon: active</div>
        </div>
      </div>
    </aside>
  );
}

/* ─────────────────────────────────────────────────────────
   Right Context Panel: Apple Telemetry
───────────────────────────────────────────────────────── */
function RunPanel({ phase }: { phase: Phase }) {
  const statusLabel = phase === 'compose' ? 'Ready' : phase === 'running' ? 'Investigating' : 'Verified';
  const statusColor = phase === 'compose' ? '#86868B' : phase === 'running' ? '#287FEA' : '#52D123';

  return (
    <aside className="hidden lg:block shrink-0 select-none my-4 mr-4" style={{ width: 230 }}>
      <div className="glass rounded-3xl p-5 space-y-4 border border-white/10">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <span className="mono text-[9px] font-bold tracking-widest text-[#86868B] uppercase">
            SESSION TELEMETRY
          </span>
          <span
            className="mono text-[9px] px-2 py-0.5 rounded-full font-bold uppercase"
            style={{
              backgroundColor: `${statusColor}20`,
              color: statusColor,
            }}
          >
            {statusLabel}
          </span>
        </div>

        {/* Grouped metrics */}
        <div className="space-y-3">
          {[
            { label: 'REPOSITORY', value: 'broken-login', mono: true },
            { label: 'BRANCH', value: 'main', mono: true },
            { label: 'STEPS', value: phase === 'complete' ? '10' : phase === 'running' ? 'Active...' : '—', mono: false },
            { label: 'DURATION', value: phase === 'complete' ? '00:08s' : phase === 'running' ? 'Running' : '—', mono: true },
            { label: 'TOOLS', value: 'File Reader, Shell', mono: false },
            { label: 'RECOVERY', value: phase === 'complete' ? '2 attempts' : '—', mono: false },
          ].map(r => (
            <div key={r.label}>
              <div className="mono text-[9px] tracking-widest text-[#86868B] font-semibold mb-0.5">
                {r.label}
              </div>
              <div className={`text-xs font-semibold text-white ${r.mono ? 'mono' : ''}`}>
                {r.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mini Cognitive Loop Status Indicator */}
      {phase === 'running' && (
        <div className="glass rounded-3xl p-4 mt-3 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="mono text-[9px] font-bold tracking-widest text-[#86868B] uppercase">
              COGNITIVE ENGINE
            </span>
            <span className="status-dot bg-[#287FEA] animate-node-pulse" />
          </div>

          <svg viewBox="0 0 140 100" className="w-full" aria-hidden="true">
            <defs>
              <path id="mini-path" d="M 20,50 A 50,22 0 1,1 120,50 A 50,22 0 1,1 20,50" fill="none" />
            </defs>
            <ellipse cx="70" cy="50" rx="50" ry="22" stroke="#287FEA" strokeWidth="0.8" fill="none" strokeDasharray="3 6" opacity="0.6" />
            <ellipse cx="70" cy="50" rx="42" ry="18" transform="rotate(45,70,50)" stroke="#52D123" strokeWidth="0.8" fill="none" strokeDasharray="3 6" opacity="0.5" />
            <circle cx="70" cy="50" r="5" fill="#287FEA" />
            <circle r="3.5" fill="#FFFFFF">
              <animateMotion dur="4s" repeatCount="indefinite">
                <mpath href="#mini-path" />
              </animateMotion>
            </circle>
          </svg>
          <div className="mono text-[9px] text-center text-[#86868B] mt-1 font-medium">
            reasoning loop active
          </div>
        </div>
      )}
    </aside>
  );
}

/* ─────────────────────────────────────────────────────────
   Composer View
───────────────────────────────────────────────────────── */
function ComposeView({ onRun }: { onRun: () => void }) {
  const [text, setText] = useState(
    'Authentication tests are failing after the latest merge. The login() function returns 403 even with valid credentials in tests/test_auth.py.'
  );

  return (
    <div className="flex-1 flex flex-col justify-center py-6 px-2">
      <div className="max-w-2xl mx-auto w-full">
        {/* Dominant Headline */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 mono text-[10px] text-[#86868B] uppercase tracking-wider font-semibold mb-2">
            <span className="status-dot bg-[#52D123]" />
            Investigation Prompt
          </div>
          <h1
            className="font-extrabold text-white tracking-tight mb-2"
            style={{ fontSize: 'clamp(28px, 3.8vw, 42px)' }}
          >
            What should RepoPilot investigate?
          </h1>
          <p className="text-[#86868B] text-sm">
            Describe a bug, failing test, exception, or unexpected behavior.
          </p>
        </div>

        {/* Tactile Composer Glass Card */}
        <TiltCard variant="elevated" className="rounded-3xl p-7 mb-5 border border-white/10 shadow-2xl">
          <textarea
            className="w-full bg-transparent resize-none text-white text-sm leading-relaxed outline-none placeholder-[#515154] font-normal"
            style={{ minHeight: 120 }}
            placeholder="Describe the bug or paste the failing stack trace..."
            value={text}
            onChange={e => setText(e.target.value)}
          />

          <div className="border-t border-white/10 pt-5 mt-3">
            {/* Repo & Branch */}
            <div className="flex gap-4 mb-5 flex-wrap">
              <div className="flex-1 min-w-[140px]">
                <label className="mono text-[9px] tracking-widest text-[#86868B] block mb-1.5 font-semibold">
                  REPOSITORY
                </label>
                <div className="bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="text-[#86868B] text-xs">⎇</span>
                    <span className="text-xs font-semibold text-white">broken-login</span>
                  </div>
                  <span className="text-[#86868B] text-xs">▾</span>
                </div>
              </div>

              <div className="flex-1 min-w-[140px]">
                <label className="mono text-[9px] tracking-widest text-[#86868B] block mb-1.5 font-semibold">
                  BRANCH
                </label>
                <div className="bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="text-[#52D123] text-xs">●</span>
                    <span className="text-xs font-semibold text-white">main</span>
                  </div>
                  <span className="text-[#86868B] text-xs">▾</span>
                </div>
              </div>
            </div>

            {/* Run Agent CTA */}
            <button
              type="button"
              data-hover
              onClick={onRun}
              className="w-full bg-white text-black rounded-2xl py-3.5 font-bold text-sm flex items-center justify-center gap-2 hover:bg-white/90 hover:scale-[1.01] transition-all duration-200 cursor-pointer shadow-xl"
            >
              Run Agent →
            </button>
          </div>
        </TiltCard>

        {/* Quick Action Presets */}
        <div className="flex flex-wrap gap-2">
          {['Debug an Error', 'Run Tests', 'Investigate API', 'Explain Code'].map(a => (
            <button
              key={a}
              type="button"
              data-hover
              onClick={() => {
                setText(`Execute automated ${a.toLowerCase()} on the active repository workspace.`);
              }}
              className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-3.5 py-2 text-xs font-medium text-[#86868B] hover:text-white transition-all duration-150 cursor-pointer"
            >
              {a}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Running State View
───────────────────────────────────────────────────────── */
function RunningView({ steps, currentStep }: { steps: TraceStep[]; currentStep: number }) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const traceEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    traceEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [steps.length]);

  const activeStep = TRACE[Math.min(currentStep, TRACE.length - 1)];

  return (
    <div className="flex-1 flex flex-col py-6 px-2 gap-5 max-w-3xl mx-auto w-full">
      {/* Active Banner */}
      <div className="glass-elevated rounded-3xl p-6 border border-white/10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="status-dot bg-[#287FEA] animate-node-pulse" />
              <span className="mono text-[10px] tracking-widest text-[#86868B] font-bold uppercase">
                INVESTIGATING
              </span>
            </div>
            <h2 className="font-extrabold text-white text-2xl tracking-tight">
              RepoPilot is investigating…
            </h2>
            <p className="text-[#86868B] text-xs mt-1">
              Inspecting authentication flow & synthesizing fix
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-right shrink-0 border-l-2 border-[#287FEA]">
            <div className="mono text-[9px] tracking-widest text-[#86868B] font-bold uppercase mb-0.5">
              CURRENT TOOL
            </div>
            <div className="text-xs font-bold text-white mono">
              {activeStep?.toolName || 'AGENT CORE'}
            </div>
            {activeStep?.query && (
              <div className="mono text-[9px] text-[#287FEA] mt-0.5">
                target: {activeStep.query}
              </div>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-5">
          <div className="flex justify-between text-[10px] text-[#86868B] mono mb-1.5">
            <span>Execution Sequence</span>
            <span className="font-bold text-white">
              {steps.length} / {TRACE.length} steps completed
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#287FEA] transition-all duration-500 shadow-[0_0_10px_#287FEA]"
              style={{ width: `${(steps.length / TRACE.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Agent Trace */}
      <div className="glass rounded-3xl flex-1 flex flex-col overflow-hidden border border-white/10">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <span className="mono text-[10px] font-bold tracking-widest text-[#86868B] uppercase">
            AGENT TRACE LOG
          </span>
          <span className="text-xs text-[#86868B]">Click any step to inspect technical details</span>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3 max-h-[380px]">
          {steps.map((step, idx) => {
            const isExpanded = expandedId === step.id;
            const isLatest = idx === steps.length - 1;

            return (
              <div
                key={step.id}
                className="relative pl-7"
                style={{ animation: 'step-in 0.3s ease both' }}
              >
                {idx < steps.length - 1 && (
                  <div className="absolute left-2.5 top-6 bottom-0 w-px bg-white/10" />
                )}

                <div
                  className="absolute left-0 top-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                  style={{
                    backgroundColor: `${STATUS_COLOR[step.status]}20`,
                    color: STATUS_COLOR[step.status],
                  }}
                >
                  {step.icon}
                </div>

                <div
                  onClick={() => setExpandedId(isExpanded ? null : step.id)}
                  className={`group rounded-xl p-2.5 transition-all cursor-pointer ${
                    isLatest ? 'bg-white/10 shadow-xs' : 'hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="text-xs font-semibold"
                      style={{ color: STATUS_COLOR[step.status] }}
                    >
                      {step.text}
                    </span>
                    {step.toolName && (
                      <span className="mono text-[9px] text-[#86868B] group-hover:text-white transition-colors">
                        [{step.toolName}]
                      </span>
                    )}
                  </div>

                  {step.detail && !isExpanded && (
                    <div className="mono text-[10px] text-[#86868B] mt-0.5 truncate max-w-lg">
                      {step.detail}
                    </div>
                  )}

                  {isExpanded && step.detail && (
                    <div className="mt-2 p-3 rounded-xl bg-[#000000] text-white/90 mono text-[10px] leading-relaxed shadow-md border border-white/10">
                      <div className="text-[#86868B] mb-1">TELEMETRY DETAIL:</div>
                      <div>{step.detail}</div>
                      {step.query && (
                        <div className="mt-1.5 pt-1.5 border-t border-white/10 text-[#287FEA]">
                          cmd/target: {step.query}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={traceEndRef} />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Complete Result View
───────────────────────────────────────────────────────── */
function CompleteView({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex-1 flex flex-col py-6 px-2 gap-5 max-w-3xl mx-auto w-full">
      {/* Verified Hero Card */}
      <TechnicalSurface
        title="VERIFICATION_REPORT"
        badge="VERIFIED"
        badgeColor="#52D123"
        className="p-8 border border-white/10"
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="status-dot bg-[#52D123] animate-node-pulse" />
          <span className="mono text-[10px] tracking-widest text-[#52D123] font-bold uppercase">
            EMPIRICAL CONFIRMATION
          </span>
        </div>

        <h1
          className="font-extrabold text-white tracking-tight mb-3"
          style={{ fontSize: 'clamp(34px, 4.5vw, 52px)' }}
        >
          Verified.
        </h1>

        <p className="text-[#86868B] text-xs max-w-md leading-relaxed mb-6">
          RepoPilot identified the regression, synthesized an alternate mock fixture via
          adaptive reflection, and proved resolution by passing 100% of test assertions.
        </p>

        <div className="flex flex-wrap gap-3">
          {['Problem identified', 'Fix applied', 'Verification passed'].map(item => (
            <div
              key={item}
              className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3.5 py-1.5"
            >
              <span className="text-[#52D123] text-xs font-bold">✓</span>
              <span className="text-white/90 text-xs font-medium">{item}</span>
            </div>
          ))}
        </div>
      </TechnicalSurface>

      {/* Test Execution Summary */}
      <div className="glass-elevated rounded-3xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-2">
          <span className="mono text-[10px] font-bold tracking-widest text-[#52D123] uppercase">
            TEST EXECUTION RESULT
          </span>
          <span className="mono text-sm font-bold text-[#52D123]">12 / 12 PASSING</span>
        </div>

        <div className="h-2 rounded-full bg-white/10 overflow-hidden mb-6">
          <div className="h-full rounded-full bg-[#52D123] w-full shadow-[0_0_10px_#52D123]" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-6 border-b border-white/10">
          {[
            { label: 'Duration', value: '00:08s', mono: true },
            { label: 'Steps', value: '10 run', mono: false },
            { label: 'Tools Used', value: '2 tools', mono: false },
            { label: 'Recovery', value: '2 attempts', mono: false },
          ].map(s => (
            <div key={s.label}>
              <div className="mono text-[9px] tracking-widest text-[#86868B] font-semibold mb-1">
                {s.label.toUpperCase()}
              </div>
              <div className={`font-bold text-sm text-white ${s.mono ? 'mono' : ''}`}>
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {/* Quick action buttons */}
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            data-hover
            onClick={onReset}
            className="bg-white text-black rounded-xl px-5 py-2.5 text-xs font-bold flex items-center gap-2 hover:bg-white/90 transition-all cursor-pointer shadow-lg"
          >
            Start New Investigation →
          </button>
          <button
            type="button"
            data-hover
            className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-5 py-2.5 text-xs font-semibold text-white transition-all cursor-pointer"
          >
            View Diff Patch
          </button>
          <button
            type="button"
            data-hover
            className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-5 py-2.5 text-xs font-semibold text-white transition-all cursor-pointer"
          >
            View Trace JSON
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Main Export: Demo
───────────────────────────────────────────────────────── */
export default function Demo({
  onBack,
}: {
  onBack: () => void;
  mouseX?: number;
  mouseY?: number;
  activeColor?: ColorTheme;
}) {
  const [phase, setPhase] = useState<Phase>('compose');
  const [visibleSteps, setVisibleSteps] = useState<TraceStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startRun = () => {
    setPhase('running');
    setVisibleSteps([]);
    setCurrentStep(0);
  };

  useEffect(() => {
    if (phase !== 'running') return;

    TRACE.forEach(step => {
      timerRef.current = setTimeout(() => {
        setVisibleSteps(prev => [...prev, step]);
        setCurrentStep(step.id + 1);
        if (step.id === TRACE.length - 1) {
          setTimeout(() => setPhase('complete'), 800);
        }
      }, step.delay);
    });

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [phase]);

  const reset = () => {
    setPhase('compose');
    setVisibleSteps([]);
    setCurrentStep(0);
  };

  return (
    <div className="min-h-screen flex text-[#F5F5F7]">
      {/* Left Sidebar */}
      <Sidebar onBack={onBack} />

      {/* Dominant Center Workspace */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-8 py-4 border-b border-white/10 bg-[#000000]/60 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-4">
            <button
              type="button"
              data-hover
              onClick={onBack}
              className="text-[#86868B] hover:text-white text-xs mono tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer font-semibold"
            >
              ← Overview
            </button>
            <div className="h-4 w-px bg-white/10" />
            <span className="text-xs font-bold text-white tracking-tight uppercase mono">
              Workspace / broken-login
            </span>
          </div>

          <div className="flex items-center gap-2">
            {phase === 'running' && (
              <div className="flex items-center gap-2 bg-[#287FEA]/15 border border-[#287FEA]/30 rounded-full px-3 py-1">
                <span className="status-dot bg-[#287FEA] animate-node-pulse" />
                <span className="mono text-[10px] tracking-widest text-[#287FEA] font-bold">
                  ACTIVE
                </span>
              </div>
            )}
            {phase === 'complete' && (
              <div className="flex items-center gap-2 bg-[#52D123]/15 border border-[#52D123]/30 rounded-full px-3 py-1">
                <span className="status-dot bg-[#52D123]" />
                <span className="mono text-[10px] tracking-widest text-[#52D123] font-bold">
                  VERIFIED
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Workspace Content + Right Context */}
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 flex flex-col overflow-y-auto px-4 md:px-8">
            {phase === 'compose' && <ComposeView onRun={startRun} />}
            {phase === 'running' && (
              <RunningView steps={visibleSteps} currentStep={currentStep} />
            )}
            {phase === 'complete' && <CompleteView onReset={reset} />}
          </div>

          <RunPanel phase={phase} />
        </div>
      </main>
    </div>
  );
}
