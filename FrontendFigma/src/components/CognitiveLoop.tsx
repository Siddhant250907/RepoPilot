import { useState, useEffect } from 'react';

interface StageInfo {
  id: string;
  label: string;
  sub: string;
  description: string;
  color: string;
  bg: string;
  badge: string;
}

const STAGES: StageInfo[] = [
  {
    id: 'task',
    label: 'TASK',
    sub: 'Problem Ingest',
    description: 'Receives bug descriptions, failing test logs, or repository issues and extracts concrete goals.',
    color: '#F5F5F7',
    bg: 'rgba(255,255,255,0.08)',
    badge: 'STAGE 01',
  },
  {
    id: 'plan',
    label: 'PLAN',
    sub: 'Strategy Synthesis',
    description: 'Forms a hypothesis and structures an investigation plan based on codebase topology.',
    color: '#287FEA',
    bg: 'rgba(40,127,234,0.15)',
    badge: 'STAGE 02',
  },
  {
    id: 'act',
    label: 'ACT',
    sub: 'Tool Invocation',
    description: 'Executes search, file inspection, syntax parsing, and sandboxed test executions.',
    color: '#4C96FF',
    bg: 'rgba(76,150,255,0.15)',
    badge: 'STAGE 03',
  },
  {
    id: 'observe',
    label: 'OBSERVE',
    sub: 'Telemetry Capture',
    description: 'Gathers stdout, exit codes, and diff metrics to assess whether reality matches expectations.',
    color: '#8E8E93',
    bg: 'rgba(142,142,147,0.12)',
    badge: 'STAGE 04',
  },
  {
    id: 'reflect',
    label: 'REFLECT',
    sub: 'Discrepancy Analysis',
    description: 'When results disagree with the initial hypothesis, classifies root cause rather than halting.',
    color: '#BF5AF2',
    bg: 'rgba(191,90,242,0.15)',
    badge: 'STAGE 05',
  },
  {
    id: 'replan',
    label: 'REPLAN',
    sub: 'Branching Strategy',
    description: 'Synthesizes an alternate path using failed steps as concrete evidence to isolate the fix.',
    color: '#D182F7',
    bg: 'rgba(209,130,247,0.15)',
    badge: 'STAGE 06',
  },
  {
    id: 'verify',
    label: 'VERIFY',
    sub: 'Empirical Proof',
    description: 'Executes the full test suite in isolation, validating the patch before proposing the final PR.',
    color: '#52D123',
    bg: 'rgba(82,209,35,0.15)',
    badge: 'STAGE 07',
  },
];

export default function CognitiveLoop() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  useEffect(() => {
    if (!autoPlay) return;
    const interval = setInterval(() => {
      setActiveIdx(prev => (prev + 1) % STAGES.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [autoPlay]);

  const activeStage = STAGES[activeIdx];

  const W = 840;
  const H = 420;
  const cx = W / 2;
  const cy = H / 2;
  const rx = 330;
  const ry = 150;

  const nodes = STAGES.map((stage, i) => {
    const angle = (i / STAGES.length) * Math.PI * 2 - Math.PI / 2;
    return {
      ...stage,
      x: cx + rx * Math.cos(angle),
      y: cy + ry * Math.sin(angle),
      angle,
    };
  });

  const pathD = nodes.map((n, i) => `${i === 0 ? 'M' : 'L'} ${n.x},${n.y}`).join(' ') + ' Z';

  const reflectNode = nodes[4];
  const replanNode = nodes[5];
  const verifyNode = nodes[6];
  const branchPathD = `M ${reflectNode.x},${reflectNode.y} Q ${cx - 40},${cy + 40} ${replanNode.x},${replanNode.y} T ${verifyNode.x},${verifyNode.y}`;

  return (
    <div className="relative w-full max-w-5xl mx-auto flex flex-col items-center">
      {/* 3D Spatial Orbital Track */}
      <div className="relative w-full overflow-visible" style={{ height: H, perspective: 1000 }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-full overflow-visible pointer-events-none"
          aria-hidden="true"
        >
          <defs>
            <filter id="loop-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="orbit-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#287FEA" stopOpacity="0.7" />
              <stop offset="50%" stopColor="#BF5AF2" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#52D123" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {/* Ghost orbit loop */}
          <path
            d={pathD}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />

          {/* Dynamic signal line */}
          <path
            d={pathD}
            fill="none"
            stroke="url(#orbit-grad)"
            strokeWidth="2"
            strokeDasharray="24 820"
            style={{ animation: 'signal-loop 7s linear infinite' }}
            strokeLinecap="round"
          />

          {/* Adaptive Branch Curve when REFLECT/REPLAN is active */}
          <path
            d={branchPathD}
            fill="none"
            stroke="#BF5AF2"
            strokeWidth={activeIdx === 4 || activeIdx === 5 ? '2.2' : '1'}
            strokeDasharray="4 8"
            opacity={activeIdx === 4 || activeIdx === 5 ? 0.9 : 0.25}
            className="transition-all duration-500"
          />

          {/* Ellipse guide */}
          <ellipse
            cx={cx}
            cy={cy}
            rx={rx}
            ry={ry}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="0.8"
            fill="none"
            strokeDasharray="4 12"
          />

          {/* Central subtle hub */}
          <circle
            cx={cx}
            cy={cy}
            r={32}
            fill="rgba(20,20,24,0.85)"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="1"
          />
          <circle
            cx={cx}
            cy={cy}
            r={6}
            fill={activeStage.color}
            className="transition-colors duration-400"
          />

          {/* Radiating spoke to current active node */}
          <line
            x1={cx}
            y1={cy}
            x2={nodes[activeIdx].x}
            y2={nodes[activeIdx].y}
            stroke={activeStage.color}
            strokeWidth="1.2"
            strokeDasharray="3 6"
            opacity="0.6"
            className="transition-all duration-300"
          />
        </svg>

        {/* Floating Glass Node Buttons */}
        {nodes.map((node, i) => {
          const isActive = activeIdx === i;
          return (
            <div
              key={node.id}
              className="absolute pointer-events-auto transition-transform duration-300"
              style={{
                left: `${(node.x / W) * 100}%`,
                top: `${(node.y / H) * 100}%`,
                transform: `translate(-50%, -50%) scale(${isActive ? 1.08 : 1})`,
                zIndex: isActive ? 20 : 10,
              }}
            >
              <button
                type="button"
                data-hover
                onClick={() => {
                  setAutoPlay(false);
                  setActiveIdx(i);
                }}
                className={`group flex items-center gap-2.5 px-3.5 py-2 rounded-2xl transition-all duration-300 cursor-pointer ${
                  isActive
                    ? 'glass-elevated shadow-xl ring-1 ring-white/30'
                    : 'glass-secondary hover:glass hover:scale-105'
                }`}
                style={{
                  boxShadow: isActive ? `0 12px 36px ${node.color}35` : undefined,
                }}
              >
                {/* Node status dot */}
                <div
                  className="w-3 h-3 rounded-full flex items-center justify-center transition-all duration-300"
                  style={{
                    backgroundColor: node.color,
                    boxShadow: isActive ? `0 0 10px ${node.color}` : 'none',
                  }}
                >
                  <div className="w-1 h-1 rounded-full bg-black" />
                </div>

                <div className="text-left">
                  <div
                    className="mono text-[11px] font-bold tracking-wider transition-colors"
                    style={{ color: isActive ? node.color : '#86868B' }}
                  >
                    {node.label}
                  </div>
                </div>
              </button>
            </div>
          );
        })}
      </div>

      {/* Active Stage Detailed Spotlight Card */}
      <div className="w-full max-w-2xl mt-4 px-4 transition-all duration-400">
        <div
          className="glass-elevated rounded-3xl p-6 border-l-4 transition-all duration-400 border border-white/10"
          style={{ borderLeftColor: activeStage.color }}
        >
          <div className="flex items-center justify-between gap-4 mb-2">
            <div className="flex items-center gap-2">
              <span
                className="mono text-[10px] font-bold tracking-widest uppercase px-2.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${activeStage.color}25`,
                  color: activeStage.color,
                }}
              >
                {activeStage.badge}
              </span>
              <span className="text-xs text-[#86868B] font-medium">·</span>
              <span className="text-xs font-semibold text-[#86868B]">{activeStage.sub}</span>
            </div>
            <div className="flex items-center gap-1.5">
              {STAGES.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setAutoPlay(false);
                    setActiveIdx(idx);
                  }}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    activeIdx === idx ? 'w-6' : 'w-1.5 bg-white/20 hover:bg-white/40'
                  }`}
                  style={{
                    backgroundColor: activeIdx === idx ? activeStage.color : undefined,
                  }}
                  title={s.label}
                />
              ))}
            </div>
          </div>

          <p className="text-white/90 text-sm leading-relaxed font-normal">
            {activeStage.description}
          </p>
        </div>
      </div>
    </div>
  );
}
