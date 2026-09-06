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

  // Fetch current user's connect code
  useEffect(() => {
    fetch(`/api/messages/connect-code?role=${currentRole}`)
      .then((res) => res.json() as Promise<{ code?: string }>)
      .then((data) => {
        if (data?.code) {
          setMyConnectCode(data.code);
        }
      })
      .catch(() => {
        // Keep default demo code
      });
  }, [currentRole]);

  const refreshThreads = useCallback(async () => {
    try {
      const customLocal = getLocalCustomThreads();
      const res = await fetch('/api/messages/threads');
      if (res.ok) {
        const data = (await res.json()) as { threads?: MessageThread[] };
        if (Array.isArray(data.threads) && data.threads.length > 0) {
          // Merge custom local threads if any
          const dbIds = new Set(data.threads.map((t) => t.id));
          const unmerged = customLocal.filter((t) => !dbIds.has(t.id));
          setThreads([...unmerged, ...data.threads]);
          setLoading(false);
          return;
        }
      }
      // Fallback for demo or when no DB threads yet
      const adjustedDemo = DEMO_THREADS.map((t) => ({
        ...t,
        otherPartyName: currentRole === 'teacher' ? t.parentName : t.teacherName,
        otherPartyRole: (currentRole === 'teacher' ? 'parent' : 'teacher') as SenderRole,
      }));
      const demoIds = new Set(adjustedDemo.map((t) => t.id));
      const unmerged = customLocal.filter((t) => !demoIds.has(t.id));
      setThreads([...unmerged, ...adjustedDemo]);
    } catch {
      // Fallback to demo threads on fetch failure
      const adjustedDemo = DEMO_THREADS.map((t) => ({
        ...t,
        otherPartyName: currentRole === 'teacher' ? t.parentName : t.teacherName,
        otherPartyRole: (currentRole === 'teacher' ? 'parent' : 'teacher') as SenderRole,
      }));
      const customLocal = getLocalCustomThreads();
      const demoIds = new Set(adjustedDemo.map((t) => t.id));
      const unmerged = customLocal.filter((t) => !demoIds.has(t.id));
      setThreads([...unmerged, ...adjustedDemo]);
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
        const res = await fetch('/api/messages/connect-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, childName }),
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
    []
  );

  return { threads, loading, error, myConnectCode, connectViaCode, refreshThreads };
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

  // Load message history
  const loadMessages = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/messages/threads/${id}`);
      if (res.ok) {
        const data = (await res.json()) as { messages?: ChatMessage[] };
        if (Array.isArray(data.messages)) {
          setMessages(data.messages);
          setLoading(false);
          return;
        }
      }
      // Demo fallback
      if (DEMO_MESSAGES[id]) {
        setMessages(DEMO_MESSAGES[id]);
      } else {
        setMessages([]);
      }
    } catch {
      if (DEMO_MESSAGES[id]) {
        setMessages(DEMO_MESSAGES[id]);
      } else {
        setMessages([]);
      }
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

  // Supabase Realtime WebSocket subscription for live incoming messages
  useEffect(() => {
    if (!threadId) return;

    const supabase = createClient();
    if (!supabase) return;

    const channel = supabase
      .channel(`thread:${threadId}`)
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
            // Deduplicate if already added via optimistic update
            if (prev.some((m) => m.id === newMsg.id || (m.id.startsWith('temp-') && m.body === newMsg.body))) {
              return prev.map((m) => (m.id.startsWith('temp-') && m.body === newMsg.body ? newMsg : m));
            }
            return [...prev, newMsg];
          });

          // Play incoming sound if from the other party
          if (newMsg.senderRole !== currentRole) {
            playRewardSound('tap');
            // Acknowledge read state
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

    return () => {
      supabase.removeChannel(channel);
      setIsRealtimeActive(false);
    };
  }, [threadId, currentRole]);

  // Send message function with optimistic update
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
      setMessages((prev) => [...prev, optimisticMsg]);
      playRewardSound('tap');

      try {
        const res = await fetch('/api/messages/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ threadId, body: trimmed }),
        });

        if (res.ok) {
          const data = (await res.json()) as { message?: ChatMessage };
          if (data.message) {
            setMessages((prev) =>
              prev.map((m) => (m.id === tempId ? data.message! : m))
            );
            return true;
          }
        } else {
          // If in demo mode (e.g. 401 unauthenticated), keep demo message in memory
          if (DEMO_MESSAGES[threadId]) {
            DEMO_MESSAGES[threadId].push(optimisticMsg);
          }
          return true;
        }
      } catch {
        // Kept optimistically
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
