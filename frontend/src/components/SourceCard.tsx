import React from 'react';
import { SourceDoc } from '../types/chatbot';
import { FileText } from 'lucide-react';

interface SourceCardProps {
  source: SourceDoc;
}

export const SourceCard: React.FC<SourceCardProps> = ({ source }) => {
  return (
    <div className="dark:bg-[#141923] bg-slate-50 border dark:border-border/80 border-slate-200 rounded-xl transition-all duration-200 hover:translate-x-1 duration-200 shadow-sm overflow-hidden flex flex-col hover:-translate-y-1 hover:shadow-lg hover:border-emerald-500/40 dark:hover:border-emerald-500/40">
      {/* Header */}
      <div className="flex items-center justify-between p-2.5 border-b dark:border-border/40 border-slate-200 bg-accent/5">
        <div className="flex items-center space-x-2.5">
          <div className="p-1 bg-primary/10 text-primary rounded-lg">
            <FileText size={15} />
          </div>
          <div>
            <span className="font-semibold text-sm text-foreground">{source.term}</span>
            <span className="ml-2 text-[10px] bg-primary/5 text-primary border border-primary/20 px-1.5 py-0.5 rounded-full font-medium">
              Score: {Math.round(source.score * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-3 py-2.5 text-sm text-muted-foreground space-y-2.5 flex-1">
        <div>
          <span className="font-semibold text-foreground block mb-0.5">Definition:</span>
          <p className="leading-relaxed dark:text-slate-300 text-slate-700">{source.definition}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t dark:border-border/30 border-slate-200">
          <div>
            <span className="font-semibold text-foreground block">Created By:</span>
            <span className="dark:text-slate-300 text-slate-700">{source.created_by}</span>
          </div>
          <div>
            <span className="font-semibold text-foreground block">Used By:</span>
            <span className="dark:text-slate-300 text-slate-700">{source.used_by}</span>
          </div>
        </div>

        <div className="pt-2 border-t dark:border-border/30 border-slate-200 text-xs">
          <span className="font-semibold text-foreground block">Operational Purpose:</span>
          <p className="leading-relaxed dark:text-slate-300 text-slate-700">{source.purpose}</p>
        </div>

        {source.common_problems && source.common_problems !== "Not Specified" && (
          <div className="pt-2 border-t dark:border-border/30 border-slate-200 text-xs">
            <span className="font-semibold text-rose-400 block">Common Problems:</span>
            <p className="leading-relaxed dark:text-slate-300 text-slate-700">{source.common_problems}</p>
          </div>
        )}
      </div>
    </div>
  );
};
export default SourceCard;
