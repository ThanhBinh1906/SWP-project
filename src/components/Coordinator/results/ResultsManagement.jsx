import { useCallback, useEffect, useMemo, useState } from "react";
import eventService from "../../../services/eventService";
import rankingService from "../../../services/rankingService";
import roundService from "../../../services/roundService";
import trackService from "../../../services/trackService";
import dashboardService from "../../../services/dashboardService";
import { PrizeManagement } from "./PrizeManagement";
import { ChevronDown } from "lucide-react";
import {
  CoordinatorActionButton,
  CoordinatorBadge,
  CoordinatorTable,
  ModalShell,
  icons,
} from "../CoordinatorUI";
import {
  ApiErrorState,
  FilterSelect,
  LoadingState,
  formatDateTime,
  getApiMessage,
  validateRoundSelection,
} from "../coordinatorHelpers";

const EMPTY_LEADERBOARD = {
  roundId: null,
  roundName: "",
  advancingSlots: 0,
  totalTeams: 0,
  calculatedAt: null,
  rankings: [],
};

function normalizeLeaderboard(data) {
  return {
    ...EMPTY_LEADERBOARD,
    ...(data || {}),
    rankings: Array.isArray(data?.rankings) ? data.rankings : [],
  };
}

function sortRankings(rankings) {
  return [...rankings].sort((a, b) => {
    const rankA = Number(a.rankPosition || 0);
    const rankB = Number(b.rankPosition || 0);
    if (rankA !== rankB) return rankA - rankB;
    return Number(b.totalScore || 0) - Number(a.totalScore || 0);
  });
}

function formatScore(value) {
  const score = Number(value || 0);
  if (!Number.isFinite(score)) return "0";
  return Number.isInteger(score) ? String(score) : score.toFixed(2);
}

function parseDownloadName(headers, fallbackName) {
  const disposition = headers?.["content-disposition"] || "";
  const match = disposition.match(/filename\*?=(?:UTF-8''|\")?([^";]+)/i);
  return match?.[1]
    ? decodeURIComponent(match[1].replace(/\"/g, ""))
    : fallbackName;
}

function downloadBlob(response, fallbackName) {
  const url = URL.createObjectURL(response.data);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = parseDownloadName(response.headers, fallbackName);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

async function getExportErrorMessage(error, fallbackMessage) {
  const responseData = error?.response?.data;
  if (responseData instanceof Blob) {
    try {
      const payload = JSON.parse(await responseData.text());
      return payload?.message || fallbackMessage;
    } catch {
      return fallbackMessage;
    }
  }
  return getApiMessage(error, fallbackMessage);
}

function TeamRankingDetails({ ranking }) {
  if (!ranking) return null;

  return (
    <div className="space-y-3 text-sm">
      <DetailRow label="Team" value={ranking.teamName || ranking.teamId} />
      <DetailRow label="Team ID" value={ranking.teamId} mono />
      <DetailRow label="Round" value={ranking.roundName || `Round #${ranking.roundId}`} />
      <DetailRow label="Rank" value={`#${ranking.rankPosition || "—"}`} />
      <DetailRow label="Total score" value={formatScore(ranking.totalScore)} />
      <DetailRow
        label="Status"
        value={
          <CoordinatorBadge tone={ranking.isAdvancing ? "success" : "neutral"}>
            {ranking.isAdvancing ? "Vào vòng trong" : "Không vào vòng trong"}
          </CoordinatorBadge>
        }
      />
      <DetailRow label="Calculated at" value={formatDateTime(ranking.calculatedAt)} />
    </div>
  );
}

function DetailRow({ label, value, mono = false }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
        {label}
      </span>
      <span
        className={`min-w-0 text-right text-sm font-semibold text-slate-900 ${
          mono ? "break-all font-mono text-xs" : "break-words"
        }`}
      >
        {value || "—"}
      </span>
    </div>
  );
}

export function ResultsManagement() {
  const [events, setEvents] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [selectedTrackId, setSelectedTrackId] = useState("");
  const [selectedRoundId, setSelectedRoundId] = useState("");

  const [leaderboard, setLeaderboard] = useState(EMPTY_LEADERBOARD);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState("");
  const [calculating, setCalculating] = useState(false);
  const [calculateMessage, setCalculateMessage] = useState("");
  const [calculateConfirmOpen, setCalculateConfirmOpen] = useState(false);

  const [detailRanking, setDetailRanking] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [exporting, setExporting] = useState("");
  const [exportError, setExportError] = useState("");

  useEffect(() => {
    eventService
      .getAll()
      .then((res) => {
        const list = res.data?.data || [];
        setEvents(list);
        if (list.length > 0) setSelectedEventId(String(list[0].id));
      })
      .catch(() => setEvents([]));
  }, []);

  useEffect(() => {
    if (!selectedEventId) {
      setTracks([]);
      setSelectedTrackId("");
      return;
    }

    setTracks([]);
    setSelectedTrackId("");
    setRounds([]);
    setSelectedRoundId("");
    trackService
      .getByEvent(selectedEventId)
      .then((res) => {
        const list = res.data?.data || [];
        setTracks(list);
        setSelectedTrackId(list.length > 0 ? String(list[0].id) : "");
      })
      .catch(() => setTracks([]));
  }, [selectedEventId]);

  useEffect(() => {
    if (!selectedTrackId) {
      setRounds([]);
      setSelectedRoundId("");
      return;
    }

    setRounds([]);
    setSelectedRoundId("");
    roundService
      .getByTrack(selectedTrackId)
      .then((res) => {
        const list = res.data?.data || [];
        setRounds(list);
        setSelectedRoundId(list.length > 0 ? String(list[0].id) : "");
      })
      .catch(() => setRounds([]));
  }, [selectedTrackId]);

  const roundCheck = validateRoundSelection({
    selectedEventId,
    selectedTrackId,
    selectedRoundId,
    rounds,
    tracks,
    events,
  });

  const selectedTrack = tracks.find((track) => String(track.id) === selectedTrackId);
  const selectedRound = rounds.find((round) => String(round.id) === selectedRoundId);
  const roundCanExport = ["Closed", "Completed"].includes(selectedRound?.status);

  const sortedRankings = useMemo(
    () => sortRankings(leaderboard.rankings),
    [leaderboard.rankings],
  );
  const advancingCount = sortedRankings.filter((ranking) => ranking.isAdvancing).length;

  const fetchLeaderboard = useCallback(async () => {
    if (!roundCheck.roundId) {
      setLeaderboard(EMPTY_LEADERBOARD);
      setLeaderboardError("");
      return;
    }

    setLoadingLeaderboard(true);
    setLeaderboardError("");
    setCalculateMessage("");
    try {
      const res = await rankingService.getRoundLeaderboard(roundCheck.roundId);
      setLeaderboard(normalizeLeaderboard(res.data?.data));
    } catch (err) {
      setLeaderboard(EMPTY_LEADERBOARD);
      setLeaderboardError(
        getApiMessage(
          err,
          "Chưa tải được bảng xếp hạng. Hãy thử tính ranking cho round này.",
        ),
      );
    } finally {
      setLoadingLeaderboard(false);
    }
  }, [roundCheck.roundId]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const handleCalculate = async () => {
    if (!roundCheck.roundId) return;

    setCalculating(true);
    setLeaderboardError("");
    setCalculateMessage("");
    try {
      const res = await rankingService.calculateRound(roundCheck.roundId);
      setLeaderboard(normalizeLeaderboard(res.data?.data));
      setCalculateMessage(res.data?.message || "Tính ranking thành công.");
    } catch (err) {
      setLeaderboardError(getApiMessage(err, "Tính ranking thất bại."));
    } finally {
      setCalculating(false);
      setCalculateConfirmOpen(false);
    }
  };

  const openTeamRanking = async (ranking) => {
    if (!roundCheck.roundId || !ranking.teamId) return;

    setDetailRanking(null);
    setDetailError("");
    setDetailLoading(true);
    try {
      const res = await rankingService.getTeamRanking(
        roundCheck.roundId,
        ranking.teamId,
      );
      setDetailRanking(res.data?.data || ranking);
    } catch (err) {
      setDetailError(getApiMessage(err, "Không thể tải ranking của team."));
      setDetailRanking(ranking);
    } finally {
      setDetailLoading(false);
    }
  };

  const exportRoundRanking = async () => {
    if (!roundCheck.roundId || !roundCanExport) return;
    setExporting("round");
    setExportError("");
    try {
      const response = await rankingService.exportRound(roundCheck.roundId);
      downloadBlob(response, `ranking-round-${roundCheck.roundId}.xlsx`);
    } catch (error) {
      setExportError(
        await getExportErrorMessage(
          error,
          "Không thể xuất ranking của Round đã chọn.",
        ),
      );
    } finally {
      setExporting("");
    }
  };

  const exportEventRanking = async () => {
    if (!selectedEventId) return;
    setExporting("event");
    setExportError("");
    try {
      const response = await rankingService.exportEvent(selectedEventId);
      downloadBlob(response, `ranking-event-${selectedEventId}.xlsx`);
    } catch (error) {
      setExportError(
        await getExportErrorMessage(
          error,
          "Không thể xuất ranking của Event đã chọn.",
        ),
      );
    } finally {
      setExporting("");
    }
  };

  const exportRblCsv = async () => {
    if (!selectedEventId) return;
    setExporting("rbl");
    setExportError("");
    try {
      const response = await dashboardService.downloadAnonymousRblCsv(selectedEventId);
      downloadBlob(response, `rbl-anonymous-scores-event-${selectedEventId}.csv`);
    } catch (error) {
      setExportError(
        await getExportErrorMessage(
          error,
          "Không thể xuất dữ liệu chấm điểm ẩn danh (RBL).",
        ),
      );
    } finally {
      setExporting("");
    }
  };

  const columns = [
    { key: "rank", label: "Hạng" },
    { key: "team", label: "Đội thi" },
    { key: "score", label: "Tổng điểm" },
    { key: "status", label: "Kết quả" },
    { key: "calculatedAt", label: "Cập nhật" },
  ];

  return (
    <div className="space-y-4">
      <section className="overflow-visible rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="flex flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-black text-slate-950">Kết quả vòng thi</h2>
              {selectedRound?.status && (
                <CoordinatorBadge
                  tone={
                    selectedRound.status === "Closed" ||
                    selectedRound.status === "Completed"
                      ? "success"
                      : selectedRound.status === "Scoring"
                        ? "warning"
                        : "neutral"
                  }
                >
                  {selectedRound.status}
                </CoordinatorBadge>
              )}
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Chọn vòng thi, kiểm tra điểm và chốt bảng xếp hạng.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              title="Làm mới leaderboard"
              aria-label="Làm mới leaderboard"
              disabled={!roundCheck.roundId || loadingLeaderboard}
              onClick={fetchLeaderboard}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <icons.Activity
                className={`h-4 w-4 ${loadingLeaderboard ? "animate-pulse" : ""}`}
              />
            </button>

            <details className="group relative">
              <summary className="inline-flex h-10 cursor-pointer list-none items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
                <icons.Download className="h-4 w-4" />
                Tải xuống
                <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
              </summary>
              <div className="absolute right-0 z-20 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                <button
                  type="button"
                  disabled={!roundCheck.roundId || !roundCanExport || !!exporting}
                  onClick={exportRoundRanking}
                  className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
                >
                  {exporting === "round" ? "Đang xuất Round..." : "Ranking của Round"}
                </button>
                <button
                  type="button"
                  disabled={!selectedEventId || !!exporting}
                  onClick={exportEventRanking}
                  className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
                >
                  {exporting === "event" ? "Đang xuất Event..." : "Ranking toàn Event"}
                </button>
                <button
                  type="button"
                  disabled={!selectedEventId || !!exporting}
                  onClick={exportRblCsv}
                  className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
                >
                  {exporting === "rbl" ? "Đang xuất RBL..." : "Dữ liệu ẩn danh (RBL CSV)"}
                </button>
                {!roundCanExport && (
                  <p className="px-3 pb-1 pt-2 text-xs leading-5 text-slate-400">
                    Ranking Round chỉ tải được sau khi vòng thi đã đóng.
                  </p>
                )}
              </div>
            </details>

            <CoordinatorActionButton
              variant="primary"
              icon={icons.Trophy}
              disabled={!roundCheck.roundId || calculating}
              onClick={() => setCalculateConfirmOpen(true)}
            >
              {calculating ? "Đang tính..." : "Tính ranking"}
            </CoordinatorActionButton>
          </div>
        </header>

        <div className="grid gap-3 border-y border-slate-100 bg-slate-50/70 px-4 py-4 sm:px-6 md:grid-cols-3">
          <FilterSelect
            label="Sự kiện"
            icon={icons.CalendarDays}
            value={selectedEventId}
            onChange={(event) => setSelectedEventId(event.target.value)}
          >
            {events.length === 0 ? (
              <option value="">Chưa có sự kiện</option>
            ) : (
              events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))
            )}
          </FilterSelect>
          <FilterSelect
            label="Track"
            icon={icons.GitBranch}
            value={selectedTrackId}
            onChange={(event) => setSelectedTrackId(event.target.value)}
            disabled={!tracks.length}
          >
            {tracks.length === 0 ? (
              <option value="">Chưa có Track</option>
            ) : (
              tracks.map((track) => (
                <option key={track.id} value={track.id}>
                  {track.name}
                </option>
              ))
            )}
          </FilterSelect>
          <FilterSelect
            label="Round"
            icon={icons.Timer}
            value={selectedRoundId}
            onChange={(event) => setSelectedRoundId(event.target.value)}
            disabled={!rounds.length}
          >
            {rounds.length === 0 ? (
              <option value="">Chưa có Round</option>
            ) : (
              rounds.map((round) => (
                <option key={round.id} value={round.id}>
                  {round.name}
                </option>
              ))
            )}
          </FilterSelect>
        </div>

        {(roundCheck.error || calculateMessage || exportError) && (
          <div className="space-y-2 px-4 pt-4 sm:px-6">
            {roundCheck.error && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm font-semibold text-amber-800">
                {roundCheck.error}
              </div>
            )}
            {calculateMessage && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-700">
                {calculateMessage}
              </div>
            )}
            {exportError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-700">
                {exportError}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-orange-600">
              {selectedTrack?.name || "Chưa chọn Track"}
            </p>
            <h3 className="mt-1 text-xl font-black text-slate-950">
              {selectedRound?.name || "Chưa chọn Round"}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Cập nhật: {formatDateTime(leaderboard.calculatedAt)}
            </p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <p className="text-slate-500">
              Đội: <strong className="text-slate-950">{leaderboard.totalTeams || sortedRankings.length}</strong>
            </p>
            <p className="text-slate-500">
              Suất đi tiếp: <strong className="text-slate-950">{leaderboard.advancingSlots || 0}</strong>
            </p>
            <p className="text-slate-500">
              Đã xác định: <strong className="text-emerald-700">{advancingCount}</strong>
            </p>
          </div>
        </div>

        <div className="border-t border-slate-100 px-4 py-5 sm:px-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="font-bold text-slate-950">Bảng xếp hạng</h3>
            <span className="text-xs font-semibold text-slate-400">
              {sortedRankings.length} đội
            </span>
          </div>
        {loadingLeaderboard ? (
          <LoadingState label="Đang tải leaderboard..." />
        ) : leaderboardError ? (
          <ApiErrorState message={leaderboardError} onRetry={fetchLeaderboard} />
        ) : !roundCheck.roundId ? (
          <p className="py-12 text-center text-sm text-slate-400">
            Hãy chọn Event, Track và Round để xem ranking.
          </p>
        ) : sortedRankings.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            <p className="font-bold text-slate-900">Chưa có ranking</p>
            <p className="mt-1 text-sm text-slate-500">
              Bấm “Tính ranking” để backend tính bảng xếp hạng cho round này.
            </p>
          </div>
        ) : (
          <CoordinatorTable
            columns={columns}
            rows={sortedRankings}
            renderCell={(row, key) => {
              if (key === "rank") {
                return (
                  <span className="font-black text-slate-950">
                    #{row.rankPosition || "—"}
                  </span>
                );
              }
              if (key === "team") {
                return (
                  <div>
                    <button
                      type="button"
                      onClick={() => openTeamRanking(row)}
                      className="text-left font-bold text-slate-900 hover:text-orange-700 hover:underline"
                    >
                      {row.teamName || row.teamId}
                    </button>
                    <p className="max-w-56 truncate font-mono text-xs text-slate-400">
                      {row.teamId}
                    </p>
                  </div>
                );
              }
              if (key === "score") {
                return (
                  <span className="font-black text-slate-950">
                    {formatScore(row.totalScore)}
                  </span>
                );
              }
              if (key === "status") {
                return (
                  <CoordinatorBadge tone={row.isAdvancing ? "success" : "neutral"}>
                    {row.isAdvancing ? "Vào vòng trong" : "Không vào vòng trong"}
                  </CoordinatorBadge>
                );
              }
              if (key === "calculatedAt") {
                return (
                  <span className="text-xs text-slate-500">
                    {formatDateTime(row.calculatedAt)}
                  </span>
                );
              }
              return row[key] ?? "—";
            }}
          />
        )}
        </div>
      </section>

      <details className="group">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-4 hover:border-orange-200 [&::-webkit-details-marker]:hidden sm:px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
              <icons.Trophy className="h-4 w-4" />
            </div>
            <div>
              <p className="font-bold text-slate-900">Giải thưởng</p>
              <p className="text-sm text-slate-500">Cấu hình giải và xem đội chiến thắng</p>
            </div>
          </div>
          <ChevronDown className="h-5 w-5 text-slate-400 transition-transform group-open:rotate-180" />
        </summary>
        <div className="mt-4">
          <PrizeManagement trackId={selectedTrackId} roundId={selectedRoundId} />
        </div>
      </details>

      {calculateConfirmOpen && (
        <ModalShell
          title="Xác nhận tính ranking"
          onClose={() => {
            if (!calculating) setCalculateConfirmOpen(false);
          }}
          maxWidthClass="max-w-xl"
          actions={
            <>
              <CoordinatorActionButton
                disabled={calculating}
                onClick={() => setCalculateConfirmOpen(false)}
              >
                Hủy
              </CoordinatorActionButton>
              <CoordinatorActionButton
                variant="danger"
                disabled={calculating}
                icon={icons.Lock}
                onClick={handleCalculate}
              >
                {calculating ? "Đang tính ranking..." : "Xác nhận và khóa điểm"}
              </CoordinatorActionButton>
            </>
          }
        >
          <div className="space-y-4">
            <div className="flex gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                <icons.Lock className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold">Judge sẽ không thể sửa điểm sau thao tác này</p>
                <p className="mt-1 text-sm leading-6 text-amber-800">
                  Hệ thống sẽ chốt điểm hiện tại và dùng dữ liệu đó để tính thứ hạng của các team.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Round được chốt</p>
              <p className="mt-1 font-bold text-slate-950">
                {selectedRound?.name || `Round #${roundCheck.roundId}`}
              </p>
              {selectedTrack?.name && (
                <p className="mt-1 text-sm text-slate-600">Track: {selectedTrack.name}</p>
              )}
            </div>

            <p className="text-sm leading-6 text-slate-700">
              Chỉ xác nhận khi tất cả Judge đã hoàn thành việc chấm điểm và Coordinator đã kiểm tra kết quả.
            </p>
          </div>
        </ModalShell>
      )}

      {(detailLoading || detailRanking || detailError) && (
        <ModalShell
          title="Chi tiết ranking của team"
          onClose={() => {
            setDetailRanking(null);
            setDetailError("");
            setDetailLoading(false);
          }}
          actions={
            <CoordinatorActionButton
              variant="primary"
              onClick={() => {
                setDetailRanking(null);
                setDetailError("");
              }}
            >
              Đóng
            </CoordinatorActionButton>
          }
        >
          {detailLoading ? (
            <LoadingState label="Đang tải ranking của team..." />
          ) : (
            <div className="space-y-4">
              {detailError && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
                  {detailError}
                </div>
              )}
              <TeamRankingDetails ranking={detailRanking} />
            </div>
          )}
        </ModalShell>
      )}
    </div>
  );
}
