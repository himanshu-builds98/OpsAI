import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Chat } from './pages/Chat';
import { AuthScreen } from './components/AuthScreen';
import { apiService } from './services/api';

export const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'connected' | 'disconnected'>('connected');
  const [newInstanceTrigger, setNewInstanceTrigger] = useState(0);
  const [chatHistory, setChatHistory] = useState<{ id: string; label: string }[]>([]);

  useEffect(() => {
    apiService.getMe()
      .then(() => setIsAuthenticated(true))
      .catch(() => setIsAuthenticated(false))
      .finally(() => setAuthLoading(false));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        setSidebarOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const checkBackend = async () => {
      try {
        await apiService.getKnowledgeStatus();
        setBackendStatus('connected');
      } catch {
        setBackendStatus('disconnected');
      }
    };
    checkBackend();
    const interval = setInterval(checkBackend, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleNewInstance = () => {
    setChatHistory(prev => [
      { id: Date.now().toString(), label: `Chat ${prev.length + 1}` },
      ...prev
    ]);
    setNewInstanceTrigger(prev => prev + 1);
  };

  if (authLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#0d111c] text-[#39d353] font-mono text-xs">
        INITIALIZING OPS BOT...
        Kaizen Ops AI...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen onSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      <Sidebar
        isOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(prev => !prev)}
        onToggleSettings={() => setSettingsOpen(prev => !prev)}
        onNewInstance={handleNewInstance}
        chatHistory={chatHistory}
      />
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