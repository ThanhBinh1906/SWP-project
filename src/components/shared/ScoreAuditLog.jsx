import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Clock3,
  History,
  Loader2,
  RefreshCw,
} from "lucide-react";
import auditLogService from "../../services/auditLogService";

const PAGE_SIZE = 10;

function getApiMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.title ||
    error?.message ||
    fallback
  );
}

function formatDateTime(value) {
  if (!value) return "Không xác định";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(date);
}

function formatScore(value) {
  if (value === null || value === undefined || value === "") return "—";
  return Number.isFinite(Number(value)) ? Number(value) : value;
}

function AuditEntry({ entry, showJudge }) {
  const isUpdate = entry.action === "Score.Update";
  const commentChanged =
    entry.oldComment !== entry.newComment &&
    (entry.oldComment || entry.newComment);

  return (
    <article className="border-b border-slate-100 px-4 py-5 last:border-b-0 sm:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-2.5 py-1 text-xs font-bold ${
                isUpdate
                  ? "border-amber-200 bg-amber-50 text-amber-800"
                  : "border-emerald-200 bg-emerald-50 text-emerald-800"
              }`}
            >
              {isUpdate ? "Sửa điểm" : "Chấm mới"}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <Clock3 className="h-3.5 w-3.5" />
              {formatDateTime(entry.createdAt)}
            </span>
          </div>

          <h3 className="mt-3 text-base font-bold text-slate-950">
            {entry.teamName || "Team không xác định"}
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            {entry.criterionName || "Tiêu chí không xác định"}
            {entry.university ? ` · ${entry.university}` : ""}
          </p>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            {[entry.eventName, entry.trackName, entry.roundName]
              .filter(Boolean)
              .join(" / ")}
          </p>
          {showJudge && (
            <p className="mt-2 text-sm text-slate-700">
              Judge: <span className="font-semibold">{entry.judgeName || "N/A"}</span>
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          {isUpdate && (
            <>
              <span className="min-w-8 text-center text-xl font-bold text-slate-500">
                {formatScore(entry.oldScore)}
              </span>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </>
          )}
          <span className="min-w-8 text-center text-2xl font-black text-orange-600">
            {formatScore(entry.newScore)}
          </span>
          <span className="text-xs font-bold uppercase text-slate-500">điểm</span>
        </div>
      </div>

      {commentChanged && (
        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs font-bold uppercase text-slate-500">Nhận xét cũ</p>
            <p className="mt-1 whitespace-pre-wrap text-slate-700">
              {entry.oldComment || "Không có nhận xét"}
            </p>
          </div>
          <div className="rounded-lg bg-orange-50 p-3">
            <p className="text-xs font-bold uppercase text-orange-700">Nhận xét mới</p>
            <p className="mt-1 whitespace-pre-wrap text-slate-800">
              {entry.newComment || "Không có nhận xét"}
            </p>
          </div>
        </div>
      )}
    </article>
  );
}

export default function ScoreAuditLog({ scope = "judge" }) {
  const [page, setPage] = useState(1);
  const [pageData, setPageData] = useState({ items: [], totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const isCoordinator = scope === "coordinator";

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const request = isCoordinator
        ? auditLogService.getCoordinatorScoreLogs
        : auditLogService.getJudgeScoreLogs;
      const response = await request({ pageNumber: page, pageSize: PAGE_SIZE });
      const data = response.data?.data || {};

      setPageData({
        items: Array.isArray(data.items) ? data.items : [],
        pageNumber: Number(data.pageNumber || page),
        totalRecords: Number(data.totalRecords || 0),
        totalPages: Math.max(1, Number(data.totalPages || 1)),
        hasPreviousPage: Boolean(data.hasPreviousPage),
        hasNextPage: Boolean(data.hasNextPage),
      });
    } catch (requestError) {
      setError(
        getApiMessage(requestError, "Không thể tải lịch sử chấm điểm."),
      );
    } finally {
      setLoading(false);
    }
  }, [isCoordinator, page]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-200 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-orange-200 bg-orange-50 text-orange-600">
            <History className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-950">Lịch sử chấm điểm</h2>
            <p className="mt-1 text-sm text-slate-500">
              {isCoordinator
                ? "Theo dõi các lần Judge chấm mới hoặc sửa điểm."
                : "Các lần chấm mới và sửa điểm của bạn."}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={loadLogs}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Làm mới
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 px-6 py-16 text-sm font-semibold text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin text-orange-600" />
          Đang tải lịch sử...
        </div>
      ) : error ? (
        <div className="m-4 rounded-xl border border-red-200 bg-red-50 p-5 sm:m-6">
          <p className="font-bold text-red-900">Không thể tải lịch sử chấm điểm</p>
          <p className="mt-1 text-sm text-red-700">{error}</p>
          <button
            type="button"
            onClick={loadLogs}
            className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-bold text-white hover:bg-red-800"
          >
            Thử lại
          </button>
        </div>
      ) : pageData.items.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <History className="mx-auto h-9 w-9 text-slate-300" />
          <p className="mt-3 font-bold text-slate-800">Chưa có lịch sử chấm điểm</p>
          <p className="mt-1 text-sm text-slate-500">
            Lịch sử sẽ xuất hiện sau khi điểm được tạo hoặc chỉnh sửa.
          </p>
        </div>
      ) : (
        <div>
          {pageData.items.map((entry) => (
            <AuditEntry
              key={entry.auditLogId}
              entry={entry}
              showJudge={isCoordinator}
            />
          ))}
        </div>
      )}

      {!loading && !error && pageData.items.length > 0 && (
        <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-sm text-slate-600">
            Trang <span className="font-bold text-slate-900">{pageData.pageNumber}</span>
            {" / "}
            <span className="font-bold text-slate-900">{pageData.totalPages}</span>
            {pageData.totalRecords > 0 && ` · ${pageData.totalRecords} thay đổi`}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={!pageData.hasPreviousPage && page <= 1}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              Trước
            </button>
            <button
              type="button"
              onClick={() => setPage((current) => current + 1)}
              disabled={!pageData.hasNextPage || page >= pageData.totalPages}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Sau
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
