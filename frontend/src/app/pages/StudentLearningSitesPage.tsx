/**
 * Student Learning Sites Page
 * Browse curated external links shared by college admins.
 */

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useFilters } from '../../context/FilterContext';
import { useNavigate } from 'react-router-dom';
import { learningSiteAPI, facultyAPI, moduleAPI, type LearningSite, type Faculty, type Module } from '../../services/api';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { ExternalLink, BookOpen, Globe } from 'lucide-react';

export default function StudentLearningSitesPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const filters = useFilters();

  const [sites, setSites] = useState<LearningSite[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchFaculties = async () => {
      try {
        const response = await facultyAPI.getAll();
        setFaculties(response.data.data || []);
      } catch (error) {
        console.error('Error fetching faculties:', error);
      }
    };

    fetchFaculties();
  }, []);

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const params: any = {};

        if (filters.facultyId !== 'all') {
          params.facultyId = parseInt(filters.facultyId);
        }

        if (filters.year !== 'all') {
          params.year = parseInt(filters.year);
        }

        const response = await moduleAPI.getAll(params);
        setModules(response.data.data || []);
      } catch (error) {
        console.error('Error fetching modules:', error);
      }
    };

    fetchModules();
  }, [filters.facultyId, filters.year]);

  useEffect(() => {
    const fetchSites = async () => {
      setLoading(true);
      try {
        const params: any = {};

        if (filters.facultyId !== 'all') {
          params.facultyId = parseInt(filters.facultyId);
        }

        if (filters.year !== 'all') {
          params.year = parseInt(filters.year);
        }

        if (filters.moduleId !== 'all') {
          params.moduleId = parseInt(filters.moduleId);
        }

        const response = await learningSiteAPI.getAll(params);
        setSites(response.data.data || []);
      } catch (error) {
        console.error('Error loading learning sites:', error);
        toast.error('Failed to load learning sites');
      } finally {
        setLoading(false);
      }
    };

    fetchSites();
  }, [filters.facultyId, filters.year, filters.moduleId]);

  const availableYears = useMemo(() => {
    const sourceModules = filters.facultyId === 'all'
      ? modules
      : modules.filter((m) => m.facultyId === parseInt(filters.facultyId));

    return Array.from(new Set(sourceModules.map((m) => m.year))).sort((a, b) => a - b);
  }, [modules, filters.facultyId]);

  const filteredModules = useMemo(() => {
    let result = modules;

    if (filters.facultyId !== 'all') {
      result = result.filter((m) => m.facultyId === parseInt(filters.facultyId));
    }

    if (filters.year !== 'all') {
      result = result.filter((m) => m.year === parseInt(filters.year));
    }

    return result;
  }, [modules, filters.facultyId, filters.year]);

  const handleFacultyChange = (value: string) => {
    filters.setFacultyId(value);
    filters.setYear('all');
    filters.setModuleId('all');
  };

  const handleYearChange = (value: string) => {
    filters.setYear(value);
    filters.setModuleId('all');
  };

  return (
    <div className="flex min-h-screen bg-[#F5F5F5]">
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
          <button className="w-full text-left px-4 py-3 text-gray-900 bg-gray-100 rounded-lg font-medium mb-1">
            Useful Learning Sites
          </button>
          <button
            onClick={() => navigate('/student/settings')}
            className="w-full text-left px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg mb-1"
          >
            Settings
          </button>
          <button
            onClick={logout}
            className="w-full text-left px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg"
          >
            Logout
          </button>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-medium">
              {user?.first_name?.[0] || user?.username?.[0] || 'S'}
            </div>
            <div>
              <div className="font-medium text-gray-900">{user?.first_name} {user?.last_name}</div>
              <div className="text-xs text-gray-500">Student</div>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Useful Learning Sites</h1>
            <p className="text-gray-600">Curated links from your college admin based on your faculty, year, and module</p>
          </div>

          <div className="flex gap-3 mb-6 flex-wrap">
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

            <div className="w-48">
              <Select value={filters.year} onValueChange={handleYearChange}>
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

            <div className="w-72">
              <Select value={filters.moduleId} onValueChange={filters.setModuleId}>
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

          {loading ? (
            <div className="text-center py-12 text-gray-600">Loading learning sites...</div>
          ) : sites.length === 0 ? (
            <Card>
              <CardContent className="p-10 text-center">
                <Globe className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-1">No learning sites found</h3>
                <p className="text-gray-600">Try changing your filters, or check back after your admin adds links.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {sites.map((site) => (
                <Card key={site.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <h3 className="text-lg font-bold text-gray-900 leading-snug">{site.title}</h3>
                      <Badge variant="outline">Year {site.year}</Badge>
                    </div>

                    {site.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-3">{site.description}</p>
                    )}

                    <div className="flex flex-wrap gap-2 mb-4">
                      {site.faculty && <Badge variant="secondary">{site.faculty.name}</Badge>}
                      {site.module && <Badge variant="secondary">{site.module.code}</Badge>}
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        Curated link
                      </div>
                      <Button
                        onClick={() => window.open(site.url, '_blank', 'noopener,noreferrer')}
                        className="bg-primary hover:bg-primary/90 text-white"
                        size="sm"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Visit
                      </Button>
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
