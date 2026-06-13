import { useState, useEffect, useCallback } from "react";
import {
  CoordinatorActionButton,
  CoordinatorBadge,
  CoordinatorPanel,
  CoordinatorTable,
  ModalShell,
  icons,
} from "../CoordinatorUI";
import { AlertCircle, Loader2 } from "lucide-react";
import staffService from "../../../services/staffService";
import { useSelector } from "react-redux";

// ---------------------------------------------------------------------------
const TABS = ["Participants", "Mentors & Judges"];
const EVENT_ROLE_OPTIONS = ["Mentor", "Judge"];
// TODO: confirm judgeType options với BE
const JUDGE_TYPE_OPTIONS = ["Chuyên môn", "Doanh nghiệp", "Học thuật"];

const EMPTY_STAFF_FORM = {
  username: "",
  email: "",
  eventRole: "Mentor",
  judgeType: "",
};

function FormError({ msg }) {
  if (!msg) return null;
  return (
    <div
      className="flex items-center gap-2 p-3 rounded-xl text-sm"
      style={{
        background: "rgba(239,68,68,0.06)",
        border: "1px solid rgba(239,68,68,0.2)",
        color: "#dc2626",
      }}
    >
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
      {msg}
    </div>
  );
}

// ---------------------------------------------------------------------------
// TAB 1: Participants — mock data tạm, update sau khi có API
// ---------------------------------------------------------------------------
const MOCK_PARTICIPANTS = [
  {
    id: "u1",
    name: "Nguyen Van A",
    email: "a@fpt.edu.vn",
    team: "Team Nova",
    status: "Pending",
    submittedAt: "Jun 1, 09:00",
  },
  {
    id: "u2",
    name: "Tran Thi B",
    email: "b@fpt.edu.vn",
    team: "Byte Builders",
    status: "Approved",
    submittedAt: "Jun 1, 10:00",
  },
];

function ParticipantsTab() {
  const [rejecting, setRejecting] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const columns = [
    { key: "name", label: "Leader" },
    { key: "team", label: "Team" },
    { key: "status", label: "Status" },
    { key: "submittedAt", label: "Submitted" },
    { key: "actions", label: "Actions" },
  ];

  return (
    <div className="space-y-4">
      {/* TODO: thay MOCK_PARTICIPANTS bằng GET /api/Auth/pending khi có endpoint */}
      <div
        className="flex items-center gap-2 p-3 rounded-xl text-xs"
        style={{
          background: "rgba(234,179,8,0.06)",
          border: "1px solid rgba(234,179,8,0.2)",
          color: "#92400e",
        }}
      >
        <icons.Clock
          className="w-3.5 h-3.5 flex-shrink-0"
          style={{ color: "#F26F21" }}
        />
        Đang dùng mock data. Sẽ kết nối API sau khi BE cung cấp endpoint lấy
        danh sách participants.
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <div className="relative md:col-span-2">
          <icons.Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none"
            placeholder="Search leaders"
          />
        </div>
        <select className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none">
          <option>All statuses</option>
          <option>Pending</option>
          <option>Approved</option>
          <option>Rejected</option>
        </select>
      </div>

      <CoordinatorTable
        columns={columns}
        rows={MOCK_PARTICIPANTS}
        renderCell={(row, key) => {
          if (key === "name")
            return (
              <div>
                <p className="font-bold text-slate-900">{row.name}</p>
                <p className="text-xs text-slate-500">{row.email}</p>
              </div>
            );
          if (key === "status")
            return (
              <CoordinatorBadge
                tone={
                  row.status === "Approved"
                    ? "success"
                    : row.status === "Rejected"
                      ? "danger"
                      : "warning"
                }
              >
                {row.status}
              </CoordinatorBadge>
            );
          if (key === "actions")
            return (
              <div className="flex gap-2">
                {row.status === "Pending" && (
                  <>
                    <CoordinatorActionButton
                      variant="primary"
                      icon={icons.CheckCircle2}
                    >
                      Approve
                    </CoordinatorActionButton>
                    <CoordinatorActionButton
                      variant="danger"
                      icon={icons.X}
                      onClick={() => setRejecting(row)}
                    >
                      Reject
                    </CoordinatorActionButton>
                  </>
                )}
              </div>
            );
          return row[key] ?? "—";
        }}
      />

      {rejecting && (
        <ModalShell
          title={`Reject: ${rejecting.name}?`}
          onClose={() => setRejecting(null)}
          actions={
            <>
              <CoordinatorActionButton onClick={() => setRejecting(null)}>
                Huỷ
              </CoordinatorActionButton>
              <CoordinatorActionButton
                variant="danger"
                onClick={() => setRejecting(null)}
              >
                Xác nhận Reject
              </CoordinatorActionButton>
            </>
          }
        >
          <textarea
            className="min-h-24 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
            placeholder="Lý do reject"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </ModalShell>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// TAB 2: Mentors & Judges
// ---------------------------------------------------------------------------
function StaffTab() {
  const eventId = useSelector((s) => s.event.activeEventId) || 1;

  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [roleFilter, setRoleFilter] = useState("Mentor");

  const [createModal, setCreateModal] = useState(false);
  const [form, setForm] = useState(EMPTY_STAFF_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState("");

  // Assign judge to round modal
  const [assignRoundModal, setAssignRoundModal] = useState(null); // staff object
  const [roundId, setRoundId] = useState("");
  const [assignError, setAssignError] = useState("");

  // ---------------------------------------------------------------------------
  const fetchStaff = useCallback(async () => {
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
            ? form.judgeType.trim() || undefined
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
    if (!roundId.trim()) {
      setAssignError("Vui lòng nhập Round ID.");
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
        <CoordinatorActionButton
          variant="primary"
          icon={icons.Plus}
          onClick={() => {
            setCreateModal(true);
            setFormError("");
            setForm(EMPTY_STAFF_FORM);
          }}
        >
          Add Staff
        </CoordinatorActionButton>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 gap-2 text-sm text-slate-400">
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
        <div className="py-12 text-center text-sm text-slate-400">
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
                  <p className="text-xs text-slate-500">{row.email}</p>
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
                  {row.judgeType || "—"}
                </span>
              );
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
                  {row.eventRole === "Judge" && (
                    <CoordinatorActionButton
                      icon={icons.Scale}
                      onClick={() => {
                        setAssignRoundModal(row);
                        setRoundId("");
                        setAssignError("");
                      }}
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
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
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
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
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
          onClose={() => setAssignRoundModal(null)}
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
                disabled={saving || !roundId}
                onClick={handleAssignRound}
              >
                {saving ? "Đang assign..." : "Assign"}
              </CoordinatorActionButton>
            </>
          }
        >
          <div className="space-y-3">
            <p className="text-sm text-slate-500">
              Assign{" "}
              <strong className="text-slate-800">
                {assignRoundModal.username}
              </strong>{" "}
              vào round:
            </p>
            {/* TODO: thay input bằng dropdown khi có GET /api/tracks/rounds */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">
                Round ID <span className="text-orange-500">*</span>
              </label>
              <input
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
                placeholder="Nhập Round ID"
                value={roundId}
                onChange={(e) => {
                  setRoundId(e.target.value);
                  setAssignError("");
                }}
              />
            </div>
            <FormError msg={assignError} />
          </div>
        </ModalShell>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main: AccountsManagement
// ---------------------------------------------------------------------------
export function AccountsManagement() {
  const [activeTab, setActiveTab] = useState("Mentors & Judges");

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex gap-2 border-b" style={{ borderColor: "#E5E7EB" }}>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-4 py-2.5 text-sm font-semibold transition-all duration-150 border-b-2 -mb-px"
            style={{
              borderColor: activeTab === tab ? "#F26F21" : "transparent",
              color: activeTab === tab ? "#F26F21" : "#64748B",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <CoordinatorPanel
        title={
          activeTab === "Participants"
            ? "Participant Approvals"
            : "Staff Management"
        }
        subtitle={
          activeTab === "Participants"
            ? "Review and approve leader registrations"
            : "Manage Mentors and Judges for this event"
        }
        icon={activeTab === "Participants" ? icons.UserCheck : icons.Handshake}
      >
        {activeTab === "Participants" ? <ParticipantsTab /> : <StaffTab />}
      </CoordinatorPanel>
    </div>
  );
}
