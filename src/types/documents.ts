export interface Document {
  id: string;
  title: string;
  filename: string;
  category: DocumentCategory;
  path: string;
  size: number;
  pages?: number;
  uploadDate?: Date;
  lastModified?: Date;
  processed: boolean;
}

export enum DocumentCategory {
  FDA = 'FDA',
  SEC = 'SEC', 
  PUBLICATION = 'Publication',
  PRESS_REPORT = 'Press Report',
  ABSTRACT = 'Abstract'
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  content: string;
  startPage: number;
  endPage: number;
  startChar: number;
  endChar: number;
  embedding?: number[];
  tokens: number;
  metadata: ChunkMetadata;
}

export interface ChunkMetadata {
  documentTitle: string;
  documentCategory: DocumentCategory;
  filename?: string; // Include filename for proper PDF linking
  pageNumbers: number[];
  section?: string;
  subsection?: string;
  hasTable: boolean;
  hasFigure: boolean;
  confidenceScore?: number;
}

export interface SearchResult {
  chunk: DocumentChunk;
  score: number;
  relevanceReason: string;
}

export interface ProcessedDocument {
  document: Document;
  chunks: DocumentChunk[];
  embeddings: number[][];
  extractedText: string;
  processingDate: Date;
  errors?: string[];
}

export interface PDFProcessingOptions {
  chunkSize: number;
  chunkOverlap: number;
  minChunkSize: number;
  preserveFormatting: boolean;
  extractTables: boolean;
  extractImages: boolean;
}

export const DEFAULT_PROCESSING_OPTIONS: PDFProcessingOptions = {
  chunkSize: 1000,
  chunkOverlap: 200,
  minChunkSize: 100,
  preserveFormatting: true,
  extractTables: true,
  extractImages: false
}; 