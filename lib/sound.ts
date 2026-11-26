"use client";

let sharedCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!sharedCtx) sharedCtx = new Ctor();
  if (sharedCtx.state === "suspended") {
    void sharedCtx.resume().catch(() => {});
  }
  return sharedCtx;
}

/**
 * Synthesizes a crisp, physical rolling metal shop-shutter sound using Web Audio API:
 *  1) Mechanical lock unlatch click at t=0..90ms
 *  2) Ascending metallic corrugated-slat roll from 180ms..920ms
 * Fails silently if autoplay-blocked or muted.
 */
export function playShutterSound(muted = false) {
  if (muted) return;
  if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.24, now);
    master.connect(ctx.destination);

    // 1. Metallic unlatch clunk (short low-mid impulse + transient snap)
    const latchOsc = ctx.createOscillator();
    const latchGain = ctx.createGain();
    latchOsc.type = "triangle";
    latchOsc.frequency.setValueAtTime(165, now);
    latchOsc.frequency.exponentialRampToValueAtTime(62, now + 0.085);
    latchGain.gain.setValueAtTime(0.5, now);
    latchGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    latchOsc.connect(latchGain);
    latchGain.connect(master);
    latchOsc.start(now);
    latchOsc.stop(now + 0.095);

    // 2. Corrugated slat roll (filtered noise + rhythmic slat modulation pulses)
    const duration = 0.82;
    const sampleRate = ctx.sampleRate;
    const bufferSize = Math.floor(sampleRate * duration);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.Q.setValueAtTime(2.6, now + 0.16);
    band.frequency.setValueAtTime(420, now + 0.16);
    band.frequency.exponentialRampToValueAtTime(1450, now + 0.88);

    // Subtle metallic rattle amplitude modulation (corrugated slats passing drum)
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = "sine";
    lfo.frequency.setValueAtTime(22, now + 0.16);
    lfo.frequency.linearRampToValueAtTime(38, now + 0.85);
    lfoGain.gain.setValueAtTime(0.18, now + 0.16);

    const rollGain = ctx.createGain();
    rollGain.gain.setValueAtTime(0.0001, now);
    rollGain.gain.setValueAtTime(0.0001, now + 0.16);
    rollGain.gain.linearRampToValueAtTime(0.45, now + 0.28);
    rollGain.gain.setValueAtTime(0.38, now + 0.72);
    rollGain.gain.exponentialRampToValueAtTime(0.001, now + 0.96);

    lfo.connect(lfoGain);
    lfoGain.connect(rollGain.gain);

    noise.connect(band);
    band.connect(rollGain);
    rollGain.connect(master);

    noise.start(now + 0.16);
    noise.stop(now + 0.98);
    lfo.start(now + 0.16);
    lfo.stop(now + 0.96);

    // 3. Soft top drum stop thud at end of roll
    const stopOsc = ctx.createOscillator();
    const stopGain = ctx.createGain();
    stopOsc.type = "sine";
    stopOsc.frequency.setValueAtTime(110, now + 0.88);
    stopOsc.frequency.exponentialRampToValueAtTime(48, now + 0.99);
    stopGain.gain.setValueAtTime(0.0001, now + 0.87);
    stopGain.gain.linearRampToValueAtTime(0.28, now + 0.89);
    stopGain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
    stopOsc.connect(stopGain);
    stopGain.connect(master);
    stopOsc.start(now + 0.87);
    stopOsc.stop(now + 1.02);
  } catch {
    /* ignore audio errors */
  }
}
