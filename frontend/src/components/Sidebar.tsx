import React, { useState, useEffect } from 'react';
import { Layout, Settings as SettingsIcon, HelpCircle, Sun, Moon, Plus, PanelLeft, LogOut, MessageSquare } from 'lucide-react';
import { apiService } from '../services/api';

interface SidebarProps {
  isOpen: boolean;
  onToggleSidebar: () => void;
  onToggleSettings: () => void;
  onNewInstance: () => void;
  chatHistory: { id: string; label: string }[];
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggleSidebar, onToggleSettings, onNewInstance }) => {
  const [darkMode, setDarkMode] = useState<boolean>(() => localStorage.getItem('theme') === 'dark');
  const [chatHistory, setChatHistory] = useState<{ id: string; label: string }[]>([]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Track new instances as chat history entries
  const handleNewInstance = () => {
    const newEntry = {
      id: Date.now().toString(),
      label: `Chat ${chatHistory.length + 1}`
    };
    setChatHistory(prev => [newEntry, ...prev]);
    onNewInstance();
  };

  const handleLogout = async () => {
    try {
      await apiService.logout();
    } catch { }
    window.location.reload();
  };

  return (
    <aside className={`dark:bg-[#090c14] bg-slate-50 dark:text-[#fafafa] text-slate-800 flex flex-col justify-between h-screen flex-shrink-0 select-none shadow-2xl z-40 transition-all duration-300 ease-in-out border-r dark:border-[#21232b]/80 border-slate-200 ${isOpen ? 'w-64 opacity-100' : 'w-0 opacity-0 pointer-events-none'}`}>
      <div className="flex flex-col h-full overflow-hidden w-64">

        {/* Brand Header */}
        <div className="p-6 border-b dark:border-[#21232b]/60 border-slate-200 flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="font-bold text-lg leading-none dark:text-white text-slate-800 font-matrix">Ops Bot</h1>
            <p className="text-xs text-matrix-amber leading-none mt-2 font-matrix">Kaizen Ops AI Bot</p>
          </div>
          <button onClick={onToggleSidebar}
            className="p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-all text-slate-400 hover:text-slate-800 dark:hover:text-white focus:outline-none"
            title="Collapse Sidebar (Cmd+B)">
            <PanelLeft size={16} className="text-[#7c3aed]" />
          </button>
        </div>

        {/* Workspace Nav */}
        <div className="px-4 pt-4">
          <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold transition-all border-l-2 text-left bg-[#7c3aed]/10 dark:text-white text-slate-800 border-[#7c3aed]">
            <Layout size={16} />
            <span className="font-matrix tracking-wide">Workspace</span>
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 px-4 py-4 overflow-y-auto">
          <p className="text-[9px] uppercase font-matrix text-slate-500 tracking-wider mb-2 px-1">Chat History</p>
          {chatHistory.length === 0 ? (
            <button
              onClick={() => alert('No chat history yet. Start a new instance.')}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold transition-all border-l-2 text-left dark:text-slate-500 text-slate-400 border-transparent hover:bg-black/5 dark:hover:bg-white/5"
            >
              <MessageSquare size={16} />
              <span className="font-matrix tracking-wide">No History</span>
            </button>
          ) : (
            <div className="space-y-1">
              {chatHistory.map((chat) => (
                <button
                  key={chat.id}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold transition-all border-l-2 text-left dark:text-slate-400 text-slate-600 border-transparent hover:bg-[#7c3aed]/10 hover:border-[#7c3aed] hover:dark:text-white"
                >
                  <MessageSquare size={16} />
                  <span className="font-matrix tracking-wide truncate">{chat.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t dark:border-[#21232b]/60 border-slate-200 space-y-4">
          <button onClick={handleNewInstance}
            className="w-full bg-[#7c3aed] hover:bg-[#7c3aed]/90 text-white rounded-xl py-3 px-4 text-xs font-bold flex items-center justify-center space-x-2 transition-all focus:outline-none shadow-lg shadow-[#7c3aed]/20 active:scale-[0.98]">
            <Plus size={14} />
            <span className="font-matrix">New Instance</span>
          </button>

          <div className="space-y-1 pt-2 border-t dark:border-[#21232b]/40 border-slate-200">
            <button onClick={onToggleSettings}
              className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-bold dark:text-slate-400 text-slate-600 dark:hover:text-white hover:text-slate-800 hover:bg-black/5 dark:hover:bg-white/5 transition-all text-left">
              <SettingsIcon size={14} />
              <span className="font-matrix">Settings</span>
            </button>
            <button className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-bold dark:text-slate-400 text-slate-600 dark:hover:text-white hover:text-slate-800 hover:bg-black/5 dark:hover:bg-white/5 transition-all text-left">
              <HelpCircle size={14} />
              <span className="font-matrix">Support</span>
            </button>
            <button onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-500/10 transition-all text-left">
              <LogOut size={14} />
              <span className="font-matrix">Logout</span>
            </button>
          </div>

          <div className="flex items-center justify-between pt-2 border-t dark:border-[#21232b]/40 border-slate-200">
            <span className="text-[9px] font-matrix dark:text-slate-500 text-slate-400 uppercase tracking-wider">Mode</span>
            <button onClick={() => setDarkMode(!darkMode)}
              className="p-1.5 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 dark:text-slate-400 text-slate-600 rounded-lg transition-all border dark:border-[#21232b]/80 border-slate-200 shadow-sm focus:outline-none">
              {darkMode ? <Sun size={12} /> : <Moon size={12} />}
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
export default Sidebar;