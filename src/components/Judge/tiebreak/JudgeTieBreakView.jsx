import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, ExternalLink, Loader2 } from "lucide-react";
import tieBreakService from "../../../services/tieBreakService";
import { getApiMessage } from "../../Coordinator/coordinatorHelpers";
import { EmptyState } from "../shared/EmptyState";
import { JudgeActionButton } from "../shared/JudgeActionButton";
import { JudgeBadge } from "../shared/JudgeBadge";
import { JudgePanel } from "../shared/JudgePanel";
import { judgeIcons } from "../shared/judgeIcons";

function getId(item) {
  return item?.id || item?.sessionId || item?.tieBreakSessionId;
}

function getSubmissionId(item) {
  return item?.id || item?.tieBreakSubmissionId;
}

function normalizeArray(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.items)) return value.items;
  return [];
}

function getSessionSubmissions(session) {
  return normalizeArray(
    session?.tieBreakSubmissions ||
      session?.submissions ||
      session?.items ||
      session?.data?.submissions,
  );
}

function getSessionCriteria(session) {
  return normalizeArray(
    session?.criteria ||
      session?.criterions ||
      session?.roundCriteria ||
      session?.data?.criteria,
  );
}

function formatDateTime(value) {
  if (!value) return "Không xác định";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN");
}

function normalizeWeight(weight) {
  const numeric = Number(weight || 0);
  if (!Number.isFinite(numeric)) return 0;
  return numeric > 1 ? numeric / 100 : numeric;
}

function calculateDraftTotal(submissionId, criteria, scores) {
  return criteria.reduce((total, criterion) => {
    const value = Number(scores[submissionId]?.[criterion.id]);
    const maxScore = Number(criterion.maxScore || 0);
    if (!Number.isFinite(value) || maxScore <= 0) return total;
    return total + (value / maxScore) * normalizeWeight(criterion.weight) * 100;
  }, 0);
}

function formatScore(value) {
  if (value === null || value === undefined || value === "") return "—";
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return value;
  return Number.isInteger(numeric) ? String(numeric) : numeric.toFixed(2);
}

function SubmissionLink({ submission }) {
  const href =
    submission?.presentationUrl ||
    submission?.submission?.presentationUrl ||
    submission?.reportUrl ||
    submission?.demoUrl;

  if (!href) return <span className="text-slate-400">Chưa có link</span>;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 font-semibold text-orange-700 hover:underline"
    >
      Mở bài nộp
      <ExternalLink className="h-4 w-4" />
    </a>
  );
}

function validateScores(submissionId, criteria, scores) {
  const errors = {};
  criteria.forEach((criterion) => {
    const value = scores[submissionId]?.[criterion.id];
    const numeric = Number(value);
    const maxScore = Number(criterion.maxScore || 0);
    if (value === undefined || value === "") {
      errors[criterion.id] = "Vui lòng nhập điểm.";
    } else if (!Number.isFinite(numeric)) {
      errors[criterion.id] = "Điểm phải là số.";
    } else if (numeric < 0 || numeric > maxScore) {
      errors[criterion.id] = `Điểm phải nằm trong khoảng 0 - ${maxScore}.`;
    }
  });
  return errors;
}

export function JudgeTieBreakView() {
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [sessionDetail, setSessionDetail] = useState(null);
  const [scoresBySubmission, setScoresBySubmission] = useState({});
  const [scores, setScores] = useState({});
  const [comments, setComments] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [submittingId, setSubmittingId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedSession = useMemo(
    () => sessions.find((session) => String(getId(session)) === selectedSessionId),
    [selectedSessionId, sessions],
  );

  const criteria = useMemo(() => getSessionCriteria(sessionDetail), [sessionDetail]);
  const submissions = useMemo(
    () => getSessionSubmissions(sessionDetail),
    [sessionDetail],
  );

  const loadSessions = useCallback(async () => {
    setLoadingSessions(true);
    setError("");
    try {
      const response = await tieBreakService.getMySessions();
      const list = normalizeArray(response.data?.data);
      setSessions(list);
      setSelectedSessionId((current) => {
        if (current && list.some((session) => String(getId(session)) === current)) {
          return current;
        }
        return list[0] ? String(getId(list[0])) : "";
      });
    } catch (requestError) {
      setSessions([]);
      setSelectedSessionId("");
      setError(getApiMessage(requestError, "Không thể tải danh sách tie-break."));
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const loadSessionDetail = useCallback(async () => {
    if (!selectedSessionId) {
      setSessionDetail(null);
      return;
    }

    setLoadingDetail(true);
    setError("");
    setSuccess("");
    try {
      const response = await tieBreakService.getSession(selectedSessionId);
      const detail = response.data?.data || {};
      const nextSubmissions = getSessionSubmissions(detail);
      const nextScoresBySubmission = {};
      const nextScores = {};
      const nextComments = {};

      await Promise.all(
        nextSubmissions.map(async (submission) => {
          const tieBreakSubmissionId = getSubmissionId(submission);
          if (!tieBreakSubmissionId) return;
          try {
            const scoreResponse =
              await tieBreakService.getSubmissionScores(tieBreakSubmissionId);
            const records = normalizeArray(scoreResponse.data?.data);
            nextScoresBySubmission[tieBreakSubmissionId] = records;
            nextScores[tieBreakSubmissionId] = {};
            nextComments[tieBreakSubmissionId] = {};
            records.forEach((record) => {
              nextScores[tieBreakSubmissionId][record.criterionId] = String(
                record.score ?? record.newScore ?? "",
              );
              nextComments[tieBreakSubmissionId][record.criterionId] =
                record.comment || record.newComment || "";
            });
          } catch {
            nextScoresBySubmission[tieBreakSubmissionId] = [];
            nextScores[tieBreakSubmissionId] = {};
            nextComments[tieBreakSubmissionId] = {};
          }
        }),
      );

      setSessionDetail(detail);
      setScoresBySubmission(nextScoresBySubmission);
      setScores(nextScores);
      setComments(nextComments);
      setFieldErrors({});
    } catch (requestError) {
      setSessionDetail(null);
      setError(getApiMessage(requestError, "Không thể tải chi tiết tie-break."));
    } finally {
      setLoadingDetail(false);
    }
  }, [selectedSessionId]);

  useEffect(() => {
    loadSessionDetail();
  }, [loadSessionDetail]);

  const handleScoreChange = (submissionId, criterionId, value) => {
    const normalizedValue = value.replace(",", ".");
    if (normalizedValue !== "" && !/^\d*(\.\d*)?$/.test(normalizedValue)) {
      return;
    }
    setScores((current) => ({
      ...current,
      [submissionId]: {
        ...(current[submissionId] || {}),
        [criterionId]: normalizedValue,
      },
    }));
    setFieldErrors((current) => ({
      ...current,
      [submissionId]: {
        ...(current[submissionId] || {}),
        [criterionId]: "",
      },
    }));
    setSuccess("");
  };

  const handleCommentChange = (submissionId, criterionId, value) => {
    setComments((current) => ({
      ...current,
      [submissionId]: {
        ...(current[submissionId] || {}),
        [criterionId]: value,
      },
    }));
  };

  const submitSubmissionScores = async (submission) => {
    const submissionId = getSubmissionId(submission);
    const validationErrors = validateScores(submissionId, criteria, scores);
    if (Object.keys(validationErrors).length) {
      setFieldErrors((current) => ({
        ...current,
        [submissionId]: validationErrors,
      }));
      return;
    }

    setSubmittingId(submissionId);
    setError("");
    setSuccess("");
    try {
      for (const criterion of criteria) {
        const existingRecord = (scoresBySubmission[submissionId] || []).find(
          (record) => record.criterionId === criterion.id,
        );
        const score = Number(scores[submissionId]?.[criterion.id]);
        const comment = comments[submissionId]?.[criterion.id]?.trim() || null;

        if (existingRecord?.id || existingRecord?.tieBreakScoreRecordId) {
          await tieBreakService.updateScore(
            existingRecord.id || existingRecord.tieBreakScoreRecordId,
            { score, comment },
          );
        } else {
          await tieBreakService.submitScore(submissionId, {
            criterionId: criterion.id,
            score,
            comment,
          });
        }
      }

      setSuccess("Đã lưu điểm tie-break.");
      await loadSessionDetail();
    } catch (requestError) {
      setError(getApiMessage(requestError, "Lưu điểm tie-break thất bại."));
    } finally {
      setSubmittingId("");
    }
  };

  if (loadingSessions) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
        Đang tải tie-break...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <JudgePanel
        title="Phiên xử lý đồng hạng"
        subtitle="Các phiên chấm lại khi có đội đồng điểm ở vị trí quan trọng"
        icon={judgeIcons.Scale}
        actions={
          <JudgeActionButton
            onClick={loadSessions}
            disabled={loadingSessions}
            icon={loadingSessions ? Loader2 : judgeIcons.Clock}
          >
            Tải lại
          </JudgeActionButton>
        }
      >
        {sessions.length === 0 ? (
          <EmptyState
            icon={judgeIcons.Scale}
            title="Chưa có tie-break"
            description="Khi có đội đồng hạng ở vị trí quan trọng, phiên chấm bổ sung sẽ xuất hiện tại đây."
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-[minmax(240px,360px)_1fr]">
            <div className="space-y-2">
              {sessions.map((session) => {
                const sessionId = String(getId(session));
                const active = selectedSessionId === sessionId;
                return (
                  <button
                    key={sessionId}
                    type="button"
                    onClick={() => setSelectedSessionId(sessionId)}
                    className={`w-full rounded-xl border p-3 text-left transition ${
                      active
                        ? "border-orange-300 bg-orange-50"
                        : "border-slate-200 bg-white hover:border-orange-200"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-slate-900">
                        {session.roundName || `Phiên ${sessionId.slice(0, 8)}`}
                      </p>
                      <JudgeBadge tone={session.status === "Completed" ? "success" : "warning"}>
                        {session.status || "Pending"}
                      </JudgeBadge>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      Hạng #{session.rankPosition || session.tieRankPosition || "?"} ·{" "}
                      {session.trackName || "Track"}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {formatDateTime(session.createdAt)}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="min-w-0">
              {error && (
                <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}
              {success && (
                <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
                  {success}
                </div>
              )}

              {loadingDetail ? (
                <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
                  <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
                  Đang tải chi tiết phiên chấm...
                </div>
              ) : !selectedSessionId ? (
                <EmptyState
                  icon={judgeIcons.Scale}
                  title="Chưa chọn phiên chấm"
                  description="Chọn một phiên xử lý đồng hạng để bắt đầu chấm lại."
                />
              ) : !criteria.length ? (
                <EmptyState
                  icon={judgeIcons.Scale}
                  title="Chưa có criteria"
                  description="Phiên chấm này chưa có tiêu chí. Vui lòng thử tải lại hoặc báo Coordinator kiểm tra cấu hình."
                />
              ) : !submissions.length ? (
                <EmptyState
                  icon={judgeIcons.Scale}
                  title="Chưa có bài cần tie-break"
                  description="Phiên chấm này chưa có bài nộp cần xử lý đồng hạng."
                />
              ) : (
                <div className="space-y-4">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase text-slate-500">
                      Phiên đang chấm
                    </p>
                    <p className="mt-1 font-bold text-slate-950">
                      {selectedSession?.roundName || sessionDetail?.roundName || selectedSessionId}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Judge cần chấm đủ {criteria.length} tiêu chí cho{" "}
                      {submissions.length} bài trước khi Coordinator tính kết quả.
                    </p>
                  </div>

                  {submissions.map((submission) => {
                    const submissionId = getSubmissionId(submission);
                    const draftTotal = calculateDraftTotal(submissionId, criteria, scores);

                    return (
                      <article
                        key={submissionId}
                        className="rounded-2xl border border-slate-200 bg-white p-4"
                      >
                        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <p className="font-bold text-slate-950">
                              {submission.teamName ||
                                submission.submission?.teamName ||
                                `TieBreakSubmission ${String(submissionId).slice(0, 8)}`}
                            </p>
                            <p className="mt-1 font-mono text-xs text-slate-400">
                              {submissionId}
                            </p>
                          </div>
                          <SubmissionLink submission={submission} />
                        </div>

                        <div className="space-y-3">
                          {criteria.map((criterion) => {
                            const error = fieldErrors[submissionId]?.[criterion.id];
                            return (
                              <div
                                key={criterion.id}
                                className="grid gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 lg:grid-cols-[1fr_160px_1fr]"
                              >
                                <div>
                                  <p className="font-bold text-slate-900">
                                    {criterion.name}
                                  </p>
                                  <p className="mt-1 text-xs text-slate-500">
                                    Max: {criterion.maxScore} · Weight:{" "}
                                    {Number((normalizeWeight(criterion.weight) * 100).toFixed(2))}%
                                  </p>
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold uppercase text-slate-500">
                                    Điểm
                                  </label>
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    value={scores[submissionId]?.[criterion.id] || ""}
                                    onChange={(event) =>
                                      handleScoreChange(
                                        submissionId,
                                        criterion.id,
                                        event.target.value,
                                      )
                                    }
                                    className={`mt-1 w-full rounded-xl border px-3 py-2.5 text-sm outline-none ${
                                      error
                                        ? "border-red-300 bg-red-50"
                                        : "border-slate-200 bg-white"
                                    }`}
                                    placeholder={`0 - ${criterion.maxScore}`}
                                  />
                                  {error && (
                                    <p className="mt-1 text-xs font-semibold text-red-600">
                                      {error}
                                    </p>
                                  )}
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold uppercase text-slate-500">
                                    Ghi chú
                                  </label>
                                  <textarea
                                    value={comments[submissionId]?.[criterion.id] || ""}
                                    onChange={(event) =>
                                      handleCommentChange(
                                        submissionId,
                                        criterion.id,
                                        event.target.value,
                                      )
                                    }
                                    className="mt-1 min-h-[80px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none"
                                    placeholder="Nhận xét ngắn..."
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="mt-4 flex flex-col gap-3 rounded-xl border border-orange-100 bg-orange-50/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-xs font-bold uppercase text-slate-500">
                              Tổng tie-break tạm tính
                            </p>
                            <p className="text-2xl font-black text-slate-950">
                              {formatScore(draftTotal)} / 100
                            </p>
                          </div>
                          <JudgeActionButton
                            variant="primary"
                            disabled={submittingId === submissionId}
                            icon={submittingId === submissionId ? Loader2 : judgeIcons.CheckCircle2}
                            onClick={() => submitSubmissionScores(submission)}
                          >
                            {submittingId === submissionId
                              ? "Đang lưu..."
                              : "Lưu điểm tie-break"}
                          </JudgeActionButton>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </JudgePanel>
    </div>
  );
}
