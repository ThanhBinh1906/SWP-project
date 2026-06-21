import api from "./axiosInstance";

const mentorService = {
  getTeams: () => api.get("/api/mentor/teams"),
};

export default mentorService;
