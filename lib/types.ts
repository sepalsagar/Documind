export interface DocumentChunk {
  id: string;
  chunkNumber: number;
  pageNumber: number;
  tokens: number;
  positionPercent: number;
  similarityMatch: number; // e.g. 0.94
  sectionTitle: string;
  sectionType: string; // 'Section: 3.2.2' | 'Formal Equation' | 'Hyperparameters' | 'Abstract'
  content: string;
  highlightedPhrase?: string;
  formula?: string;
}

export interface DocumentSection {
  id: string;
  title: string;
  pageRange: string;
  chunkCount: number;
  isActive?: boolean;
}

export interface DocumentItem {
  id: string;
  title: string;
  filename: string;
  originalFileName?: string;
  uploadDate: string;
  pageCount: number;
  chunkCount: number;
  fileSize: string;
  rawFileSize?: number;
  mimeType?: string;
  status: 'Ready' | 'Processing' | 'Failed';
  rawStatus?: string;
  errorMessage?: string;
  progress?: number;
  embeddingModel?: string;
  vectorDimension?: number;
  chunkDensity?: number[];
  sections?: DocumentSection[];
  chunks?: DocumentChunk[];
  createdAt?: string;
  updatedAt?: string;
}

export interface GroundedCitation {
  id: number;
  label: string;
  sourceText: string;
  pageNumber: number;
  chunkId: string;
  pageEnd?: number;
  chunkIndex?: number;
  similarity?: number;
}

export interface GroundingMessage {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  authorName: string;
  content: string;
  latency?: string;
  retrievalTime?: string;
  isStrictlyGrounded?: boolean;
  citations?: GroundedCitation[];
  activeSourceIndex?: number;
}

export interface UserProfile {
  name: string;
  email: string;
  title: string;
  avatarUrl: string;
  identityProvider: string;
  tier: string;
  embeddingUsage: {
    used: number;
    total: number;
  };
}
