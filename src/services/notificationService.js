import api from "./axiosInstance";

const notificationService = {
  getAll: (params) => api.get("/api/notifications", { params }),
  markAsRead: (id) => api.put(`/api/notification/${id}/read`),
  markAllAsRead: () => api.put("/api/notifications/read-all"),
};

export default notificationService;
