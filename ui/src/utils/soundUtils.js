/**
 * Audio synthesis utility for crisp, modern UI interaction sounds.
 * Uses the Web Audio API for zero-latency, dependency-free audio playback.
 */

let sharedAudioCtx = null;

/**
 * Lazily retrieves or creates the Web Audio context
 * @returns {AudioContext|null}
 */
const getAudioContext = () => {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!sharedAudioCtx) {
    sharedAudioCtx = new AudioContextClass();
  }

  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }

  return sharedAudioCtx;
};

/**
 * Creates a brief tactile click / pop transient
 */
const createClickNode = (ctx, startTime, masterGain) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(1400, startTime);
  osc.frequency.exponentialRampToValueAtTime(200, startTime + 0.015);

  gain.gain.setValueAtTime(0.3, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.015);

  osc.connect(gain);
  gain.connect(masterGain);

  osc.start(startTime);
  osc.stop(startTime + 0.015);
};

/**
 * Creates a musical tone with an exponential decay envelope
 */
const createToneNode = (ctx, config, masterGain) => {
  const { type = 'sine', freq, start, duration, maxGain } = config;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);

  gain.gain.setValueAtTime(0.001, ctx.currentTime);
  gain.gain.setValueAtTime(maxGain, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  osc.connect(gain);
  gain.connect(masterGain);

  osc.start(start);
  osc.stop(start + duration);
};

/**
 * Plays a satisfying, high-fidelity task completion sound (crisp tactile tick + upbeat chime)
 */
export const playTaskCompleteSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.2, now);
    masterGain.connect(ctx.destination);

    // 1. Tactile click transient (physical tick)
    createClickNode(ctx, now, masterGain);

    // 2. Chime Note 1 (E5 - 659.25 Hz, warm triangle)
    createToneNode(
      ctx,
      {
        type: 'triangle',
        freq: 659.25,
        start: now + 0.01,
        duration: 0.12,
        maxGain: 0.28,
      },
      masterGain
    );

    // 3. Chime Note 2 (C6 - 1046.50 Hz, clear sine)
    createToneNode(
      ctx,
      {
        type: 'sine',
        freq: 1046.5,
        start: now + 0.055,
        duration: 0.28,
        maxGain: 0.35,
      },
      masterGain
    );

    // 4. Harmonic overtone (E6 - 1318.51 Hz shimmer)
    createToneNode(
      ctx,
      {
        type: 'sine',
        freq: 1318.51,
        start: now + 0.055,
        duration: 0.22,
        maxGain: 0.08,
      },
      masterGain
    );
  } catch {
    // Gracefully handle browser audio restrictions
  }
};

/**
 * Plays a subtle, soft click sound when unticking / unchecking a task
 */
export const playTaskUncheckSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.12, now);
    masterGain.connect(ctx.destination);

    // Soft downward mechanical pop
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.04);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(now);
    osc.stop(now + 0.04);
  } catch {
    // Gracefully handle browser audio restrictions
  }
};

/**
 * Plays the appropriate tick sound based on whether the task is being marked done or undone
 * @param {boolean} isDone - Whether the task was marked as completed (true) or uncompleted (false)
 */
export const playTickSound = (isDone = true) => {
  if (isDone) {
    playTaskCompleteSound();
  } else {
    playTaskUncheckSound();
  }
};
