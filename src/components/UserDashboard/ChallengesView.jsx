import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  AlertCircle,
  BookOpen,
  CheckSquare,
  Clock,
  Download,
  FileText,
  Hash,
  Loader2,
} from "lucide-react";
import teamService from "../../services/teamService";
import { getApiMessage } from "../Coordinator/coordinatorHelpers";

function ChallengeCard({ activeRound }) {
  const problem = activeRound.topic;
  const roundId = activeRound.roundId ?? activeRound.id;
  const roundName =
    activeRound.roundName || activeRound.name || (roundId ? `#${roundId}` : "");

  return (
    <div
      className="overflow-hidden rounded-2xl bg-white"
      style={{
        border: "1px solid #FFD0B5",
        boxShadow: "0 4px 24px rgba(242,111,33,0.06)",
      }}
    >
      <div
        className="flex flex-col gap-3 px-8 py-5 sm:flex-row sm:items-center sm:justify-between"
        style={{
          background:
            "linear-gradient(135deg, rgba(242,111,33,0.08) 0%, rgba(242,111,33,0.02) 100%)",
          borderBottom: "1px solid rgba(242,111,33,0.15)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
            style={{
              background: "rgba(242,111,33,0.12)",
              border: "1px solid rgba(242,111,33,0.25)",
            }}
          >
            <FileText className="h-5 w-5" style={{ color: "#F26F21" }} />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              Đề bài của team
            </p>
            <div className="mt-0.5 flex items-center gap-1">
              <Hash className="h-3.5 w-3.5" style={{ color: "#F26F21" }} />
              <p className="text-sm font-bold" style={{ color: "#F26F21" }}>
                Round: {roundName}
              </p>
            </div>
          </div>
        </div>

        {problem.attachmentUrl && (
          <button
            type="button"
            onClick={() => window.open(problem.attachmentUrl, "_blank")}
            className="flex w-fit items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-150"
            style={{
              background: "rgba(242,111,33,0.08)",
              border: "1px solid rgba(242,111,33,0.25)",
              color: "#F26F21",
            }}
          >
            <Download className="h-4 w-4" /> Tải PDF
          </button>
        )}
      </div>

      <div className="p-8">
        <h2
          className="mb-8 text-2xl font-black leading-snug text-[#111827]"
          style={{ fontFamily: "'Montserrat', 'Inter', sans-serif" }}
        >
          {problem.title}
        </h2>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div
            className="rounded-2xl p-6"
            style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}
          >
            <div className="mb-3 flex items-center gap-2">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-lg"
                style={{ background: "#E5E7EB" }}
              >
                <BookOpen className="h-3.5 w-3.5 text-slate-500" />
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Mô tả
              </p>
            </div>
            <p className="text-sm leading-relaxed text-slate-600">
              {problem.description}
            </p>
          </div>

          {problem.requirements && (
            <div
              className="rounded-2xl p-6"
              style={{
                background: "rgba(242,111,33,0.03)",
                border: "1px solid rgba(242,111,33,0.18)",
              }}
            >
              <div className="mb-3 flex items-center gap-2">
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-lg"
                  style={{ background: "rgba(242,111,33,0.12)" }}
                >
                  <CheckSquare
                    className="h-3.5 w-3.5"
                    style={{ color: "#F26F21" }}
                  />
                </div>
                <p
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: "#F26F21" }}
                >
                  Yêu cầu kỹ thuật
                </p>
              </div>
              <p className="text-sm leading-relaxed text-slate-600">
                {problem.requirements}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function buildRoundFromTeamTopic(team) {
  const topic = team?.topic;
  if (!topic) return null;

  const roundId = topic.roundId ?? team.roundId ?? null;

  return {
    id: roundId,
    roundId,
    roundName:
      topic.roundName ||
      topic.round?.name ||
      team.roundName ||
      (roundId ? `#${roundId}` : "Vòng thi hiện tại"),
    topic,
    source: "my-team",
  };
}

function StateMessage({ icon: Icon = AlertCircle, title, description }) {
  return (
    <div className="py-16 text-center">
      <div
        className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{
          background: "rgba(242,111,33,0.08)",
          border: "1px solid rgba(242,111,33,0.15)",
        }}
      >
        <Icon className="h-7 w-7" style={{ color: "#F26F21" }} />
      </div>
      <p className="text-sm font-semibold text-slate-600">{title}</p>
      {description && (
        <p className="mt-1 text-xs text-slate-400">{description}</p>
      )}
    </div>
  );
}

export function ChallengesView() {
  const { myTeam, fetched } = useSelector((s) => s.team);
  const [activeRound, setActiveRound] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadActiveRound = useCallback(async () => {
    if (!myTeam) return;

    setLoading(true);
    setError("");
    try {
      const res = await teamService.getMyActiveRound();
      setActiveRound(res.data?.data || buildRoundFromTeamTopic(myTeam));
    } catch (err) {
      const fallbackRound = buildRoundFromTeamTopic(myTeam);
      if (fallbackRound) {
        setActiveRound(fallbackRound);
        return;
      }

      setError(getApiMessage(err, "Không thể tải vòng thi đang diễn ra."));
      setActiveRound(null);
    } finally {
      setLoading(false);
    }
  }, [myTeam]);

  useEffect(() => {
    loadActiveRound();
  }, [loadActiveRound]);

  if (!fetched) return null;

  if (!myTeam) {
    return (
      <StateMessage
        title="Bạn chưa có team."
        description="Vui lòng đăng ký team trước khi xem đề bài."
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin text-[#F26F21]" />
        Đang tải vòng thi đang diễn ra...
      </div>
    );
  }

  if (error) {
    return (
      <StateMessage
        title="Không thể tải đề bài."
        description={error}
      />
    );
  }

  if (!activeRound) {
    return (
      <StateMessage
        icon={Clock}
        title="Chưa có vòng thi đang diễn ra."
        description="Vui lòng quay lại khi round của team được mở."
      />
    );
  }

  if (!activeRound.topic) {
    return (
      <StateMessage
        icon={FileText}
        title="Đề chưa được phát."
        description="Round đang diễn ra nhưng team chưa được phát đề."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4" style={{ color: "#F26F21" }} />
        <h2
          className="text-sm font-bold uppercase tracking-widest"
          style={{ color: "#F26F21" }}
        >
          Đề bài của team
        </h2>
      </div>
      <ChallengeCard activeRound={activeRound} />
    </div>
  );
}
