"use client";
import { useEffect, useRef } from "react";

interface SectionDividerProps {
  title: string;
  gap?: number; // spacing between repeated words
  multiplier?: number; // scale factor for scroll speed
  easing?: number; // how quickly it "catches up" (0.05 = slow, 0.2 = fast)
  id?: string; // for navigation targeting
}

export default function SectionDivider({
  title,
  gap = 40,
  multiplier = 1,
  easing = 0.08, // lower = smoother/slower, higher = snappier
  id,
}: SectionDividerProps) {
  const textRef = useRef<HTMLDivElement>(null);

  // Animation state kept in refs so we never trigger React re-renders.
  const offset = useRef(0);
  const target = useRef(0);
  const textWidth = useRef(0);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    const textEl = textRef.current;
    if (!textEl) return;

    // one copy length (we render two copies for a seamless loop)
    textWidth.current = textEl.scrollWidth / 2;

    let lastScrollTop = window.scrollY;

    // Writes the transform directly to the DOM — no setState, no re-render.
    const applyTransform = () => {
      let next = offset.current;
      if (textWidth.current > 0) {
        next = ((next % textWidth.current) + textWidth.current) % textWidth.current;
      }
      textEl.style.transform = `translate3d(-${next}px, -50%, 0)`;
    };

    const tick = () => {
      const diff = target.current - offset.current;
      offset.current += diff * easing;
      applyTransform();

      // Stop the loop once we've essentially caught up; it restarts on scroll.
      if (Math.abs(target.current - offset.current) < 0.1) {
        offset.current = target.current;
        applyTransform();
        rafId.current = null;
        return;
      }
      rafId.current = requestAnimationFrame(tick);
    };

    const ensureRunning = () => {
      if (rafId.current == null) rafId.current = requestAnimationFrame(tick);
    };

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const delta = scrollTop - lastScrollTop;
      lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
      target.current += delta * multiplier;
      ensureRunning();
    };

    const handleResize = () => {
      textWidth.current = textEl.scrollWidth / 2;
      applyTransform();
    };

    applyTransform();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      if (rafId.current != null) cancelAnimationFrame(rafId.current);
      rafId.current = null;
    };
  }, [multiplier, easing]);

  return (
    <div
      id={id}
      className="section-divider relative w-full h-24 overflow-hidden"
      style={{ backgroundColor: "#b91c1c" }}
    >
      {/* Infinite scrolling text — transformed via ref, no React re-render */}
      <div
        ref={textRef}
        className="divider-text absolute top-1/2 left-0 flex whitespace-nowrap text-5xl font-extrabold uppercase tracking-wider will-change-transform"
        style={{ transform: "translate3d(0, -50%, 0)", color: "#c4c4c4" }}
      >
        {/* Two copies for seamless looping */}
        <span className="flex">
          {Array.from({ length: 20 }).map((_, i) => (
            <span key={i} style={{ marginRight: gap }}>
              {title}
            </span>
          ))}
        </span>
        <span className="flex">
          {Array.from({ length: 20 }).map((_, i) => (
            <span key={i} style={{ marginRight: gap }}>
              {title}
            </span>
          ))}
        </span>
      </div>

      {/* Film grain (light + dark specks) — static overlays, rasterized once (cheap on mobile) */}
      <div className="divider-grain" aria-hidden />
      <div className="divider-speckle" aria-hidden />
      {/* Distressed brushy edge filter — applied to the text on desktop only (see globals.css) */}
      <svg width="0" height="0" aria-hidden focusable="false" style={{ position: "absolute" }}>
        <defs>
          <filter id="dividerBrush" x="-15%" y="-15%" width="130%" height="130%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="7" result="t" />
            <feDisplacementMap in="SourceGraphic" in2="t" scale="3.2" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>
    </div>
  );
}
