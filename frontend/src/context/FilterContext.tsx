/**
 * Filter Context
 * Manages and persists student filter selections (faculty, year, module) across the app
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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

export function FilterProvider({ children }: { children: ReactNode }) {
  const [facultyId, setFacultyIdState] = useState<string>('all');
  const [year, setYearState] = useState<string>('all');
  const [moduleId, setModuleIdState] = useState<string>('all');

  // Load filters from localStorage on mount
  useEffect(() => {
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
  }, []);

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
