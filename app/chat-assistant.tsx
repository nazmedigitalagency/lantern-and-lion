'use client';

import { useEffect, useRef, useState } from 'react';
import { FALLBACK_VERSES, STARTER_QUESTIONS, VERSES, Verse, isSensitive, matchTopic } from './chat-data';

type ChatMode = 'child' | 'teen';
type Message = { id: number; role: 'user' | 'ai'; text: string; verses?: string[]; sensitive?: boolean };

function pickVerses(refs: string[], max: number): string[] {
  return refs.slice(0, max);
}

function buildReply(mode: ChatMode, userText: string): { text: string; verses: string[]; sensitive: boolean } {
  if (isSensitive(userText)) {
    const text = mode === 'teen'
      ? 'Thank you for trusting me with something that heavy — that took real courage to type. I don’t want you carrying this by yourself, and I’m not the right one to carry it with you either. Please tell a parent, teacher, or another trusted adult what’s going on, today if you can. You matter, and this deserves a real person’s full attention, not just mine.'
      : 'Thank you for telling me that. That sounds really hard, and I care about you. This is something a grown-up you trust — like your parent or teacher — needs to know about too, so they can really help you. Please go and tell them, okay? You are not in trouble, and you did the right thing by saying something.';
    return { text, verses: pickVerses(['Psalm 34:18', 'Matthew 11:28'], 2), sensitive: true };
  }
  const topic = matchTopic(userText);
  if (topic) {
    const text = mode === 'teen' ? topic.teenAnswer : topic.childAnswer;
    return { text, verses: pickVerses(topic.verses, 2), sensitive: false };
  }
  const text = mode === 'teen'
    ? 'That’s a genuinely good question to sit with. I don’t have a perfect answer for everything, but here’s a place to start — and it’s always worth talking this through further with a parent, teacher, or your class leader too.'
    : 'That’s a great question to ask! I don’t know everything, but here’s something that might help — and you can always ask a parent or teacher about it too.';
  return { text, verses: pickVerses(FALLBACK_VERSES, 1), sensitive: false };
}

let messageId = 1;

export default function ChatAssistant({ mode, name, onSafetyFlag }: { mode: ChatMode; name: string; onSafetyFlag?: (message: string) => void }) {
  const storageKey = mode === 'teen' ? 'lanternLionTeenChatHistory' : 'lanternLionChildChatHistory';
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [activeVerse, setActiveVerse] = useState<Verse | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
        if (Array.isArray(saved) && saved.length) {
          setMessages(saved);
          messageId = Math.max(...saved.map((m: Message) => m.id)) + 1;
        }
      } catch { /* start fresh */ }
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { if (hydrated) localStorage.setItem(storageKey, JSON.stringify(messages)); }, [messages, hydrated, storageKey]);
  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' }); }, [messages, thinking]);

  useEffect(() => {
    if (!open) return;
    window.setTimeout(() => closeRef.current?.focus(), 0);
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') { if (activeVerse) setActiveVerse(null); else setOpen(false); } };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, activeVerse]);

  function send(rawText: string) {
    const text = rawText.trim();
    if (!text) return;
    const userMessage: Message = { id: messageId++, role: 'user', text };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setThinking(true);
    window.setTimeout(() => {
      const reply = buildReply(mode, text);
      const aiMessage: Message = { id: messageId++, role: 'ai', text: reply.text, verses: reply.verses, sensitive: reply.sensitive };
      setMessages((prev) => [...prev, aiMessage]);
      setThinking(false);
      if (reply.sensitive) onSafetyFlag?.(text);
    }, 700);
  }

  function handleSubmit(event: React.FormEvent) { event.preventDefault(); send(input); }

  const firstName = name.split(' ')[0] || name;
  const panelClass = mode === 'teen' ? 'chat-panel chat-panel-teen' : 'chat-panel chat-panel-child';

  return (
    <>
      <button className={mode === 'teen' ? 'chat-launcher chat-launcher-teen' : 'chat-launcher chat-launcher-child'} onClick={() => setOpen(true)}>
        <span aria-hidden="true">💬</span>{mode === 'teen' ? 'Ask Anything' : 'Ask a Question'}
      </button>

      {open && (
        <div className="chat-overlay" role="dialog" aria-modal="true" aria-label={mode === 'teen' ? 'Ask Anything chat' : 'Ask a Question chat'}>
          <div className={panelClass}>
            <header className="chat-panel-head">
              <div className="chat-persona"><span className="chat-persona-mark" aria-hidden="true">🏮</span><div><strong>Lumen</strong><small>{mode === 'teen' ? 'Here to talk it through with you' : 'A gentle helper, always here'}</small></div></div>
              <button ref={closeRef} className="chat-close" onClick={() => setOpen(false)} aria-label="Close chat">✕</button>
            </header>

            <div className="chat-messages" ref={listRef}>
              {messages.length === 0 && (
                <div className="chat-empty">
                  <p>{mode === 'teen' ? `Hey ${firstName}. Ask me anything — real questions welcome, no judgment.` : `Hi ${firstName}! You can ask me anything, even if it feels like a silly question. It isn’t.`}</p>
                  <div className="chat-starters">
                    {STARTER_QUESTIONS.map((question) => <button key={question} onClick={() => send(question)}>{question}</button>)}
                  </div>
                </div>
              )}
              {messages.map((message) => (
                <div key={message.id} className={message.role === 'user' ? 'chat-bubble chat-bubble-user' : `chat-bubble chat-bubble-ai${message.sensitive ? ' chat-bubble-caring' : ''}`}>
                  {message.role === 'ai' && <span className="chat-bubble-mark" aria-hidden="true">🏮</span>}
                  <div>
                    <p>
                      {message.text}
                      {message.verses && message.verses.length > 0 && (
                        <>
                          {' '}
                          {message.verses.map((ref, index) => (
                            <span key={ref}>
                              <button className="chat-verse-link" onClick={() => setActiveVerse(VERSES[ref])}>{ref}</button>
                              {index < message.verses!.length - 1 ? ', ' : ''}
                            </span>
                          ))}
                        </>
                      )}
                    </p>
                    {message.sensitive && <small className="chat-caring-note">💙 It also helps to tell a parent, teacher, or another trusted grown-up what you told me.</small>}
                  </div>
                </div>
              ))}
              {thinking && (
                <div className="chat-bubble chat-bubble-ai">
                  <span className="chat-bubble-mark" aria-hidden="true">🏮</span>
                  <div className="chat-typing"><span /><span /><span /></div>
                </div>
              )}
            </div>

            <form className="chat-input-row" onSubmit={handleSubmit}>
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={mode === 'teen' ? 'Type a real question…' : 'Type your question here…'}
                maxLength={280}
                aria-label="Your question"
              />
              <button type="submit" disabled={!input.trim()}>Send</button>
            </form>
            <p className="chat-safety-note">Lumen offers gentle guidance and Bible references, not a substitute for a parent, teacher, or trusted adult — especially for anything serious.</p>
          </div>
        </div>
      )}

      {activeVerse && (
        <div className="chat-verse-overlay" role="dialog" aria-modal="true" aria-label={`${activeVerse.ref} verse`} onClick={() => setActiveVerse(null)}>
          <div className={mode === 'teen' ? 'chat-verse-modal chat-verse-modal-teen' : 'chat-verse-modal'} onClick={(event) => event.stopPropagation()}>
            <button className="chat-close" onClick={() => setActiveVerse(null)} aria-label="Close verse">✕</button>
            <p className="chat-verse-ref">{activeVerse.ref}</p>
            <p className="chat-verse-text">“{activeVerse.text}”<span> WEB</span></p>
            <p className="chat-verse-meaning">{activeVerse.meaning}</p>
          </div>
        </div>
      )}
    </>
  );
}
