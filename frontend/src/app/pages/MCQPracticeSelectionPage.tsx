/**
 * MCQ Practice Selection Page  
 * Two sections: 1) College-uploaded practice sets, 2) Generate from PDF
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useFilters } from '../../context/FilterContext';
import { mcqAPI, facultyAPI, MCQSet, Faculty } from '../../services/api';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Brain, Target, BookOpen, Trophy, Upload, FileText, Zap } from 'lucide-react';

export default function MCQPracticeSelectionPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const filters = useFilters();
  
  const [mcqSets, setMcqSets] = useState<MCQSet[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // PDF Generation State
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateOptions, setGenerateOptions] = useState({
    count: 10,
    difficulty: 'MEDIUM',
    topic: ''
  });

  useEffect(() => {
    fetchFaculties();
    fetchMCQSets();
  }, [filters.facultyId, filters.year, filters.moduleId]);

  const fetchFaculties = async () => {
    try {
      const response = await facultyAPI.getAll();
      setFaculties(response.data.data || []);
    } catch (err) {
      console.error('Error fetching faculties:', err);
    }
  };

  const fetchMCQSets = async () => {
    setLoading(true);
    setError('');
    
    try {
      const params: any = {};
      if (filters.facultyId !== 'all') params.facultyId = parseInt(filters.facultyId);
      if (filters.year !== 'all') params.year = parseInt(filters.year);
      if (filters.moduleId !== 'all') params.moduleId = parseInt(filters.moduleId);
      
      const response = await mcqAPI.getSets(params);
      setMcqSets(response.data.data || []);
    } catch (err: any) {
      console.error('Error fetching MCQ sets:', err);
      setError(err.response?.data?.error || 'Failed to fetch MCQ sets');
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuiz = (setId: number) => {
    navigate(`/student/practice?setId=${setId}`);
  };

  const handleStartAdaptive = () => {
    navigate(`/student/practice?adaptive=true`);
  };

  const handlePDFSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Please select a PDF file');
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error('File size must be less than 10MB');
        return;
      }
      setPdfFile(file);
      toast.success(`Selected: ${file.name}`);
    }
  };

  const handleGenerateFromPDF = async () => {
    if (!pdfFile) {
      toast.error('Please select a PDF file');
      return;
    }

    try {
      setIsGenerating(true);
      toast.info('Uploading PDF and generating MCQs... This may take several minutes for large PDFs.', { duration: 10000 });

      const formData = new FormData();
      formData.append('pdfFile', pdfFile);
      formData.append('count', generateOptions.count.toString());
      formData.append('difficulty', generateOptions.difficulty);
      if (generateOptions.topic) formData.append('topic', generateOptions.topic);
      if (filters.moduleId !== 'all') formData.append('moduleId', filters.moduleId);
      formData.append('saveToDatabase', 'false');
      formData.append('createSet', 'false');

      // Extended timeout for large PDFs (10 minutes)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 600000); // 10 minutes
      
      const response = await fetch('http://localhost:5000/api/mcqs/upload-and-generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('access_token')}`
        },
        body: formData,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const data = await response.json();
      
      if (response.ok && data.success && data.data.mcqs.length > 0) {
        toast.success(`Generated ${data.data.mcqs.length} questions!`);
        
        // Navigate to practice with generated MCQs (stored temporarily in session)
        sessionStorage.setItem('generated_mcqs', JSON.stringify(data.data.mcqs));
        navigate(`/student/practice?generated=true`);
      } else {
        toast.error(data.error || 'Failed to generate MCQs. Please try again.');
      }
    } catch (error: any) {
      console.error('Error generating MCQs:', error);
      toast.error('Failed to generate MCQs from PDF. Please ensure Ollama is running.');
    } finally {
      setIsGenerating(false);
    }
  };

  const getFilterDisplayNames = () => {
    const faculty = faculties.find(f => f.id.toString() === filters.facultyId);
    return {
      faculty: faculty ? faculty.name : 'All Faculties',
      year: filters.year !== 'all' ? `Year ${filters.year}` : 'All Years'
    };
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'bg-green-100 text-green-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'HARD': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
          <button className="w-full text-left px-4 py-3 text-gray-900 bg-gray-100 rounded-lg font-medium mb-1">
            MCQs Practice
          </button>
          <button 
            onClick={() => navigate('/student/summaries')}
            className="w-full text-left px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg mb-1"
          >
            Summaries
          </button>
          <button className="w-full text-left px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg mb-1">
            Useful Learning Sites
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
        
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#A8C5B5] flex items-center justify-center text-white font-medium">
              {user?.first_name?.[0] || user?.username?.[0] || 'S'}
            </div>
            <div>
              <div className="font-medium text-gray-900">
                {user?.first_name} {user?.last_name}
              </div>
              <div className="text-xs text-gray-500">Student</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">MCQ Practice</h1>
            <p className="text-gray-600">Practice from college sets or generate from your PDFs</p>
          </div>

          {/* Current Selection Display */}
          <Card className="mb-6 bg-gradient-to-r from-[#A8C5B5]/10 to-[#D5E3DF]/10 border-[#A8C5B5]/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <BookOpen className="h-5 w-5 text-[#6B9080]" />
                  <span className="text-sm font-medium text-gray-700">Viewing MCQs for:</span>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="secondary" className="bg-[#A8C5B5] text-white hover:bg-[#96B5A5] px-3 py-1">
                      {getFilterDisplayNames().faculty}
                    </Badge>
                    <Badge variant="secondary" className="bg-[#A8C5B5] text-white hover:bg-[#96B5A5] px-3 py-1">
                      {getFilterDisplayNames().year}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/student-dashboard')}
                  className="border-[#A8C5B5] text-[#6B9080] hover:bg-[#A8C5B5]/10"
                >
                  Change Selection
                </Button>
              </div>
              {(filters.facultyId !== 'all' || filters.year !== 'all' || filters.moduleId !== 'all') && (
                <p className="text-xs text-gray-500 mt-3">
                  💡 Change your selection from the Dashboard to view different MCQs
                </p>
              )}
            </CardContent>
          </Card>

          
          {/* Adaptive Practice Card */}
          <Card 
            className="mb-6 cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-l-[#8B5CF6] bg-gradient-to-r from-purple-50 to-white"
            onClick={handleStartAdaptive}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Target className="h-8 w-8 text-[#8B5CF6]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-xl mb-1">Adaptive Practice</h3>
                    <p className="text-gray-600">
                      AI-powered practice focusing on your weak areas based on performance history
                    </p>
                  </div>
                </div>
                <Button size="lg" className="bg-[#8B5CF6] hover:bg-[#7C3AED]">
                  Start Practice
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Section 1: College-Uploaded Practice Sets */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <BookOpen className="h-5 w-5 text-[#6B9080]" />
                <h3 className="text-lg font-semibold text-gray-900">Practice Sets</h3>
                <Badge variant="outline" className="bg-[#A8C5B5]/10 text-[#6B9080] border-[#A8C5B5]">{mcqSets.length} available</Badge>
              </div>
              
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {loading ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-gray-600 text-sm">Loading practice sets...</p>
                    </CardContent>
                  </Card>
                ) : mcqSets.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Brain className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-600 text-sm">
                        {filters.moduleId !== 'all' || filters.facultyId !== 'all' || filters.year !== 'all'
                          ? 'No sets for selected filters. Try changing filters in dashboard.'
                          : 'No practice sets uploaded by your college yet.'}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  mcqSets.map((set) => (
                    <Card key={set.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">{set.title}</CardTitle>
                        {set.description && (
                          <p className="text-sm text-gray-600 mt-1">{set.description}</p>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span>{set.questionCount || 0} questions</span>
                            {(set as any).difficulty && (
                              <Badge className={getDifficultyColor((set as any).difficulty)}>
                                {(set as any).difficulty}
                              </Badge>
                            )}
                          </div>
                        </div>
                        {set.module && (
                          <p className="text-xs text-gray-500 mb-3">{set.module.name}</p>
                        )}
                        <Button 
                          onClick={() => handleStartQuiz(set.id)}
                          className="w-full"
                          size="sm"
                          disabled={!set.questionCount || set.questionCount === 0}
                        >
                          Start Practice
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>

            {/* Section 2: Generate from PDF */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Zap className="h-5 w-5 text-[#6B9080]" />
                <h3 className="text-lg font-semibold text-gray-900">Generate from PDF</h3>
                <Badge variant="outline" className="bg-[#A8C5B5]/10 text-[#6B9080] border-[#A8C5B5]">AI-Powered</Badge>
              </div>

              <Card className="border-2 border-dashed border-[#A8C5B5]/50 bg-[#A8C5B5]/5">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Upload PDF Document
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#A8C5B5] transition-colors">
                        <input
                          type="file"
                          accept="application/pdf"
                          onChange={handlePDFSelect}
                          className="hidden"
                          id="pdf-upload"
                          disabled={isGenerating}
                        />
                        <label htmlFor="pdf-upload" className="cursor-pointer">
                          <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                          {pdfFile ? (
                            <div>
                              <p className="text-sm font-medium text-green-600">{pdfFile.name}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          ) : (
                            <div>
                              <p className="text-sm font-medium text-gray-700">
                                Click to upload PDF
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Max 10MB • PDF only
                              </p>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Number of Questions
                        </label>
                        <input
                          type="number"
                          min="5"
                          max="50"
                          value={generateOptions.count}
                          onChange={(e) => setGenerateOptions({ ...generateOptions, count: parseInt(e.target.value) || 10 })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                          disabled={isGenerating}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Difficulty Level
                        </label>
                        <select
                          value={generateOptions.difficulty}
                          onChange={(e) => setGenerateOptions({ ...generateOptions, difficulty: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                          disabled={isGenerating}
                        >
                          <option value="EASY">Easy</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HARD">Hard</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Topic (Optional)
                      </label>
                      <input
                        type="text"
                        value={generateOptions.topic}
                        onChange={(e) => setGenerateOptions({ ...generateOptions, topic: e.target.value })}
                        placeholder="e.g., Algorithms, Data Structures"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        disabled={isGenerating}
                      />
                    </div>

                    <Button
                      onClick={handleGenerateFromPDF}
                      className="w-full bg-[#A8C5B5] hover:bg-[#96B5A5]"
                      size="lg"
                      disabled={!pdfFile || isGenerating}
                    >
                      {isGenerating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Generating MCQs...
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4 mr-2" />
                          Generate MCQs
                        </>
                      )}
                    </Button>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-xs text-blue-800">
                        💡 <strong>Tip:</strong> Upload study materials, notes, or textbook chapters. 
                        Our AI will analyze the content and create relevant multiple-choice questions.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Alert className="mt-4 border-yellow-200 bg-yellow-50">
                <AlertDescription className="text-xs text-yellow-800">
                  ⚡ Make sure Ollama is running on your system for AI generation to work.
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
