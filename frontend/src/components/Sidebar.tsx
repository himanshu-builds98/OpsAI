import React, { useState, useEffect, useMemo } from 'react';
import shieldIconPath from '../svg/shield_infinity_circuit_badge.svg';
import {
  Layout, Settings as SettingsIcon, Sun, Moon, PanelLeft, LogOut, MessageSquare,
  Search, Pencil, Trash2, Pin, PinOff, Check, X, MoreHorizontal
} from "lucide-react";
import { apiService } from '../services/api';

export interface ChatItem {
  id: string;
  label: string;
  pinned?: boolean;
}

interface SidebarProps {
  isOpen: boolean;
  onToggleSidebar: () => void;
  onToggleSettings: () => void;
  onNewInstance: () => void;
  chatHistory: ChatItem[];
  onRenameChat?: (id: string, title: string) => void;
  onDeleteChat?: (id: string) => void;
  onTogglePin?: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggleSidebar,
  onToggleSettings,
  onNewInstance,

  chatHistory: initialHistory,

  onRenameChat,
  onDeleteChat,
  onTogglePin
}) => {
  const [darkMode, setDarkMode] = useState<boolean>(() => localStorage.getItem('theme') === 'dark');
  const [chatHistory, setChatHistory] = useState<ChatItem[]>(initialHistory);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Keep local state in sync with parent-provided history
  useEffect(() => {
    setChatHistory(initialHistory);
  }, [initialHistory]);

  const filteredChats = useMemo(() => {
    return [...chatHistory]
      .filter(chat => chat.label.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => Number(b.pinned) - Number(a.pinned));
  }, [chatHistory, search]);

  // Track new instances as chat history entries
  const handleNewInstance = () => {
    const newEntry = {
      id: Date.now().toString(),
      label: `Chat ${chatHistory.length + 1}`
    };
    setChatHistory(prev => [newEntry, ...prev]);
    onNewInstance();
  };

  const renameChat = (id: string) => {
    const title = editingTitle.trim();
    if (!title) return;

    setChatHistory(prev =>
      prev.map(chat => (chat.id === id ? { ...chat, label: title } : chat))
    );

    onRenameChat?.(id, title);
    setEditingId(null);
  };

  const deleteChat = (id: string) => {
    if (!window.confirm("Delete this chat?")) return;

    setChatHistory(prev => prev.filter(chat => chat.id !== id));
    onDeleteChat?.(id);
  };

  const togglePin = (id: string) => {
    setChatHistory(prev =>
      prev.map(chat => (chat.id === id ? { ...chat, pinned: !chat.pinned } : chat))
    );

    onTogglePin?.(id);
  };

  const handleLogout = async () => {
    try {
      await apiService.logout();
    } catch { }
    window.location.reload();
  };

  return (
    <aside className={`dark:bg-[#090c14] bg-slate-50 dark:text-[#fafafa] text-slate-800 flex flex-col justify-between h-screen flex-shrink-0 select-none shadow-2xl z-40 transition-all duration-300 ease-in-out ${isOpen ? 'w-64 opacity-100' : 'w-0 opacity-0 pointer-events-none'}`}>
      <div className="p-3 flex items-center justify-between shrink-0">
        <div className="w-8 h-8 flex items-center justify-center rounded-full overflow-hidden shrink-0">
          {/* Using your custom SVG */}
          <img src={shieldIconPath} alt="Ops Bot Icon" className="w-full h-full object-contain dark:invert" />
        </div>
        <button
          onClick={onToggleSidebar}
          className="p-2 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-all focus:outline-none"
          title="Close sidebar"
        >
          <PanelLeft size={20} strokeWidth={1.5} />
        </button>
      </div>

      {/* ChatGPT-Style Top Actions (New Chat, Search) */}
      <div className="px-3 pt-2 space-y-1 shrink-0">

        {/* New Instance (Moved from footer to top) */}
        <button
          onClick={handleNewInstance}
          className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-[13px] font-medium text-slate-700 dark:text-slate-200 hover:bg-black/5 dark:hover:bg-[#202123] transition-colors focus:outline-none"
        >
          <Pencil size={16} strokeWidth={1.5} />
          <span className="font-sans">New chat</span>
        </button>

        {/* Search Bar - Styled as a flat row */}
        <div className="group relative w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-[13px] font-medium text-slate-700 dark:text-slate-200 hover:bg-black/5 dark:hover:bg-[#202123] transition-colors cursor-text">
          <Search size={16} strokeWidth={1.5} className="text-slate-500 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search chats"
            className="w-full bg-transparent border-none outline-none font-sans text-slate-800 dark:text-slate-200 placeholder-slate-500"
          />
        </div>
      </div>

      {/* Chat History List */}
      <div className="flex-1 px-3 py-2 overflow-y-auto mt-2">
        {filteredChats.length === 0 ? (
          /* ChatGPT-Style No History (Library equivalent) */
          <div className="w-full flex items-center space-x-3 px-3 py-2.5 text-[13px] font-medium text-slate-500 select-none">
            <Layout size={16} strokeWidth={1.5} />
            <span className="font-sans">Library is empty</span>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredChats.map((chat) => (
              <div
                key={chat.id}
                className="group relative w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold transition-all border-l-2 text-left dark:text-slate-400 text-slate-600 border-transparent hover:bg-[#7c3aed]/10 hover:border-[#7c3aed] hover:dark:text-white"
              >
                {chat.pinned ? (
                  <Pin size={14} className="text-[#7c3aed] flex-shrink-0" />
                ) : (
                  <MessageSquare size={16} className="flex-shrink-0" />
                )}

                {editingId === chat.id ? (
                  <input
                    autoFocus
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') renameChat(chat.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    className="flex-1 min-w-0 bg-transparent border-b border-[#7c3aed] outline-none font-matrix tracking-wide"
                  />
                ) : (
                  <span className="font-matrix tracking-wide truncate flex-1 min-w-0">{chat.label}</span>
                )}

                {editingId === chat.id ? (
                  <div className="flex items-center space-x-1 flex-shrink-0">
                    <button onClick={() => renameChat(chat.id)} className="p-1 hover:text-emerald-500">
                      <Check size={13} />
                    </button>
                    <button onClick={() => setEditingId(null)} className="p-1 hover:text-rose-500">
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <div className="relative flex-shrink-0">
                    <button
                      onClick={() => setMenuOpen(menuOpen === chat.id ? null : chat.id)}
                      className="p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:text-slate-800 dark:hover:text-white"
                    >
                      <MoreHorizontal size={14} />
                    </button>

                    {menuOpen === chat.id && (
                      <div className="absolute right-0 top-6 z-50 w-32 rounded-lg shadow-lg border dark:border-[#21232b]/80 border-slate-200 dark:bg-[#0f121b] bg-white overflow-hidden">
                        <button
                          onClick={() => {
                            setEditingId(chat.id);
                            setEditingTitle(chat.label);
                            setMenuOpen(null);
                          }}
                          className="w-full flex items-center space-x-2 px-3 py-2 text-xs dark:text-slate-300 text-slate-600 hover:bg-black/5 dark:hover:bg-white/5"
                        >
                          <Pencil size={12} />
                          <span className="font-matrix">Rename</span>
                        </button>
                        <button
                          onClick={() => {
                            togglePin(chat.id);
                            setMenuOpen(null);
                          }}
                          className="w-full flex items-center space-x-2 px-3 py-2 text-xs dark:text-slate-300 text-slate-600 hover:bg-black/5 dark:hover:bg-white/5"
                        >
                          {chat.pinned ? <PinOff size={12} /> : <Pin size={12} />}
                          <span className="font-matrix">{chat.pinned ? 'Unpin' : 'Pin'}</span>
                        </button>
                        <button
                          onClick={() => {
                            deleteChat(chat.id);
                            setMenuOpen(null);
                          }}
                          className="w-full flex items-center space-x-2 px-3 py-2 text-xs text-rose-500 hover:bg-rose-500/10"
                        >
                          <Trash2 size={12} />
                          <span className="font-matrix">Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 space-y-4">


        {/* Unified Bottom Menu (Settings, Logout, Mode) */}
        <div className="space-y-1 pt-2">
          <button onClick={onToggleSettings}
            className="w-full flex items-center space-x-3 px-4 py-2 rounded-xl text-[11px] font-bold dark:text-slate-400 text-slate-600 dark:hover:text-white hover:text-slate-800 hover:bg-black/5 dark:hover:bg-white/5 transition-all text-left">
            <SettingsIcon size={12} />
            <span className="font-matrix">Settings</span>
          </button>

          <button onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-2 rounded-xl text-[11px] font-bold text-rose-500 hover:bg-rose-500/10 transition-all text-left">
            <LogOut size={12} />
            <span className="font-matrix">Logout</span>
          </button>

          <button onClick={() => setDarkMode(!darkMode)}
            className="w-full flex items-center space-x-3 px-4 py-2 rounded-xl text-[11px] font-bold dark:text-slate-400 text-slate-600 dark:hover:text-white hover:text-slate-800 hover:bg-black/5 dark:hover:bg-white/5 transition-all text-left focus:outline-none"
          >
            {darkMode ? <Sun size={12} /> : <Moon size={12} />}
            <span className="font-matrix">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        </div>

      </div>

    </aside >
  );
};
export default Sidebar; 