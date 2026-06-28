import React, { useState } from 'react';
import { BookOpen, FileText, ChevronRight, ChevronLeft, ShieldAlert, Globe } from 'lucide-react';

interface RightPanelProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({ isOpen, onToggle }) => {
  const [activeTab, setActiveTab] = useState<'incoterms' | 'quick-ref'>('incoterms');
  const [selectedIncoterm, setSelectedIncoterm] = useState<string>('FOB');

  const incotermsList = [
    {
      code: 'FOB',
      name: 'Free On Board',
      risk: 'Seller delivers goods on board the vessel. Risk transfers to buyer once goods are on board.',
      responsibilities: 'Seller handles export clearance. Buyer handles ocean freight and import clearance.'
    },
    {
      code: 'CIF',
      name: 'Cost, Insurance & Freight',
      risk: 'Risk transfers to buyer once on board the vessel. Seller pays for freight and minimum insurance.',
      responsibilities: 'Seller pays freight & insurance. Buyer handles import customs clearance.'
    },
    {
      code: 'EXW',
      name: 'Ex Works',
      risk: 'Risk transfers to buyer at seller\'s factory/warehouse.',
      responsibilities: 'Buyer handles all transportation, export clearance, and import clearance.'
    },
    {
      code: 'DDP',
      name: 'Delivered Duty Paid',
      risk: 'Seller bears all risks and costs to deliver goods to the buyer\'s destination.',
      responsibilities: 'Seller handles all freight, export clearance, import clearance, and import duties.'
    }
  ];

  const quickReferences = [
    { label: 'Commercial Invoice', description: 'Primary customs declaration document detailing value & transaction.' },
    { label: 'Bill of Lading (B/L)', description: 'Contract of carriage and document of title issued by carrier.' },
    { label: 'Certificate of Origin', description: 'Official document proving the country of manufacture.' },
    { label: 'Packing List', description: 'Details dimensions, weight, and items in each package.' }
  ];

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed right-0 top-1/2 -translate-y-1/2 w-8 h-12 bg-[#0B192C] text-white border-l border-t border-b border-slate-700 rounded-l-xl flex items-center justify-center shadow-2xl hover:bg-slate-800 transition-all z-40 focus:outline-none"
        title="Open Context Panel"
      >
        <ChevronLeft size={18} />
      </button>
    );
  }

  return (
    <aside className="w-80 bg-card border-l border-border/80 flex flex-col h-screen flex-shrink-0 relative transition-all duration-300 shadow-xl select-none z-30">
      {/* Collapse Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-10 bg-card border border-border/80 rounded-full flex items-center justify-center shadow-md hover:bg-accent transition-all focus:outline-none text-foreground"
      >
        <ChevronRight size={14} />
      </button>

      {/* Header */}
      <div className="p-5 border-b border-border/60">
        <h3 className="font-bold text-sm text-foreground flex items-center space-x-2">
          <BookOpen size={16} className="text-[#0066FF]" />
          <span>Reference Dashboard</span>
        </h3>
        <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">Quick trade terms & compliance guides</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border/40 p-2 bg-accent/25">
        <button
          onClick={() => setActiveTab('incoterms')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'incoterms'
              ? 'bg-card text-foreground shadow-sm border border-border/40'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Incoterms
        </button>
        <button
          onClick={() => setActiveTab('quick-ref')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'quick-ref'
              ? 'bg-card text-foreground shadow-sm border border-border/40'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Quick Reference
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'incoterms' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-1.5">
              {incotermsList.map((inco) => (
                <button
                  key={inco.code}
                  onClick={() => setSelectedIncoterm(inco.code)}
                  className={`py-2 text-center rounded-lg text-[10px] font-bold border transition-all ${
                    selectedIncoterm === inco.code
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm scale-105'
                      : 'bg-accent/30 text-muted-foreground border-border/40 hover:bg-accent/60'
                  }`}
                >
                  {inco.code}
                </button>
              ))}
            </div>

            {/* Selected Incoterm Details */}
            {incotermsList
              .filter((inco) => inco.code === selectedIncoterm)
              .map((inco) => (
                <div key={inco.code} className="space-y-3.5 animate-fade-in">
                  <div className="bg-accent/20 rounded-xl p-3 border border-border/40">
                    <h4 className="font-bold text-xs text-foreground flex items-center space-x-1.5">
                      <Globe size={13} className="text-[#0066FF]" />
                      <span>{inco.name}</span>
                    </h4>
                  </div>

                  <div className="space-y-2.5">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center space-x-1">
                        <ShieldAlert size={10} className="text-[#0066FF]" />
                        <span>Risk Transfer Point</span>
                      </span>
                      <p className="text-xs text-foreground/80 leading-relaxed font-medium bg-accent/10 rounded-lg p-2.5 border border-border/20">
                        {inco.risk}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Responsibilities</span>
                      <p className="text-xs text-foreground/80 leading-relaxed font-medium bg-accent/10 rounded-lg p-2.5 border border-border/20">
                        {inco.responsibilities}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="space-y-3">
            {quickReferences.map((ref, idx) => (
              <div key={idx} className="p-3 bg-accent/10 rounded-xl border border-border/40 hover:border-[#0066FF]/20 hover:-translate-y-0.5 transition-all shadow-sm">
                <h4 className="font-bold text-xs text-foreground flex items-center space-x-1.5">
                  <FileText size={12} className="text-[#0066FF]" />
                  <span>{ref.label}</span>
                </h4>
                <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed font-medium">
                  {ref.description}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer info */}
      <div className="p-4 border-t border-border/40 bg-accent/5">
        <div className="text-[9px] text-muted-foreground text-center font-semibold">
          OpsAI Trade Compliance Engine v1.0.0
        </div>
      </div>
    </aside>
  );
};
