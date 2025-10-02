'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

export default function IntroOverlay({ onFinish }: { onFinish: () => void }) {
  const [visible, setVisible] = useState(true);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const leftRef = useRef<HTMLDivElement | null>(null);
  const rightRef = useRef<HTMLDivElement | null>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function onMove(e: MouseEvent) {
      const w = window.innerWidth;
      const h = window.innerHeight;
      // normalized -1..1
      const nx = (e.clientX / w - 0.5) * 2;
      const ny = (e.clientY / h - 0.5) * 2;
      pointer.current = { x: nx, y: ny };
      if (rafRef.current == null) rafRef.current = requestAnimationFrame(updateFromPointer);
    }

    function onTouch(e: TouchEvent) {
      const t = e.touches[0];
      if (!t) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const nx = (t.clientX / w - 0.5) * 2;
      const ny = (t.clientY / h - 0.5) * 2;
      pointer.current = { x: nx, y: ny };
      if (rafRef.current == null) rafRef.current = requestAnimationFrame(updateFromPointer);
    }

    function updateFromPointer() {
      rafRef.current = null;
      const { x: nx, y: ny } = pointer.current;
      const leftEl = leftRef.current;
      const rightEl = rightRef.current;
      if (!leftEl || !rightEl) return;

      // increased movement for more responsiveness
      const maxX = 80; // px - much more responsive
      const maxY = 60; // px - much more responsive

      const leftX = clamp(nx * maxX, -maxX, maxX);
      const leftY = clamp(ny * maxY, -maxY, maxY);
      const rightX = clamp(nx * -maxX * 0.8, -maxX, maxX);
      const rightY = clamp(ny * maxY * 0.75, -maxY, maxY);

      // add rotation based on mouse movement for more dynamic effect
      const leftRot = clamp(nx * 8 - 10, -18, -2); // -2 to -18 degrees
      const rightRot = clamp(nx * 8 + 8, 2, 18);   // 2 to 18 degrees

      // add skew and scale based on mouse movement for elegant curves
      const leftSkew = clamp(nx * 4 + ny * 2, -8, 8); // -8 to 8 degrees
      const rightSkew = clamp(nx * -4 + ny * -2, -8, 8); // opposite skew
      
      const leftScaleX = clamp(1 + nx * 0.1, 0.8, 1.2); // dynamic width
      const leftScaleY = clamp(1 + ny * 0.15, 0.7, 1.3); // dynamic height
      const rightScaleX = clamp(1 + nx * -0.1, 0.8, 1.2); // opposite scale
      const rightScaleY = clamp(1 + ny * 0.15, 0.7, 1.3); // same height change

      // set CSS vars for position, rotation, skew, and scale
      leftEl.style.setProperty('--tx', `${leftX}px`);
      leftEl.style.setProperty('--ty', `${leftY}px`);
      leftEl.style.setProperty('--rot', `${leftRot}deg`);
      leftEl.style.setProperty('--skew', `${leftSkew}deg`);
      leftEl.style.setProperty('--scale-x', leftScaleX.toString());
      leftEl.style.setProperty('--scale-y', leftScaleY.toString());

      rightEl.style.setProperty('--tx', `${rightX}px`);
      rightEl.style.setProperty('--ty', `${rightY}px`);
      rightEl.style.setProperty('--rot', `${rightRot}deg`);
      rightEl.style.setProperty('--skew', `${rightSkew}deg`);
      rightEl.style.setProperty('--scale-x', rightScaleX.toString());
      rightEl.style.setProperty('--scale-y', rightScaleY.toString());
    }

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('touchmove', onTouch, { passive: true });

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchmove', onTouch);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function clamp(v: number, a: number, b: number) {
    return Math.max(a, Math.min(b, v));
  }

  function enter() {
    setVisible(false);
    setTimeout(onFinish, 2800); // allow exit animation to complete before showing main content
  }

  // framer-motion exit animations (slow, elegant fly out)
  const leftExit = {
    initial: { opacity: 1 },
    exit: { 
      x: -1800, 
      y: -600, 
      rotate: -65, 
      scale: 0.3,
      opacity: 0, 
      transition: { 
        duration: 2.2, 
        ease: [0.25, 0.46, 0.45, 0.94],
        delay: 0.1
      } 
    }
  };
  const rightExit = {
    initial: { opacity: 1 },
    exit: { 
      x: 1800, 
      y: 600, 
      rotate: 65, 
      scale: 0.3,
      opacity: 0, 
      transition: { 
        duration: 2.2, 
        ease: [0.25, 0.46, 0.45, 0.94],
        delay: 0.2
      } 
    }
  };
  const overlayVariant = {
    initial: { opacity: 1 },
    exit: { 
      opacity: 0, 
      transition: { 
        duration: 1.8, 
        ease: [0.25, 0.46, 0.45, 0.94],
        delay: 0.4
      } 
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          ref={containerRef}
          initial="initial"
          animate="initial"
          exit="exit"
          variants={overlayVariant}
        >
          <div className="intro-overlay" onClick={enter} role="dialog" aria-label="Intro overlay">
          <div className="intro-stripe-wrap" aria-hidden>
            <motion.div
              ref={leftRef}
              variants={leftExit}
              initial="initial"
              exit="exit"
            >
              <div className="stripe stripe-left" onClick={(e: React.MouseEvent) => e.stopPropagation()} />
            </motion.div>
            <motion.div
              ref={rightRef}
              variants={rightExit}
              initial="initial"
              exit="exit"
            >
              <div className="stripe stripe-right" onClick={(e: React.MouseEvent) => e.stopPropagation()} />
            </motion.div>
          </div>

          <div className="intro-content relative z-30 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-3 text-brand-black">
              Utsav <span className="text-brand-red">Patel</span>
            </h1>
            <p className="text-base md:text-lg max-w-lg mx-auto mb-5 text-black/75">
              I build ML systems, NLP pipelines and playful, animated web experiences.
            </p>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={enter}
                className="enter-btn bg-brand-red text-white px-5 py-2.5 rounded-full font-semibold enter-pulse"
                aria-label="Enter portfolio"
              >
                Enter Portfolio
              </button>
            </div>
            <p className="mt-3 text-sm opacity-80 text-black/70">or click anywhere</p>
          </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
