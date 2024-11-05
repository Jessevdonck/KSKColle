import axios from 'axios'

const baseUrl = 'http://localhost:9000/api/toernooien'

export const getTournamentById = async (id) => {
  const response = await axios.get(`${baseUrl}/${id}`)
  return response.data
}

export const addTournament = async (tournamentData) => {
  const response = await axios.post(baseUrl, tournamentData)
  return response.data
}

export const updateTournament = async (tournamentId, tournamentData) => {
  const response = await axios.put(`${baseUrl}/${tournamentId}`, tournamentData)
  return response.data
}

export const createPairings = async (tournamentId, roundNumber) => {
  const response = await axios.post(`${baseUrl}/${tournamentId}/pairings/${roundNumber}`)
  return response.data
}

export const updateRatings = async (tournamentId) => {
  const response = await axios.post(`${baseUrl}/${tournamentId}/update-ratings`)
  return response.data
}

export const registerPlayer = async (tournamentId, userId) => {
  const response = await axios.post(`${baseUrl}/${tournamentId}/register`, { user_id: userId })
  return response.data
}