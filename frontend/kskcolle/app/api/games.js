import axios from 'axios'

const baseUrl = 'http://localhost:9000/api/spel'

export const getRecentGames = async (userId) => {
  try{
    const { data } = await axios.get(`${baseUrl}/speler/${userId}`)
    return data
  } catch(error){
    console.log(error)
  }
}

export const updateGame = async (gameId, gameData) => {
  const response = await axios.put(`${baseUrl}/${gameId}`, gameData)
  return response.data
}