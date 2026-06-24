import api from "./axiosInstance";

const dashboardService = {
  getCoordinatorDashboard: () => api.get("/api/dashboard/coordinator"),

  getRblCriteriaVariance: (eventId) =>
    api.get(`/api/rbl/events/${eventId}/criteria-variance`),

  downloadAnonymousRblCsv: (eventId) =>
    api.get(`/api/rbl/events/${eventId}/export-anonymous`, {
      responseType: "blob",
    }),
};

export default dashboardService;
