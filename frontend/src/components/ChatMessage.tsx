import React from 'react';
import { ChatMessage as ChatMessageType } from '../types/chatbot';
import { SourceCard } from './SourceCard';
import { RiskCard } from './RiskCard';
import { User, Bot, HelpCircle, FileCheck } from 'lucide-react';

interface ChatMessageProps {
  message: ChatMessageType;
  onSelectTopic?: (topic: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, onSelectTopic }) => {
  const isUser = message.sender === 'user';
  const responseData = message.responseData;

  // Clean answer text by removing operational insights from the main block,
  // since they are rendered separately as premium cards.
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
    
    // Remove trailing dashes or blank lines
    return clean.replace(/---\s*$/g, '').trim();
  };

  // Convert markdown tables in the response into styled HTML tables
  const formatText = (text: string) => {
    const lines = text.split('\n');
    let inTable = false;
    let tableRows: string[][] = [];
    const elements: React.ReactNode[] = [];
    
    let keyIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Markdown table detector
      if (line.startsWith('|') && line.endsWith('|')) {
        if (!inTable) {
          inTable = true;
          tableRows = [];
        }
        
        // Skip separator line (e.g. |---|---|)
        if (line.includes('---') || line.includes('-:-')) {
          continue;
        }
        
        const cols = line.split('|').map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
        tableRows.push(cols);
      } else {
        if (inTable) {
          // Render accumulated table
          inTable = false;
          elements.push(renderHTMLTable(tableRows, keyIndex++));
        }
        
        if (line) {
          // Handle bold markers
          const boldFormatted = line.split('**').map((part, index) => {
            return index % 2 === 1 ? <strong key={index} className="font-semibold text-foreground">{part}</strong> : part;
          });
          
          elements.push(
            <p key={keyIndex++} className="leading-relaxed mb-3 text-sm text-foreground/90">
              {boldFormatted}
            </p>
          );
        } else {
          elements.push(<div key={keyIndex++} className="h-2" />);
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
      <div key={key} className="overflow-x-auto my-4 border border-border/80 rounded-xl shadow-sm">
        <table className="min-w-full divide-y divide-border/60 text-xs">
          <thead className="bg-primary/5 text-primary">
            <tr>
              {headers.map((h, idx) => (
                <th key={idx} className="px-4 py-3 text-left font-semibold uppercase tracking-wider border-r border-border/40 last:border-0">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border/40 text-muted-foreground">
            {dataRows.map((row, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-accent/5">
                {row.map((val, colIdx) => (
                  <td key={colIdx} className="px-4 py-3 border-r border-border/40 last:border-0 leading-relaxed">
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

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
      <div className={`flex space-x-3 max-w-[85%] ${isUser ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center shadow-sm border ${
          isUser 
            ? 'bg-primary text-primary-foreground border-primary/20' 
            : message.isError 
              ? 'bg-destructive/10 text-destructive border-destructive/20'
              : 'bg-card text-primary border-border/60'
        }`}>
          {isUser ? <User size={16} /> : <Bot size={16} />}
        </div>

        {/* Message bubble */}
        <div className="flex flex-col space-y-2">
          <div className={`p-4 rounded-2xl shadow-sm border ${
            isUser 
              ? 'bg-primary text-primary-foreground border-primary/10 rounded-tr-none' 
              : message.isError
                ? 'bg-destructive/5 text-destructive border-destructive/10 rounded-tl-none'
                : 'bg-card text-foreground border-border/40 rounded-tl-none'
          }`}>
            {/* Main Content */}
            <div className="space-y-1">
              {formatText(cleanMainText)}
            </div>

            {/* Injected Insights Cards */}
            {!isUser && responseData && <RiskCard text={message.text} />}
          </div>

          {/* Sources List */}
          {!isUser && responseData && responseData.sources && responseData.sources.length > 0 && (
            <div className="mt-2 space-y-2">
              <div className="flex items-center space-x-1.5 text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1 pl-1">
                <FileCheck size={12} />
                <span>Verified Sources ({responseData.sources.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-2xl">
                {responseData.sources.map((source, index) => (
                  <SourceCard key={index} source={source} />
                ))}
              </div>
            </div>
          )}

          {/* Related/Follow-up Topics */}
          {!isUser && responseData && responseData.related_topics && responseData.related_topics.length > 0 && (
            <div className="mt-3 pl-1">
              <div className="flex items-center space-x-1 text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1.5">
                <HelpCircle size={12} />
                <span>Continue Learning</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {responseData.related_topics.map((topic, index) => (
                  <button
                    key={index}
                    onClick={() => onSelectTopic && onSelectTopic(topic)}
                    className="text-xs bg-card hover:bg-primary hover:text-primary-foreground border border-border/80 hover:border-primary px-3 py-1.5 rounded-full transition-all duration-150 shadow-sm font-medium"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default ChatMessage;
