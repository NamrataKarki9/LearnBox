// Centralized API configuration
// In production, VITE_API_URL is set in Render's environment variables
// In development, falls back to localhost:5000
export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
