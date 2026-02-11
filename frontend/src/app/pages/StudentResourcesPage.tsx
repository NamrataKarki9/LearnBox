/**
 * Student Resources Page
 * Students can filter and view resources by Faculty, Year, and Module
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { resourceAPI, moduleAPI, facultyAPI, type Resource, type Module, type Faculty } from '../../services/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Download, FileText, Book, GraduationCap } from 'lucide-react';

export default function StudentResourcesPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [resources, setResources] = useState<Resource[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  
  const [filters, setFilters] = useState({
    facultyId: '',
    year: '',
    moduleId: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch faculties on mount
  useEffect(() => {
    fetchFaculties();
  }, []);

  // Fetch modules when faculty and year are selected
  useEffect(() => {
    if (filters.facultyId && filters.year) {
      fetchModules(parseInt(filters.facultyId), parseInt(filters.year));
    } else {
      setModules([]);
    }
  }, [filters.facultyId, filters.year]);

  // Fetch resources when filters change
  useEffect(() => {
    fetchResources();
  }, [filters]);

  const fetchFaculties = async () => {
    try {
      const response = await facultyAPI.getAll();
      setFaculties(response.data.data || []);
    } catch (err) {
      console.error('Error fetching faculties:', err);
    }
  };

  const fetchModules = async (facultyId: number, year: number) => {
    try {
      const response = await moduleAPI.getByFacultyAndYear(facultyId, year);
      setModules(response.data.data || []);
    } catch (err) {
      console.error('Error fetching modules:', err);
      setModules([]);
    }
  };

  const fetchResources = async () => {
    setLoading(true);
    setError('');
    
    try {
      const params: any = {};
      
      if (filters.facultyId) params.facultyId = parseInt(filters.facultyId);
      if (filters.year) params.year = parseInt(filters.year);
      if (filters.moduleId) params.moduleId = parseInt(filters.moduleId);
      
      const response = await resourceAPI.filter(params);
      setResources(response.data.data || []);
    } catch (err: any) {
      console.error('Error fetching resources:', err);
      setError(err.response?.data?.error || 'Failed to fetch resources');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (fileUrl: string, title: string) => {
    window.open(fileUrl, '_blank');
  };

  const getFileIcon = (fileType: string) => {
    return <FileText className="h-8 w-8 text-blue-500" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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
            onClick={() => navigate('/student-dashboard')}
            className="w-full text-left px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg mb-1"
          >
            Dashboard
          </button>
          <button className="w-full text-left px-4 py-3 text-gray-900 bg-gray-100 rounded-lg font-medium mb-1">
            Resources
          </button>
          <button className="w-full text-left px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg mb-1">
            MCQs Practice
          </button>
          <button className="w-full text-left px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg mb-1">
            Useful Learning Sites
          </button>
          <button className="w-full text-left px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg mb-1">
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
        
        {/* User Info */}
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
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Learning Resources</h1>
            <p className="text-gray-600">Browse and download study materials for your courses</p>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Filter Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Faculty Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Faculty</label>
                  <Select
                    value={filters.facultyId}
                    onValueChange={(value) => {
                      setFilters({ facultyId: value, year: '', moduleId: '' });
                      setModules([]);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Faculties" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Faculties</SelectItem>
                      {faculties.map((faculty) => (
                        <SelectItem key={faculty.id} value={faculty.id.toString()}>
                          {faculty.code} - {faculty.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Year Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                  <Select
                    value={filters.year}
                    onValueChange={(value) => {
                      setFilters({ ...filters, year: value, moduleId: '' });
                    }}
                    disabled={!filters.facultyId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Years" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Years</SelectItem>
                      <SelectItem value="1">Year 1</SelectItem>
                      <SelectItem value="2">Year 2</SelectItem>
                      <SelectItem value="3">Year 3</SelectItem>
                      <SelectItem value="4">Year 4</SelectItem>
                    </SelectContent>
                  </Select>
                  {!filters.facultyId && (
                    <p className="text-xs text-gray-500 mt-1">Select faculty first</p>
                  )}
                </div>

                {/* Module Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Module</label>
                  <Select
                    value={filters.moduleId}
                    onValueChange={(value) => setFilters({ ...filters, moduleId: value })}
                    disabled={!filters.facultyId || !filters.year || modules.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Modules" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Modules</SelectItem>
                      {modules.map((module) => (
                        <SelectItem key={module.id} value={module.id.toString()}>
                          {module.code} - {module.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!filters.facultyId || !filters.year ? (
                    <p className="text-xs text-gray-500 mt-1">Select faculty and year first</p>
                  ) : modules.length === 0 && filters.facultyId && filters.year ? (
                    <p className="text-xs text-amber-600 mt-1">No modules available</p>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Resource Cards */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Loading resources...</p>
            </div>
          ) : resources.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Book className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No resources found</h3>
                  <p className="text-gray-600">
                    {filters.facultyId || filters.year || filters.moduleId
                      ? 'Try adjusting your filters to find more resources.'
                      : 'No resources have been uploaded yet.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resources.map((resource) => (
                <Card key={resource.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        {getFileIcon(resource.fileType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">
                          {resource.title}
                        </h3>
                        
                        {resource.description && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {resource.description}
                          </p>
                        )}
                        
                        <div className="space-y-1 mb-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <GraduationCap className="h-4 w-4" />
                            <span>{resource.faculty?.code} - {resource.faculty?.name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Book className="h-4 w-4" />
                            <span>Year {resource.year} - {resource.module?.name}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {formatDate(resource.createdAt)}
                          </span>
                          <Button
                            size="sm"
                            onClick={() => handleDownload(resource.fileUrl, resource.title)}
                            className="bg-[#A8C5B5] hover:bg-[#96B5A5] text-white"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
