import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Award,
  CalendarDays,
  CheckCircle2,
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
import rankingService from "../services/rankingService";
import { getRedirectPathByUser } from "../utils/roleHelpers";

function unwrapData(response) {
  const data = response?.data?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

function getEventId(event) {
  return event?.eventId ?? event?.id;
}

function getEventName(event) {
  return event?.eventName || event?.name || `Event #${getEventId(event)}`;
}

function getApiMessage(error, fallback) {
  return error?.response?.data?.message || error?.message || fallback;
}

function getPublicResultMessage(error) {
  const message = getApiMessage(
    error,
    "Sự kiện này chưa có kết quả công bố hoặc dữ liệu chưa đủ điều kiện hiển thị.",
  );
  const normalized = message.toLowerCase();

  if (
    normalized.includes("completed") ||
    normalized.includes("closed") ||
    normalized.includes("đóng") ||
    normalized.includes("dong")
  ) {
    return "Kết quả chưa được công bố. Event cần hoàn tất và Final Round cần đóng trước khi xem kết quả.";
  }

  if (
    normalized.includes("prize") ||
    normalized.includes("giải") ||
    normalized.includes("giai")
  ) {
    return "Chưa đủ cấu hình giải thưởng hoặc chưa xác định được Top 1, 2, 3 của Event.";
  }

  if (
    normalized.includes("ranking") ||
    normalized.includes("xếp hạng") ||
    normalized.includes("xep hang")
  ) {
    return "Final Round chưa có bảng xếp hạng chính thức.";
  }

  return message;
}

function formatDate(value) {
  if (!value) return "Chưa có thời gian";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa có thời gian";
  return date.toLocaleDateString("vi-VN");
}

function formatSnapshotTime(value) {
  if (!value) return "Chưa có thời điểm tính";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa có thời điểm tính";
  return date.toLocaleString("vi-VN");
}

function sortByRank(rows = []) {
  return [...rows].sort((left, right) => {
    const leftRank = Number(left.rankPosition || Number.MAX_SAFE_INTEGER);
    const rightRank = Number(right.rankPosition || Number.MAX_SAFE_INTEGER);
    if (leftRank !== rightRank) return leftRank - rightRank;
    return Number(right.totalScore || 0) - Number(left.totalScore || 0);
  });
}

function normalizePrizeWinners(payload) {
  const candidates = [
    payload?.prizeWinners,
    payload?.winners,
    payload?.prizes,
  ];
  return candidates.find(Array.isArray) || [];
}

function EventPicker({
  events,
  selectedEventId,
  loading,
  error,
  onReload,
  onSelect,
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-700">
            Sự kiện công khai
          </p>
          <h2 className="mt-1 text-xl font-black text-slate-950">
            Chọn sự kiện để xem kết quả
          </h2>
        </div>
        <button
          type="button"
          onClick={onReload}
          disabled={loading}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 hover:border-orange-300 hover:text-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Làm mới
        </button>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : loading ? (
        <div className="flex min-h-32 items-center justify-center gap-2 rounded-lg border border-dashed border-slate-200 text-sm text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin text-orange-600" />
          Đang tải danh sách sự kiện...
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 px-5 py-8 text-center">
          <CalendarDays className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 font-bold text-slate-800">Chưa có sự kiện public</p>
          <p className="mt-1 text-sm text-slate-500">
            Backend hiện chỉ trả Event ở trạng thái Active hoặc Completed.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {events.map((event) => {
            const eventId = getEventId(event);
            const selected = String(eventId) === String(selectedEventId);
            const ready = Boolean(event.resultsAvailable);
            return (
              <article
                key={eventId}
                className={`rounded-xl border p-4 transition ${
                  selected
                    ? "border-orange-300 bg-orange-50"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold uppercase text-slate-600">
                        {event.status || "Public"}
                      </span>
                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs font-bold ${
                          ready
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-amber-200 bg-amber-50 text-amber-700"
                        }`}
                      >
                        {ready ? "Đã có kết quả" : "Chưa có kết quả"}
                      </span>
                    </div>
                    <h3 className="mt-3 text-lg font-black text-slate-950">
                      {getEventName(event)}
                    </h3>
                    <p className="mt-2 text-sm text-slate-500">
                      {formatDate(event.startDate)} - {formatDate(event.endDate)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelect(event)}
                    disabled={!ready}
                    className={`inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg px-4 text-sm font-bold ${
                      ready
                        ? "bg-orange-600 text-white hover:bg-orange-700"
                        : "cursor-not-allowed bg-slate-100 text-slate-400"
                    }`}
                  >
                    {ready ? "Xem kết quả" : "Đang chờ"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function PrizeWinners({ winners = [] }) {
  const rows = sortByRank(winners);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-700">
            Prize Winners
          </p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">
            Danh sách đội đạt giải
          </h2>
        </div>
        <p className="text-sm text-slate-500">
          Giải thưởng được ghép từ cấu hình Prize của Event và bảng xếp hạng chung cuộc.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center">
          <Award className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 font-bold text-slate-800">Chưa có danh sách đội đạt giải</p>
          <p className="mt-1 text-sm text-slate-500">
            Backend sẽ trả dữ liệu sau khi Final Round đã đóng và Prize hạng 1, 2, 3 đã được cấu hình.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-3">
          {rows.map((winner, index) => {
            const rank = winner.rankPosition || index + 1;
            const amount =
              winner.amount == null
                ? null
                : Number(winner.amount).toLocaleString("vi-VN");
            return (
              <article
                key={`${winner.teamName || "team"}-${rank}-${index}`}
                className="rounded-xl border border-orange-100 bg-orange-50/50 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wider text-orange-700">
                      Hạng {rank}
                    </p>
                    <h3 className="mt-2 truncate text-lg font-black text-slate-950">
                      {winner.prizeName || `Giải hạng ${rank}`}
                    </h3>
                  </div>
                  <Award className="h-6 w-6 shrink-0 text-orange-600" />
                </div>
                <p className="mt-4 font-bold text-slate-950">
                  {winner.teamName || "Team"}
                </p>
                {winner.university && (
                  <p className="mt-1 text-sm text-slate-500">{winner.university}</p>
                )}
                <div className="mt-4 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-2xl font-black text-slate-950">
                      {Number(winner.totalScore || 0).toFixed(2)}
                    </p>
                    <p className="text-xs font-bold uppercase text-slate-400">Điểm</p>
                  </div>
                  {amount && (
                    <p className="rounded-full bg-white px-3 py-1 text-xs font-bold text-orange-700">
                      {amount}
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default function ResultPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedEventId = searchParams.get("eventId") || "";
  const user = useSelector((state) => state.auth.user);
  const [publicEvents, setPublicEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState("");
  const [selectedEventId, setSelectedEventId] = useState(requestedEventId);
  const [publicResult, setPublicResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedEvent = useMemo(
    () =>
      publicEvents.find(
        (event) => String(getEventId(event)) === String(selectedEventId),
      ) || null,
    [publicEvents, selectedEventId],
  );

  const sections = useMemo(
    () => extractEventRankingSections(publicResult),
    [publicResult],
  );
  const rankings = Array.isArray(publicResult?.rankings)
    ? publicResult.rankings
    : sections.flatMap((section) => section.rows || []);
  const prizeWinners = normalizePrizeWinners(publicResult);
  const uniqueTeams = new Set(
    rankings.map((row) => String(row.teamId || row.teamName || row.rankPosition)),
  ).size;
  const latestSnapshotAt = publicResult?.calculatedAt || null;

  const loadPublicEvents = useCallback(async () => {
    setEventsLoading(true);
    setEventsError("");
    try {
      const response = await rankingService.getPublicEvents();
      setPublicEvents(unwrapData(response));
    } catch (requestError) {
      setPublicEvents([]);
      setEventsError(
        getApiMessage(requestError, "Không thể tải danh sách sự kiện công khai."),
      );
    } finally {
      setEventsLoading(false);
    }
  }, []);

  const loadPublicResults = useCallback(async () => {
    if (!selectedEventId) {
      setPublicResult(null);
      setError("");
      return;
    }

    if (selectedEvent && !selectedEvent.resultsAvailable) {
      setPublicResult(null);
      setError("Sự kiện này chưa có kết quả công bố.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await rankingService.getPublicEventResults(selectedEventId);
      setPublicResult(response.data?.data || null);
    } catch (requestError) {
      setPublicResult(null);
      setError(getPublicResultMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [selectedEvent, selectedEventId]);

  useEffect(() => {
    loadPublicEvents();
  }, [loadPublicEvents]);

  useEffect(() => {
    if (selectedEventId || publicEvents.length === 0) return;
    const firstReadyEvent = publicEvents.find((event) => event.resultsAvailable);
    if (firstReadyEvent) {
      const eventId = getEventId(firstReadyEvent);
      setSelectedEventId(String(eventId));
      setSearchParams({ eventId: String(eventId) }, { replace: true });
    }
  }, [publicEvents, selectedEventId, setSearchParams]);

  useEffect(() => {
    loadPublicResults();
  }, [loadPublicResults]);

  const handleSelectEvent = (event) => {
    const eventId = getEventId(event);
    if (!eventId || !event.resultsAvailable) return;
    setSelectedEventId(String(eventId));
    setSearchParams({ eventId: String(eventId) }, { replace: true });
  };

  const selectedEventName =
    publicResult?.eventName || (selectedEvent ? getEventName(selectedEvent) : "");

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => navigate(user ? getRedirectPathByUser(user) : "/")}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-bold text-slate-700 hover:border-orange-300 hover:text-orange-700"
          >
            <ArrowLeft className="h-4 w-4" />
            {user ? "Dashboard" : "Trang chủ"}
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
                Kết quả công khai
              </p>
              <h1 className="mt-3 max-w-3xl text-3xl font-black text-slate-950 sm:text-4xl">
                {selectedEventName || "Bảng xếp hạng sự kiện"}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Danh sách sự kiện được lấy từ API public. Nút xem kết quả chỉ mở khi backend trả về <strong>resultsAvailable</strong>.
              </p>
              <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Cập nhật: {formatSnapshotTime(latestSnapshotAt)}
              </p>
              {(publicResult?.finalTrackName || publicResult?.finalRoundName) && (
                <p className="mt-2 text-sm text-slate-500">
                  {publicResult.finalTrackName || "Track Final"} ·{" "}
                  {publicResult.finalRoundName || "Final Round"}
                </p>
              )}
            </div>
            <div className="border-t border-orange-100 bg-orange-50 p-6 lg:border-l lg:border-t-0">
              <div className="flex h-full flex-col justify-center gap-3">
                <div className="flex items-center gap-3 rounded-xl bg-white p-4">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                  <div>
                    <p className="text-sm font-black text-slate-950">
                      {publicEvents.filter((event) => event.resultsAvailable).length} sự kiện có kết quả
                    </p>
                    <p className="text-xs text-slate-500">
                      Trong {publicEvents.length} sự kiện public
                    </p>
                  </div>
                </div>
                <p className="text-xs leading-5 text-orange-900">
                  Event chưa đủ Final Ranking hoặc chưa đủ Prize hạng 1, 2, 3 sẽ hiển thị trạng thái chờ.
                </p>
              </div>
            </div>
          </div>
        </section>

        <EventPicker
          events={publicEvents}
          selectedEventId={selectedEventId}
          loading={eventsLoading}
          error={eventsError}
          onReload={loadPublicEvents}
          onSelect={handleSelectEvent}
        />

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ["Bảng chung kết", sections.length || (publicResult ? 1 : 0), Trophy],
            ["Team có thứ hạng", uniqueTeams, Users],
            ["Giải thưởng", prizeWinners.length, Award],
          ].map(([label, value, Icon]) => (
            <div key={label} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    {label}
                  </p>
                  <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-orange-700">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin text-orange-600" />
            Đang tải kết quả Event...
          </div>
        ) : error ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm font-semibold text-amber-800">
            {error}
          </div>
        ) : !selectedEventId ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <Trophy className="mx-auto h-9 w-9 text-slate-300" />
            <p className="mt-3 font-bold text-slate-800">Chưa chọn sự kiện</p>
            <p className="mt-1 text-sm text-slate-500">
              Chọn một sự kiện đã có kết quả ở danh sách bên trên để xem bảng xếp hạng công khai.
            </p>
          </div>
        ) : (
          <div className="space-y-7">
            <PrizeWinners winners={prizeWinners} />
            {sections.length === 0 ? (
              <RankingBoard
                title={selectedEventName || "Bảng xếp hạng sự kiện"}
                subtitle="Bảng đầy đủ của Final Round"
                rows={rankings}
                onReload={loadPublicResults}
              />
            ) : (
              sections.map((section) => (
                <RankingBoard
                  key={section.id}
                  title={section.name}
                  subtitle={`Bảng đầy đủ - ${section.roundName}`}
                  rows={section.rows}
                />
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
