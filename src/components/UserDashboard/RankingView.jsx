import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import rankingService from "../../services/rankingService";
import {
  EventTop3Podium,
  RankingBoard,
  extractEventRankingSections,
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
  const [eventRanking, setEventRanking] = useState(null);
  const [eventSections, setEventSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const eventTop3 = Array.isArray(eventRanking?.eventTop3)
    ? eventRanking.eventTop3
    : [];

  const loadRanking = useCallback(async () => {
    if (!activeEventId) {
      setEventRanking(null);
      setEventSections([]);
      setError("");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await rankingService.getEventLeaderboard(activeEventId);
      const payload = response.data?.data || null;
      setEventRanking(payload);
      setEventSections(extractEventRankingSections(payload));
    } catch (requestError) {
      setEventRanking(null);
      setEventSections([]);
      setError(getEventRankingMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [activeEventId]);

  useEffect(() => {
    loadRanking();
  }, [loadRanking]);

  if (!myTeam) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
        <p className="font-bold text-slate-900">Bạn chưa có đội thi</p>
        <p className="mt-1 text-sm text-slate-500">
          Bảng xếp hạng chung cuộc sẽ xuất hiện sau khi kết quả sự kiện được công bố.
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
        <div className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-bold text-orange-700">
          Chung cuộc Event
        </div>
      </div>

      {loading || error ? (
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
