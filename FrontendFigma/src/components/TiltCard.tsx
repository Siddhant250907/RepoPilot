import React, { useRef, useState, useCallback } from 'react';

interface TiltCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'elevated' | 'dark' | 'none';
  maxTilt?: number; // default 2 degrees
}

export default function TiltCard({
  children,
  className = '',
  variant = 'primary',
  maxTilt = 2,
  style,
  ...props
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [coords, setCoords] = useState<{ x: number; y: number; active: boolean }>({
    x: 0.5,
    y: 0.5,
    active: false,
  });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      setCoords({ x, y, active: true });
    },
    []
  );

  const handleMouseLeave = useCallback(() => {
    setCoords(prev => ({ ...prev, active: false }));
  }, []);

  // Compute tilt angles: max ±2 degrees
  const tiltX = coords.active ? (coords.y - 0.5) * -maxTilt * 2 : 0;
  const tiltY = coords.active ? (coords.x - 0.5) * maxTilt * 2 : 0;

  // Variant class mapping
  const variantClass =
    variant === 'primary'
      ? 'glass'
      : variant === 'secondary'
      ? 'glass-secondary'
      : variant === 'elevated'
      ? 'glass-elevated'
      : variant === 'dark'
      ? 'glass-dark'
      : '';

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative tilt-card transition-all duration-300 ease-out ${variantClass} ${className}`}
      style={{
        transform: `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
        ...style,
      }}
      {...props}
    >
      {/* Specular glare following cursor */}
      {coords.active && (
        <div
          className="absolute inset-0 rounded-[inherit] pointer-events-none transition-opacity duration-300"
          style={{
            background: `radial-gradient(400px circle at ${coords.x * 100}% ${
              coords.y * 100
            }%, rgba(255,255,255,0.18), transparent 60%)`,
            zIndex: 1,
          }}
        />
      )}
      <div className="relative z-[2]">{children}</div>
    </div>
  );
}
