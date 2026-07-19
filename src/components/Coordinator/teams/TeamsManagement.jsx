import { useState, useEffect, useCallback } from "react";
import {
  CoordinatorActionButton,
  CoordinatorBadge,
  CoordinatorPanel,
  CoordinatorTable,
  ModalShell,
  icons,
} from "../CoordinatorUI";
import { Loader2 } from "lucide-react";
import { FormError } from "../coordinatorHelpers";
import teamService from "../../../services/teamService";
import eventService from "../../../services/eventService";
import trackService from "../../../services/trackService";

const STATUS_FILTERS = ["All", "Pending", "Approved", "Rejected", "Disqualified"];

function getTeamMentorLabel(team) {
  return (
    team.mentorName ||
    team.mentorFullName ||
    team.mentorUsername ||
    team.mentor?.fullName ||
    team.mentor?.username ||
    team.mentor?.email ||
    (team.mentorId ? `Mentor #${String(team.mentorId).slice(0, 8)}...` : "N/A")
  );
}

function FilterBar({ status, onStatus, onSearch, search }) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <div className="relative flex-1 min-w-48">
        <icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
        <input
          className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none"
          placeholder="Tìm tên team, trường..."
          value={search}
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>
      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => onStatus(s)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150"
            style={{
              background: status === s ? "#F26F21" : "#F3F4F6",
              color: status === s ? "#fff" : "#374151",
              border: `1px solid ${status === s ? "#F26F21" : "#E5E7EB"}`,
            }}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function Pagination({ page, totalPages, onPage }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <CoordinatorActionButton
        disabled={page === 1}
        onClick={() => onPage(page - 1)}
      >
        ← Prev
      </CoordinatorActionButton>
      <span className="text-sm text-slate-600 px-2">
        Trang {page} / {totalPages}
      </span>
      <CoordinatorActionButton
        disabled={page === totalPages}
        onClick={() => onPage(page + 1)}
      >
        Next →
      </CoordinatorActionButton>
    </div>
  );
}

export function TeamsManagement() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [events, setEvents] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [selectedTrackId, setSelectedTrackId] = useState("");

  // Modals
  const [detailTeam, setDetailTeam] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [disqualifyTeam, setDisqualifyTeam] = useState(null);

  // Action states
  const [actionLoading, setActionLoading] = useState("");
  const [actionError, setActionError] = useState("");
  const [disqualifyReason, setDisqualifyReason] = useState("");

  // ---------------------------------------------------------------------------
  const fetchTeams = useCallback(
    async (p = 1) => {
      setLoading(true);
      setApiError("");
      try {
        if (!selectedEventId) {
          setTeams([]);
          setLoading(false);
          return;
        }
        const res = await teamService.getGroupedTeams({
          eventId: selectedEventId,
          ...(selectedTrackId ? { trackId: selectedTrackId } : {}),
        });
        const data = res.data?.data || {};
        const groups = {
          Pending: data.pending || [],
          Approved: data.approved || [],
          Rejected: data.rejected || [],
          Disqualified: data.disqualified || [],
        };
        setTeams(
          statusFilter === "All"
            ? Object.values(groups).flat()
            : groups[statusFilter] || [],
        );
        setTotalPages(1);
        setPage(1);
      } catch (err) {
        setApiError(
          err?.response?.data?.message || "Không thể tải danh sách team.",
        );
      } finally {
        setLoading(false);
      }
    },
    [statusFilter, selectedEventId, selectedTrackId],
  );

  useEffect(() => {
    eventService.getAll().then((response) => {
      const list = response.data?.data || [];
      setEvents(list);
      setSelectedEventId(list[0]?.id ? String(list[0].id) : "");
    }).catch(() => setEvents([]));
  }, []);

  useEffect(() => {
    setSelectedTrackId("");
    if (!selectedEventId) return setTracks([]);
    trackService.getByEvent(selectedEventId)
      .then((response) => setTracks(response.data?.data || []))
      .catch(() => setTracks([]));
  }, [selectedEventId]);

  useEffect(() => {
    fetchTeams(1);
  }, [fetchTeams]);

  const handlePageChange = (p) => fetchTeams(p);

  const handleStatusFilter = (s) => {
    setStatusFilter(s);
    setPage(1);
  };

  const openTeamDetail = async (team) => {
    setDetailTeam(team);
    setDetailLoading(true);
    setActionError("");
    try {
      const response = await teamService.getById(team.id);
      setDetailTeam(response.data?.data || team);
    } catch (err) {
      setActionError(err?.response?.data?.message || "Không thể tải chi tiết team.");
    } finally {
      setDetailLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  const handleApprove = async (team) => {
    setActionLoading(team.id);
    setActionError("");
    try {
      await teamService.approveTeam(team.id);
      await fetchTeams(1);
    } catch (err) {
      setActionError(err?.response?.data?.message || "Approve thất bại.");
    } finally {
      setActionLoading("");
    }
  };

  const handleDisqualifyConfirm = async () => {
    setActionLoading(disqualifyTeam.id);
    setActionError("");
    try {
      await teamService.disqualifyTeam(
        disqualifyTeam.id,
        disqualifyReason.trim() || undefined,
      );
      await fetchTeams(1);
      setDisqualifyTeam(null);
      setDisqualifyReason("");
    } catch (err) {
      setActionError(err?.response?.data?.message || "Disqualify thất bại.");
    } finally {
      setActionLoading("");
    }
  };

  // ---------------------------------------------------------------------------
  // Client-side search filter (trên data đã fetch)
  const filtered = teams.filter(
    (t) =>
      t.teamName?.toLowerCase().includes(search.toLowerCase()) ||
      t.university?.toLowerCase().includes(search.toLowerCase()),
  );

  const columns = [
    { key: "name", label: "Team" },
    { key: "track", label: "Track" },
    { key: "mentor", label: "Mentor" },
    { key: "status", label: "Status" },
    { key: "actions", label: "Actions" },
  ];

  const renderCell = (row, key) => {
    const isActioning = actionLoading === row.id;

    if (key === "name")
      return (
        <div>
          <p className="font-bold text-slate-900">{row.teamName}</p>
          <p className="text-xs text-slate-700 truncate max-w-48">
            {row.university} • {row.memberCount ?? 0} members
          </p>
        </div>
      );

    if (key === "track")
      return (
        <span className="text-sm text-slate-600">
          {row.trackId ? `Track #${row.trackId}` : "—"}
          {/* TODO: map trackId → trackName khi có GET /api/tracks */}
        </span>
      );

    if (key === "mentor")
      return (
        <span
          className={`text-sm font-semibold ${
            row.mentorId ? "text-slate-700" : "text-slate-600"
          }`}
        >
          {getTeamMentorLabel(row)}
        </span>
      );

    if (key === "status")
      return (
        <CoordinatorBadge
          tone={
            row.status === "Approved"
              ? "success"
              : row.status === "Disqualified"
                ? "danger"
                : "warning"
          }
        >
          {row.status}
        </CoordinatorBadge>
      );

    if (key === "actions")
      return (
        <div className="flex gap-2 flex-wrap">
          <CoordinatorActionButton
            icon={icons.Eye}
            onClick={() => openTeamDetail(row)}
          >
            Details
          </CoordinatorActionButton>
          {row.status === "Pending" && (
            <CoordinatorActionButton
              variant="primary"
              disabled={isActioning}
              onClick={() => handleApprove(row)}
            >
              {isActioning ? "..." : "Approve"}
            </CoordinatorActionButton>
          )}
          {row.status === "Approved" && (
            <CoordinatorActionButton
              variant="danger"
              disabled={isActioning}
              onClick={() => {
                setDisqualifyTeam(row);
                setDisqualifyReason("");
                setActionError("");
              }}
            >
              Disqualify
            </CoordinatorActionButton>
          )}
        </div>
      );

    return row[key] ?? "—";
  };

  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      {actionError && (
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
          style={{
            background: "rgba(239,68,68,0.06)",
            border: "1px solid rgba(239,68,68,0.2)",
            color: "#dc2626",
          }}
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {actionError}
        </div>
      )}

      <CoordinatorPanel
        title="Team list"
        subtitle="Approve, inspect, or disqualify participating teams"
        icon={icons.UserRoundCog}
      >
        <div className="mb-4 grid gap-3 md:grid-cols-2">
          <label className="text-xs font-bold uppercase text-slate-600">Event
            <select className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" value={selectedEventId} onChange={(event) => setSelectedEventId(event.target.value)}>
              {events.length === 0 ? <option value="">Chưa có Event</option> : events.map((event) => <option key={event.id} value={event.id}>{event.name}</option>)}
            </select>
          </label>
          <label className="text-xs font-bold uppercase text-slate-600">Track
            <select className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" value={selectedTrackId} onChange={(event) => setSelectedTrackId(event.target.value)} disabled={!tracks.length}>
              <option value="">Tất cả Track</option>
              {tracks.map((track) => <option key={track.id} value={track.id}>{track.name}</option>)}
            </select>
          </label>
        </div>
        <FilterBar
          status={statusFilter}
          onStatus={handleStatusFilter}
          search={search}
          onSearch={setSearch}
        />

        {loading ? (
          <div className="flex items-center justify-center py-14 gap-2 text-sm text-slate-600">
            <Loader2
              className="w-4 h-4 animate-spin"
              style={{ color: "#F26F21" }}
            />
            Đang tải...
          </div>
        ) : apiError ? (
          <div className="flex flex-col items-center py-10 gap-3">
            <p className="text-sm text-red-500">{apiError}</p>
            <CoordinatorActionButton onClick={() => fetchTeams(1)}>
              Thử lại
            </CoordinatorActionButton>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-14 text-center text-sm text-slate-600">
            Chưa có team nào.
          </div>
        ) : (
          <>
            <CoordinatorTable
              columns={columns}
              rows={filtered}
              renderCell={renderCell}
            />
            <Pagination
              page={page}
              totalPages={totalPages}
              onPage={handlePageChange}
            />
          </>
        )}
      </CoordinatorPanel>

      {/* Modal: Detail */}
      {detailTeam && (
        <ModalShell
          title={`Chi tiết: ${detailTeam.teamName}`}
          onClose={() => setDetailTeam(null)}
          actions={
            <CoordinatorActionButton
              variant="primary"
              onClick={() => setDetailTeam(null)}
            >
              Đóng
            </CoordinatorActionButton>
          }
        >
          <div className="space-y-2 text-sm">
            {detailLoading && <div className="flex justify-center gap-2 py-4 text-slate-700"><Loader2 className="h-4 w-4 animate-spin" />Đang tải chi tiết...</div>}
            <InfoRow label="Tên team" value={detailTeam.teamName} />
            <InfoRow label="Trường" value={detailTeam.university} />
            <InfoRow
              label="Track"
              value={detailTeam.trackId ? `#${detailTeam.trackId}` : "—"}
            />
            <InfoRow label="Mentor" value={getTeamMentorLabel(detailTeam)} />
            <InfoRow
              label="GitHub"
              value={detailTeam.githubRepoLink}
              isLink={!!detailTeam.githubRepoLink}
            />
            <InfoRow
              label="Thành viên"
              value={`${detailTeam.members?.length ?? detailTeam.memberCount ?? 0} người`}
            />
            {detailTeam.topic && <InfoRow label="Đề tài" value={detailTeam.topic.title} />}
            {detailTeam.members?.length > 0 && (
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="mb-2 text-xs font-bold uppercase text-slate-700">Danh sách thành viên</p>
                <div className="space-y-2">{detailTeam.members.map((member) => <div key={member.id} className="flex justify-between gap-3 text-sm"><span className="font-semibold text-slate-800">{member.fullName}</span><span className="text-slate-700">{member.studentCode}</span></div>)}</div>
              </div>
            )}
            {detailTeam.disqualifyReason && (
              <InfoRow label="Lý do loại" value={detailTeam.disqualifyReason} />
            )}
            <InfoRow
              label="Status"
              value={
                <CoordinatorBadge
                  tone={
                    detailTeam.status === "Approved"
                      ? "success"
                      : detailTeam.status === "Disqualified"
                        ? "danger"
                        : "warning"
                  }
                >
                  {detailTeam.status}
                </CoordinatorBadge>
              }
            />
          </div>
        </ModalShell>
      )}

      {/* Modal: Disqualify */}
      {disqualifyTeam && (
        <ModalShell
          title={`Disqualify: ${disqualifyTeam.teamName}?`}
          onClose={() => {
            setDisqualifyTeam(null);
            setActionError("");
          }}
          actions={
            <>
              <CoordinatorActionButton
                onClick={() => setDisqualifyTeam(null)}
                disabled={actionLoading === disqualifyTeam.id}
              >
                Huỷ
              </CoordinatorActionButton>
              <CoordinatorActionButton
                variant="danger"
                disabled={actionLoading === disqualifyTeam.id}
                onClick={handleDisqualifyConfirm}
              >
                {actionLoading === disqualifyTeam.id
                  ? "Đang xử lý..."
                  : "Xác nhận loại"}
              </CoordinatorActionButton>
            </>
          }
        >
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              Bạn có chắc muốn loại team{" "}
              <strong>{disqualifyTeam.teamName}</strong>?
            </p>
            <textarea
              className="min-h-24 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
              placeholder="Lý do loại team (tuỳ chọn)"
              value={disqualifyReason}
              onChange={(e) => setDisqualifyReason(e.target.value)}
            />
            <FormError msg={actionError} />
          </div>
        </ModalShell>
      )}

    </div>
  );
}

function InfoRow({ label, value, isLink }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs text-slate-600 flex-shrink-0 w-24">{label}</span>
      {isLink ? (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium truncate"
          style={{ color: "#F26F21" }}
        >
          {value}
        </a>
      ) : (
        <span className="text-xs font-semibold text-slate-800 text-right">
          {typeof value === "string" ? value : value}
        </span>
      )}
    </div>
  );
}
