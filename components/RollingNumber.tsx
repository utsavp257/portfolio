'use client';
import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

/**
 * Slot-machine number roll (our own take on Motion+'s AnimateNumber).
 * Each digit is a vertical 0–9 strip that springs from 0 to its target when
 * the number scrolls into view; non-digit characters stay static.
 *
 * Cells are 1.4em with the glyph centered: Glacial Indifference's ink
 * overflows a 1em line box, so tight cells leak slivers of the neighboring
 * digits into the visible window. The extra headroom keeps neighbor ink
 * clear of the clip edge. Visibility is observed on the unclipped wrapper.
 */
const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
const CELL = 1.4; // em

function DigitColumn({ digit, on, delay }: { digit: string; on: boolean; delay: number }) {
  const target = DIGITS.indexOf(digit);
  return (
    <span
      className="inline-block overflow-hidden"
      style={{ height: `${CELL}em`, verticalAlign: '-0.42em' }}
      aria-hidden
    >
      <motion.span
        className="flex flex-col"
        initial={{ y: 0 }}
        animate={{ y: on ? `-${target * CELL}em` : 0 }}
        transition={{ type: 'spring', stiffness: 60, damping: 14, delay }}
      >
        {DIGITS.map((d) => (
          <span
            key={d}
            className="grid place-items-center"
            style={{ height: `${CELL}em`, lineHeight: 1 }}
          >
            {d}
          </span>
        ))}
      </motion.span>
    </span>
  );
}

export default function RollingNumber({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.9 });
  let digitIndex = 0;
  return (
    <span ref={ref} className={className} role="text" aria-label={value}>
      {value.split('').map((c, i) =>
        DIGITS.includes(c) ? (
          <DigitColumn key={i} digit={c} on={inView} delay={0.08 * digitIndex++} />
        ) : (
          <span key={i} aria-hidden>
            {c}
          </span>
        ),
      )}
    </span>
  );
}
