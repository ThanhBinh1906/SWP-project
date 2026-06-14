import { useState, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";
import submissionService from "../../../services/submissionService";
import scoreService from "../../../services/scoreService";
import criterionService from "../../../services/criterionService";
import axiosInstance from "../../../services/axiosInstance";
import { getApiMessage } from "../../Coordinator/coordinatorHelpers";
import { EmptyState } from "../shared/EmptyState";
import { JudgeActionButton } from "../shared/JudgeActionButton";
import { JudgeBadge } from "../shared/JudgeBadge";
import { JudgePanel } from "../shared/JudgePanel";
import { JudgeTable } from "../shared/JudgeTable";
import { judgeIcons } from "../shared/judgeIcons";
import { ScoringForm } from "./form/ScoringForm";

function statusTone(status) {
  if (status === "Scored") return "success";
  if (status === "Disqualified") return "danger";
  return "neutral";
}

function deriveStatus(submission, scoreCount, criteriaCount) {
  if (submission.isDisqualified) return "Disqualified";
  if (criteriaCount > 0 && scoreCount >= criteriaCount) return "Scored";
  if (scoreCount > 0) return "Partial";
  return "Not scored";
}

export function JudgeScoringWorkspace() {
  const [roundOptions, setRoundOptions] = useState([]);
  const [selectedRoundId, setSelectedRoundId] = useState("");
  const [roundMeta, setRoundMeta] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [criteria, setCriteria] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [selectedScores, setSelectedScores] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const loadRounds = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axiosInstance.get("/api/tracks/rounds");
      const tracks = res.data?.data || [];
      const scoringRounds = [];
      tracks.forEach((track) => {
        (track.rounds || []).forEach((round) => {
          if (round.status === "Scoring") {
            scoringRounds.push({
              roundId: round.roundId,
              name: round.name,
              trackName: track.trackName,
              eventName: track.eventName,
              status: round.status,
            });
          }
        });
      });
      setRoundOptions(scoringRounds);
      if (scoringRounds.length > 0) {
        setSelectedRoundId(String(scoringRounds[0].roundId));
      }
    } catch {
      setRoundOptions([]);
      setError(
        "Không tải được danh sách round. Nhập Round ID thủ công bên dưới.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRounds();
  }, [loadRounds]);

  const loadSubmissions = useCallback(async () => {
    if (!selectedRoundId) return;
    setLoadingSubs(true);
    setError("");
    try {
      const [subsRes, critRes] = await Promise.all([
        submissionService.getByRound(selectedRoundId),
        criterionService.getByRound(selectedRoundId),
      ]);
      const subs = subsRes.data?.data || [];
      const crit = critRes.data?.data || [];
      setCriteria(crit);
      setRoundMeta(
        roundOptions.find((r) => String(r.roundId) === selectedRoundId) || null,
      );

      const enriched = await Promise.all(
        subs.map(async (sub) => {
          try {
            const scoresRes = await scoreService.getBySubmission(sub.id);
            const scores = scoresRes.data?.data || [];
            return {
              ...sub,
              scoreRecords: scores,
              scoreCount: scores.length,
              uiStatus: deriveStatus(sub, scores.length, crit.length),
            };
          } catch {
            return {
              ...sub,
              scoreRecords: [],
              scoreCount: 0,
              uiStatus: deriveStatus(sub, 0, crit.length),
            };
          }
        }),
      );
      setSubmissions(enriched);
    } catch (err) {
      setSubmissions([]);
      setCriteria([]);
      setError(getApiMessage(err, "Không thể tải bài nộp. Kiểm tra Round ID và quyền assign."));
    } finally {
      setLoadingSubs(false);
    }
  }, [selectedRoundId, roundOptions]);

  useEffect(() => {
    if (selectedRoundId) loadSubmissions();
  }, [selectedRoundId, loadSubmissions]);

  const openScoring = async (submission) => {
    setSelected(submission);
    try {
      const res = await scoreService.getBySubmission(submission.id);
      setSelectedScores(res.data?.data || []);
    } catch {
      setSelectedScores(submission.scoreRecords || []);
    }
  };

  const handleSubmitScores = async (submissionId, scores, comments) => {
    setSubmitting(true);
    setError("");
    try {
      for (const criterion of criteria) {
        const scoreVal = scores[criterion.id];
        if (scoreVal === undefined || scoreVal === "") continue;

        const existing = selectedScores.find(
          (s) => s.criterionId === criterion.id,
        );

        if (existing) {
          await scoreService.update(existing.id, {
            updatedScore: Number(scoreVal),
            updatedComment: comments[criterion.id]?.trim() || null,
          });
        } else {
          await scoreService.submit(submissionId, {
            criterionId: criterion.id,
            score: Number(scoreVal),
            comment: comments[criterion.id]?.trim() || null,
            isCalibration: false,
          });
        }
      }
      await loadSubmissions();
      setSelected(null);
    } catch (err) {
      setError(getApiMessage(err, "Chấm điểm thất bại."));
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { key: "teamId", label: "Team ID" },
    { key: "demoUrl", label: "Demo" },
    { key: "reportUrl", label: "Report" },
    { key: "uiStatus", label: "Status" },
    { key: "action", label: "Action" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 gap-2 text-sm text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
        Đang tải rounds...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <JudgePanel
        title="Chọn vòng chấm điểm"
        subtitle="Round phải ở trạng thái Scoring và Judge được assign round đó"
        icon={judgeIcons.Filter}
      >
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          {roundOptions.length > 0 ? (
            <select
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
              value={selectedRoundId}
              onChange={(e) => setSelectedRoundId(e.target.value)}
            >
              {roundOptions.map((r) => (
                <option key={r.roundId} value={r.roundId}>
                  {r.name} — {r.trackName} ({r.eventName})
                </option>
              ))}
            </select>
          ) : (
            <input
              type="number"
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
              placeholder="Nhập Round ID (vd: 1)"
              value={selectedRoundId}
              onChange={(e) => setSelectedRoundId(e.target.value)}
            />
          )}
          <JudgeActionButton onClick={loadSubmissions} icon={judgeIcons.Clock}>
            Tải lại
          </JudgeActionButton>
        </div>
        {roundMeta && (
          <p className="mt-2 text-xs text-slate-500">
            Round: <strong>{roundMeta.name}</strong> • Status:{" "}
            <strong>{roundMeta.status}</strong>
          </p>
        )}
      </JudgePanel>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <JudgePanel
        title="Danh sách bài nộp"
        subtitle={`${submissions.length} submission(s) • ${criteria.length} tiêu chí`}
        icon={judgeIcons.Gavel}
      >
        {loadingSubs ? (
          <div className="flex items-center justify-center py-12 gap-2 text-sm text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
            Đang tải bài nộp...
          </div>
        ) : submissions.length === 0 ? (
          <EmptyState
            icon={judgeIcons.Gavel}
            title="Chưa có bài nộp"
            description="Đổi Round ID hoặc đợi Leader nộp bài khi round Active."
          />
        ) : (
          <JudgeTable
            columns={columns}
            rows={submissions}
            renderCell={(row, key) => {
              if (key === "demoUrl" || key === "reportUrl") {
                const url = row[key];
                return url ? (
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-orange-700"
                  >
                    Mở
                  </a>
                ) : (
                  "—"
                );
              }
              if (key === "uiStatus")
                return (
                  <JudgeBadge tone={statusTone(row.uiStatus)}>
                    {row.uiStatus}
                  </JudgeBadge>
                );
              if (key === "action")
                return (
                  <JudgeActionButton
                    disabled={row.isDisqualified}
                    onClick={() => openScoring(row)}
                    icon={judgeIcons.Gavel}
                  >
                    {row.uiStatus === "Scored" ? "Xem/Sửa" : "Chấm"}
                  </JudgeActionButton>
                );
              if (key === "teamId")
                return (
                  <span className="font-mono text-xs text-slate-600">
                    {String(row.teamId).slice(0, 8)}...
                  </span>
                );
              return row[key] ?? "—";
            }}
          />
        )}
      </JudgePanel>

      {selected && (
        <ScoringForm
          submission={selected}
          criteria={criteria}
          scoreRecords={selectedScores}
          isLocked={selected.isDisqualified}
          isTimeLocked={false}
          saving={false}
          submitting={submitting}
          onClose={() => setSelected(null)}
          onSubmitScores={handleSubmitScores}
        />
      )}
    </div>
  );
}
