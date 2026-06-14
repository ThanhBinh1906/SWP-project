import axiosInstance from "./axiosInstance";

const problemService = {
  // Coordinator: lấy tất cả đề theo roundId
  getByRound: (roundId) =>
    axiosInstance.get(`/api/problems?roundId=${roundId}`),

  // Leader: lấy đề được assign cho team mình
  // endpoint chưa xác định — cập nhật lại khi có API docs
  getMyProblem: (teamId) => axiosInstance.get(`/api/problems/team/${teamId}`),
};

export default problemService;
