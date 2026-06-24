import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Loader2,
  RefreshCw,
  Trophy,
  Users,
} from "lucide-react";
import { useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  RankingBoard,
  extractEventRankingSections,
} from "../components/shared/RankingBoard";
import eventService from "../services/eventService";
import rankingService from "../services/rankingService";
import teamService from "../services/teamService";
import { getRedirectPathByUser, hasRole } from "../utils/roleHelpers";

function getApiMessage(error, fallback) {
  return error?.response?.data?.message || error?.message || fallback;
}

function normalizeEvents(...sources) {
  const events = new Map();
  sources.flat().filter(Boolean).forEach((event) => {
    const id = event.id ?? event.eventId;
    if (id == null) return;
    events.set(String(id), {
      id,
      name: event.name || event.eventName || `Event #${id}`,
      status: event.status || "",
    });
  });
  return [...events.values()];
}

function formatSnapshotTime(value) {
  if (!value) return "Chưa có thời điểm tính";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa có thời điểm tính";
  return date.toLocaleString("vi-VN");
}

export default function ResultPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedEventId = searchParams.get("eventId") || "";
  const user = useSelector((state) => state.auth.user);
  const reduxTeam = useSelector((state) => state.team.myTeam);
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(
    requestedEventId,
  );
  const [eventRanking, setEventRanking] = useState(null);
  const [teamId, setTeamId] = useState(reduxTeam?.id || "");
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingRanking, setLoadingRanking] = useState(false);
  const [error, setError] = useState("");

  const sections = useMemo(
    () => extractEventRankingSections(eventRanking),
    [eventRanking],
  );
  const selectedEvent = events.find(
    (event) => String(event.id) === selectedEventId,
  );
  const allRows = sections.flatMap((section) => section.rows || []);
  const uniqueTeams = new Set(allRows.map((row) => String(row.teamId))).size;

  const discoverEvents = useCallback(async () => {
    setLoadingEvents(true);
    setError("");
    const requestedId = requestedEventId;
    try {
      const [allResult, activeResult] = await Promise.allSettled([
        eventService.getAll(),
        eventService.getActiveEvent(),
      ]);
      const allEvents =
        allResult.status === "fulfilled"
          ? allResult.value.data?.data || allResult.value.data || []
          : [];
      const activeEvent =
        activeResult.status === "fulfilled"
          ? activeResult.value.data?.data || activeResult.value.data
          : null;
      const options = normalizeEvents(
        allEvents,
        activeEvent,
        requestedId ? [{ id: requestedId }] : [],
      );
      setEvents(options);
      setSelectedEventId((current) => {
        const preferred = requestedId || current || activeEvent?.id || options[0]?.id;
        return preferred == null ? "" : String(preferred);
      });
    } catch (requestError) {
      setError(getApiMessage(requestError, "Không thể xác định Event để xem kết quả."));
    } finally {
      setLoadingEvents(false);
    }
  }, [requestedEventId]);

  const loadRanking = useCallback(async () => {
    if (!selectedEventId) {
      setEventRanking(null);
      return;
    }
    setLoadingRanking(true);
    setError("");
    try {
      const response = await rankingService.getEventLeaderboard(selectedEventId);
      setEventRanking(response.data?.data || null);
    } catch (requestError) {
      setEventRanking(null);
      setError(
        getApiMessage(
          requestError,
          "Event này chưa có Final Ranking hoặc kết quả chưa được công bố.",
        ),
      );
    } finally {
      setLoadingRanking(false);
    }
  }, [selectedEventId]);

  useEffect(() => {
    discoverEvents();
  }, [discoverEvents]);

  useEffect(() => {
    loadRanking();
    if (selectedEventId && requestedEventId !== selectedEventId) {
      setSearchParams({ eventId: selectedEventId }, { replace: true });
    }
  }, [loadRanking, requestedEventId, selectedEventId, setSearchParams]);

  useEffect(() => {
    if (!hasRole(user, "Leader") || reduxTeam?.id) return;
    teamService
      .getMyTeam()
      .then((response) => setTeamId(response.data?.data?.id || ""))
      .catch(() => setTeamId(""));
  }, [reduxTeam?.id, user]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => navigate(getRedirectPathByUser(user))}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-bold text-slate-700 hover:border-orange-300 hover:text-orange-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </button>
          <div className="flex items-center gap-2 text-sm font-black uppercase tracking-wider">
            <Trophy className="h-5 w-5 text-orange-600" />
            SEAL Results
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-7 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="grid lg:grid-cols-[1fr_360px]">
            <div className="p-6 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-700">
                Kết quả chính thức
              </p>
              <h1 className="mt-3 max-w-3xl text-3xl font-black text-slate-950 sm:text-4xl">
                {eventRanking?.eventName || selectedEvent?.name || "Event Ranking"}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Bảng xếp hạng lấy từ snapshot Final Round của từng Track. Trang này không tự tính lại điểm.
              </p>
              <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Cập nhật: {formatSnapshotTime(eventRanking?.calculatedAt)}
              </p>
            </div>
            <div className="border-t border-orange-100 bg-orange-50 p-6 lg:border-l lg:border-t-0">
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-orange-800">
                  <CalendarDays className="h-4 w-4" /> Event
                </span>
                <select
                  value={selectedEventId}
                  onChange={(event) => setSelectedEventId(event.target.value)}
                  disabled={loadingEvents || events.length === 0}
                  className="w-full rounded-lg border border-orange-200 bg-white px-3 py-3 text-sm font-bold text-slate-900 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                >
                  {events.length === 0 ? (
                    <option value="">Chưa tìm thấy Event</option>
                  ) : (
                    events.map((event) => (
                      <option key={event.id} value={event.id}>
                        {event.name}{event.status ? ` · ${event.status}` : ""}
                      </option>
                    ))
                  )}
                </select>
              </label>
              <button
                type="button"
                onClick={loadRanking}
                disabled={!selectedEventId || loadingRanking}
                className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 text-sm font-bold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loadingRanking ? "animate-spin" : ""}`} />
                Làm mới kết quả
              </button>
            </div>
          </div>
        </section>

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ["Track", sections.length, Trophy],
            ["Team có ranking", uniqueTeams, Users],
            ["Snapshot", eventRanking ? "Đã có" : "Chưa có", CalendarDays],
          ].map(([label, value, Icon]) => (
            <div key={label} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
                  <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-orange-700">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {loadingEvents || loadingRanking ? (
          <div className="flex min-h-64 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin text-orange-600" />
            Đang tải kết quả Event...
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700">
            {error}
          </div>
        ) : sections.length === 0 ? (
          <RankingBoard
            title={selectedEvent?.name || "Event Ranking"}
            subtitle="Final Ranking của các Track"
            rows={[]}
            onReload={loadRanking}
            highlightTeamId={teamId || reduxTeam?.id}
          />
        ) : (
          <div className="space-y-7">
            {sections.map((section) => (
              <RankingBoard
                key={section.id}
                title={section.name}
                subtitle={section.roundName}
                rows={section.rows}
                highlightTeamId={teamId || reduxTeam?.id}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
