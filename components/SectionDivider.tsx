"use client";
import { useEffect, useRef, useState } from "react";

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
  const [offset, setOffset] = useState(0);
  const targetOffset = useRef(0);
  const [textWidth, setTextWidth] = useState(0);

  useEffect(() => {
    if (textRef.current) {
      setTextWidth(textRef.current.scrollWidth / 2); // one copy length
    }
  }, []);

  // Track scroll delta
  useEffect(() => {
    let lastScrollTop = window.scrollY;

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const delta = scrollTop - lastScrollTop;
      lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;

      targetOffset.current += delta * multiplier;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [multiplier]);

  // Smooth animation loop (catches up to targetOffset)
  useEffect(() => {
    let animationFrame: number;

    const animate = () => {
      setOffset((prev) => {
        let next = prev + (targetOffset.current - prev) * easing; // ease toward target
        if (textWidth > 0) {
          next = ((next % textWidth) + textWidth) % textWidth;
        }
        return next;
      });
      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [textWidth, easing]);

  return (
    <div
      id={id}
      className="relative w-full h-24 overflow-hidden"
      style={{
        backgroundColor: "#b91c1c",
        backgroundImage: `radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1px)`,
        backgroundSize: "20px 20px",
        filter: "url(#landingGrain)",
      }}
    >
      {/* Infinite scrolling text */}
      <div
        ref={textRef}
        className="absolute top-1/2 left-0 flex whitespace-nowrap text-5xl font-extrabold uppercase tracking-wider"
        style={{
          transform: `translateX(-${offset}px) translateY(-50%)`,
          filter: "url(#landingBrushRough)",
          color: "white",
        }}
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

      {/* Filters kept intact */}
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden focusable="false">
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
            <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" stitchTiles="stitch" result="g" />
            <feColorMatrix in="g" type="saturate" values="0" result="g2" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.15" />
            </feComponentTransfer>
            <feBlend in="g2" in2="SourceGraphic" mode="multiply" />
          </filter>
        </defs>
      </svg>
    </div>
  );
}
