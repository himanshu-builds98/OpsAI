import React, { useState, useEffect } from 'react';
import { Layout, Database, BarChart3, Settings as SettingsIcon, HelpCircle, Sun, Moon, Plus, PanelLeft } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onToggleSidebar: () => void;
  onToggleSettings: () => void;
  onNewInstance: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggleSidebar, onToggleSettings, onNewInstance }) => {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const navItems = [
    { label: 'Workspace', active: true, icon: <Layout size={16} /> },
    { label: 'Knowledge Base', active: false, icon: <Database size={16} /> },
    { label: 'Logs', active: false, icon: <BarChart3 size={16} /> }
  ];

  return (
    <aside 
      className={`dark:bg-[#090c14] bg-slate-50 dark:text-[#fafafa] text-slate-800 flex flex-col justify-between h-screen flex-shrink-0 select-none shadow-2xl z-40 transition-all duration-300 ease-in-out border-r dark:border-[#21232b]/80 border-slate-200 ${
        isOpen ? 'w-64 opacity-100' : 'w-0 opacity-0 pointer-events-none'
      }`}
    >
      <div className="flex flex-col h-full overflow-hidden w-64">
        {/* Brand Header with Version & Toggle */}
        <div className="p-6 border-b dark:border-[#21232b]/60 border-slate-200 flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="font-bold text-lg leading-none dark:text-white text-slate-800 font-matrix">OpsAI</h1>
            <p className="text-[9px] dark:text-[#FFB200] text-amber-600 leading-none mt-2 font-matrix">v2.4.0-stable</p>
          </div>
          <div className="flex items-center space-x-2">
            {/* Sidebar toggle button embedded in sidebar when open */}
            <button
              onClick={onToggleSidebar}
              className="p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-all text-slate-400 hover:text-slate-800 dark:hover:text-white focus:outline-none border border-transparent"
              title="Collapse Sidebar (Cmd+B)"
            >
              <PanelLeft size={16} className="text-[#7c3aed]" />
            </button>
          </div>
        </div>

        {/* Sidebar Nav items */}
        <nav className="flex-1 px-4 py-6 space-y-1.5">
          {navItems.map((item, idx) => (
            <button
              key={idx}
              disabled={!item.active}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-150 border-l-2 text-left relative ${
                item.active 
                  ? 'bg-[#7c3aed]/10 dark:text-white text-slate-800 border-[#7c3aed]' 
                  : 'dark:text-slate-500 text-slate-400 border-transparent cursor-not-allowed opacity-50'
              }`}
            >
              {item.icon}
              <span className="truncate font-matrix tracking-wide">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* New Instance purple button and settings/support in footer */}
        <div className="p-4 border-t dark:border-[#21232b]/60 border-slate-200 space-y-4">
          <button 
            onClick={onNewInstance}
            className="w-full bg-[#7c3aed] hover:bg-[#7c3aed]/90 text-white rounded-xl py-3 px-4 text-xs font-bold flex items-center justify-center space-x-2 transition-all focus:outline-none shadow-lg shadow-[#7c3aed]/20 active:scale-[0.98]"
          >
            <Plus size={14} />
            <span className="font-matrix">New Instance</span>
          </button>

          <div className="space-y-1 pt-2 border-t dark:border-[#21232b]/40 border-slate-200">
            <button 
              onClick={onToggleSettings}
              className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-bold dark:text-slate-400 text-slate-600 dark:hover:text-white hover:text-slate-800 hover:bg-black/5 dark:hover:bg-white/5 transition-all text-left"
            >
              <SettingsIcon size={14} />
              <span className="font-matrix">Settings</span>
            </button>
            <button className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-bold dark:text-slate-400 text-slate-600 dark:hover:text-white hover:text-slate-800 hover:bg-black/5 dark:hover:bg-white/5 transition-all text-left">
              <HelpCircle size={14} />
              <span className="font-matrix">Support</span>
            </button>
          </div>

          <div className="flex items-center justify-between pt-2 border-t dark:border-[#21232b]/40 border-slate-200">
            <span className="text-[9px] font-matrix dark:text-slate-500 text-slate-400 uppercase tracking-wider">Mode</span>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-1.5 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 dark:text-slate-400 text-slate-600 rounded-lg transition-all border dark:border-[#21232b]/80 border-slate-200 shadow-sm focus:outline-none"
              title="Toggle Color Theme"
            >
              {darkMode ? <Sun size={12} /> : <Moon size={12} />}
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
export default Sidebar;
