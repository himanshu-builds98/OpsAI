import axios from 'axios';
import { 
  ChatResponse, 
  UploadResponse, 
  KnowledgeStatusResponse, 
  AnalyticsResponse 
} from '../types/chatbot';

// In production, use the environment VITE_API_URL.
// In development, the Vite proxy directs '/api' requests to http://localhost:8000
const API_URL = import.meta.env.VITE_API_URL || '/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 45000, // Large timeout for slower LLMs / embedding steps
});

export const apiService = {
  /**
   * Send question to RAG pipeline.
   */
  async askQuestion(
    question: string, 
    mode: 'quick' | 'detailed' | 'comparison', 
    userLevel: string
  ): Promise<ChatResponse> {
    const response = await apiClient.post<ChatResponse>('/chat', {
      question,
      mode,
      user_level: userLevel.toLowerCase().replace(' ', '_'),
    });
    return response.data;
  },

  /**
   * Ingest new PDF, CSV, or TXT knowledge source.
   */
  async uploadDocument(file: File, onUploadProgress?: (progressEvent: any) => void): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post<UploadResponse>('/upload-document', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
    return response.data;
  },

  /**
   * Fetch details of indexed datasets and vectors.
   */
  async getKnowledgeStatus(): Promise<KnowledgeStatusResponse> {
    const response = await apiClient.get<KnowledgeStatusResponse>('/knowledge-status');
    return response.data;
  },

  /**
   * Fetch traffic volumes and model diagnostics.
   */
  async getAnalytics(): Promise<AnalyticsResponse> {
    const response = await apiClient.get<AnalyticsResponse>('/analytics');
    return response.data;
  },
};
export default apiService;
