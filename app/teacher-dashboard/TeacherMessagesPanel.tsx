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

const QUICK_STARTERS = [
  'Checking in on this week’s memory verse practice! 📖',
  'Great participation and focus in class today! ⭐',
  'Here is a discussion topic you can explore at home together:',
  'Looking forward to seeing your family this Sunday! 🏛️',
];

export default function TeacherMessagesPanel({
  initialChildId,
  initialClassroomId,
}: {
  initialChildId?: string;
  initialClassroomId?: string;
} = {}) {
  const {
    threads,
    loading: threadsLoading,
    myConnectCode,
    connectViaCode,
    refreshThreads,
  } = useMessageThreads('teacher');
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');

  // Connect code state
  const [copied, setCopied] = useState(false);
  const [showAddParent, setShowAddParent] = useState(false);
  const [parentCodeInput, setParentCodeInput] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [connectSuccess, setConnectSuccess] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-select initial thread or first available thread
  useEffect(() => {
    if (threads.length > 0 && !selectedThreadId) {
      if (initialChildId) {
        const found = threads.find((t) => t.childId === initialChildId && (!initialClassroomId || t.classroomId === initialClassroomId));
        if (found) {
          setSelectedThreadId(found.id);
          setMobileView('chat');
          return;
        }
      }
      setSelectedThreadId(threads[0].id);
    }
  }, [threads, selectedThreadId, initialChildId, initialClassroomId]);

  const activeThread = threads.find((t) => t.id === selectedThreadId) || threads[0] || null;

  const {
    messages,
    sendMessage,
    loading: messagesLoading,
    isRealtimeActive,
  } = useRealtimeMessages({
    threadId: activeThread ? activeThread.id : null,
    currentRole: 'teacher',
  });

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const filteredThreads = threads.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.parentName.toLowerCase().includes(q) ||
      t.childName.toLowerCase().includes(q) ||
      t.classroomName.toLowerCase().includes(q)
    );
  });

  const totalUnread = threads.reduce((acc, t) => acc + (t.unreadCount || 0), 0);

  function handleCopyCode() {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(myConnectCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleConnectParent(e: React.FormEvent) {
    e.preventDefault();
    if (!parentCodeInput.trim() || connecting) return;
    setConnecting(true);
    setConnectError(null);
    setConnectSuccess(null);

    const res = await connectViaCode(parentCodeInput.trim());
    setConnecting(false);

    if (res.success && res.thread) {
      setConnectSuccess(`Connected with ${res.thread.parentName}!`);
      setSelectedThreadId(res.thread.id);
      setMobileView('chat');
      setParentCodeInput('');
      setTimeout(() => {
        setShowAddParent(false);
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
    <div className="teacher-messages-container">
      {/* Header */}
      <div className="teacher-messages-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span className="teacher-kicker" style={{ margin: 0 }}>Adult-to-Adult Educational Messaging</span>
            {totalUnread > 0 && (
              <span className="teacher-unread-pill">{totalUnread} unread</span>
            )}
          </div>
          <h1 className="teacher-title-oneline" style={{ margin: '0.25rem 0' }}>
            Parent Conversations
          </h1>
          <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--muted, #64748B)' }}>
            Direct, real-time messaging with verified parents. Children and teenagers cannot view or send private messages.
          </p>
        </div>

        {/* Prominent Connect Code Card in the Message Section */}
        <div className="messages-section-connect-card">
          <div className="connect-card-col my-code-col">
            <span className="connect-card-label">Your Teacher Connect Code</span>
            <div className="connect-code-pill-wrap">
              <span className="connect-code-value">{myConnectCode}</span>
              <button
                type="button"
                className="btn-copy-code-prominent"
                onClick={handleCopyCode}
                title="Copy your Teacher Code to give to parents"
              >
                {copied ? '✓ Copied!' : '📋 Copy Code'}
              </button>
            </div>
            <small className="connect-card-subtext">Give this code to parents so they can connect with you directly.</small>
          </div>

          <div className="connect-card-divider" aria-hidden="true" />

          <div className="connect-card-col add-code-col">
            <span className="connect-card-label">Add Parent via Code</span>
            <form onSubmit={handleConnectParent} className="prominent-add-form">
              <input
                type="text"
                placeholder="Enter Parent Code (e.g. PAR-JORDAN26)"
                value={parentCodeInput}
                onChange={(e) => setParentCodeInput(e.target.value)}
                disabled={connecting}
                required
              />
              <button type="submit" disabled={connecting || !parentCodeInput.trim()} className="btn-prominent-connect">
                {connecting ? 'Connecting...' : '🔗 Add Parent'}
              </button>
            </form>
            {connectError && <p className="add-code-error">{connectError}</p>}
            {connectSuccess && <p className="add-code-success">{connectSuccess}</p>}
            <small className="connect-card-subtext">Enter a parent’s code to immediately open a direct conversation thread.</small>
          </div>
        </div>
      </div>

      {/* Main Two-Pane Layout */}
      <div className={`teacher-chat-panes ${mobileView === 'chat' ? 'show-chat-mobile' : 'show-list-mobile'}`}>
        {/* Left Sidebar: Threads List */}
        <aside className="teacher-threads-sidebar">
          {/* Teacher Connect Code Bar */}
          <div className="messages-connect-bar">
            <div className="connect-code-badge-row">
              <div className="connect-code-info">
                <span className="connect-code-label">Your Teacher Code:</span>
                <strong className="connect-code-val">{myConnectCode}</strong>
              </div>
              <button
                type="button"
                className="btn-copy-code"
                onClick={handleCopyCode}
                title="Copy your Teacher Code to give to parents"
              >
                {copied ? '✓ Copied' : '📋 Copy'}
              </button>
            </div>

            <button
              type="button"
              className="btn-toggle-add-code"
              onClick={() => setShowAddParent((prev) => !prev)}
            >
              {showAddParent ? '✕ Close' : '+ Add Parent via Code'}
            </button>

            {showAddParent && (
              <form className="add-by-code-form" onSubmit={handleConnectParent}>
                <label htmlFor="teacher-parent-code-input" className="add-code-input-label">
                  Enter Parent Connect Code
                </label>
                <div className="add-code-input-group">
                  <input
                    id="teacher-parent-code-input"
                    type="text"
                    placeholder="e.g. PAR-JORDAN26"
                    value={parentCodeInput}
                    onChange={(e) => setParentCodeInput(e.target.value)}
                    disabled={connecting}
                    required
                  />
                  <button type="submit" disabled={connecting || !parentCodeInput.trim()} className="btn-submit-code">
                    {connecting ? 'Connecting...' : 'Connect'}
                  </button>
                </div>
                {connectError && <p className="add-code-error">{connectError}</p>}
                {connectSuccess && <p className="add-code-success">{connectSuccess}</p>}
                <small className="add-code-hint">
                  Ask the parent for their unique Parent Code (shown in their messages panel).
                </small>
              </form>
            )}
          </div>

          <div className="teacher-threads-search">
            <span aria-hidden="true">🔍</span>
            <input
              type="text"
              placeholder="Search parent or child..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search conversations"
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery('')} aria-label="Clear search">✕</button>
            )}
          </div>

          <div className="teacher-threads-list" role="tablist" aria-label="Conversations">
            {threadsLoading && threads.length === 0 ? (
              <div className="teacher-threads-loading">Loading conversations...</div>
            ) : filteredThreads.length === 0 ? (
              <div className="teacher-threads-empty">
                <p>No matching conversations.</p>
                <small>Enter a parent’s code above to start a conversation.</small>
              </div>
            ) : (
              filteredThreads.map((t) => {
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
                    <div className="thread-avatar">
                      {t.parentName.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="thread-details">
                      <div className="thread-top-row">
                        <strong className="thread-parent-name">{t.parentName}</strong>
                        <span className="thread-time">{formatRelativeTime(t.lastMessageAt)}</span>
                      </div>
                      <div className="thread-child-tag">
                        <span>Parent of <b>{t.childName}</b></span>
                        <span className="thread-class-pill">{t.classroomName}</span>
                      </div>
                      <p className="thread-snippet">
                        {t.lastMessageSnippet || 'No messages yet'}
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
        <section className="teacher-chat-surface" aria-label="Active conversation">
          {activeThread ? (
            <>
              {/* Chat Topbar */}
              <div className="teacher-chat-header">
                <button
                  type="button"
                  className="teacher-chat-back-mobile"
                  onClick={() => setMobileView('list')}
                  aria-label="Back to conversations list"
                >
                  ← All Parents
                </button>
                <div className="chat-recipient-info">
                  <div className="recipient-avatar">
                    {activeThread.parentName.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="recipient-name">{activeThread.parentName}</h3>
                    <small className="recipient-sub">
                      Parent of <strong>{activeThread.childName}</strong> · {activeThread.classroomName}
                      {activeThread.churchOrOrg ? ` (${activeThread.churchOrOrg})` : ''}
                    </small>
                  </div>
                </div>

                <div className="chat-realtime-status" title={isRealtimeActive ? 'Real-time WebSocket connection active' : 'Connected'}>
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
                    <div className="empty-icon">💬</div>
                    <h4>Conversation with {activeThread.parentName}</h4>
                    <p>
                      Start by sharing encouragement regarding <strong>{activeThread.childName}</strong>’s assignments, memory verses, or upcoming classroom activities.
                    </p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMe = m.senderRole === 'teacher';
                    return (
                      <div key={m.id} className={`chat-bubble-row ${isMe ? 'row-sent' : 'row-received'}`}>
                        {!isMe && (
                          <div className="bubble-avatar" title={activeThread.parentName}>
                            {activeThread.parentName.slice(0, 1)}
                          </div>
                        )}
                        <div className={`chat-bubble ${isMe ? 'bubble-sent' : 'bubble-received'}`}>
                          <div className="bubble-author">{isMe ? 'You (Teacher)' : activeThread.parentName}</div>
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

              {/* Quick Starters Carousel */}
              <div className="teacher-quick-starters">
                <span className="starters-label">💡 Quick Starters:</span>
                <div className="starters-scroll">
                  {QUICK_STARTERS.map((s, idx) => (
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
                  placeholder={`Write a message to ${activeThread.parentName}...`}
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
            <div className="teacher-chat-unselected">
              <div className="unselected-icon">📬</div>
              <h3>Select a parent conversation</h3>
              <p>Choose a thread from the list on the left to view messages and coordinate with parents.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
