'use client';

import Image from 'next/image';
import { useState } from 'react';

type Path = 'child' | 'teen';
type Avatar = 'lion' | 'lantern' | 'dove' | 'olive';

const avatars: Array<{ id: Avatar; name: string; mark: string; tone: string }> = [
  { id: 'lion', name: 'Brave lion', mark: 'L', tone: 'gold' },
  { id: 'lantern', name: 'Bright lantern', mark: 'B', tone: 'coral' },
  { id: 'dove', name: 'Peaceful dove', mark: 'P', tone: 'sky' },
  { id: 'olive', name: 'Growing branch', mark: 'G', tone: 'teal' },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [path, setPath] = useState<Path | null>(null);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState<Avatar | null>(null);
  const [safetyReady, setSafetyReady] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);

  const firstName = name.trim().split(/\s+/)[0] || 'friend';
  const isTeen = path === 'teen';
  const activityCorrect = answer === 'listen';

  function restart() {
    setStep(1);
    setPath(null);
    setName('');
    setAvatar(null);
    setSafetyReady(false);
    setAnswer(null);
  }

  return (
    <main className={`onboarding-page ${isTeen ? 'teen-mode' : ''}`}>
      <header className="onboarding-header">
        <a className="onboarding-brand" href="/" aria-label="Back to Lantern and Lion home">
          <Image src="/lantern-lion-logo.png" alt="" width={54} height={54} priority />
          <span><strong>Lantern &amp; Lion</strong><small>The Lantern Club</small></span>
        </a>
        {step < 5 && <div className="onboarding-progress" aria-label={`Step ${step} of 4`}>
          <span>Step {step} of 4</span>
          <div><i style={{ width: `${step * 25}%` }} /></div>
        </div>}
        <a className="leave-onboarding" href="/">Leave for now</a>
      </header>

      <section className="onboarding-shell">
        {step === 1 && <div className="onboarding-card welcome-step">
          <p className="onboarding-kicker">Your space starts here</p>
          <h1>Which club feels like you?</h1>
          <p className="onboarding-lead">Pick the one that fits your age. You can change it later with your grown-up.</p>
          <div className="path-options">
            <button className={path === 'child' ? 'chosen' : ''} onClick={() => setPath('child')}>
              <span className="path-number">5–12</span><strong>The Lantern Club</strong><small>Big stories, puzzles and things to make.</small>
            </button>
            <button className={path === 'teen' ? 'chosen teen-choice' : 'teen-choice'} onClick={() => setPath('teen')}>
              <span className="path-number">13–17</span><strong>Lantern After Dark</strong><small>Real choices, deeper questions and weekly practice.</small>
            </button>
          </div>
          <button className="button button-primary onboarding-next" disabled={!path} onClick={() => setStep(2)}>This is my club</button>
        </div>}

        {step === 2 && <div className="onboarding-card identity-step">
          <p className="onboarding-kicker">Make it yours</p>
          <h1>What should we call you?</h1>
          <p className="onboarding-lead">Use your first name or a nickname. Don’t add your surname, school or address.</p>
          <label className="name-field">Name or nickname<input autoFocus maxLength={18} value={name} onChange={(event) => setName(event.target.value)} placeholder={isTeen ? 'For example, Jay' : 'For example, Amara'} /></label>
          <fieldset className="avatar-picker"><legend>Choose a club picture</legend><div>{avatars.map((item) => <button type="button" key={item.id} className={`${item.tone} ${avatar === item.id ? 'chosen' : ''}`} aria-pressed={avatar === item.id} onClick={() => setAvatar(item.id)}><span>{item.mark}</span><small>{item.name}</small></button>)}</div></fieldset>
          <div className="onboarding-actions"><button className="back-button" onClick={() => setStep(1)}>Back</button><button className="button button-primary" disabled={!name.trim() || !avatar} onClick={() => setStep(3)}>That’s me</button></div>
        </div>}

        {step === 3 && <div className="onboarding-card safety-step">
          <p className="onboarding-kicker">A quick safety promise</p>
          <h1>{firstName}, this club should always feel safe.</h1>
          <div className="safety-promises">
            <article><span>01</span><div><strong>Keep private things private</strong><p>Don’t share your full name, school, address, phone number or passwords.</p></div></article>
            <article><span>02</span><div><strong>Use the help flag</strong><p>If something feels strange, confusing or unkind, flag it. A trusted grown-up will check it.</p></div></article>
            <article><span>03</span><div><strong>Kindness counts here</strong><p>Speak to other people the way you would want them to speak to you.</p></div></article>
          </div>
          <label className="safety-check"><input type="checkbox" checked={safetyReady} onChange={(event) => setSafetyReady(event.target.checked)} /><span>I understand. I’ll ask a trusted grown-up when I need help.</span></label>
          <div className="onboarding-actions"><button className="back-button" onClick={() => setStep(2)}>Back</button><button className="button button-primary" disabled={!safetyReady} onClick={() => setStep(4)}>I’m ready</button></div>
        </div>}

        {step === 4 && <div className="onboarding-card first-light-step">
          <p className="onboarding-kicker">Your first light</p>
          <h1>{isTeen ? 'What does listening look like?' : 'Samuel heard his name. What should he do?'}</h1>
          <p className="story-line">“Then Samuel said, ‘Speak; for your servant hears.’” <span>1 Samuel 3:10, WEB</span></p>
          <div className="first-choices">
            <button className={answer === 'listen' ? 'picked' : ''} onClick={() => setAnswer('listen')}>Pause and listen carefully</button>
            <button className={answer === 'rush' ? 'picked' : ''} onClick={() => setAnswer('rush')}>Rush ahead without listening</button>
            <button className={answer === 'hide' ? 'picked' : ''} onClick={() => setAnswer('hide')}>Pretend he heard nothing</button>
          </div>
          {answer && <div className={activityCorrect ? 'onboarding-success' : 'onboarding-try'} role="status">{activityCorrect ? 'Yes. Samuel stopped, listened and answered.' : 'Have another look at Samuel’s words. Which choice shows that he was listening?'}</div>}
          <div className="onboarding-actions"><button className="back-button" onClick={() => setStep(3)}>Back</button><button className="button button-primary" disabled={!activityCorrect} onClick={() => setStep(5)}>Finish my first light</button></div>
        </div>}

        {step === 5 && <div className="onboarding-card finish-step">
          <div className="finish-lantern"><span></span><i></i></div>
          <p className="onboarding-kicker">Your lantern is lit</p>
          <h1>Welcome in, {firstName}.</h1>
          <p className="onboarding-lead">You finished your first light and learned how to ask for help. Your next story is waiting.</p>
          <div className="earned-card"><span>First light</span><strong>Listening well</strong><small>1 activity finished</small></div>
          <a className="button button-primary onboarding-next" href="/#activities">See what’s waiting</a>
          <button className="reset-onboarding" onClick={restart}>Try the onboarding again</button>
        </div>}
      </section>
    </main>
  );
}
