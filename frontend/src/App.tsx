import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Chat } from './pages/Chat';
import { apiService } from './services/api';

export const App: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [backendStatus, setBackendStatus] = useState<'connected' | 'disconnected'>('connected');
  const [newInstanceTrigger, setNewInstanceTrigger] = useState<number>(0);

  // Monitor global key presses to support Cmd+B / Ctrl+B toggle shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isBKey = e.key === 'b' || e.key === 'B';
      const isModifier = e.ctrlKey || e.metaKey;
      
      if (isModifier && isBKey) {
        e.preventDefault();
        setSidebarOpen(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Check backend health periodically
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const status = await apiService.getKnowledgeStatus();
        if (status) {
          setBackendStatus('connected');
        } else {
          setBackendStatus('disconnected');
        }
      } catch {
        setBackendStatus('disconnected');
      }
    };
    checkBackend();
    const interval = setInterval(checkBackend, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground transition-colors duration-200">
      {/* Persistent side navigation (Collapsible toggle) */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onToggleSidebar={() => setSidebarOpen(prev => !prev)}
        onToggleSettings={() => setSettingsOpen(prev => !prev)} 
        onNewInstance={() => setNewInstanceTrigger(prev => prev + 1)}
      />

      {/* Main Workspace Workspace views */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <Chat 
          sidebarOpen={sidebarOpen} 
          onToggleSidebar={() => setSidebarOpen(prev => !prev)} 
          settingsOpen={settingsOpen}
          setSettingsOpen={setSettingsOpen}
          backendStatus={backendStatus}
          newInstanceTrigger={newInstanceTrigger}
        />
      </main>
    </div>
  );
};

export default App;
