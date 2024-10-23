import axios from 'axios';

const baseUrl = 'http://localhost:9000/api'; 

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