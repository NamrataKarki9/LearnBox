import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 600000, // 10 minutes for long-running operations like MCQ generation
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('access_token');
    
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
      
      const refreshToken = sessionStorage.getItem('refresh_token');
      
      if (refreshToken) {
        try {
          const response = await axios.post(
            'http://localhost:5000/api/auth/token/refresh',
            { refresh: refreshToken }
          );
          
          const { access } = response.data.tokens;
          sessionStorage.setItem('access_token', access);
          
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        } catch (refreshError) {
          sessionStorage.removeItem('access_token');
          sessionStorage.removeItem('refresh_token');
          sessionStorage.removeItem('user');
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
        'Authorization': `Bearer ${sessionStorage.getItem('access_token')}`,
      },
      timeout: 600000, // 10 minutes for large file uploads
    }).post<UploadResourceResponse>('/resources/upload', formData);
  },
  
  // Update resource
  update: (id: number, data: Partial<Resource>) =>
    api.put<{ success: boolean; message: string; data: Resource }>(`/resources/${id}`, data),
  
  // Delete resource
  delete: (id: number) =>
    api.delete<{ success: boolean; message: string }>(`/resources/${id}`),

  getDownloadUrl: (id: number) => `http://localhost:5000/api/resources/${id}/download`
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

// Search types
export interface SemanticSearchResult extends Resource {
  relevanceScore: number;
  matchedChunks?: string[];
  chunkCount?: number;
}

interface SemanticSearchResponse {
  success: boolean;
  data: SemanticSearchResult[];
  count: number;
  query: string;
  filters: {
    facultyId?: string;
    year?: string;
    moduleId?: string;
  };
}

interface SearchStatusResponse {
  success: boolean;
  data: {
    initialized: boolean;
    count: number;
    message: string;
    error?: string;
  };
}

// Search API endpoints
export const searchAPI = {
  // Perform semantic search
  semanticSearch: (params: {
    query: string;
    facultyId?: string;
    year?: string;
    moduleId?: string;
    limit?: number;
  }) => api.post<SemanticSearchResponse>('/search/semantic', params),
  
  // Get search status
  getStatus: () => api.get<SearchStatusResponse>('/search/status'),
};

// Summary API endpoints
export const summaryAPI = {
  // Health check
  healthCheck: () => api.get('/summary/health'),
  
  // Upload and summarize document
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/summary/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 0 // No timeout - wait as long as needed
    });
  },
  
  // Get summary history
  getHistory: () => api.get('/summary/history'),
  
  // Get single summary by ID
  getSummaryById: (id: number) => api.get(`/summary/${id}`),
  
  // Get detailed summary
  getDetailed: (id: number) => api.get(`/summary/${id}/detailed`),
  
  // Get study notes
  getStudyNotes: (id: number) => api.get(`/summary/${id}/notes`),
  
  // Ask question about document
  askQuestion: (id: number, question: string) =>
    api.post(`/summary/${id}/question`, { question }),
  
  // Delete summary
  deleteSummary: (id: number) => api.delete(`/summary/${id}`),
};

// MCQ types
export interface MCQ {
  id: number;
  question: string;
  options: string[] | string;
  correctAnswer?: string;
  explanation?: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  topic?: string;
  source?: 'MANUAL' | 'AI_GENERATED';
  moduleId?: number;
  module?: {
    id: number;
    name: string;
    code: string;
  };
}

export interface MCQSet {
  id: number;
  title: string;
  description?: string;
  moduleId?: number;
  source: 'MANUAL' | 'AI_GENERATED';
  sourceFile?: string;
  isPublic: boolean;
  questionCount?: number;
  module?: {
    name: string;
    code: string;
  };
  creator?: {
    username: string;
    first_name?: string;
    last_name?: string;
  };
  createdAt: string;
}

export interface QuizSession {
  id: number;
  totalQuestions: number;
  setTitle?: string;
  startedAt: string;
}

export interface QuizAnswer {
  mcqId: number;
  selectedAnswer: string;
}

export interface QuizResult {
  sessionId: number;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  accuracy: string;
  timeSpent?: number;
}

export interface QuizAnswerDetail {
  questionNumber: number;
  mcqId: number;
  isCorrect: boolean;
  selectedAnswer: string;
  correctAnswer: string;
  explanation?: string;
  question: string;
  options: string[] | string;
  difficulty: string;
  topic?: string;
}

// MCQ API endpoints
export const mcqAPI = {
  // Get all MCQs
  getAll: (params?: { moduleId?: number; difficulty?: string }) =>
    api.get<{ success: boolean; count: number; data: MCQ[] }>('/mcqs', { params }),
  
  // Get MCQ sets
  getSets: (params?: { moduleId?: number }) =>
    api.get<{ success: boolean; count: number; data: MCQSet[] }>('/mcqs/sets', { params }),
  
  // Get MCQ set by ID
  getSetById: (id: number) =>
    api.get<{ success: boolean; data: MCQSet & { questions: MCQ[] } }>(`/mcqs/sets/${id}`),
  
  // Get adaptive questions based on weak areas
  getAdaptive: (params?: { count?: number; difficulty?: string }) =>
    api.get<{ success: boolean; message: string; weakAreas: string[]; data: MCQ[] }>('/mcqs/adaptive', { params }),
  
  // Bulk upload MCQs (admin only)
  bulkUpload: (data: {
    mcqs: Array<{
      question: string;
      options: string[];
      correctAnswer: string;
      explanation?: string;
      difficulty?: string;
      topic?: string;
    }>;
    moduleId?: number;
    createSet?: boolean;
    setTitle?: string;
    setDescription?: string;
  }) => api.post('/mcqs/bulk', data),
  
  // Generate MCQs from PDF
  generateFromPDF: (data: {
    pdfUrl: string;
    count?: number;
    difficulty?: string;
    topic?: string;
    moduleId?: number;
    saveToDatabase?: boolean;
    createSet?: boolean;
    setTitle?: string;
  }) => api.post<{
    success: boolean;
    message: string;
    data: {
      mcqs: MCQ[];
      set?: MCQSet;
      saved: boolean;
    };
  }>('/mcqs/generate-from-pdf', data, { timeout: 0 }), // No timeout for AI generation
};

// Quiz API endpoints
export const quizAPI = {
  // Start a quiz session
  start: (data: {
    setId?: number;
    moduleId?: number;
    customMCQIds?: number[];
  }) => api.post<{
    success: boolean;
    session: QuizSession;
    mcqs: (MCQ & { questionNumber: number })[];
  }>('/quiz/start', data),
  
  // Submit quiz with all answers
  submit: (sessionId: number, data: {
    answers: QuizAnswer[];
    timeSpent?: number;
  }) => api.post<{
    success: boolean;
    results: QuizResult;
    answers: QuizAnswerDetail[];
  }>(`/quiz/${sessionId}/submit`, data),
  
  // Get quiz session
  getSession: (sessionId: number) =>
    api.get(`/quiz/${sessionId}`),
  
  // Get quiz history
  getHistory: (params?: { moduleId?: number; limit?: number }) =>
    api.get('/quiz/history', { params }),
  
  // Abandon quiz session
  abandon: (sessionId: number) =>
    api.post(`/quiz/${sessionId}/abandon`),
};

// Analytics types
export interface WeakPoint {
  module?: {
    id: number;
    name: string;
    code: string;
    year: number;
  };
  topic: string;
  difficulty: string;
  accuracy: number;
  attempts: number;
  lastAttempted: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface Recommendation {
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  type: string;
  message: string;
  module?: any;
  topic?: string;
  difficulty?: string;
  action: string;
  estimatedTime: string;
  topics?: Array<{ module: string; topic: string; accuracy: number }>;
}

export interface PerformanceStats {
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number;
  byDifficulty: {
    EASY: { total: number; correct: number; accuracy: string };
    MEDIUM: { total: number; correct: number; accuracy: string };
    HARD: { total: number; correct: number; accuracy: string };
  };
  quizzesTaken: number;
  averageQuizScore: string;
  recentTrend: 'IMPROVING' | 'DECLINING' | 'STABLE' | 'NO_DATA';
  recentAccuracy: number;
}

export interface PracticeHistory {
  totalSessions: number;
  totalQuestions: number;
  totalCorrect: number;
  totalTimeSpent: number;
  dailyHistory: Array<{
    date: string;
    sessions: number;
    totalQuestions: number;
    correctAnswers: number;
    accuracy: string;
    timeSpent: number;
  }>;
  recentSessions: Array<{
    id: number;
    title: string;
    module?: string;
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    date: string;
    timeSpent?: number;
  }>;
}

export interface ModulePerformance {
  module: {
    id: number;
    name: string;
    code: string;
    year: number;
  };
  overallAccuracy: number;
  totalAttempts: number;
  correctAttempts: number;
  topicBreakdown: Array<{
    name: string;
    accuracy: number;
    attempts: number;
  }>;
  difficultyBreakdown: {
    EASY: { total: number; correct: number; accuracy: string };
    MEDIUM: { total: number; correct: number; accuracy: string };
    HARD: { total: number; correct: number; accuracy: string };
  };
}

// Analytics API endpoints
export const analyticsAPI = {
  // Get complete dashboard data
  getDashboard: () => api.get<{
    success: boolean;
    data: {
      overview: PerformanceStats;
      weakAreas: WeakPoint[];
      recommendations: {
        status: string;
        totalWeakAreas?: number;
        recommendations: Recommendation[];
      };
      recentActivity: any[];
      dailyProgress: any[];
      modulePerformance: ModulePerformance[];
    };
  }>('/analytics/dashboard'),
  
  // Get weak points
  getWeakPoints: (threshold?: number) =>
    api.get<{ success: boolean; count: number; data: WeakPoint[] }>('/analytics/weak-points', {
      params: { threshold }
    }),
  
  // Get recommendations
  getRecommendations: () =>
    api.get<{
      success: boolean;
      data: {
        status: string;
        totalWeakAreas?: number;
        recommendations: Recommendation[];
      };
    }>('/analytics/recommendations'),
  
  // Get overall stats
  getStats: () =>
    api.get<{ success: boolean; data: PerformanceStats }>('/analytics/stats'),
  
  // Get practice history
  getHistory: (days?: number) =>
    api.get<{ success: boolean; data: PracticeHistory }>('/analytics/history', {
      params: { days }
    }),
  
  // Get module performance
  getModulePerformance: () =>
    api.get<{ success: boolean; count: number; data: ModulePerformance[] }>('/analytics/modules'),
};

export default api;
