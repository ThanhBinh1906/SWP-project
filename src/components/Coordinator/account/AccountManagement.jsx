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
import staffService from "../../../services/staffService";
import teamService from "../../../services/teamService";
import trackService from "../../../services/trackService";
import eventService from "../../../services/eventService";
import { useSelector } from "react-redux";
import LoadingActionText from "../../shared/LoadingActionText";
import { FormError, getInvalidFieldClass } from "../coordinatorHelpers";

// ---------------------------------------------------------------------------
const EVENT_ROLE_OPTIONS = ["Mentor", "Judge"];
const MAX_ADMIN_TEAM_PAGE_SIZE = 50;
// TODO: confirm judgeType options với BE
const JUDGE_TYPE_OPTIONS = ["Chuyên môn", "Doanh nghiệp", "Học thuật"];
const JUDGE_TYPE_LABELS = {
  "chuyen mon": "Chuyên môn",
  "chuy?n mon": "Chuyên môn",
  "chuy?n môn": "Chuyên môn",
  "chuyên môn": "Chuyên môn",
  "doanh nghiep": "Doanh nghiệp",
  "doanh nghi?p": "Doanh nghiệp",
  "doanh nghiệp": "Doanh nghiệp",
  "hoc thuat": "Học thuật",
  "h?c thu?t": "Học thuật",
  "học thuật": "Học thuật",
};

const EMPTY_STAFF_FORM = {
  username: "",
  email: "",
  eventRole: "Mentor",
  judgeType: "",
};

function normalizeJudgeTypeLabel(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  return JUDGE_TYPE_LABELS[raw.toLowerCase()] || raw;
}

function getListFromApiData(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

function getAssignedTeamsFromApiData(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.assignedTeams)) return data.assignedTeams;
  return [];
}

function renderCompactAssignmentList(items, getPrimary, getSecondary, emptyText) {
  if (!Array.isArray(items) || items.length === 0) {
    return <span className="text-sm text-slate-600">{emptyText}</span>;
  }

  return (
    <div className="max-w-xs space-y-1">
      {items.slice(0, 3).map((item) => (
        <div
          key={item.id || item.teamId || item.roundId || getPrimary(item)}
          className="rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1.5"
        >
          <p className="truncate text-xs font-bold text-slate-800">
            {getPrimary(item)}
          </p>
          {getSecondary?.(item) && (
            <p className="truncate text-[11px] text-slate-700">
              {getSecondary(item)}
            </p>
          )}
        </div>
      ))}
      {items.length > 3 && (
        <p className="text-[11px] font-semibold text-slate-600">
          +{items.length - 3} mục khác
        </p>
      )}
    </div>
  );
}

function StaffTab() {
  const eventId = useSelector((s) => s.event.activeEventId);

  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [roleFilter, setRoleFilter] = useState("Mentor");

  const [createModal, setCreateModal] = useState(false);
  const [form, setForm] = useState(EMPTY_STAFF_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const accountIdentityInvalid =
    Boolean(formError) && !form.username.trim() && !form.email.trim();
  const [actionLoading, setActionLoading] = useState("");

  // Assign judge to round modal
  const [assignRoundModal, setAssignRoundModal] = useState(null); // staff object
  const [roundId, setRoundId] = useState("");
  const [assignError, setAssignError] = useState("");
  const [eventRounds, setEventRounds] = useState([]);
  const [eventRoundsLoading, setEventRoundsLoading] = useState(false);
  const [roundJudgesModal, setRoundJudgesModal] = useState(false);
  const [judgeLookupRoundId, setJudgeLookupRoundId] = useState("");
  const [roundJudges, setRoundJudges] = useState([]);
  const [roundJudgesLoading, setRoundJudgesLoading] = useState(false);
  const [roundJudgesError, setRoundJudgesError] = useState("");

  // Assign mentor to teams modal
  const [assignMentorModal, setAssignMentorModal] = useState(null); // staff object
  const [tracks, setTracks] = useState([]);
  const [selectedTrackId, setSelectedTrackId] = useState("");
  const [trackTeams, setTrackTeams] = useState([]);
  const [mentorTeams, setMentorTeams] = useState([]);
  const [selectedTeamIds, setSelectedTeamIds] = useState([]);
  const [mentorTrackAssigned, setMentorTrackAssigned] = useState(false);
  const [mentorAssignLoading, setMentorAssignLoading] = useState(false);
  const [mentorAssignError, setMentorAssignError] = useState("");

  // ---------------------------------------------------------------------------
  const fetchStaff = useCallback(async () => {
    if (!eventId) {
      setStaff([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setApiError("");
    try {
      const res = await staffService.getByEvent(eventId);
      setStaff(res.data?.data || []);
    } catch (err) {
      setApiError(
        err?.response?.data?.message || "Không thể tải danh sách staff.",
      );
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  // ---------------------------------------------------------------------------
  const handleCreate = async () => {
    if (!form.username.trim() && !form.email.trim()) {
      setFormError("Vui lòng nhập username hoặc email.");
      return;
    }
    if (!form.eventRole) {
      setFormError("Vui lòng chọn vai trò.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      await staffService.create(eventId, {
        username: form.username.trim() || undefined,
        email: form.email.trim() || undefined,
        eventRole: form.eventRole,
        judgeType:
          form.eventRole === "Judge"
            ? normalizeJudgeTypeLabel(form.judgeType) || undefined
            : undefined,
      });
      await fetchStaff();
      setCreateModal(false);
      setForm(EMPTY_STAFF_FORM);
    } catch (err) {
      setFormError(err?.response?.data?.message || "Tạo staff thất bại.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (s, action) => {
    // action: "activate" | "deactivate"
    setActionLoading(s.accountId + action);
    try {
      await staffService.toggleStatus(
        eventId,
        s.accountId,
        action,
        s.eventRole,
      );
      await fetchStaff();
    } catch (err) {
      setApiError(err?.response?.data?.message || `${action} thất bại.`);
    } finally {
      setActionLoading("");
    }
  };

  const handleAssignRound = async () => {
    if (!roundId) {
      setAssignError("Vui lòng chọn Round.");
      return;
    }
    setAssignError("");
    setSaving(true);
    try {
      await staffService.assignRound(roundId, assignRoundModal.accountId);
      setAssignRoundModal(null);
      setRoundId("");
      await fetchStaff(); // refresh list sau khi assign
    } catch (err) {
      setAssignError(err?.response?.data?.message || "Assign thất bại.");
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  const loadRoundJudges = async () => {
    if (!judgeLookupRoundId.trim()) {
      setRoundJudgesError("Vui lòng nhập Round ID.");
      return;
    }
    setRoundJudgesLoading(true);
    setRoundJudgesError("");
    try {
      const response = await staffService.getRoundJudges(judgeLookupRoundId.trim());
      setRoundJudges(response.data?.data || []);
    } catch (err) {
      setRoundJudges([]);
      setRoundJudgesError(
        err?.response?.data?.message || "Không thể tải danh sách Judge của Round.",
      );
    } finally {
      setRoundJudgesLoading(false);
    }
  };

  const openAssignRound = async (judge) => {
    setAssignRoundModal(judge);
    setRoundId("");
    setAssignError("");
    setEventRounds([]);

    if (!eventId) {
      setAssignError("Không xác định được Event hiện tại.");
      return;
    }

    setEventRoundsLoading(true);
    try {
      const response = await eventService.getRounds(eventId);
      setEventRounds(Array.isArray(response.data?.data) ? response.data.data : []);
    } catch (error) {
      setAssignError(
        error?.response?.data?.message ||
          "Không thể tải danh sách Round của Event này.",
      );
    } finally {
      setEventRoundsLoading(false);
    }
  };

  const fetchApprovedTeamsByTrack = async (trackId) => {
    const allTeams = [];
    let pageNumber = 1;
    let totalPages = 1;

    do {
      const teamsRes = await teamService.getAdminTeams({
        pageNumber,
        pageSize: MAX_ADMIN_TEAM_PAGE_SIZE,
        status: "Approved",
        trackId,
      });

      const teamData = teamsRes.data?.data;
      const items = getListFromApiData(teamData);
      allTeams.push(...items);

      const hasNextPage = Boolean(teamData?.hasNextPage);
      totalPages =
        Number(teamData?.totalPages || teamData?.totalPage || 0) ||
        (hasNextPage ? pageNumber + 1 : pageNumber);
      pageNumber += 1;
    } while (pageNumber <= totalPages);

    return allTeams;
  };

  const openAssignMentorTeams = async (mentor) => {
    setAssignMentorModal(mentor);
    setSelectedTrackId("");
    setTrackTeams([]);
    setMentorTeams([]);
    setSelectedTeamIds([]);
    setMentorTrackAssigned(false);
    setMentorAssignError("");
    setMentorAssignLoading(true);
    try {
      const res = await trackService.getByEvent(eventId);
      setTracks(res.data?.data || []);
    } catch (err) {
      setMentorAssignError(
        err?.response?.data?.message || "Không thể tải danh sách track.",
      );
    } finally {
      setMentorAssignLoading(false);
    }
  };

  const loadMentorTrackTeams = async (trackId, mentorId) => {
    if (!trackId || !mentorId) return;
    setMentorAssignLoading(true);
    setMentorAssignError("");
    try {
      try {
        const mentorTeamsRes = await trackService.getMentorTeams(trackId, mentorId);
        const assignedTeams = getAssignedTeamsFromApiData(mentorTeamsRes.data?.data);
        setMentorTrackAssigned(true);

        // Chỉ tải danh sách team để chọn sau khi Mentor đã thuộc Track.
        const teams = await fetchApprovedTeamsByTrack(trackId);
        const filteredTeams = teams.filter(
          (team) => !team.trackId || String(team.trackId) === String(trackId),
        );
        const assignedIds = assignedTeams.map((team) =>
          String(team.id ?? team.teamId),
        );
        const currentMentorTeamIds = filteredTeams
          .filter((team) => String(team.mentorId || "") === String(mentorId))
          .map((team) => String(team.id));

        setTrackTeams(filteredTeams);
        setMentorTeams(assignedTeams);
        setSelectedTeamIds(
          Array.from(new Set([...assignedIds, ...currentMentorTeamIds])),
        );
      } catch (mentorTeamsErr) {
        if (isMentorMissingTrackAssignment(mentorTeamsErr)) {
          setMentorTrackAssigned(false);
          setTrackTeams([]);
          setMentorTeams([]);
          setSelectedTeamIds([]);
          return;
        }
        throw mentorTeamsErr;
      }
    } catch (err) {
      setMentorTrackAssigned(false);
      setTrackTeams([]);
      setMentorTeams([]);
      setSelectedTeamIds([]);
      setMentorAssignError(
        err?.response?.data?.message ||
          "Không thể tải danh sách team Approved trong track này.",
      );
    } finally {
      setMentorAssignLoading(false);
    }
  };

  const handleTrackChangeForMentor = (trackId) => {
    setSelectedTrackId(trackId);
    setTrackTeams([]);
    setMentorTeams([]);
    setSelectedTeamIds([]);
    setMentorTrackAssigned(false);
    if (trackId && assignMentorModal?.accountId) {
      loadMentorTrackTeams(trackId, assignMentorModal.accountId);
    }
  };

  const handleAssignMentorToTrack = async () => {
    if (!selectedTrackId || !assignMentorModal?.accountId) return;
    setMentorAssignLoading(true);
    setMentorAssignError("");
    try {
      await trackService.assignMentor(
        selectedTrackId,
        assignMentorModal.accountId,
      );
      await loadMentorTrackTeams(
        selectedTrackId,
        assignMentorModal.accountId,
      );
    } catch (err) {
      if (isMentorAlreadyAssignedToTrack(err)) {
        await loadMentorTrackTeams(
          selectedTrackId,
          assignMentorModal.accountId,
        );
      } else {
        setMentorAssignError(
          err?.response?.data?.message || "Gán Mentor vào Track thất bại.",
        );
      }
    } finally {
      setMentorAssignLoading(false);
    }
  };

  const toggleTeamSelection = (teamId) => {
    const id = String(teamId);
    const team = trackTeams.find((item) => String(item.id) === id);
    if (
      team?.mentorId &&
      String(team.mentorId) !== String(assignMentorModal?.accountId)
    ) {
      return;
    }

    setSelectedTeamIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleAssignMentorTeams = async () => {
    if (!selectedTrackId) {
      setMentorAssignError("Vui lòng chọn track.");
      return;
    }
    if (!assignMentorModal?.accountId) {
      setMentorAssignError("Không tìm thấy mentor.");
      return;
    }
    if (!mentorTrackAssigned) {
      setMentorAssignError("Phải gán Mentor vào Track trước khi gán team.");
      return;
    }
    setMentorAssignLoading(true);
    setMentorAssignError("");
    try {
      const assignableTeamIds = selectedTeamIds.filter((teamId) => {
        const team = trackTeams.find((item) => String(item.id) === String(teamId));
        return (
          !team?.mentorId ||
          String(team.mentorId) === String(assignMentorModal.accountId)
        );
      });

      await trackService.assignMentorTeams(
        selectedTrackId,
        assignMentorModal.accountId,
        { teamIds: assignableTeamIds },
      );
      await fetchStaff();
      setAssignMentorModal(null);
      setSelectedTrackId("");
      setTrackTeams([]);
      setMentorTeams([]);
      setSelectedTeamIds([]);
      setMentorTrackAssigned(false);
    } catch (err) {
      setMentorAssignError(
        err?.response?.data?.message || "Gán mentor cho team thất bại.",
      );
    } finally {
      setMentorAssignLoading(false);
    }
  };

  const filtered = staff.filter((s) => s.eventRole === roleFilter);

  const columns =
    roleFilter === "Mentor"
      ? [
          { key: "name", label: "Account" },
          { key: "eventRole", label: "Role" },
          // TODO: thêm cột "Team" khi có GET /api/events/{eventId}/staff trả về teamName
          { key: "team", label: "Team" },
          { key: "status", label: "Status" },
          { key: "actions", label: "Actions" },
        ]
      : [
          { key: "name", label: "Account" },
          { key: "eventRole", label: "Role" },
          { key: "judgeType", label: "Judge Type" },
          // TODO: thêm cột "Round" khi có GET /api/rounds/{id}/judges trả về roundName
          { key: "round", label: "Round" },
          { key: "status", label: "Status" },
          { key: "actions", label: "Actions" },
        ];

  return (
    <div className="space-y-4">
      {/* Filter + Create */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {["Mentor", "Judge"].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: roleFilter === r ? "#F26F21" : "#F3F4F6",
                color: roleFilter === r ? "#fff" : "#374151",
                border: `1px solid ${roleFilter === r ? "#F26F21" : "#E5E7EB"}`,
              }}
            >
              {r}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {roleFilter === "Judge" && (
            <CoordinatorActionButton
              icon={icons.Eye}
              onClick={() => {
                setRoundJudgesModal(true);
                setRoundJudges([]);
                setRoundJudgesError("");
              }}
            >
              Judges by Round
            </CoordinatorActionButton>
          )}
          <CoordinatorActionButton
            variant="primary"
            icon={icons.Plus}
            disabled={!eventId}
            onClick={() => {
              setCreateModal(true);
              setFormError("");
              setForm(EMPTY_STAFF_FORM);
            }}
          >
            Add Staff
          </CoordinatorActionButton>
        </div>
      </div>

      {!eventId && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Chưa có Event Registration hoặc Active. Không thể tải và quản lý staff.
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12 gap-2 text-sm text-slate-600">
          <Loader2
            className="w-4 h-4 animate-spin"
            style={{ color: "#F26F21" }}
          />
          Đang tải...
        </div>
      ) : apiError ? (
        <div className="flex flex-col items-center py-10 gap-3">
          <p className="text-sm text-red-500">{apiError}</p>
          <CoordinatorActionButton onClick={fetchStaff}>
            Thử lại
          </CoordinatorActionButton>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-sm text-slate-600">
          Chưa có staff nào.
        </div>
      ) : (
        <CoordinatorTable
          columns={columns}
          rows={filtered}
          renderCell={(row, key) => {
            const isActioning = actionLoading.startsWith(row.accountId);
            if (key === "name")
              return (
                <div>
                  <p className="font-bold text-slate-900">{row.username}</p>
                  <p className="text-xs text-slate-700">{row.email}</p>
                </div>
              );
            if (key === "eventRole")
              return (
                <CoordinatorBadge
                  tone={row.eventRole === "Mentor" ? "info" : "purple"}
                >
                  {row.eventRole}
                </CoordinatorBadge>
              );
            if (key === "judgeType")
              return (
                <span className="text-sm text-slate-600">
                  {normalizeJudgeTypeLabel(row.judgeType) || "—"}
                </span>
              );
            if (key === "team") {
              return renderCompactAssignmentList(
                row.assignedTeams,
                (team) => team.teamName || team.name || team.id || team.teamId,
                null,
                "Chưa gán team",
              );
            }
            if (key === "round") {
              return renderCompactAssignmentList(
                row.assignedRounds,
                (round) => round.name || round.roundName || `Round #${round.id}`,
                (round) => round.trackName || round.eventName || "",
                "Chưa gán round",
              );
            }
            if (key === "status")
              return (
                <CoordinatorBadge
                  tone={row.status === "Approved" ? "success" : "warning"}
                >
                  {row.status}
                </CoordinatorBadge>
              );
            if (key === "actions")
              return (
                <div className="flex gap-2 flex-wrap">
                  {row.eventRole === "Mentor" && (
                    <CoordinatorActionButton
                      icon={icons.Users}
                      onClick={() => openAssignMentorTeams(row)}
                    >
                      Assign Teams
                    </CoordinatorActionButton>
                  )}
                  {row.eventRole === "Judge" && (
                    <CoordinatorActionButton
                      icon={icons.Scale}
                      onClick={() => openAssignRound(row)}
                    >
                      Assign Round
                    </CoordinatorActionButton>
                  )}
                  {row.status === "Approved" ? (
                    <CoordinatorActionButton
                      variant="danger"
                      disabled={isActioning}
                      onClick={() => handleToggle(row, "deactivate")}
                    >
                      {isActioning ? "..." : "Deactivate"}
                    </CoordinatorActionButton>
                  ) : (
                    <CoordinatorActionButton
                      variant="primary"
                      disabled={isActioning}
                      onClick={() => handleToggle(row, "activate")}
                    >
                      {isActioning ? "..." : "Activate"}
                    </CoordinatorActionButton>
                  )}
                </div>
              );
            return row[key] ?? "—";
          }}
        />
      )}

      {/* Modal: Create Staff */}
      {roundJudgesModal && (
        <ModalShell
          title="Judge đã được gán theo Round"
          onClose={() => setRoundJudgesModal(false)}
          actions={<CoordinatorActionButton variant="primary" onClick={() => setRoundJudgesModal(false)}>Đóng</CoordinatorActionButton>}
        >
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none"
                placeholder="Round ID"
                value={judgeLookupRoundId}
                onChange={(event) => setJudgeLookupRoundId(event.target.value)}
              />
              <CoordinatorActionButton disabled={roundJudgesLoading} onClick={loadRoundJudges}>
                {roundJudgesLoading ? "Đang tải..." : "Tải danh sách"}
              </CoordinatorActionButton>
            </div>
            {roundJudgesError && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{roundJudgesError}</div>}
            {!roundJudgesLoading && !roundJudgesError && roundJudges.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-700">Chưa có Judge hoặc chưa chọn Round.</p>
            ) : (
              <div className="space-y-2">
                {roundJudges.map((judge) => (
                  <div key={judge.judgeId} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3">
                    <div><p className="font-bold text-slate-900">{judge.username}</p><p className="text-xs text-slate-700">{judge.email}</p></div>
                    <CoordinatorBadge tone="purple">
                      {normalizeJudgeTypeLabel(judge.judgeType) || "Judge"}
                    </CoordinatorBadge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ModalShell>
      )}

      {createModal && (
        <ModalShell
          title="Thêm Mentor / Judge"
          onClose={() => setCreateModal(false)}
          actions={
            <>
              <CoordinatorActionButton
                onClick={() => setCreateModal(false)}
                disabled={saving}
              >
                Huỷ
              </CoordinatorActionButton>
              <CoordinatorActionButton
                variant="primary"
                disabled={saving}
                onClick={handleCreate}
              >
                {saving ? "Đang lưu..." : "Thêm"}
              </CoordinatorActionButton>
            </>
          }
        >
          <div className="space-y-3">
            <FormError msg={formError} />
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">
                Username
              </label>
              <input
                className={`w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none ${getInvalidFieldClass(accountIdentityInvalid)}`}
                placeholder="username của tài khoản"
                value={form.username}
                onChange={(e) =>
                  setForm((p) => ({ ...p, username: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">
                Email
              </label>
              <input
                className={`w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none ${getInvalidFieldClass(accountIdentityInvalid)}`}
                placeholder="email của tài khoản"
                value={form.email}
                onChange={(e) =>
                  setForm((p) => ({ ...p, email: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">
                Vai trò <span className="text-orange-500">*</span>
              </label>
              <select
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
                value={form.eventRole}
                onChange={(e) =>
                  setForm((p) => ({ ...p, eventRole: e.target.value }))
                }
              >
                {EVENT_ROLE_OPTIONS.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </div>
            {form.eventRole === "Judge" && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">
                  Judge Type
                </label>
                <select
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
                  value={form.judgeType}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, judgeType: e.target.value }))
                  }
                >
                  <option value="">-- Chọn loại --</option>
                  {JUDGE_TYPE_OPTIONS.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </ModalShell>
      )}

      {/* Modal: Assign Judge to Round */}
      {assignRoundModal && (
        <ModalShell
          title={`Assign Round: ${assignRoundModal.username}`}
          onClose={() => {
            if (!saving) setAssignRoundModal(null);
          }}
          actions={
            <>
              <CoordinatorActionButton
                onClick={() => setAssignRoundModal(null)}
                disabled={saving}
              >
                Huỷ
              </CoordinatorActionButton>
              <CoordinatorActionButton
                variant="primary"
                disabled={saving || eventRoundsLoading || !roundId}
                onClick={handleAssignRound}
              >
                {saving ? "Đang assign..." : "Assign"}
              </CoordinatorActionButton>
            </>
          }
        >
          <div className="space-y-3">
            <p className="text-sm text-slate-700">
              Assign{" "}
              <strong className="text-slate-800">
                {assignRoundModal.username}
              </strong>{" "}
              vào round:
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">
                Round <span className="text-orange-500">*</span>
              </label>
              <select
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
                value={roundId}
                disabled={eventRoundsLoading || saving}
                onChange={(e) => {
                  setRoundId(e.target.value);
                  setAssignError("");
                }}
              >
                <option value="">
                  {eventRoundsLoading
                    ? "Đang tải danh sách Round..."
                    : eventRounds.length
                      ? "-- Chọn Track và Round --"
                      : "Không có Round để gán"}
                </option>
                {eventRounds.map((round) => (
                  <option key={round.id} value={round.id}>
                    {round.trackName || `Track #${round.trackId}`} - {round.name}
                  </option>
                ))}
              </select>
              {!eventRoundsLoading && eventRounds.length === 0 && !assignError && (
                <p className="mt-2 text-xs text-slate-700">
                  Event hiện tại chưa có Round phù hợp để phân công Judge.
                </p>
              )}
            </div>
            <FormError msg={assignError} />
          </div>
        </ModalShell>
      )}

      {/* Modal: Assign Mentor to Teams */}
      {assignMentorModal && (
        <ModalShell
          title={`Assign Teams: ${assignMentorModal.username}`}
          onClose={() => {
            setAssignMentorModal(null);
            setMentorAssignError("");
            setMentorTrackAssigned(false);
          }}
          actions={
            <>
              <CoordinatorActionButton
                onClick={() => setAssignMentorModal(null)}
                disabled={mentorAssignLoading}
              >
                Huỷ
              </CoordinatorActionButton>
              <CoordinatorActionButton
                variant="primary"
                disabled={
                  mentorAssignLoading ||
                  !selectedTrackId ||
                  !mentorTrackAssigned ||
                  selectedTeamIds.length === 0
                }
                onClick={handleAssignMentorTeams}
              >
                {mentorAssignLoading ? <LoadingActionText>Đang gán team</LoadingActionText> : "Gán team"}
              </CoordinatorActionButton>
            </>
          }
        >
          <div className="space-y-4">
            <FormError msg={mentorAssignError} />

            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              <div className={`rounded-xl border px-3 py-2 ${mentorTrackAssigned ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-orange-200 bg-orange-50 text-orange-700"}`}>
                1. Gán Mentor vào Track
              </div>
              <div className={`rounded-xl border px-3 py-2 ${mentorTrackAssigned ? "border-orange-200 bg-orange-50 text-orange-700" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
                2. Chọn team phụ trách
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Track <span className="text-orange-500">*</span>
              </label>
              <select
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
                value={selectedTrackId}
                onChange={(e) => handleTrackChangeForMentor(e.target.value)}
                disabled={mentorAssignLoading}
              >
                <option value="">-- Chọn track --</option>
                {tracks.map((track) => (
                  <option
                    key={track.id ?? track.trackId}
                    value={track.id ?? track.trackId}
                  >
                    {track.name ||
                      track.trackName ||
                      `Track #${track.id ?? track.trackId}`}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-600">
                Chọn Track để kiểm tra trạng thái phân công của Mentor.
              </p>
            </div>

            {selectedTrackId && mentorAssignLoading && (
              <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 py-8 text-sm text-slate-700">
                <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
                Đang kiểm tra phân công Mentor trong Track...
              </div>
            )}

            {selectedTrackId && !mentorAssignLoading && !mentorTrackAssigned && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="font-bold text-amber-900">Mentor chưa thuộc Track này</p>
                <p className="mt-1 text-sm text-amber-800">
                  Hoàn tất bước 1 trước. Sau đó hệ thống mới tải danh sách team Approved để Coordinator lựa chọn.
                </p>
                <CoordinatorActionButton
                  className="mt-3"
                  variant="primary"
                  icon={icons.GitBranch}
                  onClick={handleAssignMentorToTrack}
                >
                  {mentorAssignLoading ? <LoadingActionText>Đang gán Mentor vào Track</LoadingActionText> : "Gán Mentor vào Track"}
                </CoordinatorActionButton>
              </div>
            )}

            {selectedTrackId && mentorTrackAssigned && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      Team trong track
                    </p>
                    <p className="text-xs text-slate-600">
                      Đã chọn {selectedTeamIds.length}/{trackTeams.length} team.
                    </p>
                  </div>
                  {mentorAssignLoading && (
                    <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
                  )}
                </div>

                {mentorTeams.length > 0 && (
                  <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-700">
                    Đang phụ trách:{" "}
                    {mentorTeams
                      .map((team) => team.teamName || team.name || team.id || team.teamId)
                      .join(", ")}
                  </div>
                )}

                {trackTeams.length === 0 ? (
                  <p className="py-6 text-center text-sm text-slate-600">
                    Chưa có team Approved trong track này.
                  </p>
                ) : (
                  <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                    {trackTeams.map((team) => {
                      const teamId = String(team.id);
                      const currentMentorId = String(assignMentorModal?.accountId || "");
                      const teamMentorId = String(team.mentorId || "");
                      const assignedToCurrentMentor =
                        teamMentorId && teamMentorId === currentMentorId;
                      const assignedToOtherMentor =
                        teamMentorId && teamMentorId !== currentMentorId;
                      const checked =
                        selectedTeamIds.includes(teamId) || assignedToCurrentMentor;
                      const statusText = assignedToCurrentMentor
                        ? "Đang thuộc mentor này"
                        : assignedToOtherMentor
                          ? "Đã có mentor khác"
                          : team.university || "Chưa có trường";

                      return (
                        <button
                          key={team.id}
                          type="button"
                          onClick={() => toggleTeamSelection(team.id)}
                          disabled={mentorAssignLoading || assignedToOtherMentor}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-all disabled:cursor-not-allowed"
                          style={{
                            background: assignedToOtherMentor
                              ? "#F1F5F9"
                              : checked
                                ? "rgba(242,111,33,0.08)"
                                : "#fff",
                            border: `1px solid ${
                              assignedToOtherMentor
                                ? "#CBD5E1"
                                : checked
                                  ? "#F26F21"
                                  : "#E5E7EB"
                            }`,
                            opacity: assignedToOtherMentor ? 0.72 : 1,
                          }}
                        >
                          <span
                            className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border"
                            style={{
                              background: assignedToOtherMentor
                                ? "#E2E8F0"
                                : checked
                                  ? "#F26F21"
                                  : "#fff",
                              borderColor: assignedToOtherMentor
                                ? "#94A3B8"
                                : checked
                                  ? "#F26F21"
                                  : "#CBD5E1",
                            }}
                          >
                            {checked && <icons.CheckCircle2 className="h-3 w-3 text-white" />}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate font-semibold text-slate-800">
                              {team.teamName}
                            </span>
                            <span
                              className={`block truncate text-xs ${
                                assignedToOtherMentor
                                  ? "font-semibold text-slate-700"
                                  : assignedToCurrentMentor
                                    ? "font-semibold text-emerald-600"
                                    : "text-slate-600"
                              }`}
                            >
                              {statusText}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </ModalShell>
      )}
    </div>
  );
}

function isMentorAlreadyAssignedToTrack(err) {
  const status = err?.response?.status;
  const message = (err?.response?.data?.message || "").toLowerCase();
  const normalizedMessage = message
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");

  return (
    status === 409 ||
    normalizedMessage.includes("da duoc phan cong vao track") ||
    (normalizedMessage.includes("mentor") &&
      normalizedMessage.includes("track") &&
      normalizedMessage.includes("phan cong"))
  );
}

function isMentorMissingTrackAssignment(err) {
  const message = (err?.response?.data?.message || "").toLowerCase();
  const normalizedMessage = message
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");

  return (
    normalizedMessage.includes("chua duoc phan cong vao track") ||
    normalizedMessage.includes("chua duoc assign vao track") ||
    (normalizedMessage.includes("mentor") &&
      normalizedMessage.includes("track") &&
      (normalizedMessage.includes("chua") ||
        normalizedMessage.includes("not assigned") ||
        normalizedMessage.includes("not found")))
  );
}

// ---------------------------------------------------------------------------
// Main: AccountsManagement
// ---------------------------------------------------------------------------
export function AccountsManagement() {
  return (
    <CoordinatorPanel
      title="Staff Management"
      subtitle="Manage Mentors and Judges for this event"
      icon={icons.Handshake}
    >
      <StaffTab />
    </CoordinatorPanel>
  );
}
