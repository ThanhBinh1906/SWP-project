import api from "./axiosInstance";

const tieBreakService = {
  getMySessions: () => api.get("/api/tie-breaks/my-sessions"),

  getSession: (sessionId) => api.get(`/api/tie-breaks/${sessionId}`),

  getSubmissionScores: (tieBreakSubmissionId) =>
    api.get(`/api/tie-breaks/submissions/${tieBreakSubmissionId}/scores`),

  submitScoresBulk: (tieBreakSubmissionId, data) =>
    api.post(
      `/api/tie-breaks/submissions/${tieBreakSubmissionId}/scores/bulk`,
      data,
    ),

  updateScore: (tieBreakScoreRecordId, data) =>
    api.put(`/api/tie-breaks/scores/${tieBreakScoreRecordId}`, {
      updatedScore: data.score,
      updatedComment: data.comment,
    }),

  calculateResult: (sessionId) =>
    api.post(`/api/tie-breaks/${sessionId}/calculate-result`),
};

export default tieBreakService;
