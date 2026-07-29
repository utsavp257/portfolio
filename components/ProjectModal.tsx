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
  const MSpan = motion.span as React.ComponentType<
    React.HTMLAttributes<HTMLSpanElement> & MotionProps
  >;
  const MA = motion.a as React.ComponentType<
    React.AnchorHTMLAttributes<HTMLAnchorElement> & MotionProps
  >;
  // Staggered-children entrance for the modal content (motion.dev variants pattern)
  const modalList = {
    visible: { opacity: 1, transition: { staggerChildren: 0.055 } },
    hidden: { opacity: 0 },
  };
  const modalItem = {
    visible: { opacity: 1, y: 0 },
    hidden: { opacity: 0, y: 8 },
  };
  const chipPop = {
    visible: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 380, damping: 20 } },
    hidden: { opacity: 0, scale: 0.5 },
  };

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
          className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
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
                className="bg-white rounded-2xl p-8 shadow-2xl border border-black/10 flex flex-col gap-4 relative font-glacial"
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={modalList}
                transition={contentTransition}
              >
                {/* Title */}
                <MDiv
                  className="text-2xl font-glacial-bold"
                  variants={modalItem}
                >
                  {project.title}
                </MDiv>

                {/* Tags */}
                <MDiv
                  className="flex gap-2 flex-wrap"
                  variants={modalItem}
                >
                  {project.tags.map((t: string) => (
                    <MSpan
                      key={t}
                      variants={chipPop}
                      className="text-[11px] px-2 py-0.5 rounded-full bg-brand-red/[0.07] text-brand-black/80 border border-brand-red/15"
                    >
                      {t}
                    </MSpan>
                  ))}
                </MDiv>

                {/* Long description */}
                <MDiv
                  className="text-sm text-black/75 leading-relaxed"
                  variants={modalItem}
                >
                  {project.description}
                </MDiv>

                {/* Publication note */}
                {project.note && (
                  <MDiv
                    className="text-sm italic text-black/60"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={contentTransition}
                  >
                    {project.note}
                  </MDiv>
                )}

                {/* Links */}
                {(project.href || project.demo) && (
                  <MDiv
                    className="mt-4 flex flex-wrap gap-3"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={contentTransition}
                  >
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