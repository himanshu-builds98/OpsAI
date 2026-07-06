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

  // 1. Hide initial greeting or placeholder messages
  if (message.text.includes("I am Kaizen Ops Assistant")) {
    return null;
  }

  // 2. High-Fidelity Multi-Pattern Cleaner
  const getCleanMainAnswer = (text: string) => {
    if (!text) return "";
    let clean = text;

    const toxicPatterns = [
      // Direct catch-all for any sequence of square-bracketed form placeholders
      /\[Your\s+[^\]]+\]/ig,
      /\[City,\s*State\s+ZIP\s+Code\]/ig,

      // Legacy patterns and specific boilerplate chunks
      /Subject:\s*\[User's Question\]/ig,
      /Dear\s+\[Name\],[\s\S]*?\[Your\s+User's\s+Question\]/ig,
      /I\s+am\s+the\s+"Kaizen\s+Trade\s+Assistant"[\s\S]*?based\s+on\s+the\s+provided\s+context\.?/ig,
      /Response\s+Guidelines:[\s\S]*?10\.\s+Produce\s+only\s+the\s+response\s+requested\s+by\s+the\s+user\.?/ig,

      // Core Context Leaks (Case-insensitive handling for varied backend outputs)
      /---\s*TERM:[\s\S]*?(?=---\s*TASK:|$)/ig,
      /---\s*Term:[\s\S]*?(?=---\s*TASK:|Workspace\s+Citations|$)/ig,
      /---\s*TASK:[\s\S]*?RESPONSE\s+GUIDELINES:[\s\S]*?(?=\n\n|Workspace\s+Citations|$)/ig,
      /USER\s+QUESTION:[\s\S]*?(?=RETRIEVED\s+CONTEXT:|TAKESCAPE:|$)/ig,
      /RETRIEVED\s+CONTEXT:[\s\S]*?(?=---|TAKESCAPE:|$)/ig,
      /TAKESCAPE:[\s\S]*?(?=\n\n|$)/ig,

      // Section Headers
      /Operational\s+Insight:\s*[\s\S]*?(?=Common\s+Risk:|Recommendation:|$)/ig,
      /Common\s+Risk:\s*[\s\S]*?(?=Operational\s+Insight:|Recommendation:|$)/ig,
      /Recommendation:\s*[\s\S]*?(?=Operational\s+Insight:|Common\s+Risk:|$)/ig,
      /Operational\s+Tip:\s*[\s\S]*?(?=Operational\s+Insight:|Common\s+Risk:|$)/ig
    ];

    toxicPatterns.forEach(pattern => {
      clean = clean.replace(pattern, '');
    });

    // Handle string sentence breaking without mangling structural list markdown
    clean = clean.replace(/([^\n])\n(?!\n|[\-\*\#]|\d+\.)([^\n])/g, '$1 $2');

    // Wipe stray layout artifacts out
    clean = clean
      .replace(/---\s*$/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    // FALLBACK SAFETY: If the response was 100% template placeholders, provide clean text
    if (!clean || clean.replace(/[\s\-\*]/g, '').length === 0) {
      return "Document context loaded successfully. Please select a related topic below or review the Workspace Citations for structural data insights.";
    }

    return clean;
  };

  // Convert tables dynamically
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
            return index % 2 === 1 ? (
              <strong key={index} className="font-semibold text-slate-900 dark:text-white">
                {part}
              </strong>
            ) : (
              part
            );
          });
          elements.push(
            <p key={keyIndex++} className="font-sans text-sm leading-relaxed mb-4 text-slate-700 dark:text-slate-300 font-normal">
              {boldFormatted}
            </p>
          );
        } else {
          elements.push(<div key={keyIndex++} className="h-3" />);
        }
      }
    }
    if (inTable) elements.push(renderHTMLTable(tableRows, keyIndex++));
    return elements;
  };

  const renderHTMLTable = (rows: string[][], key: number) => {
    if (rows.length === 0) return null;
    const headers = rows[0];
    const dataRows = rows.slice(1);

    return (
      <div key={key} className="overflow-x-auto my-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <table className="min-w-full font-sans text-sm">
          <thead className="bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
            <tr>
              {headers.map((h, idx) => (
                <th key={idx} className="px-4 py-3 text-left font-semibold uppercase tracking-wider text-xs text-slate-500 dark:text-slate-400">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-slate-700 dark:text-slate-300">
            {dataRows.map((row, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors duration-200">
                {row.map((val, colIdx) => (
                  <td key={colIdx} className="px-4 py-3 leading-relaxed">{val}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const cleanMainText = isUser ? message.text : getCleanMainAnswer(message.text);

  // ==========================================
  // USER BUBBLE
  // ==========================================
  if (isUser) {
    return (
      <div className="flex w-full mb-6 justify-end animate-fade-in select-text">
        <div className="max-w-[85%] md:max-w-[75%] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 px-5 py-3.5 rounded-2xl rounded-tr-sm text-sm font-sans shadow-sm">
          <span className="font-medium">{message.text}</span>
        </div>
      </div>
    );
  }

  // ==========================================
  // ASSISTANT BUBBLE
  // ==========================================
  return (
    <div className="flex w-full mb-10 justify-start animate-fade-in select-text">
      <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center flex-shrink-0 mt-1 shadow-sm mr-3 md:mr-4">
        <span className="text-slate-500 dark:text-slate-400 font-bold text-sm">🤖</span>
      </div>

      <div className="flex-1 space-y-5 max-w-[92%] md:max-w-[85%]">
        <div className="prose dark:prose-invert max-w-none">
          {formatText(cleanMainText)}
        </div>

        {responseData && <div className="mt-5"><RiskCard text={message.text} /></div>}

        {/* Dynamic Citations */}
        {responseData && responseData.sources && responseData.sources.length > 0 && (
          <div className="pt-5 mt-4 border-t dark:border-slate-800 border-slate-200/60 space-y-3.5">
            <div className="flex items-center space-x-2 text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-widest">
              <FileCheck size={14} className="text-slate-400" />
              <span>Workspace Citations</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              {responseData.sources.map((source, index) => (
                <SourceCard key={index} source={source} />
              ))}
            </div>
          </div>
        )}

        {/* Suggestion Pills */}
        {responseData && responseData.related_topics && responseData.related_topics.length > 0 && (
          <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-4 pt-4 mt-3">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-widest flex items-center space-x-1.5 shrink-0">
              <HelpCircle size={14} className="text-slate-400" />
              <span>Continue:</span>
            </span>
            <div className="flex flex-wrap gap-2.5">
              {responseData.related_topics.map((topic, index) => (
                <button
                  key={index}
                  onClick={() => onSelectTopic && onSelectTopic(topic)}
                  className="font-sans text-xs md:text-sm py-2 px-4 font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 rounded-full transition-all duration-200 ease-out shadow-sm hover:shadow-md hover:-translate-y-0.5 focus:outline-none"
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;