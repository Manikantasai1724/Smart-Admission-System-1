import api from './api';

export const getStats = (params = {}) => {
  return api.get('/dashboard/stats', { params });
};

export const getDepartmentProgress = (params = {}) => {
  return api.get('/dashboard/department-progress', { params });
};

export default { getStats, getDepartmentProgress };
