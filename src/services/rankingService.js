import api from "./axiosInstance";

const rankingService = {
  calculateRound: (roundId) => api.post(`/api/rankings/rounds/${roundId}/calculate`),
  getRoundLeaderboard: (roundId) => api.get(`/api/rankings/rounds/${roundId}`),
  getTeamRanking: (roundId, teamId) =>
    api.get(`/api/rankings/rounds/${roundId}/teams/${teamId}`),
  getEventLeaderboard: (eventId) =>
    api.get(`/api/rankings/events/${eventId}`),
  getPublicEvents: () => api.get("/api/public/events/summary"),
  getLandingEvents: (params = {}) => api.get("/api/public/events", { params }),
  getPublicEventResults: (eventId) =>
    api.get(`/api/public/events/${eventId}/results`),
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
