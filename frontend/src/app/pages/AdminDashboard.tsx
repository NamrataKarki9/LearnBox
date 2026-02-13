/**
 * College Admin Dashboard
 * College-scoped access - manage resources and MCQs for assigned college only
 */

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { resourceAPI, moduleAPI } from '../../services/api';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import UploadResourceDialog from '../components/UploadResourceDialog';
import { toast } from 'sonner';

interface Resource {
  id: number;
  title: string;
  description?: string;
  fileUrl: string;
  fileType: string;
  year?: number;
  moduleId?: number;
  createdAt: string;
  module?: {
    id: number;
    name: string;
    code: string;
  };
  uploader?: {
    id: number;
    username: string;
    first_name?: string;
    last_name?: string;
  };
}

interface Module {
  id: number;
  code: string;
  name: string;
  description?: string;
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const resourcesSectionRef = useRef<HTMLDivElement>(null);

  // Fetch resources and modules on mount
  useEffect(() => {
    fetchData();
  }, []);

  const scrollToResources = () => {
    resourcesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resourcesRes, modulesRes] = await Promise.all([
        resourceAPI.getAll(),
        moduleAPI.getAll()
      ]);
      
      setResources(resourcesRes.data.data || []);
      setModules(modulesRes.data.data || []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = () => {
    toast.success('Resource uploaded successfully!');
    fetchData(); // Refresh resources list
  };

  const handleDeleteResource = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this resource?')) {
      return;
    }

    try {
      await resourceAPI.delete(id);
      toast.success('Resource deleted successfully');
      fetchData();
    } catch (error: any) {
      console.error('Error deleting resource:', error);
      toast.error('Failed to delete resource');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
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

  return (
    <div className="flex min-h-screen bg-[#F5F5F5]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-bold text-gray-900">LearnBox</h1>
        </div>
        <nav className="flex-1 px-4">
          <button className="w-full text-left px-4 py-3 text-gray-900 bg-gray-100 rounded-lg font-medium mb-1">
            Admin Dashboard
          </button>
          <button 
            onClick={scrollToResources}
            className="w-full text-left px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg mb-1"
          >
            Manage Resources
          </button>
          <button className="w-full text-left px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg mb-1">
            Manage Modules
          </button>
          <button className="w-full text-left px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg mb-1">
            Summaries
          </button>
          <button className="w-full text-left px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg mb-1">
            Profile
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
          <div className="flex-1 text-center">
            <h1 className="text-xl font-bold text-gray-900">LearnBox</h1>
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>
        </header>

        <div className="p-8">
          {/* Page Title */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">College Admin Dashboard</h1>
          </div>

          {/* Add Resource Button */}
          <div className="flex gap-3 mb-8">
            <Button 
              className="bg-[#A8C5B5] hover:bg-[#96B5A5] text-white px-6 py-2 rounded-lg"
              onClick={() => setUploadDialogOpen(true)}
            >
              + Add new Resources
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            <Card className="border border-gray-200">
              <CardContent className="p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Total Resource</h3>
                <p className="text-4xl font-bold text-gray-900 mb-2">{resources.length}</p>
                <p className="text-sm text-gray-600 mb-4">Across all modules and years</p>
                <Button 
                  className="bg-[#A8C5B5] hover:bg-[#96B5A5] text-white text-sm px-4 py-2 rounded-lg w-full"
                  onClick={() => fetchData()}
                >
                  Refresh
                </Button>
              </CardContent>
            </Card>
            <Card className="border border-gray-200">
              <CardContent className="p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Total Modules</h3>
                <p className="text-4xl font-bold text-gray-900 mb-2">{modules.length}</p>
                <p className="text-sm text-gray-600">Active modules in your college</p>
              </CardContent>
            </Card>
            <Card className="border border-gray-200">
              <CardContent className="p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Recent Activity</h3>
                <p className="text-4xl font-bold text-gray-900 mb-2">
                  {resources.filter(r => {
                    const uploadDate = new Date(r.createdAt);
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    return uploadDate > yesterday;
                  }).length}
                </p>
                <p className="text-sm text-gray-600">Last 24 hours</p>
              </CardContent>
            </Card>
          </div>

          {/* Manage Academic Resources */}
          <div ref={resourcesSectionRef} className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Manage Academic Resources</h2>
            <Card className="border border-gray-200">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Title</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Module</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Year</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Upload Date</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Uploaded By</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {loading ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                            Loading resources...
                          </td>
                        </tr>
                      ) : resources.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                            No resources found. Click "+ Add New Resource" to upload your first resource.
                          </td>
                        </tr>
                      ) : (
                        resources.map((resource) => (
                          <tr key={resource.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm text-gray-900">
                              <a 
                                href={resourceAPI.getDownloadUrl(resource.id)}
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="hover:text-[#A8C5B5] hover:underline"
                              >
                                {resource.title}
                              </a>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {resource.module ? `${resource.module.code}` : 'N/A'}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600 uppercase">
                              {resource.fileType}
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
                              <a 
                                href={resourceAPI.getDownloadUrl(resource.id)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#A8C5B5] hover:text-[#96B5A5] mr-3"
                              >
                                View
                              </a>
                              <button 
                                onClick={() => handleDeleteResource(resource.id)}
                                className="text-red-400 hover:text-red-600"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 flex justify-end border-t border-gray-200">
                  <Button 
                    className="bg-[#A8C5B5] hover:bg-[#96B5A5] text-white text-sm px-4 py-2 rounded-lg"
                    onClick={() => setUploadDialogOpen(true)}
                  >
                    + Add New Resource
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Manage College Modules */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Manage College Modules</h2>
            <Card className="border border-gray-200">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Code</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Description</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Resources</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {loading ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                            Loading modules...
                          </td>
                        </tr>
                      ) : modules.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                            No modules found.
                          </td>
                        </tr>
                      ) : (
                        modules.map((module) => (
                          <tr key={module.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm text-gray-900 font-medium">{module.code}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">{module.name}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {module.description || 'No description'}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {resources.filter(r => r.moduleId === module.id).length}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <button className="text-[#A8C5B5] hover:text-[#96B5A5] mr-3">View</button>
                              <button className="text-gray-400 hover:text-gray-600">Edit</button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Upload Resource Dialog */}
        <UploadResourceDialog
          open={uploadDialogOpen}
          onClose={() => setUploadDialogOpen(false)}
          onSuccess={handleUploadSuccess}
        />

        {/* Footer */}
        <footer className="bg-[#D5E3DF] py-6">
          <div className="text-center text-sm text-gray-600">
            2025 LearnBox. All rights reserved.
          </div>
        </footer>
      </main>
    </div>
  );
}
