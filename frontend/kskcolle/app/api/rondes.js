// api/rounds.ts
import axios from 'axios'

const baseUrl = 'http://localhost:9000/api/rondes'

export const getAllRounds = async () => {
  const response = await axios.get(baseUrl)
  return response.data.items
}

export const getRoundsByTournamentId = async (tournamentId) => {
  const response = await axios.get(`${baseUrl}/${tournamentId}/rondes`)
  return response.data.items
}

export const getRoundById = async (tournamentId, roundId) => {
  const response = await axios.get(`${baseUrl}/${tournamentId}/rondes/${roundId}`)
  return response.data
}

export const createRound = async (roundData) => {
  const response = await axios.post(baseUrl, roundData)
  return response.data
}

export const updateRound = async (tournamentId, roundId, roundData) => {
  const response = await axios.put(`${baseUrl}/${tournamentId}/rondes/${roundId}`, roundData)
  return response.data
}

export const deleteRound = async (tournamentId, roundId) => {
  await axios.delete(`${baseUrl}/${tournamentId}/rondes/${roundId}`)
}