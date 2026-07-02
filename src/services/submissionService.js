import api from "./axiosInstance";

const submissionService = {
  create: (roundId, data) =>
    api.post(`/api/rounds/${roundId}/submissions`, data),

  getByRound: (roundId) =>
    api.get(`/api/rounds/${roundId}/submissions`),

  importSubmissions: (roundId, data) =>
    api.post(`/api/admin/rounds/${roundId}/submissions/import`, data),

  getById: (id) => api.get(`/api/submissions/${id}`),

  update: (id, data) => api.put(`/api/submissions/${id}`, data),

  getByTeam: (teamId) => api.get(`/api/teams/${teamId}/submissions`),

  disqualify: (id, reason) =>
    api.put(`/api/submissions/${id}/disqualify`, { reason }),
};

export default submissionService;
