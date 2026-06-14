import api from "./axiosInstance";

const scoreService = {
  submit: (submissionId, data) =>
    api.post(`/api/scores/submissions/${submissionId}`, data),

  getBySubmission: (submissionId) =>
    api.get(`/api/scores/submissions/${submissionId}`),

  update: (scoreRecordId, data) =>
    api.put(`/api/scores/${scoreRecordId}`, data),
};

export default scoreService;
