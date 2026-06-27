import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { MessageSquare, Database, BarChart3, Moon, Sun, Anchor, RefreshCw } from 'lucide-react';
import { apiService } from '../services/api';

export const Sidebar: React.FC = () => {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  const [dbStatus, setDbStatus] = useState<{ initialized: boolean; count: number }>({
    initialized: false,
    count: 0
  });

  useEffect(() => {
    // Apply theme
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Load database vector counts on menu render
  const fetchDBHealth = async () => {
    try {
      const res = await apiService.getKnowledgeStatus();
      setDbStatus({
        initialized: res.is_initialized,
        count: res.total_vectors
      });
    } catch {
      // Keep defaults if offline
    }
  };

  useEffect(() => {
    fetchDBHealth();
    // Refresh health status every 20 seconds
    const interval = setInterval(fetchDBHealth, 20000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { to: '/', label: 'Assistant Chat', icon: <MessageSquare size={18} /> },
    { to: '/knowledge', label: 'Knowledge Base', icon: <Database size={18} /> },
    { to: '/analytics', label: 'Analytics Panel', icon: <BarChart3 size={18} /> }
  ];

  return (
    <aside className="w-64 bg-primary text-primary-foreground border-r border-primary/10 flex flex-col justify-between h-screen flex-shrink-0 select-none shadow-md">
      {/* Brand Header */}
      <div className="p-6 border-b border-primary-foreground/10">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary-foreground/10 text-primary-foreground rounded-xl">
            <Anchor size={22} className="animate-spin-slow" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-wide font-outfit">OpsAI</h1>
            <p className="text-[9px] text-primary-foreground/65 font-medium leading-snug">AI Operations Copilot for Trade Intelligence</p>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-4 py-6 space-y-1.5">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `
              flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200
              ${isActive 
                ? 'bg-primary-foreground text-primary shadow-sm scale-[1.02]' 
                : 'text-primary-foreground/75 hover:bg-primary-foreground/10 hover:text-primary-foreground'
              }
            `}
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom Panel controls */}
      <div className="p-4 border-t border-primary-foreground/10 space-y-4">
        {/* Database Quick Health */}
        <div className="bg-primary-foreground/5 rounded-xl p-3 border border-primary-foreground/5 flex items-center justify-between text-xs text-primary-foreground/70">
          <div className="flex flex-col">
            <span className="font-bold text-[9px] uppercase tracking-wider text-primary-foreground/55">RAG Database</span>
            <span className="font-medium mt-0.5">{dbStatus.initialized ? `${dbStatus.count} Vectors` : 'Disconnected'}</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className={`w-2 h-2 rounded-full ${dbStatus.initialized ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
            <button onClick={fetchDBHealth} className="hover:text-primary-foreground transition-colors p-0.5">
              <RefreshCw size={10} />
            </button>
          </div>
        </div>

        {/* Theme Settings Toggle */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs font-semibold text-primary-foreground/75">Color Theme</span>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2.5 bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground rounded-xl transition-all shadow-sm focus:outline-none"
            title="Toggle theme color"
          >
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </div>
    </aside>
  );
};
export default Sidebar;
