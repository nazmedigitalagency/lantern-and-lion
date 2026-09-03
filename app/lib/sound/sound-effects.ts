// Native Web Audio API Sound Effects (SFX) Engine
//
// Procedural audio synthesis for rewards and interactive feedback:
// - Zero external audio file dependencies (no network lag, no 404s, works 100% offline).
// - Unlocks automatically on first user gesture (satisfying browser autoplay policy).
// - Sound state (enabled/muted) is persisted in localStorage and reactive across components.

export type SoundType =
  | 'coins'
  | 'xp'
  | 'gems'
  | 'correct'
  | 'wrong'
  | 'levelUp'
  | 'streak'
  | 'questComplete'
  | 'tap';

const SOUND_STORAGE_KEY = 'lanternLionSoundEnabled';

let audioCtx: AudioContext | null = null;
const listeners = new Set<(enabled: boolean) => void>();

function getStoredSoundPreference(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const stored = localStorage.getItem(SOUND_STORAGE_KEY);
    return stored === null ? true : stored === 'true';
  } catch {
    return true;
  }
}

let soundEnabled: boolean = getStoredSoundPreference();

export function isSoundEnabled(): boolean {
  return soundEnabled;
}

export function setSoundEnabled(enabled: boolean): void {
  soundEnabled = enabled;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(SOUND_STORAGE_KEY, String(enabled));
    } catch {
      /* Non-blocking storage */
    }
  }
  listeners.forEach((listener) => listener(enabled));
}

export function toggleSound(): boolean {
  const next = !soundEnabled;
  setSoundEnabled(next);
  if (next) {
    playRewardSound('tap');
  }
  return next;
}

export function subscribeSoundState(callback: (enabled: boolean) => void): () => void {
  listeners.add(callback);
  callback(soundEnabled);
  return () => {
    listeners.delete(callback);
  };
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioCtxClass) {
      audioCtx = new AudioCtxClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// Automatically resume context on first interaction if suspended
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    window.removeEventListener('pointerdown', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
  };
  window.addEventListener('pointerdown', unlockAudio, { passive: true });
  window.addEventListener('keydown', unlockAudio, { passive: true });
}

// Throttle rapid repeated sounds to prevent harsh audio clipping
let lastPlayTimestamp = 0;
let lastPlayedSound: SoundType | null = null;

export function playRewardSound(type: SoundType): void {
  if (!soundEnabled || typeof window === 'undefined') return;

  const now = performance.now();
  if (type === lastPlayedSound && now - lastPlayTimestamp < 70) {
    return;
  }
  lastPlayTimestamp = now;
  lastPlayedSound = type;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    switch (type) {
      case 'coins':
        synthesizeCoinChime(ctx);
        break;
      case 'xp':
        synthesizeXpSparkle(ctx);
        break;
      case 'gems':
        synthesizeGemChime(ctx);
        break;
      case 'correct':
        synthesizeCorrectChime(ctx);
        break;
      case 'wrong':
        synthesizeWrongBoop(ctx);
        break;
      case 'levelUp':
        synthesizeLevelUpFanfare(ctx);
        break;
      case 'streak':
        synthesizeStreakIgnite(ctx);
        break;
      case 'questComplete':
        synthesizeQuestVictory(ctx);
        break;
      case 'tap':
        synthesizeTapClick(ctx);
        break;
    }
  } catch {
    /* Graceful degradation if audio device unavailable */
  }
}

/** 🪙 Coins: Crisp, bright metallic dual-chime with shimmer */
function synthesizeCoinChime(ctx: AudioContext) {
  const now = ctx.currentTime;
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.22, now);
  masterGain.connect(ctx.destination);

  // Ping 1 (987 Hz - B5)
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(987.77, now);
  osc1.frequency.exponentialRampToValueAtTime(1046.5, now + 0.08);

  gain1.gain.setValueAtTime(0.7, now);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
  osc1.connect(gain1);
  gain1.connect(masterGain);
  osc1.start(now);
  osc1.stop(now + 0.19);

  // Ping 2 (1318 Hz - E6) slightly delayed
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(1318.51, now + 0.06);

  gain2.gain.setValueAtTime(0.001, now);
  gain2.gain.setValueAtTime(0.9, now + 0.06);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
  osc2.connect(gain2);
  gain2.connect(masterGain);
  osc2.start(now + 0.06);
  osc2.stop(now + 0.29);
}

/** ⭐ XP: Ascending pentatonic sparkle arpeggio */
function synthesizeXpSparkle(ctx: AudioContext) {
  const now = ctx.currentTime;
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.18, now);
  masterGain.connect(ctx.destination);

  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
  notes.forEach((freq, idx) => {
    const startTime = now + idx * 0.055;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(0.7, startTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(startTime);
    osc.stop(startTime + 0.26);
  });
}

/** 💎 Gems: Crystalline, ringing bell shimmer */
function synthesizeGemChime(ctx: AudioContext) {
  const now = ctx.currentTime;
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.2, now);
  masterGain.connect(ctx.destination);

  const notes = [1318.51, 1661.22, 1975.53]; // E6, G#6, B6
  notes.forEach((freq, idx) => {
    const startTime = now + idx * 0.04;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(0.6, startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(startTime);
    osc.stop(startTime + 0.36);
  });
}

/** ✅ Correct: Uplifting, celebratory major chord fanfare */
function synthesizeCorrectChime(ctx: AudioContext) {
  const now = ctx.currentTime;
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.22, now);
  masterGain.connect(ctx.destination);

  // Quick 2-chord progression (C5 -> E5 -> G5 -> High C6 finish)
  const arpeggio = [523.25, 659.25, 783.99, 1046.5];
  arpeggio.forEach((freq, idx) => {
    const startTime = now + idx * 0.05;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = idx === arpeggio.length - 1 ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(freq, startTime);

    const duration = idx === arpeggio.length - 1 ? 0.45 : 0.2;
    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(0.8, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.01);
  });
}

/** ❌ Wrong: Warm, non-punitive descending boop */
function synthesizeWrongBoop(ctx: AudioContext) {
  const now = ctx.currentTime;
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.18, now);
  masterGain.connect(ctx.destination);

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(260, now);
  osc.frequency.exponentialRampToValueAtTime(175, now + 0.2);

  gain.gain.setValueAtTime(0.6, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(now);
  osc.stop(now + 0.23);
}

/** 👑 Level Up: Triumphant royal fanfare */
function synthesizeLevelUpFanfare(ctx: AudioContext) {
  const now = ctx.currentTime;
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.24, now);
  masterGain.connect(ctx.destination);

  const notes = [
    { f: 523.25, t: 0, d: 0.12 },    // C5
    { f: 659.25, t: 0.11, d: 0.12 }, // E5
    { f: 783.99, t: 0.22, d: 0.14 }, // G5
    { f: 1046.5, t: 0.35, d: 0.55 }, // C6 (sustained celebration)
  ];

  notes.forEach(({ f, t, d }) => {
    const startTime = now + t;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(f, startTime);

    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(0.85, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + d);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(startTime);
    osc.stop(startTime + d + 0.01);
  });
}

/** 🔥 Streak: Warm resonant harmonic swell */
function synthesizeStreakIgnite(ctx: AudioContext) {
  const now = ctx.currentTime;
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.2, now);
  masterGain.connect(ctx.destination);

  const frequencies = [440, 554.37, 659.25, 880]; // A major
  frequencies.forEach((freq, idx) => {
    const startTime = now + idx * 0.04;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);
    osc.frequency.linearRampToValueAtTime(freq * 1.02, startTime + 0.3);

    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(0.7, startTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(startTime);
    osc.stop(startTime + 0.41);
  });
}

/** 🏆 Quest & Mission Victory: Joyful victory chime */
function synthesizeQuestVictory(ctx: AudioContext) {
  const now = ctx.currentTime;
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.22, now);
  masterGain.connect(ctx.destination);

  const sequence = [
    { f: 587.33, t: 0, d: 0.1 },     // D5
    { f: 739.99, t: 0.09, d: 0.1 },  // F#5
    { f: 880.0, t: 0.18, d: 0.1 },   // A5
    { f: 1174.66, t: 0.28, d: 0.4 }, // D6
  ];

  sequence.forEach(({ f, t, d }) => {
    const startTime = now + t;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(f, startTime);

    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(0.8, startTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + d);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(startTime);
    osc.stop(startTime + d + 0.01);
  });
}

/** 👆 Tap: Subtle, crisp pop for card flips and button taps */
function synthesizeTapClick(ctx: AudioContext) {
  const now = ctx.currentTime;
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.15, now);
  masterGain.connect(ctx.destination);

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(700, now);
  osc.frequency.exponentialRampToValueAtTime(300, now + 0.035);

  gain.gain.setValueAtTime(0.6, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(now);
  osc.stop(now + 0.045);
}
