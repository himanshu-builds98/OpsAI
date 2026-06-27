import React, { useState } from 'react';
import { SourceDoc } from '../types/chatbot';
import { FileText, ChevronDown, ChevronUp } from 'lucide-react';

interface SourceCardProps {
  source: SourceDoc;
}

export const SourceCard: React.FC<SourceCardProps> = ({ source }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-card hover:bg-accent/10 border border-border/80 rounded-xl transition-all duration-200 shadow-sm overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3.5 text-left focus:outline-none"
      >
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 bg-primary/10 text-primary rounded-lg">
            <FileText size={16} />
          </div>
          <div>
            <span className="font-semibold text-sm text-foreground">{source.term}</span>
            <span className="ml-2 text-[10px] bg-primary/5 text-primary border border-primary/20 px-1.5 py-0.5 rounded-full font-medium">
              Score: {Math.round(source.score * 100)}%
            </span>
          </div>
        </div>
        <div className="text-muted-foreground">
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {isOpen && (
        <div className="px-4 pb-4 pt-1 border-t border-border/40 text-xs text-muted-foreground space-y-3 bg-accent/5">
          <div>
            <span className="font-semibold text-foreground block mb-0.5">Definition:</span>
            <p className="leading-relaxed">{source.definition}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-3 text-[11px] pt-2 border-t border-border/30">
            <div>
              <span className="font-semibold text-foreground block">Created By:</span>
              <span>{source.created_by}</span>
            </div>
            <div>
              <span className="font-semibold text-foreground block">Used By:</span>
              <span>{source.used_by}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-border/30 text-[11px]">
            <span className="font-semibold text-foreground block">Operational Purpose:</span>
            <p className="leading-relaxed">{source.purpose}</p>
          </div>

          {source.common_problems && source.common_problems !== "Not Specified" && (
            <div className="pt-2 border-t border-border/30 text-[11px]">
              <span className="font-semibold text-destructive block">Common Problems:</span>
              <p className="leading-relaxed">{source.common_problems}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default SourceCard;
