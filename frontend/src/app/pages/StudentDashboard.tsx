/**
 * Student Dashboard
 * College-scoped access - view resources and attempt MCQs from own college
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { useNavigate } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { facultyAPI, moduleAPI, Faculty } from '../../services/api';

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
  
  // Data states
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [filteredModules, setFilteredModules] = useState<Module[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  
  // Filter states
  const [selectedFaculty, setSelectedFaculty] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedModule, setSelectedModule] = useState<string>('all');
  
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
        
        if (selectedFaculty !== 'all') {
          params.facultyId = parseInt(selectedFaculty);
        }
        
        if (selectedYear !== 'all') {
          params.year = parseInt(selectedYear);
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
  }, [selectedFaculty, selectedYear]);

  // Update available years when faculty changes
  useEffect(() => {
    if (selectedFaculty === 'all') {
      // Get all unique years from all modules
      const years = new Set<number>();
      modules.forEach(module => years.add(module.year));
      setAvailableYears(Array.from(years).sort());
    } else {
      // Get years for selected faculty
      const facultyModules = modules.filter(
        m => m.facultyId === parseInt(selectedFaculty)
      );
      const years = new Set<number>();
      facultyModules.forEach(module => years.add(module.year));
      setAvailableYears(Array.from(years).sort());
      
      // Reset year if current selection is not available
      if (selectedYear !== 'all' && !years.has(parseInt(selectedYear))) {
        setSelectedYear('all');
      }
    }
  }, [selectedFaculty, modules, selectedYear]);

  // Filter modules based on all selections
  useEffect(() => {
    let filtered = modules;

    if (selectedFaculty !== 'all') {
      filtered = filtered.filter(m => m.facultyId === parseInt(selectedFaculty));
    }

    if (selectedYear !== 'all') {
      filtered = filtered.filter(m => m.year === parseInt(selectedYear));
    }

    if (selectedModule !== 'all') {
      filtered = filtered.filter(m => m.id === parseInt(selectedModule));
    }

    setFilteredModules(filtered);
  }, [modules, selectedFaculty, selectedYear, selectedModule]);

  // Handle faculty change
  const handleFacultyChange = (value: string) => {
    setSelectedFaculty(value);
    setSelectedYear('all');
    setSelectedModule('all');
  };

  // Handle year change
  const handleYearChange = (value: string) => {
    setSelectedYear(value);
    setSelectedModule('all');
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
          <button className="w-full text-left px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg mb-1">
            MCQs Practice
          </button>
          <button className="w-full text-left px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg mb-1">
            Useful Learning Sites
          </button>
          <button className="w-full text-left px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg mb-1">
            Summaries
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
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search academic resources..."
              className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A8C5B5]"
            />
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>
        </header>

        <div className="p-8">
          {/* Welcome Section */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Welcome Back, {user?.first_name || user?.username || 'Student'}!</h1>
            <p className="text-gray-600">Here's your academic overview and recent activities.</p>
          </div>

          {/* Filter Dropdowns */}
          <div className="flex gap-3 mb-8">
            {/* Faculty Dropdown */}
            <div className="w-64">
              <Select value={selectedFaculty} onValueChange={handleFacultyChange}>
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
                value={selectedYear} 
                onValueChange={handleYearChange}
                disabled={selectedFaculty === 'all' && availableYears.length === 0}
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
                value={selectedModule} 
                onValueChange={setSelectedModule}
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

          {/* Performance Cards */}
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

          {/* My Modules */}
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
                              onClick={() => navigate(`/student/resources?moduleId=${module.id}`)}
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

          {/* Bottom Grid: Recent Activity, MCQs History */}
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

          {/* Course Roadmap */}
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
    </div>
  );
}
