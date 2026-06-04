import api from "./axiosInstance";

const teamService = {
  // Leader
  createTeam: (data) => api.post("/teams", data),
  getMyTeam: () => api.get("/teams/my-team"), // TODO: khi BE có
  updateTeam: (id, data) => api.put(`/teams/${id}`, data),

  // Coordinator
  getAllTeams: () => api.get("/admin/teams"),
  approveTeam: (id) => api.put(`/teams/${id}/approve`),
  disqualifyTeam: (id, reason) =>
    api.put(`/teams/${id}/disqualify`, { reason }),
  assignMentor: (id, mentorId) => api.put(`/teams/${id}/mentor`, { mentorId }),
};

export default teamService;
