import { Document, DocumentChunk, SearchResult } from './documents';
import { Citation } from './chat';

export interface BaseAgentConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  priority: number;
}

export interface AgentResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
  agentId: string;
}

export interface BaseAgent {
  readonly config: BaseAgentConfig;
  initialize(): Promise<void>;
  execute(input: unknown): Promise<AgentResponse>;
  cleanup(): Promise<void>;
  getStatus(): AgentStatus;
}

export enum AgentStatus {
  IDLE = 'idle',
  PROCESSING = 'processing',
  ERROR = 'error',
  DISABLED = 'disabled'
}

// Citation Agent
export interface CitationInput {
  sources: SearchResult[];
  responseText: string;
}

export interface CitationOutput {
  citations: Citation[];
  formattedResponse: string;
  citationMap: Map<string, string>;
}

// Document Processing Agent
export interface DocumentProcessingInput {
  documents: Document[];
  options?: ProcessingOptions;
}

export interface DocumentProcessingOutput {
  processedDocuments: ProcessedDocument[];
  totalChunks: number;
  processingTimeMs: number;
}

export interface ProcessingOptions {
  batchSize?: number;
  parallel?: boolean;
  skipExisting?: boolean;
}

// Retrieval Agent
export interface RetrievalInput {
  query: string;
  filters?: SearchFilters;
  maxResults?: number;
  threshold?: number;
}

export interface RetrievalOutput {
  results: SearchResult[];
  totalFound: number;
  searchTimeMs: number;
  queryEmbedding: number[];
}

export interface SearchFilters {
  categories?: string[];
  documentIds?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  pageRange?: {
    min: number;
    max: number;
  };
}

export interface ProcessedDocument {
  document: Document;
  chunks: DocumentChunk[];
  embeddings: number[][];
  extractedText: string;
  processingDate: Date;
  errors?: string[];
}

// Orchestrator
export interface OrchestratorInput {
  query: string;
  sessionId?: string;
  userId?: string;
  availableDocuments?: Document[];
  options?: OrchestratorOptions;
}

export interface OrchestratorOutput {
  response: string;
  citations: Citation[];
  sessionId: string;
  processingSteps: ProcessingStep[];
  totalTimeMs: number;
}

export interface OrchestratorOptions {
  maxResults?: number;
  searchThreshold?: number;
  includeSteps?: boolean;
  enableMemory?: boolean;
}

export interface ProcessingStep {
  agent: string;
  action: string;
  input: unknown;
  output: unknown;
  timeMs: number;
  success: boolean;
  error?: string;
} 