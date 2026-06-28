import api from "./axiosInstance";

const tieBreakService = {
  createForRank: (roundId, rankPosition) =>
    api.post(`/api/tie-breaks/rounds/${roundId}/rank/${rankPosition}`),

  getMySessions: () => api.get("/api/tie-breaks/my-sessions"),

  getSession: (sessionId) => api.get(`/api/tie-breaks/${sessionId}`),

  getSubmissionScores: (tieBreakSubmissionId) =>
    api.get(`/api/tie-breaks/submissions/${tieBreakSubmissionId}/scores`),

  submitScore: (tieBreakSubmissionId, data) =>
    api.post(`/api/tie-breaks/submissions/${tieBreakSubmissionId}/scores`, data),

  updateScore: (tieBreakScoreRecordId, data) =>
    api.put(`/api/tie-breaks/scores/${tieBreakScoreRecordId}`, data),

  calculateResult: (sessionId) =>
    api.post(`/api/tie-breaks/${sessionId}/calculate-result`),
};

export default tieBreakService;
