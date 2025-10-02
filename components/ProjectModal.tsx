'use client';
import React, { useEffect, useState } from 'react';
import { motion, MotionProps, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

export default function ProjectModal({
  project,
  onClose,
}: {
  project: any;
  onClose: () => void;
}) {
  const [showContent, setShowContent] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') handleClose();
    }
    document.addEventListener('keydown', onKey);

    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // small delay to allow layout animation first
    const timeout = setTimeout(() => setShowContent(true), 50);

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
      clearTimeout(timeout);
    };
  }, [onClose]);

  if (!project || typeof window === 'undefined') return null;

  const MDiv = motion.div as React.ComponentType<
    React.HTMLAttributes<HTMLDivElement> & MotionProps
  >;

  const layoutTransition = { type: 'spring', stiffness: 250, damping: 30, mass: 0.8 };
  const contentTransition = { duration: 0.16, ease: [0.3, 0.7, 0.25, 1] };

  const handleClose = () => {
    setClosing(true);
    setShowContent(false);

    // wait for content exit before closing modal
    setTimeout(() => {
      setClosing(false);
      onClose();
    }, 180); // match content transition duration
  };

  return createPortal(
    <AnimatePresence>
      <MDiv
        className="fixed inset-0 z-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
      >
        {/* Backdrop */}
        <MDiv
          className="absolute inset-0 bg-black/45"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
        />

        {/* LayoutId card */}
        <MDiv
          layoutId={`card-${project.id}`}
          layout
          onClick={(e) => e.stopPropagation()}
          className="relative z-10 max-w-3xl w-[92%] rounded-2xl overflow-hidden"
          style={{ willChange: 'transform' }}
          transition={layoutTransition}
        >
          {/* Inner content */}
          <AnimatePresence>
            {(showContent || closing) && (
              <MDiv
                key={project.id}
                className="bg-white rounded-2xl p-8 shadow-2xl border border-black/10 flex flex-col gap-4 relative"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={contentTransition}
              >
                {/* Title */}
                <MDiv
                  className="text-2xl font-bold"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={contentTransition}
                >
                  {project.title}
                </MDiv>

                {/* Tags */}
                <MDiv
                  className="flex gap-2 flex-wrap"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={contentTransition}
                >
                  {project.tags.map((t: string) => (
                    <span
                      key={t}
                      className="text-xs px-2 py-1 rounded-full bg-brand-red/10 text-brand-black border border-brand-red/20"
                    >
                      {t}
                    </span>
                  ))}
                </MDiv>

                {/* Long description */}
                <MDiv
                  className="text-sm text-black/75 leading-relaxed"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={contentTransition}
                >
                  {project.description}
                </MDiv>

                {/* GitHub link */}
                {project.href && (
                  <MDiv
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={contentTransition}
                  >
                    <a
                      href={project.href}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 px-4 py-2 rounded-xl bg-brand-red hover:bg-brand-red/90 transition-colors text-sm font-medium text-white"
                    >
                      View on GitHub →
                    </a>
                  </MDiv>
                )}

                {/* Close button */}
                <button
                  onClick={handleClose}
                  aria-label="Close project details"
                  className="absolute top-4 right-4 px-3 py-2 rounded-md border border-black/10 hover:bg-black/5"
                >
                  ✕
                </button>
              </MDiv>
            )}
          </AnimatePresence>
        </MDiv>
      </MDiv>
    </AnimatePresence>,
    document.body
  );
}