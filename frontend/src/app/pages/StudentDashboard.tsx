/**
 * Student Dashboard
 * College-scoped access - view resources and attempt MCQs from own college
 */

import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { useNavigate } from 'react-router-dom';

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [selectedFaculty, setSelectedFaculty] = useState('All');
  const [selectedYear, setSelectedYear] = useState('All');
  const [selectedModule, setSelectedModule] = useState('All');

  const modules = [
    {
      year: 1,
      title: 'Introduction to Programming',
      code: 'CS101',
      description: 'Fundamentals of programming using Python.',
      progress: 100
    },
    {
      year: 1,
      title: 'Discrete Mathematics',
      code: 'MA101',
      description: 'Essentials mathematic concepts for computer science..',
      progress: 100
    },
    {
      year: 2,
      title: 'Data Structures',
      code: 'CS201',
      description: 'Study of efficient data organization and management techniques.',
      progress: 60
    },
    {
      year: 2,
      title: 'Algorithms',
      code: 'CS202',
      description: 'Design and analysis of efficient compulsion methods.',
      progress: 0
    }
  ];

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
          <button className="w-full text-left px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg mb-1">
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
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Welcome Back, Namu!</h1>
            <p className="text-gray-600">Here's your academic overview and recent activities.</p>
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-3 mb-8">
            <Button className="bg-[#A8C5B5] hover:bg-[#96B5A5] text-white px-6 py-2 rounded-lg">
              Faculty
            </Button>
            <Button className="bg-[#A8C5B5] hover:bg-[#96B5A5] text-white px-6 py-2 rounded-lg">
              Academic Year
            </Button>
            <Button className="bg-[#A8C5B5] hover:bg-[#96B5A5] text-white px-6 py-2 rounded-lg">
              Module
            </Button>
          </div>

          {/* Performance Cards */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Your Performance at a Glance</h2>
            <div className="grid grid-cols-4 gap-4">
              <Card className="bg-[#A8C5B5]/20 border-0">
                <CardContent className="p-6 text-center">
                  <p className="text-gray-700 font-medium">Tutorials</p>
                </CardContent>
              </Card>
              <Card className="bg-[#A8C5B5]/20 border-0">
                <CardContent className="p-6 text-center">
                  <p className="text-gray-700 font-medium">Practice tests</p>
                </CardContent>
              </Card>
              <Card className="bg-[#A8C5B5]/20 border-0">
                <CardContent className="p-6 text-center">
                  <p className="text-gray-700 font-medium">Completed Courses</p>
                </CardContent>
              </Card>
              <Card className="bg-[#A8C5B5]/20 border-0">
                <CardContent className="p-6 text-center">
                  <p className="text-gray-700 font-medium">Average Score</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* My Modules */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">My Modules</h2>
            
            {/* Year 1 */}
            <h3 className="text-xl font-bold text-gray-900 mb-4">Year 1</h3>
            <div className="grid grid-cols-2 gap-6 mb-8">
              {modules.filter(m => m.year === 1).map((module, idx) => (
                <Card key={idx} className="border border-gray-200">
                  <CardContent className="p-6">
                    <h4 className="font-bold text-gray-900 mb-1">{module.title}</h4>
                    <p className="text-sm text-gray-600 mb-3">{module.code}</p>
                    <p className="text-sm text-gray-700 mb-4">{module.description}</p>
                    <Progress value={module.progress} className="h-2 mb-2" />
                    <div className="flex justify-between items-center mt-4">
                      <span className="text-sm font-semibold text-gray-900">{module.progress}% complete</span>
                      <Button className="bg-[#A8C5B5] hover:bg-[#96B5A5] text-white text-sm px-4 py-2 rounded-lg">
                        View Module
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Year 2 */}
            <h3 className="text-xl font-bold text-gray-900 mb-4">Year 2</h3>
            <div className="grid grid-cols-2 gap-6 mb-8">
              {modules.filter(m => m.year === 2).map((module, idx) => (
                <Card key={idx} className="border border-gray-200">
                  <CardContent className="p-6">
                    <h4 className="font-bold text-gray-900 mb-1">{module.title}</h4>
                    <p className="text-sm text-gray-600 mb-3">{module.code}</p>
                    <p className="text-sm text-gray-700 mb-4">{module.description}</p>
                    <Progress value={module.progress} className="h-2 mb-2" />
                    <div className="flex justify-between items-center mt-4">
                      <span className="text-sm font-semibold text-gray-900">{module.progress}% complete</span>
                      <Button className="bg-[#A8C5B5] hover:bg-[#96B5A5] text-white text-sm px-4 py-2 rounded-lg">
                        View Module
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
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
