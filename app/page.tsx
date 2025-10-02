// app/page.tsx
'use client';
import { useState } from 'react';
import ThreeHero from '../components/ThreeHero';
import ProjectCard from '../components/ProjectCard';
import ProjectModal from '../components/ProjectModal';
import { projects } from '../data/projects';
import { motion, AnimatePresence, MotionProps } from 'framer-motion';
import LandingIntro from '../components/LandingIntro';
import SectionDivider from '../components/SectionDivider';
import SectionWrapper from "../components/SectionWrapper";

export default function Page() {
  const [active, setActive] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [introDone, setIntroDone] = useState(false);
  const MDiv = motion.div as React.ComponentType<
    React.HTMLAttributes<HTMLDivElement> & MotionProps
  >;

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
                    I build ML systems, NLP pipelines and playful, animated web experiences.
                    Scroll to see more! I'm sorry this is yet to be done for mobile devices :(
                  </p>
                  <div className="mt-6 flex gap-3">
                    <a href="#projects" className="px-5 py-2 rounded-xl bg-brand-red text-white shadow-soft font-glacial">See Projects</a>
                    <a href="#contact" className="px-5 py-2 rounded-xl border border-brand-red text-brand-red font-glacial">Contact</a>
                  </div>
                </div>
                <ThreeHero />
              </div>
            </div>
          </header>
          </SectionWrapper>

          {/* Content body - blurred when modal open */}
          <div className={modalOpen ? 'blurred' : ''}>
            {/* Education */}
            <SectionDivider title="Education" gap={60} multiplier={0.8} id="education" />
            <SectionWrapper>
              <div className="flex flex-col items-center justify-center min-h-screen space-y-12">
                <MDiv 
                  className="rounded-2xl p-6 bg-white border border-black/10 shadow-soft w-full max-w-3xl cursor-pointer font-glacial"
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
                  className="rounded-2xl p-6 bg-white border border-black/10 shadow-soft w-full max-w-3xl cursor-pointer font-glacial"
                  whileHover={{ y: -6, scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 250, damping: 30, mass: 0.8 }}
                >
                  <h3 className="font-glacial-bold">Master of Science, Data Science - Fordham University</h3>
                  <p className="text-sm text-black/70">Aug 2025 – May 2027 • GPA: 4</p>
                  <p className="mt-3 text-black/80">Relevant coursework: Data Mining</p>
                </MDiv>
              </div>
            </SectionWrapper>

            <SectionDivider title="Experience" gap={60} multiplier={0.8} id="experience" />
            <SectionWrapper>
              <div className="flex flex-col items-center justify-center min-h-screen space-y-12">
                <MDiv 
                  className="rounded-2xl p-6 bg-white border border-black/10 shadow-soft w-full max-w-3xl cursor-pointer font-glacial"
                  whileHover={{ y: -6, scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 250, damping: 30, mass: 0.8 }}
                >
                  <h3 className="font-glacial-bold">Software Developer Intern — E-Ring IT Solutions</h3>
                  <p className="text-sm text-black/70 mt-2">Jun 2024 – Aug 2024</p>
                  <ul className="list-disc ml-5 mt-3 space-y-2 text-sm text-black/80">
                    <li>Converted ActiveX/legacy UI into Classic ASP pages with Excel-like interface.</li>
                    <li>Built a JS library to simulate spreadsheet components, collaborated with QA, and improved front-end performance.</li>
                  </ul>
                </MDiv>
                <MDiv 
                  className="rounded-2xl p-6 bg-white border border-black/10 shadow-soft w-full max-w-3xl cursor-pointer font-glacial"
                  whileHover={{ y: -6, scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 250, damping: 30, mass: 0.8 }}
                >
                  <h3 className="font-glacial-bold">Software Developer Intern — Stealth Startup</h3>
                  <p className="text-sm text-black/70 mt-2">Jan 2025 – Mar 2025</p>
                  <ul className="list-disc ml-5 mt-3 space-y-2 text-sm text-black/80">
                    <li>Helped build a part of the web app in Next.js that streamlines various conversation platforms with AI</li>
                  </ul>
                </MDiv>
                <MDiv 
                  className="rounded-2xl p-6 bg-white border border-black/10 shadow-soft w-full max-w-3xl cursor-pointer font-glacial"
                  whileHover={{ y: -6, scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 250, damping: 30, mass: 0.8 }}
                >
                  <h3 className="font-glacial-bold">Other Roles</h3>
                  <ul className="list-disc ml-5 mt-3 space-y-2 text-sm text-black/80">
                    <li>Volunteered at Google Developer Group(GDG) NYC DevFest and Peace By Design: AI and Tech event.</li>
                    <li>Led a crew of cameramen for my college fest and its various events, as well as making promo movies with a team of editors</li>
                  </ul>
                </MDiv>
              </div>
            </SectionWrapper>

            {/* Skills */}
            <SectionDivider title="Skills" gap={60} multiplier={0.8} id="skills" />
            <SectionWrapper>
              <div className="flex flex-col items-center justify-center min-h-screen space-y-12">
                <MDiv 
                  className="rounded-2xl p-6 bg-white border border-black/10 shadow-soft w-full max-w-3xl cursor-pointer font-glacial"
                  whileHover={{ y: -6, scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 250, damping: 30, mass: 0.8 }}
                >
                  <h4 className="font-glacial-bold">Languages</h4>
                  <p className="text-sm mt-2">C++, Python, C, JavaScript, TypeScript, C#, SQL, Java</p>
                </MDiv>
                <MDiv 
                  className="rounded-2xl p-6 bg-white border border-black/10 shadow-soft w-full max-w-3xl cursor-pointer font-glacial"
                  whileHover={{ y: -6, scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 250, damping: 30, mass: 0.8 }}
                >
                  <h4 className="font-glacial-bold">Frameworks & Tools</h4>
                  <p className="text-sm mt-2">Next.js, Express.js, React, Node, Tailwind, PyTorch, TensorFlow, MongoDB, Docker</p>
                </MDiv>
                <MDiv 
                  className="rounded-2xl p-6 bg-white border border-black/10 shadow-soft w-full max-w-3xl cursor-pointer font-glacial"
                  whileHover={{ y: -6, scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 250, damping: 30, mass: 0.8 }}
                >
                  <h4 className="font-glacial-bold">Things I'm good at</h4>
                  <p className="text-sm mt-2">NLP, Fine-grained NER, Machine Learning, LLMs, DSA, Algorithms, GitHub, Database Management, Full Stack Development</p>
                </MDiv>
              </div>
            </SectionWrapper>

            {/* Experience */}
            

            {/* Projects */}
            <SectionDivider title="Projects" gap={60} multiplier={0.8} id="projects" />
            <SectionWrapper>
              <div className="grid md:grid-cols-3 gap-6">
                {projects.map((p) => (
                  <ProjectCard 
                    key={p.id} 
                    project={p} 
                    onOpen={handleOpen} 
                    isModalOpen={modalOpen}
                    isActive={active?.id === p.id}
                  />
                ))}
              </div>
            </SectionWrapper>

            {/* Contact */}
            <SectionDivider title="Contact Me" gap={60} multiplier={0.8} id="contact" />
            <SectionWrapper>
              <h2 className="text-2xl font-glacial mb-4 text-center">Hit me up, I don't bite</h2>
                <div className="rounded-2xl p-8 bg-white border border-black/10 shadow-soft w-full max-w-3xl mx-auto font-glacial">
                  <p>Email: <a href="mailto:patelutsav257@gmail.com" className="text-brand-red hover:underline">patelutsav257@gmail.com</a></p>
                  <p>GitHub: <a href="https://github.com/utsavp257" target="_blank" rel="noopener noreferrer" className="text-brand-red hover:underline">github.com/utsavp257</a></p> 
                  <p>Instagram: <a href="https://www.instagram.com/_utsxv.bt/" target="_blank" rel="noopener noreferrer" className="text-brand-red hover:underline">@_utsxv.bt</a></p>
                </div>
            </SectionWrapper>

            <footer className="py-12 text-center text-sm text-black/60 font-glacial">© {new Date().getFullYear()} Utsav Patel</footer>
          </div>
        </motion.div>
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
