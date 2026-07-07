import React from 'react';
import { ChatMessage as ChatMessageType } from '../types/chatbot';
import { SourceCard } from './SourceCard';
import { RiskCard } from './RiskCard';
import { FileCheck, HelpCircle } from 'lucide-react';

interface ChatMessageProps {
  message: ChatMessageType;
  onSelectTopic?: (topic: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, onSelectTopic }) => {
  const isUser = message.sender === 'user';
  const responseData = message.responseData;

  // Clean answer text
  const getCleanMainAnswer = (text: string) => {
    let clean = text;
    const cleanRegexes = [
      /Operational Insight:\s*[\s\S]*?(?=Common Risk:|Recommendation:|$)/i,
      /Common Risk:\s*[\s\S]*?(?=Operational Insight:|Recommendation:|$)/i,
      /Recommendation:\s*[\s\S]*?(?=Operational Insight:|Common Risk:|$)/i,
      /Operational Tip:\s*[\s\S]*?(?=Operational Insight:|Common Risk:|$)/i
    ];

    cleanRegexes.forEach(regex => {
      clean = clean.replace(regex, '');
    });

    return clean.replace(/---\s*$/g, '').trim();
  };

  // Convert markdown tables into styled HTML tables
  const formatText = (text: string) => {
    const lines = text.split('\n');
    let inTable = false;
    let tableRows: string[][] = [];
    const elements: React.ReactNode[] = [];

    let keyIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.startsWith('|') && line.endsWith('|')) {
        if (!inTable) {
          inTable = true;
          tableRows = [];
        }
        if (line.includes('---') || line.includes('-:-')) {
          continue;
        }
        const cols = line.split('|').map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
        tableRows.push(cols);
      } else {
        if (inTable) {
          inTable = false;
          elements.push(renderHTMLTable(tableRows, keyIndex++));
        }

        if (line) {
          const boldFormatted = line.split('**').map((part, index) => {
            const isPurpleWord = part.toLowerCase().includes('delta-9') || part.toLowerCase().includes('cif vs fob');
            return index % 2 === 1 ? (
              <strong key={index} className={`font-bold ${isPurpleWord ? 'text-[#8b5cf6]' : 'dark:text-white text-slate-800'}`}>
                {part}
              </strong>
            ) : (
              part
            );
          });

          elements.push(
            <p key={keyIndex++} className="font-mono text-base leading-relaxed mb-4 dark:text-[#e0dcd3] text-slate-700 font-normal">
              {boldFormatted}
            </p>
          );
        } else {
          elements.push(<div key={keyIndex++} className="h-2.5" />);
        }
      }
    }

    if (inTable) {
      elements.push(renderHTMLTable(tableRows, keyIndex++));
    }

    return elements;
  };

  const renderHTMLTable = (rows: string[][], key: number) => {
    if (rows.length === 0) return null;
    const headers = rows[0];
    const dataRows = rows.slice(1);

    return (
      <div key={key} className="overflow-x-auto my-3 border-b dark:border-border/40 border-slate-200">
        <table className="min-w-full font-mono text-sm font-light">
          <thead>
            <tr className="border-b dark:border-border/80 border-slate-200">
              {headers.map((h, idx) => (
                <th key={idx} className="px-2 py-1.5 text-left font-bold uppercase tracking-wider dark:text-emerald-500/80 text-emerald-600">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-border/20 divide-slate-100 text-matrix-amber">
            {dataRows.map((row, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-[#10b981]/5">
                {row.map((val, colIdx) => (
                  <td key={colIdx} className="px-2 py-1.5 leading-relaxed">
                    {val}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const cleanMainText = isUser ? message.text : getCleanMainAnswer(message.text);

  if (isUser) {
    const parts = message.text.split(/(Route Delta-9|CIF vs FOB)/gi);
    return (
      <div className={`flex w-full mb-6 justify-end`}>
        <div className={`max-w-[85%] text-right`}>
          {/* Label */}
          <span className="text-[9px] font-matrix uppercase tracking-widest text-[#39d353] mb-1 block">User Question</span>

          {/* Flat Highlighted content (No Box) */}
          <div className="text-sm font-matrix leading-relaxed text-[#7c3aed]">
            {parts.map((p, idx) => {
              if (p.toLowerCase() === 'route delta-9') {
                return <span key={idx} className="text-[#a78bfa] font-bold">{p}</span>;
              }
              if (p.toLowerCase() === 'cif vs fob') {
                return <span key={idx} className="text-[#39d353] font-bold">{p}</span>;
              }
              return p;
            })}
          </div>
        </div>
      </div>
    );
  }

  const isComparison = responseData?.mode === 'comparison' || message.text.toLowerCase().includes('compare') || message.text.toLowerCase().includes('fob vs cif');

  return (
    <div className="my-4 animate-fade-in select-text w-full">
      {/* Bot Label */}
      <span className="text-[9px] font-matrix uppercase tracking-widest text-[#39d353] mb-2 block">Ops Bot</span>

      {/* Flat Bot Response (No Box, No borders) */}
      <div className="prose dark:prose-invert max-w-none">
        {formatText(cleanMainText)}
      </div>

      {/* Comparison Grid Widgets matching screenshot */}
      {isComparison && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-3">
            {/* Baseline Costs */}
            <div className="dark:bg-[#141923] bg-slate-50 border dark:border-[#21232b]/80 border-slate-200 rounded-xl p-4 space-y-3.5 shadow-xl">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider font-sans">Baseline Costs (Avg)</span>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="flex justify-between font-bold text-slate-300">
                    <span className="text-[10px] uppercase font-bold text-slate-400 font-sans">CIF (Cost, Ins, Freight)</span>
                    <span className="text-[#7c3aed] font-mono text-sm font-bold">$14,200</span>
                  </div>
                  <div className="w-full bg-[#0d111c] h-1 rounded-full mt-1 overflow-hidden">
                    <div className="bg-[#7c3aed] h-full" style={{ width: '80%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between font-bold text-slate-300">
                    <span className="text-[10px] uppercase font-bold text-slate-400 font-sans">FOB (Free On Board)</span>
                    <span className="text-[#39d353] font-mono text-sm font-bold">$11,850</span>
                  </div>
                  <div className="w-full bg-[#0d111c] h-1 rounded-full mt-1 overflow-hidden">
                    <div className="bg-[#39d353] h-full" style={{ width: '65%' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Risk Liability Map */}
            <div className="dark:bg-[#141923] bg-slate-50 border dark:border-[#21232b]/80 border-slate-200 rounded-xl p-4 space-y-3 shadow-xl">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider font-sans">Risk Liability Map</span>
              <div className="space-y-2.5 text-sm font-semibold">
                <div className="flex items-start space-x-2">
                  <span className="text-amber-500 text-sm mt-0.5 flex-shrink-0">⚠️</span>
                  <span className="dark:text-slate-300 text-slate-700 leading-normal font-sans">CIF: Seller Risks - Extended exposure until destination port</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-[#39d353] text-sm mt-0.5 flex-shrink-0">🛡️</span>
                  <span className="dark:text-slate-300 text-slate-700 leading-normal font-sans">FOB: Buyer Risks - Risk transfers at ship's rail.</span>
                </div>
              </div>
            </div>

            {/* Est Transit Time */}
            <div className="dark:bg-[#141923] bg-slate-50 border dark:border-[#21232b]/80 border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-xl">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider font-sans">Est. Transit Time</span>
              <div className="text-center py-1">
                <h4 className="text-5xl font-extrabold dark:text-white text-slate-800 font-sans tracking-tight">22.4</h4>
                <p className="text-[10px] font-bold text-[#39d353] mt-1 uppercase font-sans tracking-wider">Avg. Days (Delta-9)</p>
              </div>
              <div className="flex justify-center space-x-1.5 mt-1">
                <div className="w-3.5 h-1.5 bg-[#39d353] rounded-sm" />
                <div className="w-3.5 h-1.5 bg-[#39d353] rounded-sm" />
                <div className="w-3.5 h-1.5 bg-[#39d353] rounded-sm" />
                <div className="w-3.5 h-1.5 bg-[#39d353] rounded-sm" />
                <div className="w-3.5 h-1.5 bg-slate-300 dark:bg-slate-800 rounded-sm" />
              </div>
            </div>
          </div>

          {/* Summary Insight Panel */}
          <div className="dark:bg-[#141923] bg-slate-50 border dark:border-[#21232b]/80 border-slate-200 rounded-xl p-4 shadow-xl mt-3">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider font-sans mb-1.5 block">Summary Insight Panel</span>
            <p className="font-mono text-lg leading-relaxed dark:text-[#e0dcd3] text-slate-700 font-normal">
              Based on current operational parameters, transitioning to a <strong className="text-[#39d353]">FOB</strong> contracting strategy shifts transit risk to the buyer at the loading port, reducing seller liability. However, maintaining a <strong className="text-[#7c3aed]">CIF</strong> framework ensures comprehensive seller-managed insurance coverage until arrival, though it registers higher baseline logistics costs. Adjusting routing parameters for Route Delta-9 yields optimal transit times.
            </p>
          </div>
        </>
      )}

      {/* Injected Risk/Insight widgets */}
      {responseData && <RiskCard text={message.text} />}

      {/* Sources - Styled as clean inline list with added top padding for separation */}
      {responseData && responseData.sources && responseData.sources.length > 0 && (
        <div className="mt-6 pt-4 space-y-3">
          <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            <FileCheck size={12} className="text-[#10b981]" />
            <span>Workspace Citations</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {responseData.sources.map((source, index) => (
              <SourceCard key={index} source={source} />
            ))}
          </div>
        </div>
      )}

      {/* Topics */}
      {responseData && responseData.related_topics && responseData.related_topics.length > 0 && (
        <div className="flex items-center space-x-2 pt-2">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center space-x-1">
            <HelpCircle size={12} className="text-[#10b981]" />
            <span>Continue:</span>
          </span>
          <div className="flex flex-wrap gap-2">
            {responseData.related_topics.map((topic, index) => (
              <button
                key={index}
                onClick={() => onSelectTopic && onSelectTopic(topic)}
                className="font-sans text-sm py-1 px-3 font-semibold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-400 rounded-full transition-all duration-200 hover:translate-x-1 duration-150 shadow-sm"
              >
                {topic}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
export default ChatMessage;