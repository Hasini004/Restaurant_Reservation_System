import axiosClient from './axiosClient';

export const getTables = async () => {
  const { data } = await axiosClient.get('/tables');
  return data;
};

export const createTable = async (payload) => {
  const { data } = await axiosClient.post('/tables', payload);
  return data;
};

export const updateTable = async (id, payload) => {
  const { data } = await axiosClient.put(`/tables/${id}`, payload);
  return data;
};

export const deleteTable = async (id) => {
  const { data } = await axiosClient.delete(`/tables/${id}`);
  return data;
};
