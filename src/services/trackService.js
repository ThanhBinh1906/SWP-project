import api from "./axiosInstance";

const trackService = {
  getByEvent: (eventId) => api.get(`/api/events/${eventId}/tracks`),
  create: (data) => api.post("/api/tracks", data),
  update: (id, data) => api.put(`/api/tracks/${id}`, data),
  assignMentor: (id, mentorId) =>
    api.post(`/api/tracks/${id}/mentors`, { mentorId }),
  assignMentorTeams: (trackId, mentorId, data) =>
    api.put(`/api/tracks/${trackId}/mentors/${mentorId}/teams`, data),
  getMentorTeams: (trackId, mentorId) =>
    api.get(`/api/tracks/${trackId}/mentors/${mentorId}/teams`),
};

export default trackService;
