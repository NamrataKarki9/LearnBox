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
import { facultyAPI, moduleAPI, resourceAPI, Faculty, searchAPI, SemanticSearchResult, analyticsAPI } from '../../services/api';
import { toast } from 'sonner';
import { Download, Eye, TrendingUp, Target, BookOpen, Clock } from 'lucide-react';
import { LogoutConfirmDialog } from '../components/LogoutConfirmDialog';
import { useLogoutConfirm } from '../../hooks/useLogoutConfirm';

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

interface RecentSession {
  id: number;
  title: string;
  module?: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  date: string;
  timeSpent?: number;
}

interface WeakArea {
  topic: string;
  accuracy: number;
  module?: string;
  difficulty?: string;
}

interface Recommendation {
  topic: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  reason: string;
  suggestedActions?: string[];
}

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const filters = useFilters();
  const logoutConfirm = useLogoutConfirm();
  
  // Data states
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [filteredModules, setFilteredModules] = useState<Module[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  
  // Analytics states
  const [performanceStats, setPerformanceStats] = useState<any>(null);
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [weakAreas, setWeakAreas] = useState<WeakArea[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [modulePerformance, setModulePerformance] = useState<any[]>([]);
  const [dailyProgress, setDailyProgress] = useState<any[]>([]);
  
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
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Safety check for auth - if user not available, show loading
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F5F5F5]">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <p className="text-gray-600 mb-4">Authenticating...</p>
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Safety check for required hooks - early return before rendering
  if (!filters || !navigate) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F5F5F5]">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <p className="text-gray-600 mb-4">Initializing...</p>
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch faculties and analytics on component mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        console.log('Starting initial data fetch');
        setError('');
        
        const [facultiesRes, analyticsRes] = await Promise.all([
          facultyAPI.getAll().catch(err => {
            console.error('Faculty fetch error:', err);
            return { data: { data: [] } };
          }),
          analyticsAPI.getDashboard().catch(err => {
            console.error('Analytics fetch error:', err);
            return { data: { success: false, data: {} } };
          })
        ]);
        
        console.log('Faculties response:', facultiesRes);
        setFaculties(facultiesRes?.data?.data || []);
        
        // Set analytics data
        console.log('Analytics response:', analyticsRes);
        if (analyticsRes?.data?.success && analyticsRes?.data?.data) {
          const data = analyticsRes.data.data as any;
          console.log('Setting performance stats:', data.overview);
          setPerformanceStats(data.overview || null);
          setRecentSessions(Array.isArray(data.recentActivity) ? data.recentActivity : []);
          setWeakAreas(Array.isArray(data.weakAreas) ? data.weakAreas : []);
          
          // Extract recommendations array from nested object structure
          const recs = Array.isArray(data.recommendations) 
            ? data.recommendations 
            : (data.recommendations?.recommendations || []);
          setRecommendations(Array.isArray(recs) ? recs : []);
          
          setModulePerformance(Array.isArray(data.modulePerformance) ? data.modulePerformance : []);
          setDailyProgress(Array.isArray(data.dailyProgress) ? data.dailyProgress : []);
        } else {
          console.warn('Analytics response not successful');
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching initial data:', error);
        setError('Failed to load dashboard data. Please refresh the page.');
        setLoading(false);
      } finally {
        setAnalyticsLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Auto-refresh analytics data every 30 seconds for real-time updates
  useEffect(() => {
    const refreshInterval = setInterval(async () => {
      try {
        const analyticsRes = await analyticsAPI.getDashboard().catch(err => {
          console.error('Analytics refresh error:', err);
          return { data: { success: false, data: {} } };
        });
        
        if (analyticsRes?.data?.success && analyticsRes?.data?.data) {
          const data = analyticsRes.data.data as any;
          setPerformanceStats(data.overview || null);
          setRecentSessions(Array.isArray(data.recentActivity) ? data.recentActivity : []);
          setWeakAreas(Array.isArray(data.weakAreas) ? data.weakAreas : []);
          
          // Extract recommendations array from nested object structure
          const recs = Array.isArray(data.recommendations) 
            ? data.recommendations 
            : (data.recommendations?.recommendations || []);
          setRecommendations(Array.isArray(recs) ? recs : []);
          
          setModulePerformance(Array.isArray(data.modulePerformance) ? data.modulePerformance : []);
          setDailyProgress(Array.isArray(data.dailyProgress) ? data.dailyProgress : []);
        }
      } catch (error) {
        console.error('Error refreshing analytics:', error);
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(refreshInterval);
  }, []);

  // Fetch modules based on selected faculty only (year filtering done client-side)
  useEffect(() => {
    const fetchModules = async () => {
      try {
        setLoading(true);
        const params: any = {};
        
        if (filters.facultyId !== 'all') {
          params.facultyId = parseInt(filters.facultyId);
        }
        // Don't include year in API params - filter client-side to preserve selection

        const response = await moduleAPI.getAll(params);
        setModules(response.data.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching modules:', error);
        setLoading(false);
      }
    };

    fetchModules();
  }, [filters.facultyId]); // Only depend on faculty, year changes don't need API refetch

  // Update available years when faculty changes
  useEffect(() => {
    if (modules.length === 0) return; // Skip if modules not loaded
    
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
      
      // Only reset year if current selection is invalid for this faculty
      if (filters.year !== 'all' && years.size > 0 && !years.has(parseInt(filters.year))) {
        filters.setYear('all');
      }
    }
  }, [filters.facultyId, modules]);

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
      // Search globally across all faculties, years, and modules
      const response = await searchAPI.semanticSearch({
        query: searchQuery,
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

  // Calculate performance metrics from real data
  const calculateMetrics = () => {
    try {
      if (!performanceStats) {
        return {
          totalModules: filteredModules.length,
          completedModules: 0,
          inProgress: filteredModules.length,
          averageScore: 0,
          totalAttempts: 0,
          correctAttempts: 0,
          accuracy: 0
        };
      }

      const averageScore = parseFloat(performanceStats.averageQuizScore) || 0;
      const accuracy = parseFloat(performanceStats.accuracy) || 0;

      return {
        totalModules: filteredModules.length,
        completedModules: 0,
        inProgress: Math.max(0, filteredModules.length),
        averageScore: isNaN(averageScore) ? 0 : Math.round(averageScore * 10) / 10,
        totalAttempts: performanceStats.totalAttempts || 0,
        correctAttempts: performanceStats.correctAttempts || 0,
        accuracy: isNaN(accuracy) ? 0 : Math.round(accuracy * 10) / 10
      };
    } catch (error) {
      console.error('Error calculating metrics:', error);
      return {
        totalModules: filteredModules.length,
        completedModules: 0,
        inProgress: filteredModules.length,
        averageScore: 0,
        totalAttempts: 0,
        correctAttempts: 0,
        accuracy: 0
      };
    }
  };

  // Group modules by year
  const modulesByYear = filteredModules.reduce((acc, module) => {
    const year = module.year || 1;
    if (!acc[year]) {
      acc[year] = [];
    }
    acc[year].push(module);
    return acc;
  }, {} as Record<number, Module[]>);

  const metrics = calculateMetrics();

  // Helper function to format date
  const formatDate = (dateString: string | Date | undefined | null) => {
    try {
      if (!dateString) return '-';
      
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return '-';
      }
      
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
      
      if (diffInHours < 1) {
        return 'Just now';
      } else if (diffInHours < 24) {
        return `${Math.floor(diffInHours)}h ago`;
      } else if (diffInHours < 48) {
        return 'Yesterday';
      } else {
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        });
      }
    } catch (error) {
      console.error('Error formatting date:', error);
      return '-';
    }
  };

  // Helper function to format time spent
  const formatTimeSpent = (seconds: number | undefined | null) => {
    try {
      if (!seconds || seconds <= 0) return '-';
      
      const minutes = Math.floor(seconds / 60);
      if (minutes < 1) return `${Math.round(seconds)}s`;
      if (minutes < 60) return `${minutes}m`;
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    } catch (error) {
      console.error('Error formatting time:', error);
      return '-';
    }
  };

  // Safe rendering function - converts any value to a safe string for JSX
  const safeRender = (value: any, fallback: string = '-'): string => {
    try {
      if (value === null || value === undefined) return fallback;
      if (typeof value === 'string') return value.trim() || fallback;
      if (typeof value === 'number') return String(value);
      if (typeof value === 'boolean') return String(value);
      if (Array.isArray(value)) return fallback;
      if (typeof value === 'object') return fallback;
      return String(value) || fallback;
    } catch (error) {
      console.error('Error in safeRender:', error, value);
      return fallback;
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
            onClick={() => navigate('/student/summaries')}
            className="w-full text-left px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg mb-1"
          >
            Summaries
          </button>
          <button 
            onClick={() => navigate('/student/learning-sites')}
            className="w-full text-left px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg mb-1"
          >
            Useful Learning Sites
          </button>
          <button 
            onClick={() => navigate('/student/settings')}
            className="w-full text-left px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg mb-1"
          >
            Settings
          </button>
          <button 
            onClick={() => logoutConfirm.openConfirm(logout)}
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
                placeholder="Search resources"
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
              className="bg-primary hover:bg-primary/90 text-white px-6"
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
                              <span className="px-2 py-1 bg-primary/20 text-primary text-xs font-medium rounded">
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
                              className="border-primary text-primary hover:bg-primary/10"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button
                              onClick={() => handleDownload(resource.id)}
                              className="bg-primary hover:bg-primary/90 text-white"
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
              <Card className="bg-primary/20 border-0">
                <CardContent className="p-6 text-center">
                  <p className="text-3xl font-bold text-gray-900 mb-2">{metrics.totalModules}</p>
                  <p className="text-gray-700 font-medium">Total Modules</p>
                </CardContent>
              </Card>
              <Card className="bg-primary/20 border-0">
                <CardContent className="p-6 text-center">
                  <p className="text-3xl font-bold text-gray-900 mb-2">{metrics.inProgress}</p>
                  <p className="text-gray-700 font-medium">In Progress</p>
                </CardContent>
              </Card>
              <Card className="bg-primary/20 border-0">
                <CardContent className="p-6 text-center">
                  <p className="text-3xl font-bold text-gray-900 mb-2">{metrics.accuracy}%</p>
                  <p className="text-gray-700 font-medium">Quiz Accuracy</p>
                </CardContent>
              </Card>
              <Card className="bg-primary/20 border-0">
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
                              className="bg-primary hover:bg-primary/90 text-white text-sm px-4 py-2 rounded-lg"
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

          {/* Bottom Grid: Recent Activity, MCQs History, Weak Areas */}
          {!showSearchResults && (
          <div className="grid grid-cols-2 gap-6 mb-8">
            {/* Recent Activity - Quiz Sessions */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Recent Quiz Sessions
              </h2>
              <Card className="border border-gray-200">
                <CardContent className="p-6">
                  {analyticsLoading ? (
                    <div className="text-center py-4 text-gray-500">Loading...</div>
                  ) : recentSessions.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">No quiz sessions yet. Start practicing!</div>
                  ) : (
                    <div className="space-y-3">
                      {recentSessions.slice(0, 5).map((session, idx) => (
                        <div key={idx} className="py-3 border-b border-gray-100 last:border-0">
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-sm font-semibold text-gray-900 flex-1">{safeRender(session.title, 'Quiz')}</span>
                            {session.module && (
                              <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded ml-2">
                                {safeRender(session.module)}
                              </span>
                            )}
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <div className="flex gap-4">
                              <span className="text-gray-600">
                                Score: <span className="font-semibold text-green-600">{session.correctAnswers || 0}/{session.totalQuestions || 0}</span>
                              </span>
                              {session.timeSpent ? (
                                <span className="text-gray-600">
                                  Time: <span className="font-semibold">{formatTimeSpent(session.timeSpent)}</span>
                                </span>
                              ) : null}
                            </div>
                            <span className="text-gray-500">{formatDate(session.date)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Weak Areas / Study Focus */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-red-600" />
                Areas to Focus
              </h2>
              <Card className="border border-gray-200">
                <CardContent className="p-6">
                  {analyticsLoading ? (
                    <div className="text-center py-4 text-gray-500">Loading...</div>
                  ) : weakAreas.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">Great! No weak areas identified yet.</div>
                  ) : (
                    <div className="space-y-3">
                      {weakAreas.slice(0, 5).map((area, idx) => {
                        const safeAccuracy = typeof area.accuracy === 'number' ? area.accuracy : 0;
                        const safeAccuracyPercent = Math.min(100, Math.max(0, safeAccuracy));
                        
                        return (
                          <div key={idx} className="py-3 border-b border-gray-100 last:border-0">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-gray-900">{safeRender(area.topic, 'Unknown')}</p>
                                {area.module && (
                                  <p className="text-xs text-gray-500">{safeRender(area.module)}</p>
                                )}
                              </div>
                              {area.difficulty && (
                                <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800 ml-2">
                                  {safeRender(area.difficulty)}
                                </span>
                              )}
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-red-500 h-2 rounded-full"
                                style={{ width: `${safeAccuracyPercent}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">Accuracy: {safeAccuracy.toFixed(1)}%</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
          )}

          {/* Study Recommendations */}
          {!showSearchResults && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Personalized Study Recommendations
            </h2>
            <Card className="border border-gray-200">
              <CardContent className="p-6">
                {analyticsLoading ? (
                  <div className="text-center py-4 text-gray-500">Loading...</div>
                ) : !recommendations || recommendations.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    Keep practicing to get personalized study recommendations!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recommendations.slice(0, 5).map((rec, idx) => (
                      <div key={idx} className="py-3 border-b border-gray-100 last:border-0 pl-3 border-l-4 border-l-primary">
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900">{safeRender(rec.topic, 'Study Area')}</p>
                            {rec.reason && (
                              <p className="text-xs text-gray-600 mt-1">{safeRender(rec.reason)}</p>
                            )}
                            {rec.suggestedActions && Array.isArray(rec.suggestedActions) && rec.suggestedActions.length > 0 && (
                              <ul className="text-xs text-gray-600 mt-2 ml-4 list-disc">
                                {rec.suggestedActions.slice(0, 2).map((action, i) => (
                                  <li key={i}>{safeRender(action)}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                          <span className={`text-xs font-semibold px-2 py-1 rounded whitespace-nowrap ${
                            rec.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                            rec.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {safeRender(rec.priority, 'MEDIUM')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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

      {/* Logout Confirmation Dialog */}
      <LogoutConfirmDialog
        isOpen={logoutConfirm.isOpen}
        onConfirm={logoutConfirm.onConfirm}
        onCancel={logoutConfirm.onCancel}
        isLoading={logoutConfirm.isLoading}
      />
    </div>
  );
}
