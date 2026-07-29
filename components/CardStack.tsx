'use client';
import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, MotionValue } from 'framer-motion';

/**
 * Scroll-pinned stacking cards (our own take on the Motion+ stacking-cards
 * effect). Each card pins below the header while the next slides over it;
 * pinned cards peek their title strip above the card in front.
 *
 * The subtlety is the exit: a sticky element unpins when it hits its
 * containing block's bottom edge. If all cards share one containing block,
 * their bottoms align at the end and the deck visually collapses into a
 * single card. So every card gets its own absolutely-positioned lane whose
 * bottom is staggered by the deck offset — all cards then unpin at the same
 * scroll position and the assembled deck scrolls away intact.
 *
 * On small screens the cards render in plain flow: pinned decks and touch
 * scrolling don't mix.
 */
const PIN_TOP = 88; // px below the viewport top for the first card
const EDGE = 52; // px of title strip each buried card keeps visible
const ARRIVAL_VH = 36; // scroll runway between card arrivals
const DWELL_VH = 30; // how long the finished deck holds before releasing

function StackedCard({
  index,
  total,
  progress,
  desktop,
  children,
}: {
  index: number;
  total: number;
  progress: MotionValue<number>;
  desktop: boolean;
  children: React.ReactNode;
}) {
  // Shrink slightly for every card stacked on top.
  const start = (index + 1) / total;
  const buriedScale = 1 - (total - 1 - index) * 0.03;
  const scale = useTransform(progress, [start, 1], [1, buriedScale]);

  if (!desktop) {
    return (
      <div className={index > 0 ? 'mt-8' : ''}>
        <div className="mx-auto w-full max-w-3xl">{children}</div>
      </div>
    );
  }

  return (
    <div
      className="absolute inset-x-0"
      style={{
        top: `${index * ARRIVAL_VH}vh`,
        // staggered lane bottoms → every card unpins at the same moment
        bottom: `${(total - 1 - index) * EDGE}px`,
      }}
    >
      <div className="sticky" style={{ top: PIN_TOP + index * EDGE }}>
        <motion.div
          style={{ scale, transformOrigin: 'top center' }}
          className="mx-auto w-full max-w-3xl"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}

export default function CardStack({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [desktop, setDesktop] = useState(false);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start center', 'end end'],
  });

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const update = () => setDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const items = React.Children.toArray(children);
  const n = items.length;

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={
        desktop
          ? { height: `calc(${(n - 1) * ARRIVAL_VH + DWELL_VH}vh + 21rem + ${PIN_TOP + (n - 1) * EDGE}px)` }
          : undefined
      }
    >
      {items.map((child, i) => (
        <StackedCard key={i} index={i} total={n} progress={scrollYProgress} desktop={desktop}>
          {child}
        </StackedCard>
      ))}
    </div>
  );
}
