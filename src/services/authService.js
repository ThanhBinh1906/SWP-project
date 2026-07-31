import api from "./axiosInstance";

const authService = {
  register: (data) => api.post("/api/auth/register", data),

  login: (data) => api.post("/api/auth/login", data),

  forgotPassword: (data) => api.post("/api/auth/forgot-password", data),

  resetPassword: (data) => api.post("/api/auth/reset-password", data),

  verifyEmail: (token) =>
    api.get("/api/auth/verify-email", { params: { token } }),

  logout: () => api.post("/api/auth/logout"),
};

export default authService;
