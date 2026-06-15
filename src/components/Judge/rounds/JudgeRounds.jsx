import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { judgeRounds } from "../judgeMockData";
import submissionService from "../../../services/submissionService";
import { JudgeActionButton } from "../shared/JudgeActionButton";
import { JudgePanel } from "../shared/JudgePanel";
import { judgeIcons } from "../shared/judgeIcons";
import { RoundStatusBadge } from "./RoundStatusBadge";

function getRoundId(round) {
  return round.roundId ?? round.id;
}

function formatDateTime(value) {
  if (!value) return "Chưa có";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Không hợp lệ";
  return date.toLocaleString("vi-VN");
}

export function JudgeRounds({ onOpenScoring }) {
  const [rounds, setRounds] = useState(judgeRounds);
  const [loadingSubmissionCount, setLoadingSubmissionCount] = useState(true);

  const loadSubmissionCounts = useCallback(async () => {
    setLoadingSubmissionCount(true);

    const roundsWithCount = await Promise.all(
      judgeRounds.map(async (round) => {
        try {
          const submissionRes = await submissionService.getByRound(getRoundId(round));
          const submissions = submissionRes.data?.data || [];
          return { ...round, submissionCount: submissions.length };
        } catch {
          return { ...round, submissionCount: null };
        }
      }),
    );

    setRounds(roundsWithCount);
    setLoadingSubmissionCount(false);
  }, []);

  useEffect(() => {
    loadSubmissionCounts();
  }, [loadSubmissionCounts]);

  return (
    <div className="space-y-6">
      <JudgePanel
        title="Danh sách round được phân công"
        subtitle="Tạm dùng 1 mock round cho Judge cho đến khi có API lấy round được phân công"
        icon={judgeIcons.CalendarDays}
      >
        <div className="max-h-[72vh] space-y-4 overflow-y-auto pr-1">
          {rounds.map((round) => {
            const roundId = getRoundId(round);
            const canOpenScoring = round.status === "Scoring";

            return (
              <div
                key={roundId}
                className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-bold text-slate-900">{round.name}</h3>
                      <RoundStatusBadge status={round.status || "Unknown"} />
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      Track: {round.trackName || "Chưa có track"} • Sự kiện:{" "}
                      {round.eventName || "Chưa có sự kiện"}
                    </p>

                    <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <span className="block text-xs font-bold uppercase text-slate-500">
                          Bắt đầu
                        </span>
                        <span className="font-semibold text-slate-800">
                          {formatDateTime(round.startTime)}
                        </span>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3">
                        <span className="block text-xs font-bold uppercase text-slate-500">
                          Kết thúc
                        </span>
                        <span className="font-semibold text-slate-800">
                          {formatDateTime(round.endTime)}
                        </span>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3">
                        <span className="block text-xs font-bold uppercase text-slate-500">
                          Submission
                        </span>
                        <span className="inline-flex items-center gap-2 font-semibold text-slate-800">
                          {loadingSubmissionCount && (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-orange-500" />
                          )}
                          {round.submissionCount === null
                            ? "Không tải được"
                            : round.submissionCount ?? "Đang tải"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <JudgeActionButton
                    variant="primary"
                    disabled={!canOpenScoring}
                    onClick={() => onOpenScoring?.(roundId)}
                    icon={judgeIcons.Gavel}
                  >
                    Mở chấm điểm
                  </JudgeActionButton>
                </div>

                {!canOpenScoring && (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                    Chỉ có thể mở chấm điểm khi round ở trạng thái Scoring.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </JudgePanel>
    </div>
  );
}
