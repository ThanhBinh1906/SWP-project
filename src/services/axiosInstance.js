import axios from "axios";
import { clearStoredAuth, isTokenExpired } from "../utils/tokenHelpers";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://localhost:7210",
  headers: { "Content-Type": "application/json" },
});

// Tự động gắn token vào mọi request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token && isTokenExpired(token)) {
    clearStoredAuth();
    window.location.replace("/login");
    return Promise.reject(new Error("Phiên đăng nhập đã hết hạn"));
  }

  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Tự động xử lý lỗi response
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const requestHadToken = Boolean(error.config?.headers?.Authorization);

    // 401 khi login sai không phải là một phiên đăng nhập hết hạn.
    if (status === 401 && requestHadToken) {
      clearStoredAuth();
      window.location.replace("/login");
    }

    // Trả error về để từng service tự xử lý message
    return Promise.reject(error);
  },
);

export default api;
