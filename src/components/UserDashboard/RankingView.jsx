import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import rankingService from "../../services/rankingService";
import {
  EventTop3Podium,
  RankingBoard,
  extractEventRankingSections,
  extractRankingRows,
} from "../shared/RankingBoard";

function getApiMessage(error, fallback) {
  return error?.response?.data?.message || error?.message || fallback;
}

function getEventRankingMessage(error) {
  const message = getApiMessage(
    error,
    "Không thể tải bảng xếp hạng. Kết quả có thể chưa được công bố.",
  );
  const normalized = message.toLowerCase();

  if (normalized.includes("completed") || normalized.includes("hoàn tất")) {
    return "Kết quả chung cuộc chưa được công bố. Event cần hoàn tất trước khi xem bảng xếp hạng.";
  }

  if (
    normalized.includes("track final") ||
    normalized.includes("final track") ||
    normalized.includes("chung kết") ||
    normalized.includes("chung ket")
  ) {
    return "Cấu hình Track Final chưa hợp lệ. Coordinator cần kiểm tra lại Track Final và Final Round.";
  }

  if (normalized.includes("closed") || normalized.includes("ranking")) {
    return "Final Round chưa có bảng xếp hạng đã chốt.";
  }

  return message;
}

export function RankingView() {
  const myTeam = useSelector((state) => state.team.myTeam);
  const activeEvent = useSelector((state) => state.event.activeEvent);
  const activeEventId = useSelector((state) => state.event.activeEventId);
  const [scope, setScope] = useState("track");
  const [trackRanking, setTrackRanking] = useState(null);
  const [eventRanking, setEventRanking] = useState(null);
  const [eventSections, setEventSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const eventTop3 = Array.isArray(eventRanking?.eventTop3)
    ? eventRanking.eventTop3
    : [];

  const loadRanking = useCallback(async () => {
    const targetId = scope === "track" ? myTeam?.trackId : activeEventId;
    if (!targetId) {
      setTrackRanking(null);
      setEventRanking(null);
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
        setEventRanking(null);
        setEventSections([]);
      } else {
        const response = await rankingService.getEventLeaderboard(targetId);
        const payload = response.data?.data || null;
        setEventRanking(payload);
        setEventSections(extractEventRankingSections(payload));
        setTrackRanking(null);
      }
    } catch (requestError) {
      setTrackRanking(null);
      setEventRanking(null);
      setEventSections([]);
      setError(
        scope === "event"
          ? getEventRankingMessage(requestError)
          : getApiMessage(
              requestError,
              "Không thể tải bảng xếp hạng. Kết quả có thể chưa được công bố.",
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
          Bảng xếp hạng theo track sẽ xuất hiện sau khi tài khoản tham gia một team.
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
            ["event", "Chung cuộc Event"],
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
          title={trackRanking?.trackName || "Bảng xếp hạng chung cuộc của track"}
          subtitle={
            trackRanking?.roundName ||
            trackRanking?.finalRoundName ||
            "Hệ thống tự chọn vòng chung kết của track"
          }
          rows={extractRankingRows(trackRanking)}
          loading={loading}
          error={error}
          onReload={loadRanking}
          highlightTeamId={myTeam.id}
        />
      ) : loading || error ? (
        <RankingBoard
          title={activeEvent?.name || "Bảng xếp hạng toàn sự kiện"}
          subtitle="Top 3 và bảng đầy đủ của Final Round"
          rows={[]}
          loading={loading}
          error={error}
          onReload={loadRanking}
          highlightTeamId={myTeam.id}
        />
      ) : (
        <div className="space-y-6">
          <EventTop3Podium rows={eventTop3} />
          {eventSections.length === 0 ? (
            <RankingBoard
              title={activeEvent?.name || "Bảng xếp hạng toàn sự kiện"}
              subtitle="Bảng đầy đủ của Final Round"
              rows={[]}
              onReload={loadRanking}
              highlightTeamId={myTeam.id}
            />
          ) : (
            eventSections.map((section) => (
              <RankingBoard
                key={section.id}
                title={section.name}
                subtitle={`Bảng đầy đủ - ${section.roundName}`}
                rows={section.rows}
                onReload={loadRanking}
                highlightTeamId={myTeam.id}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
