import api from "./axiosInstance";

const eventService = {
  getAll: () => api.get("/api/events"),
  getActive: () => api.get("/api/events/active"),
  createFull: (data) => api.post("/api/events/full-template", data),
  clone: (id, data) => api.post(`/api/events/${id}/clone`, data),
  update: (id, data) => api.put(`/api/events/${id}`, data),
  remove: (id) => api.delete(`/api/events/${id}`),
  getRounds: (eventId) => api.get(`/api/events/${eventId}/rounds`),
};

export default eventService;
