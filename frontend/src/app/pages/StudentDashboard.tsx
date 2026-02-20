/**
 * Student Dashboard
 * College-scoped access - view resources and attempt MCQs from own college
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useFilters } from '../../context/FilterContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { facultyAPI, moduleAPI, resourceAPI, Faculty, searchAPI, SemanticSearchResult } from '../../services/api';
import { toast } from 'sonner';
import { Download, Eye } from 'lucide-react';

interface Module {
  id: number;
  name: string;
  code: string;
  description?: string;
  year: number;
  facultyId: number;
  collegeId: number;
  faculty?: {
    id: number;
    name: string;
    code: string;
  };
}

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const filters = useFilters();
  
  // Data states
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [filteredModules, setFilteredModules] = useState<Module[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  
  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SemanticSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  // Resource viewer state
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewingResource, setViewingResource] = useState<{ url: string; title: string } | null>(null);
  
  // Loading state
  const [loading, setLoading] = useState(true);

  // Fetch faculties on component mount
  useEffect(() => {
    const fetchFaculties = async () => {
      try {
        const response = await facultyAPI.getAll();
        setFaculties(response.data.data);
      } catch (error) {
        console.error('Error fetching faculties:', error);
      }
    };

    fetchFaculties();
  }, []);

  // Fetch modules based on selected faculty and year
  useEffect(() => {
    const fetchModules = async () => {
      try {
        setLoading(true);
        const params: any = {};
        
        if (filters.facultyId !== 'all') {
          params.facultyId = parseInt(filters.facultyId);
        }
        
        if (filters.year !== 'all') {
          params.year = parseInt(filters.year);
        }

        const response = await moduleAPI.getAll(params);
        setModules(response.data.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching modules:', error);
        setLoading(false);
      }
    };

    fetchModules();
  }, [filters.facultyId, filters.year]);

  // Update available years when faculty changes
  useEffect(() => {
    if (filters.facultyId === 'all') {
      // Get all unique years from all modules
      const years = new Set<number>();
      modules.forEach(module => years.add(module.year));
      setAvailableYears(Array.from(years).sort());
    } else {
      // Get years for selected faculty
      const facultyModules = modules.filter(
        m => m.facultyId === parseInt(filters.facultyId)
      );
      const years = new Set<number>();
      facultyModules.forEach(module => years.add(module.year));
      setAvailableYears(Array.from(years).sort());
      
      // Reset year if current selection is not available
      if (filters.year !== 'all' && !years.has(parseInt(filters.year))) {
        filters.setYear('all');
      }
    }
  }, [filters.facultyId, modules, filters.year]);

  // Filter modules based on all selections
  useEffect(() => {
    let filtered = modules;

    if (filters.facultyId !== 'all') {
      filtered = filtered.filter(m => m.facultyId === parseInt(filters.facultyId));
    }

    if (filters.year !== 'all') {
      filtered = filtered.filter(m => m.year === parseInt(filters.year));
    }

    if (filters.moduleId !== 'all') {
      filtered = filtered.filter(m => m.id === parseInt(filters.moduleId));
    }

    setFilteredModules(filtered);
  }, [modules, filters.facultyId, filters.year, filters.moduleId]);

  // Handle faculty change
  const handleFacultyChange = (value: string) => {
    filters.setFacultyId(value);
    filters.setYear('all');
    filters.setModuleId('all');
  };

  // Handle year change
  const handleYearChange = (value: string) => {
    filters.setYear(value);
    filters.setModuleId('all');
  };

  // Handle semantic search
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setIsSearching(true);
    setShowSearchResults(true);

    try {
      const response = await searchAPI.semanticSearch({
        query: searchQuery,
        facultyId: filters.facultyId !== 'all' ? filters.facultyId : undefined,
        year: filters.year !== 'all' ? filters.year : undefined,
        moduleId: filters.moduleId !== 'all' ? filters.moduleId : undefined,
        limit: 10
      });

      setSearchResults(response.data.data);
      
      if (response.data.data.length === 0) {
        toast.info('No results found. Try a different search query.');
      } else {
        toast.success(`Found ${response.data.data.length} relevant resources`);
      }
    } catch (error: any) {
      console.error('Search error:', error);
      
      if (error.response?.status === 503) {
        toast.error('Search system is being initialized. Please try again in a moment.');
      } else {
        toast.error('Failed to perform search. Please try again.');
      }
      
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search key press
  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Clear search results
  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

  // Handle view resource
  const handleView = (resource: SemanticSearchResult) => {
    try {
      const viewUrl = resourceAPI.getDownloadUrl(resource.id);
      setViewingResource({ url: viewUrl, title: resource.title });
      setViewerOpen(true);
    } catch (error) {
      console.error('View error:', error);
      toast.error('Failed to open resource viewer');
    }
  };

  // Handle download resource
  const handleDownload = (resourceId: number) => {
    try {
      const downloadUrl = resourceAPI.getDownloadUrl(resourceId);
      window.open(downloadUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download resource');
    }
  };

  // Calculate performance metrics
  const calculateMetrics = () => {
    const totalModules = filteredModules.length;
    const completedModules = filteredModules.filter(m => {
      // Assuming we'll add progress field later, for now use placeholder logic
      return false;
    }).length;

    return {
      totalModules,
      completedModules,
      inProgress: totalModules - completedModules,
      averageScore: 0 // Will be calculated when we have actual progress data
    };
  };

  const metrics = calculateMetrics();

  // Group modules by year
  const modulesByYear = filteredModules.reduce((acc, module) => {
    if (!acc[module.year]) {
      acc[module.year] = [];
    }
    acc[module.year].push(module);
    return acc;
  }, {} as Record<number, Module[]>);

  const recentActivity = [
    { title: 'Data Structures & Algorithm Class 3 ext', action: 'View' },
    { title: 'Calculus I Lecture Notes', action: 'View' },
    { title: 'Introduction to Programming Quiz 5', action: 'View' }
  ];

  const mcqsHistory = [
    { quiz: 'Data structures, Quiz 1', score: '6/8' },
    { quiz: 'Mathematical Midterm Mock', score: '70%' },
    { quiz: 'Calculus 1 Chapter 2 Test', score: '8/8' }
  ];

  const roadmap = [
    'Complete Introduction to Programming',
    'Pass Discrete Mathematics Exam',
    'Start Data Structures Project',
    'Attend Algorithms Workshop'
  ];

  return (
    <div className="flex min-h-screen bg-[#F5F5F5]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-bold text-gray-900">LearnBox</h1>
        </div>
        <nav className="flex-1 px-4">
          <button className="w-full text-left px-4 py-3 text-gray-900 bg-gray-100 rounded-lg font-medium mb-1">
            Dashboard
          </button>
          <button 
            onClick={() => navigate('/student/resources')}
            className="w-full text-left px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg mb-1"
          >
            Resources
          </button>
          <button 
            onClick={() => navigate('/student/mcq-practice')}
            className="w-full text-left px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg mb-1"
          >
            MCQs Practice
          </button>
          <button 
            onClick={() => navigate('/student/history')}
            className="w-full text-left px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg mb-1"
          >
            📊 MCQ History
          </button>
          <button 
            onClick={() => navigate('/student/analytics')}
            className="w-full text-left px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg mb-1"
          >
            📈 Analytics
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
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center">
          <div className="flex-1 flex gap-2">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search resources using AI (e.g., 'explain neural networks')..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A8C5B5] pr-10"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                  title="Clear search"
                >
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <Button
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="bg-[#A8C5B5] hover:bg-[#96B5A5] text-white px-6"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>
        </header>

        <div className="p-8">
          {/* Search Results Section */}
          {showSearchResults && (
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Search Results</h2>
                  <p className="text-sm text-gray-600">Showing results for: "{searchQuery}"</p>
                </div>
                <Button
                  onClick={clearSearch}
                  variant="outline"
                  className="text-gray-600 hover:text-gray-900"
                >
                  Back to Dashboard
                </Button>
              </div>
              
              {isSearching ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#A8C5B5]"></div>
                  <p className="mt-4 text-gray-600">Searching through resources...</p>
                </div>
              ) : searchResults.length === 0 ? (
                <Card className="border border-gray-200">
                  <CardContent className="p-8 text-center">
                    <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No results found</h3>
                    <p className="text-gray-600">Try different keywords or clear some filters</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {searchResults.map((resource) => (
                    <Card key={resource.id} className="border border-gray-200 hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-bold text-gray-900">{resource.title}</h3>
                              <span className="px-2 py-1 bg-[#A8C5B5]/20 text-[#2C5F2D] text-xs font-medium rounded">
                                {Math.round(resource.relevanceScore * 100)}% match
                              </span>
                            </div>
                            
                            {resource.description && (
                              <p className="text-sm text-gray-700 mb-3">{resource.description}</p>
                            )}
                            
                            <div className="flex flex-wrap gap-2 mb-3">
                              {resource.faculty && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                                  {resource.faculty.name}
                                </span>
                              )}
                              {resource.year && (
                                <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                                  Year {resource.year}
                                </span>
                              )}
                              {resource.module && (
                                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                                  {resource.module.name}
                                </span>
                              )}
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                {resource.fileType.toUpperCase()}
                              </span>
                            </div>
                            
                            {resource.matchedChunks && resource.matchedChunks.length > 0 && (
                              <div className="bg-gray-50 p-3 rounded-lg text-xs text-gray-600 mb-2">
                                <p className="font-medium mb-1">Relevant excerpt:</p>
                                <p className="italic">"{resource.matchedChunks[0]}"</p>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex gap-2 ml-4">
                            <Button
                              variant="outline"
                              onClick={() => handleView(resource)}
                              className="border-[#A8C5B5] text-[#6B9080] hover:bg-[#A8C5B5]/10"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button
                              onClick={() => handleDownload(resource.id)}
                              className="bg-[#A8C5B5] hover:bg-[#96B5A5] text-white"
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Welcome Section */}
          {!showSearchResults && (
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-1">Welcome Back, {user?.first_name || user?.username || 'Student'}!</h1>
              <p className="text-gray-600">Here's your academic overview and recent activities.</p>
            </div>
          )}

          {/* Filter Dropdowns */}
          {!showSearchResults && (
          <div className="flex gap-3 mb-8">
            {/* Faculty Dropdown */}
            <div className="w-64">
              <Select value={filters.facultyId} onValueChange={handleFacultyChange}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Select Faculty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Faculties</SelectItem>
                  {faculties.map((faculty) => (
                    <SelectItem key={faculty.id} value={faculty.id.toString()}>
                      {faculty.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Academic Year Dropdown */}
            <div className="w-48">
              <Select 
                value={filters.year} 
                onValueChange={handleYearChange}
                disabled={filters.facultyId === 'all' && availableYears.length === 0}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Select Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {availableYears.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      Year {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Module Dropdown */}
            <div className="w-64">
              <Select 
                value={filters.moduleId} 
                onValueChange={filters.setModuleId}
                disabled={filteredModules.length === 0}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Select Module" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modules</SelectItem>
                  {filteredModules.map((module) => (
                    <SelectItem key={module.id} value={module.id.toString()}>
                      {module.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          )}

          {/* Performance Cards */}
          {!showSearchResults && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Your Performance at a Glance</h2>
            <div className="grid grid-cols-4 gap-4">
              <Card className="bg-[#A8C5B5]/20 border-0">
                <CardContent className="p-6 text-center">
                  <p className="text-3xl font-bold text-gray-900 mb-2">{metrics.totalModules}</p>
                  <p className="text-gray-700 font-medium">Total Modules</p>
                </CardContent>
              </Card>
              <Card className="bg-[#A8C5B5]/20 border-0">
                <CardContent className="p-6 text-center">
                  <p className="text-3xl font-bold text-gray-900 mb-2">{metrics.inProgress}</p>
                  <p className="text-gray-700 font-medium">In Progress</p>
                </CardContent>
              </Card>
              <Card className="bg-[#A8C5B5]/20 border-0">
                <CardContent className="p-6 text-center">
                  <p className="text-3xl font-bold text-gray-900 mb-2">{metrics.completedModules}</p>
                  <p className="text-gray-700 font-medium">Completed Modules</p>
                </CardContent>
              </Card>
              <Card className="bg-[#A8C5B5]/20 border-0">
                <CardContent className="p-6 text-center">
                  <p className="text-3xl font-bold text-gray-900 mb-2">{metrics.averageScore}%</p>
                  <p className="text-gray-700 font-medium">Average Score</p>
                </CardContent>
              </Card>
            </div>
          </div>
          )}

          {/* My Modules */}
          {!showSearchResults && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">My Modules</h2>
            
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Loading modules...</p>
              </div>
            ) : filteredModules.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No modules found for the selected filters.</p>
              </div>
            ) : (
              Object.keys(modulesByYear).sort().map((year) => (
                <div key={year} className="mb-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Year {year}</h3>
                  <div className="grid grid-cols-2 gap-6">
                    {modulesByYear[parseInt(year)].map((module) => (
                      <Card key={module.id} className="border border-gray-200">
                        <CardContent className="p-6">
                          <h4 className="font-bold text-gray-900 mb-1">{module.name}</h4>
                          <p className="text-sm text-gray-600 mb-3">{module.code}</p>
                          {module.faculty && (
                            <p className="text-xs text-gray-500 mb-2">
                              Faculty: {module.faculty.name}
                            </p>
                          )}
                          <p className="text-sm text-gray-700 mb-4">
                            {module.description || 'No description available.'}
                          </p>
                          {/* Progress bar - Will be dynamic when progress tracking is implemented */}
                          <Progress value={0} className="h-2 mb-2" />
                          <div className="flex justify-between items-center mt-4">
                            <span className="text-sm font-semibold text-gray-900">0% complete</span>
                            <Button 
                              className="bg-[#A8C5B5] hover:bg-[#96B5A5] text-white text-sm px-4 py-2 rounded-lg"
                              onClick={() => {
                                // Set the specific module filter in context
                                filters.setFilters({
                                  facultyId: module.facultyId.toString(),
                                  year: module.year.toString(),
                                  moduleId: module.id.toString()
                                });
                                navigate('/student/resources');
                              }}
                            >
                              View Module
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
          )}

          {/* Bottom Grid: Recent Activity, MCQs History */}
          {!showSearchResults && (
          <div className="grid grid-cols-2 gap-6 mb-8">
            {/* Recent Activity */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
              <Card className="border border-gray-200">
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {recentActivity.map((activity, idx) => (
                      <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                        <span className="text-sm text-gray-700">{activity.title}</span>
                        <Button className="bg-[#A8C5B5] hover:bg-[#96B5A5] text-white text-xs px-3 py-1 rounded">
                          {activity.action}
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* MCQs Practice History */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">MCQs Practice History</h2>
              <Card className="border border-gray-200">
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {mcqsHistory.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                        <span className="text-sm text-gray-700">{item.quiz}</span>
                        <span className="text-sm font-semibold text-gray-900">{item.score}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          )}

          {/* Course Roadmap */}
          {!showSearchResults && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Course Roadmap</h2>
            <Card className="border border-gray-200">
              <CardContent className="p-6">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-900">Year 1</p>
                  <p className="text-sm text-gray-700">{roadmap[0]}</p>
                  <p className="text-sm text-gray-700">{roadmap[1]}</p>
                  <p className="text-sm font-semibold text-gray-900 mt-4">Year 2</p>
                  <p className="text-sm text-gray-700">{roadmap[2]}</p>
                  <p className="text-sm text-gray-700">{roadmap[3]}</p>
                </div>
              </CardContent>
            </Card>
          </div>
          )}
        </div>

        {/* Footer */}
        <footer className="bg-[#D5E3DF] py-8">
          <div className="max-w-7xl mx-auto px-8">
            <div className="grid grid-cols-4 gap-8 mb-6">
              <div>
                <h3 className="font-bold text-gray-900 mb-3">LearnBox</h3>
                <p className="text-sm text-gray-700">Your academic learning companion.</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">About Us</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>Our Story</li>
                  <li>Mission</li>
                  <li>Vision</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Support</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>Help Center</li>
                  <li>Contact Us</li>
                  <li>FAQ</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Legal</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>Privacy Policy</li>
                  <li>Terms of Service</li>
                </ul>
              </div>
            </div>
            <div className="text-center text-sm text-gray-600">
              2025 LearnBox. All rights reserved.
            </div>
          </div>
        </footer>
      </main>

      {/* Resource Viewer Modal */}
      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent className="max-w-[95vw] w-full h-[95vh] flex flex-col p-0">
          <DialogHeader className="px-6 py-4 border-b flex-shrink-0 bg-white">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-semibold">
                {viewingResource?.title}
              </DialogTitle>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>💡 Use browser zoom (Ctrl +/-) or PDF viewer controls to adjust size</span>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 min-h-0 bg-gray-100">
            {viewingResource && (
              <iframe
                src={`${viewingResource.url}#zoom=page-width&view=FitH`}
                className="w-full h-full border-0"
                title={viewingResource.title}
                allow="fullscreen"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
