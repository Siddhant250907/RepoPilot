import { useState } from 'react';

export type ColorTheme = 'obsidian' | 'blue' | 'lime' | 'titanium';

interface AppleHeroPedestalProps {
  onStartDemo: () => void;
  activeColor: ColorTheme;
  onColorChange: (color: ColorTheme) => void;
}

const THEME_CONFIG: Record<
  ColorTheme,
  {
    name: string;
    chipColor: string;
    accentColor: string;
    glowColor: string;
    spotlight: string;
  }
> = {
  obsidian: {
    name: 'Obsidian Black',
    chipColor: '#1A1A1D',
    accentColor: '#FFFFFF',
    glowColor: 'rgba(255, 255, 255, 0.15)',
    spotlight: 'rgba(255, 255, 255, 0.08)',
  },
  blue: {
    name: 'Electric Blue',
    chipColor: '#0071E3',
    accentColor: '#287FEA',
    glowColor: 'rgba(40, 127, 234, 0.4)',
    spotlight: 'rgba(40, 127, 234, 0.18)',
  },
  lime: {
    name: 'Acid Lime',
    chipColor: '#52D123',
    accentColor: '#62D000',
    glowColor: 'rgba(98, 208, 0, 0.4)',
    spotlight: 'rgba(98, 208, 0, 0.18)',
  },
  titanium: {
    name: 'Space Gray',
    chipColor: '#8E8E93',
    accentColor: '#C7C7CC',
    glowColor: 'rgba(199, 199, 204, 0.25)',
    spotlight: 'rgba(199, 199, 204, 0.1)',
  },
};

export default function AppleHeroPedestal({
  onStartDemo,
  activeColor,
  onColorChange,
}: AppleHeroPedestalProps) {
  const [hovered, setHovered] = useState(false);
  const currentTheme = THEME_CONFIG[activeColor];

  return (
    <div className="relative w-full overflow-hidden flex flex-col items-center justify-center pt-8 pb-16 select-none">
      {/* ── Top Color Chips (Exact match to reference image swatches) ── */}
      <div className="flex items-center gap-3.5 mb-8 z-30">
        {(Object.keys(THEME_CONFIG) as ColorTheme[]).map(themeKey => {
          const cfg = THEME_CONFIG[themeKey];
          const isSelected = activeColor === themeKey;
          return (
            <button
              key={themeKey}
              type="button"
              data-hover
              onClick={() => onColorChange(themeKey)}
              className={`group relative w-10 h-10 rounded-xl transition-all duration-300 cursor-pointer flex items-center justify-center ${
                isSelected
                  ? 'scale-110 ring-2 ring-white/80 shadow-lg'
                  : 'hover:scale-105 opacity-80 hover:opacity-100 ring-1 ring-white/20'
              }`}
              style={{
                backgroundColor: cfg.chipColor,
                boxShadow: isSelected ? `0 0 20px ${cfg.chipColor}80` : undefined,
              }}
              title={cfg.name}
            >
              {isSelected && (
                <div className="w-1.5 h-1.5 rounded-full bg-white shadow-xs" />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Hero Container (Apple Presentation Card Frame) ── */}
      <div className="relative w-full max-w-6xl mx-auto rounded-[36px] bg-[#000000] border border-white/10 shadow-[0_30px_100px_rgba(0,0,0,0.9)] overflow-hidden">
        {/* Dynamic Studio Overhead Spotlight */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] pointer-events-none transition-colors duration-700"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, ${currentTheme.spotlight} 0%, rgba(0,0,0,0) 75%)`,
          }}
        />

        {/* ── Main Stage Area ── */}
        <div className="relative min-h-[580px] sm:min-h-[640px] flex flex-col items-center justify-center px-4 overflow-hidden pt-12 pb-6">
          {/* Eyebrow Headline */}
          <div className="relative z-20 text-center mb-2">
            <span className="text-xs sm:text-sm font-medium tracking-wide text-[#86868B]">
              Autonomous, high-fidelity debugging
            </span>
          </div>

          {/* ── Giant Backdrop Wordmark (Exact Apple Reference Style) ── */}
          <div className="absolute top-[18%] left-0 right-0 z-10 flex items-center justify-center pointer-events-none select-none">
            <h1
              className="font-black tracking-[-0.04em] text-center leading-none text-transparent bg-clip-text"
              style={{
                fontSize: 'clamp(56px, 12.5vw, 150px)',
                backgroundImage:
                  'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.35) 60%, rgba(255,255,255,0.08) 100%)',
                fontFamily:
                  "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', sans-serif",
              }}
            >
              REPOPILOT
            </h1>
          </div>

          {/* ── Central 3D Product Showcase on Brushed Metallic Pedestal ── */}
          <div
            className="relative z-20 mt-16 sm:mt-20 flex flex-col items-center cursor-pointer group"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={onStartDemo}
          >
            {/* The 3D RepoPilot Cognitive Core Device */}
            <div className="relative w-44 sm:w-52 h-56 sm:h-64 flex items-center justify-center transition-transform duration-500 ease-out group-hover:scale-105">
              {/* Core Cylinder Shell (Mesh texture / Apple dark matte hardware) */}
              <div
                className="relative w-36 sm:w-44 h-48 sm:h-56 rounded-[48px] sm:rounded-[56px] shadow-[0_20px_50px_rgba(0,0,0,0.9)] overflow-hidden border border-white/10"
                style={{
                  background:
                    'linear-gradient(135deg, #1C1C20 0%, #0F0F12 50%, #08080A 100%)',
                }}
              >
                {/* Acoustic/Computational fine mesh pattern */}
                <div
                  className="absolute inset-0 opacity-25"
                  style={{
                    backgroundImage:
                      'radial-gradient(rgba(255,255,255,0.3) 1px, transparent 1px)',
                    backgroundSize: '4px 4px',
                  }}
                />

                {/* Vertical rim highlights */}
                <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-white/15 to-transparent" />
                <div className="absolute inset-y-0 right-0 w-3 bg-gradient-to-l from-white/10 to-transparent" />

                {/* Top Interactive Glass Interface (Waveform / Neural Core) */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 sm:w-32 h-14 sm:h-16 rounded-[50%] bg-[#08080A] border border-white/20 shadow-inner flex items-center justify-center overflow-hidden">
                  {/* Glowing Neural Waveform Disc */}
                  <div
                    className="w-16 h-8 rounded-full blur-[2px] transition-all duration-500"
                    style={{
                      background: `radial-gradient(ellipse at center, ${currentTheme.accentColor} 0%, rgba(117,102,255,0.6) 50%, transparent 80%)`,
                      transform: hovered ? 'scale(1.2)' : 'scale(1)',
                    }}
                  />
                  {/* Inner ring */}
                  <div className="absolute inset-1 rounded-[50%] border border-white/30 opacity-70" />
                </div>

                {/* Center subtle RP glyph */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 mono text-[10px] tracking-widest text-white/25 font-bold">
                  AUTONOMOUS AGENT
                </div>
              </div>

              {/* Dynamic Aura Glow around Device */}
              <div
                className="absolute inset-0 -z-10 rounded-full blur-2xl pointer-events-none transition-all duration-700"
                style={{
                  background: currentTheme.glowColor,
                  opacity: hovered ? 0.8 : 0.45,
                }}
              />
            </div>

            {/* ── Brushed Aluminum Circular Stage / Pedestal ── */}
            <div className="relative -mt-10 sm:-mt-12 w-64 sm:w-80 h-24 flex items-center justify-center">
              <svg viewBox="0 0 320 96" className="w-full h-full overflow-visible" aria-hidden="true">
                <defs>
                  {/* Metallic bevel gradient */}
                  <linearGradient id="pedestal-top" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#8E8E93" />
                    <stop offset="35%" stopColor="#D1D1D6" />
                    <stop offset="50%" stopColor="#FFFFFF" />
                    <stop offset="65%" stopColor="#D1D1D6" />
                    <stop offset="100%" stopColor="#636366" />
                  </linearGradient>

                  <linearGradient id="pedestal-side" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#C7C7CC" />
                    <stop offset="30%" stopColor="#8E8E93" />
                    <stop offset="70%" stopColor="#3A3A3C" />
                    <stop offset="100%" stopColor="#1C1C1E" />
                  </linearGradient>

                  <radialGradient id="pedestal-shadow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="rgba(0,0,0,0.9)" />
                    <stop offset="60%" stopColor="rgba(0,0,0,0.6)" />
                    <stop offset="100%" stopColor="transparent" />
                  </radialGradient>
                </defs>

                {/* Base floor shadow */}
                <ellipse cx="160" cy="74" rx="140" ry="20" fill="url(#pedestal-shadow)" />

                {/* Pedestal Cylindrical Body */}
                <path
                  d="M 30,36 C 30,48 88,58 160,58 C 232,58 290,48 290,36 L 290,56 C 290,68 232,78 160,78 C 88,78 30,68 30,56 Z"
                  fill="url(#pedestal-side)"
                />

                {/* Pedestal Top Brushed Metallic Ellipse */}
                <ellipse
                  cx="160"
                  cy="36"
                  rx="130"
                  ry="22"
                  fill="url(#pedestal-top)"
                  stroke="rgba(255,255,255,0.7)"
                  strokeWidth="0.8"
                />

                {/* Inner reflection ring */}
                <ellipse
                  cx="160"
                  cy="36"
                  rx="118"
                  ry="18"
                  fill="none"
                  stroke={currentTheme.accentColor}
                  strokeWidth="0.75"
                  opacity={hovered ? 0.6 : 0.25}
                  strokeDasharray="4 8"
                  className="transition-all duration-500"
                />
              </svg>
            </div>
          </div>

          {/* ── Foreground Silhouetted Grass / Neural Blades (From the Image) ── */}
          <div className="absolute inset-x-0 bottom-0 pointer-events-none z-20 overflow-hidden h-36 sm:h-44">
            <svg
              viewBox="0 0 1000 160"
              preserveAspectRatio="none"
              className="w-full h-full"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="grass-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#2C2C2E" stopOpacity="0.85" />
                  <stop offset="60%" stopColor="#1C1C1E" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#000000" stopOpacity="1" />
                </linearGradient>
                <filter id="grass-blur">
                  <feGaussianBlur stdDeviation="1.5" />
                </filter>
              </defs>

              {/* Layer 1: Midground blades (soft blur) */}
              <g filter="url(#grass-blur)" opacity="0.6">
                {[
                  'M 40,160 Q 60,60 90,30 Q 80,90 85,160',
                  'M 120,160 Q 140,50 160,20 Q 150,80 155,160',
                  'M 210,160 Q 230,70 250,35 Q 240,100 245,160',
                  'M 750,160 Q 770,55 790,25 Q 780,90 785,160',
                  'M 840,160 Q 860,65 890,30 Q 875,95 880,160',
                  'M 910,160 Q 930,45 960,15 Q 945,85 950,160',
                ].map((d, i) => (
                  <path key={i} d={d} fill="#242426" />
                ))}
              </g>

              {/* Layer 2: Foreground dark blades framing the stage */}
              <g fill="url(#grass-grad)">
                {[
                  'M 0,160 Q 20,40 50,10 Q 35,80 40,160',
                  'M 70,160 Q 95,50 120,25 Q 110,90 115,160',
                  'M 150,160 Q 170,75 190,40 Q 185,100 188,160',
                  'M 230,160 Q 260,80 280,50 Q 270,110 275,160',
                  'M 300,160 Q 320,100 340,70 Q 335,120 338,160',
                  // Right side
                  'M 680,160 Q 695,95 710,65 Q 705,120 708,160',
                  'M 730,160 Q 755,70 775,40 Q 765,105 770,160',
                  'M 810,160 Q 830,60 860,20 Q 845,90 850,160',
                  'M 890,160 Q 910,50 940,18 Q 925,85 930,160',
                  'M 960,160 Q 975,40 1000,8 Q 985,80 990,160',
                ].map((d, i) => (
                  <path key={i} d={d} />
                ))}
              </g>
            </svg>
          </div>

          {/* ── Call to Action Pill ── */}
          <div className="relative z-30 mt-6 mb-6 flex items-center justify-center">
            <button
              type="button"
              data-hover
              onClick={onStartDemo}
              className="bg-white text-black font-bold px-7 py-2.5 rounded-full text-xs hover:bg-white/90 transition-all duration-200 hover:scale-105 cursor-pointer shadow-2xl flex items-center gap-2 border-0"
            >
              <span>Start Debugging</span>
              <span className="text-black/60 font-semibold">→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
