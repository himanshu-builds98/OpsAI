import React, { useState, KeyboardEvent } from 'react';
import { Send, Paperclip, Square } from 'lucide-react';

interface ChatInputProps {
  onSend: (text: string, mode: 'quick' | 'detailed' | 'comparison') => void;
  onClear: () => void;
  isLoading: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, onClear, isLoading }) => {
  const [inputText, setInputText] = useState('');

  const handleSend = () => {
    if (!inputText.trim() || isLoading) return;
    onSend(inputText, 'detailed');
    setInputText('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 pb-4 pt-1 shrink-0">
      <div className="relative flex items-center bg-white dark:bg-[#0f0f12] border border-slate-200 dark:border-slate-800 rounded-md shadow-sm">
        {/* Attachment Clip */}
        <button
          type="button"
          title="Attach trade document"
          className="p-2 hover:bg-black/5 dark:hover:bg-slate-800/60 rounded-xl transition-all duration-200 hover:translate-x-1 text-slate-400 hover:text-slate-800 dark:hover:text-white focus:outline-none flex-shrink-0"
        >
          <Paperclip size={18} />
        </button>

        {/* Textarea Input */}
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask OpsAI anything..."
          rows={1}
          className="flex-1 bg-transparent border-0 focus:ring-0 focus:outline-none text-sm py-2 px-1 resize-none placeholder:text-slate-400 dark:text-slate-100 text-slate-850 transition-all duration-200 hover:translate-x-1 leading-normal outline-none"
          disabled={isLoading}
          style={{ maxHeight: '80px' }}
        />

        {/* Execution Arrow / Stop Button */}
        <div className="pr-2">
          {isLoading ? (
            <button
              type="button"
              onClick={onClear}
              className="p-1.5 bg-rose-500/10 text-rose-500 rounded-md hover:bg-rose-500/20"
            >
              <Square size={12} fill="currentColor" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSend}
              disabled={!inputText.trim()}
              className="p-1.5 text-slate-400 hover:text-[#7c3aed] disabled:text-slate-600 transition-all duration-200 hover:translate-x-1"
            >
              <Send size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
export default ChatInput;
