import axios from 'axios'

const baseUrl = 'http://localhost:9000/api/spel'

export const getRecentGames = async (userId) => {
    const { data } = await axios.get(`${baseUrl}/speler/${userId}`)
    return data
  }