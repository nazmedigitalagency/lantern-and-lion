'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

type Screen = 'welcome' | 'setup' | 'lobby' | 'play' | 'results';
type Team = 'Lanterns' | 'Lions';

type Question = {
  reference: string;
  prompt: string;
  options: string[];
  answer: number;
  explain: string;
};

const questions: Question[] = [
  {
    reference: '1 Samuel 17:37',
    prompt: 'What did David remember before facing Goliath?',
    options: ['How loudly the crowd cheered', 'How God helped him before', 'How heavy Saul’s armour was'],
    answer: 1,
    explain: 'David remembered God’s help with the lion and the bear. Remembering gave courage to his next step.',
  },
  {
    reference: 'Psalm 119:105',
    prompt: 'Complete the picture: God’s word is a lamp to my…',
    options: ['feet', 'house', 'neighbour'],
    answer: 0,
    explain: 'The verse says God’s word is a lamp to our feet and a light for our path.',
  },
  {
    reference: 'Luke 10:33–34',
    prompt: 'What did the Samaritan do when he noticed the hurt man?',
    options: ['Walk to the other side', 'Stop and care for him', 'Wait for a crowd'],
    answer: 1,
    explain: 'Compassion moved the Samaritan closer. He stopped, cared and made sure help continued.',
  },
  {
    reference: '1 Samuel 3:10',
    prompt: 'How did Samuel show he was ready to listen?',
    options: ['He hid under his blanket', 'He said, “Speak”', 'He ran outside'],
    answer: 1,
    explain: 'Samuel answered and made space to listen. Listening was his faithful next step.',
  },
  {
    reference: 'Ruth 1:16',
    prompt: 'Which word best describes Ruth’s choice to stay with Naomi?',
    options: ['Loyal', 'Careless', 'Impatient'],
    answer: 0,
    explain: 'Ruth showed loyal love by staying close during a difficult change.',
  },
];

export default function MultiplayerPage() {
  const [screen, setScreen] = useState<Screen>('welcome');
  const [isHost, setIsHost] = useState(false);
  const [roomName, setRoomName] = useState('Wednesday Courage Quest');
  const [code, setCode] = useState('LIGHT-482');
  const [joinCode, setJoinCode] = useState('');
  const [team, setTeam] = useState<Team>('Lanterns');
  const [question, setQuestion] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'right' | 'wrong' | null>(null);
  const [lanternScore, setLanternScore] = useState(0);
  const [lionScore, setLionScore] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reaction, setReaction] = useState('');
  const [rounds, setRounds] = useState(5);
  const [timeLimit, setTimeLimit] = useState('No timer');

  const players: [string, Team][] = [
    ['Amara', 'Lanterns'],
    ['Noah', 'Lanterns'],
    ['Mia', 'Lanterns'],
    ['Tobi', 'Lions'],
    ['Jay', 'Lions'],
    ['Zara', 'Lions'],
  ];

  function createRoom() {
    setIsHost(true);
    setCode(`LIGHT-${Math.floor(100 + Math.random() * 900)}`);
    setScreen('lobby');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function joinRoom() {
    const cleanCode = joinCode.trim().replace(/\s/g, '').toUpperCase();
    if (cleanCode !== 'LIGHT-482' && cleanCode !== 'LION-482' && cleanCode !== 'LAMP-731') {
      setReaction('That code did not open a room. Ask your grown-up or teacher to check it.');
      return;
    }
    setIsHost(false);
    setCode(cleanCode);
    setScreen('lobby');
    setReaction('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function start() {
    setQuestion(0);
    setSelected(null);
    setFeedback(null);
    setLanternScore(0);
    setLionScore(0);
    setScreen('play');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function check() {
    if (selected === null) return;
    if (selected !== questions[question].answer) {
      setSelected(null);
      setFeedback('wrong');
      return;
    }
    setFeedback('right');
    if (team === 'Lanterns') setLanternScore((v) => v + 3);
    else setLionScore((v) => v + 3);
  }

  function next() {
    if (question + 1 >= Math.min(rounds, questions.length)) {
      setScreen('results');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setQuestion((v) => v + 1);
    setSelected(null);
    setFeedback(null);
    setReaction('');
  }

  function leave() {
    setScreen('welcome');
    setFeedback(null);
    setSelected(null);
    setReaction('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const q = questions[question];

  return (
    <main className="multi-page">
      <header className="multi-header">
        <Link href="/">
          <Image src="/lantern-lion-logo.png" width={54} height={54} alt="" />
          <span>
            <strong>Lantern &amp; Lion</strong>
            <small>Team games</small>
          </span>
        </Link>
        <div>
          <span>Private rooms only</span>
          <Link href="/child-dashboard">Leave safely</Link>
        </div>
      </header>

      {/* ── WELCOME SCREEN ──────────────────────────────── */}
      {screen === 'welcome' && (
        <>
          <section className="multi-welcome">
            <div className="multi-welcome-copy">
              <p className="multi-kicker">Play together, stay protected</p>
              <h1>Bible games for people you already know.</h1>
              <p>
                Families and teachers create private rooms. Children join with a short code, work in teams and use preset reactions. There is no public matchmaking and no open chat.
              </p>
              <div>
                <button
                  className="button button-primary"
                  onClick={() => {
                    setIsHost(true);
                    setScreen('setup');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  Create a private game
                </button>
                <button
                  className="button button-secondary"
                  onClick={() => {
                    setIsHost(false);
                    setScreen('setup');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  Join with a code
                </button>
              </div>
              <ul>
                <li><span>✓</span> Adult-controlled rooms</li>
                <li><span>✓</span> Cooperative team play</li>
                <li><span>✓</span> No strangers or open chat</li>
              </ul>
            </div>

            <div className="multi-preview">
              <div className="multi-score">
                <article>
                  <span>L</span>
                  <strong>Lanterns</strong>
                  <b>12</b>
                </article>
                <i>Round 3 of 5</i>
                <article>
                  <span>L</span>
                  <strong>Lions</strong>
                  <b>9</b>
                </article>
              </div>
              <div className="multi-preview-card">
                <small>Psalm 119:105</small>
                <h2>What helps us see the next step?</h2>
                <div>
                  <span>A lamp</span>
                  <span>A crown</span>
                  <span>A boat</span>
                </div>
              </div>
              <p><span>★</span> Everyone answers. The team learns together.</p>
            </div>
          </section>

          {/* ── SECTION 1: ABOUT TEAM GAMES ───────────────── */}
          <section className="multi-explainer-section" id="about-team-games">
            <div className="multi-explainer-shell">
              <div className="multi-section-head">
                <p className="multi-kicker">Protected Multi-User Space</p>
                <h2>What are Lantern &amp; Lion Team Games?</h2>
                <p className="multi-section-lead">
                  Team Games bring scripture alive in a synchronous, shared circle. Whether you are leading a Sunday School group of 20 kids or playing across two tablets in the living room, games are private by design.
                </p>
              </div>

              <div className="multi-pillar-grid">
                <article className="multi-pillar-card">
                  <div className="pillar-icon gold">🔒</div>
                  <h3>Private Invitation Only</h3>
                  <p>
                    There is no global search directory and no stranger matchmaking. Only players who receive the host’s private join code can enter the room.
                  </p>
                </article>

                <article className="multi-pillar-card">
                  <div className="pillar-icon teal">💬</div>
                  <h3>Kind, Preset Reactions</h3>
                  <p>
                    Instead of open text typing where cyberbullying can occur, children cheer each other on with fast emoji stamps like <em>“I’m thinking!”</em>, <em>“Good clue!”</em>, and <em>“We got this!”</em>.
                  </p>
                </article>

                <article className="multi-pillar-card">
                  <div className="pillar-icon coral">🛡️</div>
                  <h3>Adult-Moderated Pacing</h3>
                  <p>
                    Parents and teachers have full host controls: pause the game at any moment to talk through a verse, remove timers to eliminate rushing, and end sessions safely.
                  </p>
                </article>
              </div>
            </div>
          </section>

          {/* ── SECTION 2: HOW IT WORKS (STEP-BY-STEP) ────── */}
          <section className="multi-explainer-section alt-bg" id="how-it-works">
            <div className="multi-explainer-shell">
              <div className="multi-section-head">
                <p className="multi-kicker">Step-By-Step Guide</p>
                <h2>How Team Games Work</h2>
                <p className="multi-section-lead">
                  Get your room running in under 60 seconds. No passwords or app downloads required for joining players.
                </p>
              </div>

              <div className="multi-steps-grid">
                <article className="multi-step-card">
                  <span className="step-badge">1</span>
                  <h3>Host Creates Room</h3>
                  <p>
                    A parent or teacher clicks <strong>Create a private game</strong>, chooses the room title, sets 3 or 5 rounds, and decides whether to include a question timer.
                  </p>
                </article>

                <article className="multi-step-card">
                  <span className="step-badge">2</span>
                  <h3>Players Enter Code</h3>
                  <p>
                    The host receives a generated code (e.g. <code>LIGHT-482</code>). Children and students enter this code on their devices to enter the private lobby.
                  </p>
                </article>

                <article className="multi-step-card">
                  <span className="step-badge">3</span>
                  <h3>Pick Teams &amp; Play</h3>
                  <p>
                    Players split into the <strong>Lanterns</strong> and <strong>Lions</strong> squads. Each round presents a passage clue and prompt to discuss and solve together.
                  </p>
                </article>

                <article className="multi-step-card">
                  <span className="step-badge">4</span>
                  <h3>Celebrate Shared Light</h3>
                  <p>
                    Correct team answers earn points, but the final ceremony honors both teams for bringing their light and memorizing God’s Word together.
                  </p>
                </article>
              </div>
            </div>
          </section>

          {/* ── SECTION 3: WHY TEAM GAMES? ─────────────────── */}
          <section className="multi-explainer-section" id="why-team-games">
            <div className="multi-explainer-shell">
              <div className="multi-section-head">
                <p className="multi-kicker">The Purpose &amp; Impact</p>
                <h2>Why Play Scripture Games as a Team?</h2>
                <p className="multi-section-lead">
                  Faith grows best when it is shared and discussed out loud.
                </p>
              </div>

              <div className="multi-why-grid">
                <article className="multi-why-card">
                  <span className="why-badge">🤝</span>
                  <div>
                    <h3>Turns Screen Time into Family Fellowship</h3>
                    <p>
                      Instead of solitary scrolling, multiplayer rounds encourage siblings, parents, and friends to talk, ask questions, and celebrate answers together.
                    </p>
                  </div>
                </article>

                <article className="multi-why-card">
                  <span className="why-badge">💡</span>
                  <div>
                    <h3>Deeper Bible Recall Through Discussion</h3>
                    <p>
                      Working through choices together activates memory far better than passive reading. Children explain <em>why</em> an answer is true from the story context.
                    </p>
                  </div>
                </article>

                <article className="multi-why-card">
                  <span className="why-badge">🌟</span>
                  <div>
                    <h3>Healthy, Non-Toxic Competition</h3>
                    <p>
                      Scores add excitement without discouragement. Points celebrate group effort, and both squads share in the victory verse at the end of every quest.
                    </p>
                  </div>
                </article>

                <article className="multi-why-card">
                  <span className="why-badge">📱</span>
                  <div>
                    <h3>Zero Installation Friction</h3>
                    <p>
                      Runs seamlessly on any browser, iPad, Android tablet, Chromebook, or smartphone with responsive controls and ultra-fast touch targets.
                    </p>
                  </div>
                </article>
              </div>

              {/* Bottom Launch Banner */}
              <div className="multi-bottom-cta">
                <h2>Ready to play together?</h2>
                <p>Gather your family or classroom and start a game in seconds.</p>
                <div className="cta-actions">
                  <button
                    className="button button-primary"
                    onClick={() => {
                      setIsHost(true);
                      setScreen('setup');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    Create a private game
                  </button>
                  <button
                    className="button button-secondary"
                    onClick={() => {
                      setIsHost(false);
                      setScreen('setup');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    Join with a code
                  </button>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* ── SETUP SCREEN ────────────────────────────────── */}
      {screen === 'setup' && (
        <section className="multi-setup">
          <div>
            <p className="multi-kicker">{isHost ? 'Host a game' : 'Join a private room'}</p>
            <h1>{isHost ? 'Set the room, then invite your group.' : 'Enter the code from your grown-up.'}</h1>
            <p>
              {isHost
                ? 'Choose a short game for a family or classroom. You can pause or end it at any time.'
                : 'Codes are shared privately by a parent or teacher. You cannot browse for rooms.'}
            </p>
          </div>

          {isHost ? (
            <div className="multi-setup-card">
              <label>
                Room name
                <input value={roomName} maxLength={40} onChange={(e) => setRoomName(e.target.value)} />
              </label>
              <label>
                Number of rounds
                <select value={rounds} onChange={(e) => setRounds(Number(e.target.value))}>
                  <option value={3}>3 rounds (Quick sprint)</option>
                  <option value={5}>5 rounds (Full quest)</option>
                </select>
              </label>
              <label>
                Answer time
                <select value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)}>
                  <option>No timer (Relaxed)</option>
                  <option>30 seconds</option>
                  <option>60 seconds</option>
                </select>
              </label>
              <div className="multi-safety-choice">
                <span>Room safety</span>
                <strong>Invite code, preset reactions, adult controls</strong>
              </div>
              <button className="button button-primary" onClick={createRoom}>
                Create room
              </button>
              <button onClick={() => setScreen('welcome')}>Back</button>
            </div>
          ) : (
            <div className="multi-setup-card join">
              <label>
                Room code
                <input
                  value={joinCode}
                  onChange={(e) => {
                    setJoinCode(e.target.value.toUpperCase());
                    setReaction('');
                  }}
                  placeholder="Try LIGHT-482"
                />
              </label>
              {reaction && (
                <p className="multi-error" role="alert">
                  {reaction}
                </p>
              )}
              <button className="button button-primary" onClick={joinRoom}>
                Join room
              </button>
              <button onClick={() => setScreen('welcome')}>Back</button>
              <small>
                Demo codes: <b>LIGHT-482</b>, <b>LION-482</b>, <b>LAMP-731</b>
              </small>
            </div>
          )}
        </section>
      )}

      {/* ── LOBBY SCREEN ────────────────────────────────── */}
      {screen === 'lobby' && (
        <section className="multi-lobby">
          <div className="multi-lobby-title">
            <p className="multi-kicker">Private game lobby</p>
            <h1>{roomName}</h1>
            <p>
              {isHost
                ? 'Share this code with approved players. Start when everyone is ready.'
                : 'You’re in. Choose your team and wait for the grown-up to begin.'}
            </p>
          </div>

          <div className="multi-code">
            <span>Room code</span>
            <strong>{code}</strong>
            <small>Only people with this code can enter this demo room.</small>
          </div>

          <div className="multi-lobby-grid">
            <section>
              <div className="multi-team-head">
                <span>Lanterns</span>
                <b>3 players</b>
              </div>
              {players
                .filter((p) => p[1] === 'Lanterns')
                .map((p) => (
                  <article key={p[0]}>
                    <span>{p[0][0]}</span>
                    <strong>{p[0]}</strong>
                    <small>Ready</small>
                  </article>
                ))}
              {!isHost && (
                <button className={team === 'Lanterns' ? 'chosen' : ''} onClick={() => setTeam('Lanterns')}>
                  Join Lanterns
                </button>
              )}
            </section>

            <section>
              <div className="multi-team-head">
                <span>Lions</span>
                <b>3 players</b>
              </div>
              {players
                .filter((p) => p[1] === 'Lions')
                .map((p) => (
                  <article key={p[0]}>
                    <span>{p[0][0]}</span>
                    <strong>{p[0]}</strong>
                    <small>Ready</small>
                  </article>
                ))}
              {!isHost && (
                <button className={team === 'Lions' ? 'chosen' : ''} onClick={() => setTeam('Lions')}>
                  Join Lions
                </button>
              )}
            </section>
          </div>

          <div className="multi-lobby-actions">
            <button onClick={leave}>Leave room</button>
            <button className="button button-primary" onClick={start}>
              {isHost ? 'Start the game' : 'Preview player game'}
            </button>
          </div>

          <p className="multi-demo-note">
            In the live backend version, only the host can start. “Preview player game” is available here so you can test the full demo by yourself.
          </p>
        </section>
      )}

      {/* ── PLAY SCREEN ─────────────────────────────────── */}
      {screen === 'play' && (
        <section className="multi-play">
          <div className="multi-gamebar">
            <div>
              <span>Room {code}</span>
              <strong>{roomName}</strong>
            </div>
            <div className="multi-live-score">
              <span>
                Lanterns <b>{lanternScore}</b>
              </span>
              <i>
                Round {question + 1}/{Math.min(rounds, questions.length)}
              </i>
              <span>
                Lions <b>{lionScore}</b>
              </span>
            </div>
            {isHost ? (
              <button onClick={() => setPaused(!paused)}>{paused ? 'Resume game' : 'Pause game'}</button>
            ) : (
              <span className="multi-safe-label">Preset reactions only</span>
            )}
          </div>

          {paused ? (
            <div className="multi-paused">
              <span>Ⅱ</span>
              <h1>The host paused the game.</h1>
              <p>Take a breath. Your answer is still here.</p>
              <button onClick={() => setPaused(false)}>Resume demo</button>
            </div>
          ) : (
            <div className="multi-round">
              <aside>
                <p className="multi-kicker">Team {team}</p>
                <h2>Work it out, then choose.</h2>
                <div>
                  {['I’m thinking', 'Good clue!', 'We can do this'].map((item) => (
                    <button key={item} onClick={() => setReaction(item)}>
                      {item}
                    </button>
                  ))}
                </div>
                {reaction && (
                  <p className="multi-reaction" role="status">
                    {reaction}
                  </p>
                )}
                <small>No typed chat. Reactions disappear after the round.</small>
              </aside>

              <article className={feedback === 'wrong' ? 'motion-wrong' : ''}>
                <div className="multi-question-top">
                  <span>{q.reference}</span>
                  <b>{timeLimit}</b>
                </div>
                <h1>{q.prompt}</h1>
                <div className="multi-options">
                  {q.options.map((option, index) => (
                    <button
                      key={option}
                      aria-pressed={selected === index}
                      onClick={() => {
                        setSelected(index);
                        setFeedback(null);
                      }}
                    >
                      <span>{String.fromCharCode(65 + index)}</span>
                      {option}
                    </button>
                  ))}
                </div>

                {feedback && (
                  <div className={feedback === 'right' ? 'multi-correct' : 'multi-wrong'} role="status">
                    <strong>{feedback === 'right' ? 'That’s it!' : 'Not quite yet.'}</strong>
                    <p>
                      {feedback === 'right'
                        ? q.explain
                        : 'Your answer has been cleared. Talk it through with your team and try again.'}
                    </p>
                  </div>
                )}

                <div className="multi-answer-actions">
                  {isHost && (
                    <button className="multi-end" onClick={() => setScreen('results')}>
                      End game
                    </button>
                  )}
                  {feedback === 'right' ? (
                    <button className="button button-primary" onClick={next}>
                      {question + 1 >= Math.min(rounds, questions.length) ? 'See results' : 'Next round'}
                    </button>
                  ) : (
                    <button className="button button-primary" disabled={selected === null} onClick={check}>
                      Lock in answer
                    </button>
                  )}
                </div>
              </article>
            </div>
          )}
        </section>
      )}

      {/* ── RESULTS SCREEN ──────────────────────────────── */}
      {screen === 'results' && (
        <section className="multi-results">
          <div className="multi-trophy">
            <span>★</span>
          </div>
          <p className="multi-kicker">Game complete</p>
          <h1>Both teams brought their light.</h1>
          <p>The score makes it playful. What you noticed together is the real win.</p>

          <div className="multi-final-score">
            <article className={lanternScore >= lionScore ? 'winner' : ''}>
              <span>Lanterns</span>
              <strong>{lanternScore}</strong>
              <small>{lanternScore >= lionScore ? 'Bright work!' : 'Great teamwork'}</small>
            </article>
            <article className={lionScore >= lanternScore ? 'winner' : ''}>
              <span>Lions</span>
              <strong>{lionScore}</strong>
              <small>{lionScore >= lanternScore ? 'Brave work!' : 'Great teamwork'}</small>
            </article>
          </div>

          <div className="multi-results-actions">
            <button
              className="button button-primary"
              onClick={() => {
                setLanternScore(0);
                setLionScore(0);
                setScreen('lobby');
              }}
            >
              Play another game
            </button>
            <Link href={isHost ? '/teacher-dashboard' : '/child-dashboard'}>Return to dashboard</Link>
          </div>

          <blockquote>
            “Your word is a lamp to my feet, and a light for my path.” <small>Psalm 119:105, WEB</small>
          </blockquote>
        </section>
      )}
    </main>
  );
}
