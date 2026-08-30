import { curriculumModules, type CurriculumModule } from './curriculum-data';

export type ModuleSubLesson = {
  title: string;
  type: 'choice' | 'reflect';
  minutes: number;
  eyebrow: string;
  intro: string;
  reference: string;
  scriptureText: string;
  scriptureInsight?: string;
  prompt: string;
  hint: string;
  options?: string[];
  answer?: string;
};

// ── HAND-CRAFTED SUB-LESSON SETS ──────────────────────────────────
// One flagship module per age track, broken into a real step-by-step
// sequence (e.g. Creation day-by-day) instead of one flat activity.
const handAuthoredLessons: Record<string, ModuleSubLesson[]> = {
  // ── Lantern Explorers flagship: God Made the Big Beautiful World ──
  'early-creation': [
    {
      title: 'God Makes Light and the Sky',
      type: 'choice',
      minutes: 4,
      eyebrow: 'Creation · Day 1 & 2',
      intro: 'At the very start, everything was dark and empty. Then God spoke — and the world began to change!',
      reference: 'Genesis 1:3–8',
      scriptureText: 'God said, "Let there be light," and there was light. God saw the light, and saw that it was good. God divided the light from the darkness. God called the light "day," and the darkness he called "night."\n\nGod said, "Let there be an expanse in the middle of the waters, and let it divide the waters from the waters." ... God called the expanse "sky."',
      scriptureInsight: 'With just His voice, God turned darkness into day and stretched out the wide open sky above us.',
      prompt: 'What did God make with just His words on the very first day?',
      hint: 'God spoke one simple word, and it appeared.',
      options: ['Light', 'A birthday cake', 'A big red car'],
      answer: 'Light',
    },
    {
      title: 'God Makes the Land and the Sea',
      type: 'choice',
      minutes: 4,
      eyebrow: 'Creation · Day 3',
      intro: 'Next, God gathered all the water together so that dry land could appear — and then He filled it with plants, flowers, and trees!',
      reference: 'Genesis 1:9–13',
      scriptureText: 'God said, "Let the waters under the sky be gathered together to one place, and let the dry land appear;" and it was so... God called the dry land "earth," and the gathering together of the waters he called "seas." God saw that it was good.\n\nGod said, "Let the earth yield grass, herbs yielding seed, and fruit trees making fruit after their kind." ... God saw that it was good.',
      scriptureInsight: 'God separated the sea from the land and grew the very first plants, flowers, and fruit trees.',
      prompt: 'What grew on the land after God made the seas?',
      hint: 'Think of grass, flowers, and fruit trees.',
      options: ['Plants and trees', 'Toy blocks', 'Tall buildings'],
      answer: 'Plants and trees',
    },
    {
      title: 'God Makes the Animals',
      type: 'choice',
      minutes: 4,
      eyebrow: 'Creation · Day 4–6',
      intro: 'God hung the sun, moon, and twinkly stars up in the sky like lanterns. Then He filled the seas with fish, the sky with birds, and the land with every kind of animal!',
      reference: 'Genesis 1:20–25',
      scriptureText: 'God said, "Let the waters swarm with swarms of living creatures, and let birds fly above the earth in the open expanse of sky." ... God said, "Let the earth produce living creatures after their kind, livestock, creeping things, and animals of the earth after their kind;" and it was so. God saw that it was good.',
      scriptureInsight: 'God filled the water, sky, and land with every kind of wonderful living creature.',
      prompt: 'Where did God put the fish, and where did God put the birds?',
      hint: 'One kind lives in the water, one kind flies above.',
      options: ['Fish in the sea, birds in the sky', 'Fish in the sky, birds in the sea', 'Both stayed in a little box'],
      answer: 'Fish in the sea, birds in the sky',
    },
    {
      title: 'God Makes Adam and Eve and Says "Very Good!"',
      type: 'choice',
      minutes: 4,
      eyebrow: 'Creation · Day 6 & 7',
      intro: 'Last of all, God made a man and a woman to look like Him and love Him. Then God looked at everything He had made and said it was very good — and He rested.',
      reference: 'Genesis 1:26–31, 2:1–3',
      scriptureText: 'God said, "Let us make man in our image, after our likeness"... God created man in his own image. In God\'s image he created him; male and female he created them.\n\nGod saw everything that he had made, and, behold, it was very good... On the seventh day God rested from all his work.',
      scriptureInsight: 'You are made in God’s own image, and He was so happy with everything He made — including you.',
      prompt: 'Who did God make to look like Him, at the very end?',
      hint: 'The last, and most special, thing God made.',
      options: ['People — like you and me!', 'Only the animals', 'Only the stars'],
      answer: 'People — like you and me!',
    },
  ],

  // ── Brave Pathfinders flagship: Moses & The Great Exodus ──
  'path-exodus': [
    {
      title: 'Moses at the Burning Bush',
      type: 'choice',
      minutes: 6,
      eyebrow: 'Exodus · The Calling',
      intro: 'While tending sheep in the desert, Moses saw a bush burning with fire that never burned up — and heard God call his name.',
      reference: 'Exodus 3:1–14',
      scriptureText: 'The angel of Yahweh appeared to him in a flame of fire out of the middle of a bush. He looked, and behold, the bush burned with fire, and the bush was not consumed.\n\nGod called to him out of the middle of the bush, and said, "Moses! Moses!"\n\nHe said, "Here I am."\n\nGod said, "Don\'t come any closer. Take off your sandals, for the place you are standing on is holy ground... I have surely seen the affliction of my people... I AM WHO I AM."',
      scriptureInsight: 'God meets Moses in an ordinary pasture and reveals His holy name and caring heart for those who suffer.',
      prompt: 'What name did God give Moses when He sent him to free Israel?',
      hint: 'God declared His eternal, unchanging presence.',
      options: ['I AM WHO I AM', 'The Far Away Master', 'The Secret King'],
      answer: 'I AM WHO I AM',
    },
    {
      title: 'Ten Signs of God’s Power',
      type: 'choice',
      minutes: 6,
      eyebrow: 'Exodus · Confronting Pharaoh',
      intro: 'Pharaoh refused again and again to let God’s people go free, so God sent ten unmistakable signs to show that He alone is Lord — even over the most powerful king in the world.',
      reference: 'Exodus 11:1, 12:29–32',
      scriptureText: 'Yahweh said to Moses, "I will bring yet one plague more on Pharaoh, and on Egypt; afterwards he will let you go."\n\n...Pharaoh called for Moses and Aaron by night, and said, "Rise up, get out from among my people... Go, serve Yahweh, as you have said."',
      scriptureInsight: 'Every sign was a direct challenge to a false Egyptian god, proving there is only one true God who keeps His promises.',
      prompt: 'Why did God send the ten signs to Egypt?',
      hint: 'Pharaoh kept refusing to obey God’s command.',
      options: ['To prove He alone is God and free His people', 'To punish Moses for arguing', 'Just to test the weather'],
      answer: 'To prove He alone is God and free His people',
    },
    {
      title: 'The Pillar of Cloud by Day',
      type: 'choice',
      minutes: 5,
      eyebrow: 'Exodus · Guided in the Wilderness',
      intro: 'As millions of freed people walked into the unknown desert, God did not leave them to find their own way — He led them Himself, visible day and night.',
      reference: 'Exodus 13:21–22',
      scriptureText: 'Yahweh went before them by day in a pillar of cloud, to lead them on their way, and by night in a pillar of fire, to give them light, that they might go by day and by night: the pillar of cloud by day, and the pillar of fire by night, didn\'t depart from before the people.',
      scriptureInsight: 'God’s guidance was constant and visible — He never once left His people to wander alone.',
      prompt: 'How did God lead His people through the wilderness, day and night?',
      hint: 'One form for daytime, one form for nighttime — both never left.',
      options: ['A pillar of cloud by day, fire by night', 'A paper map', 'They had to guess the way'],
      answer: 'A pillar of cloud by day, fire by night',
    },
    {
      title: 'The Song of Deliverance',
      type: 'choice',
      minutes: 6,
      eyebrow: 'Exodus · Through the Red Sea',
      intro: 'Trapped between Pharaoh’s army and the deep sea, the people watched God part the waters — and then they sang.',
      reference: 'Exodus 14:21–22, 15:1–2',
      scriptureText: 'Moses stretched out his hand over the sea, and Yahweh caused the sea to go back by a strong east wind all night, and made the sea dry land, and the waters were divided. The children of Israel went into the middle of the sea on dry ground.\n\nThen Moses and the children of Israel sang this song to Yahweh: "I will sing to Yahweh, for he has triumphed gloriously... Yahweh is my strength and song. He has become my salvation."',
      scriptureInsight: 'When there seemed to be no way forward, God made a path through the impossible — and His people responded with worship.',
      prompt: 'What did the people do right after God saved them at the Red Sea?',
      hint: 'They responded to the miracle with joy and worship.',
      options: ['They sang a song of praise to God', 'They went straight back to sleep', 'They argued about what to do next'],
      answer: 'They sang a song of praise to God',
    },
  ],

  // ── The Lion's Den flagship: Shadrach, Meshach & Abednego ──
  'teen-fiery-furnace': [
    {
      title: 'When the Entire Crowd Bows',
      type: 'reflect',
      minutes: 7,
      eyebrow: 'Daniel 3 · The Pressure',
      intro: 'King Nebuchadnezzar built a ninety-foot golden statue and commanded every official in the empire to fall down and worship it the moment the music played. Three young men — far from home, with everything to lose — stayed standing.',
      reference: 'Daniel 3:1–12',
      scriptureText: 'The herald cried aloud, "To you it is commanded, peoples, nations, and languages, that at what time you hear the sound of the horn, flute, zither, lyre, harp, pipe, and all kinds of music, you fall down and worship the golden image... whoever doesn\'t fall down and worship shall the same hour be cast into the middle of a burning fiery furnace."\n\nCertain Chaldeans came near, and accused the Jews... "There are certain Jews... These men, O king, have not respected you. They don\'t serve your gods, nor worship the golden image which you have set up."',
      scriptureInsight: 'Peer pressure at this scale — an entire empire bowing at once — is exactly the kind of pressure that makes standing alone feel impossible, and exactly the kind of pressure God calls us to stand firm through anyway.',
      prompt: 'Think of a moment where "everyone else" was doing something you knew was wrong. What made it hard to be the one who didn’t go along?',
      hint: 'Be honest about the social cost — the discomfort, the risk of standing out — not just the "right answer."',
    },
    {
      title: '"Even If He Does Not" — Absolute Trust',
      type: 'reflect',
      minutes: 7,
      eyebrow: 'Daniel 3 · Unconditional Faith',
      intro: 'Facing execution, Shadrach, Meshach, and Abednego didn’t promise God would save them. They promised to obey Him either way.',
      reference: 'Daniel 3:16–18',
      scriptureText: 'Shadrach, Meshach, and Abednego answered the king, "Nebuchadnezzar, we have no need to answer you in this matter. If it happens, our God whom we serve is able to deliver us from the burning fiery furnace, and he will deliver us out of your hand, O king. But if not, be it known to you, O king, that we will not serve your gods, nor worship the golden image which you have set up."',
      scriptureInsight: 'This is faith that doesn’t depend on the outcome — they committed to obedience before knowing whether they’d survive it.',
      prompt: 'What is one conviction you’d hold to even if things didn’t work out the way you hoped? Why does that matter to you?',
      hint: '"Even if He does not" is faith that isn’t a bargain — it doesn’t require God to answer a certain way to still be trusted.',
    },
    {
      title: 'The Fourth Figure in the Fire',
      type: 'choice',
      minutes: 6,
      eyebrow: 'Daniel 3 · Not Alone in the Furnace',
      intro: 'The king threw them into a furnace so hot it killed the soldiers who carried them in. Then he looked inside and saw something impossible.',
      reference: 'Daniel 3:24–25',
      scriptureText: 'Then Nebuchadnezzar the king was astonished, and rose up in haste. He spoke and said to his counselors, "Didn\'t we cast three men bound into the middle of the fire?" ... "Look, I see four men loose, walking in the middle of the fire, and they are unharmed. The aspect of the fourth is like a son of the gods."',
      scriptureInsight: 'They walked into the fire as three. God met them there, and they walked out unharmed — not spared from the fire, but never alone inside it.',
      prompt: 'What changed about the furnace once the fourth figure appeared?',
      hint: 'Notice they weren’t rescued from the fire — they were kept safe within it.',
      options: ['They were not alone, and not harmed', 'The fire went out completely', 'They disappeared and reappeared later'],
      answer: 'They were not alone, and not harmed',
    },
    {
      title: 'God Honored Before the Empire',
      type: 'reflect',
      minutes: 6,
      eyebrow: 'Daniel 3 · The Aftermath',
      intro: 'A pagan king who moments earlier demanded worship for himself ended up publicly praising the God of three young exiles.',
      reference: 'Daniel 3:28–29',
      scriptureText: 'Nebuchadnezzar spoke and said, "Blessed be the God of Shadrach, Meshach, and Abednego, who has sent his angel, and delivered his servants who trusted in him... who have yielded their bodies, that they might not serve nor worship any god, except their own God."',
      scriptureInsight: 'Their quiet, costly integrity in one moment ended up shifting how the most powerful man in the world thought about God.',
      prompt: 'Standing firm rarely feels dramatic in the moment — it usually just feels risky and lonely. What’s one place this week you could stand firm on a conviction, even if no one applauds it right away?',
      hint: 'Think about something concrete: a comment you won’t laugh at, a rule you won’t break, a value you won’t compromise — not a vague intention.',
    },
  ],

  // ── All-Age Family Quest flagship: The Fruit of the Spirit at Home ──
  'family-fruits-spirit': [
    {
      title: 'Patience When Siblings Annoy',
      type: 'reflect',
      minutes: 8,
      eyebrow: 'Family Devotion · Patience',
      intro: 'Patience is easy to talk about and hard to practice — especially with the people who know exactly how to push our buttons.',
      reference: 'Galatians 5:22, Colossians 3:12',
      scriptureText: 'The fruit of the Spirit is love, joy, peace, patience, kindness, goodness, faithfulness, gentleness, and self-control. Against such things there is no law.\n\nPut on therefore, as God\'s chosen ones, holy and beloved, a heart of compassion, kindness, lowliness, humility, and perseverance.',
      scriptureInsight: 'Patience isn’t the absence of frustration — it’s choosing love in the middle of it, especially at home where frustration happens most.',
      prompt: 'As a family, name one everyday moment (getting ready for school, sharing the TV, waiting for dinner) where patience gets tested the most. What could a patient response look like next time it happens?',
      hint: 'Every family member can answer this one — even the youngest.',
    },
    {
      title: 'Peace in Family Arguments',
      type: 'reflect',
      minutes: 8,
      eyebrow: 'Family Devotion · Peace',
      intro: 'Disagreements are normal in every family. What matters is how a family moves through them.',
      reference: 'Romans 12:18, Colossians 3:13–15',
      scriptureText: 'If it is possible, as much as it is up to you, be at peace with all men.\n\nBearing with one another, and forgiving each other... even as Christ forgave you, so you also do. Beyond all these things, walk in love... And let the peace of Christ rule in your hearts.',
      scriptureInsight: 'Peace doesn’t mean pretending nothing happened — it means choosing to resolve conflict instead of letting it sit and grow.',
      prompt: 'Think about the last disagreement in your family. What would it have looked like to let "the peace of Christ rule" in that moment instead?',
      hint: 'It’s okay to admit the honest, messy answer here — this is a practice conversation, not a performance.',
    },
    {
      title: 'Gentleness with Words',
      type: 'reflect',
      minutes: 7,
      eyebrow: 'Family Devotion · Gentleness',
      intro: 'The words spoken at home carry more weight than almost any others, because they’re the ones repeated the most.',
      reference: 'Ephesians 4:29, Proverbs 15:1',
      scriptureText: 'Let no corrupt speech proceed out of your mouth, but only what is good for building up as the need may be, that it may give grace to those who hear.\n\nA gentle answer turns away wrath, but a harsh word stirs up anger.',
      scriptureInsight: 'Gentleness in speech doesn’t mean being quiet about hard things — it means saying them in a way that builds rather than wounds.',
      prompt: 'What’s one phrase your family could agree to use instead of a harsh one, the next time someone is frustrated?',
      hint: 'Try coming up with it together out loud, as a family, right now.',
    },
    {
      title: 'Self-Control with Screens',
      type: 'reflect',
      minutes: 8,
      eyebrow: 'Family Devotion · Self-Control',
      intro: 'Every family — parents included — wrestles with knowing when to put the screen down.',
      reference: 'Galatians 5:22–23, 1 Corinthians 9:25',
      scriptureText: 'The fruit of the Spirit is love, joy, peace, patience, kindness, goodness, faithfulness, gentleness, and self-control. Against such things there is no law.\n\nEvery man who strives in the games exercises self-control in all things.',
      scriptureInsight: 'Self-control is a fruit the Spirit grows in us — it’s a practiced skill, not something we either have or don’t.',
      prompt: 'As a family, agree on one small, specific screen boundary to try this week (a phone-free dinner, a shared bedtime cutoff). Write it down together.',
      hint: 'Make it small enough that everyone — parents included — can actually keep it.',
    },
  ],
};

function toTitleFragment(theme: string) {
  return theme.replace(/&/g, 'and');
}

// ── GENERIC FALLBACK ───────────────────────────────────────────────
// Builds a working, on-topic sub-lesson sequence straight from a
// module's own curriculum data, so every module has real sub-lessons
// even before it gets a hand-authored set like the ones above.
function buildGenericLessons(module: CurriculumModule): ModuleSubLesson[] {
  const isEarly = module.track === 'early';
  return module.keyLessons.map((lessonTitle, index) => {
    const isLast = index === module.keyLessons.length - 1;
    return {
      title: lessonTitle,
      type: 'reflect',
      minutes: isEarly ? 4 : module.track === 'teen' ? 7 : 6,
      eyebrow: `${module.ageBandLabel} · Part ${index + 1} of ${module.keyLessons.length}`,
      intro: index === 0 ? module.description : `Continuing "${module.title}": ${lessonTitle}.`,
      reference: module.coreVerse,
      scriptureText: module.corePassage,
      scriptureInsight: isLast ? module.realWorldConnection : `This step focuses on ${toTitleFragment(module.theme)}.`,
      prompt: isEarly
        ? `Talk about "${lessonTitle}" — what happened, and how did it make you feel?`
        : `Reflect on "${lessonTitle}." ${module.realWorldConnection}`,
      hint: isEarly
        ? 'There’s no wrong answer — tell it in your own words.'
        : 'Connect this to something happening in your own life right now, not just the story.',
    };
  });
}

export function getModuleLessons(module: CurriculumModule): ModuleSubLesson[] {
  return handAuthoredLessons[module.id] || buildGenericLessons(module);
}

export function getNextModuleInTrack(module: CurriculumModule): CurriculumModule | undefined {
  const trackModules = curriculumModules.filter((m) => m.track === module.track);
  const index = trackModules.findIndex((m) => m.id === module.id);
  if (index === -1 || index === trackModules.length - 1) return undefined;
  return trackModules[index + 1];
}
