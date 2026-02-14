import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { authAPI } from '../services/api';

// Role constants - must match backend
export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  COLLEGE_ADMIN: 'COLLEGE_ADMIN',
  STUDENT: 'STUDENT'
} as const;

export type UserRole = typeof ROLES[keyof typeof ROLES];

interface College {
  id: number;
  name: string;
  code: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  first_name?: string;
  last_name?: string;
  collegeId?: number;
  college?: College;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  login: (data: LoginData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  hasRole: (role: UserRole | UserRole[]) => boolean;
  isSuperAdmin: () => boolean;
  isCollegeAdmin: () => boolean;
  isStudent: () => boolean;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  collegeId: number;
}

interface LoginData {
  email: string;
  password: string;
  collegeId?: number;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is logged in on mount
  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    const accessToken = sessionStorage.getItem('access_token');
    
    if (storedUser && accessToken) {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const register = async (data: RegisterData) => {
    try {
      const response = await authAPI.register(data);
      
      return { success: true };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Registration failed';
      return { success: false, error: errorMessage };
    }
  };

  const login = async (data: LoginData) => {
    try {
      const response = await authAPI.login(data);
      
      const { tokens, user: userData } = response.data;
      
      // Ensure userData has the required role property
      if (!userData.role) {
        return { success: false, error: 'Invalid user data received from server' };
      }
      
      sessionStorage.setItem('access_token', tokens.access);
      sessionStorage.setItem('refresh_token', tokens.refresh);
      sessionStorage.setItem('user', JSON.stringify(userData));
      
      setUser(userData as User);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error: any) {
      const errorData = error.response?.data;
      const errorMessage = errorData?.error || error.message || 'Login failed';
      
      // Check if it's a verification error
      if (errorData?.requiresVerification && errorData?.email) {
        return { 
          success: false, 
          error: errorMessage,
          requiresVerification: true,
          email: errorData.email
        };
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
    sessionStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  // Role checking utilities
  const hasRole = (role: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    return user.role === role;
  };

  const isSuperAdmin = (): boolean => hasRole(ROLES.SUPER_ADMIN);
  const isCollegeAdmin = (): boolean => hasRole(ROLES.COLLEGE_ADMIN);
  const isStudent = (): boolean => hasRole(ROLES.STUDENT);

  const value = {
    user,
    isAuthenticated,
    loading,
    register,
    login,
    logout,
    hasRole,
    isSuperAdmin,
    isCollegeAdmin,
    isStudent,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
