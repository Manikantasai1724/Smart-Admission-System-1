import api from './api';

export const getStats = (params = {}, options = {}) => {
  return api.get('/dashboard/stats', { params, ...options });
};

export const getDepartmentProgress = (params = {}, options = {}) => {
  return api.get('/dashboard/department-progress', { params, ...options });
};

export default { getStats, getDepartmentProgress };
