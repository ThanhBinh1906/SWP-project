import api from "./axiosInstance";

const scoreService = {
  submit: (submissionId, data) =>
    api.post(`/api/scores/submissions/${submissionId}`, data),

  getBySubmission: (submissionId) =>
    api.get(`/api/scores/submissions/${submissionId}`),

  update: (scoreRecordId, data) =>
    api.put(`/api/scores/${scoreRecordId}`, data),

  importScores: (roundId, data) =>
    api.post(`/api/admin/rounds/${roundId}/scores/import`, data),

  getHistory: (params = {}) => api.get("/api/scores/history", { params }),
};

export default scoreService;
