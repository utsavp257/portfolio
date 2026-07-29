'use client';
import { motion, useScroll, useSpring } from 'framer-motion';

/**
 * Page scroll progress bar — the scroll-linked example from motion.dev
 * (https://motion.dev/docs/react-scroll-animations), with their useSpring
 * smoothing:
 *
 *   const { scrollYProgress } = useScroll();
 *   const scaleX = useSpring(scrollYProgress, {
 *     stiffness: 100, damping: 30, restDelta: 0.001
 *   });
 *   return <motion.div style={{ scaleX, originX: 0 }} />
 */
export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 bg-brand-red z-[60]"
      style={{ scaleX, originX: 0 }}
    />
  );
}
