/**
 * Admin MCQ Sets Management Page
 * Upload and manage MCQ sets for student practice
 */

import { useState, useEffect } from 'react';
import { mcqAPI, facultyAPI, moduleAPI, MCQSet, Faculty } from '../../services/api';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { Eye, Trash2, Upload, Plus, ChevronLeft, ChevronRight, Search, BookOpen } from 'lucide-react';

interface Module {
  id: number;
  name: string;
  code: string;
  year: number;
  facultyId: number;
}

interface MCQData {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  topic?: string;
}

export default function AdminMCQSetsPage() {
  const [mcqSets, setMcqSets] = useState<MCQSet[]>([]);
  const [filteredSets, setFilteredSets] = useState<MCQSet[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Upload dialog state
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadMode, setUploadMode] = useState<'manual' | 'document'>('document');
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [parsingDocument, setParsingDocument] = useState(false);
  const [mcqsData, setMcqsData] = useState<MCQData[]>([]);
  
  // Form state
  const [setForm, setSetForm] = useState({
    title: '',
    description: '',
    facultyId: '',
    year: '',
    moduleId: ''
  });
  
  // Manual MCQ form
  const [manualMcq, setManualMcq] = useState<MCQData>({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    explanation: '',
    difficulty: 'MEDIUM',
    topic: ''
  });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFaculty, setFilterFaculty] = useState<string>('all');
  const [filterModule, setFilterModule] = useState<string>('all');
  
  // Viewer state
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewingSet, setViewingSet] = useState<MCQSet | null>(null);
  const [viewingQuestions, setViewingQuestions] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [mcqSets, searchQuery, filterFaculty, filterModule]);

  // Fetch modules when faculty and year are selected
  useEffect(() => {
    if (setForm.facultyId && setForm.year) {
      fetchModulesForForm(parseInt(setForm.facultyId), parseInt(setForm.year));
    } else {
      setModules([]);
    }
  }, [setForm.facultyId, setForm.year]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [setsRes, facultiesRes] = await Promise.all([
        mcqAPI.getSets({}),
        facultyAPI.getAll()
      ]);
      
      setMcqSets(setsRes.data.data || []);
      setFaculties(facultiesRes.data.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load MCQ sets');
    } finally {
      setLoading(false);
    }
  };

  const fetchModulesForForm = async (facultyId: number, year: number) => {
    try {
      const response = await moduleAPI.getByFacultyAndYear(facultyId, year);
      setModules(response.data.data || []);
    } catch (error) {
      console.error('Error fetching modules:', error);
      setModules([]);
    }
  };

  const applyFilters = () => {
    let filtered = [...mcqSets];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        s.title.toLowerCase().includes(query) ||
        s.description?.toLowerCase().includes(query)
      );
    }
    
    // Faculty filter
    if (filterFaculty !== 'all') {
      const facultyModules = modules.filter(m => m.facultyId === parseInt(filterFaculty));
      const moduleIds = facultyModules.map(m => m.id);
      filtered = filtered.filter(s => s.moduleId && moduleIds.includes(s.moduleId));
    }
    
    // Module filter
    if (filterModule !== 'all') {
      filtered = filtered.filter(s => s.moduleId === parseInt(filterModule));
    }
    
    setFilteredSets(filtered);
    setCurrentPage(1);
  };

  const handleDocumentFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];

    if (!validTypes.includes(file.type)) {
      toast.error('Please select a PDF or Word document');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setDocumentFile(file);
    setParsingDocument(true);
    toast.info('Parsing MCQs from document... This may take a moment');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await mcqAPI.parseFromDocument(formData);
      
      if (response.data.success && response.data.data.length > 0) {
        // Validate and normalize difficulty values
        const normalizedMCQs = response.data.data.map(mcq => ({
          ...mcq,
          difficulty: (['EASY', 'MEDIUM', 'HARD'].includes(mcq.difficulty as string) 
            ? mcq.difficulty as 'EASY' | 'MEDIUM' | 'HARD' 
            : 'MEDIUM') as 'EASY' | 'MEDIUM' | 'HARD'
        }));
        
        setMcqsData(normalizedMCQs);
        toast.success(`Successfully extracted ${normalizedMCQs.length} questions from document!`);
      } else {
        toast.warning('No MCQs found in the document. Please ensure questions are clearly formatted.');
      }
    } catch (error: any) {
      console.error('Error parsing document:', error);
      toast.error(error.response?.data?.error || 'Failed to parse MCQs from document');
      setDocumentFile(null);
    } finally {
      setParsingDocument(false);
    }
  };

  const addManualMcq = () => {
    if (!manualMcq.question || !manualMcq.correctAnswer || manualMcq.options.some(opt => !opt)) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setMcqsData([...mcqsData, { ...manualMcq }]);
    toast.success('MCQ added to set');
    
    // Reset form
    setManualMcq({
      question: '',
      options: ['', '', '', ''],
      correctAnswer: '',
      explanation: '',
      difficulty: 'MEDIUM',
      topic: ''
    });
  };

  const removeMcq = (index: number) => {
    setMcqsData(mcqsData.filter((_, i) => i !== index));
  };

  const handleUploadSet = async () => {
    if (!setForm.title || !setForm.moduleId) {
      toast.error('Please provide set title and select a module');
      return;
    }
    
    if (mcqsData.length === 0) {
      toast.error('Please add at least one MCQ');
      return;
    }
    
    try {
      const response = await mcqAPI.bulkUpload({
        mcqs: mcqsData,
        moduleId: parseInt(setForm.moduleId),
        createSet: true,
        setTitle: setForm.title,
        setDescription: setForm.description
      });
      
      if (response.data.success) {
        toast.success(`MCQ set created with ${mcqsData.length} questions!`);
        setUploadDialogOpen(false);
        resetUploadForm();
        fetchData();
      }
    } catch (error: any) {
      console.error('Error uploading MCQ set:', error);
      toast.error(error.response?.data?.error || 'Failed to upload MCQ set');
    }
  };

  const resetUploadForm = () => {
    setSetForm({ title: '', description: '', facultyId: '', year: '', moduleId: '' });
    setMcqsData([]);
    setDocumentFile(null);
    setParsingDocument(false);
    setModules([]);
    setManualMcq({
      question: '',
      options: ['', '', '', ''],
      correctAnswer: '',
      explanation: '',
      difficulty: 'MEDIUM',
      topic: ''
    });
  };

  const handleView = async (set: MCQSet) => {
    try {
      const response = await mcqAPI.getSetById(set.id);
      if (response.data.success) {
        setViewingSet(set);
        setViewingQuestions(response.data.data.questions || []);
        setViewerOpen(true);
      }
    } catch (error) {
      console.error('Error fetching set details:', error);
      toast.error('Failed to load set questions');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this MCQ set? This will also delete all associated questions.')) {
      return;
    }

    try {
      // Note: You'll need to add this endpoint in the backend
      await mcqAPI.deleteSet(id);
      toast.success('MCQ set deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting set:', error);
      toast.error('Failed to delete MCQ set');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCreatorName = (set: MCQSet) => {
    if (set.creator) {
      const { first_name, last_name, username } = set.creator;
      if (first_name || last_name) {
        return `${first_name || ''} ${last_name || ''}`.trim();
      }
      return username;
    }
    return 'Unknown';
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredSets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSets = filteredSets.slice(startIndex, endIndex);

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">MCQ Sets Management</h1>
        <p className="text-gray-600">Upload and manage MCQ sets for student practice</p>
      </div>

      {/* Stats Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Total Sets</p>
            <p className="text-2xl font-bold text-gray-900">{mcqSets.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Total Questions</p>
            <p className="text-2xl font-bold text-blue-600">
              {mcqSets.reduce((sum, set) => sum + (set.questionCount || 0), 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Filtered Results</p>
            <p className="text-2xl font-bold text-green-600">{filteredSets.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Upload */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search MCQ sets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#A8C5B5]"
                />
              </div>
            </div>

            {/* Faculty Filter */}
            <div>
              <select
                value={filterFaculty}
                onChange={(e) => setFilterFaculty(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#A8C5B5]"
              >
                <option value="all">All Faculties</option>
                {faculties.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>

            {/* Module Filter */}
            <div>
              <select
                value={filterModule}
                onChange={(e) => setFilterModule(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#A8C5B5]"
              >
                <option value="all">All Modules</option>
                {modules
                  .filter(m => filterFaculty === 'all' || m.facultyId === parseInt(filterFaculty))
                  .map(m => (
                    <option key={m.id} value={m.id}>{m.code} - {m.name}</option>
                  ))}
              </select>
            </div>

            {/* Upload Button */}
            <div>
              <Button
                onClick={() => setUploadDialogOpen(true)}
                className="w-full bg-[#A8C5B5] hover:bg-[#96B5A5] text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Set
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MCQ Sets Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Module
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Questions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Creator
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      Loading MCQ sets...
                    </td>
                  </tr>
                ) : paginatedSets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No MCQ sets found. Create your first set to get started!
                    </td>
                  </tr>
                ) : (
                  paginatedSets.map((set) => (
                    <tr key={set.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{set.title}</div>
                          {set.description && (
                            <div className="text-xs text-gray-500 truncate max-w-xs">
                              {set.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {set.module?.code || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <Badge variant="outline">{set.questionCount || 0} Questions</Badge>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <Badge className={set.source === 'AI_GENERATED' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}>
                          {set.source === 'AI_GENERATED' ? 'AI Generated' : 'Manual'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(set.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {getCreatorName(set)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleView(set)}
                            className="inline-flex items-center px-2 py-1 text-xs border border-[#A8C5B5] text-[#6B9080] hover:bg-[#A8C5B5]/10 rounded transition-colors"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </button>
                          <button
                            onClick={() => handleDelete(set.id)}
                            className="inline-flex items-center px-2 py-1 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredSets.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">Show</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(parseInt(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#A8C5B5]"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span className="text-sm text-gray-700">per page</span>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create MCQ Set</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Set Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Set Information</h3>
              
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Set Title *
                </label>
                <input
                  type="text"
                  value={setForm.title}
                  onChange={(e) => setSetForm({ ...setForm, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A8C5B5]"
                  placeholder="e.g., Data Structures Practice Set 1"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={setForm.description}
                  onChange={(e) => setSetForm({ ...setForm, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A8C5B5]"
                  rows={2}
                  placeholder="Brief description of this MCQ set"
                />
              </div>

              {/* Faculty */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Faculty *
                </label>
                <select
                  value={setForm.facultyId}
                  onChange={(e) => setSetForm({ ...setForm, facultyId: e.target.value, year: '', moduleId: '' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A8C5B5]"
                  required
                >
                  <option value="">Select Faculty</option>
                  {faculties.map(f => (
                    <option key={f.id} value={f.id}>{f.code} - {f.name}</option>
                  ))}
                </select>
              </div>

              {/* Academic Year */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Academic Year *
                </label>
                <select
                  value={setForm.year}
                  onChange={(e) => setSetForm({ ...setForm, year: e.target.value, moduleId: '' })}
                  disabled={!setForm.facultyId}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A8C5B5] disabled:bg-gray-100 disabled:cursor-not-allowed"
                  required
                >
                  <option value="">Select Year</option>
                  <option value="1">Year 1</option>
                  <option value="2">Year 2</option>
                  <option value="3">Year 3</option>
                  <option value="4">Year 4</option>
                </select>
                {!setForm.facultyId && (
                  <p className="text-xs text-gray-500 mt-1">Select faculty first</p>
                )}
              </div>

              {/* Module */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Module *
                </label>
                <select
                  value={setForm.moduleId}
                  onChange={(e) => setSetForm({ ...setForm, moduleId: e.target.value })}
                  disabled={!setForm.facultyId || !setForm.year || modules.length === 0}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A8C5B5] disabled:bg-gray-100 disabled:cursor-not-allowed"
                  required
                >
                  <option value="">Select Module</option>
                  {modules.map(m => (
                    <option key={m.id} value={m.id}>{m.code} - {m.name}</option>
                  ))}
                </select>
                {!setForm.facultyId || !setForm.year ? (
                  <p className="text-xs text-gray-500 mt-1">Select faculty and year first</p>
                ) : modules.length === 0 && setForm.facultyId && setForm.year ? (
                  <p className="text-xs text-amber-600 mt-1">No modules available for this faculty and year</p>
                ) : null}
              </div>
            </div>

            {/* Upload Mode Tabs */}
            <div>
              <div className="flex gap-2 mb-4">
                <Button
                  type="button"
                  variant={uploadMode === 'document' ? 'default' : 'outline'}
                  onClick={() => setUploadMode('document')}
                  className={uploadMode === 'document' ? 'bg-[#A8C5B5] hover:bg-[#96B5A5]' : ''}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload PDF/Word
                </Button>
                <Button
                  type="button"
                  variant={uploadMode === 'manual' ? 'default' : 'outline'}
                  onClick={() => setUploadMode('manual')}
                  className={uploadMode === 'manual' ? 'bg-[#A8C5B5] hover:bg-[#96B5A5]' : ''}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Manually
                </Button>
              </div>

              {/* Document Upload (PDF/Word) */}
              {uploadMode === 'document' && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 mb-2">
                    Upload a PDF or Word document containing MCQs
                  </p>
                  <p className="text-xs text-gray-500 mb-4">
                    AI will extract questions, options, and correct answers from your document
                  </p>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleDocumentFileSelect}
                    className="hidden"
                    id="document-upload"
                    disabled={parsingDocument}
                  />
                  <label htmlFor="document-upload">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="cursor-pointer" 
                      asChild
                      disabled={parsingDocument}
                    >
                      <span>
                        <Upload className="h-4 w-4 mr-2" />
                        {parsingDocument ? 'Parsing Document...' : 'Choose PDF/Word File'}
                      </span>
                    </Button>
                  </label>
                  {documentFile && !parsingDocument && (
                    <p className="text-sm text-green-600 mt-2">
                      ✓ {documentFile.name} ({mcqsData.length} questions extracted)
                    </p>
                  )}
                  {parsingDocument && (
                    <p className="text-sm text-blue-600 mt-2">
                      🤖 AI is analyzing your document...
                    </p>
                  )}
                </div>
              )}

              {/* Manual Entry */}
              {uploadMode === 'manual' && (
                <div className="space-y-4 border border-gray-300 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900">Add Question</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Question *
                    </label>
                    <textarea
                      value={manualMcq.question}
                      onChange={(e) => setManualMcq({ ...manualMcq, question: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A8C5B5]"
                      rows={2}
                      placeholder="Enter the question"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {[0, 1, 2, 3].map((idx) => (
                      <div key={idx}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Option {String.fromCharCode(65 + idx)} *
                        </label>
                        <input
                          type="text"
                          value={manualMcq.options[idx]}
                          onChange={(e) => {
                            const newOptions = [...manualMcq.options];
                            newOptions[idx] = e.target.value;
                            setManualMcq({ ...manualMcq, options: newOptions });
                          }}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A8C5B5]"
                          placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Correct Answer *
                      </label>
                      <select
                        value={manualMcq.correctAnswer}
                        onChange={(e) => setManualMcq({ ...manualMcq, correctAnswer: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A8C5B5]"
                      >
                        <option value="">Select</option>
                        {manualMcq.options.filter(opt => opt).map((opt, idx) => (
                          <option key={idx} value={opt}>{String.fromCharCode(65 + idx)}: {opt.substring(0, 20)}{opt.length > 20 ? '...' : ''}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Difficulty
                      </label>
                      <select
                        value={manualMcq.difficulty}
                        onChange={(e) => setManualMcq({ ...manualMcq, difficulty: e.target.value as any })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A8C5B5]"
                      >
                        <option value="EASY">Easy</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HARD">Hard</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Topic
                      </label>
                      <input
                        type="text"
                        value={manualMcq.topic}
                        onChange={(e) => setManualMcq({ ...manualMcq, topic: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A8C5B5]"
                        placeholder="Optional"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Explanation
                    </label>
                    <textarea
                      value={manualMcq.explanation}
                      onChange={(e) => setManualMcq({ ...manualMcq, explanation: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A8C5B5]"
                      rows={2}
                      placeholder="Optional explanation for the correct answer"
                    />
                  </div>

                  <Button
                    type="button"
                    onClick={addManualMcq}
                    className="w-full bg-[#A8C5B5] hover:bg-[#96B5A5]"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Question to Set
                  </Button>
                </div>
              )}
            </div>

            {/* Current MCQs List */}
            {mcqsData.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900">
                  Questions in Set ({mcqsData.length})
                </h4>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {mcqsData.map((mcq, idx) => (
                    <div key={idx} className="flex items-start justify-between p-3 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {idx + 1}. {mcq.question}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Answer: {mcq.correctAnswer} • {mcq.difficulty || 'MEDIUM'}
                        </p>
                      </div>
                      <button
                        onClick={() => removeMcq(idx)}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setUploadDialogOpen(false);
                  resetUploadForm();
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleUploadSet}
                disabled={!setForm.title || !setForm.moduleId || mcqsData.length === 0}
                className="bg-[#4A7C59] hover:bg-[#3d6b4a] text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Create MCQ Set ({mcqsData.length} questions)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Viewer Dialog */}
      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewingSet?.title}</DialogTitle>
            <p className="text-sm text-gray-500">
              {viewingSet?.description || 'No description'}
            </p>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {viewingQuestions.map((q, idx) => (
              <div key={q.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <p className="font-medium text-gray-900 mb-3">
                  {idx + 1}. {q.question}
                </p>
                <div className="space-y-2 mb-3">
                  {Array.isArray(q.options) ? q.options.map((opt: string, optIdx: number) => (
                    <div
                      key={optIdx}
                      className={`p-2 rounded-lg ${
                        opt === q.correctAnswer
                          ? 'bg-green-100 border border-green-300'
                          : 'bg-white border border-gray-200'
                      }`}
                    >
                      <span className="font-medium">{String.fromCharCode(65 + optIdx)}.</span> {opt}
                    </div>
                  )) : null}
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Badge className={
                    q.difficulty === 'EASY' ? 'bg-green-100 text-green-800' :
                    q.difficulty === 'HARD' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }>
                    {q.difficulty}
                  </Badge>
                  {q.topic && (
                    <Badge variant="outline">{q.topic}</Badge>
                  )}
                </div>
                {q.explanation && (
                  <p className="text-sm text-gray-600 mt-2 italic">
                    💡 {q.explanation}
                  </p>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
