// Lightning Quiz — the question bank. Pure content, no game logic: every
// question is data (`QuizQuestion`), never hardcoded into a component.
// Adding a question is editing this array; adding a category is adding
// a `QuizCategory` value + entries here + a label in `QUIZ_CATEGORIES`.

import type { GameSkill } from '../types';
import type { QuizCategory, QuizQuestion } from './engine';

export const QUIZ_CATEGORIES: { id: QuizCategory; label: string; icon: string; skills: GameSkill[] }[] = [
  { id: 'characters', label: 'Bible Characters', icon: '🧑', skills: ['bible-knowledge'] },
  { id: 'stories', label: 'Bible Stories', icon: '📖', skills: ['bible-knowledge', 'critical-thinking'] },
  { id: 'places', label: 'Bible Places', icon: '🗺️', skills: ['bible-knowledge'] },
  { id: 'events', label: 'Bible Events', icon: '⛲', skills: ['bible-knowledge'] },
  { id: 'vocabulary', label: 'Bible Vocabulary', icon: '🔤', skills: ['vocabulary'] },
  { id: 'verse-knowledge', label: 'Verse Knowledge', icon: '📜', skills: ['memory', 'reading'] },
  { id: 'chronology', label: 'Chronology', icon: '⏳', skills: ['sequencing', 'critical-thinking'] },
  { id: 'who-said-it', label: 'Who Said It?', icon: '💬', skills: ['bible-knowledge', 'critical-thinking'] },
  { id: 'complete-the-verse', label: 'Complete the Verse', icon: '✍️', skills: ['memory', 'reading'] },
  { id: 'true-false', label: 'True/False', icon: '⚖️', skills: ['critical-thinking'] },
];

let seq = 0;
function q(
  category: QuizCategory,
  difficulty: QuizQuestion['difficulty'],
  prompt: string,
  choices: string[],
  correctIndex: number,
  explanation: string,
  reference?: string,
): QuizQuestion {
  const cat = QUIZ_CATEGORIES.find((c) => c.id === category)!;
  return { id: `q-${seq++}`, category, difficulty, prompt, choices, correctIndex, explanation, reference, skills: cat.skills };
}

export const QUESTION_BANK: QuizQuestion[] = [
  // ── Bible Characters ─────────────────────────────────────────
  q('characters', 'easy', 'Who built an ark to survive the flood?', ['Noah', 'Abraham', 'Moses', 'Joseph'], 0, 'Noah followed God’s instructions and built an ark for his family and the animals.', 'Genesis 6-9'),
  q('characters', 'easy', 'Who defeated the giant Goliath?', ['Samson', 'David', 'Saul', 'Joshua'], 1, 'David defeated Goliath with a sling and a stone.', '1 Samuel 17'),
  q('characters', 'medium', 'Who was sold into slavery by his own brothers?', ['Joseph', 'Benjamin', 'Reuben', 'Judah'], 0, 'Joseph’s brothers sold him to traders out of jealousy — God later used it for good.', 'Genesis 37'),
  q('characters', 'hard', 'Who was the first king of Israel?', ['David', 'Solomon', 'Saul', 'Samuel'], 2, 'Saul was anointed by Samuel as Israel’s first king.', '1 Samuel 10'),
  q('characters', 'expert', 'Which prophet was taken up to heaven in a chariot of fire?', ['Elijah', 'Elisha', 'Isaiah', 'Ezekiel'], 0, 'Elijah was taken up in a whirlwind with a chariot and horses of fire.', '2 Kings 2:11'),

  // ── Bible Stories ────────────────────────────────────────────
  q('stories', 'easy', 'What did God send after the flood as a promise to Noah?', ['A dove', 'A rainbow', 'A star', 'A cloud'], 1, 'God set a rainbow in the sky as a sign of His covenant never to flood the whole earth again.', 'Genesis 9:13'),
  q('stories', 'easy', 'Who was thrown into a den of lions but kept safe?', ['Daniel', 'Jonah', 'Joseph', 'Elijah'], 0, 'Daniel prayed faithfully and God shut the mouths of the lions.', 'Daniel 6'),
  q('stories', 'medium', 'What happened when Jonah ran from God’s call?', ['He was swallowed by a great fish', 'He was shipwrecked forever', 'He became a prophet in Egypt', 'He was captured by soldiers'], 0, 'Jonah was swallowed by a great fish and later obeyed God’s call to Nineveh.', 'Jonah 1-2'),
  q('stories', 'medium', 'How did Esther save her people?', ['She led an army', 'She spoke bravely to the king', 'She wrote a new law herself', 'She fled the kingdom'], 1, 'Esther risked her life to approach the king and expose a plot against her people.', 'Esther 4-7'),
  q('stories', 'hard', 'In the parable of the lost sheep, how many sheep did the shepherd leave to find the one?', ['10', '50', '99', '100'], 2, 'Jesus described a shepherd leaving 99 sheep to search for the one that was lost.', 'Luke 15:4'),

  // ── Bible Places ─────────────────────────────────────────────
  q('places', 'easy', 'In which city was Jesus born?', ['Nazareth', 'Bethlehem', 'Jerusalem', 'Jericho'], 1, 'Jesus was born in Bethlehem, as the prophets had foretold.', 'Micah 5:2; Luke 2'),
  q('places', 'medium', 'Which city’s walls fell after the Israelites marched around it for seven days?', ['Jericho', 'Jerusalem', 'Bethel', 'Hebron'], 0, 'Jericho’s walls collapsed after Israel marched around it as God commanded.', 'Joshua 6'),
  q('places', 'medium', 'On which mountain did Moses receive the Ten Commandments?', ['Mount Sinai', 'Mount Carmel', 'Mount Ararat', 'Mount of Olives'], 0, 'Moses met with God on Mount Sinai and received the Ten Commandments.', 'Exodus 19-20'),
  q('places', 'hard', 'Which sea did the Israelites cross on dry ground while fleeing Egypt?', ['The Dead Sea', 'The Red Sea', 'The Sea of Galilee', 'The Mediterranean Sea'], 1, 'God parted the Red Sea so Israel could cross safely.', 'Exodus 14'),
  q('places', 'expert', 'In which river was Jesus baptized by John?', ['The Nile', 'The Euphrates', 'The Jordan', 'The Tigris'], 2, 'John baptized Jesus in the Jordan River.', 'Matthew 3:13-17'),

  // ── Bible Events ─────────────────────────────────────────────
  q('events', 'easy', 'What happened on the first Christmas?', ['Jesus was born', 'Jesus was baptized', 'Jesus rose again', 'Jesus fed 5,000 people'], 0, 'Christmas celebrates the birth of Jesus in Bethlehem.', 'Luke 2'),
  q('events', 'medium', 'What event do Christians celebrate on Easter?', ['Jesus’ birth', 'Jesus’ resurrection', 'Jesus’ ascension', 'Jesus’ baptism'], 1, 'Easter celebrates Jesus rising from the dead.', 'Matthew 28'),
  q('events', 'hard', 'What happened at Pentecost?', ['The Ten Commandments were given', 'The Holy Spirit came upon the believers', 'Jerusalem’s walls were rebuilt', 'The temple was destroyed'], 1, 'At Pentecost, the Holy Spirit came with power on the early believers.', 'Acts 2'),
  q('events', 'hard', 'What miracle did Jesus perform with five loaves and two fish?', ['He turned water to wine', 'He fed a crowd of thousands', 'He walked on water', 'He calmed a storm'], 1, 'Jesus multiplied five loaves and two fish to feed a huge crowd.', 'John 6:1-14'),
  q('events', 'expert', 'What event immediately preceded Israel receiving the Ten Commandments?', ['The crossing of the Jordan', 'The Exodus from Egypt', 'The fall of Jericho', 'The building of the temple'], 1, 'God gave the Ten Commandments shortly after leading Israel out of Egypt.', 'Exodus 19-20'),

  // ── Bible Vocabulary ─────────────────────────────────────────
  q('vocabulary', 'easy', 'What is a "disciple"?', ['A follower and student of a teacher', 'A type of offering', 'A Roman soldier', 'A kind of scroll'], 0, 'A disciple is someone who follows and learns from a teacher — like Jesus’ twelve disciples.'),
  q('vocabulary', 'medium', 'What does "covenant" mean?', ['A song of praise', 'A solemn promise or agreement', 'A place of worship', 'A type of sacrifice'], 1, 'A covenant is a solemn promise — like God’s covenant with Noah, Abraham, and Israel.'),
  q('vocabulary', 'medium', 'What is a "parable"?', ['A short story that teaches a lesson', 'A list of laws', 'A type of prayer', 'A royal decree'], 0, 'Jesus often used parables — simple stories with a deeper spiritual meaning.'),
  q('vocabulary', 'hard', 'What does "redemption" mean?', ['Being punished for sin', 'Being saved or bought back from sin', 'Being sent into exile', 'Being crowned king'], 1, 'Redemption means being rescued or bought back — central to the Gospel message.'),
  q('vocabulary', 'expert', 'What is the "tabernacle"?', ['A portable tent for worship used by Israel', 'A Roman marketplace', 'A type of Psalm', 'A city in Galilee'], 0, 'The tabernacle was the sacred, portable tent where Israel worshiped God during the wilderness years.', 'Exodus 25-27'),

  // ── Verse Knowledge ──────────────────────────────────────────
  q('verse-knowledge', 'easy', 'Which book begins "In the beginning, God created the heavens and the earth"?', ['Genesis', 'Exodus', 'Psalms', 'John'], 0, 'That’s the opening line of Genesis, the first book of the Bible.', 'Genesis 1:1'),
  q('verse-knowledge', 'medium', 'Psalm 23 begins, "The Lord is my ___."', ['King', 'Shepherd', 'Judge', 'Rock'], 1, '"The Lord is my shepherd; I shall not want."', 'Psalm 23:1'),
  q('verse-knowledge', 'medium', 'Which verse says "For God so loved the world"?', ['John 3:16', 'Romans 8:28', 'Psalm 23:1', '1 Corinthians 13:4'], 0, 'John 3:16 is one of the most well-known verses summarizing the Gospel.'),
  q('verse-knowledge', 'hard', 'Which book contains the verse "I can do all things through Christ who strengthens me"?', ['Philippians', 'Romans', 'James', 'Ephesians'], 0, 'That verse is found in Paul’s letter to the Philippians.', 'Philippians 4:13'),
  q('verse-knowledge', 'expert', 'Which Old Testament book says "Your word is a lamp to my feet"?', ['Proverbs', 'Psalms', 'Isaiah', 'Job'], 1, 'That line comes from Psalm 119, a psalm celebrating God’s word.', 'Psalm 119:105'),

  // ── Chronology ───────────────────────────────────────────────
  q('chronology', 'medium', 'Which happened first?', ['The Exodus from Egypt', 'The building of Solomon’s Temple', 'The birth of Jesus', 'Pentecost'], 0, 'The Exodus came first, generations before Solomon built the temple.'),
  q('chronology', 'medium', 'Put these in order — which came first?', ['Noah and the flood', 'Abraham’s covenant with God', 'Moses and the Exodus', 'David becomes king'], 0, 'Noah’s flood happens in Genesis, well before Abraham, Moses, or David.'),
  q('chronology', 'hard', 'Which came before the other?', ['Joseph sold into slavery', 'Israel’s exodus from Egypt'], 0, 'Joseph was sold into slavery generations before Moses led the Exodus.'),
  q('chronology', 'hard', 'Which event happened last?', ['Creation', 'The flood', 'The Exodus', 'Jesus’ resurrection'], 3, 'In Bible chronology, Jesus’ resurrection comes long after creation, the flood, and the Exodus.'),
  q('chronology', 'expert', 'Which happened first: Israel’s exile to Babylon, or David becoming king?', ['David becoming king', 'The exile to Babylon'], 0, 'David reigned centuries before Israel was later exiled to Babylon.'),

  // ── Who Said It? ─────────────────────────────────────────────
  q('who-said-it', 'easy', 'Who said, "Here am I. Send me"?', ['Isaiah', 'Jeremiah', 'Moses', 'Samuel'], 0, 'Isaiah responded to God’s call with these words.', 'Isaiah 6:8'),
  q('who-said-it', 'medium', 'Who said, "Whither thou goest, I will go" to her mother-in-law?', ['Esther', 'Ruth', 'Naomi', 'Rahab'], 1, 'Ruth pledged her loyalty to Naomi with these famous words.', 'Ruth 1:16'),
  q('who-said-it', 'medium', 'Who said, "Am I my brother’s keeper?"', ['Cain', 'Abel', 'Seth', 'Adam'], 0, 'Cain said this to God after killing his brother Abel.', 'Genesis 4:9'),
  q('who-said-it', 'hard', 'Who said, "Not my will, but yours be done"?', ['Peter', 'Jesus', 'Paul', 'John the Baptist'], 1, 'Jesus prayed this in the Garden of Gethsemane before His crucifixion.', 'Luke 22:42'),
  q('who-said-it', 'expert', 'Who said, "Get behind me, Satan" to one of His own disciples?', ['Jesus', 'John the Baptist', 'Paul', 'Peter'], 0, 'Jesus said this to Peter after Peter rebuked Him for predicting His own suffering.', 'Matthew 16:23'),

  // ── Complete the Verse ───────────────────────────────────────
  q('complete-the-verse', 'easy', '"The Lord is my shepherd; I shall not ___."', ['Fear', 'Want', 'Fall', 'Wander'], 1, 'Psalm 23:1 continues, "I shall not want."', 'Psalm 23:1'),
  q('complete-the-verse', 'medium', '"Be strong and courageous... for the Lord your God is with you ___."', ['Always', 'Wherever you go', 'In the storm', 'Forever and ever'], 1, 'Joshua 1:9 continues, "wherever you go."', 'Joshua 1:9'),
  q('complete-the-verse', 'medium', '"Trust in the Lord with all your heart, and lean not on your own ___."', ['Strength', 'Understanding', 'Wisdom', 'Family'], 1, 'Proverbs 3:5 continues, "lean not on your own understanding."', 'Proverbs 3:5'),
  q('complete-the-verse', 'hard', '"For God so loved the world that he gave his one and only ___."', ['Prophet', 'Son', 'Servant', 'Angel'], 1, 'John 3:16 continues, "...that he gave his one and only Son."', 'John 3:16'),
  q('complete-the-verse', 'expert', '"And we know that in all things God works for the good of those who ___ him."', ['Obey', 'Love', 'Worship', 'Follow'], 1, 'Romans 8:28 continues, "...God works for the good of those who love him."', 'Romans 8:28'),

  // ── True/False ───────────────────────────────────────────────
  q('true-false', 'easy', 'True or False: David was a shepherd before he became king.', ['True', 'False'], 0, 'True — David tended his father’s sheep before God chose him as king.', '1 Samuel 16'),
  q('true-false', 'easy', 'True or False: Noah’s ark had three levels of animals only, no people.', ['True', 'False'], 1, 'False — Noah, his wife, his sons, and their wives were also on the ark.', 'Genesis 7:13'),
  q('true-false', 'medium', 'True or False: Moses parted the Red Sea by stretching out his staff.', ['True', 'False'], 0, 'True — Moses stretched out his hand and staff, and God drove back the sea.', 'Exodus 14:21'),
  q('true-false', 'hard', 'True or False: Solomon was known for his great wisdom.', ['True', 'False'], 0, 'True — God granted Solomon exceptional wisdom when he asked for it.', '1 Kings 3'),
  q('true-false', 'expert', 'True or False: Paul wrote his letter to the Philippians while free and traveling.', ['True', 'False'], 1, 'False — Paul wrote Philippians while imprisoned, yet it is full of joy.', 'Philippians 1:12-14'),

  // ── Expert-tier expansion (teen difficulty floor) ─────────────
  q('characters', 'expert', 'Which judge of Israel is described asking God for a fleece sign — twice?', ['Deborah', 'Gideon', 'Samson', 'Ehud'], 1, 'Gideon asked God to confirm his call twice using a wool fleece, wet then dry.', 'Judges 6:36-40'),
  q('characters', 'expert', 'Who was struck blind on the road to Damascus before becoming an apostle?', ['Barnabas', 'Silas', 'Saul (later Paul)', 'Stephen'], 2, 'Saul, a persecutor of the church, encountered the risen Jesus and was later renamed Paul.', 'Acts 9:1-19'),
  q('stories', 'expert', 'In the book of Job, who ultimately answers Job’s questions about his suffering?', ['His three friends', 'Elihu alone', 'God, out of the whirlwind', 'Job answers his own questions'], 2, 'After Job’s friends and Elihu speak, God himself finally answers Job directly.', 'Job 38:1'),
  q('stories', 'expert', 'What did Paul call the "thorn in the flesh" he asked God three times to remove?', ['A physical illness he named directly', 'A messenger of Satan sent to harass him', 'A specific enemy who persecuted him', 'He never explains what it was'], 1, 'Paul describes it as "a messenger of Satan to harass me" — God’s answer was "My grace is sufficient for you."', '2 Corinthians 12:7-9'),
  q('places', 'expert', 'On which mountain did Elijah confront the prophets of Baal?', ['Mount Sinai', 'Mount Carmel', 'Mount Horeb', 'Mount Nebo'], 1, 'Elijah’s public contest with the prophets of Baal took place on Mount Carmel.', '1 Kings 18:19-40'),
  q('places', 'expert', 'To which city did God send Jonah to preach a message of judgment?', ['Nineveh', 'Babylon', 'Tarshish', 'Damascus'], 0, 'God called Jonah to preach repentance to Nineveh, capital of Assyria.', 'Jonah 1:1-2'),
  q('events', 'expert', 'What event does Paul say Christian faith is worthless without, in 1 Corinthians 15?', ['The resurrection of Christ', 'The gift of tongues', 'The Jerusalem council', 'The Sermon on the Mount'], 0, '"If Christ has not been raised, your faith is futile," Paul argues — the resurrection is the hinge of the gospel.', '1 Corinthians 15:14-17'),
  q('events', 'expert', 'At the Jerusalem Council in Acts 15, what major question did the early church resolve?', ['Whether Gentile believers needed to follow the Mosaic law', 'Whether Paul should be an apostle', 'Where to build the first church building', 'How to divide the offering'], 0, 'The council decided Gentile believers did not need to be circumcised or keep the full Mosaic law to belong to the church.', 'Acts 15:1-29'),
  q('vocabulary', 'expert', 'What does "propitiation" mean, as used in Romans 3:25?', ['A moral example to imitate', 'The sacrifice that satisfies God’s just wrath against sin', 'A symbolic ritual with no real effect', 'A title used only for priests'], 1, 'Propitiation describes Christ’s sacrifice as what turns aside God’s righteous wrath against sin.', 'Romans 3:25'),
  q('vocabulary', 'expert', 'What does "sanctification" refer to in Christian teaching?', ['The moment of first believing', 'The final resurrection of the body', 'The ongoing process of being made holy', 'The act of being baptized'], 2, 'Sanctification is the continuing process by which a believer is made more holy after conversion.', '1 Thessalonians 4:3'),
  q('verse-knowledge', 'expert', 'Which verse says "the letter kills, but the Spirit gives life"?', ['2 Corinthians 3:6', 'Romans 7:6', 'Galatians 3:21', 'Hebrews 8:13'], 0, 'Paul contrasts the old written code with the life-giving work of the Spirit in the new covenant.', '2 Corinthians 3:6'),
  q('verse-knowledge', 'expert', 'Which book contains "faith is the assurance of things hoped for, the conviction of things not seen"?', ['Hebrews', 'Romans', 'James', '1 Peter'], 0, 'This is the definition of faith opening Hebrews 11, the "hall of faith" chapter.', 'Hebrews 11:1'),
  q('chronology', 'expert', 'Which came first: the fall of Jerusalem to Babylon, or the reign of King Josiah’s reforms?', ['Josiah’s reforms', 'The fall of Jerusalem to Babylon'], 0, 'Josiah’s reforms happened decades before Jerusalem finally fell to Babylon in 586 BC.'),
  q('chronology', 'expert', 'Which happened first: Pentecost, or the Jerusalem Council of Acts 15?', ['Pentecost', 'The Jerusalem Council'], 0, 'Pentecost (Acts 2) launched the church years before the Jerusalem Council (Acts 15) settled the Gentile-inclusion question.'),
  q('who-said-it', 'expert', 'Who said, "My grace is sufficient for you, for my power is made perfect in weakness"?', ['Paul', 'The Lord, in answer to Paul', 'Peter', 'James'], 1, 'This is God’s direct answer to Paul’s three requests to remove his thorn in the flesh.', '2 Corinthians 12:9'),
  q('who-said-it', 'expert', 'Who said, "I have fought the good fight, I have finished the race, I have kept the faith"?', ['Peter, near his death', 'Paul, near the end of his life', 'Stephen, before being stoned', 'John, in exile on Patmos'], 1, 'Paul wrote this near the end of his ministry, in his final letter to Timothy.', '2 Timothy 4:7'),
  q('complete-the-verse', 'expert', '"For by grace you have been saved through faith. And this is not your own doing; it is the ___ of God."', ['Gift', 'Reward', 'Promise', 'Law'], 0, 'Ephesians 2:8 continues, "...it is the gift of God, not a result of works."', 'Ephesians 2:8-9'),
  q('complete-the-verse', 'expert', '"Therefore, if anyone is in Christ, he is a new creation. The old has passed away; behold, the ___ has come."', ['Kingdom', 'New', 'Spirit', 'Promise'], 1, '2 Corinthians 5:17 continues, "...behold, the new has come."', '2 Corinthians 5:17'),
  q('true-false', 'expert', 'True or False: the Jerusalem Council in Acts 15 required Gentile believers to be circumcised.', ['True', 'False'], 1, 'False — the council explicitly decided Gentile believers did not need circumcision to belong to the church.', 'Acts 15:19-20'),
  q('true-false', 'expert', 'True or False: Job’s friends were ultimately commended by God for everything they said about his suffering.', ['True', 'False'], 1, 'False — God rebukes Job’s friends for not speaking rightly of him, unlike Job.', 'Job 42:7'),
];
