'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { studioTTS, AVAILABLE_STUDIO_VOICES, StudioVoice } from '../lib/tts-service';

type StudioAudioPlayerProps = {
  text: string;
  title?: string;
  subtitle?: string;
  compact?: boolean;
  defaultVoiceId?: string;
  className?: string;
  onPlaybackChange?: (isPlaying: boolean) => void;
};

export default function StudioAudioPlayer({
  text,
  title = 'Studio Audio Narration',
  subtitle,
  compact = false,
  defaultVoiceId = 'en-GB-Journey-F',
  className = '',
  onPlaybackChange,
}: StudioAudioPlayerProps) {
  const [selectedVoice, setSelectedVoice] = useState<string>(defaultVoiceId);
  const [speed, setSpeed] = useState<number>(1.0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<{ current: number; duration: number }>({ current: 0, duration: 0 });
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);

  // Stop audio on unmount or text change
  useEffect(() => {
    return () => {
      studioTTS.stop();
      setIsPlaying(false);
      setIsLoading(false);
      setProgress({ current: 0, duration: 0 });
    };
  }, [text]);

  const handleStop = useCallback(() => {
    studioTTS.stop();
    setIsPlaying(false);
    setIsLoading(false);
    setProgress({ current: 0, duration: 0 });
    onPlaybackChange?.(false);
  }, [onPlaybackChange]);

  const handleTogglePlay = async () => {
    if (isPlaying) {
      handleStop();
      return;
    }

    setIsLoading(true);
    try {
      await studioTTS.play({
        text,
        voiceId: selectedVoice,
        speed,
        onStart: () => {
          setIsLoading(false);
          setIsPlaying(true);
          onPlaybackChange?.(true);
        },
        onProgress: (currentTime, duration) => {
          setProgress({ current: currentTime, duration });
        },
        onEnd: () => {
          setIsPlaying(false);
          setIsLoading(false);
          setProgress({ current: 0, duration: 0 });
          onPlaybackChange?.(false);
        },
        onError: () => {
          setIsPlaying(false);
          setIsLoading(false);
          onPlaybackChange?.(false);
        },
      });
    } catch {
      setIsPlaying(false);
      setIsLoading(false);
      onPlaybackChange?.(false);
    }
  };

  const currentVoiceObj: StudioVoice =
    AVAILABLE_STUDIO_VOICES.find((v) => v.id === selectedVoice) || AVAILABLE_STUDIO_VOICES[0];

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progressPercent =
    progress.duration > 0 ? Math.min(100, (progress.current / progress.duration) * 100) : isPlaying ? 50 : 0;

  if (compact) {
    return (
      <div className={`studio-audio-player compact ${isPlaying ? 'playing' : ''} ${className}`}>
        <button
          type="button"
          className={`studio-play-btn ${isPlaying ? 'active' : ''}`}
          onClick={handleTogglePlay}
          disabled={isLoading}
          aria-label={isPlaying ? 'Stop Audio' : 'Play Studio Audio'}
        >
          {isLoading ? (
            <span className="studio-spinner" aria-hidden="true" />
          ) : isPlaying ? (
            <span>⏹ Stop</span>
          ) : (
            <span>🔊 Studio Audio</span>
          )}
        </button>

        {isPlaying && (
          <div className="studio-wave-mini" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
        )}

        <button
          type="button"
          className="studio-compact-voice-pill"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          aria-expanded={dropdownOpen}
          aria-haspopup="listbox"
          aria-label="Select Studio Voice"
        >
          <span className="voice-name">{currentVoiceObj.label}</span>
          <span className="voice-arrow" aria-hidden="true">{dropdownOpen ? '▴' : '▾'}</span>
        </button>

        {dropdownOpen && (
          <div className="studio-voice-dropdown compact-dropdown" role="listbox">
            {AVAILABLE_STUDIO_VOICES.map((voice) => (
              <button
                key={voice.id}
                type="button"
                role="option"
                aria-selected={voice.id === selectedVoice}
                className={`voice-option ${voice.id === selectedVoice ? 'active' : ''}`}
                onClick={() => {
                  setSelectedVoice(voice.id);
                  setDropdownOpen(false);
                  if (isPlaying) handleStop();
                }}
              >
                <strong>{voice.label}</strong>
                <small>{voice.tagline}</small>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`studio-audio-player full ${isPlaying ? 'playing' : ''} ${className}`}>
      <div className="studio-player-top">
        <div className="studio-player-info">
          <div className="studio-badge-row">
            <span className="studio-badge">🎙️ Google Cloud Studio TTS</span>
            {isPlaying && <span className="live-pulse">● LIVE NARRATION</span>}
          </div>
          <h4 className="studio-title">{title}</h4>
          {subtitle && <p className="studio-subtitle">{subtitle}</p>}
        </div>

        {/* Dynamic Sound Waveform Visualizer */}
        <div className={`studio-waveform ${isPlaying ? 'animating' : ''}`} aria-hidden="true">
          <span className="bar bar-1" />
          <span className="bar bar-2" />
          <span className="bar bar-3" />
          <span className="bar bar-4" />
          <span className="bar bar-5" />
        </div>
      </div>

      {/* Scrubber / Progress Bar */}
      {progress.duration > 0 && (
        <div className="studio-progress-container">
          <div className="studio-progress-track">
            <div className="studio-progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="studio-time-row">
            <small>{formatTime(progress.current)}</small>
            <small>{formatTime(progress.duration)}</small>
          </div>
        </div>
      )}

      {/* Player Controls Toolbar */}
      <div className="studio-controls-bar">
        <div className="studio-main-btns">
          <button
            type="button"
            className={`button studio-action-btn ${isPlaying ? 'button-danger' : 'button-primary'}`}
            onClick={handleTogglePlay}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="studio-spinner" aria-hidden="true" />
                <span>Synthesizing Voice...</span>
              </>
            ) : isPlaying ? (
              <>
                <span>⏹</span>
                <span>Stop Narration</span>
              </>
            ) : (
              <>
                <span>▶</span>
                <span>Listen with Studio Voice</span>
              </>
            )}
          </button>
        </div>

        {/* Voice Selector Dropdown */}
        <div className="studio-voice-selector-wrapper">
          <label htmlFor="studio-voice-select" className="sr-only">Choose Narration Voice</label>
          <select
            id="studio-voice-select"
            className="studio-voice-select"
            value={selectedVoice}
            onChange={(e) => {
              setSelectedVoice(e.target.value);
              if (isPlaying) handleStop();
            }}
          >
            {AVAILABLE_STUDIO_VOICES.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label} ({v.tagline})
              </option>
            ))}
          </select>
        </div>

        {/* Speed Adjustment Buttons */}
        <div className="studio-speed-toggle" role="group" aria-label="Playback Speed">
          {[0.85, 1.0, 1.2].map((s) => (
            <button
              key={s}
              type="button"
              className={`speed-pill ${speed === s ? 'active' : ''}`}
              onClick={() => {
                setSpeed(s);
                if (isPlaying) handleStop();
              }}
            >
              {s === 0.85 ? '0.8x' : s === 1.0 ? '1.0x' : '1.2x'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
