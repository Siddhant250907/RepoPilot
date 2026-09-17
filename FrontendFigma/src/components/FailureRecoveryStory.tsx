import { useState, useEffect } from 'react';

interface FailureRecoveryStoryProps {
  triggered?: boolean;
}

export default function FailureRecoveryStory({ triggered = true }: FailureRecoveryStoryProps) {
  const [step, setStep] = useState(0); // 0: init, 1: plan->act->test, 2: failure, 3: reflect, 4: replan, 5: verify

  useEffect(() => {
    if (!triggered) return;
    setStep(1);
    const t1 = setTimeout(() => setStep(2), 1200); // failure
    const t2 = setTimeout(() => setStep(3), 2600); // reflect
    const t3 = setTimeout(() => setStep(4), 4000); // replan
    const t4 = setTimeout(() => setStep(5), 5400); // verify

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [triggered]);

  const replay = () => {
    setStep(0);
    setTimeout(() => {
      setStep(1);
      setTimeout(() => setStep(2), 1200);
      setTimeout(() => setStep(3), 2600);
      setTimeout(() => setStep(4), 4000);
      setTimeout(() => setStep(5), 5400);
    }, 150);
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Visual Canvas */}
      <div className="relative w-full overflow-hidden" style={{ minHeight: 300 }}>
        <svg viewBox="0 0 720 320" className="w-full h-auto overflow-visible select-none" aria-hidden="true">
          <defs>
            <filter id="f-coral-bloom" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3.5" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="f-lime-bloom" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3.5" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Grid lines */}
          <line x1="60" y1="80" x2="660" y2="80" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="3 6" />
          <line x1="60" y1="220" x2="660" y2="220" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="3 6" />

          {/* 1. Initial Trajectory: PLAN (x=80) -> ACT (x=220) -> TEST (x=360) */}
          <line
            x1="80"
            y1="80"
            x2="220"
            y2="80"
            stroke={step >= 1 ? '#287FEA' : 'rgba(255,255,255,0.1)'}
            strokeWidth="2"
            strokeDasharray={step >= 1 ? '0' : '4 4'}
            className="transition-colors duration-500"
          />
          <line
            x1="220"
            y1="80"
            x2="360"
            y2="80"
            stroke={step >= 1 ? '#287FEA' : 'rgba(255,255,255,0.1)'}
            strokeWidth="2"
            strokeDasharray={step >= 1 ? '0' : '4 4'}
            className="transition-colors duration-500"
          />

          {/* Nodes: PLAN, ACT, TEST */}
          {[
            { x: 80, y: 80, label: 'PLAN', color: '#287FEA', active: step >= 1 },
            { x: 220, y: 80, label: 'ACT', color: '#4C96FF', active: step >= 1 },
            { x: 360, y: 80, label: 'TEST', color: step >= 2 ? '#FF5353' : '#5E6064', active: step >= 1 },
          ].map(n => (
            <g key={n.label} className="transition-all duration-400">
              <circle cx={n.x} cy={n.y} r={n.active ? 18 : 14} fill={n.color} opacity={0.15} />
              <circle cx={n.x} cy={n.y} r="8" fill={n.color} />
              <circle cx={n.x} cy={n.y} r="3" fill="#FFFFFF" />
              <text
                x={n.x}
                y={n.y - 18}
                textAnchor="middle"
                fill="rgba(255,255,255,0.85)"
                fontSize="10"
                fontFamily="JetBrains Mono, monospace"
                fontWeight="700"
                letterSpacing="0.08em"
              >
                {n.label}
              </text>
            </g>
          ))}

          {/* 2. FAILURE Event: Trajectory breaks down from TEST (x=360, y=80) to FAILURE (x=360, y=160) */}
          {step >= 2 && (
            <g className="transition-opacity duration-500">
              {/* Broken dashed jagged connector */}
              <line x1="360" y1="88" x2="360" y2="148" stroke="#FF5353" strokeWidth="2" strokeDasharray="3 3" />

              {/* Coral Failure node */}
              <circle cx="360" cy="160" r="24" fill="rgba(255,83,83,0.15)" />
              <circle cx="360" cy="160" r="14" fill="#FF5353" filter="url(#f-coral-bloom)" />
              <text
                x="360"
                y="164"
                textAnchor="middle"
                fill="#FFFFFF"
                fontSize="12"
                fontFamily="JetBrains Mono, monospace"
                fontWeight="700"
              >
                ✕
              </text>
              <text
                x="360"
                y="196"
                textAnchor="middle"
                fill="#FF5353"
                fontSize="10"
                fontFamily="JetBrains Mono, monospace"
                fontWeight="700"
                letterSpacing="0.1em"
              >
                FAILED
              </text>
            </g>
          )}

          {/* 3. REFLECT: Intelligent adaptation trajectory from FAILURE to REFLECT (x=260, y=220) */}
          {step >= 3 && (
            <g className="transition-opacity duration-500">
              <path
                d="M 345,168 Q 300,195 272,215"
                fill="none"
                stroke="#7566FF"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
              <circle cx="260" cy="220" r="20" fill="rgba(117,102,255,0.18)" />
              <circle cx="260" cy="220" r="12" fill="#7566FF" />
              <circle cx="260" cy="220" r="4" fill="#FFFFFF" />
              <text
                x="260"
                y="252"
                textAnchor="middle"
                fill="#A99BFF"
                fontSize="10"
                fontFamily="JetBrains Mono, monospace"
                fontWeight="700"
                letterSpacing="0.1em"
              >
                REFLECT
              </text>
            </g>
          )}

          {/* 4. REPLAN: Branching path from REFLECT to REPLAN (x=160, y=220) */}
          {step >= 4 && (
            <g className="transition-opacity duration-500">
              <line x1="248" y1="220" x2="172" y2="220" stroke="#A99BFF" strokeWidth="2" />
              <circle cx="160" cy="220" r="20" fill="rgba(169,155,255,0.18)" />
              <circle cx="160" cy="220" r="12" fill="#A99BFF" />
              <circle cx="160" cy="220" r="4" fill="#FFFFFF" />
              <text
                x="160"
                y="252"
                textAnchor="middle"
                fill="#A99BFF"
                fontSize="10"
                fontFamily="JetBrains Mono, monospace"
                fontWeight="700"
                letterSpacing="0.1em"
              >
                REPLAN
              </text>

              {/* Branch curve towards resolution: REPLAN -> FIX ACTION (x=460, y=220) */}
              <path
                d="M 172,220 Q 300,280 440,224"
                fill="none"
                stroke="#4C96FF"
                strokeWidth="2"
              />
              <circle cx="450" cy="220" r="16" fill="rgba(76,150,255,0.15)" />
              <circle cx="450" cy="220" r="10" fill="#4C96FF" />
              <circle cx="450" cy="220" r="3" fill="#FFFFFF" />
              <text
                x="450"
                y="252"
                textAnchor="middle"
                fill="#4C96FF"
                fontSize="10"
                fontFamily="JetBrains Mono, monospace"
                fontWeight="700"
                letterSpacing="0.08em"
              >
                APPLY FIX
              </text>
            </g>
          )}

          {/* 5. VERIFY: Final verification passed in bright Lime (x=600, y=220) */}
          {step >= 5 && (
            <g className="transition-opacity duration-500">
              <line x1="462" y1="220" x2="588" y2="220" stroke="#62D000" strokeWidth="2.5" />
              <circle cx="600" cy="220" r="26" fill="rgba(98,208,0,0.18)" />
              <circle cx="600" cy="220" r="16" fill="#62D000" filter="url(#f-lime-bloom)" />
              <text
                x="600"
                y="225"
                textAnchor="middle"
                fill="#FFFFFF"
                fontSize="14"
                fontFamily="JetBrains Mono, monospace"
                fontWeight="800"
              >
                ✓
              </text>
              <text
                x="600"
                y="262"
                textAnchor="middle"
                fill="#62D000"
                fontSize="11"
                fontFamily="JetBrains Mono, monospace"
                fontWeight="800"
                letterSpacing="0.12em"
              >
                VERIFIED
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Narrative Status Bar */}
      <div className="w-full flex items-center justify-between pt-4 border-t border-white/10 mt-2 px-4">
        <div className="flex items-center gap-3">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{
              backgroundColor:
                step === 2
                  ? '#FF5353'
                  : step === 3
                  ? '#7566FF'
                  : step === 4
                  ? '#4C96FF'
                  : step === 5
                  ? '#62D000'
                  : '#287FEA',
            }}
          />
          <span className="mono text-xs text-white/80 font-medium">
            {step === 0 && 'Awaiting execution loop...'}
            {step === 1 && 'Hypothesis generated → Testing solution'}
            {step === 2 && 'Exit code 1 — Assertion failed'}
            {step === 3 && 'Reflecting: Mock missing for JWT decode'}
            {step === 4 && 'Branching alternate route: Added JWT mock in setUp()'}
            {step === 5 && 'All 12 tests passed — Fix verified'}
          </span>
        </div>

        <button
          type="button"
          onClick={replay}
          className="mono text-[10px] uppercase tracking-wider text-white/50 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <span>↺ Replay Flow</span>
        </button>
      </div>
    </div>
  );
}
