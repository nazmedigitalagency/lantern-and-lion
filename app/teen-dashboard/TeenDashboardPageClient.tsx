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

type Teen = { id: number; name: string; username?: string; age: number; avatar: string; pin: string };
type Tab = 'home' | 'learn' | 'play' | 'journey' | 'profile';
type PlayMode = 'menu' | 'decision' | 'reallife' | 'cases' | 'askword';

function trackForAge(age: number): CurriculumModule['track'] {
  if (age <= 5) return 'early';
  if (age <= 10) return 'pathfinder';
  return 'teen';
}

const trackLabel: Record<CurriculumModule['track'], string> = {
  early: 'Lantern Explorers',
  pathfinder: 'Brave Pathfinders',
  teen: 'The Lion’s Den',
  family: 'All-Age Family Quest',
};

const trackEmoji: Record<CurriculumModule['track'], string> = {
  early: '🏮',
  pathfinder: '🧭',
  teen: '🦁',
  family: '🌟',
};

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

const WEEKLY_VERSE = { ref: 'Joshua 1:9', text: '“Have I not commanded you? Be strong and courageous. Do not be frightened, and do not be dismayed, for the Lord your God is with you wherever you go.”' };

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
    id: 'exam-answers', title: 'The Answer Sheet', hook: 'A classmate slides their phone toward you during a test, screen unlocked to the answers.', tag: 'Integrity',
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
    id: 'secret-account', title: 'The Second Account', hook: 'A friend suggests you both make a private social account your parents don’t know about — “just to talk freely.”', tag: 'Online life',
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
    id: 'gossip-thread', title: 'The Group Chat', hook: 'A group chat starts tearing apart a girl from your youth group who isn’t in the chat to defend herself.', tag: 'Speech',
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
    id: 'shift-till', title: 'The Short Till', hook: 'Your manager at your part-time job miscounts the register in your favor by a noticeable amount — no one else has noticed yet.', tag: 'Workplace',
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
    id: 'family-conflict', title: 'The Silent House', hook: 'Your parents are in the middle of a serious argument, and the tension has spilled onto everyone at home for days.', tag: 'Family',
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
  {
    id: 'witness-bullying', title: 'The Hallway', hook: 'You see someone getting mocked hard by a group in the hallway. You’re not involved, and you know some of the people doing it.', tag: 'Courage',
    nodes: {
      start: {
        prompt: 'Getting involved could make you a target too. What do you do?',
        choices: [
          { text: 'Walk over and stand with the person being mocked', to: 'wise1' },
          { text: 'Keep walking, but tell a teacher right after', to: 'risky1' },
          { text: 'Keep walking and say nothing to anyone', to: 'unwise1' },
        ],
      },
      risky1: {
        prompt: 'You told a teacher, but it happens again the next day, and this time no adult is nearby.',
        choices: [
          { text: 'Step in directly this time', to: 'wise2' },
          { text: 'Keep reporting it after the fact and hope it stops', to: 'unwise1' },
        ],
      },
      wise1: { ending: true, verdict: 'wise', text: 'You put yourself between the crowd and the person they were targeting. That’s not a small thing — it’s the exact kind of courage Joshua 1:9 was written for: strong and courageous, even when it’s socially expensive.', verseRef: 'Proverbs 31:8', verseText: 'Open your mouth for the mute, for the rights of all who are destitute.' },
      wise2: { ending: true, verdict: 'wise', text: 'You tried the safer route first, and when it wasn’t enough, you didn’t stay comfortable — you stepped in. Courage that grows when the easy option fails is the kind that’s actually real.', verseRef: 'Galatians 6:2', verseText: 'Bear one another’s burdens, and so fulfill the law of Christ.' },
      unwise1: { ending: true, verdict: 'unwise', text: 'Staying uninvolved felt safe, but someone still walked away from that hallway alone. Neutrality feels like nothing happened. For the person being mocked, something absolutely happened.', verseRef: 'James 4:17', verseText: 'So whoever knows the right thing to do and fails to do it, for him it is sin.' },
    },
  },
];

type CaseEvidence = { id: string; label: string; ref: string; text: string };
type CaseFile = { id: string; title: string; mystery: string; evidence: CaseEvidence[]; question: string; options: { id: string; text: string }[]; correct: string; explanation: string };

const CASE_FILES: CaseFile[] = [
  {
    id: 'empty-tomb', title: 'The Empty Tomb Investigation', mystery: 'Three women arrive at a sealed, guarded tomb expecting a body. They find neither the body nor the guards where they left them. Read the evidence below, then reach a verdict.',
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
    id: 'thorn-flesh', title: 'The Thorn That Stayed', mystery: 'Paul — the man behind visions, miracles and half the New Testament — asks God three times to remove a “thorn in the flesh.” God says no. Investigate why.',
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
  {
    id: 'birthright', title: 'The Case of the Traded Birthright', mystery: 'Esau trades his entire inheritance for a bowl of stew. Was this one impulsive moment, or was something building underneath it?',
    evidence: [
      { id: 'e1', label: 'Evidence 1 — The Trade', ref: 'Genesis 25:29-34', text: 'Esau comes in exhausted from hunting, demands the stew, and says “I am about to die; of what use is a birthright to me?”' },
      { id: 'e2', label: 'Evidence 2 — The Verdict', ref: 'Genesis 25:34', text: 'The text itself comments: “Thus Esau despised his birthright” — this is framed as the narrator’s judgment, not just a hungry decision.' },
      { id: 'e3', label: 'Evidence 3 — Later Reflection', ref: 'Hebrews 12:16-17', text: 'Esau is later described as “unholy,” who sold his birthright for a single meal, and who found no way to change the outcome, though he sought it with tears.' },
      { id: 'e4', label: 'Evidence 4 — What the Birthright Meant', ref: 'Genesis 27:36 (context)', text: 'The birthright carried a double inheritance and the covenant blessing passed down from Abraham — this wasn’t a small family formality.' },
    ],
    question: 'What does the fuller evidence suggest about Esau’s trade?',
    options: [
      { id: 'a', text: 'It was a single unfair moment of weakness with no real pattern' },
      { id: 'b', text: 'It revealed a settled attitude that treated something sacred as worthless' },
      { id: 'c', text: 'Jacob tricked him with no fault of Esau’s own' },
      { id: 'd', text: 'The birthright wasn’t actually valuable, so nothing was really lost' },
    ],
    correct: 'b',
    explanation: 'The narrator’s own verdict — “Esau despised his birthright” — plus Hebrews’ later commentary both point past a single bad moment to a deeper pattern: something sacred, traded cheaply, because it wasn’t valued in the first place. The tears came after the trade, not before it.',
  },
];

type Question = { q: string; options: string[]; correct: number; ref: string };
const ASK_WORD_QUESTIONS: Question[] = [
  { q: 'In Romans 3:25, what does the word “propitiation” describe about Christ?', options: ['A moral example for believers to imitate', 'The sacrifice that satisfies God’s just wrath against sin', 'A symbolic ritual with no real effect', 'A title used only for Old Testament priests'], correct: 1, ref: 'Romans 3:25' },
  { q: 'What is the theological term for God existing as three persons, one being?', options: ['Incarnation', 'Trinity', 'Covenant', 'Sanctification'], correct: 1, ref: 'Matthew 28:19' },
  { q: 'Which prophet was told to marry an unfaithful woman as a living picture of Israel’s unfaithfulness to God?', options: ['Jeremiah', 'Hosea', 'Amos', 'Micah'], correct: 1, ref: 'Hosea 1:2' },
  { q: 'What does “sanctification” refer to in Christian teaching?', options: ['The moment of first believing', 'The final resurrection of the body', 'The ongoing process of being made holy', 'The act of being baptized'], correct: 2, ref: '1 Thessalonians 4:3' },
  { q: 'In the book of Job, who ultimately speaks and answers Job’s questions?', options: ['Job’s three friends', 'An angel', 'God, out of the whirlwind', 'Job answers his own questions'], correct: 2, ref: 'Job 38:1' },
  { q: 'What covenant sign did God give Noah after the flood?', options: ['Circumcision', 'The rainbow', 'The Sabbath', 'The Passover lamb'], correct: 1, ref: 'Genesis 9:13' },
  { q: 'Which New Testament letter was written specifically to correct the teaching that faith alone requires no accompanying action?', options: ['Romans', 'James', 'Galatians', 'Philemon'], correct: 1, ref: 'James 2:17' },
  { q: 'What does “grace” mean, most precisely, in Paul’s letters?', options: ['Earned favor through good works', 'Unmerited favor freely given', 'A feeling of religious peace', 'Strict obedience to the law'], correct: 1, ref: 'Ephesians 2:8-9' },
  { q: 'Who did God send to confront King David after his sin with Bathsheba?', options: ['Samuel', 'Nathan', 'Elijah', 'Gad the seer only'], correct: 1, ref: '2 Samuel 12:1' },
  { q: 'What is the meaning of “Immanuel,” the name given in Isaiah’s prophecy?', options: ['The Lord will provide', 'God is with us', 'God is our strength', 'Prince of Peace'], correct: 1, ref: 'Isaiah 7:14' },
];

type JourneyStage = 'read' | 'think' | 'speak' | 'live';
const JOURNEY_STAGES: { id: JourneyStage; title: string; blurb: string }[] = [
  { id: 'read', title: 'Read', blurb: 'Read the full passage in context, not just the highlighted verse.' },
  { id: 'think', title: 'Think', blurb: 'Write a private reflection. Nobody sees this unless you choose to submit it.' },
  { id: 'speak', title: 'Speak', blurb: 'Say the verse out loud to someone this week — a parent, a friend, your class.' },
  { id: 'live', title: 'Live', blurb: 'Describe one real moment you applied it. You choose whether this goes to your teacher.' },
];

const DEFAULT_JOURNEY_DONE: Record<JourneyStage, boolean> = { read: false, think: false, speak: false, live: false };

// Each teen's progress is stored under their own id inside these maps so siblings never see or overwrite each other's data.
function readTeenMap<T>(raw: string | null, teenId: number, fallback: T): T {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && Object.prototype.hasOwnProperty.call(parsed, teenId)) {
      return parsed[teenId] as T;
    }
  } catch { /* Malformed or legacy data — use the default. */ }
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
  } catch { /* Start a fresh map. */ }
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
  const [tab, setTab] = useState<Tab>('home');
  const [playMode, setPlayMode] = useState<PlayMode>('menu');
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
      .catch(() => { /* Offline — widget just stays hidden. */ });
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
      .catch(() => { /* Offline — widget just stays hidden. */ });
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
  const [safetyNotice, setSafetyNotice] = useState('');
  const [dailyQuestSummary, setDailyQuestSummary] = useState({ completed: 0, total: 4, streak: 0 });
  const [charAppearance, setCharAppearance] = useState<CharacterAppearance>({ skinTone: 'honey', hairStyle: 'curls', face: 'smile' });
  const [charEquipment, setCharEquipment] = useState<CharacterEquipment>({});
  const [charDisplayName, setCharDisplayName] = useState<string>('Tobi');

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const family = JSON.parse(localStorage.getItem('lanternLionDemoFamily') || 'null');
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
        const savedId = session?.teenId;
        // The signed-in session is the only trustworthy source of "who is this" —
        // never fall back to teenList[0] when the session doesn't match a known
        // teen, since that would silently show this teen a different sibling's
        // dashboard (points, cases, journal, PIN, everything keyed by activeId).
        if (!savedId || !teenList.some((t) => t.id === savedId)) {
          router.replace('/teen-access');
          return;
        }
        const currentTeenId = savedId;
        setActiveId(currentTeenId);

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

  function addPoints(amount: number) { setPoints((p) => p + amount); }

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
    if (!decisionsMade.includes(scenario.id)) { setDecisionsMade([...decisionsMade, scenario.id]); addPoints(verdictTag === 'wise' ? 30 : verdictTag === 'risky' ? 15 : 10); }
  }
  function resetScenario() { setNodeId('start'); }
  function closeScenario() { setActiveScenario(null); setNodeId('start'); }

  function openCase(c: CaseFile) { setActiveCase(c); setReviewedEvidence([]); setVerdict(null); setVerdictSubmitted(false); }
  function markReviewed(id: string) { if (!reviewedEvidence.includes(id)) setReviewedEvidence([...reviewedEvidence, id]); }
  function submitVerdict() {
    if (!verdict || !activeCase) return;
    setVerdictSubmitted(true);
    if (verdict === activeCase.correct && !casesSolved.includes(activeCase.id)) { setCasesSolved([...casesSolved, activeCase.id]); addPoints(50); }
  }
  function closeCase() { setActiveCase(null); }

  function startQuiz() { setQuizIndex(0); setQuizScore(0); setQuizAnswer(null); setQuizDone(false); setQuizStarted(true); setTimeLeft(20); }
  function handleQuizAnswer(optionIndex: number) {
    if (quizAnswer !== null) return;
    setQuizAnswer(optionIndex);
    const correct = optionIndex === ASK_WORD_QUESTIONS[quizIndex].correct;
    if (correct) setQuizScore((s) => s + 1);
    window.setTimeout(() => {
      if (quizIndex + 1 >= ASK_WORD_QUESTIONS.length) { setQuizDone(true); addPoints(quizScore * 10 + (correct ? 10 : 0)); }
      else { setQuizIndex((i) => i + 1); setQuizAnswer(null); setTimeLeft(20); }
    }, 1400);
  }
  function exitQuiz() { setQuizStarted(false); setQuizDone(false); setPlayMode('menu'); }

  function toggleAssignment(id: number) { setAssignments(assignments.map((a) => a.id === id ? { ...a, status: a.status === 'done' ? 'pending' : 'done' } : a)); }
  function connectClass() {
    setClassError('');
    const code = classCode.trim().toUpperCase();
    if (code === 'LAMP-731') { const c = { name: 'Friday Teen Circle', code }; setConnectedClass(c); setClassCode(''); }
    else setClassError('That code didn’t match an open teen circle. Ask your teacher, or try LAMP-731.');
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
    localStorage.setItem('lanternLionDemoHelpRequest', JSON.stringify(report));
    setSafetyNotice('Your parent has been quietly told about this chat, so they can check in with you.');
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
    } catch { /* PIN change could not be saved to the family record. */ }
    setTeens(teens.map((t) => t.id === teen.id ? { ...t, pin: newPin } : t));
    setPinNotice('Your PIN was updated for this demo session.'); setNewPin(''); setConfirmPin('');
  }

  if (!hydrated) return <main className="dashboard-loading" aria-live="polite"><span /><p>Opening the Lion’s Den…</p></main>;

  return (
    <main className="teen-dashboard">
      {milestoneToast && (
        <div className="streak-milestone-toast" role="status" aria-live="polite">
          <strong>🔥 {milestoneToast.label}!</strong>
          <span>+{milestoneToast.coins} 🪙{milestoneToast.gems > 0 ? ` +${milestoneToast.gems} 💎` : ''}</span>
        </div>
      )}
      <header className="teen-topbar">
        <Link href="/" className="teen-logo"><Image src="/lantern-lion-logo.png" alt="" width={50} height={50} /><span><strong>Lion’s Den</strong><small>Lantern &amp; Lion</small></span></Link>
        <nav className="teen-nav" aria-label="Teen dashboard">
          {(['home', 'learn', 'play', 'journey', 'profile'] as Tab[]).map((id) => (
            <button key={id} className={tab === id ? 'active' : ''} aria-pressed={tab === id} onClick={() => { setTab(id); setPlayMode('menu'); }}>{id === 'home' ? 'Home' : id === 'learn' ? 'Learn' : id === 'play' ? 'Play' : id === 'journey' ? 'Journey' : 'Profile'}</button>
          ))}
        </nav>
        <div className="teen-header-right">
          <Link href="/adventure" className="teen-world-link">🗺️ World</Link>
          <Link href="/stories" className="teen-world-link">📖 Stories</Link>
          <Link href="/character" className="teen-world-link">🧑 Character</Link>
          <Link href="/leagues" className="teen-world-link">🏆 Leagues</Link>
          <span className="teen-streak-pill">🔥 {dailyQuestSummary.streak}-day</span>
          <span className="teen-points-pill">{points} XP · {level.name}</span>
          <div className="teen-profile-switch">
            <button className="teen-profile-btn" aria-expanded={showProfiles} onClick={() => setShowProfiles(!showProfiles)}><span>{teen.name.slice(0, 1)}</span><b>{teen.name}</b></button>
            {showProfiles && (
              <div className="teen-profile-menu">
                <button type="button" className="child-family-summary-btn" onClick={() => { setShowFamilyModal(true); setShowProfiles(false); }}>🌟 Our family summary</button>
                <Link href="/teen-access" onClick={() => { fetch('/api/child-auth/logout', { method: 'POST' }).catch(() => {}); localStorage.removeItem('lanternLionTeenSession'); localStorage.removeItem('lanternLionActiveChildId'); }} className="teen-signout-link">Sign out of {teen.name}</Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {tab === 'home' && (
        <div className="teen-body">
          <section className="teen-welcome">
            <div>
              <p className="teen-kicker">Ready when you are</p>
              <h1>Hey, {teen.name}. One real step today.</h1>
              <p>{DEVOTION.title}</p>
              <div className="teen-welcome-stats">
                <span><b>{level.name}</b> current rank</span>
                <span><b>{decisionsMade.length}</b> decisions made</span>
                <span><b>{casesSolved.length}</b> cases closed</span>
              </div>
            </div>
            <div className="teen-level-card">
              <span>{points} XP</span>
              <div className="teen-level-bar"><i style={{ width: `${levelProgress}%` }} /></div>
              <small>{nextLevel ? `${nextLevel.min - points} XP to ${nextLevel.name}` : 'Top rank reached'}</small>
            </div>
          </section>

          {learningStreak && (
            <StreakCard streak={learningStreak} tone="teen" onFetchCalendar={fetchStreakCalendar} />
          )}

          <LeagueCard
            pod={getLeaguePod(teen.id, teen.name, teen.age, teen.avatar, charAppearance)}
            isTeen={true}
          />

          {learningPlan && (
            <LearningJourneyCard plan={learningPlan} isTeen={true} />
          )}

          {todaySummary && (todaySummary.games_played > 0 || todaySummary.quests_completed > 0 || todaySummary.xp_earned > 0 || todaySummary.achievements_earned > 0) && (
            <section className="child-your-day" aria-label="Your day so far">
              <h2>Your day</h2>
              <div className="your-day-stats">
                <span>🔥 {todaySummary.quests_completed} quest{todaySummary.quests_completed === 1 ? '' : 's'} completed</span>
                <span>⭐ {todaySummary.xp_earned} XP earned</span>
                <span>🎮 {todaySummary.games_played} game{todaySummary.games_played === 1 ? '' : 's'} played</span>
                <span>🏆 {todaySummary.achievements_earned} achievement{todaySummary.achievements_earned === 1 ? '' : 's'}</span>
              </div>
            </section>
          )}

          <section className="teen-daily-card">
            <div className="teen-daily-head">
              <span aria-hidden="true">📅</span>
              <div>
                <strong>Today’s Quests</strong>
                <small>{dailyQuestSummary.completed}/{dailyQuestSummary.total} complete{dailyQuestSummary.streak > 0 ? ` · 🔥 ${dailyQuestSummary.streak} day streak` : ''}</small>
              </div>
            </div>
            <Link href="/daily-quests" className="button button-primary">
              {dailyQuestSummary.completed >= dailyQuestSummary.total ? 'View rewards →' : 'Start quests →'}
            </Link>
          </section>

          {(() => {
            const advCtx = loadWorldContext(teen.id, 'teen');
            const next = getNextMissionRecommendation(advCtx);
            return (
              <section className="teen-daily-card" style={{ border: '1.5px solid var(--teen-cobalt)', background: 'var(--teen-sky-tint, #EFF6FF)' }}>
                <div className="teen-daily-head">
                  <span aria-hidden="true" style={{ fontSize: '1.75rem' }}>{next.region.icon}</span>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--teen-cobalt-dark)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Expedition Portal · {next.region.name}
                    </span>
                    <strong style={{ display: 'block', color: 'var(--teen-ink)', fontSize: '1.05rem' }}>{next.title}</strong>
                    <small style={{ color: 'var(--teen-text-secondary)' }}>{next.subtitle}</small>
                  </div>
                </div>
                <Link href={next.actionHref} className="button button-primary">
                  ▶ Launch Expedition →
                </Link>
              </section>
            );
          })()}

          {/* ── Teen Hero Character Showcase ── */}
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
                <Link href="/character" className="teen-char-action-btn primary">
                  Customize Character &amp; Inventory 🎨 →
                </Link>
                <Link href="/adventure" className="teen-char-action-btn secondary">
                  Enter Adventure Map 🗺️
                </Link>
              </div>
            </div>
          </section>

          <section className="teen-devotion-card">
            <div>
              <p className="teen-kicker">Today’s Light</p>
              <h2>{DEVOTION.title}</h2>
              <p className="teen-verse-line big">{WEEKLY_VERSE.text} <span>{WEEKLY_VERSE.ref}, WEB</span></p>

              <div className="teen-devotion-audio-bar">
                <StudioAudioPlayer
                  text={`${WEEKLY_VERSE.ref}. ${WEEKLY_VERSE.text}. Weekly Devotion: ${DEVOTION.title}. ${DEVOTION.body.join(' ')}`}
                  title="Weekly Devotion Audio"
                  compact={true}
                  defaultVoiceId="en-GB-Journey-D"
                />
                <button className="teen-link-btn" onClick={() => setDevotionOpen(!devotionOpen)}>
                  {devotionOpen ? '▲ Show less devotion' : '📖 Read full devotion'}
                </button>
              </div>

              {devotionOpen && DEVOTION.body.map((p, i) => <p key={i} className="teen-devotion-body">{p}</p>)}
            </div>
          </section>

          <section className="teen-home-grid">
            <article className="teen-panel">
              <div className="teen-panel-head"><div><p className="teen-kicker">This week’s theme</p><h2>Courage Under Pressure</h2></div><button onClick={() => setTab('play')}>Open Play</button></div>
              <p className="teen-panel-copy">Three Decision Lab scenarios and one Bible Case File are live this week. Every path you choose leads somewhere real — there’s no single “correct” click to farm.</p>
              <div className="teen-recommend-row">
                <button className="teen-recommend-card" onClick={() => { setTab('play'); setPlayMode('decision'); }}><span>⚖</span><div><strong>Decision Lab</strong><small>The Answer Sheet</small></div></button>
                <button className="teen-recommend-card" onClick={() => { setTab('play'); setPlayMode('cases'); }}><span>🔍</span><div><strong>Case Files</strong><small>The Empty Tomb</small></div></button>
              </div>
            </article>
            <aside className="teen-side-panel">
              <p className="teen-kicker">Weekly journey</p>
              <h2>{journeyStagesDone} of 4 stages</h2>
              <div className="teen-journey-mini"><i style={{ width: `${(journeyStagesDone / 4) * 100}%` }} /></div>
              <p>Read, think, speak, live — one verse, worked all the way through.</p>
              <button onClick={() => setTab('journey')}>Continue journey</button>
            </aside>
          </section>
        </div>
      )}

      {tab === 'learn' && (
        <div className="teen-body">
          <div className="teen-title"><p className="teen-kicker">Scripture study</p><h1>Go past the highlight verse.</h1><p>Real study means context, not just a quote. Work through this week’s passage properly.</p></div>

          <section className="teen-panel teen-scripture-panel">
            <p className="teen-verse-line big">{WEEKLY_VERSE.text} <span>{WEEKLY_VERSE.ref}, WEB</span></p>
            <h3>Study questions — private drafts</h3>
            <p className="teen-panel-copy">Nobody reads these unless you choose to submit them from the Journey tab. Write honestly.</p>
            {STUDY_QUESTIONS.map((q, i) => (
              <div key={i} className="teen-study-question">
                <label>{q}</label>
                <textarea value={notes[i] || ''} onChange={(e) => setNotes({ ...notes, [i]: e.target.value })} placeholder="Type your thinking here — even a rough answer counts." />
              </div>
            ))}
          </section>

          <section className="teen-panel">
            <div className="teen-panel-head"><div><p className="teen-kicker">Assignments</p><h2>From your class</h2></div></div>
            {assignments.map((a) => (
              <article key={a.id} className="teen-assignment-row">
                <button className={`teen-check ${a.status === 'done' ? 'done' : ''}`} onClick={() => toggleAssignment(a.id)} aria-pressed={a.status === 'done'} aria-label={a.status === 'done' ? `Mark "${a.title}" as not done` : `Mark "${a.title}" as done`}>{a.status === 'done' ? '✓' : ''}</button>
                <div><strong>{a.title}</strong><small>Due {a.due}</small></div>
              </article>
            ))}
          </section>

          <section className="teen-panel teen-class-panel">
            <div className="teen-panel-head"><div><p className="teen-kicker">Class</p><h2>{connectedClass ? connectedClass.name : 'Not connected yet'}</h2></div></div>
            {connectedClass ? <p className="teen-panel-copy">Connected with code <b>{connectedClass.code}</b>. Assignments above sync from this class.</p> : (
              <div className="teen-class-connect">
                <input value={classCode} onChange={(e) => setClassCode(e.target.value)} placeholder="Enter your teacher’s join code" maxLength={12} />
                <button onClick={connectClass}>Connect</button>
                {classError && <p className="teen-inline-error">{classError}</p>}
              </div>
            )}
          </section>
        </div>
      )}

      {tab === 'play' && (
        <div className="teen-body">
          {playMode === 'menu' && (
            <>
              <div className="teen-title"><p className="teen-kicker">Play — tougher than it looks</p><h1>Choose your challenge.</h1><p>These aren’t quizzes with one right tap. Real branching, real evidence, real stakes.</p></div>
              <div className="teen-play-grid">
                <Link className="teen-play-card teen-play-card-link teen-play-card-world" href="/adventure"><span>🗺️</span><strong>Adventure World</strong><small>Walk the Bible’s story region by region</small></Link>
                <Link className="teen-play-card teen-play-card-link" href="/stories"><span>📖</span><strong>Interactive Stories</strong><small>Live the Bible’s biggest moments, scene by scene</small></Link>
                <Link className="teen-play-card teen-play-card-link" href="/arcade"><span>🎮</span><strong>Lantern Arcade</strong><small>Scripture Maze, Scramble, Verse Builder</small></Link>
                <button className="teen-play-card" onClick={() => setPlayMode('decision')}><span>⚖</span><strong>Decision Lab</strong><small>{DECISION_SCENARIOS.length} branching scenarios · school &amp; online life</small></button>
                <button className="teen-play-card" onClick={() => setPlayMode('reallife')}><span>🧭</span><strong>Real Life</strong><small>{REAL_LIFE_SCENARIOS.length} scenarios · work, family, courage</small></button>
                <button className="teen-play-card" onClick={() => setPlayMode('cases')}><span>🔍</span><strong>Bible Case Files</strong><small>{CASE_FILES.length} investigations · evidence &amp; verdicts</small></button>
                <button className="teen-play-card" onClick={() => { setPlayMode('askword'); setQuizStarted(false); setQuizDone(false); }}><span>⏱</span><strong>Ask the Word</strong><small>10 timed questions · deeper theology</small></button>
                <Link className="teen-play-card teen-play-card-link" href="/multiplayer"><span>🤝</span><strong>Play Together</strong><small>Cooperative games with your approved class</small></Link>
                <Link className="teen-play-card teen-play-card-link" href="/curriculum"><span>📖</span><strong>Story World</strong><small>Lion’s Den lessons, made for your age</small></Link>
              </div>
            </>
          )}

          {(playMode === 'decision' || playMode === 'reallife') && !activeScenario && (
            <>
              <div className="teen-title"><button className="teen-back" onClick={() => setPlayMode('menu')}>← Play</button><h1>{playMode === 'decision' ? 'Decision Lab' : 'Real Life'}</h1><p>{playMode === 'decision' ? 'Every choice branches. There’s no reset button that erases what you picked — only the chance to see where a different choice leads.' : 'Ordinary situations. The kind you’ll actually face this month.'}</p></div>
              <div className="teen-scenario-grid">
                {(playMode === 'decision' ? DECISION_SCENARIOS : REAL_LIFE_SCENARIOS).map((s) => (
                  <button key={s.id} className="teen-scenario-card" onClick={() => openScenario(s)}>
                    <span className="teen-scenario-tag">{s.tag}</span>
                    <strong>{s.title}</strong>
                    <small>{s.hook}</small>
                    {decisionsMade.includes(s.id) && <b className="teen-done-mark">✓ Explored</b>}
                  </button>
                ))}
              </div>
            </>
          )}

          {activeScenario && (() => {
            const node = activeScenario.nodes[nodeId];
            return (
              <div className="teen-scenario-player">
                <button className="teen-back" onClick={closeScenario}>← {playMode === 'decision' ? 'Decision Lab' : 'Real Life'}</button>
                <p className="teen-scenario-tag">{activeScenario.tag}</p>
                <h1>{activeScenario.title}</h1>
                {nodeId === 'start' && <p className="teen-scenario-hook">{activeScenario.hook}</p>}
                {'choices' in node ? (
                  <>
                    <p className="teen-scenario-prompt">{node.prompt}</p>
                    <div className="teen-scenario-choices">
                      {node.choices.map((c, i) => <button key={i} onClick={() => chooseBranch(c.to)}>{c.text}</button>)}
                    </div>
                  </>
                ) : (
                  <div className={`teen-ending teen-ending-${node.verdict}`}>
                    <span className="teen-ending-tag">{node.verdict === 'wise' ? 'Wise path' : node.verdict === 'risky' ? 'Risky path' : 'Costly path'}</span>
                    <p>{node.text}</p>
                    <p className="teen-verse-line">{node.verseText} <span>{node.verseRef}</span></p>
                    <div className="teen-scenario-choices">
                      <button onClick={resetScenario}>Try a different path</button>
                      <button className="teen-primary-choice" onClick={() => { finishScenario(activeScenario, node.verdict); closeScenario(); }}>Finish &amp; earn XP</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {playMode === 'cases' && !activeCase && (
            <>
              <div className="teen-title"><button className="teen-back" onClick={() => setPlayMode('menu')}>← Play</button><h1>Bible Case Files</h1><p>Review every piece of evidence before you can reach a verdict. No skipping ahead.</p></div>
              <div className="teen-scenario-grid">
                {CASE_FILES.map((c) => (
                  <button key={c.id} className="teen-scenario-card" onClick={() => openCase(c)}>
                    <span className="teen-scenario-tag">Investigation</span>
                    <strong>{c.title}</strong>
                    <small>{c.mystery}</small>
                    {casesSolved.includes(c.id) && <b className="teen-done-mark">✓ Solved</b>}
                  </button>
                ))}
              </div>
            </>
          )}

          {activeCase && (
            <div className="teen-scenario-player teen-case-player">
              <button className="teen-back" onClick={closeCase}>← Bible Case Files</button>
              <h1>{activeCase.title}</h1>
              <p className="teen-scenario-hook">{activeCase.mystery}</p>
              <div className="teen-evidence-grid">
                {activeCase.evidence.map((ev) => (
                  <button key={ev.id} className={`teen-evidence-card ${reviewedEvidence.includes(ev.id) ? 'reviewed' : ''}`} onClick={() => markReviewed(ev.id)}>
                    <span>{reviewedEvidence.includes(ev.id) ? '✓' : ev.label.split(' ')[1]}</span>
                    <div><strong>{ev.label}</strong><small>{ev.ref}</small><p>{ev.text}</p></div>
                  </button>
                ))}
              </div>
              {reviewedEvidence.length === activeCase.evidence.length ? (
                <div className="teen-verdict-box">
                  <h3>{activeCase.question}</h3>
                  <div className="teen-verdict-options">
                    {activeCase.options.map((o) => (
                      <button key={o.id} className={`${verdict === o.id ? 'picked' : ''} ${verdictSubmitted ? (o.id === activeCase.correct ? 'correct' : verdict === o.id ? 'wrong' : '') : ''}`} disabled={verdictSubmitted} onClick={() => setVerdict(o.id)}>{o.text}</button>
                    ))}
                  </div>
                  {!verdictSubmitted ? (
                    <button className="teen-primary-choice" disabled={!verdict} onClick={submitVerdict}>Submit verdict</button>
                  ) : (
                    <div className={`teen-ending teen-ending-${verdict === activeCase.correct ? 'wise' : 'unwise'}`}>
                      <span className="teen-ending-tag">{verdict === activeCase.correct ? 'Case closed — correct verdict' : 'Not quite the strongest verdict'}</span>
                      <p>{activeCase.explanation}</p>
                      <button className="teen-primary-choice" onClick={closeCase}>Back to Case Files</button>
                    </div>
                  )}
                </div>
              ) : <p className="teen-evidence-hint">Review all {activeCase.evidence.length} pieces of evidence to unlock the verdict ({reviewedEvidence.length}/{activeCase.evidence.length}).</p>}
            </div>
          )}

          {playMode === 'askword' && (
            <div className="teen-quiz-player">
              <button className="teen-back" onClick={() => setPlayMode('menu')}>← Play</button>
              {!quizStarted && !quizDone && (
                <div className="teen-quiz-intro">
                  <h1>Ask the Word</h1>
                  <p>10 questions. 20 seconds each. This isn’t Sunday-school easy — it’s built for people who already know the basics.</p>
                  <button className="teen-primary-choice" onClick={startQuiz}>Start the round</button>
                </div>
              )}
              {quizStarted && !quizDone && (
                <div className="teen-quiz-live">
                  <div className="teen-quiz-meta"><span>Question {quizIndex + 1} of {ASK_WORD_QUESTIONS.length}</span><span className={`teen-quiz-timer ${timeLeft <= 5 ? 'low' : ''}`}>{timeLeft}s</span></div>
                  <h2>{ASK_WORD_QUESTIONS[quizIndex].q}</h2>
                  <div className="teen-quiz-options">
                    {ASK_WORD_QUESTIONS[quizIndex].options.map((opt, i) => (
                      <button key={i} disabled={quizAnswer !== null} className={quizAnswer !== null ? (i === ASK_WORD_QUESTIONS[quizIndex].correct ? 'correct' : i === quizAnswer ? 'wrong' : '') : ''} onClick={() => handleQuizAnswer(i)}>{opt}</button>
                    ))}
                  </div>
                  {quizAnswer !== null && <p className="teen-quiz-ref">Reference: {ASK_WORD_QUESTIONS[quizIndex].ref}</p>}
                </div>
              )}
              {quizDone && (
                <div className="teen-quiz-results">
                  <h1>{quizScore}/{ASK_WORD_QUESTIONS.length}</h1>
                  <p>{quizScore >= 8 ? 'Sharp. That’s a strong grasp of some genuinely deep material.' : quizScore >= 5 ? 'Solid round — a few of those are worth digging into further.' : 'A tough set. Worth revisiting the ones you missed in the Learn tab.'}</p>
                  <div className="teen-scenario-choices">
                    <button onClick={startQuiz}>Play again</button>
                    <button className="teen-primary-choice" onClick={exitQuiz}>Back to Play</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {tab === 'journey' && (
        <div className="teen-body">
          <div className="teen-title"><p className="teen-kicker">Weekly Scripture cycle</p><h1>Read. Think. Speak. Live.</h1><p>One verse, carried all the way from the page into an actual moment of your week.</p></div>

          <section className="teen-panel teen-scripture-panel">
            <p className="teen-verse-line big">{WEEKLY_VERSE.text} <span>{WEEKLY_VERSE.ref}, WEB</span></p>
          </section>

          <div className="teen-journey-stages">
            {JOURNEY_STAGES.map((stage) => (
              <article key={stage.id} className={`teen-journey-stage ${journeyDone[stage.id] ? 'done' : ''}`}>
                <div className="teen-journey-stage-head">
                  <span>{journeyDone[stage.id] ? '✓' : ''}</span>
                  <div><strong>{stage.title}</strong><small>{stage.blurb}</small></div>
                </div>
                {stage.id === 'think' && <textarea value={journeyDraft} onChange={(e) => setJourneyDraft(e.target.value)} placeholder="Private draft — only you can see this." />}
                {stage.id === 'live' && <textarea value={journeyLive} onChange={(e) => setJourneyLive(e.target.value)} placeholder="What happened this week when you tried to live this out?" />}
                <button className={journeyDone[stage.id] ? 'teen-unmark' : 'teen-primary-choice'} onClick={() => toggleJourneyStage(stage.id)}>{journeyDone[stage.id] ? 'Mark not done' : 'Mark complete (+15 XP)'}</button>
              </article>
            ))}
          </div>

          {journeyStagesDone === 4 && !journeySubmitted && (
            <section className="teen-panel teen-submit-panel">
              <p className="teen-kicker">All four stages complete</p>
              <h2>Submit this week’s reflection to your teacher?</h2>
              <p className="teen-panel-copy">Only your “Live” note is shared if you submit. Your private “Think” draft stays private either way. This is optional.</p>
              <button className="teen-primary-choice" onClick={submitJourney}>Submit to teacher (+20 XP)</button>
            </section>
          )}
          {journeySubmitted && <p className="teen-submitted-note">✓ This week’s Live reflection was submitted to your teacher.</p>}
        </div>
      )}

      {tab === 'profile' && (
        <div className="teen-body">
          <div className="teen-title"><p className="teen-kicker">Your profile</p><h1>{teen.name} · Lion’s Den · Age {teen.age}</h1></div>

          <section className="teen-character-card teen-profile-char-card">
            <div className="teen-char-avatar-side">
              <CharacterAvatar appearance={charAppearance} equipment={charEquipment} size="large" showPedestal={true} />
            </div>
            <div className="teen-char-details-side">
              <div className="teen-char-badge-row">
                <span className="teen-char-pill">🧑 Active Avatar &amp; Loadout</span>
                <span className="teen-char-rank-pill">{level.name}</span>
              </div>
              <h2>{charDisplayName}</h2>
              <p className="teen-char-desc">
                Your character carries your unlocked armor, tunics, headwear, and companion artifacts into all adventure world quests.
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
                <Link href="/character" className="teen-char-action-btn primary">
                  Open Character Customizer 🎨 →
                </Link>
              </div>
            </div>
          </section>

          <section className="teen-home-grid">
            <article className="teen-panel">
              <div className="teen-panel-head"><div><p className="teen-kicker">Progress</p><h2>{level.name}</h2></div></div>
              <p className="teen-panel-copy">{level.tag}</p>
              <div className="teen-level-bar"><i style={{ width: `${levelProgress}%` }} /></div>
              <div className="teen-stat-row"><span><b>{points}</b> total XP</span><span><b>{dailyQuestSummary.streak}</b> day streak</span><span><b>{decisionsMade.length}</b> decisions</span><span><b>{casesSolved.length}</b> cases solved</span></div>
            </article>
            <aside className="teen-side-panel">
              <p className="teen-kicker">Badges earned</p>
              <div className="teen-badge-grid">
                <div className={`teen-badge ${casesSolved.length > 0 ? 'earned' : ''}`}><span>🔍</span><small>Case Closed</small></div>
                <div className={`teen-badge ${decisionsMade.length >= 3 ? 'earned' : ''}`}><span>⚖</span><small>Verdict of Faith</small></div>
                <div className={`teen-badge ${journeyStagesDone === 4 ? 'earned' : ''}`}><span>🕯</span><small>Deep Roots</small></div>
                <div className={`teen-badge ${dailyQuestSummary.streak >= 7 ? 'earned' : ''}`}><span>🔥</span><small>Torchbearer</small></div>
              </div>
            </aside>
          </section>

          <section className="teen-panel">
            <div className="teen-panel-head"><div><p className="teen-kicker">Security</p><h2>Change your PIN</h2></div></div>
            <form className="teen-pin-form" onSubmit={changePin}>
              <label>New 4-digit PIN<input value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))} maxLength={4} inputMode="numeric" /></label>
              <label>Confirm new PIN<input value={confirmPin} onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))} maxLength={4} inputMode="numeric" /></label>
              <button className="teen-primary-choice" type="submit">Update PIN</button>
            </form>
            {pinNotice && <p className="teen-inline-error">{pinNotice}</p>}
          </section>

          <Link href="/teen-access" onClick={() => { fetch('/api/child-auth/logout', { method: 'POST' }).catch(() => {}); localStorage.removeItem('lanternLionTeenSession'); localStorage.removeItem('lanternLionActiveChildId'); }} className="teen-signout-full">Sign out of the Lion’s Den</Link>
        </div>
      )}
      {safetyNotice && <div className="child-help-confirmation" role="status"><span>✓</span><p>{safetyNotice}</p><button onClick={() => setSafetyNotice('')}>Close</button></div>}

      {/* ── Kid-Safe Family Profile Summary Modal ── */}
      {showFamilyModal && (
        <div className="help-overlay" role="presentation" onClick={() => setShowFamilyModal(false)}>
          <section className="help-dialog family-summary-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <button className="close-help" aria-label="Close" onClick={() => setShowFamilyModal(false)}>×</button>
            <div className="family-modal-badge"><span>🦁</span></div>
            <p className="child-kicker">Our Family Squad</p>
            <h2>{familyData.familyName}</h2>
            <p className="family-modal-lead">
              Hello <b>{teen.name}</b>! Here is how your family is shining in the Bible club together.
            </p>

            <div className="family-modal-meta">
              <div><span>Parent / Guardian:</span> <strong>{familyData.parentName}</strong></div>
              <div><span>Home Country:</span> <strong>{familyData.country}</strong></div>
              <div><span>Family Members:</span> <strong>{familyMembers.length} profiles</strong></div>
            </div>

            <div className="family-modal-scores">
              <p className="family-modal-scores-title">Family Member Scoreboard</p>
              <div className="family-modal-child-grid">
                {familyMembers.map((m) => {
                  const stats = statsForSibling(m);
                  const isCurrent = m.id === activeId;
                  return (
                    <article key={m.id} className={`family-score-card ${isCurrent ? 'current' : ''}`}>
                      <span className="fam-card-avatar">{m.name.slice(0, 1)}</span>
                      <div className="fam-card-info">
                        <strong>
                          {m.name} {isCurrent && <em className="you-tag">(You)</em>}
                        </strong>
                        <small>{trackEmoji[stats.track]} {trackLabel[stats.track]}</small>
                      </div>
                      <div className="fam-card-points">
                        <b>★ {stats.points}</b>
                        <small>🔥 {stats.streak} day streak</small>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

            <aside className="family-modal-safety-note">
              <span>🛡️ Family Safety Summary</span>
              <p>
                Children have no open chat or public profiles. All progress stays private within your family and connected teachers.
              </p>
            </aside>

            <button className="button button-primary family-modal-close-btn" onClick={() => setShowFamilyModal(false)}>
              Back to my den →
            </button>
          </section>
        </div>
      )}

      <ChatAssistant mode="teen" name={teen.name} onSafetyFlag={handleChatSafetyFlag} />
    </main>
  );
}
