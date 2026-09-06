'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useMessageThreads, useRealtimeMessages } from '../lib/messages/useRealtimeMessages';
import { createClient } from '../lib/supabase/client';
import { formatCardTimestamp, formatMessageTime } from '../lib/messages/formatters';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Connect code drawer state
  const [copied, setCopied] = useState(false);
  const [showConnectDrawer, setShowConnectDrawer] = useState(false);
  const [teacherCodeInput, setTeacherCodeInput] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [connectSuccess, setConnectSuccess] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    if (supabase) {
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user?.id) {
          setCurrentUserId(data.user.id);
        }
      });
    }
  }, []);

  // Auto-select targeted thread or first thread
  useEffect(() => {
    if (threads.length > 0) {
      window.queueMicrotask(() => {
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
      });
    }
  }, [threads, targetClassroomId, targetChildId, selectedThreadId]);

  const activeThread = threads.find((t) => t.id === selectedThreadId) || threads[0] || null;

  const {
    messages,
    sendMessage,
    loading: messagesLoading,
  } = useRealtimeMessages({
    threadId: activeThread ? activeThread.id : null,
    currentRole: 'parent',
    currentUserId: currentUserId || undefined,
  });

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const filteredThreads = threads.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.teacherName.toLowerCase().includes(q) ||
      t.childName.toLowerCase().includes(q) ||
      t.classroomName.toLowerCase().includes(q)
    );
  });

  const totalUnread = threads.reduce((acc, t) => acc + (t.unreadCount || 0), 0);

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
        setShowConnectDrawer(false);
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

  const sortedMessages = [...messages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return (
    <div className="saas-messages-layout parent-chat-theme">
      {/* Collapsible Connect Codes Accordion */}
      <div className="saas-connect-accordion-wrapper">
        <div className="saas-connect-accordion-bar">
          <button
            type="button"
            className="saas-connect-accordion-toggle"
            onClick={() => setShowConnectDrawer((prev) => !prev)}
            aria-expanded={showConnectDrawer}
          >
            <span className="accordion-icon">🔑</span>
            <div className="accordion-title-group">
              <strong>Connect Codes &amp; Add Teacher</strong>
              <small>{showConnectDrawer ? 'Click to collapse' : 'Click to view your code or connect with a teacher code'}</small>
            </div>
            <span className="accordion-arrow">{showConnectDrawer ? '▲' : '▼'}</span>
          </button>

          <div className="saas-connect-quick-chip">
            <span className="quick-chip-label">Your Parent Code:</span>
            <strong className="quick-chip-code">{myConnectCode}</strong>
            <button type="button" onClick={handleCopyCode} className="btn-quick-copy">
              {copied ? '✓ Copied' : '📋 Copy'}
            </button>
          </div>
        </div>

        {showConnectDrawer && (
          <div className="saas-connect-dropdown-content">
            <div className="connect-card-grid">
              <div className="connect-col-code">
                <span className="connect-col-kicker">YOUR PARENT CONNECT CODE</span>
                <div className="connect-code-pill-row">
                  <span className="connect-code-big">{myConnectCode}</span>
                  <button type="button" onClick={handleCopyCode} className="button button-secondary btn-copy-big">
                    {copied ? '✓ Copied' : '📋 Copy Code'}
                  </button>
                </div>
                <p className="connect-col-desc">Give this code to your child&apos;s teachers so they can connect with you directly.</p>
              </div>

              <div className="connect-col-divider" />

              <form onSubmit={handleConnectTeacher} className="connect-col-form">
                <span className="connect-col-kicker">ADD TEACHER VIA CODE</span>
                <div className="connect-form-row">
                  <input
                    type="text"
                    placeholder="ENTER TEACHER CODE (E.G. TCH-GRACE26)"
                    value={teacherCodeInput}
                    onChange={(e) => setTeacherCodeInput(e.target.value)}
                    disabled={connecting}
                    required
                  />
                  <button type="submit" disabled={connecting || !teacherCodeInput.trim()} className="button button-primary btn-add-big">
                    {connecting ? 'Connecting...' : '🔗 Add Teacher'}
                  </button>
                </div>
                <p className="connect-col-desc">Enter a teacher&apos;s code to immediately open a direct conversation thread.</p>
                {connectError && <p className="connect-error-msg">{connectError}</p>}
                {connectSuccess && <p className="connect-success-msg">{connectSuccess}</p>}
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Two-Pane SaaS Container */}
      <div className={`saas-chat-panes ${mobileView === 'chat' ? 'show-chat-mobile' : 'show-list-mobile'}`}>
        
        {/* Left Column: Conversations List */}
        <aside className="saas-conversations-sidebar">
          {/* Header Row: Teacher count & status */}
          <div className="saas-conv-header">
            <div className="saas-conv-title-wrap">
              <h2 className="saas-conv-title">Teachers ({threads.length})</h2>
              {totalUnread > 0 && <span className="saas-total-badge">{totalUnread} new</span>}
            </div>
            <span className="saas-conv-subtitle">
              {threads.length === 1 ? '1 connected teacher' : `${threads.length} connected teachers`}
            </span>
          </div>

          {/* Search Bar */}
          <div className="saas-conv-search">
            <span aria-hidden="true" className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search teachers, children, or classes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search teachers"
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery('')} className="search-clear-btn" aria-label="Clear search">✕</button>
            )}
          </div>

          {/* Threads List */}
          <div className="saas-threads-scroll" role="tablist" aria-label="Teacher conversations">
            {threadsLoading && threads.length === 0 ? (
              <div className="saas-threads-loading">Loading conversations...</div>
            ) : filteredThreads.length === 0 ? (
              <div className="saas-threads-empty">
                <p>No conversations found.</p>
                <button type="button" onClick={() => setShowConnectDrawer(true)} className="btn-empty-connect">
                  + Add Teacher via Code
                </button>
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
                    className={`saas-thread-card ${isSelected ? 'active' : ''} ${t.unreadCount > 0 ? 'has-unread' : ''}`}
                    onClick={() => {
                      setSelectedThreadId(t.id);
                      setMobileView('chat');
                    }}
                  >
                    {/* Left Avatar */}
                    <div className="saas-thread-avatar parent-teacher-avatar">
                      {t.teacherName.slice(0, 1).toUpperCase()}
                    </div>

                    {/* Card Content */}
                    <div className="saas-thread-body">
                      <div className="saas-thread-top">
                        <strong className="saas-thread-name">{t.teacherName}</strong>
                        <span className="saas-thread-time">{formatCardTimestamp(t.lastMessageAt)}</span>
                      </div>

                      <div className="saas-thread-sub">
                        <span>Child: {t.childName} · {t.classroomName}</span>
                      </div>

                      <div className="saas-thread-bottom">
                        <p className="saas-thread-snippet">
                          {t.lastMessageSnippet || 'Conversation open'}
                        </p>
                        <div className="saas-thread-status">
                          {t.unreadCount > 0 ? (
                            <span className="saas-unread-badge">{t.unreadCount}</span>
                          ) : (
                            <span className="saas-read-doublecheck" title="Delivered and read">✓✓</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Right Column: Active Conversation */}
        <section className="saas-chat-surface" aria-label="Active teacher conversation">
          {activeThread ? (
            <>
              {/* Chat Topbar */}
              <div className="saas-chat-header">
                <button
                  type="button"
                  className="saas-mobile-back"
                  onClick={() => setMobileView('list')}
                  aria-label="Back to conversations list"
                >
                  ← All Teachers
                </button>

                <div className="saas-recipient-meta">
                  <div className="saas-header-avatar parent-teacher-avatar">
                    {activeThread.teacherName.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="saas-recipient-title">{activeThread.teacherName}</h3>
                    <p className="saas-recipient-subtitle">
                      Teacher of <strong>{activeThread.childName}</strong> in {activeThread.classroomName}
                      {activeThread.churchOrOrg ? ` · ${activeThread.churchOrOrg}` : ''}
                    </p>
                  </div>
                </div>

                {/* Right utility cluster matching reference screenshot */}
                <div className="saas-header-actions">
                  <div className="saas-avatar-stack" title="Conversation participants">
                    <span className="stack-avatar stack-1" title="Teacher">T</span>
                    <span className="stack-avatar stack-2" title="Parent">P</span>
                    <span className="stack-avatar stack-add" title="Verified COPPA Classroom">+</span>
                  </div>
                  <div className="saas-header-divider" />
                  <button type="button" className="saas-icon-btn" title="Classroom Video (Scheduled)" aria-label="Video Call">📹</button>
                  <button type="button" className="saas-icon-btn" title="Notifications" aria-label="Notifications">🔔</button>
                  <button type="button" className="saas-icon-btn" title="Conversation settings" aria-label="Settings">⚙️</button>
                </div>
              </div>

              {/* Messages Stream - Older messages at top, latest/recent messages at bottom */}
              <div className="saas-chat-stream">
                {messagesLoading && sortedMessages.length === 0 ? (
                  <div className="saas-chat-loading">Loading message history...</div>
                ) : sortedMessages.length === 0 ? (
                  <div className="saas-chat-empty-state">
                    <div className="empty-bubble-icon">✉️</div>
                    <h4>Direct conversation with {activeThread.teacherName}</h4>
                    <p>
                      Ask questions about <strong>{activeThread.childName}</strong>’s assignments, lesson themes, or share encouraging updates.
                    </p>
                  </div>
                ) : (
                  sortedMessages.map((m) => {
                    const isMe =
                      m.senderRole === 'parent' ||
                      (Boolean(currentUserId) &&
                        m.senderId === currentUserId &&
                        activeThread.teacherId !== activeThread.parentId);

                    return (
                      <div key={m.id} className={`saas-msg-group ${isMe ? 'is-sent' : 'is-received'}`}>
                        {!isMe ? (
                          <div className="saas-msg-received-wrap">
                            <div className="saas-msg-avatar parent-teacher-avatar" title={activeThread.teacherName}>
                              {activeThread.teacherName.slice(0, 1).toUpperCase()}
                            </div>
                            <div className="saas-msg-received-body">
                              <div className="saas-msg-bubble bubble-received">
                                <span className="bubble-text">{m.body}</span>
                                <span className="bubble-timestamp">{formatMessageTime(m.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="saas-msg-sent-wrap">
                            <div className="saas-msg-bubble bubble-sent">
                              <span className="bubble-text">{m.body}</span>
                              <div className="bubble-meta-sent">
                                <span className="bubble-timestamp">{formatMessageTime(m.createdAt)}</span>
                                <span
                                  className={`saas-double-check ${m.read ? 'is-read' : 'is-delivered'}`}
                                  title={m.read ? 'Read by teacher' : 'Delivered'}
                                >
                                  ✓✓
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Starters */}
              <div className="saas-quick-starters-bar">
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

              {/* Chat Input Bar */}
              <form
                className="saas-chat-input-bar"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
              >
                <textarea
                  rows={1}
                  placeholder="Type a message..."
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
                <div className="saas-input-tools">
                  <button type="button" className="input-tool-btn" title="Add picture" aria-label="Add picture">🖼️</button>
                  <button type="button" className="input-tool-btn" title="Attach study material" aria-label="Attach file">📎</button>
                  <button type="button" className="input-tool-btn" title="Insert emoji" aria-label="Emoji">😊</button>
                  <button
                    type="submit"
                    className="saas-send-btn"
                    disabled={!inputText.trim() || sending}
                    title="Send message"
                  >
                    {sending ? '...' : 'Send →'}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="saas-chat-unselected">
              <div className="unselected-icon">💬</div>
              <h3>Select a teacher conversation</h3>
              <p>Choose a teacher from the list on the left to coordinate lessons and scripture memory.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
