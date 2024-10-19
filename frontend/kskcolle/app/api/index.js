import axios from 'axios';

const baseUrl = 'http://localhost:9000/api'; 

export async function getAll(url) {
  const { data } = await axios.get(`${baseUrl}/${url}`); 

  return data.items;
}

export const deleteById = async (url, { arg: id }) => {
  try{
    await axios.delete(`${baseUrl}/${url}/${id}`); 
  } catch(error){
    return {success: false, message: error.message}
  }
  
};