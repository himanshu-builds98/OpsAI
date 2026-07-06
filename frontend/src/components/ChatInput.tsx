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
    <div className="w-full relative select-none">
      {/* Centered Command Bar Container */}
      <div className="glassmorphic rounded-2xl px-4 py-3 shadow-2xl border dark:border-slate-800/80 border-slate-200 flex items-center space-x-3.5 transition-all duration-200 dark:bg-[#141923] bg-slate-50">

        {/* Attachment Clip */}
        <button
          type="button"
          title="Attach trade document"
          className="p-2 hover:bg-black/5 dark:hover:bg-slate-800/60 rounded-xl transition-all text-slate-400 hover:text-slate-800 dark:hover:text-white focus:outline-none flex-shrink-0"
        >
          <Paperclip size={18} />
        </button>

        {/* Textarea Input */}
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Questions Here"
          rows={1}
          className="flex-1 bg-transparent border-0 focus:ring-0 focus:outline-none text-sm py-2 px-1 resize-none placeholder:text-slate-400 dark:text-slate-100 text-slate-850 transition-all leading-normal outline-none"
          disabled={isLoading}
          style={{ maxHeight: '80px' }}
        />

        {/* Execution Arrow / Stop Button */}
        <div className="flex-shrink-0 flex items-center">
          {isLoading ? (
            <button
              type="button"
              onClick={onClear}
              className="w-9 h-9 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg transition-all animate-pulse focus:outline-none"
              title="Stop Agent Execution"
            >
              <Square size={12} fill="white" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSend}
              disabled={!inputText.trim()}
              className="w-9 h-9 bg-[#7c3aed] hover:bg-[#7c3aed]/95 disabled:bg-slate-800/50 text-white disabled:text-slate-600 rounded-full flex items-center justify-center shadow-lg transition-all focus:outline-none disabled:shadow-none"
              title="Execute Agent Task"
            >
              <Send size={14} className="ml-0.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
export default ChatInput;
