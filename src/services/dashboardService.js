import api from "./axiosInstance";

const dashboardService = {
  getCoordinatorDashboard: () => api.get("/api/dashboard/coordinator"),
};

export default dashboardService;
