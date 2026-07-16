import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Sector,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import dashboardService from "../../../services/dashboardService";
import {
  CoordinatorActionButton,
  CoordinatorBadge,
  CoordinatorPanel,
  CoordinatorStatCard,
  icons,
} from "../CoordinatorUI";

/* ─────────────────────────────────────────────
   Constants
───────────────────────────────────────────── */
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
  highlight: { eventWithMostTeams: null },
  events: [],
  charts: {
    teamCountByEvent: [],
    teamCountByTrack: [],
    submissionCountByEvent: [],
  },
};

const CHART_COLORS = [
  "#F26F21",
  "#2563EB",
  "#059669",
  "#D97706",
  "#DC2626",
  "#7C3AED",
  "#0891B2",
  "#64748B",
];

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
function safeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
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
  const s = String(status || "").toLowerCase();
  if (s === "active") return "orange";
  if (s === "registration" || s === "upcoming") return "info";
  if (s === "scoring") return "warning";
  if (s === "closed" || s === "completed") return "success";
  if (s === "rejected" || s === "cancelled" || s === "inactive")
    return "danger";
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

function truncateLabel(value, maxLength = 22) {
  const text = String(value || "");
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

function getStatusChartData(items) {
  return Object.entries(items || {})
    .map(([name, value]) => ({ name, value: Number(value || 0) }))
    .filter((item) => item.value > 0);
}

function getSortedChartItems(items, valueKey, limit = 8) {
  return [...items]
    .sort((a, b) => Number(b?.[valueKey] || 0) - Number(a?.[valueKey] || 0))
    .slice(0, limit);
}

/* ─────────────────────────────────────────────
   Animated count-up hook
───────────────────────────────────────────── */
function useCountUp(target, duration = 900) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const end = Number(target) || 0;
    if (end === 0) { setDisplay(0); return; }
    const start = 0;
    const startTime = performance.now();
    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (end - start) * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return display;
}

/* ─────────────────────────────────────────────
   Animated StatCard wrapper
───────────────────────────────────────────── */
function AnimatedStatCard({ value, ...rest }) {
  const animatedValue = useCountUp(value);
  return <CoordinatorStatCard {...rest} value={formatNumber(animatedValue)} />;
}

/* ─────────────────────────────────────────────
   Shared Tooltip
───────────────────────────────────────────── */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-md">
      <p className="max-w-56 text-sm font-semibold text-slate-900">
        {label || item.payload?.name}
      </p>
      <p className="mt-1 text-xs text-slate-600">
        {item.name}:{" "}
        <span className="font-mono font-bold text-slate-900">
          {formatNumber(item.value)}
        </span>
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Chart Card wrapper
───────────────────────────────────────────── */
function ChartCard({ title, subtitle, children, action }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            {title}
          </h3>
          {subtitle && (
            <p className="mt-0.5 text-sm text-slate-700">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function EmptyChart({ text }) {
  return (
    <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
      {text || "Chưa có dữ liệu để hiển thị."}
    </p>
  );
}

/* ─────────────────────────────────────────────
   Donut Chart with center label & active shape
───────────────────────────────────────────── */
function renderActiveShape(props) {
  const {
    cx, cy, innerRadius, outerRadius, startAngle, endAngle,
    fill, payload, value,
  } = props;

  return (
    <g>
      <text
        x={cx}
        y={cy - 8}
        textAnchor="middle"
        fill="#111827"
        className="text-base"
        style={{ fontSize: 18, fontWeight: 700, fontFamily: "monospace" }}
      >
        {value}
      </text>
      <text
        x={cx}
        y={cy + 14}
        textAnchor="middle"
        fill="#6B7280"
        style={{ fontSize: 11 }}
      >
        {truncateLabel(payload.name, 12)}
      </text>
      <Sector
        cx={cx} cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx} cy={cy}
        innerRadius={outerRadius + 10}
        outerRadius={outerRadius + 13}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  );
}

function StatusDonutChart({ title, subtitle, items }) {
  const data = getStatusChartData(items);
  const [activeIndex, setActiveIndex] = useState(0);
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <ChartCard title={title} subtitle={subtitle}>
      {data.length === 0 ? (
        <EmptyChart text="Chưa có dữ liệu trạng thái." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-[160px_1fr] sm:items-center">
          {/* Donut */}
          <div className="h-44 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  activeIndex={activeIndex}
                  activeShape={renderActiveShape}
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={46}
                  outerRadius={68}
                  paddingAngle={3}
                  stroke="none"
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                >
                  {data.map((_, index) => (
                    <Cell
                      key={`slice-${index}`}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center total (idle state) */}
            {activeIndex === null && (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-mono text-xl font-bold text-slate-900">
                  {total}
                </span>
                <span className="text-xs text-slate-500">Tổng</span>
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="space-y-1.5">
            {data.map((item, index) => {
              const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
              return (
                <div
                  key={item.name}
                  className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-1.5 text-sm transition ${
                    activeIndex === index
                      ? "bg-slate-100 font-semibold"
                      : "hover:bg-slate-50"
                  }`}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  <span className="flex min-w-0 items-center gap-2 text-slate-700">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{
                        backgroundColor:
                          CHART_COLORS[index % CHART_COLORS.length],
                      }}
                    />
                    <span className="truncate">{item.name}</span>
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-slate-400">{pct}%</span>
                    <span className="font-mono font-semibold text-slate-900">
                      {formatNumber(item.value)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </ChartCard>
  );
}

/* ─────────────────────────────────────────────
   Horizontal Bar Chart with LabelList
───────────────────────────────────────────── */
function DashboardBarChart({ items, valueKey, labelKey, emptyText }) {
  const data = getSortedChartItems(items, valueKey);
  const [activeBar, setActiveBar] = useState(null);

  if (data.length === 0) return <EmptyChart text={emptyText} />;

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 48, left: 8, bottom: 4 }}
        >
          <CartesianGrid stroke="#F1F5F9" horizontal={false} />
          <XAxis
            type="number"
            allowDecimals={false}
            tick={{ fill: "#94A3B8", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey={labelKey}
            width={128}
            tickFormatter={(v) => truncateLabel(v)}
            tick={{ fill: "#374151", fontSize: 12, fontWeight: 600 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "#F8FAFC" }} />
          <Bar
            dataKey={valueKey}
            name="Số lượng"
            radius={[0, 6, 6, 0]}
            onMouseEnter={(_, index) => setActiveBar(index)}
            onMouseLeave={() => setActiveBar(null)}
          >
            <LabelList
              dataKey={valueKey}
              position="right"
              style={{ fill: "#475569", fontSize: 11, fontWeight: 600 }}
              formatter={(v) => formatNumber(v)}
            />
            {data.map((_, index) => (
              <Cell
                key={`bar-${index}`}
                fill={CHART_COLORS[index % CHART_COLORS.length]}
                opacity={activeBar === null || activeBar === index ? 1 : 0.45}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function BarList({ title, subtitle, items, valueKey, labelKey, emptyText, action }) {
  return (
    <ChartCard title={title} subtitle={subtitle} action={action}>
      <DashboardBarChart
        items={items}
        valueKey={valueKey}
        labelKey={labelKey}
        emptyText={emptyText}
      />
    </ChartCard>
  );
}

/* ─────────────────────────────────────────────
   Event filter for track chart
───────────────────────────────────────────── */
function ChartEventSelect({ value, events, onChange }) {
  if (events.length === 0) return null;
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
    >
      <option value="">Tất cả event</option>
      {events.map((ev) => (
        <option key={ev.eventId} value={String(ev.eventId)}>
          {ev.eventName || `Event #${ev.eventId}`}
        </option>
      ))}
    </select>
  );
}

/* ─────────────────────────────────────────────
   RBL Variance — collapsible + round filter
───────────────────────────────────────────── */
function RblVariancePanel({
  activeEventId,
  variances,
  loading,
  error,
  onRefresh,
}) {
  const [open, setOpen] = useState(true);
  const [roundFilter, setRoundFilter] = useState("");

  const roundOptions = useMemo(() => {
    const seen = new Set();
    const opts = [];
    for (const item of variances) {
      if (item.roundName && !seen.has(item.roundName)) {
        seen.add(item.roundName);
        opts.push(item.roundName);
      }
    }
    return opts.sort();
  }, [variances]);

  const filtered = useMemo(() => {
    if (!roundFilter) return variances;
    return variances.filter((v) => v.roundName === roundFilter);
  }, [variances, roundFilter]);

  return (
    <CoordinatorPanel
      title="Phân tích RBL"
      subtitle="Độ lệch trung bình giữa các giám khảo khi chấm cùng bài nộp theo từng tiêu chí"
      icon={icons.Scale}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <CoordinatorActionButton
            variant="secondary"
            icon={icons.Activity}
            onClick={onRefresh}
            disabled={loading || !activeEventId}
          >
            Làm mới
          </CoordinatorActionButton>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            title={open ? "Thu gọn" : "Mở rộng"}
          >
            {open ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Thu gọn
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Mở rộng
              </>
            )}
          </button>
        </div>
      }
    >
      {/* Collapsed state */}
      {!open && (
        <p className="text-sm text-slate-500 italic">
          Phần phân tích đã được thu gọn. Nhấn &ldquo;Mở rộng&rdquo; để xem.
        </p>
      )}

      {open && (
        <>
          {loading && (
            <div className="animate-pulse py-6 text-center text-sm text-slate-500">
              Đang tính toán phương sai...
            </div>
          )}

          {!loading && error && (
            <div className="rounded-md border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          {!loading && !error && variances.length === 0 && (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
              <p className="font-semibold text-slate-800">Chưa có dữ liệu phân tích</p>
              <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
                Cần ít nhất 2 giám khảo chấm cùng một bài nộp theo cùng một
                tiêu chí.
              </p>
            </div>
          )}

          {!loading && !error && variances.length > 0 && (
            <div className="space-y-4">
              {/* Round filter */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Lọc theo vòng:
                </span>
                <button
                  type="button"
                  onClick={() => setRoundFilter("")}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                    roundFilter === ""
                      ? "border-orange-400 bg-orange-50 text-orange-700"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Tất cả
                </button>
                {roundOptions.map((rn) => (
                  <button
                    key={rn}
                    type="button"
                    onClick={() =>
                      setRoundFilter((prev) => (prev === rn ? "" : rn))
                    }
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                      roundFilter === rn
                        ? "border-orange-400 bg-orange-50 text-orange-700"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {rn}
                    {roundFilter === rn && (
                      <X className="h-3 w-3" />
                    )}
                  </button>
                ))}
              </div>

              {filtered.length === 0 ? (
                <EmptyChart text="Không có tiêu chí nào trong vòng này." />
              ) : (
                <div className="max-h-[440px] overflow-y-auto rounded-xl border border-slate-200 bg-white">
                  {filtered.map((item) => {
                    const variance = Number(item.variance || 0);
                    const pct = Math.min((variance / 2) * 100, 100);
                    let barColor = "#10B981";
                    let statusLabel = "Đồng thuận cao";
                    let badgeTone = "success";

                    if (Number(item.submissionsCount || 0) === 0) {
                      barColor = "#94A3B8";
                      statusLabel = "Chưa đủ dữ liệu";
                      badgeTone = "neutral";
                    } else if (variance > 1) {
                      barColor = "#EF4444";
                      statusLabel = "Cần hiệu chuẩn";
                      badgeTone = "danger";
                    } else if (variance > 0.5) {
                      barColor = "#F59E0B";
                      statusLabel = "Đồng thuận trung bình";
                      badgeTone = "warning";
                    }

                    return (
                      <div
                        key={item.criterionId}
                        className="grid gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0 hover:bg-slate-50 md:grid-cols-[minmax(0,1.5fr)_minmax(220px,0.8fr)] md:items-center transition"
                      >
                        {/* Left: name + badge */}
                        <div className="flex min-w-0 items-start justify-between gap-3">
                          <div className="min-w-0">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                              {item.trackName} / {item.roundName}
                            </span>
                            <h4 className="line-clamp-1 font-semibold text-slate-900">
                              {item.criterionName}
                            </h4>
                          </div>
                          <CoordinatorBadge tone={badgeTone}>
                            {statusLabel}
                          </CoordinatorBadge>
                        </div>

                        {/* Right: variance bar */}
                        <div>
                          <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
                            <span className="text-slate-500">
                              Phương sai:{" "}
                              <strong className="font-mono text-slate-800">
                                {variance.toFixed(3)}
                              </strong>
                            </span>
                            <span className="text-slate-400">
                              {formatNumber(item.submissionsCount)} bài
                            </span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{
                                width: `${
                                  Number(item.submissionsCount || 0) === 0
                                    ? 0
                                    : pct
                                }%`,
                                backgroundColor: barColor,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <p className="text-xs leading-5 text-slate-400">
                Phương sai càng gần 0 thì điểm chấm càng đồng nhất; trên 1.0
                nên hiệu chuẩn lại cách chấm giữa các giám khảo.
              </p>
            </div>
          )}
        </>
      )}
    </CoordinatorPanel>
  );
}

/* ─────────────────────────────────────────────
   Event Table
───────────────────────────────────────────── */
function EventTable({ events, statusFilter, search, onStatusFilter, onSearch }) {
  const [showAll, setShowAll] = useState(false);

  const statusOptions = useMemo(() => {
    const values = new Set(events.map((ev) => ev.status).filter(Boolean));
    return Array.from(values);
  }, [events]);

  const filteredEvents = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return events.filter((ev) => {
      const matchStatus = !statusFilter || ev.status === statusFilter;
      const matchSearch =
        !keyword || String(ev.eventName || "").toLowerCase().includes(keyword);
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
          <span className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-500">
            Tìm sự kiện
          </span>
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Nhập tên sự kiện..."
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-500">
            Trạng thái
          </span>
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilter(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
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
          <p className="font-semibold text-slate-800">Không có sự kiện phù hợp</p>
          <p className="mt-1 text-sm text-slate-500">
            Hãy đổi bộ lọc hoặc làm mới dashboard.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-[980px] w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-widest text-slate-400">
                  <th className="px-3 py-3 font-semibold">Sự kiện</th>
                  <th className="px-3 py-3 font-semibold">Cấu trúc</th>
                  <th className="px-3 py-3 font-semibold">Đội thi</th>
                  <th className="px-3 py-3 font-semibold">Bài nộp</th>
                  <th className="px-3 py-3 font-semibold">Vòng thi</th>
                  <th className="px-3 py-3 font-semibold">Kết quả</th>
                </tr>
              </thead>
              <tbody>
                {visibleEvents.map((ev) => (
                  <tr
                    key={ev.eventId}
                    className="border-b border-slate-100 align-top transition hover:bg-slate-50"
                  >
                    <td className="px-3 py-4">
                      <div className="max-w-[280px]">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-900">
                            {ev.eventName || "Sự kiện chưa đặt tên"}
                          </p>
                          <CoordinatorBadge tone={getStatusTone(ev.status)}>
                            {ev.status || "Unknown"}
                          </CoordinatorBadge>
                        </div>
                        <p className="mt-1 text-xs text-slate-400">
                          {formatDate(ev.startDate)} – {formatDate(ev.endDate)}
                        </p>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-sm text-slate-700">
                      <p>{formatNumber(ev.totalTracks)} track</p>
                      <p className="mt-1">{formatNumber(ev.totalRounds)} round</p>
                    </td>
                    <td className="px-3 py-4 text-sm text-slate-700">
                      <p className="font-semibold text-slate-900">
                        {formatNumber(ev.totalTeams)} đội
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Duyệt {formatNumber(ev.approvedTeams)} · Chờ{" "}
                        {formatNumber(ev.pendingTeams)}
                      </p>
                      {(Number(ev.rejectedTeams || 0) > 0 ||
                        Number(ev.disqualifiedTeams || 0) > 0) && (
                        <p className="mt-1 text-xs text-red-600">
                          Từ chối {formatNumber(ev.rejectedTeams)} · Loại{" "}
                          {formatNumber(ev.disqualifiedTeams)}
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-4 text-sm text-slate-700">
                      <p className="font-semibold text-slate-900">
                        {formatNumber(ev.totalSubmissions)}
                      </p>
                      <p
                        className={`mt-1 text-xs ${
                          Number(ev.incompleteSubmissions || 0) > 0
                            ? "text-red-600"
                            : "text-slate-400"
                        }`}
                      >
                        Thiếu điểm: {formatNumber(ev.incompleteSubmissions)}
                      </p>
                    </td>
                    <td className="px-3 py-4 text-sm text-slate-700">
                      <p>Active: {formatNumber(ev.activeRounds)}</p>
                      <p className="mt-1">Scoring: {formatNumber(ev.scoringRounds)}</p>
                      <p className="mt-1">Closed: {formatNumber(ev.closedRounds)}</p>
                    </td>
                    <td className="px-3 py-4">
                      <CoordinatorBadge
                        tone={ev.resultsAvailable ? "success" : "neutral"}
                      >
                        {ev.resultsAvailable ? "Đã có kết quả" : "Chưa công bố"}
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
                onClick={() => setShowAll((c) => !c)}
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

/* ─────────────────────────────────────────────
   Skeleton loader
───────────────────────────────────────────── */
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="h-36 animate-pulse rounded-xl border border-slate-200 bg-white p-5"
          >
            <div className="h-4 w-28 rounded bg-slate-100" />
            <div className="mt-5 h-9 w-20 rounded bg-slate-100" />
            <div className="mt-6 h-3 w-40 rounded bg-slate-100" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-64 animate-pulse rounded-xl border border-slate-200 bg-white"
          />
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-xl border border-slate-200 bg-white" />
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main export
───────────────────────────────────────────── */
export function DashboardOverview() {
  const { activeEventId } = useSelector((s) => s.event);

  const [dashboard, setDashboard] = useState(EMPTY_DASHBOARD);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [eventSearch, setEventSearch] = useState("");
  const [eventStatusFilter, setEventStatusFilter] = useState("");
  const [chartEventId, setChartEventId] = useState("");

  const [variances, setVariances] = useState([]);
  const [loadingVariance, setLoadingVariance] = useState(false);
  const [varianceError, setVarianceError] = useState("");

  /* Fetch main dashboard */
  const fetchDashboard = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await dashboardService.getCoordinatorDashboard();
      setDashboard(normalizeDashboardData(res.data?.data));
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Không thể tải dữ liệu dashboard coordinator."
      );
    } finally {
      setLoading(false);
    }
  };

  /* Fetch RBL variance */
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

  const trackChartItems = useMemo(() => {
    if (!chartEventId) return charts.teamCountByTrack;
    return charts.teamCountByTrack.filter(
      (t) => String(t.eventId) === String(chartEventId)
    );
  }, [chartEventId, charts.teamCountByTrack]);

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
      label: "Nhân sự phân công",
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
      {/* ── Hero banner ── */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-0 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="border-b border-slate-100 p-5 sm:p-7 xl:border-b-0 xl:border-r">
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
              className="mt-4 max-w-3xl text-2xl font-black tracking-tight text-slate-900 sm:text-3xl"
              style={{ fontFamily: "'Montserrat','Inter',sans-serif" }}
            >
              Bảng điều phối vận hành hackathon
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Theo dõi toàn bộ sự kiện, số đội, bài nộp, trạng thái vòng thi
              và khối lượng chấm điểm từ dữ liệu vận hành hiện tại.
            </p>
          </div>

          <div className="bg-gradient-to-br from-slate-50 to-orange-50/30 p-5 sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              Điểm nổi bật
            </p>
            {eventWithMostTeams ? (
              <div className="mt-4 rounded-xl border border-orange-200 bg-white p-5 shadow-sm">
                <p className="text-xs text-slate-400">Sự kiện có nhiều đội nhất</p>
                <h3 className="mt-1 text-base font-semibold text-slate-900 line-clamp-2">
                  {eventWithMostTeams.eventName}
                </h3>
                <p className="mt-3 font-mono text-4xl font-black text-orange-500">
                  {formatNumber(eventWithMostTeams.totalTeams)}
                </p>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  đội thi
                </p>
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-400">
                Chưa có dữ liệu nổi bật.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <AnimatedStatCard key={stat.id} {...stat} />
        ))}
      </div>

      {/* ── Donut charts ── */}
      <div className="grid gap-4 lg:grid-cols-3">
        <StatusDonutChart
          title="Trạng thái sự kiện"
          subtitle="Tổng quan vòng đời các event"
          items={summary.eventsByStatus}
        />
        <StatusDonutChart
          title="Trạng thái round"
          subtitle="Round đang mở, scoring hoặc đã đóng"
          items={summary.roundsByStatus}
        />
        <StatusDonutChart
          title="Trạng thái đội"
          subtitle="Hồ sơ đội theo trạng thái duyệt"
          items={summary.teamsByStatus}
        />
      </div>

      {/* ── Bar charts ── */}
      <div className="grid gap-4 xl:grid-cols-3">
        <BarList
          title="Đội theo sự kiện"
          subtitle="Sự kiện nào đang thu hút nhiều đội nhất"
          items={charts.teamCountByEvent}
          valueKey="totalTeams"
          labelKey="eventName"
          emptyText="Chưa có dữ liệu đội theo sự kiện."
        />
        <BarList
          title="Đội theo track"
          subtitle="Theo dõi sức chứa và độ đông của từng track"
          items={trackChartItems}
          valueKey="totalTeams"
          labelKey="trackName"
          emptyText="Chưa có dữ liệu đội theo track."
          action={
            <ChartEventSelect
              value={chartEventId}
              events={events}
              onChange={setChartEventId}
            />
          }
        />
        <BarList
          title="Bài nộp theo sự kiện"
          subtitle="Khối lượng submission đang cần theo dõi"
          items={charts.submissionCountByEvent}
          valueKey="totalSubmissions"
          labelKey="eventName"
          emptyText="Chưa có dữ liệu bài nộp."
        />
      </div>

      {/* ── Event table ── */}
      <EventTable
        events={events}
        search={eventSearch}
        statusFilter={eventStatusFilter}
        onSearch={setEventSearch}
        onStatusFilter={setEventStatusFilter}
      />

      {/* ── RBL Variance ── */}
      <RblVariancePanel
        activeEventId={activeEventId}
        variances={variances}
        loading={loadingVariance}
        error={varianceError}
        onRefresh={fetchVariance}
      />
    </div>
  );
}
