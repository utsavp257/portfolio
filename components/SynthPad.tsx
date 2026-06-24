'use client';

import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

/**
 * 3D XY synth pad — a "dot matrix" instrument.
 *
 * The cursor's position on a 3D grid of dots drives a WebAudio synth:
 *   - X (left→right) → pitch, quantized to a pentatonic scale (always sounds good)
 *   - Y (near→far)   → low-pass filter cutoff / brightness
 * Dots near the cursor rise, scale and glow red; the whole matrix pulses with the
 * live audio amplitude. Hover plays on desktop, drag plays on touch — both unlocked
 * by the first tap (autoplay policy). Native WebAudio + R3F, no extra dependencies.
 *
 * Audio chain inspired by standard subtractive-synth patches; original code.
 */

const GRID = 64; // dots per side
const EXTENT = 16; // world size of the dot field — larger than the frame so it fills the box
const COUNT = GRID * GRID;
const DOT_R = 0.035; // dot radius (spacing stays ~constant since GRID scales with EXTENT)
const PITCH_STEPS = 16; // pitch resolution, independent of grid density
const PENTA = [0, 3, 5, 7, 10]; // D MINOR pentatonic (D F G A C) — the "always-right" subset of the song's scale
const BASE_FREQ = 146.83; // D3 — "Highest in the Room" is in D natural minor (C = 130.81, C# = 138.59)

// ── SOUND KNOBS — tweak these, save, refresh the page to hear it ─────────────
// Tuned toward a "Mike Dean" vibe: D minor, detuned saws gliding between notes,
// soft-clip saturation, drenched in reverb + delay. Every value is safe to change alone.
const SATURATION = 2.2; // analog grit / soft-clip drive (his "Decapitator on everything"). 1 = clean, 4 = gritty
const HARMONY_STEPS = 2; // 2nd note, in SCALE steps above the root (always stays in key).
//                          2 = thirds/fourths (lush), 3 = the authentic "+5th" flavor, 0 = octave double
const HARMONY_MIX = 0.6; // loudness of the 2nd note vs the main note. 0 = off (one note), 1 = equal
const GLIDE = 0.09; // pitch slide between notes — Mike Dean's signature portamento.
//                     0.02 = snappy/instrument-like, 0.15 = very liquid/slidey. THIS is the big lever.
const DETUNE_CENTS = 11; // width of each note's twin saw. bigger = thicker/wider, 0 = plain
const SUB_MIX = 0.5; // sub-octave body underneath. 0 = thin, 0.8 = boomy
const VOLUME = 0.12; // overall loudness of a held note
const REVERB_WET = 0.55; // reverb amount — big & drenched like his outros (he runs ~50–60%)
const REVERB_SECONDS = 4.5; // reverb tail length (he uses 4–6s halls). longer = bigger room
const REVERB_DECAY = 2.2; // tail shape. higher = faster fade
const DELAY_TIME = 0.39; // echo spacing — ~1/4 note at the track's double-time feel
const DELAY_FEEDBACK = 0.45; // number of echo repeats (0–0.7; he rides ~50%)
const DELAY_MIX = 0.2; // echo loudness. 0 = no echo
// ─────────────────────────────────────────────────────────────────────────────

const GRAY = new THREE.Color('#b6b6be'); // soft resting dot — visible but quiet on white
const RED = new THREE.Color('#8a0a00'); // lit dot (gently bloomed below)

// ── LOOK KNOBS — visual feel, tweak + refresh ────────────────────────────────
const HDR_BOOST = 1.2; // how hard lit dots glow. kept low on white so red stays red, not white-hot
const TRAIL_DECAY = 3.0; // how fast the column wake fades (higher = shorter trail)
const TRAIL_GLOW = 0.7; // brightness of the trailing column wake
// ─────────────────────────────────────────────────────────────────────────────

// iOS routes WebAudio through the ringer channel, so the hardware silent switch
// mutes it. Detect iOS so we can re-route output through an <audio> media element
// (the media channel ignores the silent switch).
const IS_IOS =
  typeof navigator !== 'undefined' &&
  (/iP(hone|ad|od)/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

const worldX = (cx: number) => (cx / (GRID - 1) - 0.5) * EXTENT;
const worldZ = (cz: number) => (cz / (GRID - 1) - 0.5) * EXTENT;

function colToFreq(col: number) {
  const oct = Math.floor(col / PENTA.length);
  const step = col % PENTA.length;
  const semis = oct * 12 + PENTA[step];
  return BASE_FREQ * Math.pow(2, semis / 12);
}

type Audio = {
  ctx: AudioContext;
  osc1: OscillatorNode;
  osc2: OscillatorNode;
  osc3: OscillatorNode; // the harmony note (2nd voice)
  sub: OscillatorNode;
  filter: BiquadFilterNode;
  voice: GainNode;
  analyser: AnalyserNode;
  data: Uint8Array;
  mediaEl: HTMLAudioElement | null; // iOS-only: output sink that bypasses the silent switch
};

// short synthesized impulse response (decaying noise) for a smooth convolution reverb
function makeReverbIR(ctx: AudioContext, seconds: number, decay: number) {
  const rate = ctx.sampleRate;
  const len = Math.max(1, Math.floor(rate * seconds));
  const buf = ctx.createBuffer(2, len, rate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
  }
  return buf;
}

// tanh soft-clip curve — analog-style saturation that fattens the two saws
function makeSaturationCurve(drive: number) {
  const n = 1024;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    curve[i] = Math.tanh(drive * x);
  }
  return curve;
}

function createAudio(): Audio {
  const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new Ctor();

  // two slightly detuned saws (the main note) + a sine sub-oscillator for warmth/body
  const osc1 = ctx.createOscillator();
  osc1.type = 'sawtooth';
  const osc2 = ctx.createOscillator();
  osc2.type = 'sawtooth';
  osc2.detune.value = DETUNE_CENTS;

  // the harmony note — a 2nd voice a fixed interval above, so a held note is a chord
  const osc3 = ctx.createOscillator();
  osc3.type = 'sawtooth';
  osc3.detune.value = -DETUNE_CENTS; // detuned the other way for width
  const harmonyGain = ctx.createGain();
  harmonyGain.gain.value = HARMONY_MIX;

  const sub = ctx.createOscillator();
  sub.type = 'sine';
  const subGain = ctx.createGain();
  subGain.gain.value = SUB_MIX;

  // gentle vibrato/chorus shimmer
  const lfo = ctx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = 5.5;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 8; // cents of vibrato (expressive, vocal-ish)
  lfo.connect(lfoGain);
  lfoGain.connect(osc1.detune);
  lfoGain.connect(osc2.detune);
  lfoGain.connect(osc3.detune);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 800;
  filter.Q.value = 1.2; // low resonance → smooth, not buzzy

  const voice = ctx.createGain();
  voice.gain.value = 0;

  // analog-style saturation — fattens the saws before they hit the FX
  const shaper = ctx.createWaveShaper();
  shaper.curve = makeSaturationCurve(SATURATION);
  shaper.oversample = '2x';

  // polished space via a short convolution reverb
  const convolver = ctx.createConvolver();
  convolver.buffer = makeReverbIR(ctx, REVERB_SECONDS, REVERB_DECAY);
  const wet = ctx.createGain();
  wet.gain.value = REVERB_WET;

  // feedback delay → echoing repeats, the dubby Mike Dean tail
  const delay = ctx.createDelay(1.0);
  delay.delayTime.value = DELAY_TIME;
  const feedback = ctx.createGain();
  feedback.gain.value = DELAY_FEEDBACK;
  const delayWet = ctx.createGain();
  delayWet.gain.value = DELAY_MIX;
  delay.connect(feedback);
  feedback.connect(delay); // the repeat loop
  delay.connect(delayWet);

  const comp = ctx.createDynamicsCompressor();
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 256;
  const data = new Uint8Array(analyser.frequencyBinCount);

  osc1.connect(filter);
  osc2.connect(filter);
  osc3.connect(harmonyGain);
  harmonyGain.connect(filter);
  sub.connect(subGain);
  subGain.connect(filter);
  filter.connect(voice);
  voice.connect(shaper); // envelope → saturation
  shaper.connect(comp); // dry (saturated)
  shaper.connect(convolver);
  shaper.connect(delay); // feed the echoes
  delayWet.connect(comp); // echoes (dry path)
  delayWet.connect(convolver); // echoes also picked up by the reverb tail
  convolver.connect(wet);
  wet.connect(comp); // wet (reverb)
  comp.connect(analyser);

  // On iOS, send audio through a media element so it plays on the media channel
  // (immune to the ringer/silent switch). Elsewhere, the normal output is fine.
  let mediaEl: HTMLAudioElement | null = null;
  if (IS_IOS && typeof ctx.createMediaStreamDestination === 'function') {
    const dest = ctx.createMediaStreamDestination();
    comp.connect(dest);
    mediaEl = new Audio();
    mediaEl.srcObject = dest.stream;
    mediaEl.setAttribute('playsinline', '');
    mediaEl.play().catch(() => {});
  } else {
    comp.connect(ctx.destination);
  }

  osc1.start();
  osc2.start();
  osc3.start();
  sub.start();
  lfo.start();
  return { ctx, osc1, osc2, osc3, sub, filter, voice, analyser, data, mediaEl };
}

function Scene({ onStart, active }: { onStart: () => void; active: boolean }) {
  const { camera, gl } = useThree();
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const markerRef = useRef<THREE.Mesh>(null!);

  const audioRef = useRef<Audio | null>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tmpColor = useMemo(() => new THREE.Color(), []);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);
  const hitV = useMemo(() => new THREE.Vector3(), []);
  const geo = useMemo(() => new THREE.SphereGeometry(DOT_R, 12, 12), []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 0.5, metalness: 0.1, toneMapped: false }), []);

  const ndc = useRef(new THREE.Vector2(0, 0));
  const cursor = useRef({ gx: (GRID - 1) / 2, gz: (GRID - 1) / 2 });
  const engaged = useRef(false);
  const playing = useRef(false);
  const glow = useRef(0);
  const clock = useRef(0);
  const colTrail = useRef(new Float32Array(GRID)); // per-column wake, decays each frame
  const hoverDevice = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches,
    []
  );

  // aim the fixed camera at the grid
  useEffect(() => {
    camera.lookAt(0, 0.4, 0);
  }, [camera]);

  // initial dot colours
  useEffect(() => {
    const mesh = meshRef.current;
    for (let i = 0; i < COUNT; i++) mesh.setColorAt(i, GRAY);
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, []);

  const unlock = () => {
    if (!audioRef.current) {
      try {
        audioRef.current = createAudio();
        onStart();
      } catch {
        /* AudioContext unavailable — visuals still work */
      }
    }
    const a = audioRef.current;
    if (a) {
      if (a.ctx.state === 'suspended') a.ctx.resume().catch(() => {});
      // iOS may block the very first play() until a gesture — retry inside one.
      if (a.mediaEl && a.mediaEl.paused) a.mediaEl.play().catch(() => {});
    }
  };

  useEffect(() => {
    const el = gl.domElement;
    const setNdc = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      ndc.current.set(
        ((e.clientX - r.left) / r.width) * 2 - 1,
        -(((e.clientY - r.top) / r.height) * 2 - 1)
      );
    };
    const onDown = (e: PointerEvent) => {
      unlock();
      setNdc(e);
      engaged.current = true;
      playing.current = true;
    };
    const onMove = (e: PointerEvent) => {
      setNdc(e);
      engaged.current = true;
      if (hoverDevice && audioRef.current) playing.current = true;
    };
    const onUp = () => {
      if (!hoverDevice) playing.current = false;
    };
    const onLeave = () => {
      engaged.current = false;
      playing.current = false;
    };
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, [gl, hoverDevice]);

  // silence when scrolled out of view
  useEffect(() => {
    if (active) return;
    const a = audioRef.current;
    if (a) {
      playing.current = false;
      a.voice.gain.setTargetAtTime(0, a.ctx.currentTime, 0.05);
    }
  }, [active]);

  // teardown
  useEffect(() => {
    return () => {
      const a = audioRef.current;
      if (a) {
        try {
          a.osc1.stop();
          a.osc2.stop();
          if (a.mediaEl) {
            a.mediaEl.pause();
            a.mediaEl.srcObject = null;
          }
          a.ctx.close();
        } catch {
          /* already closed */
        }
        audioRef.current = null;
      }
      geo.dispose();
      mat.dispose();
    };
  }, [geo, mat]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    clock.current += dt;

    // cursor → grid coordinates
    raycaster.setFromCamera(ndc.current, camera);
    if (raycaster.ray.intersectPlane(plane, hitV)) {
      cursor.current.gx = THREE.MathUtils.clamp((hitV.x / EXTENT + 0.5) * (GRID - 1), 0, GRID - 1);
      cursor.current.gz = THREE.MathUtils.clamp((hitV.z / EXTENT + 0.5) * (GRID - 1), 0, GRID - 1);
    }
    glow.current += ((engaged.current ? 1 : 0) - glow.current) * Math.min(1, dt * 8);

    // drive the synth
    const a = audioRef.current;
    let rms = 0;
    if (a) {
      const t = a.ctx.currentTime;
      if (playing.current && active) {
        const col = Math.round((cursor.current.gx / (GRID - 1)) * PITCH_STEPS);
        const freq = colToFreq(col);
        a.osc1.frequency.setTargetAtTime(freq, t, GLIDE);
        a.osc2.frequency.setTargetAtTime(freq, t, GLIDE);
        a.osc3.frequency.setTargetAtTime(colToFreq(col + HARMONY_STEPS), t, GLIDE); // in-scale harmony note
        a.sub.frequency.setTargetAtTime(freq * 0.5, t, GLIDE); // sub an octave below
        const cutoff = 250 * Math.pow(20, cursor.current.gz / (GRID - 1)); // ~250→5000Hz
        a.filter.frequency.setTargetAtTime(cutoff, t, 0.04);
        a.voice.gain.setTargetAtTime(VOLUME, t, 0.04); // smoother attack
      } else {
        a.voice.gain.setTargetAtTime(0, t, 0.22); // smoother release
      }
      a.analyser.getByteTimeDomainData(a.data);
      let sum = 0;
      for (let k = 0; k < a.data.length; k++) {
        const v = (a.data[k] - 128) / 128;
        sum += v * v;
      }
      rms = Math.sqrt(sum / a.data.length);
    }

    // update the dot matrix
    const mesh = meshRef.current;
    const cgx = cursor.current.gx;
    const cgz = cursor.current.gz;
    const cwx = worldX(cgx);
    const cwz = worldZ(cgz);
    const activeCol = Math.round(cgx);

    // column wake: decay every column, then re-light the one under the cursor
    const trail = colTrail.current;
    const decay = Math.exp(-dt * TRAIL_DECAY);
    for (let c = 0; c < GRID; c++) trail[c] *= decay;
    if (glow.current > 0.01) trail[activeCol] = Math.max(trail[activeCol], glow.current);

    for (let i = 0; i < COUNT; i++) {
      const cx = i % GRID;
      const cz = Math.floor(i / GRID);
      const wx = worldX(cx);
      const wz = worldZ(cz);
      const dx = wx - cwx;
      const dz = wz - cwz;
      // world-space falloff → the lit blob stays the same physical size at any dot density
      const infl = Math.exp(-(dx * dx + dz * dz) * 0.7) * glow.current;
      const tcol = trail[cx] * TRAIL_GLOW; // fading wake on columns the cursor passed
      const h = infl * 1.6 + rms * infl * 0.9 + tcol * 0.3;
      const s = 1 + infl * 1.6 + rms * 0.3 * infl;
      dummy.position.set(wx, h, wz);
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      tmpColor.copy(GRAY).lerp(RED, Math.min(1, infl + tcol));
      // push strongly-lit dots past white so the bloom pass turns them into glow
      const hot = infl + tcol * 0.6;
      if (hot > 0.15) tmpColor.multiplyScalar(1 + hot * HDR_BOOST);
      mesh.setColorAt(i, tmpColor);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

    // cursor marker
    const mk = markerRef.current;
    mk.position.set(worldX(cgx), 1.6 * glow.current + 0.35, worldZ(cgz));
    mk.scale.setScalar(0.0001 + 0.6 * glow.current);
    (mk.material as THREE.MeshStandardMaterial).opacity = glow.current;
  });

  return (
    <>
      <ambientLight intensity={0.65} />
      <directionalLight position={[5, 10, 6]} intensity={0.95} />
      <instancedMesh ref={meshRef} args={[geo, mat, COUNT]} />
      <mesh ref={markerRef}>
        <sphereGeometry args={[0.18, 18, 18]} />
        <meshStandardMaterial color={RED} emissive={RED} emissiveIntensity={1.0} transparent toneMapped={false} />
      </mesh>
    </>
  );
}

export default function SynthPad({ compact = false }: { compact?: boolean }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={wrapRef}
      className={`relative w-full rounded-2xl overflow-hidden ${compact ? 'h-40' : 'h-[60vh]'}`}
      style={{
        background: 'radial-gradient(120% 120% at 50% 20%, #ffffff 0%, #f1f1f4 60%, #e6e6ea 100%)',
        touchAction: 'none',
      }}
    >
      <Canvas frameloop={inView ? 'always' : 'demand'} dpr={[1, 1.6]} camera={{ position: [0, 8, 8.5], fov: 32 }} gl={{ antialias: true }}>
        <Scene onStart={() => setStarted(true)} active={inView} />
        <EffectComposer>
          <Bloom intensity={0.45} luminanceThreshold={0.5} luminanceSmoothing={0.3} mipmapBlur />
        </EffectComposer>
      </Canvas>

      {!started && (
        <div className="absolute inset-0 grid place-items-center pointer-events-none">
          <div className="px-4 py-2 rounded-full bg-black/55 text-white text-sm font-glacial backdrop-blur-sm">
            ▶ tap &amp; move to play
          </div>
        </div>
      )}
    </div>
  );
}
