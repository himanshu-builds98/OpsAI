import { useState, useCallback } from 'react';
import { ChatMessage } from '../types/chatbot';
import { apiService } from '../services/api';

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  sender: 'assistant',
  text: "Hi 👋 I am Kaizen Ops Assistant. I can help you understand Import-Export Processes, Trade Documents, Logistics Terms, and Operations Concepts. Ask me anything!",
  timestamp: new Date(),
};

export const useChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (
    text: string,
    mode: 'quick' | 'detailed' | 'comparison',
    userLevel: string
  ) => {
    if (!text.trim()) return;

    setError(null);
    const userMsgId = Math.random().toString(36).substring(7);
    const assistantMsgId = Math.random().toString(36).substring(7);

    const newUserMessage: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      const responseData = await apiService.askQuestion(text, mode, userLevel);

      const newAssistantMessage: ChatMessage = {
        id: assistantMsgId,
        sender: 'assistant',
        text: responseData.answer,
        timestamp: new Date(),
        responseData,
      };

      setMessages((prev) => [...prev, newAssistantMessage]);
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || 'The server is currently offline or did not respond.';
      console.error('CHAT ERROR:', err.response?.status, err.response?.data, err.message);
      setError(errorMsg);

      const errorAssistantMessage: ChatMessage = {
        id: assistantMsgId,
        sender: 'assistant',
        text: "I'm having trouble connecting to the Trade Assistant. Please ensure the backend server is running and try again.",
        timestamp: new Date(),
        isError: true,
      };

      setMessages((prev) => [...prev, errorAssistantMessage]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearChat = useCallback(() => {
    setMessages([
      {
        ...WELCOME_MESSAGE,
        timestamp: new Date(), // Refresh timestamp
      }
    ]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearChat,
  };
};
export default useChat;
