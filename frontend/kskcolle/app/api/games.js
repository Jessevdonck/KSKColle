import axios from 'axios'

const baseUrl = 'http://localhost:9000/api/spel'

export const getRecentGames = async (userId) => {
  try {
    console.log('Fetching recent games for user:', userId)
    const { data } = await axios.get(`${baseUrl}/speler/${userId}`)
    console.log('Received recent games data:', data)
    return data
  } catch (error) {
    console.error('Error fetching recent games:', error)
    if (axios.isAxiosError(error)) {
      console.error('Response data:', error.response?.data)
      console.error('Response status:', error.response?.status)
    }
    return []
  }
}