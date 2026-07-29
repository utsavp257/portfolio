// app/page.tsx
'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import ProjectCard from '../components/ProjectCard';
import ProjectModal from '../components/ProjectModal';
import { projects } from '../data/projects';
import { motion, AnimatePresence, MotionProps } from 'framer-motion';
import LandingIntro from '../components/LandingIntro';
import SectionDivider from '../components/SectionDivider';
import SectionWrapper from "../components/SectionWrapper";
import ScrollProgress from '../components/ScrollProgress';

// Scroll-triggered reveal variants — the whileInView + staggered-children
// pattern from motion.dev (https://motion.dev/docs/react-scroll-animations,
// https://motion.dev/docs/react-animation#variants).
const list = {
  visible: {
    opacity: 1,
    transition: { when: 'beforeChildren', staggerChildren: 0.12 },
  },
  hidden: { opacity: 0 },
};
const item = {
  visible: { opacity: 1, y: 0 },
  hidden: { opacity: 0, y: 24 },
};

// Keep three.js out of the initial bundle / SSR pass — it loads only on the client
// when the hero is rendered.
const SynthPad = dynamic(() => import('../components/SynthPad'), {
  ssr: false,
  loading: () => <div className="w-full h-[60vh] rounded-2xl bg-black/5" />,
});

export default function Page() {
  const [active, setActive] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [introDone, setIntroDone] = useState(false);
  const MDiv = motion.div as React.ComponentType<
    React.HTMLAttributes<HTMLDivElement> & MotionProps
  >;

  // Notify on a visit, once per browser session (avoids re-pinging on every
  // re-render or client navigation within the same tab).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (sessionStorage.getItem('visit-tracked')) return;
      sessionStorage.setItem('visit-tracked', '1');
    } catch {
      // sessionStorage may be unavailable (private mode); still ping once.
    }
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: window.location.pathname }),
      keepalive: true,
    }).catch(() => {});
  }, []);

  function handleOpen(p: any) {
    setActive(p);
    setModalOpen(true);
  }
  function handleClose() {
    setModalOpen(false);
    setActive(null);
  }

  return (
    <main className="min-h-screen relative">

      {!introDone && <LandingIntro onFinish={() => setIntroDone(true)} />}

      {introDone && (
        <>
        <ScrollProgress />
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, ease: [0.2, 0.8, 0.2, 1] }}
        >
          {/* HERO */}
          <SectionDivider title="About Me" gap={60} multiplier={0.8} id="about" />
          <SectionWrapper>
          <header className="py-12">
            <div className="max-w-6xl mx-auto px-6">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h1 className="text-5xl md:text-6xl font-glacial-bold leading-tight">
                    Utsav <span className="text-brand-red">Patel</span>
                  </h1>
                  <p className="mt-4 text-lg text-black/70 max-w-prose font-glacial">
                    I build ML systems, NLP pipelines, quantitative models and playful, animated web experiences —
                    currently an MS in Data Science &amp; Quantitative Economics at Fordham, previously CS at IIT Palakkad.
                    Tap the dot grid and move around to play it — it&apos;s a little synth (left/right changes the note, near/far changes the tone).
                    It&apos;s polyphonic: use up to 5 fingers for chords on mobile, or right-click to hold notes on desktop.
                    Keep scrolling to see more.
                  </p>
                  <div className="mt-8 flex items-center gap-3 text-black/60 font-glacial">
                    <MDiv
                      animate={{ y: [0, 8, 0] }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                      aria-hidden
                      className="text-brand-red text-2xl leading-none"
                    >
                      ↓
                    </MDiv>
                    <span className="text-sm tracking-wide uppercase">Scroll to explore</span>
                  </div>
                </div>
                <SynthPad />
              </div>
            </div>
          </header>
          </SectionWrapper>

          {/* Content body - blurred when modal open */}
          <div className={modalOpen ? 'blurred' : ''}>
            {/* Education */}
            <SectionDivider title="Education" gap={60} multiplier={0.8} id="education" />
            <SectionWrapper>
              <MDiv
                className="flex flex-col items-center justify-center md:min-h-screen space-y-8 md:space-y-12"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.15 }}
                variants={list}
              >
                <MDiv 
                  variants={item}
                  className="rounded-2xl p-6 bg-white border border-black/10 shadow-soft hover:shadow-lift hover:border-brand-red/25 transition-[box-shadow,border-color] duration-300 w-full max-w-3xl cursor-pointer font-glacial"
                  whileHover={{ y: -6, scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 10, mass: 0.8 }}
                >
                  <h3 className="font-glacial-bold">Bachelor of Technology, Computer Science - IIT Palakkad</h3>
                  <p className="text-sm text-black/70">Jul 2021 – May 2025 • CGPA: 8.77</p>
                  <p className="mt-3 text-black/80">Relevant coursework: Data Structures and Algorithms, Artificial Intelligence, Design and Analysis of Algorithms, Natural Language
                  Processing, Cryptography, Big Data Lab, Computational Methods and Applications</p>
                </MDiv>
                <MDiv 
                  variants={item}
                  className="rounded-2xl p-6 bg-white border border-black/10 shadow-soft hover:shadow-lift hover:border-brand-red/25 transition-[box-shadow,border-color] duration-300 w-full max-w-3xl cursor-pointer font-glacial"
                  whileHover={{ y: -6, scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 250, damping: 30, mass: 0.8 }}
                >
                  <h3 className="font-glacial-bold">Master of Science, Data Science and Quant Economics - Fordham University</h3>
                  <p className="text-sm text-black/70">Aug 2025 – May 2027 • GPA: 4.0</p>
                  <p className="mt-3 text-black/80">Relevant coursework: Financial Econometrics, Microeconomics, Macroeconomics, Data Mining, Big Data</p>
                </MDiv>
              </MDiv>
            </SectionWrapper>

            <SectionDivider title="Experience" gap={60} multiplier={0.8} id="experience" />
            <SectionWrapper>
              <MDiv
                className="flex flex-col items-center justify-center md:min-h-screen space-y-8 md:space-y-12"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.15 }}
                variants={list}
              >
                <MDiv
                  variants={item}
                  className="rounded-2xl p-6 bg-white border border-black/10 shadow-soft hover:shadow-lift hover:border-brand-red/25 transition-[box-shadow,border-color] duration-300 w-full max-w-3xl cursor-pointer font-glacial"
                  whileHover={{ y: -6, scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 250, damping: 30, mass: 0.8 }}
                >
                  <h3 className="font-glacial-bold">Software Developer Intern — Stealth AI Startup, New York</h3>
                  <p className="text-sm text-black/70 mt-2">May 2026 – Present</p>
                  <ul className="list-disc ml-5 mt-3 space-y-2 text-sm text-black/80">
                    <li>Architected and built the platform layer for an AI-powered operational cognition system — FastAPI, async SQLModel, PostgreSQL/Neon, LangGraph, Inngest and GCP Cloud Run — with 10+ AI workflows and production services.</li>
                    <li>Designed the team&apos;s primary developer platform: an LLM-assisted operator CLI, automated OpenAPI→TypeScript codegen, real-time SSE event pipelines, CI contract validation, secret management, monitoring and production hardening.</li>
                    <li>Integrated 15+ external services (Google OAuth, Google Meet, Twilio, WhatsApp, Yelp AI, Resy, Merge.dev, Xero, NetSuite) behind authenticated real-time frontends serving 100+ users and ~500 daily notifications.</li>
                  </ul>
                </MDiv>
                <MDiv
                  variants={item}
                  className="rounded-2xl p-6 bg-white border border-black/10 shadow-soft hover:shadow-lift hover:border-brand-red/25 transition-[box-shadow,border-color] duration-300 w-full max-w-3xl cursor-pointer font-glacial"
                  whileHover={{ y: -6, scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 250, damping: 30, mass: 0.8 }}
                >
                  <h3 className="font-glacial-bold">AI Developer Intern — Stealth Startup, Palakkad</h3>
                  <p className="text-sm text-black/70 mt-2">Jan 2025 – Apr 2025</p>
                  <ul className="list-disc ml-5 mt-3 space-y-2 text-sm text-black/80">
                    <li>Developed an AI-powered customer engagement platform in Next.js, integrating WhatsApp Business APIs and enterprise databases for customer support and automated information access.</li>
                    <li>Built RAG pipelines, API integrations and agent-based workflows enabling scalable business process automation across systems.</li>
                  </ul>
                </MDiv>
                <MDiv
                  variants={item}
                  className="rounded-2xl p-6 bg-white border border-black/10 shadow-soft hover:shadow-lift hover:border-brand-red/25 transition-[box-shadow,border-color] duration-300 w-full max-w-3xl cursor-pointer font-glacial"
                  whileHover={{ y: -6, scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 250, damping: 30, mass: 0.8 }}
                >
                  <h3 className="font-glacial-bold">Software Developer Intern — E-Ring IT Solutions, Hyderabad</h3>
                  <p className="text-sm text-black/70 mt-2">Jun 2024 – Aug 2024</p>
                  <ul className="list-disc ml-5 mt-3 space-y-2 text-sm text-black/80">
                    <li>Modernized legacy enterprise software by converting ActiveX-based functionality into Classic ASP pages with spreadsheet-like interfaces.</li>
                    <li>Developed features in C#, ASP.NET and JavaScript, collaborating with QA to validate releases and support production applications.</li>
                  </ul>
                </MDiv>
                <MDiv
                  variants={item}
                  className="rounded-2xl p-6 bg-white border border-black/10 shadow-soft hover:shadow-lift hover:border-brand-red/25 transition-[box-shadow,border-color] duration-300 w-full max-w-3xl cursor-pointer font-glacial"
                  whileHover={{ y: -6, scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 250, damping: 30, mass: 0.8 }}
                >
                  <h3 className="font-glacial-bold">Beyond Work</h3>
                  <ul className="list-disc ml-5 mt-3 space-y-2 text-sm text-black/80">
                    <li>🏆 1st Place, GDG NYC Build with AI Hackathon — built an AI system to diagnose trees with potential illnesses.</li>
                    <li>Volunteered at Google Developer Group (GDG) NYC DevFest and Peace By Design: AI and Tech event.</li>
                    <li>Led a crew of cameramen for my college fest and its various events, as well as making promo movies with a team of editors.</li>
                  </ul>
                </MDiv>
              </MDiv>
            </SectionWrapper>

            {/* Skills */}
            <SectionDivider title="Skills" gap={60} multiplier={0.8} id="skills" />
            <SectionWrapper>
              <MDiv
                className="flex flex-col items-center justify-center md:min-h-screen space-y-8 md:space-y-12"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.15 }}
                variants={list}
              >
                <MDiv 
                  variants={item}
                  className="rounded-2xl p-6 bg-white border border-black/10 shadow-soft hover:shadow-lift hover:border-brand-red/25 transition-[box-shadow,border-color] duration-300 w-full max-w-3xl cursor-pointer font-glacial"
                  whileHover={{ y: -6, scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 250, damping: 30, mass: 0.8 }}
                >
                  <h4 className="font-glacial-bold">Languages</h4>
                  <p className="text-sm mt-2">C++, Python, Java, C, Rust, Dart, JavaScript, TypeScript, C#, SQL</p>
                </MDiv>
                <MDiv 
                  variants={item}
                  className="rounded-2xl p-6 bg-white border border-black/10 shadow-soft hover:shadow-lift hover:border-brand-red/25 transition-[box-shadow,border-color] duration-300 w-full max-w-3xl cursor-pointer font-glacial"
                  whileHover={{ y: -6, scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 250, damping: 30, mass: 0.8 }}
                >
                  <h4 className="font-glacial-bold">Frameworks & Tools</h4>
                  <p className="text-sm mt-2">Next.js, React, Node.js, Express.js, FastAPI, Flask, Django, .NET, Flutter, Tailwind CSS, Prisma, PostgreSQL, MongoDB, Docker, GCP, Tableau</p>
                </MDiv>
                <MDiv 
                  variants={item}
                  className="rounded-2xl p-6 bg-white border border-black/10 shadow-soft hover:shadow-lift hover:border-brand-red/25 transition-[box-shadow,border-color] duration-300 w-full max-w-3xl cursor-pointer font-glacial"
                  whileHover={{ y: -6, scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 250, damping: 30, mass: 0.8 }}
                >
                  <h4 className="font-glacial-bold">Things I&apos;m good at</h4>
                  <p className="text-sm mt-2">Machine Learning, NLP, LLMs &amp; agent workflows (PyTorch, TensorFlow, LangChain, LangGraph, RAG, fine-tuning), quantitative modeling (GARCH, VaR, econometrics), data analytics, DSA, full-stack development</p>
                </MDiv>
              </MDiv>
            </SectionWrapper>

            {/* Experience */}
            

            {/* Projects */}
            <SectionDivider title="Projects" gap={60} multiplier={0.8} id="projects" />
            <SectionWrapper>
              <MDiv
                className="grid md:grid-cols-3 gap-6"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.1 }}
                variants={list}
              >
                {projects.map((p) => (
                  <MDiv key={p.id} variants={item}>
                    <ProjectCard
                      project={p}
                      onOpen={handleOpen}
                      isModalOpen={modalOpen}
                      isActive={active?.id === p.id}
                    />
                  </MDiv>
                ))}
              </MDiv>
            </SectionWrapper>

            {/* Contact */}
            <SectionDivider title="Contact Me" gap={60} multiplier={0.8} id="contact" />
            <SectionWrapper>
              <h2 className="text-2xl font-glacial mb-4 text-center">Hit me up, I don't bite</h2>
                <div className="rounded-2xl p-8 bg-white border border-black/10 shadow-soft hover:shadow-lift hover:border-brand-red/25 transition-[box-shadow,border-color] duration-300 w-full max-w-3xl mx-auto font-glacial contact-links space-y-1">
                  <p>Email: <a href="mailto:patelutsav257@gmail.com" className="text-brand-red hover:underline">patelutsav257@gmail.com</a></p>
                  <p>LinkedIn: <a href="https://www.linkedin.com/in/utsav-patel-478664223/" target="_blank" rel="noopener noreferrer" className="text-brand-red hover:underline">utsav-patel</a></p>
                  <p>GitHub: <a href="https://github.com/utsavp257" target="_blank" rel="noopener noreferrer" className="text-brand-red hover:underline">github.com/utsavp257</a></p>
                  <p>Instagram: <a href="https://www.instagram.com/_utsxv.bt/" target="_blank" rel="noopener noreferrer" className="text-brand-red hover:underline">@_utsxv.bt</a></p>
                </div>
            </SectionWrapper>

            <footer className="py-12 mt-4 border-t border-black/10 text-center text-sm text-black/50 font-glacial tracking-wide">© {new Date().getFullYear()} Utsav Patel</footer>
          </div>
        </motion.div>
        </>
      )}

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && active && (
          <ProjectModal project={active} onClose={() => { setModalOpen(false); setActive(null); }} />
        )}
      </AnimatePresence>
    </main>
  );
}
