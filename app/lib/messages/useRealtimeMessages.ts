'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '../supabase/client';
import { playRewardSound } from '../sound/sound-effects';
import type { ChatMessage, MessageThread, SenderRole } from './types';

// Mock/demo conversations for offline or unauthenticated local dev preview
const DEMO_THREADS: MessageThread[] = [
  {
    id: 'demo-thread-1',
    classroomId: 'demo-class-1',
    classroomName: 'Wednesday Explorers',
    childId: 'demo-child-1',
    childName: 'Amara A.',
    parentId: 'demo-parent-1',
    parentName: 'Jordan A.',
    teacherId: 'demo-teacher-1',
    teacherName: 'Teacher Grace',
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    lastMessageSnippet: 'Amara loved the Noah’s Ark lesson! Can we practice the memory verse together at home?',
    unreadCount: 1,
    otherPartyName: 'Jordan A.',
    otherPartyRole: 'parent',
    churchOrOrg: 'Grace Community Church',
  },
  {
    id: 'demo-thread-2',
    classroomId: 'demo-class-1',
    classroomName: 'Wednesday Explorers',
    childId: 'demo-child-2',
    childName: 'Mia K.',
    parentId: 'demo-parent-2',
    parentName: 'Chidi K.',
    teacherId: 'demo-teacher-1',
    teacherName: 'Teacher Grace',
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    lastMessageSnippet: 'Thanks for the update on the upcoming Scripture Scramble challenge.',
    unreadCount: 0,
    otherPartyName: 'Chidi K.',
    otherPartyRole: 'parent',
    churchOrOrg: 'Grace Community Church',
  },
];

const DEMO_MESSAGES: Record<string, ChatMessage[]> = {
  'demo-thread-1': [
    {
      id: 'm1',
      threadId: 'demo-thread-1',
      senderId: 'demo-teacher-1',
      senderRole: 'teacher',
      body: 'Hello Jordan! Amara did a wonderful job memorizing Genesis 9:13 in class today.',
      read: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    },
    {
      id: 'm2',
      threadId: 'demo-thread-1',
      senderId: 'demo-parent-1',
      senderRole: 'parent',
      body: 'Thank you so much! She came home excited and showed us the rainbow emblem on her adventure map.',
      read: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    },
    {
      id: 'm3',
      threadId: 'demo-thread-1',
      senderId: 'demo-parent-1',
      senderRole: 'parent',
      body: 'Amara loved the Noah’s Ark lesson! Can we practice the memory verse together at home?',
      read: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    },
  ],
  'demo-thread-2': [
    {
      id: 'm4',
      threadId: 'demo-thread-2',
      senderId: 'demo-teacher-1',
      senderRole: 'teacher',
      body: 'Hi Chidi, just letting you know Mia is doing great in Wednesday Explorers.',
      read: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    },
    {
      id: 'm5',
      threadId: 'demo-thread-2',
      senderId: 'demo-parent-2',
      senderRole: 'parent',
      body: 'Thanks for the update on the upcoming Scripture Scramble challenge.',
      read: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    },
  ],
};

const CUSTOM_THREADS_KEY = 'lnl_custom_message_threads';

function getLocalCustomThreads(): MessageThread[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(CUSTOM_THREADS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalCustomThread(thread: MessageThread) {
  if (typeof window === 'undefined') return;
  try {
    const existing = getLocalCustomThreads().filter((t) => t.id !== thread.id);
    window.localStorage.setItem(CUSTOM_THREADS_KEY, JSON.stringify([thread, ...existing]));
  } catch {
    // ignore
  }
}

function getBrowserSessionKey(): string {
  if (typeof window === 'undefined') return '';
  try {
    let key = window.localStorage.getItem('lnl_browser_session_key');
    if (!key) {
      key = 'ses_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
      window.localStorage.setItem('lnl_browser_session_key', key);
    }
    return key;
  } catch {
    return '';
  }
}

/**
 * Hook for managing the list of parent-teacher conversation threads.
 */
export function useMessageThreads(currentRole: SenderRole = 'teacher') {
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [myConnectCode, setMyConnectCode] = useState<string>(
    currentRole === 'teacher' ? 'TCH-GRACE26' : 'PAR-JORDAN26'
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch current user's unique dynamic connect code
  useEffect(() => {
    let active = true;
    async function fetchCode() {
      try {
        const supabase = createClient();
        let token: string | undefined;
        if (supabase) {
          const { data } = await supabase.auth.getSession();
          token = data?.session?.access_token;
        }
        const sessionKey = getBrowserSessionKey();
        const headers: Record<string, string> = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        const url = `/api/messages/connect-code?role=${currentRole}${sessionKey ? `&sessionKey=${encodeURIComponent(sessionKey)}` : ''}`;
        const res = await fetch(url, { headers });
        if (active && res.ok) {
          const data = (await res.json()) as { code?: string };
          const expectedPrefix = currentRole === 'teacher' ? 'TCH-' : 'PAR-';
          if (data?.code && data.code.startsWith(expectedPrefix)) {
            setMyConnectCode(data.code);
          }
        }
      } catch {
        // Fallback to initial code
      }
    }
    fetchCode();
    return () => {
      active = false;
    };
  }, [currentRole]);

  const refreshThreads = useCallback(async () => {
    try {
      const customLocal = getLocalCustomThreads();
      const supabase = createClient();
      let token: string | undefined;
      let isAuthenticated = false;
      if (supabase) {
        const { data } = await supabase.auth.getSession();
        token = data?.session?.access_token;
        isAuthenticated = !!data?.session?.user;
      }
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/messages/threads', { headers });
      if (res.ok) {
        const data = (await res.json()) as { threads?: MessageThread[] };
        const fetched = Array.isArray(data.threads) ? data.threads : [];
        const dbIds = new Set(fetched.map((t) => t.id));
        const unmerged = customLocal.filter((t) => !dbIds.has(t.id));
        const combined = [...unmerged, ...fetched];

        if (isAuthenticated || combined.length > 0) {
          // Real live account or has custom threads: NEVER force demo threads!
          setThreads(combined);
          setLoading(false);
          return;
        }
      }

      if (isAuthenticated) {
        // Real authenticated account with no threads yet: show custom or empty list
        setThreads(customLocal);
        setLoading(false);
        return;
      }

      // Fallback ONLY for unauthenticated demo preview
      const adjustedDemo = DEMO_THREADS.map((t) => ({
        ...t,
        otherPartyName: currentRole === 'teacher' ? t.parentName : t.teacherName,
        otherPartyRole: (currentRole === 'teacher' ? 'parent' : 'teacher') as SenderRole,
      }));
      const demoIds = new Set(adjustedDemo.map((t) => t.id));
      const unmerged = customLocal.filter((t) => !demoIds.has(t.id));
      setThreads([...unmerged, ...adjustedDemo]);
    } catch {
      // Fallback on network failure
      const customLocal = getLocalCustomThreads();
      const supabase = createClient();
      let isAuthed = false;
      if (supabase) {
        const { data } = await supabase.auth.getSession();
        isAuthed = !!data?.session?.user;
      }
      if (isAuthed) {
        setThreads(customLocal);
      } else {
        const adjustedDemo = DEMO_THREADS.map((t) => ({
          ...t,
          otherPartyName: currentRole === 'teacher' ? t.parentName : t.teacherName,
          otherPartyRole: (currentRole === 'teacher' ? 'parent' : 'teacher') as SenderRole,
        }));
        const demoIds = new Set(adjustedDemo.map((t) => t.id));
        const unmerged = customLocal.filter((t) => !demoIds.has(t.id));
        setThreads([...unmerged, ...adjustedDemo]);
      }
    } finally {
      setLoading(false);
    }
  }, [currentRole]);

  useEffect(() => {
    refreshThreads();
  }, [refreshThreads]);

  // Subscribe to threads table changes via Supabase Realtime
  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    const channel = supabase
      .channel('parent_teacher_threads_updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'parent_teacher_threads' },
        () => {
          refreshThreads();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshThreads]);

  /**
   * Connect with a parent or teacher using their unique connect code.
   */
  const connectViaCode = useCallback(
    async (
      code: string,
      childName?: string
    ): Promise<{ success: boolean; thread?: MessageThread; error?: string }> => {
      try {
        const supabase = createClient();
        let token: string | undefined;
        if (supabase) {
          const { data } = await supabase.auth.getSession();
          token = data?.session?.access_token;
        }
        const sessionKey = getBrowserSessionKey();
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch('/api/messages/connect-code', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            code,
            childName,
            callerRole: currentRole,
            sessionKey,
          }),
        });
        const data = (await res.json()) as {
          success?: boolean;
          error?: string;
          thread?: MessageThread;
        };
        if (!res.ok || !data.success) {
          return {
            success: false,
            error: data.error || 'Failed to connect. Please check the code and try again.',
          };
        }

        const newThread = data.thread;
        if (newThread) {
          saveLocalCustomThread(newThread);
          setThreads((prev) => {
            const filtered = prev.filter((t) => t.id !== newThread.id);
            return [newThread, ...filtered];
          });
        }
        return { success: true, thread: newThread };
      } catch (err: unknown) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Network error while connecting.',
        };
      }
    },
    [currentRole]
  );

  return { threads, loading, error, myConnectCode, connectViaCode, refreshThreads };
}


function getStoredMessages(id: string): ChatMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(`lnl_chat_history_${id}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredMessages(id: string, msgs: ChatMessage[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(`lnl_chat_history_${id}`, JSON.stringify(msgs));
  } catch {
    // ignore
  }
}

/**
 * Hook for managing active chat messages in a single thread with live Supabase Realtime.
 */
export function useRealtimeMessages({
  threadId,
  currentRole = 'teacher',
  currentUserId,
}: {
  threadId: string | null;
  currentRole?: SenderRole;
  currentUserId?: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [isRealtimeActive, setIsRealtimeActive] = useState(false);
  const activeThreadRef = useRef<string | null>(threadId);
  activeThreadRef.current = threadId;
  const channelRef = useRef<any>(null);

  // Load message history
  const loadMessages = useCallback(async (id: string) => {
    setLoading(true);
    const local = getStoredMessages(id);
    if (local.length > 0) {
      setMessages(local);
    }

    try {
      const supabase = createClient();
      let token: string | undefined;
      let isAuthed = false;
      if (supabase) {
        const { data } = await supabase.auth.getSession();
        token = data?.session?.access_token;
        isAuthed = !!data?.session?.user;
      }
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/messages/threads/${id}`, { headers });
      if (res.ok) {
        const data = (await res.json()) as { messages?: ChatMessage[] };
        if (Array.isArray(data.messages) && data.messages.length > 0) {
          setMessages(data.messages);
          saveStoredMessages(id, data.messages);
          setLoading(false);
          return;
        } else if (isAuthed) {
          setMessages(local);
          setLoading(false);
          return;
        }
      }
      // Demo fallback only for unauthenticated preview
      if (!isAuthed && DEMO_MESSAGES[id]) {
        setMessages(DEMO_MESSAGES[id]);
      } else {
        setMessages(local);
      }
    } catch {
      setMessages(local);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!threadId) {
      setMessages([]);
      return;
    }
    loadMessages(threadId);
  }, [threadId, loadMessages]);

  // Supabase Realtime WebSocket subscription for live incoming messages (both broadcast and postgres changes)
  useEffect(() => {
    if (!threadId) return;

    const supabase = createClient();
    if (!supabase) return;

    const channel = supabase
      .channel(`thread:${threadId}`)
      .on('broadcast', { event: 'new_message' }, (payload) => {
        const newMsg = payload.payload as ChatMessage;
        if (!newMsg || newMsg.threadId !== activeThreadRef.current) return;

        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id || (m.id.startsWith('temp-') && m.body === newMsg.body))) {
            return prev.map((m) => (m.body === newMsg.body ? newMsg : m));
          }
          const next = [...prev, newMsg];
          saveStoredMessages(threadId, next);
          return next;
        });

        if (newMsg.senderRole !== currentRole) {
          playRewardSound('tap');
        }
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'parent_teacher_messages',
          filter: `thread_id=eq.${threadId}`,
        },
        (payload) => {
          const row = payload.new as any;
          if (!row || row.thread_id !== activeThreadRef.current) return;

          const newMsg: ChatMessage = {
            id: row.id,
            threadId: row.thread_id,
            senderId: row.sender_id,
            senderRole: row.sender_role as SenderRole,
            body: row.body,
            read: row.read,
            createdAt: row.created_at,
          };

          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id || (m.id.startsWith('temp-') && m.body === newMsg.body))) {
              return prev.map((m) => (m.id.startsWith('temp-') && m.body === newMsg.body ? newMsg : m));
            }
            const next = [...prev, newMsg];
            saveStoredMessages(threadId, next);
            return next;
          });

          if (newMsg.senderRole !== currentRole) {
            playRewardSound('tap');
            fetch('/api/messages/read', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ threadId }),
            }).catch(() => {});
          }
        }
      )
      .subscribe((status) => {
        setIsRealtimeActive(status === 'SUBSCRIBED');
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
      setIsRealtimeActive(false);
    };
  }, [threadId, currentRole]);

  // Send message function with optimistic update and instant broadcast
  const sendMessage = useCallback(
    async (body: string) => {
      if (!threadId || !body.trim()) return false;

      const trimmed = body.trim();
      const tempId = `temp-${Date.now()}`;
      const optimisticMsg: ChatMessage = {
        id: tempId,
        threadId,
        senderId: currentUserId || 'caller',
        senderRole: currentRole,
        body: trimmed,
        read: false,
        createdAt: new Date().toISOString(),
      };

      // Optimistic append
      setMessages((prev) => {
        const next = [...prev, optimisticMsg];
        saveStoredMessages(threadId, next);
        return next;
      });
      playRewardSound('tap');

      // Instant live WebSocket broadcast
      try {
        channelRef.current?.send({
          type: 'broadcast',
          event: 'new_message',
          payload: optimisticMsg,
        });
      } catch {
        // ignore
      }

      try {
        const supabase = createClient();
        let token: string | undefined;
        if (supabase) {
          const { data } = await supabase.auth.getSession();
          token = data?.session?.access_token;
        }
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch('/api/messages/send', {
          method: 'POST',
          headers,
          body: JSON.stringify({ threadId, body: trimmed }),
        });

        if (res.ok) {
          const data = (await res.json()) as { message?: ChatMessage };
          if (data.message) {
            setMessages((prev) => {
              const next = prev.map((m) => (m.id === tempId ? data.message! : m));
              saveStoredMessages(threadId, next);
              return next;
            });
            return true;
          }
        } else {
          if (DEMO_MESSAGES[threadId]) {
            DEMO_MESSAGES[threadId].push(optimisticMsg);
          }
          return true;
        }
      } catch {
        if (DEMO_MESSAGES[threadId]) {
          DEMO_MESSAGES[threadId].push(optimisticMsg);
        }
        return true;
      }
      return false;
    },
    [threadId, currentRole, currentUserId]
  );

  return {
    messages,
    sendMessage,
    loading,
    isRealtimeActive,
    refreshMessages: () => threadId && loadMessages(threadId),
  };
}
