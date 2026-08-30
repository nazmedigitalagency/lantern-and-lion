export type Verse = { ref: string; text: string; meaning: string };

export const VERSES: Record<string, Verse> = {
  'Psalm 23:1': { ref: 'Psalm 23:1', text: 'The Lord is my shepherd; I shall not want.', meaning: 'A shepherd watches, feeds, and protects the sheep. This verse says God looks after you that closely.' },
  'Psalm 139:14': { ref: 'Psalm 139:14', text: 'I will give thanks to you, for I am fearfully and wonderfully made. Your works are wonderful. My soul knows that very well.', meaning: 'You were made on purpose, with care and detail — not by accident.' },
  'Jeremiah 29:11': { ref: 'Jeremiah 29:11', text: 'For I know the thoughts that I think toward you, says the Lord, thoughts of peace, and not of evil, to give you hope and a future.', meaning: 'God is already thinking about your good, even in seasons that feel uncertain.' },
  'Jeremiah 1:5': { ref: 'Jeremiah 1:5', text: 'Before I formed you in the belly, I knew you. Before you were born, I sanctified you.', meaning: 'You were known and set apart by God before you ever did anything — purpose came first, not performance.' },
  'Isaiah 41:10': { ref: 'Isaiah 41:10', text: 'Don’t you be afraid, for I am with you. Don’t be dismayed, for I am your God. I will strengthen you. Yes, I will help you. Yes, I will uphold you with the right hand of my righteousness.', meaning: 'Fear doesn’t mean you’re alone. God says he is right there, holding on.' },
  'Isaiah 55:8-9': { ref: 'Isaiah 55:8-9', text: '“For my thoughts are not your thoughts, neither are your ways my ways,” says the Lord. “For as the heavens are higher than the earth, so are my ways higher than your ways.”', meaning: 'When something doesn’t make sense yet, this says there’s a bigger picture even when you can’t see it.' },
  'Romans 8:38-39': { ref: 'Romans 8:38-39', text: 'For I am persuaded, that neither death, nor life, nor angels, nor principalities, nor things present, nor things to come... will be able to separate us from the love of God.', meaning: 'There is nothing you could do or feel that pushes you out of God’s love. It cannot be undone.' },
  'Romans 12:2': { ref: 'Romans 12:2', text: 'Don’t be conformed to this world, but be transformed by the renewing of your mind.', meaning: 'You’re not required to go along with the crowd just because it’s the crowd.' },
  'Romans 3:23': { ref: 'Romans 3:23', text: 'For all have sinned, and fall short of the glory of God.', meaning: 'Nobody is the exception — everyone gets things wrong sometimes, which means you’re not uniquely broken.' },
  'Romans 6:23': { ref: 'Romans 6:23', text: 'For the wages of sin is death, but the free gift of God is eternal life in Christ Jesus our Lord.', meaning: 'What sin earns and what God freely gives are pictured as opposites — a debt versus a gift.' },
  '1 Peter 5:7': { ref: '1 Peter 5:7', text: 'Casting all your worries on him, because he cares for you.', meaning: 'God isn’t too busy for your worries. He genuinely wants you to hand them to him.' },
  '1 Peter 5:8': { ref: '1 Peter 5:8', text: 'Be sober and self-controlled. Be watchful. Your adversary the devil, walks around like a roaring lion, seeking whom he may devour.', meaning: 'A call to stay alert, not fearful — noticing danger instead of wandering into it.' },
  'Philippians 4:6-7': { ref: 'Philippians 4:6-7', text: 'In nothing be anxious, but in everything, by prayer and petition with thanksgiving, let your requests be made known to God. And the peace of God... will guard your hearts and your thoughts.', meaning: 'Prayer isn’t a formula, it’s honesty with God — and it can bring a peace that doesn’t fully make sense.' },
  'Philippians 4:13': { ref: 'Philippians 4:13', text: 'I can do all things through Christ, who strengthens me.', meaning: 'Not that everything will be easy, but that you’re not doing hard things on your own strength alone.' },
  'Joshua 1:9': { ref: 'Joshua 1:9', text: 'Haven’t I commanded you? Be strong and courageous. Don’t be afraid. Don’t be dismayed, for the Lord your God is with you wherever you go.', meaning: 'Courage here isn’t about feeling brave. It’s about moving forward knowing God goes with you.' },
  'Psalm 34:18': { ref: 'Psalm 34:18', text: 'The Lord is near to those who have a broken heart, and saves those who have a crushed spirit.', meaning: 'God doesn’t stay distant when you’re hurting. He moves closer, not further away.' },
  'Matthew 11:28': { ref: 'Matthew 11:28', text: 'Come to me, all you who labor and are heavily burdened, and I will give you rest.', meaning: 'Jesus doesn’t ask you to have it all together before coming to him. Come tired. Come as you are.' },
  'Matthew 6:9-13': { ref: 'Matthew 6:9-13', text: '“Our Father in heaven, may your name be kept holy... Give us today our daily bread. Forgive us our debts, as we also forgive our debtors...”', meaning: 'Jesus’ own example of how to pray — simple, honest, and covering thanks, needs, and forgiveness.' },
  'Matthew 6:34': { ref: 'Matthew 6:34', text: 'Therefore don’t be anxious for tomorrow, for tomorrow will be anxious for itself. Each day’s own evil is sufficient.', meaning: 'Permission to deal with today, and let tomorrow’s worries wait for tomorrow.' },
  'Matthew 18:20': { ref: 'Matthew 18:20', text: 'For where two or three are gathered together in my name, there I am in their midst.', meaning: 'Church isn’t only a building — it’s people gathering, and God present in that.' },
  'Matthew 18:21-22': { ref: 'Matthew 18:21-22', text: 'Then Peter... said, “Lord, how often shall my brother sin against me, and I forgive him? Until seven times?” Jesus said... “Until seventy times seven.”', meaning: 'Not a literal count — it means forgiveness isn’t something you run out of after one try.' },
  'John 3:16': { ref: 'John 3:16', text: 'For God so loved the world, that he gave his one and only Son, that whoever believes in him should not perish, but have eternal life.', meaning: 'The scale of God’s love is shown by what he gave for it — everything.' },
  'John 14:6': { ref: 'John 14:6', text: 'Jesus said to him, “I am the way, the truth, and the life. No one comes to the Father, except through me.”', meaning: 'Jesus described himself not just as a teacher pointing the way, but as the way itself.' },
  'John 14:2-3': { ref: 'John 14:2-3', text: '“In my Father’s house are many homes... I am going to prepare a place for you... I will come again, and will receive you to myself.”', meaning: 'Jesus talks about death and heaven as him personally preparing somewhere for the people he loves.' },
  '1 John 1:9': { ref: '1 John 1:9', text: 'If we confess our sins, he is faithful and righteous to forgive us the sins, and to cleanse us from all unrighteousness.', meaning: 'Confessing isn’t risky with God — it’s described as the very thing that leads to forgiveness.' },
  '1 John 4:18': { ref: '1 John 4:18', text: 'There is no fear in love; but perfect love casts out fear... He who fears is not made perfect in love.', meaning: 'The more you know how loved you actually are, the less power fear has over you.' },
  '1 Corinthians 15:55': { ref: '1 Corinthians 15:55', text: '“Death, where is your sting? Hades, where is your victory?”', meaning: 'Written almost like a taunt — death is treated as something that has already lost.' },
  '1 Corinthians 15:33': { ref: '1 Corinthians 15:33', text: 'Don’t be deceived! “Evil companionships corrupt good morals.”', meaning: 'Who you spend time with genuinely shapes who you become — worth choosing carefully.' },
  '1 Corinthians 10:23': { ref: '1 Corinthians 10:23', text: '“All things are lawful for me,” but not all things are profitable. “All things are lawful for me,” but not all things build up.', meaning: 'Not everything that’s allowed is actually good for you — worth asking what something is building or wearing down.' },
  '1 Corinthians 13:4-7': { ref: '1 Corinthians 13:4-7', text: 'Love is patient and is kind; love doesn’t envy... bears all things, believes all things, hopes all things, endures all things.', meaning: 'A working definition of real love — useful for checking both how you’re treated and how you treat others.' },
  'Proverbs 3:5-6': { ref: 'Proverbs 3:5-6', text: 'Trust in the Lord with all your heart, and don’t lean on your own understanding. In all your ways acknowledge him, and he will make your paths straight.', meaning: 'You don’t have to have every answer figured out yourself before trusting God with it.' },
  'Proverbs 1:8': { ref: 'Proverbs 1:8', text: 'My son, listen to your father’s instruction, and don’t forsake your mother’s teaching.', meaning: 'Taking a parent’s guidance seriously is treated here as wisdom, not just obligation.' },
  'Proverbs 4:23': { ref: 'Proverbs 4:23', text: 'Guard your heart with all diligence, for out of it is the wellspring of life.', meaning: 'What you let into your mind and heart shapes everything that flows out of you — worth guarding on purpose.' },
  'Proverbs 11:1': { ref: 'Proverbs 11:1', text: 'A false balance is an abomination to the Lord, but accurate weights are his delight.', meaning: 'Even ancient marketplace cheating — rigged scales — is called out. God cares about fairness in the small, unseen details.' },
  'Proverbs 11:13': { ref: 'Proverbs 11:13', text: 'One who brings gossip betrays a confidence, but one who is trustworthy keeps a secret.', meaning: 'Being someone others can trust with private things is treated as real character, not a small thing.' },
  'Proverbs 12:19': { ref: 'Proverbs 12:19', text: 'Truth’s lips will be established forever, but a lying tongue is only momentary.', meaning: 'A lie might work for a moment. The truth is what actually lasts.' },
  'Proverbs 12:22': { ref: 'Proverbs 12:22', text: 'Lying lips are an abomination to the Lord, but those who do the truth are his delight.', meaning: 'This is direct: God isn’t neutral about lying. Truthfulness is described as something that delights him.' },
  'Proverbs 15:1': { ref: 'Proverbs 15:1', text: 'A gentle answer turns away wrath, but a harsh word stirs up anger.', meaning: 'How you respond in a heated moment can either cool things down or make them worse — you get to choose which.' },
  'Proverbs 16:28': { ref: 'Proverbs 16:28', text: 'A perverse man stirs up strife. A whisperer separates close friends.', meaning: 'Gossip is pictured here doing real damage — quietly pulling friendships apart.' },
  'Proverbs 17:17': { ref: 'Proverbs 17:17', text: 'A friend loves at all times.', meaning: 'Real friendship doesn’t disappear when things get hard — that’s actually when it matters most.' },
  'Proverbs 21:6': { ref: 'Proverbs 21:6', text: 'Getting treasures by a lying tongue is a fleeting vapor for those who seek death.', meaning: 'Winning something through dishonesty — like cheating — is described as something that doesn’t actually last.' },
  'Proverbs 27:17': { ref: 'Proverbs 27:17', text: 'Iron sharpens iron; so a man sharpens his friend’s countenance.', meaning: 'The right friends make you better, not just more comfortable.' },
  'Proverbs 28:13': { ref: 'Proverbs 28:13', text: 'He who conceals his sins doesn’t prosper, but whoever confesses and renounces them finds mercy.', meaning: 'Hiding what you did wrong tends to make it heavier. Owning it honestly is what actually leads somewhere good.' },
  'Proverbs 31:8-9': { ref: 'Proverbs 31:8-9', text: 'Open your mouth for the mute, in the cause of all who are left desolate. Open your mouth, judge righteously, and serve justice to the poor and needy.', meaning: 'Speaking up for someone who can’t speak up for themselves is described here as a duty, not an option.' },
  'Ephesians 2:10': { ref: 'Ephesians 2:10', text: 'For we are his workmanship, created in Christ Jesus for good works, which God prepared before that we would walk in them.', meaning: 'You weren’t made as filler. There’s purpose built into who you are.' },
  'Ephesians 4:25': { ref: 'Ephesians 4:25', text: 'Therefore, putting away falsehood, speak truth each one with his neighbor, for we are members of one another.', meaning: 'Truth-telling is described here as part of how people who belong to each other actually treat one another.' },
  'Ephesians 4:26': { ref: 'Ephesians 4:26', text: 'Be angry, and don’t sin. Don’t let the sun go down on your wrath.', meaning: 'Feeling angry isn’t forbidden — staying angry and letting it fester is the part to watch.' },
  'Ephesians 4:29': { ref: 'Ephesians 4:29', text: 'Let no corrupt speech proceed out of your mouth, but such as is good for building up... that it may give grace to those who hear.', meaning: 'A useful test for words before you say them: does this build someone up, or tear them down?' },
  'Ephesians 5:15-16': { ref: 'Ephesians 5:15-16', text: 'Therefore watch carefully how you walk, not as unwise, but as wise, redeeming the time, because the days are evil.', meaning: 'A nudge to be thoughtful about how time gets spent, rather than just letting it slip by unnoticed.' },
  'Ephesians 6:1-2': { ref: 'Ephesians 6:1-2', text: 'Children, obey your parents in the Lord, for this is right. “Honor your father and mother,” which is the first commandment with a promise.', meaning: 'Honoring parents is called out as important enough to be its own commandment, not just good manners.' },
  'Zephaniah 3:17': { ref: 'Zephaniah 3:17', text: 'The Lord, your God, is in the midst of you, a mighty one who will save. He will rejoice over you with joy. He will calm you in his love. He will rejoice over you with singing.', meaning: 'God isn’t just tolerating you — the picture here is delight, like someone singing over someone they love.' },
  'Psalm 46:1': { ref: 'Psalm 46:1', text: 'God is our refuge and strength, a very present help in trouble.', meaning: 'A refuge is somewhere safe to run to. God is described as always available for that, not sometimes.' },
  'Ecclesiastes 4:9-10': { ref: 'Ecclesiastes 4:9-10', text: 'Two are better than one... for if they fall, one will lift up his fellow; but woe to him who is alone when he falls, and has no one to lift him up.', meaning: 'You weren’t meant to carry everything completely alone. Letting someone help is wisdom, not weakness.' },
  'Colossians 3:9': { ref: 'Colossians 3:9', text: 'Don’t lie to one another, seeing that you have put off the old man with his doings.', meaning: 'Honesty with each other is treated as part of what it means to genuinely change, not just an add-on rule.' },
  'Colossians 3:13': { ref: 'Colossians 3:13', text: 'Bearing with one another, and forgiving each other... even as Christ forgave you, so you also do.', meaning: 'Forgiveness is hard partly because it’s a choice, not a feeling that just arrives on its own.' },
  'Colossians 3:20': { ref: 'Colossians 3:20', text: 'Children, obey your parents in all things, for this pleases the Lord.', meaning: 'Even obedience at home is described here as something that matters to God, not just to your parents.' },
  'Colossians 1:15': { ref: 'Colossians 1:15', text: 'He is the image of the invisible God, the firstborn of all creation.', meaning: 'Jesus is described as making the invisible God visible — a way of seeing who God actually is.' },
  'Psalm 147:3': { ref: 'Psalm 147:3', text: 'He heals the broken in heart, and binds up their wounds.', meaning: 'Grief and heartbreak aren’t things God expects you to just get over quickly. Healing is described as something he does.' },
  'Revelation 21:4': { ref: 'Revelation 21:4', text: 'He will wipe away every tear from their eyes. Death will be no more; neither will there be mourning, nor crying, nor pain, any more.', meaning: 'A picture of the end of the story where every hard thing is finally undone.' },
  'James 1:5': { ref: 'James 1:5', text: 'But if any of you lacks wisdom, let him ask God, who gives to all liberally and without reproach; and it will be given to him.', meaning: 'You’re allowed to say “I don’t know what to do here” directly to God and ask for help thinking it through.' },
  'James 1:19-20': { ref: 'James 1:19-20', text: 'Let every man be swift to hear, slow to speak, and slow to anger; for the anger of man doesn’t produce the righteousness of God.', meaning: 'Listening first, and slowing down before reacting, is treated as wisdom — not weakness.' },
  'James 3:16': { ref: 'James 3:16', text: 'For where jealousy and selfish ambition are, there is confusion and every evil deed.', meaning: 'Jealousy is named here as something that tends to spread and make things worse, not just an uncomfortable feeling.' },
  'James 4:17': { ref: 'James 4:17', text: 'To him therefore who knows to do good, and doesn’t do it, to him it is sin.', meaning: 'Staying silent when you could help someone is treated as a real choice, not a neutral one.' },
  'Galatians 5:22-23': { ref: 'Galatians 5:22-23', text: 'The fruit of the Spirit is love, joy, peace, patience, kindness, goodness, faith, gentleness, and self-control.', meaning: 'These are described as growing in you over time, like fruit — not something you have to fake overnight.' },
  'Galatians 5:26': { ref: 'Galatians 5:26', text: 'Let’s not become conceited, provoking one another, and envying one another.', meaning: 'A direct warning that envy and comparison tend to poison relationships if left unchecked.' },
  'Galatians 6:2': { ref: 'Galatians 6:2', text: 'Bear one another’s burdens, and so fulfill the law of Christ.', meaning: 'Helping carry someone else’s hard moment is described as living out what following Christ actually looks like.' },
  'Galatians 6:4-5': { ref: 'Galatians 6:4-5', text: 'Let each man test his own work... For each man will bear his own burden.', meaning: 'A nudge to measure your own path honestly, instead of constantly measuring it against someone else’s.' },
  'Galatians 6:7': { ref: 'Galatians 6:7', text: 'Don’t be deceived: God is not mocked, for whatever a man sows, that he will also reap.', meaning: 'Shortcuts that involve dishonesty tend to catch up eventually — what you plant is what grows.' },
  '2 Corinthians 10:12': { ref: '2 Corinthians 10:12', text: 'For we... measuring themselves by themselves, and comparing themselves with themselves, are without understanding.', meaning: 'Constantly comparing yourself to others is called out here as a habit that doesn’t actually lead anywhere good.' },
  'Hebrews 10:24-25': { ref: 'Hebrews 10:24-25', text: 'Let’s consider how to provoke one another to love and good works, not forsaking our own assembling together... but exhorting one another.', meaning: 'Gathering with other believers is described as something that actively helps you, not just a routine to keep.' },
  'Habakkuk 2:3': { ref: 'Habakkuk 2:3', text: 'For the vision is yet for the appointed time... though it takes time, wait for it, because it will surely come.', meaning: 'Some answers take longer than we’d like. This says that delay doesn’t mean it isn’t coming.' },
  'Psalm 27:1': { ref: 'Psalm 27:1', text: 'The Lord is my light and my salvation. Whom shall I fear? The Lord is the strength of my life. Of whom shall I be afraid?', meaning: 'Light pushes back darkness. This verse leans on that image for facing fear.' },
  'Psalm 34:4': { ref: 'Psalm 34:4', text: 'I sought the Lord, and he answered me, and delivered me from all my fears.', meaning: 'This is written by someone who actually asked and actually got an answer — not just a theory.' },
  'Psalm 56:3': { ref: 'Psalm 56:3', text: 'When I am afraid, I will put my trust in you.', meaning: 'This isn’t “don’t be afraid.” It’s “when you are afraid, here’s somewhere to put it.”' },
  'Psalm 121:1-2': { ref: 'Psalm 121:1-2', text: 'I will lift up my eyes to the mountains. Where does my help come from? My help comes from the Lord, who made heaven and earth.', meaning: 'A reminder to look up and outward for help, instead of only inward.' },
  'Deuteronomy 31:6': { ref: 'Deuteronomy 31:6', text: 'Be strong and courageous... for the Lord your God himself... will not fail you nor forsake you.', meaning: 'A direct promise not to abandon you — even when a situation feels like it might.' },
};

export type ChatTopic = {
  id: string;
  keywords: string[];
  childAnswer: string;
  teenAnswer: string;
  verses: string[];
};

export const TOPICS: ChatTopic[] = [
  {
    id: 'does-god-care',
    keywords: ['does god care', 'does god love me', 'god love me', 'god care about me', 'does god notice me', 'does god know me', 'does anyone care about me', 'does god see me', 'am i loved by god', 'is god paying attention to me'],
    childAnswer: 'Yes — more than you probably think. You’re not just one of a crowd to God. He knows your name and pays attention to your days, even the small parts.',
    teenAnswer: 'Yes, and not in a vague, distant way. God caring about you isn’t based on your performance that week — it doesn’t go up when you do well and down when you don’t.',
    verses: ['Psalm 139:14', 'Zephaniah 3:17', 'Romans 8:38-39'],
  },
  {
    id: 'why-bad-things-happen',
    keywords: ['why do bad things happen', 'why does god let bad things happen', 'why did this happen to me', 'why is life so hard', 'why is my life hard', 'why is this happening to me', 'why does god allow suffering', 'why does god allow pain'],
    childAnswer: 'That’s one of the hardest questions to ask, and it’s okay to ask it. The Bible doesn’t pretend hard things aren’t hard — but it also says God stays close to you inside them, and one day he’ll make every wrong thing right.',
    teenAnswer: 'Honestly, there isn’t a tidy one-line answer, and be careful of anyone who gives you one. What Scripture does say is that God doesn’t stay distant from suffering — he moves toward it — and that pain doesn’t get the final word.',
    verses: ['Psalm 34:18', 'Psalm 147:3', 'Revelation 21:4'],
  },
  {
    id: 'scared-afraid',
    keywords: ['i am scared', 'im scared', 'i feel scared', 'so scared', 'i am afraid', 'im afraid', 'i feel afraid', 'having nightmares', 'i am terrified', 'i am frightened', 'i get scared', 'scared', 'afraid', 'frightened'],
    childAnswer: 'Feeling scared is something everyone deals with — you’re not being silly for feeling it. God says he stays right with you in scared moments, not just after they’re over.',
    teenAnswer: 'Fear is a normal, human response — it doesn’t mean your faith is weak. What matters is where you put the fear once you notice it.',
    verses: ['Isaiah 41:10', 'Psalm 56:3', 'Psalm 27:1'],
  },
  {
    id: 'made-a-mistake',
    keywords: ['i made a mistake', 'i messed up', 'i did something wrong', 'i did something bad', 'i feel guilty', 'i sinned', 'i regret what i did', 'i shouldnt have done that', 'i feel so bad about what i did', 'i did something i regret', 'guilty', 'i feel terrible'],
    childAnswer: 'Everybody messes up — that’s not news to God. What matters most is what you do next: being honest about it, saying sorry if you need to, and letting yourself be forgiven instead of hiding.',
    teenAnswer: 'Guilt that pushes you toward honesty is useful. Guilt that just makes you hide isn’t. God’s response to a genuine “I got this wrong” has never been rejection — it’s always been closer to relief that you came back.',
    verses: ['1 John 1:9', 'Proverbs 28:13', 'Romans 8:38-39'],
  },
  {
    id: 'lying-honesty',
    keywords: ['i lied', 'i lied to my mom', 'i lied to my dad', 'i lied to my parents', 'lied to my mom and dad', 'should i tell the truth', 'i want to lie', 'is it ok to lie', 'is it wrong to lie', 'i havent told the truth', 'i told a lie', 'i wasnt honest', 'i need to confess', 'i want to come clean', 'should i confess'],
    childAnswer: 'Telling the truth is usually harder in the moment but better afterward — especially with your mom and dad, who love you and want to trust you. If you’ve already told a lie, the brave next step is going back, being honest with them, and saying sorry. God doesn’t like lying, but he loves it when you come clean.',
    teenAnswer: 'Lying tends to compound — one covers for the next, especially with parents, where trust matters most. The harder, better path is almost always the direct one: go back, tell your parents the truth, even if it’s uncomfortable or costs you something. Confession isn’t about punishment, it’s about honesty repairing what the lie damaged.',
    verses: ['Proverbs 12:22', 'Proverbs 28:13', 'Ephesians 6:1-2'],
  },
  {
    id: 'cheating',
    keywords: ['i cheated', 'should i cheat', 'is it wrong to cheat', 'cheat on a test', 'cheating on a test', 'copy someone elses answers', 'cheat on my homework', 'is cheating a sin', 'cheating', 'cheated'],
    childAnswer: 'It’s really tempting when everyone seems to be doing it, but cheating means the work isn’t really yours — and it doesn’t actually help you learn. It’s braver and better to do your own work, even if it’s harder or the grade isn’t as good.',
    teenAnswer: 'Cheating usually feels like a shortcut, but it quietly teaches you that dishonesty is fine when it’s convenient — a lesson that costs more than one grade. Doing your own work, even imperfectly, keeps your integrity intact, which matters more long-term than any single result.',
    verses: ['Proverbs 11:1', 'Galatians 6:7', 'Proverbs 21:6'],
  },
  {
    id: 'gossip',
    keywords: ['gossip', 'i gossiped', 'someone is gossiping', 'talking about someone behind their back', 'people are talking about me', 'they are spreading rumors', 'spreading a rumor', 'should i tell everyone what i heard'],
    childAnswer: 'Gossip can feel small when you’re saying it, but it can really hurt the person it’s about. It helps to ask: would I say this if they were standing right here? If not, it’s probably better left unsaid.',
    teenAnswer: 'Gossip often feels harmless in the moment because it’s just words — but words about someone who isn’t there to respond can do real, lasting damage to trust and friendships. Worth asking whether what you’re about to say builds someone up or just tears them down.',
    verses: ['Proverbs 11:13', 'Proverbs 16:28', 'Ephesians 4:29'],
  },
  {
    id: 'online-safety',
    keywords: ['someone online', 'a stranger online', 'someone i dont know online', 'talking to a stranger online', 'someone wants to meet up', 'is it safe to talk to', 'online safety', 'someone i met online'],
    childAnswer: 'It’s smart of you to be thinking about this. Never share your address, school, or photos with someone you only know online, even if they seem nice — and always tell a parent or teacher about anyone online who makes you feel unsure or asks you to keep a secret from them.',
    teenAnswer: 'Good instinct to pause on this. People online aren’t always who they say they are, and anyone who asks you to keep things secret from a parent is a clear warning sign, not a compliment. Please tell a parent or trusted adult about it — even if it feels awkward.',
    verses: ['1 Peter 5:8', 'Proverbs 4:23', 'Psalm 121:1-2'],
  },
  {
    id: 'bullying',
    keywords: ['bully', 'bullied', 'being bullied', 'someone is mean to me', 'people are mean to me', 'kids are mean to me', 'they make fun of me', 'someone is picking on me', 'im being picked on'],
    childAnswer: 'I’m really sorry that’s happening to you. Nobody has the right to treat you badly, and this really is something to tell a grown-up you trust — a parent or your teacher — so they can help.',
    teenAnswer: 'Being targeted like that is genuinely hard, and it’s not something you’re meant to just absorb quietly. Please tell a parent or a teacher what’s happening — not as a last resort, but as the actual next step.',
    verses: ['Psalm 34:18', 'Deuteronomy 31:6', 'Proverbs 17:17'],
  },
  {
    id: 'standing-up-for-others',
    keywords: ['someone else is being bullied', 'my friend is being bullied', 'i saw someone get bullied', 'should i stand up for', 'someone else is being picked on', 'defending a friend', 'sticking up for someone'],
    childAnswer: 'Standing up for someone else takes real courage, and it matters — even a small kind word can help. It also really helps to tell a teacher or grown-up what you saw, so they can step in too.',
    teenAnswer: 'Speaking up for someone else, especially when it’s socially risky, is one of the harder kinds of courage — and it genuinely matters to the person you’re standing up for. Report it to a teacher or trusted adult as well; standing up doesn’t mean handling it entirely alone.',
    verses: ['Proverbs 31:8-9', 'Galatians 6:2', 'James 4:17'],
  },
  {
    id: 'lonely-friends',
    keywords: ['i am lonely', 'im lonely', 'no friends', 'i have no friends', 'nobody likes me', 'i feel left out', 'i feel alone', 'i dont have any friends', 'nobody wants to be my friend', 'lonely', 'left out'],
    childAnswer: 'Feeling left out really hurts. You are never actually alone, even when it feels that way — and it’s worth telling a parent or teacher how you’ve been feeling, too, so they can help.',
    teenAnswer: 'Loneliness is one of the heaviest feelings, and it’s worth naming out loud instead of just pushing through it quietly — to God, and to a parent, teacher, or someone else you trust.',
    verses: ['Ecclesiastes 4:9-10', 'Deuteronomy 31:6', 'Psalm 46:1'],
  },
  {
    id: 'good-friendship',
    keywords: ['how do i make friends', 'how to make friends', 'am i a good friend', 'what makes a good friend', 'should i be friends with', 'my friend is a bad influence', 'my friends are a bad influence'],
    childAnswer: 'A good friend is someone who’s kind, tells the truth, and treats you well even when no one’s watching. It’s worth choosing friends like that — and being that kind of friend too.',
    teenAnswer: 'Who you spend the most time with genuinely shapes who you become, for better or worse — worth being honest with yourself about which friendships build you up and which ones quietly pull you down.',
    verses: ['Proverbs 27:17', 'Proverbs 17:17', '1 Corinthians 15:33'],
  },
  {
    id: 'angry',
    keywords: ['i am angry', 'im angry', 'so mad', 'i feel angry', 'makes me so mad', 'i am furious', 'i cant control my anger', 'i get angry so easily', 'i am really mad', 'angry', 'furious'],
    childAnswer: 'Anger itself isn’t bad — it’s what we do with it that matters. It helps to say what you’re feeling out loud to God first, before deciding what to do next.',
    teenAnswer: 'Anger is often a signal that something actually matters to you or that a real boundary got crossed — worth listening to, not just suppressing. The Bible’s consistent advice is to deal with it honestly and quickly, rather than letting it sit and grow.',
    verses: ['James 1:19-20', 'Ephesians 4:26', 'Proverbs 15:1'],
  },
  {
    id: 'forgiveness',
    keywords: ['should i forgive', 'i cant forgive', 'i dont want to forgive', 'someone hurt me', 'they hurt me', 'how do i forgive', 'i dont know how to forgive', 'forgiving someone who hurt me', 'forgiveness', 'forgive'],
    childAnswer: 'Forgiving someone who hurt you is genuinely hard, and it doesn’t mean pretending it didn’t hurt. It’s something you can grow into, even slowly, and it doesn’t mean you have to let them hurt you again.',
    teenAnswer: 'Forgiveness isn’t the same as saying what happened was fine, and it doesn’t require staying in a situation that isn’t safe. It’s a choice about not letting bitterness keep running your story.',
    verses: ['Colossians 3:13', 'Matthew 18:21-22', '1 Corinthians 13:4-7'],
  },
  {
    id: 'death-grief',
    keywords: ['someone died', 'my grandma died', 'my grandpa died', 'my pet died', 'my dog died', 'my cat died', 'someone i love died', 'my friend died', 'my sister died', 'my brother died', 'my mom died', 'my dad died', 'i am grieving', 'dealing with grief', 'someone i love passed away', 'died', 'passed away'],
    childAnswer: 'I’m really sorry. Losing someone you love is one of the hardest things there is, and it’s okay to be sad about it for a long time. Please talk about it with a parent or another grown-up who loves you — you don’t have to hold this by yourself.',
    teenAnswer: 'I’m sorry — that’s a real loss and it deserves real grief, not a rushed “move on.” The Bible doesn’t skip past sorrow either. Please lean on people around you for this, not just faith alone.',
    verses: ['Psalm 147:3', 'Matthew 11:28', 'Revelation 21:4'],
  },
  {
    id: 'heaven-death',
    keywords: ['what happens when we die', 'what happens after we die', 'is heaven real', 'what is heaven like', 'do we go to heaven', 'am i afraid of dying', 'i am scared of dying'],
    childAnswer: 'The Bible says Jesus is personally getting a place ready for the people who love him, and that one day every sad thing will be undone. Death isn’t described as the end of the story.',
    teenAnswer: 'Scripture doesn’t give a full tour of heaven, but it’s consistent about this much: death doesn’t get the final say, and Jesus talks about it as him preparing a place, not just an abstract idea.',
    verses: ['John 14:2-3', 'Revelation 21:4', '1 Corinthians 15:55'],
  },
  {
    id: 'prayer-how',
    keywords: ['how do i pray', 'does prayer work', 'how to pray', 'what do i say when i pray', 'prayer doesnt work', 'why should i pray', 'what should i pray about'],
    childAnswer: 'Prayer is just talking to God like you would talk to someone who loves you — no special words needed. You can say thank you, say sorry, ask for help, or just tell him how your day was.',
    teenAnswer: 'Prayer doesn’t need to be formal or polished — it’s honesty directed at God, including the parts that feel messy or unresolved. It’s less about getting a formula right and more about actually showing up.',
    verses: ['Matthew 6:9-13', 'Philippians 4:6-7', '1 Peter 5:7'],
  },
  {
    id: 'unanswered-prayer',
    keywords: ['why isnt god answering', 'god isnt answering my prayers', 'my prayers arent working', 'god feels silent', 'god feels far away', 'why doesnt god answer me', 'i prayed and nothing happened'],
    childAnswer: 'It can feel confusing when it seems like God isn’t answering. Sometimes the answer is “not yet” instead of “no.” Keep talking to him honestly, and it also helps to talk to a parent or teacher about how you’re feeling.',
    teenAnswer: 'Silence from God is one of the hardest parts of faith to sit with, and it’s worth being honest about instead of faking certainty. Scripture doesn’t promise instant answers — it promises he’s still there, even in the waiting.',
    verses: ['Isaiah 55:8-9', 'Habakkuk 2:3', '1 Peter 5:7'],
  },
  {
    id: 'doubt-faith',
    keywords: ['i dont believe', 'is god real', 'i have doubts', 'not sure god is real', 'i doubt', 'is the bible true', 'how do i know god is real', 'i am struggling with my faith'],
    childAnswer: 'It’s okay to have questions — lots of people who love God still have questions sometimes. Asking honestly is a good thing, and it’s worth talking about with a parent or teacher too.',
    teenAnswer: 'Doubt isn’t the opposite of faith — it’s often part of a faith that’s actually thinking things through rather than just repeating them. Bring the real questions to a trusted adult instead of sitting with them alone; that’s not a sign of weak faith, it’s how faith gets sturdier.',
    verses: ['James 1:5', 'Proverbs 3:5-6', 'Psalm 34:4'],
  },
  {
    id: 'who-is-jesus',
    keywords: ['who is jesus', 'why did jesus die', 'what did jesus do', 'why do we need jesus', 'who is god', 'is jesus really god'],
    childAnswer: 'Jesus is God who came to live among us, to show us what God is really like, and to make a way for us to be close to God forever. He’s not just a good teacher from long ago — he’s alive.',
    teenAnswer: 'Jesus is described in Scripture both as fully showing us who God is, and as the way God dealt with everything that separates people from him. Not just a moral example — the center of the whole story.',
    verses: ['John 3:16', 'John 14:6', 'Colossians 1:15'],
  },
  {
    id: 'what-is-sin',
    keywords: ['what is sin', 'what does sin mean', 'am i a sinner', 'is everyone a sinner', 'what counts as a sin'],
    childAnswer: 'Sin just means the wrong things we think, say, or do that go against how God made us to live. Everyone does it sometimes — that’s exactly why Jesus came, and why forgiveness is offered so freely.',
    teenAnswer: 'Sin isn’t just breaking a rule — it’s missing the mark of who you were made to be. Everyone is in the same boat there, which is part of why grace matters so much instead of trying to earn a perfect record.',
    verses: ['Romans 3:23', '1 John 1:9', 'Romans 6:23'],
  },
  {
    id: 'why-church',
    keywords: ['why do i have to go to church', 'why go to church', 'is church important', 'why should i go to church', 'do i have to go to church'],
    childAnswer: 'Church is a place to learn about God together with other people, not just alone — and it helps to have others cheering you on and reminding you that you’re not doing this by yourself.',
    teenAnswer: 'Faith can survive alone, but it tends to grow better in community — people who challenge you, encourage you, and remind you of things you might forget on your own.',
    verses: ['Hebrews 10:24-25', 'Matthew 18:20', 'Ecclesiastes 4:9-10'],
  },
  {
    id: 'obeying-parents',
    keywords: ['why do i have to obey my parents', 'why should i listen to my parents', 'my parents are too strict', 'i dont want to listen to my parents', 'do i have to obey my parents'],
    childAnswer: 'Your parents are given the job of looking after you, and listening to them — even when you don’t fully understand a rule — is one way of trusting that they love you and want good things for you.',
    teenAnswer: 'Obeying doesn’t mean your opinion doesn’t matter — you can respectfully disagree and still honor them. But Scripture treats honoring parents as something significant, not optional or old-fashioned.',
    verses: ['Ephesians 6:1-2', 'Colossians 3:20', 'Proverbs 1:8'],
  },
  {
    id: 'identity-worth',
    keywords: ['am i good enough', 'i am not good enough', 'i hate myself', 'i think i am ugly', 'i am not smart enough', 'i am not enough', 'i feel worthless', 'nobody would miss me', 'i feel like a failure'],
    childAnswer: 'You are not a mistake, and you don’t have to earn being loved by being perfect. You were made on purpose, with care, exactly as you are.',
    teenAnswer: 'Worth that depends on grades, looks, or performance will always feel shaky, because those things move. What Scripture says about you doesn’t move — made on purpose, loved before you did anything to earn it.',
    verses: ['Psalm 139:14', 'Jeremiah 1:5', 'Ephesians 2:10'],
  },
  {
    id: 'purpose-calling',
    keywords: ['what is my purpose', 'why am i here', 'whats the point of my life', 'what am i supposed to do with my life', 'does my life matter', 'what does god want me to do'],
    childAnswer: 'God made you on purpose, with things only you can do in your own way. You don’t have to have it all figured out yet — that unfolds bit by bit as you grow.',
    teenAnswer: 'Purpose usually isn’t handed over all at once — it’s something you grow into, often by paying attention to what you care about and where you can genuinely help. But the starting point Scripture gives is settled: you were made on purpose, not by accident.',
    verses: ['Jeremiah 1:5', 'Ephesians 2:10', 'Jeremiah 29:11'],
  },
  {
    id: 'peer-pressure',
    keywords: ['peer pressure', 'my friends want me to', 'everyone else is doing it', 'they are pressuring me', 'my friends are pressuring me', 'i dont want to but everyone else is'],
    childAnswer: 'It’s really hard to be the one who says no. Doing the right thing even when others aren’t takes real courage, and God notices that kind of courage.',
    teenAnswer: 'Pressure usually shows up wrapped in “everyone’s doing it,” which almost never turns out to be fully true, and isn’t actually a reason on its own. Being willing to be the one who stands apart is one of the harder, more respected kinds of courage.',
    verses: ['Romans 12:2', 'Joshua 1:9', 'Philippians 4:13'],
  },
  {
    id: 'jealousy',
    keywords: ['i am jealous', 'im jealous', 'i am jealous of', 'i wish i had what they have', 'i feel envious', 'i am so jealous of my friend', 'i am jealous of my sibling', 'jealous', 'jealousy', 'envious'],
    childAnswer: 'Feeling jealous sometimes is normal — almost everyone does. It helps to notice it, and then to remember what’s actually good about your own life instead of only looking at someone else’s.',
    teenAnswer: 'Jealousy is usually a sign of comparing your whole life to someone else’s highlight reel, which is never a fair comparison. Naming it honestly — even to God — takes away some of its power.',
    verses: ['1 Corinthians 13:4-7', 'Galatians 5:26', 'James 3:16'],
  },
  {
    id: 'comparison-siblings',
    keywords: ['comparing myself to my sibling', 'my parents compare me to my sibling', 'my brother is better than me', 'my sister is better than me', 'i am not as good as my sibling', 'everyone likes my sibling more'],
    childAnswer: 'It’s hard when it feels like someone else is always ahead of you. But you’re not supposed to be a copy of your sibling — God made you to be you, with your own strengths.',
    teenAnswer: 'Comparison rarely tells the truth about either person — it usually just measures someone else’s highlight reel against your full behind-the-scenes reality. Worth measuring your own path against your own growth instead.',
    verses: ['2 Corinthians 10:12', 'Galatians 6:4-5', 'Psalm 139:14'],
  },
  {
    id: 'worry-anxiety',
    keywords: ['i am worried', 'im worried', 'i feel anxious', 'i cant stop worrying', 'i keep worrying', 'so much anxiety', 'i have anxiety', 'i am so stressed', 'i am stressed about school', 'anxious', 'anxiety', 'worried', 'stressed'],
    childAnswer: 'Worrying a lot is tiring, and you don’t have to carry it by yourself. You can hand your worries to God like putting down something heavy — and it also helps to tell a grown-up what’s on your mind.',
    teenAnswer: 'Persistent worry is exhausting, and “just don’t worry” isn’t realistic advice on its own. What is realistic: naming the specific worry, handing it to God honestly, and also talking to a parent, teacher, or counselor if it keeps building up.',
    verses: ['1 Peter 5:7', 'Philippians 4:6-7', 'Matthew 6:34'],
  },
  {
    id: 'screen-time-guilt',
    keywords: ['i play too many video games', 'i spend too much time on my phone', 'i feel guilty about screen time', 'i watch too much youtube', 'i am always on my phone', 'i cant stop scrolling'],
    childAnswer: 'It’s not wrong to enjoy games or videos — but it’s worth noticing if it’s taking over time you’d actually want to spend on other things, like family, friends, or sleep.',
    teenAnswer: 'Not everything that’s allowed is actually good for you in large amounts — worth honestly asking whether your screen time is building your life up or just filling empty space you’re avoiding.',
    verses: ['Ephesians 5:15-16', 'Galatians 5:22-23', '1 Corinthians 10:23'],
  },
];

export const FALLBACK_VERSES = ['James 1:5', 'Psalm 121:1-2', 'Matthew 11:28'];

const SENSITIVE_PATTERNS: string[] = [
  'kill myself', 'want to die', 'end my life', 'ending my life', 'suicide', 'suicidal',
  'hurt myself', 'hurting myself', 'cut myself', 'cutting myself', 'self harm', 'self-harm',
  'no reason to live', 'better off dead', 'wish i was dead', 'wish i were dead',
  'someone touched me', 'touching me', 'touched me inappropriately', 'inappropriate touch',
  'hits me', 'hitting me', 'beats me', 'abuse', 'abusing me', 'abused',
  'hurts me at home', 'not safe at home', 'scared of my dad', 'scared of my mom', 'scared of my parent',
  'someone is hurting me', 'hurting me', 'want to hurt someone', 'want to hurt myself',
  'stranger asked me', 'a stranger wants', 'someone online wants me to', 'send a photo', 'send pictures',
];

function tokenize(text: string): string[] {
  return text.toLowerCase().replace(/[’']/g, '').split(/[^a-z]+/).filter(Boolean);
}

// Exact match for short connector words (i, am, is, my, to...) so they can't stem-match
// unrelated words. Longer words allow prefix stemming both ways (bully <-> bullying, cheat <-> cheated).
function tokenMatches(inputToken: string, keywordToken: string): boolean {
  if (keywordToken.length < 4) return inputToken === keywordToken;
  return inputToken === keywordToken || inputToken.startsWith(keywordToken) || keywordToken.startsWith(inputToken);
}

// All keyword tokens must appear in the input, in the same order, with other words allowed in between
// (so "does god really care about me" still matches the keyword "does god care about me").
function phraseMatches(inputTokens: string[], keywordTokens: string[]): boolean {
  let searchFrom = 0;
  for (const kw of keywordTokens) {
    let found = -1;
    for (let i = searchFrom; i < inputTokens.length; i++) {
      if (tokenMatches(inputTokens[i], kw)) { found = i; break; }
    }
    if (found === -1) return false;
    searchFrom = found + 1;
  }
  return true;
}

export function isSensitive(input: string): boolean {
  const inputTokens = tokenize(input);
  return SENSITIVE_PATTERNS.some((phrase) => phraseMatches(inputTokens, tokenize(phrase)));
}

export function matchTopic(input: string): ChatTopic | null {
  const inputTokens = tokenize(input);
  let best: ChatTopic | null = null;
  let bestLength = 0;
  for (const topic of TOPICS) {
    let topicBest = 0;
    for (const keyword of topic.keywords) {
      const keywordTokens = tokenize(keyword);
      if (!keywordTokens.length) continue;
      // Require either a multi-word phrase match or one long, distinctive single word,
      // so short/generic words can't win a match on their own.
      const isStrongEnough = keywordTokens.length >= 2 || keywordTokens[0].length >= 4;
      if (!isStrongEnough) continue;
      if (phraseMatches(inputTokens, keywordTokens)) {
        const length = keywordTokens.join(' ').length;
        if (length > topicBest) topicBest = length;
      }
    }
    if (topicBest > bestLength) { bestLength = topicBest; best = topic; }
  }
  return best;
}

export const STARTER_QUESTIONS = [
  'Does God really care about me?',
  'Why do bad things happen?',
  'I’m scared — what do I do?',
  'I lied to my mom and dad.',
  'How do I pray?',
  'Someone hurt my feelings and I don’t want to forgive them.',
];
