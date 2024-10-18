import axios from 'axios'

const baseUrl = 'http://localhost:9000/api/spelers'

export const getAll = async () => {
  const { data } = await axios.get(baseUrl)
  return data.items
}

export const getFideById = async (fideId) => {
  const response = await axios.get(`http://localhost:3000/player/${fideId}/info`)
  return response.data;
}

export const getByName = async (voornaam, achternaam) => {
  const encodedVoornaam = encodeURIComponent(voornaam);
  const encodedAchternaam = encodeURIComponent(achternaam);
  const { data } = await axios.get(`${baseUrl}/by-name`, { 
    params: { 
      voornaam: encodedVoornaam, 
      achternaam: encodedAchternaam 
    } 
  })
  return data
}

