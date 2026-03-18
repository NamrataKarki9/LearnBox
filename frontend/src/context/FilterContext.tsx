/**
 * Filter Context
 * Manages and persists student filter selections (faculty, year, module) across the app
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface FilterContextType {
  facultyId: string;
  year: string;
  moduleId: string;
  setFacultyId: (id: string) => void;
  setYear: (year: string) => void;
  setModuleId: (id: string) => void;
  setFilters: (filters: { facultyId: string; year: string; moduleId: string }) => void;
  clearFilters: () => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

const STORAGE_KEY = 'learnbox_student_filters';
const USER_ID_KEY = 'learnbox_filter_user_id';

export function FilterProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [facultyId, setFacultyIdState] = useState<string>('all');
  const [year, setYearState] = useState<string>('all');
  const [moduleId, setModuleIdState] = useState<string>('all');

  // Monitor user changes and handle logout/login scenarios
  useEffect(() => {
    const lastStoredUserId = localStorage.getItem(USER_ID_KEY);
    const currentUserId = user?.id?.toString();

    if (!currentUserId) {
      // User logged out - clear everything
      localStorage.removeItem(USER_ID_KEY);
      localStorage.removeItem(STORAGE_KEY);
      setFacultyIdState('all');
      setYearState('all');
      setModuleIdState('all');
      return;
    }

    if (lastStoredUserId && lastStoredUserId !== currentUserId) {
      // Different user logged in - clear filters
      localStorage.removeItem(STORAGE_KEY);
      setFacultyIdState('all');
      setYearState('all');
      setModuleIdState('all');
    } else if (!lastStoredUserId) {
      // First time user logged in after logout - clear filters
      localStorage.removeItem(STORAGE_KEY);
      setFacultyIdState('all');
      setYearState('all');
      setModuleIdState('all');
    } else {
      // Same user, load saved filters
      const savedFilters = localStorage.getItem(STORAGE_KEY);
      if (savedFilters) {
        try {
          const parsed = JSON.parse(savedFilters);
          setFacultyIdState(parsed.facultyId || 'all');
          setYearState(parsed.year || 'all');
          setModuleIdState(parsed.moduleId || 'all');
        } catch (error) {
          console.error('Error parsing saved filters:', error);
        }
      }
    }

    // Store current user ID
    if (currentUserId) {
      localStorage.setItem(USER_ID_KEY, currentUserId);
    }
  }, [user?.id]);

  // Save filters to localStorage whenever they change
  useEffect(() => {
    const filters = { facultyId, year, moduleId };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  }, [facultyId, year, moduleId]);

  const setFacultyId = (id: string) => {
    setFacultyIdState(id);
    // Reset dependent filters
    if (id === 'all') {
      setYearState('all');
      setModuleIdState('all');
    }
  };

  const setYear = (newYear: string) => {
    setYearState(newYear);
    // Reset module when year changes
    if (newYear === 'all') {
      setModuleIdState('all');
    }
  };

  const setModuleId = (id: string) => {
    setModuleIdState(id);
  };

  const setFilters = (filters: { facultyId: string; year: string; moduleId: string }) => {
    setFacultyIdState(filters.facultyId);
    setYearState(filters.year);
    setModuleIdState(filters.moduleId);
  };

  const clearFilters = () => {
    setFacultyIdState('all');
    setYearState('all');
    setModuleIdState('all');
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <FilterContext.Provider
      value={{
        facultyId,
        year,
        moduleId,
        setFacultyId,
        setYear,
        setModuleId,
        setFilters,
        clearFilters,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
}
