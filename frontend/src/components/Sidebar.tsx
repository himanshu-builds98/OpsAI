import React, { useState, useEffect, useMemo } from 'react';
import {
  Layout, Settings as SettingsIcon, Sun, Moon, Plus, PanelLeft, LogOut, MessageSquare,
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

  useEffect(() => {
    setChatHistory(initialHistory);
  }, [initialHistory]);

  const filteredChats = useMemo(() => {
    return [...chatHistory]
      .filter(chat => chat.label.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => Number(b.pinned) - Number(a.pinned));
  }, [chatHistory, search]);

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
    <aside className={`font-matrix dark:bg-[#090c14] bg-slate-50 dark:text-[#fafafa] text-slate-800 flex flex-col justify-between h-screen flex-shrink-0 select-none shadow-2xl z-40 transition-all duration-300 ease-in-out border-r dark:border-[#21232b]/80 border-slate-200 ${isOpen ? 'w-64 opacity-100' : 'w-0 opacity-0 pointer-events-none'}`}>
      <div className="flex flex-col h-full overflow-hidden w-64">

        {/* Brand Header */}
        <div className="p-5 border-b dark:border-[#21232b]/60 border-slate-200 flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="font-bold text-base leading-none dark:text-white text-slate-800 font-matrix">Ops Bot</h1>
            <p className="text-[10px] text-matrix-amber leading-none mt-1.5 font-matrix">Kaizen Ops AI Bot</p>
          </div>
          <button onClick={onToggleSidebar}
            className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-all text-slate-400 hover:text-slate-800 dark:hover:text-white focus:outline-none"
            title="Collapse Sidebar (Cmd+B)">
            <PanelLeft size={14} className="text-[#7c3aed]" />
          </button>
        </div>

        {/* Workspace Nav */}
        <div className="px-3 pt-4">
          <button className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-[11px] font-bold transition-all border-l-2 text-left bg-[#7c3aed]/10 dark:text-white text-slate-800 border-[#7c3aed]">
            <Layout size={14} />
            <span className="font-matrix tracking-wide">Workspace</span>
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 px-3 py-4 overflow-y-auto">
          <p className="text-[9px] uppercase font-matrix text-slate-500 tracking-wider mb-2 px-1">Chat History</p>

          {/* Search */}
          <div className="relative mb-3">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search chats..."
              className="w-full pl-7 pr-3 py-1.5 rounded-md text-[11px] font-matrix bg-black/5 dark:bg-white/5 dark:text-white text-slate-800 placeholder:text-slate-400 border dark:border-[#21232b]/80 border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
            />
          </div>

          {filteredChats.length === 0 ? (
            <button
              onClick={() => alert('No chat history yet. Start a new instance.')}
              className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-[11px] font-bold transition-all border-l-2 text-left dark:text-slate-500 text-slate-400 border-transparent hover:bg-black/5 dark:hover:bg-white/5"
            >
              <MessageSquare size={14} />
              <span className="font-matrix tracking-wide">No History</span>
            </button>
          ) : (
            <div className="space-y-0.5">
              {filteredChats.map((chat) => (
                <div
                  key={chat.id}
                  className="group relative w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-[11px] font-bold transition-all border-l-2 text-left dark:text-slate-400 text-slate-600 border-transparent hover:bg-[#7c3aed]/10 hover:border-[#7c3aed] hover:dark:text-white"
                >
                  {chat.pinned ? (
                    <Pin size={12} className="text-[#7c3aed] flex-shrink-0" />
                  ) : (
                    <MessageSquare size={14} className="flex-shrink-0" />
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
                        <Check size={12} />
                      </button>
                      <button onClick={() => setEditingId(null)} className="p-1 hover:text-rose-500">
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="relative flex-shrink-0">
                      <button
                        onClick={() => setMenuOpen(menuOpen === chat.id ? null : chat.id)}
                        className="p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:text-slate-800 dark:hover:text-white"
                      >
                        <MoreHorizontal size={12} />
                      </button>

                      {menuOpen === chat.id && (
                        <div className="absolute right-0 top-6 z-50 w-28 rounded-md shadow-lg border dark:border-[#21232b]/80 border-slate-200 dark:bg-[#0f121b] bg-white overflow-hidden">
                          <button
                            onClick={() => {
                              setEditingId(chat.id);
                              setEditingTitle(chat.label);
                              setMenuOpen(null);
                            }}
                            className="w-full flex items-center space-x-2 px-2.5 py-1.5 text-[10px] dark:text-slate-300 text-slate-600 hover:bg-black/5 dark:hover:bg-white/5"
                          >
                            <Pencil size={10} />
                            <span className="font-matrix">Rename</span>
                          </button>
                          <button
                            onClick={() => {
                              togglePin(chat.id);
                              setMenuOpen(null);
                            }}
                            className="w-full flex items-center space-x-2 px-2.5 py-1.5 text-[10px] dark:text-slate-300 text-slate-600 hover:bg-black/5 dark:hover:bg-white/5"
                          >
                            {chat.pinned ? <PinOff size={10} /> : <Pin size={10} />}
                            <span className="font-matrix">{chat.pinned ? 'Unpin' : 'Pin'}</span>
                          </button>
                          <button
                            onClick={() => {
                              deleteChat(chat.id);
                              setMenuOpen(null);
                            }}
                            className="w-full flex items-center space-x-2 px-2.5 py-1.5 text-[10px] text-rose-500 hover:bg-rose-500/10"
                          >
                            <Trash2 size={10} />
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
        <div className="p-3 border-t dark:border-[#21232b]/60 border-slate-200 space-y-3">
          <button onClick={handleNewInstance}
            className="w-full bg-[#7c3aed] hover:bg-[#7c3aed]/90 text-white rounded-lg py-1.5 px-3 text-[11px] font-bold flex items-center justify-center space-x-2 transition-all focus:outline-none shadow-sm shadow-[#7c3aed]/20 active:scale-[0.98]">
            <Plus size={12} />
            <span className="font-matrix">New Instance</span>
          </button>

          <div className="space-y-0.5 pt-2 border-t dark:border-[#21232b]/40 border-slate-200">
            <button onClick={onToggleSettings}
              className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-[11px] font-bold dark:text-slate-400 text-slate-600 dark:hover:text-white hover:text-slate-800 hover:bg-black/5 dark:hover:bg-white/5 transition-all text-left">
              <SettingsIcon size={12} />
              <span className="font-matrix">Settings</span>
            </button>
            <button onClick={handleLogout}
              className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-[11px] font-bold text-rose-500 hover:bg-rose-500/10 transition-all text-left">
              <LogOut size={12} />
              <span className="font-matrix">Logout</span>
            </button>
          </div>

          <div className="flex items-center justify-between pt-2 border-t dark:border-[#21232b]/40 border-slate-200 px-1">
            <span className="text-[9px] font-matrix dark:text-slate-500 text-slate-400 uppercase tracking-wider">Mode</span>
            <button onClick={() => setDarkMode(!darkMode)}
              className="p-1 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 dark:text-slate-400 text-slate-600 rounded-md transition-all border dark:border-[#21232b]/80 border-slate-200 shadow-sm focus:outline-none">
              {darkMode ? <Sun size={12} /> : <Moon size={12} />}
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
export default Sidebar;