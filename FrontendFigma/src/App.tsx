import { useState, useEffect, useRef } from 'react';
import Landing from './pages/Landing';
import Demo from './pages/Demo';
import SpatialBackground from './components/SpatialBackground';
import { ColorTheme } from './components/AppleHeroPedestal';

export default function App() {
  const [page, setPage] = useState<'landing' | 'demo'>('landing');
  const [initialTask, setInitialTask] = useState<string>('');
  const [activeColor, setActiveColor] = useState<ColorTheme>('blue');
  const [cursorActive, setCursorActive] = useState(false);
  const [lerpedCoords, setLerpedCoords] = useState({ x: 0, y: 0 });

  const dotRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number>(0);

  const target = useRef({ x: -200, y: -200, normX: 0, normY: 0 });
  const current = useRef({ x: -200, y: -200, normX: 0, normY: 0 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const normX = (e.clientX / window.innerWidth - 0.5) * 2;
      const normY = (e.clientY / window.innerHeight - 0.5) * 2;
      target.current = { x: e.clientX, y: e.clientY, normX, normY };

      if (dotRef.current) {
        dotRef.current.style.left = `${e.clientX}px`;
        dotRef.current.style.top = `${e.clientY}px`;
      }
    };

    const lerp = (a: number, b: number, factor: number) => a + (b - a) * factor;

    const tick = () => {
      current.current.x = lerp(current.current.x, target.current.x, 0.14);
      current.current.y = lerp(current.current.y, target.current.y, 0.14);
      current.current.normX = lerp(current.current.normX, target.current.normX, 0.08);
      current.current.normY = lerp(current.current.normY, target.current.normY, 0.08);

      if (ringRef.current) {
        ringRef.current.style.left = `${current.current.x}px`;
        ringRef.current.style.top = `${current.current.y}px`;
      }

      setLerpedCoords({
        x: current.current.normX,
        y: current.current.normY,
      });

      rafRef.current = requestAnimationFrame(tick);
    };

    const onEnter = () => setCursorActive(true);
    const onLeave = () => setCursorActive(false);

    const bindHovers = () => {
      document.querySelectorAll<Element>('button, a, input, textarea, [data-hover]').forEach(el => {
        el.addEventListener('mouseenter', onEnter);
        el.addEventListener('mouseleave', onLeave);
      });
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    bindHovers();
    rafRef.current = requestAnimationFrame(tick);

    const mo = new MutationObserver(bindHovers);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(rafRef.current);
      mo.disconnect();
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-[#000000] text-[#F5F5F7] overflow-x-hidden selection:bg-[#0071E3]/30 selection:text-white">
      {/* Apple Studio Tactile Cursor */}
      <div ref={dotRef} className="cursor-dot hidden md:block" />
      <div ref={ringRef} className={`cursor-ring hidden md:block ${cursorActive ? 'active' : ''}`} />

      {/* Persistent Apple Studio Dark Spatial Background */}
      <SpatialBackground
        mouseX={lerpedCoords.x}
        mouseY={lerpedCoords.y}
        activeColor={activeColor}
      />

      {/* Spatial Page Container */}
      <div key={page} className="relative z-10 page-container page-enter">
        {page === 'landing' ? (
          <Landing
            onStartDemo={(preset?: string) => {
              if (preset !== undefined) setInitialTask(preset);
              window.scrollTo({ top: 0, behavior: 'smooth' });
              setPage('demo');
            }}
            mouseX={lerpedCoords.x}
            mouseY={lerpedCoords.y}
            activeColor={activeColor}
            onColorChange={setActiveColor}
          />
        ) : (
          <Demo
            onBack={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              setPage('landing');
            }}
            initialTask={initialTask}
            mouseX={lerpedCoords.x}
            mouseY={lerpedCoords.y}
            activeColor={activeColor}
          />
        )}
      </div>
    </div>
  );
}
