// We'll define Citation inline to avoid circular imports
export interface Citation {
  id: string;
  documentId: string;
  documentTitle: string;
  pageNumbers: number[];
  content: string;
  url?: string;
  category: string;
  shortName?: string; // Shortened name for inline citations
  relevanceScore: number;
}

export interface ChatMessage {
  id: string;
  content: string;
  role: MessageRole;
  timestamp: Date;
  sessionId: string;
  citations?: Citation[];
  metadata?: MessageMetadata;
}

export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system'
}

export interface MessageMetadata {
  processingTimeMs?: number;
  tokensUsed?: number;
  sources?: string[];
  confidence?: number;
  followupSuggestions?: string[];
}

export interface ChatSession {
  id: string;
  createdAt: Date;
  lastActivity: Date;
  messages: ChatMessage[];
  title?: string;
  userId?: string;
  metadata?: SessionMetadata;
}

export interface SessionMetadata {
  totalMessages: number;
  totalTokens: number;
  averageResponseTime: number;
  documentsReferenced: string[];
  topicsDiscussed: string[];
}

export interface ChatState {
  currentSession?: ChatSession;
  sessions: ChatSession[];
  isLoading: boolean;
  error?: string;
}

export interface SendMessageRequest {
  content: string;
  sessionId?: string;
  options?: MessageOptions;
}

export interface MessageOptions {
  includeHistory?: boolean;
  maxResults?: number;
  searchThreshold?: number;
  citationStyle?: string;
}

export interface SendMessageResponse {
  message: ChatMessage;
  sessionId: string;
  processingTimeMs: number;
} 