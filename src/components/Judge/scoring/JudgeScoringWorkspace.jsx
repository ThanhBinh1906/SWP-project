import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import {
  AlertCircle,
  ChevronDown,
  Download,
  ExternalLink,
  Loader2,
  Upload,
} from "lucide-react";
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

const BATCH_SUBMIT_ID = "__all_scores__";

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
  const weightedRatio = criteria.reduce((total, criterion) => {
    const rawScore = Number(scores[submissionId]?.[criterion.id]);
    if (!Number.isFinite(rawScore)) return total;

    const maxScore = Number(criterion.maxScore || 0);
    if (maxScore <= 0) return total;

    return total + (rawScore / maxScore) * normalizeWeight(criterion.weight);
  }, 0);

  return weightedRatio * 10;
}

function formatTotalScore(score) {
  const numeric = Number(score || 0);
  if (!Number.isFinite(numeric)) return "0";
  return Number(numeric.toFixed(2));
}

function normalizeExcelText(value) {
  return String(value ?? "").trim();
}

function normalizeExcelNumber(value) {
  if (typeof value === "number") return value;
  const text = normalizeExcelText(value).replace(",", ".");
  if (!text) return NaN;
  return Number(text);
}

function makeScoreImportKey(submissionId, criterionId) {
  return `${submissionId}::${criterionId}`;
}

function getSubmissionLabel(submission) {
  return (
    submission.teamName ||
    submission.team?.teamName ||
    submission.teamId ||
    String(submission.id).slice(0, 8)
  );
}

function downloadScoreImportTemplate({
  selectedRoundId,
  selectedRoundLabel,
  submissions,
  criteria,
  scores,
  comments,
}) {
  const header = [
    "roundId",
    "roundName",
    "submissionId",
    "teamId",
    "teamName",
    "criterionId",
    "criterionName",
    "maxScore",
    "weight",
    "score",
    "comment",
  ];

  const rows = submissions.flatMap((submission) =>
    criteria.map((criterion) => [
      selectedRoundId,
      selectedRoundLabel,
      submission.id,
      submission.teamId || "",
      getSubmissionLabel(submission),
      criterion.id,
      criterion.name || "",
      Number(criterion.maxScore || 0),
      normalizeWeight(criterion.weight),
      scores[submission.id]?.[criterion.id] ?? "",
      comments[submission.id]?.[criterion.id] ?? "",
    ]),
  );

  const sheet = XLSX.utils.aoa_to_sheet([header, ...rows]);
  sheet["!cols"] = [
    { wch: 10 },
    { wch: 32 },
    { wch: 38 },
    { wch: 38 },
    { wch: 24 },
    { wch: 12 },
    { wch: 28 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 36 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Scores");
  XLSX.writeFile(workbook, `score-import-round-${selectedRoundId}.xlsx`);
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
  expanded,
  onToggleExpanded,
  onScoreChange,
  onCommentChange,
  onSubmit,
}) {
  const status = getScoreStatus(submission, criteria, scoreRecords);
  const draftTotal = calculateDraftTotal(submission.id, criteria, scores);
  const disabled = submitting || submission.isDisqualified || !criteria.length;

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleExpanded(submission.id)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
              title={expanded ? "Thu gọn bài nộp" : "Mở form chấm điểm"}
              aria-label={expanded ? "Thu gọn bài nộp" : "Mở form chấm điểm"}
              aria-expanded={expanded}
            >
              <ChevronDown
                className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
              />
            </button>
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

        <div className="grid gap-2 text-sm lg:min-w-[260px]">
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs font-bold uppercase text-slate-500">Presentation</p>
            <div className="mt-1">
              <SubmissionLink
                href={submission.presentationUrl || submission.reportUrl}
                label="Mở presentation"
              />
            </div>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 px-4 pb-4 pt-5">
      <div className="hidden">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Tổng tạm tính
          </p>
          <p className="text-2xl font-black text-slate-900">
            {formatTotalScore(draftTotal)} / 10
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
                      type="text"
                      inputMode="decimal"
                      value={scoreValue}
                      disabled={disabled}
                      placeholder={`0 - ${criterion.maxScore}`}
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
            {formatTotalScore(draftTotal)} / 10
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
        </div>
      )}
    </article>
  );
}

export function JudgeScoringWorkspace({ initialRoundId = "" }) {
  const importInputRef = useRef(null);
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
  const [expandedSubmissionIds, setExpandedSubmissionIds] = useState({});
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
      setExpandedSubmissionIds((current) =>
        nextSubmissions.reduce((next, submission, index) => {
          next[submission.id] = current[submission.id] ?? index === 0;
          return next;
        }, {}),
      );
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
    const normalizedValue = value.replace(",", ".");
    if (normalizedValue !== "" && !/^\d*(\.\d*)?$/.test(normalizedValue)) {
      return;
    }

    setScores((prev) => ({
      ...prev,
      [submissionId]: {
        ...(prev[submissionId] || {}),
        [criterionId]: normalizedValue,
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

  const handleToggleSubmission = (submissionId) => {
    setExpandedSubmissionIds((prev) => ({
      ...prev,
      [submissionId]: !prev[submissionId],
    }));
  };

  const handleDownloadTemplate = () => {
    if (!selectedRoundId || submissions.length === 0 || criteria.length === 0) {
      setError("Cần chọn round có bài nộp và tiêu chí trước khi tải mẫu điểm.");
      return;
    }

    downloadScoreImportTemplate({
      selectedRoundId,
      selectedRoundLabel,
      submissions,
      criteria,
      scores,
      comments,
    });
  };

  const handleImportScores = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!selectedRoundId || submissions.length === 0 || criteria.length === 0) {
      setError("Cần chọn round có bài nộp và tiêu chí trước khi import điểm.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      try {
        const workbook = XLSX.read(loadEvent.target.result, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
        const [headerRow, ...bodyRows] = rows;

        const headerMap = (headerRow || []).reduce((map, header, index) => {
          map[normalizeExcelText(header).toLowerCase()] = index;
          return map;
        }, {});

        const requiredHeaders = ["submissionid", "criterionid", "score"];
        const missingHeaders = requiredHeaders.filter((header) => headerMap[header] === undefined);
        if (missingHeaders.length) {
          setError(
            `File thiếu cột bắt buộc: ${missingHeaders.join(", ")}. Hãy tải mẫu điểm mới từ màn hình này.`,
          );
          return;
        }

        const submissionMap = new Map(
          submissions.map((submission) => [String(submission.id), submission]),
        );
        const criterionMap = new Map(criteria.map((criterion) => [String(criterion.id), criterion]));
        const seenKeys = new Map();
        const nextScores = {};
        const nextComments = {};
        const nextExpanded = {};
        const errors = [];
        let importedCount = 0;

        bodyRows.forEach((row, index) => {
          const line = index + 2;
          const submissionId = normalizeExcelText(row[headerMap.submissionid]);
          const criterionId = normalizeExcelText(row[headerMap.criterionid]);
          const scoreCell = row[headerMap.score];
          const comment =
            headerMap.comment === undefined ? "" : normalizeExcelText(row[headerMap.comment]);
          const hasAnyData = row.some((cell) => normalizeExcelText(cell) !== "");

          if (!hasAnyData) return;

          if (!submissionId || !criterionId) {
            errors.push(`Dòng ${line}: thiếu submissionId hoặc criterionId.`);
            return;
          }

          const roundId =
            headerMap.roundid === undefined ? "" : normalizeExcelText(row[headerMap.roundid]);
          if (roundId && String(roundId) !== String(selectedRoundId)) {
            errors.push(`Dòng ${line}: roundId ${roundId} không khớp round đang chọn.`);
          }

          const submission = submissionMap.get(submissionId);
          const criterion = criterionMap.get(criterionId);
          if (!submission) errors.push(`Dòng ${line}: submissionId không thuộc round hiện tại.`);
          if (!criterion) errors.push(`Dòng ${line}: criterionId không thuộc round hiện tại.`);
          if (!submission || !criterion) return;

          if (submission.isDisqualified) {
            errors.push(`Dòng ${line}: bài nộp đã bị loại nên không thể import điểm.`);
            return;
          }

          const key = makeScoreImportKey(submissionId, criterionId);
          if (seenKeys.has(key)) {
            errors.push(
              `Dòng ${line}: trùng điểm với dòng ${seenKeys.get(key)} cho cùng submissionId + criterionId.`,
            );
            return;
          }
          seenKeys.set(key, line);

          const score = normalizeExcelNumber(scoreCell);
          const maxScore = Number(criterion.maxScore || 0);
          if (normalizeExcelText(scoreCell) === "") {
            errors.push(`Dòng ${line}: chưa nhập score.`);
            return;
          }
          if (!Number.isFinite(score)) {
            errors.push(`Dòng ${line}: score phải là số.`);
            return;
          }
          if (score < 0 || score > maxScore) {
            errors.push(`Dòng ${line}: score phải nằm trong khoảng 0 - ${maxScore}.`);
            return;
          }

          nextScores[submissionId] = {
            ...(nextScores[submissionId] || {}),
            [criterionId]: String(score),
          };
          nextComments[submissionId] = {
            ...(nextComments[submissionId] || {}),
            [criterionId]: comment,
          };
          nextExpanded[submissionId] = true;
          importedCount += 1;
        });

        if (errors.length) {
          setError(errors.slice(0, 8).join("\n"));
          return;
        }
        if (importedCount === 0) {
          setError("File chưa có dòng điểm hợp lệ để import.");
          return;
        }

        setScores((prev) => {
          const merged = { ...prev };
          Object.entries(nextScores).forEach(([submissionId, criterionScores]) => {
            merged[submissionId] = {
              ...(merged[submissionId] || {}),
              ...criterionScores,
            };
          });
          return merged;
        });
        setComments((prev) => {
          const merged = { ...prev };
          Object.entries(nextComments).forEach(([submissionId, criterionComments]) => {
            merged[submissionId] = {
              ...(merged[submissionId] || {}),
              ...criterionComments,
            };
          });
          return merged;
        });
        setExpandedSubmissionIds((prev) => ({ ...prev, ...nextExpanded }));
        setFieldErrors({});
        setError("");
        setSuccess(
          `Đã import ${importedCount} dòng điểm. Hãy kiểm tra lại rồi bấm Gửi điểm hoặc Cập nhật điểm.`,
        );
      } catch {
        setError("Không thể đọc file Excel. Hãy dùng đúng file .xlsx hoặc tải lại mẫu mới.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const saveSubmissionScores = async (submission) => {
    for (const criterion of criteria) {
      const scoreValue = Number(scores[submission.id]?.[criterion.id]);
      const comment = comments[submission.id]?.[criterion.id]?.trim() || null;
      const existingRecord = (scoreRecords[submission.id] || []).find(
        (record) => record.criterionId === criterion.id,
      );

      if (existingRecord) {
        await scoreService.update(existingRecord.id || existingRecord.scoreRecordId, {
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

  const handleSubmitAllScores = async () => {
    const eligibleSubmissions = submissions.filter(
      (submission) => !submission.isDisqualified,
    );

    if (!eligibleSubmissions.length) {
      setError("Không có bài nộp hợp lệ để gửi điểm.");
      return;
    }

    const nextFieldErrors = {};
    eligibleSubmissions.forEach((submission) => {
      const validationErrors = validateSubmissionScores(
        submission.id,
        criteria,
        scores,
      );
      if (Object.keys(validationErrors).length) {
        nextFieldErrors[submission.id] = validationErrors;
      }
    });

    if (Object.keys(nextFieldErrors).length) {
      setFieldErrors(nextFieldErrors);
      setExpandedSubmissionIds((prev) => {
        const expanded = { ...prev };
        Object.keys(nextFieldErrors).forEach((submissionId) => {
          expanded[submissionId] = true;
        });
        return expanded;
      });
      setError(
        "Có bài nộp chưa đủ điểm hoặc điểm chưa hợp lệ. Vui lòng kiểm tra các ô được báo lỗi.",
      );
      setSuccess("");
      return;
    }

    setSubmittingId(BATCH_SUBMIT_ID);
    setFieldErrors({});
    setError("");
    setSuccess("");

    try {
      const scoreItems = eligibleSubmissions.flatMap((submission) =>
        criteria.map((criterion) => ({
          submissionId: submission.id,
          criterionId: criterion.id,
          score: Number(scores[submission.id]?.[criterion.id]),
          comment: comments[submission.id]?.[criterion.id] || "",
          isCalibration: false,
        })),
      );

      await scoreService.importScores(selectedRoundId, {
        scores: scoreItems,
        items: scoreItems,
      });

      setSuccess(`Đã gửi điểm cho ${eligibleSubmissions.length} bài nộp.`);
      await loadRoundData();
    } catch (err) {
      setError(getApiMessage(err, "Gửi toàn bộ điểm thất bại."));
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
        <div className="flex items-start gap-2 whitespace-pre-line rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
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
        actions={
          <>
            <JudgeActionButton
              onClick={handleDownloadTemplate}
              disabled={
                loadingData ||
                !!submittingId ||
                !selectedRoundId ||
                submissions.length === 0 ||
                criteria.length === 0
              }
              icon={Download}
            >
              Tải mẫu điểm
            </JudgeActionButton>
            <JudgeActionButton
              onClick={() => importInputRef.current?.click()}
              disabled={
                loadingData ||
                !!submittingId ||
                !selectedRoundId ||
                submissions.length === 0 ||
                criteria.length === 0
              }
              icon={Upload}
            >
              Import điểm
            </JudgeActionButton>
            <JudgeActionButton
              variant="primary"
              onClick={handleSubmitAllScores}
              disabled={
                loadingData ||
                !!submittingId ||
                !selectedRoundId ||
                submissions.length === 0 ||
                criteria.length === 0
              }
              icon={submittingId === BATCH_SUBMIT_ID ? Loader2 : judgeIcons.CheckCircle2}
            >
              {submittingId === BATCH_SUBMIT_ID ? "Đang gửi tất cả..." : "Gửi tất cả điểm"}
            </JudgeActionButton>
            <input
              ref={importInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleImportScores}
            />
          </>
        }
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
                submitting={
                  submittingId === submission.id || submittingId === BATCH_SUBMIT_ID
                }
                expanded={!!expandedSubmissionIds[submission.id]}
                onToggleExpanded={handleToggleSubmission}
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
