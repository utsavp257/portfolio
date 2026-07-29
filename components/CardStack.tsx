'use client';
import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

/**
 * Scroll-pinned stacking cards (our own take on the Motion+ stacking-cards
 * effect): each card pins near the top of the viewport while the next one
 * slides over it; buried cards shrink slightly so the deck reads as a stack.
 */
function StackedCard({
  index,
  total,
  progress,
  children,
}: {
  index: number;
  total: number;
  progress: ReturnType<typeof useScroll>['scrollYProgress'];
  children: React.ReactNode;
}) {
  // Once this card is pinned, shrink it a touch for every card stacked on top.
  const start = (index + 1) / total;
  const buriedScale = 1 - (total - 1 - index) * 0.045;
  const scale = useTransform(progress, [start, 1], [1, buriedScale]);

  // The last card needs no runway — nothing slides over it, so extra height
  // would only leave a dead gap before the next section.
  const last = index === total - 1;
  return (
    <div
      className="sticky flex items-start justify-center"
      style={{ top: `${96 + index * 26}px`, height: last ? 'auto' : '82vh', paddingBottom: last ? 48 : 0 }}
    >
      <motion.div style={{ scale, transformOrigin: 'top center' }} className="w-full max-w-3xl">
        {children}
      </motion.div>
    </div>
  );
}

export default function CardStack({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });
  const items = React.Children.toArray(children);

  return (
    <div ref={containerRef} className="w-full">
      {items.map((child, i) => (
        <StackedCard key={i} index={i} total={items.length} progress={scrollYProgress}>
          {child}
        </StackedCard>
      ))}
    </div>
  );
}
