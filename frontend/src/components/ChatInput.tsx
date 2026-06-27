import React, { useState, KeyboardEvent } from 'react';
import { Send, Trash2, Eye, Compass, GitCompare, UserCheck } from 'lucide-react';

interface ChatInputProps {
  onSend: (text: string, mode: 'quick' | 'detailed' | 'comparison', userLevel: string) => void;
  onClear: () => void;
  isLoading: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, onClear, isLoading }) => {
  const [inputText, setInputText] = useState('');
  const [mode, setMode] = useState<'quick' | 'detailed' | 'comparison'>('quick');
  const [userLevel, setUserLevel] = useState<string>('Student');

  const handleSend = () => {
    if (!inputText.trim() || isLoading) return;
    onSend(inputText, mode, userLevel);
    setInputText('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const modeOptions: { value: 'quick' | 'detailed' | 'comparison'; label: string; icon: React.ReactNode }[] = [
    { value: 'quick', label: 'Quick Explanation', icon: <Eye size={13} /> },
    { value: 'detailed', label: 'Detailed Learning', icon: <Compass size={13} /> },
    { value: 'comparison', label: 'Comparison', icon: <GitCompare size={13} /> }
  ];

  const levels = ['Beginner', 'Student', 'Operations Executive', 'Trade Professional'];

  return (
    <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-sm space-y-3 transition-all duration-200">
      {/* Configuration Header Selectors */}
      <div className="flex flex-wrap gap-4 items-center justify-between border-b border-border/40 pb-3">
        {/* Mode Selector */}
        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Mode:</span>
          <div className="flex bg-accent/40 p-0.5 rounded-lg border border-border/60">
            {modeOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setMode(opt.value)}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  mode === opt.value
                    ? 'bg-card text-primary shadow-sm border border-border/40'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {opt.icon}
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* User Level Selector */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            <UserCheck size={12} />
            <span>Audience:</span>
          </div>
          <select
            value={userLevel}
            onChange={(e) => setUserLevel(e.target.value)}
            className="bg-accent/40 border border-border/60 rounded-lg text-xs font-semibold px-2 py-1.5 text-foreground hover:border-border focus:outline-none focus:ring-1 focus:ring-primary/20"
          >
            {levels.map((lvl) => (
              <option key={lvl} value={lvl}>{lvl}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Input Text Area and Controls */}
      <div className="flex items-end space-x-3">
        <div className="flex-1 relative">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about import-export, logistics, trade, terms..."
            rows={2}
            className="w-full bg-accent/20 hover:bg-accent/30 focus:bg-card border border-border/60 focus:border-primary/45 rounded-xl text-sm px-4 py-3 resize-none focus:outline-none focus:ring-1 focus:ring-primary/20 placeholder:text-muted-foreground/80 text-foreground transition-all"
            disabled={isLoading}
          />
        </div>

        {/* Actions Button */}
        <div className="flex space-x-2 h-full items-center">
          <button
            type="button"
            onClick={onClear}
            title="Clear Chat Thread"
            className="p-3 bg-accent/40 hover:bg-destructive/10 text-muted-foreground hover:text-destructive border border-border/60 hover:border-destructive/20 rounded-xl transition-all shadow-sm focus:outline-none"
            disabled={isLoading}
          >
            <Trash2 size={18} />
          </button>
          
          <button
            type="button"
            onClick={handleSend}
            disabled={!inputText.trim() || isLoading}
            className="flex items-center space-x-2 px-5 py-3 bg-primary hover:bg-primary/95 disabled:bg-primary/50 text-primary-foreground disabled:text-primary-foreground/70 font-semibold text-sm rounded-xl transition-all shadow-md focus:outline-none disabled:shadow-none"
          >
            <Send size={16} />
            <span>Send</span>
          </button>
        </div>
      </div>
    </div>
  );
};
export default ChatInput;
