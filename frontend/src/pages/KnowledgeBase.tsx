import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../services/api';
import { KnowledgeStatusResponse, SourceFileInfo } from '../types/chatbot';
import { Upload, FileCode, CheckCircle, AlertCircle, RefreshCw, FileText, ChevronRight } from 'lucide-react';

export const KnowledgeBase: React.FC = () => {
  const [status, setStatus] = useState<KnowledgeStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchStatus = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiService.getKnowledgeStatus();
      setStatus(res);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to the knowledge API. Ensure the backend is online.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setUploadResult(null);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadResult(null);

    try {
      const res = await apiService.uploadDocument(selectedFile, (progressEvent) => {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percent);
      });
      
      setUploadResult({
        type: 'success',
        message: res.message
      });
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      // Reload database stats after ingestion
      fetchStatus();
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || err.message || 'Upload operation failed.';
      setUploadResult({
        type: 'error',
        message: errMsg
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border/40 px-6 py-4 flex items-center justify-between shadow-sm select-none">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary/5 text-primary border border-primary/10 flex items-center justify-center">
            <FileCode size={18} />
          </div>
          <div>
            <h2 className="font-bold text-sm text-foreground">Knowledge Base Registry</h2>
            <p className="text-[10px] text-muted-foreground font-medium">Manage RAG Corpora & Document Indexing</p>
          </div>
        </div>
        <button 
          onClick={fetchStatus} 
          disabled={isLoading}
          className="p-2 bg-card hover:bg-accent border border-border/80 hover:border-border text-muted-foreground hover:text-foreground rounded-xl transition-all shadow-sm focus:outline-none"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </header>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* Status Telemetry Cards */}
        {error && (
          <div className="p-4 bg-destructive/5 text-destructive border border-destructive/10 rounded-xl flex items-center space-x-3 text-xs font-semibold shadow-sm animate-shake">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 select-none">
          <div className="bg-card border border-border/40 p-4 rounded-xl shadow-sm flex flex-col space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">RAG System State</span>
            <span className={`font-bold text-sm flex items-center ${status?.is_initialized ? 'text-emerald-500' : 'text-red-500'}`}>
              <span className={`w-2 h-2 rounded-full mr-2 ${status?.is_initialized ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              {status?.is_initialized ? 'ACTIVE' : 'INACTIVE'}
            </span>
          </div>
          <div className="bg-card border border-border/40 p-4 rounded-xl shadow-sm flex flex-col space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Indexed Documents</span>
            <span className="font-bold text-lg text-foreground">{isLoading ? '...' : status?.total_terms ?? 0}</span>
          </div>
          <div className="bg-card border border-border/40 p-4 rounded-xl shadow-sm flex flex-col space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">ChromaDB Vectors</span>
            <span className="font-bold text-lg text-foreground">{isLoading ? '...' : status?.total_vectors ?? 0}</span>
          </div>
          <div className="bg-card border border-border/40 p-4 rounded-xl shadow-sm flex flex-col space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Last Synced Time</span>
            <span className="font-semibold text-xs text-foreground/80 mt-1">
              {isLoading ? '...' : status?.last_sync_time ? new Date(status.last_sync_time).toLocaleString() : 'Never'}
            </span>
          </div>
        </div>

        {/* Action Ingestion Portal & Document Registry list layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Upload Portal */}
          <div className="bg-card border border-border/40 p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-foreground border-b border-border/40 pb-2.5 font-outfit">Ingest New Dataset</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Upload compliance references, cargo terms sheets, or operational manifests. Files will be converted, embedded, and appended to the ChromaDB index.
            </p>
            
            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border hover:border-primary/40 bg-accent/10 hover:bg-accent/20 transition-all rounded-xl p-6 text-center cursor-pointer flex flex-col items-center justify-center space-y-2.5 group"
              >
                <div className="p-3 bg-card border border-border/60 group-hover:border-primary/20 text-muted-foreground group-hover:text-primary rounded-xl shadow-sm transition-all">
                  <Upload size={20} />
                </div>
                <div>
                  <span className="text-xs font-semibold text-foreground/90 block">
                    {selectedFile ? selectedFile.name : 'Select file to upload'}
                  </span>
                  <span className="text-[10px] text-muted-foreground mt-0.5 block">
                    Supported: PDF, CSV, TXT (Max: 10MB)
                  </span>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.csv,.txt"
                  className="hidden"
                  disabled={isUploading}
                />
              </div>

              {isUploading && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                    <span>Uploading & Chunking...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-accent/40 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-primary h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}

              {uploadResult && (
                <div className={`p-3.5 border rounded-xl flex items-start space-x-2 text-xs font-semibold ${
                  uploadResult.type === 'success' 
                    ? 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                    : 'bg-destructive/5 text-destructive border-destructive/10'
                }`}>
                  {uploadResult.type === 'success' ? <CheckCircle size={15} className="mt-0.5" /> : <AlertCircle size={15} className="mt-0.5" />}
                  <span className="leading-relaxed">{uploadResult.message}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={!selectedFile || isUploading}
                className="w-full py-2.5 bg-primary hover:bg-primary/95 disabled:bg-primary/50 text-primary-foreground disabled:text-primary-foreground/70 font-semibold text-xs rounded-xl shadow-md disabled:shadow-none transition-all flex items-center justify-center space-x-2"
              >
                <span>Upload Document</span>
              </button>
            </form>
          </div>

          {/* Files List Registry */}
          <div className="bg-card border border-border/40 p-6 rounded-2xl shadow-sm space-y-4 lg:col-span-2 flex flex-col">
            <h3 className="font-bold text-sm text-foreground border-b border-border/40 pb-2.5 font-outfit">Dataset Sources Registry</h3>
            
            {isLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 text-xs text-muted-foreground space-y-2">
                <RefreshCw className="animate-spin text-primary" size={20} />
                <span>Loading source files...</span>
              </div>
            ) : !status?.source_files || status.source_files.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-xs text-muted-foreground space-y-2 select-none">
                <FileText size={24} className="text-muted-foreground/55" />
                <span>No dataset source files found. Upload files to display them here.</span>
              </div>
            ) : (
              <div className="divide-y divide-border/40 overflow-y-auto flex-1 max-h-[360px]">
                {status.source_files.map((file: SourceFileInfo, idx: number) => (
                  <div key={idx} className="py-3 flex items-center justify-between hover:bg-accent/5 px-2 rounded-xl transition-all">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-primary/5 border border-primary/10 text-primary rounded-lg">
                        <FileText size={15} />
                      </div>
                      <div>
                        <span className="font-semibold text-xs text-foreground block">{file.filename}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {file.file_type.toUpperCase()} • Indexed: {file.records_count} segments
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-[10px] text-muted-foreground font-semibold">
                        Uploaded: {new Date(file.last_modified).toLocaleDateString()}
                      </span>
                      <ChevronRight size={14} className="text-muted-foreground/60" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
export default KnowledgeBase;
