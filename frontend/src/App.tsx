import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Chat } from './pages/Chat';
import { KnowledgeBase } from './pages/KnowledgeBase';
import { Analytics } from './pages/Analytics';

export const App: React.FC = () => {
  return (
    <Router>
      <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground transition-colors duration-200">
        {/* Persistent Side Navigation */}
        <Sidebar />

        {/* Dashboard Views */}
        <main className="flex-1 flex flex-col h-full overflow-hidden">
          <Routes>
            <Route path="/" element={<Chat />} />
            <Route path="/knowledge" element={<KnowledgeBase />} />
            <Route path="/analytics" element={<Analytics />} />
            {/* Fallback routing redirects to Chat */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};
export default App;
