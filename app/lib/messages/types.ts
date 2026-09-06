export type SenderRole = 'parent' | 'teacher';

export type ChatMessage = {
  id: string;
  threadId: string;
  senderId: string;
  senderRole: SenderRole;
  body: string;
  read: boolean;
  createdAt: string;
};

export type MessageThread = {
  id: string;
  classroomId: string;
  classroomName: string;
  childId: string;
  childName: string;
  parentId: string;
  parentName: string;
  teacherId: string;
  teacherName: string;
  lastMessageAt: string;
  lastMessageSnippet: string | null;
  unreadCount: number;
  otherPartyName: string;
  otherPartyRole: SenderRole;
  churchOrOrg?: string | null;
};

export type SendMessagePayload = {
  threadId?: string;
  classroomId?: string;
  childId?: string;
  body: string;
};

export type ReadThreadPayload = {
  threadId: string;
};

export type ConnectCodeInfo = {
  code: string;
  role: SenderRole;
  displayName: string;
};

export type ConnectViaCodePayload = {
  code: string;
  childName?: string;
};

export type ConnectViaCodeResponse = {
  success: boolean;
  message?: string;
  thread?: MessageThread;
  error?: string;
};

