/**
 * Admin Modules Management Page
 * Create, Edit, Delete, and view modules grouped by Faculty and Year
 */

import { useState, useEffect } from 'react';
import { moduleAPI, facultyAPI, Faculty, Module as APIModule } from '../../services/api';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, ChevronDown, ChevronRight, Search, BookOpen } from 'lucide-react';

// Use API Module type directly
type Module = APIModule;

interface GroupedModules {
  [facultyId: string]: {
    faculty: Faculty;
    years: {
      [year: string]: Module[];
    };
  };
}

export default function AdminModulesPage() {
  const [modules, setModules] = useState<Module[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Grouping state
  const [expandedFaculties, setExpandedFaculties] = useState<Set<number>>(new Set());
  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set());
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    year: 1,
    facultyId: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [modulesRes, facultiesRes] = await Promise.all([
        moduleAPI.getAll(),
        facultyAPI.getAll()
      ]);
      
      setModules(modulesRes.data.data || []);
      setFaculties(facultiesRes.data.data || []);
      
      // Expand all faculties by default
      setExpandedFaculties(new Set(facultiesRes.data.data.map((f: Faculty) => f.id)));
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load modules');
    } finally {
      setLoading(false);
    }
  };

  const groupModulesByFacultyAndYear = (): GroupedModules => {
    const grouped: GroupedModules = {};
    
    const filteredModules = modules.filter(module => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        module.name.toLowerCase().includes(query) ||
        module.code.toLowerCase().includes(query) ||
        module.description?.toLowerCase().includes(query)
      );
    });
    
    filteredModules.forEach(module => {
      const facultyId = module.facultyId.toString();
      const year = module.year.toString();
      
      if (!grouped[facultyId]) {
        const faculty = faculties.find(f => f.id === module.facultyId);
        grouped[facultyId] = {
          faculty: faculty || { id: module.facultyId, name: 'Unknown Faculty', code: 'UNK', collegeId: 0 },
          years: {}
        };
      }
      
      if (!grouped[facultyId].years[year]) {
        grouped[facultyId].years[year] = [];
      }
      
      grouped[facultyId].years[year].push(module);
    });
    
    return grouped;
  };

  const toggleFaculty = (facultyId: number) => {
    const newExpanded = new Set(expandedFaculties);
    if (newExpanded.has(facultyId)) {
      newExpanded.delete(facultyId);
    } else {
      newExpanded.add(facultyId);
    }
    setExpandedFaculties(newExpanded);
  };

  const toggleYear = (facultyId: number, year: string) => {
    const key = `${facultyId}-${year}`;
    const newExpanded = new Set(expandedYears);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedYears(newExpanded);
  };

  const handleCreateModule = async () => {
    if (!formData.name || !formData.code || !formData.facultyId) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      // API call would go here - for now simulate success
      toast.success('Module created successfully');
      setCreateDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error creating module:', error);
      toast.error('Failed to create module');
    }
  };

  const handleEditModule = (module: Module) => {
    setEditingModule(module);
    setFormData({
      name: module.name,
      code: module.code,
      description: module.description || '',
      year: module.year,
      facultyId: module.facultyId
    });
    setEditDialogOpen(true);
  };

  const handleUpdateModule = async () => {
    if (!editingModule) return;

    try {
      // API call would go here
      toast.success('Module updated successfully');
      setEditDialogOpen(false);
      setEditingModule(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error updating module:', error);
      toast.error('Failed to update module');
    }
  };

  const handleDeleteModule = async (module: Module) => {
    if (!window.confirm(`Are you sure you want to delete "${module.name}"?`)) {
      return;
    }

    try {
      // API call would go here
      toast.success('Module deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting module:', error);
      toast.error('Failed to delete module');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      year: 1,
      facultyId: 0
    });
  };

  const groupedModules = groupModulesByFacultyAndYear();

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Module Management</h1>
        <p className="text-gray-600">Create, edit, and organize academic modules</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Modules</p>
                <p className="text-2xl font-bold text-gray-900">{modules.length}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Faculties</p>
                <p className="text-2xl font-bold text-purple-600">{faculties.length}</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Years Covered</p>
                <p className="text-2xl font-bold text-green-600">{new Set(modules.map(m => m.year)).size}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Bar */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search modules by name, code, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A8C5B5]"
            />
          </div>
        </div>
        
        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="bg-[#A8C5B5] hover:bg-[#96B5A5] text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Module
        </Button>
      </div>

      {/* Modules Grouped by Faculty and Year */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading modules...</p>
        </div>
      ) : Object.keys(groupedModules).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600 mb-4">No modules found</p>
            <Button onClick={() => setCreateDialogOpen(true)} className="bg-[#A8C5B5] hover:bg-[#96B5A5] text-white">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Module
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedModules).map(([facultyId, { faculty, years }]) => (
            <Card key={facultyId}>
              <CardContent className="p-0">
                {/* Faculty Header */}
                <div
                  onClick={() => toggleFaculty(faculty.id)}
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 border-b"
                >
                  <div className="flex items-center gap-3">
                    {expandedFaculties.has(faculty.id) ? (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-500" />
                    )}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{faculty.name}</h3>
                      <p className="text-sm text-gray-500">Code: {faculty.code}</p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-600 bg-blue-50 px-3 py-1 rounded-full">
                    {Object.values(years).flat().length} modules
                  </span>
                </div>

                {/* Years and Modules */}
                {expandedFaculties.has(faculty.id) && (
                  <div className="p-4 space-y-4">
                    {Object.entries(years)
                      .sort(([a], [b]) => parseInt(a) - parseInt(b))
                      .map(([year, yearModules]) => (
                        <div key={`${facultyId}-${year}`} className="border rounded-lg">
                          {/* Year Header */}
                          <div
                            onClick={() => toggleYear(faculty.id, year)}
                            className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 rounded-t-lg"
                          >
                            <div className="flex items-center gap-2">
                              {expandedYears.has(`${faculty.id}-${year}`) ? (
                                <ChevronDown className="h-4 w-4 text-gray-500" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-gray-500" />
                              )}
                              <h4 className="font-medium text-gray-900">Year {year}</h4>
                            </div>
                            <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                              {yearModules.length} modules
                            </span>
                          </div>

                          {/* Modules List */}
                          {expandedYears.has(`${faculty.id}-${year}`) && (
                            <div className="divide-y">
                              {yearModules.map((module) => (
                                <div key={module.id} className="p-4 hover:bg-gray-50">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <h5 className="font-medium text-gray-900 mb-1">{module.name}</h5>
                                      <p className="text-sm text-gray-600 mb-1">Code: {module.code}</p>
                                      {module.description && (
                                        <p className="text-sm text-gray-500">{module.description}</p>
                                      )}
                                    </div>
                                    
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleEditModule(module)}
                                        className="text-blue-600 hover:text-blue-700"
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleDeleteModule(module)}
                                        className="text-red-600 hover:text-red-700"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Module Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Module</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Module Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#A8C5B5]"
                placeholder="e.g., Data Structures & Algorithms"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Module Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#A8C5B5]"
                placeholder="e.g., CS201"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#A8C5B5]"
                rows={3}
                placeholder="Brief description of the module"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Faculty <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.facultyId}
                  onChange={(e) => setFormData({ ...formData, facultyId: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#A8C5B5]"
                >
                  <option value={0}>Select Faculty</option>
                  {faculties.map((faculty) => (
                    <option key={faculty.id} value={faculty.id}>
                      {faculty.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Year <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#A8C5B5]"
                >
                  <option value={1}>Year 1</option>
                  <option value={2}>Year 2</option>
                  <option value={3}>Year 3</option>
                  <option value={4}>Year 4</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setCreateDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateModule}
                className="bg-[#A8C5B5] hover:bg-[#96B5A5] text-white"
              >
                Create Module
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Module Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Module</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Module Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#A8C5B5]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Module Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#A8C5B5]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#A8C5B5]"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Faculty <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.facultyId}
                  onChange={(e) => setFormData({ ...formData, facultyId: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#A8C5B5]"
                >
                  {faculties.map((faculty) => (
                    <option key={faculty.id} value={faculty.id}>
                      {faculty.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Year <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#A8C5B5]"
                >
                  <option value={1}>Year 1</option>
                  <option value={2}>Year 2</option>
                  <option value={3}>Year 3</option>
                  <option value={4}>Year 4</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setEditDialogOpen(false);
                  setEditingModule(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateModule}
                className="bg-[#A8C5B5] hover:bg-[#96B5A5] text-white"
              >
                Update Module
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
