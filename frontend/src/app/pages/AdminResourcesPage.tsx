/**
 * Admin Resources Management Page
 * View, filter, sort, and manage all resources with pagination
 */

import { useState, useEffect } from 'react';
import { resourceAPI, facultyAPI, moduleAPI, Resource, Faculty } from '../../services/api';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
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
  const [resources, setResources] = useState<Resource[]>([]);
  const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  
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

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [resources, searchQuery, filterFaculty, filterYear, filterModule, filterFileType, sortField, sortOrder]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resourcesRes, facultiesRes, modulesRes] = await Promise.all([
        resourceAPI.getAll(),
        facultyAPI.getAll(),
        moduleAPI.getAll()
      ]);
      
      setResources(resourcesRes.data.data || []);
      setFaculties(facultiesRes.data.data || []);
      setModules(modulesRes.data.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load resources');
    } finally {
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
    if (!window.confirm('Are you sure you want to delete this resource?')) {
      return;
    }

    try {
      await resourceAPI.delete(id);
      toast.success('Resource deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting resource:', error);
      toast.error('Failed to delete resource');
    }
  };

  const handleUploadSuccess = () => {
    toast.success('Resource uploaded successfully!');
    fetchData();
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
                className="w-full bg-[#A8C5B5] hover:bg-[#96B5A5] text-white"
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
                            className="inline-flex items-center px-2 py-1 text-xs border border-[#A8C5B5] text-[#6B9080] hover:bg-[#A8C5B5]/10 rounded transition-colors"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </button>
                          <button
                            onClick={() => handleDownload(resource.id)}
                            className="inline-flex items-center px-2 py-1 text-xs bg-[#A8C5B5] hover:bg-[#96B5A5] text-white rounded transition-colors"
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Download
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
    </div>
  );
}
