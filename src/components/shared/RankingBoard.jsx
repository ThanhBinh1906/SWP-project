import { Loader2, Medal, RefreshCw, Trophy } from "lucide-react";

function formatScore(value) {
  const score = Number(value);
  if (!Number.isFinite(score)) return "0";
  return Number.isInteger(score) ? String(score) : score.toFixed(2);
}

function sortRankings(rows) {
  return [...rows].sort((left, right) => {
    const leftRank = Number(left.rankPosition || Number.MAX_SAFE_INTEGER);
    const rightRank = Number(right.rankPosition || Number.MAX_SAFE_INTEGER);
    if (leftRank !== rightRank) return leftRank - rightRank;
    return Number(right.totalScore || 0) - Number(left.totalScore || 0);
  });
}

export function extractRankingRows(payload) {
  if (Array.isArray(payload)) return payload;
  const candidates = [payload?.rankings, payload?.items, payload?.teams];
  return candidates.find(Array.isArray) || [];
}

export function extractEventRankingSections(payload) {
  const directSections =
    Array.isArray(payload) && payload.some((section) => extractRankingRows(section).length)
      ? payload
      : null;
  const sectionCandidates = [
    directSections,
    payload?.tracks,
    payload?.trackRankings,
    payload?.rankingsByTrack,
  ];
  const sections = sectionCandidates.find(Array.isArray);
  if (sections?.length) {
    return sections.map((section, index) => ({
      id: section.trackId ?? section.id ?? index,
      name: section.trackName || section.name || `Track ${index + 1}`,
      roundName: section.roundName || section.finalRoundName || "Final Round",
      rows: extractRankingRows(section),
    }));
  }

  const flatRows = extractRankingRows(payload);
  const grouped = new Map();
  flatRows.forEach((row) => {
    const key = row.trackId ?? row.trackName ?? "event";
    const section = grouped.get(key) || {
      id: key,
      name: row.trackName || "Event ranking",
      roundName: row.roundName || "Final Round",
      rows: [],
    };
    section.rows.push(row);
    grouped.set(key, section);
  });
  return [...grouped.values()];
}

function RankMark({ rank }) {
  const styles = {
    1: "border-amber-300 bg-amber-50 text-amber-700",
    2: "border-slate-300 bg-slate-100 text-slate-700",
    3: "border-orange-300 bg-orange-50 text-orange-700",
  };
  return (
    <span
      className={`inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-2 text-sm font-black ${
        styles[rank] || "border-slate-200 bg-white text-slate-700"
      }`}
    >
      #{rank || "-"}
    </span>
  );
}

function Podium({ rows }) {
  const topRows = rows.slice(0, 3);
  if (!topRows.length) return null;

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {topRows.map((row, index) => (
        <article
          key={row.id || row.teamId || index}
          className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4"
        >
          <div
            className="absolute inset-x-0 top-0 h-1"
            style={{ background: index === 0 ? "#F26F21" : "#CBD5E1" }}
          />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Hạng {row.rankPosition || index + 1}
              </p>
              <h4 className="mt-2 truncate font-bold text-slate-950">
                {row.teamName || row.teamId || "Team"}
              </h4>
            </div>
            <Medal
              className={`h-6 w-6 shrink-0 ${
                index === 0 ? "text-orange-600" : "text-slate-400"
              }`}
            />
          </div>
          <p className="mt-5 text-3xl font-black text-slate-950">
            {formatScore(row.totalScore)}
          </p>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Tổng điểm
          </p>
        </article>
      ))}
    </div>
  );
}

export function RankingBoard({
  title,
  subtitle,
  rows = [],
  loading = false,
  error = "",
  onReload,
  highlightTeamId,
  emptyMessage = "Chưa có snapshot ranking cho lựa chọn này.",
}) {
  const sortedRows = sortRankings(rows);

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-orange-200 bg-orange-50 text-orange-700">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-950">{title}</h3>
            {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
          </div>
        </div>
        {onReload && (
          <button
            type="button"
            onClick={onReload}
            disabled={loading}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 hover:border-orange-300 hover:text-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Làm mới
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex min-h-56 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin text-orange-600" />
          Đang tải bảng xếp hạng...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : sortedRows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <Trophy className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 font-bold text-slate-800">Chưa có bảng xếp hạng</p>
          <p className="mt-1 text-sm text-slate-500">{emptyMessage}</p>
        </div>
      ) : (
        <>
          <Podium rows={sortedRows} />
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Hạng</th>
                    <th className="px-4 py-3">Team</th>
                    <th className="px-4 py-3">Round</th>
                    <th className="px-4 py-3 text-right">Tổng điểm</th>
                    <th className="px-4 py-3">Kết quả</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedRows.map((row, index) => {
                    const highlighted =
                      highlightTeamId && String(row.teamId) === String(highlightTeamId);
                    return (
                      <tr
                        key={row.id || row.teamId || index}
                        className={highlighted ? "bg-orange-50/70" : "bg-white"}
                      >
                        <td className="px-4 py-3"><RankMark rank={row.rankPosition} /></td>
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-900">
                            {row.teamName || row.teamId || "Team"}
                            {highlighted && (
                              <span className="ml-2 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold uppercase text-orange-700">
                                Đội của bạn
                              </span>
                            )}
                          </p>
                          {row.university && (
                            <p className="mt-1 text-xs text-slate-500">{row.university}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {row.roundName || "Final Round"}
                        </td>
                        <td className="px-4 py-3 text-right text-lg font-black text-slate-950">
                          {formatScore(row.totalScore)}
                        </td>
                        <td className="px-4 py-3">
                          {typeof row.isAdvancing === "boolean" ? (
                            <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${
                              row.isAdvancing
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-slate-200 bg-slate-50 text-slate-600"
                            }`}>
                              {row.isAdvancing ? "Đi tiếp" : "Dừng lại"}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
