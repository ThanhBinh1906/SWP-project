import { useMemo, useState } from "react";
import { JudgeBadge } from "../../shared/JudgeBadge";
import { JudgeModal } from "../../shared/JudgeModal";
import { judgeIcons } from "../../shared/judgeIcons";
import { LockNotice } from "../LockNotice";
import { CriterionCard } from "./CriterionCard";
import { ScoringConfirmationModal } from "./ScoringConfirmationModal";
import { SubmitPanel } from "./SubmitPanel";

function validateScore(value, maxScore) {
  if (value === undefined || value === "") return "Score is required.";
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "Score must be numeric.";
  if (numeric < 0 || numeric > maxScore)
    return `Score must be between 0 and ${maxScore}.`;
  return "";
}

function computeTotal(scores, criteria) {
  const weighted = criteria.reduce((sum, criterion) => {
    const raw = Number(scores[criterion.id] || 0);
    return sum + raw * (criterion.weight || 0);
  }, 0);
  return Number(weighted.toFixed(1));
}

function buildInitialState(criteria, scoreRecords) {
  const scores = {};
  const comments = {};
  criteria.forEach((c) => {
    const existing = scoreRecords.find((s) => s.criterionId === c.id);
    if (existing) {
      scores[c.id] = existing.score;
      comments[c.id] = existing.comment || "";
    }
  });
  return { scores, comments };
}

export function ScoringForm({
  submission,
  criteria = [],
  scoreRecords = [],
  isLocked,
  isTimeLocked,
  saving,
  submitting,
  onClose,
  onSubmitScores,
}) {
  const initial = useMemo(
    () => buildInitialState(criteria, scoreRecords),
    [criteria, scoreRecords],
  );
  const [scores, setScores] = useState(initial.scores);
  const [comments, setComments] = useState(initial.comments);
  const [errors, setErrors] = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const disabled =
    isLocked ||
    isTimeLocked ||
    submission.isDisqualified ||
    criteria.length === 0;
  const totalScore = useMemo(
    () => computeTotal(scores, criteria),
    [scores, criteria],
  );

  const validateAll = () => {
    const nextErrors = {};
    criteria.forEach((criterion) => {
      const error = validateScore(scores[criterion.id], criterion.maxScore);
      if (error) nextErrors[criterion.id] = error;
    });
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const updateScore = (criterion, value) => {
    setScores((prev) => ({ ...prev, [criterion.id]: value }));
    setErrors((prev) => ({
      ...prev,
      [criterion.id]: validateScore(value, criterion.maxScore),
    }));
  };

  const requestSubmit = () => {
    if (disabled) return;
    if (!validateAll()) return;
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    try {
      await onSubmitScores(submission.id, scores, comments);
      setConfirmOpen(false);
      onClose?.();
    } catch {
      setConfirmOpen(false);
    }
  };

  return (
    <>
      <JudgeModal
        title="Chấm điểm"
        subtitle={`Submission ${String(submission.id).slice(0, 8)}...`}
        onClose={onClose}
        maxWidth="max-w-6xl"
      >
        <div className="space-y-5">
          {isLocked && <LockNotice />}
          {isTimeLocked && !isLocked && <LockNotice type="time" />}
          {submission.isDisqualified && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Bài nộp đã bị loại: {submission.disqualifyReason || "—"}
            </div>
          )}

          <div className="grid gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 md:grid-cols-3">
            <div>
              <p className="text-xs font-bold uppercase text-slate-500">Demo</p>
              {submission.demoUrl ? (
                <a
                  className="mt-1 inline-flex items-center gap-1 font-bold text-orange-700"
                  href={submission.demoUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Mở <judgeIcons.ExternalLink className="h-4 w-4" />
                </a>
              ) : (
                <p className="mt-1 text-slate-500">—</p>
              )}
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-slate-500">Report</p>
              {submission.reportUrl ? (
                <a
                  className="mt-1 inline-flex items-center gap-1 font-bold text-orange-700"
                  href={submission.reportUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Mở <judgeIcons.ExternalLink className="h-4 w-4" />
                </a>
              ) : (
                <p className="mt-1 text-slate-500">—</p>
              )}
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-slate-500">Status</p>
              <div className="mt-1">
                <JudgeBadge tone={disabled ? "neutral" : "warning"}>
                  {submission.uiStatus || "Not scored"}
                </JudgeBadge>
              </div>
            </div>
          </div>

          {criteria.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">
              Chưa có tiêu chí cho round này. Coordinator cần cấu hình Criteria trước.
            </p>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
              <div className="space-y-4">
                {criteria.map((criterion) => (
                  <CriterionCard
                    key={criterion.id}
                    criterion={criterion}
                    score={scores[criterion.id]}
                    comment={comments[criterion.id]}
                    error={errors[criterion.id]}
                    disabled={disabled}
                    onScoreChange={(value) => updateScore(criterion, value)}
                    onCommentChange={(value) =>
                      setComments((prev) => ({ ...prev, [criterion.id]: value }))
                    }
                  />
                ))}
              </div>
              <SubmitPanel
                criteria={criteria}
                scores={scores}
                totalScore={totalScore}
                disabled={disabled}
                saving={saving}
                submitting={submitting}
                onSaveDraft={() => {}}
                onSubmit={requestSubmit}
              />
            </div>
          )}
        </div>
      </JudgeModal>
      {confirmOpen && (
        <ScoringConfirmationModal
          totalScore={totalScore}
          submitting={submitting}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={handleConfirm}
        />
      )}
    </>
  );
}
