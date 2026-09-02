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
  {
    id: 'persecutor-who-changed',
    title: 'The Persecutor Who Changed',
    intro: 'A man who dragged believers to prison suddenly starts preaching the faith he tried to destroy. His old allies call it treason. His new allies don’t trust him either. Detective, work out what actually happened on that road — and why nobody could talk him out of it afterward.',
    reference: 'Acts 9:1-22',
    ageGroup: 'teens',
    difficulty: 'expert',
    skills: ['critical-thinking', 'reading', 'bible-knowledge', 'attention'],
    xpReward: 130,
    stages: [
      {
        id: 'stage-1',
        clues: [
          { id: 'saul-character-1', type: 'character', title: 'The Persecutor', content: 'Saul of Tarsus was "breathing threats and murder" against the church, and had obtained letters authorizing him to arrest believers in Damascus.' },
          { id: 'saul-timeline-1', type: 'timeline', title: 'The Road', content: 'Near Damascus, a light from heaven flashed around him, he fell to the ground, and heard a voice: "Saul, Saul, why are you persecuting me?"' },
        ],
        question: {
          id: 'q1',
          prompt: 'Why is it significant that the voice said "why are you persecuting ME" rather than "my people"?',
          options: [
            'It was likely a translation error in the account',
            'It identifies Jesus as personally bound up with the church he was attacking — an early claim about who Jesus is',
            'It means Saul had personally met Jesus before',
            'It has no real significance, just a figure of speech',
          ],
          correctIndex: 1,
          hint: 'Think about what it implies for Jesus to speak as if attacks on believers are attacks on himself.',
        },
      },
      {
        id: 'stage-2',
        clues: [
          { id: 'saul-object-1', type: 'object', title: 'Three Days Blind', content: 'Saul was blind for three days and neither ate nor drank, until Ananias — a believer he likely would have arrested days earlier — was sent to heal him.' },
          { id: 'saul-character-2', type: 'character', title: 'A Reluctant Healer', content: 'Ananias initially objected: "Lord, I have heard from many about this man, how much evil he has done to your saints."' },
        ],
        question: {
          id: 'q2',
          prompt: 'What does Ananias’s objection, and his obedience anyway, tell a careful reader?',
          options: [
            'That the early church didn’t really trust the resurrection accounts',
            'That reconciliation here required real risk and real forgiveness, not just a change of Saul’s mind',
            'That Ananias secretly wanted Saul to stay blind',
            'That the account is likely legendary, since no one would risk this',
          ],
          correctIndex: 1,
          hint: 'Ananias had every reason to refuse. Notice that he went anyway — what does obedience under real risk suggest about how seriously he took the instruction?',
        },
      },
      {
        id: 'stage-3',
        clues: [
          { id: 'saul-scripture-1', type: 'scripture', title: 'Immediate Reversal', content: '"And immediately he proclaimed Jesus in the synagogues, saying, \'He is the Son of God.\'" (Acts 9:20) — in the very synagogues he’d planned to use for arrests.' },
        ],
        question: {
          id: 'q3',
          prompt: 'Which explanation best accounts for a persecutor immediately preaching in the exact synagogues he came to raid, at cost to his own safety and reputation?',
          options: [
            'He was pressured into it by the apostles',
            'He calculated it would benefit his career',
            'Something happened on that road serious enough to reverse a violent conviction overnight, with no material benefit to him — the opposite, in fact',
            'The account was written much later and exaggerated for effect',
          ],
          correctIndex: 2,
          hint: 'Ask what a persecutor-turned-preacher actually gained materially from this reversal. Then ask what could explain a conviction that strong changing that fast.',
        },
      },
    ],
    finalAnswer: {
      prompt: 'Detective, what is the most consistent explanation for Saul’s reversal?',
      options: [
        'A genuine encounter with the risen Jesus, confirmed by his blindness, Ananias’s costly obedience, and his immediate, costly public preaching',
        'A political calculation to infiltrate the church',
        'A mental breakdown brought on by the stress of persecuting believers',
        'A legend added generations later with no basis in the earliest accounts',
      ],
      correctIndex: 0,
      hint: 'Weigh all three clues together — physical evidence, a witness who had every reason to lie or refuse, and behavior with no personal upside.',
    },
    explanation:
      'Every piece of corroborating evidence — Saul’s physical blindness, Ananias’s reluctant-but-real obedience despite personal risk, and Saul’s immediate public preaching at cost to his own safety — points toward a real encounter, not a calculated move or a later legend. A persecutor doesn’t usually reverse course this completely for nothing to gain and everything to lose.',
  },
  {
    id: 'brother-who-stayed',
    title: 'The Brother Who Stayed',
    intro: 'Everyone remembers the son who left and came home. Fewer notice the son who never left — and refused to celebrate when his brother did. Detective, this parable has two suspects in the wrong, not one. Find the second.',
    reference: 'Luke 15:11-32',
    ageGroup: 'teens',
    difficulty: 'expert',
    skills: ['critical-thinking', 'reading', 'bible-knowledge'],
    xpReward: 120,
    stages: [
      {
        id: 'stage-1',
        clues: [
          { id: 'prodigal-character-1', type: 'character', title: 'The Younger Son', content: 'He demanded his inheritance early — effectively treating his father as if already dead — squandered it, and returned only when starving, rehearsing an apology.' },
          { id: 'prodigal-character-2', type: 'character', title: 'The Older Son', content: 'He stayed, worked the land faithfully for years, and refused to join the celebration when his brother returned, telling his father: "I never disobeyed your command."' },
        ],
        question: {
          id: 'q1',
          prompt: 'Why might the parable include the older son’s complaint at all, instead of ending at the celebration?',
          options: [
            'It’s an unrelated addition with no purpose',
            'It shows that self-righteous resentment is its own form of distance from the father, even without ever "leaving"',
            'It proves the older son was right to be angry',
            'It’s meant to make the younger son look worse by comparison',
          ],
          correctIndex: 1,
          hint: 'Consider whether physically staying home guarantees someone is actually close to their father in the way that matters.',
        },
      },
      {
        id: 'stage-2',
        clues: [
          { id: 'prodigal-scripture-1', type: 'scripture', title: 'The Father’s Response', content: '"Son, you are always with me, and all that is mine is yours. It was fitting to celebrate and be glad, for this your brother was dead, and is alive." (Luke 15:31-32)' },
        ],
        question: {
          id: 'q2',
          prompt: 'What does the father’s response to the older son reveal about his complaint?',
          options: [
            'That the father agrees the younger son doesn’t deserve grace',
            'That the older son had misunderstood his relationship with his father as a wage-earning arrangement rather than a given inheritance',
            'That the father is choosing the younger son over the older one',
            'That the older son should have left home too',
          ],
          correctIndex: 1,
          hint: 'Notice the father doesn’t deny the older son anything — he points out everything was already his. What does that suggest about how the older son had been viewing his own place in the family?',
        },
      },
      {
        id: 'stage-3',
        clues: [
          { id: 'prodigal-timeline-1', type: 'timeline', title: 'Where the Story Ends', content: 'The parable ends without telling us whether the older brother ever goes inside to the feast — it’s left open.' },
        ],
        question: {
          id: 'q3',
          prompt: 'Why might Jesus deliberately leave the older brother’s decision unresolved?',
          options: [
            'The original ending was lost',
            'It puts the real question to the listener — originally the religious leaders grumbling about Jesus welcoming sinners — rather than resolving it for them',
            'It was a mistake in how the parable was recorded',
            'The older brother is not actually important to the story',
          ],
          correctIndex: 1,
          hint: 'Remember who Jesus was originally telling this story to (Luke 15:1-2) — a challenge left open often means the challenge is aimed at the listener.',
        },
      },
    ],
    finalAnswer: {
      prompt: 'Detective, who is this parable actually confronting?',
      options: [
        'Only the younger son, for wasting his inheritance',
        'Both sons — the younger for open rebellion, and the older for a self-righteous, transactional view of his father that kept him distant even while staying home',
        'Neither son — the parable is only about the father’s generosity',
        'The servants, for organizing the celebration too quickly',
      ],
      correctIndex: 1,
      hint: 'Weigh the open ending and the father’s correction to the older son alongside the younger son’s obvious failure — the parable has two targets, not one.',
    },
    explanation:
      'The younger son’s rebellion is obvious; the older son’s is quieter but just as real — a resentful, transactional relationship with his father that left him just as distant, without ever leaving home. Jesus leaves his decision unresolved on purpose, aiming the question at whoever is listening and grumbling like he was.',
  },
  {
    id: 'genesis-vs-babylon',
    title: 'Genesis vs. Babylon: Manuscript Case File',
    intro: 'Every ancient culture near Israel had its own origin story — gods fighting monsters, humans made as slave labor, a chaotic universe with no real order. Then Genesis 1 shows up, telling a strikingly different story. Detective, was Genesis just borrowing from its neighbors, or answering them?',
    reference: 'Genesis 1:1-2:3',
    ageGroup: 'teens',
    difficulty: 'expert',
    skills: ['critical-thinking', 'reading', 'bible-knowledge', 'attention'],
    xpReward: 130,
    stages: [
      {
        id: 'stage-1',
        clues: [
          { id: 'gen-character-1', type: 'character', title: 'The Rival Account', content: 'The Babylonian creation myth Enuma Elish describes the world formed from the corpse of a defeated goddess, and humans created as an afterthought — slave labor to free the gods from work.' },
          { id: 'gen-scripture-1', type: 'scripture', title: 'A Different Opening Line', content: '"In the beginning, God created the heavens and the earth." (Genesis 1:1) — one sovereign God, speaking creation into being by word alone, with no divine battle at all.' },
        ],
        question: {
          id: 'q1',
          prompt: 'What is the most significant structural difference between the two accounts?',
          options: [
            'Genesis has more chapters',
            'Genesis presents one sovereign God speaking calmly, not many gods locked in violent conflict',
            'Genesis was written in a different language',
            'There is no meaningful difference',
          ],
          correctIndex: 1,
          hint: 'Compare how each account explains the mechanism of creation — conflict versus command.',
        },
      },
      {
        id: 'stage-2',
        clues: [
          { id: 'gen-object-1', type: 'object', title: 'The Sun and Moon, Demoted', content: 'Genesis never names the sun and moon — it calls them "the greater light" and "the lesser light." Neighboring cultures worshiped the sun and moon as gods.' },
          { id: 'gen-timeline-1', type: 'timeline', title: 'Humanity’s Purpose', content: 'Genesis 1:27-28 says humans are made "in the image of God" and given a role of dignity, ruling and caring for creation — not created as an afterthought for slave labor.' },
        ],
        question: {
          id: 'q2',
          prompt: 'Why might Genesis deliberately avoid naming the sun and moon?',
          options: [
            'The author didn’t know their names',
            'To strip them of the divine status neighboring cultures gave them — they are objects God made, not gods to worship',
            'It was a scribal accident',
            'Because the sun and moon are unimportant in the story',
          ],
          correctIndex: 1,
          hint: 'Think about who was worshiping the sun and moon in the ancient world Genesis was written into — and what the text refuses to call them.',
        },
      },
      {
        id: 'stage-3',
        clues: [
          { id: 'gen-scripture-2', type: 'scripture', title: 'The Refrain', content: 'Six times, Genesis 1 repeats: "And God saw that it was good." The account ends: "God saw all that he had made, and it was very good."' },
        ],
        question: {
          id: 'q3',
          prompt: 'Taken together, what does the evidence suggest Genesis 1 is doing?',
          options: [
            'Copying Babylonian mythology with minor edits',
            'Deliberately confronting the rival origin stories of its day with a claim of one good God, ordered creation, and human dignity',
            'Providing a modern scientific account of the universe’s formation',
            'Making no claims about neighboring religions at all',
          ],
          correctIndex: 1,
          hint: 'Weigh every clue together — the calm sovereignty, the demoted sun and moon, and the repeated "it was good."',
        },
      },
    ],
    finalAnswer: {
      prompt: 'Detective, what is Genesis 1 actually doing in its ancient context?',
      options: [
        'Answering rival origin myths point by point with a claim of order, goodness, and human dignity under one sovereign God',
        'Simply retelling the Babylonian story with a new god’s name inserted',
        'Avoiding any engagement with surrounding cultures',
        'Presenting itself as a modern scientific textbook',
      ],
      correctIndex: 0,
      hint: 'Consider the pattern across all three clues — this isn’t a story written in a vacuum.',
    },
    explanation:
      'Read against its ancient backdrop, Genesis 1 reads less like folklore and more like a polemic — a calm, structured, repeated rebuttal of the chaotic, violent origin stories surrounding Israel. Where neighboring myths gave a fractured universe and disposable humans, Genesis insists on one good God, an ordered world, and people made to bear his image.',
  },
  {
    id: 'serpents-logic',
    title: 'Cross-Examining the Serpent’s Logic',
    intro: 'Every good detective knows a con works by twisting something true. Detective, put the serpent’s exact words in Genesis 3 on the stand — not the version people remember, but what the text actually says — and find the seam where truth became temptation.',
    reference: 'Genesis 3:1-7',
    ageGroup: 'teens',
    difficulty: 'expert',
    skills: ['critical-thinking', 'reading', 'bible-knowledge', 'attention'],
    xpReward: 130,
    stages: [
      {
        id: 'stage-1',
        clues: [
          { id: 'serpent-scripture-1', type: 'scripture', title: 'The Opening Question', content: '"Did God actually say, \'You shall not eat of any tree in the garden\'?" (Genesis 3:1) — God had actually only restricted one tree, not "any tree."' },
        ],
        question: {
          id: 'q1',
          prompt: 'What rhetorical move does the serpent make in his very first line?',
          options: [
            'He states God’s command accurately, then argues against it',
            'He exaggerates God’s command into something far more restrictive than it was, inviting Eve to correct him — and re-litigate it',
            'He directly denies God exists',
            'He asks a completely neutral, unloaded question',
          ],
          correctIndex: 1,
          hint: 'Compare what God actually said in Genesis 2:16-17 to how the serpent phrases the question.',
        },
      },
      {
        id: 'stage-2',
        clues: [
          { id: 'serpent-character-1', type: 'character', title: 'Eve’s Reply', content: 'Eve responds: "...but God said, \'You shall not eat of it or touch it, lest you die.\'" — adding the word "touch," which God never said.' },
          { id: 'serpent-scripture-2', type: 'scripture', title: 'The Direct Denial', content: '"You will not surely die," the serpent says next — a flat contradiction of God’s stated warning in Genesis 2:17.' },
        ],
        question: {
          id: 'q2',
          prompt: 'What does Eve’s addition of the word "touch" reveal about how the conversation is unfolding?',
          options: [
            'It proves Eve misremembered or overstated the command herself, and the serpent exploits that opening',
            'It proves the serpent was right all along',
            'It shows Eve was lying deliberately',
            'It has no bearing on the exchange',
          ],
          correctIndex: 0,
          hint: 'Notice that Eve’s version of the command is already slightly different from what God said in Genesis 2:16-17 — before the serpent even denies it.',
        },
      },
      {
        id: 'stage-3',
        clues: [
          { id: 'serpent-object-1', type: 'object', title: 'The Reframe', content: '"For God knows that when you eat of it your eyes will be opened, and you will be like God, knowing good and evil." (Genesis 3:5) — reframing obedience as God withholding something good from them out of insecurity.' },
        ],
        question: {
          id: 'q3',
          prompt: 'What is the final move in the serpent’s three-step tactic?',
          options: [
            'Distort the command, deny the consequence, then reframe God’s motive as selfish rather than protective',
            'Offer clear scientific proof',
            'Threaten Eve directly',
            'Quote Scripture accurately to build trust',
          ],
          correctIndex: 0,
          hint: 'Trace the sequence: first the command gets exaggerated, then the warning gets denied, then God’s character itself gets questioned.',
        },
      },
    ],
    finalAnswer: {
      prompt: 'Detective, what is the serpent’s core tactic across the whole exchange?',
      options: [
        'Honest, straightforward disagreement with God’s command',
        'A three-step manipulation: distort what God said, deny what he warned, then recast his character as withholding rather than good',
        'A neutral philosophical debate with no persuasive intent',
        'Physical intimidation',
      ],
      correctIndex: 1,
      hint: 'Weigh all three clues in sequence — this isn’t one lie, it’s a built argument.',
    },
    explanation:
      'The serpent never simply lies outright at first — he exaggerates the command, lets the exaggeration go uncorrected, denies the stated consequence, and finally reframes obedience itself as God’s insecurity rather than his care. It’s a pattern worth recognizing anywhere truth gets bent just enough to sound reasonable.',
  },
  {
    id: 'forgotten-scroll',
    title: 'The Forgotten Scroll Investigation',
    intro: 'During temple repairs, a workman finds a scroll that had apparently been lost for generations. When the young king hears it read aloud, he tears his robes in grief. Detective, work out what was actually in that scroll — and why a forgotten document could shake a kingdom.',
    reference: '2 Kings 22:1-23:3',
    ageGroup: 'teens',
    difficulty: 'expert',
    skills: ['critical-thinking', 'reading', 'bible-knowledge', 'attention'],
    xpReward: 150,
    stages: [
      {
        id: 'stage-1',
        clues: [
          { id: 'josiah-character-1', type: 'character', title: 'The Boy King', content: 'Josiah became king at age eight, after generations of his predecessors led Judah into idol worship. By his eighteenth year, he ordered the long-neglected temple to be repaired.' },
          { id: 'josiah-object-1', type: 'object', title: 'The Discovery', content: 'While clearing out the temple, the high priest Hilkiah found "the Book of the Law" — likely Deuteronomy — and sent it to be read to the king.' },
        ],
        question: {
          id: 'q1',
          prompt: 'What does it suggest that a core scroll of Israel’s law had to be "found," as if lost?',
          options: [
            'It suggests the document never existed until this moment',
            'It suggests generations of neglect had let Israel’s own covenant documents fall out of use entirely',
            'It suggests the priests were lying about finding it',
            'It has no significance for understanding the period',
          ],
          correctIndex: 1,
          hint: 'Consider what it means for a nation to lose track of its own founding legal and covenant document for that long.',
        },
      },
      {
        id: 'stage-2',
        clues: [
          { id: 'josiah-timeline-1', type: 'timeline', title: 'The King’s Reaction', content: 'When the scroll was read to Josiah, he tore his royal robes — a public sign of grief and alarm — and said: "great is the wrath of the Lord that is kindled against us, because our fathers have not obeyed."' },
        ],
        question: {
          id: 'q2',
          prompt: 'Why would hearing an old legal document produce that strong a reaction?',
          options: [
            'Josiah was performing for the court, without real conviction',
            'The scroll revealed just how far the nation’s actual practice had drifted from what it had originally agreed to before God',
            'The scroll contained a new law never agreed to before',
            'Josiah disagreed with the scroll’s contents',
          ],
          correctIndex: 1,
          hint: 'Think about the gap between what the nation had been doing under recent kings and what this rediscovered document required.',
        },
      },
      {
        id: 'stage-3',
        clues: [
          { id: 'josiah-scripture-1', type: 'scripture', title: 'The King’s Response', content: '"The king stood by the pillar and made a covenant before the Lord, to walk after the Lord and to keep his commandments... all the people joined in the covenant." (2 Kings 23:3)' },
        ],
        question: {
          id: 'q3',
          prompt: 'What was Josiah’s decisive response to the discovery, and what does it reveal about him?',
          options: [
            'He ignored the scroll and continued as before',
            'He publicly renewed the nation’s covenant and led sweeping religious reform, rather than dismissing what the old document demanded',
            'He destroyed the scroll to avoid controversy',
            'He delegated the entire matter to the priests without personal involvement',
          ],
          correctIndex: 1,
          hint: 'Notice that Josiah doesn’t just react emotionally — he acts, publicly and nationally, in direct response to what the text said.',
        },
      },
    ],
    finalAnswer: {
      prompt: 'Detective, what does the case of the forgotten scroll ultimately reveal?',
      options: [
        'That a nation can drift so far from its own founding commitments that rediscovering them feels like a shock, and that real reform requires acting on what’s found, not just being moved by it',
        'That the scroll was a forgery created to control Josiah',
        'That written laws don’t matter as much as good intentions',
        'That Josiah’s reaction was an overreaction with no real cause',
      ],
      correctIndex: 0,
      hint: 'Weigh the neglect, the grief, and the concrete national reform together — not just one piece alone.',
    },
    explanation:
      'The scroll wasn’t new information — it was a rediscovery of what the nation had already promised generations earlier and quietly abandoned. Josiah’s grief was proportionate to the gap between covenant and practice, and his reform shows the difference between being moved by truth and actually acting on it.',
  },
  {
    id: 'empty-tomb-case',
    title: 'The Empty Tomb: Full Case File',
    intro: 'A sealed, guarded tomb. A missing body. And a movement that should have died with its leader instead exploding across the ancient world within a generation. Detective, this is the case that either makes or breaks the whole story — build it from the evidence, not the assumption.',
    reference: 'Matthew 27-28; Luke 24; 1 Corinthians 15',
    ageGroup: 'teens',
    difficulty: 'expert',
    skills: ['critical-thinking', 'reading', 'bible-knowledge', 'attention'],
    xpReward: 160,
    stages: [
      {
        id: 'stage-1',
        clues: [
          { id: 'tomb-object-1', type: 'object', title: 'The Roman Seal', content: 'Pilate posted a Roman guard and sealed the tomb with an official seal (Matthew 27:65-66). Breaking a Roman seal was a capital offense — not a risk casual grave robbers took.' },
          { id: 'tomb-object-2', type: 'object', title: 'The Grave Clothes', content: 'When Peter and John reach the tomb, the linen wrappings are found lying in place, with the face cloth folded separately (John 20:6-7) — not the scene a hurried theft would leave.' },
        ],
        question: {
          id: 'q1',
          prompt: 'What does the state of the grave clothes argue against?',
          options: [
            'A rushed, panicked grave robbery',
            'A resurrection',
            'Nothing — it’s consistent with any explanation equally',
            'The body ever being placed there at all',
          ],
          correctIndex: 0,
          hint: 'Think about how someone in a hurry to steal a body would likely leave the wrappings — scattered, or folded?',
        },
      },
      {
        id: 'stage-2',
        clues: [
          { id: 'tomb-character-1', type: 'character', title: 'The First Witnesses', content: 'The first people to find the empty tomb and report it were women (Luke 24:1-10) — whose testimony carried little legal weight in that culture and wouldn’t have been chosen for a fabricated story.' },
          { id: 'tomb-timeline-1', type: 'timeline', title: 'A Sudden Reversal', content: 'The disciples, who had scattered in fear at Jesus’ arrest, were within weeks publicly proclaiming his resurrection in the very city where he’d been executed — several later dying for refusing to recant.' },
        ],
        question: {
          id: 'q2',
          prompt: 'Why is the choice of women as first witnesses significant for evaluating whether the story was invented?',
          options: [
            'It isn’t significant at all',
            'A fabricated story engineered to be believed would likely have used higher-status male witnesses instead, not a detail that weakened its credibility in that culture',
            'It proves the women were lying',
            'Women weren’t allowed near tombs in that period, so this detail is likely false',
          ],
          correctIndex: 1,
          hint: 'Ask what a forger optimizing for believability would have chosen to write — and compare it to what’s actually there.',
        },
      },
      {
        id: 'stage-3',
        clues: [
          { id: 'tomb-scripture-1', type: 'scripture', title: 'The Early Creed', content: '"...he appeared to Cephas, then to the twelve. Then he appeared to more than five hundred brothers at one time, most of whom are still alive..." (1 Corinthians 15:5-6) — an extremely early tradition, naming living witnesses who could be questioned.' },
        ],
        question: {
          id: 'q3',
          prompt: 'What is significant about Paul naming over 500 witnesses, "most of whom are still alive"?',
          options: [
            'It invites readers to go check with the witnesses directly, which only makes sense if the claim was expected to hold up',
            'It’s a rhetorical flourish with no real people behind it',
            'It proves nothing about the resurrection either way',
            'It was added centuries later and carries no evidential weight',
          ],
          correctIndex: 0,
          hint: 'Consider why anyone would invite public fact-checking on a claim, unless they were confident the witnesses would confirm it.',
        },
      },
    ],
    finalAnswer: {
      prompt: 'Detective, weighing the sealed tomb, the folded grave clothes, the low-status first witnesses, and the named living witnesses together — what verdict best fits the evidence?',
      options: [
        'The evidence is most consistent with a real, physical resurrection, not a theft, a hallucination, or a later legend',
        'The disciples stole the body and fabricated the story',
        'The whole account was invented generations later with no basis in eyewitness testimony',
        'There is simply no way to weigh any of this evidence either way',
      ],
      correctIndex: 0,
      hint: 'No single clue proves the case alone — but consider what explanation accounts for all four at once.',
    },
    explanation:
      'A theft doesn’t explain a broken Roman seal or folded grave clothes. An invented legend doesn’t explain why the first witnesses were women, a credibility risk in that culture, or why Paul would invite readers to go question five hundred still-living witnesses. Taken together, the evidence doesn’t force belief — but it consistently points toward something that actually happened, not a story that merely grew over time.',
  },
];

export function getCaseDefinition(id: string): CaseDefinition | undefined {
  return CASE_BANK.find((c) => c.id === id);
}
