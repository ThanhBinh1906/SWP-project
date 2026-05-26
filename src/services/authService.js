import api from "./axiosInstance";

const authService = {
  register: (data) => api.post("/Auth/register", data),

  login: (data) => api.post("/Auth/login", data),

  logout: () => api.post("/Auth/logout"),

  getPendingAccounts: () => api.get("/Auth/pending"),

  approveAccount: (id) => api.put(`/Auth/${id}/approve`),

  rejectAccount: (id, reason) => api.put(`/Auth/${id}/reject`, { reason }),
};

export default authService;
