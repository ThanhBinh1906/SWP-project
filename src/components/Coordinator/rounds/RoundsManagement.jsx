import { useState, useEffect, useCallback } from "react";
import {
  CoordinatorActionButton,
  CoordinatorBadge,
  CoordinatorPanel,
  CoordinatorProgressBar,
  ModalShell,
  icons,
} from "../CoordinatorUI";
import eventService from "../../../services/eventService";
import trackService from "../../../services/trackService";
import roundService from "../../../services/roundService";
import {
  FormError,
  LoadingState,
  ApiErrorState,
  formatDateTime,
  toDatetimeLocal,
  fromDatetimeLocal,
  getApiMessage,
} from "../coordinatorHelpers";

const ROUND_STATUSES = ["Upcoming", "Active", "Scoring", "Closed"];

const statusTone = (s) =>
  s === "Active"
    ? "orange"
    : s === "Scoring"
      ? "purple"
      : s === "Closed"
        ? "success"
        : "neutral";

const EMPTY_FORM = {
  name: "",
  orderIndex: 1,
  startTime: "",
  endTime: "",
  advancingSlots: 8,
  status: "Upcoming",
};

export function RoundsManagement() {
  const [events, setEvents] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [selectedTrackId, setSelectedTrackId] = useState("");
  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const [modal, setModal] = useState(null);
  const [selectedRound, setSelectedRound] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    eventService
      .getAll()
      .then((res) => {
        const list = res.data?.data || [];
        setEvents(list);
        if (list.length > 0) setSelectedEventId(String(list[0].id));
      })
      .catch(() => setApiError("Không thể tải sự kiện."));
  }, []);

  useEffect(() => {
    if (!selectedEventId) return;
    trackService
      .getByEvent(selectedEventId)
      .then((res) => {
        const list = res.data?.data || [];
        setTracks(list);
        setSelectedTrackId(list.length > 0 ? String(list[0].id) : "");
      })
      .catch(() => setApiError("Không thể tải tracks."));
  }, [selectedEventId]);

  const fetchRounds = useCallback(async () => {
    if (!selectedTrackId) {
      setRounds([]);
      return;
    }
    setLoading(true);
    setApiError("");
    try {
      const res = await roundService.getByTrack(selectedTrackId);
      const list = (res.data?.data || []).sort(
        (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0),
      );
      setRounds(list);
    } catch (err) {
      setApiError(getApiMessage(err, "Không thể tải vòng thi."));
    } finally {
      setLoading(false);
    }
  }, [selectedTrackId]);

  useEffect(() => {
    fetchRounds();
  }, [fetchRounds]);

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, orderIndex: rounds.length + 1 });
    setFormError("");
    setModal("create");
  };

  const openEdit = (round) => {
    setSelectedRound(round);
    setForm({
      name: round.name,
      orderIndex: round.orderIndex ?? 1,
      startTime: toDatetimeLocal(round.startTime),
      endTime: toDatetimeLocal(round.endTime),
      advancingSlots: round.advancingSlots ?? 8,
      status: round.status || "Upcoming",
    });
    setFormError("");
    setModal("edit");
  };

  const closeModal = () => {
    setModal(null);
    setSelectedRound(null);
    setFormError("");
  };

  const validateForm = () => {
    if (!form.name.trim()) return "Tên vòng không được để trống.";
    if (!form.startTime) return "Chọn thời gian bắt đầu.";
    if (!form.endTime) return "Chọn thời gian kết thúc.";
    if (form.endTime <= form.startTime)
      return "Thời gian kết thúc phải sau bắt đầu.";
    return "";
  };

  const buildPayload = () => ({
    trackId: Number(selectedTrackId),
    name: form.name.trim(),
    orderIndex: Number(form.orderIndex),
    startTime: fromDatetimeLocal(form.startTime),
    endTime: fromDatetimeLocal(form.endTime),
    advancingSlots: Number(form.advancingSlots),
    status: form.status,
  });

  const handleCreate = async () => {
    const err = validateForm();
    if (err) {
      setFormError(err);
      return;
    }
    setSaving(true);
    try {
      await roundService.create(buildPayload());
      await fetchRounds();
      closeModal();
    } catch (err) {
      setFormError(getApiMessage(err, "Tạo vòng thất bại."));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    const err = validateForm();
    if (err) {
      setFormError(err);
      return;
    }
    setSaving(true);
    try {
      const { trackId, ...payload } = buildPayload();
      await roundService.update(selectedRound.id, payload);
      if (form.status !== selectedRound.status) {
        await roundService.updateStatus(selectedRound.id, form.status);
      }
      await fetchRounds();
      closeModal();
    } catch (err) {
      setFormError(getApiMessage(err, "Cập nhật vòng thất bại."));
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (round, status) => {
    try {
      await roundService.updateStatus(round.id, status);
      await fetchRounds();
    } catch (err) {
      setApiError(getApiMessage(err, "Đổi trạng thái thất bại."));
    }
  };

  return (
    <div className="space-y-6">
      <CoordinatorPanel
        title="Round filters"
        subtitle="Chọn event và track để quản lý vòng thi"
        icon={icons.Filter}
        actions={
          <CoordinatorActionButton
            variant="primary"
            icon={icons.Plus}
            onClick={openCreate}
            disabled={!selectedTrackId}
          >
            Create Round
          </CoordinatorActionButton>
        }
      >
        <div className="grid gap-3 md:grid-cols-2">
          <select
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
          >
            <option value="">Chọn sự kiện</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.name}
              </option>
            ))}
          </select>
          <select
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
            value={selectedTrackId}
            onChange={(e) => setSelectedTrackId(e.target.value)}
          >
            <option value="">Chọn track</option>
            {tracks.map((tr) => (
              <option key={tr.id} value={tr.id}>
                {tr.name}
              </option>
            ))}
          </select>
        </div>
      </CoordinatorPanel>

      <CoordinatorPanel
        title="Round timeline"
        subtitle="Configure timing, status, and advancement slots"
        icon={icons.Timer}
      >
        {loading ? (
          <LoadingState />
        ) : apiError ? (
          <ApiErrorState message={apiError} onRetry={fetchRounds} />
        ) : rounds.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-400">
            Chưa có vòng thi nào.
          </p>
        ) : (
          <div className="space-y-5">
            {rounds.map((round, index) => (
              <div
                key={round.id}
                className="grid gap-4 rounded-2xl border border-slate-100 p-4 lg:grid-cols-[auto_1fr_220px_auto]"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white"
                    style={{
                      background:
                        round.status === "Active" ? "#F26F21" : "#94A3B8",
                    }}
                  >
                    {round.orderIndex ?? index + 1}
                  </div>
                  <CoordinatorBadge tone={statusTone(round.status)}>
                    {round.status}
                  </CoordinatorBadge>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{round.name}</h3>
                  <p className="text-sm text-slate-500">
                    {formatDateTime(round.startTime)} →{" "}
                    {formatDateTime(round.endTime)}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Advancing slots:{" "}
                    <span className="font-bold text-slate-800">
                      {round.advancingSlots}
                    </span>
                  </p>
                </div>
                <CoordinatorProgressBar
                  label="Progress"
                  value={round.status === "Closed" ? 100 : round.status === "Active" ? 50 : 0}
                  color={round.status === "Active" ? "#F26F21" : "#64748B"}
                />
                <div className="flex flex-col gap-2">
                  <CoordinatorActionButton
                    icon={icons.Edit3}
                    onClick={() => openEdit(round)}
                  >
                    Edit
                  </CoordinatorActionButton>
                  <select
                    className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs outline-none"
                    value={round.status}
                    onChange={(e) => handleStatusChange(round, e.target.value)}
                  >
                    {ROUND_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </CoordinatorPanel>

      {(modal === "create" || modal === "edit") && (
        <ModalShell
          title={
            modal === "create"
              ? "Tạo vòng thi"
              : `Sửa vòng: ${selectedRound?.name}`
          }
          onClose={closeModal}
          actions={
            <>
              <CoordinatorActionButton onClick={closeModal} disabled={saving}>
                Huỷ
              </CoordinatorActionButton>
              <CoordinatorActionButton
                variant="primary"
                disabled={saving}
                onClick={modal === "create" ? handleCreate : handleEdit}
              >
                {saving ? "Đang lưu..." : "Lưu"}
              </CoordinatorActionButton>
            </>
          }
        >
          <div className="space-y-3">
            <FormError msg={formError} />
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
              placeholder="Tên vòng *"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                type="number"
                min={1}
                className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
                placeholder="Thứ tự (orderIndex)"
                value={form.orderIndex}
                onChange={(e) =>
                  setForm((p) => ({ ...p, orderIndex: e.target.value }))
                }
              />
              <input
                type="number"
                min={0}
                className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
                placeholder="Advancing slots"
                value={form.advancingSlots}
                onChange={(e) =>
                  setForm((p) => ({ ...p, advancingSlots: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs text-slate-500">Bắt đầu *</label>
                <input
                  type="datetime-local"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
                  value={form.startTime}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, startTime: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Kết thúc *</label>
                <input
                  type="datetime-local"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
                  value={form.endTime}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, endTime: e.target.value }))
                  }
                />
              </div>
            </div>
            <select
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
              value={form.status}
              onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
            >
              {ROUND_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </ModalShell>
      )}
    </div>
  );
}
