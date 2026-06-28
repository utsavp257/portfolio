'use client';

import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

/**
 * 3D XY synth pad — a "dot matrix" instrument.
 *
 * Each touch point's position on a 3D grid of dots drives a WebAudio synth voice:
 *   - X (left→right) → pitch, quantized to a pentatonic scale (always sounds good)
 *   - Y (near→far)   → low-pass filter cutoff / brightness
 * It is polyphonic: up to MAX_VOICES notes can sound at once.
 *   - On phones, play chords with multiple fingers (multi-touch).
 *   - On desktop, hover to play one note and RIGHT-CLICK to latch (hold) a note in
 *     place, so you can stack several held notes and keep playing over them.
 * Dots near a touch point rise, scale and glow red; the whole matrix pulses with the
 * live audio amplitude. Everything is unlocked by the first tap (autoplay policy).
 * Native WebAudio + R3F, no extra dependencies.
 *
 * Audio chain inspired by standard subtractive-synth patches; original code.
 */

const MAX_VOICES = 5; // polyphony cap — max simultaneous notes (fingers + latched)
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

// one polyphony voice — its own oscillator stack, filter and envelope gain.
// Every voice feeds the SHARED saturation/reverb/delay chain built in createAudio.
type Voice = {
  osc1: OscillatorNode;
  osc2: OscillatorNode;
  osc3: OscillatorNode; // the harmony note (2nd oscillator a fixed interval up)
  sub: OscillatorNode;
  filter: BiquadFilterNode;
  gain: GainNode; // envelope (0 = silent, VOLUME = held)
};

type Audio = {
  ctx: AudioContext;
  voices: Voice[]; // MAX_VOICES of them
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

// build one independent voice and wire it into the shared `shaper` input.
// `lfoGain` (shared vibrato) is fanned into each oscillator's detune.
function createVoice(ctx: AudioContext, shaper: AudioNode, lfoGain: GainNode): Voice {
  // two slightly detuned saws (the main note) + a sine sub-oscillator for warmth/body
  const osc1 = ctx.createOscillator();
  osc1.type = 'sawtooth';
  const osc2 = ctx.createOscillator();
  osc2.type = 'sawtooth';
  osc2.detune.value = DETUNE_CENTS;

  // the harmony note — a 2nd oscillator a fixed interval above, so a held note is a chord
  const osc3 = ctx.createOscillator();
  osc3.type = 'sawtooth';
  osc3.detune.value = -DETUNE_CENTS; // detuned the other way for width
  const harmonyGain = ctx.createGain();
  harmonyGain.gain.value = HARMONY_MIX;

  const sub = ctx.createOscillator();
  sub.type = 'sine';
  const subGain = ctx.createGain();
  subGain.gain.value = SUB_MIX;

  // shared vibrato/chorus shimmer modulates this voice's detune
  lfoGain.connect(osc1.detune);
  lfoGain.connect(osc2.detune);
  lfoGain.connect(osc3.detune);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 800;
  filter.Q.value = 1.2; // low resonance → smooth, not buzzy

  const gain = ctx.createGain();
  gain.gain.value = 0;

  osc1.connect(filter);
  osc2.connect(filter);
  osc3.connect(harmonyGain);
  harmonyGain.connect(filter);
  sub.connect(subGain);
  subGain.connect(filter);
  filter.connect(gain);
  gain.connect(shaper); // envelope → shared saturation/FX

  osc1.start();
  osc2.start();
  osc3.start();
  sub.start();
  return { osc1, osc2, osc3, sub, filter, gain };
}

function createAudio(): Audio {
  const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new Ctor();

  // one shared vibrato LFO for every voice
  const lfo = ctx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = 5.5;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 8; // cents of vibrato (expressive, vocal-ish)
  lfo.connect(lfoGain);

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

  shaper.connect(comp); // dry (saturated)
  shaper.connect(convolver);
  shaper.connect(delay); // feed the echoes
  delayWet.connect(comp); // echoes (dry path)
  delayWet.connect(convolver); // echoes also picked up by the reverb tail
  convolver.connect(wet);
  wet.connect(comp); // wet (reverb)
  comp.connect(analyser);

  // all voices share the saturation → FX → comp chain above
  const voices: Voice[] = [];
  for (let i = 0; i < MAX_VOICES; i++) voices.push(createVoice(ctx, shaper, lfoGain));

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

  lfo.start();
  return { ctx, voices, analyser, data, mediaEl };
}

function Scene({ onStart, active }: { onStart: () => void; active: boolean }) {
  const { camera, gl } = useThree();
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const markerRefs = useRef<THREE.Mesh[]>([]); // one marker per possible voice

  const audioRef = useRef<Audio | null>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tmpColor = useMemo(() => new THREE.Color(), []);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);
  const hitV = useMemo(() => new THREE.Vector3(), []);
  const tmpNdc = useMemo(() => new THREE.Vector2(), []);
  const geo = useMemo(() => new THREE.SphereGeometry(DOT_R, 12, 12), []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 0.5, metalness: 0.1, toneMapped: false }), []);

  // active notes, keyed by a stable id:
  //   t<pointerId> = a finger / pressed pointer   ·   hover = the desktop hover note
  //   c<n>         = a right-click latched (held) note
  // x/y are normalized device coords (−1..1) on the canvas.
  const notes = useRef(new Map<string, { x: number; y: number; latched: boolean }>());
  const voiceOf = useRef(new Map<string, number>()); // note id → assigned voice index
  const freeVoices = useRef<number[]>(Array.from({ length: MAX_VOICES }, (_, i) => MAX_VOICES - 1 - i));
  const justStarted = useRef(new Set<number>()); // voices that should JUMP (no glide) this frame
  const latchSeq = useRef(0); // counter for unique latched-note ids
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
    const m = notes.current;
    const toXY = (e: { clientX: number; clientY: number }) => {
      const r = el.getBoundingClientRect();
      return {
        x: ((e.clientX - r.left) / r.width) * 2 - 1,
        y: -(((e.clientY - r.top) / r.height) * 2 - 1),
      };
    };

    // Touch / pen / mouse-button → a held note per pointer (capped at MAX_VOICES).
    // On hover devices the mouse is handled by the hover note below instead.
    const onDown = (e: PointerEvent) => {
      unlock();
      if (hoverDevice && e.pointerType === 'mouse') return;
      const id = `t${e.pointerId}`;
      if (!m.has(id) && m.size >= MAX_VOICES) return; // at the polyphony cap
      const p = toXY(e);
      m.set(id, { x: p.x, y: p.y, latched: false });
    };
    const onMove = (e: PointerEvent) => {
      const p = toXY(e);
      if (hoverDevice && e.pointerType === 'mouse') {
        // hover note follows the cursor (only if it already exists or there's room)
        if (m.has('hover') || m.size < MAX_VOICES) m.set('hover', { x: p.x, y: p.y, latched: false });
        return;
      }
      const id = `t${e.pointerId}`;
      if (m.has(id)) m.set(id, { x: p.x, y: p.y, latched: false });
    };
    const onUp = (e: PointerEvent) => {
      if (hoverDevice && e.pointerType === 'mouse') return; // hover note clears on leave
      m.delete(`t${e.pointerId}`);
    };
    const onCancel = (e: PointerEvent) => {
      m.delete(`t${e.pointerId}`);
    };
    const onLeave = () => {
      if (hoverDevice) m.delete('hover');
    };

    // Right-click latches (holds) a note in place so you can stack chords; right-
    // clicking on (or near) a latched note removes it again.
    const onContext = (e: MouseEvent) => {
      e.preventDefault();
      unlock();
      const p = toXY(e);
      for (const [id, n] of m) {
        if (n.latched && Math.hypot(n.x - p.x, n.y - p.y) < 0.12) {
          m.delete(id);
          return; // toggled an existing latch off
        }
      }
      if (m.size >= MAX_VOICES) return; // at the polyphony cap
      m.set(`c${latchSeq.current++}`, { x: p.x, y: p.y, latched: true });
    };

    // Double-click anywhere → reset: clear every held/latched note at once.
    const onDouble = (e: MouseEvent) => {
      e.preventDefault();
      m.clear();
    };

    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onCancel);
    el.addEventListener('pointerleave', onLeave);
    el.addEventListener('contextmenu', onContext);
    el.addEventListener('dblclick', onDouble);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onCancel);
      el.removeEventListener('pointerleave', onLeave);
      el.removeEventListener('contextmenu', onContext);
      el.removeEventListener('dblclick', onDouble);
    };
  }, [gl, hoverDevice]);

  // silence when scrolled out of view
  useEffect(() => {
    if (active) return;
    const a = audioRef.current;
    if (a) {
      for (const v of a.voices) v.gain.gain.setTargetAtTime(0, a.ctx.currentTime, 0.05);
    }
  }, [active]);

  // teardown
  useEffect(() => {
    return () => {
      const a = audioRef.current;
      if (a) {
        try {
          for (const v of a.voices) {
            v.osc1.stop();
            v.osc2.stop();
            v.osc3.stop();
            v.sub.stop();
          }
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

  // scratch arrays reused every frame (avoid per-frame allocation)
  const cursors = useRef<{ id: string; gx: number; gz: number }[]>([]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    clock.current += dt;

    // resolve every active note's screen position → a grid coordinate
    const list = cursors.current;
    list.length = 0;
    for (const [id, n] of notes.current) {
      tmpNdc.set(n.x, n.y);
      raycaster.setFromCamera(tmpNdc, camera);
      let gx = (GRID - 1) / 2;
      let gz = (GRID - 1) / 2;
      if (raycaster.ray.intersectPlane(plane, hitV)) {
        gx = THREE.MathUtils.clamp((hitV.x / EXTENT + 0.5) * (GRID - 1), 0, GRID - 1);
        gz = THREE.MathUtils.clamp((hitV.z / EXTENT + 0.5) * (GRID - 1), 0, GRID - 1);
      }
      list.push({ id, gx, gz });
    }
    const anyActive = list.length > 0;
    glow.current += ((anyActive ? 1 : 0) - glow.current) * Math.min(1, dt * 8);

    // drive the synth — assign each note a stable voice, free voices when notes end
    const a = audioRef.current;
    let rms = 0;
    if (a) {
      const t = a.ctx.currentTime;
      // release voices whose note has ended
      for (const [id, vi] of voiceOf.current) {
        if (!notes.current.has(id)) {
          voiceOf.current.delete(id);
          freeVoices.current.push(vi);
        }
      }
      // assign a fresh voice to any new note (jump to pitch — no glide-in)
      for (const id of notes.current.keys()) {
        if (!voiceOf.current.has(id) && freeVoices.current.length) {
          const vi = freeVoices.current.pop()!;
          voiceOf.current.set(id, vi);
          justStarted.current.add(vi);
        }
      }
      // map voice index → its note's grid position this frame
      const byVoice: ({ gx: number; gz: number } | undefined)[] = new Array(MAX_VOICES);
      for (const c of list) {
        const vi = voiceOf.current.get(c.id);
        if (vi !== undefined) byVoice[vi] = c;
      }
      for (let vi = 0; vi < MAX_VOICES; vi++) {
        const v = a.voices[vi];
        const c = byVoice[vi];
        if (c && active) {
          const col = Math.round((c.gx / (GRID - 1)) * PITCH_STEPS);
          const freq = colToFreq(col);
          const harm = colToFreq(col + HARMONY_STEPS); // in-scale harmony note
          if (justStarted.current.has(vi)) {
            // new note — jump straight to pitch so a fresh tap doesn't slide in
            v.osc1.frequency.setValueAtTime(freq, t);
            v.osc2.frequency.setValueAtTime(freq, t);
            v.osc3.frequency.setValueAtTime(harm, t);
            v.sub.frequency.setValueAtTime(freq * 0.5, t);
            justStarted.current.delete(vi);
          } else {
            v.osc1.frequency.setTargetAtTime(freq, t, GLIDE);
            v.osc2.frequency.setTargetAtTime(freq, t, GLIDE);
            v.osc3.frequency.setTargetAtTime(harm, t, GLIDE);
            v.sub.frequency.setTargetAtTime(freq * 0.5, t, GLIDE); // sub an octave below
          }
          const cutoff = 250 * Math.pow(20, c.gz / (GRID - 1)); // ~250→5000Hz
          v.filter.frequency.setTargetAtTime(cutoff, t, 0.04);
          v.gain.gain.setTargetAtTime(VOLUME, t, 0.04); // smoother attack
        } else {
          v.gain.gain.setTargetAtTime(0, t, 0.22); // smoother release
        }
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

    // column wake: decay every column, then re-light the ones under each note
    const trail = colTrail.current;
    const decay = Math.exp(-dt * TRAIL_DECAY);
    for (let c = 0; c < GRID; c++) trail[c] *= decay;
    if (glow.current > 0.01) {
      for (const c of list) {
        const col = Math.round(c.gx);
        trail[col] = Math.max(trail[col], glow.current);
      }
    }

    for (let i = 0; i < COUNT; i++) {
      const cx = i % GRID;
      const cz = Math.floor(i / GRID);
      const wx = worldX(cx);
      const wz = worldZ(cz);
      // world-space falloff → the lit blob stays the same physical size at any density.
      // Sum the influence of every active note so chords light multiple blobs.
      let infl = 0;
      for (const c of list) {
        const dx = wx - worldX(c.gx);
        const dz = wz - worldZ(c.gz);
        infl += Math.exp(-(dx * dx + dz * dz) * 0.7);
      }
      infl = Math.min(infl, 2) * glow.current;
      const tcol = trail[cx] * TRAIL_GLOW; // fading wake on columns notes passed
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

    // one marker per active note (extras parked invisible)
    for (let i = 0; i < MAX_VOICES; i++) {
      const mk = markerRefs.current[i];
      if (!mk) continue;
      const c = list[i];
      if (c) {
        mk.position.set(worldX(c.gx), 1.6 * glow.current + 0.35, worldZ(c.gz));
        mk.scale.setScalar(0.0001 + 0.6 * glow.current);
        (mk.material as THREE.MeshStandardMaterial).opacity = glow.current;
      } else {
        mk.scale.setScalar(0.0001);
        (mk.material as THREE.MeshStandardMaterial).opacity = 0;
      }
    }
  });

  return (
    <>
      <ambientLight intensity={0.65} />
      <directionalLight position={[5, 10, 6]} intensity={0.95} />
      <instancedMesh ref={meshRef} args={[geo, mat, COUNT]} />
      {Array.from({ length: MAX_VOICES }).map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) markerRefs.current[i] = el;
          }}
        >
          <sphereGeometry args={[0.18, 18, 18]} />
          <meshStandardMaterial color={RED} emissive={RED} emissiveIntensity={1.0} transparent toneMapped={false} />
        </mesh>
      ))}
    </>
  );
}

export default function SynthPad({ compact = false }: { compact?: boolean }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);
  const [started, setStarted] = useState(false);
  const hoverDevice = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches,
    []
  );

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
        // stop the long-press text-selection / callout on touch screens
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
      }}
    >
      <Canvas frameloop={inView ? 'always' : 'demand'} dpr={[1, 1.6]} camera={{ position: [0, 8, 8.5], fov: 32 }} gl={{ antialias: true }}>
        <Scene onStart={() => setStarted(true)} active={inView} />
        <EffectComposer>
          <Bloom intensity={0.45} luminanceThreshold={0.5} luminanceSmoothing={0.3} mipmapBlur />
        </EffectComposer>
      </Canvas>

      {!started && (
        <div className="absolute inset-0 grid place-items-center pointer-events-none px-4 text-center">
          <div className="px-4 py-2 rounded-full bg-black/55 text-white text-sm font-glacial backdrop-blur-sm">
            {hoverDevice
              ? '▶ move to play · right-click to hold up to 5 · double-click to reset'
              : '▶ tap & move to play · use up to 5 fingers for chords'}
          </div>
        </div>
      )}
    </div>
  );
}
