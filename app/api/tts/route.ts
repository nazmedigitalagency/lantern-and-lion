import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit, getClientIp } from '../../lib/rate-limit';

// Server in-memory audio cache for instant response without repeating synthesis
const audioCache = new Map<string, { audioContent: string; timestamp: number }>();

export type TTSVoiceConfig = {
  id: string;
  name: string;
  languageCode: string;
  gender: 'MALE' | 'FEMALE' | 'NEUTRAL';
  label: string;
  description: string;
  isStudio: boolean;
};

export const STUDIO_VOICES: TTSVoiceConfig[] = [
  {
    id: 'en-GB-Journey-F',
    name: 'en-GB-Journey-F',
    languageCode: 'en-GB',
    gender: 'FEMALE',
    label: '🇬🇧 Classical Narrator (Female)',
    description: 'Warm, gentle British classical storybook narration',
    isStudio: true,
  },
  {
    id: 'en-GB-Journey-D',
    name: 'en-GB-Journey-D',
    languageCode: 'en-GB',
    gender: 'MALE',
    label: '🇬🇧 Classical Narrator (Male)',
    description: 'Calm, rich British classical storybook narration',
    isStudio: true,
  },
];

const TTSRequestSchema = z.object({
  text: z.string().min(1, 'Text parameter is required').max(5000, 'Text exceeds maximum length (5000 chars)'),
  voiceName: z.string().max(100).default('en-GB-Journey-F'),
  speakingRate: z.number().min(0.25).max(2.0).default(0.95),
  pitch: z.number().min(-20.0).max(20.0).default(0.0),
});

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'Lantern & Lion Google Cloud TTS Engine (British Classical & Soft Narration)',
    voices: STUDIO_VOICES,
  });
}

export async function POST(req: NextRequest) {
  try {
    // 1. Rate limiting check (30 requests per minute per IP)
    const clientIp = getClientIp(req);
    const rateLimit = checkRateLimit(`tts:${clientIp}`, { maxRequests: 30, windowSeconds: 60 });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Too Many Requests',
          message: `Rate limit exceeded. Please retry in ${rateLimit.resetSeconds} seconds.`,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.resetSeconds),
          },
        }
      );
    }

    // 2. Validate input schema with Zod
    const rawBody = await req.json().catch(() => null);
    const parseResult = TTSRequestSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request payload',
          details: parseResult.error.issues.map((i) => i.message),
        },
        { status: 400 }
      );
    }

    const { text, voiceName, speakingRate, pitch } = parseResult.data;
    const cleanText = text.trim();
    const cacheKey = `${voiceName}:${speakingRate}:${pitch}:${cleanText}`;

    // Return cached audio if available (valid for 24 hours)
    const cached = audioCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) {
      return NextResponse.json({
        audioContent: cached.audioContent,
        contentType: 'audio/mp3',
        voice: voiceName,
        cached: true,
        source: 'google-cloud-tts',
      });
    }

    const apiKey =
      process.env.GOOGLE_TTS_API_KEY ||
      process.env.GOOGLE_CLOUD_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // Return helpful fallback directive for the client when API key is not configured locally
      return NextResponse.json({
        fallback: true,
        message: 'Google Cloud TTS API key not configured. Using high-fidelity client voice engine fallback.',
        voice: voiceName,
      });
    }

    // Google Cloud Text-to-Speech REST endpoint
    const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;

    const selectedVoice = STUDIO_VOICES.find((v) => v.name === voiceName) || STUDIO_VOICES[0];

    const payload = {
      input: { text: cleanText },
      voice: {
        languageCode: selectedVoice.languageCode,
        name: selectedVoice.name,
        ssmlGender: selectedVoice.gender,
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate,
        pitch,
        sampleRateHertz: 24000,
        effectsProfileId: ['small-bluetooth-speaker-class-device', 'headphone-class-device'],
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      // Don't leak raw internal error responses or key signatures
      return NextResponse.json(
        {
          fallback: true,
          error: 'Upstream TTS service error',
          message: 'Fell back to client speech synthesizer',
        },
        { status: 200 }
      );
    }

    const data = (await response.json()) as { audioContent?: string };
    const audioContent = data.audioContent; // base64 encoded MP3

    if (!audioContent) {
      return NextResponse.json({ fallback: true, message: 'No audio returned' }, { status: 200 });
    }

    // Store in memory cache
    audioCache.set(cacheKey, { audioContent, timestamp: Date.now() });

    // Limit cache size to 500 items
    if (audioCache.size > 500) {
      const firstKey = audioCache.keys().next().value;
      if (firstKey) audioCache.delete(firstKey);
    }

    return NextResponse.json({
      audioContent,
      contentType: 'audio/mp3',
      voice: selectedVoice.name,
      voiceLabel: selectedVoice.label,
      cached: false,
      source: 'google-cloud-tts',
    });
  } catch {
    // Mask internal server exceptions to prevent information disclosure
    return NextResponse.json(
      { fallback: true, error: 'Internal processing error', message: 'Fell back to client synthesizer' },
      { status: 200 }
    );
  }
}
