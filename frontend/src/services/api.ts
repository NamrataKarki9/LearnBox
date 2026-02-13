import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (refreshToken) {
        try {
          const response = await axios.post(
            'http://localhost:5000/api/auth/token/refresh',
            { refresh: refreshToken }
          );
          
          const { access } = response.data.tokens;
          localStorage.setItem('access_token', access);
          
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        } catch (refreshError) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// Type definitions
interface RegisterData {
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface AuthTokens {
  access: string;
  refresh: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  first_name?: string;
  last_name?: string;
  collegeId?: number;
  college?: {
    id: number;
    name: string;
    code: string;
  };
}

interface AuthResponse {
  message: string;
  tokens: AuthTokens;
  user: User;
}

interface RefreshTokenResponse {
  tokens: AuthTokens;
}

// Auth API endpoints
export const authAPI = {
  register: (data: RegisterData) => api.post<AuthResponse>('/auth/register', data),
  login: (data: LoginData) => api.post<AuthResponse>('/auth/login', data),
  refreshToken: (refreshToken: string) => api.post<RefreshTokenResponse>('/auth/token/refresh', { refresh: refreshToken }),
  getMe: () => api.get<{ user: User }>('/auth/me'),
};

// Resource types
export interface Module {
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

export interface Resource {
  id: number;
  title: string;
  description?: string;
  fileUrl: string;
  fileType: string;
  year?: number;
  facultyId?: number;
  moduleId?: number;
  collegeId: number;
  uploadedBy: number;
  createdAt: string;
  updatedAt: string;
  uploader?: {
    id: number;
    username: string;
    first_name?: string;
    last_name?: string;
  };
  module?: Module;
  faculty?: {
    id: number;
    name: string;
    code: string;
  };
  college?: {
    id: number;
    name: string;
    code: string;
  };
}

interface ResourcesResponse {
  success: boolean;
  count: number;
  data: Resource[];
}

interface UploadResourceResponse {
  success: boolean;
  message: string;
  data: Resource;
}

// Faculty types
export interface Faculty {
  id: number;
  name: string;
  code: string;
  description?: string;
  collegeId: number;
}

// Resource API endpoints
export const resourceAPI = {
  // Get all resources (with optional filters)
  getAll: (params?: { moduleId?: number }) => 
    api.get<ResourcesResponse>('/resources', { params }),
  
  // Filter resources (for students)
  filter: (params?: { collegeId?: number; facultyId?: number; year?: number; moduleId?: number }) =>
    api.get<ResourcesResponse>('/resources/filter', { params }),
  
  // Upload resource with file
  upload: (formData: FormData) => {
    return axios.create({
      baseURL: 'http://localhost:5000/api',
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      },
      timeout: 120000, // 120 seconds (2 minutes) for file upload
    }).post<UploadResourceResponse>('/resources/upload', formData);
  },
  
  // Update resource
  update: (id: number, data: Partial<Resource>) =>
    api.put<{ success: boolean; message: string; data: Resource }>(`/resources/${id}`, data),
  
  // Delete resource
  delete: (id: number) =>
    api.delete<{ success: boolean; message: string }>(`/resources/${id}`),
};

// Module API endpoints
export const moduleAPI = {
  getAll: (params?: { collegeId?: number; facultyId?: number; year?: number }) =>
    api.get<{ success: boolean; count: number; data: Module[] }>('/modules', { params }),
  
  getByFacultyAndYear: (facultyId: number, year: number) =>
    api.get<{ success: boolean; count: number; data: Module[] }>('/modules', {
      params: { facultyId, year }
    }),
};

// Faculty API endpoints
export const facultyAPI = {
  getAll: (params?: { collegeId?: number }) =>
    api.get<{ success: boolean; count: number; data: Faculty[] }>('/faculties', { params }),
};

export default api;
