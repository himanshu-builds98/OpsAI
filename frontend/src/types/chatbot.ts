export interface SourceDoc {
  term: string;
  definition: string;
  created_by: string;
  used_by: string;
  purpose: string;
  common_problems: string;
  score: number;
}

export interface ChatResponse {
  answer: string;
  mode: 'quick' | 'detailed' | 'comparison';
  sources: SourceDoc[];
  confidence: 'High' | 'Medium' | 'Low' | 'None';
  related_topics: string[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  responseData?: ChatResponse;
  isError?: boolean;
}

export interface UploadResponse {
  filename: string;
  status: 'success' | 'failed';
  records_indexed: number;
  message: string;
}

export interface TermCount {
  term: string;
  count: number;
}

export interface AnalyticsResponse {
  total_questions: number;
  mode_distribution: Record<string, number>;
  popular_terms: TermCount[];
  failed_searches_count: number;
  recent_failed_searches: string[];
  average_response_time: number;
}

export interface SourceFileInfo {
  filename: string;
  file_type: string;
  records_count: number;
  last_modified: string;
}

export interface KnowledgeStatusResponse {
  is_initialized: boolean;
  total_terms: number;
  total_vectors: number;
  last_sync_time: string | null;
  source_files: SourceFileInfo[];
}
