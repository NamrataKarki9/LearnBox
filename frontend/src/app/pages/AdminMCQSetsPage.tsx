/**
 * Admin MCQ Sets Management Page
 * Upload and manage MCQ sets for student practice
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { mcqAPI, facultyAPI, moduleAPI, MCQSet, Faculty } from '../../services/api';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import { Eye, Trash2, Upload, Plus, ChevronLeft, ChevronRight, Search, BookOpen, Edit } from 'lucide-react';

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
  const { user } = useAuth();
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
  const [filterYear, setFilterYear] = useState<string>('all');
  const [filterModule, setFilterModule] = useState<string>('all');
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  
  // Viewer state
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewingSet, setViewingSet] = useState<MCQSet | null>(null);
  const [viewingQuestions, setViewingQuestions] = useState<any[]>([]);
  
  // Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteConfirmSetId, setDeleteConfirmSetId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingSet, setEditingSet] = useState<MCQSet | null>(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    facultyId: '',
    year: '',
    moduleId: ''
  });
  const [editAvailableModules, setEditAvailableModules] = useState<Module[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Edit upload state
  const [editUploadMode, setEditUploadMode] = useState<'document' | 'manual'>('document');
  const [editDocumentFile, setEditDocumentFile] = useState<File | null>(null);
  const [editMcqsData, setEditMcqsData] = useState<any[]>([]);
  const [editParsingDocument, setEditParsingDocument] = useState(false);
  const [editManualMcq, setEditManualMcq] = useState<MCQData>({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    explanation: '',
    difficulty: 'MEDIUM',
    topic: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [mcqSets, searchQuery, filterFaculty, filterYear, filterModule]);

  // Fetch modules when faculty and year are selected
  useEffect(() => {
    if (setForm.facultyId && setForm.year) {
      fetchModulesForForm(parseInt(setForm.facultyId), parseInt(setForm.year));
    } else {
      setModules([]);
    }
  }, [setForm.facultyId, setForm.year]);

  // Update available years when faculty changes
  useEffect(() => {
    if (modules.length === 0) {
      setAvailableYears([]);
      return;
    }
    
    if (filterFaculty === 'all') {
      // Get all unique years from all modules
      const years = new Set<number>();
      modules.forEach(module => years.add(module.year));
      setAvailableYears(Array.from(years).sort());
    } else {
      // Get years for selected faculty
      const facultyModules = modules.filter(
        m => m.facultyId === parseInt(filterFaculty)
      );
      const years = new Set<number>();
      facultyModules.forEach(module => years.add(module.year));
      setAvailableYears(Array.from(years).sort());
      
      // Reset year and module if current selection is invalid
      if (filterYear !== 'all' && years.size > 0 && !years.has(parseInt(filterYear))) {
        setFilterYear('all');
        setFilterModule('all');
      }
    }
  }, [filterFaculty, modules]);

  // Fetch modules when both editFormData.facultyId and editFormData.year are selected
  useEffect(() => {
    if (editDialogOpen && editFormData.facultyId && editFormData.year) {
      fetchEditModules(parseInt(editFormData.facultyId), parseInt(editFormData.year));
    }
  }, [editFormData.facultyId, editFormData.year, editDialogOpen]);

  // When editing dialog opens, ensure modules are fetched
  useEffect(() => {
    if (editDialogOpen && editingSet && editFormData.facultyId && editFormData.year && editAvailableModules.length === 0) {
      fetchEditModules(parseInt(editFormData.facultyId), parseInt(editFormData.year));
    }
  }, [editDialogOpen, editingSet]);

  const fetchData = async () => {
    if (!user?.collegeId) {
      toast.error('Unable to load data: No college assigned');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      console.log('🔄 Fetching MCQ sets for college:', user.collegeId);
      
      const [setsRes, facultiesRes, modulesRes] = await Promise.all([
        mcqAPI.getSets({ collegeId: user.collegeId }),
        facultyAPI.getAll({ collegeId: user.collegeId }),
        moduleAPI.getAll({ collegeId: user.collegeId })
      ]);
      
      setMcqSets(setsRes.data.data || []);
      setFaculties(facultiesRes.data.data || []);
      setModules(modulesRes.data.data || []);
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

  const fetchEditModules = async (facultyId: number, year: number) => {
    try {
      const response = await moduleAPI.getByFacultyAndYear(facultyId, year);
      setEditAvailableModules(response.data.data || []);
    } catch (error) {
      console.error('Error fetching modules for edit:', error);
      setEditAvailableModules([]);
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
    
    // Faculty filter - find all modules for this faculty
    if (filterFaculty !== 'all') {
      const facultyModules = modules.filter(m => m.facultyId === parseInt(filterFaculty));
      
      // If year is selected, further filter modules by year
      if (filterYear !== 'all') {
        const yearModules = facultyModules.filter(m => m.year === parseInt(filterYear));
        
        // If module is selected, only show MCQs for that module
        if (filterModule !== 'all') {
          filtered = filtered.filter(s => s.moduleId === parseInt(filterModule));
        } else {
          // Show MCQs for any module in the selected year
          const moduleIds = yearModules.map(m => m.id);
          filtered = filtered.filter(s => s.moduleId && moduleIds.includes(s.moduleId));
        }
      } else {
        // Year not selected, show MCQs for any module in the faculty
        const moduleIds = facultyModules.map(m => m.id);
        filtered = filtered.filter(s => s.moduleId && moduleIds.includes(s.moduleId));
      }
    } else if (filterYear !== 'all') {
      // Year selected but no faculty
      const yearModules = modules.filter(m => m.year === parseInt(filterYear));
      if (filterModule !== 'all') {
        filtered = filtered.filter(s => s.moduleId === parseInt(filterModule));
      } else {
        const moduleIds = yearModules.map(m => m.id);
        filtered = filtered.filter(s => s.moduleId && moduleIds.includes(s.moduleId));
      }
    } else if (filterModule !== 'all') {
      // Only module selected
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
    // Validate all fields
    const errors = [];
    
    if (!setForm.title) errors.push('Please provide a set title');
    if (!setForm.facultyId) errors.push('Please select a faculty');
    if (!setForm.year) errors.push('Please select an academic year');
    if (!setForm.moduleId) errors.push('Please select a module');
    if (mcqsData.length === 0) errors.push('Please add at least one MCQ');
    
    // If any errors exist, show them in a toast and don't submit
    if (errors.length > 0) {
      toast.error(errors.join('\n'));
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
    setDeleteConfirmSetId(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmSetId) return;
    setIsDeleting(true);
    try {
      // Note: You'll need to add this endpoint in the backend
      await mcqAPI.deleteSet(deleteConfirmSetId);
      toast.success('MCQ set deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting set:', error);
      toast.error('Failed to delete MCQ set');
    } finally {
      setIsDeleting(false);
      setDeleteConfirmOpen(false);
      setDeleteConfirmSetId(null);
    }
  };

  const handleEdit = async (set: MCQSet) => {
    setEditingSet(set);
    
    let facultyId = '';
    let year = '';
    
    // If we have moduleId, fetch all modules to find faculty and year
    if (set.moduleId) {
      try {
        const response = await moduleAPI.getAll();
        const allModules = response.data.data || [];
        const matchedModule = allModules.find(m => m.id === set.moduleId);
        if (matchedModule) {
          facultyId = matchedModule.facultyId?.toString() || '';
          year = matchedModule.year?.toString() || '';
          // Also fetch modules for this faculty+year combination
          if (facultyId && year) {
            const editModulesRes = await moduleAPI.getByFacultyAndYear(parseInt(facultyId), parseInt(year));
            setEditAvailableModules(editModulesRes.data.data || []);
          }
        }
      } catch (error) {
        console.error('Error fetching modules for edit:', error);
      }
    }
    
    setEditFormData({
      title: set.title,
      description: set.description || '',
      facultyId: facultyId,
      year: year,
      moduleId: set.moduleId?.toString() || ''
    });
    
    setEditDialogOpen(true);
  };

  const handleEditFacultyChange = (facultyId: string) => {
    setEditFormData({ ...editFormData, facultyId, year: '', moduleId: '' });
    setEditAvailableModules([]);
  };

  const handleSaveEdit = async () => {
    if (!editingSet) return;
    
    if (!editFormData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (!editFormData.facultyId) {
      toast.error('Faculty is required');
      return;
    }

    if (!editFormData.year) {
      toast.error('Year is required');
      return;
    }

    if (!editFormData.moduleId) {
      toast.error('Module is required');
      return;
    }

    setIsSaving(true);
    try {
      // Update MCQ set metadata
      try {
        await mcqAPI.updateSet(editingSet.id, {
          title: editFormData.title,
          description: editFormData.description,
          moduleId: parseInt(editFormData.moduleId)
        });
      } catch (error) {
        console.error('Error updating MCQ set:', error);
        // Continue with adding questions even if metadata update fails
      }

      // Add any new questions if they were provided
      let addedCount = 0;
      if (editMcqsData.length > 0) {
        for (const mcq of editMcqsData) {
          try {
            await mcqAPI.addQuestion(editingSet.id, {
              question: mcq.question,
              options: mcq.options,
              correctAnswer: mcq.correctAnswer,
              explanation: mcq.explanation,
              difficulty: mcq.difficulty,
              topic: mcq.topic
            });
            addedCount++;
          } catch (error) {
            console.error('Error adding question:', error);
          }
        }
        if (addedCount > 0) {
          toast.success(`MCQ set updated! ${addedCount} question(s) added`);
        }
      } else {
        toast.success('MCQ set updated successfully');
      }

      setEditDialogOpen(false);
      setEditingSet(null);
      setEditMcqsData([]);
      setEditDocumentFile(null);
      setEditUploadMode('document');
      fetchData();
    } catch (error) {
      console.error('Error updating MCQ set:', error);
      toast.error('Failed to update MCQ set');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleEditDocumentFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const validExtensions = ['.pdf', '.doc', '.docx'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
      toast.error('Please upload a PDF or Word document');
      return;
    }

    setEditDocumentFile(file);
    setEditParsingDocument(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/mcqs/parse-document', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to parse document');
      }

      const data = await response.json();
      const parsedMcqs = (data.mcqs || []).map((mcq: any) => ({
        question: mcq.question || '',
        options: mcq.options || ['', '', '', ''],
        correctAnswer: mcq.correctAnswer || '',
        explanation: mcq.explanation || '',
        difficulty: mcq.difficulty || 'MEDIUM',
        topic: mcq.topic || ''
      }));

      setEditMcqsData(parsedMcqs);
      toast.success(`${parsedMcqs.length} questions extracted from document`);
    } catch (error) {
      console.error('Error parsing document:', error);
      toast.error('Failed to parse document');
      setEditDocumentFile(null);
    } finally {
      setEditParsingDocument(false);
    }
  };

  const addEditManualMcq = () => {
    if (!editManualMcq.question.trim()) {
      toast.error('Question is required');
      return;
    }

    if (!editManualMcq.options.every(opt => opt.trim())) {
      toast.error('All options must be filled');
      return;
    }

    if (!editManualMcq.correctAnswer) {
      toast.error('Correct answer must be selected');
      return;
    }

    setEditMcqsData([...editMcqsData, editManualMcq]);
    setEditManualMcq({
      question: '',
      options: ['', '', '', ''],
      correctAnswer: '',
      explanation: '',
      difficulty: 'MEDIUM',
      topic: ''
    });
    toast.success('Question added to set');
  };

  const removeEditMcq = (index: number) => {
    setEditMcqsData(editMcqsData.filter((_, i) => i !== index));
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
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
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
              <Select 
                value={filterFaculty} 
                onValueChange={(value) => {
                  setFilterFaculty(value);
                  setFilterYear('all');
                  setFilterModule('all');
                }}
              >
                <SelectTrigger className="w-full border-gray-300 bg-white text-gray-900 focus:ring-[#A8C5B5] focus:border-[#A8C5B5]">
                  <SelectValue placeholder="All Faculties" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-300">
                  <SelectItem value="all">All Faculties</SelectItem>
                  {faculties.map(f => (
                    <SelectItem key={f.id} value={f.id.toString()}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Year Filter */}
            <div>
              <Select 
                value={filterYear} 
                onValueChange={(value) => {
                  setFilterYear(value);
                  setFilterModule('all');
                }}
                disabled={filterFaculty === 'all'}
              >
                <SelectTrigger className="w-full border-gray-300 bg-white text-gray-900 focus:ring-[#A8C5B5] focus:border-[#A8C5B5] disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed">
                  <SelectValue placeholder="All Years" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-300">
                  <SelectItem value="all">All Years</SelectItem>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={year.toString()}>Year {year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Module Filter */}
            <div>
              <Select 
                value={filterModule} 
                onValueChange={setFilterModule}
                disabled={filterFaculty === 'all' || filterYear === 'all'}
              >
                <SelectTrigger className="w-full border-gray-300 bg-white text-gray-900 focus:ring-[#A8C5B5] focus:border-[#A8C5B5] disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed">
                  <SelectValue placeholder="All Modules" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-300">
                  <SelectItem value="all">All Modules</SelectItem>
                  {modules
                    .filter(m => {
                      if (filterFaculty !== 'all' && m.facultyId !== parseInt(filterFaculty)) return false;
                      if (filterYear !== 'all' && m.year !== parseInt(filterYear)) return false;
                      return true;
                    })
                    .map(m => (
                      <SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
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
                    Year
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
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      Loading MCQ sets...
                    </td>
                  </tr>
                ) : paginatedSets.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
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
                        {set.module?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <Badge variant="outline">Year {set.module?.year || '-'}</Badge>
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
                            onClick={() => handleEdit(set)}
                            className="inline-flex items-center px-2 py-1 text-xs border border-blue-500 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
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
                className="bg-[#4A7C59] hover:bg-[#3d6b4a] text-white"
              >
                Create MCQ Set ({mcqsData.length} questions)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete MCQ Set</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to delete this MCQ set? This will also delete all associated questions. This action cannot be undone.
            </p>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button onClick={confirmDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700 text-white">
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
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

      {/* Edit MCQ Set Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onOpenChange={setEditDialogOpen}
      >
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Edit MCQ Set</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={(e) => { e.preventDefault(); handleSaveEdit(); }} className="space-y-4">
            {/* Title */}
            <div>
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={editFormData.title}
                onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                placeholder="Enter MCQ set title"
                disabled={isSaving}
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                placeholder="Enter description (optional)"
                rows={3}
                disabled={isSaving}
              />
            </div>

            {/* Faculty */}
            <div>
              <Label htmlFor="edit-faculty">Faculty *</Label>
              <Select
                value={editFormData.facultyId}
                onValueChange={(value) => handleEditFacultyChange(value)}
                disabled={isSaving}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select faculty" />
                </SelectTrigger>
                <SelectContent side="bottom">
                  {faculties.map((faculty) => (
                    <SelectItem key={faculty.id} value={faculty.id.toString()}>
                      {faculty.code} - {faculty.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Academic Year */}
            <div>
              <Label htmlFor="edit-year">Academic Year *</Label>
              <Select
                value={editFormData.year}
                onValueChange={(value) => {
                  setEditFormData({ ...editFormData, year: value, moduleId: '' });
                }}
                disabled={isSaving || !editFormData.facultyId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent side="bottom">
                  <SelectItem value="1">Year 1</SelectItem>
                  <SelectItem value="2">Year 2</SelectItem>
                  <SelectItem value="3">Year 3</SelectItem>
                  <SelectItem value="4">Year 4</SelectItem>
                </SelectContent>
              </Select>
              {!editFormData.facultyId && (
                <p className="text-xs text-gray-500 mt-1">Select faculty first</p>
              )}
            </div>

            {/* Module */}
            <div>
              <Label htmlFor="edit-module">Module *</Label>
              <Select
                value={editFormData.moduleId}
                onValueChange={(value) => setEditFormData({ ...editFormData, moduleId: value })}
                disabled={isSaving || !editFormData.facultyId || !editFormData.year || editAvailableModules.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select module" />
                </SelectTrigger>
                <SelectContent side="bottom">
                  {editAvailableModules.map((module) => (
                    <SelectItem key={module.id} value={module.id.toString()}>
                      {module.code} - {module.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!editFormData.facultyId || !editFormData.year ? (
                <p className="text-xs text-gray-500 mt-1">Select faculty and year first</p>
              ) : editAvailableModules.length === 0 && editFormData.facultyId && editFormData.year ? (
                <p className="text-xs text-amber-600 mt-1">No modules available for this faculty and year</p>
              ) : null}
            </div>

            {/* Upload Mode Tabs (Optional) */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2">Add or Replace Questions (Optional)</Label>
              <div className="flex gap-2 mb-4">
                <Button
                  type="button"
                  variant={editUploadMode === 'document' ? 'default' : 'outline'}
                  onClick={() => setEditUploadMode('document')}
                  className={editUploadMode === 'document' ? 'bg-[#A8C5B5] hover:bg-[#96B5A5]' : ''}
                  disabled={isSaving}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload PDF/Word
                </Button>
                <Button
                  type="button"
                  variant={editUploadMode === 'manual' ? 'default' : 'outline'}
                  onClick={() => setEditUploadMode('manual')}
                  className={editUploadMode === 'manual' ? 'bg-[#A8C5B5] hover:bg-[#96B5A5]' : ''}
                  disabled={isSaving}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Manually
                </Button>
              </div>

              {/* Document Upload (PDF/Word) */}
              {editUploadMode === 'document' && (
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
                    onChange={handleEditDocumentFileSelect}
                    className="hidden"
                    id="edit-document-upload"
                    disabled={editParsingDocument}
                  />
                  <label htmlFor="edit-document-upload">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="cursor-pointer" 
                      asChild
                      disabled={editParsingDocument || isSaving}
                    >
                      <span>
                        <Upload className="h-4 w-4 mr-2" />
                        {editParsingDocument ? 'Parsing Document...' : 'Choose PDF/Word File'}
                      </span>
                    </Button>
                  </label>
                  {editDocumentFile && !editParsingDocument && (
                    <p className="text-sm text-green-600 mt-2">
                      ✓ {editDocumentFile.name} ({editMcqsData.length} questions extracted)
                    </p>
                  )}
                  {editParsingDocument && (
                    <p className="text-sm text-blue-600 mt-2">
                      🤖 AI is analyzing your document...
                    </p>
                  )}
                </div>
              )}

              {/* Manual Entry */}
              {editUploadMode === 'manual' && (
                <div className="space-y-4 border border-gray-300 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900">Add Question</h4>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-1">Question *</Label>
                    <Textarea
                      value={editManualMcq.question}
                      onChange={(e) => setEditManualMcq({ ...editManualMcq, question: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A8C5B5]"
                      rows={2}
                      placeholder="Enter the question"
                      disabled={isSaving}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {[0, 1, 2, 3].map((idx) => (
                      <div key={idx}>
                        <Label className="text-sm font-medium text-gray-700 mb-1">
                          Option {String.fromCharCode(65 + idx)} *
                        </Label>
                        <Input
                          type="text"
                          value={editManualMcq.options[idx]}
                          onChange={(e) => {
                            const newOptions = [...editManualMcq.options];
                            newOptions[idx] = e.target.value;
                            setEditManualMcq({ ...editManualMcq, options: newOptions });
                          }}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                          placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                          disabled={isSaving}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-1">Correct Answer *</Label>
                      <Select
                        value={editManualMcq.correctAnswer}
                        onValueChange={(value) => setEditManualMcq({ ...editManualMcq, correctAnswer: value })}
                        disabled={isSaving}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {editManualMcq.options.filter(opt => opt).map((opt, idx) => (
                            <SelectItem key={idx} value={opt}>
                              {String.fromCharCode(65 + idx)}: {opt.substring(0, 20)}{opt.length > 20 ? '...' : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-1">Difficulty</Label>
                      <Select
                        value={editManualMcq.difficulty}
                        onValueChange={(value) => setEditManualMcq({ ...editManualMcq, difficulty: value as any })}
                        disabled={isSaving}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EASY">Easy</SelectItem>
                          <SelectItem value="MEDIUM">Medium</SelectItem>
                          <SelectItem value="HARD">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-1">Topic</Label>
                      <Input
                        type="text"
                        value={editManualMcq.topic}
                        onChange={(e) => setEditManualMcq({ ...editManualMcq, topic: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        placeholder="Optional"
                        disabled={isSaving}
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-1">Explanation</Label>
                    <Textarea
                      value={editManualMcq.explanation}
                      onChange={(e) => setEditManualMcq({ ...editManualMcq, explanation: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      rows={2}
                      placeholder="Optional explanation for the correct answer"
                      disabled={isSaving}
                    />
                  </div>

                  <Button
                    type="button"
                    onClick={addEditManualMcq}
                    className="w-full bg-[#A8C5B5] hover:bg-[#96B5A5]"
                    disabled={isSaving}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Question to Set
                  </Button>
                </div>
              )}
            </div>

            {/* New Questions List */}
            {editMcqsData.length > 0 && (
              <div className="space-y-2 border-t pt-4">
                <h4 className="font-semibold text-gray-900">
                  New Questions ({editMcqsData.length})
                </h4>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {editMcqsData.map((mcq, idx) => (
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
                        type="button"
                        onClick={() => removeEditMcq(idx)}
                        className="ml-2 text-red-500 hover:text-red-700"
                        disabled={isSaving}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditDialogOpen(false);
                  setEditingSet(null);
                }}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-primary hover:bg-primary/90 text-white"
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
