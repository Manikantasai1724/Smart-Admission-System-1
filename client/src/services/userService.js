import api from './api';

export const getUsers = (options = {}) => {
  return api.get('/users', options);
};

export const createUser = (data) => {
  return api.post('/users', data);
};

export const updateUser = (id, data) => {
  return api.put(`/users/${id}`, data);
};

export const deleteUser = (id) => {
  return api.delete(`/users/${id}`);
};

export default { getUsers, createUser, updateUser, deleteUser };
