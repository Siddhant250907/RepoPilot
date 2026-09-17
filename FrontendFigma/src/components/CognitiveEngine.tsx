import React, { useState } from 'react';

interface CognitiveEngineProps {
  dx: number;
  dy: number;
  className?: string;
  interactive?: boolean;
}

export default function CognitiveEngine({
  dx,
  dy,
  className = '',
  interactive = true,
}: CognitiveEngineProps) {
  const [activeNode, setActiveNode] = useState<string | null>(null);

  // Parallax translation factors (3-6%)
  const posX = dx * 36;
  const posY = dy * 24;
  const rotX = dy * -12;
  const rotY = dx * 14;

  const NODES = [
    { id: 'task', label: 'TASK', sub: 'Problem Ingest', x: 230, y: 150, color: '#111111', ringColor: '#111111', phase: 'Ready' },
    { id: 'plan', label: 'PLAN', sub: 'AST & Call Graph', x: 440, y: 170, color: '#287FEA', ringColor: '#287FEA', phase: 'Reasoning' },
    { id: 'act', label: 'ACT', sub: 'Tool Invocation', x: 530, y: 320, color: '#4C96FF', ringColor: '#4C96FF', phase: 'Executing' },
    { id: 'observe', label: 'OBSERVE', sub: 'Feedback Telemetry', x: 460, y: 470, color: '#5E6064', ringColor: '#5E6064', phase: 'Analyzing' },
    { id: 'reflect', label: 'REFLECT', sub: 'Error Diagnosis', x: 280, y: 490, color: '#7566FF', ringColor: '#7566FF', phase: 'Adapting' },
    { id: 'replan', label: 'REPLAN', sub: 'Alternate Route', x: 130, y: 380, color: '#A99BFF', ringColor: '#A99BFF', phase: 'Branching' },
    { id: 'verify', label: 'VERIFY', sub: 'Test Validation', x: 150, y: 220, color: '#62D000', ringColor: '#62D000', phase: 'Confirmed' },
  ];

  return (
    <div
      className={`relative w-full h-full select-none flex items-center justify-center ${className}`}
      style={{
        perspective: 1200,
      }}
    >
      {/* 3D Spatial Canvas Container with smooth lerped rotation & translation */}
      <div
        className="relative w-[640px] h-[640px] transition-transform duration-500 ease-out"
        style={{
          transformStyle: 'preserve-3d',
          transform: `translate3d(${posX}px, ${posY}px, 0) rotateX(${rotX}deg) rotateY(${rotY}deg)`,
        }}
      >
        {/* Layer 1: Ambient Refractive Back Glow */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none opacity-40"
          style={{
            transform: 'translateZ(-60px)',
            background:
              'radial-gradient(circle at 45% 45%, rgba(40,127,234,0.18) 0%, rgba(98,208,0,0.12) 40%, rgba(117,102,255,0.08) 65%, transparent 80%)',
            filter: 'blur(50px)',
          }}
        />

        {/* Layer 2: Main Vector Geometry */}
        <svg
          viewBox="0 0 640 640"
          className="w-full h-full overflow-visible pointer-events-auto"
          aria-hidden="true"
        >
          <defs>
            {/* Filters for subtle spatial blooms */}
            <filter id="ce-glow-blue" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="ce-glow-lime" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Orbit motion paths */}
            <path id="orbit-main" d="M 95,320 A 225,82 0 1,1 545,320 A 225,82 0 1,1 95,320" fill="none" />
            <path
              id="orbit-tilted"
              d="M 115,320 A 205,68 0 1,0 525,320 A 205,68 0 1,0 115,320"
              fill="none"
              transform="rotate(48, 320, 320)"
            />
            <path
              id="orbit-branch"
              d="M 140,320 A 180,54 0 1,1 500,320 A 180,54 0 1,1 140,320"
              fill="none"
              transform="rotate(-36, 320, 320)"
            />
          </defs>

          {/* Background Structural Guide Grids */}
          <circle cx="320" cy="320" r="275" stroke="#DFE0DC" strokeWidth="0.75" strokeDasharray="3 12" fill="none" opacity="0.6" />
          <circle cx="320" cy="320" r="215" stroke="#DFE0DC" strokeWidth="0.5" strokeDasharray="2 8" fill="none" opacity="0.4" />

          {/* Thin connecting polygon loop */}
          <polygon
            points={NODES.map(n => `${n.x},${n.y}`).join(' ')}
            fill="none"
            stroke="rgba(40,127,234,0.14)"
            strokeWidth="1.2"
            strokeDasharray="4 6"
          />

          {/* Primary Orbital Ring (Blue) */}
          <ellipse
            cx="320"
            cy="320"
            rx="225"
            ry="82"
            stroke="#287FEA"
            strokeWidth="1.2"
            fill="none"
            strokeDasharray="8 20"
            opacity="0.55"
          />

          {/* Secondary Orbital Ring (Acid Lime - Tilted) */}
          <ellipse
            cx="320"
            cy="320"
            rx="205"
            ry="68"
            transform="rotate(48, 320, 320)"
            stroke="#62D000"
            strokeWidth="0.9"
            fill="none"
            strokeDasharray="6 24"
            opacity="0.4"
          />

          {/* Tertiary Orbital Ring (Soft Violet - Branch Path) */}
          <ellipse
            cx="320"
            cy="320"
            rx="180"
            ry="54"
            transform="rotate(-36, 320, 320)"
            stroke="#7566FF"
            strokeWidth="0.8"
            fill="none"
            strokeDasharray="4 18"
            opacity="0.3"
          />

          {/* Trajectory lines from core to nodes */}
          {NODES.map(n => (
            <line
              key={n.id}
              x1="320"
              y1="320"
              x2={n.x}
              y2={n.y}
              stroke={activeNode === n.id ? n.color : 'rgba(0,0,0,0.06)'}
              strokeWidth={activeNode === n.id ? '1.5' : '0.6'}
              strokeDasharray="3 7"
              className="transition-all duration-300"
            />
          ))}

          {/* Animated signal particle along primary orbit */}
          <circle r="4.5" fill="#4C96FF" filter="url(#ce-glow-blue)" opacity="0.95">
            <animateMotion dur="11s" repeatCount="indefinite" calcMode="linear">
              <mpath href="#orbit-main" />
            </animateMotion>
          </circle>

          {/* Animated signal particle along lime orbit */}
          <circle r="4" fill="#62D000" filter="url(#ce-glow-lime)" opacity="0.9">
            <animateMotion dur="8.5s" repeatCount="indefinite" calcMode="linear" keyTimes="0;1" keyPoints="1;0">
              <mpath href="#orbit-tilted" />
            </animateMotion>
          </circle>

          {/* Animated signal particle along violet recovery branch */}
          <circle r="3.5" fill="#A99BFF" opacity="0.85">
            <animateMotion dur="14s" repeatCount="indefinite" calcMode="linear">
              <mpath href="#orbit-branch" />
            </animateMotion>
          </circle>

          {/* Central Glass Core */}
          <g>
            {/* Outer halo */}
            <circle cx="320" cy="320" r="56" fill="rgba(40,127,234,0.05)" />
            {/* Primary glass disk */}
            <circle
              cx="320"
              cy="320"
              r="38"
              fill="rgba(255,255,255,0.7)"
              stroke="rgba(255,255,255,0.95)"
              strokeWidth="1.5"
            />
            {/* Inner refraction */}
            <circle
              cx="320"
              cy="320"
              r="24"
              fill="rgba(40,127,234,0.12)"
              stroke="rgba(40,127,234,0.25)"
              strokeWidth="0.8"
            />
            {/* Center black kernel */}
            <circle cx="320" cy="320" r="10" fill="#0D0D0F" />
            {/* Electric core dot */}
            <circle cx="320" cy="320" r="4.5" fill="#287FEA" filter="url(#ce-glow-blue)" />
            <circle cx="320" cy="320" r="2" fill="#FFFFFF" />
          </g>

          {/* Floating Cognitive Nodes */}
          {NODES.map(n => {
            const isHovered = activeNode === n.id;
            return (
              <g
                key={n.id}
                className="cursor-pointer transition-transform duration-200"
                onMouseEnter={() => interactive && setActiveNode(n.id)}
                onMouseLeave={() => interactive && setActiveNode(null)}
              >
                {/* Outer halo */}
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={isHovered ? 28 : 20}
                  fill={n.color}
                  opacity={isHovered ? 0.14 : 0.05}
                  className="transition-all duration-300"
                />
                {/* Node border */}
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={isHovered ? 13 : 9}
                  fill="#FFFFFF"
                  stroke={n.ringColor}
                  strokeWidth={isHovered ? 2 : 1.2}
                  className="transition-all duration-300"
                />
                {/* Center dot */}
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={isHovered ? 5.5 : 4}
                  fill={n.color}
                  className="transition-all duration-300"
                />
              </g>
            );
          })}
        </svg>

        {/* Floating HTML Labels for crispness & depth */}
        {NODES.map(n => {
          const isHovered = activeNode === n.id;
          return (
            <div
              key={n.id}
              className="absolute pointer-events-none transition-all duration-300"
              style={{
                left: `${(n.x / 640) * 100}%`,
                top: `${(n.y / 640) * 100}%`,
                transform: `translate(-50%, -150%) scale(${isHovered ? 1.06 : 1})`,
                zIndex: isHovered ? 10 : 2,
              }}
            >
              <div
                className={`rounded-xl px-2.5 py-1 text-center transition-all duration-200 ${
                  isHovered ? 'glass-elevated shadow-lg' : 'glass-secondary'
                }`}
                style={{
                  borderLeft: `2.5px solid ${n.color}`,
                }}
              >
                <div
                  className="mono text-[9px] font-bold tracking-wider"
                  style={{ color: n.color }}
                >
                  {n.label}
                </div>
                {isHovered && (
                  <div className="text-[8px] text-ink2 font-medium whitespace-nowrap mt-0.5">
                    {n.sub}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
