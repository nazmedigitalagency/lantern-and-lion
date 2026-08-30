'use client';

export type StudioVoice = {
  id: string;
  name: string;
  label: string;
  tagline: string;
  gender: 'female' | 'male';
  isDefault?: boolean;
};

export const AVAILABLE_STUDIO_VOICES: StudioVoice[] = [
  {
    id: 'en-GB-Journey-F',
    name: 'en-GB-Journey-F',
    label: '🇬🇧 Classical Narrator (Female)',
    tagline: 'Warm, gentle British classical storybook narration',
    gender: 'female',
    isDefault: true,
  },
  {
    id: 'en-GB-Journey-D',
    name: 'en-GB-Journey-D',
    label: '🇬🇧 Classical Narrator (Male)',
    tagline: 'Calm, rich British classical storybook narration',
    gender: 'male',
  },
];

export type PlaybackState = 'idle' | 'loading' | 'playing' | 'paused';

class StudioTTSManager {
  private currentAudio: HTMLAudioElement | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private memoryAudioCache = new Map<string, string>(); // text:voice -> dataUrl
  // Lets stop() tell whichever caller currently "owns" playback that it was cut off, so that
  // caller's UI (isPlaying, etc.) doesn't stay stuck showing "playing" after being preempted.
  private currentOnInterrupt: (() => void) | null = null;
  private cachedVoices: SpeechSynthesisVoice[] = [];

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      // Pre-warm and cache available speech synthesis voices
      this.loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => {
          this.loadVoices();
        };
      }
    }
  }

  private loadVoices(): SpeechSynthesisVoice[] {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
    const list = window.speechSynthesis.getVoices() || [];
    if (list.length > 0) {
      this.cachedVoices = list;
    }
    return this.cachedVoices;
  }

  /**
   * Stops any currently playing audio (both Google Cloud HTML5 audio and browser speech synthesis)
   */
  public stop() {
    const onInterrupt = this.currentOnInterrupt;
    this.currentOnInterrupt = null;

    if (this.currentAudio) {
      const audio = this.currentAudio;
      this.currentAudio = null;
      audio.onplay = null;
      audio.ontimeupdate = null;
      audio.onended = null;
      audio.onerror = null;
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch {
        // ignore benign pause errors
      }
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
      this.currentUtterance = null;
    }

    onInterrupt?.();
  }

  /**
   * Pauses the active audio playback
   */
  public pause() {
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
      } catch {
        // ignore
      }
    } else if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.pause();
      } catch {
        // ignore
      }
    }
  }

  /**
   * Resumes paused audio
   */
  public resume() {
    if (this.currentAudio) {
      const playPromise = this.currentAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // ignore
        });
      }
    } else if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.resume();
      } catch {
        // ignore
      }
    }
  }

  /**
   * Synthesize and play audio with Google Cloud TTS, falling back gracefully to client Web Speech API.
   */
  public async play({
    text,
    voiceId = 'en-GB-Journey-F',
    speed = 1.0,
    onStart,
    onProgress,
    onEnd,
    onError,
  }: {
    text: string;
    voiceId?: string;
    speed?: number;
    onStart?: () => void;
    onProgress?: (currentTime: number, duration: number) => void;
    onEnd?: () => void;
    onError?: (err: Error) => void;
  }): Promise<void> {
    try {
      this.stop();

      const cleanText = text.replace(/[\r\n]+/g, ' ').trim();
      if (!cleanText) return;

      this.currentOnInterrupt = onEnd || null;

      const cacheKey = `${voiceId}:${speed}:${cleanText}`;

      // 1. Check client memory cache
      const cachedDataUrl = this.memoryAudioCache.get(cacheKey);
      if (cachedDataUrl) {
        this.playHtml5Audio(cachedDataUrl, speed, onStart, onProgress, onEnd, onError);
        return;
      }

      // 2. Request from Google Cloud TTS API endpoint
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: cleanText,
          voiceName: voiceId,
          speakingRate: speed,
        }),
      });

      if (!response.ok) {
        throw new Error(`TTS server responded with ${response.status}`);
      }

      const data = (await response.json()) as { audioContent?: string; fallback?: boolean };

      if (data.audioContent) {
        const dataUrl = `data:audio/mp3;base64,${data.audioContent}`;
        this.memoryAudioCache.set(cacheKey, dataUrl);
        this.playHtml5Audio(dataUrl, speed, onStart, onProgress, onEnd, onError);
        return;
      }

      // If server instructed fallback (e.g. no Google API key configured)
      this.playClientFallback(cleanText, voiceId, speed, onStart, onEnd, onError);
    } catch (err: unknown) {
      console.warn('Google Cloud TTS note:', err);
      // Seamless fallback to client speech synthesis
      this.playClientFallback(text, voiceId, speed, onStart, onEnd, onError);
    }
  }

  private playHtml5Audio(
    src: string,
    speed: number,
    onStart?: () => void,
    onProgress?: (currentTime: number, duration: number) => void,
    onEnd?: () => void,
    onError?: (err: Error) => void
  ) {
    try {
      const audio = new Audio(src);
      this.currentAudio = audio;
      audio.playbackRate = speed;

      audio.onplay = () => {
        onStart?.();
      };

      audio.ontimeupdate = () => {
        onProgress?.(audio.currentTime, audio.duration || 0);
      };

      audio.onended = () => {
        this.currentOnInterrupt = null;
        onEnd?.();
        this.currentAudio = null;
      };

      audio.onerror = () => {
        this.currentOnInterrupt = null;
        this.currentAudio = null;
        onError?.(new Error('Audio playback error'));
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err: unknown) => {
          if (err instanceof DOMException && (err.name === 'AbortError' || err.name === 'NotAllowedError')) {
            return;
          }
          console.warn('Audio play note:', err);
          onError?.(err instanceof Error ? err : new Error(String(err)));
        });
      }
    } catch (e: unknown) {
      console.warn('Audio initialization note:', e);
      onError?.(e instanceof Error ? e : new Error(String(e)));
    }
  }

  private selectBestVoice(isMale: boolean): SpeechSynthesisVoice | null {
    const rawVoices = this.cachedVoices.length > 0 ? this.cachedVoices : this.loadVoices();
    if (rawVoices.length === 0) return null;

    // Filter out legacy robotic / novelty / compact voices on macOS & Windows
    const legacyRobotic = [
      'victoria',
      'agnes',
      'kathy',
      'princess',
      'vicki',
      'ralph',
      'albert',
      'bad news',
      'bahh',
      'bells',
      'boing',
      'cellos',
      'deranged',
      'good news',
      'hysterical',
      'pipe organ',
      'trinoids',
      'whisper',
      'zarvox',
      'junior',
      'fred',
      'bruce',
      'alex (compact)',
      'compact',
    ];

    // Prefer non-compact, modern natural voices
    const nonLegacyVoices = rawVoices.filter((v) => {
      const lower = v.name.toLowerCase();
      return !legacyRobotic.some((n) => lower.includes(n));
    });

    const candidatePool = nonLegacyVoices.length > 0 ? nonLegacyVoices : rawVoices;

    if (isMale) {
      // 1. High priority natural/enhanced British male voices
      const premiumBritishMale = candidatePool.find((v) => {
        const isGB = v.lang.toLowerCase().includes('gb') || v.lang.toLowerCase().includes('uk');
        const lower = v.name.toLowerCase();
        return (
          isGB &&
          (lower.includes('oliver') ||
            lower.includes('george') ||
            lower.includes('arthur') ||
            lower.includes('ryan') ||
            lower.includes('google uk english male') ||
            lower.includes('brian') ||
            lower.includes('alfie') ||
            lower.includes('malcolm') ||
            (lower.includes('daniel') && lower.includes('enhanced')) ||
            (lower.includes('siri') && (lower.includes('voice 2') || lower.includes('voice 3'))))
        );
      });
      if (premiumBritishMale) return premiumBritishMale;

      // 2. Any other non-female British voice
      const anyBritishMale = candidatePool.find((v) => {
        const isGB = v.lang.toLowerCase().includes('gb') || v.lang.toLowerCase().includes('uk');
        const lower = v.name.toLowerCase();
        const isFemaleName =
          lower.includes('serena') ||
          lower.includes('kate') ||
          lower.includes('martha') ||
          lower.includes('fiona') ||
          lower.includes('stephanie') ||
          lower.includes('female') ||
          lower.includes('hazel') ||
          lower.includes('ava') ||
          lower.includes('samantha');
        return isGB && !isFemaleName;
      });
      if (anyBritishMale) return anyBritishMale;

      // 3. High quality natural English male voice
      const naturalEnglishMale = candidatePool.find((v) => {
        const isEn = v.lang.startsWith('en');
        const lower = v.name.toLowerCase();
        return (
          isEn &&
          (lower.includes('tom') ||
            lower.includes('aaron') ||
            lower.includes('guy') ||
            lower.includes('david') ||
            lower.includes('james') ||
            lower.includes('alex') ||
            lower.includes('male'))
        );
      });
      if (naturalEnglishMale) return naturalEnglishMale;
    } else {
      // Female voice selection: Prioritize smooth Enhanced / Premium / Siri / Google UK Female
      // 1. Premium/Enhanced British female voices (Serena, Kate, Martha, Google UK Female, Stephanie, Hazel, Siri)
      const premiumBritishFemale = candidatePool.find((v) => {
        const isGB = v.lang.toLowerCase().includes('gb') || v.lang.toLowerCase().includes('uk');
        const lower = v.name.toLowerCase();
        return (
          isGB &&
          (lower.includes('serena') ||
            lower.includes('kate') ||
            lower.includes('martha') ||
            lower.includes('google uk english female') ||
            lower.includes('hazel') ||
            lower.includes('stephanie') ||
            lower.includes('sonia') ||
            lower.includes('mia') ||
            lower.includes('libby') ||
            (lower.includes('siri') && (lower.includes('voice 1') || lower.includes('voice 4'))))
        );
      });
      if (premiumBritishFemale) return premiumBritishFemale;

      // 2. High-grade Enhanced/Premium English female voices (Ava, Samantha Enhanced, Allison, Susan, Zoe, Karen, Google US)
      const premiumEnglishFemale = candidatePool.find((v) => {
        const isEn = v.lang.startsWith('en');
        const lower = v.name.toLowerCase();
        return (
          isEn &&
          (lower.includes('ava') ||
            (lower.includes('samantha') && (lower.includes('enhanced') || lower.includes('premium'))) ||
            lower.includes('allison') ||
            lower.includes('susan') ||
            lower.includes('zoe') ||
            lower.includes('karen') ||
            lower.includes('google us english') ||
            (lower.includes('siri') && lower.includes('female')))
        );
      });
      if (premiumEnglishFemale) return premiumEnglishFemale;

      // 3. Any non-male British female voice
      const anyBritishFemale = candidatePool.find((v) => {
        const isGB = v.lang.toLowerCase().includes('gb') || v.lang.toLowerCase().includes('uk');
        const lower = v.name.toLowerCase();
        const isMaleName =
          lower.includes('daniel') ||
          lower.includes('oliver') ||
          lower.includes('george') ||
          lower.includes('arthur') ||
          lower.includes('ryan') ||
          lower.includes('male');
        return isGB && !isMaleName;
      });
      if (anyBritishFemale) return anyBritishFemale;

      // 4. Any modern English female voice
      const anyEnglishFemale = candidatePool.find((v) => {
        const isEn = v.lang.startsWith('en');
        const lower = v.name.toLowerCase();
        const isMaleName =
          lower.includes('daniel') ||
          lower.includes('oliver') ||
          lower.includes('george') ||
          lower.includes('arthur') ||
          lower.includes('tom') ||
          lower.includes('male');
        return isEn && !isMaleName && (lower.includes('female') || lower.includes('samantha') || lower.includes('karen'));
      });
      if (anyEnglishFemale) return anyEnglishFemale;
    }

    // Fallback: any candidate pool voice
    return candidatePool.find((v) => v.lang.startsWith('en')) || null;
  }

  private playClientFallback(
    text: string,
    voiceId: string,
    speed: number,
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (err: Error) => void
  ) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      onError?.(new Error('Speech synthesis not supported in this browser.'));
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    this.currentUtterance = utterance;

    const isMale = voiceId.includes('Journey-D') || voiceId.includes('Neural2-B');

    // Natural human cadence tuning: avoid excessive pitch-shifting which produces robotic resonance
    if (isMale) {
      utterance.pitch = 0.98;
      utterance.rate = 0.94 * speed;
    } else {
      utterance.pitch = 1.0;
      utterance.rate = 0.94 * speed;
    }

    const matchedVoice = this.selectBestVoice(isMale);
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.onstart = () => {
      onStart?.();
    };

    utterance.onend = () => {
      this.currentOnInterrupt = null;
      onEnd?.();
      this.currentUtterance = null;
    };

    utterance.onerror = (e) => {
      this.currentOnInterrupt = null;
      // Ignore normal cancel interrupts
      if (e.error !== 'canceled' && e.error !== 'interrupted') {
        onError?.(new Error(`Speech synthesis error: ${e.error}`));
      }
      this.currentUtterance = null;
    };

    window.speechSynthesis.speak(utterance);
  }
}

// Singleton manager instance
export const studioTTS = new StudioTTSManager();
