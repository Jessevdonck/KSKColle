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

export async function getAll(url, params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const fullUrl = queryString ? `${baseUrl}/${url}?${queryString}` : `${baseUrl}/${url}`;
  const { data } = await axios.get(fullUrl); 

  return data.items;
}

export async function getPaginated(url, params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const fullUrl = queryString ? `${baseUrl}/${url}?${queryString}` : `${baseUrl}/${url}`;
  const { data } = await axios.get(fullUrl); 

  return data;
}

export const deleteById = async (url, { arg: id }) => {
  try
  {
    await axios.delete(`${baseUrl}/${url}/${id}`); 
  } catch(error){
    throw error; // Re-throw the error so it can be caught by the calling function
  }
};

export const getById = async (url) => {
  const { data } = await axios.get(`${baseUrl}/${url}`);
  return data;
};

export async function save(url, { arg: { id, ...data } }) {
  const response = await axios({
    method: id ? 'PUT' : 'POST',
    url: `${baseUrl}/${url}/${id ?? ''}`,
    data,
  });

  return response.data;
}

export const post = async (url, {arg}) => {
  const { data } = await axios.post(`${baseUrl}/${url}`, arg);
  
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

export const endTournament = async (url, { arg: tournamentId }) => {
  const { data } = await axios.post(
    `${baseUrl}/${url}/${tournamentId}/end`
  );
  return data;
};

export const postMakeupDay = async (url, { arg }) => {
  const { data } = await axios.post(`${baseUrl}/${url}`, arg, {
  });
  return data;
};

export const deleteMakeupDay = async (url, { arg: id }) => {
  await axios.delete(`${baseUrl}/${url}/${id}`)
}

// Nieuwe API functies voor het hybride inhaaldag systeem
export const getAllTournamentRounds = async (tournamentId) => {
  const { data } = await axios.get(`${baseUrl}/tournamentRounds?tournament_id=${tournamentId}`);
  return data.items;
};

export const createMakeupRound = async (url, { arg }) => {
  const { data } = await axios.post(`${baseUrl}/tournamentRounds/makeup`, arg);
  return data;
};

export const addGameToMakeupRound = async (url, { arg }) => {
  // Extract roundId from the arg object
  const roundId = arg.round_id || arg.roundId;
  if (!roundId) {
    throw new Error('roundId is required but was undefined');
  }
  const { data } = await axios.post(`${baseUrl}/tournamentRounds/${roundId}/games`, arg);
  return data;
};

export const deleteMakeupRound = async (url, { arg }) => {
  console.log('deleteMakeupRound called with:', { url, arg });
  console.log('typeof arg:', typeof arg);
  console.log('arg value:', arg);
  
  // Extract roundId from the arg object
  const roundId = arg.roundId || arg;
  console.log('extracted roundId:', roundId);
  
  if (!roundId) {
    throw new Error('roundId is required but was undefined');
  }
  
  await axios.delete(`${baseUrl}/tournamentRounds/${roundId}`);
};

export const updateMakeupRoundDate = async (url, { arg }) => {
  // useSWRMutation passes { arg: { ... } } as the second parameter
  const data = arg.arg || arg;
  
  // Extract roundId from the data object
  const roundId = data.round_id || data.roundId;
  
  if (!roundId) {
    throw new Error('roundId is required but was undefined');
  }
  
  const { data: responseData } = await axios.put(`${baseUrl}/tournamentRounds/${roundId}/date`, {
    date: data.date,
    startuur: data.startuur,
  });
  return responseData;
};

export const postponeGameToMakeupRound = async (url, { arg }) => {
  const { data } = await axios.post(`${baseUrl}/tournamentRounds/postpone-game`, arg);
  return data;
};

export const requestPasswordReset = async (url, { arg: { email } }) => {
  const { data } = await axios.post(`${baseUrl}/${url}/request`, { email });
  return data;
};

export const resetPassword = async (url, { arg: { token, newPassword } }) => {
  const { data } = await axios.post(`${baseUrl}/${url}/reset`, { token, newPassword });
  return data;
};

export const validateResetToken = async (url, { arg: token }) => {
  const { data } = await axios.get(`${baseUrl}/${url}/validate/${token}`);
  return data;
};

export const generateNewPassword = async (url, { arg: { userId } }) => {
  const { data } = await axios.post(`${baseUrl}/${url}/generate-password`, { userId });
  return data;
};

export const createUserWithPassword = async (url, { arg: userData }) => {
  const { data } = await axios.post(`${baseUrl}/${url}/create-user`, userData);
  return data;
};

export async function getAlbums() {
  const { data } = await axios.get('/photos/albums');
  return data;
}

export async function getPhotos(albumId) {
  const { data } = await axios.get(`/photos/albums/${albumId}`);
  return data;
}

// Avatar functions
export const uploadAvatar = async (file) => {
  const formData = new FormData();
  formData.append('avatar', file);
  
  const { data } = await axios.post('/avatar/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
};

export const deleteAvatar = async () => {
  const { data } = await axios.delete('/avatar');
  return data;
};

export const getUserAvatar = async (userId) => {
  const { data } = await axios.get(`/avatar/${userId}`);
  return data;
};

// Round export function
export const getRoundForExport = async (tournamentId, roundId) => {
  const { data } = await axios.get(`${baseUrl}/rondes/${tournamentId}/rondes/${roundId}/export`);
  return data;
};

// Get the next upcoming round date
export const getNextRoundDate = async (tournamentId) => {
  const { data } = await axios.get(`${baseUrl}/rondes/${tournamentId}/next-round-date`);
  return data.date ? new Date(data.date) : null;
};

// Export all rounds for a specific date across all classes
export const getRoundsByDateForExport = async (tournamentId, date) => {
  const dateStr = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  const { data } = await axios.get(`${baseUrl}/rondes/${tournamentId}/export-by-date?date=${dateStr}`);
  return data;
};

// Puzzle functions
export const getAllPuzzles = async () => {
  const { data } = await axios.get(`${baseUrl}/puzzles`);
  return data.items;
};

export const getPuzzleById = async (puzzleId) => {
  const { data } = await axios.get(`${baseUrl}/puzzles/${puzzleId}`);
  return data;
};

export const createPuzzle = async (puzzleData) => {
  const { data } = await axios.post(`${baseUrl}/puzzles`, puzzleData);
  return data;
};

export const deletePuzzle = async (puzzleId) => {
  await axios.delete(`${baseUrl}/puzzles/${puzzleId}`);
};

export const updatePuzzle = async (puzzleId, puzzleData) => {
  const { data } = await axios.put(`${baseUrl}/puzzles/${puzzleId}`, puzzleData);
  return data;
};

export const savePuzzleAttempt = async (puzzleId, solveTimeMs) => {
  const { data } = await axios.post(`${baseUrl}/puzzles/${puzzleId}/attempt`, {
    solve_time_ms: solveTimeMs,
  });
  return data;
};

export const getPuzzleLeaderboard = async (puzzleId) => {
  const { data } = await axios.get(`${baseUrl}/puzzles/${puzzleId}/leaderboard`);
  return data.items;
};

export const getUserPuzzleAttempt = async (puzzleId) => {
  const { data } = await axios.get(`${baseUrl}/puzzles/${puzzleId}/attempt`);
  return data;
};

// Game postpone functions
export const postponeGame = async (url, { arg: { game_id, makeup_round_id } }) => {
  const { data } = await axios.post(`${baseUrl}/tournamentRounds/postpone`, { 
    game_id,
    ...(makeup_round_id && { makeup_round_id })
  });
  return data;
};

export const undoPostponeGame = async (url, { arg: { game_id } }) => {
  const { data } = await axios.post(`${baseUrl}/tournamentRounds/undo-postpone`, { game_id });
  return data;
};

export const undoAdminPostponeGame = async (url, { arg: { original_game_id, new_game_id } }) => {
  const { data } = await axios.post(`${baseUrl}/tournamentRounds/undo-admin-postpone`, { original_game_id, new_game_id });
  return data;
};

// Absence reporting function
export const reportAbsence = async (url, { arg: { tournament_id } }) => {
  const { data } = await axios.post(`${baseUrl}/absence`, { 
    tournament_id
  });
  return data;
};

export const getPostponableGames = async (tournamentId) => {
  const { data } = await axios.get(`${baseUrl}/tournamentRounds/postponable-games?tournament_id=${tournamentId}`);
  return data.games;
};

export const getAvailableMakeupRounds = async (tournamentId, isHerfst) => {
  const { data } = await axios.get(`${baseUrl}/tournamentRounds/available-makeup-rounds?tournament_id=${tournamentId}&is_herfst=${isHerfst}`);
  return data.rounds;
};

// Lidgeld functions
export const getLidgeldStatus = async () => {
  const { data } = await axios.get(`${baseUrl}/lidgeld`);
  return data.users;
};

export const updateLidgeldStatus = async (userId, data) => {
  const response = await axios.put(`${baseUrl}/lidgeld/${userId}`, data);
  return response.data;
};

// Article functions
export const getAllArticles = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const fullUrl = queryString ? `${baseUrl}/articles?${queryString}` : `${baseUrl}/articles`;
  const { data } = await axios.get(fullUrl);
  return data;
};

export const getRecentArticles = async (limit = 5) => {
  const { data } = await axios.get(`${baseUrl}/articles/recent?limit=${limit}`);
  return data;
};

export const getArticleById = async (articleId) => {
  const { data } = await axios.get(`${baseUrl}/articles/${articleId}`);
  return data;
};

export const createArticle = async (articleData) => {
  const { data } = await axios.post(`${baseUrl}/articles`, articleData);
  return data;
};

export const updateArticle = async (articleId, articleData) => {
  const { data } = await axios.put(`${baseUrl}/articles/${articleId}`, articleData);
  return data;
};

export const deleteArticle = async (articleId) => {
  await axios.delete(`${baseUrl}/articles/${articleId}`);
};

export const getArticleLikes = async (articleId) => {
  const { data } = await axios.get(`${baseUrl}/articles/${articleId}/likes`);
  return data;
};

export const likeArticle = async (articleId) => {
  const { data } = await axios.post(`${baseUrl}/articles/${articleId}/like`);
  return data;
};

export const unlikeArticle = async (articleId) => {
  const { data } = await axios.delete(`${baseUrl}/articles/${articleId}/like`);
  return data;
};

// Comment API functions
export const createComment = async (commentData) => {
  const { data } = await axios.post(`${baseUrl}/comments`, commentData);
  return data;
};

export const getComments = async (articleId, params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const fullUrl = queryString ? `${baseUrl}/comments/${articleId}?${queryString}` : `${baseUrl}/comments/${articleId}`;
  const { data } = await axios.get(fullUrl);
  return data;
};

export const updateComment = async (commentId, commentData) => {
  const { data } = await axios.put(`${baseUrl}/comments/${commentId}`, commentData);
  return data;
};

export const deleteComment = async (commentId) => {
  await axios.delete(`${baseUrl}/comments/${commentId}`);
};

// Notification API functions
export const getNotifications = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const fullUrl = queryString ? `${baseUrl}/notifications?${queryString}` : `${baseUrl}/notifications`;
  const { data } = await axios.get(fullUrl);
  return data;
};

export const markNotificationAsRead = async (notificationId) => {
  await axios.put(`${baseUrl}/notifications/${notificationId}/read`);
};

export const markAllNotificationsAsRead = async () => {
  await axios.put(`${baseUrl}/notifications/read-all`);
};

export const deleteNotification = async (notificationId) => {
  await axios.delete(`${baseUrl}/notifications/${notificationId}`);
};