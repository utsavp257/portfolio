'use client';
import { useEffect, useState } from 'react';

/**
 * Cycling typewriter (our own take on Motion+'s Typewriter component):
 * types a phrase, holds, deletes it, and moves to the next, with a blinking
 * caret. Respects prefers-reduced-motion by showing the first phrase static.
 */
export default function Typewriter({
  phrases,
  typeMs = 55,
  deleteMs = 30,
  holdMs = 1600,
  className,
}: {
  phrases: string[];
  typeMs?: number;
  deleteMs?: number;
  holdMs?: number;
  className?: string;
}) {
  const [text, setText] = useState('');
  const [phase, setPhase] = useState<'typing' | 'holding' | 'deleting'>('typing');
  const [index, setIndex] = useState(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  useEffect(() => {
    if (reduced) return;
    const current = phrases[index % phrases.length];
    let t: ReturnType<typeof setTimeout>;

    if (phase === 'typing') {
      if (text.length < current.length) {
        t = setTimeout(() => setText(current.slice(0, text.length + 1)), typeMs);
      } else {
        t = setTimeout(() => setPhase('deleting'), holdMs);
      }
    } else if (phase === 'deleting') {
      if (text.length > 0) {
        t = setTimeout(() => setText(text.slice(0, -1)), deleteMs);
      } else {
        setIndex((i) => (i + 1) % phrases.length);
        setPhase('typing');
      }
    }
    return () => clearTimeout(t);
  }, [text, phase, index, phrases, typeMs, deleteMs, holdMs, reduced]);

  return (
    <span className={className}>
      {reduced ? phrases[0] : text}
      <span className="tw-caret text-brand-red" aria-hidden>
        |
      </span>
    </span>
  );
}
