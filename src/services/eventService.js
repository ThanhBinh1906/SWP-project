import api from "./axiosInstance";

const eventService = {
  getAll: () => api.get("/api/events"),
  getById: (id) => api.get(`/api/events/${id}`),
  create: (data) => api.post("/api/events", data),
  createFull: (data) => api.post("/api/events/full-template", data),
  clone: (id, data) => api.post(`/api/events/${id}/clone`, data),
  update: (id, data) => api.put(`/api/events/${id}`, data),
  remove: (id) => api.delete(`/api/events/${id}`),
  getActiveEvent: () => api.get("/api/events/active"),
  getRounds: (eventId) => api.get(`/api/events/${eventId}/rounds`),

  // Tracks
  getTracks: (eventId) => api.get(`/api/events/${eventId}/tracks`),
  createTrack: (data) => api.post("/api/tracks", data),
  updateTrack: (id, data) => api.put(`/api/tracks/${id}`, data),

  // Rounds
  getTracksRounds: () => api.get("/api/tracks/rounds"),
  createRound: (data) => api.post("/api/rounds", data),
  updateRound: (id, data) => api.put(`/api/rounds/${id}`, data),
  updateRoundStatus: (id, status) =>
    api.put(`/api/rounds/${id}/status`, { status }),
};

export default eventService;
