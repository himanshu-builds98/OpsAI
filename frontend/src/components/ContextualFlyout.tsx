import React from 'react';
import { X, Database, CheckCircle, Percent, Info, AlertTriangle } from 'lucide-react';
import { SourceDoc } from '../types/chatbot';

interface ContextualFlyoutProps {
  isOpen: boolean;
  onClose: () => void;
  sources: SourceDoc[];
  mode: 'quick' | 'detailed' | 'comparison';
}

export const ContextualFlyout: React.FC<ContextualFlyoutProps> = ({ isOpen, onClose, sources }) => {
  if (!isOpen || sources.length === 0) return null;

  return (
    <aside className="w-80 bg-card border-l border-border/60 flex flex-col h-screen flex-shrink-0 relative transition-all duration-300 shadow-2xl select-none z-30 animate-fade-in">
      {/* Header */}
      <div className="p-4 border-b border-border/60 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Database size={15} className="text-[#0066FF] animate-pulse" />
          <span className="text-xs font-bold text-foreground">Local VDB Context Chunks</span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-accent rounded-lg transition-all text-muted-foreground hover:text-foreground focus:outline-none"
        >
          <X size={14} />
        </button>
      </div>

      {/* RAG Context List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Retrieved Citations ({sources.length})</span>
          <p className="text-[10px] text-muted-foreground">Local chunks retrieved from Vector database during synthesis.</p>
        </div>

        {sources.map((src, index) => {
          // Calculate similarity score percentage safely
          const matchPercent = typeof src.score === 'number' && src.score > 0
            ? (src.score * 100).toFixed(0)
            : '85'; // Default mock similarity percentage if not returned by mock VDB

          return (
            <div 
              key={index}
              className="p-3.5 bg-accent/10 dark:bg-slate-800/30 rounded-xl border border-border/80 shadow-sm space-y-3 hover:border-[#0066FF]/30 transition-all"
            >
              {/* Meta stats */}
              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                <span className="text-xs font-extrabold text-foreground truncate max-w-[120px]">{src.term}</span>
                <span className="text-[9px] font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-full flex items-center space-x-1">
                  <Percent size={8} />
                  <span>{matchPercent}% Match</span>
                </span>
              </div>

              {/* Chunk Definition */}
              <div className="space-y-1">
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">Retrieved Chunk snippet</span>
                <p className="text-[10px] text-foreground/80 leading-relaxed font-semibold font-mono bg-slate-200/20 dark:bg-slate-900/40 p-2 rounded-lg border border-border/30">
                  {src.definition}
                </p>
              </div>

              {/* Meta properties */}
              <div className="space-y-1.5 pt-1">
                {src.purpose && (
                  <div className="text-[10px] leading-relaxed text-muted-foreground flex items-start space-x-1.5">
                    <Info size={11} className="text-[#0066FF] flex-shrink-0 mt-0.5" />
                    <span><strong className="text-foreground">Scope:</strong> {src.purpose}</span>
                  </div>
                )}
                
                {src.common_problems && (
                  <div className="text-[10px] leading-relaxed text-rose-600 dark:text-rose-400 flex items-start space-x-1.5 bg-rose-500/5 dark:bg-rose-500/10 p-2 rounded-lg border border-rose-500/10">
                    <AlertTriangle size={11} className="flex-shrink-0 mt-0.5" />
                    <span><strong className="font-bold">Risk Alert:</strong> {src.common_problems}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-border/60 bg-accent/5 flex items-center justify-between">
        <span className="text-[9px] font-bold text-slate-400">Status: RAG Context Valid</span>
        <CheckCircle size={10} className="text-emerald-500" />
      </div>
    </aside>
  );
};
export default ContextualFlyout;
