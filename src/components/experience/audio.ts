// Background sound for the experience. Browsers block autoplay, so nothing starts until the
// visitor clicks. The scene reads a smoothed loudness each frame so it can breathe with the music.
import type { AudioReading } from "@/components/experience/types";

/** Path under public/ for a licensed track, or null to use the generated ambient drone. */
const TRACK: string | null = null;
const VOLUME = 0.35;
const FADE_SECONDS = 2.5;
const MUTED_KEY = "experience-muted";

type Listener = (playing: boolean) => void;

let context: AudioContext | null = null;
let master: GainNode | null = null;
let analyser: AnalyserNode | null = null;
let bins: Uint8Array | null = null;
let element: HTMLAudioElement | null = null;
let wanted = false;
let hidden = false;
let peak = 0.05;
const reading: AudioReading = { level: 0, low: 0, mid: 0, high: 0 };
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((listener) => listener(wanted));
}

export function subscribe(listener: Listener) {
  listeners.add(listener);
  listener(wanted);
  return () => {
    listeners.delete(listener);
  };
}

export function isPlaying() {
  return wanted;
}

function rememberMuted(muted: boolean) {
  try {
    localStorage.setItem(MUTED_KEY, muted ? "1" : "0");
  } catch {
    // Storage can be blocked; the toggle still works for this visit.
  }
}

// A slow, warm pad: detuned pairs on an open D chord, a drifting low-pass, and a soft echo.
function buildDrone(ctx: AudioContext, output: AudioNode) {
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 900;
  filter.Q.value = 0.7;
  const sweep = ctx.createOscillator();
  sweep.frequency.value = 0.04;
  const sweepDepth = ctx.createGain();
  sweepDepth.gain.value = 450;
  sweep.connect(sweepDepth).connect(filter.frequency);
  sweep.start();

  const delay = ctx.createDelay(2);
  delay.delayTime.value = 0.62;
  const feedback = ctx.createGain();
  feedback.gain.value = 0.38;
  const echoTone = ctx.createBiquadFilter();
  echoTone.type = "lowpass";
  echoTone.frequency.value = 1800;
  filter.connect(output);
  filter.connect(delay);
  delay.connect(echoTone).connect(feedback).connect(delay);
  echoTone.connect(output);

  const voices: [frequency: number, gain: number][] = [
    [73.42, 0.22],
    [110, 0.18],
    [146.83, 0.12],
    [164.81, 0.1],
    [220, 0.06],
    [329.63, 0.03],
  ];
  voices.forEach(([frequency, gain], index) => {
    for (const detune of [-6, 6]) {
      const oscillator = ctx.createOscillator();
      oscillator.type = index < 2 ? "sine" : "triangle";
      oscillator.frequency.value = frequency;
      oscillator.detune.value = detune;
      const amplitude = ctx.createGain();
      amplitude.gain.value = gain / 2;
      const swell = ctx.createOscillator();
      swell.frequency.value = 0.03 + index * 0.017;
      const swellDepth = ctx.createGain();
      swellDepth.gain.value = gain / 3;
      swell.connect(swellDepth).connect(amplitude.gain);
      oscillator.connect(amplitude).connect(filter);
      oscillator.start();
      swell.start();
    }
  });
}

function build() {
  const AudioContextClass =
    window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  context = new AudioContextClass();
  master = context.createGain();
  master.gain.value = 0;
  analyser = context.createAnalyser();
  analyser.fftSize = 512;
  analyser.smoothingTimeConstant = 0.85;
  bins = new Uint8Array(analyser.frequencyBinCount);
  master.connect(analyser);
  analyser.connect(context.destination);

  if (TRACK) {
    element = new Audio(TRACK);
    element.loop = true;
    element.preload = "auto";
    context.createMediaElementSource(element).connect(master);
  } else {
    buildDrone(context, master);
  }
}

function fadeTo(target: number) {
  if (!context || !master) return;
  const now = context.currentTime;
  master.gain.cancelScheduledValues(now);
  master.gain.setValueAtTime(master.gain.value, now);
  master.gain.linearRampToValueAtTime(target, now + FADE_SECONDS);
}

function suspendAfterFade() {
  window.setTimeout(() => {
    if (!wanted || hidden) {
      element?.pause();
      void context?.suspend();
    }
  }, FADE_SECONDS * 1000);
}

/** Must be called from a click or key press so the browser allows sound. */
export function play() {
  if (!context) build();
  // Start both before awaiting anything, while we are still inside the user gesture.
  const resumed = context!.resume();
  void element?.play().catch(() => undefined);
  wanted = true;
  rememberMuted(false);
  fadeTo(VOLUME);
  emit();
  return resumed;
}

export function stop() {
  wanted = false;
  rememberMuted(true);
  fadeTo(0);
  suspendAfterFade();
  emit();
}

/** Fades out while the tab is in the background and back in when it returns. */
export function setHidden(isHidden: boolean) {
  hidden = isHidden;
  if (!context || !wanted) return;
  if (isHidden) {
    fadeTo(0);
    suspendAfterFade();
  } else {
    void context.resume();
    void element?.play().catch(() => undefined);
    fadeTo(VOLUME);
  }
}

function band(from: number, to: number) {
  let sum = 0;
  for (let index = from; index < to; index += 1) sum += bins![index];
  return sum / ((to - from) * 255);
}

/** Smoothed loudness for the scene; eases to zero while muted. */
export function readAudio(): AudioReading {
  if (!analyser || !bins || !wanted) {
    reading.level *= 0.95;
    reading.low *= 0.95;
    reading.mid *= 0.95;
    reading.high *= 0.95;
    return reading;
  }

  analyser.getByteFrequencyData(bins);
  const count = bins.length;
  const low = band(0, Math.floor(count * 0.08));
  const mid = band(Math.floor(count * 0.08), Math.floor(count * 0.35));
  const high = band(Math.floor(count * 0.35), Math.floor(count * 0.8));
  const level = (low + mid + high) / 3;
  // Normalise against a slowly decaying peak so quiet and loud tracks both use the full range.
  peak = Math.max(peak * 0.9995, level, 0.02);
  const ease = 0.08;
  reading.level += (Math.min(1, level / peak) - reading.level) * ease;
  reading.low += (Math.min(1, low / peak) - reading.low) * ease;
  reading.mid += (Math.min(1, mid / peak) - reading.mid) * ease;
  reading.high += (Math.min(1, high / peak) - reading.high) * ease;
  return reading;
}
