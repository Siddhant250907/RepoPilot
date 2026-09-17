import React from 'react';

interface TechnicalSurfaceProps {
  title?: string;
  badge?: string;
  badgeColor?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export default function TechnicalSurface({
  title,
  badge,
  badgeColor = '#287FEA',
  children,
  actions,
  className = '',
}: TechnicalSurfaceProps) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-[#0D0D0F] shadow-2xl overflow-hidden flex flex-col ${className}`}
      style={{
        boxShadow: '0 24px 64px -12px rgba(0,0,0,0.4)',
      }}
    >
      {/* Surface Header / Terminal Bar */}
      {(title || badge || actions) && (
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-[#141417]">
          <div className="flex items-center gap-3">
            {/* Window control dots */}
            <div className="flex items-center gap-1.5 opacity-60">
              <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
              <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
              <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
            </div>

            {title && (
              <span className="mono text-xs text-white/90 font-semibold tracking-tight">
                {title}
              </span>
            )}

            {badge && (
              <span
                className="mono text-[9px] px-2 py-0.5 rounded font-medium"
                style={{
                  backgroundColor: `${badgeColor}20`,
                  color: badgeColor,
                }}
              >
                {badge}
              </span>
            )}
          </div>

          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}

      {/* Surface Body */}
      <div className="p-5 text-white/90 font-mono text-xs leading-relaxed flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}
