'use client';
import { useRef } from 'react';
import {
  MotionValue,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion';

/**
 * Magnifying dock navigation (our own take on the macOS-dock effect):
 * items scale up as the pointer approaches, driven by the distance between
 * the cursor and each item's center. Hidden on touch/small screens.
 */
const SECTIONS = [
  { id: 'about', label: 'About' },
  { id: 'education', label: 'Education' },
  { id: 'experience', label: 'Experience' },
  { id: 'skills', label: 'Skills' },
  { id: 'projects', label: 'Projects' },
  { id: 'contact', label: 'Contact' },
];

function DockItem({
  id,
  label,
  mouseX,
}: {
  id: string;
  label: string;
  mouseX: MotionValue<number>;
}) {
  const ref = useRef<HTMLAnchorElement>(null);

  const distance = useTransform(mouseX, (x) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return 999;
    return x - (rect.left + rect.width / 2);
  });
  const scale = useSpring(useTransform(distance, [-120, 0, 120], [1, 1.35, 1]), {
    stiffness: 300,
    damping: 20,
  });

  return (
    <motion.a
      ref={ref}
      href={`#${id}`}
      style={{ scale }}
      className="origin-bottom rounded-full px-3 py-1.5 font-glacial text-sm text-black/70 transition-colors hover:bg-brand-red hover:text-white"
    >
      {label}
    </motion.a>
  );
}

export default function DockNav() {
  const mouseX = useMotionValue(Infinity);

  return (
    <motion.nav
      aria-label="Section navigation"
      // x lives in framer's style so the centering survives the y animation
      // (framer owns the transform, so Tailwind's -translate-x-1/2 would be lost).
      // Note: this codebase redefines `.hidden` (opacity/pointer-events), so the
      // responsive hide must use `max-md:hidden` instead of `hidden md:flex`.
      style={{ x: '-50%' }}
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 1.2, type: 'spring', stiffness: 200, damping: 22 }}
      onMouseMove={(e) => mouseX.set(e.clientX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className="fixed bottom-5 left-1/2 z-[55] flex max-md:hidden items-end gap-1 rounded-full border border-black/10 bg-white/85 px-3 py-2 shadow-soft backdrop-blur-md"
    >
      {SECTIONS.map((s) => (
        <DockItem key={s.id} id={s.id} label={s.label} mouseX={mouseX} />
      ))}
    </motion.nav>
  );
}
