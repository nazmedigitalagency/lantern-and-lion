'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import ChatAssistant from '../chat-assistant';
import StudioAudioPlayer from '../components/StudioAudioPlayer';
import { computeStreak, getCompletedCount } from '../daily-quests/progression';
import { getOrCreateTodaySet, readHistory } from '../daily-quests/storage';
import { CharacterAvatar } from '../character/components';
import { ItemIllustration } from '../character/item-icons';
import { getItem } from '../character/catalog';
import { readAppearance, readEquipment, readCharacterName } from '../character/storage';
import type { CharacterAppearance, CharacterEquipment } from '../character/types';
import { useActivityHeartbeat } from '../lib/activity/idle-tracker';
import { StreakCard } from '../lib/streak/StreakCard';
import { claimStreakMilestoneIfNew } from '../lib/streak/client';
import type { StreakStatus } from '../lib/streak/server';
import { curriculumModules, type CurriculumModule } from '../curriculum-data';
import { LeagueCard } from '../lib/leagues/LeagueCard';
import { getLeaguePod } from '../lib/leagues/storage';
import { LearningJourneyCard, type LearningPlanResponse } from '../lib/adaptive/LearningJourneyCard';
import { getNextMissionRecommendation } from '../adventure/progression';
import { loadWorldContext } from '../adventure/storage';
import { awardCoins, awardXP, getWallet } from '../lib/economy/wallet-service';
import type { Wallet } from '../lib/economy/types';
import { signOutOfPersona } from '../lib/session';
import TeenSidebar from './TeenSidebar';

type Teen = { id: number; name: string; username?: string; age: number; avatar: string; pin: string };
type Tab = 'home' | 'decision' | 'cases' | 'askword' | 'learn' | 'journey' | 'profile';

function trackForAge(age: number): CurriculumModule['track'] {
  if (age <= 5) return 'early';
  if (age <= 10) return 'pathfinder';
  return 'teen';
}

const fallbackTeens: Teen[] = [{ id: 2, name: 'Tobi', age: 14, avatar: 'lantern', pin: '1357' }];

const LEVELS = [
  { name: 'Seeker', min: 0, tag: 'Just getting started' },
  { name: 'Disciple', min: 150, tag: 'Building the habit' },
  { name: 'Torchbearer', min: 400, tag: 'Carrying the light further' },
  { name: 'Overcomer', min: 800, tag: 'Tested and steady' },
  { name: 'Lightbearer', min: 1400, tag: 'Leading others toward it' },
];

function levelInfo(points: number) {
  let current = LEVELS[0];
  let next: typeof LEVELS[number] | null = null;
  for (let i = 0; i < LEVELS.length; i++) {
    if (points >= LEVELS[i].min) current = LEVELS[i];
    if (points < LEVELS[i].min) { next = LEVELS[i]; break; }
  }
  const span = next ? next.min - current.min : 1;
  const progress = next ? Math.min(100, Math.round(((points - current.min) / span) * 100)) : 100;
  return { current, next, progress };
}

const WEEKLY_VERSE = {
  ref: 'Joshua 1:9',
  text: '“Have I not commanded you? Be strong and courageous. Do not be frightened, and do not be dismayed, for the Lord your God is with you wherever you go.”',
};

const DEVOTION = {
  title: 'Courage doesn’t wait for confidence.',
  body: [
    'Joshua didn’t get a pep talk about his talent. He got a command, repeated three times: be strong and courageous. That repetition is the point — God knew fear would come back, so the instruction had to come back too.',
    'Courage in Scripture is rarely the absence of fear. It’s obedience that keeps moving while the fear is still in the room. Today, you’ll be asked to make a real decision somewhere — a comment thread, a group chat, a test, a friendship. The question isn’t whether you feel ready. It’s whether you’ll move while God is still with you wherever you go.',
  ],
};

const ASSIGNMENTS = [
  { id: 1, title: 'Case File: The Empty Tomb Investigation', due: 'Friday', status: 'pending' as const },
  { id: 2, title: 'Memorize Joshua 1:9 — full verse, no hints', due: 'Sunday', status: 'pending' as const },
  { id: 3, title: 'Real Life: Standing Alone', due: 'Completed', status: 'done' as const },
];

const STUDY_QUESTIONS = [
  'Where else in Scripture does God repeat a command for emphasis? Why might repetition matter here?',
  'What is one specific situation this week where “be strong and courageous” applies to you directly?',
  'Read Joshua 1:1–9 in full context. What had Joshua just lost, and why does that make verse 9 harder to obey?',
];

type Choice = { text: string; to: string };
type SNode = { prompt: string; choices: Choice[] } | { ending: true; verdict: 'wise' | 'risky' | 'unwise'; text: string; verseRef: string; verseText: string };
type Scenario = { id: string; title: string; hook: string; tag: string; nodes: Record<string, SNode> };

const DECISION_SCENARIOS: Scenario[] = [
  {
    id: 'exam-answers',
    title: 'The Answer Sheet',
    hook: 'A classmate slides their phone toward you during a test, screen unlocked to the answers.',
    tag: 'Integrity',
    nodes: {
      start: {
        prompt: 'The teacher is at the front of the room. Nobody else has noticed. What do you do?',
        choices: [
          { text: 'Look away and keep working your own answers', to: 'wise1' },
          { text: 'Take a quick glance — just to check one answer', to: 'risky1' },
          { text: 'Use it fully; everyone does it anyway', to: 'unwise1' },
        ],
      },
      risky1: {
        prompt: 'You glance. Your classmate whispers, “See? Easy.” They keep offering the phone for the rest of the test. Now what?',
        choices: [
          { text: 'Push it back and finish honestly, even if it costs you marks', to: 'wise2' },
          { text: 'Keep glancing — you already crossed the line once', to: 'unwise1' },
        ],
      },
      wise1: { ending: true, verdict: 'wise', text: 'You finished with your own work, even without knowing the outcome. Integrity isn’t proven when it’s easy — it’s proven when a shortcut is sitting right in front of you and you still choose the harder, honest road.', verseRef: 'Proverbs 11:3', verseText: 'The integrity of the upright guides them, but the crookedness of the treacherous destroys them.' },
      wise2: { ending: true, verdict: 'wise', text: 'You stumbled toward the shortcut once, then corrected course. That’s not weakness — that’s what real repentance looks like: not never falling, but not staying down. Your grade might not be perfect. Your integrity is intact.', verseRef: 'Proverbs 24:16', verseText: 'The righteous falls seven times and rises again, but the wicked stumble in times of calamity.' },
      unwise1: { ending: true, verdict: 'unwise', text: 'You used the answers. Maybe no one caught you. But you learned something quieter and more dangerous: that convenience can outrank conviction when the room feels safe enough. That lesson costs more than one test grade.', verseRef: 'Galatians 6:7', verseText: 'Do not be deceived: God is not mocked, for whatever one sows, that will he also reap.' },
    },
  },
  {
    id: 'secret-account',
    title: 'The Second Account',
    hook: 'A friend suggests you both make a private social account your parents don’t know about — “just to talk freely.”',
    tag: 'Online life',
    nodes: {
      start: {
        prompt: 'It sounds harmless. Total privacy, no adults watching. What’s your move?',
        choices: [
          { text: 'Say no — you don’t want a hidden space in your life', to: 'wise1' },
          { text: 'Make it, but tell yourself you’ll only ever post normal stuff', to: 'risky1' },
          { text: 'Make it and don’t think about it twice', to: 'unwise1' },
        ],
      },
      risky1: {
        prompt: 'Three weeks in, the account has become the place where you say things you’d never say out loud at home. A notification pops up — someone you don’t fully trust wants to follow. Now what?',
        choices: [
          { text: 'Delete the account and tell a trusted adult it existed', to: 'wise2' },
          { text: 'Accept the follow — it’s just one more person', to: 'unwise1' },
        ],
      },
      wise1: { ending: true, verdict: 'wise', text: 'You said no to a hidden room before it existed. That’s not paranoia — it’s wisdom. Anything that only works because no one’s watching usually isn’t something you’d be proud of if they were.', verseRef: 'Ephesians 5:13', verseText: 'But when anything is exposed by the light, it becomes visible.' },
      wise2: { ending: true, verdict: 'wise', text: 'You noticed the drift before it became a habit, and you closed the door yourself instead of waiting for someone else to find it. Bringing it into the light cost you a hard conversation. It saved you a much harder one later.', verseRef: '1 John 1:7', verseText: 'But if we walk in the light, as he is in the light, we have fellowship with one another.' },
      unwise1: { ending: true, verdict: 'unwise', text: 'The hidden account became a second version of you — one your parents, your youth leader, maybe even you a year from now wouldn’t recognize. Privacy isn’t the enemy. Secrecy from the people who love you usually is.', verseRef: 'Luke 8:17', verseText: 'For nothing is hidden that will not become visible, nor anything secret that will not be known.' },
    },
  },
  {
    id: 'gossip-thread',
    title: 'The Group Chat',
    hook: 'A group chat starts tearing apart a girl from your youth group who isn’t in the chat to defend herself.',
    tag: 'Speech',
    nodes: {
      start: {
        prompt: 'Messages are flying fast. Some of it is funny. Some of it is cruel. What do you type?',
        choices: [
          { text: 'Say something to redirect or defend her', to: 'wise1' },
          { text: 'Say nothing, but don’t add to it either', to: 'risky1' },
          { text: 'Add one comment — everyone else is', to: 'unwise1' },
        ],
      },
      risky1: {
        prompt: 'The chat keeps going without you. Later, she finds out what was said and asks if you saw it. She’s hurt that you didn’t say anything.',
        choices: [
          { text: 'Tell her the truth and apologize for staying silent', to: 'wise2' },
          { text: 'Say you didn’t see much of it', to: 'unwise1' },
        ],
      },
      wise1: { ending: true, verdict: 'wise', text: 'You used your one voice in a crowded chat to slow something down. That took more nerve than staying quiet — and it’s exactly the kind of moment James is talking about.', verseRef: 'James 1:26', verseText: 'If anyone thinks he is religious and does not bridle his tongue but deceives his heart, this person’s religion is worthless.' },
      wise2: { ending: true, verdict: 'wise', text: 'Silence wasn’t harmless — but owning that honestly, instead of covering it, is how trust gets rebuilt. A late apology said straight is worth more than a smooth excuse.', verseRef: 'Proverbs 28:13', verseText: 'Whoever conceals his transgressions will not prosper, but he who confesses and forsakes them will obtain mercy.' },
      unwise1: { ending: true, verdict: 'unwise', text: 'One comment felt small in the moment. It wasn’t small to her. Words in a chat you didn’t start still carry your name when they land on someone.', verseRef: 'Proverbs 18:21', verseText: 'Death and life are in the power of the tongue, and those who love it will eat its fruits.' },
    },
  },
];

const REAL_LIFE_SCENARIOS: Scenario[] = [
  {
    id: 'shift-till',
    title: 'The Short Till',
    hook: 'Your manager at your part-time job miscounts the register in your favor by a noticeable amount — no one else has noticed yet.',
    tag: 'Workplace',
    nodes: {
      start: {
        prompt: 'It’s not a fortune, but it’s real money, and it’s not yours. What do you do?',
        choices: [
          { text: 'Flag it to your manager before your shift ends', to: 'wise1' },
          { text: 'Say nothing and see if anyone mentions it', to: 'risky1' },
          { text: 'Keep it — it was their mistake, not yours', to: 'unwise1' },
        ],
      },
      risky1: {
        prompt: 'No one mentions it for two days. You start wondering if it’s already forgotten.',
        choices: [
          { text: 'Bring it up late, but bring it up', to: 'wise2' },
          { text: 'Let it go — too much time has passed now', to: 'unwise1' },
        ],
      },
      wise1: { ending: true, verdict: 'wise', text: 'You corrected it immediately, before it had time to feel normal. That’s the whole trick temptation plays — it counts on delay. You didn’t give it any.', verseRef: 'Luke 16:10', verseText: 'One who is faithful in a very little is also faithful in much.' },
      wise2: { ending: true, verdict: 'wise', text: 'Late honesty is still honesty. It would have been easier to let the silence stand — you didn’t, and that says something true about who you actually are under pressure.', verseRef: 'Proverbs 16:11', verseText: 'A just balance and scales are the Lord’s; all the weights in the bag are his work.' },
      unwise1: { ending: true, verdict: 'unwise', text: 'The money stayed quiet in your pocket, but it didn’t stay quiet in your conscience. Small compromises like this one are rarely about the money — they’re a rehearsal for the bigger ones.', verseRef: 'Luke 16:10', verseText: 'One who is dishonest in a very little is also dishonest in much.' },
    },
  },
  {
    id: 'family-conflict',
    title: 'The Silent House',
    hook: 'Your parents are in the middle of a serious argument, and the tension has spilled onto everyone at home for days.',
    tag: 'Family',
    nodes: {
      start: {
        prompt: 'You’re old enough to feel every bit of the tension but not old enough to fix it. What do you actually do?',
        choices: [
          { text: 'Pray specifically for them, even if it feels small', to: 'wise1' },
          { text: 'Try to stay out of everyone’s way and wait it out', to: 'risky1' },
          { text: 'Pick a side and make it known', to: 'unwise1' },
        ],
      },
      risky1: {
        prompt: 'Staying quiet feels safe, but the house still feels heavy, and you notice yourself pulling away from everyone, not just the conflict.',
        choices: [
          { text: 'Talk to one trusted adult outside the house about how you’re doing', to: 'wise2' },
          { text: 'Keep withdrawing — it’s easier than talking', to: 'unwise1' },
        ],
      },
      wise1: { ending: true, verdict: 'wise', text: 'You couldn’t control the argument, so you controlled what you brought to it: prayer instead of panic, and instead of picking a side. That’s a mature response to something most adults handle badly too.', verseRef: 'Philippians 4:6', verseText: 'Do not be anxious about anything, but in everything by prayer and supplication... let your requests be made known to God.' },
      wise2: { ending: true, verdict: 'wise', text: 'You didn’t have to carry it alone, and you were honest enough to say so. Reaching for support isn’t weakness — it’s exactly what kept a heavy season from turning into isolation.', verseRef: 'Ecclesiastes 4:9', verseText: 'Two are better than one, because they have a good reward for their toil.' },
      unwise1: { ending: true, verdict: 'unwise', text: 'Picking a side — or disappearing completely — both feel like doing something. Neither one actually helped, and both left you carrying weight that was never meant to be yours alone.', verseRef: 'Romans 12:18', verseText: 'If possible, so far as it depends on you, live peaceably with all.' },
    },
  },
];

type CaseEvidence = { id: string; label: string; ref: string; text: string };
type CaseFile = { id: string; title: string; mystery: string; evidence: CaseEvidence[]; question: string; options: { id: string; text: string }[]; correct: string; explanation: string };

const CASE_FILES: CaseFile[] = [
  {
    id: 'empty-tomb',
    title: 'The Empty Tomb Investigation',
    mystery: 'Three women arrive at a sealed, guarded tomb expecting a body. They find neither the body nor the guards where they left them. Read the evidence below, then reach a verdict.',
    evidence: [
      { id: 'e1', label: 'Evidence 1 — The Seal', ref: 'Matthew 27:65-66', text: 'Pilate posted a Roman guard and sealed the stone. A broken Roman seal was a capital offense — no ordinary grave robber risks it.' },
      { id: 'e2', label: 'Evidence 2 — The Witnesses', ref: 'Luke 24:1-3', text: 'The first witnesses were women, whose testimony carried little legal weight in that culture. A fabricated story would likely have used male, higher-status witnesses instead.' },
      { id: 'e3', label: 'Evidence 3 — The Grave Clothes', ref: 'John 20:6-7', text: 'Peter finds the linen wrappings lying in place, with the face cloth folded separately — not the scene of a hurried theft, which would leave clothes scattered or missing.' },
      { id: 'e4', label: 'Evidence 4 — The Aftermath', ref: 'Acts 1:3, 1 Corinthians 15:6', text: 'Multiple accounts describe over 500 people claiming to see Jesus alive afterward, and the disciples — previously terrified and scattered — began preaching this publicly, at personal risk.' },
    ],
    question: 'Based on this evidence, which explanation best fits what actually happened?',
    options: [
      { id: 'a', text: 'The disciples stole the body and invented the resurrection story' },
      { id: 'b', text: 'The women went to the wrong tomb by mistake' },
      { id: 'c', text: 'The evidence is most consistent with a real, physical resurrection' },
      { id: 'd', text: 'There isn’t enough evidence to reach any conclusion' },
    ],
    correct: 'c',
    explanation: 'A theft doesn’t explain a broken Roman seal, folded grave clothes, or disciples who went from hiding to being executed for a story they could have simply admitted was false. The evidence doesn’t force belief — but it consistently points toward something that actually happened, not a myth that grew over time.',
  },
  {
    id: 'thorn-flesh',
    title: 'The Thorn That Stayed',
    mystery: 'Paul — the man behind visions, miracles and half the New Testament — asks God three times to remove a “thorn in the flesh.” God says no. Investigate why.',
    evidence: [
      { id: 'e1', label: 'Evidence 1 — The Request', ref: '2 Corinthians 12:7-8', text: 'Paul calls it “a messenger of Satan to harass me,” and says he pleaded with the Lord three times that it would leave him.' },
      { id: 'e2', label: 'Evidence 2 — The Reason Given', ref: '2 Corinthians 12:7', text: 'Paul says the thorn was given “to keep me from becoming conceited” because of the exceptional revelations he had received.' },
      { id: 'e3', label: 'Evidence 3 — The Answer', ref: '2 Corinthians 12:9', text: '“My grace is sufficient for you, for my power is made perfect in weakness.” Paul reports God’s answer directly, in God’s own words.' },
      { id: 'e4', label: 'Evidence 4 — Paul’s Response', ref: '2 Corinthians 12:9-10', text: 'Paul says he will boast in his weaknesses instead, so that Christ’s power may rest on him, and that he is content in hardships “for Christ’s sake.”' },
    ],
    question: 'What does the evidence suggest about why God didn’t remove the thorn?',
    options: [
      { id: 'a', text: 'God was unable to remove it' },
      { id: 'b', text: 'Paul didn’t have enough faith for it to be removed' },
      { id: 'c', text: 'The thorn served a purpose — keeping Paul dependent on grace rather than his own strength' },
      { id: 'd', text: 'God simply ignored the request' },
    ],
    correct: 'c',
    explanation: 'The text is explicit: the thorn guarded Paul against pride, and God’s answer reframed the problem instead of removing it — “my power is made perfect in weakness.” Unanswered prayer, here, isn’t evidence of God’s absence. It’s presented as evidence of a different kind of answer.',
  },
];

type Question = { q: string; options: string[]; correct: number; ref: string };
const ASK_WORD_QUESTIONS: Question[] = [
  { q: 'In Romans 3:25, what does the word “propitiation” describe about Christ?', options: ['A moral example for believers to imitate', 'The sacrifice that satisfies God’s just wrath against sin', 'A symbolic ritual with no real effect', 'A title used only for Old Testament priests'], correct: 1, ref: 'Romans 3:25' },
  { q: 'What is the theological term for God existing as three persons, one being?', options: ['Incarnation', 'Trinity', 'Covenant', 'Sanctification'], correct: 1, ref: 'Matthew 28:19' },
  { q: 'Which prophet was told to marry an unfaithful woman as a living picture of Israel’s unfaithfulness to God?', options: ['Jeremiah', 'Hosea', 'Amos', 'Micah'], correct: 1, ref: 'Hosea 1:2' },
  { q: 'What does “sanctification” refer to in Christian teaching?', options: ['The moment of first believing', 'The final resurrection of the body', 'The ongoing process of being made holy', 'The act of being baptized'], correct: 2, ref: '1 Thessalonians 4:3' },
  { q: 'In the book of Job, who ultimately speaks and answers Job’s questions?', options: ['Job’s three friends', 'An angel', 'God, out of the whirlwind', 'Job answers his own questions'], correct: 2, ref: 'Job 38:1' },
];

type JourneyStage = 'read' | 'think' | 'speak' | 'live';
const JOURNEY_STAGES: { id: JourneyStage; title: string; blurb: string }[] = [
  { id: 'read', title: 'Read', blurb: 'Read the full passage in context, not just the highlighted verse.' },
  { id: 'think', title: 'Think', blurb: 'Write a private reflection. Nobody sees this unless you choose to submit it.' },
  { id: 'speak', title: 'Speak', blurb: 'Say the verse out loud to someone this week — a parent, a friend, your class.' },
  { id: 'live', title: 'Live', blurb: 'Describe one real moment you applied it. You choose whether this goes to your teacher.' },
];

const DEFAULT_JOURNEY_DONE: Record<JourneyStage, boolean> = { read: false, think: false, speak: false, live: false };

function readTeenMap<T>(raw: string | null, teenId: number, fallback: T): T {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && Object.prototype.hasOwnProperty.call(parsed, teenId)) {
      return parsed[teenId] as T;
    }
  } catch { /* Use fallback */ }
  return fallback;
}

function writeTeenMap<T>(key: string, teenId: number, value: T) {
  let map: Record<string, T> = {};
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) map = parsed;
    }
  } catch { /* Fresh map */ }
  map[teenId] = value;
  localStorage.setItem(key, JSON.stringify(map));
}

type TeenProgressState = {
  points: number;
  casesSolved: string[];
  decisionsMade: string[];
  notes: Record<number, string>;
  journeyDone: Record<JourneyStage, boolean>;
  journeyAwarded: Record<JourneyStage, boolean>;
  journeyDraft: string;
  journeyLive: string;
  journeySubmitted: boolean;
  connectedClass: { name: string; code: string } | null;
};

function loadTeenProgress(teenId: number): TeenProgressState {
  const points = readTeenMap<number | null>(localStorage.getItem('lanternLionTeenPoints'), teenId, null);
  const casesSolved = readTeenMap<string[]>(localStorage.getItem('lanternLionTeenCases'), teenId, []);
  const decisionsMade = readTeenMap<string[]>(localStorage.getItem('lanternLionTeenDecisions'), teenId, []);
  const notes = readTeenMap<Record<number, string>>(localStorage.getItem('lanternLionTeenNotesByTeen'), teenId, {});
  const journey = readTeenMap<{ done: Record<JourneyStage, boolean>; awarded?: Record<JourneyStage, boolean>; draft: string; live: string; submitted: boolean } | null>(localStorage.getItem('lanternLionTeenJourney'), teenId, null);
  const connectedClass = readTeenMap<{ name: string; code: string } | null>(localStorage.getItem('lanternLionTeenClass'), teenId, null);
  return {
    points: points ?? 220,
    casesSolved,
    decisionsMade,
    notes,
    journeyDone: journey?.done || DEFAULT_JOURNEY_DONE,
    journeyAwarded: journey?.awarded || journey?.done || DEFAULT_JOURNEY_DONE,
    journeyDraft: journey?.draft || '',
    journeyLive: journey?.live || '',
    journeySubmitted: Boolean(journey?.submitted),
    connectedClass,
  };
}

export default function TeenDashboardPage() {
  const router = useRouter();
  const [teens, setTeens] = useState<Teen[]>(fallbackTeens);
  const [activeId, setActiveId] = useState<number>(fallbackTeens[0].id);
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [todaySummary, setTodaySummary] = useState<{ active_seconds: number; games_played: number; quests_completed: number; xp_earned: number; achievements_earned: number } | null>(null);
  const [learningStreak, setLearningStreak] = useState<StreakStatus | null>(null);
  const [milestoneToast, setMilestoneToast] = useState<{ label: string; coins: number; gems: number } | null>(null);
  const [learningPlan, setLearningPlan] = useState<LearningPlanResponse | null>(null);

  useActivityHeartbeat(hydrated);

  useEffect(() => {
    if (!hydrated) return;
    fetch('/api/child/learning-plan')
      .then((res) => (res.ok ? (res.json() as Promise<LearningPlanResponse>) : null))
      .then((data) => { if (data) setLearningPlan(data); })
      .catch(() => { /* Offline */ });
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    fetch('/api/child/today')
      .then((res) => (res.ok ? (res.json() as Promise<{ summary: typeof todaySummary; streak: StreakStatus }>) : null))
      .then((data) => {
        if (data?.summary) setTodaySummary(data.summary);
        if (data?.streak) {
          setLearningStreak(data.streak);
          const milestone = claimStreakMilestoneIfNew(activeId, data.streak.currentStreak);
          if (milestone) {
            setMilestoneToast(milestone);
            window.setTimeout(() => setMilestoneToast(null), 5000);
          }
        }
      })
      .catch(() => { /* Offline */ });
  }, [hydrated, activeId]);

  async function fetchStreakCalendar() {
    try {
      const res = await fetch('/api/child/streak-calendar?days=7');
      if (!res.ok) return [];
      const data = (await res.json()) as { calendar: { date: string; state: 'complete' | 'grace' | 'pending' | 'none' }[] };
      return data.calendar || [];
    } catch {
      return [];
    }
  }

  const [points, setPoints] = useState(220);
  const [wallet, setWallet] = useState<Wallet>({ xp: 220, coins: 45, gems: 12 });
  const [casesSolved, setCasesSolved] = useState<string[]>([]);
  const [decisionsMade, setDecisionsMade] = useState<string[]>([]);
  const [showProfiles, setShowProfiles] = useState(false);
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [familyData, setFamilyData] = useState({ familyName: 'The Adeyemi Family', parentName: 'Jordan Adeyemi', country: 'Nigeria' });
  const [familyMembers, setFamilyMembers] = useState<Teen[]>(fallbackTeens);

  const [activeScenario, setActiveScenario] = useState<Scenario | null>(null);
  const [nodeId, setNodeId] = useState('start');

  const [activeCase, setActiveCase] = useState<CaseFile | null>(null);
  const [reviewedEvidence, setReviewedEvidence] = useState<string[]>([]);
  const [verdict, setVerdict] = useState<string | null>(null);
  const [verdictSubmitted, setVerdictSubmitted] = useState(false);

  const [quizIndex, setQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [quizDone, setQuizDone] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);

  const [assignments, setAssignments] = useState(ASSIGNMENTS);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [devotionOpen, setDevotionOpen] = useState(false);
  const [classCode, setClassCode] = useState('');
  const [connectedClass, setConnectedClass] = useState<{ name: string; code: string } | null>(null);
  const [classError, setClassError] = useState('');

  const [journeyDone, setJourneyDone] = useState<Record<JourneyStage, boolean>>({ read: false, think: false, speak: false, live: false });
  const [journeyAwarded, setJourneyAwarded] = useState<Record<JourneyStage, boolean>>({ read: false, think: false, speak: false, live: false });
  const [journeyDraft, setJourneyDraft] = useState('');
  const [journeyLive, setJourneyLive] = useState('');
  const [journeySubmitted, setJourneySubmitted] = useState(false);

  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinNotice, setPinNotice] = useState('');
  const [safetyNotice, setSafetyNotice] = useState<string | null>(null);
  const [dailyQuestSummary, setDailyQuestSummary] = useState({ completed: 0, total: 4, streak: 0 });
  const [charAppearance, setCharAppearance] = useState<CharacterAppearance>({ skinTone: 'honey', hairStyle: 'curls', face: 'smile' });
  const [charEquipment, setCharEquipment] = useState<CharacterEquipment>({});
  const [charDisplayName, setCharDisplayName] = useState<string>('Tobi');

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const family = JSON.parse(localStorage.getItem('lanternLionDemoFamily') || localStorage.getItem('lanternLionFamilyData') || 'null');
        const parentSession = JSON.parse(localStorage.getItem('lanternLionDemoSession') || 'null');
        const session = JSON.parse(localStorage.getItem('lanternLionTeenSession') || 'null');

        if (family) {
          setFamilyData({
            familyName: family.familyName || 'The Adeyemi Family',
            parentName: parentSession?.name || 'Jordan Adeyemi',
            country: family.country || 'Nigeria',
          });
        }
        setFamilyMembers(family?.children?.length ? family.children : fallbackTeens);

        const teenList: Teen[] = family?.children?.length ? family.children.filter((c: Teen) => c.age >= 13) : fallbackTeens;
        setTeens(teenList.length ? teenList : fallbackTeens);
        const savedId = session?.teenId || Number(localStorage.getItem('lanternLionActiveChildId'));
        
        const currentTeenId = savedId && teenList.some((t) => t.id === savedId) ? savedId : teenList[0]?.id || fallbackTeens[0].id;
        setActiveId(currentTeenId);

        // Persist the resolved identity every time this effect runs, so
        // other pages that independently call readActiveProfile() (e.g.
        // /character, /adventure, /arcade) agree on who is logged in
        // instead of falling back to the hardcoded demo profile.
        const matchedForSession = teenList.find((t) => t.id === currentTeenId);
        localStorage.setItem('lanternLionActiveChildId', String(currentTeenId));
        localStorage.setItem('lanternLionTeenSession', JSON.stringify({
          teenId: currentTeenId,
          username: matchedForSession?.username || session?.username,
          name: matchedForSession?.name || session?.name,
          age: matchedForSession?.age || session?.age,
        }));

        const teenModuleProgress = JSON.parse(localStorage.getItem('lanternLionModuleProgress') || '{}')?.[currentTeenId] || {};
        const todaySet = getOrCreateTodaySet(currentTeenId, { moduleProgress: teenModuleProgress, masteredQuestIds: [], kind: 'teen' });
        setDailyQuestSummary({
          completed: getCompletedCount(todaySet),
          total: todaySet.quests.length,
          streak: computeStreak(readHistory(currentTeenId)).current,
        });

        const progress = loadTeenProgress(currentTeenId);
        setPoints(progress.points);
        setCasesSolved(progress.casesSolved);
        setDecisionsMade(progress.decisionsMade);
        setNotes(progress.notes);
        setJourneyDone(progress.journeyDone);
        setJourneyAwarded(progress.journeyAwarded);
        setJourneyDraft(progress.journeyDraft);
        setJourneyLive(progress.journeyLive);
        setJourneySubmitted(progress.journeySubmitted);
        setConnectedClass(progress.connectedClass);

        setCharAppearance(readAppearance(currentTeenId));
        setCharEquipment(readEquipment(currentTeenId));
        const matchedTeen = (family?.children || fallbackTeens).find((t: Teen) => t.id === currentTeenId);
        setCharDisplayName(readCharacterName(currentTeenId, matchedTeen?.name || 'Tobi'));

        const w = getWallet(currentTeenId);
        if (w.xp > 0) {
          setPoints(w.xp);
          setWallet(w);
        } else {
          setWallet({ xp: progress.points, coins: w.coins || 45, gems: w.gems || 12 });
        }

        // Arriving from a subpage's sidebar (e.g. /adventure) via
        // /teen-dashboard?tab=journey should land on that tab.
        const requestedTab = new URLSearchParams(window.location.search).get('tab') as Tab | null;
        const validTabs: Tab[] = ['home', 'decision', 'cases', 'askword', 'learn', 'journey', 'profile'];
        if (requestedTab && validTabs.includes(requestedTab)) setActiveTab(requestedTab);
      } catch { /* keep demo defaults */ }
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [router]);

  useEffect(() => { if (hydrated) writeTeenMap('lanternLionTeenPoints', activeId, points); }, [points, activeId, hydrated]);
  useEffect(() => { if (hydrated) writeTeenMap('lanternLionTeenCases', activeId, casesSolved); }, [casesSolved, activeId, hydrated]);
  useEffect(() => { if (hydrated) writeTeenMap('lanternLionTeenDecisions', activeId, decisionsMade); }, [decisionsMade, activeId, hydrated]);
  useEffect(() => { if (hydrated) writeTeenMap('lanternLionTeenNotesByTeen', activeId, notes); }, [notes, activeId, hydrated]);
  useEffect(() => { if (hydrated) writeTeenMap('lanternLionTeenJourney', activeId, { done: journeyDone, awarded: journeyAwarded, draft: journeyDraft, live: journeyLive, submitted: journeySubmitted }); }, [journeyDone, journeyAwarded, journeyDraft, journeyLive, journeySubmitted, activeId, hydrated]);
  useEffect(() => { if (hydrated) writeTeenMap('lanternLionTeenClass', activeId, connectedClass); }, [connectedClass, activeId, hydrated]);

  // Ask the Word timer
  const [timeLeft, setTimeLeft] = useState(20);
  useEffect(() => {
    if (!quizStarted || quizDone || quizAnswer !== null) return;
    if (timeLeft <= 0) { handleQuizAnswer(-1); return; }
    const t = window.setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, quizStarted, quizDone, quizAnswer]);

  const teen = teens.find((t) => t.id === activeId) || teens[0] || fallbackTeens[0];
  const { current: level, next: nextLevel, progress: levelProgress } = levelInfo(points);
  const journeyStagesDone = Object.values(journeyDone).filter(Boolean).length;

  function addPoints(amount: number) {
    const coinsAmount = Math.floor(amount / 2);
    setPoints((p) => p + amount);
    awardXP(activeId, amount, 'activity', 'Lion’s Den activity');
    if (coinsAmount > 0) {
      awardCoins(activeId, coinsAmount, 'activity', 'Lion’s Den reward');
    }
    const updatedWallet = getWallet(activeId);
    setWallet(updatedWallet);
  }

  function statsForSibling(member: Teen) {
    if (member.id === activeId) {
      return { track: trackForAge(member.age), points, streak: dailyQuestSummary.streak };
    }
    if (member.age >= 13) {
      const memberPoints = readTeenMap<number | null>(localStorage.getItem('lanternLionTeenPoints'), member.id, null) ?? 220;
      return { track: trackForAge(member.age), points: memberPoints, streak: computeStreak(readHistory(member.id)).current };
    }
    const track = trackForAge(member.age);
    const modules = curriculumModules.filter((m) => m.track === track);
    const progress = JSON.parse(localStorage.getItem('lanternLionModuleProgress') || '{}')?.[member.id] || {};
    const done = modules.reduce((sum: number, m) => sum + (progress[m.id]?.completedIndices.length || 0), 0);
    return { track, points: done * 8, streak: computeStreak(readHistory(member.id)).current };
  }

  function openScenario(scenario: Scenario) { setActiveScenario(scenario); setNodeId('start'); }
  function chooseBranch(to: string) { setNodeId(to); }
  function finishScenario(scenario: Scenario, verdictTag: 'wise' | 'risky' | 'unwise') {
    if (!decisionsMade.includes(scenario.id)) {
      setDecisionsMade([...decisionsMade, scenario.id]);
      addPoints(verdictTag === 'wise' ? 30 : verdictTag === 'risky' ? 15 : 10);
    }
  }
  function resetScenario() { setNodeId('start'); }
  function closeScenario() { setActiveScenario(null); setNodeId('start'); }

  function openCase(c: CaseFile) { setActiveCase(c); setReviewedEvidence([]); setVerdict(null); setVerdictSubmitted(false); }
  function markReviewed(id: string) { if (!reviewedEvidence.includes(id)) setReviewedEvidence([...reviewedEvidence, id]); }
  function submitVerdict() {
    if (!verdict || !activeCase) return;
    setVerdictSubmitted(true);
    if (verdict === activeCase.correct && !casesSolved.includes(activeCase.id)) {
      setCasesSolved([...casesSolved, activeCase.id]);
      addPoints(50);
    }
  }
  function closeCase() { setActiveCase(null); }

  function startQuiz() { setQuizIndex(0); setQuizScore(0); setQuizAnswer(null); setQuizDone(false); setQuizStarted(true); setTimeLeft(20); }
  function handleQuizAnswer(optionIndex: number) {
    if (quizAnswer !== null) return;
    setQuizAnswer(optionIndex);
    const correct = optionIndex === ASK_WORD_QUESTIONS[quizIndex].correct;
    if (correct) setQuizScore((s) => s + 1);
    window.setTimeout(() => {
      if (quizIndex + 1 >= ASK_WORD_QUESTIONS.length) {
        setQuizDone(true);
        addPoints(quizScore * 10 + (correct ? 10 : 0));
      } else {
        setQuizIndex((i) => i + 1);
        setQuizAnswer(null);
        setTimeLeft(20);
      }
    }, 1400);
  }
  function exitQuiz() { setQuizStarted(false); setQuizDone(false); setActiveTab('home'); }

  function toggleAssignment(id: number) {
    setAssignments(assignments.map((a) => a.id === id ? { ...a, status: a.status === 'done' ? 'pending' : 'done' } : a));
  }

  function connectClass() {
    setClassError('');
    const code = classCode.trim().toUpperCase();
    if (code === 'LAMP-731') {
      const c = { name: 'Friday Teen Circle', code };
      setConnectedClass(c);
      setClassCode('');
    } else {
      setClassError('That code didn’t match an open teen circle. Ask your teacher, or try LAMP-731.');
    }
  }

  function toggleJourneyStage(stage: JourneyStage) {
    const wasDone = journeyDone[stage];
    setJourneyDone({ ...journeyDone, [stage]: !wasDone });
    if (!wasDone && !journeyAwarded[stage]) {
      addPoints(15);
      setJourneyAwarded({ ...journeyAwarded, [stage]: true });
    }
  }
  function submitJourney() { setJourneySubmitted(true); addPoints(20); }

  function handleChatSafetyFlag(message: string) {
    const report = { child: teen.name, kind: 'Chat: please check in', message, time: new Date().toISOString() };
    try {
      localStorage.setItem('lanternLionDemoHelpRequest', JSON.stringify(report));
    } catch { /* Storage error */ }
    setSafetyNotice('Your parent has been quietly told about this chat, so they can check in with you.');
    window.setTimeout(() => setSafetyNotice(null), 6000);
  }

  function changePin(e: React.FormEvent) {
    e.preventDefault();
    if (newPin.length !== 4 || confirmPin.length !== 4) { setPinNotice('Your new PIN needs 4 digits.'); return; }
    if (newPin !== confirmPin) { setPinNotice('Those two PINs don’t match. Try again.'); return; }
    try {
      const family = JSON.parse(localStorage.getItem('lanternLionDemoFamily') || 'null');
      if (family?.children) {
        family.children = family.children.map((c: Teen) => c.id === teen.id ? { ...c, pin: newPin } : c);
        localStorage.setItem('lanternLionDemoFamily', JSON.stringify(family));
      }
    } catch { /* Storage error */ }
    setTeens(teens.map((t) => t.id === teen.id ? { ...t, pin: newPin } : t));
    setPinNotice('Your PIN was updated for this demo session.');
    setNewPin('');
    setConfirmPin('');
  }

  if (!hydrated) {
    return (
      <main className="dashboard-loading dashboard-loading-teen" aria-live="polite">
        <span />
        <p>Opening the Lion’s Den…</p>
      </main>
    );
  }

  return (
    <main className="teen-dashboard">
      {/* STREAK MILESTONE TOAST */}
      {milestoneToast && (
        <div className="streak-milestone-toast" role="status" aria-live="polite">
          <strong>🔥 {milestoneToast.label}!</strong>
          <span>+{milestoneToast.coins} 🪙{milestoneToast.gems > 0 ? ` +${milestoneToast.gems} 💎` : ''}</span>
        </div>
      )}

      {/* SAFETY NOTICE TOAST */}
      {safetyNotice && (
        <div className="streak-milestone-toast" role="status" aria-live="polite" style={{ borderColor: '#3b82f6' }}>
          <strong>🛡️ Family Check-in</strong>
          <span>{safetyNotice}</span>
        </div>
      )}

      {/* ── TOPBAR NAVIGATION & HUD ── */}
      <header className="teen-topbar">
        {/* Left: Mobile Menu Trigger + Brand Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            className="teen-menu-trigger"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            ☰
          </button>
          <Link href="/" className="teen-logo" aria-label="Lantern and Lion - Lion's Den">
            <div className="teen-logo-mark">
              <Image src="/lantern-lion-logo.png" alt="" width={44} height={44} priority />
            </div>
            <span className="teen-logo-text">
              <strong>Lion’s Den</strong>
              <small>Lantern &amp; Lion · Courage &amp; Faith</small>
            </span>
          </Link>
        </div>

        {/* Right: HUD Metrics & Profile Capsule */}
        <div className="teen-header-right">
          {/* HUD Metric Chips */}
          <div className="teen-hud-chips">
            <span className="teen-hud-pill teen-hud-streak" title="Daily Learning Streak">
              🔥 <strong>{dailyQuestSummary.streak}d</strong>
            </span>
            <span className="teen-hud-pill teen-hud-xp" title="Total XP Earned">
              ⭐ <strong>{points.toLocaleString()} XP</strong>
            </span>
            <span className="teen-hud-pill teen-hud-coins" title="Lantern Coins">
              🪙 <strong>{wallet.coins.toLocaleString()}</strong>
            </span>
            <span className="teen-hud-pill teen-hud-gems" title="Kingdom Gems">
              💎 <strong>{wallet.gems.toLocaleString()}</strong>
            </span>
          </div>

          {/* Profile Switcher Capsule */}
          <div className="teen-profile-switch">
            <button
              type="button"
              className="teen-profile-btn"
              aria-expanded={showProfiles}
              onClick={() => setShowProfiles(!showProfiles)}
              aria-label="Account profile settings and switch account"
            >
              <span className="teen-profile-initial">{teen.name.slice(0, 1)}</span>
              <div className="teen-profile-btn-info">
                <b>{teen.name}</b>
                <small>{level.name} ▾</small>
              </div>
            </button>

            {showProfiles && (
              <div className="teen-profile-menu" role="menu">
                <div className="teen-profile-menu-head">
                  <strong>{teen.name}</strong>
                  <small>{familyData.familyName}</small>
                </div>
                <button
                  type="button"
                  className="teen-profile-menu-item"
                  onClick={() => { setShowFamilyModal(true); setShowProfiles(false); }}
                >
                  👨‍👩‍👧 Family Progress Overview
                </button>
                <Link
                  href="/teen-access"
                  onClick={() => {
                    void signOutOfPersona('teen');
                  }}
                  className="teen-signout-link"
                >
                  Sign out / Switch account
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── APP BODY: SIDEBAR NAVIGATION + MAIN CANVAS ── */}
      <div className="teen-body-container">
        {/* ── LEFT SIDEBAR NAVIGATION DOCK ── */}
        <TeenSidebar
          activeItem={activeTab}
          onTabSelect={(tab) => {
            setActiveTab(tab);
            if (tab === 'decision') setActiveScenario(null);
            if (tab === 'cases') setActiveCase(null);
            if (tab === 'askword') { setQuizStarted(false); setQuizDone(false); }
          }}
          mobileMenuOpen={mobileMenuOpen}
          onCloseMobileMenu={() => setMobileMenuOpen(false)}
          charAppearance={charAppearance}
          charEquipment={charEquipment}
          charDisplayName={charDisplayName}
          levelName={level.name}
          points={points}
        />

        {/* ── MAIN CANVAS AREA ── */}
        <div className="teen-main-canvas">
          {/* ── TAB 1: HOME (DASHBOARD HUB) ── */}
          {activeTab === 'home' && (
            <div className="teen-body" style={{ width: '100%', padding: '0 0 60px' }}>
              {/* 1. HERO SECTION: CONFIDENT GREETING & PROGRESS METRICS */}
              <section className="teen-welcome">
                <div className="teen-welcome-left">
                  <div className="teen-kicker-tag">
                    <span className="teen-kicker-spark">⚡</span>
                    <span>LION’S DEN · TEEN EXPEDITION</span>
                  </div>
                  <h1>Hey, {teen.name}. One real step today.</h1>
                  <p className="teen-welcome-sub">{DEVOTION.title}</p>
                  
                  <div className="teen-welcome-stats">
                    <div className="teen-stat-badge">
                      <span className="stat-label">Current Rank</span>
                      <strong>{level.name}</strong>
                    </div>
                    <div className="teen-stat-badge">
                      <span className="stat-label">Decisions Explored</span>
                      <strong>{decisionsMade.length}</strong>
                    </div>
                    <div className="teen-stat-badge">
                      <span className="stat-label">Cases Solved</span>
                      <strong>{casesSolved.length}</strong>
                    </div>
                  </div>
                </div>

                <div className="teen-level-card">
                  <div className="teen-level-card-top">
                    <span className="teen-level-card-kicker">LEVEL PROGRESS</span>
                    <span className="teen-level-card-xp">{points.toLocaleString()} XP</span>
                  </div>
                  <div className="teen-level-bar" role="progressbar" aria-valuenow={levelProgress} aria-valuemin={0} aria-valuemax={100}>
                    <i style={{ width: `${levelProgress}%` }} />
                  </div>
                  <p className="teen-level-card-foot">
                    {nextLevel ? (
                      <span><b>{nextLevel.min - points} XP</b> to {nextLevel.name}</span>
                    ) : (
                      <span>Top rank reached · Lightbearer</span>
                    )}
                  </p>
                </div>
              </section>

              {/* 2. PRIMARY ACTION ROW: RECOMMENDED BIBLE EXPEDITION & DAILY QUESTS */}
              <div className="teen-action-cards-grid">
                {/* Action 1: Recommended Next Expedition */}
                {(() => {
                  const advCtx = loadWorldContext(teen.id, 'teen');
                  const next = getNextMissionRecommendation(advCtx);
                  return (
                    <section className="teen-expedition-portal-card">
                      <div className="teen-card-kicker-row">
                        <span className="teen-portal-region-icon">{next.region.icon}</span>
                        <span className="teen-portal-region-name">{next.region.name}</span>
                        <span className="teen-portal-tag">ACTIVE EXPEDITION</span>
                      </div>
                      <div className="teen-portal-body">
                        <h3>{next.title}</h3>
                        <p>{next.subtitle}</p>
                      </div>
                      <div className="teen-portal-action">
                        <Link href={next.actionHref} className="teen-primary-btn">
                          <span>▶ Launch Expedition</span>
                          <span className="btn-arrow">→</span>
                        </Link>
                      </div>
                    </section>
                  );
                })()}

                {/* Action 2: Daily Quests Board */}
                <section className="teen-daily-missions-card">
                  <div className="teen-card-kicker-row">
                    <span className="teen-portal-region-icon">📅</span>
                    <span className="teen-portal-region-name">DAILY MISSIONS</span>
                    <span className="teen-portal-tag">STREAK + REWARD</span>
                  </div>
                  <div className="teen-portal-body">
                    <h3>Today’s Missions</h3>
                    <p>Complete {dailyQuestSummary.total} Scripture practice goals to boost your weekly league rank.</p>
                    <div className="teen-quest-meter-track">
                      <div
                        className="teen-quest-meter-fill"
                        style={{ width: `${(dailyQuestSummary.completed / Math.max(dailyQuestSummary.total, 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="teen-daily-missions-foot">
                    <span className="teen-quest-fraction">
                      <b>{dailyQuestSummary.completed}</b> / {dailyQuestSummary.total} Completed
                    </span>
                    <Link href="/daily-quests" className="teen-secondary-btn">
                      {dailyQuestSummary.completed >= dailyQuestSummary.total ? 'View Rewards →' : 'Start Quests →'}
                    </Link>
                  </div>
                </section>
              </div>

              {/* 3. HERO CHARACTER PROFILE & LOADOUT SHOWCASE */}
              <section className="teen-character-card">
                <div className="teen-char-avatar-side">
                  <CharacterAvatar appearance={charAppearance} equipment={charEquipment} size="large" showPedestal={true} />
                </div>
                <div className="teen-char-details-side">
                  <div className="teen-char-badge-row">
                    <span className="teen-char-pill">⚔️ Hero Profile</span>
                    <span className="teen-char-rank-pill">{level.name} · Level {Math.floor(points / 100) + 1}</span>
                  </div>
                  <h2>{charDisplayName}</h2>
                  <p className="teen-char-desc">
                    Customized avatar with live biblical artifacts and adventurer gear. Level up through Decision Labs, Case Files, and Daily Scripture to unlock rare items.
                  </p>

                  <div className="teen-char-equipped-row">
                    <div className="teen-char-slot" title="Headwear">
                      <ItemIllustration itemId={charEquipment.headwear || 'starter-cap'} size={28} />
                      <span>{charEquipment.headwear ? getItem(charEquipment.headwear)?.name : 'Traveler’s Cap'}</span>
                    </div>
                    <div className="teen-char-slot" title="Robe / Cloak">
                      <ItemIllustration itemId={charEquipment.clothing || 'starter-tunic'} size={28} />
                      <span>{charEquipment.clothing ? getItem(charEquipment.clothing)?.name : 'Traveler’s Tunic'}</span>
                    </div>
                    <div className="teen-char-slot" title="Footwear">
                      <ItemIllustration itemId={charEquipment.shoes || 'starter-sandals'} size={28} />
                      <span>{charEquipment.shoes ? getItem(charEquipment.shoes)?.name : 'Simple Sandals'}</span>
                    </div>
                    {charEquipment.accessory && (
                      <div className="teen-char-slot" title="Accessory">
                        <ItemIllustration itemId={charEquipment.accessory} size={28} />
                        <span>{getItem(charEquipment.accessory)?.name}</span>
                      </div>
                    )}
                    {charEquipment.special && (
                      <div className="teen-char-slot teen-char-slot-special" title="Special Artifact">
                        <ItemIllustration itemId={charEquipment.special} size={28} />
                        <span>{getItem(charEquipment.special)?.name}</span>
                      </div>
                    )}
                  </div>

                  <div className="teen-char-btn-row">
                    <Link href="/character" className="teen-primary-btn">
                      <span>Customize Gear &amp; Artifacts 🎨</span>
                      <span className="btn-arrow">→</span>
                    </Link>
                    <Link href="/adventure" className="teen-secondary-btn">
                      <span>Enter Adventure Map 🗺️</span>
                    </Link>
                  </div>
                </div>
              </section>

              {/* 4. STREAK CARD & LEAGUE POD CARD */}
              <div className="teen-social-progression-grid">
                {learningStreak ? (
                  <StreakCard streak={learningStreak} tone="teen" onFetchCalendar={fetchStreakCalendar} />
                ) : (
                  <div className="teen-fallback-streak-card">
                    <div className="streak-head">
                      <span className="streak-fire">🔥</span>
                      <div>
                        <strong>{dailyQuestSummary.streak} Days Strong</strong>
                        <small>Keep building your daily Scripture rhythm.</small>
                      </div>
                    </div>
                  </div>
                )}

                <LeagueCard
                  pod={getLeaguePod(teen.id, teen.name, teen.age, teen.avatar, charAppearance)}
                  isTeen={true}
                />
              </div>

              {/* 5. ADAPTIVE LEARNING CARD */}
              {learningPlan && (
                <LearningJourneyCard plan={learningPlan} isTeen={true} />
              )}

              {/* 6. TODAY'S SUMMARY STATS (IF ACTIVE) */}
              {todaySummary && (todaySummary.games_played > 0 || todaySummary.quests_completed > 0 || todaySummary.xp_earned > 0 || todaySummary.achievements_earned > 0) && (
                <section className="teen-your-day-card" aria-label="Your session summary">
                  <div className="teen-card-kicker-row">
                    <span className="teen-portal-region-name">SESSION ACTIVITY</span>
                    <span className="teen-portal-tag">TODAY’S SUMMARY</span>
                  </div>
                  <div className="your-day-stats-grid">
                    <div className="day-stat-col">
                      <span>🔥</span>
                      <strong>{todaySummary.quests_completed}</strong>
                      <small>Quests Done</small>
                    </div>
                    <div className="day-stat-col">
                      <span>⭐</span>
                      <strong>{todaySummary.xp_earned}</strong>
                      <small>XP Gained</small>
                    </div>
                    <div className="day-stat-col">
                      <span>🎮</span>
                      <strong>{todaySummary.games_played}</strong>
                      <small>Games Played</small>
                    </div>
                    <div className="day-stat-col">
                      <span>🏆</span>
                      <strong>{todaySummary.achievements_earned}</strong>
                      <small>Achievements</small>
                    </div>
                  </div>
                </section>
              )}

              {/* 7. TODAY'S LIGHT / WEEKLY DEVOTION WITH AUDIO */}
              <section className="teen-devotion-card">
                <div className="teen-devotion-head">
                  <p className="teen-devotion-kicker">TODAY’S SCRIPTURE LIGHT</p>
                  <h2>{DEVOTION.title}</h2>
                </div>
                
                <p className="teen-verse-line big">
                  {WEEKLY_VERSE.text}
                  <span>{WEEKLY_VERSE.ref}, WEB</span>
                </p>

                <div className="teen-devotion-audio-bar">
                  <StudioAudioPlayer
                    text={`${WEEKLY_VERSE.ref}. ${WEEKLY_VERSE.text}. Weekly Devotion: ${DEVOTION.title}. ${DEVOTION.body.join(' ')}`}
                    title="Weekly Devotion Audio"
                    compact={true}
                    defaultVoiceId="en-GB-Journey-D"
                  />
                  <button
                    type="button"
                    className="teen-read-devotion-btn"
                    onClick={() => setDevotionOpen(!devotionOpen)}
                  >
                    {devotionOpen ? '▲ Collapse Devotion' : '📖 Read Full Devotion'}
                  </button>
                </div>

                {devotionOpen && (
                  <div className="teen-devotion-expanded">
                    {DEVOTION.body.map((p, i) => (
                      <p key={i} className="teen-devotion-body-para">{p}</p>
                    ))}
                  </div>
                )}
              </section>

              {/* 8. QUICK SPOTLIGHT: DECISION LAB & CASE FILES */}
              <section className="teen-home-grid">
                <article className="teen-panel">
                  <div className="teen-panel-head">
                    <div>
                      <p className="teen-kicker">WEEKLY THEME</p>
                      <h2>Courage Under Pressure</h2>
                    </div>
                    <button type="button" className="teen-link-action" onClick={() => setActiveTab('decision')}>
                      Open Decision Lab →
                    </button>
                  </div>
                  <p className="teen-panel-copy">
                    Three Decision Lab scenarios and one Bible Case File are live this week. Every path you choose leads somewhere real — there’s no single “correct” click to farm.
                  </p>
                  <div className="teen-recommend-row">
                    <button
                      type="button"
                      className="teen-recommend-card"
                      onClick={() => setActiveTab('decision')}
                    >
                      <span className="rec-icon">⚖️</span>
                      <div>
                        <strong>Decision Lab</strong>
                        <small>The Answer Sheet · Integrity</small>
                      </div>
                    </button>
                    <button
                      type="button"
                      className="teen-recommend-card"
                      onClick={() => setActiveTab('cases')}
                    >
                      <span className="rec-icon">🔍</span>
                      <div>
                        <strong>Bible Case Files</strong>
                        <small>The Empty Tomb · Evidence &amp; Verdicts</small>
                      </div>
                    </button>
                  </div>
                </article>

                <aside className="teen-side-panel">
                  <p className="teen-kicker">WEEKLY JOURNEY</p>
                  <h2>{journeyStagesDone} of 4 stages</h2>
                  <div className="teen-journey-mini" role="progressbar" aria-valuenow={(journeyStagesDone / 4) * 100} aria-valuemin={0} aria-valuemax={100}>
                    <i style={{ width: `${(journeyStagesDone / 4) * 100}%` }} />
                  </div>
                  <p>Read, think, speak, live — one verse, worked all the way through.</p>
                  <button type="button" className="teen-primary-btn" onClick={() => setActiveTab('journey')}>
                    Continue Journey →
                  </button>
                </aside>
              </section>
            </div>
          )}

          {/* ── TAB 2: DECISION LAB ── */}
          {activeTab === 'decision' && (
            <div className="teen-body" style={{ width: '100%', padding: '0 0 60px' }}>
              {!activeScenario ? (
                <>
                  <div className="teen-title">
                    <p className="teen-kicker">DECISION LAB</p>
                    <h1>Real Decisions. Real Consequences.</h1>
                    <p>Every choice branches. There is no reset button that erases what you picked — only the chance to see where each road actually leads.</p>
                  </div>

                  <div className="teen-scenario-grid">
                    {[...DECISION_SCENARIOS, ...REAL_LIFE_SCENARIOS].map((s) => (
                      <button key={s.id} type="button" className="teen-scenario-card" onClick={() => openScenario(s)}>
                        <span className="teen-scenario-tag">{s.tag}</span>
                        <strong>{s.title}</strong>
                        <small>{s.hook}</small>
                        {decisionsMade.includes(s.id) && <b className="teen-done-mark">✓ Explored</b>}
                      </button>
                    ))}
                  </div>
                </>
              ) : (() => {
                const node = activeScenario.nodes[nodeId];
                return (
                  <div className="teen-scenario-player">
                    <button type="button" className="teen-back" onClick={closeScenario}>
                      ← Back to All Scenarios
                    </button>
                    <p className="teen-scenario-tag">{activeScenario.tag}</p>
                    <h1>{activeScenario.title}</h1>
                    {nodeId === 'start' && <p className="teen-scenario-hook">{activeScenario.hook}</p>}
                    
                    {'choices' in node ? (
                      <>
                        <p className="teen-scenario-prompt">{node.prompt}</p>
                        <div className="teen-scenario-choices">
                          {node.choices.map((c, i) => (
                            <button key={i} type="button" onClick={() => chooseBranch(c.to)}>
                              {c.text}
                            </button>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className={`teen-ending teen-ending-${node.verdict}`}>
                        <span className="teen-ending-tag">
                          {node.verdict === 'wise' ? '✓ Wise Path' : node.verdict === 'risky' ? '⚠️ Risky Path' : '❌ Costly Path'}
                        </span>
                        <p>{node.text}</p>
                        <p className="teen-verse-line">
                          {node.verseText} <span>{node.verseRef}</span>
                        </p>
                        <div className="teen-scenario-choices-row">
                          <button type="button" className="teen-secondary-btn" onClick={resetScenario}>
                            Try a Different Path
                          </button>
                          <button
                            type="button"
                            className="teen-primary-btn"
                            onClick={() => { finishScenario(activeScenario, node.verdict); closeScenario(); }}
                          >
                            Finish &amp; Claim XP →
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* ── TAB 3: BIBLE CASE FILES ── */}
          {activeTab === 'cases' && (
            <div className="teen-body" style={{ width: '100%', padding: '0 0 60px' }}>
              {!activeCase ? (
                <>
                  <div className="teen-title">
                    <p className="teen-kicker">HISTORICAL INVESTIGATIONS</p>
                    <h1>Bible Case Files</h1>
                    <p>Review every piece of historical and scriptural evidence before you can reach a verdict. No skipping ahead.</p>
                  </div>

                  <div className="teen-scenario-grid">
                    {CASE_FILES.map((c) => (
                      <button key={c.id} type="button" className="teen-scenario-card" onClick={() => openCase(c)}>
                        <span className="teen-scenario-tag">Investigation</span>
                        <strong>{c.title}</strong>
                        <small>{c.mystery}</small>
                        {casesSolved.includes(c.id) && <b className="teen-done-mark">✓ Solved</b>}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="teen-scenario-player teen-case-player">
                  <button type="button" className="teen-back" onClick={closeCase}>← Back to Case Files</button>
                  <h1>{activeCase.title}</h1>
                  <p className="teen-scenario-hook">{activeCase.mystery}</p>
                  
                  <div className="teen-evidence-grid">
                    {activeCase.evidence.map((ev) => (
                      <button
                        key={ev.id}
                        type="button"
                        className={`teen-evidence-card ${reviewedEvidence.includes(ev.id) ? 'reviewed' : ''}`}
                        onClick={() => markReviewed(ev.id)}
                      >
                        <span>{reviewedEvidence.includes(ev.id) ? '✓' : ev.label.split(' ')[1]}</span>
                        <div>
                          <strong>{ev.label}</strong>
                          <small>{ev.ref}</small>
                          <p>{ev.text}</p>
                        </div>
                      </button>
                    ))}
                  </div>

                  {reviewedEvidence.length === activeCase.evidence.length ? (
                    <div className="teen-verdict-box">
                      <h3>{activeCase.question}</h3>
                      <div className="teen-verdict-options">
                        {activeCase.options.map((o) => (
                          <button
                            key={o.id}
                            type="button"
                            className={`${verdict === o.id ? 'picked' : ''} ${verdictSubmitted ? (o.id === activeCase.correct ? 'correct' : verdict === o.id ? 'wrong' : '') : ''}`}
                            disabled={verdictSubmitted}
                            onClick={() => setVerdict(o.id)}
                          >
                            {o.text}
                          </button>
                        ))}
                      </div>
                      {!verdictSubmitted ? (
                        <button type="button" className="teen-primary-btn" disabled={!verdict} onClick={submitVerdict}>
                          Submit Verdict
                        </button>
                      ) : (
                        <div className={`teen-ending teen-ending-${verdict === activeCase.correct ? 'wise' : 'unwise'}`}>
                          <span className="teen-ending-tag">
                            {verdict === activeCase.correct ? 'Case closed — correct verdict' : 'Not quite the strongest verdict'}
                          </span>
                          <p>{activeCase.explanation}</p>
                          <button type="button" className="teen-primary-btn" onClick={closeCase}>
                            Back to Case Files →
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="teen-evidence-hint">
                      Review all {activeCase.evidence.length} pieces of evidence to unlock the verdict ({reviewedEvidence.length}/{activeCase.evidence.length}).
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── TAB 4: ASK THE WORD (SPEED THEOLOGY QUIZ) ── */}
          {activeTab === 'askword' && (
            <div className="teen-body" style={{ width: '100%', padding: '0 0 60px' }}>
              <div className="teen-quiz-player">
                {!quizStarted && !quizDone && (
                  <div className="teen-quiz-intro">
                    <p className="teen-kicker">THEOLOGICAL SPEED CHALLENGE</p>
                    <h1>Ask the Word</h1>
                    <p>5 timed questions. 20 seconds each. This isn’t basic Sunday school — it’s built for teens ready to test real depth.</p>
                    <button type="button" className="teen-primary-btn" onClick={startQuiz}>
                      Start the Challenge →
                    </button>
                  </div>
                )}

                {quizStarted && !quizDone && (
                  <div className="teen-quiz-live">
                    <div className="teen-quiz-meta">
                      <span>Question {quizIndex + 1} of {ASK_WORD_QUESTIONS.length}</span>
                      <span className={`teen-quiz-timer ${timeLeft <= 5 ? 'low' : ''}`}>{timeLeft}s</span>
                    </div>
                    <h2>{ASK_WORD_QUESTIONS[quizIndex].q}</h2>
                    <div className="teen-quiz-options">
                      {ASK_WORD_QUESTIONS[quizIndex].options.map((opt, i) => (
                        <button
                          key={i}
                          type="button"
                          disabled={quizAnswer !== null}
                          className={quizAnswer !== null ? (i === ASK_WORD_QUESTIONS[quizIndex].correct ? 'correct' : i === quizAnswer ? 'wrong' : '') : ''}
                          onClick={() => handleQuizAnswer(i)}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                    {quizAnswer !== null && (
                      <p className="teen-quiz-ref">Reference: {ASK_WORD_QUESTIONS[quizIndex].ref}</p>
                    )}
                  </div>
                )}

                {quizDone && (
                  <div className="teen-quiz-results">
                    <h1>{quizScore}/{ASK_WORD_QUESTIONS.length}</h1>
                    <p>
                      {quizScore >= 4
                        ? 'Sharp! That is a strong grasp of deep theological and historical scripture.'
                        : 'A tough round. Worth checking out the Learn & Notes tab to review context.'}
                    </p>
                    <div className="teen-quiz-result-actions">
                      <button type="button" className="teen-secondary-btn" onClick={startQuiz}>
                        Play Again
                      </button>
                      <button type="button" className="teen-primary-btn" onClick={exitQuiz}>
                        Back to Home →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── TAB 5: LEARN & NOTES ── */}
          {activeTab === 'learn' && (
            <div className="teen-body" style={{ width: '100%', padding: '0 0 60px' }}>
              <div className="teen-title">
                <p className="teen-kicker">SCRIPTURE CONTEXT &amp; NOTES</p>
                <h1>Go past the highlight verse.</h1>
                <p>Real study means context, not just a single quote. Work through this week’s passage and save private notes.</p>
              </div>

              <section className="teen-panel teen-scripture-panel">
                <p className="teen-verse-line big">
                  {WEEKLY_VERSE.text} <span>{WEEKLY_VERSE.ref}, WEB</span>
                </p>
                <h3>Study Questions — Private Drafts</h3>
                <p className="teen-panel-copy">Nobody reads these unless you choose to submit them from the Journey tab. Write honestly.</p>
                {STUDY_QUESTIONS.map((q, i) => (
                  <div key={i} className="teen-study-question">
                    <label htmlFor={`study-q-${i}`}>{q}</label>
                    <textarea
                      id={`study-q-${i}`}
                      value={notes[i] || ''}
                      onChange={(e) => setNotes({ ...notes, [i]: e.target.value })}
                      placeholder="Type your thinking here — even a rough answer counts."
                    />
                  </div>
                ))}
              </section>

              <section className="teen-panel">
                <div className="teen-panel-head">
                  <div>
                    <p className="teen-kicker">ASSIGNMENTS</p>
                    <h2>From Your Class</h2>
                  </div>
                </div>
                {assignments.map((a) => (
                  <article key={a.id} className="teen-assignment-row">
                    <button
                      type="button"
                      className={`teen-check ${a.status === 'done' ? 'done' : ''}`}
                      onClick={() => toggleAssignment(a.id)}
                      aria-pressed={a.status === 'done'}
                      aria-label={a.status === 'done' ? `Mark "${a.title}" as not done` : `Mark "${a.title}" as done`}
                    >
                      {a.status === 'done' ? '✓' : ''}
                    </button>
                    <div>
                      <strong>{a.title}</strong>
                      <small>Due {a.due}</small>
                    </div>
                  </article>
                ))}
              </section>

              <section className="teen-panel teen-class-panel">
                <div className="teen-panel-head">
                  <div>
                    <p className="teen-kicker">CLASS CONNECTION</p>
                    <h2>{connectedClass ? connectedClass.name : 'Not Connected Yet'}</h2>
                  </div>
                </div>
                {connectedClass ? (
                  <p className="teen-panel-copy">Connected with code <b>{connectedClass.code}</b>. Assignments above sync from this class.</p>
                ) : (
                  <div className="teen-class-connect">
                    <input
                      value={classCode}
                      onChange={(e) => setClassCode(e.target.value)}
                      placeholder="Enter your teacher’s join code"
                      maxLength={12}
                    />
                    <button type="button" className="teen-primary-btn" onClick={connectClass}>
                      Connect Class
                    </button>
                    {classError && <p className="teen-inline-error">{classError}</p>}
                  </div>
                )}
              </section>
            </div>
          )}

          {/* ── TAB 6: JOURNEY (READ · THINK · SPEAK · LIVE) ── */}
          {activeTab === 'journey' && (
            <div className="teen-body" style={{ width: '100%', padding: '0 0 60px' }}>
              <div className="teen-title">
                <p className="teen-kicker">WEEKLY SCRIPTURE CYCLE</p>
                <h1>Read. Think. Speak. Live.</h1>
                <p>One verse, carried all the way from the page into an actual moment of your week.</p>
              </div>

              <section className="teen-panel teen-scripture-panel">
                <p className="teen-verse-line big">{WEEKLY_VERSE.text} <span>{WEEKLY_VERSE.ref}, WEB</span></p>
              </section>

              <div className="teen-journey-stages">
                {JOURNEY_STAGES.map((stage) => (
                  <article key={stage.id} className={`teen-journey-stage ${journeyDone[stage.id] ? 'done' : ''}`}>
                    <div className="teen-journey-stage-head">
                      <span>{journeyDone[stage.id] ? '✓' : ''}</span>
                      <div>
                        <strong>{stage.title}</strong>
                        <small>{stage.blurb}</small>
                      </div>
                    </div>
                    {stage.id === 'think' && (
                      <textarea
                        value={journeyDraft}
                        onChange={(e) => setJourneyDraft(e.target.value)}
                        placeholder="Private draft — only you can see this."
                      />
                    )}
                    {stage.id === 'live' && (
                      <textarea
                        value={journeyLive}
                        onChange={(e) => setJourneyLive(e.target.value)}
                        placeholder="What happened this week when you tried to live this out?"
                      />
                    )}
                    <button
                      type="button"
                      className={journeyDone[stage.id] ? 'teen-unmark-btn' : 'teen-primary-btn'}
                      onClick={() => toggleJourneyStage(stage.id)}
                    >
                      {journeyDone[stage.id] ? 'Mark Not Done' : 'Mark Complete (+15 XP)'}
                    </button>
                  </article>
                ))}
              </div>

              {journeyStagesDone === 4 && !journeySubmitted && (
                <section className="teen-panel teen-submit-panel">
                  <p className="teen-kicker">ALL FOUR STAGES COMPLETE</p>
                  <h2>Submit this week’s reflection to your teacher?</h2>
                  <p className="teen-panel-copy">Only your “Live” note is shared if you submit. Your private “Think” draft stays private either way. This is optional.</p>
                  <button type="button" className="teen-primary-btn" onClick={submitJourney}>
                    Submit to Teacher (+20 XP)
                  </button>
                </section>
              )}

              {journeySubmitted && (
                <p className="teen-submitted-note">✓ This week’s Live reflection was submitted to your teacher.</p>
              )}
            </div>
          )}

          {/* ── TAB 7: PROFILE & SECURITY PIN ── */}
          {activeTab === 'profile' && (
            <div className="teen-body" style={{ width: '100%', padding: '0 0 60px' }}>
              <div className="teen-title">
                <p className="teen-kicker">HERO PROFILE &amp; SECURITY</p>
                <h1>{teen.name} · Lion’s Den · Age {teen.age}</h1>
              </div>

              <section className="teen-character-card teen-profile-char-card">
                <div className="teen-char-avatar-side">
                  <CharacterAvatar appearance={charAppearance} equipment={charEquipment} size="large" showPedestal={true} />
                </div>
                <div className="teen-char-details-side">
                  <div className="teen-char-badge-row">
                    <span className="teen-char-pill">🧑 Active Loadout</span>
                    <span className="teen-char-rank-pill">{level.name} · Level {Math.floor(points / 100) + 1}</span>
                  </div>
                  <h2>{charDisplayName}</h2>
                  <p className="teen-char-desc">
                    Your character carries your unlocked armor, tunics, headwear, and companion artifacts into all Adventure World quests.
                  </p>

                  <div className="teen-char-equipped-row">
                    <div className="teen-char-slot" title="Headwear">
                      <ItemIllustration itemId={charEquipment.headwear || 'starter-cap'} size={28} />
                      <span>{charEquipment.headwear ? getItem(charEquipment.headwear)?.name : 'Traveler’s Cap'}</span>
                    </div>
                    <div className="teen-char-slot" title="Robe / Cloak">
                      <ItemIllustration itemId={charEquipment.clothing || 'starter-tunic'} size={28} />
                      <span>{charEquipment.clothing ? getItem(charEquipment.clothing)?.name : 'Traveler’s Tunic'}</span>
                    </div>
                    <div className="teen-char-slot" title="Footwear">
                      <ItemIllustration itemId={charEquipment.shoes || 'starter-sandals'} size={28} />
                      <span>{charEquipment.shoes ? getItem(charEquipment.shoes)?.name : 'Simple Sandals'}</span>
                    </div>
                  </div>

                  <div className="teen-char-btn-row">
                    <Link href="/character" className="teen-primary-btn">
                      <span>Open Gear Customizer 🎨</span>
                      <span className="btn-arrow">→</span>
                    </Link>
                  </div>
                </div>
              </section>

              <section className="teen-panel">
                <div className="teen-panel-head">
                  <div>
                    <p className="teen-kicker">ACCOUNT SECURITY</p>
                    <h2>Change Your 4-Digit PIN</h2>
                  </div>
                </div>
                <form onSubmit={changePin} className="teen-pin-form">
                  <label>
                    <span>New 4-digit PIN</span>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••"
                    />
                  </label>
                  <label>
                    <span>Confirm PIN</span>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••"
                    />
                  </label>
                  <button type="submit" className="teen-primary-btn">
                    Update PIN
                  </button>
                </form>
                {pinNotice && <p className="teen-pin-notice">{pinNotice}</p>}
              </section>

              <Link
                href="/teen-access"
                onClick={() => {
                  void signOutOfPersona('teen');
                }}
                className="teen-signout-full"
              >
                Sign Out of {teen.name}
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── FAMILY SUMMARY MODAL ── */}
      {showFamilyModal && (
        <div className="help-overlay" role="dialog" aria-modal="true">
          <div className="help-dialog family-modal-dialog">
            <button type="button" className="close-help" onClick={() => setShowFamilyModal(false)}>✕</button>
            <div className="family-modal-badge">👨‍👩‍👧</div>
            <p className="child-kicker">Family Account</p>
            <h2>{familyData.familyName}</h2>
            <div className="family-modal-child-grid">
              {familyMembers.map((c) => {
                const s = statsForSibling(c);
                return (
                  <div key={c.id} className={`family-score-card ${c.id === activeId ? 'current' : ''}`}>
                    <div className="fam-card-avatar">{c.name.slice(0, 1)}</div>
                    <div className="fam-card-info">
                      <strong>{c.name} {c.id === activeId ? '(You)' : ''}</strong>
                      <small>{c.age} years old · {s.streak}d streak</small>
                    </div>
                    <div className="fam-card-points">
                      <b>⭐ {s.points}</b>
                    </div>
                  </div>
                );
              })}
            </div>
            <button type="button" className="family-modal-close-btn" onClick={() => setShowFamilyModal(false)}>
              Close Overview
            </button>
          </div>
        </div>
      )}

      {/* ── EMBEDDED CHAT ASSISTANT (TEEN MODE) ── */}
      <ChatAssistant
        mode="teen"
        name={teen.name}
        onSafetyFlag={handleChatSafetyFlag}
      />
    </main>
  );
}
