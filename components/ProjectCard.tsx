'use client';
import React from 'react';
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

  const layoutTransition = {
    type: 'spring',
    stiffness: 250,
    damping: 30,
    mass: 0.8,
  };

  return (
    <MDiv
      layoutId={`card-${project.id}`}
      layout
      onClick={() => onOpen(project)}
      className="group relative w-full h-full min-h-64 rounded-2xl cursor-pointer"
      initial={false}
      whileHover={{ y: -6, scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      style={{ perspective: 1200, willChange: 'transform' }}
      transition={layoutTransition}
    >
      <div className="absolute inset-0 rounded-2xl p-6 bg-white border border-black/10 shadow-soft group-hover:shadow-lift group-hover:border-brand-red/25 transition-[box-shadow,border-color] duration-300 flex flex-col font-glacial">
        {/* Title */}
        <MDiv className="text-lg font-glacial-bold leading-snug" layout>
          {project.title}
          {project.demo && (
            <span className="ml-2 align-middle text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-brand-red text-white">
              Live
            </span>
          )}
        </MDiv>

        {/* Tags */}
        <MDiv className="mt-3 flex gap-1.5 flex-wrap" layout>
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
