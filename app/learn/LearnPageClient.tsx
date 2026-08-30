'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { curriculumModules, type CurriculumModule } from '../curriculum-data';
import { getModuleLessons, getNextModuleInTrack } from '../curriculum-lessons';
import StudioAudioPlayer from '../components/StudioAudioPlayer';
import { hasActiveSession, readActiveProfile } from '../adventure/storage';

type Activity = {
  slug: string;
  title: string;
  type: 'story' | 'choice' | 'order' | 'match' | 'reflect';
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
  words?: string[];
  pairs?: Array<[string, string]>;
};

const activities: Activity[] = [
  // ── 1. STORIES (Old & New Testament) ─────────────────────────
  {
    slug: 'david-chooses-courage',
    title: 'David chooses courage',
    type: 'story',
    minutes: 8,
    eyebrow: 'Story path',
    intro: 'David is young, but he remembers how God helped him before. Walk through the moment one step at a time.',
    reference: '1 Samuel 17:32–37',
    scriptureText: 'David said to Saul, “Let no man’s heart fail because of him. Your servant will go and fight with this Philistine.”\n\nSaul said to David, “You are not able to go against this Philistine to fight with him; for you are but a youth, and he has been a man of war from his youth.”\n\nDavid said to Saul, “Your servant was keeping his father’s sheep; and when a lion or a bear came and took a lamb out of the flock, I went out after him, struck him, and delivered it out of his mouth... Yahweh, who delivered me out of the paw of the lion and out of the paw of the bear, will deliver me out of the hand of this Philistine.”\n\nSaul said to David, “Go; and Yahweh will be with you.”',
    scriptureInsight: 'David did not rely on his own size or armour. He remembered God’s faithful protection in quiet pasture fields, giving him the confidence to face the battle.',
    prompt: 'What helped David take a brave step against Goliath?',
    hint: 'Think about what David remembered before he stepped onto the battlefield.',
    options: ['The crowd promised he would win', 'He remembered God’s help before in the fields', 'He had the biggest heavy armour'],
    answer: 'He remembered God’s help before in the fields',
  },
  {
    slug: 'creation-in-the-beginning',
    title: 'In the beginning: The world spoken into light',
    type: 'story',
    minutes: 6,
    eyebrow: 'Genesis Story',
    intro: 'God spoke into the darkness and formed the sky, the seas, and every living creature with care.',
    reference: 'Genesis 1:1–31',
    scriptureText: 'In the beginning, God created the heavens and the earth. The earth was formless and empty. Darkness was on the surface of the deep and God’s Spirit was hovering over the surface of the waters.\n\nGod said, “Let there be light,” and there was light. God saw the light, and saw that it was good... God created man in His own image. In God’s image He created him; male and female He created them.\n\nGod saw everything that He had made, and behold, it was very good.',
    scriptureInsight: 'God fashioned the universe with order, beauty, and purpose—and declared His completed creation very good.',
    prompt: 'When God created human beings in His own image, what was His verdict over all creation?',
    hint: 'Look at the end of the sixth day in Genesis 1.',
    options: ['It was very good', 'It was just ordinary', 'It was incomplete and rushed'],
    answer: 'It was very good',
  },
  {
    slug: 'noah-builds-the-ark',
    title: 'Noah trusts and builds in the sunshine',
    type: 'story',
    minutes: 7,
    eyebrow: 'Faith Story',
    intro: 'Noah spent years building an enormous wooden ark while there was not a single cloud in the sky.',
    reference: 'Genesis 6:13–22',
    scriptureText: 'God said to Noah, “Make yourself an ark of gopher wood. Make rooms in the ark, and cover it inside and outside with pitch... Behold, I will bring the flood of waters on the earth, to destroy all flesh... But I will establish my covenant with you. You shall come into the ark, you, your sons, your wife, and your sons’ wives with you.”\n\nNoah did everything that God commanded him; so he did.',
    scriptureInsight: 'Noah trusted God’s warning before seeing any rain, moving with steady faith and faithful obedience.',
    prompt: 'Why did Noah obey God and build the ark before any rain started?',
    hint: 'Hebrews 11:7 explains that Noah moved with reverence and trusted what had not yet been seen.',
    options: ['He trusted God’s warning and walked faithfully', 'He wanted to build a tourist ship', 'His neighbours dared him to do it'],
    answer: 'He trusted God’s warning and walked faithfully',
  },
  {
    slug: 'abraham-counts-the-stars',
    title: 'Abraham counts the night stars',
    type: 'story',
    minutes: 6,
    eyebrow: 'Promise Story',
    intro: 'God brought Abraham outside into the quiet night and told him to look up into the endless canopy of stars.',
    reference: 'Genesis 15:1–6',
    scriptureText: 'After these things Yahweh’s word came to Abram in a vision, saying, “Don’t be afraid, Abram. I am your shield, your exceedingly great reward.”\n\nHe brought him outside, and said, “Look now toward the sky, and count the stars, if you are able to count them.” He said to him, “So your offspring will be.”\n\nAbram believed in Yahweh; and He credited it to him for righteousness.',
    scriptureInsight: 'Abram looked into the glittering night sky and placed his simple, unwavering trust in God’s promise.',
    prompt: 'What did God promise Abraham as they looked at the night sky?',
    hint: 'God said his family would be as countless as the stars above.',
    options: ['His descendants would be as numerous as the stars', 'He would build an observatory', 'He would move to a mountain top'],
    answer: 'His descendants would be as numerous as the stars',
  },
  {
    slug: 'joseph-from-pit-to-palace',
    title: 'Joseph: Forgiving his brothers in Egypt',
    type: 'story',
    minutes: 9,
    eyebrow: 'Mercy Story',
    intro: 'After being sold into slavery by his brothers, Joseph rose to save Egypt from famine. When his brothers came for food, he faced a life-defining choice.',
    reference: 'Genesis 50:19–21',
    scriptureText: 'Joseph said to them, “Don’t be afraid, for am I in the place of God? As for you, you meant evil against me, but God meant it for good, to bring to pass that many people should be kept alive, as they are today.\n\nNow therefore don’t be afraid. I will nourish you and your little ones.”\n\nHe comforted them, and spoke kindly to them.',
    scriptureInsight: 'Joseph overcame bitterness by seeing God’s hand of redemption, choosing forgiveness and kind care over vengeance.',
    prompt: 'What did Joseph say to his brothers when they feared his revenge?',
    hint: 'Joseph saw God’s bigger plan of redemption through the pain.',
    options: ['You intended to harm me, but God intended it for good', 'I will keep you in prison forever', 'You must pay back every piece of silver'],
    answer: 'You intended to harm me, but God intended it for good',
  },
  {
    slug: 'moses-burning-bush',
    title: 'Moses and the holy ground',
    type: 'story',
    minutes: 8,
    eyebrow: 'Calling Story',
    intro: 'While tending sheep in the desert, Moses saw a bush burning with fire that did not burn up.',
    reference: 'Exodus 3:1–14',
    scriptureText: 'The angel of Yahweh appeared to him in a flame of fire out of the middle of a bush. He looked, and behold, the bush burned with fire, and the bush was not consumed.\n\nGod called to him out of the middle of the bush, and said, “Moses! Moses!”\n\nHe said, “Here I am.”\n\nGod said, “Don’t come any closer. Take off your sandals, for the place you are standing on is holy ground... I have surely seen the affliction of My people... I AM WHO I AM.”',
    scriptureInsight: 'God meets Moses in an ordinary pasture and reveals His holy name and caring heart for those who suffer.',
    prompt: 'What name did God reveal to Moses when sending him to deliver Israel?',
    hint: 'God declared His eternal presence: I AM WHO I AM.',
    options: ['I AM WHO I AM', 'The Far Away Master', 'The Secret King'],
    answer: 'I AM WHO I AM',
  },
  {
    slug: 'crossing-the-red-sea',
    title: 'The waters part at the Red Sea',
    type: 'story',
    minutes: 7,
    eyebrow: 'Miracle Story',
    intro: 'Trapped between Pharaoh’s chariots and the deep water, Moses lifted his staff over the sea.',
    reference: 'Exodus 14:13–31',
    scriptureText: 'Moses said to the people, “Don’t be afraid. Stand still, and see the salvation of Yahweh, which He will work for you today... Yahweh will fight for you, and you will be still.”\n\nMoses stretched out his hand over the sea, and Yahweh caused the sea to go back by a strong east wind all night, and made the sea dry land, and the waters were divided. The children of Israel went into the middle of the sea on dry ground.',
    scriptureInsight: 'When there seemed to be no way forward, God made a path directly through the impossible deep.',
    prompt: 'What did Moses tell the frightened people to do before God parted the sea?',
    hint: 'Exodus 14:13 says: Do not be afraid. Stand firm and see the salvation of the Lord.',
    options: ['Do not be afraid; stand firm and see God save you', 'Turn around and surrender', 'Swim as fast as you can'],
    answer: 'Do not be afraid; stand firm and see God save you',
  },
  {
    slug: 'solomon-asks-for-wisdom',
    title: 'Solomon asks for a listening heart',
    type: 'story',
    minutes: 6,
    eyebrow: 'Wisdom Story',
    intro: 'When God appeared to young King Solomon in a dream and asked what he wanted, Solomon did not ask for wealth or long life.',
    reference: '1 Kings 3:5–14',
    scriptureText: 'In Gibeon, Yahweh appeared to Solomon in a dream by night; and God said, “Ask what I will give you.”\n\nSolomon said, “...I am but a little child. I don’t know how to go out or come in... Give your servant therefore an understanding heart to judge your people, that I may discern between good and evil.”\n\nThe speech pleased the Lord, that Solomon had asked this thing. God said to him, “Because you have asked this thing, behold, I have given you a wise and understanding heart.”',
    scriptureInsight: 'Solomon knew that a discerning, humble heart that listens to God is far more precious than wealth or victory.',
    prompt: 'What did King Solomon ask God to give him to lead the people well?',
    hint: 'He asked for a wise and discerning heart.',
    options: ['Wisdom and an understanding heart', 'Enormous golden palaces', 'Victory over all armies'],
    answer: 'Wisdom and an understanding heart',
  },
  {
    slug: 'elijah-and-the-whisper',
    title: 'Elijah and the gentle whisper on the mountain',
    type: 'story',
    minutes: 7,
    eyebrow: 'Comfort Story',
    intro: 'Tired and scared in a cave, Elijah looked for God in a great wind, an earthquake, and a fire.',
    reference: '1 Kings 19:11–13',
    scriptureText: 'Yahweh said, “Go out, and stand on the mountain before Yahweh.”\n\nBehold, Yahweh passed by, and a great and strong wind tore the mountains, but Yahweh was not in the wind. After the wind there was an earthquake, but Yahweh was not in the earthquake. After the earthquake a fire, but Yahweh was not in the fire.\n\nAnd after the fire came a still small voice, a gentle whisper. When Elijah heard it, he wrapped his face in his mantle.',
    scriptureInsight: 'God speaks comfort into our weariness not through chaotic storms, but in quiet, gentle peace.',
    prompt: 'Where did Elijah finally hear the voice of the Lord?',
    hint: 'God was not in the violent storm, but in the gentle silence.',
    options: ['In a gentle, quiet whisper', 'In the howling windstorm', 'In the crashing earthquake'],
    answer: 'In a gentle, quiet whisper',
  },
  {
    slug: 'daniel-in-the-lions-den',
    title: 'Daniel stays faithful in the lions’ den',
    type: 'story',
    minutes: 8,
    eyebrow: 'Courage Story',
    intro: 'Even when the king signed a law forbidding prayer, Daniel opened his windows towards Jerusalem and prayed three times a day.',
    reference: 'Daniel 6:10–23',
    scriptureText: 'When Daniel knew that the writing was signed, he went into his house; and he kneeled on his knees three times a day, and prayed, and gave thanks before his God, as he did before.\n\nThe king commanded, and they brought Daniel, and threw him into the lions’ den... The king arose very early in the morning, and went in haste to the lions’ den. He cried with a troubled voice to Daniel: “Daniel, servant of the living God, is your God able to deliver you from the lions?”\n\nThen Daniel said to the king, “My God has sent His angel, and has shut the lions’ mouths, and they have not hurt me.”',
    scriptureInsight: 'Daniel placed his loyalty to God above all pressure, and God’s angel guarded him through the darkest night.',
    prompt: 'Why was Daniel unharmed when the king checked the pit in the morning?',
    hint: 'Daniel 6:22 says God sent His angel to shut the lions’ mouths.',
    options: ['God sent His angel and shut the lions’ mouths', 'The lions were already full', 'Daniel climbed out during the night'],
    answer: 'God sent His angel and shut the lions’ mouths',
  },
  {
    slug: 'jonah-and-the-big-fish',
    title: 'Jonah learns God’s heart of compassion',
    type: 'story',
    minutes: 7,
    eyebrow: 'Repentance Story',
    intro: 'Jonah ran the opposite direction from Nineveh, but God’s mercy reached him even in the deep sea.',
    reference: 'Jonah 2:1–3:5',
    scriptureText: 'Then Jonah prayed to Yahweh, his God, out of the fish’s belly. He said, “I called because of my affliction to Yahweh. You answered me. Out of the belly of Sheol I cried. You heard my voice... Salvation belongs to Yahweh!”\n\nYahweh spoke to the fish, and it vomited Jonah out on the dry land. The word of Yahweh came to Jonah the second time, saying, “Arise, go to Nineveh, that great city, and preach to it the message that I give you.”',
    scriptureInsight: 'God is the God of second chances. No matter how far we wander, God hears our honest prayers.',
    prompt: 'What did Jonah do while inside the belly of the big fish for three days?',
    hint: 'Jonah chapter 2 records his prayer of thanksgiving and surrender.',
    options: ['He prayed with thanksgiving and trusted God', 'He complained that the water was cold', 'He gave up completely'],
    answer: 'He prayed with thanksgiving and trusted God',
  },
  {
    slug: 'esther-for-such-a-time',
    title: 'Queen Esther: For such a time as this',
    type: 'story',
    minutes: 8,
    eyebrow: 'Bravery Story',
    intro: 'Mordecai reminded Queen Esther that her position in the royal palace was an opportunity to risk everything for her people.',
    reference: 'Esther 4:14–16',
    scriptureText: 'Mordecai said: “Who knows whether you haven’t come to the kingdom for such a time as this?”\n\nEsther bade them return this answer to Mordecai: “Go, gather together all the Jews who are present in Shushan, and fast for me, and neither eat nor drink three days, night or day. I also and my maidens will fast likewise. And so I will go in to the king, which is against the law; and if I perish, I perish.”',
    scriptureInsight: 'Esther stepped into her God-given purpose with prayer and courageous faith for the sake of others.',
    prompt: 'What did Esther ask all her people to do before she went before the king uninvited?',
    hint: 'She asked everyone to join her in fasting and prayer for three days.',
    options: ['Fast and pray together for three days', 'Gather weapons for a battle', 'Escape quietly at night'],
    answer: 'Fast and pray together for three days',
  },
  {
    slug: 'jesus-calms-the-storm',
    title: 'Peace in the storm on Galilee',
    type: 'story',
    minutes: 7,
    eyebrow: 'Gospel Story',
    intro: 'Huge waves filled the disciples’ small boat while Jesus was asleep on a cushion in the stern.',
    reference: 'Mark 4:35–41',
    scriptureText: 'A big wind storm arose, and the waves beat into the boat, so much that the boat was already filled. Jesus Himself was in the stern, asleep on the cushion. They woke Him up, and told Him, “Teacher, don’t you care that we are dying?”\n\nHe awoke, and rebuked the wind, and said to the sea, “Peace! Be still!”\n\nThe wind ceased, and there was a great calm. He said to them, “Why are you so afraid? How is it that you have no faith?”',
    scriptureInsight: 'Even raging waves and howling storms submit to Jesus’ authority. When fear rises, His presence brings peace.',
    prompt: 'What did Jesus say to the roaring wind and surging waves?',
    hint: 'He spoke directly to the storm with three powerful words.',
    options: ['“Peace, be still!” and the sea was calm', '“Row faster to the shore!”', '“Let’s wait out the rain.”'],
    answer: '“Peace, be still!” and the sea was calm',
  },
  {
    slug: 'the-good-samaritan-journey',
    title: 'The Good Samaritan: Who is my neighbour?',
    type: 'story',
    minutes: 7,
    eyebrow: 'Parable Story',
    intro: 'A traveller was injured on the road from Jerusalem to Jericho. Religious leaders walked by, but a stranger stopped.',
    reference: 'Luke 10:25–37',
    scriptureText: 'A certain Samaritan, as he travelled, came where he was. When he saw him, he was moved with compassion, came to him, and bound up his wounds, pouring on oil and wine. He set him on his own animal, brought him to an inn, and took care of him... Jesus said to him, “Go and do likewise.”',
    scriptureInsight: 'Jesus shows that true love does not look away from suffering, but steps in with compassionate hands.',
    prompt: 'What does Jesus tell us to do through the Samaritan’s actions?',
    hint: 'Jesus told the expert in the law: Go and do likewise.',
    options: ['Show active mercy and love to anyone in need', 'Only help people from your own town', 'Walk on the other side of the road'],
    answer: 'Show active mercy and love to anyone in need',
  },
  {
    slug: 'the-lost-sheep-found',
    title: 'The Good Shepherd finds the one lost sheep',
    type: 'story',
    minutes: 6,
    eyebrow: 'Love Story',
    intro: 'A shepherd has ninety-nine sheep safely in the fold, but notices one has wandered off into the hills.',
    reference: 'Luke 15:1–7',
    scriptureText: '“Which of you men, if you had one hundred sheep, and lost one of them, wouldn’t leave the ninety-nine in the wilderness, and go after the one that was lost, until he finds it?\n\nWhen he has found it, he carries it on his shoulders, rejoicing. When he comes home, he calls together his friends and his neighbours, saying to them, ‘Rejoice with me, for I have found my sheep which was lost!’”',
    scriptureInsight: 'You are never forgotten by God. The Good Shepherd searches tirelessly for each one of His sheep.',
    prompt: 'What does the shepherd do when he finds the lost sheep in the wilderness?',
    hint: 'He puts it on his shoulders with joy and invites friends to celebrate.',
    options: ['Lifts it on his shoulders rejoicing', 'Scolds the sheep for getting lost', 'Leaves it to find its own way back'],
    answer: 'Lifts it on his shoulders rejoicing',
  },
  {
    slug: 'jesus-feeds-five-thousand',
    title: 'Five small loaves and two fish',
    type: 'story',
    minutes: 6,
    eyebrow: 'Generosity Story',
    intro: 'Thousands of tired people had listened to Jesus until evening. A young boy offered his lunch to the disciples.',
    reference: 'John 6:1–14',
    scriptureText: 'Andrew said to Jesus, “There is a boy here who has five barley loaves and two fish, but what are these among so many?”\n\nJesus said, “Have the people sit down.” Now there was much grass in the place. So the men sat down, in number about five thousand. Jesus took the loaves; and having given thanks, He distributed to the disciples, and the disciples to those who were sitting down; likewise also of the fish as much as they desired.\n\nWhen they were filled, they gathered up twelve baskets full of broken pieces.',
    scriptureInsight: 'When we bring what little we have to Jesus in generosity, He multiplies it to nourish thousands.',
    prompt: 'What happened after Jesus gave thanks for the boy’s five loaves and two fish?',
    hint: 'Everyone ate until satisfied, with twelve baskets of leftovers remaining.',
    options: ['Everyone was filled and 12 baskets of bread were left over', 'Only the disciples got a snack', 'The food ran out quickly'],
    answer: 'Everyone was filled and 12 baskets of bread were left over',
  },
  {
    slug: 'paul-and-silas-in-prison',
    title: 'Paul and Silas singing at midnight',
    type: 'story',
    minutes: 7,
    eyebrow: 'Joy Story',
    intro: 'Locked in chains in the deepest inner dungeon of Philippi, Paul and Silas spent the midnight hour singing hymns.',
    reference: 'Acts 16:22–34',
    scriptureText: 'The magistrates tore their clothes off them, and commanded them to be beaten with rods. When they had laid many stripes on them, they threw them into prison... Having received such a command, he threw them into the inner prison, and fastened their feet in the stocks.\n\nBut about midnight Paul and Silas were praying and singing hymns to God, and the prisoners were listening to them. Suddenly there was a great earthquake, so that the foundations of the prison were shaken; and immediately all the doors were opened, and everyone’s bonds were loosed.',
    scriptureInsight: 'Praise and heartfelt worship have the power to break chains even in the darkest circumstances.',
    prompt: 'What happened as Paul and Silas prayed and sang praises to God in chains?',
    hint: 'A sudden earthquake shook the foundation and all prison doors swung open.',
    options: ['An earthquake shook the prison and the chains came loose', 'The guards told them to be quiet', 'They fell asleep in discouragement'],
    answer: 'An earthquake shook the prison and the chains came loose',
  },

  // ── 2. GAMES & WORD BUILDERS ─────────────────────────────────
  {
    slug: 'build-psalm-119-105',
    title: 'Build Psalm 119:105: Lamp to my feet',
    type: 'order',
    minutes: 4,
    eyebrow: 'Word builder',
    intro: 'Put the words in the right order. Tap a chosen word to return it to the bank.',
    reference: 'Psalm 119:105, WEB',
    scriptureText: '“Your word is a lamp to my feet, and a light for my path. I have sworn, and have confirmed it, that I will obey your righteous ordinances.” (Psalm 119:105–106)',
    scriptureInsight: 'God’s word illuminates the very next step we take, guiding our everyday choices in clarity and peace.',
    prompt: 'Build the verse about God’s word guiding your steps.',
    hint: 'The verse begins by describing God’s word as a lamp.',
    words: ['Your', 'word', 'is', 'a', 'lamp', 'to', 'my', 'feet'],
    answer: 'Your word is a lamp to my feet',
  },
  {
    slug: 'build-john-3-16',
    title: 'Build John 3:16: For God so loved the world',
    type: 'order',
    minutes: 5,
    eyebrow: 'Word builder',
    intro: 'Reconstruct the most famous promise of God’s love in the New Testament.',
    reference: 'John 3:16, WEB',
    scriptureText: '“For God so loved the world, that He gave His one and only Son, that whoever believes in Him should not perish, but have eternal life. For God didn’t send His Son into the world to judge the world, but that the world should be saved through Him.” (John 3:16–17)',
    scriptureInsight: 'God’s love is demonstrated through the gift of Jesus, offering everlasting life to all who believe.',
    prompt: 'Place the words in order to complete the verse.',
    hint: 'Starts with "For God so loved the world".',
    words: ['For', 'God', 'so', 'loved', 'the', 'world', 'that', 'He', 'gave'],
    answer: 'For God so loved the world that He gave',
  },
  {
    slug: 'build-proverbs-3-5',
    title: 'Build Proverbs 3:5: Trust in the Lord',
    type: 'order',
    minutes: 4,
    eyebrow: 'Word builder',
    intro: 'Learn Solomon’s famous advice on putting wholehearted trust in God.',
    reference: 'Proverbs 3:5, WEB',
    scriptureText: '“Trust in Yahweh with all your heart, and don’t lean on your own understanding. In all your ways acknowledge Him, and He will make your paths straight.” (Proverbs 3:5–6)',
    scriptureInsight: 'Rather than worrying over what we cannot control, wholehearted trust invites God to guide our direction.',
    prompt: 'Arrange the words to build the command to trust.',
    hint: 'Trust comes first, followed by "in the Lord with all your heart".',
    words: ['Trust', 'in', 'the', 'Lord', 'with', 'all', 'your', 'heart'],
    answer: 'Trust in the Lord with all your heart',
  },
  {
    slug: 'build-philippians-4-13',
    title: 'Build Philippians 4:13: Strength through Christ',
    type: 'order',
    minutes: 4,
    eyebrow: 'Word builder',
    intro: 'Paul wrote this encouraging truth while sitting in a Roman prison.',
    reference: 'Philippians 4:13, WEB',
    scriptureText: '“I know how to be humbled, and I know also how to abound. In everything and in all things I have learned the secret both to be filled and to be hungry... I can do all things through Christ, who strengthens me.” (Philippians 4:12–13)',
    scriptureInsight: 'Christ supplies inner courage and supernatural endurance for whatever challenge we face.',
    prompt: 'Build Paul’s declaration of strength.',
    hint: 'Begins with "I can do all things".',
    words: ['I', 'can', 'do', 'all', 'things', 'through', 'Christ'],
    answer: 'I can do all things through Christ',
  },
  {
    slug: 'build-genesis-1-1',
    title: 'Build Genesis 1:1: In the beginning',
    type: 'order',
    minutes: 4,
    eyebrow: 'Word builder',
    intro: 'The very first sentence of the entire Bible.',
    reference: 'Genesis 1:1, WEB',
    scriptureText: '“In the beginning God created the heavens and the earth. The earth was formless and empty. Darkness was on the surface of the deep and God’s Spirit was hovering over the waters.” (Genesis 1:1–2)',
    scriptureInsight: 'All history, beauty, and life originate from God’s sovereign creative decree.',
    prompt: 'Put the opening words of Scripture in order.',
    hint: 'Begins with "In the beginning God created".',
    words: ['In', 'the', 'beginning', 'God', 'created', 'the', 'heavens'],
    answer: 'In the beginning God created the heavens',
  },
  {
    slug: 'build-matthew-5-14',
    title: 'Build Matthew 5:14: You are the light of the world',
    type: 'order',
    minutes: 4,
    eyebrow: 'Word builder',
    intro: 'Jesus tells His followers who they are in the Sermon on the Mount.',
    reference: 'Matthew 5:14, WEB',
    scriptureText: '“You are the light of the world. A city located on a hill can’t be hidden. Neither do you light a lamp, and put it under a measuring basket, but on a stand; and it shines to all who are in the house. Even so, let your light shine before men, that they may see your good works, and glorify your Father who is in heaven.” (Matthew 5:14–16)',
    scriptureInsight: 'Jesus calls His disciples to shine with kindness, truth, and love so others may see God’s goodness.',
    prompt: 'Build the call to let your light shine.',
    hint: 'Starts with "You are the light".',
    words: ['You', 'are', 'the', 'light', 'of', 'the', 'world'],
    answer: 'You are the light of the world',
  },
  {
    slug: 'kind-choice-at-lunch',
    title: 'Decision lab: A kind choice at lunch',
    type: 'choice',
    minutes: 6,
    eyebrow: 'Decision story',
    intro: 'Someone new is sitting alone at lunch. Your friends are busy talking. What could kindness look like?',
    reference: 'Luke 6:31',
    scriptureText: '“As you would like people to do to you, do also to them likewise. If you love those who love you, what credit is that to you? For even sinners love those who love them... But love your enemies, and do good, and lend, expecting nothing back; and your reward will be great.” (Luke 6:31–35)',
    scriptureInsight: 'The Golden Rule calls us to treat others with the warm hospitality and inclusion we desire for ourselves.',
    prompt: 'Choose the response that treats the new student as you would want to be treated.',
    hint: 'Kindness notices someone and gives them a safe way to join.',
    options: ['Invite them to sit with you and introduce them', 'Point them out and giggle with friends', 'Wait for someone else to step in'],
    answer: 'Invite them to sit with you and introduce them',
  },
  {
    slug: 'truth-on-the-playground',
    title: 'Decision lab: Standing up for a friend',
    type: 'choice',
    minutes: 6,
    eyebrow: 'Decision story',
    intro: 'A group of classmates starts teasing a younger student on the playground.',
    reference: 'Proverbs 31:8–9',
    scriptureText: '“Open your mouth for the mute, in the cause of all who are appointed to destruction. Open your mouth, judge righteously, and defend the rights of the poor and needy.” (Proverbs 31:8–9)',
    scriptureInsight: 'God urges us to use our voice and influence to stand beside those who cannot defend themselves.',
    prompt: 'What is the brave, Christ-like choice when you see someone being mistreated?',
    hint: 'Speak up for those who cannot speak for themselves.',
    options: ['Step in kindly or get a trusted teacher right away', 'Join in the teasing so you fit in', 'Walk away and pretend you saw nothing'],
    answer: 'Step in kindly or get a trusted teacher right away',
  },
  {
    slug: 'screen-time-and-honesty',
    title: 'Decision lab: The honesty check at home',
    type: 'choice',
    minutes: 5,
    eyebrow: 'Decision story',
    intro: 'Your parents asked you to turn off games after 30 minutes. The timer rings, but you are right at the exciting boss battle.',
    reference: 'Colossians 3:20',
    scriptureText: '“Children, obey your parents in all things, for this pleases the Lord. Fathers, don’t provoke your children, so that they won’t be discouraged. Servants, obey in all things those who are your masters... doing it with singleness of heart, fearing God.” (Colossians 3:20–22)',
    scriptureInsight: 'Integrity means honoring our word and respecting our parents even in small, private moments.',
    prompt: 'What does integrity look like in this quiet moment when no one is watching?',
    hint: 'Integrity is choosing what is right even when nobody sees.',
    options: ['Save your game and turn it off as promised', 'Hide the tablet under a pillow and keep playing', 'Reset the timer so it looks like time is left'],
    answer: 'Save your game and turn it off as promised',
  },
  {
    slug: 'samuel-listens',
    title: 'Trail game: Samuel listens in the temple',
    type: 'match',
    minutes: 7,
    eyebrow: 'Listening trail',
    intro: 'Match each moment in Samuel’s story with what it teaches us about listening to God.',
    reference: '1 Samuel 3:1–10',
    scriptureText: 'Yahweh called Samuel; and he said, “Here I am.” He ran to Eli, and said, “Here I am; for you called me.” Eli said, “I didn’t call; lie down again.”\n\nEli perceived that Yahweh was calling the child. Therefore Eli said to Samuel, “Go, lie down; and it shall be, if He calls you, that you shall say, ‘Speak, Yahweh; for your servant hears.’”\n\nYahweh came, and stood, and called as at other times, “Samuel! Samuel!” Then Samuel said, “Speak; for your servant hears.”',
    scriptureInsight: 'Cultivating a listening posture allows us to recognise God’s voice and respond with humble readiness.',
    prompt: 'Choose the right lesson for each story moment.',
    hint: 'Each lesson pairs with one key step of Samuel’s discovery.',
    pairs: [
      ['Samuel hears his name in the dark', 'Pay attention with quiet ears'],
      ['Samuel runs to Eli for guidance', 'Ask a trusted elder for counsel'],
      ['Samuel replies: “Speak, Lord”', 'Be humble and ready to obey'],
    ],
  },
  {
    slug: 'matching-fruits-of-the-spirit',
    title: 'Match quest: Fruit of the Spirit in action',
    type: 'match',
    minutes: 6,
    eyebrow: 'Matching quest',
    intro: 'Paul lists the beautiful character traits grown by the Holy Spirit. Match each fruit to real life!',
    reference: 'Galatians 5:22–23',
    scriptureText: '“The fruit of the Spirit is love, joy, peace, patience, kindness, goodness, faithfulness, gentleness, and self-control. Against such things there is no law. Those who belong to Christ have crucified the flesh with its passions and lusts. If we live by the Spirit, let’s also walk by the Spirit.” (Galatians 5:22–25)',
    scriptureInsight: 'The Holy Spirit produces real, Christ-like character in our day-to-day relationships.',
    prompt: 'Match each Fruit of the Spirit to its everyday example.',
    hint: 'Think of how each quality expresses love toward others.',
    pairs: [
      ['Patience', 'Waiting calmly when someone is slow'],
      ['Gentleness', 'Speaking with soft words when upset'],
      ['Self-control', 'Stopping yourself from taking the last cookie'],
    ],
  },
  {
    slug: 'matching-armor-of-god',
    title: 'Match quest: The Armor of God pieces',
    type: 'match',
    minutes: 7,
    eyebrow: 'Matching quest',
    intro: 'Paul describes Roman armour to show how God equips us for spiritual battles.',
    reference: 'Ephesians 6:10–18',
    scriptureText: '“Put on the whole armour of God, that you may be able to stand against the wiles of the devil... Stand therefore, having the belt of truth buckled around your waist, and having put on the breastplate of righteousness... taking the shield of faith, with which you will be able to quench all the fiery darts of the evil one. And take the helmet of salvation, and the sword of the Spirit, which is the word of God.” (Ephesians 6:11–17)',
    scriptureInsight: 'God provides spiritual protection: truth, righteousness, faith, and Scripture to guard our hearts.',
    prompt: 'Match each armour piece to its spiritual truth.',
    hint: 'Review Ephesians 6: Belt of truth, Shield of faith, Helmet of salvation.',
    pairs: [
      ['Shield', 'Faith that extinguishes doubt'],
      ['Belt', 'Truth that holds everything together'],
      ['Helmet', 'Salvation protecting our thoughts'],
    ],
  },
  {
    slug: 'what-did-ruth-notice',
    title: 'Quick quiz: Ruth’s steadfast loyalty',
    type: 'choice',
    minutes: 3,
    eyebrow: 'Quick quiz',
    intro: 'Ruth chose to stay with Naomi when Naomi was grieving and returning home to Bethlehem.',
    reference: 'Ruth 1:16–18',
    scriptureText: 'Ruth said, “Don’t urge me to leave you, and to return from following you, for where you go, I will go; and where you stay, I will stay. Your people will be my people, and your God my God. Where you die, I will die, and there I will be buried. May Yahweh do so to me, and more also, if anything but death parts you and me.”\n\nWhen Naomi saw that she was determined to go with her, she stopped urging her.',
    scriptureInsight: 'Ruth exemplifies covenant love (chesed)—loyal commitment that walks faithfully through adversity.',
    prompt: 'What does Ruth’s famous statement "Where you go, I will go" teach us?',
    hint: 'Ruth stayed close when leaving would have been the easy path.',
    options: ['Covenant loyalty stays through difficult times', 'Only fun friendships are worth keeping', 'Never travel to new places'],
    answer: 'Covenant loyalty stays through difficult times',
  },
  {
    slug: 'miracles-of-jesus-quiz',
    title: 'Quick quiz: Signs and wonders of Jesus',
    type: 'choice',
    minutes: 4,
    eyebrow: 'Quick quiz',
    intro: 'Throughout Galilee, Jesus showed the power and compassion of God’s Kingdom.',
    reference: 'John 20:30–31',
    scriptureText: '“Jesus did many other signs in the presence of His disciples, which are not written in this book. But these are written, that you may believe that Jesus is the Christ, the Son of God, and that believing you may have life in His name.” (John 20:30–31)',
    scriptureInsight: 'The miracles of Jesus are not mere wonders; they are signs pointing to Jesus as God’s true Son and our Savior.',
    prompt: 'Why did John say these miracle stories were written down for us?',
    hint: 'John 20:31 says so that you may believe Jesus is the Christ, the Son of God.',
    options: ['So we may believe that Jesus is the Son of God', 'Just for entertainment on long journeys', 'To teach people how to do magic tricks'],
    answer: 'So we may believe that Jesus is the Son of God',
  },

  // ── 3. MAKE SOMETHING (Creative crafts & reflections) ────────
  {
    slug: 'make-a-courage-card',
    title: 'Make a courage card for a hard day',
    type: 'reflect',
    minutes: 10,
    eyebrow: 'Create & Reflect',
    intro: 'Write a short reminder you can read when something good feels difficult.',
    reference: 'Joshua 1:9',
    scriptureText: '“Haven’t I commanded you? Be strong and courageous. Don’t be afraid. Don’t be dismayed, for Yahweh your God is with you wherever you go.” (Joshua 1:9)',
    scriptureInsight: 'Our courage does not come from lack of fear, but from the certainty of God’s constant presence.',
    prompt: 'Finish this sentence: “With God’s help, I can be brave when…”',
    hint: 'Think of one real moment at home, school, church, or with a friend where you need courage.',
  },
  {
    slug: 'gratitude-prayer-journal',
    title: 'Write a 3-count praise journal',
    type: 'reflect',
    minutes: 8,
    eyebrow: 'Prayer Craft',
    intro: 'Gratitude turns what we have into enough. Write down three specific things you thank God for today.',
    reference: 'Psalm 100:4–5',
    scriptureText: '“Enter into His gates with thanksgiving, and into His courts with praise. Give thanks to Him, and bless His name. For Yahweh is good. His loving kindness endures forever, His faithfulness to all generations.” (Psalm 100:4–5)',
    scriptureInsight: 'Praise opens our eyes to see God’s steady kindness in every season of life.',
    prompt: 'Write your 3 praises: “Today, Lord, I thank you for: 1... 2... 3...”',
    hint: 'Name one person, one little blessing in nature, and one thing God did for you.',
  },
  {
    slug: 'blessing-note-for-a-friend',
    title: 'Craft an encouraging message for someone',
    type: 'reflect',
    minutes: 8,
    eyebrow: 'Kindness Craft',
    intro: 'Proverbs 16:24 says gracious words are like a honeycomb — sweetness to the soul.',
    reference: 'Proverbs 16:24',
    scriptureText: '“Pleasant words are a honeycomb, sweet to the soul, and health to the bones. There is a way which seems right to a man, but in the end it leads to death.” (Proverbs 16:24–25)',
    scriptureInsight: 'Gentle, uplifting words bring healing, life, and encouragement to everyone who hears them.',
    prompt: 'Write an encouraging note for a friend, brother, sister, or parent who needs a smile.',
    hint: 'Tell them something you appreciate about who they are.',
  },
  {
    slug: 'prayer-for-my-family',
    title: 'A blessing prayer for your family',
    type: 'reflect',
    minutes: 7,
    eyebrow: 'Family Prayer',
    intro: 'Bring your home, parents, and siblings before the Lord in a simple, heartfelt prayer.',
    reference: 'Numbers 6:24–26',
    scriptureText: '“Yahweh bless you, and keep you. Yahweh make His face to shine on you, and be gracious to you. Yahweh lift up His face toward you, and give you peace.” (Numbers 6:24–26)',
    scriptureInsight: 'The Aaronic blessing places God’s favor, protection, and deep peace upon our family.',
    prompt: 'Write a prayer asking God to protect and bless your family this week.',
    hint: 'You can ask for peace, kindness to one another, and strength in your home.',
  },
  {
    slug: 'psalm-23-shepherd-journal',
    title: 'Psalm 23: Walking in green pastures',
    type: 'reflect',
    minutes: 8,
    eyebrow: 'Shepherd Reflection',
    intro: 'The Lord is my shepherd; I lack nothing. He makes me lie down in green pastures.',
    reference: 'Psalm 23:1–6',
    scriptureText: '“Yahweh is my shepherd: I shall lack nothing. He makes me lie down in green pastures. He leads me beside still waters. He restores my soul. He guides me in the paths of righteousness for His name’s sake. Even though I walk through the valley of the shadow of death, I will fear no evil, for You are with me. Your rod and your staff, they comfort me.” (Psalm 23:1–4)',
    scriptureInsight: 'In quiet pastures or dark valleys, the Good Shepherd walks right beside us with comfort and protection.',
    prompt: 'Write about a time you felt God giving you peace when you were worried.',
    hint: 'What reminder helped you know the Good Shepherd was close beside you?',
  },
  {
    slug: 'resurrection-morning-light',
    title: 'Sunday dawn: A song of hope',
    type: 'reflect',
    minutes: 9,
    eyebrow: 'Easter Reflection',
    intro: 'Early on the first day of the week, while it was still dark, Mary found the stone rolled away and heard Jesus call her name.',
    reference: 'John 20:1–18',
    scriptureText: 'Now on the first day of the week, Mary Magdalene came early, while it was still dark, to the tomb, and saw the stone taken away from the tomb... Jesus said to her, “Mary.” She turned and said to Him in Hebrew, “Rabboni!” which is to say, “Teacher!”... Mary Magdalene came and told the disciples, “I have seen the Lord!” and that He had said these things to her.',
    scriptureInsight: 'Because Jesus is alive, despair is defeated and we have a living hope for every tomorrow.',
    prompt: 'Write what hope means to you knowing that Jesus is alive today.',
    hint: 'Because He lives, we can face tomorrow with joy and peace.',
  },
];

function getSlug() {
  return typeof window === 'undefined' ? activities[0].slug : new URLSearchParams(window.location.search).get('activity') || activities[0].slug;
}

function moduleLessonSlug(moduleId: string, index: number) {
  return `mod__${moduleId}__${index}`;
}

function buildModuleActivities(module: CurriculumModule): Activity[] {
  return getModuleLessons(module).map((lesson, index) => ({
    slug: moduleLessonSlug(module.id, index),
    title: lesson.title,
    type: lesson.type,
    minutes: lesson.minutes,
    eyebrow: lesson.eyebrow,
    intro: lesson.intro,
    reference: lesson.reference,
    scriptureText: lesson.scriptureText,
    scriptureInsight: lesson.scriptureInsight,
    prompt: lesson.prompt,
    hint: lesson.hint,
    options: lesson.options,
    answer: lesson.answer,
  }));
}

export default function LearnPage() {
  const [slug, setSlug] = useState(activities[0].slug);
  const [moduleId, setModuleId] = useState<string | null>(null);
  const [chosen, setChosen] = useState('');
  const [ordered, setOrdered] = useState<string[]>([]);
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [reflection, setReflection] = useState('');
  const [feedback, setFeedback] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [showScriptureModal, setShowScriptureModal] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [done, setDone] = useState(false);
  const [teen, setTeen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingTarget, setSpeakingTarget] = useState<'lesson' | 'passage' | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Stop speech when component unmounts
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  function stopAudio() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setSpeakingTarget(null);
  }

  function closeScriptureModal() {
    if (speakingTarget === 'passage') stopAudio();
    setShowScriptureModal(false);
  }

  function toggleSpeech(textToRead: string, target: 'lesson' | 'passage') {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Audio narration is not supported on this browser.');
      return;
    }
    if (isSpeaking && speakingTarget === target) {
      stopAudio();
      return;
    }
    window.speechSynthesis.cancel();
    const cleanText = textToRead.replace(/[—_]/g, ' ').replace(/\n+/g, '. ');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.9;
    utterance.pitch = 1.05;

    // Pick a high quality British English voice if available (excluding legacy compact voices)
    const rawVoices = window.speechSynthesis.getVoices();
    const legacyRobotic = ['victoria', 'agnes', 'kathy', 'princess', 'vicki', 'compact', 'bad news', 'bahh', 'bells', 'fred'];
    const voices = rawVoices.filter((v) => !legacyRobotic.some((l) => v.name.toLowerCase().includes(l)));
    const candidateList = voices.length > 0 ? voices : rawVoices;

    const friendlyVoice =
      candidateList.find(
        (v) =>
          (v.lang.toLowerCase().includes('gb') || v.lang.toLowerCase().includes('uk')) &&
          (v.name.includes('Serena') ||
            v.name.includes('Kate') ||
            v.name.includes('Martha') ||
            v.name.includes('Google UK English Female') ||
            v.name.includes('Stephanie') ||
            v.name.includes('Natural') ||
            v.name.includes('Google'))
      ) ||
      candidateList.find((v) => v.lang.toLowerCase().includes('gb') || v.lang.toLowerCase().includes('uk')) ||
      candidateList.find((v) => v.lang.startsWith('en'));
    if (friendlyVoice) utterance.voice = friendlyVoice;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setSpeakingTarget(target);
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      setSpeakingTarget(null);
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setSpeakingTarget(null);
    };
    window.speechSynthesis.speak(utterance);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const modParam = params.get('module');
      const foundModule = modParam ? curriculumModules.find((m) => m.id === modParam) : undefined;

      if (foundModule) {
        setModuleId(foundModule.id);
        const lessons = buildModuleActivities(foundModule);
        const lessonParam = params.get('lesson');
        let startIndex = lessonParam ? Number(lessonParam) : 0;
        if (!lessonParam && hasActiveSession()) {
          try {
            const activeChildId = readActiveProfile().id;
            const progressMap = JSON.parse(localStorage.getItem('lanternLionModuleProgress') || '{}');
            const saved = progressMap?.[activeChildId]?.[foundModule.id];
            if (saved && typeof saved.lastCompletedIndex === 'number' && saved.lastCompletedIndex >= 0) {
              startIndex = saved.lastCompletedIndex + 1;
            }
          } catch { /* Start from the first lesson. */ }
        }
        startIndex = Math.min(Math.max(startIndex, 0), lessons.length - 1);
        setSlug(lessons[startIndex]?.slug || lessons[0].slug);
      } else {
        setModuleId(null);
        setSlug(getSlug());
      }
      try {
        setTeen(readActiveProfile().kind === 'teen');
      } catch { /* Use the younger reading level. */ }
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!showScriptureModal) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowScriptureModal(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [showScriptureModal]);

  const curriculumModule = useMemo(() => (moduleId ? curriculumModules.find((m) => m.id === moduleId) : undefined), [moduleId]);
  const moduleActivities = useMemo(() => (curriculumModule ? buildModuleActivities(curriculumModule) : []), [curriculumModule]);
  const moduleMode = Boolean(curriculumModule);
  const activeList = moduleMode ? moduleActivities : activities;

  const activity = useMemo(() => activeList.find((item) => item.slug === slug) || activeList[0], [slug, activeList]);
  const bank = activity.words?.filter((word) => !ordered.includes(word)) || [];

  function reset(nextSlug = activity.slug) {
    stopAudio();
    setSlug(nextSlug);
    setChosen('');
    setOrdered([]);
    setMatches({});
    setReflection('');
    setFeedback('');
    setShowHint(false);
    setShowScriptureModal(false);
    setAttempts(0);
    setDone(false);
    if (curriculumModule) {
      const index = Math.max(moduleActivities.findIndex((item) => item.slug === nextSlug), 0);
      window.history.replaceState(null, '', `/learn?module=${curriculumModule.id}&lesson=${index}`);
    } else {
      window.history.replaceState(null, '', `/learn?activity=${nextSlug}`);
    }
  }

  function finish() {
    let correct = false;
    if (activity.type === 'story' || activity.type === 'choice') correct = chosen === activity.answer;
    if (activity.type === 'order') correct = ordered.join(' ') === activity.answer;
    if (activity.type === 'match') correct = Boolean(activity.pairs?.every(([moment, lesson]) => matches[moment] === lesson));
    if (activity.type === 'reflect') correct = reflection.trim().length >= 12;
    setAttempts((value) => value + 1);
    if (!correct) {
      setFeedback(activity.type === 'reflect' ? 'That is a good start. Add a little more so future you remembers the moment.' : 'Not quite yet, and that’s okay. Your choices have been reset so you can try a new answer.');
      if (activity.type === 'story' || activity.type === 'choice') setChosen('');
      if (activity.type === 'order') setOrdered([]);
      if (activity.type === 'match') setMatches({});
      return;
    }
    // Only persist progress for an actual signed-in child/teen. Without this,
    // a signed-out visitor (or a stale `lanternLionActiveChildId` cursor left
    // over from a previous session on this device) would have their activity
    // silently written under someone else's profile — the same cross-account
    // leak class of bug fixed elsewhere via readActiveProfile()/hasActiveSession().
    // Teacher/parent "preview an activity" links intentionally reach this page
    // with no session; the activity still completes for them, it just isn't saved.
    if (hasActiveSession()) {
      const activeProfile = readActiveProfile();
      const activeId = activeProfile.id;
      const childName = activeProfile.name;

      const saved = JSON.parse(localStorage.getItem('lanternLionDemoProgress') || '[]');
      const next = Array.from(new Set([...(Array.isArray(saved) ? saved : []), activity.title]));
      localStorage.setItem('lanternLionDemoProgress', JSON.stringify(next));

      // Per-child progress map
      const childProgressMap = JSON.parse(localStorage.getItem('lanternLionChildProgressMap') || '{}');
      const currentChildProgress = childProgressMap[activeId] || [];
      childProgressMap[activeId] = Array.from(new Set([...currentChildProgress, activity.title]));
      localStorage.setItem('lanternLionChildProgressMap', JSON.stringify(childProgressMap));

      // Log this activity entry into recent learning activity log
      const activityLog = JSON.parse(localStorage.getItem('lanternLionChildActivityLog') || '[]');
      const nextLogId = Number(activityLog[0]?.id || 0) + 1;
      const newEntry = {
        id: nextLogId,
        childId: activeId,
        childName,
        title: activity.title,
        type: activity.type === 'story' ? 'Story' : activity.type === 'order' ? 'Word game' : activity.type === 'choice' ? 'Decision lab' : activity.type === 'match' ? 'Matching quest' : 'Creative reflection',
        reference: activity.reference,
        attempts: attempts + 1,
        time: 'Just now',
      };
      const updatedLog = [newEntry, ...activityLog.filter((item: { title: string; childId: number }) => !(item.title === activity.title && item.childId === activeId))].slice(0, 20);
      localStorage.setItem('lanternLionChildActivityLog', JSON.stringify(updatedLog));

      if (curriculumModule) {
        const lessonIndex = moduleActivities.findIndex((item) => item.slug === activity.slug);
        const progressMap = JSON.parse(localStorage.getItem('lanternLionModuleProgress') || '{}');
        const childProgress = progressMap[activeId] || {};
        const moduleProgress = childProgress[curriculumModule.id] || { completedIndices: [], lastCompletedIndex: -1 };
        const completedIndices: number[] = Array.from(new Set([...(moduleProgress.completedIndices || []), lessonIndex]));
        progressMap[activeId] = {
          ...childProgress,
          [curriculumModule.id]: { completedIndices, lastCompletedIndex: Math.max(moduleProgress.lastCompletedIndex ?? -1, lessonIndex) },
        };
        localStorage.setItem('lanternLionModuleProgress', JSON.stringify(progressMap));
      }
    }

    setFeedback('You found it. Take a moment to remember what made the answer true.');
    setDone(true);
  }

  const nextIndex = (activeList.findIndex((item) => item.slug === activity.slug) + 1) % activeList.length;
  const currentLessonIndex = moduleActivities.findIndex((item) => item.slug === activity.slug);
  const isLastModuleLesson = moduleMode && currentLessonIndex === moduleActivities.length - 1;
  const nextModule = curriculumModule ? getNextModuleInTrack(curriculumModule) : undefined;
  const canCheck = activity.type === 'reflect' ? reflection.trim().length > 0 : activity.type === 'order' ? ordered.length === activity.words?.length : activity.type === 'match' ? Object.keys(matches).length === activity.pairs?.length : Boolean(chosen);

  if (!hydrated) return <main className="dashboard-loading"><span></span><p>Opening the lesson…</p></main>;

  return (
    <main className="learning-page">
      <header className="learning-topbar">
        <Link href={moduleMode ? '/curriculum' : '/child-dashboard'}>
          <Image src="/lantern-lion-logo.png" alt="" width={48} height={48} />
          <span><strong>Lantern &amp; Lion</strong><small>{moduleMode ? 'Back to curriculum' : 'Back to my path'}</small></span>
        </Link>
        <div>
          <span>{activity.minutes} min</span>
          <button
            type="button"
            className="learning-topbar-ref-btn"
            onClick={() => setShowScriptureModal(true)}
            aria-label={`Open scripture: ${activity.reference}`}
          >
            📖 {activity.reference}
          </button>
        </div>
      </header>

      <div className={`learning-shell ${moduleMode && curriculumModule?.track === 'early' ? 'learning-shell-solo' : ''}`}>
        {moduleMode ? (
          curriculumModule?.track !== 'early' && (
            <aside className="learning-map" aria-label="Lesson list">
              <p>{curriculumModule?.title}</p>
              {moduleActivities.map((item, index) => (
                <button key={item.slug} aria-current={item.slug === activity.slug ? 'step' : undefined} onClick={() => reset(item.slug)}>
                  <span>{index + 1}</span>
                  <div><strong>{item.title}</strong><small>{item.minutes} minutes</small></div>
                </button>
              ))}
            </aside>
          )
        ) : (
          <aside className="learning-map" aria-label="Activity library">
            <p>Activity path</p>
            {activities.map((item, index) => (
              <button key={item.slug} aria-current={item.slug === activity.slug ? 'step' : undefined} onClick={() => reset(item.slug)}>
                <span>{index + 1}</span>
                <div><strong>{item.title}</strong><small>{item.minutes} minutes</small></div>
              </button>
            ))}
          </aside>
        )}

        <section className="learning-stage">
          <div className="learning-progress">
            <span><i style={{ width: moduleMode ? `${((currentLessonIndex + (done ? 1 : 0.55)) / moduleActivities.length) * 100}%` : done ? '100%' : '55%' }} /></span>
            <small>
              {moduleMode
                ? `Lesson ${currentLessonIndex + 1} of ${moduleActivities.length} · ${curriculumModule?.title}`
                : done ? 'Activity complete' : 'One thoughtful step at a time'}
            </small>
          </div>

          <article className={`learning-card ${feedback && !done ? 'motion-wrong' : ''}`}>
            <p className="child-kicker">{activity.eyebrow}</p>
            <h1>{activity.title}</h1>
            <p className="learning-intro">{activity.intro}</p>
            {teen && <p className="learning-age-note">Teen reflection: look beyond the obvious answer and connect this choice to a situation you might actually face.</p>}

            {/* Learning Action Chips (Open Book + Read Aloud) */}
            <div className="learning-chip-row">
              <button
                type="button"
                className="scripture-chip scripture-chip-btn"
                onClick={() => setShowScriptureModal(true)}
                aria-haspopup="dialog"
                aria-label={`Open scripture text for ${activity.reference}`}
              >
                <span className="scripture-chip-icon">📖 Open book</span>
                <strong>{activity.reference}</strong>
                <small className="scripture-chip-badge">Tap to read Bible passage →</small>
              </button>

              <button
                type="button"
                className={`audio-narrator-btn ${isSpeaking && speakingTarget === 'lesson' ? 'speaking' : ''}`}
                onClick={() => toggleSpeech(`${activity.title}. ${activity.intro}. Question: ${activity.prompt}`, 'lesson')}
                aria-label={isSpeaking && speakingTarget === 'lesson' ? 'Stop audio narration' : 'Listen to story'}
              >
                <span className="audio-icon">{isSpeaking && speakingTarget === 'lesson' ? '⏹' : '🔊'}</span>
                <strong>{isSpeaking && speakingTarget === 'lesson' ? 'Stop audio' : 'Listen aloud'}</strong>
                {isSpeaking && speakingTarget === 'lesson' && <span className="sound-wave" aria-hidden="true"><i /><i /><i /></span>}
              </button>
            </div>

            <div className="learning-question">
              <h2>{activity.prompt}</h2>
              {(activity.type === 'story' || activity.type === 'choice') && (
                <div className="learning-options">
                  {activity.options?.map((option) => (
                    <button key={option} aria-pressed={chosen === option} onClick={() => { setChosen(option); setFeedback(''); }}>
                      <span>{chosen === option ? '✓' : String.fromCharCode(65 + activity.options!.indexOf(option))}</span>
                      {option}
                    </button>
                  ))}
                </div>
              )}
              {activity.type === 'order' && (
                <>
                  <div className="verse-answer" aria-label="Your verse">
                    {ordered.length ? ordered.map((word, index) => (
                      <button key={`${word}-${index}`} onClick={() => { setOrdered(ordered.filter((_, i) => i !== index)); setFeedback(''); }}>
                        {word}
                      </button>
                    )) : <span>Choose the first word below</span>}
                  </div>
                  <div className="verse-bank">
                    {bank.map((word, index) => (
                      <button key={`${word}-${index}`} onClick={() => { setOrdered([...ordered, word]); setFeedback(''); }}>
                        {word}
                      </button>
                    ))}
                  </div>
                </>
              )}
              {activity.type === 'match' && (
                <div className="learning-matches">
                  {activity.pairs?.map(([moment]) => (
                    <label key={moment}>
                      <span>{moment}</span>
                      <select value={matches[moment] || ''} onChange={(event) => { setMatches({ ...matches, [moment]: event.target.value }); setFeedback(''); }}>
                        <option value="">Choose a lesson</option>
                        {activity.pairs?.map(([, lesson]) => <option key={lesson}>{lesson}</option>)}
                      </select>
                    </label>
                  ))}
                </div>
              )}
              {activity.type === 'reflect' && (
                <label className="learning-reflect">
                  <span>Your courage reminder</span>
                  <textarea maxLength={240} value={reflection} onChange={(event) => { setReflection(event.target.value); setFeedback(''); }} placeholder="With God’s help, I can be brave when…" />
                  <small>{reflection.length}/240 characters. This stays on this device.</small>
                </label>
              )}
            </div>

            <div className="learning-actions">
              <button className="hint-button" aria-expanded={showHint} onClick={() => setShowHint(!showHint)}>
                Light a hint
              </button>
              <button className="button button-primary" disabled={!canCheck || done} onClick={finish}>
                {done ? 'Completed' : 'Check my answer'}
              </button>
            </div>

            {showHint && <p className="learning-hint" role="note"><strong>A little light:</strong> {activity.hint}</p>}
            {feedback && (
              <div className={done ? 'learning-feedback correct' : 'learning-feedback'} role="status">
                <span>{done ? '✓' : '↻'}</span>
                <div>
                  <strong>{done ? 'Well noticed' : 'Keep going'}</strong>
                  <p>{feedback}</p>
                </div>
              </div>
            )}
            {done && moduleMode && (
              <div className="learning-finish">
                <div>
                  <strong>+8 light points</strong>
                  <span>Saved on this device</span>
                </div>
                {!isLastModuleLesson ? (
                  <>
                    <button onClick={() => reset(moduleActivities[currentLessonIndex + 1].slug)}>
                      Continue to Lesson {currentLessonIndex + 2} of {moduleActivities.length} →
                    </button>
                    <Link href="/curriculum">Back to curriculum</Link>
                  </>
                ) : (
                  <>
                    <p className="learning-module-complete">🎉 Module complete! You finished every lesson in “{curriculumModule?.title}.”</p>
                    <Link className="button button-primary" href="/curriculum">Back to curriculum</Link>
                    {nextModule && (
                      <button onClick={() => { stopAudio(); window.location.href = `/learn?module=${nextModule.id}`; }}>
                        Try next: {nextModule.title} →
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
            {done && !moduleMode && (
              <div className="learning-finish">
                <div>
                  <strong>+8 light points</strong>
                  <span>Saved on this device</span>
                </div>
                <button onClick={() => reset(activities[nextIndex].slug)}>Try the next activity</button>
                <Link href="/child-dashboard">Return to my dashboard</Link>
              </div>
            )}
          </article>

          <p className="learning-safety">You never lose points for a wrong answer. Asking for help and trying again are both part of learning.</p>
        </section>
      </div>

      {/* ── SCRIPTURE READER MODAL ───────────────────────── */}
      {showScriptureModal && (
        <div className="help-overlay" role="presentation" onClick={closeScriptureModal}>
          <section
            className="help-dialog scripture-reader-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="scripture-dialog-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="close-help" aria-label="Close scripture passage" onClick={closeScriptureModal}>
              ×
            </button>
            <div className="scripture-modal-badge">
              <span>📖</span>
            </div>
            <p className="child-kicker">Open Bible Passage</p>
            <h2 id="scripture-dialog-title">{activity.reference}</h2>
            
            <div className="scripture-modal-header-row">
              <div className="scripture-modal-translation">World English Bible (WEB) · Child-Safe Reference</div>
            </div>

            <StudioAudioPlayer
              text={`${activity.reference}. ${activity.scriptureText}. Reflection: ${activity.scriptureInsight || ''}`}
              title={`${activity.reference} Scripture Audio`}
              subtitle="Listen with Google Cloud Studio narration"
              defaultVoiceId={teen ? 'en-GB-Journey-D' : 'en-GB-Journey-F'}
            />

            <div className="scripture-passage-box">
              {activity.scriptureText.split('\n\n').map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>

            {activity.scriptureInsight && (
              <div className="scripture-modal-insight">
                <span className="insight-badge">💡 What this teaches us</span>
                <p>{activity.scriptureInsight}</p>
              </div>
            )}

            <div className="scripture-modal-actions">
              <button className="button button-primary" onClick={closeScriptureModal}>
                Back to lesson →
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

