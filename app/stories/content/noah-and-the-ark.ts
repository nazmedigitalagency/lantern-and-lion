// Noah & The Ark — Genesis 6–9.
//
// Deliberately smaller than David & Goliath and exercises a different mix
// of scene types (no DIALOGUE, a shorter FINAL_CHALLENGE) to prove the same
// engine generalizes to a different story shape, not just a copy of the
// first one.

import type { InteractiveStory } from '../types';

export const noahAndTheArk: InteractiveStory = {
  id: 'noah-and-the-ark',
  title: 'Noah & The Ark',
  heroEmoji: '🛶',
  scriptureRange: 'Genesis 6–9',
  estimatedMinutes: 5,
  conceptId: 'early-noah',
  coverImageUrl: '/assets/stories/noah-and-the-ark/cover.jpg',
  thumbnailImageUrl: '/assets/stories/noah-and-the-ark/thumbnail.jpg',
  adventure: { regionId: 'noah', chapterId: 'noah-ch1', collectibleId: 'coll-olive-leaf' },
  reward: { xp: 70, coins: 30, gems: 1 },
  characters: [
    { id: 'narrator', name: 'Narrator', emoji: '📖', role: 'narrator' },
    { id: 'noah', name: 'Noah', emoji: '🧔', role: 'protagonist', accentColor: 'teal' },
  ],
  firstSceneId: 'scene-1',
  scenes: [
    {
      id: 'scene-1',
      order: 1,
      type: 'NARRATION',
      nextSceneId: 'scene-2',
      illustration: {
        emoji: '🌍',
        background: 'day',
        imageUrl: '/assets/stories/noah-and-the-ark/scene-1-walk.jpg',
        imageAlt: 'Noah walking faithfully with God in a peaceful ancient landscape',
      },
      scripture: {
        reference: 'Genesis 6:9',
        text: 'Noah was a righteous man, blameless among the people of his time, and he walked faithfully with God.',
        translation: 'NIV',
      },
      text: {
        child: 'Long ago, the world had become very unkind. But one man, Noah, still loved and obeyed God.',
        teen: 'The world had grown deeply corrupt, but Noah stood out — Genesis calls him righteous and blameless, a man who walked faithfully with God even when almost no one else did.',
      },
    },
    {
      id: 'scene-2',
      order: 2,
      type: 'CHOICE',
      nextSceneId: 'scene-3',
      illustration: {
        emoji: '🔨',
        background: 'day',
        imageUrl: '/assets/stories/noah-and-the-ark/scene-2-building.jpg',
        imageAlt: 'Noah diligently building the wooden Ark in faithful obedience to God',
      },
      prompt: {
        child: 'God asked Noah to build a huge boat, even though it had never rained before. In this activity: what should Noah do?',
        teen: 'God commands Noah to build an ark for a flood no one has ever seen — a costly, decades-long project with no visible evidence yet. What does Noah’s obedience suggest about his faith?',
      },
      choices: [
        {
          id: 'obey-anyway',
          label: { child: '🛠️ Keep building, even though people laugh', teen: 'Obey, trusting God even without visible proof yet' },
          isBestChoice: true,
          imageUrl: '/assets/stories/noah-and-the-ark/choice-obey.jpg',
          feedback: {
            child: 'Yes! Noah kept building for many years, even when others didn’t understand.',
            teen: 'Right — Hebrews 11:7 later points to exactly this: Noah acted "in holy fear" on a warning about things not yet seen.',
          },
          bonusContent: {
            emoji: '🕰️',
            text: {
              child: 'It’s believed Noah worked on the ark for many, many years!',
              teen: 'Many scholars estimate this project spanned decades — a long test of sustained, unglamorous obedience.',
            },
          },
        },
        {
          id: 'give-up',
          label: { child: '😔 Give up because no one believes him', teen: 'Abandon the project once public mockery began' },
          isBestChoice: false,
          imageUrl: '/assets/stories/noah-and-the-ark/choice-give-up.jpg',
          feedback: {
            child: 'That would have been an easy choice — but Noah didn’t give up. Let’s see why that mattered.',
            teen: 'Understandable under social pressure, but that isn’t what Noah does in the text — his perseverance is the point of the account.',
          },
        },
      ],
    },
    {
      id: 'scene-3',
      order: 3,
      type: 'NARRATION',
      nextSceneId: 'scene-4',
      illustration: {
        emoji: '🐘',
        background: 'day',
        imageUrl: '/assets/stories/noah-and-the-ark/scene-3-animals.jpg',
        imageAlt: 'Pairs of animals entering the Ark two by two in peaceful harmony',
      },
      scripture: {
        reference: 'Genesis 7:15-16',
        text: 'Pairs of all creatures that have the breath of life in them came to Noah and entered the ark... Then the LORD shut him in.',
        translation: 'NIV',
      },
      text: {
        child: 'When the ark was ready, animals came two by two, and Noah’s family went inside. Then God shut the door.',
        teen: 'When the ark was finished, animals came in pairs exactly as God had directed, Noah’s family boarded with them, and God Himself shut the door — the flood then came for forty days and nights.',
      },
    },
    {
      id: 'scene-4',
      order: 4,
      type: 'MEMORY',
      nextSceneId: 'scene-5',
      illustration: {
        emoji: '🌈',
        background: 'rainbow',
        imageUrl: '/assets/stories/noah-and-the-ark/scene-4-rainbow.jpg',
        imageAlt: 'The dove carrying an olive leaf and a radiant rainbow shining over Mount Ararat',
      },
      theme: 'God keeps His promises',
      verse: {
        reference: 'Genesis 9:13',
        text: 'I have set my rainbow in the clouds, and it will be the sign of the covenant between me and the earth.',
        translation: 'NIV',
      },
      blanks: ['rainbow', 'covenant', 'earth'],
    },
    {
      id: 'scene-5',
      order: 5,
      type: 'FINAL_CHALLENGE',
      nextSceneId: null,
      requiredScore: 1,
      illustration: {
        emoji: '🏆',
        background: 'rainbow',
        imageUrl: '/assets/stories/noah-and-the-ark/scene-5-celebration.jpg',
        imageAlt: 'Noah and his family celebrating God’s promise under the rainbow',
      },
      title: {
        child: 'Final Challenge: What Did You Learn?',
        teen: 'Final Challenge: Faithfulness and Promise',
      },
      questions: [
        {
          id: 'fc1',
          prompt: {
            child: 'What did God put in the sky as a promise?',
            teen: 'What sign did God give as the mark of His covenant after the flood?',
          },
          options: [
            { child: 'A rainbow', teen: 'A rainbow' },
            { child: 'A star', teen: 'A star' },
            { child: 'A cloud', teen: 'A plain cloud' },
          ],
          correctIndex: 0,
          explanation: {
            child: 'God set a rainbow in the sky as a sign of His promise.',
            teen: 'Genesis 9:13 names the rainbow specifically as the covenant sign between God and the earth.',
          },
        },
        {
          id: 'fc2',
          prompt: {
            child: 'What can we learn from Noah?',
            teen: 'What does Noah’s story primarily illustrate?',
          },
          options: [
            { child: 'It’s okay to give up if others don’t believe you', teen: 'Public opinion should determine obedience' },
            { child: 'Obeying God matters, even when it’s hard or takes a long time', teen: 'Faithful obedience can be sustained even without immediate visible confirmation' },
            { child: 'Boats are important', teen: 'Ancient shipbuilding techniques' },
          ],
          correctIndex: 1,
          explanation: {
            child: 'Noah obeyed God for a very long time before it made sense to anyone else.',
            teen: 'Noah’s account is held up later (Hebrews 11) as a model of faith acting on what isn’t yet seen.',
          },
        },
      ],
    },
  ],
};
