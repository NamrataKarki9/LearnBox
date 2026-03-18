/**
 * Admin Learning Sites Page
 * Manage curated external learning links for students.
 */

import { useEffect, useState } from 'react';
import { learningSiteAPI, facultyAPI, moduleAPI, LearningSite, Faculty, Module } from '../../services/api';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { Plus, Search, ExternalLink, Trash2, Link as LinkIcon } from 'lucide-react';

export default function AdminLearningSitesPage() {
  const [sites, setSites] = useState<LearningSite[]>([]);
  const [filteredSites, setFilteredSites] = useState<LearningSite[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [formModules, setFormModules] = useState<Module[]>([]);

  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteConfirmSiteId, setDeleteConfirmSiteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterFaculty, setFilterFaculty] = useState('all');
  const [filterYear, setFilterYear] = useState('all');
  const [filterModule, setFilterModule] = useState('all');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    facultyId: '',
    year: '',
    moduleId: '',
    url: ''
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [sites, searchQuery, filterFaculty, filterYear, filterModule]);

  useEffect(() => {
    if (!formData.facultyId || !formData.year) {
      setFormModules([]);
      return;
    }

    const loadFormModules = async () => {
      try {
        const response = await moduleAPI.getByFacultyAndYear(parseInt(formData.facultyId), parseInt(formData.year));
        setFormModules(response.data.data || []);
      } catch (error) {
        console.error('Error loading form modules:', error);
        setFormModules([]);
      }
    };

    loadFormModules();
  }, [formData.facultyId, formData.year]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [sitesRes, facultiesRes, modulesRes] = await Promise.allSettled([
        learningSiteAPI.getAll(),
        facultyAPI.getAll(),
        moduleAPI.getAll()
      ]);

      if (sitesRes.status === 'fulfilled') {
        setSites(sitesRes.value.data.data || []);
      } else {
        const message =
          (sitesRes.reason?.response?.data?.error as string) ||
          'Failed to load learning sites';
        toast.error(message);
        setSites([]);
      }

      if (facultiesRes.status === 'fulfilled') {
        setFaculties(facultiesRes.value.data.data || []);
      } else {
        const message =
          (facultiesRes.reason?.response?.data?.error as string) ||
          'Failed to load faculties';
        toast.error(message);
        setFaculties([]);
      }

      if (modulesRes.status === 'fulfilled') {
        setModules(modulesRes.value.data.data || []);
      } else {
        const message =
          (modulesRes.reason?.response?.data?.error as string) ||
          'Failed to load modules';
        toast.error(message);
        setModules([]);
      }
    } catch (error) {
      console.error('Error loading learning sites:', error);
      toast.error('Failed to load learning sites');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...sites];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((site) =>
        site.title.toLowerCase().includes(q) ||
        site.description?.toLowerCase().includes(q) ||
        site.module?.name?.toLowerCase().includes(q)
      );
    }

    if (filterFaculty !== 'all') {
      result = result.filter((site) => site.facultyId === parseInt(filterFaculty));
    }

    if (filterYear !== 'all') {
      result = result.filter((site) => site.year === parseInt(filterYear));
    }

    if (filterModule !== 'all') {
      result = result.filter((site) => site.moduleId === parseInt(filterModule));
    }

    setFilteredSites(result);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      facultyId: '',
      year: '',
      moduleId: '',
      url: ''
    });
    setFormModules([]);
  };

  const handleCreateSite = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.facultyId || !formData.year || !formData.moduleId || !formData.url.trim()) {
      toast.error('Please fill all required fields');
      return;
    }

    setSaving(true);
    try {
      await learningSiteAPI.create({
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        facultyId: parseInt(formData.facultyId),
        year: parseInt(formData.year),
        moduleId: parseInt(formData.moduleId),
        url: formData.url.trim()
      });

      toast.success('Learning site added successfully');
      setDialogOpen(false);
      resetForm();
      fetchInitialData();
    } catch (error: any) {
      console.error('Error creating learning site:', error);
      toast.error(error.response?.data?.error || 'Failed to add learning site');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSite = async (id: number) => {
    setDeleteConfirmSiteId(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteSite = async () => {
    if (!deleteConfirmSiteId) return;
    setIsDeleting(true);
    try {
      await learningSiteAPI.delete(deleteConfirmSiteId);
      toast.success('Learning site deleted successfully');
      fetchInitialData();
    } catch (error: any) {
      console.error('Error deleting learning site:', error);
      toast.error(error.response?.data?.error || 'Failed to delete learning site');
    } finally {
      setIsDeleting(false);
      setDeleteConfirmOpen(false);
      setDeleteConfirmSiteId(null);
    }
  };

  const yearsFromData = [...new Set(sites.map((s) => s.year).filter(Boolean))].sort((a, b) => a - b);
  const years = Array.from(new Set([1, 2, 3, ...yearsFromData])).sort((a, b) => a - b);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Learning Sites</h1>
        <p className="text-gray-600">Add and manage curated external learning links for your students</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Total Sites</p>
            <p className="text-2xl font-bold text-gray-900">{sites.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Filtered Results</p>
            <p className="text-2xl font-bold text-blue-600">{filteredSites.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Available Faculties</p>
            <p className="text-2xl font-bold text-green-600">{faculties.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search learning sites..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#A8C5B5]"
                />
              </div>
            </div>

            <div>
              <select
                value={filterFaculty}
                onChange={(e) => setFilterFaculty(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#A8C5B5]"
              >
                <option value="all">All Faculties</option>
                {faculties.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#A8C5B5]"
              >
                <option value="all">All Years</option>
                {years.map((year) => (
                  <option key={year} value={year}>Year {year}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={filterModule}
                onChange={(e) => setFilterModule(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#A8C5B5]"
              >
                <option value="all">All Modules</option>
                {modules.map((m) => (
                  <option key={m.id} value={m.id}>{m.code} - {m.name}</option>
                ))}
              </select>
            </div>

            <div>
              <Button
                className="w-full bg-primary hover:bg-primary/90 text-white"
                onClick={() => setDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Site
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Module</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Year</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Link</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Loading learning sites...</td>
                  </tr>
                ) : filteredSites.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No learning sites found</td>
                  </tr>
                ) : (
                  filteredSites.map((site) => (
                    <tr key={site.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{site.title}</div>
                          {site.description && (
                            <div className="text-xs text-gray-500 truncate max-w-md">{site.description}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <div className="flex flex-col gap-1">
                          <span>{site.module?.code || 'N/A'}</span>
                          <Badge variant="outline" className="w-fit">{site.faculty?.name || 'Faculty'}</Badge>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">Year {site.year}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <a
                          href={site.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-primary hover:underline"
                        >
                          <LinkIcon className="h-3 w-3 mr-1" />
                          Open link
                        </a>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => window.open(site.url, '_blank', 'noopener,noreferrer')}
                            className="inline-flex items-center px-2 py-1 text-xs border border-primary text-primary hover:bg-primary/10 rounded transition-colors"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Visit
                          </button>
                          <button
                            onClick={() => handleDeleteSite(site.id)}
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
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Learning Site</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to delete this learning site? This action cannot be undone.
            </p>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button onClick={confirmDeleteSite} disabled={isDeleting} className="bg-red-600 hover:bg-red-700 text-white">
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) {
          resetForm();
        }
      }}>
        <DialogContent className="sm:max-w-[620px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Add Learning Site</DialogTitle>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleCreateSite}>
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter learning site title"
                disabled={saving}
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter short description (optional)"
                rows={3}
                disabled={saving}
              />
            </div>

            <div>
              <Label htmlFor="faculty">Faculty *</Label>
              <Select
                value={formData.facultyId}
                onValueChange={(value) => setFormData({ ...formData, facultyId: value, year: '', moduleId: '' })}
                disabled={saving}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select faculty" />
                </SelectTrigger>
                <SelectContent>
                  {faculties.map((faculty) => (
                    <SelectItem key={faculty.id} value={faculty.id.toString()}>
                      {faculty.code} - {faculty.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="year">Academic Year *</Label>
              <Select
                value={formData.year}
                onValueChange={(value) => setFormData({ ...formData, year: value, moduleId: '' })}
                disabled={saving || !formData.facultyId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Year 1</SelectItem>
                  <SelectItem value="2">Year 2</SelectItem>
                  <SelectItem value="3">Year 3</SelectItem>
                  <SelectItem value="4">Year 4</SelectItem>
                </SelectContent>
              </Select>
              {!formData.facultyId && (
                <p className="text-xs text-gray-500 mt-1">Select faculty first</p>
              )}
            </div>

            <div>
              <Label htmlFor="module">Module *</Label>
              <Select
                value={formData.moduleId}
                onValueChange={(value) => setFormData({ ...formData, moduleId: value })}
                disabled={saving || !formData.facultyId || !formData.year || formModules.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select module" />
                </SelectTrigger>
                <SelectContent>
                  {formModules.map((module) => (
                    <SelectItem key={module.id} value={module.id.toString()}>
                      {module.code} - {module.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!formData.facultyId || !formData.year ? (
                <p className="text-xs text-gray-500 mt-1">Select faculty and year first</p>
              ) : formModules.length === 0 ? (
                <p className="text-xs text-amber-600 mt-1">No modules available for this faculty and year</p>
              ) : null}
            </div>

            <div>
              <Label htmlFor="url">Site Link *</Label>
              <Input
                id="url"
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://example.com"
                disabled={saving}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-white" disabled={saving}>
                {saving ? 'Saving...' : 'Add Learning Site'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
