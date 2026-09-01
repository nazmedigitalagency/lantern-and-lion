// Teen-track World Data for Bible Adventure World
//
// Parallel content to the canonical (child) region/quest set in world-data.ts.
// Same 8 RegionIds, same connectsTo/unlockRequirement chain and mapPositions
// (Bible history can't be reordered, and the unlock chain depends on these
// ids), but written for a teen reading level and moral/theological depth:
// historical-critical context, harder interpretive questions, and boss
// challenges that test reasoning rather than recall of a simplified retelling.

import type { AdventureQuest, Region } from './types';

export const teenRegions: Region[] = [
  // 1. CREATION
  {
    id: 'creation',
    name: 'Genesis & the Question of Origins',
    tagline: 'A text written to dethrone every god of the ancient world — including chaos itself.',
    icon: '🌌',
    mapPosition: { x: 8, y: 78 },
    connectsTo: ['eden'],
    unlockRequirement: [{ type: 'always' }],
    tone: 'navy',
    scriptureRange: 'Genesis 1:1 – 2:3 · Psalm 8 · Psalm 104 · Colossians 1:15-17',
    summary:
      'Read Genesis 1 the way its first audience did — as a direct challenge to Babylon’s origin myths — then wrestle with what "made in God’s image" actually demands of how you treat every human being you meet.',
    environmentDescription:
      'A pre-dawn cosmos rendered in manuscript ink and starlight, ancient cuneiform tablets half-buried beside luminous nebulae, and a horizon where scientific instruments and scripture scrolls share the same table.',
    chapters: [
      {
        id: 'creation-ch1',
        chapterNumber: 1,
        title: 'A Polemic, Not Just a Poem',
        subtitle: 'Genesis 1 vs. the Gods of Babylon',
        scriptureReference: 'Genesis 1:1-5',
        bibleText: 'In the beginning, God created the heavens and the earth... And God said, "Let there be light," and there was light.',
        narrativeExplanation:
          'Genesis 1 was written into a world saturated with rival origin myths, like Babylon’s Enuma Elish, where the sun, moon, and sea were themselves gods born out of violent chaos. Genesis refuses that entire picture. It names one sovereign God who speaks the cosmos into order, and strips the sun and moon of divine status by calling them simply "lights" — servants, not deities.',
        takeawayMessage:
          'Genesis 1 isn’t merely describing how the world began — it’s declaring war on every rival god its first readers had been taught to fear.',
      },
      {
        id: 'creation-ch2',
        chapterNumber: 2,
        title: 'Framework, Days, or Both? Reading Genesis Honestly',
        subtitle: 'The Real Debate Among Faithful Christians',
        scriptureReference: 'Genesis 1:6-25',
        bibleText: 'And God said, "Let the waters under the heavens be gathered together into one place, and let the dry land appear." And it was so.',
        narrativeExplanation:
          'Faithful, historically orthodox Christians disagree today on how the six "days" of Genesis relate to the findings of modern science — young-earth, old-earth, and literary-framework readings all have serious defenders. That disagreement is real and worth studying carefully. But it sits inside a shared conviction that doesn’t depend on resolving it: Scripture teaches that God alone is the source of everything that exists, and that His ordered world is genuinely good.',
        takeawayMessage:
          'You don’t have to settle every scientific question to trust the text’s actual claim: everything that exists depends on God and nothing else.',
      },
      {
        id: 'creation-ch3',
        chapterNumber: 3,
        title: 'Imago Dei: The Most Dangerous Idea in Genesis',
        subtitle: 'Genesis 1:26-31',
        scriptureReference: 'Genesis 1:26-31',
        bibleText: 'So God created man in his own image, in the image of God he created him; male and female he created them... And God saw everything that he had made, and behold, it was very good.',
        narrativeExplanation:
          'In the Ancient Near East, only a king was typically described as bearing a god’s "image" — a claim about political authority, not shared humanity. Genesis 1 takes that royal language and hands it to every human being, male and female, with no rank attached. That single move is the theological root of human dignity that later shows up everywhere from Israel’s law codes to modern human rights language.',
        takeawayMessage:
          'Every person who has ever mocked you, ignored you, or been mocked by you carries the same divine image you do — that’s not a compliment, it’s a command.',
      },
    ],
    memoryVerse: {
      reference: 'Genesis 1:27',
      text: 'So God created man in his own image, in the image of God he created him; male and female he created them.',
      translation: 'ESV',
      blanks: ['image', 'God', 'male', 'female'],
      theme: 'Human Dignity',
    },
    boss: {
      id: 'boss-creation',
      title: 'The Genesis Tribunal',
      bossName: 'The Adjudicator of Origins',
      bossEmoji: '⚖️',
      description: 'Defend a reading of Genesis 1 that takes both the ancient text and honest scholarship seriously.',
      requiredScore: 3,
      questions: [
        {
          id: 'cq-1',
          prompt: 'Genesis 1 was written into a world full of origin myths like Babylon’s Enuma Elish. What is the text’s central polemical claim?',
          options: [
            'There is one sovereign God, and the sun, moon, and sea are His creations, not rival deities',
            'Chaos created itself before any god existed',
            'Multiple gods cooperated equally to build the cosmos',
            'The ancient Israelites had no view on how the world began',
          ],
          correctIndex: 0,
          explanation: 'Genesis 1 refuses to name the sun and moon (as Babylon did) as gods — it calls them "lights," stripped of divine status, existing only to serve the true Creator.',
          conceptKey: 'ane_polemic',
        },
        {
          id: 'cq-2',
          prompt: 'Faithful Christian scholars today hold different views on how the "days" of Genesis 1 relate to modern science. What does this genuine disagreement mean?',
          options: [
            'Historic orthodox Christians can hold different views on the days while still affirming the same core claim: God alone created everything',
            'The Bible is therefore unreliable on every subject',
            'Only one interpretation has ever been considered acceptable throughout church history',
            'Genesis 1 makes no claims about God at all',
          ],
          correctIndex: 0,
          explanation: 'The differences are real and worth studying, but they sit inside a shared conviction: Scripture teaches God as the sole, sovereign source of all that exists — a claim that doesn’t depend on resolving the science-text question.',
          conceptKey: 'creation_interpretive_humility',
        },
        {
          id: 'cq-3',
          prompt: 'In the Ancient Near East, only kings were typically described as bearing a god’s "image." What does Genesis 1:26-27 do with that idea?',
          options: [
            'It extends "image of God" status to every human being, not just royalty',
            'It removes the concept of divine image from Scripture entirely',
            'It restricts God’s image to Adam alone',
            'It applies only to angels',
          ],
          correctIndex: 0,
          explanation: 'By calling ordinary humans — male and female — bearers of God’s image, Genesis 1 makes a leveling claim: dignity isn’t earned by rank, it’s given at creation to everyone.',
          conceptKey: 'imago_dei_democratized',
        },
        {
          id: 'cq-4',
          prompt: 'What is the practical, ethical weight of the imago Dei claim for how you treat other people?',
          options: [
            'Every person’s worth is fixed by their Creator and can’t be revoked by their usefulness, appearance, or popularity',
            'Only people who share your beliefs bear God’s image',
            'Human worth is something people earn through achievement',
            'The image of God is a purely symbolic idea with no ethical consequence',
          ],
          correctIndex: 0,
          explanation: 'If everyone bears God’s image, contempt for another person is never morally neutral — it’s an attack on something God Himself placed there.',
          conceptKey: 'imago_dei_ethics',
        },
      ],
      storyReconstruction: {
        prompt: 'Trace the argument Genesis 1 is actually making, in order:',
        events: [
          'The text opens by naming one God as sole Creator, with no rival god ever mentioned',
          'It systematically strips the sun, moon, sea, and sky of the divine status other cultures gave them',
          'It declares the ordered cosmos "good" — a deliberate contrast to origin myths built on divine violence and chaos',
          'It climaxes by giving God’s own image not to a king, but to every human being',
        ],
        correctOrder: [0, 1, 2, 3],
      },
      reward: {
        xp: 340,
        coins: 140,
        gems: 4,
        badgeName: 'Genesis Scholar',
        badgeEmoji: '📜',
        specialCollectible: {
          id: 'coll-teen-tablet-fragment',
          name: 'Cuneiform Comparison Tablet',
          emoji: '🪨',
          description: 'A replica tablet fragment used to compare Genesis 1 against Babylonian creation myths line by line.',
          rarity: 'rare',
          foundInRegion: 'creation',
        },
      },
    },
    secrets: [
      {
        id: 'sec-teen-creation-1',
        name: 'The Enuma Elish Fragment',
        hint: 'Search the scholar’s desk where ancient tablets are compared side by side.',
        emoji: '🧾',
        rewardCoins: 60,
        rewardGems: 2,
        discovered: false,
      },
    ],
    collectibles: [
      {
        id: 'coll-teen-creation-lens',
        name: 'Scholar’s Reading Lens',
        emoji: '🔍',
        description: 'Used to examine Hebrew text and ancient parallels side by side.',
        rarity: 'common',
        foundInRegion: 'creation',
      },
    ],
  },

  // 2. EDEN
  {
    id: 'eden',
    name: 'Eden: Vocation, Temptation, and the First Promise',
    tagline: 'Before there was law, there was trust — and a test that reveals what "freedom" actually costs.',
    icon: '🌿',
    mapPosition: { x: 20, y: 64 },
    connectsTo: ['creation', 'noah'],
    unlockRequirement: [{ type: 'region-complete', regionId: 'creation', minQuestsCompleted: 1 }],
    tone: 'teal',
    scriptureRange: 'Genesis 2:4 – 3:24',
    summary:
      'Examine Eden not as a fairy-tale garden but as a covenant courtroom: a vocation given, a single prohibition explained, a temptation that reframes God as withholding rather than generous, and a judgment that somehow contains the gospel’s first sentence.',
    environmentDescription:
      'Twin rivers threading through cultivated groves, a solitary forbidden tree lit starkly against the garden’s abundance, and long shadows where the serpent’s question still echoes.',
    chapters: [
      {
        id: 'eden-ch1',
        chapterNumber: 1,
        title: 'Work Before the Fall',
        subtitle: 'Vocation Isn’t a Punishment',
        scriptureReference: 'Genesis 2:15-17',
        bibleText: 'The LORD God took the man and put him in the garden of Eden to work it and keep it. And the LORD God commanded the man, "You may surely eat of every tree of the garden, but of the tree of the knowledge of good and evil you shall not eat."',
        narrativeExplanation:
          'Work predates the Fall — labor itself isn’t a curse, only its later frustration is (Genesis 3:17-19). God gives Adam one prohibition amid total abundance, which is worth noticing: the command establishes real moral agency and a real choice, not a trap. A single "no" surrounded by an entire garden of "yes" is a strange way to describe stinginess.',
        takeawayMessage:
          'Meaningful work and real limits were part of paradise before anything went wrong — freedom was never the absence of boundaries.',
      },
      {
        id: 'eden-ch2',
        chapterNumber: 2,
        title: 'The Serpent’s Rhetorical Trick',
        subtitle: 'How Temptation Actually Works',
        scriptureReference: 'Genesis 3:1-6',
        bibleText: '"Did God actually say, \'You shall not eat of any tree in the garden\'?"... So when the woman saw that the tree was good for food, and that it was a delight to the eyes, and that the tree was to be desired to make one wise, she took of its fruit and ate.',
        narrativeExplanation:
          'God had only forbidden one tree. The serpent’s opening question exaggerates that into a blanket ban, quietly recasting a generous boundary as oppressive. Then the offer itself — "you will not surely die," "you will be like God, knowing good and evil" — reframes trusting God’s word as a loss and self-determined moral authority as a gain. That’s the same maneuver temptation still runs today, just in different clothes.',
        takeawayMessage:
          'Every temptation eventually asks the same question the serpent asked: "Did God really mean that?" — and it always answers by making disobedience sound like liberation.',
      },
      {
        id: 'eden-ch3',
        chapterNumber: 3,
        title: 'Judgment That Contains a Promise',
        subtitle: 'Genesis 3:8-15 and the First Gospel',
        scriptureReference: 'Genesis 3:8-15',
        bibleText: '"Where are you?"... "I will put enmity between you and the woman, and between your offspring and her offspring; he shall bruise your head, and you shall bruise his heel."',
        narrativeExplanation:
          'God’s first move after the Fall isn’t erasure — it’s a question, "Where are you?", asked to people who are hiding, not to gather information but to initiate contact. Real consequences follow, but so does a promise: a future descendant of the woman will ultimately crush the serpent’s power, at a cost to himself. Theologians call this the protoevangelium — the first gospel — because the New Testament identifies its fulfillment with Christ’s victory at the cross.',
        takeawayMessage:
          'God’s first response to human failure wasn’t erasure — it was a search party, followed immediately by a promise that evil would not have the last word.',
      },
    ],
    memoryVerse: {
      reference: 'Genesis 3:15',
      text: '"I will put enmity between you and the woman, and between your offspring and her offspring; he shall bruise your head, and you shall bruise his heel."',
      translation: 'ESV',
      blanks: ['enmity', 'offspring', 'bruise', 'head'],
      theme: 'The First Gospel Promise',
    },
    boss: {
      id: 'boss-eden',
      title: 'The Serpent’s Cross-Examination',
      bossName: 'The Advocate of the Garden',
      bossEmoji: '🐍',
      description: 'Prove you can identify the serpent’s rhetorical strategy — and explain why Genesis 3 ends in promise, not despair.',
      requiredScore: 3,
      questions: [
        {
          id: 'eq-1',
          prompt: 'What rhetorical move does the serpent make first in Genesis 3:1?',
          options: [
            'He exaggerates God’s actual command to make it sound needlessly restrictive',
            'He directly denies that God exists',
            'He offers Eve a bribe of gold',
            'He commands Eve to leave the garden',
          ],
          correctIndex: 0,
          explanation: 'God had only forbidden one tree; the serpent’s question implies a blanket prohibition, subtly recasting a generous boundary as oppressive.',
          conceptKey: 'temptation_distortion',
        },
        {
          id: 'eq-2',
          prompt: 'The serpent tells Eve she "will not surely die" and will be "like God, knowing good and evil." What is the deeper deception in this offer?',
          options: [
            'It reframes trusting God’s word as a loss, and self-determined moral authority as a gain',
            'It promises literal magical powers with no consequence at all',
            'It is simply a lie with no persuasive logic behind it',
            'It has nothing to do with trust in God',
          ],
          correctIndex: 0,
          explanation: 'The temptation isn’t just "eat the fruit" — it’s "decide good and evil for yourself, instead of trusting God’s definition of it," the same temptation every generation since has faced in a different costume.',
          conceptKey: 'autonomy_temptation',
        },
        {
          id: 'eq-3',
          prompt: 'When God asks Adam, "Where are you?" what does this reveal about God’s posture toward human failure?',
          options: [
            'God pursues the ones who are hiding rather than abandoning them',
            'God already knew everything and asked out of ignorance',
            'God asks because He is powerless to act otherwise',
            'The question shows God had left the garden',
          ],
          correctIndex: 0,
          explanation: 'God isn’t gathering information — He’s initiating contact with people who just ran from Him. The question itself is an act of grace before a single word of judgment is spoken.',
          conceptKey: 'gods_pursuing_grace',
        },
        {
          id: 'eq-4',
          prompt: 'Genesis 3:15 is often called the "protoevangelium," or first gospel. What does it promise?',
          options: [
            'A future descendant of the woman will ultimately crush the serpent’s power, though at a cost to himself',
            'That Adam and Eve would immediately return to Eden',
            'That the serpent would be given dominion over humanity',
            'That no consequence would follow the disobedience',
          ],
          correctIndex: 0,
          explanation: 'Even in pronouncing judgment, God embeds a promise: evil’s defeat, through a descendant who is wounded in the process — language the New Testament identifies with Christ’s victory at the cross.',
          conceptKey: 'first_gospel_promise',
        },
      ],
      storyReconstruction: {
        prompt: 'Reconstruct the actual sequence of Genesis 2-3’s argument:',
        events: [
          'God gives Adam meaningful work and one clear boundary amid total abundance',
          'The serpent reframes that boundary as proof God is withholding something good',
          'Adam and Eve choose self-determined autonomy over trust, and both immediately feel exposed',
          'God seeks them out, pronounces real consequences, and embeds a promise that evil will ultimately be undone',
        ],
        correctOrder: [0, 1, 2, 3],
      },
      reward: {
        xp: 360,
        coins: 150,
        gems: 4,
        badgeName: 'Garden Advocate',
        badgeEmoji: '🌿',
        specialCollectible: {
          id: 'coll-teen-protoevangelium-scroll',
          name: 'Protoevangelium Scroll',
          emoji: '📜',
          description: 'An annotated scroll tracing the promise of Genesis 3:15 forward to the cross.',
          rarity: 'epic',
          foundInRegion: 'eden',
        },
      },
    },
    secrets: [
      {
        id: 'sec-teen-eden-1',
        name: 'The Serpent’s Actual Words',
        hint: 'Reread the exact wording of the ban before comparing it to what the serpent claimed God said.',
        emoji: '🗣️',
        rewardCoins: 65,
        rewardGems: 2,
        discovered: false,
      },
    ],
    collectibles: [
      {
        id: 'coll-teen-eden-fig',
        name: 'Fig Leaf Covering',
        emoji: '🍃',
        description: 'A reminder of humanity’s first attempt to solve shame on its own terms.',
        rarity: 'common',
        foundInRegion: 'eden',
      },
    ],
  },

  // 3. NOAH
  {
    id: 'noah',
    name: 'Noah: Righteousness in a Drowning World',
    tagline: 'One family stayed sane in a civilization gone fully feral — and it cost them everything familiar.',
    icon: '⚓',
    mapPosition: { x: 34, y: 72 },
    connectsTo: ['eden', 'egypt'],
    unlockRequirement: [{ type: 'region-complete', regionId: 'eden', minQuestsCompleted: 1 }],
    tone: 'coral',
    scriptureRange: 'Genesis 6–9 · 2 Peter 2:5 · 1 Peter 3:20',
    summary:
      'Face the flood narrative honestly — as a story about a civilization’s moral collapse, one man’s century-long unpopular obedience, and a God whose judgment and mercy arrive in the same covenant.',
    environmentDescription:
      'A construction yard of cut gopher wood beneath storm-black skies, mocking crowds along the tree line, and — after forty days — a single rainbow arcing over debris-strewn, silent water.',
    chapters: [
      {
        id: 'noah-ch1',
        chapterNumber: 1,
        title: 'How Bad Does It Have to Get?',
        subtitle: 'Genesis 6:5-8 and the Weight of Divine Judgment',
        scriptureReference: 'Genesis 6:5-8',
        bibleText: 'The LORD saw that the wickedness of man was great in the earth... and it grieved him to his heart... But Noah found favor in the eyes of the LORD.',
        narrativeExplanation:
          'This text is difficult, and it should be engaged honestly rather than smoothed over. Judgment here is described in emotional, relational terms — God’s heart is "grieved" — which pushes back against any caricature of an angry deity flipping a switch. 2 Peter later calls Noah "a herald of righteousness," implying decades of public, apparently fruitless preaching before a single drop of rain fell.',
        takeawayMessage:
          'This isn’t a story about a God who enjoys judgment — it’s a story about a God who grieved for a century before acting, and one man who kept obeying anyway with nothing to show for it.',
      },
      {
        id: 'noah-ch2',
        chapterNumber: 2,
        title: 'A Hundred Years of Being Wrong (In Public)',
        subtitle: 'What It Actually Cost Noah to Obey',
        scriptureReference: 'Genesis 6:14-22 · Hebrews 11:7',
        bibleText: 'By faith Noah, being warned by God concerning events as yet unseen, in reverent fear constructed an ark for the saving of his household. By this he condemned the world and became an heir of the righteousness that comes by faith.',
        narrativeExplanation:
          'Consider the social cost: building an enormous, inland boat with no rain in living memory, while an entire culture presumably watched and mocked for most of a century. "He condemned the world" describes the effect of quiet, decades-long consistency, not a single sermon. It’s worth asking what conviction looks like when it costs you social standing for a hundred years before it costs you anything else.',
        takeawayMessage:
          'Faith that costs you nothing socially isn’t being tested. Noah’s faith is remembered precisely because it looked insane for a hundred years before it looked right for one week.',
      },
      {
        id: 'noah-ch3',
        chapterNumber: 3,
        title: 'A Covenant, Not Just a Cleanup',
        subtitle: 'Genesis 9:8-17',
        scriptureReference: 'Genesis 9:8-17',
        bibleText: '"I set my bow in the cloud, and it shall be a sign of the covenant between me and the earth... I will remember my covenant."',
        narrativeExplanation:
          'Genesis 8–9 deliberately echoes Genesis 1’s language — waters recede, dry land reappears, humanity is blessed and commissioned again — framing the flood as an un-creation and re-creation rather than mere destruction. The rainbow covenant that follows is unconditional: God binds only Himself, promising never again to destroy the earth this way, asking nothing of humanity in return.',
        takeawayMessage:
          'The story doesn’t end with the flood — it ends with God making a promise that costs Him something and asks nothing of humanity in return.',
      },
    ],
    memoryVerse: {
      reference: '2 Peter 2:5',
      text: '...if he did not spare the ancient world, but preserved Noah, a herald of righteousness, with seven others, when he brought a flood upon the world of the ungodly...',
      translation: 'ESV',
      blanks: ['spare', 'Noah', 'herald', 'righteousness'],
      theme: 'Costly Obedience',
    },
    boss: {
      id: 'boss-noah',
      title: 'The Century of Obedience Trial',
      bossName: 'The Herald of the Ark',
      bossEmoji: '🌧️',
      description: 'Show you can hold the moral weight of the flood narrative honestly — judgment, grief, and covenant together.',
      requiredScore: 3,
      questions: [
        {
          id: 'nq-1',
          prompt: 'Genesis 6:6 says God’s heart was "grieved" over human wickedness before the flood. What does this detail push back against?',
          options: [
            'The caricature of God’s judgment as detached anger rather than sorrowful response to real evil',
            'The idea that God has emotions at all',
            'The idea that humans did anything wrong',
            'The idea that Noah was ever in danger',
          ],
          correctIndex: 0,
          explanation: 'The text refuses to let judgment be read as casual or cruel — it’s explicitly grief-driven, a very different moral picture than an indifferent deity flipping a switch.',
          conceptKey: 'divine_grief_before_judgment',
        },
        {
          id: 'nq-2',
          prompt: '2 Peter 2:5 calls Noah "a herald of righteousness." Given that Genesis records no converts besides his own family, what does this title imply?',
          options: [
            'He remained faithful and vocal for a very long time with visible results of exactly zero — obedience wasn’t validated by success',
            'He never actually spoke publicly about the coming flood',
            'He convinced most of his city to repent before the flood came',
            'The title is symbolic and has no connection to public preaching',
          ],
          correctIndex: 0,
          explanation: 'Being called a "herald" implies public proclamation over a long span, yet only seven other people entered the ark. Noah’s faithfulness is defined by consistency, not results.',
          conceptKey: 'obedience_without_results',
        },
        {
          id: 'nq-3',
          prompt: 'Structurally, Genesis 8–9 echoes Genesis 1 (waters recede, dry land appears, humanity is blessed and commissioned again). What does this literary pattern communicate?',
          options: [
            'The flood functions as a kind of un-creation and re-creation, not merely a natural disaster',
            'The flood has no connection whatsoever to the creation account',
            'Genesis 1 and Genesis 8-9 were written by unrelated cultures with coincidental similarities',
            'The pattern proves the flood account was borrowed entirely from Babylonian myth with no theological purpose',
          ],
          correctIndex: 0,
          explanation: 'The deliberate echoes of Genesis 1’s language in Genesis 8-9 frame the flood as a reset of creation — judgment clears the way for a genuinely new beginning, not mere destruction.',
          conceptKey: 'flood_recreation_pattern',
        },
        {
          id: 'nq-4',
          prompt: 'What is distinct about the covenant God makes in Genesis 9:8-17?',
          options: [
            'It is unconditional — God binds only Himself, asking nothing of humanity in return for the promise',
            'It requires humanity to build a new altar every generation to remain valid',
            'It only applies to Noah personally, not to the earth',
            'It is later revoked in Exodus',
          ],
          correctIndex: 0,
          explanation: 'Unlike later covenants with conditions on both parties, this one is a one-sided promise: God commits never again to destroy the earth this way, sealed by a sign He alone sets in the sky.',
          conceptKey: 'noahic_covenant_unconditional',
        },
      ],
      storyReconstruction: {
        prompt: 'Put the flood narrative’s actual arc in order:',
        events: [
          'God grieves over a civilization’s total moral collapse, yet finds one family who "walked with God"',
          'Noah spends roughly a century building an ark and preaching, apparently without a single outside convert',
          'Judgment falls as a deliberate un-creation — the ordered world dissolves back into the waters of Genesis 1',
          'The waters recede, the world is re-commissioned, and God seals an unconditional promise with the rainbow',
        ],
        correctOrder: [0, 1, 2, 3],
      },
      reward: {
        xp: 380,
        coins: 155,
        gems: 4,
        badgeName: 'Herald of the Ark',
        badgeEmoji: '⚓',
        specialCollectible: {
          id: 'coll-teen-noah-plumbline',
          name: 'Shipwright’s Plumb Line',
          emoji: '🪢',
          description: 'A weighted line used to keep a century-long project true, board by board, with no visible reward in sight.',
          rarity: 'rare',
          foundInRegion: 'noah',
        },
      },
    },
    secrets: [
      {
        id: 'sec-teen-noah-1',
        name: 'The Century Ledger',
        hint: 'Search the construction yard for a record of exactly how long the ark took to build.',
        emoji: '📋',
        rewardCoins: 70,
        rewardGems: 2,
        discovered: false,
      },
    ],
    collectibles: [
      {
        id: 'coll-teen-noah-pitch',
        name: 'Sealed Gopherwood Sample',
        emoji: '🪵',
        description: 'A tar-sealed plank fragment, evidence of obsessive, unglamorous preparation.',
        rarity: 'common',
        foundInRegion: 'noah',
      },
    ],
  },

  // 4. EGYPT
  {
    id: 'egypt',
    name: 'Exodus: Power, Plagues, and the Politics of a God Who Frees Slaves',
    tagline: 'Ten plagues, one Pharaoh, and a direct contest between the LORD and an entire pantheon.',
    icon: '🏺',
    mapPosition: { x: 48, y: 52 },
    connectsTo: ['noah', 'wilderness'],
    unlockRequirement: [{ type: 'region-complete', regionId: 'noah', minQuestsCompleted: 1 }],
    tone: 'gold',
    scriptureRange: 'Exodus 1–14 · Romans 9:14-18',
    summary:
      'Read the plagues as a systematic dismantling of Egypt’s gods, wrestle honestly with Pharaoh’s hardened heart, and trace how the Exodus becomes the Bible’s template for every later act of deliverance.',
    environmentDescription:
      'Nile-side brick pits under a merciless sun, a royal court frozen mid-collapse across ten escalating disasters, and a wall of parted water holding impossibly still at low tide.',
    chapters: [
      {
        id: 'egypt-ch1',
        chapterNumber: 1,
        title: 'A Contest of Gods, Not Just a Rescue',
        subtitle: 'Exodus 7-12 and the Theology of the Plagues',
        scriptureReference: 'Exodus 12:12',
        bibleText: '"For I will pass through the land of Egypt that night... and on all the gods of Egypt I will execute judgments: I am the LORD."',
        narrativeExplanation:
          'Each plague targets a specific Egyptian deity — the Nile-god Hapi in the blood plague, the frog-goddess Heqet, the sun-god Ra blotted out by darkness. This isn’t random destruction; it’s a court case where Yahweh methodically dismantles Egypt’s entire religious system in front of the people who worshiped it, plague by plague.',
        takeawayMessage:
          'The plagues aren’t a temper tantrum — they’re a systematic verdict against every god the empire trusted, delivered one institution at a time.',
      },
      {
        id: 'egypt-ch2',
        chapterNumber: 2,
        title: 'Who Hardened Pharaoh’s Heart?',
        subtitle: 'The Hardest Question in Exodus',
        scriptureReference: 'Exodus 8:15, 9:12 · Romans 9:17-18',
        bibleText: 'But when Pharaoh saw that there was relief, he hardened his heart... So the LORD hardened Pharaoh’s heart.',
        narrativeExplanation:
          'Exodus’s own pattern matters here: the earlier plagues say Pharaoh hardened his own heart; only the later ones say God hardened it. Many careful readers take this sequence as God confirming Pharaoh in a direction he had already, repeatedly, freely chosen — not overriding a would-be-repentant man against his will. Scripture doesn’t flatten this tension for easy comfort.',
        takeawayMessage:
          'Scripture doesn’t resolve this tension for easy comfort — it holds both real human responsibility and real divine sovereignty together, and asks you to sit with that rather than simplify it.',
      },
      {
        id: 'egypt-ch3',
        chapterNumber: 3,
        title: 'Passover: The Blood That Redefines Deliverance',
        subtitle: 'Exodus 12:1-13, 21-30',
        scriptureReference: 'Exodus 12:1-13',
        bibleText: '"The blood shall be a sign for you, on the houses where you are. And when I see the blood, I will pass over you."',
        narrativeExplanation:
          'A lamb dies in the place of the firstborn; the household eats it ready to move. The New Testament writers directly identify Jesus as "our Passover lamb" (1 Corinthians 5:7) and "the Lamb of God" (John 1:29) — Exodus becomes the interpretive lens for the cross, not a separate, unrelated story.',
        takeawayMessage:
          'Every later act of redemption in Scripture — including the cross — borrows its vocabulary from this one night in Egypt.',
      },
    ],
    memoryVerse: {
      reference: 'Exodus 12:13',
      text: '"The blood shall be a sign for you, on the houses where you are. And when I see the blood, I will pass over you."',
      translation: 'ESV',
      blanks: ['blood', 'sign', 'see', 'pass'],
      theme: 'Substitution and Deliverance',
    },
    boss: {
      id: 'boss-egypt',
      title: 'The Ten Plagues Tribunal',
      bossName: 'The Court of Yahweh vs. Egypt',
      bossEmoji: '⚡',
      description: 'Prove you understand the plagues as theology, not just special effects — and can hold the hardened-heart tension honestly.',
      requiredScore: 3,
      questions: [
        {
          id: 'eg-1',
          prompt: 'Exodus 12:12 says the plagues executed "judgments" against "all the gods of Egypt." What does this claim about the plagues’ purpose?',
          options: [
            'They functioned as a deliberate, systematic verdict against Egypt’s specific deities, not random natural disasters',
            'They were unrelated to Egyptian religion entirely',
            'They targeted only Pharaoh personally, not the nation’s belief system',
            'They were primarily meant to entertain Moses',
          ],
          correctIndex: 0,
          explanation: 'Ancient Egyptians associated the Nile, the sun, frogs, cattle, and more with specific gods; the plagues strike exactly those domains, framing the event as a religious contest Yahweh wins decisively.',
          conceptKey: 'plagues_as_theological_verdict',
        },
        {
          id: 'eg-2',
          prompt: 'Exodus alternates between "Pharaoh hardened his own heart" (early plagues) and "the LORD hardened Pharaoh’s heart" (later plagues). What is the most textually careful way to read this pattern?',
          options: [
            'God confirmed Pharaoh in a direction he had already freely and repeatedly chosen for himself',
            'God forced a genuinely repentant Pharaoh to keep sinning against his will',
            'The two phrases are contradictory errors in the text',
            'Pharaoh’s choices were entirely irrelevant to the outcome',
          ],
          correctIndex: 0,
          explanation: 'The sequence matters: Pharaoh hardens his own heart first, multiple times, before the text ever says God hardened it — suggesting confirmation of a settled pattern rather than an override of a change of mind.',
          conceptKey: 'hardened_heart_tension',
        },
        {
          id: 'eg-3',
          prompt: 'What does the Passover lamb’s blood on the doorframe accomplish in Exodus 12?',
          options: [
            'It substitutes for the life of the firstborn inside the house, marking it for deliverance from judgment',
            'It has purely decorative significance with no substitutionary meaning',
            'It is required only for Egyptian households, not Israelite ones',
            'It guarantees prosperity unrelated to the judgment happening that night',
          ],
          correctIndex: 0,
          explanation: 'The blood doesn’t ward off evil magically — it marks a household as already having paid the price of judgment through a substitute, so the judgment "passes over."',
          conceptKey: 'passover_substitution',
        },
        {
          id: 'eg-4',
          prompt: 'How does the New Testament use Passover imagery to describe Jesus?',
          options: [
            'It directly calls Jesus "our Passover lamb," applying the same substitutionary logic to the cross',
            'It rejects any connection between Exodus and the cross',
            'It treats Passover only as a historical footnote with no theological use',
            'It applies Passover imagery to John the Baptist instead of Jesus',
          ],
          correctIndex: 0,
          explanation: '1 Corinthians 5:7 explicitly says "Christ, our Passover lamb, has been sacrificed" — the New Testament writers read the cross through the vocabulary Exodus already built.',
          conceptKey: 'passover_typology_of_christ',
        },
      ],
      storyReconstruction: {
        prompt: 'Order the theological arc of the Exodus narrative:',
        events: [
          'Yahweh systematically dismantles Egypt’s gods, plague by plague, in a public contest of power',
          'Pharaoh’s repeated free choices to resist are eventually confirmed rather than overridden by God',
          'A substitute lamb’s blood marks Israelite households for deliverance from the final plague',
          'The Exodus becomes the template later writers use to explain the cross itself',
        ],
        correctOrder: [0, 1, 2, 3],
      },
      reward: {
        xp: 400,
        coins: 165,
        gems: 5,
        badgeName: 'Court of Yahweh Witness',
        badgeEmoji: '⚡',
        specialCollectible: {
          id: 'coll-teen-egypt-signet',
          name: 'Broken Royal Signet',
          emoji: '💍',
          description: 'A cracked seal ring, symbolizing an empire’s authority publicly overturned.',
          rarity: 'epic',
          foundInRegion: 'egypt',
        },
      },
    },
    secrets: [
      {
        id: 'sec-teen-egypt-1',
        name: 'The God-by-God Plague Chart',
        hint: 'Look for the scholar’s chart matching each plague to the Egyptian deity it confronted.',
        emoji: '📊',
        rewardCoins: 75,
        rewardGems: 2,
        discovered: false,
      },
    ],
    collectibles: [
      {
        id: 'coll-teen-egypt-lamb-bone',
        name: 'Passover Lamb Bone (Unbroken)',
        emoji: '🦴',
        description: 'Kept whole per the Passover instructions — a detail John’s Gospel later applies to the crucifixion.',
        rarity: 'rare',
        foundInRegion: 'egypt',
      },
    ],
  },

  // 5. WILDERNESS
  {
    id: 'wilderness',
    name: 'Sinai & the Wilderness: Covenant, Failure, and Relentless Presence',
    tagline: 'A nation says yes to God at the mountain and no to Him twelve chapters later — and He stays anyway.',
    icon: '🏕️',
    mapPosition: { x: 62, y: 68 },
    connectsTo: ['egypt', 'jerusalem'],
    unlockRequirement: [{ type: 'region-complete', regionId: 'egypt', minQuestsCompleted: 1 }],
    tone: 'amber',
    scriptureRange: 'Exodus 19–20, 32 · Numbers 13–14 · Deuteronomy 6',
    summary:
      'Study the Sinai covenant as an actual ancient treaty structure, sit with the golden calf’s betrayal timeline, and trace forty years of wandering as the direct consequence of one moment of collective unbelief at Kadesh Barnea.',
    environmentDescription:
      'A smoking, trembling mountain ringed by a boundary line no one may cross, a shattered set of stone tablets in the sand below, and an endless amber desert circling the same waypoints year after year.',
    chapters: [
      {
        id: 'wild-ch1',
        chapterNumber: 1,
        title: 'A Treaty, Not Just a Rulebook',
        subtitle: 'Exodus 19-20 and Ancient Covenant Structure',
        scriptureReference: 'Exodus 19:4-6, 20:1-17',
        bibleText: '"You yourselves have seen what I did to the Egyptians, and how I bore you on eagles’ wings and brought you to myself... you shall be to me a kingdom of priests and a holy nation."',
        narrativeExplanation:
          'The Ten Commandments follow the literary form of Ancient Near Eastern suzerain-vassal treaties: a historical prologue recalling the rescue, followed by stipulations. The law isn’t arbitrary rule-making — it’s the terms of a relationship already established by grace, not a ladder built to earn one.',
        takeawayMessage:
          'The Ten Commandments open with "I brought you out," not "do this and I’ll rescue you" — obedience was always meant to be a response to grace already given, not a transaction to earn it.',
      },
      {
        id: 'wild-ch2',
        chapterNumber: 2,
        title: 'Forty Days, One Calf',
        subtitle: 'Exodus 32 and the Speed of Betrayal',
        scriptureReference: 'Exodus 32:1-8',
        bibleText: '"Up, make us gods who shall go before us... These are your gods, O Israel, who brought you up out of the land of Egypt!"',
        narrativeExplanation:
          'Weeks after hearing God’s voice directly and swearing covenant loyalty, the people build an idol from their own jewelry and credit it with the Exodus itself. Moses intercedes, and God reveals His character in Exodus 34:6-7 as "merciful and gracious... forgiving iniquity... but who will by no means clear the guilty" — holding mercy and justice together rather than picking one.',
        takeawayMessage:
          'The golden calf isn’t a story about ancient people being unusually foolish — it’s a story about how fast conviction can dissolve under pressure, and how a leader’s intercession can stand in the gap.',
      },
      {
        id: 'wild-ch3',
        chapterNumber: 3,
        title: 'One Bad Report, Forty Wasted Years',
        subtitle: 'Numbers 13-14 and the Cost of Unbelief',
        scriptureReference: 'Numbers 13:31-33, 14:1-4, 26-35',
        bibleText: '"We are not able to go up against the people, for they are stronger than we are... Would it not be better for us to go back to Egypt?"',
        narrativeExplanation:
          'Ten of twelve scouts saw the same land and the same evidence as Joshua and Caleb, yet chose fear-driven distortion over trust. The tragedy is structural: one generation’s refusal to trust God’s proven track record cost their children four decades of delay, even though the land itself never changed.',
        takeawayMessage:
          'The wilderness wasn’t a punishment for the destination — it was the direct, generational cost of a single night of collective unbelief.',
      },
    ],
    memoryVerse: {
      reference: 'Deuteronomy 6:4-5',
      text: '"Hear, O Israel: The LORD our God, the LORD is one. You shall love the LORD your God with all your heart and with all your soul and with all your might."',
      translation: 'ESV',
      blanks: ['Hear', 'LORD', 'one', 'heart'],
      theme: 'The Shema — Covenant Loyalty',
    },
    boss: {
      id: 'boss-wilderness',
      title: 'The Kadesh Barnea Verdict',
      bossName: 'Keeper of the Covenant Terms',
      bossEmoji: '🪨',
      description: 'Show you understand the covenant’s structure, the golden calf’s true weight, and why unbelief at Kadesh cost forty years.',
      requiredScore: 3,
      questions: [
        {
          id: 'wq-1',
          prompt: 'The Ten Commandments open with "I am the LORD your God, who brought you out of the land of Egypt" before giving a single command. Why does that opening matter?',
          options: [
            'It establishes that obedience is a response to a rescue already accomplished, not a transaction to earn one',
            'It is simply a historical footnote irrelevant to the commandments themselves',
            'It means the commandments only applied to the generation that left Egypt',
            'It proves the law was given before the Exodus happened',
          ],
          correctIndex: 0,
          explanation: 'This mirrors the standard structure of ancient treaties: history of what the greater king already did, followed by terms of loyalty. Grace precedes law, not the other way around.',
          conceptKey: 'covenant_grace_before_law',
        },
        {
          id: 'wq-2',
          prompt: 'The golden calf incident happens while Moses is still on the mountain, only weeks after Israel heard God speak the commandments directly. What makes this moment significant?',
          options: [
            'It shows how quickly conviction can collapse under uncertainty and social pressure, even after a direct encounter with God',
            'It proves the Ten Commandments were never actually given',
            'It shows Aaron alone was responsible and the people were blameless',
            'It demonstrates the people had never actually heard God speak',
          ],
          correctIndex: 0,
          explanation: 'The speed is the point — direct revelation didn’t immunize the people from fear-driven idolatry the moment their leader was out of sight for a few weeks.',
          conceptKey: 'golden_calf_speed_of_betrayal',
        },
        {
          id: 'wq-3',
          prompt: 'In Numbers 13, ten scouts and two scouts (Joshua and Caleb) examined the exact same land and evidence. What actually differed between their reports?',
          options: [
            'Their willingness to trust God’s track record versus their fear of what they observed',
            'The land itself was different for each group of scouts',
            'Only the ten scouts were allowed to see the fortified cities',
            'Joshua and Caleb never actually entered the land',
          ],
          correctIndex: 0,
          explanation: 'Same evidence, same land, opposite conclusions — the difference wasn’t information, it was whether they filtered it through fear or through what God had already proven at the Red Sea.',
          conceptKey: 'kadesh_barnea_unbelief',
        },
        {
          id: 'wq-4',
          prompt: 'What does Exodus 34:6-7 reveal by describing God as both "merciful and gracious... forgiving iniquity" and one "who will by no means clear the guilty"?',
          options: [
            'God’s character holds real mercy and real justice together rather than sacrificing one for the other',
            'The verse is contradictory and should be read as two separate, unrelated ideas',
            'It means God’s mercy has no limits under any circumstances',
            'It means God’s justice cancels out His mercy entirely',
          ],
          correctIndex: 0,
          explanation: 'Scripture consistently refuses to flatten God into either "only loving" or "only judging" — Exodus 34 states both attributes in a single breath as equally true.',
          conceptKey: 'divine_mercy_and_justice',
        },
      ],
      storyReconstruction: {
        prompt: 'Order the wilderness narrative’s actual sequence and consequence:',
        events: [
          'Israel hears the Ten Commandments directly and swears covenant loyalty at Sinai',
          'Within weeks, the same people build and worship a golden calf while Moses is still on the mountain',
          'Moses intercedes, and God reveals His character as both merciful and just',
          'A year later, unbelief at Kadesh Barnea costs an entire generation forty years in the wilderness',
        ],
        correctOrder: [0, 1, 2, 3],
      },
      reward: {
        xp: 410,
        coins: 170,
        gems: 5,
        badgeName: 'Covenant Verdict Keeper',
        badgeEmoji: '🪨',
        specialCollectible: {
          id: 'coll-teen-wilderness-tablet-shard',
          name: 'Shard of the Shattered Tablets',
          emoji: '🗿',
          description: 'A fragment from the first set of commandments, broken in anger at the base of the mountain.',
          rarity: 'epic',
          foundInRegion: 'wilderness',
        },
      },
    },
    secrets: [
      {
        id: 'sec-teen-wilderness-1',
        name: 'The Twelve Scouts’ Reports',
        hint: 'Compare the two minority reports against the ten majority reports side by side.',
        emoji: '🗺️',
        rewardCoins: 80,
        rewardGems: 2,
        discovered: false,
      },
    ],
    collectibles: [
      {
        id: 'coll-teen-wilderness-manna-jar',
        name: 'Preserved Jar of Manna',
        emoji: '🏺',
        description: 'Kept as a permanent reminder that provision came daily, not by stockpiling.',
        rarity: 'rare',
        foundInRegion: 'wilderness',
      },
    ],
  },

  // 6. JERUSALEM
  {
    id: 'jerusalem',
    name: 'The Kingdom: Covenant Throne, National Collapse, and a Teenage Reformer',
    tagline: 'A promise to David outlives every king who breaks it — including the ones who nearly bury the covenant for good.',
    icon: '🏛️',
    mapPosition: { x: 74, y: 44 },
    connectsTo: ['wilderness', 'gospels'],
    unlockRequirement: [{ type: 'region-complete', regionId: 'wilderness', minQuestsCompleted: 1 }],
    tone: 'ruby',
    scriptureRange: '2 Samuel 7 · 1 Kings 8 · 2 Kings 22-23 · Psalm 51',
    summary:
      'Trace the Davidic covenant from its unconditional promise, through Solomon’s temple and the kingdom’s long moral decline, to the sixteen-year-old king who found a forgotten scroll of the Law buried in his own temple and tore a nation’s idolatry down in response.',
    environmentDescription:
      'A hewn-stone throne room beneath a temple under long-deferred repair, dust-covered archive shelves where a scroll sat forgotten for generations, and torn-down altars smoking on hillsides outside the city walls.',
    chapters: [
      {
        id: 'jer-ch1',
        chapterNumber: 1,
        title: 'A Promise That Doesn’t Depend on David’s Kids Behaving',
        subtitle: '2 Samuel 7:12-16',
        scriptureReference: '2 Samuel 7:12-16',
        bibleText: '"I will raise up your offspring after you... and I will establish the throne of his kingdom forever... your house and your kingdom shall be made sure forever before me."',
        narrativeExplanation:
          'The Davidic covenant is unconditional in shape — individual kings face real discipline for real failure (2 Samuel 7:14), but the throne’s ultimate continuation is God’s own commitment, not contingent on a perfect dynasty. This becomes the theological backbone for later messianic hope, resting on God’s character rather than the reliability of the people receiving the promise.',
        takeawayMessage:
          'God’s biggest promises in Scripture tend to rest on His own character, not on the reliability of the people receiving them — which is exactly why the promise survives centuries of bad kings.',
      },
      {
        id: 'jer-ch2',
        chapterNumber: 2,
        title: 'How a Kingdom Rots From the Throne Down',
        subtitle: 'The Long Decline Before Josiah',
        scriptureReference: '2 Kings 21:1-9, 16',
        bibleText: 'Manasseh... did much evil in the sight of the LORD, provoking him to anger... Moreover, Manasseh shed very much innocent blood, till he had filled Jerusalem from one end to another.',
        narrativeExplanation:
          'From Solomon’s temple dedication through the kingdom’s split and generations of kings, national collapse in Scripture is rarely sudden. Manasseh’s 55-year reign of institutionalized idolatry and violence didn’t invent Judah’s problem — it inherited a slow drift and made it official policy, normalized until almost no one remembered what had been lost.',
        takeawayMessage:
          'Manasseh didn’t invent Judah’s idolatry in one reign — he inherited a slow drift and made it official policy; collapse this total is always built, not sudden.',
      },
      {
        id: 'jer-ch3',
        chapterNumber: 3,
        title: 'The Sixteen-Year-Old Who Found the Missing Book',
        subtitle: '2 Kings 22:1-13, 23:1-25',
        scriptureReference: '2 Kings 22:8-13',
        bibleText: '"I have found the Book of the Law in the house of the LORD."... And when the king heard the words of the Book of the Law, he tore his clothes.',
        narrativeExplanation:
          'Josiah became king at eight, began seeking God as a teenager, and by his twenties was overseeing temple repairs when workers found a forgotten copy of the Law — meaning an entire generation of leadership had been governing without functional access to God’s actual word. His response, grief followed by sweeping covenant renewal, models what real reform costs a leader who takes the text seriously.',
        takeawayMessage:
          'A teenager’s honest reaction to rediscovering forgotten Scripture triggered the last major reform Judah ever saw — reform this size doesn’t require rank, it requires actually reading and believing what’s already there.',
      },
    ],
    memoryVerse: {
      reference: '2 Kings 22:2',
      text: '"He did what was right in the eyes of the LORD, and walked in all the way of David his father, and he did not turn aside to the right or to the left."',
      translation: 'ESV',
      blanks: ['right', 'LORD', 'David', 'aside'],
      theme: 'Uncompromising Reform',
    },
    boss: {
      id: 'boss-jerusalem',
      title: 'The Covenant Throne Tribunal',
      bossName: 'Chronicler of the Kings',
      bossEmoji: '👑',
      description: 'Trace the Davidic covenant’s shape, the kingdom’s real decline, and what made Josiah’s reform historically significant.',
      requiredScore: 3,
      questions: [
        {
          id: 'jq-1',
          prompt: 'What makes the covenant God makes with David in 2 Samuel 7 different from a simple conditional contract?',
          options: [
            'The throne’s ultimate continuation rests on God’s own commitment, not on every individual king’s perfect obedience',
            'It requires David’s descendants to be flawless or the covenant is voided entirely',
            'It applies only to David personally and ends at his death',
            'It was later completely revoked and replaced',
          ],
          correctIndex: 0,
          explanation: 'Individual kings face real discipline for real failure (2 Sam 7:14), but the throne’s ultimate future is anchored in God’s own promise — which is why it survives centuries of imperfect and even wicked kings.',
          conceptKey: 'davidic_covenant_unconditional',
        },
        {
          id: 'jq-2',
          prompt: 'Manasseh reigned 55 years and is described as filling Jerusalem "from one end to another" with innocent blood and institutionalized idolatry. What does his reign suggest about how national collapse typically happens in Scripture?',
          options: [
            'It’s usually compounding and generational, not a single sudden failure',
            'It happens instantly, with no warning signs in prior generations',
            'It only ever happens because of external invasion, never internal choices',
            'Manasseh’s reign was actually one of Judah’s most faithful periods',
          ],
          correctIndex: 0,
          explanation: 'Manasseh inherited a slow drift from earlier kings and formalized it as policy — the scale of his reign’s evil reflects generations of accumulated neglect, not a single bad decision.',
          conceptKey: 'compounding_national_decline',
        },
        {
          id: 'jq-3',
          prompt: 'When the Book of the Law is discovered during Josiah’s temple repairs, what does this discovery reveal about the state of the kingdom before his reign?',
          options: [
            'An entire generation of leadership had been governing largely disconnected from the text of God’s actual covenant',
            'The Book of the Law had never existed until this moment',
            'The discovery was a minor, unimportant archival event',
            'Josiah already knew the contents of the book before it was found',
          ],
          correctIndex: 0,
          explanation: 'A forgotten copy of foundational Scripture sitting unused inside the temple itself is a striking picture of how far covenant knowledge had eroded by Josiah’s time.',
          conceptKey: 'lost_book_significance',
        },
        {
          id: 'jq-4',
          prompt: 'Josiah began "seeking the God of David his father" at age sixteen, years before the Book of the Law was even found. What does this timing suggest?',
          options: [
            'His personal reform began before, and prepared him for, the national reform that followed the discovery',
            'He only cared about reform after being forced to by the discovery',
            'His youth made him disqualified from meaningful leadership',
            'The discovery of the book had nothing to do with his existing convictions',
          ],
          correctIndex: 0,
          explanation: 'Josiah’s own seeking predates the discovery — the find didn’t create his convictions, it gave a leader who already wanted reform the textual authority to pursue it at national scale.',
          conceptKey: 'josiah_reform_timeline',
        },
      ],
      storyReconstruction: {
        prompt: 'Order the kingdom narrative’s actual arc:',
        events: [
          'God makes an unconditional covenant promise to David that His throne will endure',
          'A slow, generational drift into idolatry compounds until Manasseh makes it official state policy',
          'A forgotten copy of the Book of the Law is rediscovered during Josiah’s temple repairs',
          'Sixteen-year-old convictions plus a rediscovered text produce the last major covenant reform Judah ever sees',
        ],
        correctOrder: [0, 1, 2, 3],
      },
      reward: {
        xp: 420,
        coins: 175,
        gems: 5,
        badgeName: 'Chronicler of the Covenant Throne',
        badgeEmoji: '👑',
        specialCollectible: {
          id: 'coll-teen-jerusalem-scroll-seal',
          name: 'Wax-Sealed Law Scroll',
          emoji: '📜',
          description: 'A replica of the forgotten scroll rediscovered in the temple archives during Josiah’s repairs.',
          rarity: 'legendary',
          foundInRegion: 'jerusalem',
        },
      },
    },
    secrets: [
      {
        id: 'sec-teen-jerusalem-1',
        name: 'The Genealogy of Decline',
        hint: 'Trace the family line of kings from Solomon to Manasseh in the temple archive room.',
        emoji: '📚',
        rewardCoins: 85,
        rewardGems: 3,
        discovered: false,
      },
    ],
    collectibles: [
      {
        id: 'coll-teen-jerusalem-chisel',
        name: 'Altar-Breaking Chisel',
        emoji: '⛏️',
        description: 'A tool used in Josiah’s nationwide campaign to tear down idol altars.',
        rarity: 'rare',
        foundInRegion: 'jerusalem',
      },
    ],
  },

  // 7. GOSPELS
  {
    id: 'gospels',
    name: 'The Gospels: A Man Who Claimed to Be God, and the Morning That Tested the Claim',
    tagline: 'Every other part of the story only matters if the empty tomb is real.',
    icon: '✝️',
    mapPosition: { x: 86, y: 60 },
    connectsTo: ['jerusalem', 'early-church'],
    unlockRequirement: [{ type: 'region-complete', regionId: 'jerusalem', minQuestsCompleted: 1 }],
    tone: 'purple',
    scriptureRange: 'Matthew · Mark · Luke · John · 1 Corinthians 15',
    summary:
      'Build the case: examine what Jesus actually claimed about Himself (not just what later tradition said), then weigh the historical evidence for the resurrection the way a serious investigator would — against every alternative theory.',
    environmentDescription:
      'Galilean hillsides worn by crowds, a Sanhedrin chamber tense with a blasphemy charge, a Roman-sealed tomb, and an empty, folded grave cloth in first light.',
    chapters: [
      {
        id: 'gosp-ch1',
        chapterNumber: 1,
        title: 'The Claims That Got Him Killed',
        subtitle: 'John 8:58, Mark 14:61-64, and the Blasphemy Charge',
        scriptureReference: 'John 8:58 · Mark 14:61-64',
        bibleText: '"Truly, truly, I say to you, before Abraham was, I am."... The high priest asked him... "Are you the Christ, the Son of the Blessed?" And Jesus said, "I am..." And the high priest tore his garments and said, "What further witnesses do we need?"',
        narrativeExplanation:
          'Jesus wasn’t executed for being a nice moral teacher — He was executed for a specific, verifiable claim: applying the divine name ("I AM," echoing Exodus 3:14) to Himself, and forgiving sins directly, which the religious leaders explicitly identified as blasphemy worthy of death. C.S. Lewis’s "trilemma" (liar, lunatic, or Lord) is one way — not the only way — to take these claims seriously rather than dismissing them as later legend.',
        takeawayMessage:
          'The cross wasn’t a tragic misunderstanding about a gentle teacher — it was the direct legal consequence of a specific claim to divine identity that His own listeners understood perfectly.',
      },
      {
        id: 'gosp-ch2',
        chapterNumber: 2,
        title: 'Building the Case for the Empty Tomb',
        subtitle: 'The Historical Evidence, Weighed Fairly',
        scriptureReference: 'Matthew 27:62-66 · John 20:1-9 · 1 Corinthians 15:3-8',
        bibleText: '"He is not here, for he has risen, as he said. Come, see the place where he lay."... he saw the linen cloths lying there, and the face cloth... folded up in a place by itself.',
        narrativeExplanation:
          'Weigh the evidence like a case file: the Roman guard and broken seal (a capital offense to tamper with), women as the first witnesses (culturally low-credibility testimony, an odd detail to invent), the undisturbed grave cloths (inconsistent with a hurried theft), and Paul’s early creed in 1 Corinthians 15 naming over 500 living eyewitnesses within roughly two decades of the event, when many could still be questioned. Weigh this against the leading alternative theories — theft, wrong tomb, hallucination, legend — and their specific weaknesses.',
        takeawayMessage:
          'You don’t have to suspend critical thinking to take the resurrection seriously — the specific, checkable details in the earliest accounts are exactly what a fabricated legend usually doesn’t include.',
      },
      {
        id: 'gosp-ch3',
        chapterNumber: 3,
        title: 'What Changed the Cowards',
        subtitle: 'The Transformed Disciples as Historical Evidence',
        scriptureReference: 'Acts 4:13, 20 · 1 Corinthians 15:6-8',
        bibleText: '"We cannot but speak of what we have seen and heard."',
        narrativeExplanation:
          'The same disciples who scattered in fear at Jesus’ arrest and denied even knowing Him were, within weeks, publicly proclaiming His resurrection at personal risk — most were eventually martyred for refusing to recant. People will die for what they sincerely believe is true, but rarely for what they know they invented, especially when recanting would have ended the danger instantly.',
        takeawayMessage:
          'Explaining the resurrection away has to also explain why terrified, scattered men became willing to die rather than admit they made it up — and no theory does that as well as the simplest one: it happened.',
      },
    ],
    memoryVerse: {
      reference: '1 Corinthians 15:3-4',
      text: '"Christ died for our sins in accordance with the Scriptures, that he was buried, that he was raised on the third day in accordance with the Scriptures."',
      translation: 'ESV',
      blanks: ['died', 'sins', 'buried', 'raised'],
      theme: 'The Historical Core of the Gospel',
    },
    boss: {
      id: 'boss-gospels',
      title: 'The Resurrection Case File',
      bossName: 'The Cross-Examiner',
      bossEmoji: '⚖️',
      description: 'Weigh the historical evidence for the resurrection like an investigator, not just a believer repeating a claim.',
      requiredScore: 4,
      questions: [
        {
          id: 'gq-1',
          prompt: 'When the Sanhedrin condemned Jesus for blasphemy in Mark 14:61-64, what specific claim triggered the charge?',
          options: [
            'His direct claim to divine identity, echoing God’s own name from Exodus 3:14',
            'His teaching that people should love their neighbors',
            'His criticism of Roman taxation',
            'His claim to be a prophet like the earlier prophets',
          ],
          correctIndex: 0,
          explanation: 'Calling Himself "I AM" and affirming He was "the Son of the Blessed" invoked language reserved for God alone — that specific claim, not general moral teaching, is what the high priest called blasphemy.',
          conceptKey: 'blasphemy_charge_basis',
        },
        {
          id: 'gq-2',
          prompt: 'Why is the detail of women as the first resurrection witnesses (Luke 24:1-10) considered significant historical evidence rather than a weakness?',
          options: [
            'In that culture, women’s testimony carried little legal weight, making them an unlikely choice for a fabricated story',
            'Women were considered the most credible witnesses in first-century courts',
            'The detail was added centuries later and carries no historical weight',
            'All four Gospels omit this detail entirely',
          ],
          correctIndex: 0,
          explanation: 'A story invented to be convincing would likely have used higher-status male witnesses. Including a detail that actually worked against the story’s credibility suggests the writers were reporting what happened, not crafting persuasive fiction.',
          conceptKey: 'women_witnesses_criterion_of_embarrassment',
        },
        {
          id: 'gq-3',
          prompt: '1 Corinthians 15:3-8 is widely dated by scholars, including skeptical ones, as an extremely early creed, possibly within a few years of the crucifixion. Why does this early dating matter?',
          options: [
            'It leaves very little time for the story to have evolved into legend before eyewitnesses who could contradict it were still alive',
            'It proves the letter was written after all the eyewitnesses had died',
            'It has no bearing on the reliability of the account',
            'It means the creed was written by someone who never met any of the apostles',
          ],
          correctIndex: 0,
          explanation: 'Legendary development theories typically require decades to generations; a creed this early, naming still-living named witnesses, sharply narrows the window in which a myth could have formed unchallenged.',
          conceptKey: 'early_creed_dating',
        },
        {
          id: 'gq-4',
          prompt: 'What is the strongest weakness of the "the disciples stole the body and lied" theory, historically speaking?',
          options: [
            'It fails to explain why people would maintain a lie under severe persecution and even death rather than simply recanting',
            'There is no evidence a Roman guard was ever posted at the tomb',
            'The theory perfectly explains the folded grave clothes',
            'It is the theory the Gospel writers themselves proposed',
          ],
          correctIndex: 0,
          explanation: 'Recanting would have ended the danger instantly and cost nothing. People do sometimes die for false beliefs they sincerely hold — but a conspirator dying to protect a lie he personally fabricated, with an easy exit available, is a much harder case to explain.',
          conceptKey: 'martyrdom_argument',
        },
        {
          id: 'gq-5',
          prompt: 'What does the "trilemma" (liar, lunatic, or Lord) framework attempt to do with Jesus’ own claims about Himself?',
          options: [
            'Argue that dismissing Jesus as merely a great moral teacher isn’t actually available once His specific divine claims are taken seriously',
            'Prove the resurrection happened through logic alone with no historical evidence needed',
            'Suggest all three options are equally likely with no way to decide between them',
            'Argue that Jesus never actually made any claims about His own identity',
          ],
          correctIndex: 0,
          explanation: 'The framework’s point isn’t to force belief — it’s to close off the common middle position ("great teacher, nothing more") once you take seriously that this teacher explicitly claimed to be God.',
          conceptKey: 'trilemma_argument',
        },
      ],
      storyReconstruction: {
        prompt: 'Order the historical case as it actually unfolds:',
        events: [
          'Jesus makes explicit, specific claims to divine identity that His own listeners recognize as blasphemy',
          'He is executed by Rome under a sealed, guarded tomb — not quietly, but publicly and officially',
          'Early, oddly-detailed testimony, including low-status women as first witnesses, reports the tomb empty',
          'Previously terrified disciples become willing to die rather than recant what they claim to have witnessed',
        ],
        correctOrder: [0, 1, 2, 3],
      },
      reward: {
        xp: 700,
        coins: 280,
        gems: 8,
        badgeName: 'Resurrection Case Investigator',
        badgeEmoji: '⚖️',
        specialCollectible: {
          id: 'coll-teen-gospels-case-file',
          name: 'Sealed Case File: The Empty Tomb',
          emoji: '🗂️',
          description: 'A complete dossier of manuscript, testimonial, and circumstantial evidence for the resurrection.',
          rarity: 'legendary',
          foundInRegion: 'gospels',
        },
      },
    },
    secrets: [
      {
        id: 'sec-teen-gospels-1',
        name: 'The Alternative Theories Drawer',
        hint: 'Search the investigator’s desk for a folder ruling out theft, hallucination, and wrong-tomb theories one by one.',
        emoji: '🗃️',
        rewardCoins: 110,
        rewardGems: 3,
        discovered: false,
      },
    ],
    collectibles: [
      {
        id: 'coll-teen-gospels-seal-fragment',
        name: 'Broken Roman Seal Fragment',
        emoji: '🔏',
        description: 'Evidence that breaking this seal was a capital crime — no casual grave robber’s risk.',
        rarity: 'epic',
        foundInRegion: 'gospels',
      },
    ],
  },

  // 8. EARLY CHURCH
  {
    id: 'early-church',
    name: 'Acts: An Illegal Religion That Outlasted the Empire That Banned It',
    tagline: 'No political power, no army, no printing press — and it reshaped the ancient world anyway.',
    icon: '🕊️',
    mapPosition: { x: 94, y: 32 },
    connectsTo: ['gospels'],
    unlockRequirement: [
      { type: 'region-complete', regionId: 'gospels', minQuestsCompleted: 1 },
      { type: 'level', minLevel: 3 },
    ],
    tone: 'navy',
    scriptureRange: 'Acts 2, 9, 15 · Romans 8 · 1 Peter 3:15',
    summary:
      'Trace how a persecuted, powerless minority movement navigated its first major theological crisis at the Jerusalem Council, survived empire-wide hostility, and left behind a pattern for bold, reasoned witness that still applies to defending your convictions among friends who don’t share them.',
    environmentDescription:
      'A wind-swept upper room still charged with Pentecost’s aftermath, a contentious council chamber debating who belongs in the new covenant, and Roman roads worn smooth by missionaries who kept walking despite arrest records ahead of them.',
    chapters: [
      {
        id: 'ec-ch1',
        chapterNumber: 1,
        title: 'Pentecost Wasn’t Just a Miracle Show',
        subtitle: 'Acts 2:1-41 and the Reversal of Babel',
        scriptureReference: 'Acts 2:4-11',
        bibleText: '"And they were all filled with the Holy Spirit and began to speak in other tongues... Parthians and Medes and Elamites and residents of Mesopotamia... we hear them telling in our own tongues the mighty works of God."',
        narrativeExplanation:
          'Pentecost’s multi-language miracle connects directly to Genesis 11’s Babel narrative, where humanity’s languages were confused as judgment. Pentecost begins reversing that fracture, uniting radically different nations around a single message rather than a single empire’s language — the founding moment of a movement built to cross every cultural line rather than stay inside one.',
        takeawayMessage:
          'Pentecost isn’t just a special effect — it’s a deliberate signal that this movement was never meant to belong to one culture, language, or nation.',
      },
      {
        id: 'ec-ch2',
        chapterNumber: 2,
        title: 'The Council That Decided Who Belonged',
        subtitle: 'Acts 15 and the Church’s First Major Crisis',
        scriptureReference: 'Acts 15:1-2, 6-11',
        bibleText: '"Unless you are circumcised according to the custom of Moses, you cannot be saved."... "Why are you putting God to the test by placing a yoke on the neck of the disciples... we believe that we will be saved through the grace of the Lord Jesus, just as they will."',
        narrativeExplanation:
          'The early church nearly split over whether Gentile converts had to first become culturally Jewish before they could be fully included. The Jerusalem Council’s resolution — grace received by faith, not earned by cultural conformity — became the theological foundation that kept the movement from fracturing into an ethnic sect.',
        takeawayMessage:
          'The first major theological fight in church history wasn’t about doctrine in the abstract — it was about who gets a seat at the table, and grace won.',
      },
      {
        id: 'ec-ch3',
        chapterNumber: 3,
        title: 'Ready with an Answer, Not a Script',
        subtitle: '1 Peter 3:15 and What Bold Witness Actually Looks Like',
        scriptureReference: '1 Peter 3:15',
        bibleText: '"...always being prepared to make a defense to anyone who asks you for a reason for the hope that is in you; yet do it with gentleness and respect."',
        narrativeExplanation:
          'This instruction assumes believers will actually be asked hard questions, and calls for a prepared, reasoned answer delivered with respect — not aggression, not silence, not a scripted response disconnected from the actual question being asked. Paul’s own method at Athens’ Areopagus (Acts 17) engages pagan philosophy on its own terms rather than dismissing it outright.',
        takeawayMessage:
          'Being ready to explain what you believe, and why, with actual respect for the person asking — that’s the model, not either silence or a rehearsed script.',
      },
    ],
    memoryVerse: {
      reference: '1 Peter 3:15',
      text: '"...always being prepared to make a defense to anyone who asks you for a reason for the hope that is in you; yet do it with gentleness and respect."',
      translation: 'ESV',
      blanks: ['prepared', 'defense', 'hope', 'respect'],
      theme: 'Reasoned, Respectful Witness',
    },
    boss: {
      id: 'boss-early-church',
      title: 'The Jerusalem Council Tribunal',
      bossName: 'Keeper of the Apostolic Witness',
      bossEmoji: '🕊️',
      description: 'Show you understand Pentecost’s significance, the Jerusalem Council’s stakes, and what genuine bold witness requires.',
      requiredScore: 3,
      questions: [
        {
          id: 'ecq-1',
          prompt: 'Pentecost’s multi-language miracle in Acts 2 deliberately echoes and reverses which earlier Genesis narrative?',
          options: [
            'The Tower of Babel, where languages were confused as judgment',
            'The Garden of Eden’s expulsion',
            'The flood narrative',
            'Cain and Abel’s conflict',
          ],
          correctIndex: 0,
          explanation: 'Babel scattered humanity through confused language as judgment for prideful unity against God; Pentecost begins uniting radically different nations around one message, in their own languages, as an intentional reversal.',
          conceptKey: 'pentecost_babel_reversal',
        },
        {
          id: 'ecq-2',
          prompt: 'At the Jerusalem Council in Acts 15, what specific question was actually being decided?',
          options: [
            'Whether Gentile converts had to adopt Jewish cultural and ceremonial requirements to be fully included as believers',
            'Whether Jesus had actually risen from the dead',
            'Whether the apostles should continue preaching at all',
            'Whether Rome would legalize Christianity',
          ],
          correctIndex: 0,
          explanation: 'The debate centered on circumcision and law-keeping as a requirement for Gentile inclusion — essentially, whether grace alone was sufficient, or cultural conformity had to come first.',
          conceptKey: 'jerusalem_council_stakes',
        },
        {
          id: 'ecq-3',
          prompt: 'The Council concludes that Gentiles "will be saved through the grace of the Lord Jesus, just as they will" — referring to Jewish believers too. What is significant about that phrasing?',
          options: [
            'It places both Jewish and Gentile believers on identical footing — saved by grace, not by either group’s cultural practice',
            'It means Jewish believers no longer needed grace at all',
            'It excludes Jewish believers from the same salvation',
            'It has no bearing on the Gentile question being debated',
          ],
          correctIndex: 0,
          explanation: 'By reversing the expected order — "we [Jews] will be saved just as they [Gentiles] will," not the other way around — Peter levels the theological ground entirely on grace, not heritage.',
          conceptKey: 'grace_over_cultural_conformity',
        },
        {
          id: 'ecq-4',
          prompt: '1 Peter 3:15 instructs believers to be ready "to make a defense... with gentleness and respect." What does this rule out as a model for sharing your convictions?',
          options: [
            'Both defensive aggression toward questioners and silent avoidance of hard questions',
            'Only aggression, while silence remains an acceptable response',
            'Only silence, while aggression remains an acceptable response',
            'Any use of reasoned argument at all',
          ],
          correctIndex: 0,
          explanation: 'The verse assumes real preparation and real reasoning ("a defense," "a reason") delivered with real respect — it rules out both the harsh-debate approach and the silent-avoidance approach as faithful models.',
          conceptKey: 'reasoned_respectful_witness',
        },
      ],
      storyReconstruction: {
        prompt: 'Order the early church’s foundational arc:',
        events: [
          'Pentecost reverses Babel, launching a movement built to cross cultural and language lines from day one',
          'Rapid growth forces a crisis: must Gentile converts adopt Jewish cultural law to belong?',
          'The Jerusalem Council rules that grace, not cultural conformity, is what unites every believer',
          'The apostles model reasoned, respectful public witness as the pattern for defending that faith going forward',
        ],
        correctOrder: [0, 1, 2, 3],
      },
      reward: {
        xp: 780,
        coins: 320,
        gems: 9,
        badgeName: 'Keeper of the Apostolic Witness',
        badgeEmoji: '🕊️',
        specialCollectible: {
          id: 'coll-teen-ec-council-decree',
          name: 'Jerusalem Council Decree',
          emoji: '📯',
          description: 'A copy of the letter that settled the early church’s first major theological crisis.',
          rarity: 'legendary',
          foundInRegion: 'early-church',
        },
      },
    },
    secrets: [
      {
        id: 'sec-teen-ec-1',
        name: 'The Areopagus Notes',
        hint: 'Search the Roman road records for Paul’s speech notes at the Athens philosophers’ council.',
        emoji: '🏛️',
        rewardCoins: 120,
        rewardGems: 3,
        discovered: false,
      },
    ],
    collectibles: [
      {
        id: 'coll-teen-ec-missionary-map',
        name: 'Paul’s Missionary Route Map',
        emoji: '🗺️',
        description: 'A worn map tracking thousands of miles walked to deliver one message across the empire.',
        rarity: 'epic',
        foundInRegion: 'early-church',
      },
    ],
  },
];

export const teenAdventureQuests: AdventureQuest[] = [
  {
    id: 'quest-creation-1',
    moduleId: 'teen-apologetics',
    regionId: 'creation',
    order: 1,
    difficulty: 3,
    icon: '🌌',
    linkedArcadeGame: {
      href: '/arcade/bible-detective',
      title: 'Genesis vs. Babylon: Manuscript Case File',
      gameType: 'detective',
    },
    reward: {
      xp: 100,
      coins: 45,
      collectible: {
        id: 'coll-teen-quest-creation',
        name: 'Manuscript Comparison Chart',
        emoji: '🧾',
        description: 'A side-by-side chart proving Genesis 1 was written to confront rival origin myths.',
        rarity: 'common',
        foundInRegion: 'creation',
      },
    },
    unlockRequirement: [{ type: 'always' }],
  },
  {
    id: 'quest-eden-1',
    moduleId: 'teen-identity-culture',
    regionId: 'eden',
    order: 1,
    difficulty: 3,
    icon: '🌿',
    linkedArcadeGame: {
      href: '/arcade/bible-detective',
      title: 'Cross-Examining the Serpent’s Logic',
      gameType: 'detective',
    },
    reward: {
      xp: 110,
      coins: 48,
      collectible: {
        id: 'coll-teen-quest-eden',
        name: 'Rhetorical Trap Diagram',
        emoji: '🕸️',
        description: 'A diagram tracing exactly how the serpent’s question distorted God’s actual command.',
        rarity: 'common',
        foundInRegion: 'eden',
      },
    },
    unlockRequirement: [{ type: 'region-complete', regionId: 'creation', minQuestsCompleted: 1 }],
  },
  {
    id: 'quest-noah-1',
    moduleId: 'teen-fiery-furnace',
    regionId: 'noah',
    order: 1,
    difficulty: 4,
    icon: '⚓',
    linkedArcadeGame: {
      href: '/arcade/lightning-quiz',
      title: 'A Century of Unpopular Obedience',
      gameType: 'quiz',
    },
    reward: {
      xp: 125,
      coins: 52,
      collectible: {
        id: 'coll-teen-quest-noah',
        name: 'Mockers’ Chant Transcript',
        emoji: '📝',
        description: 'A record of a century’s worth of public ridicule Noah endured without ever stopping construction.',
        rarity: 'common',
        foundInRegion: 'noah',
      },
    },
    unlockRequirement: [{ type: 'region-complete', regionId: 'eden', minQuestsCompleted: 1 }],
  },
  {
    id: 'quest-egypt-1',
    moduleId: 'teen-future-purpose',
    regionId: 'egypt',
    order: 1,
    difficulty: 4,
    icon: '🏺',
    linkedArcadeGame: {
      href: '/arcade/lightning-quiz',
      title: 'The Plagues: God by God',
      gameType: 'quiz',
    },
    reward: {
      xp: 135,
      coins: 56,
      collectible: {
        id: 'coll-teen-quest-egypt',
        name: 'Egyptian Deity Cross-Reference',
        emoji: '📑',
        description: 'A cross-reference matching each plague to the specific Egyptian god it confronted.',
        rarity: 'rare',
        foundInRegion: 'egypt',
      },
    },
    unlockRequirement: [{ type: 'region-complete', regionId: 'noah', minQuestsCompleted: 1 }],
  },
  {
    id: 'quest-wilderness-1',
    moduleId: 'teen-romans-eight',
    regionId: 'wilderness',
    order: 1,
    difficulty: 4,
    icon: '🏕️',
    linkedArcadeGame: {
      href: '/arcade/verse-builder',
      title: 'Covenant Terms: The Sinai Treaty Structure',
      gameType: 'verse',
    },
    reward: {
      xp: 140,
      coins: 58,
      collectible: {
        id: 'coll-teen-quest-wilderness',
        name: 'Suzerain Treaty Comparison',
        emoji: '📃',
        description: 'A comparison of the Sinai covenant’s structure against known Ancient Near Eastern treaties.',
        rarity: 'rare',
        foundInRegion: 'wilderness',
      },
    },
    unlockRequirement: [{ type: 'region-complete', regionId: 'egypt', minQuestsCompleted: 1 }],
  },
  {
    id: 'quest-jerusalem-1',
    moduleId: 'teen-josiah',
    regionId: 'jerusalem',
    order: 1,
    difficulty: 4,
    icon: '🏛️',
    linkedArcadeGame: {
      href: '/arcade/bible-detective',
      title: 'The Forgotten Scroll Investigation',
      gameType: 'detective',
    },
    reward: {
      xp: 150,
      coins: 62,
      collectible: {
        id: 'coll-teen-quest-jerusalem',
        name: 'Royal Genealogy Chart',
        emoji: '📊',
        description: 'A chart tracing the kings from Solomon’s temple dedication to Josiah’s reform.',
        rarity: 'rare',
        foundInRegion: 'jerusalem',
      },
    },
    unlockRequirement: [{ type: 'region-complete', regionId: 'wilderness', minQuestsCompleted: 1 }],
  },
  {
    id: 'quest-gospels-1',
    moduleId: 'teen-resurrection',
    regionId: 'gospels',
    order: 1,
    difficulty: 5,
    icon: '✝️',
    linkedArcadeGame: {
      href: '/arcade/bible-detective',
      title: 'The Empty Tomb: Full Case File',
      gameType: 'detective',
    },
    reward: {
      xp: 170,
      coins: 70,
      collectible: {
        id: 'coll-teen-quest-gospels',
        name: 'Eyewitness Testimony Ledger',
        emoji: '📇',
        description: 'A ledger cross-referencing over 500 claimed eyewitnesses named in Paul’s early creed.',
        rarity: 'epic',
        foundInRegion: 'gospels',
      },
    },
    unlockRequirement: [{ type: 'region-complete', regionId: 'jerusalem', minQuestsCompleted: 1 }],
  },
  {
    id: 'quest-early-church-1',
    moduleId: 'teen-evangelism-witness',
    regionId: 'early-church',
    order: 1,
    difficulty: 5,
    icon: '🕊️',
    linkedArcadeGame: {
      href: '/arcade/lightning-quiz',
      title: 'Ready with an Answer: The Apologetics Drill',
      gameType: 'quiz',
    },
    reward: {
      xp: 190,
      coins: 78,
      collectible: {
        id: 'coll-teen-quest-ec',
        name: 'Areopagus Speech Draft',
        emoji: '🖋️',
        description: 'A working draft of a reasoned, respectful defense of the faith, modeled on Paul’s approach at Athens.',
        rarity: 'epic',
        foundInRegion: 'early-church',
      },
    },
    unlockRequirement: [{ type: 'region-complete', regionId: 'gospels', minQuestsCompleted: 1 }],
  },
];
