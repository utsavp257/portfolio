'use client';
import React, { useEffect, useRef, useState } from 'react';
import { motion, MotionProps } from 'framer-motion';

export default function ProjectCard({
  project,
  onOpen,
  isModalOpen = false,
  isActive = false,
}: {
  project: any;
  onOpen: (p: any) => void;
  isModalOpen?: boolean;
  isActive?: boolean;
}) {
  const MDiv = motion.div as React.ComponentType<
    React.HTMLAttributes<HTMLDivElement> & MotionProps
  >;

  // The tile's content should only fade back in once the returning surface
  // has fully landed. The open flags flip off instantly on close, so we
  // remember "just closed" ourselves to time the delayed reveal.
  const open = isActive && isModalOpen;
  const wasOpen = useRef(false);
  const [justClosed, setJustClosed] = useState(false);
  useEffect(() => {
    if (open) {
      wasOpen.current = true;
      setJustClosed(false);
      return;
    }
    if (wasOpen.current) {
      wasOpen.current = false;
      setJustClosed(true);
      const t = setTimeout(() => setJustClosed(false), 1100);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Springy gestures, but a no-overshoot tween for the expand/collapse morph
  // so text never bounces.
  const layoutTransition = {
    y: { type: 'spring', stiffness: 250, damping: 30, mass: 0.8 },
    scale: { type: 'spring', stiffness: 250, damping: 30, mass: 0.8 },
    layout: { duration: 0.5, ease: [0.65, 0, 0.35, 1] },
  };

  return (
    <MDiv
      layoutId={`card-${project.id}`}
      layout
      role="button"
      tabIndex={0}
      aria-haspopup="dialog"
      onClick={() => onOpen(project)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(project);
        }
      }}
      className="group relative w-full h-full min-h-64 rounded-2xl cursor-pointer"
      initial={false}
      whileHover={{ y: -6, scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      style={{ perspective: 1200, willChange: 'transform' }}
      transition={layoutTransition}
    >
      {/* Tile hides while its panel is open; reappears once the surface lands */}
      <div
        className="absolute inset-0 rounded-2xl p-6 bg-white border border-black/10 shadow-soft group-hover:shadow-lift group-hover:border-brand-red/25 flex flex-col font-glacial"
        style={{
          opacity: open ? 0 : 1,
          // hide fast on open; fade in only after the surface has landed
          transition: justClosed
            ? 'opacity 0.35s ease 0.5s, box-shadow 0.3s, border-color 0.3s'
            : 'opacity 0.1s ease, box-shadow 0.3s, border-color 0.3s',
        }}
      >
        {/* Title — shared element, morphs into the panel heading */}
        <MDiv layout className="text-lg font-glacial-bold leading-snug">
          {project.title}
          {project.demo && (
            <span className="ml-2 align-middle text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-brand-red text-white">
              Live
            </span>
          )}
        </MDiv>

        {/* Tags — shared element, morphs in tandem */}
        <MDiv layout className="mt-3 flex gap-1.5 flex-wrap">
          {project.tags.map((t: string) => (
            <span
              key={t}
              className="text-[11px] px-2 py-0.5 rounded-full bg-brand-red/[0.07] text-brand-black/80 border border-brand-red/15"
            >
              {t}
            </span>
          ))}
        </MDiv>

        {/* Short description */}
        <MDiv className="text-sm text-black/70 mt-4 leading-relaxed" layout>
          {project.short}
        </MDiv>

        <MDiv
          className="mt-auto pt-4 text-sm text-black/45 group-hover:text-brand-red transition-colors duration-300"
          layout
        >
          Tap to expand{' '}
          <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">
            →
          </span>
        </MDiv>
      </div>
    </MDiv>
  );
}
