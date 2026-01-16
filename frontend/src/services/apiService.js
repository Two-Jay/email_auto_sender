import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 에러 처리
api.interceptors.response.use(
  response => response,
  error => {
    const message = error.response?.data?.message || error.message || '오류가 발생했습니다.';
    console.error('API Error:', message);
    return Promise.reject(new Error(message));
  }
);

// 이메일 API
export const emailAPI = {
  send: (data) => api.post('/email/send', data),
  sendBulk: (data) => api.post('/email/send-bulk', data),
  preview: (data) => api.post('/email/preview', data),
  sendTest: (to) => api.post('/email/test', { to }),
  testConnection: () => api.get('/email/test-connection')
};

// 템플릿 API
export const templateAPI = {
  getAll: () => api.get('/templates'),
  getById: (id) => api.get(`/templates/${id}`),
  create: (data) => api.post('/templates', data),
  update: (id, data) => api.put(`/templates/${id}`, data),
  delete: (id) => api.delete(`/templates/${id}`),
  preview: (id, sampleVariables) => api.post(`/templates/${id}/preview`, { sampleVariables })
};

// 수신자 API
export const recipientAPI = {
  getAll: () => api.get('/recipients'),
  getById: (id) => api.get(`/recipients/${id}`),
  create: (data) => api.post('/recipients', data),
  update: (id, data) => api.put(`/recipients/${id}`, data),
  delete: (id) => api.delete(`/recipients/${id}`),
  uploadFile: (formData) => api.post('/recipients/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  parseFile: (formData) => api.post('/recipients/parse', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
};

// 발신자 API
export const senderAPI = {
  getAll: () => api.get('/senders'),
  getById: (id) => api.get(`/senders/${id}`),
  create: (data) => api.post('/senders', data),
  update: (id, data) => api.put(`/senders/${id}`, data),
  delete: (id) => api.delete(`/senders/${id}`),
  getDefault: () => api.get('/senders/default/current')
};

export default api;
