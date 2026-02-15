/**
 * Student Resources Page
 * Students can filter and view resources by Faculty, Year, and Module
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useFilters } from '../../context/FilterContext';
import { useNavigate } from 'react-router-dom';
import { resourceAPI, facultyAPI, type Resource, type Faculty } from '../../services/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Download, FileText, Book, GraduationCap, Eye, X } from 'lucide-react';

export default function StudentResourcesPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const filters = useFilters();
  
  const [resources, setResources] = useState<Resource[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Resource viewer state
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewingResource, setViewingResource] = useState<{ url: string; title: string } | null>(null);

  // Fetch faculties on mount for display
  useEffect(() => {
    fetchFaculties();
  }, []);

  // Fetch resources when filters change
  useEffect(() => {
    fetchResources();
  }, [filters.facultyId, filters.year, filters.moduleId]);

  const fetchFaculties = async () => {
    try {
      const response = await facultyAPI.getAll();
      setFaculties(response.data.data || []);
    } catch (err) {
      console.error('Error fetching faculties:', err);
    }
  };



  const fetchResources = async () => {
    setLoading(true);
    setError('');
    
    try {
      const params: any = {};
      
      if (filters.facultyId !== 'all') params.facultyId = parseInt(filters.facultyId);
      if (filters.year !== 'all') params.year = parseInt(filters.year);
      if (filters.moduleId !== 'all') params.moduleId = parseInt(filters.moduleId);
      
      const response = await resourceAPI.filter(params);
      setResources(response.data.data || []);
    } catch (err: any) {
      console.error('Error fetching resources:', err);
      setError(err.response?.data?.error || 'Failed to fetch resources');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (resourceId: number) => {
    try {
      // Use the backend proxy URL which forces correct headers
      const downloadUrl = resourceAPI.getDownloadUrl(resourceId);
      window.open(downloadUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  const handleView = (resource: Resource) => {
    try {
      // Use the backend proxy URL which serves the resource
      const viewUrl = resourceAPI.getDownloadUrl(resource.id);
      setViewingResource({ url: viewUrl, title: resource.title });
      setViewerOpen(true);
    } catch (error) {
      console.error('View error:', error);
    }
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

  // Get current filter display names
  const getFilterDisplayNames = () => {
    const faculty = faculties.find(f => f.id.toString() === filters.facultyId);
    return {
      faculty: faculty ? faculty.name : 'All Faculties',
      year: filters.year !== 'all' ? `Year ${filters.year}` : 'All Years',
      module: resources[0]?.module?.name || (filters.moduleId !== 'all' ? 'Selected Module' : 'All Modules')
    };
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
          <button className="w-full text-left px-4 py-3 text-gray-900 bg-gray-100 rounded-lg font-medium mb-1">
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
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Learning Resources</h1>
            <p className="text-gray-600">Browse and download study materials for your courses</p>
          </div>

          {/* Current Selection Display */}
          <Card className="mb-6 bg-gradient-to-r from-[#A8C5B5]/10 to-[#D5E3DF]/10 border-[#A8C5B5]/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <Book className="h-5 w-5 text-[#6B9080]" />
                  <span className="text-sm font-medium text-gray-700">Viewing resources for:</span>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="secondary" className="bg-[#A8C5B5] text-white hover:bg-[#96B5A5] px-3 py-1">
                      {getFilterDisplayNames().faculty}
                    </Badge>
                    <Badge variant="secondary" className="bg-[#A8C5B5] text-white hover:bg-[#96B5A5] px-3 py-1">
                      {getFilterDisplayNames().year}
                    </Badge>
                    {filters.moduleId !== 'all' && (
                      <Badge variant="secondary" className="bg-[#A8C5B5] text-white hover:bg-[#96B5A5] px-3 py-1">
                        {getFilterDisplayNames().module}
                      </Badge>
                    )}
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
                  💡 Change your selection from the Dashboard to view different resources
                </p>
              )}
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
                    {filters.facultyId !== 'all' || filters.year !== 'all' || filters.moduleId !== 'all'
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
                        
                        <div className="flex items-center justify-between mt-4">
                          <span className="text-xs text-gray-500">
                            {formatDate(resource.createdAt)}
                          </span>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleView(resource)}
                              className="border-[#A8C5B5] text-[#6B9080] hover:bg-[#A8C5B5]/10"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleDownload(resource.id)}
                              className="bg-[#A8C5B5] hover:bg-[#96B5A5] text-white"
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                          </div>
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
