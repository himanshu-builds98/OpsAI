import React, { useRef, useEffect } from 'react';
import { useChat } from '../hooks/useChat';
import { ChatMessage } from '../components/ChatMessage';
import { ChatInput } from '../components/ChatInput';
import { Loader } from '../components/Loader';
import { Sparkles, MessageSquare } from 'lucide-react';

export const Chat: React.FC = () => {
  const { messages, isLoading, sendMessage, clearChat } = useChat();
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom of chat thread on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSuggestClick = (promptText: string) => {
    sendMessage(promptText, 'quick', 'Student');
  };

  const suggestedQuestions = [
    { text: "What is FOB?", label: "What is FOB?" },
    { text: "Compare FOB and CIF", label: "FOB vs CIF" },
    { text: "What is a Bill of Lading?", label: "Bill of Lading" },
    { text: "Common export documentation mistakes?", label: "Export mistakes" }
  ];

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-background">
      {/* Page Header */}
      <header className="bg-card border-b border-border/40 px-6 py-4 flex items-center justify-between shadow-sm select-none">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary/5 text-primary border border-primary/10 flex items-center justify-center">
            <MessageSquare size={18} />
          </div>
          <div>
            <h2 className="font-bold text-sm text-foreground">OpsAI</h2>
            <p className="text-[10px] text-muted-foreground font-medium">AI Operations Copilot for Trade Intelligence</p>
          </div>
        </div>
      </header>

      {/* Chat Thread Container */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {messages.length === 1 && (
          <div className="flex flex-col items-center justify-center h-full max-w-lg mx-auto text-center space-y-6 select-none my-12 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-primary/5 text-primary border border-primary/10 flex items-center justify-center shadow-sm">
              <Sparkles size={28} />
            </div>
            
            <div className="space-y-2">
              <h3 className="font-bold text-lg text-foreground font-outfit">OpsAI</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Consult real-time international trade compliance, operations guidelines, and risk transfer templates. Select an interface mode to customize detail depth.
              </p>
            </div>

            {/* Quick Suggestions grid */}
            <div className="grid grid-cols-2 gap-2.5 w-full pt-4">
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestClick(q.text)}
                  className="bg-card hover:bg-accent/40 border border-border/80 text-left px-4 py-3 rounded-xl transition-all duration-200 shadow-sm text-xs font-semibold text-foreground/90 hover:-translate-y-0.5 focus:outline-none"
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message elements */}
        {messages.map((msg) => (
          <ChatMessage 
            key={msg.id} 
            message={msg} 
            onSelectTopic={(topic) => sendMessage(topic, 'quick', 'Student')} 
          />
        ))}

        {/* Loading Spinner bubble */}
        {isLoading && (
          <div className="flex justify-start mb-6">
            <div className="flex space-x-3 items-start">
              <div className="w-8 h-8 rounded-lg bg-card text-primary border border-border/60 flex items-center justify-center shadow-sm flex-shrink-0">
                <Loader />
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input controls container */}
      <div className="px-6 pb-6 bg-gradient-to-t from-background via-background/95 to-transparent">
        <ChatInput 
          onSend={sendMessage} 
          onClear={clearChat} 
          isLoading={isLoading} 
        />
      </div>
    </div>
  );
};
export default Chat;
