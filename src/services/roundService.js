import api from "./axiosInstance";

const roundService = {
  getTracksRounds: () => api.get("/api/tracks/rounds"),
  getByTrack: (trackId) => api.get(`/api/tracks/${trackId}/rounds`),
  getAssigned: () => api.get("/api/rounds/assigned"),
  create: (data) => api.post("/api/rounds", data),
  update: (id, data) => api.put(`/api/rounds/${id}`, data),
  updateStatus: (id, status) =>
    api.put(`/api/rounds/${id}/status`, { status }),
};

export default roundService;
