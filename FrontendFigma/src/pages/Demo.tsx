import { useState, useEffect, useRef } from 'react';
import TiltCard from '../components/TiltCard';
import TechnicalSurface from '../components/TechnicalSurface';
import { ColorTheme } from '../components/AppleHeroPedestal';
import { runAgentTask, BackendEvent } from '../services/api';

type Phase = 'compose' | 'running' | 'complete';

interface TraceStep {
  id: number;
  icon: string;
  text: string;
  toolName?: string;
  query?: string;
  detail?: string;
  status: 'done' | 'active' | 'fail' | 'reason' | 'success';
}

interface RunTelemetry {
  status: 'completed' | 'failed';
  finalAnswer: string;
  eventsCount: number;
  durationSeconds: number;
  toolsUsed: string[];
  recoveryAttempts: number;
  rawEvents: BackendEvent[];
}

const STATUS_COLOR: Record<TraceStep['status'], string> = {
  done: '#F5F5F7',
  active: '#287FEA',
  fail: '#FF453A',
  reason: '#BF5AF2',
  success: '#52D123',
};

/**
 * Maps real backend events into the visual TraceStep format used by Figma UI.
 */
function mapBackendEventsToTraceSteps(events: BackendEvent[]): TraceStep[] {
  return events.map((evt, idx) => {
    const eventType = (evt.type || '').toLowerCase();

    // 1. Plan created by AgentCore
    if (eventType === 'plan') {
      return {
        id: idx,
        icon: '✓',
        text: 'Plan synthesized',
        toolName: 'AGENT CORE',
        detail: evt.message || 'Execution strategy synthesized',
        status: 'done',
      };
    }

    // 2. Tool invocation initiated by AgentCore
    if (eventType === 'tool_call') {
      const toolName = evt.tool ? evt.tool.toUpperCase() : 'TOOL';
      let argsString = '';
      if (evt.arguments) {
        if (typeof evt.arguments === 'object') {
          try {
            argsString = JSON.stringify(evt.arguments);
          } catch {
            argsString = String(evt.arguments);
          }
        } else {
          argsString = String(evt.arguments);
        }
      }

      return {
        id: idx,
        icon: '▶',
        text: `Executing ${evt.tool || 'tool'}`,
        toolName,
        query: argsString ? argsString.slice(0, 120) : undefined,
        detail: evt.thought || evt.message || (argsString ? `Arguments: ${argsString}` : undefined),
        status: 'active',
      };
    }

    // 3. Tool result returned
    if (eventType === 'tool_result') {
      const isErr = evt.status === 'error' || Boolean(evt.error);
      const toolName = evt.tool ? evt.tool.toUpperCase() : 'TOOL';
      const detailContent = isErr
        ? (evt.error || evt.data || evt.message || 'Tool encountered an error.')
        : (evt.data || evt.message || 'Tool executed successfully.');

      return {
        id: idx,
        icon: isErr ? '⚠' : '✓',
        text: isErr ? `${toolName} execution error` : `${toolName} completed`,
        toolName,
        detail: detailContent,
        status: isErr ? 'fail' : 'done',
      };
    }

    // 4. Reflection / reasoning step
    if (eventType === 'reflection') {
      return {
        id: idx,
        icon: '↻',
        text: 'Replanning alternate strategy',
        toolName: 'REASONING ENGINE',
        detail: evt.message || 'Adaptive reflection incorporated into reasoning loop.',
        status: 'reason',
      };
    }

    // 5. Final completion step
    if (eventType === 'final') {
      return {
        id: idx,
        icon: '✓',
        text: 'Verification confirmed',
        toolName: 'VERIFIER',
        detail: evt.summary || evt.message || 'Task completed.',
        status: 'success',
      };
    }

    // 6. Explicit failure event
    if (eventType === 'error') {
      return {
        id: idx,
        icon: '✕',
        text: 'Execution failed',
        toolName: 'AGENT CORE',
        detail: evt.message || evt.error || 'Encountered execution error.',
        status: 'fail',
      };
    }

    // Fallback for any unexpected backend event type
    return {
      id: idx,
      icon: evt.status === 'error' ? '⚠' : '✓',
      text: evt.message || `Step ${evt.step || idx + 1}`,
      toolName: (evt.tool || 'AGENT').toUpperCase(),
      detail: evt.detail || evt.message || evt.data,
      status: evt.status === 'error' ? 'fail' : 'done',
    };
  });
}

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
          <div className="text-[9px] mono text-[#86868B]">backend: connected</div>
        </div>
      </div>
    </aside>
  );
}

/* ─────────────────────────────────────────────────────────
   Right Context Panel: Apple Telemetry
───────────────────────────────────────────────────────── */
function RunPanel({
  phase,
  telemetry,
}: {
  phase: Phase;
  telemetry: RunTelemetry | null;
}) {
  const isComplete = phase === 'complete';
  const isRunning = phase === 'running';
  const isSuccess = telemetry?.status === 'completed';

  const statusLabel =
    phase === 'compose'
      ? 'Ready'
      : isRunning
      ? 'Investigating'
      : isSuccess
      ? 'Verified'
      : 'Failed';

  const statusColor =
    phase === 'compose'
      ? '#86868B'
      : isRunning
      ? '#287FEA'
      : isSuccess
      ? '#52D123'
      : '#FF453A';

  const stepsDisplay = isComplete
    ? `${telemetry?.eventsCount ?? 0} events`
    : isRunning
    ? 'Active...'
    : '—';

  const durationDisplay = isComplete
    ? `${telemetry?.durationSeconds ?? 0}s`
    : isRunning
    ? 'Running'
    : '—';

  const toolsDisplay = isComplete
    ? (telemetry?.toolsUsed.length ? telemetry.toolsUsed.join(', ') : 'Agent Core')
    : isRunning
    ? 'Active'
    : '—';

  const recoveryDisplay = isComplete
    ? `${telemetry?.recoveryAttempts ?? 0} attempts`
    : isRunning
    ? 'Monitoring'
    : '—';

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
            { label: 'REPOSITORY', value: 'RepoPilot (Workspace)', mono: false },
            { label: 'BRANCH', value: 'main', mono: true },
            { label: 'EVENTS', value: stepsDisplay, mono: false },
            { label: 'DURATION', value: durationDisplay, mono: true },
            { label: 'TOOLS', value: toolsDisplay, mono: false },
            { label: 'RECOVERY', value: recoveryDisplay, mono: false },
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

const VERIFIED_PRESETS = [
  {
    label: '🔐 Fix 403 Auth Bug',
    badge: 'SECURITY',
    badgeColor: '#FF3B30',
    desc: 'Diagnoses 403 Forbidden login failure in tests/test_auth.py, patches auth.py, and verifies',
    task: "In demo/projects/broken-login/auth.py, the login() function returns 403 Forbidden in tests/test_auth.py because user['status'] is compared with 'ACTIVE' instead of 'active'. Fix line 51 in auth.py using shell_tool and verify with pytest tests/test_auth.py.",
  },


  {
    label: '🔍 Diagnose & Fix Bug',
    badge: 'REAL BUG',
    badgeColor: '#FF9500',
    desc: 'Reproduces pytest failure in broken-python, inspects calc.py, and provides the exact code fix',

    task: 'Run pytest on demo/projects/broken-python/tests/test_calc.py using shell_tool. When test_calculate_discount fails, inspect demo/projects/broken-python/calc.py using file_tool, diagnose the root cause of why it returns 81.0 instead of 80.0, and provide the exact code fix.',
  },
  {
    label: '🧪 Run Unit Tests',
    badge: '10/10 PASS',
    badgeColor: '#52D123',
    desc: 'Runs test_agent.py and verifies 100% test assertions pass',
    task: 'Run python -m pytest tests/test_agent.py using shell_tool and verify that all 10 unit tests pass.',
  },
  {
    label: '📖 Inspect Architecture',
    badge: 'DOCS',
    badgeColor: '#287FEA',
    desc: 'Reads README.md and summarizes AgentCore tools & cognitive loop',
    task: "Read README.md using file_tool and summarize RepoPilot's architecture and available tools.",
  },
  {
    label: '⚡ Inspect Backend API',
    badge: 'FASTAPI',
    badgeColor: '#BF5AF2',
    desc: 'Inspects main.py and routes.py and explains all API endpoints',
    task: 'Inspect backend/main.py and backend/api/routes.py using file_tool and explain the available endpoints.',
  },
  {
    label: '✍️ Custom Task (Clear Box)',
    badge: 'CUSTOM',
    badgeColor: '#86868B',
    desc: 'Clear input box to type any custom prompt for your repository',
    task: '',
  },
];


/* ─────────────────────────────────────────────────────────
   Composer View
───────────────────────────────────────────────────────── */
function ComposeView({
  text,
  onTextChange,
  onRun,
  errorMessage,
  onClearError,
}: {
  text: string;
  onTextChange: (val: string) => void;
  onRun: () => void;
  errorMessage: string | null;
  onClearError: () => void;
}) {
  return (
    <div className="flex-1 flex flex-col justify-center py-6 px-2">
      <div className="max-w-2xl mx-auto w-full">
        {/* Dominant Headline */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="inline-flex items-center gap-2 mono text-[10px] text-[#86868B] uppercase tracking-wider font-semibold">
              <span className="status-dot bg-[#52D123]" />
              Investigation Prompt
            </div>
            {text && (
              <button
                type="button"
                data-hover
                onClick={() => onTextChange('')}
                className="text-xs text-[#86868B] hover:text-[#FF453A] mono transition-colors cursor-pointer flex items-center gap-1 px-2 py-0.5 rounded-lg hover:bg-white/5"
                title="Clear input to write your own custom task"
              >
                <span>✕</span> Clear for Custom Task
              </button>
            )}
          </div>
          <h1
            className="font-extrabold text-white tracking-tight mb-2"
            style={{ fontSize: 'clamp(28px, 3.8vw, 42px)' }}
          >
            What should RepoPilot investigate?
          </h1>
          <p className="text-[#86868B] text-sm">
            Type any custom debugging task below, or choose a verified passing task preset.
          </p>
        </div>

        {/* Error Notification Banner */}
        {errorMessage && (
          <div className="mb-5 p-4 rounded-2xl bg-[#FF453A]/15 border border-[#FF453A]/30 text-white flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-[#FF453A] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              ✕
            </div>
            <div className="flex-1 text-xs">
              <div className="font-semibold text-[#FF453A] mb-0.5">Execution / Backend Error</div>
              <div className="text-white/90 leading-relaxed font-mono text-[11px]">{errorMessage}</div>
            </div>
            <button
              type="button"
              onClick={onClearError}
              className="text-white/60 hover:text-white text-xs cursor-pointer px-1"
              title="Dismiss error"
            >
              ✕
            </button>
          </div>
        )}

        {/* Tactile Composer Glass Card */}
        <TiltCard variant="elevated" className="rounded-3xl p-7 mb-5 border border-white/10 shadow-2xl">
          <textarea
            className="w-full bg-transparent resize-none text-white text-sm leading-relaxed outline-none placeholder-[#515154] font-normal"
            style={{ minHeight: 120 }}
            placeholder="Describe any custom bug, failing test, or question about this repository..."
            value={text}
            onChange={e => onTextChange(e.target.value)}
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
                    <span className="text-xs font-semibold text-white">RepoPilot (Workspace)</span>
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
        <div className="mt-5">
          <div className="flex items-center justify-between mono text-[10px] tracking-widest text-[#86868B] font-bold uppercase mb-2.5">
            <span>Verified Task Presets</span>
            <span className="text-white/40 normal-case font-normal text-[11px]">Click any preset to load</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {VERIFIED_PRESETS.map(a => {
              const isSelected = a.task !== '' && text === a.task;
              return (
                <button
                  key={a.label}
                  type="button"
                  data-hover
                  onClick={() => onTextChange(a.task)}
                  className={`p-3.5 rounded-2xl border text-left transition-all duration-150 cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-white/15 border-white/40 shadow-lg'
                      : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-bold text-white tracking-tight">
                      {a.label}
                    </span>
                    <span
                      className="mono text-[9px] px-2 py-0.5 rounded-full font-bold uppercase shrink-0"
                      style={{
                        backgroundColor: `${a.badgeColor}20`,
                        color: a.badgeColor,
                      }}
                    >
                      {a.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#86868B] line-clamp-1 mono">
                    {a.desc}
                  </p>
                </button>
              );
            })}
          </div>
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

  const activeStep = steps.length > 0 ? steps[steps.length - 1] : undefined;

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
              Autonomous reasoning loop in progress
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
              <div className="mono text-[9px] text-[#287FEA] mt-0.5 max-w-[180px] truncate">
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
              {steps.length} {steps.length === 1 ? 'event' : 'events'} recorded
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#287FEA] transition-all duration-500 shadow-[0_0_10px_#287FEA] animate-pulse"
              style={{ width: `${Math.min(100, Math.max(15, steps.length * 15))}%` }}
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
                      <div className="whitespace-pre-wrap">{step.detail}</div>
                      {step.query && (
                        <div className="mt-1.5 pt-1.5 border-t border-white/10 text-[#287FEA] break-all">
                          cmd/args: {step.query}
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
function CompleteView({
  onReset,
  telemetry,
}: {
  onReset: () => void;
  telemetry: RunTelemetry | null;
}) {
  const [showJson, setShowJson] = useState(false);
  const [showDiff, setShowDiff] = useState(false);

  const isSuccess = telemetry?.status === 'completed';
  const statusColor = isSuccess ? '#52D123' : '#FF453A';
  const badgeLabel = isSuccess ? 'VERIFIED' : 'FAILED';
  const headline = isSuccess ? 'Verified.' : 'Execution Completed.';

  // Check if any tool result contains diff or file modification data
  const diffEvent = telemetry?.rawEvents?.find(
    e =>
      e.tool === 'apply_diff' ||
      (typeof e.data === 'string' && (e.data.includes('diff --git') || e.data.includes('@@ ')))
  );
  const diffContent = diffEvent ? (diffEvent.data || diffEvent.message) : null;

  return (
    <div className="flex-1 flex flex-col py-6 px-2 gap-5 max-w-3xl mx-auto w-full">
      {/* Verified Hero Card */}
      <TechnicalSurface
        title="VERIFICATION_REPORT"
        badge={badgeLabel}
        badgeColor={statusColor}
        className="p-8 border border-white/10"
      >
        <div className="flex items-center gap-2 mb-3">
          <span
            className="status-dot animate-node-pulse"
            style={{ backgroundColor: statusColor }}
          />
          <span
            className="mono text-[10px] tracking-widest font-bold uppercase"
            style={{ color: statusColor }}
          >
            {isSuccess ? 'EMPIRICAL CONFIRMATION' : 'EXECUTION SUMMARY'}
          </span>
        </div>

        <h1
          className="font-extrabold text-white tracking-tight mb-3"
          style={{ fontSize: 'clamp(34px, 4.5vw, 52px)' }}
        >
          {headline}
        </h1>

        <div className="text-[#86868B] text-xs max-w-2xl leading-relaxed mb-6 font-mono whitespace-pre-wrap bg-white/5 p-4 rounded-xl border border-white/10">
          {telemetry?.finalAnswer || 'Task completed without final answer text.'}
        </div>

        <div className="flex flex-wrap gap-3">
          {[
            { label: isSuccess ? 'Task goal satisfied' : 'Task goal incomplete', ok: isSuccess },
            { label: `${telemetry?.eventsCount ?? 0} events executed`, ok: true },
            { label: `${telemetry?.toolsUsed.length ?? 0} tools engaged`, ok: true },
          ].map(item => (
            <div
              key={item.label}
              className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3.5 py-1.5"
            >
              <span className={`text-xs font-bold ${item.ok ? 'text-[#52D123]' : 'text-[#FF453A]'}`}>
                {item.ok ? '✓' : '✕'}
              </span>
              <span className="text-white/90 text-xs font-medium">{item.label}</span>
            </div>
          ))}
        </div>
      </TechnicalSurface>

      {/* Test Execution Summary */}
      <div className="glass-elevated rounded-3xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-2">
          <span
            className="mono text-[10px] font-bold tracking-widest uppercase"
            style={{ color: statusColor }}
          >
            AGENT EXECUTION RESULT
          </span>
          <span
            className="mono text-sm font-bold uppercase"
            style={{ color: statusColor }}
          >
            {isSuccess ? 'STATUS: COMPLETED' : 'STATUS: FAILED'}
          </span>
        </div>

        <div className="h-2 rounded-full bg-white/10 overflow-hidden mb-6">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: '100%',
              backgroundColor: statusColor,
              boxShadow: `0 0 10px ${statusColor}`,
            }}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-6 border-b border-white/10">
          {[
            { label: 'Duration', value: `${telemetry?.durationSeconds ?? 0}s`, mono: true },
            { label: 'Events Run', value: `${telemetry?.eventsCount ?? 0} events`, mono: false },
            { label: 'Tools Used', value: telemetry?.toolsUsed.length ? `${telemetry.toolsUsed.length} tools` : 'None', mono: false },
            { label: 'Recovery', value: `${telemetry?.recoveryAttempts ?? 0} attempts`, mono: false },
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
            onClick={() => setShowDiff(prev => !prev)}
            className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-5 py-2.5 text-xs font-semibold text-white transition-all cursor-pointer"
          >
            {showDiff ? 'Hide Diff Patch' : 'View Diff Patch'}
          </button>
          <button
            type="button"
            data-hover
            onClick={() => setShowJson(prev => !prev)}
            className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-5 py-2.5 text-xs font-semibold text-white transition-all cursor-pointer"
          >
            {showJson ? 'Hide Trace JSON' : 'View Trace JSON'}
          </button>
        </div>

        {/* Expandable Diff view */}
        {showDiff && (
          <div className="mt-4 p-4 rounded-2xl bg-black border border-white/10 text-xs mono overflow-x-auto text-[#86868B] max-h-60">
            {diffContent ? (
              <pre className="text-white/90 whitespace-pre-wrap">{diffContent}</pre>
            ) : (
              <div className="text-[#86868B]">No git diff patch recorded in this task execution.</div>
            )}
          </div>
        )}

        {/* Expandable JSON view */}
        {showJson && (
          <div className="mt-4 p-4 rounded-2xl bg-black border border-white/10 text-xs mono overflow-x-auto text-[#86868B] max-h-72">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <span className="mono text-[10px] text-white font-bold">RAW EXECUTION EVENTS JSON</span>
              <span className="text-[10px] text-[#86868B]">{telemetry?.rawEvents.length || 0} events</span>
            </div>
            <pre className="text-[#52D123] whitespace-pre-wrap">
              {JSON.stringify(telemetry?.rawEvents || [], null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

const DEFAULT_TASK =
  'Run python -m pytest tests/test_agent.py using shell_tool and verify that all 10 unit tests pass.';

/* ─────────────────────────────────────────────────────────
   Main Export: Demo
───────────────────────────────────────────────────────── */
export default function Demo({
  onBack,
  initialTask,
}: {
  onBack: () => void;
  initialTask?: string;
  mouseX?: number;
  mouseY?: number;
  activeColor?: ColorTheme;
}) {
  const [phase, setPhase] = useState<Phase>('compose');
  const [text, setText] = useState(
    initialTask !== undefined && initialTask !== '' ? initialTask : DEFAULT_TASK
  );
  const [visibleSteps, setVisibleSteps] = useState<TraceStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [runTelemetry, setRunTelemetry] = useState<RunTelemetry | null>(null);

  useEffect(() => {
    if (initialTask !== undefined && initialTask !== '') {
      setText(initialTask);
    }
  }, [initialTask]);

  /**
   * Executes the real task on the RepoPilot FastAPI backend.
   */
  const handleRun = async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      setErrorMessage('Please enter a task description before running the agent.');
      return;
    }

    setErrorMessage(null);
    setPhase('running');
    setVisibleSteps([
      {
        id: 0,
        icon: '●',
        text: 'Connecting to RepoPilot AgentCore…',
        toolName: 'AGENT CORE',
        detail: 'Dispatching task to backend via FastAPI (/api/agent/run)…',
        status: 'active',
      },
    ]);
    setCurrentStep(1);

    const startTime = Date.now();

    try {
      // Execute the task via the Vite-proxied FastAPI backend endpoint
      const response = await runAgentTask({ task: trimmed });
      const elapsed = Math.max(1, Math.round((Date.now() - startTime) / 1000));
      const backendSteps = mapBackendEventsToTraceSteps(response.events || []);

      // Extract telemetry from real backend events
      const toolsSet = new Set<string>();
      let recoveries = 0;
      for (const ev of response.events || []) {
        if (ev.tool) toolsSet.add(ev.tool);
        if (ev.type === 'reflection' || (ev.type === 'tool_result' && ev.status === 'error')) {
          recoveries++;
        }
      }

      const telemetry: RunTelemetry = {
        status: response.status === 'completed' ? 'completed' : 'failed',
        finalAnswer:
          response.final_answer ||
          (response.status === 'completed'
            ? 'Task completed successfully.'
            : 'Task ended with failure status.'),
        eventsCount: response.events?.length || 0,
        durationSeconds: elapsed,
        toolsUsed: Array.from(toolsSet),
        recoveryAttempts: recoveries,
        rawEvents: response.events || [],
      };

      setRunTelemetry(telemetry);

      // Sequentially display steps so the user sees the real events stream into the UI
      if (backendSteps.length === 0) {
        setVisibleSteps([
          {
            id: 0,
            icon: response.status === 'completed' ? '✓' : '⚠',
            text: response.status === 'completed' ? 'Task completed' : 'Task halted',
            toolName: 'AGENT CORE',
            detail: response.final_answer || 'No events were recorded.',
            status: response.status === 'completed' ? 'success' : 'fail',
          },
        ]);
        setCurrentStep(1);
        setTimeout(() => setPhase('complete'), 400);
      } else {
        setVisibleSteps([]);
        for (let i = 0; i < backendSteps.length; i++) {
          setVisibleSteps(prev => [...prev, backendSteps[i]]);
          setCurrentStep(i + 1);
          await new Promise(r => setTimeout(r, 120));
        }
        setTimeout(() => setPhase('complete'), 500);
      }
    } catch (err: any) {
      const errMsg = err?.message || 'Unknown backend execution error occurred.';
      setErrorMessage(errMsg);
      // Return to compose view to allow the user to retry while preserving the prompt
      setPhase('compose');
    }
  };

  const reset = () => {
    setPhase('compose');
    setVisibleSteps([]);
    setCurrentStep(0);
    setErrorMessage(null);
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
              Workspace / RepoPilot
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
              <div
                className="flex items-center gap-2 rounded-full px-3 py-1"
                style={{
                  backgroundColor:
                    runTelemetry?.status === 'completed'
                      ? 'rgba(82,209,35,0.15)'
                      : 'rgba(255,69,58,0.15)',
                  borderColor:
                    runTelemetry?.status === 'completed'
                      ? 'rgba(82,209,35,0.3)'
                      : 'rgba(255,69,58,0.3)',
                  borderWidth: 1,
                }}
              >
                <span
                  className="status-dot"
                  style={{
                    backgroundColor:
                      runTelemetry?.status === 'completed' ? '#52D123' : '#FF453A',
                  }}
                />
                <span
                  className="mono text-[10px] tracking-widest font-bold uppercase"
                  style={{
                    color:
                      runTelemetry?.status === 'completed' ? '#52D123' : '#FF453A',
                  }}
                >
                  {runTelemetry?.status === 'completed' ? 'VERIFIED' : 'FAILED'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Workspace Content + Right Context */}
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 flex flex-col overflow-y-auto px-4 md:px-8">
            {phase === 'compose' && (
              <ComposeView
                text={text}
                onTextChange={setText}
                onRun={handleRun}
                errorMessage={errorMessage}
                onClearError={() => setErrorMessage(null)}
              />
            )}
            {phase === 'running' && (
              <RunningView steps={visibleSteps} currentStep={currentStep} />
            )}
            {phase === 'complete' && (
              <CompleteView onReset={reset} telemetry={runTelemetry} />
            )}
          </div>

          <RunPanel phase={phase} telemetry={runTelemetry} />
        </div>
      </main>
    </div>
  );
}
