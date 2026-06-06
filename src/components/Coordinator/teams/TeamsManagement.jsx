import { useState, useEffect, useCallback } from "react";
import {
  CoordinatorActionButton,
  CoordinatorBadge,
  CoordinatorPanel,
  CoordinatorTable,
  ModalShell,
  icons,
} from "../CoordinatorUI";
import { UserPlus, AlertCircle, Loader2, CheckCircle } from "lucide-react";

// Extend icons object với các icon chưa có trong CoordinatorUI
const extIcons = { ...icons, UserPlus, AlertCircle, Loader2, CheckCircle };
import axiosInstance from "../../../services/axiosInstance";

// ---------------------------------------------------------------------------
// CONSTANTS
// ---------------------------------------------------------------------------
const STATUS_FILTER_OPTIONS = ["All", "Pending", "Approved", "Disqualified"];

// TODO: thay bằng GET /api/mentors khi BE có endpoint
const MOCK_MENTORS = [
  { id: "m1", name: "Linh Tran" },
  { id: "m2", name: "Huy Vo" },
  { id: "m3", name: "Mai Do" },
];

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------
function EmptyTeams() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{
          background: "rgba(242,111,33,0.08)",
          border: "1px solid rgba(242,111,33,0.15)",
        }}
      >
        <extIcons.UserRoundCog
          className="w-7 h-7"
          style={{ color: "#F26F21" }}
        />
      </div>
      <p className="text-sm font-semibold text-slate-700">
        Chưa có team nào đăng ký
      </p>
      <p className="text-xs text-slate-400 mt-1">
        Danh sách sẽ hiển thị khi có team đăng ký tham gia.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Filter bar
// ---------------------------------------------------------------------------
function FilterBar({ value, onChange }) {
  return (
    <div className="flex items-center gap-2 mb-4 flex-wrap">
      {STATUS_FILTER_OPTIONS.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150"
          style={{
            background: value === s ? "#F26F21" : "#F3F4F6",
            color: value === s ? "#fff" : "#374151",
            border: `1px solid ${value === s ? "#F26F21" : "#E5E7EB"}`,
          }}
        >
          {s}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function TeamsManagement() {
  const [teams, setTeams] = useState([]);
  const [trackMap, setTrackMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [filter, setFilter] = useState("All");

  // Modals
  const [detailTeam, setDetailTeam] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [disqualifyTeam, setDisqualifyTeam] = useState(null);
  const [assignMentorTeam, setAssignMentorTeam] = useState(null);
  const [approveTeam, setApproveTeam] = useState(null);
  const [approveDetail, setApproveDetail] = useState(null);
  const [approveLoading, setApproveLoading] = useState(false);

  // Action states
  const [actionLoading, setActionLoading] = useState(""); // teamId đang xử lý
  const [actionError, setActionError] = useState("");
  const [disqualifyReason, setDisqualifyReason] = useState("");
  const [selectedMentorId, setSelectedMentorId] = useState("");

  // ---------------------------------------------------------------------------
  // Fetch teams
  // ---------------------------------------------------------------------------
  const fetchTeams = useCallback(async () => {
    setLoading(true);
    setApiError("");
    try {
      const params = { pageNumber, pageSize: 10 };
      if (filter !== "All") params.status = filter;

      const res = await teamService.getAdminTeams(params);
      const data = res.data?.data;
      setTeams(data?.items || []);
      setPagination(data);
    } catch (err) {
      setApiError(getApiMessage(err, "Không thể tải danh sách team."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeams(1);
  }, [fetchTeams]);

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------
  const handleApprove = async (team) => {
    setActionLoading(team.id);
    setActionError("");
    try {
      // NOTE: BE typo "appove" — đúng theo doc
      await axiosInstance.put(`/teams/${team.id}/appove`);
      setTeams((prev) =>
        prev.map((t) => (t.id === team.id ? { ...t, status: "Approved" } : t)),
      );
    } catch (err) {
      setActionError(getApiMessage(err, "Approve thất bại."));
    } finally {
      setActionLoading("");
    }
  };

  const handleDisqualifyConfirm = async () => {
    setActionLoading(disqualifyTeam.id);
    setActionError("");
    try {
      await axiosInstance.put(`/teams/${disqualifyTeam.id}/disqualify`, {
        // TODO: xác nhận BE có nhận reason không, nếu không thì xóa body
        reason: disqualifyReason.trim() || undefined,
      });
      setTeams((prev) =>
        prev.map((t) =>
          t.id === disqualifyTeam.id ? { ...t, status: "Disqualified" } : t,
        ),
      );
      setDisqualifyTeam(null);
      setDisqualifyReason("");
      await fetchTeams();
    } catch (err) {
      setActionError(getApiMessage(err, "Disqualify thất bại."));
    } finally {
      setActionLoading("");
    }
  };

  const handleAssignMentorConfirm = async () => {
    if (!assignMentorTeam || !selectedMentorId) return;
    setActionLoading(assignMentorTeam.id);
    setActionError("");
    try {
      await axiosInstance.put(`/teams/${assignMentorTeam.id}/mentor`, {
        mentorId: selectedMentorId,
      });
      const mentor = MOCK_MENTORS.find((m) => m.id === selectedMentorId);
      setTeams((prev) =>
        prev.map((t) =>
          t.id === assignMentorTeam.id
            ? { ...t, mentor: mentor?.name || selectedMentorId }
            : t,
        ),
      );
      setAssignMentorTeam(null);
      setSelectedMentorId("");
      await fetchTeams();
    } catch (err) {
      setActionError(getApiMessage(err, "Assign mentor thất bại."));
    } finally {
      setActionLoading("");
    }
  };

  // ---------------------------------------------------------------------------
  // Filter
  // ---------------------------------------------------------------------------
  const filteredTeams =
    filter === "All" ? teams : teams.filter((t) => t.status === filter);

  // ---------------------------------------------------------------------------
  // Table columns
  // ---------------------------------------------------------------------------
  const columns = [
    { key: "name", label: "Team" },
    { key: "track", label: "Track" },
    { key: "mentor", label: "Mentor" },
    { key: "status", label: "Status" },
    { key: "actions", label: "Actions" },
  ];

  const renderCell = (row, key) => {
    const isActioning = actionLoading === row.id;
    const displayName = row.teamName || row.name;

    if (key === "name")
      return (
        <div>
          <p className="font-bold text-slate-900">{row.name}</p>
          <p className="text-xs text-slate-500">
            {/* TODO: BE trả về leader name ở field nào thì map vào đây */}
            Leader: {row.leader || row.leaderName || "—"} •{" "}
            {row.memberCount ?? row.members ?? "?"} members
          </p>
        </div>
      );

    if (key === "track")
      return (
        <span className="text-sm text-slate-600">
          {row.track || row.trackName || "Chưa phân"}
        </span>
      );

    if (key === "mentor")
      return (
        <button
          type="button"
          className="text-sm transition-colors duration-150"
          style={{ color: row.mentorId ? "#374151" : "#F26F21" }}
          onClick={() => {
            setAssignMentorTeam(row);
            setSelectedMentorId(row.mentorId || "");
            setActionError("");
          }}
        >
          {row.mentor && row.mentor !== "Unassigned" ? (
            row.mentor
          ) : (
            <span className="flex items-center gap-1 text-xs font-semibold">
              <UserPlus className="w-3.5 h-3.5" /> Assign
            </span>
          )}
        </button>
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
            icon={extIcons.Eye}
            onClick={() => {
              setDetailTeam(row);
              setActionError("");
            }}
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
  // Render
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
        <FilterBar value={filter} onChange={setFilter} />

        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-sm text-slate-400">
            <extIcons.Loader2
              className="w-5 h-5 animate-spin"
              style={{ color: "#F26F21" }}
            />
            Đang tải danh sách team...
          </div>
        ) : apiError ? (
          <div className="flex flex-col items-center py-10 gap-3">
            <p className="text-sm text-red-500">{apiError}</p>
            <CoordinatorActionButton onClick={() => fetchTeams(1)}>
              Thử lại
            </CoordinatorActionButton>
          </div>
        ) : filteredTeams.length === 0 ? (
          <EmptyTeams />
        ) : (
          <CoordinatorTable
            columns={columns}
            rows={filteredTeams}
            renderCell={renderCell}
          />
        )}
      </CoordinatorPanel>

      {/* ---- Modal: Detail ---- */}
      {detailTeam && (
        <ModalShell
          title={`Chi tiết: ${detailTeam.name}`}
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
          <div className="space-y-3 text-sm text-slate-600">
            <Row label="Team" value={detailTeam.name} />
            <Row
              label="Leader"
              value={detailTeam.leader || detailTeam.leaderName || "—"}
            />
            <Row label="Trường" value={detailTeam.school || "—"} />
            <Row
              label="Thành viên"
              value={`${detailTeam.memberCount ?? detailTeam.members ?? "?"} người`}
            />
            <Row
              label="Track"
              value={detailTeam.track || detailTeam.trackName || "Chưa phân"}
            />
            <Row label="Mentor" value={detailTeam.mentor || "Unassigned"} />
            <Row
              label="GitHub"
              value={detailTeam.githubRepo || "—"}
              isLink={!!detailTeam.githubRepo}
            />
            <Row
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
            {/* TODO: thêm submission info khi BE trả về */}
            {detailTeam.readiness !== undefined && (
              <CoordinatorProgressBar
                label="Readiness"
                value={detailTeam.readiness}
              />
            )}
          </div>
        </ModalShell>
      )}

      {/* ---- Modal: Disqualify ---- */}
      {disqualifyTeam && (
        <ModalShell
          title={`Disqualify: ${disqualifyTeam.name}?`}
          onClose={() => setDisqualifyTeam(null)}
          actions={
            <>
              <CoordinatorActionButton
                onClick={() => {
                  setDisqualifyTeam(null);
                  setActionError("");
                }}
              >
                Huỷ
              </CoordinatorActionButton>
              <CoordinatorActionButton
                variant="primary"
                disabled={
                  approveLoading ||
                  actionLoading === approveTeam.id ||
                  (approveDetail?.members?.length ?? 0) < TEAM_MIN_MEMBERS
                }
                onClick={handleApproveConfirm}
              >
                {actionLoading === approveTeam.id
                  ? "Đang duyệt..."
                  : "Xác nhận duyệt"}
              </CoordinatorActionButton>
            </>
          }
        >
          {approveLoading ? (
            <LoadingState label="Đang kiểm tra team..." />
          ) : (
            <div className="space-y-4 text-sm">
              <p className="text-slate-600">
                BE yêu cầu team có{" "}
                <strong>ít nhất {TEAM_MIN_MEMBERS} thành viên</strong> (leader +
                member) trước khi duyệt.
              </p>
              <div
                className={`rounded-xl border p-4 ${
                  (approveDetail?.members?.length ?? 0) >= TEAM_MIN_MEMBERS
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-amber-200 bg-amber-50"
                }`}
              >
                <p className="font-bold text-slate-900">
                  Số thành viên hiện tại: {approveDetail?.members?.length ?? 0}/
                  {TEAM_MIN_MEMBERS}
                </p>
                {(approveDetail?.members?.length ?? 0) < TEAM_MIN_MEMBERS && (
                  <p className="mt-2 text-xs text-amber-800">
                    Team chưa đủ người. Leader cần đăng ký thêm member rồi thử
                    lại.
                  </p>
                )}
              </div>
              {Array.isArray(approveDetail?.members) &&
                approveDetail.members.length > 0 && (
                  <div className="space-y-2">
                    {approveDetail.members.map((m, i) => (
                      <div
                        key={m.id || i}
                        className="rounded-lg bg-slate-50 px-3 py-2 text-xs"
                      >
                        <span className="font-semibold text-slate-800">
                          {m.fullName}
                          {m.isLeader ? " (Leader)" : ""}
                        </span>
                        <span className="text-slate-500">
                          {" "}
                          — {m.studentCode}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              {actionError && (
                <p className="text-xs text-red-600">{actionError}</p>
              )}
            </div>
          )}
        </ModalShell>
      )}

      {disqualifyTeam && (
        <ModalShell
          title={`Disqualify: ${disqualifyTeam.teamName || disqualifyTeam.name}?`}
          onClose={() => setDisqualifyTeam(null)}
          actions={
            <>
              <CoordinatorActionButton onClick={() => setDisqualifyTeam(null)}>
                Huỷ
              </CoordinatorActionButton>
              <CoordinatorActionButton
                variant="danger"
                disabled={actionLoading === disqualifyTeam.id}
                onClick={handleDisqualifyConfirm}
              >
                Xác nhận loại
              </CoordinatorActionButton>
            </>
          }
        >
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              Bạn có chắc muốn loại team <strong>{disqualifyTeam.name}</strong>?
              Hành động này không thể hoàn tác.
            </p>
            <textarea
              className="min-h-28 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition-all"
              placeholder="Lý do loại team (tuỳ chọn)"
              value={disqualifyReason}
              onChange={(e) => setDisqualifyReason(e.target.value)}
              onFocus={(e) => (e.target.style.borderColor = "#F26F21")}
              onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
            />
            {actionError && (
              <p className="text-xs text-red-500">{actionError}</p>
            )}
          </div>
        </ModalShell>
      )}

      {/* ---- Modal: Assign Mentor ---- */}
      {assignMentorTeam && (
        <ModalShell
          title={`Assign Mentor: ${assignMentorTeam.name}`}
          onClose={() => setAssignMentorTeam(null)}
          actions={
            <>
              <CoordinatorActionButton
                onClick={() => {
                  setAssignMentorTeam(null);
                  setActionError("");
                }}
              >
                Huỷ
              </CoordinatorActionButton>
              <CoordinatorActionButton
                variant="primary"
                disabled={
                  !selectedMentorId || actionLoading === assignMentorTeam.id
                }
                onClick={handleAssignMentorConfirm}
              >
                Assign
              </CoordinatorActionButton>
            </>
          }
        >
          <div className="space-y-3">
            <p className="text-sm text-slate-500">
              Chọn mentor cho team{" "}
              <strong className="text-slate-800">
                {assignMentorTeam.name}
              </strong>
              :
            </p>
            <div className="space-y-2">
              {/* TODO: thay MOCK_MENTORS bằng fetch GET /api/mentors */}
              {MOCK_MENTORS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMentorId(m.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-150 text-left"
                  style={{
                    background:
                      selectedMentorId === m.id
                        ? "rgba(242,111,33,0.08)"
                        : "#F9FAFB",
                    border: `1px solid ${selectedMentorId === m.id ? "#F26F21" : "#E5E7EB"}`,
                  }}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ background: "#F26F21" }}
                  >
                    {m.name.charAt(0)}
                  </div>
                  <span className="font-semibold text-slate-700">{m.name}</span>
                  {selectedMentorId === m.id && (
                    <extIcons.CheckCircle
                      className="w-4 h-4 ml-auto"
                      style={{ color: "#F26F21" }}
                    />
                  )}
                </button>
              ))}
            </div>
            {actionError && (
              <p className="text-xs text-red-500">{actionError}</p>
            )}
          </div>
        </ModalShell>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
function Row({ label, value, isLink }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs text-slate-400 flex-shrink-0 w-24">{label}</span>
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
