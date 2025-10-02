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
      className="relative w-full h-64 rounded-2xl cursor-pointer"
      initial={false}
      whileHover={{ y: -6, scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      style={{ perspective: 1200, willChange: 'transform' }}
      transition={layoutTransition}
    >
      <div className="absolute inset-0 rounded-2xl p-6 bg-white border border-black/10 shadow-soft flex flex-col">
        {/* Title */}
        <MDiv className="text-xl font-semibold" layout>
          {project.title}
        </MDiv>

        {/* Tags */}
        <MDiv className="mt-3 flex gap-2 flex-wrap" layout>
          {project.tags.map((t: string) => (
            <span
              key={t}
              className="text-xs px-2 py-1 rounded-full bg-brand-red/10 text-brand-black border border-brand-red/20"
            >
              {t}
            </span>
          ))}
        </MDiv>

        {/* Short description */}
        <MDiv className="text-sm text-black/70 mt-4" layout>
          {project.short}
        </MDiv>

        <MDiv className="mt-auto text-sm text-black/50" layout>
          Tap to expand →
        </MDiv>
      </div>
    </MDiv>
  );
}
