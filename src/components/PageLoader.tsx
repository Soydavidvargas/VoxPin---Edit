import React, { useEffect, useRef, useState } from 'react';

interface PageLoaderProps {
  onLoaded?: () => void;
  minDurationMs?: number;
}

export const PageLoader: React.FC<PageLoaderProps> = ({
  onLoaded,
  minDurationMs = 2200,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isDone, setIsDone] = useState(false);

  // Realistic deep space starfield simulation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;

    interface Star {
      x: number;
      y: number;
      size: number;
      baseAlpha: number;
      alpha: number;
      twinkleSpeed: number;
      twinkleOffset: number;
      vx: number;
      vy: number;
      glow: boolean;
    }

    let stars: Star[] = [];

    const initStars = (w: number, h: number) => {
      const count = Math.min(320, Math.floor((w * h) / 3200));
      stars = [];
      for (let i = 0; i < count; i++) {
        const rand = Math.random();
        const size = rand > 0.95 ? 2.2 : rand > 0.75 ? 1.5 : 0.9;
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          size,
          baseAlpha: Math.random() * 0.5 + 0.35,
          alpha: 1,
          twinkleSpeed: Math.random() * 0.025 + 0.008,
          twinkleOffset: Math.random() * Math.PI * 2,
          vx: (Math.random() - 0.5) * 0.06,
          vy: (Math.random() - 0.5) * 0.06,
          glow: size > 1.4,
        });
      }
    };

    const handleResize = () => {
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      initStars(width, height);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    let frame = 0;
    const render = () => {
      frame++;
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];

        star.x += star.vx;
        star.y += star.vy;

        if (star.x < 0) star.x = width;
        if (star.x > width) star.x = 0;
        if (star.y < 0) star.y = height;
        if (star.y > height) star.y = 0;

        const twinkle = Math.sin(frame * star.twinkleSpeed + star.twinkleOffset);
        star.alpha = Math.max(0.12, Math.min(1, star.baseAlpha + twinkle * 0.4));

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);

        if (star.glow) {
          ctx.shadowBlur = 5;
          ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
          ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
          ctx.fill();
          ctx.shadowBlur = 0;
        } else {
          ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Loading timing and fadeout
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFadingOut(true);
      const doneTimer = setTimeout(() => {
        setIsDone(true);
        if (onLoaded) onLoaded();
      }, 700);
      return () => clearTimeout(doneTimer);
    }, minDurationMs);

    return () => clearTimeout(timer);
  }, [minDurationMs, onLoaded]);

  if (isDone) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center overflow-hidden transition-opacity duration-700 ease-in-out ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      aria-label="Cargando VoxPin..."
    >
      <style>{`
        @keyframes diamondSpinY {
          0% {
            transform: rotateY(0deg);
          }
          100% {
            transform: rotateY(360deg);
          }
        }
        .animate-diamond-spin {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transform-origin: center center;
          perspective: 800px;
          transform-style: preserve-3d;
          backface-visibility: visible;
          animation: diamondSpinY 1.6s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
          will-change: transform;
        }
      `}</style>

      {/* Animated Deep Space Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block pointer-events-none"
      />

      {/* Center Logo: Spinning Solid White Diamond + VoxPin with white glow */}
      <div 
        className="relative z-10 flex items-center justify-center gap-4 sm:gap-6 md:gap-7 select-none px-4"
        style={{
          filter: 'drop-shadow(0 0 18px rgba(255,255,255,0.9)) drop-shadow(0 0 42px rgba(255,255,255,0.55)) drop-shadow(0 0 85px rgba(255,255,255,0.22))'
        }}
      >
        {/* Solid White Diamond spinning on its own axis */}
        <div className="relative flex items-center justify-center shrink-0 animate-diamond-spin">
          <svg
            viewBox="0 0 100 100"
            className="w-10 h-10 sm:w-14 sm:h-14 md:w-18 md:h-18 lg:w-20 lg:h-20 text-white fill-white"
          >
            <polygon points="50,6 94,50 50,94 6,50" />
          </svg>
        </div>

        {/* VoxPin Typography */}
        <div className="relative flex items-center">
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black font-sans text-white tracking-[0.02em] leading-none">
            VoxPin
          </h1>
        </div>
      </div>
    </div>
  );
};
