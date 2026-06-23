import { useEffect, useMemo, useState } from "react";
import dashboardService from "../../../services/dashboardService";
import teamService from "../../../services/teamService";
import {
  CoordinatorActionButton,
  CoordinatorBadge,
  CoordinatorPanel,
  CoordinatorStatCard,
  icons,
} from "../CoordinatorUI";

const EMPTY_DASHBOARD = {
  totalActiveTeams: 0,
  totalPendingTeams: 0,
  incompleteSubmissions: 0,
  activeRoundStatuses: [],
};

function normalizeDashboardData(data) {
  return {
    ...EMPTY_DASHBOARD,
    ...(data || {}),
    activeRoundStatuses: Array.isArray(data?.activeRoundStatuses)
      ? data.activeRoundStatuses
      : [],
  };
}

function getFilteredTeamCount(response, fallback) {
  const totalRecords = Number(response?.data?.data?.totalRecords);
  return Number.isFinite(totalRecords) ? totalRecords : fallback;
}

function getStatusTone(status) {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "active") return "orange";
  if (normalized === "upcoming") return "info";
  if (normalized === "closed" || normalized === "completed") return "success";
  if (normalized === "cancelled" || normalized === "inactive") return "danger";
  return "neutral";
}

function groupRoundsByEvent(rounds) {
  return rounds.reduce((events, round, index) => {
    const eventName = round.eventName || "Sự kiện chưa đặt tên";
    const trackName = round.trackName || "Track chưa đặt tên";
    const event = events.get(eventName) || {
      name: eventName,
      tracks: new Map(),
      totalRounds: 0,
    };
    const track = event.tracks.get(trackName) || {
      name: trackName,
      rounds: [],
    };

    track.rounds.push({
      id: `${eventName}-${trackName}-${round.roundName || index}`,
      roundName: round.roundName || "Vòng chưa đặt tên",
      status: round.status || "Unknown",
    });
    event.totalRounds += 1;
    event.tracks.set(trackName, track);
    events.set(eventName, event);
    return events;
  }, new Map());
}

function getStatusCounts(rounds) {
  return rounds.reduce((counts, round) => {
    const status = round.status || "Unknown";
    counts[status] = (counts[status] || 0) + 1;
    return counts;
  }, {});
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="h-36 animate-pulse rounded-2xl border border-slate-200 bg-white p-5"
          >
            <div className="h-4 w-28 rounded bg-slate-100" />
            <div className="mt-5 h-9 w-20 rounded bg-slate-100" />
            <div className="mt-6 h-3 w-40 rounded bg-slate-100" />
          </div>
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-2xl border border-slate-200 bg-white" />
    </div>
  );
}

function EmptyRoundState() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm">
        <icons.CalendarDays className="h-5 w-5" />
      </div>
      <p className="font-bold text-slate-900">Chưa có vòng thi đang hiển thị</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
        Khi backend trả về round theo event và track, bảng điều phối sẽ tự nhóm
        dữ liệu tại đây.
      </p>
    </div>
  );
}

export function DashboardOverview() {
  const [dashboard, setDashboard] = useState(EMPTY_DASHBOARD);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const rounds = dashboard.activeRoundStatuses;
  const groupedEvents = useMemo(() => groupRoundsByEvent(rounds), [rounds]);
  const statusCounts = useMemo(() => getStatusCounts(rounds), [rounds]);
  const activeRoundCount = statusCounts.Active || statusCounts.active || 0;
  const eventCount = groupedEvents.size;
  const trackCount = useMemo(() => {
    let total = 0;
    groupedEvents.forEach((event) => {
      total += event.tracks.size;
    });
    return total;
  }, [groupedEvents]);

  const fetchDashboard = async () => {
    setLoading(true);
    setError("");
    try {
      const [dashboardResult, approvedResult, pendingResult] =
        await Promise.allSettled([
          dashboardService.getCoordinatorDashboard(),
          teamService.getAdminTeams({
            pageNumber: 1,
            pageSize: 1,
            status: "Approved",
          }),
          teamService.getAdminTeams({
            pageNumber: 1,
            pageSize: 1,
            status: "Pending",
          }),
        ]);
      if (dashboardResult.status === "rejected") throw dashboardResult.reason;

      const normalized = normalizeDashboardData(
        dashboardResult.value.data?.data,
      );
      setDashboard({
        ...normalized,
        totalActiveTeams: getFilteredTeamCount(
          approvedResult.status === "fulfilled" ? approvedResult.value : null,
          normalized.totalActiveTeams,
        ),
        totalPendingTeams: getFilteredTeamCount(
          pendingResult.status === "fulfilled" ? pendingResult.value : null,
          normalized.totalPendingTeams,
        ),
      });
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

  const stats = [
    {
      id: "active-teams",
      label: "Team đã duyệt",
      value: dashboard.totalActiveTeams,
      tone: "green",
      helper: "Có thể tham gia round đang mở",
      icon: icons.UserCheck,
    },
    {
      id: "pending-teams",
      label: "Team chờ duyệt",
      value: dashboard.totalPendingTeams,
      tone: dashboard.totalPendingTeams > 0 ? "amber" : "blue",
      helper:
        dashboard.totalPendingTeams > 0
          ? "Cần coordinator xử lý"
          : "Không có hồ sơ chờ",
      icon: icons.Users,
    },
    {
      id: "incomplete-submissions",
      label: "Bài nộp chưa đủ",
      value: dashboard.incompleteSubmissions,
      tone: dashboard.incompleteSubmissions > 0 ? "red" : "green",
      helper:
        dashboard.incompleteSubmissions > 0
          ? "Cần theo dõi trước hạn nộp"
          : "Tất cả bài nộp đã ổn",
      icon: icons.Upload,
    },
    {
      id: "active-rounds",
      label: "Round đang Active",
      value: activeRoundCount,
      tone: activeRoundCount > 0 ? "orange" : "blue",
      helper: `${eventCount} event, ${trackCount} track đang được theo dõi`,
      icon: icons.Timer,
    },
  ];

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <CoordinatorPanel
        title="Không tải được dashboard"
        subtitle="Dữ liệu điều phối hiện chưa sẵn sàng"
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
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      </CoordinatorPanel>
    );
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="grid gap-0 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="border-b border-slate-100 p-5 sm:p-6 xl:border-b-0 xl:border-r">
            <div className="flex flex-wrap items-center gap-2">
              <CoordinatorBadge tone={activeRoundCount > 0 ? "orange" : "info"}>
                {activeRoundCount > 0
                  ? `${activeRoundCount} round đang Active`
                  : "Chưa có round Active"}
              </CoordinatorBadge>
              <CoordinatorBadge tone="neutral">
                {rounds.length} round trong dashboard
              </CoordinatorBadge>
            </div>
            <h2
              className="mt-4 max-w-3xl text-2xl font-black tracking-tight text-slate-950 sm:text-3xl"
              style={{ fontFamily: "'Montserrat', 'Inter', sans-serif" }}
            >
              Bảng điều phối vận hành hackathon
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Theo dõi team, bài nộp và trạng thái round theo từng event/track
              bằng dữ liệu thật từ backend.
            </p>
          </div>

          <div
            className="p-5 sm:p-6"
            style={{ background: "#FFF7ED", color: "#111827" }}
          >
            <p
              className="text-xs font-bold uppercase tracking-[0.24em]"
              style={{ color: "#D94B0D" }}
            >
              Trạng thái round
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {Object.keys(statusCounts).length === 0 ? (
                <div
                  className="col-span-2 rounded-xl border p-4 text-sm"
                  style={{
                    background: "#FFFFFF",
                    borderColor: "#FED7AA",
                    color: "#475569",
                  }}
                >
                  Chưa có status nào được trả về.
                </div>
              ) : (
                Object.entries(statusCounts).map(([status, count]) => (
                  <div
                    key={status}
                    className="rounded-xl border p-4"
                    style={{
                      background: "#FFFFFF",
                      borderColor: "#FED7AA",
                    }}
                  >
                    <p className="text-2xl font-black text-slate-950">{count}</p>
                    <p
                      className="mt-1 text-xs font-semibold uppercase tracking-wider"
                      style={{ color: "#475569" }}
                    >
                      {status}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <CoordinatorStatCard key={stat.id} {...stat} icon={stat.icon} />
        ))}
      </div>

      <CoordinatorPanel
        title="Round theo event và track"
        subtitle="Dữ liệu lấy từ GET /api/dashboard/coordinator"
        icon={icons.GitBranch}
        actions={
          <CoordinatorActionButton
            variant="secondary"
            icon={icons.Activity}
            onClick={fetchDashboard}
          >
            Làm mới
          </CoordinatorActionButton>
        }
      >
        {rounds.length === 0 ? (
          <EmptyRoundState />
        ) : (
          <div className="max-h-[640px] space-y-4 overflow-y-auto pr-1">
            {Array.from(groupedEvents.values()).map((event) => (
              <div
                key={event.name}
                className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
              >
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Event
                    </p>
                    <h3 className="text-lg font-black text-slate-950">
                      {event.name}
                    </h3>
                  </div>
                  <CoordinatorBadge tone="neutral">
                    {event.totalRounds} round • {event.tracks.size} track
                  </CoordinatorBadge>
                </div>

                <div className="grid gap-3 xl:grid-cols-2">
                  {Array.from(event.tracks.values()).map((track) => (
                    <div
                      key={`${event.name}-${track.name}`}
                      className="rounded-xl border border-slate-200 bg-white p-4"
                    >
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-bold uppercase tracking-wider text-orange-600">
                            Track
                          </p>
                          <h4 className="truncate font-bold text-slate-900">
                            {track.name}
                          </h4>
                        </div>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                          {track.rounds.length} vòng
                        </span>
                      </div>

                      <div className="space-y-2">
                        {track.rounds.map((round) => (
                          <div
                            key={round.id}
                            className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2.5"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-slate-800">
                                {round.roundName}
                              </p>
                              <p className="mt-0.5 text-xs text-slate-400">
                                {event.name} / {track.name}
                              </p>
                            </div>
                            <CoordinatorBadge tone={getStatusTone(round.status)}>
                              {round.status}
                            </CoordinatorBadge>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CoordinatorPanel>
    </div>
  );
}
