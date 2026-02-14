/**
 * Admin Overview/Dashboard Page
 * Shows stats, recent activity, and quick actions
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { resourceAPI, moduleAPI, facultyAPI, Resource, Faculty } from '../../services/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import UploadResourceDialog from '../components/UploadResourceDialog';
import { toast } from 'sonner';
import { 
  FileText, 
  BookOpen, 
  Users, 
  TrendingUp, 
  Clock, 
  Upload,
  Download,
  Eye,
  Calendar
} from 'lucide-react';

interface Module {
  id: number;
  name: string;
  code: string;
  facultyId: number;
}

export default function AdminOverview() {
  const navigate = useNavigate();
  const [resources, setResources] = useState<Resource[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resourcesRes, modulesRes, facultiesRes] = await Promise.all([
        resourceAPI.getAll(),
        moduleAPI.getAll(),
        facultyAPI.getAll()
      ]);
      
      setResources(resourcesRes.data.data || []);
      setModules(modulesRes.data.data || []);
      setFaculties(facultiesRes.data.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = () => {
    toast.success('Resource uploaded successfully!');
    fetchData();
  };

  // Calculate stats
  const recentResources = resources.filter(r => {
    const uploadDate = new Date(r.createdAt);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return uploadDate > yesterday;
  }).length;

  const thisWeekResources = resources.filter(r => {
    const uploadDate = new Date(r.createdAt);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return uploadDate > weekAgo;
  }).length;

  // Get resource distribution by faculty
  const resourcesByFaculty = faculties.map(faculty => ({
    name: faculty.name,
    code: faculty.code,
    count: resources.filter(r => r.facultyId === faculty.id).length
  })).sort((a, b) => b.count - a.count);

  // Get recent uploads (last 10)
  const recentUploads = [...resources]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
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
  };

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Overview of your college's academic resources</p>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3 mb-6">
        <Button 
          className="bg-[#A8C5B5] hover:bg-[#96B5A5] text-white"
          onClick={() => setUploadDialogOpen(true)}
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload Resource
        </Button>
        <Button 
          variant="outline"
          onClick={() => navigate('/admin/modules')}
        >
          <BookOpen className="h-4 w-4 mr-2" />
          Manage Modules
        </Button>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin/resources')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Total Resources</h3>
            <p className="text-3xl font-bold text-gray-900 mb-2">{resources.length}</p>
            <p className="text-xs text-gray-500">Across all modules</p>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin/modules')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Active Modules</h3>
            <p className="text-3xl font-bold text-gray-900 mb-2">{modules.length}</p>
            <p className="text-xs text-gray-500">In {faculties.length} faculties</p>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Last 24 Hours</h3>
            <p className="text-3xl font-bold text-gray-900 mb-2">{recentResources}</p>
            <p className="text-xs text-gray-500">New uploads</p>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">This Week</h3>
            <p className="text-3xl font-bold text-gray-900 mb-2">{thisWeekResources}</p>
            <p className="text-xs text-gray-500">Resources added</p>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Recent Activity */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-lg font-semibold">Recent Uploads</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading...</div>
            ) : recentUploads.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No recent uploads</div>
            ) : (
              <div className="divide-y">
                {recentUploads.map((resource) => (
                  <div key={resource.id} className="p-4 hover:bg-gray-50 cursor-pointer" onClick={() => navigate('/admin/resources')}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                          <FileText className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">{resource.title}</h4>
                          <p className="text-xs text-gray-500">{resource.module?.name || 'No module'}</p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                        {formatDate(resource.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resources by Faculty */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-lg font-semibold">Resources by Faculty</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading...</div>
            ) : resourcesByFaculty.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No data available</div>
            ) : (
              <div className="divide-y">
                {resourcesByFaculty.map((faculty, idx) => (
                  <div key={idx} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{faculty.name}</h4>
                        <p className="text-xs text-gray-500">{faculty.code}</p>
                      </div>
                      <span className="text-lg font-bold text-[#A8C5B5]">{faculty.count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-[#A8C5B5] h-2 rounded-full transition-all"
                        style={{ width: `${(faculty.count / resources.length) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">PDF Documents</p>
                <p className="text-2xl font-bold text-gray-900">
                  {resources.filter(r => r.fileType.toLowerCase() === 'pdf').length}
                </p>
              </div>
              <FileText className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Image Files</p>
                <p className="text-2xl font-bold text-gray-900">
                  {resources.filter(r => ['jpg', 'jpeg', 'png', 'gif'].includes(r.fileType.toLowerCase())).length}
                </p>
              </div>
              <Eye className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Other Files</p>
                <p className="text-2xl font-bold text-gray-900">
                  {resources.filter(r => !['pdf', 'jpg', 'jpeg', 'png', 'gif'].includes(r.fileType.toLowerCase())).length}
                </p>
              </div>
              <Download className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upload Dialog */}
      <UploadResourceDialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
}
