import axiosRoot from 'axios';
import { JWT_TOKEN_KEY } from '../contexts/Auth.context';

const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000/api';

export const axios = axiosRoot.create({
  baseURL: baseUrl,
});

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem(JWT_TOKEN_KEY);

  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  return config;
});

export async function getAll(url, params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const fullUrl = queryString ? `${baseUrl}/${url}?${queryString}` : `${baseUrl}/${url}`;
  const { data } = await axios.get(fullUrl); 

  return data.items;
}

export const deleteById = async (url, { arg: id }) => {
  try
  {
    await axios.delete(`${baseUrl}/${url}/${id}`); 
  } catch(error){
    return {success: false, message: error.message}
  }
};

export const getById = async (url) => {
  const { data } = await axios.get(`${baseUrl}/${url}`);
  return data;
};

export async function save(url, { arg: { id, ...data } }) {
  const response = await axios({
    method: id ? 'PUT' : 'POST',
    url: `${baseUrl}/${url}/${id ?? ''}`,
    data,
  });

  return response.data;
}

export const post = async (url, {arg}) => {
  const { data } = await axios.post(`${baseUrl}/${url}`, arg);
  
  return data;
};

export const generatePairings = async (url, { arg: { tournamentId, roundNumber } }) => {
  const { data } = await axios.post(`${baseUrl}/${url}/${tournamentId}/pairings/${roundNumber}`);
  return data;
};

export const updatePassword = async (url, { arg: { userId, currentPassword, newPassword } }) => {
  const { data } = await axios.put(`${baseUrl}/${url}/${userId}/password`, {
    currentPassword,
    newPassword,
  });
  return data;
};

export const finalizeTournament = async (
  url,
  { arg: tournamentId }
) => {
  const { data } = await axios.post(
    `${baseUrl}/${url}/${tournamentId}/finalize`
  );
  return data;
};

export const endTournament = async (url, { arg: tournamentId }) => {
  const { data } = await axios.post(
    `${baseUrl}/${url}/${tournamentId}/end`
  );
  return data;
};

export const postMakeupDay = async (url, { arg }) => {
  const { data } = await axios.post(`${baseUrl}/${url}`, arg, {
  });
  return data;
};

export const deleteMakeupDay = async (url, { arg: id }) => {
  await axios.delete(`${baseUrl}/${url}/${id}`)
}

export const requestPasswordReset = async (url, { arg: { email } }) => {
  const { data } = await axios.post(`${baseUrl}/${url}/request`, { email });
  return data;
};

export const resetPassword = async (url, { arg: { token, newPassword } }) => {
  const { data } = await axios.post(`${baseUrl}/${url}/reset`, { token, newPassword });
  return data;
};

export const validateResetToken = async (url, { arg: token }) => {
  const { data } = await axios.get(`${baseUrl}/${url}/validate/${token}`);
  return data;
};

export const generateNewPassword = async (url, { arg: { userId } }) => {
  const { data } = await axios.post(`${baseUrl}/${url}/generate-password`, { userId });
  return data;
};

export const createUserWithPassword = async (url, { arg: userData }) => {
  const { data } = await axios.post(`${baseUrl}/${url}/create-user`, userData);
  return data;
};

export async function getAlbums() {
  const { data } = await axios.get('/photos/albums');
  return data;
}

export async function getPhotos(albumId) {
  const { data } = await axios.get(`/photos/albums/${albumId}`);
  return data;
}

// Avatar functions
export const uploadAvatar = async (file) => {
  const formData = new FormData();
  formData.append('avatar', file);
  
  const { data } = await axios.post('/avatar/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
};

export const deleteAvatar = async () => {
  const { data } = await axios.delete('/avatar');
  return data;
};

export const getUserAvatar = async (userId) => {
  const { data } = await axios.get(`/avatar/${userId}`);
  return data;
};
