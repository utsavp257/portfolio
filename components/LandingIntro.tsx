'use client';
import { useEffect, useState } from 'react';
import { motion, MotionProps } from 'framer-motion';

type Props = { onFinish: () => void };

/**
 * LandingIntro: fade-in group + staged buttons
 * - Primary CTA appears quickly after fade starts.
 * - Clicking primary -> primary hides, top-right shows.
 * - Clicking top-right -> top-right hides, middle-left shows.
 * - Clicking middle-left -> onFinish() (enter portfolio).
 */
export default function LandingIntro({ onFinish }: Props) {
  const MDiv = motion.div as React.ComponentType<React.HTMLAttributes<HTMLDivElement> & MotionProps>;
  const LINES = ['Welcome', 'to my', 'portfolio'];

  // timing config
  const fadeDelay = 0.6; // seconds before text fade starts
  const fadeDuration = 1.8; // text fade duration
  const CTA_APPEAR_AFTER_FADE_START = 0.5; // when primary CTA appears relative to fade start

  const [showCTA, setShowCTA] = useState(false); // center CTA
  const [showTopRight, setShowTopRight] = useState(false); // top-right
  const [showMiddleLeft, setShowMiddleLeft] = useState(false); // middle-left

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // show primary CTA early (or immediately for reduced motion)
  useEffect(() => {
    if (prefersReducedMotion) {
      setShowCTA(true);
      return;
    }
    const earlyMs = Math.max(0, (fadeDelay + CTA_APPEAR_AFTER_FADE_START) * 1000);
    const t = window.setTimeout(() => setShowCTA(true), earlyMs);
    // fallback to ensure CTA visible after entire fade
    const fallback = window.setTimeout(() => setShowCTA(true), Math.round((fadeDelay + fadeDuration + 0.05) * 1000));
    return () => {
      clearTimeout(t);
      clearTimeout(fallback);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // handlers
  function handleOverlayClick() {
    // no-op: don't allow overlay to trigger entry
  }

  function handlePrimaryClick(e: React.MouseEvent) {
    e.stopPropagation();
    // reveal top-right and hide primary
    setShowTopRight(true);
    setShowCTA(false);
  }

  function handleTopRightClick(e: React.MouseEvent) {
    e.stopPropagation();
    // reveal middle-left and hide top-right
    setShowMiddleLeft(true);
    setShowTopRight(false);
  }

  function handleMiddleLeftClick(e: React.MouseEvent) {
    e.stopPropagation();
    onFinish();
  }

  // keyboard helper
  function onKeyActivate(cb: () => void) {
    return (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        cb();
      }
    };
  }

  return (
    <div
      className="landing-intro polka fixed inset-0 z-[9999] grid place-items-center"
      aria-label="Landing intro"
      onClick={handleOverlayClick}
    >
      {/* Inline SVG defs for brush/grain filters (kept lightweight) */}
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden focusable="false">
        <defs>
          <filter id="landingBrushRough" x="-40%" y="-40%" width="180%" height="180%">
            <feTurbulence type="fractalNoise" baseFrequency="0.58" numOctaves="2" stitchTiles="stitch" result="t1" />
            <feGaussianBlur in="t1" stdDeviation="0.66" result="t1b" />
            <feDisplacementMap in="SourceGraphic" in2="t1b" scale="5" xChannelSelector="R" yChannelSelector="G" result="d1" />
            <feTurbulence type="fractalNoise" baseFrequency="0.45" numOctaves="2" stitchTiles="stitch" result="t2" />
            <feGaussianBlur in="t2" stdDeviation="0.9" result="t2b" />
            <feDisplacementMap in="d1" in2="t2b" scale="3" xChannelSelector="R" yChannelSelector="G" result="d2" />
            <feGaussianBlur in="d2" stdDeviation="0.4" />
          </filter>

          <filter id="landingGrain" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" result="g" />
            <feColorMatrix in="g" type="saturate" values="0" result="g2" />
            <feBlend in="g2" in2="SourceGraphic" mode="multiply" />
          </filter>
        </defs>
      </svg>

       {/* Text block — single-group fade */}
       <MDiv
        className="landing-words pointer-events-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: fadeDelay, duration: prefersReducedMotion ? 0.01 : fadeDuration, ease: [0.22, 0.9, 0.3, 1] }}
         onAnimationComplete={() => {
          // no-op; CTA handled by timer to appear earlier
        }}
         onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
      >
        <div className="line line-1" style={{ height: '33.333%' }}>
          <div>
            <span className="landing-line-text" style={{ filter: 'url(#landingBrushRough)' }}>
              {LINES[0]}
            </span>
          </div>
        </div>

        <div className="line line-2" style={{ height: '33.333%' }}>
          <div>
            <span className="landing-line-text" style={{ filter: 'url(#landingBrushRough)' }}>
              {LINES[1]}
            </span>
          </div>
        </div>

        <div className="line line-3" style={{ height: '33.333%' }}>
          <div>
            <span className="landing-line-text" style={{ filter: 'url(#landingBrushRough)' }}>
              {LINES[2]}
            </span>
          </div>
        </div>
       </MDiv>

      {/* Primary CTA (center bottom) */}
      <div
        style={{
          position: 'absolute',
          bottom: '6%',
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          zIndex: 60,
        }}
      >
        <button
          onClick={handlePrimaryClick}
          onKeyDown={onKeyActivate(() => handlePrimaryClick(new MouseEvent('click') as unknown as React.MouseEvent))}
          aria-label="Primary enter button"
          className="enter-btn brand-btn"
          style={{
            background: 'var(--brand-red)',
            color: '#fff',
            padding: '0.8rem 1.4rem',
            borderRadius: 999,
            border: 'none',
            boxShadow: showCTA ? '0 18px 40px rgba(0,0,0,0.18)' : 'none',
            transform: showCTA ? 'translateY(0) scale(1)' : 'translateY(8px) scale(0.98)',
            opacity: showCTA ? 1 : 0,
            pointerEvents: showCTA ? 'auto' : 'none',
            transition: 'opacity 220ms ease, transform 220ms ease, box-shadow 200ms ease',
            fontWeight: 900,
            fontSize: '1rem',
          }}
        >
          Click to see my portfolio
        </button>
      </div>

      {/* Top-right button (appears after primary) */}
      <div
        style={{
          position: 'fixed',
          top: '18px',
          right: '18px',
          zIndex: 2000,
        }}
      >
        <button
          onClick={handleTopRightClick}
          onKeyDown={onKeyActivate(() => handleTopRightClick(new MouseEvent('click') as unknown as React.MouseEvent))}
          aria-label="Maybe try this one"
          className="top-right-btn brand-btn"
          style={{
            background: 'var(--brand-red)',
            color: '#fff',
            padding: '0.55rem 1rem',
            borderRadius: 999,
            border: 'none',
            boxShadow: showTopRight ? '0 10px 28px rgba(0,0,0,0.16)' : 'none',
            transform: showTopRight ? 'translateY(0) scale(1)' : 'translateY(-6px) scale(0.98)',
            opacity: showTopRight ? 1 : 0,
            pointerEvents: showTopRight ? 'auto' : 'none',
            transition: 'opacity 220ms ease, transform 220ms ease',
            fontWeight: 700,
            fontSize: '0.95rem',
          }}
        >
          maybe try this one?
        </button>
      </div>

      {/* Middle-left button (appears after top-right) */}
      <div
        style={{
          position: 'fixed',
          left: '18px',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 2000,
        }}
      >
        <button
          onClick={handleMiddleLeftClick}
          onKeyDown={onKeyActivate(() => handleMiddleLeftClick(new MouseEvent('click') as unknown as React.MouseEvent))}
          aria-label="Maybe this is the one"
          className="middle-left-btn brand-btn"
          style={{
            background: 'var(--brand-red)',
            color: '#fff',
            padding: '0.7rem 1.1rem',
            borderRadius: 12,
            border: 'none',
            boxShadow: showMiddleLeft ? '0 12px 36px rgba(0,0,0,0.18)' : 'none',
            transform: showMiddleLeft ? 'translateX(0) scale(1)' : 'translateX(-8px) scale(0.98)',
            opacity: showMiddleLeft ? 1 : 0,
            pointerEvents: showMiddleLeft ? 'auto' : 'none',
            transition: 'opacity 220ms ease, transform 220ms ease, box-shadow 200ms ease',
            fontWeight: 800,
            fontSize: '1rem',
            whiteSpace: 'nowrap',
          }}
        >
          maybe this is the one?
        </button>
      </div>

      {/* Grain overlay */}
      <div className="grain-layer pointer-events-none" aria-hidden />
    </div>
  );
}
