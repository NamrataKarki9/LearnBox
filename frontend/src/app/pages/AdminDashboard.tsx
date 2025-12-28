/**
 * College Admin Dashboard
 * College-scoped access - manage resources and MCQs for assigned college only
 */

import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';

export default function AdminDashboard() {
  const { user, logout } = useAuth();

  const resources = [
    {
      id: 1,
      title: 'Introduction to React',
      module: 'CS101',
      type: 'PDF',
      uploadDate: '2023-04-12',
      uploadedBy: 'Jessica Alba',
      published: true
    }
  ];

  const modules = [
    {
      id: 1,
      code: 'CS102',
      name: 'Introduction to Computer Science',
      faculty: 'Computing',
      year: 'Year 1',
      credits: 3
    }
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
            Admin Dashboard
          </button>
          <button className="w-full text-left px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg mb-1">
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

          {/* Filter Buttons */}
          <div className="flex gap-3 mb-8">
            <Button className="bg-[#A8C5B5] hover:bg-[#96B5A5] text-white px-6 py-2 rounded-lg">
              Faculty
            </Button>
            <Button className="bg-[#A8C5B5] hover:bg-[#96B5A5] text-white px-6 py-2 rounded-lg">
              Academic Year
            </Button>
            <Button className="bg-[#A8C5B5] hover:bg-[#96B5A5] text-white px-6 py-2 rounded-lg">
              + Add new Resources
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            <Card className="border border-gray-200">
              <CardContent className="p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Total Resource</h3>
                <p className="text-4xl font-bold text-gray-900 mb-2">5</p>
                <p className="text-sm text-gray-600 mb-4">Across all modules and years</p>
                <Button className="bg-[#A8C5B5] hover:bg-[#96B5A5] text-white text-sm px-4 py-2 rounded-lg w-full">
                  View Details
                </Button>
              </CardContent>
            </Card>
            <Card className="border border-gray-200">
              <CardContent className="p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Total Modules</h3>
                <p className="text-4xl font-bold text-gray-900 mb-2">5</p>
                <p className="text-sm text-gray-600">Active modules in your college</p>
              </CardContent>
            </Card>
            <Card className="border border-gray-200">
              <CardContent className="p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Recent Activity</h3>
                <p className="text-4xl font-bold text-gray-900 mb-2">5</p>
                <p className="text-sm text-gray-600">Last 24 hours</p>
              </CardContent>
            </Card>
          </div>

          {/* Manage Academic Resources */}
          <div className="mb-8">
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
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Upload Date</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Uploaded By</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Published</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {resources.map((resource) => (
                        <tr key={resource.id}>
                          <td className="px-6 py-4 text-sm text-gray-900">{resource.title}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{resource.module}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{resource.type}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{resource.uploadDate}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{resource.uploadedBy}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <button className={`relative inline-flex h-6 w-11 items-center rounded-full ${resource.published ? 'bg-[#A8C5B5]' : 'bg-gray-300'}`}>
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${resource.published ? 'translate-x-6' : 'translate-x-1'}`} />
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <button className="text-gray-400 hover:text-gray-600 mr-3">Edit</button>
                            <button className="text-gray-400 hover:text-gray-600">Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 flex justify-end border-t border-gray-200">
                  <Button className="bg-[#A8C5B5] hover:bg-[#96B5A5] text-white text-sm px-4 py-2 rounded-lg">
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
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Faculty</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Year</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Credits</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {modules.map((module) => (
                        <tr key={module.id}>
                          <td className="px-6 py-4 text-sm text-gray-900">{module.code}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{module.name}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{module.faculty}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{module.year}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{module.credits}</td>
                          <td className="px-6 py-4 text-sm">
                            <button className="text-gray-400 hover:text-gray-600 mr-3">Edit</button>
                            <button className="text-gray-400 hover:text-gray-600">Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 flex justify-end border-t border-gray-200">
                  <Button className="bg-[#A8C5B5] hover:bg-[#96B5A5] text-white text-sm px-4 py-2 rounded-lg">
                    + Add New Module
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

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
