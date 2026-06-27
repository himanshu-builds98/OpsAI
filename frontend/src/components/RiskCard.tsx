import React from 'react';
import { Lightbulb, AlertTriangle, ShieldAlert } from 'lucide-react';

interface RiskCardProps {
  text: string;
}

export const RiskCard: React.FC<RiskCardProps> = ({ text }) => {
  // Parsing helper to find trade insights sections in the generated answer
  const getInsights = () => {
    const insightRegex = /(?:Operational Insight|Operational Tip):\s*([\s\S]*?)(?=Common Risk|Recommendation|$)/i;
    const riskRegex = /(?:Common Risk):\s*([\s\S]*?)(?=Operational Insight|Operational Tip|Recommendation|$)/i;
    const recRegex = /(?:Recommendation):\s*([\s\S]*?)(?=Operational Insight|Operational Tip|Common Risk|$)/i;

    const insightMatch = text.match(insightRegex);
    const riskMatch = text.match(riskRegex);
    const recMatch = text.match(recRegex);

    return {
      insight: insightMatch ? insightMatch[1].trim() : null,
      risk: riskMatch ? riskMatch[1].trim() : null,
      recommendation: recMatch ? recMatch[1].trim() : null,
    };
  };

  const { insight, risk, recommendation } = getInsights();

  if (!insight && !risk && !recommendation) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border/40 mt-4">
      {insight && (
        <div className="bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex flex-col space-y-2">
          <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400">
            <Lightbulb size={18} />
            <h4 className="font-semibold text-xs uppercase tracking-wider">Operational Insight</h4>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{insight}</p>
        </div>
      )}

      {risk && (
        <div className="bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex flex-col space-y-2">
          <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400">
            <AlertTriangle size={18} />
            <h4 className="font-semibold text-xs uppercase tracking-wider">Common Risk</h4>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{risk}</p>
        </div>
      )}

      {recommendation && (
        <div className="bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex flex-col space-y-2">
          <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
            <ShieldAlert size={18} />
            <h4 className="font-semibold text-xs uppercase tracking-wider">Recommendation</h4>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{recommendation}</p>
        </div>
      )}
    </div>
  );
};
export default RiskCard;
