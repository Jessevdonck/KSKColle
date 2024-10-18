import axios from 'axios'

const baseUrl = 'http://localhost:9000/api/tournaments'

export const getTournamentById = async (id) => {
  const response = await axios.get(`${baseUrl}/${id}`)
  return response.data
}