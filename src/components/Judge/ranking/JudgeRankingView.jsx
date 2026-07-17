import { useCallback, useEffect, useMemo, useState } from "react";
import rankingService from "../../../services/rankingService";
import roundService from "../../../services/roundService";
import {
  RankingBoard,
  extractRankingRows,
} from "../../shared/RankingBoard";

function getApiMessage(error, fallback) {
  return error?.response?.data?.message || error?.message || fallback;
}

function normalizeAssignedRounds(rounds) {
  return rounds.map((round) => ({
    ...round,
    id: round.id ?? round.roundId,
    name: round.name || round.roundName || `Round ${round.id ?? round.roundId}`,
    trackName: round.trackName || "Track",
    eventName: round.eventName || "Event",
  }));
}

export function JudgeRankingView() {
  const [rounds, setRounds] = useState([]);
  const [selectedRoundId, setSelectedRoundId] = useState("");
  const [leaderboard, setLeaderboard] = useState(null);
  const [loadingRounds, setLoadingRounds] = useState(true);
  const [loadingRanking, setLoadingRanking] = useState(false);
  const [error, setError] = useState("");

  const selectedRound = useMemo(
    () => rounds.find((round) => String(round.id) === selectedRoundId),
    [rounds, selectedRoundId],
  );

  const loadRounds = useCallback(async () => {
    setLoadingRounds(true);
    setError("");
    try {
      const response = await roundService.getAssigned();
      const options = normalizeAssignedRounds(response.data?.data || []);
      setRounds(options);
      setSelectedRoundId((current) => {
        if (current && options.some((round) => String(round.id) === current)) {
          return current;
        }
        const preferred =
          options.find((round) => round.status === "Scoring") ||
          options.find((round) => round.status === "Closed") ||
          options[0];
        return preferred ? String(preferred.id) : "";
      });
    } catch (requestError) {
      setRounds([]);
      setSelectedRoundId("");
      setError(
        getApiMessage(
          requestError,
          "Không thể tải danh sách Round được phân công.",
        ),
      );
    } finally {
      setLoadingRounds(false);
    }
  }, []);

  const loadRanking = useCallback(async () => {
    if (!selectedRoundId) {
      setLeaderboard(null);
      return;
    }
    setLoadingRanking(true);
    setError("");
    try {
      const response = await rankingService.getRoundLeaderboard(selectedRoundId);
      setLeaderboard(response.data?.data || null);
    } catch (requestError) {
      setLeaderboard(null);
      setError(
        getApiMessage(
          requestError,
          "Round này chưa có bảng xếp hạng đã chốt hoặc chưa được phép công bố.",
        ),
      );
    } finally {
      setLoadingRanking(false);
    }
  }, [selectedRoundId]);

  useEffect(() => {
    loadRounds();
  }, [loadRounds]);

  useEffect(() => {
    loadRanking();
  }, [loadRanking]);

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="space-y-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-orange-700">
              Bảng xếp hạng đã chốt
            </p>
            <h3 className="mt-1 text-xl font-black text-slate-950">
              Bảng xếp hạng Round được phân công
            </h3>
            <p className="mt-1 text-sm text-slate-700">
              Đây là kết quả đã được Coordinator tính và lưu, hệ thống không tự thay đổi điểm tại màn hình này.
            </p>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">
              Round
            </span>
            <select
              value={selectedRoundId}
              onChange={(event) => setSelectedRoundId(event.target.value)}
              disabled={loadingRounds || rounds.length === 0}
              className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:bg-slate-100"
            >
              {rounds.length === 0 ? (
                <option value="">Chưa có Round được phân công</option>
              ) : (
                rounds.map((round) => (
                  <option key={round.id} value={round.id}>
                    {round.name} · {round.trackName} · {round.status}
                  </option>
                ))
              )}
            </select>
          </label>
        </div>
      </section>

      <RankingBoard
        title={leaderboard?.roundName || selectedRound?.name || "Bảng xếp hạng theo Round"}
        subtitle={
          selectedRound
            ? `${selectedRound.trackName} · ${selectedRound.eventName} · ${selectedRound.status}`
            : "Chọn một Round để xem ranking"
        }
        rows={extractRankingRows(leaderboard)}
        loading={loadingRounds || loadingRanking}
        error={error}
        onReload={() => {
          if (rounds.length === 0) loadRounds();
          else loadRanking();
        }}
      />
    </div>
  );
}
