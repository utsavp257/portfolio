'use client';
import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, MotionValue } from 'framer-motion';

/**
 * Scroll-pinned stacking cards (our own take on the Motion+ stacking-cards
 * effect). Every card is sticky *within the shared container*, so once a card
 * pins it stays pinned — later cards slide over it and buried cards shrink a
 * touch. The deck releases together when the section scrolls past.
 *
 * On small screens the cards render in plain flow: pinned decks and touch
 * scrolling don't mix well, and card heights vary too much on narrow layouts.
 */
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
  // Shrink once buried: from the moment the next card starts arriving until
  // the end of the section, ease down by 4% per card stacked on top.
  const start = (index + 1) / total;
  const buriedScale = 1 - (total - 1 - index) * 0.04;
  const scale = useTransform(progress, [start, 1], [1, buriedScale]);

  return (
    <div
      className={`md:sticky ${index > 0 ? 'mt-8 md:mt-[36vh]' : ''}`}
      style={desktop ? { top: 96 + index * 26 } : undefined}
    >
      <motion.div
        style={{ scale: desktop ? scale : 1, transformOrigin: 'top center' }}
        className="mx-auto w-full max-w-3xl"
      >
        {children}
      </motion.div>
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

  return (
    <div ref={containerRef} className="w-full md:pb-[26vh]">
      {items.map((child, i) => (
        <StackedCard
          key={i}
          index={i}
          total={items.length}
          progress={scrollYProgress}
          desktop={desktop}
        >
          {child}
        </StackedCard>
      ))}
    </div>
  );
}
