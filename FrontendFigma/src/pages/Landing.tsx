import { useState, useEffect } from 'react';
import AppleHeroPedestal, { ColorTheme } from '../components/AppleHeroPedestal';
import CognitiveLoop from '../components/CognitiveLoop';
import FailureRecoveryStory from '../components/FailureRecoveryStory';
import TiltCard from '../components/TiltCard';
import TechnicalSurface from '../components/TechnicalSurface';

interface LandingProps {
  onStartDemo: (taskPreset?: string) => void;
  mouseX?: number;
  mouseY?: number;
  activeColor: ColorTheme;
  onColorChange: (color: ColorTheme) => void;
}

/* ─────────────────────────────────────────────────────────
   Apple Studio Top Navbar
───────────────────────────────────────────────────────── */
function Navbar({ compact, onStartDemo }: { compact: boolean; onStartDemo: (taskPreset?: string) => void }) {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 transition-all duration-300 pointer-events-none"
      style={{ paddingTop: compact ? 12 : 20 }}
    >
      <nav
        className="glass-pill rounded-full flex items-center justify-between gap-6 transition-all duration-300 w-full max-w-3xl pointer-events-auto shadow-2xl px-6 py-3 border border-white/10"
      >
        {/* Apple / RP Logo */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center shadow-md">
            <span className="text-black text-[10px] font-black mono">RP</span>
          </div>
          <span className="font-bold text-white text-xs tracking-tight">RepoPilot</span>
        </div>

        {/* Apple Style Nav Links */}
        <div className="hidden md:flex items-center gap-7">
          {[
            { label: 'Overview', href: '#overview' },
            { label: 'Architecture', href: '#architecture' },
            { label: 'Recovery', href: '#recovery' },
            { label: 'Workspace', href: '#workspace' },
          ].map(l => (
            <a
              key={l.label}
              href={l.href}
              data-hover
              className="text-xs tracking-wide text-[#86868B] hover:text-white transition-colors duration-150 font-medium"
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* CTA */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            data-hover
            onClick={() => onStartDemo()}
            className="bg-white text-black rounded-full text-xs font-bold px-4 py-1.5 hover:bg-white/90 transition-all duration-200 hover:scale-105 cursor-pointer shadow-md"
          >
            Start Debugging →
          </button>
        </div>
      </nav>
    </header>
  );
}

/* ─────────────────────────────────────────────────────────
   Product Composer Section (Dark Apple Studio Style)
───────────────────────────────────────────────────────── */
function ProductComposerSection({ onStartDemo }: { onStartDemo: (taskPreset?: string) => void }) {
  return (
    <section className="py-28 md:py-36 relative overflow-hidden" id="workspace">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="text-center mb-16 reveal">
          <div className="mono text-[10px] tracking-widest text-[#86868B] mb-3 font-semibold uppercase">
            Interactive Workspace
          </div>
          <h2
            className="font-extrabold text-white tracking-tight"
            style={{ fontSize: 'clamp(36px, 4.5vw, 56px)' }}
          >
            Tell RepoPilot what's broken.
          </h2>
          <p className="text-[#86868B] mt-3 max-w-md mx-auto text-sm">
            Describe a failing test, stack trace, or regression in your codebase.
          </p>
        </div>

        {/* 3D Glass Composer Card */}
        <div className="max-w-2xl mx-auto reveal reveal-delay-2">
          <TiltCard variant="elevated" className="rounded-3xl p-8 md:p-10 border border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.8)]">
            <div className="flex items-center justify-between mb-5">
              <span className="mono text-[10px] font-bold tracking-widest text-[#86868B] uppercase">
                Investigation Target
              </span>
              <span className="status-dot bg-[#52D123]" />
            </div>

            {/* Input display */}
            <div className="bg-[#0D0D10] rounded-2xl p-5 mb-5 border border-white/10 shadow-inner">
              <p className="text-white/90 text-sm leading-relaxed font-normal">
                Run automated test suite using{' '}
                <code className="mono text-[#287FEA] text-xs bg-[#287FEA]/15 px-1.5 py-0.5 rounded font-semibold">
                  shell_tool
                </code>{' '}
                on{' '}
                <code className="mono text-[#52D123] text-xs bg-[#52D123]/15 px-1.5 py-0.5 rounded font-semibold">
                  tests/test_agent.py
                </code>{' '}
                and verify 100% assertions pass...
              </p>
              <span className="animate-blink text-[#287FEA] text-sm font-bold">|</span>
            </div>

            {/* Target Repo & Branch */}
            <div className="flex gap-4 mb-6 flex-wrap">
              <div className="flex-1 min-w-[140px]">
                <label className="mono text-[9px] tracking-widest text-[#86868B] block mb-2 font-semibold">
                  REPOSITORY
                </label>
                <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[#86868B] text-xs">⎇</span>
                    <span className="text-xs font-semibold text-white">RepoPilot (Workspace)</span>
                  </div>
                  <span className="text-[10px] mono text-[#86868B]">git</span>
                </div>
              </div>

              <div className="flex-1 min-w-[140px]">
                <label className="mono text-[9px] tracking-widest text-[#86868B] block mb-2 font-semibold">
                  BRANCH
                </label>
                <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[#52D123] text-xs font-bold">●</span>
                    <span className="text-xs font-semibold text-white">main</span>
                  </div>
                  <span className="text-[10px] mono text-[#86868B]">HEAD</span>
                </div>
              </div>
            </div>

            {/* Run Button */}
            <button
              type="button"
              data-hover
              onClick={() => onStartDemo('Run python -m pytest tests/test_agent.py using shell_tool and verify that all 10 unit tests pass.')}
              className="w-full bg-white text-black rounded-2xl py-4 font-bold text-sm flex items-center justify-center gap-2 hover:bg-white/90 hover:scale-[1.01] transition-all duration-200 cursor-pointer shadow-xl"
            >
              Run Agent →
            </button>

            {/* Quick Action Presets */}
            <div className="mt-5 flex flex-wrap gap-2">
              {[
                { label: '🧪 Run Unit Tests', task: 'Run python -m pytest tests/test_agent.py using shell_tool and verify that all 10 unit tests pass.' },
                { label: '📖 Inspect README', task: 'Read README.md using file_tool and summarize RepoPilot\'s architecture.' },
                { label: '⚡ Inspect Backend API', task: 'Inspect backend/main.py and backend/api/routes.py using file_tool and explain the API endpoints.' },
                { label: '✍️ Custom Task', task: '' },
              ].map(a => (
                <button
                  key={a.label}
                  type="button"
                  data-hover
                  onClick={() => onStartDemo(a.task)}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-3.5 py-1.5 text-xs font-medium text-[#86868B] hover:text-white transition-all cursor-pointer"
                >
                  {a.label}
                </button>
              ))}
            </div>
          </TiltCard>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────
   Cognitive Loop Section
───────────────────────────────────────────────────────── */
function CognitiveLoopSection() {
  return (
    <section className="py-28 md:py-36 relative" id="architecture">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="text-center mb-16 reveal">
          <div className="mono text-[10px] tracking-widest text-[#86868B] mb-3 font-semibold uppercase">
            Keynote Architecture
          </div>
          <h2
            className="font-extrabold text-white tracking-tight"
            style={{ fontSize: 'clamp(36px, 4.5vw, 56px)' }}
          >
            How the agent thinks.
          </h2>
          <p className="text-[#86868B] mt-3 max-w-md mx-auto text-sm leading-relaxed">
            A continuous reasoning loop — not a brittle linear script. Every action generates
            observations that dynamically update the hypothesis.
          </p>
        </div>

        <div className="reveal reveal-delay-2">
          <CognitiveLoop />
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────
   Failure → Recovery Story Section
───────────────────────────────────────────────────────── */
function FailureStorySection() {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = document.getElementById('recovery');
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="recovery"
      className="py-28 md:py-36 relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          {/* Left Column */}
          <div className="lg:col-span-5 reveal">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF453A]/15 text-[#FF453A] mono text-[10px] font-bold tracking-widest uppercase mb-6">
              <span>●</span> Self-Healing Loop
            </div>

            <h2
              className="font-extrabold text-white tracking-tight leading-tight mb-6"
              style={{ fontSize: 'clamp(36px, 4vw, 52px)' }}
            >
              Your first plan can fail.{' '}
              <span className="text-[#287FEA]">RepoPilot</span> doesn't stop there.
            </h2>

            <p className="text-[#86868B] leading-relaxed text-sm mb-8">
              When a test assertion fails, RepoPilot interprets the error trace as empirical evidence.
              It pauses to reflect on the discrepancy, branches a new strategy, and resolves the issue cleanly.
            </p>

            <div className="space-y-4">
              {[
                {
                  icon: '✕',
                  color: '#FF453A',
                  title: 'Failure Classified',
                  desc: 'Exact stack trace & test failure parsed semantically.',
                },
                {
                  icon: '↻',
                  color: '#BF5AF2',
                  title: 'Reflection & Replanning',
                  desc: 'Memory incorporates failure context into a new strategy.',
                },
                {
                  icon: '✓',
                  color: '#52D123',
                  title: 'Verified Resolution',
                  desc: 'Executed tests confirm 100% assertions before concluding.',
                },
              ].map(item => (
                <div key={item.title} className="flex items-start gap-3.5">
                  <div
                    className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold"
                    style={{
                      backgroundColor: `${item.color}20`,
                      color: item.color,
                    }}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <div className="text-white text-sm font-semibold">{item.title}</div>
                    <div className="text-[#86868B] text-xs mt-0.5">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-7 reveal reveal-delay-2">
            <TechnicalSurface
              title="FAILURE_RECOVERY_TRACE"
              badge="ADAPTIVE"
              badgeColor="#BF5AF2"
            >
              <FailureRecoveryStory triggered={inView} />
            </TechnicalSurface>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────
   Verification / Final Proof Section
───────────────────────────────────────────────────────── */
function VerificationSection({ onStartDemo }: { onStartDemo: (taskPreset?: string) => void }) {
  return (
    <section className="py-28 md:py-36 relative">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <TechnicalSurface
          title="EMPIRICAL_VERIFICATION_REPORT"
          badge="100% PASSING"
          badgeColor="#52D123"
          className="p-8 md:p-12 border border-white/10"
        >
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#52D123]/20 text-[#52D123] mono text-[10px] font-bold tracking-widest uppercase mb-4">
                <span className="status-dot bg-[#52D123]" />
                Verification Passed
              </div>

              <h2
                className="font-extrabold text-white tracking-tight leading-tight mb-4"
                style={{ fontSize: 'clamp(40px, 5.5vw, 64px)' }}
              >
                Verified.
              </h2>

              <p className="text-[#86868B] text-sm leading-relaxed mb-8">
                RepoPilot identified the regression, adapted its strategy via dynamic replanning,
                and proved the fix by executing all 12 test assertions in isolation.
              </p>

              <div className="space-y-3 mb-8">
                {[
                  'Problem identified & isolated',
                  'Targeted patch applied',
                  'All test assertions verified',
                ].map(item => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#52D123]/25 text-[#52D123] flex items-center justify-center text-xs font-bold">
                      ✓
                    </div>
                    <span className="text-white/85 text-sm font-medium">{item}</span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                data-hover
                onClick={() => onStartDemo()}
                className="bg-white text-black font-bold rounded-2xl flex items-center gap-3 px-7 py-3.5 hover:bg-white/90 transition-all duration-200 hover:scale-105 cursor-pointer shadow-xl"
              >
                Start New Investigation →
              </button>
            </div>

            {/* Right Execution Telemetry Card */}
            <div className="rounded-2xl border border-white/10 bg-[#0C0C0F] p-6 shadow-inner">
              <div className="flex items-center justify-between mb-4">
                <span className="mono text-[10px] text-[#52D123] font-bold tracking-wider uppercase">
                  SUITE EXECUTION
                </span>
                <span className="mono text-sm font-bold text-[#52D123]">12 / 12 PASSING</span>
              </div>

              <div className="h-2 rounded-full bg-white/10 overflow-hidden mb-6">
                <div className="h-full bg-[#52D123] rounded-full w-full" />
              </div>

              <div className="grid grid-cols-2 gap-4 pb-6 border-b border-white/10">
                <div>
                  <div className="mono text-[9px] text-[#86868B] tracking-wider">DURATION</div>
                  <div className="mono text-sm font-bold text-white mt-0.5">00:08s</div>
                </div>
                <div>
                  <div className="mono text-[9px] text-[#86868B] tracking-wider">STEPS RUN</div>
                  <div className="mono text-sm font-bold text-white mt-0.5">10 steps</div>
                </div>
                <div>
                  <div className="mono text-[9px] text-[#86868B] tracking-wider">RECOVERY</div>
                  <div className="mono text-sm font-bold text-[#BF5AF2] mt-0.5">2 attempts</div>
                </div>
                <div>
                  <div className="mono text-[9px] text-[#86868B] tracking-wider">TOOLS ENGAGED</div>
                  <div className="mono text-sm font-bold text-[#287FEA] mt-0.5">File Reader, Shell</div>
                </div>
              </div>

              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  data-hover
                  onClick={() => onStartDemo()}
                  className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#86868B] hover:text-white text-xs mono transition-colors"
                >
                  Inspect Git Diff
                </button>
                <button
                  type="button"
                  data-hover
                  onClick={() => onStartDemo()}
                  className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#86868B] hover:text-white text-xs mono transition-colors"
                >
                  View Execution Log
                </button>
              </div>
            </div>
          </div>
        </TechnicalSurface>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────
   Apple Minimal Dark Footer
───────────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="border-t border-white/10 py-14 px-6 md:px-12 bg-[#000000]">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2.5">
          <div className="w-5 h-5 rounded-md bg-white flex items-center justify-center">
            <span className="text-black text-[9px] font-black mono">RP</span>
          </div>
          <span className="font-bold text-white text-xs tracking-tight">RepoPilot</span>
          <span className="text-xs text-[#86868B] ml-2">© 2026 Autonomous Agentic Systems</span>
        </div>

        <div className="flex items-center gap-6 text-xs text-[#86868B] font-medium">
          <a href="#overview" className="hover:text-white transition-colors">Overview</a>
          <a href="#architecture" className="hover:text-white transition-colors">Architecture</a>
          <a href="#recovery" className="hover:text-white transition-colors">Recovery</a>
          <a href="#workspace" className="hover:text-white transition-colors">Workspace</a>
        </div>
      </div>
    </footer>
  );
}

/* ─────────────────────────────────────────────────────────
   Main Export: Landing Page
───────────────────────────────────────────────────────── */
export default function Landing({
  onStartDemo,
  activeColor,
  onColorChange,
}: LandingProps) {
  const [navCompact, setNavCompact] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setNavCompact(window.scrollY > 40);
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.12 }
    );

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    return () => {
      window.removeEventListener('scroll', onScroll);
      observer.disconnect();
    };
  }, []);

  return (
    <div className="relative w-full pt-12" id="overview">
      <Navbar compact={navCompact} onStartDemo={onStartDemo} />

      {/* ── Centerpiece: Apple Product Studio Hero ── */}
      <AppleHeroPedestal
        onStartDemo={onStartDemo}
        activeColor={activeColor}
        onColorChange={onColorChange}
      />

      <ProductComposerSection onStartDemo={onStartDemo} />
      <CognitiveLoopSection />
      <FailureStorySection />
      <VerificationSection onStartDemo={onStartDemo} />
      <Footer />
    </div>
  );
}
