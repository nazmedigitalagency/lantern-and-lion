'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useMessageThreads, useRealtimeMessages } from '../lib/messages/useRealtimeMessages';
import type { MessageThread } from '../lib/messages/types';

function formatRelativeTime(dateStr: string): string {
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDays = Math.floor(diffHr / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

export default function ParentMessagesPanel({
  targetClassroomId,
  targetChildId,
}: {
  targetClassroomId?: string | null;
  targetChildId?: string | null;
} = {}) {
  const {
    threads,
    loading: threadsLoading,
    myConnectCode,
    connectViaCode,
    refreshThreads,
  } = useMessageThreads('parent');
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');

  // Connect code state
  const [copied, setCopied] = useState(false);
  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [teacherCodeInput, setTeacherCodeInput] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [connectSuccess, setConnectSuccess] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-select targeted thread or first thread
  useEffect(() => {
    if (threads.length > 0) {
      if (targetClassroomId || targetChildId) {
        const found = threads.find(
          (t) =>
            (!targetClassroomId || t.classroomId === targetClassroomId) &&
            (!targetChildId || t.childId === targetChildId)
        );
        if (found) {
          setSelectedThreadId(found.id);
          setMobileView('chat');
          return;
        }
      }
      if (!selectedThreadId) {
        setSelectedThreadId(threads[0].id);
      }
    }
  }, [threads, targetClassroomId, targetChildId, selectedThreadId]);

  const activeThread = threads.find((t) => t.id === selectedThreadId) || threads[0] || null;

  const {
    messages,
    sendMessage,
    loading: messagesLoading,
    isRealtimeActive,
  } = useRealtimeMessages({
    threadId: activeThread ? activeThread.id : null,
    currentRole: 'parent',
  });

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const parentStarters = activeThread
    ? [
        `Hello Teacher! How did ${activeThread.childName} do in class this week? 🌟`,
        `We practiced this week’s memory verse together at home! 📖`,
        `Could you share any suggestions for upcoming assignments? 💡`,
        `Thank you for your guidance and encouragement! 🙏`,
      ]
    : [];

  function handleCopyCode() {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(myConnectCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleConnectTeacher(e: React.FormEvent) {
    e.preventDefault();
    if (!teacherCodeInput.trim() || connecting) return;
    setConnecting(true);
    setConnectError(null);
    setConnectSuccess(null);

    const res = await connectViaCode(teacherCodeInput.trim());
    setConnecting(false);

    if (res.success && res.thread) {
      setConnectSuccess(`Connected with ${res.thread.teacherName}!`);
      setSelectedThreadId(res.thread.id);
      setMobileView('chat');
      setTeacherCodeInput('');
      setTimeout(() => {
        setShowAddTeacher(false);
        setConnectSuccess(null);
      }, 2500);
    } else {
      setConnectError(res.error || 'Failed to connect. Please check the code.');
    }
  }

  async function handleSend(textToSend?: string) {
    const text = (textToSend || inputText).trim();
    if (!text || sending) return;
    setSending(true);
    setInputText('');
    await sendMessage(text);
    setSending(false);
    refreshThreads();
  }

  return (
    <div className="parent-dashboard-content parent-messages-page">
      <div className="parent-page-title" style={{ marginBottom: '1.25rem' }}>
        <p className="parent-dash-kicker">Church &amp; Sunday School Educational Messaging</p>
        <h1>Parent Messages</h1>
        <p>Coordinate directly with your children’s teachers about lessons, scripture memory, and class updates.</p>

        {/* Prominent Connect Code Card in the Parent Message Section */}
        <div className="messages-section-connect-card parent-theme-card">
          <div className="connect-card-col my-code-col">
            <span className="connect-card-label">Your Parent Connect Code</span>
            <div className="connect-code-pill-wrap">
              <span className="connect-code-value">{myConnectCode}</span>
              <button
                type="button"
                className="btn-copy-code-prominent"
                onClick={handleCopyCode}
                title="Copy your Parent Code to give to teachers"
              >
                {copied ? '✓ Copied!' : '📋 Copy Code'}
              </button>
            </div>
            <small className="connect-card-subtext">Give this code to your child’s teachers so they can connect with you directly.</small>
          </div>

          <div className="connect-card-divider" aria-hidden="true" />

          <div className="connect-card-col add-code-col">
            <span className="connect-card-label">Add Teacher via Code</span>
            <form onSubmit={handleConnectTeacher} className="prominent-add-form">
              <input
                type="text"
                placeholder="Enter Teacher Code (e.g. TCH-GRACE26)"
                value={teacherCodeInput}
                onChange={(e) => setTeacherCodeInput(e.target.value)}
                disabled={connecting}
                required
              />
              <button type="submit" disabled={connecting || !teacherCodeInput.trim()} className="btn-prominent-connect">
                {connecting ? 'Connecting...' : '🔗 Add Teacher'}
              </button>
            </form>
            {connectError && <p className="add-code-error">{connectError}</p>}
            {connectSuccess && <p className="add-code-success">{connectSuccess}</p>}
            <small className="connect-card-subtext">Enter a teacher’s code to immediately open a direct conversation thread.</small>
          </div>
        </div>
      </div>

      <div className={`teacher-chat-panes parent-chat-theme ${mobileView === 'chat' ? 'show-chat-mobile' : 'show-list-mobile'}`}>
        {/* Left Sidebar: Threads List */}
        <aside className="teacher-threads-sidebar">
          {/* Parent Connect Code Bar */}
          <div className="messages-connect-bar parent-connect-bar">
            <div className="connect-code-badge-row">
              <div className="connect-code-info">
                <span className="connect-code-label">Your Parent Code:</span>
                <strong className="connect-code-val">{myConnectCode}</strong>
              </div>
              <button
                type="button"
                className="btn-copy-code"
                onClick={handleCopyCode}
                title="Copy your Parent Code to give to teachers"
              >
                {copied ? '✓ Copied' : '📋 Copy'}
              </button>
            </div>

            <button
              type="button"
              className="btn-toggle-add-code"
              onClick={() => setShowAddTeacher((prev) => !prev)}
            >
              {showAddTeacher ? '✕ Close' : '+ Add Teacher via Code'}
            </button>

            {showAddTeacher && (
              <form className="add-by-code-form" onSubmit={handleConnectTeacher}>
                <label htmlFor="parent-teacher-code-input" className="add-code-input-label">
                  Enter Teacher Connect Code
                </label>
                <div className="add-code-input-group">
                  <input
                    id="parent-teacher-code-input"
                    type="text"
                    placeholder="e.g. TCH-GRACE26"
                    value={teacherCodeInput}
                    onChange={(e) => setTeacherCodeInput(e.target.value)}
                    disabled={connecting}
                    required
                  />
                  <button type="submit" disabled={connecting || !teacherCodeInput.trim()} className="btn-submit-code">
                    {connecting ? 'Connecting...' : 'Connect'}
                  </button>
                </div>
                {connectError && <p className="add-code-error">{connectError}</p>}
                {connectSuccess && <p className="add-code-success">{connectSuccess}</p>}
                <small className="add-code-hint">
                  Ask your child’s teacher for their Teacher Code (found in their messages panel).
                </small>
              </form>
            )}
          </div>

          <div className="parent-threads-header">
            <strong>Teachers &amp; Classes</strong>
            <small>{threads.length} connected</small>
          </div>

          <div className="teacher-threads-list" role="tablist" aria-label="Teacher conversations">
            {threadsLoading && threads.length === 0 ? (
              <div className="teacher-threads-loading">Loading teachers...</div>
            ) : threads.length === 0 ? (
              <div className="teacher-threads-empty">
                <p>No connected teachers yet.</p>
                <small>Enter a teacher’s code above to connect and start messaging.</small>
              </div>
            ) : (
              threads.map((t) => {
                const isSelected = activeThread?.id === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    className={`teacher-thread-item ${isSelected ? 'active' : ''} ${t.unreadCount > 0 ? 'unread' : ''}`}
                    onClick={() => {
                      setSelectedThreadId(t.id);
                      setMobileView('chat');
                    }}
                  >
                    <div className="thread-avatar parent-teacher-avatar">
                      {t.teacherName.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="thread-details">
                      <div className="thread-top-row">
                        <strong className="thread-parent-name">{t.teacherName}</strong>
                        <span className="thread-time">{formatRelativeTime(t.lastMessageAt)}</span>
                      </div>
                      <div className="thread-child-tag">
                        <span>Child: <b>{t.childName}</b></span>
                        <span className="thread-class-pill">{t.classroomName}</span>
                      </div>
                      <p className="thread-snippet">
                        {t.lastMessageSnippet || 'Conversation open'}
                      </p>
                    </div>
                    {t.unreadCount > 0 && (
                      <span className="thread-unread-badge">{t.unreadCount}</span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Right Pane: Active Conversation */}
        <section className="teacher-chat-surface" aria-label="Active teacher conversation">
          {activeThread ? (
            <>
              {/* Chat Topbar */}
              <div className="teacher-chat-header">
                <button
                  type="button"
                  className="teacher-chat-back-mobile"
                  onClick={() => setMobileView('list')}
                  aria-label="Back to teachers list"
                >
                  ← All Teachers
                </button>
                <div className="chat-recipient-info">
                  <div className="recipient-avatar parent-teacher-avatar">
                    {activeThread.teacherName.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="recipient-name">{activeThread.teacherName}</h3>
                    <small className="recipient-sub">
                      Teacher of <strong>{activeThread.childName}</strong> in {activeThread.classroomName}
                      {activeThread.churchOrOrg ? ` · ${activeThread.churchOrOrg}` : ''}
                    </small>
                  </div>
                </div>

                <div className="chat-realtime-status" title={isRealtimeActive ? 'Live Real-time connection active' : 'Connected'}>
                  <span className={`status-dot ${isRealtimeActive ? 'live' : 'ready'}`} />
                  <span className="status-text">{isRealtimeActive ? 'Live' : 'Connected'}</span>
                </div>
              </div>

              {/* Messages Scroll Area */}
              <div className="teacher-chat-messages">
                {messagesLoading && messages.length === 0 ? (
                  <div className="chat-loading-placeholder">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="chat-empty-callout">
                    <div className="empty-icon">✉️</div>
                    <h4>Message {activeThread.teacherName}</h4>
                    <p>
                      Ask questions about <strong>{activeThread.childName}</strong>’s assignments, lesson themes, or share encouraging updates.
                    </p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMe = m.senderRole === 'parent';
                    return (
                      <div key={m.id} className={`chat-bubble-row ${isMe ? 'row-sent' : 'row-received'}`}>
                        {!isMe && (
                          <div className="bubble-avatar parent-teacher-avatar" title={activeThread.teacherName}>
                            {activeThread.teacherName.slice(0, 1)}
                          </div>
                        )}
                        <div className={`chat-bubble ${isMe ? 'bubble-sent' : 'bubble-received'}`}>
                          <div className="bubble-author">{isMe ? 'You (Parent)' : activeThread.teacherName}</div>
                          <div className="bubble-text">{m.body}</div>
                          <div className="bubble-meta">
                            <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {isMe && <span className="bubble-check">✓</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Starters */}
              <div className="teacher-quick-starters">
                <span className="starters-label">💡 Quick Starters:</span>
                <div className="starters-scroll">
                  {parentStarters.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="starter-chip"
                      onClick={() => handleSend(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Area */}
              <form
                className="teacher-chat-input-bar"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
              >
                <textarea
                  rows={2}
                  placeholder={`Send a message to ${activeThread.teacherName}...`}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  aria-label="Message text"
                />
                <button
                  type="submit"
                  className="button button-primary chat-send-btn"
                  disabled={!inputText.trim() || sending}
                >
                  {sending ? 'Sending...' : 'Send →'}
                </button>
              </form>
            </>
          ) : (
            <div className="teacher-chat-unselected parent-welcome-empty">
              <div className="unselected-icon">💬</div>
              <h3>Parent Messages</h3>
              <p>Coordinate directly with your children’s Sunday school and church teachers about lessons, memory verses, and class activities.</p>
              <div className="parent-empty-code-reminder" style={{ marginTop: '0.85rem', marginBottom: '0.85rem' }}>
                <span className="code-lead" style={{ fontSize: '0.85rem', color: '#64748B', display: 'block' }}>Your Unique Parent Connect Code:</span>
                <strong className="code-display" style={{ fontSize: '1.25rem', color: 'var(--brand-navy, #1E293B)', letterSpacing: '0.05em' }}>{myConnectCode}</strong>
              </div>
              <p className="empty-subtext" style={{ fontSize: '0.82rem', color: '#64748B' }}>Give this code to your child’s teacher, or enter their Teacher Code above to open a direct conversation thread.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
