// Bible Detective — the case file. Pure content, no game logic. Adding
// case #6, #60, or #600 later is editing this array; nothing about
// `engine.ts` or `page.tsx` needs to change.

import type { CaseDefinition } from './engine';

export const CASE_BANK: CaseDefinition[] = [
  {
    id: 'lions-den',
    title: 'Who Was in the Lion’s Den?',
    intro: 'A king’s decree. Jealous officials. A den of hungry lions. Someone survived a night no one should survive — detective, find out who, and why they lived.',
    reference: 'Daniel 6',
    ageGroup: 'tweens',
    difficulty: 'medium',
    skills: ['critical-thinking', 'reading', 'memory', 'bible-knowledge'],
    xpReward: 90,
    image: '/art-module-daniel.jpg',
    stages: [
      {
        id: 'stage-1',
        clues: [
          { id: 'lions-scripture-1', type: 'scripture', title: 'A Royal Decree', content: '“Then the king commanded, and they brought Daniel, and cast him into the den of lions.” (Daniel 6:16)' },
          { id: 'lions-character-1', type: 'character', title: 'A Man of Habit', content: 'This man prayed to his God three times a day, kneeling by an open window — even after a new law made it illegal.' },
        ],
        question: {
          id: 'q1',
          prompt: 'Why was this man arrested?',
          options: ['He refused to bow to a golden statue', 'He prayed to God despite the king’s new law', 'He stole from the royal treasury', 'He insulted the king in public'],
          correctIndex: 1,
          hint: 'Look at what the jealous officials tricked the king into signing.',
        },
      },
      {
        id: 'stage-2',
        clues: [
          { id: 'lions-timeline-1', type: 'timeline', title: 'A Change in Power', content: 'This happened during the reign of King Darius the Mede — shortly after Babylon fell to the Medes and Persians.' },
          { id: 'lions-object-1', type: 'object', title: 'A Sealed Stone', content: 'A stone was rolled over the mouth of the den and sealed with the king’s own signet ring, so no one could tamper with it.' },
        ],
        question: {
          id: 'q2',
          prompt: 'What sealed the den shut for the night?',
          options: ['A wooden door with a bar', 'A stone sealed with the king’s signet ring', 'A curtain across the entrance', 'Nothing — it was left open'],
          correctIndex: 1,
          hint: 'Think about what the king used to make sure no one could secretly help — or harm — the prisoner.',
        },
      },
      {
        id: 'stage-3',
        clues: [
          { id: 'lions-location-1', type: 'location', title: 'The Den Itself', content: 'Likely a deep pit with an opening at the top — a common way to keep dangerous animals in ancient Babylon and Persia.' },
        ],
        question: {
          id: 'q3',
          prompt: 'Which clue best explains why the lions didn’t harm him?',
          options: ['An angel shut the lions’ mouths', 'He was unusually strong', 'The lions had just been fed', 'The den was actually empty'],
          correctIndex: 0,
          hint: 'Read Daniel 6:22 — he tells the king exactly what happened.',
        },
      },
    ],
    finalAnswer: {
      prompt: 'Detective, who was in the lion’s den?',
      options: ['Daniel', 'Shadrach', 'David', 'Samson'],
      correctIndex: 0,
      hint: 'This man’s name is in every clue you’ve gathered so far.',
    },
    explanation:
      'Daniel kept praying faithfully even after a law was designed specifically to trap him. When he was thrown into the lions’ den, God sent an angel to shut the lions’ mouths, and King Darius found him completely unharmed the next morning.',
  },
  {
    id: 'giant-slayer',
    title: 'Who Defeated the Giant?',
    intro: 'A battlefield frozen in fear for forty days. A challenger nine feet tall. And then — one unlikely shepherd steps forward. Piece together what really happened.',
    reference: '1 Samuel 17',
    ageGroup: 'kids',
    difficulty: 'easy',
    skills: ['critical-thinking', 'memory', 'bible-knowledge'],
    xpReward: 60,
    image: '/art-module-david.jpg',
    stages: [
      {
        id: 'stage-1',
        clues: [
          { id: 'giant-character-1', type: 'character', title: 'The Challenger', content: 'A huge Philistine warrior challenged Israel’s army every day for forty days, and no soldier dared answer him.' },
          { id: 'giant-object-1', type: 'object', title: 'An Unusual Weapon', content: 'The hero picked five smooth stones from a stream and carried a sling — not a sword.' },
        ],
        question: {
          id: 'q1',
          prompt: 'What weapon did the hero actually use?',
          options: ['A sword and shield', 'A bow and arrow', 'A sling and stones', 'A spear'],
          correctIndex: 2,
          hint: 'Think about what he picked up from the stream.',
        },
      },
    ],
    finalAnswer: {
      prompt: 'Detective, who defeated the giant?',
      options: ['King Saul', 'David', 'Jonathan', 'Samuel'],
      correctIndex: 1,
      hint: 'He was just a shepherd boy who came to bring food to his brothers.',
    },
    explanation: 'David trusted God instead of fearing Goliath’s size. With just a sling and a stone, he did what the entire army was too afraid to try.',
  },
  {
    id: 'parted-sea',
    title: 'The Case of the Parted Sea',
    intro: 'A trapped nation. An advancing army. And a sea that should have blocked every path to freedom. Follow the timeline to understand what really happened at the water’s edge.',
    reference: 'Exodus 14',
    ageGroup: 'tweens',
    difficulty: 'hard',
    skills: ['critical-thinking', 'reading', 'memory', 'bible-knowledge'],
    xpReward: 110,
    image: '/art-module-redsea.jpg',
    stages: [
      {
        id: 'stage-1',
        clues: [
          { id: 'sea-timeline-1', type: 'timeline', title: 'A Change of Heart', content: 'Pharaoh let Israel leave Egypt — then almost immediately changed his mind and gathered his chariots to pursue them.' },
          { id: 'sea-location-1', type: 'location', title: 'Trapped', content: 'Israel camped by the sea with mountains on either side, with nowhere left to run as the army approached.' },
        ],
        question: {
          id: 'q1',
          prompt: 'Why couldn’t Israel simply keep walking away from Pharaoh’s army?',
          options: ['They were trapped between the sea and the terrain', 'They stopped to rest for the night', 'They were waiting for more supplies', 'They wanted to fight the army directly'],
          correctIndex: 0,
          hint: 'Look at the location clue — what was on either side of their camp?',
        },
      },
      {
        id: 'stage-2',
        clues: [
          { id: 'sea-object-1', type: 'object', title: 'The Staff', content: 'Moses stretched out his hand — and his staff — over the sea.' },
          { id: 'sea-scripture-1', type: 'scripture', title: 'A Strong East Wind', content: '“The Lord drove the sea back by a strong east wind all that night and made the sea dry land.” (Exodus 14:21)' },
        ],
        question: {
          id: 'q2',
          prompt: 'What actually opened a path through the sea?',
          options: ['A strong wind sent by God overnight', 'The tide going out naturally', 'Moses’ army built a bridge', 'An earthquake split the seabed'],
          correctIndex: 0,
          hint: 'Read the scripture clue closely — what does it credit for driving the sea back?',
        },
      },
      {
        id: 'stage-3',
        clues: [
          { id: 'sea-character-1', type: 'character', title: 'The Pursuer', content: 'Pharaoh’s chariots followed Israel onto the dry seabed — and the sea returned before they could cross.' },
        ],
        question: {
          id: 'q3',
          prompt: 'Which happened last, in order?',
          options: ['Israel crossed safely on dry ground', 'The sea closed over Pharaoh’s army', 'Moses stretched his hand over the sea', 'Pharaoh changed his mind and pursued Israel'],
          correctIndex: 1,
          hint: 'Put all three timeline and object clues in order — what was the final event?',
        },
      },
    ],
    finalAnswer: {
      prompt: 'Detective, what really opened the way through the sea?',
      options: [
        'A natural low tide Israel happened to time perfectly',
        'God drove the sea back with a strong wind, opening dry ground',
        'Egyptian engineers built a temporary crossing',
        'The sea was never actually crossed — it’s a metaphor',
      ],
      correctIndex: 1,
      hint: 'Trust the scripture clue over any other theory — what does the text itself say happened?',
    },
    explanation:
      'When Israel had nowhere left to run, God made a way where there seemed to be none — driving back the sea with a strong wind so His people could cross on dry ground, then closing the waters over the pursuing army.',
  },
  {
    id: 'queens-secret',
    title: 'The Queen’s Secret',
    intro: 'A queen hiding her identity. A powerful official plotting a massacre. And one moment where speaking up could cost everything. Weigh the evidence like a detective — not just a reader.',
    reference: 'Esther 2-7',
    ageGroup: 'teens',
    difficulty: 'expert',
    skills: ['critical-thinking', 'reading', 'memory', 'bible-knowledge', 'attention'],
    xpReward: 130,
    image: '/art-module-esther.jpg',
    stages: [
      {
        id: 'stage-1',
        clues: [
          { id: 'esther-character-1', type: 'character', title: 'The Queen', content: 'Esther became queen of Persia without revealing that she was Jewish — on the advice of her cousin Mordecai.' },
          { id: 'esther-character-2', type: 'character', title: 'The Official', content: 'Haman, a powerful official, was enraged that Mordecai wouldn’t bow to him, and plotted to destroy the Jewish people.' },
        ],
        question: {
          id: 'q1',
          prompt: 'Which explanation best fits why Esther hadn’t revealed her identity sooner?',
          options: [
            'She was ashamed of her heritage',
            'Mordecai had specifically advised her to keep it secret',
            'It was against Persian law to be Jewish',
            'She had forgotten her family’s background',
          ],
          correctIndex: 1,
          hint: 'Look at the character clue about Esther — whose advice was she following?',
        },
      },
      {
        id: 'stage-2',
        clues: [
          { id: 'esther-timeline-1', type: 'timeline', title: 'A Risky Approach', content: 'Esther fasted for three days before approaching the king uninvited — a move that could carry a death sentence without his permission.' },
          { id: 'esther-object-1', type: 'object', title: 'The Golden Scepter', content: 'The king extended his golden scepter toward Esther, sparing her life and granting an audience.' },
        ],
        question: {
          id: 'q2',
          prompt: 'Which clue contradicts the idea that Esther’s approach was risk-free?',
          options: [
            'The three days of fasting beforehand',
            'The king extending his scepter',
            'Haman’s invitation to the banquet',
            'Mordecai’s earlier advice',
          ],
          correctIndex: 0,
          hint: 'Think about why someone would fast for three days before doing something.',
        },
      },
      {
        id: 'stage-3',
        clues: [
          { id: 'esther-scripture-1', type: 'scripture', title: 'The Banquet Reveal', content: '“If I have found favor in your sight, O king... let my life be given me... for we are sold, I and my people.” (Esther 7:3-4)' },
        ],
        question: {
          id: 'q3',
          prompt: 'Which interpretation has the strongest textual support for why Esther waited until the banquet to accuse Haman?',
          options: [
            'She wanted to choose the right moment, with the king favorably disposed and Haman present to be confronted directly',
            'She was too afraid to speak sooner',
            'She hadn’t yet decided whose side to take',
            'The text gives no reason at all',
          ],
          correctIndex: 0,
          hint: 'Re-read the scripture clue — notice how directly and specifically she finally speaks, and to whom.',
        },
      },
    ],
    finalAnswer: {
      prompt: 'Detective, which action best explains how Esther’s people were saved?',
      options: [
        'Esther used her position with careful timing and courage to expose the plot directly to the king',
        'Mordecai defeated Haman in single combat',
        'The king discovered the plot on his own',
        'Esther fled Persia with her people',
      ],
      correctIndex: 0,
      hint: 'Consider every clue together — timing, courage, and direct evidence all point to one action.',
    },
    explanation:
      'Esther used her position with courage at the exact moment her people needed her most — fasting and preparing, then exposing Haman’s plot directly to the king when the timing gave her the strongest chance of being heard.',
  },
];

export function getCaseDefinition(id: string): CaseDefinition | undefined {
  return CASE_BANK.find((c) => c.id === id);
}
