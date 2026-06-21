'use client';

import { Canvas, useThree, useFrame } from '@react-three/fiber';
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

const GRID = 24;
const EXTENT = 10;
const COUNT = GRID * GRID;
const DOT_R = 0.06;
const PITCH_STEPS = 16; // pitch resolution, independent of grid density
const PENTA = [0, 2, 4, 7, 9]; // major pentatonic
const BASE_FREQ = 130.81; // C3

const GRAY = new THREE.Color('#8a8a8a');
const RED = new THREE.Color('#ba0a00');

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

function createAudio(): Audio {
  const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new Ctor();

  // two slightly detuned saws + a sine sub-oscillator for warmth/body
  const osc1 = ctx.createOscillator();
  osc1.type = 'sawtooth';
  const osc2 = ctx.createOscillator();
  osc2.type = 'sawtooth';
  osc2.detune.value = 7;
  const sub = ctx.createOscillator();
  sub.type = 'sine';
  const subGain = ctx.createGain();
  subGain.gain.value = 0.55;

  // gentle vibrato/chorus shimmer
  const lfo = ctx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = 5;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 3; // cents
  lfo.connect(lfoGain);
  lfoGain.connect(osc1.detune);
  lfoGain.connect(osc2.detune);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 800;
  filter.Q.value = 1.2; // low resonance → smooth, not buzzy

  const voice = ctx.createGain();
  voice.gain.value = 0;

  // polished space via a short convolution reverb
  const convolver = ctx.createConvolver();
  convolver.buffer = makeReverbIR(ctx, 1.8, 2.4);
  const wet = ctx.createGain();
  wet.gain.value = 0.3;

  const comp = ctx.createDynamicsCompressor();
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 256;
  const data = new Uint8Array(analyser.frequencyBinCount);

  osc1.connect(filter);
  osc2.connect(filter);
  sub.connect(subGain);
  subGain.connect(filter);
  filter.connect(voice);
  voice.connect(comp); // dry
  voice.connect(convolver);
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
  sub.start();
  lfo.start();
  return { ctx, osc1, osc2, sub, filter, voice, analyser, data, mediaEl };
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
  const geo = useMemo(() => new THREE.SphereGeometry(DOT_R, 16, 16), []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 0.5, metalness: 0.1, toneMapped: false }), []);

  const ndc = useRef(new THREE.Vector2(0, 0));
  const cursor = useRef({ gx: (GRID - 1) / 2, gz: (GRID - 1) / 2 });
  const engaged = useRef(false);
  const playing = useRef(false);
  const glow = useRef(0);
  const clock = useRef(0);
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
        const freq = colToFreq(Math.round((cursor.current.gx / (GRID - 1)) * PITCH_STEPS));
        a.osc1.frequency.setTargetAtTime(freq, t, 0.05);
        a.osc2.frequency.setTargetAtTime(freq, t, 0.05);
        a.sub.frequency.setTargetAtTime(freq * 0.5, t, 0.05); // sub an octave below
        const cutoff = 250 * Math.pow(20, cursor.current.gz / (GRID - 1)); // ~250→5000Hz
        a.filter.frequency.setTargetAtTime(cutoff, t, 0.04);
        a.voice.gain.setTargetAtTime(0.14, t, 0.04); // smoother attack
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
    const time = clock.current;
    for (let i = 0; i < COUNT; i++) {
      const cx = i % GRID;
      const cz = Math.floor(i / GRID);
      const wx = worldX(cx);
      const wz = worldZ(cz);
      const dx = wx - cwx;
      const dz = wz - cwz;
      // world-space falloff → the lit blob stays the same physical size at any dot density
      const infl = Math.exp(-(dx * dx + dz * dz) * 0.7) * glow.current;
      const bob = Math.sin(time * 1.6 + cx * 0.5 + cz * 0.5) * 0.04;
      const h = infl * 1.6 + bob + rms * infl * 0.9;
      const s = 1 + infl * 1.6 + rms * 0.3 * infl;
      dummy.position.set(wx, h, wz);
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      const colHi = cx === activeCol ? 0.22 * glow.current : 0;
      tmpColor.copy(GRAY).lerp(RED, Math.min(1, infl + colHi));
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
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 6]} intensity={0.95} />
      <instancedMesh ref={meshRef} args={[geo, mat, COUNT]} />
      <mesh ref={markerRef}>
        <sphereGeometry args={[0.18, 18, 18]} />
        <meshStandardMaterial color={RED} emissive={RED} emissiveIntensity={0.6} transparent toneMapped={false} />
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
        background: 'radial-gradient(120% 120% at 50% 20%, #ffffff 0%, #efefef 60%, #e4e4e4 100%)',
        touchAction: 'none',
      }}
    >
      <Canvas frameloop={inView ? 'always' : 'demand'} dpr={[1, 1.6]} camera={{ position: [0, 8, 8.5], fov: 38 }} gl={{ antialias: true }}>
        <Scene onStart={() => setStarted(true)} active={inView} />
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
