import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { AnalyticsResponse } from '../types/chatbot';
import { BarChart3, Clock, AlertOctagon, HelpCircle, Activity, RefreshCw } from 'lucide-react';

export const Analytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiService.getAnalytics();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve analytics payload. Ensure the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Compute percentages for custom progress bar charts
  const getMaxModeValue = () => {
    if (!data || !data.mode_distribution) return 1;
    const values = Object.values(data.mode_distribution);
    return values.length > 0 ? Math.max(...values, 1) : 1;
  };

  const getMaxTermValue = () => {
    if (!data || !data.popular_terms || data.popular_terms.length === 0) return 1;
    return Math.max(...data.popular_terms.map(t => t.count), 1);
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border/40 px-6 py-4 flex items-center justify-between shadow-sm select-none">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary/5 text-primary border border-primary/10 flex items-center justify-center">
            <BarChart3 size={18} />
          </div>
          <div>
            <h2 className="font-bold text-sm text-foreground">Operational Analytics</h2>
            <p className="text-[10px] text-muted-foreground font-medium">Monitor RAG Performance & Query Insights</p>
          </div>
        </div>
        <button
          onClick={fetchAnalytics}
          disabled={isLoading}
          className="p-2 bg-card hover:bg-accent border border-border/80 hover:border-border text-muted-foreground hover:text-foreground rounded-xl transition-all duration-200 hover:translate-x-1 shadow-sm focus:outline-none"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </header>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {error && (
          <div className="p-4 bg-destructive/5 text-destructive border border-destructive/10 rounded-xl flex items-center space-x-3 text-xs font-semibold shadow-sm">
            <AlertOctagon size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Telemetry Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 select-none">
          <div className="bg-card border border-border/40 p-5 rounded-xl shadow-sm flex items-center justify-between">
            <div className="flex flex-col space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Questions</span>
              <span className="font-bold text-2xl text-foreground">{isLoading ? '...' : data?.total_questions ?? 0}</span>
            </div>
            <div className="p-3 bg-primary/5 text-primary border border-primary/10 rounded-xl">
              <HelpCircle size={22} />
            </div>
          </div>

          <div className="bg-card border border-border/40 p-5 rounded-xl shadow-sm flex items-center justify-between">
            <div className="flex flex-col space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Average Response Latency</span>
              <span className="font-bold text-2xl text-foreground">
                {isLoading ? '...' : `${data?.average_response_time ?? 0.0}s`}
              </span>
            </div>
            <div className="p-3 bg-emerald-500/5 text-emerald-600 border border-emerald-500/10 rounded-xl">
              <Clock size={22} />
            </div>
          </div>

          <div className="bg-card border border-border/40 p-5 rounded-xl shadow-sm flex items-center justify-between">
            <div className="flex flex-col space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Knowledge Gaps (Failed Searches)</span>
              <span className="font-bold text-2xl text-destructive">
                {isLoading ? '...' : data?.failed_searches_count ?? 0}
              </span>
            </div>
            <div className="p-3 bg-red-500/5 text-destructive border border-red-500/10 rounded-xl">
              <AlertOctagon size={22} />
            </div>
          </div>
        </div>

        {/* Distribution Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Mode distribution */}
          <div className="bg-card border border-border/40 p-6 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center space-x-2 border-b border-border/40 pb-2.5">
              <Activity size={16} className="text-primary" />
              <h3 className="font-bold text-sm text-foreground font-outfit">Response Mode Distribution</h3>
            </div>
            {isLoading ? (
              <div className="py-12 flex justify-center text-xs text-muted-foreground">Loading chart...</div>
            ) : !data || Object.keys(data.mode_distribution).length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground">No queries processed yet.</div>
            ) : (
              <div className="space-y-4 pt-2">
                {Object.entries(data.mode_distribution).map(([mode, count]) => {
                  const max = getMaxModeValue();
                  const pct = Math.round((count / max) * 100);
                  const labels: Record<string, string> = {
                    quick: 'Quick Explanation',
                    detailed: 'Detailed Learning',
                    comparison: 'Comparison Table'
                  };
                  return (
                    <div key={mode} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold text-foreground/80">
                        <span className="capitalize">{labels[mode] || mode}</span>
                        <span>{count} times</span>
                      </div>
                      <div className="w-full bg-accent/40 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-primary h-full transition-all duration-200 hover:translate-x-1 duration-500 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Popular terms */}
          <div className="bg-card border border-border/40 p-6 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center space-x-2 border-b border-border/40 pb-2.5">
              <BarChart3 size={16} className="text-primary" />
              <h3 className="font-bold text-sm text-foreground font-outfit">Top Popular Trade Terms</h3>
            </div>
            {isLoading ? (
              <div className="py-12 flex justify-center text-xs text-muted-foreground">Loading chart...</div>
            ) : !data || !data.popular_terms || data.popular_terms.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground">No terms queried yet.</div>
            ) : (
              <div className="space-y-4 pt-2">
                {data.popular_terms.map((item) => {
                  const max = getMaxTermValue();
                  const pct = Math.round((item.count / max) * 100);
                  return (
                    <div key={item.term} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold text-foreground/80">
                        <span>{item.term}</span>
                        <span>{item.count} hits</span>
                      </div>
                      <div className="w-full bg-accent/40 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full transition-all duration-200 hover:translate-x-1 duration-500 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Failed Queries gaps analysis table */}
        <div className="bg-card border border-border/40 p-6 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-border/40 pb-2.5">
            <AlertOctagon size={16} className="text-destructive" />
            <h3 className="font-bold text-sm text-foreground font-outfit">Ingestion Gaps Analysis (Failed Queries)</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed select-none">
            Review search inputs that returned the fallback message `"I don't have enough verified information on this topic."` Use this log to coordinate documentation updates.
          </p>

          {isLoading ? (
            <div className="py-12 flex justify-center text-xs text-muted-foreground">Loading log...</div>
          ) : !data || !data.recent_failed_searches || data.recent_failed_searches.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground select-none">
              No failed searches logged. The knowledge base is fully coverage-aligned!
            </div>
          ) : (
            <div className="overflow-x-auto border border-border/60 rounded-xl">
              <table className="min-w-full divide-y divide-border/40 text-xs">
                <thead className="bg-primary/5 text-primary">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold uppercase tracking-wider">Unresolved Search Query</th>
                    <th className="px-4 py-3 text-right font-semibold uppercase tracking-wider">Status Code</th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border/30 text-foreground/95">
                  {data.recent_failed_searches.map((queryText, index) => (
                    <tr key={index} className="hover:bg-destructive/5 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground">{queryText}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-destructive/10 text-destructive border border-destructive/25 uppercase">
                          No Match
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
export default Analytics;
