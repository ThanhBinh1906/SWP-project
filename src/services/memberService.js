import api from "./axiosInstance";

const memberService = {
  addMember: (teamId, data) => api.post(`/teams/${teamId}/members`, data),
  updateMember: (teamId, memberId, data) =>
    api.put(`/teams/${teamId}/members/${memberId}`, data),
  deleteMember: (teamId, memberId) =>
    api.delete(`/teams/${teamId}/members/${memberId}`),
};

export default memberService;
