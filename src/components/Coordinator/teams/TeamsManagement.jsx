import { useState, useEffect, useCallback } from "react";
import {
  CoordinatorActionButton,
  CoordinatorBadge,
  CoordinatorPanel,
  CoordinatorTable,
  ModalShell,
  icons,
} from "../CoordinatorUI";
import { UserPlus, AlertCircle, Loader2 } from "lucide-react";
import teamService from "../../../services/teamService";
import mentorService from "../../../services/mentorService";
import trackService from "../../../services/trackService";
import eventService from "../../../services/eventService";
import { getApiMessage, LoadingState, TEAM_MIN_MEMBERS } from "../coordinatorHelpers";

const extIcons = { ...icons, UserPlus, AlertCircle, Loader2 };

const STATUS_FILTER_OPTIONS = ["All", "Pending", "Approved", "Disqualified"];

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
        <extIcons.UserRoundCog className="w-7 h-7" style={{ color: "#F26F21" }} />
      </div>
      <p className="text-sm font-semibold text-slate-700">
        Chưa có team nào đăng ký
      </p>
    </div>
  );
}

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

function getMemberCount(team) {
  if (team.memberCount != null) return team.memberCount;
  if (Array.isArray(team.members)) return team.members.length;
  return "—";
}

function getTrackLabel(team, trackMap) {
  if (team.trackName) return team.trackName;
  if (team.trackId && trackMap[team.trackId]) return trackMap[team.trackId];
  return "Chưa phân";
}

export function TeamsManagement() {
  const [teams, setTeams] = useState([]);
  const [trackMap, setTrackMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [filter, setFilter] = useState("Pending");
  const [pageNumber, setPageNumber] = useState(1);
  const [pagination, setPagination] = useState(null);

  const [detailTeam, setDetailTeam] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [disqualifyTeam, setDisqualifyTeam] = useState(null);
  const [assignMentorTeam, setAssignMentorTeam] = useState(null);
  const [approveTeam, setApproveTeam] = useState(null);
  const [approveDetail, setApproveDetail] = useState(null);
  const [approveLoading, setApproveLoading] = useState(false);

  const [actionLoading, setActionLoading] = useState("");
  const [actionError, setActionError] = useState("");
  const [disqualifyReason, setDisqualifyReason] = useState("");
  const [selectedMentorId, setSelectedMentorId] = useState("");
  const [mentors, setMentors] = useState([]);
  const [mentorsAvailable, setMentorsAvailable] = useState(false);

  useEffect(() => {
    eventService
      .getAll()
      .then(async (res) => {
        const events = res.data?.data || [];
        const map = {};
        for (const ev of events) {
          try {
            const tr = await trackService.getByEvent(ev.id);
            (tr.data?.data || []).forEach((t) => {
              map[t.id] = t.name;
            });
          } catch (_) {}
        }
        setTrackMap(map);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    mentorService
      .getAll()
      .then((res) => {
        setMentors(res.data?.data || []);
        setMentorsAvailable(true);
      })
      .catch(() => setMentorsAvailable(false));
  }, []);

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
  }, [filter, pageNumber]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const handleApprove = async (team) => {
    setApproveTeam(team);
    setApproveDetail(null);
    setActionError("");
    setApproveLoading(true);
    try {
      const res = await teamService.getById(team.id);
      setApproveDetail(res.data?.data || team);
    } catch (err) {
      setActionError(getApiMessage(err, "Không thể tải chi tiết team."));
      setApproveTeam(null);
    } finally {
      setApproveLoading(false);
    }
  };

  const handleApproveConfirm = async () => {
    if (!approveTeam || !approveDetail) return;

    const memberCount = approveDetail.members?.length ?? 0;
    if (memberCount < TEAM_MIN_MEMBERS) {
      setActionError(
        `Team chỉ có ${memberCount}/${TEAM_MIN_MEMBERS} thành viên. Leader cần thêm member trước khi duyệt.`,
      );
      return;
    }

    setActionLoading(approveTeam.id);
    setActionError("");
    try {
      await teamService.approveTeam(approveTeam.id);
      setApproveTeam(null);
      setApproveDetail(null);
      await fetchTeams();
    } catch (err) {
      setActionError(getApiMessage(err, "Approve thất bại."));
    } finally {
      setActionLoading("");
    }
  };

  const handleDisqualifyConfirm = async () => {
    if (!disqualifyTeam) return;
    setActionLoading(disqualifyTeam.id);
    setActionError("");
    try {
      await teamService.disqualifyTeam(
        disqualifyTeam.id,
        disqualifyReason.trim() || undefined,
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
    if (!assignMentorTeam || !selectedMentorId.trim()) return;
    setActionLoading(assignMentorTeam.id);
    setActionError("");
    try {
      await teamService.assignMentor(
        assignMentorTeam.id,
        selectedMentorId.trim(),
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

  const openDetail = async (team) => {
    setDetailTeam(team);
    setDetailLoading(true);
    try {
      const res = await teamService.getById(team.id);
      setDetailTeam(res.data?.data || team);
    } catch (_) {
      setDetailTeam(team);
    } finally {
      setDetailLoading(false);
    }
  };

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
          <p className="font-bold text-slate-900">{displayName}</p>
          <p className="text-xs text-slate-500">
            Leader: {row.leaderName || "—"} • {getMemberCount(row)} members
          </p>
        </div>
      );

    if (key === "track")
      return (
        <span className="text-sm text-slate-600">
          {getTrackLabel(row, trackMap)}
        </span>
      );

    if (key === "mentor")
      return (
        <button
          type="button"
          className="text-sm transition-colors duration-150"
          style={{
            color: row.mentorId || row.mentorName ? "#374151" : "#F26F21",
          }}
          onClick={() => {
            setAssignMentorTeam(row);
            setSelectedMentorId(row.mentorId || "");
            setActionError("");
          }}
        >
          {row.mentorName || row.mentorId ? (
            row.mentorName || row.mentorId
          ) : (
            <span className="flex items-center gap-1 text-xs font-semibold">
              <extIcons.UserPlus className="w-3.5 h-3.5" /> Assign
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
            onClick={() => openDetail(row)}
          >
            Details
          </CoordinatorActionButton>
          <CoordinatorActionButton
            variant="primary"
            disabled={isActioning || row.status === "Approved"}
            onClick={() => handleApprove(row)}
          >
            {isActioning ? "..." : "Approve"}
          </CoordinatorActionButton>
          <CoordinatorActionButton
            variant="danger"
            disabled={isActioning || row.status === "Disqualified"}
            onClick={() => {
              setDisqualifyTeam(row);
              setDisqualifyReason("");
              setActionError("");
            }}
          >
            Disqualify
          </CoordinatorActionButton>
        </div>
      );

    return row[key] ?? "—";
  };

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
          <extIcons.AlertCircle className="w-4 h-4 flex-shrink-0" />
          {actionError}
        </div>
      )}

      <CoordinatorPanel
        title="Team list"
        subtitle="Approve, inspect, or disqualify participating teams"
        icon={extIcons.UserRoundCog}
      >
        <FilterBar
          value={filter}
          onChange={(v) => {
            setFilter(v);
            setPageNumber(1);
          }}
        />

        {loading ? (
          <LoadingState label="Đang tải danh sách team..." />
        ) : apiError ? (
          <div className="flex flex-col items-center py-12 gap-3">
            <p className="text-sm text-red-500">{apiError}</p>
            <CoordinatorActionButton onClick={fetchTeams}>
              Thử lại
            </CoordinatorActionButton>
          </div>
        ) : teams.length === 0 ? (
          <EmptyTeams />
        ) : (
          <>
            <CoordinatorTable
              columns={columns}
              rows={teams}
              renderCell={renderCell}
            />
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Trang {pagination.pageNumber}/{pagination.totalPages} (
                  {pagination.totalRecords} teams)
                </span>
                <div className="flex gap-2">
                  <CoordinatorActionButton
                    disabled={!pagination.hasPreviousPage}
                    onClick={() => setPageNumber((p) => p - 1)}
                  >
                    Trước
                  </CoordinatorActionButton>
                  <CoordinatorActionButton
                    disabled={!pagination.hasNextPage}
                    onClick={() => setPageNumber((p) => p + 1)}
                  >
                    Sau
                  </CoordinatorActionButton>
                </div>
              </div>
            )}
          </>
        )}
      </CoordinatorPanel>

      {detailTeam && (
        <ModalShell
          title={`Chi tiết: ${detailTeam.teamName || detailTeam.name}`}
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
          {detailLoading ? (
            <LoadingState label="Đang tải chi tiết..." />
          ) : (
            <div className="space-y-3 text-sm text-slate-600">
              <Row label="Team" value={detailTeam.teamName || detailTeam.name} />
              <Row label="Trường" value={detailTeam.university || "—"} />
              <Row
                label="Track"
                value={getTrackLabel(detailTeam, trackMap)}
              />
              <Row
                label="GitHub"
                value={detailTeam.githubRepoLink || "—"}
                isLink={!!detailTeam.githubRepoLink}
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
              {Array.isArray(detailTeam.members) &&
                detailTeam.members.length > 0 && (
                  <div className="pt-2">
                    <p className="text-xs font-bold text-slate-700 uppercase mb-2">
                      Members ({detailTeam.members.length})
                    </p>
                    <div className="space-y-2">
                      {detailTeam.members.map((m, i) => (
                        <div
                          key={m.id || i}
                          className="rounded-lg bg-slate-50 px-3 py-2 text-xs"
                        >
                          <p className="font-semibold text-slate-800">
                            {m.fullName}
                          </p>
                          <p className="text-slate-500">
                            {m.email} • {m.studentCode}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}
        </ModalShell>
      )}

      {approveTeam && (
        <ModalShell
          title={`Duyệt team: ${approveTeam.teamName || approveTeam.name}`}
          onClose={() => {
            setApproveTeam(null);
            setApproveDetail(null);
            setActionError("");
          }}
          actions={
            <>
              <CoordinatorActionButton
                onClick={() => {
                  setApproveTeam(null);
                  setApproveDetail(null);
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
                BE yêu cầu team có <strong>ít nhất {TEAM_MIN_MEMBERS} thành viên</strong>{" "}
                (leader + member) trước khi duyệt.
              </p>
              <div
                className={`rounded-xl border p-4 ${
                  (approveDetail?.members?.length ?? 0) >= TEAM_MIN_MEMBERS
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-amber-200 bg-amber-50"
                }`}
              >
                <p className="font-bold text-slate-900">
                  Số thành viên hiện tại:{" "}
                  {approveDetail?.members?.length ?? 0}/{TEAM_MIN_MEMBERS}
                </p>
                {(approveDetail?.members?.length ?? 0) < TEAM_MIN_MEMBERS && (
                  <p className="mt-2 text-xs text-amber-800">
                    Team chưa đủ người. Leader cần đăng ký thêm member rồi thử lại.
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
                        <span className="text-slate-500"> — {m.studentCode}</span>
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
          <textarea
            className="min-h-28 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
            placeholder="Lý do loại team (tuỳ chọn)"
            value={disqualifyReason}
            onChange={(e) => setDisqualifyReason(e.target.value)}
          />
        </ModalShell>
      )}

      {assignMentorTeam && (
        <ModalShell
          title={`Assign Mentor: ${assignMentorTeam.teamName || assignMentorTeam.name}`}
          onClose={() => setAssignMentorTeam(null)}
          actions={
            <>
              <CoordinatorActionButton onClick={() => setAssignMentorTeam(null)}>
                Huỷ
              </CoordinatorActionButton>
              <CoordinatorActionButton
                variant="primary"
                disabled={
                  !selectedMentorId.trim() ||
                  actionLoading === assignMentorTeam.id
                }
                onClick={handleAssignMentorConfirm}
              >
                Assign
              </CoordinatorActionButton>
            </>
          }
        >
          <div className="space-y-3">
            {mentorsAvailable && mentors.length > 0 ? (
              <div className="space-y-2">
                {mentors.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMentorId(m.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-left border"
                    style={{
                      borderColor:
                        selectedMentorId === m.id ? "#F26F21" : "#E5E7EB",
                      background:
                        selectedMentorId === m.id
                          ? "rgba(242,111,33,0.08)"
                          : "#F9FAFB",
                    }}
                  >
                    <span className="font-semibold text-slate-700">
                      {m.fullName}
                    </span>
                    <span className="text-xs text-slate-400">{m.email}</span>
                  </button>
                ))}
              </div>
            ) : (
              <>
                <p className="text-xs text-slate-500">
                  GET /api/mentors chưa có — nhập GUID mentor thủ công:
                </p>
                <input
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none font-mono"
                  placeholder="22222222-2222-2222-2222-222222222222"
                  value={selectedMentorId}
                  onChange={(e) => setSelectedMentorId(e.target.value)}
                />
              </>
            )}
            {actionError && (
              <p className="text-xs text-red-500">{actionError}</p>
            )}
          </div>
        </ModalShell>
      )}
    </div>
  );
}

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
