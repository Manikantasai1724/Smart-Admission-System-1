import api from './api';

export const getStudents = (params = {}) => {
  return api.get('/students', { params });
};

export const getStudentById = (id) => {
  return api.get(`/students/${id}`);
};

export const uploadStudents = (formData, onUploadProgress) => {
  return api.post('/students/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  });
};

export const updateStudentStatus = (id, data) => {
  return api.put(`/students/${id}/status`, data);
};

export const deleteStudent = (id) => {
  return api.delete(`/students/${id}`);
};

export default { getStudents, getStudentById, uploadStudents, updateStudentStatus, deleteStudent };
