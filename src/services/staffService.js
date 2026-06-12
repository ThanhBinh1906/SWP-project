import api from "./axiosInstance";

const staffService = {
  getByEvent: (eventId) => api.get(`/api/events/${eventId}/staff`),
  create: (eventId, data) => api.post(`/api/events/${eventId}/staff`, data),
  toggleStatus: (eventId, accountId, action, eventRole) =>
    api.put(
      `/api/events/${eventId}/staff/${accountId}/${action}?eventRole=${eventRole}`,
    ),
  assignRound: (roundId, judgeId) =>
    api.post(`/api/rounds/${roundId}/judges`, { judgeId }),
};

export default staffService;
