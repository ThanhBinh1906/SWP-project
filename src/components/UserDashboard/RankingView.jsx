import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import rankingService from "../../services/rankingService";
import {
  RankingBoard,
  extractEventRankingSections,
  extractRankingRows,
} from "../shared/RankingBoard";

function getApiMessage(error, fallback) {
  return error?.response?.data?.message || error?.message || fallback;
}

export function RankingView() {
  const myTeam = useSelector((state) => state.team.myTeam);
  const activeEvent = useSelector((state) => state.event.activeEvent);
  const activeEventId = useSelector((state) => state.event.activeEventId);
  const [scope, setScope] = useState("track");
  const [trackRanking, setTrackRanking] = useState(null);
  const [eventSections, setEventSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadRanking = useCallback(async () => {
    const targetId = scope === "track" ? myTeam?.trackId : activeEventId;
    if (!targetId) {
      setTrackRanking(null);
      setEventSections([]);
      setError("");
      return;
    }

    setLoading(true);
    setError("");
    try {
      if (scope === "track") {
        const response = await rankingService.getTrackLeaderboard(targetId);
        setTrackRanking(response.data?.data || null);
        setEventSections([]);
      } else {
        const response = await rankingService.getEventLeaderboard(targetId);
        setEventSections(extractEventRankingSections(response.data?.data));
        setTrackRanking(null);
      }
    } catch (requestError) {
      setTrackRanking(null);
      setEventSections([]);
      setError(
        getApiMessage(
          requestError,
          "Không thể tải bảng xếp hạng. Ranking có thể chưa được công bố.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [activeEventId, myTeam?.trackId, scope]);

  useEffect(() => {
    loadRanking();
  }, [loadRanking]);

  if (!myTeam) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
        <p className="font-bold text-slate-900">Bạn chưa có đội thi</p>
        <p className="mt-1 text-sm text-slate-500">
          Ranking theo Track sẽ xuất hiện sau khi tài khoản tham gia một team.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-orange-700">
            Kết quả chính thức
          </p>
          <h3 className="mt-1 text-xl font-black text-slate-950">
            {myTeam.teamName || "Đội của bạn"}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Track #{myTeam.trackId} · {activeEvent?.name || "Sự kiện hiện tại"}
          </p>
        </div>
        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
          {[
            ["track", "Track của đội"],
            ["event", "Toàn Event"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setScope(value)}
              className={`rounded-md px-4 py-2 text-sm font-bold transition ${
                scope === value
                  ? "bg-white text-orange-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {scope === "track" ? (
        <RankingBoard
          title={trackRanking?.trackName || "Final Ranking của Track"}
          subtitle={
            trackRanking?.roundName ||
            trackRanking?.finalRoundName ||
            "Backend tự xác định Final Round của Track"
          }
          rows={extractRankingRows(trackRanking)}
          loading={loading}
          error={error}
          onReload={loadRanking}
          highlightTeamId={myTeam.id}
        />
      ) : loading || error || eventSections.length === 0 ? (
        <RankingBoard
          title={activeEvent?.name || "Ranking toàn Event"}
          subtitle="Final Ranking của tất cả Track"
          rows={[]}
          loading={loading}
          error={error}
          onReload={loadRanking}
          highlightTeamId={myTeam.id}
        />
      ) : (
        <div className="space-y-6">
          {eventSections.map((section) => (
            <RankingBoard
              key={section.id}
              title={section.name}
              subtitle={section.roundName}
              rows={section.rows}
              onReload={loadRanking}
              highlightTeamId={myTeam.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
