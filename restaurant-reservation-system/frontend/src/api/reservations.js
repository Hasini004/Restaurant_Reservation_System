import axiosClient from './axiosClient';

// --- Customer ---
export const createReservation = async (payload) => {
  const { data } = await axiosClient.post('/reservations', payload);
  return data;
};

export const getMyReservations = async () => {
  const { data } = await axiosClient.get('/reservations/my');
  return data;
};

export const cancelMyReservation = async (id) => {
  const { data } = await axiosClient.delete(`/reservations/${id}`);
  return data;
};

// --- Admin ---
export const getAllReservations = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const { data } = await axiosClient.get(`/reservations${params ? `?${params}` : ''}`);
  return data;
};

export const adminUpdateReservation = async (id, payload) => {
  const { data } = await axiosClient.put(`/reservations/${id}`, payload);
  return data;
};

export const adminCancelReservation = async (id) => {
  const { data } = await axiosClient.delete(`/reservations/${id}/admin`);
  return data;
};
