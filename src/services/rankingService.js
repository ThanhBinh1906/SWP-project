import api from "./axiosInstance";

const rankingService = {
  calculateRound: (roundId) => api.post(`/api/rankings/rounds/${roundId}/calculate`),
  getRoundLeaderboard: (roundId) => api.get(`/api/rankings/rounds/${roundId}`),
  getTeamRanking: (roundId, teamId) =>
    api.get(`/api/rankings/rounds/${roundId}/teams/${teamId}`),
  getTrackLeaderboard: (trackId) =>
    api.get(`/api/rankings/tracks/${trackId}`),
  getEventLeaderboard: (eventId) =>
    api.get(`/api/rankings/events/${eventId}`),
  exportRound: (roundId) =>
    api.get(`/api/rankings/rounds/${roundId}/export`, {
      responseType: "blob",
    }),
  exportEvent: (eventId) =>
    api.get(`/api/rankings/events/${eventId}/export`, {
      responseType: "blob",
    }),
};

export default rankingService;
