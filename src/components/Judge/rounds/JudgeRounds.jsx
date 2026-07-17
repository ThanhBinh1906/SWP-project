import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import roundService from "../../../services/roundService";
import { getApiMessage } from "../../Coordinator/coordinatorHelpers";
import { EmptyState } from "../shared/EmptyState";
import { JudgeActionButton } from "../shared/JudgeActionButton";
import { JudgePanel } from "../shared/JudgePanel";
import { judgeIcons } from "../shared/judgeIcons";
import { RoundStatusBadge } from "./RoundStatusBadge";

function formatDateTime(value) {
  if (!value) return "Chưa có";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Không hợp lệ";
  return date.toLocaleString("vi-VN");
}

function canOpenRound(status) {
  return status === "Active" || status === "Scoring";
}

export function JudgeRounds({ onOpenScoring }) {
  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAssignedRounds = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await roundService.getAssigned();
      setRounds(res.data?.data || []);
    } catch (err) {
      setRounds([]);
      setError(
        getApiMessage(err, "Không thể tải danh sách round được phân công."),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAssignedRounds();
  }, [loadAssignedRounds]);

  return (
    <div className="space-y-6">
      <JudgePanel
        title="Danh sách round được phân công"
        subtitle="Các round cần chấm sẽ liệt kê dưới đây"
        icon={judgeIcons.CalendarDays}
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-600">
            <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
            Đang tải danh sách round...
          </div>
        ) : error ? (
          <div className="space-y-4">
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              {error}
            </div>
            <JudgeActionButton
              onClick={loadAssignedRounds}
              icon={judgeIcons.Clock}
            >
              Tải lại
            </JudgeActionButton>
          </div>
        ) : rounds.length === 0 ? (
          <EmptyState
            icon={judgeIcons.CalendarDays}
            title="Chưa có round được phân công"
            description="Hiện tại tài khoản judge chưa được gán vào round nào."
          />
        ) : (
          <div className="max-h-[72vh] space-y-4 overflow-y-auto pr-1">
            {rounds.map((round) => {
              const canOpenScoring = canOpenRound(round.status);

              return (
                <div
                  key={round.id}
                  className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-bold text-slate-900">
                          {round.name}
                        </h3>
                        <RoundStatusBadge status={round.status || "Unknown"} />
                      </div>
                      <p className="mt-1 text-sm text-slate-700">
                        Track: {round.trackName || "Chưa có track"} • Sự kiện:{" "}
                        {round.eventName || "Chưa có sự kiện"}
                      </p>

                      <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
                        <div className="rounded-xl bg-slate-50 p-3">
                          <span className="block text-xs font-bold uppercase text-slate-700">
                            Bắt đầu
                          </span>
                          <span className="font-semibold text-slate-800">
                            {formatDateTime(round.startTime)}
                          </span>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3">
                          <span className="block text-xs font-bold uppercase text-slate-700">
                            Kết thúc
                          </span>
                          <span className="font-semibold text-slate-800">
                            {formatDateTime(round.endTime)}
                          </span>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3">
                          <span className="block text-xs font-bold uppercase text-slate-700">
                            Submission
                          </span>
                          <span className="font-semibold text-slate-800">
                            {round.submissionCount ?? 0}
                          </span>
                        </div>
                      </div>
                    </div>

                    <JudgeActionButton
                      variant="primary"
                      disabled={!canOpenScoring}
                      onClick={() => onOpenScoring?.(round.id)}
                      icon={judgeIcons.Gavel}
                    >
                      Mở chấm điểm
                    </JudgeActionButton>
                  </div>

                  {!canOpenScoring && (
                    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                      Chỉ có thể mở chấm điểm khi round ở trạng thái Active hoặc
                      Scoring.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </JudgePanel>
    </div>
  );
}
