'use client';
import { useEffect, useRef } from 'react';


export default function CursorGlow() {
const ref = useRef<HTMLDivElement>(null);
useEffect(() => {
const el = ref.current!;
const move = (e: MouseEvent) => {
el.animate(
{ left: e.clientX - 150 + 'px', top: e.clientY - 150 + 'px' },
{ duration: 220, fill: 'forwards' }
);
};
window.addEventListener('mousemove', move);
return () => window.removeEventListener('mousemove', move);
}, []);
return (
<div ref={ref} style={{ width: 300, height: 300, borderRadius: '50%', filter: 'blur(80px)', opacity: 0.22 }} className="cursor-glow bg-brand-red/50" />
);
}