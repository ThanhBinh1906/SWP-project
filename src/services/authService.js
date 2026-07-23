import api from "./axiosInstance";

const authService = {
  register: (data) => api.post("/api/auth/register", data),

  login: (data) => api.post("/api/auth/login", data),

  forgotPassword: (data) => api.post("/api/auth/forgot-password", data),

  resetPassword: (data) => api.post("/api/auth/reset-password", data),

  verifyEmail: (token) =>
    api.get("/api/auth/verify-email", { params: { token } }),

  logout: () => api.post("/api/auth/logout"),

  getPendingAccounts: () => api.get("/api/auth/pending"),

  approveAccount: (id) => api.put(`/api/auth/${id}/approve`),

  rejectAccount: (id, reason) => api.put(`/api/auth/${id}/reject`, { reason }),
};

export default authService;
