'use client';

import type { AdventureQuest, QuestStatus, Region, RegionStatus } from './types';

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

const REGION_STATUS_LABEL: Record<RegionStatus, string> = {
  locked: 'Locked',
  available: 'Ready to explore',
  'in-progress': 'In progress',
  completed: 'Completed',
};

export function RegionNode({
  region,
  status,
  isCurrent,
  questSummary,
  onSelect,
}: {
  region: Region;
  status: RegionStatus;
  isCurrent: boolean;
  questSummary: { total: number; completed: number };
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className={`adv-region-node adv-region-${status} adv-tone-${region.tone}`}
      style={{ ['--adv-x' as string]: `${region.mapPosition.x}%`, ['--adv-y' as string]: `${region.mapPosition.y}%` }}
      onClick={onSelect}
      disabled={status === 'locked'}
      aria-label={`${region.name}. ${REGION_STATUS_LABEL[status]}. ${questSummary.completed} of ${questSummary.total} quests complete.`}
    >
      {isCurrent && <span className="adv-current-flag">📍 You are here</span>}
      <span className="adv-region-node-icon" aria-hidden="true">{status === 'locked' ? '🔒' : region.icon}</span>
      <span className="adv-region-node-label">{region.name}</span>
      <span className="adv-region-node-progress">
        {status === 'locked' ? 'Locked' : `${questSummary.completed}/${questSummary.total} quests`}
      </span>
    </button>
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
    <button type="button" className={`adv-quest-card adv-quest-${status}`} onClick={onSelect} aria-label={`${title}. ${QUEST_STATUS_LABEL[status]}.`}>
      <span className="adv-quest-icon" aria-hidden="true">{status === 'locked' ? '🔒' : quest.icon}</span>
      <span className="adv-quest-card-body">
        <span className="adv-quest-title">{title}</span>
        <span className="adv-quest-theme">{theme}</span>
        <span className="adv-quest-meta-row">
          <DifficultyStars level={quest.difficulty} />
          <span className="adv-quest-time">⏱ {estimatedMinutes} min</span>
        </span>
      </span>
      <span className="adv-quest-card-side">
        <QuestStatusPill status={status} />
        <span className="adv-quest-xp">+{quest.reward.xp} XP</span>
      </span>
    </button>
  );
}
