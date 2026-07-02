import api from './api';

export const getStats = (params = {}) => {
  return api.get('/dashboard/stats', { params });
};

export const getDepartmentProgress = () => {
  return api.get('/dashboard/department-progress');
};

export default { getStats, getDepartmentProgress };
