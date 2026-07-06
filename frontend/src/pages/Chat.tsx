import React, { useRef, useEffect, useState } from 'react';
import { useChat } from '../hooks/useChat';
import { ChatMessage } from '../components/ChatMessage';
import { ChatInput } from '../components/ChatInput';
import { Settings as SettingsIcon, X, Upload, Loader2, FileText, Sun, Moon, Cpu, Terminal } from 'lucide-react';
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
      "Initializing environment...",
      "Analyzing parameters...",
      "Searching knowledge base...",
      "Generating response..."
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
      const customOnly = res.source_files.filter((f: any) => f.filename !== 'trade_knowledge.csv');
      setUploadedFiles(customOnly);
    } catch {
      // Offline fallback
    }
  };

  useEffect(() => {
    fetchCustomResources();
  }, [settingsOpen, messages]);

  const handleSuggestClick = (promptText: string, mode: 'quick' | 'detailed' | 'comparison') => {
    sendMessage(promptText, mode);
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

  const suggestedQuestions = [
    { label: "⚡ Compare CPI vs SPI", query: "Compare CPI vs SPI", mode: "comparison" as const },
    { label: "📋 Explain Project Charter", query: "Explain Project Charter", mode: "detailed" as const },
    { label: "⚠ Explain Risk Register", query: "Explain Risk Register", mode: "detailed" as const },
    { label: "👥 What is a RACI Matrix?", query: "What is a RACI Matrix?", mode: "quick" as const },
    { label: "📅 Explain Gantt Chart", query: "Explain Gantt Chart", mode: "quick" as const },
    { label: "📈 What is Earned Value?", query: "What is Earned Value?", mode: "quick" as const },
    { label: "📝 Compare Business Case vs Project Charter", query: "Compare Business Case vs Project Charter", mode: "comparison" as const },
    { label: "👤 Who creates the Business Case?", query: "Who creates the Business Case?", mode: "quick" as const },
    { label: "📊 Explain Cost Performance Index", query: "Explain Cost Performance Index", mode: "detailed" as const },
  ];

  return (
    // FIXED: bg-slate-50 for light mode, pure black for dark mode.
    <div className="flex-1 flex h-full overflow-hidden relative bg-slate-50 dark:bg-black">
      {/* Workspace Canvas */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">

        {/* System Cockpit Top Status Bar - Glassmorphism applied with black base */}
        <header className="px-6 md:px-8 py-4 flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/80 bg-white/70 dark:bg-black/70 backdrop-blur-md select-none z-20 min-h-[64px] shrink-0 shadow-sm">

          {/* Logo Group & Left-Side Hover Toggle */}
          <div className="group flex items-center cursor-pointer relative pl-1 md:pl-0">

            {/* The Ops Icon Toggle - Slides in from the left */}
            {!sidebarOpen && (
              <button
                onClick={onToggleSidebar}
                className="opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 mr-3 p-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg transition-all duration-300 ease-out text-sky-500 dark:text-sky-400 hover:text-sky-600 dark:hover:text-sky-300 focus:outline-none flex-shrink-0 shadow-sm"
                title="Open Command Center (Cmd+B)"
              >
                <Terminal size={16} strokeWidth={2.5} />
              </button>
            )}

            {/* Brand Text - Shifts slightly right on hover to make room for the icon */}
            <div className="flex flex-col justify-center transition-transform duration-300 group-hover:translate-x-1">
              <h2 className="font-bold text-lg text-slate-900 dark:text-white font-sans leading-none tracking-tight">Ops Bot</h2>
              <span className="text-[10px] text-sky-600 dark:text-sky-500 font-semibold tracking-widest mt-1.5 leading-none uppercase">Kaizen Ops AI</span>
            </div>
          </div>

          {/* Micro Status Indicators on Far Right */}
          <div className="flex items-center space-x-2.5">
            <span className={`text-[10px] font-bold tracking-widest uppercase ${backendStatus === 'connected' ? 'text-emerald-500' : 'text-rose-500'}`}>
              {backendStatus === 'connected' ? 'Connected' : 'Offline'}
            </span>
            {/* Wireless status indicator */}
            <span className={`flex items-center justify-center p-1.5 rounded-lg border transition-all ${backendStatus === 'connected'
              ? 'bg-[#39d353]/10 text-[#39d353] border-[#39d353]/20'
              : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
              }`} title={backendStatus === 'connected' ? 'Server Connected' : 'Server Offline'}>
              <span className={`w-1.5 h-1.5 rounded-full ${backendStatus === 'connected' ? 'bg-[#39d353] animate-pulse' : 'bg-rose-500'}`} />
            </span>
            <Cpu size={14} className={backendStatus === 'connected' ? 'text-emerald-500' : 'text-rose-500'} />
          </div>
        </header>

        {/* Canvas Body - Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 pt-8 pb-4 space-y-6 scroll-smooth">
          <div className="max-w-4xl mx-auto w-full">

            {/* Document contents flow */}
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                onSelectTopic={(topic) => sendMessage(topic, 'quick')}
              />
            ))}

            {/* Loading State Container - Upgraded to Premium Card */}
            {isLoading && (
              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-6 font-sans text-sm space-y-4 shadow-lg shadow-slate-200/40 dark:shadow-none max-w-[85%] md:max-w-2xl mx-auto my-8 select-none transition-all">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
                  <span className="font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider text-[11px]">Processing Query</span>
                  <span className="font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[11px]">
                    {visibleLogs.length >= 4 ? 'Status: Finalizing' : 'Status: Computing'}
                  </span>
                </div>
                <div className="space-y-2.5 font-medium text-slate-600 dark:text-slate-300">
                  {visibleLogs.map((logText, idx) => (
                    <p key={idx} className="flex items-center text-xs md:text-sm animate-fade-in">
                      <Loader2 size={12} className="text-blue-500 mr-3 flex-shrink-0 animate-spin" />
                      <span>{logText}</span>
                    </p>
                  ))}
                  {visibleLogs.length < 4 && (
                    <p className="flex items-center text-slate-400 dark:text-slate-500 text-xs md:text-sm">
                      <span className="w-3 h-0.5 bg-blue-500/50 mr-3 flex-shrink-0 animate-pulse" />
                      <span className="animate-pulse">_</span>
                    </p>
                  )}
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Bottom Docked Command Bar */}
        <div className="w-full max-w-4xl mx-auto px-4 pb-6 pt-2 shrink-0 z-20">

          {/* Suggested Questions - Premium Action Pills */}
          {messages.length === 1 && !isLoading && (
            <div className="flex flex-wrap items-center justify-center gap-2.5 mb-5 animate-fade-in">
              {suggestedQuestions.map((item) => (
                <button
                  key={item.query}
                  onClick={() => handleSuggestClick(item.query, item.mode)}
                  // WE SHRANK PADDING, FONT SIZE, AND SOFTENED THE BORDERS
                  className="font-sans text-[11px] py-1.5 px-3 font-medium text-slate-600 dark:text-slate-400 bg-transparent border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-full transition-all duration-150 focus:outline-none"
                >
                  {item.label}
                </button>
              ))}
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
        <aside className="w-64 bg-slate-50 dark:bg-black border-l border-slate-200 dark:border-slate-800 flex flex-col h-screen flex-shrink-0 relative transition-all duration-300 shadow-2xl z-30 animate-fade-in">

          {/* Header */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-black/50">
            <div className="flex items-center space-x-2.5">
              <SettingsIcon size={16} className="text-sky-500" />
              <span className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">Workspace Settings</span>
            </div>
            <button
              onClick={() => setSettingsOpen(false)}
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-900 rounded-lg transition-all text-slate-500 hover:text-slate-900 dark:hover:text-white focus:outline-none"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-6">

            {/* Uploader Section */}
            <div className="space-y-3">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Add Knowledge Source</span>
              <label className="border-2 border-dashed border-slate-300 dark:border-slate-800 hover:border-sky-500 dark:hover:border-sky-500 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-900 group">
                {uploading ? (
                  <>
                    <Loader2 size={24} className="animate-spin text-sky-500 mb-3" />
                    <span className="text-xs font-medium text-slate-500">Processing document...</span>
                  </>
                ) : (
                  <>
                    <Upload size={24} className="text-slate-400 group-hover:text-sky-500 transition-colors mb-3" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 text-center">Upload PDF, CSV, or TXT</span>
                    <span className="text-[10px] text-slate-500 mt-1 font-medium">Max upload size: 10MB</span>
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
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Active Resources</span>
              {uploadedFiles.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500 font-medium border border-dashed border-slate-300 dark:border-slate-800 rounded-xl bg-white/50 dark:bg-slate-900/30">
                  No custom resources found.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {uploadedFiles.map((file, idx) => (
                    <div key={idx} className="p-3.5 bg-white dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm hover:border-sky-500/50 transition-colors">
                      <div className="flex items-center space-x-3 overflow-hidden">
                        <div className="p-2 bg-sky-50 dark:bg-sky-500/10 rounded-lg flex-shrink-0">
                          <FileText size={14} className="text-sky-500" />
                        </div>
                        <div className="overflow-hidden">
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{file.filename}</h4>
                          <span className="text-[10px] text-slate-500 font-medium">{file.records_count} vectorized chunks</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Color Theme Selector */}
            <div className="pt-5 mt-5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Interface Theme</span>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl transition-all border border-slate-200 dark:border-slate-800 shadow-sm focus:outline-none flex items-center space-x-2"
                title="Toggle Theme"
              >
                {darkMode ? <Sun size={14} /> : <Moon size={14} />}
                <span className="text-[10px] font-bold uppercase">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
};
export default Chat;