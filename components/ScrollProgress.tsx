'use client';
import { motion, useScroll } from 'framer-motion';

/**
 * Page scroll progress bar — the scroll-linked animation example from
 * motion.dev (https://motion.dev/docs/react-scroll-animations):
 *
 *   const { scrollYProgress } = useScroll();
 *   return <motion.div style={{ scaleX: scrollYProgress, originX: 0 }} />
 */
export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 bg-brand-red z-[60]"
      style={{ scaleX: scrollYProgress, originX: 0 }}
    />
  );
}
