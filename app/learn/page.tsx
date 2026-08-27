'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type Activity = {
  slug: string; title: string; type: 'story' | 'choice' | 'order' | 'match' | 'reflect'; minutes: number;
  eyebrow: string; intro: string; reference: string; prompt: string; hint: string;
  options?: string[]; answer?: string; words?: string[]; pairs?: Array<[string,string]>;
};

const activities: Activity[] = [
  { slug:'david-chooses-courage', title:'David chooses courage', type:'story', minutes:8, eyebrow:'Story path', intro:'David is young, but he remembers how God helped him before. Walk through the moment one step at a time.', reference:'1 Samuel 17:32–37', prompt:'What helped David take a brave step?', hint:'Think about what David remembered before he faced Goliath.', options:['The crowd promised he would win','He remembered God’s help before','He had the biggest armour'], answer:'He remembered God’s help before' },
  { slug:'build-psalm-119-105', title:'Build Psalm 119:105', type:'order', minutes:4, eyebrow:'Word builder', intro:'Put the words in the right order. You can tap a chosen word to return it to the bank.', reference:'Psalm 119:105, WEB', prompt:'Build the first part of the verse.', hint:'The verse begins by talking about God’s word.', words:['Your','word','is','a','lamp','to','my','feet'], answer:'Your word is a lamp to my feet' },
  { slug:'kind-choice-at-lunch', title:'A kind choice at lunch', type:'choice', minutes:6, eyebrow:'Decision story', intro:'Someone new is sitting alone at lunch. Your friends are busy talking. What could kindness look like?', reference:'Luke 6:31', prompt:'Choose the response that treats the new student as you would want to be treated.', hint:'Kindness notices someone and gives them a safe way to join.', options:['Invite them to sit with you','Point them out to everyone','Wait for someone else to help'], answer:'Invite them to sit with you' },
  { slug:'make-a-courage-card', title:'Make a courage card', type:'reflect', minutes:10, eyebrow:'Create and reflect', intro:'Write a short reminder you can read when something good feels difficult.', reference:'Joshua 1:9', prompt:'Finish this sentence: “With God’s help, I can be brave when…”', hint:'Think of one real moment at home, school, church or with a friend.' },
  { slug:'samuel-listens', title:'Samuel listens', type:'match', minutes:7, eyebrow:'Listening trail', intro:'Match each moment in Samuel’s story with what it teaches us about listening.', reference:'1 Samuel 3:1–10', prompt:'Choose a lesson for each story moment.', hint:'One answer can be used only once.', pairs:[['Samuel hears his name','Pay attention'],['Samuel asks Eli for help','Ask a trusted grown-up'],['Samuel says, “Speak”','Be ready to listen']] },
  { slug:'what-did-ruth-notice', title:'What did Ruth notice?', type:'choice', minutes:3, eyebrow:'Quick quiz', intro:'Ruth chose to stay with Naomi when Naomi was grieving and returning home.', reference:'Ruth 1:16–18', prompt:'What does Ruth’s choice show?', hint:'Ruth stayed close when leaving would have been easier.', options:['Loyal love can stay through hard moments','Only easy friendships matter','Courage means never feeling sad'], answer:'Loyal love can stay through hard moments' },
];

function getSlug() { return typeof window === 'undefined' ? activities[0].slug : new URLSearchParams(window.location.search).get('activity') || activities[0].slug; }

export default function LearnPage() {
  const [slug,setSlug] = useState(activities[0].slug);
  const [chosen,setChosen] = useState('');
  const [ordered,setOrdered] = useState<string[]>([]);
  const [matches,setMatches] = useState<Record<string,string>>({});
  const [reflection,setReflection] = useState('');
  const [feedback,setFeedback] = useState('');
  const [showHint,setShowHint] = useState(false);
  const [attempts,setAttempts] = useState(0);
  const [done,setDone] = useState(false);
  const [teen,setTeen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => { setSlug(getSlug()); try { const family = JSON.parse(localStorage.getItem('lanternLionDemoFamily') || 'null'); const activeId = Number(localStorage.getItem('lanternLionActiveChildId')); const child = family?.children?.find((item: {id:number}) => item.id === activeId) || family?.children?.[0]; setTeen(Boolean(child?.age >= 13)); } catch { /* Use the younger reading level. */ } },0);
    return () => window.clearTimeout(timer);
  }, []);
  const activity = useMemo(() => activities.find((item) => item.slug === slug) || activities[0],[slug]);
  const bank = activity.words?.filter((word) => !ordered.includes(word)) || [];

  function reset(nextSlug = activity.slug) {
    setSlug(nextSlug); setChosen(''); setOrdered([]); setMatches({}); setReflection(''); setFeedback(''); setShowHint(false); setAttempts(0); setDone(false);
    window.history.replaceState(null,'',`/learn?activity=${nextSlug}`);
  }

  function finish() {
    let correct = false;
    if (activity.type === 'story' || activity.type === 'choice') correct = chosen === activity.answer;
    if (activity.type === 'order') correct = ordered.join(' ') === activity.answer;
    if (activity.type === 'match') correct = Boolean(activity.pairs?.every(([moment,lesson]) => matches[moment] === lesson));
    if (activity.type === 'reflect') correct = reflection.trim().length >= 12;
    setAttempts((value) => value + 1);
    if (!correct) {
      setFeedback(activity.type === 'reflect' ? 'That is a good start. Add a little more so future you remembers the moment.' : 'Not quite yet, and that’s okay. Your choices have been reset so you can try a new answer.');
      if (activity.type === 'story' || activity.type === 'choice') setChosen('');
      if (activity.type === 'order') setOrdered([]);
      if (activity.type === 'match') setMatches({});
      return;
    }
    const saved = JSON.parse(localStorage.getItem('lanternLionDemoProgress') || '[]');
    const next = Array.from(new Set([...(Array.isArray(saved) ? saved : []),activity.title]));
    localStorage.setItem('lanternLionDemoProgress',JSON.stringify(next));
    localStorage.setItem('lanternLionLastActivity',JSON.stringify({title:activity.title,attempts:attempts + 1,finishedAt:new Date().toISOString()}));
    setFeedback('You found it. Take a moment to remember what made the answer true.'); setDone(true);
  }

  const nextIndex = (activities.findIndex((item) => item.slug === activity.slug) + 1) % activities.length;
  const canCheck = activity.type === 'reflect' ? reflection.trim().length > 0 : activity.type === 'order' ? ordered.length === activity.words?.length : activity.type === 'match' ? Object.keys(matches).length === activity.pairs?.length : Boolean(chosen);

  return <main className="learning-page">
    <header className="learning-topbar"><Link href="/child-dashboard"><Image src="/lantern-lion-logo.png" alt="" width={48} height={48}/><span><strong>Lantern &amp; Lion</strong><small>Back to my path</small></span></Link><div><span>{activity.minutes} min</span><span>{activity.reference}</span></div></header>
    <div className="learning-shell">
      <aside className="learning-map" aria-label="Activity library"><p>Activity path</p>{activities.map((item,index) => <button key={item.slug} aria-current={item.slug === activity.slug ? 'step' : undefined} onClick={() => reset(item.slug)}><span>{index + 1}</span><div><strong>{item.title}</strong><small>{item.minutes} minutes</small></div></button>)}</aside>
      <section className="learning-stage">
        <div className="learning-progress"><span><i style={{width:done?'100%':'55%'}}/></span><small>{done ? 'Activity complete' : 'One thoughtful step at a time'}</small></div>
        <article className={`learning-card ${feedback && !done ? 'motion-wrong' : ''}`}>
          <p className="child-kicker">{activity.eyebrow}</p><h1>{activity.title}</h1><p className="learning-intro">{activity.intro}</p>{teen && <p className="learning-age-note">Teen reflection: look beyond the obvious answer and connect this choice to a situation you might actually face.</p>}
          <div className="scripture-chip"><span>Open book</span><strong>{activity.reference}</strong></div>
          <div className="learning-question"><h2>{activity.prompt}</h2>
            {(activity.type === 'story' || activity.type === 'choice') && <div className="learning-options">{activity.options?.map((option) => <button key={option} aria-pressed={chosen === option} onClick={() => {setChosen(option);setFeedback('');}}><span>{chosen === option ? '✓' : String.fromCharCode(65 + activity.options!.indexOf(option))}</span>{option}</button>)}</div>}
            {activity.type === 'order' && <><div className="verse-answer" aria-label="Your verse">{ordered.length ? ordered.map((word,index) => <button key={`${word}-${index}`} onClick={() => {setOrdered(ordered.filter((_,i) => i !== index));setFeedback('');}}>{word}</button>) : <span>Choose the first word below</span>}</div><div className="verse-bank">{bank.map((word,index) => <button key={`${word}-${index}`} onClick={() => {setOrdered([...ordered,word]);setFeedback('');}}>{word}</button>)}</div></>}
            {activity.type === 'match' && <div className="learning-matches">{activity.pairs?.map(([moment]) => <label key={moment}><span>{moment}</span><select value={matches[moment] || ''} onChange={(event) => {setMatches({...matches,[moment]:event.target.value});setFeedback('');}}><option value="">Choose a lesson</option>{activity.pairs?.map(([,lesson]) => <option key={lesson}>{lesson}</option>)}</select></label>)}</div>}
            {activity.type === 'reflect' && <label className="learning-reflect"><span>Your courage reminder</span><textarea maxLength={240} value={reflection} onChange={(event) => {setReflection(event.target.value);setFeedback('');}} placeholder="With God’s help, I can be brave when…"/><small>{reflection.length}/240 characters. This stays on this device.</small></label>}
          </div>
          <div className="learning-actions"><button className="hint-button" aria-expanded={showHint} onClick={() => setShowHint(!showHint)}>Light a hint</button><button className="button button-primary" disabled={!canCheck || done} onClick={finish}>{done ? 'Completed' : 'Check my answer'}</button></div>
          {showHint && <p className="learning-hint" role="note"><strong>A little light:</strong> {activity.hint}</p>}
          {feedback && <div className={done ? 'learning-feedback correct' : 'learning-feedback'} role="status"><span>{done ? '✓' : '↻'}</span><div><strong>{done ? 'Well noticed' : 'Keep going'}</strong><p>{feedback}</p></div></div>}
          {done && <div className="learning-finish"><div><strong>+8 light points</strong><span>Saved on this device</span></div><button onClick={() => reset(activities[nextIndex].slug)}>Try the next activity</button><Link href="/child-dashboard">Return to my dashboard</Link></div>}
        </article>
        <p className="learning-safety">You never lose points for a wrong answer. Asking for help and trying again are both part of learning.</p>
      </section>
    </div>
  </main>;
}
