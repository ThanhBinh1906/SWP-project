import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import dashboardService from "../../../services/dashboardService";
import {
  CoordinatorActionButton,
  CoordinatorBadge,
  CoordinatorPanel,
  CoordinatorStatCard,
  icons,
} from "../CoordinatorUI";

const EMPTY_DASHBOARD = {
  summary: {
    totalEvents: 0,
    totalTeams: 0,
    totalSubmissions: 0,
    incompleteSubmissions: 0,
    totalMentors: 0,
    totalJudges: 0,
    eventsByStatus: {},
    roundsByStatus: {},
    teamsByStatus: {},
  },
  highlight: {
    eventWithMostTeams: null,
  },
  events: [],
  charts: {
    teamCountByEvent: [],
    teamCountByTrack: [],
    submissionCountByEvent: [],
  },
};

function safeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeDashboardData(data) {
  const summary = safeObject(data?.summary);
  const charts = safeObject(data?.charts);

  return {
    summary: {
      ...EMPTY_DASHBOARD.summary,
      ...summary,
      eventsByStatus: safeObject(summary.eventsByStatus),
      roundsByStatus: safeObject(summary.roundsByStatus),
      teamsByStatus: safeObject(summary.teamsByStatus),
    },
    highlight: {
      ...EMPTY_DASHBOARD.highlight,
      ...safeObject(data?.highlight),
    },
    events: safeArray(data?.events),
    charts: {
      teamCountByEvent: safeArray(charts.teamCountByEvent),
      teamCountByTrack: safeArray(charts.teamCountByTrack),
      submissionCountByEvent: safeArray(charts.submissionCountByEvent),
    },
  };
}

function getStatusTone(status) {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "active") return "orange";
  if (normalized === "registration") return "info";
  if (normalized === "upcoming") return "info";
  if (normalized === "scoring") return "warning";
  if (normalized === "closed" || normalized === "completed") return "success";
  if (normalized === "rejected" || normalized === "cancelled" || normalized === "inactive") {
    return "danger";
  }
  return "neutral";
}

function formatDate(value) {
  if (!value) return "Chưa xác định";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("vi-VN");
}

function formatNumber(value) {
  const numeric = Number(value || 0);
  return Number.isFinite(numeric) ? numeric.toLocaleString("vi-VN") : "0";
}

function getMaxValue(items, key) {
  return Math.max(1, ...items.map((item) => Number(item?.[key] || 0)));
}

function StatusSummary({ title, items }) {
  const entries = Object.entries(items || {});

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-700">
        {title}
      </p>
      {entries.length === 0 ? (
        <p className="mt-3 text-sm text-slate-700">Chưa có dữ liệu.</p>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {entries.map(([status, count]) => (
            <CoordinatorBadge key={status} tone={getStatusTone(status)}>
              {status}: {formatNumber(count)}
            </CoordinatorBadge>
          ))}
        </div>
      )}
    </div>
  );
}

function BarList({ title, subtitle, items, valueKey, labelKey, emptyText }) {
  const maxValue = getMaxValue(items, valueKey);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-700">
          {title}
        </h3>
        {subtitle && <p className="mt-1 text-sm text-slate-700">{subtitle}</p>}
      </div>

      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-5 text-center text-sm text-slate-700">
          {emptyText || "Chưa có dữ liệu để hiển thị."}
        </p>
      ) : (
        <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
          {items.map((item, index) => {
            const value = Number(item?.[valueKey] || 0);
            const width = Math.max(4, Math.round((value / maxValue) * 100));
            const label = item?.[labelKey] || `Mục ${index + 1}`;

            return (
              <div key={`${label}-${index}`}>
                <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                  <span className="line-clamp-1 font-semibold text-slate-900">
                    {label}
                  </span>
                  <span className="font-mono font-semibold text-slate-950">
                    {formatNumber(value)}
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[#F26F21]"
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EventTable({ events, statusFilter, search, onStatusFilter, onSearch }) {
  const [showAll, setShowAll] = useState(false);
  const statusOptions = useMemo(() => {
    const values = new Set(events.map((event) => event.status).filter(Boolean));
    return Array.from(values);
  }, [events]);

  const filteredEvents = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return events.filter((event) => {
      const matchStatus = !statusFilter || event.status === statusFilter;
      const matchSearch =
        !keyword || String(event.eventName || "").toLowerCase().includes(keyword);
      return matchStatus && matchSearch;
    });
  }, [events, search, statusFilter]);

  const visibleEvents = showAll ? filteredEvents : filteredEvents.slice(0, 8);

  useEffect(() => {
    setShowAll(false);
  }, [search, statusFilter]);

  return (
    <CoordinatorPanel
      title="Sự kiện trong hệ thống"
      subtitle="Theo dõi nhanh tình trạng đội, bài nộp và vòng thi của từng sự kiện"
      icon={icons.CalendarDays}
    >
      <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_220px]">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-700">
            Tìm sự kiện
          </span>
          <input
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Nhập tên sự kiện..."
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-700">
            Trạng thái
          </span>
          <select
            value={statusFilter}
            onChange={(event) => onStatusFilter(event.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          >
            <option value="">Tất cả trạng thái</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
      </div>

      {filteredEvents.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
          <p className="font-semibold text-slate-950">Không có sự kiện phù hợp</p>
          <p className="mt-1 text-sm text-slate-700">
            Hãy đổi bộ lọc hoặc làm mới dashboard để kiểm tra dữ liệu mới nhất.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-[980px] w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-widest text-slate-500">
                  <th className="px-3 py-3 font-semibold">Sự kiện</th>
                  <th className="px-3 py-3 font-semibold">Cấu trúc</th>
                  <th className="px-3 py-3 font-semibold">Đội thi</th>
                  <th className="px-3 py-3 font-semibold">Bài nộp</th>
                  <th className="px-3 py-3 font-semibold">Vòng thi</th>
                  <th className="px-3 py-3 font-semibold">Kết quả</th>
                </tr>
              </thead>
              <tbody>
                {visibleEvents.map((event) => (
                  <tr
                    key={event.eventId}
                    className="border-b border-slate-100 align-top transition hover:bg-slate-50"
                  >
                    <td className="px-3 py-4">
                      <div className="max-w-[280px]">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-950">
                            {event.eventName || "Sự kiện chưa đặt tên"}
                          </p>
                          <CoordinatorBadge tone={getStatusTone(event.status)}>
                            {event.status || "Unknown"}
                          </CoordinatorBadge>
                        </div>
                        <p className="mt-1 text-xs text-slate-700">
                          {formatDate(event.startDate)} - {formatDate(event.endDate)}
                        </p>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-sm text-slate-800">
                      <p>{formatNumber(event.totalTracks)} track</p>
                      <p className="mt-1">{formatNumber(event.totalRounds)} round</p>
                    </td>
                    <td className="px-3 py-4 text-sm text-slate-800">
                      <p className="font-semibold text-slate-950">
                        {formatNumber(event.totalTeams)} đội
                      </p>
                      <p className="mt-1 text-xs text-slate-700">
                        Duyệt {formatNumber(event.approvedTeams)} · Chờ{" "}
                        {formatNumber(event.pendingTeams)}
                      </p>
                      {(Number(event.rejectedTeams || 0) > 0 ||
                        Number(event.disqualifiedTeams || 0) > 0) && (
                        <p className="mt-1 text-xs text-red-700">
                          Từ chối {formatNumber(event.rejectedTeams)} · Loại{" "}
                          {formatNumber(event.disqualifiedTeams)}
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-4 text-sm text-slate-800">
                      <p className="font-semibold text-slate-950">
                        {formatNumber(event.totalSubmissions)}
                      </p>
                      <p
                        className={`mt-1 text-xs ${
                          Number(event.incompleteSubmissions || 0) > 0
                            ? "text-red-700"
                            : "text-slate-700"
                        }`}
                      >
                        Thiếu điểm: {formatNumber(event.incompleteSubmissions)}
                      </p>
                    </td>
                    <td className="px-3 py-4 text-sm text-slate-800">
                      <p>Active: {formatNumber(event.activeRounds)}</p>
                      <p className="mt-1">Scoring: {formatNumber(event.scoringRounds)}</p>
                      <p className="mt-1">Closed: {formatNumber(event.closedRounds)}</p>
                    </td>
                    <td className="px-3 py-4">
                      <CoordinatorBadge
                        tone={event.resultsAvailable ? "success" : "neutral"}
                      >
                        {event.resultsAvailable ? "Đã có kết quả" : "Chưa công bố"}
                      </CoordinatorBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredEvents.length > 8 && (
            <div className="mt-4 flex justify-center">
              <CoordinatorActionButton
                variant="secondary"
                onClick={() => setShowAll((current) => !current)}
              >
                {showAll
                  ? "Thu gọn danh sách"
                  : `Xem tất cả ${filteredEvents.length} sự kiện`}
              </CoordinatorActionButton>
            </div>
          )}
        </>
      )}
    </CoordinatorPanel>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="h-36 animate-pulse rounded-lg border border-slate-200 bg-white p-5"
          >
            <div className="h-4 w-28 rounded bg-slate-100" />
            <div className="mt-5 h-9 w-20 rounded bg-slate-100" />
            <div className="mt-6 h-3 w-40 rounded bg-slate-100" />
          </div>
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-lg border border-slate-200 bg-white" />
    </div>
  );
}

export function DashboardOverview() {
  const { activeEventId } = useSelector((s) => s.event);
  const [dashboard, setDashboard] = useState(EMPTY_DASHBOARD);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [eventSearch, setEventSearch] = useState("");
  const [eventStatusFilter, setEventStatusFilter] = useState("");

  const [variances, setVariances] = useState([]);
  const [loadingVariance, setLoadingVariance] = useState(false);
  const [varianceError, setVarianceError] = useState("");

  const fetchVariance = async () => {
    if (!activeEventId) return;
    setLoadingVariance(true);
    setVarianceError("");
    try {
      const res = await dashboardService.getRblCriteriaVariance(activeEventId);
      setVariances(res.data?.data || []);
    } catch {
      setVarianceError("Không thể tải dữ liệu phương sai tiêu chí.");
    } finally {
      setLoadingVariance(false);
    }
  };

  const fetchDashboard = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await dashboardService.getCoordinatorDashboard();
      setDashboard(normalizeDashboardData(res.data?.data));
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Không thể tải dữ liệu dashboard coordinator.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  useEffect(() => {
    if (activeEventId) fetchVariance();
  }, [activeEventId]);

  const { summary, highlight, events, charts } = dashboard;
  const activeEvents = Number(summary.eventsByStatus?.Active || 0);
  const scoringRounds = Number(summary.roundsByStatus?.Scoring || 0);
  const pendingTeams = Number(summary.teamsByStatus?.Pending || 0);
  const approvedTeams = Number(summary.teamsByStatus?.Approved || 0);
  const eventWithMostTeams = highlight.eventWithMostTeams;

  const stats = [
    {
      id: "events",
      label: "Tổng sự kiện",
      value: summary.totalEvents,
      tone: activeEvents > 0 ? "orange" : "blue",
      helper: `${formatNumber(activeEvents)} sự kiện đang Active`,
      icon: icons.CalendarDays,
    },
    {
      id: "teams",
      label: "Tổng đội thi",
      value: summary.totalTeams,
      tone: pendingTeams > 0 ? "amber" : "green",
      helper: `Duyệt ${formatNumber(approvedTeams)} · Chờ ${formatNumber(pendingTeams)}`,
      icon: icons.Users,
    },
    {
      id: "submissions",
      label: "Tổng bài nộp",
      value: summary.totalSubmissions,
      tone: summary.incompleteSubmissions > 0 ? "red" : "green",
      helper:
        summary.incompleteSubmissions > 0
          ? `Thiếu điểm: ${formatNumber(summary.incompleteSubmissions)}`
          : "Dữ liệu chấm điểm đã ổn",
      icon: icons.Upload,
    },
    {
      id: "staff",
      label: "Nhân sự đã phân công",
      value: summary.totalMentors + summary.totalJudges,
      tone: "blue",
      helper: `Mentor ${formatNumber(summary.totalMentors)} · Judge ${formatNumber(summary.totalJudges)}`,
      icon: icons.Handshake,
    },
  ];

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <CoordinatorPanel
        title="Không tải được dashboard"
        subtitle="Dữ liệu vận hành hiện chưa sẵn sàng"
        icon={icons.Activity}
        actions={
          <CoordinatorActionButton
            variant="primary"
            icon={icons.Activity}
            onClick={fetchDashboard}
          >
            Tải lại
          </CoordinatorActionButton>
        }
      >
        <div className="rounded-md border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      </CoordinatorPanel>
    );
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="grid gap-0 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="border-b border-slate-100 p-5 sm:p-6 xl:border-b-0 xl:border-r">
            <div className="flex flex-wrap items-center gap-2">
              <CoordinatorBadge tone={activeEvents > 0 ? "orange" : "info"}>
                {activeEvents > 0
                  ? `${formatNumber(activeEvents)} event đang Active`
                  : "Chưa có event Active"}
              </CoordinatorBadge>
              <CoordinatorBadge tone={scoringRounds > 0 ? "warning" : "neutral"}>
                {formatNumber(scoringRounds)} round đang Scoring
              </CoordinatorBadge>
            </div>

            <h2
              className="mt-4 max-w-3xl text-2xl font-black tracking-tight text-slate-950 sm:text-3xl"
              style={{ fontFamily: "'Montserrat', 'Inter', sans-serif" }}
            >
              Bảng điều phối vận hành hackathon
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700">
              Theo dõi toàn bộ sự kiện, số đội, bài nộp, trạng thái vòng thi và
              khối lượng chấm điểm từ dữ liệu vận hành hiện tại.
            </p>
          </div>

          <div className="bg-slate-50 p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-700">
              Điểm cần chú ý
            </p>
            {eventWithMostTeams ? (
              <div className="mt-4 rounded-lg border border-orange-200 bg-white p-4">
                <p className="text-sm text-slate-700">Sự kiện có nhiều đội nhất</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-950">
                  {eventWithMostTeams.eventName}
                </h3>
                <p className="mt-3 font-mono text-3xl font-bold text-slate-950">
                  {formatNumber(eventWithMostTeams.totalTeams)}
                </p>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  đội thi
                </p>
              </div>
            ) : (
              <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">
                Chưa có dữ liệu nổi bật.
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <CoordinatorStatCard key={stat.id} {...stat} icon={stat.icon} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <StatusSummary title="Trạng thái sự kiện" items={summary.eventsByStatus} />
        <StatusSummary title="Trạng thái round" items={summary.roundsByStatus} />
        <StatusSummary title="Trạng thái đội" items={summary.teamsByStatus} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <BarList
          title="Đội theo sự kiện"
          subtitle="Sự kiện nào đang thu hút nhiều đội nhất"
          items={charts.teamCountByEvent}
          valueKey="totalTeams"
          labelKey="eventName"
        />
        <BarList
          title="Đội theo track"
          subtitle="Theo dõi sức chứa và độ đông của từng track"
          items={charts.teamCountByTrack}
          valueKey="totalTeams"
          labelKey="trackName"
        />
        <BarList
          title="Bài nộp theo sự kiện"
          subtitle="Khối lượng submission đang cần theo dõi"
          items={charts.submissionCountByEvent}
          valueKey="totalSubmissions"
          labelKey="eventName"
        />
      </div>

      <EventTable
        events={events}
        search={eventSearch}
        statusFilter={eventStatusFilter}
        onSearch={setEventSearch}
        onStatusFilter={setEventStatusFilter}
      />

      <CoordinatorPanel
        title="Phân tích RBL"
        subtitle="Độ lệch trung bình giữa các giám khảo khi chấm cùng bài nộp theo từng tiêu chí"
        icon={icons.Scale}
        actions={
          <CoordinatorActionButton
            variant="secondary"
            icon={icons.Activity}
            onClick={fetchVariance}
            disabled={loadingVariance || !activeEventId}
          >
            Làm mới phân tích
          </CoordinatorActionButton>
        }
      >
        {loadingVariance ? (
          <div className="animate-pulse py-6 text-center text-sm text-slate-700">
            Đang tính toán phương sai...
          </div>
        ) : varianceError ? (
          <div className="rounded-md border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {varianceError}
          </div>
        ) : variances.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
            <p className="font-semibold text-slate-950">Chưa có dữ liệu phân tích</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-slate-700">
              Cần ít nhất 2 giám khảo chấm cùng một bài nộp theo cùng một tiêu chí.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="max-h-[420px] overflow-y-auto rounded-lg border border-slate-200 bg-white">
              {variances.map((item) => {
                const variance = Number(item.variance || 0);
                const percent = Math.min((variance / 2) * 100, 100);
                let barColor = "#10B981";
                let statusLabel = "Đồng thuận cao";
                let badgeTone = "success";

                if (variance > 1) {
                  barColor = "#EF4444";
                  statusLabel = "Cần hiệu chuẩn";
                  badgeTone = "danger";
                } else if (variance > 0.5) {
                  barColor = "#F59E0B";
                  statusLabel = "Đồng thuận trung bình";
                  badgeTone = "warning";
                } else if (Number(item.submissionsCount || 0) === 0) {
                  barColor = "#94A3B8";
                  statusLabel = "Chưa đủ dữ liệu";
                  badgeTone = "neutral";
                }

                return (
                  <div
                    key={item.criterionId}
                    className="grid gap-3 border-b border-slate-100 px-4 py-3 transition last:border-b-0 hover:bg-slate-50 md:grid-cols-[minmax(0,1.5fr)_minmax(220px,0.8fr)] md:items-center"
                  >
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                          {item.trackName} / {item.roundName}
                        </span>
                        <h4 className="line-clamp-1 font-semibold text-slate-950">
                          {item.criterionName}
                        </h4>
                      </div>
                      <CoordinatorBadge tone={badgeTone}>{statusLabel}</CoordinatorBadge>
                    </div>

                    <div>
                      <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                        <span className="text-slate-700">
                          Phương sai:{" "}
                          <strong className="text-slate-950">
                            {variance.toFixed(3)}
                          </strong>
                        </span>
                        <span className="text-slate-700">
                          {formatNumber(item.submissionsCount)} bài nộp
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Number(item.submissionsCount || 0) === 0 ? 0 : percent}%`,
                            backgroundColor: barColor,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-xs leading-5 text-slate-700">
              Phương sai càng gần 0 thì điểm chấm càng đồng nhất; trên 1.0 nên
              hiệu chuẩn lại cách chấm giữa các giám khảo.
            </p>
          </div>
        )}
      </CoordinatorPanel>
    </div>
  );
}
