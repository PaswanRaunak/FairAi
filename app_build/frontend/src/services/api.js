/**
 * FairLens AI — API Service Layer
 * Centralized API client for backend communication.
 */

import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Inject auth token into every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fairlens_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response error handler
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('fairlens_token');
      localStorage.removeItem('fairlens_user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// ===== Auth =====
export const authAPI = {
  guestLogin: () => api.post('/auth/guest'),
};

// ===== Datasets =====
export const datasetAPI = {
  listDemo: () => api.get('/datasets/demo'),
  loadDemo: (name) => api.get(`/datasets/demo/${name}`),
  upload: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/datasets/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getPreview: (id) => api.get(`/datasets/${id}/preview`),
  getSensitive: (id) => api.get(`/datasets/${id}/sensitive`),
};

// ===== Bias Analysis =====
export const biasAPI = {
  trainModel: (data) => api.post('/bias/train-model', data),
  analyze: (data) => api.post('/bias/analyze', data),
};

// ===== Gemini AI =====
export const geminiAPI = {
  explain: (data) => api.post('/gemini/explain', data),
  mitigate: (data) => api.post('/gemini/mitigate', data),
  executiveSummary: (data) => api.post('/gemini/executive-summary', data),
};

// ===== Explainability =====
export const explainAPI = {
  shap: (data) => api.post('/explain/shap', data),
};

// ===== Simulation =====
export const simulateAPI = {
  threshold: (data) => api.post('/simulate/threshold', data),
};

// ===== Reports =====
export const reportAPI = {
  generate: async (data) => {
    const response = await api.post('/reports/generate', data, {
      responseType: 'blob',
    });
    return response;
  },
};

export default api;
