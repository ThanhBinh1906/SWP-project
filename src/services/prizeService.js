import api from "./axiosInstance";

const prizeService = {
  getByTrack: (trackId) => api.get(`/api/prizes/tracks/${trackId}`),
  create: (trackId, data) => api.post(`/api/prizes/tracks/${trackId}`, data),
  update: (prizeId, data) => api.put(`/api/prizes/${prizeId}`, data),
  remove: (prizeId) => api.delete(`/api/prizes/${prizeId}`),
  getWinners: (roundId) => api.get(`/api/prizes/rounds/${roundId}/winners`),
  exportWinners: (roundId) =>
    api.get(`/api/prizes/rounds/${roundId}/winners/export`, {
      responseType: "blob",
    }),
};

export default prizeService;
