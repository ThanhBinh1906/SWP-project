import api from "./axiosInstance";

const auditLogService = {
  getJudgeScoreLogs: (params) =>
    api.get("/api/audit-logs/judges/scores", { params }),

  getCoordinatorScoreLogs: (params) =>
    api.get("/api/audit-logs/coordinators/scores", { params }),
};

export default auditLogService;
