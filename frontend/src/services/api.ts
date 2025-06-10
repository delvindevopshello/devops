import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/login', credentials),
  register: (userData: any) =>
    api.post('/auth/register', userData),
  getProfile: () =>
    api.get('/auth/profile'),
};

// Jobs API
export const jobsApi = {
  getJobs: (params?: { page?: number; limit?: number; search?: string; location?: string }) =>
    api.get('/jobs', { params }),
  getJob: (id: string) =>
    api.get(`/jobs/${id}`),
  createJob: (jobData: any) =>
    api.post('/jobs', jobData),
  updateJob: (id: string, jobData: any) =>
    api.put(`/jobs/${id}`, jobData),
  deleteJob: (id: string) =>
    api.delete(`/jobs/${id}`),
  applyToJob: (jobId: string, applicationData: any) =>
    api.post(`/jobs/${jobId}/apply`, applicationData),
};

// Applications API
export const applicationsApi = {
  getUserApplications: () =>
    api.get('/applications/user'),
  getJobApplications: (jobId: string) =>
    api.get(`/applications/job/${jobId}`),
};

// Admin API
export const adminApi = {
  getPendingJobs: () =>
    api.get('/admin/jobs/pending'),
  approveJob: (jobId: string) =>
    api.post(`/admin/jobs/${jobId}/approve`),
  rejectJob: (jobId: string) =>
    api.post(`/admin/jobs/${jobId}/reject`),
  getStats: () =>
    api.get('/admin/stats'),
};

export default api;