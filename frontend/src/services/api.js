import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 템플릿 API
export const templateAPI = {
  getAll: () => api.get('/template/'),
  get: (id) => api.get(`/template/${id}`),
  create: (data) => api.post('/template/', data),
  update: (id, data) => api.put(`/template/${id}`, data),
  delete: (id) => api.delete(`/template/${id}`),
};

// 수신자 API
export const recipientAPI = {
  getAll: () => api.get('/recipient/'),
  get: (id) => api.get(`/recipient/${id}`),
  create: (data) => api.post('/recipient/', data),
  createBulk: (data) => api.post('/recipient/bulk', data),
  update: (id, data) => api.put(`/recipient/${id}`, data),
  delete: (id) => api.delete(`/recipient/${id}`),
  deleteAll: () => api.delete('/recipient/'),
};

// 업로드 API
export const uploadAPI = {
  uploadExcel: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload/excel', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  getImages: () => api.get('/upload/images'),
  deleteImage: (filename) => api.delete(`/upload/image/${filename}`),
};

// 이메일 API
export const emailAPI = {
  send: (data) => api.post('/email/send', data),
  sendBulk: (data) => api.post('/email/send-bulk', data),
  preview: (data) => api.post('/email/preview', data),
  validateTemplate: (subject, content, variables) =>
    api.post('/email/validate-template', null, {
      params: { template_subject: subject, template_content: content },
      data: variables,
    }),
};

export default api;
