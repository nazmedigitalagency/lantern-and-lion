'use client';

import Image from 'next/image';
import { useState } from 'react';

type GameName = 'verse' | 'truth' | 'trail' | 'match';
type MatchToken = 'lamp' | 'path';

const activities = [
  ['A', 'Living the story', 'Step into a Bible story, make a choice and see what follows.', 'cream'],
  ['B', 'Verse builder', 'Put a verse back together one word at a time.', 'sky'],
  ['C', 'Colour and create', 'Make something thoughtful, then keep it private or share with a teacher.', 'coral'],
  ['D', 'Decision lab', 'Work through school, friendship and online choices with God’s Word nearby.', 'teal'],
  ['E', 'Treasure trails', 'Solve clues and hunt through a story alone or with approved classmates.', 'gold'],
  ['F', 'Bible case files', 'Follow the evidence, compare passages and crack the case.', 'navy'],
];

const parentQuotes = [
  ['My son usually rushes through Bible time. Here, he stopped and asked if we could do one more story.', 'Mum of two, Lagos'],
  ['I can see what they are learning without reading over their shoulder. That balance matters to me.', 'Dad of three, Manchester'],
  ['The real-life choices are what got my teenager talking. We ended up having a proper conversation at dinner.', 'Parent of a 14-year-old, Atlanta'],
];

export default function Home() {
  const [game, setGame] = useState<GameName>('verse');
  const [verseSelected, setVerseSelected] = useState<string[]>([]);
  const [truthAnswer, setTruthAnswer] = useState<string | null>(null);
  const [trailStep, setTrailStep] = useState(0);
  const [matchPlaces, setMatchPlaces] = useState<Record<string, MatchToken | undefined>>({});
  const [selectedMatch, setSelectedMatch] = useState<MatchToken | null>(null);
  const [matchChecked, setMatchChecked] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const verseComplete = verseSelected.length === 3;
  const verseCorrect = verseSelected.join('|') === 'lamp|light|path';
  const gameCount = ({ verse: '1 of 4', truth: '2 of 4', trail: '3 of 4', match: '4 of 4' })[game];
  const matchComplete = Boolean(matchPlaces.feet && matchPlaces.way);
  const matchCorrect = matchPlaces.feet === 'lamp' && matchPlaces.way === 'path';

  function chooseGame(next: GameName) {
    setGame(next);
    setTruthAnswer(null);
  }

  function placeMatch(target: 'feet' | 'way', token: MatchToken) {
    setMatchPlaces((current) => {
      const next = { ...current };
      for (const key of Object.keys(next)) {
        if (next[key] === token) next[key] = undefined;
      }
      next[target] = token;
      return next;
    });
    setSelectedMatch(null);
    setMatchChecked(false);
  }

  return (
    <main>
      <header className="site-header" id="top">
        <a className="brand" href="#top" aria-label="Lantern and Lion home">
          <Image src="/lantern-lion-logo.png" alt="" width={58} height={58} priority />
          <span><strong>Lantern &amp; Lion</strong><small>The Lantern Club</small></span>
        </a>
        <button className="menu-button" aria-expanded={menuOpen} aria-controls="main-nav" onClick={() => setMenuOpen(!menuOpen)}><span></span><span></span><span></span><b className="sr-only">Menu</b></button>
        <nav id="main-nav" className={menuOpen ? 'open' : ''} aria-label="Main navigation">
          <a href="#how" onClick={() => setMenuOpen(false)}>How it works</a>
          <a href="#activities" onClick={() => setMenuOpen(false)}>Activities</a>
          <a href="#safety" onClick={() => setMenuOpen(false)}>Safety</a>
        </nav>
        <div className="header-actions"><a className="text-link" href="#signin">Sign in</a><a className="button button-coral" href="/onboarding">Try onboarding</a></div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow"><span aria-hidden="true">●</span> Safe Bible play for growing minds</p>
          <h1>Bible learning they’ll ask to come back to.</h1>
          <p className="hero-lead">Stories, games and real-life choices that help children know God’s Word and live it. You stay close without hovering over every tap.</p>
          <div className="hero-actions"><a className="button button-primary" href="/onboarding">Try the club onboarding</a><a className="button button-secondary" href="#game">Try a game first</a></div>
          <ul className="trust-list" aria-label="Family safety promises"><li><span>✓</span> Grown-up controlled</li><li><span>✓</span> No ads</li><li><span>✓</span> No strangers</li></ul>
        </div>

        <div className="game-shell" id="game">
          <div className="game-topline"><span>Pick a game</span><strong>{game === 'verse' ? 'Build the verse' : game === 'truth' ? 'Spot the truth' : game === 'trail' ? 'Lantern trail' : 'Match the clues'}</strong><span>{gameCount}</span></div>
          <div className="game-tabs" role="tablist" aria-label="Try a game">
            <button role="tab" aria-selected={game === 'verse'} onClick={() => chooseGame('verse')}>Words</button>
            <button role="tab" aria-selected={game === 'truth'} onClick={() => chooseGame('truth')}>Choice</button>
            <button role="tab" aria-selected={game === 'trail'} onClick={() => chooseGame('trail')}>Trail</button>
            <button role="tab" aria-selected={game === 'match'} onClick={() => chooseGame('match')}>Match</button>
          </div>
          {game === 'verse' && <div className="game-card">
            <div className="lantern-icon">✦</div><p className="game-prompt">Tap the words in the right order.</p>
            <blockquote>“Your word is a <b>{verseSelected[0] ?? '____'}</b> to my feet, and a <b>{verseSelected[1] ?? '____'}</b> for my <b>{verseSelected[2] ?? '____'}</b>.”</blockquote>
            <p className="verse-ref">Psalm 119:105, WEB</p>
            <div className="word-bank">{['path', 'light', 'lamp'].map((word) => <button key={word} disabled={verseSelected.includes(word)} onClick={() => setVerseSelected((current) => [...current, word])}>{word}</button>)}</div>
            {verseComplete ? <div className={verseCorrect ? 'game-success' : 'game-note'} role="status">{verseCorrect ? 'You put every word in its place. Nice work!' : 'Nearly there. Read the verse once more, then try a different order.'}</div> : <p className="game-hint">Pick the first word to begin.</p>}
            <button className="reset-game" onClick={() => setVerseSelected([])}>Start again</button>
          </div>}
          {game === 'truth' && <div className="game-card choice-game">
            <div className="choice-mark">?</div><p className="game-prompt">Maya sees a new child eating alone. What could love look like?</p>
            <div className="choice-list"><button onClick={() => setTruthAnswer('kind')}>Ask if she can sit with them</button><button onClick={() => setTruthAnswer('miss')}>Wait for somebody else to go</button><button onClick={() => setTruthAnswer('miss')}>Send a funny picture from far away</button></div>
            {truthAnswer && <div className={truthAnswer === 'kind' ? 'game-success' : 'game-note'} role="status">{truthAnswer === 'kind' ? 'That is a kind first step. Love moves closer.' : 'Try once more. Which choice helps the new child feel seen?'}</div>}
          </div>}
          {game === 'trail' && <div className="game-card trail-game">
            <div className="trail-board" aria-label={`Lantern is at step ${trailStep + 1} of 4`}><span className={trailStep >= 0 ? 'lit' : ''}>1</span><i></i><span className={trailStep >= 1 ? 'lit' : ''}>2</span><i></i><span className={trailStep >= 2 ? 'lit' : ''}>3</span><i></i><span className={trailStep >= 3 ? 'lit' : ''}>4</span></div>
            <p className="game-prompt">Move the lantern along the path. Each stop reveals part of the story.</p>
            <p className="trail-copy">{['God called Samuel by name.', 'Samuel stopped and listened.', 'He answered, “Speak, Lord.”', 'Listening helped Samuel take his next step.'][trailStep]}</p>
            <button className="button button-primary trail-button" onClick={() => setTrailStep((step) => step === 3 ? 0 : step + 1)}>{trailStep === 3 ? 'Walk it again' : 'Next stop'}</button>
          </div>}
          {game === 'match' && <div className="game-card match-game">
            <div className="match-mark" aria-hidden="true"><span></span><i></i></div>
            <p className="game-prompt">Drag each clue to the part of the verse it matches. On a phone, tap a clue, then tap its place.</p>
            <div className="match-tokens" aria-label="Clues to match">
              {([{ id: 'lamp', label: 'Lantern', symbol: 'L' }, { id: 'path', label: 'Footsteps', symbol: 'F' }] as const).map((token) => {
                const placed = Object.values(matchPlaces).includes(token.id);
                return <button key={token.id} draggable={!placed} className={selectedMatch === token.id ? 'selected' : ''} disabled={placed} onDragStart={(event) => event.dataTransfer.setData('text/plain', token.id)} onClick={() => setSelectedMatch(token.id)}><span>{token.symbol}</span>{token.label}</button>;
              })}
            </div>
            <div className="match-zones">
              {([{ id: 'feet', text: 'a lamp to my feet' }, { id: 'way', text: 'a light for my path' }] as const).map((zone) => <button key={zone.id} className={matchPlaces[zone.id] ? 'filled' : ''} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const token = event.dataTransfer.getData('text/plain') as MatchToken; if (token === 'lamp' || token === 'path') placeMatch(zone.id, token); }} onClick={() => selectedMatch && placeMatch(zone.id, selectedMatch)}><small>{matchPlaces[zone.id] ? (matchPlaces[zone.id] === 'lamp' ? 'Lantern' : 'Footsteps') : 'Drop a clue here'}</small><strong>{zone.text}</strong></button>)}
            </div>
            <button className="button button-primary check-match" disabled={!matchComplete} onClick={() => setMatchChecked(true)}>Check my matches</button>
            {matchChecked && <div className={matchCorrect ? 'game-success' : 'game-note'} role="status">{matchCorrect ? 'That fits the verse. The lamp helps your feet see the path ahead.' : 'Good try. Swap the clues and see which picture fits each phrase.'}</div>}
            <button className="reset-game" onClick={() => { setMatchPlaces({}); setSelectedMatch(null); setMatchChecked(false); }}>Clear matches</button>
          </div>}
          <p className="privacy-note">No account needed. Nothing from these games is saved.</p>
        </div>
      </section>

      <section className="trust-band" aria-label="What families can expect"><div><b>Parent first</b><span>You create and manage the family.</span></div><div><b>Human approval</b><span>Every new family is checked.</span></div><div><b>Private by default</b><span>No public child profiles or artwork.</span></div><div><b>Made for focus</b><span>No ads or endless scrolling.</span></div></section>

      <section className="section how" id="how">
        <div className="section-heading"><p className="kicker">How it works</p><h2>A clear path from sign-up to story time.</h2><p>Getting started should not feel like paperwork. You set up the family once, then your children get a place built for them.</p></div>
        <div className="steps"><article><span>01</span><h3>A grown-up starts it</h3><p>Add your children, choose their age group and tell us which country you call home.</p></article><article><span>02</span><h3>We check the family</h3><p>A real person reviews the account before any child can enter The Lantern Club.</p></article><article><span>03</span><h3>They learn through play</h3><p>Children follow lessons, try games, make things and return to the Word in ways that feel natural.</p></article><article><span>04</span><h3>You can see the journey</h3><p>Check progress, view assignments and talk with their teacher from your own parent space.</p></article></div>
      </section>

      <section className="section activities-section" id="activities">
        <div className="section-heading left"><p className="kicker">Inside the club</p><h2>More than quizzes with Bible words.</h2><p>Every activity asks a child to notice something, choose something or make something. That is where the learning starts to stick.</p></div>
        <div className="activity-grid">{activities.map(([icon,title,copy,tone]) => <article className={`activity-card ${tone}`} key={title}><span className="letter-icon">{icon}</span><h3>{title}</h3><p>{copy}</p><a href="#join">See how it works <span>→</span></a></article>)}</div>
      </section>

      <section className="age-section">
        <div className="age-art"><Image src="/lantern-lion-logo.png" alt="Lantern and Lion mascot holding a lantern" width={390} height={390} /></div>
        <div className="age-copy"><p className="kicker">One family, two experiences</p><h2>Fun for children. Honest enough for teens.</h2><p>The younger club uses big cards, short instructions and story-led games. Teen spaces feel calmer and go further into real choices, faith questions and weekly practice.</p><div className="age-cards"><article><b>Children</b><span>Ages 5 to 12</span><p>Stories, puzzles, making, memory verses and gentle group play.</p></article><article><b>Teens</b><span>Ages 13 to 17</span><p>Decision labs, case files, daily light and faith that meets real life.</p></article></div></div>
      </section>

      <section className="section safety" id="safety">
        <div className="safety-intro"><p className="kicker light">Safety is part of the product</p><h2>Children should not have to trade privacy for play.</h2><p>Parents stay in charge. Teachers see only their assigned groups. Children cannot search for strangers or post to the public.</p><a className="button button-light" href="#join">Read our safety promise</a></div>
        <div className="safety-grid"><article><span>01</span><h3>No open chat</h3><p>Cooperative games use approved classmates and preset reactions.</p></article><article><span>02</span><h3>No public faces</h3><p>Children use safe profiles. Shared artwork stays with approved adults.</p></article><article><span>03</span><h3>A quick way to ask for help</h3><p>Every game includes a clear report button that reaches a responsible adult.</p></article><article><span>04</span><h3>Less data</h3><p>Children do not need email addresses. We collect only what the club needs to work.</p></article></div>
      </section>

      <section className="section parent-view"><div className="parent-panel"><div className="panel-top"><span>Parent view</span><b>This week with Amara</b><i>3 of 5 done</i></div><div className="progress-row"><span className="avatar">A</span><div><b>Growing in courage</b><small>Next up: Daniel makes a brave choice</small></div><strong>★ 42</strong></div><div className="progress-track"><i></i></div><div className="mini-cards"><span><b>2</b> verses learned</span><span><b>1</b> story finished</span><span><b>3 days</b> back this week</span></div></div><div className="parent-copy"><p className="kicker">Stay close without hovering</p><h2>See the learning, not every tap.</h2><p>Your parent space shows what they are working on, what is finished and where they might need a little help. You can also preview the club without changing their progress.</p><ul><li>View lessons and assignments</li><li>Message an assigned teacher</li><li>Manage child logins and privacy</li></ul></div></section>

      <section className="section quotes"><div className="section-heading"><p className="kicker">Around the family table</p><h2>The best result is a real conversation.</h2></div><div className="quote-grid">{parentQuotes.map(([quote,person],index) => <blockquote className={index === 1 ? 'featured' : ''} key={person}><span>“</span><p>{quote}</p><cite>{person}</cite></blockquote>)}</div></section>

      <section className="join-section" id="join"><div><p className="kicker">Open the lantern</p><h2>Give them a place where the Bible feels close.</h2><p>Start with one family account. We’ll guide you through the rest.</p></div><a className="button button-primary" href="#register">Create your family account</a></section>

      <footer><div className="footer-brand"><Image src="/lantern-lion-logo.png" alt="" width={76} height={76} /><div><strong>Lantern &amp; Lion</strong><p>Bible play for growing minds.</p></div></div><div><b>Explore</b><a href="#how">How it works</a><a href="#activities">Activities</a><a href="#game">Try a game</a></div><div><b>Families</b><a id="signin" href="#signin">Sign in</a><a id="register" href="#register">Register</a><a href="#safety">Safety</a></div><div><b>Company</b><a href="#about">About</a><a href="#help">Help</a><a href="#privacy">Privacy</a><a href="#terms">Terms</a></div><p className="copyright">© 2026 Lantern &amp; Lion. Built with care for families.</p></footer>
    </main>
  );
}
