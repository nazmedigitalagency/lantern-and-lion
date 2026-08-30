'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CharacterAvatar } from '../character/components';
import type { CharacterAppearance, CharacterEquipment } from '../character/types';
import type {
  AdventureQuest,
  KnowledgeBossChallenge,
  LocationSecret,
  MemoryVerseChallenge,
  QuestStatus,
  Region,
  RegionStatus,
  StoryChapter,
  WorldCollectible,
} from './types';

export function DifficultyStars({ level, label }: { level: number; label?: string }) {
  return (
    <span className="adv-stars" role="img" aria-label={label || `Difficulty ${level} out of 5`}>
      {'★'.repeat(level)}
      <span className="adv-stars-empty">{'★'.repeat(5 - level)}</span>
    </span>
  );
}

const QUEST_STATUS_LABEL: Record<QuestStatus, string> = {
  locked: 'Locked',
  available: 'Available',
  'in-progress': 'In progress',
  completed: 'Completed',
  mastered: 'Mastered',
};

const QUEST_STATUS_ICON: Record<QuestStatus, string> = {
  locked: '🔒',
  available: '✨',
  'in-progress': '⏳',
  completed: '✅',
  mastered: '⭐',
};

export function QuestStatusPill({ status }: { status: QuestStatus }) {
  return (
    <span className={`adv-status-pill adv-status-${status}`}>
      <span aria-hidden="true">{QUEST_STATUS_ICON[status]}</span>
      {QUEST_STATUS_LABEL[status]}
    </span>
  );
}

export function QuestCard({
  quest,
  status,
  title,
  theme,
  estimatedMinutes,
  onSelect,
}: {
  quest: AdventureQuest;
  status: QuestStatus;
  title: string;
  theme: string;
  estimatedMinutes: number;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className={`adv-quest-card adv-quest-${status}`}
      onClick={onSelect}
      aria-label={`${title}. ${QUEST_STATUS_LABEL[status]}.`}
      style={{
        background: 'rgba(30, 41, 59, 0.6)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        textAlign: 'left',
        cursor: status === 'locked' ? 'not-allowed' : 'pointer',
        width: '100%',
        color: '#f8fafc',
      }}
    >
      <span style={{ fontSize: '2rem' }} aria-hidden="true">
        {status === 'locked' ? '🔒' : quest.icon}
      </span>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <strong style={{ fontSize: '1rem' }}>{title}</strong>
          <QuestStatusPill status={status} />
        </div>
        <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>{theme}</p>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.4rem', fontSize: '0.75rem', color: '#cbd5e1' }}>
          <DifficultyStars level={quest.difficulty} />
          <span>⏱️ ~{estimatedMinutes} min</span>
          <span style={{ color: '#fbbf24' }}>⭐ +{quest.reward.xp} XP</span>
        </div>
      </div>
    </button>
  );
}

/** Illustrated Interactive World Map Canvas */
export function WorldMapCanvas({
  regions,
  currentRegionId,
  regionStatuses,
  completionPercents,
  playerAppearance,
  playerEquipment,
  onSelectRegion,
}: {
  regions: Region[];
  currentRegionId: string;
  regionStatuses: Record<string, RegionStatus>;
  completionPercents: Record<string, number>;
  playerAppearance?: CharacterAppearance;
  playerEquipment?: CharacterEquipment;
  onSelectRegion: (region: Region) => void;
}) {
  return (
    <div
      className="adv-world-map-container"
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '440px',
        background: 'radial-gradient(ellipse at center, #1e293b 0%, #090d16 100%)',
        borderRadius: '20px',
        border: '1.5px solid rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        padding: '2rem 1rem',
      }}
    >
      {/* Background World Grid / Constellation Path */}
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      >
        <defs>
          <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="30%" stopColor="#06b6d4" />
            <stop offset="60%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>

        {/* Dynamic connecting lines */}
        {regions.map((r, i) => {
          const next = regions[i + 1];
          if (!next) return null;
          return (
            <line
              key={`${r.id}-${next.id}`}
              x1={`${r.mapPosition.x}%`}
              y1={`${r.mapPosition.y}%`}
              x2={`${next.mapPosition.x}%`}
              y2={`${next.mapPosition.y}%`}
              stroke="url(#pathGradient)"
              strokeWidth="3"
              strokeDasharray="6 6"
              opacity="0.6"
            />
          );
        })}
      </svg>

      {/* Region Nodes */}
      <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '380px' }}>
        {regions.map((region) => {
          const status = regionStatuses[region.id] || 'locked';
          const isCurrent = region.id === currentRegionId;
          const percent = completionPercents[region.id] || 0;
          const isLocked = status === 'locked';

          return (
            <div
              key={region.id}
              style={{
                position: 'absolute',
                left: `${region.mapPosition.x}%`,
                top: `${region.mapPosition.y}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: isCurrent ? 20 : 10,
                textAlign: 'center',
              }}
            >
              {/* Player Avatar positioned on current region */}
              {isCurrent && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-60px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '54px',
                    height: '54px',
                    zIndex: 30,
                    filter: 'drop-shadow(0 4px 10px rgba(56, 189, 248, 0.6))',
                  }}
                >
                  <CharacterAvatar
                    appearance={playerAppearance || { skinTone: 'honey', hairStyle: 'curls', face: 'smile' }}
                    equipment={playerEquipment || {}}
                    size="small"
                    showPedestal={false}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      bottom: '-12px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: '#38bdf8',
                      color: '#0f172a',
                      fontSize: '0.65rem',
                      fontWeight: 900,
                      padding: '0.1rem 0.35rem',
                      borderRadius: '4px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    YOU
                  </span>
                </div>
              )}

              <button
                type="button"
                onClick={() => onSelectRegion(region)}
                disabled={isLocked}
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: isLocked
                    ? '#334155'
                    : status === 'completed'
                    ? '#059669'
                    : isCurrent
                    ? '#2563eb'
                    : '#1e293b',
                  border: isCurrent
                    ? '3px solid #38bdf8'
                    : status === 'completed'
                    ? '2px solid #34d399'
                    : '2px solid rgba(255,255,255,0.2)',
                  color: '#ffffff',
                  fontSize: '1.6rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: isLocked ? 'not-allowed' : 'pointer',
                  boxShadow: isCurrent
                    ? '0 0 20px rgba(56, 189, 248, 0.8)'
                    : '0 8px 16px rgba(0,0,0,0.3)',
                  transition: 'transform 0.2s ease',
                  margin: '0 auto',
                }}
                aria-label={`${region.name}: ${status}. ${percent}% complete.`}
              >
                {isLocked ? '🔒' : region.icon}
              </button>

              <div style={{ marginTop: '0.35rem' }}>
                <strong
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    color: isLocked ? '#64748b' : '#f8fafc',
                    textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {region.name}
                </strong>
                <small
                  style={{
                    fontSize: '0.68rem',
                    color: status === 'completed' ? '#34d399' : '#94a3b8',
                    display: 'block',
                  }}
                >
                  {isLocked ? 'Locked' : `${percent}% complete`}
                </small>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Story Chapter Reader Component */
export function StoryChapterReader({
  chapter,
  onComplete,
  isCompleted,
}: {
  chapter: StoryChapter;
  onComplete: () => void;
  isCompleted: boolean;
}) {
  return (
    <article
      style={{
        background: 'rgba(30, 41, 59, 0.5)',
        border: '1.5px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '1.5rem',
        marginBottom: '1rem',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.75rem', background: '#3b82f6', color: '#ffffff', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontWeight: 700 }}>
          Chapter {chapter.chapterNumber}
        </span>
        <small style={{ color: '#94a3b8', fontSize: '0.75rem' }}>📖 {chapter.scriptureReference}</small>
      </div>

      <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>
        {chapter.title}
      </h3>
      <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: '#38bdf8' }}>{chapter.subtitle}</p>

      {/* Scripture Box */}
      <blockquote
        style={{
          background: 'rgba(15, 23, 42, 0.7)',
          borderLeft: '4px solid #fbbf24',
          margin: '1rem 0',
          padding: '0.85rem 1.1rem',
          borderRadius: '0 8px 8px 0',
          fontStyle: 'italic',
          color: '#fef08a',
          fontSize: '0.9rem',
          lineHeight: 1.6,
        }}
      >
        &ldquo;{chapter.bibleText}&rdquo;
      </blockquote>

      {/* Narrative Explanation */}
      <div style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: 1.6, margin: '1rem 0' }}>
        <p>{chapter.narrativeExplanation}</p>
      </div>

      {/* Takeaway message */}
      <div
        style={{
          background: 'rgba(6, 95, 70, 0.3)',
          border: '1px solid #059669',
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          color: '#a7f3d0',
          fontSize: '0.85rem',
          marginBottom: '1.25rem',
        }}
      >
        💡 <strong>Life Takeaway:</strong> {chapter.takeawayMessage}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
        {chapter.interactiveStoryId && (
          <a href={`/stories/${chapter.interactiveStoryId}`} className="button button-primary">
            🎮 Play the Interactive Story
          </a>
        )}
        <button
          type="button"
          className={`button ${isCompleted ? 'button-secondary' : 'button-primary'}`}
          onClick={onComplete}
        >
          {isCompleted ? '✓ Read & Completed' : '📖 Mark Chapter Read (+40 XP)'}
        </button>
      </div>
    </article>
  );
}

/** Memory Verse Practice Card */
export function MemoryVerseTrainer({ verse }: { verse: MemoryVerseChallenge }) {
  const [showAnswer, setShowAnswer] = useState(false);

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.4) 0%, rgba(15, 23, 42, 0.7) 100%)',
        border: '1.5px solid #38bdf8',
        borderRadius: '16px',
        padding: '1.5rem',
        margin: '1rem 0',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.75rem', background: '#0284c7', color: '#ffffff', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontWeight: 700 }}>
          📜 Memory Verse
        </span>
        <small style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Theme: {verse.theme}</small>
      </div>

      <h4 style={{ margin: '0.25rem 0 0.75rem 0', fontSize: '1.1rem', color: '#38bdf8' }}>
        {verse.reference} ({verse.translation})
      </h4>

      <p style={{ fontSize: '1.05rem', lineHeight: 1.6, color: '#ffffff', margin: '0.75rem 0' }}>
        {showAnswer
          ? verse.text
          : verse.text.split(' ').map((word, i) => {
              const clean = word.replace(/[^a-zA-Z]/g, '');
              if (verse.blanks.some((b) => b.toLowerCase() === clean.toLowerCase())) {
                return (
                  <span
                    key={i}
                    style={{
                      background: 'rgba(255,255,255,0.15)',
                      padding: '0.1rem 0.4rem',
                      borderRadius: '4px',
                      margin: '0 0.15rem',
                      color: '#fbbf24',
                    }}
                  >
                    ______
                  </span>
                );
              }
              return word + ' ';
            })}
      </p>

      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
        <button
          type="button"
          className="button button-secondary"
          onClick={() => setShowAnswer(!showAnswer)}
          style={{ fontSize: '0.85rem' }}
        >
          {showAnswer ? 'Hide Clues' : 'Reveal Full Verse'}
        </button>
        <Link
          href="/arcade/verse-builder"
          className="button button-primary"
          style={{ fontSize: '0.85rem' }}
        >
          🧩 Practice in Verse Builder →
        </Link>
      </div>
    </div>
  );
}

/** Knowledge Boss Arena Component */
export function KnowledgeBossArena({
  boss,
  onVictory,
  isDefeated,
}: {
  boss: KnowledgeBossChallenge;
  onVictory: () => void;
  isDefeated: boolean;
}) {
  const [currentStep, setCurrentStep] = useState<'intro' | 'questions' | 'reconstruction' | 'victory'>('intro');
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);

  const q = boss.questions[currentQIndex];

  function handleSelectOption(idx: number) {
    if (answered) return;
    setSelectedOption(idx);
    setAnswered(true);
    if (idx === q.correctIndex) {
      setScore((prev) => prev + 1);
    }
  }

  function handleNextQuestion() {
    setSelectedOption(null);
    setAnswered(false);
    if (currentQIndex + 1 < boss.questions.length) {
      setCurrentQIndex((prev) => prev + 1);
    } else {
      setCurrentStep('reconstruction');
    }
  }

  function handleFinishBoss() {
    setCurrentStep('victory');
    onVictory();
  }

  if (isDefeated && currentStep === 'intro') {
    return (
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(6, 78, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%)',
          border: '2px solid #34d399',
          borderRadius: '16px',
          padding: '1.75rem',
          textAlign: 'center',
          color: '#ffffff',
          margin: '1rem 0',
        }}
      >
        <span style={{ fontSize: '3rem' }}>🏆</span>
        <h3 style={{ margin: '0.5rem 0', fontSize: '1.4rem', color: '#34d399' }}>
          {boss.title} Mastered!
        </h3>
        <p style={{ fontSize: '0.9rem', color: '#a7f3d0' }}>
          You proved your mastery over this location and claimed the {boss.reward.badgeName}!
        </p>
        <button
          type="button"
          className="button button-secondary"
          onClick={() => {
            setCurrentStep('questions');
            setCurrentQIndex(0);
            setScore(0);
          }}
          style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}
        >
          🔄 Replay Boss Challenge for Practice
        </button>
      </div>
    );
  }

  if (currentStep === 'intro') {
    return (
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(88, 28, 135, 0.5) 0%, rgba(15, 23, 42, 0.85) 100%)',
          border: '2px solid #a855f7',
          borderRadius: '16px',
          padding: '1.75rem',
          textAlign: 'center',
          color: '#ffffff',
          margin: '1rem 0',
        }}
      >
        <span style={{ fontSize: '3.5rem' }}>{boss.bossEmoji}</span>
        <h3 style={{ margin: '0.5rem 0 0.25rem 0', fontSize: '1.4rem', color: '#e9d5ff' }}>
          {boss.title}
        </h3>
        <p style={{ fontSize: '0.9rem', color: '#cbd5e1', maxWidth: '520px', margin: '0 auto 1.25rem auto' }}>
          {boss.description}
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
          <span style={{ background: '#fef3c7', color: '#92400e', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 700 }}>
            ⭐ +{boss.reward.xp} XP
          </span>
          <span style={{ background: '#ecfdf5', color: '#065f46', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 700 }}>
            🪙 +{boss.reward.coins} Coins
          </span>
          <span style={{ background: '#eff6ff', color: '#1e40af', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 700 }}>
            💎 +{boss.reward.gems} Gems
          </span>
        </div>
        <button
          type="button"
          className="button button-primary"
          onClick={() => setCurrentStep('questions')}
          style={{ padding: '0.75rem 2rem', fontSize: '1rem', fontWeight: 800 }}
        >
          👑 Start Knowledge Boss Trial →
        </button>
      </div>
    );
  }

  if (currentStep === 'questions') {
    return (
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.85)',
          border: '2px solid #a855f7',
          borderRadius: '16px',
          padding: '1.75rem',
          margin: '1rem 0',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <span style={{ fontSize: '0.75rem', background: '#7e22ce', color: '#ffffff', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontWeight: 700 }}>
            Question {currentQIndex + 1} of {boss.questions.length}
          </span>
          <span style={{ color: '#fbbf24', fontSize: '0.85rem', fontWeight: 700 }}>Score: {score}</span>
        </div>

        <h4 style={{ margin: '0 0 1.25rem 0', fontSize: '1.15rem', color: '#f8fafc', lineHeight: 1.4 }}>
          {q.prompt}
        </h4>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {q.options.map((opt, idx) => {
            const isSelected = selectedOption === idx;
            const isCorrect = idx === q.correctIndex;
            let btnStyle = {
              background: 'rgba(30, 41, 59, 0.6)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#f8fafc',
            };
            if (answered) {
              if (isCorrect) btnStyle = { background: '#065f46', border: '1px solid #10b981', color: '#ffffff' };
              else if (isSelected) btnStyle = { background: '#991b1b', border: '1px solid #ef4444', color: '#ffffff' };
            }

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectOption(idx)}
                style={{
                  ...btnStyle,
                  borderRadius: '10px',
                  padding: '0.85rem 1rem',
                  textAlign: 'left',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: answered ? 'default' : 'pointer',
                  transition: 'background 0.15s ease',
                }}
              >
                {String.fromCharCode(65 + idx)}. {opt}
              </button>
            );
          })}
        </div>

        {answered && (
          <div style={{ marginTop: '1.25rem', padding: '0.85rem', background: 'rgba(30, 41, 59, 0.8)', borderRadius: '8px', borderLeft: '4px solid #38bdf8' }}>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#cbd5e1' }}>{q.explanation}</p>
            <button
              type="button"
              className="button button-primary"
              onClick={handleNextQuestion}
              style={{ fontSize: '0.85rem' }}
            >
              {currentQIndex + 1 < boss.questions.length ? 'Next Question →' : 'Continue to Final Challenge →'}
            </button>
          </div>
        )}
      </div>
    );
  }

  if (currentStep === 'reconstruction') {
    return (
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.85)',
          border: '2px solid #a855f7',
          borderRadius: '16px',
          padding: '1.75rem',
          margin: '1rem 0',
        }}
      >
        <span style={{ fontSize: '0.75rem', background: '#7e22ce', color: '#ffffff', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontWeight: 700 }}>
          Final Challenge Stage
        </span>
        <h4 style={{ margin: '0.5rem 0 1rem 0', fontSize: '1.15rem', color: '#f8fafc' }}>
          {boss.storyReconstruction.prompt}
        </h4>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
          {boss.storyReconstruction.events.map((ev, i) => (
            <div
              key={i}
              style={{
                background: 'rgba(30, 41, 59, 0.7)',
                border: '1px solid #38bdf8',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                fontSize: '0.85rem',
                color: '#e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              <span style={{ background: '#0284c7', color: '#ffffff', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}>
                {i + 1}
              </span>
              <span>{ev}</span>
            </div>
          ))}
        </div>

        <button
          type="button"
          className="button button-primary"
          onClick={handleFinishBoss}
          style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', fontWeight: 800 }}
        >
          🏆 Complete Boss Trial &amp; Claim Rewards!
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #064e3b 0%, #0f172a 100%)',
        border: '2px solid #34d399',
        borderRadius: '16px',
        padding: '2rem',
        textAlign: 'center',
        color: '#ffffff',
        margin: '1rem 0',
      }}
    >
      <span style={{ fontSize: '3.5rem' }}>🎉</span>
      <h3 style={{ margin: '0.5rem 0', fontSize: '1.5rem', color: '#34d399' }}>
        Victory! {boss.title} Complete!
      </h3>
      <p style={{ fontSize: '0.95rem', color: '#a7f3d0' }}>
        You earned the <strong>{boss.reward.badgeName}</strong> badge, +{boss.reward.xp} XP, +{boss.reward.coins} Coins, and +{boss.reward.gems} Gems!
      </p>
      {boss.reward.specialCollectible && (
        <div style={{ margin: '1rem 0', padding: '0.75rem', background: 'rgba(255,255,255,0.1)', borderRadius: '10px', display: 'inline-block' }}>
          <span style={{ fontSize: '2rem' }}>{boss.reward.specialCollectible.emoji}</span>
          <strong style={{ display: 'block', color: '#fde047' }}>{boss.reward.specialCollectible.name}</strong>
          <small style={{ color: '#cbd5e1' }}>Added to your collectible pouch!</small>
        </div>
      )}
    </div>
  );
}

/** Collectibles & Secrets Modal */
export function CollectiblesPouchModal({
  collectibles,
  onClose,
}: {
  collectibles: WorldCollectible[];
  secrets?: LocationSecret[];
  onClose: () => void;
}) {
  return (
    <div className="help-overlay" role="presentation" onClick={onClose}>
      <div
        className="help-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pouch-title"
        style={{
          maxWidth: '560px',
          width: '95%',
          background: '#0f172a',
          color: '#f8fafc',
          padding: '2rem',
          borderRadius: '16px',
          border: '1.5px solid #38bdf8',
          boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="pouch-title" style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: '#38bdf8' }}>
          🎒 World Collectibles &amp; Secrets
        </h2>
        <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0 0 1.25rem 0' }}>
          Rare artifacts and hidden treasures discovered across your biblical journeys.
        </p>

        <h3 style={{ fontSize: '1rem', color: '#fbbf24', margin: '1rem 0 0.5rem 0' }}>
          Artifacts Collected ({collectibles.length})
        </h3>
        {collectibles.length === 0 ? (
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>No collectibles found yet. Explore regions and defeat Knowledge Bosses!</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {collectibles.map((c) => (
              <div
                key={c.id}
                style={{
                  background: 'rgba(30, 41, 59, 0.6)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px',
                  padding: '0.75rem',
                  textAlign: 'center',
                }}
              >
                <span style={{ fontSize: '2rem' }}>{c.emoji}</span>
                <strong style={{ display: 'block', fontSize: '0.85rem', color: '#ffffff' }}>{c.name}</strong>
                <small style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{c.description}</small>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
          <button type="button" className="button button-primary" onClick={onClose}>
            Close Pouch
          </button>
        </div>
      </div>
    </div>
  );
}
