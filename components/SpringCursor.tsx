'use client';
import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

/**
 * Springy custom cursor (our own take on Motion+'s Cursor component): a
 * brand-red dot trails the pointer on a spring and swells into a ring over
 * interactive elements. Desktop pointers only — never rendered for touch.
 */
export default function SpringCursor() {
  const [enabled, setEnabled] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [visible, setVisible] = useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const springX = useSpring(x, { stiffness: 400, damping: 35 });
  const springY = useSpring(y, { stiffness: 400, damping: 35 });

  useEffect(() => {
    // Only take over on fine pointers (mouse/trackpad), respecting reduced motion.
    const fine = window.matchMedia('(pointer: fine)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!fine || reduced) return;
    setEnabled(true);

    const move = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setVisible(true);
      const target = e.target as Element | null;
      setHovering(
        Boolean(target?.closest('a, button, [role="button"], input, [data-cursor="grow"]')),
      );
    };
    const leave = () => setVisible(false);

    window.addEventListener('mousemove', move, { passive: true });
    document.documentElement.addEventListener('mouseleave', leave);
    return () => {
      window.removeEventListener('mousemove', move);
      document.documentElement.removeEventListener('mouseleave', leave);
    };
  }, [x, y]);

  if (!enabled) return null;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[70] rounded-full"
      style={{ x: springX, y: springY, translateX: '-50%', translateY: '-50%' }}
      animate={{
        width: hovering ? 44 : 12,
        height: hovering ? 44 : 12,
        opacity: visible ? 1 : 0,
        backgroundColor: hovering ? 'rgba(186, 10, 0, 0.12)' : 'rgba(186, 10, 0, 0.9)',
        border: hovering ? '1.5px solid rgba(186, 10, 0, 0.9)' : '1.5px solid rgba(186, 10, 0, 0)',
      }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    />
  );
}
