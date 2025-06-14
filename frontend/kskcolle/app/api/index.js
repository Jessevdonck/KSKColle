import axiosRoot from 'axios';
import { JWT_TOKEN_KEY } from '../contexts/Auth.context';

const baseUrl = process.env.NEXT_PUBLIC_API_URL;

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

export async function getAll(url) {
  const { data } = await axios.get(`${baseUrl}/${url}`); 

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
  await axios({
    method: id ? 'PUT' : 'POST',
    url: `${baseUrl}/${url}/${id ?? ''}`,
    data,
  });
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

export const endTournament = async (
  url,
  { arg: tournamentId }
) => {
  const { data } = await axios.post(
    `${baseUrl}/${url}/${tournamentId}/end`
  );
  return data;
};
