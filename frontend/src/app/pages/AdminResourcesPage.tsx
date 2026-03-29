/**
 * Admin Resources Management Page
 * View, filter, sort, and manage all resources with pagination
 */

import { useState, useEffect } from 'react';
import { resourceAPI, facultyAPI, moduleAPI, Resource, Faculty } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import UploadResourceDialog from '../components/UploadResourceDialog';
import { toast } from 'sonner';
import { Eye, Download, Trash2, Upload, ChevronLeft, ChevronRight, Search, Filter } from 'lucide-react';

interface Module {
  id: number;
  name: string;
  code: string;
  year: number;
  facultyId: number;
}

export default function AdminResourcesPage() {
  const { user } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [isFetching, setIsFetching] = useState(false); // Prevent concurrent fetches
  
  // Upload dialog
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFaculty, setFilterFaculty] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>('all');
  const [filterModule, setFilterModule] = useState<string>('all');
  const [filterFileType, setFilterFileType] = useState<string>('all');
  
  // Sorting
  const [sortField, setSortField] = useState<'title' | 'createdAt' | 'fileType'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Viewer state
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewingResource, setViewingResource] = useState<{ url: string; title: string } | null>(null);
  
  // Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteConfirmResourceId, setDeleteConfirmResourceId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Edit resource state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [editFormData, setEditFormData] = useState({ 
    title: '', 
    description: '', 
    year: '',
    facultyId: '',
    moduleId: ''
  });
  const [editAvailableModules, setEditAvailableModules] = useState<Module[]>([]);
  const [editFile, setEditFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [resources, searchQuery, filterFaculty, filterYear, filterModule, filterFileType, sortField, sortOrder]);

  // Fetch modules when both editFormData.facultyId and editFormData.year are selected
  useEffect(() => {
    if (editDialogOpen && editFormData.facultyId && editFormData.year) {
      fetchEditModules(parseInt(editFormData.facultyId), parseInt(editFormData.year));
    }
  }, [editFormData.facultyId, editFormData.year, editDialogOpen]);

  const fetchData = async (retryCount = 0, maxRetries = 3) => {
    // Prevent concurrent fetches
    if (isFetching) {
      console.log('Fetch already in progress, skipping...');
      return;
    }

    setIsFetching(true);
    // Only show loading spinner on initial load, not on refetch
    if (resources.length === 0) {
      setLoading(true);
    }
    setError('');
    try {
      // Check user and collegeId
      if (!user?.collegeId) {
        toast.error('Unable to load resources: No college assigned');
        setIsFetching(false);
        setLoading(false);
        return;
      }

      console.log('🔄 Fetching resources for college:', user.collegeId);
      
      // Fetch resources and faculties (critical)
      const [resourcesRes, facultiesRes] = await Promise.all([
        resourceAPI.getAll(),  // Backend automatically filters by collegeId for non-SUPER_ADMIN
        facultyAPI.getAll({ collegeId: user.collegeId })
      ]);
      
      console.log('✅ Resources fetched:', resourcesRes.data.data?.length || 0);
      console.log('✅ Faculties fetched:', facultiesRes.data.data?.length || 0);
      
      setResources(resourcesRes.data.data || []);
      setFaculties(facultiesRes.data.data || []);
      setError('');
      
      // Fetch modules separately (optional - not critical for the page)
      try {
        const modulesRes = await moduleAPI.getAll({ collegeId: user.collegeId });
        setModules(modulesRes.data.data || []);
      } catch (moduleError) {
        console.warn('Warning: Failed to load modules, proceeding without them:', moduleError);
        setModules([]);
      }
    } catch (error: any) {
      console.error(`Error fetching (attempt ${retryCount + 1}/${maxRetries + 1}):`, error);
      
      // Retry with exponential backoff
      if (retryCount < maxRetries) {
        const delayMs = Math.pow(2, retryCount) * 500;
        setTimeout(() => {
          setIsFetching(false);
          fetchData(retryCount + 1, maxRetries);
        }, delayMs);
        return;
      }
      
      // Failed after all retries
      const errorMsg = 'Failed to load resources. Please try again.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsFetching(false);
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...resources];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        r.title.toLowerCase().includes(query) ||
        r.description?.toLowerCase().includes(query) ||
        r.module?.name.toLowerCase().includes(query)
      );
    }
    
    // Faculty filter
    if (filterFaculty !== 'all') {
      filtered = filtered.filter(r => r.facultyId === parseInt(filterFaculty));
    }
    
    // Year filter
    if (filterYear !== 'all') {
      filtered = filtered.filter(r => r.year === parseInt(filterYear));
    }
    
    // Module filter
    if (filterModule !== 'all') {
      filtered = filtered.filter(r => r.moduleId === parseInt(filterModule));
    }
    
    // File type filter
    if (filterFileType !== 'all') {
      filtered = filtered.filter(r => r.fileType.toLowerCase() === filterFileType.toLowerCase());
    }
    
    // Sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'fileType':
          aValue = a.fileType.toLowerCase();
          bValue = b.fileType.toLowerCase();
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    setFilteredResources(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleSort = (field: 'title' | 'createdAt' | 'fileType') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleView = (resource: Resource) => {
    try {
      const viewUrl = resourceAPI.getDownloadUrl(resource.id);
      setViewingResource({ url: viewUrl, title: resource.title });
      setViewerOpen(true);
    } catch (error) {
      console.error('View error:', error);
      toast.error('Failed to open resource viewer');
    }
  };

  const handleDownload = (resourceId: number) => {
    try {
      const downloadUrl = resourceAPI.getDownloadUrl(resourceId);
      window.open(downloadUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download resource');
    }
  };

  const handleDelete = async (id: number) => {
    setDeleteConfirmResourceId(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmResourceId) return;
    
    setIsDeleting(true);
    try {
      await resourceAPI.delete(deleteConfirmResourceId);
      toast.success('Resource deleted successfully');
      setDeleteConfirmOpen(false);
      setDeleteConfirmResourceId(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting resource:', error);
      toast.error('Failed to delete resource');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (resource: Resource) => {
    setEditingResource(resource);
    setEditFormData({
      title: resource.title,
      description: resource.description || '',
      year: resource.year?.toString() || '',
      facultyId: resource.facultyId?.toString() || '',
      moduleId: resource.moduleId?.toString() || ''
    });
    
    // Filter modules based on selected faculty
    if (resource.facultyId) {
      const filteredModules = modules.filter(m => m.facultyId === resource.facultyId);
      setEditAvailableModules(filteredModules);
    } else {
      setEditAvailableModules([]);
    }
    
    setEditDialogOpen(true);
  };

  const handleEditFacultyChange = (facultyId: string) => {
    setEditFormData({ ...editFormData, facultyId, year: '', moduleId: '' });
    setEditAvailableModules([]);
  };

  const fetchEditModules = async (facultyId: number, year: number) => {
    try {
      const response = await moduleAPI.getByFacultyAndYear(facultyId, year);
      setEditAvailableModules(response.data.data || []);
    } catch (err) {
      console.error('Error fetching modules for edit:', err);
      setEditAvailableModules([]);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingResource) return;
    
    if (!editFormData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (!editFormData.facultyId) {
      toast.error('Faculty is required');
      return;
    }

    if (!editFormData.moduleId) {
      toast.error('Module is required');
      return;
    }

    if (!editFormData.year) {
      toast.error('Year is required');
      return;
    }

    setIsSaving(true);
    try {
      let fileUrl = editingResource.fileUrl; // Keep existing file URL if no new file
      let fileType = editingResource.fileType; // Keep existing file type if no new file

      // If a new file is selected, upload it first
      if (editFile) {
        const allowedTypes = ['application/pdf', 'application/msword', 
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation'];
        
        if (!allowedTypes.includes(editFile.type)) {
          toast.error('Only PDF, DOC, DOCX, PPT, PPTX files are allowed');
          setIsSaving(false);
          return;
        }

        if (editFile.size > 10 * 1024 * 1024) {
          toast.error('File size must be less than 10MB');
          setIsSaving(false);
          return;
        }

        // Upload new file
        const uploadData = new FormData();
        uploadData.append('file', editFile);
        uploadData.append('title', editFormData.title);
        uploadData.append('facultyId', editFormData.facultyId);
        uploadData.append('year', editFormData.year);
        uploadData.append('moduleId', editFormData.moduleId);
        
        if (editFormData.description) {
          uploadData.append('description', editFormData.description);
        }

        try {
          const uploadResponse = await resourceAPI.upload(uploadData);
          fileUrl = uploadResponse.data.data.fileUrl;
          fileType = uploadResponse.data.data.fileType;
          
          // Delete old resource after successful new upload
          await resourceAPI.delete(editingResource.id);
          
          toast.success('Resource updated and file replaced successfully');
          setEditDialogOpen(false);
          setEditingResource(null);
          setEditFile(null);
          fetchData();
          return;
        } catch (uploadError) {
          console.error('Error uploading new file:', uploadError);
          toast.error('Failed to upload new file');
          setIsSaving(false);
          return;
        }
      }

      // Update without file replacement
      await resourceAPI.update(editingResource.id, {
        title: editFormData.title,
        description: editFormData.description,
        year: editFormData.year ? parseInt(editFormData.year) : null,
        facultyId: editFormData.facultyId ? parseInt(editFormData.facultyId) : null,
        moduleId: editFormData.moduleId ? parseInt(editFormData.moduleId) : null,
        fileUrl: fileUrl,
        fileType: fileType
      });
      toast.success('Resource updated successfully');
      setEditDialogOpen(false);
      setEditingResource(null);
      setEditFile(null);
      fetchData();
    } catch (error) {
      console.error('Error updating resource:', error);
      toast.error('Failed to update resource');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadSuccess = () => {
    // Close dialog immediately
    setUploadDialogOpen(false);
    
    // Show success message once
    toast.success('Resource uploaded successfully!');
    
    // Brief delay for backend processing, then fetch
    setTimeout(() => {
      setIsFetching(false); // Reset fetch flag
      fetchData();
    }, 1500);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getUploaderName = (resource: Resource) => {
    if (resource.uploader) {
      const { first_name, last_name, username } = resource.uploader;
      if (first_name || last_name) {
        return `${first_name || ''} ${last_name || ''}`.trim();
      }
      return username;
    }
    return 'Unknown';
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredResources.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedResources = filteredResources.slice(startIndex, endIndex);
  
  const fileTypes = [...new Set(resources.map(r => r.fileType))];
  const allYears = [...new Set(resources.map(r => r.year).filter(Boolean))].sort();
  // Ensure Year 1, 2, 3 are always available
  const years = Array.from(new Set([1, 2, 3, ...allYears])).sort();

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Resource Management</h1>
        <p className="text-gray-600">View, upload, and manage all academic resources</p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="text-red-600 font-bold">⚠️</div>
            <div>
              <p className="text-sm font-medium text-red-900">{error}</p>
              <button
                onClick={() => fetchData()}
                className="text-xs text-red-600 hover:text-red-700 font-medium mt-1 underline"
              >
                Retry
              </button>
            </div>
          </div>
          <button
            onClick={() => setError('')}
            className="text-red-400 hover:text-red-600 text-lg"
          >
            ✕
          </button>
        </div>
      )}

      {/* Stats Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Total Resources</p>
            <p className="text-2xl font-bold text-gray-900">{resources.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Filtered Results</p>
            <p className="text-2xl font-bold text-blue-600">{filteredResources.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Showing</p>
            <p className="text-2xl font-bold text-green-600">
              {startIndex + 1}-{Math.min(endIndex, filteredResources.length)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search resources..."
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

            {/* Year Filter */}
            <div>
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#A8C5B5]"
              >
                <option value="all">All Years</option>
                {years.map(y => (
                  <option key={y} value={y}>Year {y}</option>
                ))}
              </select>
            </div>

            {/* File Type Filter */}
            <div>
              <select
                value={filterFileType}
                onChange={(e) => setFilterFileType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#A8C5B5]"
              >
                <option value="all">All Types</option>
                {fileTypes.map(type => (
                  <option key={type} value={type}>{type.toUpperCase()}</option>
                ))}
              </select>
            </div>

            {/* Upload Button */}
            <div>
              <Button
                onClick={() => setUploadDialogOpen(true)}
                className="w-full bg-primary hover:bg-primary/90 text-white"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resources Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th
                    onClick={() => handleSort('title')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    Title {sortField === 'title' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Module
                  </th>
                  <th
                    onClick={() => handleSort('fileType')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    Type {sortField === 'fileType' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Year
                  </th>
                  <th
                    onClick={() => handleSort('createdAt')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    Uploaded {sortField === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Uploader
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
                      Loading resources...
                    </td>
                  </tr>
                ) : paginatedResources.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No resources found
                    </td>
                  </tr>
                ) : (
                  paginatedResources.map((resource) => (
                    <tr key={resource.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{resource.title}</div>
                          {resource.description && (
                            <div className="text-xs text-gray-500 truncate max-w-xs">
                              {resource.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {resource.module?.code || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <Badge variant="outline">{resource.fileType.toUpperCase()}</Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {resource.year ? `Year ${resource.year}` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(resource.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {getUploaderName(resource)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleView(resource)}
                            className="inline-flex items-center px-2 py-1 text-xs border border-primary text-primary hover:bg-primary/10 rounded transition-colors"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </button>
                          <button
                            onClick={() => handleDownload(resource.id)}
                            className="inline-flex items-center px-2 py-1 text-xs bg-primary hover:bg-primary/90 text-white rounded transition-colors"
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </button>
                          <button
                            onClick={() => handleEdit(resource)}
                            className="inline-flex items-center px-2 py-1 text-xs border border-blue-500 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(resource.id)}
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
          {filteredResources.length > 0 && (
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
                  <option value={100}>100</option>
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
      <UploadResourceDialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        onSuccess={handleUploadSuccess}
      />

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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Resource</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to delete this resource? This action cannot be undone.
            </p>
          </div>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setDeleteConfirmResourceId(null);
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Resource Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onOpenChange={(open) => {
          if (!open) {
            setEditFile(null);
          }
          setEditDialogOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Edit Resource</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={(e) => { e.preventDefault(); handleSaveEdit(); }} className="space-y-4">
            {/* Title */}
            <div>
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={editFormData.title}
                onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                placeholder="Enter resource title"
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
                placeholder="Enter resource description (optional)"
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

            {/* File Upload (Optional) */}
            <div>
              <Label htmlFor="edit-file">Replace File (Optional)</Label>
              <Input
                id="edit-file"
                type="file"
                onChange={(e) => setEditFile(e.target.files?.[0] || null)}
                accept=".pdf,.doc,.docx,.ppt,.pptx"
                disabled={isSaving}
              />
              <p className="text-xs text-gray-500 mt-1">
                Allowed: PDF, DOC, DOCX, PPT, PPTX (Max 10MB)
              </p>
              {editFile && (
                <p className="text-sm text-green-600 mt-1">
                  Selected: {editFile.name} ({(editFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditDialogOpen(false);
                  setEditingResource(null);
                  setEditFile(null);
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
