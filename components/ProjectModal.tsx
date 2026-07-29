'use client';
import React, { useEffect, useRef } from 'react';
import { motion, MotionProps, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

/**
 * App Store-style expand card (our own take on Motion UI's expand-card):
 * the grid tile morphs into a centred detail panel; the title and tags are
 * shared elements that travel with the surface, the rest of the body
 * cross-fades in once the morph lands, and closing restores focus to the
 * tile that opened it.
 */
export default function ProjectModal({
  project,
  onClose,
}: {
  project: any;
  onClose: () => void;
}) {
  const triggerRef = useRef<Element | null>(null);

  useEffect(() => {
    triggerRef.current = document.activeElement;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);

    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
      // restore focus to the tile that opened the panel
      if (triggerRef.current instanceof HTMLElement) triggerRef.current.focus();
    };
  }, [onClose]);

  if (!project || typeof window === 'undefined') return null;

  const MDiv = motion.div as React.ComponentType<
    React.HTMLAttributes<HTMLDivElement> & MotionProps
  >;
  const MA = motion.a as React.ComponentType<
    React.AnchorHTMLAttributes<HTMLAnchorElement> & MotionProps
  >;

  // No-overshoot tween: the surface glides open/closed without bouncing text.
  const layoutTransition = { layout: { duration: 0.5, ease: [0.65, 0, 0.35, 1] } };

  // Non-shared body: cross-fades in after the surface morph lands.
  const bodyList = {
    visible: { opacity: 1, transition: { delayChildren: 0.12, staggerChildren: 0.05 } },
    // vanish immediately on close so the surface can shrink back clean
    hidden: { opacity: 0, transition: { duration: 0.06 } },
  };
  const bodyItem = {
    visible: { opacity: 1, y: 0 },
    hidden: { opacity: 0, y: 8, transition: { duration: 0.06 } },
  };

  return createPortal(
    <AnimatePresence>
      <MDiv
        className="fixed inset-0 z-50 flex items-center justify-center"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.2, delay: 0.35 } }}
        onClick={onClose}
      >
        {/* Scrim */}
        <MDiv
          className="absolute inset-0 bg-black backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.72 }}
          exit={{ opacity: 0, transition: { duration: 0.35, delay: 0.05 } }}
          transition={{ duration: 0.18 }}
        />

        {/* Morphing surface */}
        <MDiv
          layoutId={`card-${project.id}`}
          layout
          role="dialog"
          aria-modal="true"
          aria-label={project.title}
          onClick={(e) => e.stopPropagation()}
          exit={{ opacity: 1 }} /* stay opaque while gliding home */
          className="relative z-10 max-w-3xl w-[92%] rounded-2xl bg-white p-8 shadow-2xl border border-black/10 font-glacial overflow-hidden"
          style={{ willChange: 'transform' }}
          transition={layoutTransition}
        >
          {/* Everything cross-fades in once the surface lands — no text flight */}
          <MDiv
            className="flex flex-col gap-4"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={bodyList}
          >
            <MDiv variants={bodyItem} className="pr-16 text-2xl font-glacial-bold leading-snug">
              {project.title}
              {project.demo && (
                <span className="ml-2 align-middle text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-brand-red text-white">
                  Live
                </span>
              )}
            </MDiv>
            <MDiv variants={bodyItem} className="flex gap-1.5 flex-wrap">
              {project.tags.map((t: string) => (
                <span
                  key={t}
                  className="text-[11px] px-2 py-0.5 rounded-full bg-brand-red/[0.07] text-brand-black/80 border border-brand-red/15"
                >
                  {t}
                </span>
              ))}
            </MDiv>
            <MDiv variants={bodyItem} className="text-sm text-black/75 leading-relaxed">
              {project.description}
            </MDiv>

            {project.note && (
              <MDiv variants={bodyItem} className="text-sm italic text-black/60">
                {project.note}
              </MDiv>
            )}

            {(project.href || project.demo) && (
              <MDiv variants={bodyItem} className="mt-2 flex flex-wrap gap-3">
                {project.demo && (
                  <MA
                    href={project.demo}
                    target="_blank"
                    rel="noreferrer"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.96 }}
                    className="px-4 py-2 rounded-xl bg-brand-red hover:bg-brand-red/90 transition-colors text-sm font-medium text-white"
                  >
                    Live demo →
                  </MA>
                )}
                {project.href && (
                  <MA
                    href={project.href}
                    target="_blank"
                    rel="noreferrer"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.96 }}
                    className="px-4 py-2 rounded-xl border border-black/15 hover:bg-black/5 transition-colors text-sm font-medium text-black/80"
                  >
                    View on GitHub →
                  </MA>
                )}
              </MDiv>
            )}
          </MDiv>

          <button
            onClick={onClose}
            aria-label="Close project details"
            className="absolute top-4 right-4 px-3 py-2 rounded-md border border-black/10 hover:bg-black/5"
          >
            ✕
          </button>
        </MDiv>
      </MDiv>
    </AnimatePresence>,
    document.body
  );
}
