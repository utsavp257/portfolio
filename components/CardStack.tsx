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
 * - the deck presents ONE baseline card height (its shortest card). Any card
 *   taller than that clips down to the baseline once something sits on top of
 *   it, so an over-long card can't hang below the deck. The clip is purely
 *   visual — the content stays in the DOM and renders in full whenever the
 *   card is the front one.
 */
const PIN_TOP = 88; // px below the viewport top for the first card
const EDGE = 26; // px of card edge each buried card keeps visible
const ARRIVAL_VH = 58; // scroll runway between card arrivals
const DWELL_VH = 34; // how long the finished deck holds before releasing
// Floor for the baseline: a buried card must still reach the next card's top
// (EDGE) with room for the 16px corner radius, even after the depth scale.
const DECK_MIN_H = 120;

function StackedCard({
  index,
  total,
  progress,
  fullH,
  effH,
  coverTop,
  coverLane,
  vh,
  scrollRange,
  measureRef,
  children,
}: {
  index: number;
  total: number;
  progress: MotionValue<number>;
  fullH?: number;
  effH?: number;
  coverTop?: number; // viewport top the covering card settles at
  coverLane?: number; // covering card's lane offset from the deck top, px
  vh?: number;
  scrollRange?: number; // px of scroll the progress 0..1 spans
  measureRef: (el: HTMLDivElement | null) => void;
  children: React.ReactNode;
}) {
  // Both effects trigger as the next card arrives and bury this one.
  const start = (index + 1) / total;
  const buriedScale = 1 - (total - 1 - index) * 0.03;
  const scale = useTransform(progress, [start, 1], [1, buriedScale]);
  // Follow the covering card down instead of guessing a scroll window: this
  // card may shrink only as far as that card's top edge, so the trim is always
  // hidden behind it — never a cut edge with bare background under it, and
  // never a tail hanging below the deck.
  const pinSelf = PIN_TOP + index * EDGE;
  const height = useTransform(progress, (p) => {
    if (fullH == null || effH == null) return fullH ?? 0;
    if (coverTop == null || coverLane == null || vh == null || scrollRange == null) {
      return fullH;
    }
    const coverNow = Math.max(coverTop, coverLane + vh / 2 - p * scrollRange);
    // divide by the deepest scale so the depth shrink can't lift the edge clear
    const needed = (coverNow - pinSelf) / buriedScale;
    return Math.min(fullH, Math.max(effH, needed));
  });
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

  // Lane geometry. Every card that gets buried trims to one baseline height, so
  // no card outruns the deck; lane bottoms equalize unpin thresholds.
  const pin = (i: number) => PIN_TOP + i * EDGE;
  let bottoms: number[] = items.map(() => 0);
  let effHeights: (number | undefined)[] = items.map(() => undefined);
  let coverLanes: number[] = items.map(() => 0);
  let scrollRange: number | undefined;
  let containerH: number | undefined;
  if (metrics) {
    const base = Math.max(DECK_MIN_H, Math.min(...metrics.heights));
    // The last card is never covered, so it always keeps its natural height.
    effHeights = metrics.heights.map((h, i) =>
      i === n - 1 ? h : Math.min(h, base),
    );
    const reach = effHeights.map((h, i) => pin(i) + (h as number));
    const maxReach = Math.max(...reach);
    bottoms = reach.map((r) => maxReach - r);
    containerH = (((n - 1) * ARRIVAL_VH + DWELL_VH) / 100) * metrics.vh + maxReach;
    // useScroll runs 'start center' -> 'end end', so progress spans this much
    // scroll; a card's lane sits ARRIVAL_VH below the one before it.
    scrollRange = containerH - metrics.vh / 2;
    coverLanes = items.map((_, i) => ((i + 1) * ARRIVAL_VH / 100) * metrics.vh);
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
              coverTop={pin(i + 1)}
              coverLane={metrics ? coverLanes[i] : undefined}
              vh={metrics?.vh}
              scrollRange={scrollRange}
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
