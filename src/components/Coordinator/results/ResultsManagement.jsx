import { useCallback, useEffect, useMemo, useState } from "react";
import eventService from "../../../services/eventService";
import rankingService from "../../../services/rankingService";
import roundService from "../../../services/roundService";
import trackService from "../../../services/trackService";
import { PrizeManagement } from "./PrizeManagement";
import {
  CoordinatorActionButton,
  CoordinatorBadge,
  CoordinatorPanel,
  CoordinatorTable,
  ModalShell,
  icons,
} from "../CoordinatorUI";
import {
  ApiErrorState,
  FilterSelect,
  LoadingState,
  SetupRequiredBanner,
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

  const [detailRanking, setDetailRanking] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

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

  const sortedRankings = useMemo(
    () => sortRankings(leaderboard.rankings),
    [leaderboard.rankings],
  );
  const advancingCount = sortedRankings.filter((ranking) => ranking.isAdvancing).length;
  const topRankings = sortedRankings.slice(0, 3);

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

  const columns = [
    { key: "rank", label: "Rank" },
    { key: "team", label: "Team" },
    { key: "score", label: "Total score" },
    { key: "status", label: "Status" },
    { key: "calculatedAt", label: "Calculated at" },
    { key: "actions", label: "Actions" },
  ];

  return (
    <div className="space-y-6">
      <CoordinatorPanel
        title="Bộ lọc ranking"
        subtitle="Chọn đúng round trước khi tính hoặc xem bảng xếp hạng"
        icon={icons.Filter}
        actions={
          <>
            <CoordinatorActionButton
              icon={icons.Activity}
              disabled={!roundCheck.roundId || loadingLeaderboard}
              onClick={fetchLeaderboard}
            >
              Tải leaderboard
            </CoordinatorActionButton>
            <CoordinatorActionButton
              variant="primary"
              icon={icons.Trophy}
              disabled={!roundCheck.roundId || calculating}
              onClick={handleCalculate}
            >
              {calculating ? "Đang tính..." : "Tính ranking"}
            </CoordinatorActionButton>
          </>
        }
      >
        <div className="grid gap-3 md:grid-cols-3">
          <FilterSelect
            label="Sự kiện (Event)"
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
            label="Bảng thi (Track)"
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
            label="Vòng thi (Round)"
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
      </CoordinatorPanel>

      {roundCheck.error && (
        <SetupRequiredBanner
          title={roundCheck.error}
          hint="Thứ tự: Event → Track → Round → Ranking"
        />
      )}

      {calculateMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {calculateMessage}
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="grid gap-0 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="border-b border-slate-100 p-5 sm:p-6 xl:border-b-0 xl:border-r">
            <div className="flex flex-wrap items-center gap-2">
              <CoordinatorBadge tone={roundCheck.roundId ? "orange" : "neutral"}>
                {selectedRound?.name || "Chưa chọn round"}
              </CoordinatorBadge>
              {selectedTrack?.name && (
                <CoordinatorBadge tone="info">{selectedTrack.name}</CoordinatorBadge>
              )}
            </div>
            <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              Bảng xếp hạng theo round
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Ranking được tính từ điểm chấm của round. Coordinator có thể tải
              leaderboard hiện tại hoặc tính lại khi điểm thay đổi.
            </p>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Cập nhật lần cuối: {formatDateTime(leaderboard.calculatedAt)}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 bg-orange-50 p-5 sm:p-6">
            <div className="rounded-xl border border-orange-100 bg-white p-4">
              <p className="text-2xl font-black text-slate-950">
                {leaderboard.totalTeams || sortedRankings.length}
              </p>
              <p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500">
                Teams
              </p>
            </div>
            <div className="rounded-xl border border-orange-100 bg-white p-4">
              <p className="text-2xl font-black text-slate-950">
                {leaderboard.advancingSlots || 0}
              </p>
              <p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500">
                Slots
              </p>
            </div>
            <div className="rounded-xl border border-orange-100 bg-white p-4">
              <p className="text-2xl font-black text-slate-950">{advancingCount}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500">
                Advancing
              </p>
            </div>
          </div>
        </div>
      </section>

      {topRankings.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          {topRankings.map((ranking, index) => (
            <div
              key={ranking.id || ranking.teamId}
              className="rounded-2xl border bg-white p-5 shadow-sm"
              style={{ borderColor: index === 0 ? "#FFD0B5" : "#E5E7EB" }}
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-xl text-lg font-black text-white"
                  style={{ background: index === 0 ? "#F26F21" : "#64748B" }}
                >
                  #{ranking.rankPosition || index + 1}
                </div>
                <CoordinatorBadge tone={ranking.isAdvancing ? "success" : "neutral"}>
                  {ranking.isAdvancing ? "Advancing" : "Not advancing"}
                </CoordinatorBadge>
              </div>
              <h3 className="truncate font-bold text-slate-900">
                {ranking.teamName || ranking.teamId}
              </h3>
              <p className="mt-4 text-3xl font-black text-slate-950">
                {formatScore(ranking.totalScore)}
              </p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Total score
              </p>
            </div>
          ))}
        </div>
      )}

      <CoordinatorPanel
        title="Leaderboard"
        subtitle="Danh sách team theo thứ hạng trong round đã chọn"
        icon={icons.Trophy}
      >
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
                    <p className="font-bold text-slate-900">
                      {row.teamName || row.teamId}
                    </p>
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
              if (key === "actions") {
                return (
                  <CoordinatorActionButton
                    icon={icons.Eye}
                    onClick={() => openTeamRanking(row)}
                  >
                    Detail
                  </CoordinatorActionButton>
                );
              }
              return row[key] ?? "—";
            }}
          />
        )}
      </CoordinatorPanel>

      <PrizeManagement trackId={selectedTrackId} roundId={selectedRoundId} />

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
