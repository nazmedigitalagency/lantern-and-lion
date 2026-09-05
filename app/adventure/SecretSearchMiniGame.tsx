'use client';

import React, { useState } from 'react';
import { useDialogA11y } from '../lib/use-dialog';
import type { LocationSecret } from './types';
import { playRewardSound } from '../lib/sound/sound-effects';

export type SearchZone = {
  id: string;
  name: string;
  emoji: string;
  clue: string;
  proximity: 'cold' | 'warm' | 'hot' | 'target';
};

export type ScriptureRiddle = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

type SecretGameData = {
  zones: SearchZone[];
  riddle: ScriptureRiddle;
};

const SECRET_GAMES: Record<string, SecretGameData> = {
  'sec-noah-1': {
    zones: [
      { id: 'z1', name: 'Ark Lower Deck', emoji: '🪵', clue: '❄️ Cold: You inspect the animal stalls and gopher wood beams. Nothing hidden here.', proximity: 'cold' },
      { id: 'z2', name: 'Receding Flood Shore', emoji: '🌊', clue: '❄️ Cold: Slippery mud and stones where the water level has dropped.', proximity: 'cold' },
      { id: 'z3', name: 'Dove Lookout Window', emoji: '🕊️', clue: '🌤️ Warmer: You spot gentle feathers carried by an upward mountain breeze!', proximity: 'warm' },
      { id: 'z4', name: 'Olive Foothills', emoji: '🌿', clue: '🔥 Very Close: Fresh olive sprouts are growing on the rocky ridge just below the peak!', proximity: 'hot' },
      { id: 'z5', name: 'Mount Ararat Summit', emoji: '🏔️', clue: '✨ Spot On: You have reached the mountain peak where the ark came to rest!', proximity: 'target' },
      { id: 'z6', name: 'Rainbow Lookout', emoji: '🌈', clue: '🌤️ Warmer: The sky is clearing, but the true secret rests atop the highest peak nearby.', proximity: 'warm' },
    ],
    riddle: {
      question: 'When the floodwaters receded, which creature returned to Noah with a freshly plucked olive leaf in its beak?',
      options: ['A raven', 'A dove', 'An eagle', 'A swallow'],
      correctIndex: 1,
      explanation: 'Genesis 8:11 — When the dove returned to Noah in the evening, there in its beak was a freshly plucked olive leaf!',
    },
  },
  'sec-creation-1': {
    zones: [
      { id: 'z1', name: 'Primordial Waters', emoji: '🌊', clue: '❄️ Cold: Deep silent waters from the beginning of Day 1.', proximity: 'cold' },
      { id: 'z2', name: 'Green Garden Meadow', emoji: '🌱', clue: '❄️ Cold: Lush grass and fruit-bearing trees from Day 3.', proximity: 'cold' },
      { id: 'z3', name: 'Open Atmosphere', emoji: '☁️', clue: '🌤️ Warmer: The vault of the sky stretching far upward.', proximity: 'warm' },
      { id: 'z4', name: 'Evening Horizon', emoji: '🌅', clue: '🌤️ Warmer: The twilight fading as the expanse of heaven appears.', proximity: 'warm' },
      { id: 'z5', name: 'Starry Firmament (Day 4)', emoji: '✨', clue: '✨ Spot On: You look up into the starry expanse created on Day 4!', proximity: 'target' },
      { id: 'z6', name: 'Ocean Depths', emoji: '🐋', clue: '❄️ Cold: Creatures of the sea swimming in the deep waters.', proximity: 'cold' },
    ],
    riddle: {
      question: 'On Day 4 of Creation, what celestial bodies did God place in the expanse of the heavens to separate day from night and mark sacred seasons?',
      options: ['The sun, moon, and stars', 'Lightning and storm clouds', 'Mountains and oceans', 'Comets and meteors only'],
      correctIndex: 0,
      explanation: 'Genesis 1:14–16 — God made the two great lights to govern day and night, and He also made the stars.',
    },
  },
  'sec-eden-1': {
    zones: [
      { id: 'z1', name: 'Outer Fig Grove', emoji: '🍃', clue: '❄️ Cold: Tall fig trees near the eastern entrance of Eden.', proximity: 'cold' },
      { id: 'z2', name: 'Sharon Flower Path', emoji: '🌺', clue: '🌤️ Warmer: Beautiful blooms alongside a trickling stream.', proximity: 'warm' },
      { id: 'z3', name: 'Pishon Riverbank', emoji: '🏞️', clue: '🔥 Very Close: The river winding through the land of Havilah where there is gold!', proximity: 'hot' },
      { id: 'z4', name: 'Confluence of Four Rivers', emoji: '💧', clue: '✨ Spot On: The sacred meeting point of the four river headwaters!', proximity: 'target' },
      { id: 'z5', name: 'Western Valley', emoji: '🌾', clue: '❄️ Cold: Dry grassy plains far from the garden springs.', proximity: 'cold' },
      { id: 'z6', name: 'River Euphrates Bank', emoji: '🌿', clue: '🌤️ Warmer: Flowing freshwater leading toward the heart of the garden.', proximity: 'warm' },
    ],
    riddle: {
      question: 'In Genesis 2, a river flowed out of Eden to water the garden, and from there it divided into how many river branches?',
      options: ['Two rivers', 'Three rivers', 'Four rivers', 'Seven rivers'],
      correctIndex: 2,
      explanation: 'Genesis 2:10 — A river watering the garden flowed from Eden; from there it was separated into four headwaters.',
    },
  },
};

function getGameForSecret(secret: LocationSecret, regionName: string): SecretGameData {
  if (SECRET_GAMES[secret.id]) return SECRET_GAMES[secret.id];

  const sName = secret.name.toLowerCase();
  const sHint = secret.hint.toLowerCase();

  if (sName.includes('scroll') || sHint.includes('scripture') || sHint.includes('text')) {
    return {
      zones: [
        { id: 'z1', name: 'Ancient Stone Arch', emoji: '🏛️', clue: 'You run your fingers along the stone masonry. Just weathered granite.', proximity: 'cold' },
        { id: 'z2', name: 'Quiet Olive Grove', emoji: '🫒', clue: 'A gentle rustling breeze, but no sign of ancient parchment here.', proximity: 'warm' },
        { id: 'z3', name: 'Carved Torah Niche', emoji: '🕯️', clue: 'Flickering candlelight illuminates an inscribed clay vessel tucked into the wall!', proximity: 'target' },
        { id: 'z4', name: 'Village Well Step', emoji: '🧱', clue: 'Cool well stones worn smooth by centuries of water drawing.', proximity: 'cold' },
      ],
      riddle: {
        question: `To break the clay seal of the ${secret.name}, answer: "Thy word is a lamp unto my feet, and a..."`,
        options: ['Shield against the night', 'Light unto my path', 'Sword for the battle', 'Crown upon my head'],
        correctIndex: 1,
        explanation: 'Psalm 119:105 reminds us: "Thy word is a lamp unto my feet, and a light unto my path."',
      },
    };
  }

  if (sName.includes('coin') || sName.includes('shekel') || sName.includes('silver') || sHint.includes('treasure')) {
    return {
      zones: [
        { id: 'z1', name: 'Bazaar Tent Fabric', emoji: '🎪', clue: 'You inspect the woven tapestry. Colorful, but no hidden treasure.', proximity: 'cold' },
        { id: 'z2', name: 'Merchant Scales Table', emoji: '⚖️', clue: 'Old brass weights clink together. You notice scratched markings below the drawer.', proximity: 'hot' },
        { id: 'z3', name: 'Secret Cash Chest', emoji: '🪙', clue: 'Behind a loose decorative panel, an ornate vintage coin glints in the sunlight!', proximity: 'target' },
        { id: 'z4', name: 'Spices Sack Corner', emoji: '🏺', clue: 'Smells of frankincense and myrrh, but only empty jars remain.', proximity: 'warm' },
      ],
      riddle: {
        question: 'When Jesus was shown a Roman tribute coin, what famous truth did He declare?',
        options: [
          'Keep all earthly gold for the temple treasury',
          'Render to Caesar what is Caesar’s, and to God what is God’s',
          'Only gold may enter the sacred gates',
          'Coins possess no value in the kingdom of heaven',
        ],
        correctIndex: 1,
        explanation: 'Matthew 22:21 teaches godly perspective on civic duty and ultimate devotion to God.',
      },
    };
  }

  if (sName.includes('dove') || sName.includes('olive') || sName.includes('branch') || sName.includes('leaf')) {
    return {
      zones: [
        { id: 'z1', name: 'High Hillside Lookout', emoji: '⛰️', clue: 'A panoramic view over the valleys. The wind is crisp and clear.', proximity: 'warm' },
        { id: 'z2', name: 'Cleft in the Rock', emoji: '🪨', clue: 'A gentle cooing echo sounds from deep inside the sandstone cavern.', proximity: 'hot' },
        { id: 'z3', name: 'Sheltered Cedar Nest', emoji: '🕊️', clue: 'A serene white dove rests here, leaving behind a fragrant sprig of fresh olive leaves!', proximity: 'target' },
        { id: 'z4', name: 'Dry Valley Riverbed', emoji: '🌊', clue: 'Smooth river stones line the dry wadi floor.', proximity: 'cold' },
      ],
      riddle: {
        question: 'In the story of Noah’s Ark, what did the dove return carrying that signified new life?',
        options: ['A golden pomegranate seed', 'A freshly plucked olive leaf', 'A bundle of cedar bark', 'A sprig of hyssop'],
        correctIndex: 1,
        explanation: 'Genesis 8:11 records that the dove returned with an olive leaf in her mouth, showing the waters had receded.',
      },
    };
  }

  // Default regional mystery exploration
  return {
    zones: [
      { id: 'z1', name: `${regionName} Boundary Marker`, emoji: '📍', clue: 'A stone pillar marking the ancient frontier. Nothing concealed here.', proximity: 'cold' },
      { id: 'z2', name: 'Windswept Ridge', emoji: '🌾', clue: 'You search among the wild wheat. You spot subtle footprints leading ahead!', proximity: 'warm' },
      { id: 'z3', name: 'Deep Canyon Alcove', emoji: '🧭', clue: 'Your explorer senses tingle — there is a distinct golden glow behind the rock shelf!', proximity: 'hot' },
      { id: 'z4', name: 'Ancient Cache Chamber', emoji: '✨', clue: `You pull away the tangled vines to uncover the hidden ${secret.name}!`, proximity: 'target' },
    ],
    riddle: {
      question: `Unlock the mystery: "${secret.hint}" — What biblical posture reveals God’s wisdom?`,
      options: [
        'Seeking with all your heart in earnest faith',
        'Boasting in personal strength and cleverness',
        'Rushing ahead without praying or seeking counsel',
        'Concealing the truth from those in need',
      ],
      correctIndex: 0,
      explanation: 'Scripture teaches that every step of God’s redemptive story reveals His faithfulness and guidance.',
    },
  };
}

export function SecretSearchMiniGame({
  secret,
  regionName,
  isTeen = false,
  onDiscover,
  onClose,
}: {
  secret: LocationSecret;
  regionName: string;
  isTeen?: boolean;
  onDiscover: (secretId: string, coins: number, gems: number) => void;
  onClose: () => void;
}) {
  const dialogRef = useDialogA11y<HTMLDivElement>(true, onClose);
  const gameData = getGameForSecret(secret, regionName);

  const [scannedZoneIds, setScannedZoneIds] = useState<string[]>([]);
  const [activeZone, setActiveZone] = useState<SearchZone | null>(null);
  const [phase, setPhase] = useState<'exploring' | 'riddle' | 'unlocked'>('exploring');
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [riddleError, setRiddleError] = useState(false);
  const [scanning, setScanning] = useState(false);

  function handleScanZone(zone: SearchZone) {
    if (scanning || phase !== 'exploring') return;
    setScanning(true);
    playRewardSound('tap');

    window.setTimeout(() => {
      setScanning(false);
      if (!scannedZoneIds.includes(zone.id)) {
        setScannedZoneIds((prev) => [...prev, zone.id]);
      }
      setActiveZone(zone);

      if (zone.proximity === 'target') {
        playRewardSound('questComplete');
        setPhase('riddle');
      } else {
        playRewardSound('xp');
      }
    }, 450);
  }

  function handleCheckRiddle() {
    if (selectedOption === null) return;
    if (selectedOption === gameData.riddle.correctIndex) {
      playRewardSound('correct');
      setRiddleError(false);
      setPhase('unlocked');
      onDiscover(secret.id, secret.rewardCoins, secret.rewardGems);
    } else {
      playRewardSound('wrong');
      setRiddleError(true);
    }
  }

  return (
    <div
      role="presentation"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 110,
        display: 'grid',
        placeItems: 'center',
        padding: '16px',
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="secret-search-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: 'min(680px, 100%)',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: isTeen ? '#0F172A' : '#FFFFFF',
          color: isTeen ? '#F8FAFC' : '#1E293B',
          border: isTeen ? '2px solid #334155' : '2.5px solid #1E293B',
          borderRadius: '22px',
          padding: '1.5rem',
          boxShadow: '0 20px 45px rgba(0, 0, 0, 0.4)',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close search"
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            width: 34,
            height: 34,
            display: 'grid',
            placeItems: 'center',
            borderRadius: '50%',
            border: '1.5px solid var(--error-dark)',
            background: 'var(--error)',
            color: '#ffffff',
            fontSize: '0.9rem',
            fontWeight: 900,
            cursor: 'pointer',
            zIndex: 10,
          }}
        >
          ✕
        </button>

        {/* Header Kicker */}
        <div style={{ marginBottom: '1rem', paddingRight: '2.5rem' }}>
          <span
            style={{
              display: 'inline-block',
              fontSize: '0.75rem',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              background: isTeen ? '#1E293B' : '#EFF6FF',
              color: isTeen ? '#60A5FA' : '#1D4ED8',
              padding: '0.2rem 0.6rem',
              borderRadius: '9999px',
              border: isTeen ? '1px solid #334155' : '1.5px solid #BFDBFE',
              marginBottom: '0.4rem',
            }}
          >
            🧭 Explorer Expedition Radar
          </span>
          <h3 id="secret-search-title" style={{ margin: '0 0 0.25rem 0', fontSize: '1.4rem', fontWeight: 900 }}>
            {phase === 'unlocked' ? '🎉 Secret Uncovered!' : `Search for Secret in ${regionName}`}
          </h3>
          <p style={{ margin: 0, fontSize: '0.85rem', color: isTeen ? '#94A3B8' : '#64748B' }}>
            <strong>Hint:</strong> {secret.hint}
          </p>
        </div>

        {/* PHASE 1: EXPLORING RADAR */}
        {phase === 'exploring' && (
          <div>
            <div
              style={{
                background: isTeen ? '#1E293B' : '#FFFBEB',
                border: isTeen ? '1px solid #334155' : '1.5px solid #FDE68A',
                borderRadius: '12px',
                padding: '0.75rem 1rem',
                marginBottom: '1rem',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span style={{ fontSize: '1.2rem' }}>💡</span>
              <span>
                Tap an area on your explorer radar below to search for clues. Follow the warm/cold temperature signals to find the secret!
              </span>
            </div>

            {/* Radar Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                gap: '0.75rem',
                marginBottom: '1rem',
              }}
            >
              {gameData.zones.map((zone) => {
                const isScanned = scannedZoneIds.includes(zone.id);
                const isSelected = activeZone?.id === zone.id;

                let borderTone = isTeen ? '#334155' : '#CBD5E1';
                let bgTone = isTeen ? '#1E293B' : '#F8FAFC';
                if (isScanned) {
                  if (zone.proximity === 'cold') {
                    borderTone = isTeen ? '#1E40AF' : '#93C5FD';
                    bgTone = isTeen ? '#172554' : '#EFF6FF';
                  } else if (zone.proximity === 'warm') {
                    borderTone = isTeen ? '#B45309' : '#FCD34D';
                    bgTone = isTeen ? '#451A03' : '#FFFBEB';
                  } else if (zone.proximity === 'hot' || zone.proximity === 'target') {
                    borderTone = isTeen ? '#059669' : '#86EFAC';
                    bgTone = isTeen ? '#064E3B' : '#F0FDF4';
                  }
                }

                return (
                  <button
                    key={zone.id}
                    type="button"
                    onClick={() => handleScanZone(zone)}
                    disabled={scanning}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      padding: '1rem 0.75rem',
                      border: isSelected ? '2.5px solid #3B82F6' : `1.5px solid ${borderTone}`,
                      borderRadius: '14px',
                      background: bgTone,
                      color: isTeen ? '#F8FAFC' : '#1E293B',
                      cursor: scanning ? 'wait' : 'pointer',
                      boxShadow: isSelected ? '0 0 0 3px rgba(59, 130, 246, 0.3)' : 'none',
                      transition: 'transform 120ms ease, box-shadow 120ms ease',
                    }}
                  >
                    <span style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>{zone.emoji}</span>
                    <strong style={{ fontSize: '0.85rem', marginBottom: '0.2rem' }}>{zone.name}</strong>
                    <span style={{ fontSize: '0.72rem', color: isTeen ? '#94A3B8' : '#64748B' }}>
                      {isScanned ? (
                        zone.proximity === 'cold' ? '❄️ Cold' :
                        zone.proximity === 'warm' ? '🌤️ Warm' :
                        zone.proximity === 'hot' ? '🔥 Very Close!' : '✨ Target!'
                      ) : (
                        '🔍 Tap to Scan'
                      )}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Radar Clue Box */}
            {activeZone && (
              <div
                style={{
                  background: isTeen ? '#1E293B' : '#F1F5F9',
                  border: isTeen ? '1.5px solid #334155' : '1.5px solid #CBD5E1',
                  borderRadius: '12px',
                  padding: '0.85rem 1rem',
                  fontSize: '0.85rem',
                  lineHeight: 1.45,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.25rem' }}>
                  <strong style={{ fontSize: '0.9rem' }}>{activeZone.emoji} {activeZone.name} Scan:</strong>
                </div>
                <p style={{ margin: 0 }}>{activeZone.clue}</p>
              </div>
            )}
          </div>
        )}

        {/* PHASE 2: SCRIPTURE RIDDLE CONFIRMATION */}
        {phase === 'riddle' && (
          <div>
            <div
              style={{
                background: isTeen ? '#064E3B' : '#EFFDF4',
                border: isTeen ? '1.5px solid #059669' : '1.5px solid #86EFAC',
                borderRadius: '14px',
                padding: '1rem',
                marginBottom: '1rem',
              }}
            >
              <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '0.4rem' }}>🎯 Landmark Located!</span>
              <strong style={{ fontSize: '0.95rem', display: 'block', marginBottom: '0.25rem' }}>
                Solve the Scripture Riddle to unlock the secret:
              </strong>
              <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.5 }}>
                {gameData.riddle.question}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
              {gameData.riddle.options.map((option, idx) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => { setSelectedOption(idx); setRiddleError(false); }}
                  style={{
                    padding: '0.85rem 1rem',
                    textAlign: 'left',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    borderRadius: '12px',
                    border: selectedOption === idx
                      ? '2px solid #3B82F6'
                      : isTeen ? '1.5px solid #334155' : '1.5px solid #CBD5E1',
                    background: selectedOption === idx
                      ? (isTeen ? '#1E3A8A' : '#EFF6FF')
                      : (isTeen ? '#1E293B' : '#FFFFFF'),
                    color: isTeen ? '#F8FAFC' : '#1E293B',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ marginRight: '8px', opacity: 0.7 }}>{String.fromCharCode(65 + idx)}.</span>
                  {option}
                </button>
              ))}
            </div>

            {riddleError && (
              <p style={{ color: '#EF4444', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                Not quite! Re-read the hint and try again.
              </p>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setPhase('exploring')}
                style={{ fontSize: '0.85rem' }}
              >
                ← Back to Radar
              </button>
              <button
                type="button"
                className="button button-primary"
                onClick={handleCheckRiddle}
                disabled={selectedOption === null}
                style={{ fontSize: '0.85rem' }}
              >
                Verify &amp; Unlock Secret ✨
              </button>
            </div>
          </div>
        )}

        {/* PHASE 3: SECRET UNLOCKED VICTORY */}
        {phase === 'unlocked' && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div
              style={{
                width: '76px',
                height: '76px',
                margin: '0 auto 1rem',
                display: 'grid',
                placeItems: 'center',
                fontSize: '3rem',
                background: isTeen ? '#1E293B' : '#FEF3C7',
                border: isTeen ? '2px solid #F59E0B' : '2.5px solid #D97706',
                borderRadius: '50%',
                boxShadow: '0 0 20px rgba(245, 158, 11, 0.3)',
              }}
            >
              {secret.emoji}
            </div>

            <h4 style={{ fontSize: '1.4rem', fontWeight: 900, margin: '0 0 0.4rem 0' }}>
              {secret.name}
            </h4>
            <p style={{ fontSize: '0.9rem', color: isTeen ? '#94A3B8' : '#64748B', maxWidth: '420px', margin: '0 auto 1.25rem', lineHeight: 1.5 }}>
              {gameData.riddle.explanation}
            </p>

            <div
              style={{
                display: 'inline-flex',
                gap: '1.5rem',
                background: isTeen ? '#1E293B' : '#EFF6FF',
                padding: '0.65rem 1.25rem',
                borderRadius: '9999px',
                border: isTeen ? '1px solid #334155' : '1.5px solid #BFDBFE',
                marginBottom: '1.5rem',
                fontWeight: 800,
                fontSize: '0.9rem',
              }}
            >
              <span>🪙 +{secret.rewardCoins} Coins</span>
              {secret.rewardGems > 0 && <span>💎 +{secret.rewardGems} Gems</span>}
            </div>

            <div>
              <button
                type="button"
                className="button button-primary"
                onClick={onClose}
                style={{ width: '100%', maxWidth: '280px', margin: '0 auto', justifyContent: 'center' }}
              >
                Claim &amp; Continue Explorer →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
