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
  const { threads, loading: threadsLoading, refreshThreads } = useMessageThreads('parent');
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');

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
        <p className="parent-dash-kicker">Church &amp; School Educational Coordination</p>
        <h1>Teacher Messages</h1>
        <p>Coordinate directly with your children’s teachers about assignments, lessons, and spiritual growth.</p>
      </div>

      <div className={`teacher-chat-panes parent-chat-theme ${mobileView === 'chat' ? 'show-chat-mobile' : 'show-list-mobile'}`}>
        {/* Left Sidebar: Threads List */}
        <aside className="teacher-threads-sidebar">
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
                <small>Connect your child to a Sunday School or Christian classroom to message their teacher.</small>
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
            <div className="teacher-chat-unselected">
              <div className="unselected-icon">📬</div>
              <h3>Select a teacher conversation</h3>
              <p>Choose a teacher from the list on the left to view messages and ask questions.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
