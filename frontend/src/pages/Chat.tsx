import React, { useRef, useEffect, useState } from 'react';
import { useChat } from '../hooks/useChat';
import { ChatMessage } from '../components/ChatMessage';
import { ChatInput } from '../components/ChatInput';
import { apiService } from '../services/api';
import { Loader2, X, Upload, FileText, Sun, Moon, Settings, PanelLeft, ChevronDown } from 'lucide-react';
import ShieldBadgeIcon from '../svg/shield_infinity_circuit_badge.svg';

// Add this near your other imports at the top of Chat.tsx

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
    "📄 What is Commercial Invoice?",
    "🚢 What is Bill of Lading?",
    "📦 What is Packing List?",
    "🏛️ What is Certificate of Origin?",
    "🌍 What is FOB?",
    "⚖️ Difference between FOB and CIF?",
    "💳 What is Letter of Credit?",
    "📑 What is Shipping Bill?",
    "📋 What is Delivery Order?",
  ];

  return (
    <div className="flex-1 flex h-full overflow-hidden relative bg-slate-50 dark:bg-black">
      {/* Workspace Canvas */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">

        {/* System Cockpit Top Status Bar */}
        <header className="px-6 h-20 flex items-center justify-between bg-white/70 dark:bg-black/70 backdrop-blur-md z-20 shrink-0">
          {/* Left Side: Brand and Menu */}
          {/* Left Side: Toggle, Brand, and Menu */}
          <div className="flex items-center space-x-4">

            {/* 1. ChatGPT-Style Sidebar Toggle (Only shows when sidebar is closed) */}
            {!sidebarOpen && (
              <button
                onClick={onToggleSidebar}
                className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-all duration-200 hover:translate-x-1 focus:outline-none flex items-center justify-center shrink-0"
                title="Open sidebar"
              >
                <PanelLeft size={20} strokeWidth={1.5} />
              </button>
            )}

            {/* 2. Branding Block (Always visible, clean alignment) */}
            <div className="flex items-center space-x-2.5 cursor-pointer group">

              {/* Shield SVG - Increased Size */}
              <div className="w-8 h-8 flex items-center justify-center shrink-0">
                <img
                  src={ShieldBadgeIcon}
                  alt="Ops Bot Icon"
                  className="w-full h-full object-contain dark:invert transition-transform group-hover:scale-105"
                />
              </div>

              {/* Brand Text + Chevron */}
              <div className="flex flex-col justify-center animate-fade-in">
                <div className="flex items-center space-x-1.5">
                  <h2 className="font-matrix uppercase font-bold text-xl text-slate-900 dark:text-white leading-none tracking-wider mt-1">Ops Bot</h2>
                  {/* ChatGPT-style Chevron */}
                  <ChevronDown size={14} className="text-slate-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={2} />
                </div>
                <span className="text-[9px] text-[#7c3aed] uppercase tracking-widest mt-1.5 font-matrix leading-none">Kaizen Ops AI</span>
              </div>

            </div>
          </div>

          {/* Right Side: Server Status */}
          <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800">
            <div className={`w-2 h-2 rounded-full ${backendStatus === 'connected' ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-rose-500'}`} />
            <span className={`text-[9px] font-matrix uppercase tracking-wider font-bold ${backendStatus === 'connected' ? 'text-emerald-500' : 'text-rose-500'}`}>
              {backendStatus === 'connected' ? 'System Online' : 'Offline'}
            </span>
          </div>

        </header>

        {/* Canvas Body - Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 pt-8 pb-4 space-y-6 scroll-smooth">
          <div className="max-w-4xl mx-auto w-full">

            {/* Document contents flow */}
            {messages.filter((msg, index) =>
              !(index === 0 && msg.sender === 'assistant' && messages.some(m => m.sender === 'user'))
            ).map((msg) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                onSelectTopic={(topic) => sendMessage(topic, 'quick')}
              />
            ))}

            {/* Loading State Container */}
            {isLoading && (
              <div className="p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md w-full max-w-sm mx-auto shadow-sm my-4">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-[8px] font-bold text-slate-500 uppercase tracking-widest font-matrix">Processing...</h2>
                  <span className="text-[7px] text-slate-600 uppercase font-matrix">Status: Finalizing</span>
                </div>
                <div className="space-y-1">
                  {visibleLogs.map((log, i) => (
                    <p key={i} className="text-[9px] text-slate-400 font-matrix flex items-center">
                      <Loader2 className="w-2 h-2 mr-2 animate-spin text-[#7c3aed]" /> {log}
                    </p>
                  ))}
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Bottom Docked Command Bar - Solid Background to prevent overlap */}
        <div className="w-full bg-slate-50 dark:bg-black z-20 shrink-0">
          <div className="max-w-4xl mx-auto px-4 pb-6 pt-4">
            {/* Suggested Questions - Styled for better docking */}
            {messages.length === 1 && !isLoading && (
              <div className="flex flex-wrap items-center justify-center gap-2.5 mb-5 animate-fade-in">
                {suggestedQuestions.map((item) => (
                  <button
                    key={item.query}
                    onClick={() => handleSuggestClick(item.query, item.mode)}
                    className="font-sans text-[11px] py-1.5 px-3 font-medium text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-all duration-200 hover:translate-x-1 duration-150 focus:outline-none shadow-sm"
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
      </div>

      {/* Settings Drawer (Right Side) */}
      {settingsOpen && (
        <aside className="w-64 bg-slate-50 dark:bg-black border-l border-slate-200 dark:border-slate-800 flex flex-col h-screen flex-shrink-0 relative transition-all duration-200 hover:translate-x-1 duration-300 shadow-2xl z-30 animate-fade-in">

          {/* Header */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-black/50">
            <div className="flex items-center space-x-2.5">
              <Settings size={16} className="text-sky-500" />
              <span className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                Workspace Settings
              </span>
            </div>
            <button
              onClick={() => setSettingsOpen(false)}
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-900 rounded-lg transition-all duration-200 hover:translate-x-1 text-slate-500 hover:text-slate-900 dark:hover:text-white focus:outline-none"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-6">

            {/* Uploader Section */}
            <div className="space-y-3">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Add Knowledge Source</span>
              <label className="border-2 border-dashed border-slate-300 dark:border-slate-800 hover:border-sky-500 dark:hover:border-sky-500 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 hover:translate-x-1 bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-900 group">
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
                className="p-2.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl transition-all duration-200 hover:translate-x-1 border border-slate-200 dark:border-slate-800 shadow-sm focus:outline-none flex items-center space-x-2"
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