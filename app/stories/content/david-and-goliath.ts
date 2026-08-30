// David & Goliath — 1 Samuel 17.
//
// BIBLICAL EVENT vs INTERACTIVE LEARNING DECISION: the CHOICE scene below
// ("What would you bring to face Goliath?") is a learning/game mechanic, not
// a claim about what Scripture records David weighing in the moment. Every
// choice converges on the same next scene, and the story always ends with
// David defeating Goliath through faith in God — the choice only changes the
// feedback the child receives, never the outcome.

import type { InteractiveStory } from '../types';

export const davidAndGoliath: InteractiveStory = {
  id: 'david-and-goliath',
  title: 'David & Goliath',
  heroEmoji: '🛡️',
  scriptureRange: '1 Samuel 17',
  estimatedMinutes: 8,
  conceptId: 'early-shepherd',
  adventure: { regionId: 'jerusalem', chapterId: 'jer-ch1', collectibleId: 'coll-five-smooth-stones' },
  reward: { xp: 140, coins: 60, gems: 2 },
  characters: [
    { id: 'narrator', name: 'Narrator', emoji: '📖', role: 'narrator' },
    { id: 'david', name: 'David', emoji: '🧑‍🌾', role: 'protagonist', accentColor: 'gold' },
    { id: 'goliath', name: 'Goliath', emoji: '🗡️', role: 'antagonist', accentColor: 'coral' },
    { id: 'saul', name: 'King Saul', emoji: '👑', role: 'supporting', accentColor: 'navy' },
  ],
  firstSceneId: 'scene-1',
  scenes: [
    {
      id: 'scene-1',
      order: 1,
      type: 'NARRATION',
      nextSceneId: 'scene-2',
      illustration: { emoji: '⛺', background: 'battlefield' },
      text: {
        child: 'David’s brothers were soldiers in King Saul’s army. One day, David’s father sent him to bring them food at the battle camp.',
        teen: 'David’s three oldest brothers had joined King Saul’s army, camped in the Valley of Elah against the Philistines. His father sent him with supplies and instructions to check on them.',
      },
    },
    {
      id: 'scene-2',
      order: 2,
      type: 'DIALOGUE',
      nextSceneId: 'scene-3',
      speakerId: 'narrator',
      illustration: { emoji: '😨', background: 'battlefield' },
      scripture: {
        reference: '1 Samuel 17:23-24',
        text: 'Goliath, the Philistine champion... came out and shouted his usual defiance... all the men of Israel ran from him in great fear.',
        translation: 'NIV',
      },
      line: {
        child: 'A giant named Goliath came out and shouted, daring anyone to fight him. Every soldier in Israel’s army was afraid and ran away.',
        teen: 'Twice a day for forty days, the Philistine champion Goliath — over nine feet tall — strode out shouting his challenge. Every soldier in Israel, including men who had trained for war, ran in terror.',
      },
    },
    {
      id: 'scene-3',
      order: 3,
      type: 'CHOICE',
      nextSceneId: 'scene-4',
      illustration: { emoji: '🤔', background: 'battlefield' },
      prompt: {
        child: 'David hears Goliath’s challenge. In this activity, what should David rely on to face him?',
        teen: 'Every soldier sees the same giant, but David sees something different. What does David’s response suggest he’s relying on?',
      },
      choices: [
        {
          id: 'own-strength',
          label: { child: '💪 His own strength', teen: 'His own physical strength and skill' },
          isBestChoice: false,
          feedback: {
            child: 'Good try! But David wasn’t counting on his own strength — he was much smaller than Goliath. Let’s keep going and see what he trusted instead.',
            teen: 'Not quite what the text points to. David was young and had no soldier’s training or armor — his confidence had to come from somewhere else. Let’s continue.',
          },
        },
        {
          id: 'gods-power',
          label: { child: '🙏 God’s power', teen: 'His trust that God fights for His people' },
          isBestChoice: true,
          feedback: {
            child: 'Exactly! David trusted that God was with him, even though Goliath was much bigger and stronger.',
            teen: 'Right — David’s courage flows from a conviction that "the battle is the LORD’s," not from any confidence in his own ability.',
          },
          bonusContent: {
            emoji: '🐑',
            text: {
              child: 'David remembered that God had helped him protect his sheep from a lion and a bear before!',
              teen: 'David had already seen God’s protection firsthand — defending his father’s sheep from a lion and a bear (1 Samuel 17:34-37) — and reasoned from that experience to this moment.',
            },
          },
        },
        {
          id: 'run-away',
          label: { child: '🏃 Running away, like the soldiers', teen: 'Avoiding the confrontation entirely' },
          isBestChoice: false,
          feedback: {
            child: 'That’s what the other soldiers did! But David chose something braver. Let’s see what happened.',
            teen: 'That was the army’s response for forty days. David’s response breaks that pattern — worth noticing why.',
          },
        },
      ],
    },
    {
      id: 'scene-4',
      order: 4,
      type: 'DIALOGUE',
      nextSceneId: 'scene-5',
      speakerId: 'saul',
      illustration: { emoji: '👑', background: 'temple' },
      line: {
        child: 'King Saul told David, "You are too young. Goliath has been a warrior since he was young."',
        teen: 'King Saul objected: "You are not able to go against this Philistine and fight him; you are only a young man, and he has been a warrior from his youth."',
      },
    },
    {
      id: 'scene-5',
      order: 5,
      type: 'DIALOGUE',
      nextSceneId: 'scene-6',
      speakerId: 'david',
      illustration: { emoji: '🪨', background: 'day' },
      scripture: {
        reference: '1 Samuel 17:45',
        text: 'You come against me with sword and spear and javelin, but I come against you in the name of the LORD Almighty, the God of the armies of Israel, whom you have defied.',
        translation: 'NIV',
      },
      line: {
        child: 'David said, "You come with a sword and spear, but I come in the name of the Lord Almighty!" He picked five smooth stones and took his sling.',
        teen: 'David refused Saul’s armor — it didn’t fit and he hadn’t trained in it — and instead chose five smooth stones from the stream, and his sling.',
      },
    },
    {
      id: 'scene-6',
      order: 6,
      type: 'QUIZ',
      nextSceneId: 'scene-7',
      illustration: { emoji: '❓', background: 'day' },
      questions: [
        {
          id: 'q1',
          prompt: {
            child: 'What did David say he came in the name of?',
            teen: 'What did David say gave him the authority to face Goliath?',
          },
          options: [
            { child: 'A sword and spear', teen: 'His own military training' },
            { child: 'The Lord Almighty', teen: 'The name of the LORD Almighty' },
            { child: 'King Saul’s armor', teen: 'Saul’s royal authority' },
          ],
          correctIndex: 1,
          explanation: {
            child: 'David trusted in the Lord, not in weapons or armor.',
            teen: 'David explicitly contrasts Goliath’s weapons with "the name of the LORD Almighty" — the theological center of the whole account.',
          },
        },
        {
          id: 'q2',
          prompt: {
            child: 'Why didn’t David wear King Saul’s armor?',
            teen: 'Why did David set aside Saul’s armor after trying it?',
          },
          options: [
            { child: 'It didn’t fit and he wasn’t used to it', teen: 'He hadn’t tested it and it didn’t suit how he’d trained' },
            { child: 'He forgot to wear it', teen: 'He forgot it back home' },
            { child: 'Goliath told him not to', teen: 'Goliath forbade it' },
          ],
          correctIndex: 0,
          explanation: {
            child: 'David tried it on but it felt strange, so he went with what he knew — his sling.',
            teen: '1 Samuel 17:39 shows David trying the armor, then removing it — he went into battle equipped with what he’d actually practiced with.',
          },
        },
      ],
    },
    {
      id: 'scene-7',
      order: 7,
      type: 'MEMORY',
      nextSceneId: 'scene-8',
      illustration: { emoji: '📜', background: 'day' },
      theme: 'Trusting God in hard moments',
      verse: {
        reference: '1 Samuel 17:47',
        text: 'It is not by sword or spear that the LORD saves; for the battle is the LORD’s.',
        translation: 'NIV',
      },
      blanks: ['sword', 'spear', 'battle'],
    },
    {
      id: 'scene-8',
      order: 8,
      type: 'FINAL_CHALLENGE',
      nextSceneId: null,
      requiredScore: 2,
      illustration: { emoji: '🏆', background: 'day' },
      title: {
        child: 'Final Challenge: What Did You Learn?',
        teen: 'Final Challenge: Understanding David’s Courage',
      },
      questions: [
        {
          id: 'fc1',
          prompt: {
            child: 'Why was David able to face Goliath bravely?',
            teen: 'What best explains the source of David’s courage before Goliath?',
          },
          options: [
            { child: 'He was the biggest soldier', teen: 'He was physically larger than his brothers' },
            { child: 'He trusted God to help him', teen: 'He trusted that God fights for His people' },
            { child: 'He had the best armor', teen: 'Saul’s armor gave him confidence' },
          ],
          correctIndex: 1,
          explanation: {
            child: 'David trusted God, not his own size or strength.',
            teen: 'David was younger and smaller than a trained soldier — his courage came from trust in God, not physical advantage.',
          },
        },
        {
          id: 'fc2',
          prompt: {
            child: 'What did David use to face Goliath?',
            teen: 'What equipment did David actually use in the fight?',
          },
          options: [
            { child: 'A sword and shield', teen: 'A sword and shield' },
            { child: 'A sling and five stones', teen: 'A sling and five smooth stones' },
            { child: 'A spear', teen: 'A spear' },
          ],
          correctIndex: 1,
          explanation: {
            child: 'David used the sling he already knew how to use as a shepherd.',
            teen: 'David used tools from his shepherding life — a sling and stones — rather than unfamiliar military weapons.',
          },
        },
        {
          id: 'fc3',
          prompt: {
            child: 'What can we learn from David’s story?',
            teen: 'What is the central lesson of 1 Samuel 17?',
          },
          options: [
            { child: 'Courage means never feeling afraid', teen: 'Courage requires the absence of fear' },
            { child: 'Being brave means doing what’s right even when it’s scary, because God is with us', teen: 'Faith can produce courage despite fear, because the outcome rests with God' },
            { child: 'Only strong people can be brave', teen: 'Only the physically strongest can prevail' },
          ],
          correctIndex: 1,
          explanation: {
            child: 'David was probably still a little scared — but he trusted God more than his fear.',
            teen: '"The battle is the LORD’s" reframes courage: not fearlessness, but trust that outlasts fear.',
          },
        },
      ],
    },
  ],
};
