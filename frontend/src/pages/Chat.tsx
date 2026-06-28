import React, { useRef, useEffect, useState } from 'react';
import { useChat } from '../hooks/useChat';
import { ChatMessage } from '../components/ChatMessage';
import { ChatInput } from '../components/ChatInput';
import { Settings as SettingsIcon, X, Upload, Loader2, FileText, Sun, Moon, PanelLeft, Cpu } from 'lucide-react';

import { apiService } from '../services/api';

interface ChatProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  backendStatus: 'connected' | 'disconnected';
  newInstanceTrigger: number;
}

export const Chat: React.FC<ChatProps> = ({ sidebarOpen, onToggleSidebar, settingsOpen, setSettingsOpen, backendStatus, newInstanceTrigger }) => {
  const { messages, isLoading, sendMessage, clearChat } = useChat();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [visibleLogs, setVisibleLogs] = useState<string[]>([]);

  // Reset workspace when a new instance is triggered
  useEffect(() => {
    if (newInstanceTrigger > 0) {
      clearChat();
    }
  }, [newInstanceTrigger]);

  // Simulated log writer interval
  useEffect(() => {
    if (!isLoading) {
      setVisibleLogs([]);
      return;
    }

    const logTemplates = [
      "Initializing...",
      "Starting...",
      "Searching...",
      "Generating..."
    ];

    setVisibleLogs([logTemplates[0]]);

    let currentIdx = 1;
    const interval = setInterval(() => {
      if (currentIdx < logTemplates.length) {
        setVisibleLogs(prev => [...prev, logTemplates[currentIdx]]);
        currentIdx++;
      } else {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isLoading]);
  
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  // Toggle theme mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Auto scroll to bottom of canvas on new output
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Fetch only custom resource files (exclude trade_knowledge.csv) and total vectors
  const fetchCustomResources = async () => {
    try {
      const res = await apiService.getKnowledgeStatus();
      const customOnly = res.source_files.filter(f => f.filename !== 'trade_knowledge.csv');
      setUploadedFiles(customOnly);
    } catch {
      // Offline fallback
    }
  };

  useEffect(() => {
    fetchCustomResources();
  }, [settingsOpen, messages]);





  const handleSuggestClick = (promptText: string, mode: 'quick' | 'detailed' | 'comparison') => {
    sendMessage(promptText, mode, 'Student');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      await apiService.uploadDocument(file);
      await fetchCustomResources();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to upload document.");
    } finally {
      setUploading(false);
    }
  };



  return (
    <div className="flex-1 flex h-full overflow-hidden mesh-gradient relative">
      {/* Workspace Canvas (Fluid document edit style) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* System Cockpit Top Status Bar */}
        <header className="px-8 py-4 flex items-center justify-between border-b dark:border-[#21232b]/40 border-slate-200 bg-card/10 backdrop-blur-sm select-none z-20 min-h-[64px]">
          {/* Collapsible Trigger & Title */}
          <div className="flex items-center space-x-3">
            {!sidebarOpen && (
              <button
                onClick={onToggleSidebar}
                className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-all text-slate-400 hover:text-slate-800 dark:hover:text-white focus:outline-none border border-transparent flex-shrink-0"
                title="Open Sidebar (Cmd+B)"
              >
                <PanelLeft size={16} className="text-slate-400" />
              </button>
            )}
            <h2 className="font-bold text-lg dark:text-[#fafafa] text-slate-800 font-matrix">Kaizen OpsAI Bot</h2>
          </div>



          {/* Micro Status Indicators on Far Right */}
          <div className="flex items-center space-x-2">
            <span className={`text-xs font-matrix tracking-wider mr-1 uppercase ${
              backendStatus === 'connected' ? 'dark:text-[#39d353] text-emerald-600' : 'text-rose-500'
            }`}>
              {backendStatus === 'connected' ? 'Server Running' : 'Offline'}
            </span>
            {/* Wireless status indicator */}
            <span className={`flex items-center justify-center p-1.5 rounded-lg border transition-all ${
              backendStatus === 'connected'
                ? 'bg-[#39d353]/10 text-[#39d353] border-[#39d353]/20'
                : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
            }`} title={backendStatus === 'connected' ? 'Server Connected' : 'Server Offline'}>
              <span className={`w-1.5 h-1.5 rounded-full ${backendStatus === 'connected' ? 'bg-[#39d353] animate-pulse' : 'bg-rose-500'}`} />
            </span>
            {/* Microchip icon for local server node connectivity */}
            <Cpu size={14} className={backendStatus === 'connected' ? 'text-[#39d353]' : 'text-rose-500'} />
          </div>
        </header>

        {/* Canvas Body (Dynamic document flow) */}
        <div className="flex-1 overflow-y-auto px-8 py-8 space-y-6">
          <div className="max-w-3xl mx-auto w-full pb-36">
            
            {/* Document contents flow */}
            {messages.map((msg) => (
              <ChatMessage 
                key={msg.id} 
                message={msg} 
                onSelectTopic={(topic) => sendMessage(topic, 'quick', 'Student')} 
              />
            ))}

            {isLoading && (
              <div className="dark:bg-[#141923] bg-slate-50 border dark:border-[#21232b] border-slate-200 rounded-2xl p-6 font-mono text-xs space-y-2.5 shadow-2xl max-w-2xl mx-auto my-6 select-none">
                <div className="flex items-center justify-between border-b dark:border-[#21232b] border-slate-200 pb-2 mb-2">
                  <span className="font-bold dark:text-[#39d353] text-emerald-600 uppercase tracking-wider font-matrix">PROCESSING</span>
                  <span className="font-bold dark:text-[#39d353] text-emerald-600 uppercase tracking-wider font-matrix">
                    {visibleLogs.length >= 4 ? 'STATUS: DONE' : 'STATUS: THINKING...'}
                  </span>
                </div>
                <div className="space-y-1.5 opacity-90 leading-relaxed font-medium">
                  {visibleLogs.map((logText, idx) => (
                    <p key={idx} className="flex items-start dark:text-[#FFB200] text-amber-600 font-matrix-vt">
                      <span className="dark:text-[#39d353] text-emerald-600 font-matrix-vt mr-2 flex-shrink-0">&gt;</span>
                      <span>{logText}</span>
                    </p>
                  ))}
                  {visibleLogs.length < 4 && (
                    <p className="flex items-start text-slate-400">
                      <span className="dark:text-[#39d353] text-emerald-600 font-matrix-vt mr-2 flex-shrink-0">&gt;</span>
                      <span className="animate-pulse font-matrix-vt dark:text-[#39d353] text-[#39d353]">_</span>
                    </p>
                  )}
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Bottom Centered Floating Command Bar */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-3xl px-4 z-20">
          
          {/* Staggered organic cluster of pill-shaped Intent Bubbles floating above */}
           {messages.length === 1 && !isLoading && (
            <div className="flex flex-wrap items-center justify-center gap-2.5 mb-4.5 animate-fade-in">
              <button
                onClick={() => handleSuggestClick("Compare FOB vs. CIF", 'comparison')}
                className="text-[10px] font-matrix py-1.5 px-3 text-[#FFB200] bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-400 rounded-full shadow-md hover:-translate-y-0.5 transition-all focus:outline-none flex items-center space-x-1.5"
              >
                <span>⚡ Compare FOB vs CIF Risks</span>
              </button>
              <button
                onClick={() => handleSuggestClick("Index Bill of Lading Chunk", 'detailed')}
                className="text-[10px] font-matrix py-1.5 px-3 text-[#FFB200] bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-400 rounded-full shadow-md hover:-translate-y-0.5 transition-all focus:outline-none flex items-center space-x-1.5"
              >
                <span>🔍 Index Bill of Lading Chunk</span>
              </button>
              <button
                onClick={() => handleSuggestClick("Simulate Route Delay", 'quick')}
                className="text-[10px] font-matrix py-1.5 px-3 text-[#FFB200] bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-400 rounded-full shadow-md hover:-translate-y-0.5 transition-all focus:outline-none flex items-center space-x-1.5"
              >
                <span>📊 Simulate Route Delay</span>
              </button>
            </div>
          )}

          {/* Centered Command Bar */}
          <ChatInput 
            onSend={sendMessage} 
            onClear={clearChat} 
            isLoading={isLoading} 
          />
        </div>
      </div>

      {/* Settings Drawer (Right Side) */}
      {settingsOpen && (
        <aside className="w-80 bg-[#0f0f12] border-l border-[#21232b]/80 flex flex-col h-screen flex-shrink-0 relative transition-all duration-300 shadow-2xl z-30 animate-fade-in text-white">
          {/* Header */}
          <div className="p-4 border-b border-[#21232b]/60 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <SettingsIcon size={16} className="text-[#10b981]" />
              <span className="text-xs font-bold text-foreground">Resources & Settings</span>
            </div>
            <button
              onClick={() => setSettingsOpen(false)}
              className="p-1.5 hover:bg-accent rounded-lg transition-all text-muted-foreground hover:text-foreground focus:outline-none"
            >
              <X size={14} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {/* Uploader Section */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Add Custom Resources</span>
              <label className="border-2 border-dashed border-[#21232b] hover:border-[#10b981] rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all bg-[#0f0f12]/50 hover:bg-white/5">
                {uploading ? (
                  <>
                    <Loader2 size={24} className="animate-spin text-[#10b981] mb-2" />
                    <span className="text-xs font-medium text-slate-400">Uploading resource...</span>
                  </>
                ) : (
                  <>
                    <Upload size={24} className="text-slate-500 mb-2" />
                    <span className="text-xs font-bold text-foreground text-center">Upload PDF, CSV, or TXT</span>
                    <span className="text-[9px] text-muted-foreground mt-0.5 font-semibold">Max size 10MB</span>
                  </>
                )}
                <input 
                  type="file" 
                  accept=".pdf,.csv,.txt" 
                  className="hidden" 
                  onChange={handleFileUpload} 
                  disabled={uploading}
                />
              </label>
            </div>

            {/* List of Custom Uploads */}
            <div className="space-y-3">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Custom Resources</span>
              {uploadedFiles.length === 0 ? (
                <div className="text-center py-6 text-[11px] text-slate-500 font-semibold border border-dashed border-[#21232b] rounded-xl">
                  No custom resources uploaded
                </div>
              ) : (
                <div className="space-y-2">
                  {uploadedFiles.map((file, idx) => (
                    <div key={idx} className="p-3 bg-[#121318]/50 rounded-xl border border-[#21232b] flex items-center justify-between">
                      <div className="flex items-center space-x-2 overflow-hidden">
                        <FileText size={14} className="text-[#10b981] flex-shrink-0" />
                        <div className="overflow-hidden">
                          <h4 className="text-xs font-bold text-foreground truncate">{file.filename}</h4>
                          <span className="text-[9px] text-muted-foreground font-semibold">{file.records_count} chunks</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Color Theme Selector */}
            <div className="pt-4 border-t border-[#21232b]/60 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Color Theme</span>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl transition-all border border-[#21232b] shadow-sm focus:outline-none"
                title="Toggle Theme"
              >
                {darkMode ? <Sun size={15} /> : <Moon size={15} />}
              </button>
            </div>
          </div>
        </aside>
      )}


    </div>
  );
};
export default Chat;
