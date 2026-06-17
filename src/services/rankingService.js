import api from "./axiosInstance";

const rankingService = {
  calculateRound: (roundId) => api.post(`/api/rankings/rounds/${roundId}/calculate`),
  getRoundLeaderboard: (roundId) => api.get(`/api/rankings/rounds/${roundId}`),
  getTeamRanking: (roundId, teamId) =>
    api.get(`/api/rankings/rounds/${roundId}/teams/${teamId}`),
};

export default rankingService;
