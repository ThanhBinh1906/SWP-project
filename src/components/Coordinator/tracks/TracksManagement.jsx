import { useState, useEffect, useCallback } from "react";
import {
  CoordinatorActionButton,
  CoordinatorPanel,
  CoordinatorProgressBar,
  CoordinatorTable,
  ModalShell,
  icons,
} from "../CoordinatorUI";
import eventService from "../../../services/eventService";
import trackService from "../../../services/trackService";
import {
  FormError,
  LoadingState,
  ApiErrorState,
  getApiMessage,
} from "../coordinatorHelpers";

const EMPTY_FORM = {
  name: "",
  description: "",
  maxTeams: 20,
};

export function TracksManagement() {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  const [modal, setModal] = useState(null);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await eventService.getAll();
      const list = res.data?.data || [];
      setEvents(list);
      if (list.length > 0) {
        setSelectedEventId((prev) => prev || String(list[0].id));
      }
    } catch (err) {
      setApiError(getApiMessage(err, "Không thể tải danh sách sự kiện."));
    }
  }, []);

  const fetchTracks = useCallback(async () => {
    if (!selectedEventId) {
      setTracks([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setApiError("");
    try {
      const res = await trackService.getByEvent(selectedEventId);
      setTracks(res.data?.data || []);
    } catch (err) {
      setApiError(getApiMessage(err, "Không thể tải danh sách track."));
    } finally {
      setLoading(false);
    }
  }, [selectedEventId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    fetchTracks();
  }, [fetchTracks]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setFormError("");
    setModal("create");
  };

  const openEdit = (track) => {
    setSelectedTrack(track);
    setForm({
      name: track.name,
      description: track.description || "",
      maxTeams: track.maxTeams ?? 20,
    });
    setFormError("");
    setModal("edit");
  };

  const closeModal = () => {
    setModal(null);
    setSelectedTrack(null);
    setFormError("");
  };

  const validateForm = () => {
    if (!form.name.trim()) return "Tên track không được để trống.";
    if (!form.maxTeams || form.maxTeams < 1) return "maxTeams phải >= 1.";
    return "";
  };

  const handleCreate = async () => {
    const err = validateForm();
    if (err) {
      setFormError(err);
      return;
    }
    setSaving(true);
    try {
      await trackService.create({
        eventId: Number(selectedEventId),
        name: form.name.trim(),
        description: form.description.trim() || null,
        maxTeams: Number(form.maxTeams),
      });
      await fetchTracks();
      closeModal();
    } catch (err) {
      setFormError(getApiMessage(err, "Tạo track thất bại."));
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
      await trackService.update(selectedTrack.id, {
        name: form.name.trim(),
        description: form.description.trim() || null,
        maxTeams: Number(form.maxTeams),
      });
      await fetchTracks();
      closeModal();
    } catch (err) {
      setFormError(getApiMessage(err, "Cập nhật track thất bại."));
    } finally {
      setSaving(false);
    }
  };

  const selectedEvent = events.find((e) => String(e.id) === selectedEventId);

  const columns = [
    { key: "name", label: "Track" },
    { key: "maxTeams", label: "Max teams" },
    { key: "actions", label: "Actions" },
  ];

  const renderCell = (row, key) => {
    if (key === "name")
      return (
        <div>
          <p className="font-bold text-slate-900">{row.name}</p>
          <p className="text-xs text-slate-500">{row.description || "—"}</p>
        </div>
      );
    if (key === "maxTeams") return row.maxTeams ?? "—";
    if (key === "actions")
      return (
        <CoordinatorActionButton icon={icons.Edit3} onClick={() => openEdit(row)}>
          Edit
        </CoordinatorActionButton>
      );
    return row[key] ?? "—";
  };

  return (
    <div className="space-y-6">
      <CoordinatorPanel
        title="Track controls"
        subtitle="Chọn sự kiện và quản lý hạng mục thi"
        icon={icons.Filter}
        actions={
          <CoordinatorActionButton
            variant="primary"
            icon={icons.Plus}
            onClick={openCreate}
            disabled={!selectedEventId}
          >
            Add Track
          </CoordinatorActionButton>
        }
      >
        <select
          className="w-full max-w-md rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-600 outline-none"
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
      </CoordinatorPanel>

      {tracks.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {tracks.map((track) => (
            <div
              key={track.id}
              className="rounded-2xl border bg-white p-5"
              style={{
                borderColor: "#E5E7EB",
                boxShadow: "0 10px 30px rgba(0,0,0,0.02)",
              }}
            >
              <div className="mb-4">
                <h3 className="font-bold text-slate-900">{track.name}</h3>
                <p className="text-sm text-slate-500">
                  {selectedEvent?.name || `Event #${track.eventId}`}
                </p>
              </div>
              <CoordinatorProgressBar
                label={`Max ${track.maxTeams} teams`}
                value={0}
              />
            </div>
          ))}
        </div>
      )}

      <CoordinatorPanel
        title="Track detail panel"
        subtitle="Capacity, event association, and CRUD controls"
        icon={icons.GitBranch}
      >
        {loading ? (
          <LoadingState />
        ) : apiError ? (
          <ApiErrorState message={apiError} onRetry={fetchTracks} />
        ) : tracks.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-400">
            Chưa có track nào cho sự kiện này.
          </p>
        ) : (
          <CoordinatorTable
            columns={columns}
            rows={tracks}
            renderCell={renderCell}
          />
        )}
      </CoordinatorPanel>

      {(modal === "create" || modal === "edit") && (
        <ModalShell
          title={modal === "create" ? "Tạo track mới" : `Sửa: ${selectedTrack?.name}`}
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
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">
                Tên track *
              </label>
              <input
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">
                Mô tả
              </label>
              <textarea
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none min-h-20"
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">
                Số đội tối đa *
              </label>
              <input
                type="number"
                min={1}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
                value={form.maxTeams}
                onChange={(e) =>
                  setForm((p) => ({ ...p, maxTeams: e.target.value }))
                }
              />
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  );
}
