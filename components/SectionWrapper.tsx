"use client";
import { useEffect, useRef, useState } from "react";

export default function SectionWrapper({ id, children }: { id?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [minHeight, setMinHeight] = useState("100vh");

  useEffect(() => {
    function updateHeight() {
      if (!ref.current) return;
      const contentHeight = ref.current.scrollHeight;
      const screenHeight = window.innerHeight;
      
      // how many screen-length multiples are needed
      const multiples = Math.ceil(contentHeight / screenHeight);
      setMinHeight(`${(multiples * 100)-12.5}vh`);
    }

    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  return (
    <section
      id={id}
      ref={ref}
      className="w-full flex items-center justify-center"
      style={{ minHeight }}
    >
      <div className="max-w-6xl w-full px-6">{children}</div>
    </section>
  );
}
