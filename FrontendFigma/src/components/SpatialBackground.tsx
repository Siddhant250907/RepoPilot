import { useEffect, useRef } from 'react';
import { ColorTheme } from './AppleHeroPedestal';

interface SpatialBackgroundProps {
  mouseX?: number;
  mouseY?: number;
  activeColor?: ColorTheme;
}

export default function SpatialBackground({
  mouseX = 0,
  mouseY = 0,
  activeColor = 'blue',
}: SpatialBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const onResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    // Subtle drifting ambient particles in deep space
    const particleCount = 32;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      z: Math.random() * 0.8 + 0.2,
      radius: Math.random() * 1.5 + 0.8,
      color: Math.random() > 0.6 ? '#FFFFFF' : Math.random() > 0.3 ? '#287FEA' : '#52D123',
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.15,
      alpha: Math.random() * 0.3 + 0.1,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        const px = p.x + mouseX * 20 * p.z;
        const py = p.y + mouseY * 16 * p.z;

        ctx.beginPath();
        ctx.arc(px, py, p.radius * p.z, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha * p.z;
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [mouseX, mouseY]);

  const spotlightColors: Record<ColorTheme, string> = {
    obsidian: 'rgba(255, 255, 255, 0.05)',
    blue: 'rgba(0, 113, 227, 0.12)',
    lime: 'rgba(82, 209, 35, 0.12)',
    titanium: 'rgba(142, 142, 147, 0.08)',
  };

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      {/* Pitch-black studio foundation */}
      <div className="absolute inset-0 bg-[#000000]" />

      {/* Subtle Apple studio overhead spotlight */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[750px] pointer-events-none transition-colors duration-700"
        style={{
          background: `radial-gradient(ellipse at 50% 0%, ${spotlightColors[activeColor]} 0%, rgba(0,0,0,0) 70%)`,
        }}
      />

      {/* Ambient soft glow blooms */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full pointer-events-none transition-transform duration-700 ease-out"
        style={{
          top: '20%',
          right: '-5%',
          background:
            'radial-gradient(circle, rgba(0, 113, 227, 0.06) 0%, transparent 70%)',
          filter: 'blur(90px)',
          transform: `translate(${mouseX * 20}px, ${mouseY * 16}px)`,
        }}
      />
      <div
        className="absolute w-[500px] h-[500px] rounded-full pointer-events-none transition-transform duration-700 ease-out"
        style={{
          bottom: '10%',
          left: '-5%',
          background:
            'radial-gradient(circle, rgba(82, 209, 35, 0.04) 0%, transparent 70%)',
          filter: 'blur(90px)',
          transform: `translate(${mouseX * -18}px, ${mouseY * -14}px)`,
        }}
      />

      {/* 3D Wireframe geometric rings */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20"
        style={{
          perspective: 1200,
          transform: `translate(${mouseX * 12}px, ${mouseY * 8}px)`,
        }}
      >
        <div
          className="absolute w-[900px] h-[900px] rounded-full border border-white/20 animate-spin-vslow"
          style={{
            transform: 'rotateX(72deg) rotateY(18deg)',
            borderStyle: 'dashed',
            borderWidth: '0.8px',
          }}
        />
        <div
          className="absolute w-[720px] h-[720px] rounded-full border border-white/10 animate-spin-r"
          style={{
            transform: 'rotateX(68deg) rotateY(-25deg)',
            borderStyle: 'dotted',
            borderWidth: '0.8px',
          }}
        />
      </div>

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
