import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, ExternalLink, Loader2 } from "lucide-react";
import criterionService from "../../../services/criterionService";
import roundService from "../../../services/roundService";
import scoreService from "../../../services/scoreService";
import submissionService from "../../../services/submissionService";
import { getApiMessage } from "../../Coordinator/coordinatorHelpers";
import { EmptyState } from "../shared/EmptyState";
import { JudgeActionButton } from "../shared/JudgeActionButton";
import { JudgeBadge } from "../shared/JudgeBadge";
import { JudgePanel } from "../shared/JudgePanel";
import { judgeIcons } from "../shared/judgeIcons";

function normalizeWeight(weight) {
  const numeric = Number(weight || 0);
  if (!Number.isFinite(numeric)) return 0;
  return numeric > 1 ? numeric / 100 : numeric;
}

function mapAssignedRoundsToOptions(rounds) {
  return rounds.map((round) => ({
    roundId: round.id,
    name: round.name || `Round ${round.id}`,
    trackName: round.trackName || "Track",
    eventName: round.eventName || "Event",
    status: round.status,
  }));
}

function getScoreStatus(submission, criteria, scoreRecords = []) {
  if (submission.isDisqualified) return "Disqualified";
  if (!criteria.length) return "No criteria";

  const scoredCount = criteria.filter((criterion) =>
    scoreRecords.some((record) => record.criterionId === criterion.id),
  ).length;

  if (scoredCount >= criteria.length) return "Scored";
  if (scoredCount > 0) return "Partial";
  return "Not scored";
}

function statusTone(status) {
  if (status === "Scored") return "success";
  if (status === "Partial") return "warning";
  if (status === "Disqualified") return "danger";
  return "neutral";
}

function buildScoreState(submissions, scoreRecordMap) {
  return submissions.reduce((next, submission) => {
    next[submission.id] = {};
    (scoreRecordMap[submission.id] || []).forEach((record) => {
      next[submission.id][record.criterionId] = String(record.score ?? "");
    });
    return next;
  }, {});
}

function buildCommentState(submissions, scoreRecordMap) {
  return submissions.reduce((next, submission) => {
    next[submission.id] = {};
    (scoreRecordMap[submission.id] || []).forEach((record) => {
      next[submission.id][record.criterionId] = record.comment || "";
    });
    return next;
  }, {});
}

function calculateDraftTotal(submissionId, criteria, scores) {
  return criteria.reduce((total, criterion) => {
    const rawScore = Number(scores[submissionId]?.[criterion.id]);
    if (!Number.isFinite(rawScore)) return total;

    const maxScore = Number(criterion.maxScore || 0);
    if (maxScore <= 0) return total;

    return total + (rawScore / maxScore) * normalizeWeight(criterion.weight);
  }, 0);
}

function validateSubmissionScores(submissionId, criteria, scores) {
  const errors = {};

  criteria.forEach((criterion) => {
    const value = scores[submissionId]?.[criterion.id];
    const maxScore = Number(criterion.maxScore || 0);
    const numeric = Number(value);

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

function RoundSelector({
  roundOptions,
  selectedRoundId,
  onRoundChange,
  onReload,
  loading,
}) {
  return (
    <JudgePanel
      title="Chọn vòng chấm điểm"
      subtitle="Dữ liệu round được tải từ /api/rounds/assigned"
      icon={judgeIcons.Filter}
    >
      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
        <select
          className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none disabled:bg-slate-50 disabled:text-slate-400"
          value={selectedRoundId}
          onChange={(event) => onRoundChange(event.target.value)}
          disabled={loading || roundOptions.length === 0}
        >
          {roundOptions.length === 0 ? (
            <option value="">Chưa có round để chọn</option>
          ) : (
            roundOptions.map((round) => (
              <option key={round.roundId} value={round.roundId}>
                {round.name} - {round.trackName} ({round.eventName})
              </option>
            ))
          )}
        </select>
        <JudgeActionButton
          onClick={onReload}
          disabled={!selectedRoundId || loading}
          icon={loading ? Loader2 : judgeIcons.Clock}
        >
          {loading ? "Đang tải..." : "Tải lại"}
        </JudgeActionButton>
      </div>
    </JudgePanel>
  );
}

function SubmissionLink({ href, label }) {
  if (!href) return <span className="text-slate-400">Chưa có</span>;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 font-bold text-orange-700 hover:underline"
    >
      {label}
      <ExternalLink className="h-4 w-4" />
    </a>
  );
}

function SubmissionScoringCard({
  submission,
  criteria,
  scoreRecords,
  scores,
  comments,
  errors,
  submitting,
  onScoreChange,
  onCommentChange,
  onSubmit,
}) {
  const status = getScoreStatus(submission, criteria, scoreRecords);
  const draftTotal = calculateDraftTotal(submission.id, criteria, scores);
  const disabled = submitting || submission.isDisqualified || !criteria.length;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-mono text-xs font-semibold text-slate-500">
              Submission: {String(submission.id).slice(0, 8)}...
            </p>
            <JudgeBadge tone={statusTone(status)}>{status}</JudgeBadge>
          </div>
          <p className="font-mono text-xs text-slate-500">
            Team ID: {String(submission.teamId || "unknown")}
          </p>
          {submission.createdAt && (
            <p className="text-xs text-slate-400">
              Nộp lúc: {new Date(submission.createdAt).toLocaleString("vi-VN")}
            </p>
          )}
          {submission.isDisqualified && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              Bài nộp đã bị loại
              {submission.disqualifyReason ? `: ${submission.disqualifyReason}` : ""}
            </div>
          )}
        </div>

        <div className="grid gap-2 text-sm sm:grid-cols-2 lg:min-w-[260px]">
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs font-bold uppercase text-slate-500">Demo / Project</p>
            <div className="mt-1">
              <SubmissionLink href={submission.demoUrl} label="Mở demo" />
            </div>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs font-bold uppercase text-slate-500">Slide / Report</p>
            <div className="mt-1">
              <SubmissionLink href={submission.reportUrl} label="Mở slide" />
            </div>
          </div>
        </div>
      </div>

      <div className="hidden">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Tổng tạm tính
          </p>
          <p className="text-2xl font-black text-slate-900">
            {Number(draftTotal.toFixed(4))}
          </p>
        </div>
        <JudgeActionButton
          variant="primary"
          disabled={disabled}
          onClick={() => onSubmit(submission)}
          icon={submitting ? Loader2 : judgeIcons.CheckCircle2}
        >
          {submitting ? "Đang gửi..." : status === "Scored" ? "Cập nhật điểm" : "Gửi điểm"}
        </JudgeActionButton>
      </div>

      {criteria.length === 0 ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
          Round này chưa có criteria nên chưa thể chấm điểm.
        </div>
      ) : (
        <div className="mt-5">
          <div className="space-y-3">
            {criteria.map((criterion) => {
              const error = errors[submission.id]?.[criterion.id];
              const scoreValue = scores[submission.id]?.[criterion.id] ?? "";
              const weightPercent = normalizeWeight(criterion.weight) * 100;

              return (
                <div
                  key={criterion.id}
                  className="grid gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4 xl:grid-cols-[minmax(220px,1fr)_180px_minmax(320px,1fr)]"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900">{criterion.name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {criterion.description || "Không có mô tả"}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      Max: {criterion.maxScore} - Weight: {Number(weightPercent.toFixed(2))}%
                    </p>
                  </div>

                  <div className="min-w-0">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Điểm
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={criterion.maxScore}
                      step="0.1"
                      value={scoreValue}
                      disabled={disabled}
                      onChange={(event) =>
                        onScoreChange(submission.id, criterion.id, event.target.value)
                      }
                      className={`mt-1 w-full rounded-xl border px-3 py-2.5 text-sm outline-none ${
                        error ? "border-red-300 bg-red-50" : "border-slate-200 bg-white"
                      }`}
                    />
                    {error && <p className="mt-1 text-xs font-semibold text-red-600">{error}</p>}
                  </div>

                  <div className="min-w-0">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Ghi chú
                    </label>
                    <textarea
                      value={comments[submission.id]?.[criterion.id] || ""}
                      disabled={disabled}
                      onChange={(event) =>
                        onCommentChange(submission.id, criterion.id, event.target.value)
                      }
                      placeholder="Nhận xét ngắn..."
                      className="mt-1 min-h-[88px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-orange-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Tổng tạm tính
          </p>
          <p className="text-2xl font-black text-slate-900">
            {Number(draftTotal.toFixed(4))}
          </p>
        </div>
        <JudgeActionButton
          variant="primary"
          disabled={disabled}
          onClick={() => onSubmit(submission)}
          icon={submitting ? Loader2 : judgeIcons.CheckCircle2}
        >
          {submitting ? "Đang gửi..." : status === "Scored" ? "Cập nhật điểm" : "Gửi điểm"}
        </JudgeActionButton>
      </div>
    </article>
  );
}

export function JudgeScoringWorkspace({ initialRoundId = "" }) {
  const [roundOptions, setRoundOptions] = useState([]);
  const [selectedRoundId, setSelectedRoundId] = useState("");
  const [roundMeta, setRoundMeta] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [criteria, setCriteria] = useState([]);
  const [scoreRecords, setScoreRecords] = useState({});
  const [scores, setScores] = useState({});
  const [comments, setComments] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [loadingRounds, setLoadingRounds] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [submittingId, setSubmittingId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadRounds = useCallback(async () => {
    setLoadingRounds(true);
    setError("");

    try {
      const res = await roundService.getAssigned();
      const nextRoundOptions = mapAssignedRoundsToOptions(res.data?.data || []);

      setRoundOptions(nextRoundOptions);
      setSelectedRoundId((current) => {
        if (initialRoundId) return String(initialRoundId);
        if (current && nextRoundOptions.some((round) => String(round.roundId) === current)) {
          return current;
        }
        const openRound =
          nextRoundOptions.find((round) => round.status === "Active") ||
          nextRoundOptions.find((round) => round.status === "Scoring") ||
          nextRoundOptions[0];
        return openRound ? String(openRound.roundId) : "";
      });
    } catch (err) {
      setRoundOptions([]);
      setSelectedRoundId("");
      setError(getApiMessage(err, "Không thể tải danh sách round được phân công."));
    } finally {
      setLoadingRounds(false);
    }
  }, [initialRoundId]);

  useEffect(() => {
    loadRounds();
  }, [loadRounds]);

  useEffect(() => {
    if (initialRoundId) {
      setSelectedRoundId(String(initialRoundId));
    }
  }, [initialRoundId]);

  const loadRoundData = useCallback(async () => {
    if (!selectedRoundId) {
      setSubmissions([]);
      setCriteria([]);
      return;
    }

    setLoadingData(true);
    setError("");
    setSuccess("");

    try {
      const [subsRes, criteriaRes] = await Promise.all([
        submissionService.getByRound(selectedRoundId),
        criterionService.getByRound(selectedRoundId),
      ]);

      const nextSubmissions = subsRes.data?.data || [];
      const nextCriteria = criteriaRes.data?.data || [];
      const nextScoreRecords = {};

      await Promise.all(
        nextSubmissions.map(async (submission) => {
          try {
            const scoreRes = await scoreService.getBySubmission(submission.id);
            nextScoreRecords[submission.id] = scoreRes.data?.data || [];
          } catch {
            nextScoreRecords[submission.id] = [];
          }
        }),
      );

      setRoundMeta(
        roundOptions.find((round) => String(round.roundId) === selectedRoundId) || null,
      );
      setSubmissions(nextSubmissions);
      setCriteria(nextCriteria);
      setScoreRecords(nextScoreRecords);
      setScores(buildScoreState(nextSubmissions, nextScoreRecords));
      setComments(buildCommentState(nextSubmissions, nextScoreRecords));
      setFieldErrors({});
    } catch (err) {
      setSubmissions([]);
      setCriteria([]);
      setScoreRecords({});
      setScores({});
      setComments({});
      setError(getApiMessage(err, "Không thể tải submissions hoặc criteria theo round."));
    } finally {
      setLoadingData(false);
    }
  }, [roundOptions, selectedRoundId]);

  useEffect(() => {
    loadRoundData();
  }, [loadRoundData]);

  const handleScoreChange = (submissionId, criterionId, value) => {
    setScores((prev) => ({
      ...prev,
      [submissionId]: {
        ...(prev[submissionId] || {}),
        [criterionId]: value,
      },
    }));
    setFieldErrors((prev) => ({
      ...prev,
      [submissionId]: {
        ...(prev[submissionId] || {}),
        [criterionId]: "",
      },
    }));
    setSuccess("");
  };

  const handleCommentChange = (submissionId, criterionId, value) => {
    setComments((prev) => ({
      ...prev,
      [submissionId]: {
        ...(prev[submissionId] || {}),
        [criterionId]: value,
      },
    }));
  };

  const handleSubmitScores = async (submission) => {
    const validationErrors = validateSubmissionScores(submission.id, criteria, scores);
    if (Object.keys(validationErrors).length) {
      setFieldErrors((prev) => ({ ...prev, [submission.id]: validationErrors }));
      return;
    }

    setSubmittingId(submission.id);
    setError("");
    setSuccess("");

    try {
      for (const criterion of criteria) {
        const scoreValue = Number(scores[submission.id]?.[criterion.id]);
        const comment = comments[submission.id]?.[criterion.id]?.trim() || null;
        const existingRecord = (scoreRecords[submission.id] || []).find(
          (record) => record.criterionId === criterion.id,
        );

        if (existingRecord) {
          await scoreService.update(existingRecord.id, {
            updatedScore: scoreValue,
            updatedComment: comment,
          });
        } else {
          await scoreService.submit(submission.id, {
            criterionId: criterion.id,
            score: scoreValue,
            comment,
            isCalibration: false,
          });
        }
      }

      setSuccess("Gửi điểm thành công.");
      await loadRoundData();
    } catch (err) {
      setError(getApiMessage(err, "Gửi điểm thất bại."));
    } finally {
      setSubmittingId("");
    }
  };

  const selectedRoundLabel = useMemo(() => {
    if (!roundMeta) return selectedRoundId ? `Round ID ${selectedRoundId}` : "";
    return `${roundMeta.name} - ${roundMeta.trackName || "Track"}`;
  }, [roundMeta, selectedRoundId]);

  if (loadingRounds) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
        Đang tải danh sách round...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <RoundSelector
        roundOptions={roundOptions}
        selectedRoundId={selectedRoundId}
        onRoundChange={setSelectedRoundId}
        onReload={loadRoundData}
        loading={loadingData}
      />

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
          {success}
        </div>
      )}

      <JudgePanel
        title="Danh sách bài nộp"
        subtitle={`${selectedRoundLabel} - ${submissions.length} submission(s), ${criteria.length} criteria`}
        icon={judgeIcons.Gavel}
      >
        {loadingData ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
            Đang tải submissions và criteria...
          </div>
        ) : roundOptions.length === 0 ? (
          <EmptyState
            icon={judgeIcons.Gavel}
            title="Chưa có round"
            description="Hiện tại tài khoản judge chưa được gán vào round nào."
          />
        ) : !selectedRoundId ? (
          <EmptyState
            icon={judgeIcons.Gavel}
            title="Chưa chọn round"
            description="Chọn một round từ danh sách để tải submissions và criteria."
          />
        ) : submissions.length === 0 ? (
          <EmptyState
            icon={judgeIcons.Gavel}
            title="Chưa có submission"
            description="Round này chưa có bài nộp."
          />
        ) : criteria.length === 0 ? (
          <EmptyState
            icon={judgeIcons.Gavel}
            title="Chưa có criteria"
            description="Round này cần criteria trước khi judge có thể chấm điểm."
          />
        ) : (
          <div className="space-y-4">
            {submissions.map((submission) => (
              <SubmissionScoringCard
                key={submission.id}
                submission={submission}
                criteria={criteria}
                scoreRecords={scoreRecords[submission.id] || []}
                scores={scores}
                comments={comments}
                errors={fieldErrors}
                submitting={submittingId === submission.id}
                onScoreChange={handleScoreChange}
                onCommentChange={handleCommentChange}
                onSubmit={handleSubmitScores}
              />
            ))}
          </div>
        )}
      </JudgePanel>
    </div>
  );
}
