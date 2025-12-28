/**
 * Super Admin Dashboard
 * Full platform access - manage colleges and create college admins
 */

import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';

export default function SuperAdminDashboard() {
  const { user, logout } = useAuth();
  const [filterRole, setFilterRole] = useState('All');

  const users = [
    {
      id: 1,
      name: 'Jessica Alba',
      email: 'jessicaalba@gmail.com',
      role: 'Student',
      college: 'State University',
      status: 'Active'
    },
    {
      id: 2,
      name: 'Alice Smith',
      email: 'alice1@gmail.com',
      role: 'College Admin',
      college: 'City College',
      status: 'Active'
    },
    {
      id: 3,
      name: 'Alabama Lincoln',
      email: 'alabama0@gmail.com',
      role: 'Super Admin',
      college: 'LearnBox',
      status: 'Active'
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
            Super Admin Dashboard
          </button>
          <button className="w-full text-left px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg mb-1">
            Manage Users
          </button>
          <button className="w-full text-left px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg mb-1">
            System Settings
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
            <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            <Card className="border border-gray-200">
              <CardContent className="p-6">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Total Colleges</h3>
                <p className="text-4xl font-bold text-gray-900">15</p>
              </CardContent>
            </Card>
            <Card className="border border-gray-200">
              <CardContent className="p-6">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Total Users</h3>
                <p className="text-4xl font-bold text-gray-900">6</p>
              </CardContent>
            </Card>
            <Card className="border border-gray-200">
              <CardContent className="p-6">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Total Modules</h3>
                <p className="text-4xl font-bold text-gray-900">250</p>
              </CardContent>
            </Card>
          </div>

          {/* Manage Users and Roles */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Manage Users and Roles</h2>
            <Card className="border border-gray-200">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-4">
                    <span className="text-base font-medium text-gray-900">Platform users</span>
                    <select 
                      value={filterRole}
                      onChange={(e) => setFilterRole(e.target.value)}
                      className="px-4 py-2 bg-[#A8C5B5] text-gray-700 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-[#96B5A5]"
                    >
                      <option>All</option>
                      <option>Student</option>
                      <option>College Admin</option>
                      <option>Super Admin</option>
                    </select>
                  </div>
                  <Button className="bg-[#A8C5B5] hover:bg-[#96B5A5] text-white text-sm px-4 py-2 rounded-lg">
                    + Add New User
                  </Button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Role</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">College</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-b border-gray-100 last:border-0">
                          <td className="px-4 py-4 text-sm text-gray-900">{user.name}</td>
                          <td className="px-4 py-4 text-sm text-gray-600">{user.email}</td>
                          <td className="px-4 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              user.role === 'Student' ? 'bg-gray-200 text-gray-700' :
                              user.role === 'College Admin' ? 'bg-[#D4B896] text-gray-700' :
                              'bg-[#7C9E9E] text-white'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600">{user.college}</td>
                          <td className="px-4 py-4">
                            <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-xs font-medium">
                              {user.status}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-400">...</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Information */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">System Information</h2>
            <Card className="border border-gray-200">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Status Overview</h3>
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">&lt;&gt; Version 1.2.3</p>
                    <p className="text-sm text-gray-600 mb-4">API Status: Operational</p>
                    <Button className="bg-[#A8C5B5] hover:bg-[#96B5A5] text-white text-sm px-4 py-2 rounded-lg">
                      View System Logs
                    </Button>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 mb-1">Last Updated: October 27, 2023</p>
                    <p className="text-sm text-gray-600">Database: PostgreSQL v14</p>
                  </div>
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
