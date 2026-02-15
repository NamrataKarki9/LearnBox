/**
 * Summaries Page
 * Upload PDFs and get AI-powered summaries using local LLM
 */

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { useNavigate } from 'react-router-dom';
import { summaryAPI } from '../../services/api';
import { toast } from 'sonner';
import { Upload, FileText, Loader2, Download, Trash2, Clock } from 'lucide-react';

interface Summary {
  id: number;
  originalFileName: string;
  fileUrl: string;
  quickSummary: string;
  keyConcepts?: {
    concepts: Array<{
      term: string;
      definition: string;
    }>;
  };
  createdAt: string;
  processingTime: number;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  fileName?: string;
  isUploading?: boolean;
}

export default function Summaries() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // States
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Hi! Upload a PDF document and I\'ll provide you with a comprehensive summary, key concepts, and structured notes. What would you like to learn about today?'
    }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [summaryHistory, setSummaryHistory] = useState<Summary[]>([]);
  const [selectedSummary, setSelectedSummary] = useState<Summary | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Fetch summary history on mount
  useEffect(() => {
    fetchSummaryHistory();
  }, []);

  // Auto-scroll to bottom when new messages appear
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchSummaryHistory = async () => {
    try {
      const response = await summaryAPI.getHistory();
      setSummaryHistory(response.data.data);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    // Add user message
    setMessages(prev => [...prev, {
      role: 'user',
      content: `Uploaded: ${file.name}`,
      fileName: file.name
    }]);

    // Add loading message
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: 'Processing your document... This may take a moment.',
      isUploading: true
    }]);

    setIsProcessing(true);

    try {
      const response = await summaryAPI.upload(file);
      const summary = response.data.data;

      // Remove loading message
      setMessages(prev => prev.filter(msg => !msg.isUploading));

      // Add summary response
      const summaryMessage = formatSummaryMessage(summary);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: summaryMessage
      }]);

      toast.success('Document processed successfully!');
      fetchSummaryHistory(); // Refresh history

    } catch (error: any) {
      console.error('Upload error:', error);
      
      // Remove loading message
      setMessages(prev => prev.filter(msg => !msg.isUploading));
      
      // Add error message
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Sorry, I couldn't process your document. ${error.response?.data?.message || 'Please try again.'}`
      }]);

      toast.error('Failed to process document');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const formatSummaryMessage = (summary: any) => {
    let message = `📄 Summary of "${summary.fileName}"\n\n`;
    
    message += `Quick Summary:\n${summary.quickSummary}\n\n`;
    
    if (summary.keyConcepts && summary.keyConcepts.concepts && summary.keyConcepts.concepts.length > 0) {
      message += `Key Concepts:\n`;
      summary.keyConcepts.concepts.forEach((concept: any, idx: number) => {
        message += `${idx + 1}. ${concept.term}: ${concept.definition}\n`;
      });
      message += '\n';
    }
    
    message += `⏱️ Processed in ${(summary.processingTime / 1000).toFixed(2)} seconds`;
    
    return message;
  };

  const loadSummaryFromHistory = async (summary: Summary) => {
    setSelectedSummary(summary);
    
    // Add to chat
    setMessages(prev => [...prev, {
      role: 'user',
      content: `Show me the summary for: ${summary.originalFileName}`
    }]);

    const summaryMessage = formatSummaryMessage({
      fileName: summary.originalFileName,
      quickSummary: summary.quickSummary,
      keyConcepts: summary.keyConcepts,
      processingTime: summary.processingTime
    });

    setMessages(prev => [...prev, {
      role: 'assistant',
      content: summaryMessage
    }]);

    setShowHistory(false);
  };

  const deleteSummary = async (id: number) => {
    try {
      await summaryAPI.deleteSummary(id);
      toast.success('Summary deleted');
      fetchSummaryHistory();
    } catch (error) {
      toast.error('Failed to delete summary');
    }
  };

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: 'Hi! Upload a PDF document and I\'ll provide you with a comprehensive summary, key concepts, and structured notes. What would you like to learn about today?'
    }]);
    setSelectedSummary(null);
  };

  return (
    <div className="flex min-h-screen bg-[#F5F5F5]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-bold text-gray-900">LearnBox</h1>
        </div>
        <nav className="flex-1 px-4">
          <button 
            onClick={() => navigate('/student/dashboard')}
            className="w-full text-left px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg mb-1"
          >
            Dashboard
          </button>
          <button 
            onClick={() => navigate('/student/resources')}
            className="w-full text-left px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg mb-1"
          >
            Resources
          </button>
          <button className="w-full text-left px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg mb-1">
            MCQs Practice
          </button>
          <button className="w-full text-left px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg mb-1">
            Useful Learning Sites
          </button>
          <button className="w-full text-left px-4 py-3 text-gray-900 bg-gray-100 rounded-lg font-medium mb-1">
            Summaries
          </button>
          <button className="w-full text-left px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg mb-1">
            Settings
          </button>
          <button 
            onClick={logout}
            className="w-full text-left px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg"
          >
            Logout
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center flex-shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Document Summaries</h1>
            <p className="text-sm text-gray-600">Upload PDFs and get AI-powered summaries instantly</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setShowHistory(!showHistory)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Clock className="h-4 w-4" />
              History ({summaryHistory.length})
            </Button>
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-8 space-y-4">
              {messages.map((message, idx) => (
                <div
                  key={idx}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-[#A8C5B5] text-white'
                        : 'bg-white border border-gray-200 text-gray-900'
                    }`}
                  >
                    {message.isUploading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>{message.content}</span>
                      </div>
                    ) : (
                      <div className="whitespace-pre-line text-sm">
                        {message.content}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-200 bg-white p-6 flex-shrink-0">
              <div className="flex gap-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".pdf"
                  className="hidden"
                  disabled={isProcessing}
                />
                <Button
                  onClick={handleFileSelect}
                  disabled={isProcessing}
                  className="bg-[#A8C5B5] hover:bg-[#96B5A5] text-white flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Upload PDF
                </Button>
                <Button
                  onClick={clearChat}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  New Chat
                </Button>
                <div className="flex-1" />
                <span className="text-xs text-gray-500 self-center">
                  Powered by Gemma 3:1B (Local)
                </span>
              </div>
            </div>
          </div>

          {/* History Sidebar */}
          {showHistory && (
            <div className="w-80 border-l border-gray-200 bg-white overflow-y-auto">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">Summary History</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {summaryHistory.length} document{summaryHistory.length !== 1 ? 's' : ''} processed
                </p>
              </div>
              <div className="p-4 space-y-3">
                {summaryHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No summaries yet</p>
                  </div>
                ) : (
                  summaryHistory.map((summary) => (
                    <Card
                      key={summary.id}
                      className="border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => loadSummaryFromHistory(summary)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-start gap-2 flex-1 min-w-0">
                            <FileText className="h-4 w-4 text-[#A8C5B5] flex-shrink-0 mt-0.5" />
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {summary.originalFileName}
                            </h4>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSummary(summary.id);
                            }}
                            className="text-gray-400 hover:text-red-500 flex-shrink-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                          {summary.quickSummary}
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span>{new Date(summary.createdAt).toLocaleDateString()}</span>
                          {summary.keyConcepts?.concepts && (
                            <span>{summary.keyConcepts.concepts.length} concepts</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
