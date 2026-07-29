'use client';
import React, { useEffect } from 'react';
import { motion, MotionProps, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

/**
 * Card-flip modal: the tile morphs to the center of the screen (shared
 * layoutId) while rotating 180° — the tile front turns away and the "back of
 * the card", carrying the full details, comes into view. Closing flips it
 * back into the grid.
 */
export default function ProjectModal({
  project,
  onClose,
}: {
  project: any;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);

    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  if (!project || typeof window === 'undefined') return null;

  const MDiv = motion.div as React.ComponentType<
    React.HTMLAttributes<HTMLDivElement> & MotionProps
  >;

  const flipTransition = { type: 'spring', stiffness: 170, damping: 22, mass: 0.9 };

  const tagChips = (
    <>
      {project.tags.map((t: string) => (
        <span
          key={t}
          className="text-[11px] px-2 py-0.5 rounded-full bg-brand-red/[0.07] text-brand-black/80 border border-brand-red/15"
        >
          {t}
        </span>
      ))}
    </>
  );

  return createPortal(
    <AnimatePresence>
      <MDiv
        className="fixed inset-0 z-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ perspective: 1600 }}
      >
        {/* Backdrop */}
        <MDiv
          className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
        />

        {/* Flipping card: starts as the tile (front showing), lands as the
            details (back showing). */}
        <MDiv
          layoutId={`card-${project.id}`}
          layout
          onClick={(e) => e.stopPropagation()}
          className="relative z-10 max-w-3xl w-[92%]"
          style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}
          initial={{ rotateY: 180 }}
          animate={{ rotateY: 0 }}
          exit={{ rotateY: 180 }}
          transition={flipTransition}
        >
          {/* BACK of the card — the details (reads correctly once flipped) */}
          <div
            className="bg-white rounded-2xl p-8 shadow-2xl border border-black/10 flex flex-col gap-4 relative font-glacial"
            style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
          >
            <div className="text-2xl font-glacial-bold">{project.title}</div>

            <div className="flex gap-2 flex-wrap">{tagChips}</div>

            <div className="text-sm text-black/75 leading-relaxed">{project.description}</div>

            {project.note && (
              <div className="text-sm italic text-black/60">{project.note}</div>
            )}

            {(project.href || project.demo) && (
              <div className="mt-4 flex flex-wrap gap-3">
                {project.demo && (
                  <a
                    href={project.demo}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-xl bg-brand-red hover:bg-brand-red/90 transition-colors text-sm font-medium text-white"
                  >
                    Live demo →
                  </a>
                )}
                {project.href && (
                  <a
                    href={project.href}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-xl border border-black/15 hover:bg-black/5 transition-colors text-sm font-medium text-black/80"
                  >
                    View on GitHub →
                  </a>
                )}
              </div>
            )}

            <button
              onClick={onClose}
              aria-label="Close project details"
              className="absolute top-4 right-4 px-3 py-2 rounded-md border border-black/10 hover:bg-black/5"
            >
              ✕
            </button>
          </div>

          {/* FRONT of the card — a replica of the tile, visible during the
              first half of the flip, then hidden by backface culling. */}
          <div
            aria-hidden
            className="absolute inset-0 bg-white rounded-2xl p-6 border border-black/10 shadow-2xl flex flex-col font-glacial overflow-hidden"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <div className="text-lg font-glacial-bold leading-snug">
              {project.title}
              {project.demo && (
                <span className="ml-2 align-middle text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-brand-red text-white">
                  Live
                </span>
              )}
            </div>
            <div className="mt-3 flex gap-1.5 flex-wrap">{tagChips}</div>
            <div className="text-sm text-black/70 mt-4 leading-relaxed">{project.short}</div>
          </div>
        </MDiv>
      </MDiv>
    </AnimatePresence>,
    document.body
  );
}
