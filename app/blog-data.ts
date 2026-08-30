export type BlogSection = {
  heading?: string;
  paragraphs: string[];
};

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  category: string;
  publishedAt: string;
  readingTime: string;
  intro: string;
  sections: BlogSection[];
  relatedLinks: { href: string; label: string }[];
};

export const blogPosts: BlogPost[] = [
  {
    slug: 'bible-games-for-kids-that-actually-stick',
    title: 'Bible Games for Kids That Actually Stick',
    description:
      'A practical look at what makes a Bible game memorable for children — and which kinds of play help Scripture move from the screen into everyday life.',
    category: 'Bible Games',
    publishedAt: '2026-01-12',
    readingTime: '6 min read',
    intro:
      "Most parents have watched a child breeze through a Bible quiz and forget every answer by dinner. It's not that the child wasn't paying attention — it's that recognition and recall are different skills, and most Bible games only train the first one.",
    sections: [
      {
        heading: 'Recognition games vs. recall games',
        paragraphs: [
          "A multiple-choice quiz tests whether a child can spot the right answer among a few options. That's recognition, and it's the easiest kind of memory to fake. Recall — being able to retrieve a verse, a story order, or a Bible fact with no prompts — is what actually lasts.",
          'Games that ask a child to rebuild something from scratch, like arranging Scripture into the correct order or filling in a verse from memory, train recall. Games that only ask "which of these four is true" train recognition. Both have a place, but a Bible learning plan that leans entirely on recognition games will feel effective in the moment and evaporate within a week.',
        ],
      },
      {
        heading: 'Why story context beats isolated facts',
        paragraphs: [
          'Children remember stories far better than disconnected facts, because a story gives every detail a reason to exist. "David defeated Goliath" is a fact. "A shepherd boy nobody expected stood up when everyone else was afraid" is a story — and it sticks because it has stakes, a character, and a turn.',
          'The strongest Bible games wrap learning in a narrative frame: a mystery to solve, a path to walk, a character to help. That framing is why detective-style and adventure-style Bible games tend to outperform flashcard-style drills for long-term retention, especially with children under 10.',
        ],
      },
      {
        heading: 'What to look for in a Bible game for your child',
        paragraphs: [
          'A few questions worth asking before you hand a child a Bible app or game: Does it ask them to produce an answer, not just pick one? Does it repeat key verses across multiple activities instead of once? Does it explain why the story matters, not just what happened? And does it give a parent visibility into what was actually learned, without needing to watch every session?',
          "Lantern & Lion's arcade was built around these questions — games like Verse Builder and Bible Detective ask children to reconstruct Scripture and reason through a case, rather than simply recognize a correct answer.",
        ],
      },
    ],
    relatedLinks: [
      { href: '/arcade', label: 'Browse Bible games for kids' },
      { href: '/curriculum', label: 'See the full Bible curriculum' },
      { href: '/parent-access', label: 'Start a family account' },
    ],
  },
  {
    slug: 'how-to-make-bible-reading-fun-for-kids',
    title: 'How to Make Bible Reading Fun for Kids (Without Forcing It)',
    description:
      "Practical, low-pressure ways to build a Bible reading habit with children — grounded in what actually keeps kids coming back, not just what looks good on a chart.",
    category: 'Christian Parenting',
    publishedAt: '2026-02-03',
    readingTime: '5 min read',
    intro:
      "Reading charts and sticker systems can get a child through Leviticus once. They rarely build a habit that survives past the reward. If the goal is a child who wants to open the Bible on their own, the approach has to change.",
    sections: [
      {
        heading: 'Start with story, not schedule',
        paragraphs: [
          "A daily reading plan that marches through the Bible in order front-loads genealogies and law codes before a child has any narrative anchor. Starting with the stories that have clear characters and stakes — Noah, Joseph, David, Daniel, Esther — gives a child something to hold onto before asking them to sit with denser material.",
        ],
      },
      {
        heading: 'Let them choose sometimes',
        paragraphs: [
          "Autonomy is one of the strongest predictors of a habit that lasts. Offering a choice between two or three stories or activities, instead of assigning one, keeps a child's sense of ownership intact. It's a small shift, but it changes reading from something that happens to a child into something a child does.",
          "This is part of why open-ended exploration — a map of stories to choose from, rather than a fixed daily lesson — tends to hold attention longer than a strict curriculum sequence, especially for children who already resist being told what to do.",
        ],
      },
      {
        heading: "Talk about it after, not just during",
        paragraphs: [
          'A short conversation after a story — "what would you have done?" or "what surprised you?" — does more for retention than re-reading the passage twice. It turns a passive reading session into something the child has to actively process, which is where real learning happens.',
          "This is also where parents get the most value without needing to sit through every activity themselves: a quick summary of what a child explored that day is usually enough to start a meaningful dinner-table conversation.",
        ],
      },
    ],
    relatedLinks: [
      { href: '/curriculum', label: 'Explore Bible stories by age' },
      { href: '/safety', label: 'How Lantern & Lion keeps learning private and safe' },
      { href: '/parent-access', label: 'See the parent view' },
    ],
  },
  {
    slug: 'sunday-school-games-that-keep-kids-engaged',
    title: 'Sunday School Games That Keep a Whole Class Engaged',
    description:
      'Ideas and principles for children\'s ministry leaders looking for Bible games that work with a full room, mixed ages, and limited prep time.',
    category: 'Sunday School',
    publishedAt: '2026-02-18',
    readingTime: '6 min read',
    intro:
      "Anyone who has run a Sunday school class knows the real constraint isn't creativity — it's time, mixed ages in one room, and the ten minutes before parents start arriving. The games that work are the ones that scale to a group, not just a screen.",
    sections: [
      {
        heading: 'Team-based beats individual for a classroom setting',
        paragraphs: [
          "A game built for one child at a time doesn't translate to a class of fifteen. Team-based Bible games — where small groups work together toward a shared goal — keep more children actively involved at once, and they naturally handle mixed ages, since older kids tend to help younger ones without being asked.",
        ],
      },
      {
        heading: 'Build in a natural stopping point',
        paragraphs: [
          'Sunday school time is unpredictable — a class might get twenty-five minutes of activity time or ten. Games with clear rounds or checkpoints are easier to wrap up cleanly than open-ended ones, and they give a teacher a natural place to bring the group back together for discussion.',
        ],
      },
      {
        heading: 'Give teachers visibility without adding grading work',
        paragraphs: [
          "Most children's ministry volunteers are not looking for another gradebook. What actually helps is a simple view of which stories a class has covered and where kids are struggling, so a teacher can adjust the next lesson without reviewing every individual score.",
          "Lantern & Lion's classroom tools were built around that constraint — teachers see their assigned group's progress at a glance, not a spreadsheet of every tap a child made.",
        ],
      },
    ],
    relatedLinks: [
      { href: '/churches', label: 'See Lantern & Lion for churches and schools' },
      { href: '/multiplayer', label: 'Try a team Bible game' },
      { href: '/teacher-access', label: 'Teacher sign in' },
    ],
  },
  {
    slug: 'fun-ways-to-teach-bible-memory-verses',
    title: 'Fun Ways to Teach Bible Memory Verses to Kids',
    description:
      'Memory verse drilling is the part of Bible learning kids resist most. Here are approaches that build real recall without the dread.',
    category: 'Bible Learning',
    publishedAt: '2026-03-01',
    readingTime: '5 min read',
    intro:
      "Ask most kids what they think of when they hear \"memory verse\" and you'll get a groan. That's usually a sign the method is the problem, not the material.",
    sections: [
      {
        heading: 'Chunk it, don\'t chant it',
        paragraphs: [
          'Repeating a full verse over and over is slow and forgettable. Breaking a verse into small phrase-sized chunks and building it up piece by piece — the way a puzzle gets assembled — tends to stick faster and feel far less like drilling.',
        ],
      },
      {
        heading: 'Make retrieval a game, not a test',
        paragraphs: [
          "The difference between a memory verse game and a memory verse quiz is stakes and tone. A game where a child rebuilds a scattered verse against a timer, or matches word pairs, produces the same retrieval practice as a quiz — but it feels like play instead of an evaluation, which matters enormously for whether a child wants to come back to it tomorrow.",
        ],
      },
      {
        heading: 'Revisit, don\'t just move on',
        paragraphs: [
          "Most memory verse plans introduce a new verse each week and never return to the old ones. Spaced repetition — bringing a verse back a few days and then a few weeks after it was first learned — is what actually moves it into long-term memory. A single exposure, no matter how fun, rarely survives a month.",
        ],
      },
    ],
    relatedLinks: [
      { href: '/arcade', label: 'Play a Bible memory game' },
      { href: '/learn', label: 'Explore Bible learning activities' },
      { href: '/curriculum', label: 'See core verses by age group' },
    ],
  },
  {
    slug: 'bible-games-for-teens-beyond-coloring-sheets',
    title: 'Bible Games for Teens: Beyond Coloring Sheets',
    description:
      "Why the games and formats that work for younger children usually fall flat with teenagers — and what actually holds a teen's attention around faith.",
    category: 'Bible Games',
    publishedAt: '2026-03-15',
    readingTime: '5 min read',
    intro:
      "A lot of \"Bible games for teens\" are really just Bible games for kids with darker color schemes. Teenagers can tell, and they check out fast.",
    sections: [
      {
        heading: 'Teens want stakes, not stickers',
        paragraphs: [
          "Reward systems built around badges and points read as childish to most teenagers. What holds their attention instead is anything with real stakes — a decision that has consequences, a case that needs solving, a question without an easy answer. Teens are far more engaged by faith content that treats their doubts and choices as legitimate than by content that simply gamifies memorization.",
        ],
      },
      {
        heading: 'Real-life choices over trivia',
        paragraphs: [
          'A trivia question tests what a teen remembers. A scenario — "here\'s a situation, what would you actually do, and what does Scripture say about it" — tests what they believe and why. That distinction is the difference between a game a teen tolerates and one they think about after they close the app.',
        ],
      },
      {
        heading: 'Give them space, not surveillance',
        paragraphs: [
          "Teenagers are also more sensitive than younger children to feeling watched. A faith app that hands parents a full activity log of a teenager's every move tends to erode trust rather than build engagement. A better model gives teens a private space to explore honestly, while still giving parents general visibility into what's being covered.",
        ],
      },
    ],
    relatedLinks: [
      { href: '/teen-access', label: 'Explore the teen experience' },
      { href: '/curriculum', label: 'See the teen Bible curriculum' },
      { href: '/safety', label: 'How privacy works for teens' },
    ],
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}
