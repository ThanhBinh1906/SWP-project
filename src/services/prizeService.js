import api from "./axiosInstance";

const prizeService = {
  getByEvent: (eventId) => api.get(`/api/prizes/events/${eventId}`),
  createForEvent: (eventId, data) =>
    api.post(`/api/prizes/events/${eventId}`, data),
  update: (prizeId, data) => api.put(`/api/prizes/${prizeId}`, data),
  remove: (prizeId) => api.delete(`/api/prizes/${prizeId}`),
  getEventWinners: (eventId) =>
    api.get(`/api/prizes/events/${eventId}/winners`),
  exportEventWinners: (eventId) =>
    api.get(`/api/prizes/events/${eventId}/winners/export`, {
      responseType: "blob",
    }),
};

export default prizeService;
