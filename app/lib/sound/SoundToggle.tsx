'use client';

import { useSyncExternalStore } from 'react';
import { isSoundEnabled, subscribeSoundState, toggleSound } from './sound-effects';

interface SoundToggleProps {
  variant?: 'child' | 'teen';
  className?: string;
  showLabel?: boolean;
}

export default function SoundToggle({ variant = 'child', className = '', showLabel = true }: SoundToggleProps) {
  const enabled = useSyncExternalStore(subscribeSoundState, isSoundEnabled, () => true);

  if (variant === 'teen') {
    return (
      <button
        type="button"
        onClick={() => toggleSound()}
        className={`teen-hud-chip sound-toggle-teen ${className} ${!enabled ? 'sound-muted' : ''}`}
        aria-label={enabled ? 'Mute sound effects' : 'Enable sound effects'}
        title={enabled ? 'Sound effects on (click to mute)' : 'Sound effects muted (click to enable)'}
        aria-pressed={enabled}
        style={{
          cursor: 'pointer',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          background: enabled ? 'rgba(255, 255, 255, 0.08)' : 'rgba(239, 68, 68, 0.15)',
          color: enabled ? '#f8fafc' : '#fca5a5',
          transition: 'all 0.2s ease',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <span aria-hidden="true">{enabled ? '🔊' : '🔇'}</span>
        {showLabel && (
          <strong style={{ fontSize: '0.82rem', letterSpacing: '0.03em' }}>
            {enabled ? 'SFX ON' : 'MUTED'}
          </strong>
        )}
      </button>
    );
  }

  // Child dashboard variant
  return (
    <button
      type="button"
      onClick={() => toggleSound()}
      className={`kid-hud-chip sound-toggle-child ${className} ${!enabled ? 'sound-muted' : ''}`}
      aria-label={enabled ? 'Mute sound effects' : 'Enable sound effects'}
      title={enabled ? 'Sound effects on (click to mute)' : 'Sound effects muted (click to enable)'}
      aria-pressed={enabled}
      style={{
        cursor: 'pointer',
        border: enabled ? '2px solid #38bdf8' : '2px solid #cbd5e1',
        background: enabled ? '#f0f9ff' : '#f1f5f9',
        color: enabled ? '#0369a1' : '#64748b',
        boxShadow: enabled ? '0 2px 0 #0284c7' : '0 2px 0 #94a3b8',
        transition: 'all 0.15s ease',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '6px 10px',
        borderRadius: '999px',
      }}
    >
      <span aria-hidden="true" style={{ fontSize: '1rem' }}>{enabled ? '🔊' : '🔇'}</span>
      {showLabel && (
        <strong style={{ fontSize: '0.8rem', fontWeight: 800 }}>
          {enabled ? 'Sound' : 'Muted'}
        </strong>
      )}
    </button>
  );
}
