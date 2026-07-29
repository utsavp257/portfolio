'use client';
import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, MotionValue } from 'framer-motion';

/**
 * Scroll-pinned stacking cards (our own take on the Motion+ stacking-cards
 * effect), on every screen size. Each card pins below the viewport top while
 * the next slides over it; buried cards keep an EDGE-high strip visible.
 *
 * Geometry is computed from *measured* card heights:
 * - each card gets an absolutely-positioned lane; lane bottoms are set so
 *   every card unpins at the same scroll position and the deck exits intact
 * - buried cards CLIP their height to h_front + EDGE·depth, so the assembled
 *   deck's bottoms align even when card heights differ wildly (phones) —
 *   on uniform-height desktops the clip is inert
 */
const PIN_TOP = 88; // px below the viewport top for the first card
const EDGE = 26; // px of card edge each buried card keeps visible
const ARRIVAL_VH = 58; // scroll runway between card arrivals
const DWELL_VH = 34; // how long the finished deck holds before releasing

function StackedCard({
  index,
  total,
  progress,
  fullH,
  effH,
  measureRef,
  children,
}: {
  index: number;
  total: number;
  progress: MotionValue<number>;
  fullH?: number;
  effH?: number;
  measureRef: (el: HTMLDivElement | null) => void;
  children: React.ReactNode;
}) {
  // Both effects trigger as the next card arrives and bury this one.
  const start = (index + 1) / total;
  const buriedScale = 1 - (total - 1 - index) * 0.03;
  const scale = useTransform(progress, [start, 1], [1, buriedScale]);
  const clipEnd = Math.min(start + 0.12, 1);
  const height = useTransform(
    progress,
    [start, clipEnd],
    [fullH ?? 0, effH ?? 0],
  );
  const clipped = fullH != null && effH != null && effH < fullH;

  return (
    <motion.div style={{ scale, transformOrigin: 'top center' }}>
      <motion.div
        className="mx-auto w-full max-w-3xl overflow-hidden rounded-2xl"
        style={clipped ? { height } : undefined}
      >
        <div ref={measureRef}>{children}</div>
      </motion.div>
    </motion.div>
  );
}

export default function CardStack({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [metrics, setMetrics] = useState<{ vh: number; heights: number[] } | null>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start center', 'end end'],
  });

  const items = React.Children.toArray(children);
  const n = items.length;

  useEffect(() => {
    const measure = () => {
      const heights = cardRefs.current.slice(0, n).map((el) => el?.offsetHeight ?? 0);
      if (heights.length !== n || heights.some((h) => h < 40)) return;
      setMetrics((prev) => {
        const vh = window.innerHeight;
        if (
          prev &&
          prev.vh === vh &&
          prev.heights.length === heights.length &&
          prev.heights.every((h, i) => Math.abs(h - heights[i]) < 2)
        ) {
          return prev;
        }
        return { vh, heights };
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    cardRefs.current.slice(0, n).forEach((el) => el && ro.observe(el));
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [n]);

  // Lane geometry. Buried card i clips to (front height + EDGE·depth) so the
  // assembled deck's bottoms align; lane bottoms equalize unpin thresholds.
  const pin = (i: number) => PIN_TOP + i * EDGE;
  let bottoms: number[] = items.map(() => 0);
  let effHeights: (number | undefined)[] = items.map(() => undefined);
  let containerH: number | undefined;
  if (metrics) {
    const hLast = metrics.heights[n - 1];
    effHeights = metrics.heights.map((h, i) =>
      Math.min(h, hLast + EDGE * (n - 1 - i)),
    );
    const reach = effHeights.map((h, i) => pin(i) + (h as number));
    const maxReach = Math.max(...reach);
    bottoms = reach.map((r) => maxReach - r);
    containerH = (((n - 1) * ARRIVAL_VH + DWELL_VH) / 100) * metrics.vh + maxReach;
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={containerH ? { height: containerH } : undefined}
    >
      {items.map((child, i) => (
        <div
          key={i}
          className={metrics ? 'absolute inset-x-0' : undefined}
          style={
            metrics
              ? { top: `${i * ARRIVAL_VH}vh`, bottom: bottoms[i] }
              : i > 0
                ? { marginTop: 32 }
                : undefined
          }
        >
          <div className={metrics ? 'sticky' : undefined} style={metrics ? { top: pin(i) } : undefined}>
            <StackedCard
              index={i}
              total={n}
              progress={scrollYProgress}
              fullH={metrics?.heights[i]}
              effH={effHeights[i] as number | undefined}
              measureRef={(el) => {
                cardRefs.current[i] = el;
              }}
            >
              {child}
            </StackedCard>
          </div>
        </div>
      ))}
    </div>
  );
}
