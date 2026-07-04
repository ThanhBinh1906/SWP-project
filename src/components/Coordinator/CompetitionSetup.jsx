import { useState, useEffect, useCallback, useRef } from "react";
import {
  CoordinatorActionButton,
  CoordinatorBadge,
  CoordinatorPanel,
  CoordinatorProgressBar,
  ModalShell,
  icons,
} from "./CoordinatorUI";
import {
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Copy,
  Crown,
  FileSpreadsheet,
  ImageIcon,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import eventService from "../../services/eventService";
import {
  uploadEventBannerImage,
  validateEventBannerImage,
} from "../../services/cloudinaryService";
import { CloneCompetitionModal } from "./competition/CloneCompetitionModal";
import { CompetitionExcelImportModal } from "./competition/CompetitionExcelImportModal";
import { CompetitionTemplateModal } from "./competition/CompetitionTemplateModal";
import { DemoDataImportModal } from "./competition/DemoDataImportModal";
import RichTextEditor from "../shared/RichTextEditor";

// ---------------------------------------------------------------------------
// Constants & helpers (preserved from originals)
// ---------------------------------------------------------------------------
const EVENT_STATUS_OPTIONS = ["Registration", "Active", "Completed"];
const EVENT_STATUS_ORDER = {
  Registration: 0,
  Active: 1,
  Completed: 2,
};
const ROUND_STATUS_OPTIONS = ["Upcoming", "Active", "Scoring", "Closed"];
const isEventActive = (status) => status === "Active";
const isRoundAfterUpcoming = (status) =>
  ["Active", "Scoring", "Closed"].includes(status);
const getEventStatusOrder = (status) => EVENT_STATUS_ORDER[status] ?? 0;
const isEventStatusRollback = (fromStatus, toStatus) =>
  getEventStatusOrder(toStatus) < getEventStatusOrder(fromStatus);

const eventStatusTone = (s) =>
  s === "Active" || s === "Ongoing"
    ? "success"
    : s === "Registration" || s === "Open"
      ? "orange"
      : s === "Completed"
        ? "neutral"
        : "neutral";

const roundStatusTone = (s) =>
  s === "Active"
    ? "orange"
    : s === "Scoring"
      ? "purple"
      : s === "Closed" || s === "Completed"
        ? "success"
        : "neutral";

function isRoundClosed(status) {
  return status === "Closed" || status === "Completed";
}

function getRoundOrder(round, fallbackIndex) {
  const order = Number(round?.orderIndex ?? round?.order ?? round?.sequence);
  return Number.isFinite(order) && order > 0 ? order : fallbackIndex + 1;
}

function getBlockingPreviousRound(rounds, currentRound) {
  const currentIndex = rounds.findIndex(
    (round) => String(round.roundId) === String(currentRound?.roundId),
  );
  if (currentIndex <= 0) return null;

  const currentOrder = getRoundOrder(currentRound, currentIndex);
  return rounds.find((round, index) => {
    if (String(round.roundId) === String(currentRound?.roundId)) return false;
    const roundOrder = getRoundOrder(round, index);
    return roundOrder < currentOrder && !isRoundClosed(round.status);
  });
}

function getEffectiveRoundStatus(rounds, round) {
  if (round?.status === "Active" && getBlockingPreviousRound(rounds, round)) {
    return "Upcoming";
  }
  return round?.status;
}

function isFinalTrack(track) {
  const name = String(track?.name || "").toLowerCase();
  return (
    Boolean(track?.isFinal) ||
    Boolean(track?.isFinalTrack) ||
    name.includes("final") ||
    name.includes("chung ket") ||
    name.includes("chung kết")
  );
}

function sortTracksWithFinalLast(tracks = []) {
  return [...tracks].sort((a, b) => {
    const aFinal = isFinalTrack(a);
    const bFinal = isFinalTrack(b);
    if (aFinal === bFinal) return 0;
    return aFinal ? 1 : -1;
  });
}

function getTrackCurrentTeamCount(track) {
  return (
    track?.currentTeamCount ??
    track?.currentTeams ??
    track?.teamCount ??
    track?.registeredTeamCount ??
    0
  );
}

function isTrackCreateLocked(event) {
  return ["Active", "Scoring", "Completed", "Closed"].includes(event?.status);
}

const EVENT_EMPTY = {
  name: "",
  description: "",
  bannerUrl: "",
  bannerFile: null,
  location: "",
  isOnline: false,
  startDate: "",
  endDate: "",
  status: "Registration",
};
const TRACK_EMPTY = { name: "", description: "", maxTeams: "", eventId: "" };
const ROUND_EMPTY = {
  trackId: "",
  name: "",
  startTime: "",
  endTime: "",
  advancingSlots: "",
};

function formatDate(iso) {
  if (!iso) return "—";
  return iso.split("T")[0];
}

function formatDateTime(iso) {
  if (!iso) return "—";
  return iso.replace("T", " ").slice(0, 16);
}

function stripHtml(value = "") {
  return String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function compactText(value = "", maxLength = 120) {
  const text = stripHtml(value);
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}...`;
}

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

function EventBannerPicker({ file, url, disabled, onFileChange, onUrlChange }) {
  const inputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(url || "");

  useEffect(() => {
    if (!file) {
      setPreviewUrl(url || "");
      return undefined;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file, url]);

  const clearBanner = () => {
    onFileChange(null);
    onUrlChange("");
  };

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Event banner preview"
            className="h-44 w-full object-cover"
          />
        ) : (
          <div className="flex h-44 flex-col items-center justify-center gap-2 text-slate-500">
            <ImageIcon className="h-8 w-8 text-slate-400" />
            <p className="text-sm font-semibold">Chưa có ảnh banner</p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          disabled={disabled}
          onChange={(event) => {
            onFileChange(event.target.files?.[0] || null);
            event.target.value = "";
          }}
        />
        <CoordinatorActionButton
          icon={Upload}
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          Chọn ảnh
        </CoordinatorActionButton>
        {(file || url) && (
          <CoordinatorActionButton
            icon={X}
            disabled={disabled}
            onClick={clearBanner}
          >
            Xóa ảnh
          </CoordinatorActionButton>
        )}
      </div>

      <p className="text-xs leading-relaxed text-slate-500">
        Hỗ trợ JPG, PNG, WEBP hoặc GIF, tối đa 5MB. Ảnh sẽ được tải lên Cloudinary khi lưu thay đổi.
      </p>
      {file && (
        <p className="truncate rounded-xl bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-700">
          Đã chọn: {file.name}
        </p>
      )}
    </div>
  );
}

function getCreatedEntityId(response) {
  const data = response?.data?.data;
  return data?.id ?? data?.trackId ?? response?.data?.id ?? null;
}

// ---------------------------------------------------------------------------
// CompetitionSetup — unified 3-level accordion: Event → Track → Round
// ---------------------------------------------------------------------------
export function CompetitionSetup() {
  const [cloneSourceEvent, setCloneSourceEvent] = useState(null);
  const [structureModalOpen, setStructureModalOpen] = useState(false);
  const [excelImportOpen, setExcelImportOpen] = useState(false);
  const [demoImportOpen, setDemoImportOpen] = useState(false);
  // === EVENTS ===
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState("");

  // === ACCORDION ===
  const [expandedEvents, setExpandedEvents] = useState(new Set());
  const [expandedTracks, setExpandedTracks] = useState(new Set());

  // === TRACKS (per event, lazy) ===
  const [tracksByEvent, setTracksByEvent] = useState({});
  // shape: { [eventId]: { data: [], loading: bool, error: "" } }

  // === ROUNDS (per track, lazy) ===
  const [roundsByTrack, setRoundsByTrack] = useState({});
  // shape: { [trackId]: { data: [], loading: bool, error: "" } }

  // === EVENT MODAL ===
  const [eventModal, setEventModal] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventForm, setEventForm] = useState(EVENT_EMPTY);
  const [eventFormError, setEventFormError] = useState("");
  const [eventSaving, setEventSaving] = useState(false);

  // === TRACK MODAL ===
  const [trackModal, setTrackModal] = useState(null);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [trackForm, setTrackForm] = useState(TRACK_EMPTY);
  const [trackFormError, setTrackFormError] = useState("");
  const [trackSaving, setTrackSaving] = useState(false);

  // === ROUND MODAL ===
  const [roundModal, setRoundModal] = useState(null);
  const [selectedRound, setSelectedRound] = useState(null);
  const [roundForm, setRoundForm] = useState(ROUND_EMPTY);
  const [roundFormError, setRoundFormError] = useState("");
  const [roundSaving, setRoundSaving] = useState(false);
  const [roundStatusValue, setRoundStatusValue] = useState("");
  const [roundStatusNotice, setRoundStatusNotice] = useState("");

  // =========================================================================
  // FETCH — same API endpoints as originals
  // =========================================================================
  const fetchEvents = useCallback(async () => {
    setEventsLoading(true);
    setEventsError("");
    try {
      const res = await eventService.getAll();
      setEvents(res.data?.data || []);
    } catch (err) {
      setEventsError(
        err?.response?.data?.message || "Không thể tải danh sách sự kiện.",
      );
    } finally {
      setEventsLoading(false);
    }
  }, []);

  const closeCloneModal = async () => {
    setCloneSourceEvent(null);
    await fetchEvents();
  };

  const completeClone = async () => {
    await fetchEvents();
  };

  const fetchTracksForEvent = useCallback(async (eventId) => {
    setTracksByEvent((prev) => ({
      ...prev,
      [eventId]: { data: [], loading: true, error: "" },
    }));
    try {
      const res = await eventService.getTracks(eventId);
      setTracksByEvent((prev) => ({
        ...prev,
        [eventId]: {
          data: sortTracksWithFinalLast(res.data?.data || []),
          loading: false,
          error: "",
        },
      }));
    } catch (err) {
      setTracksByEvent((prev) => ({
        ...prev,
        [eventId]: {
          data: [],
          loading: false,
          error:
            err?.response?.data?.message || "Không thể tải danh sách track.",
        },
      }));
    }
  }, []);

  const fetchRoundsForTrack = useCallback(async (trackId) => {
    setRoundsByTrack((prev) => ({
      ...prev,
      [trackId]: { data: [], loading: true, error: "" },
    }));
    try {
      const res = await eventService.getTracksRounds();
      const allTracks = res.data?.data || [];
      const match = allTracks.find(
        (t) => String(t.trackId) === String(trackId),
      );
      setRoundsByTrack((prev) => ({
        ...prev,
        [trackId]: { data: match?.rounds || [], loading: false, error: "" },
      }));
    } catch (err) {
      setRoundsByTrack((prev) => ({
        ...prev,
        [trackId]: {
          data: [],
          loading: false,
          error:
            err?.response?.data?.message || "Không thể tải danh sách rounds.",
        },
      }));
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // =========================================================================
  // ACCORDION TOGGLE — lazy-loads children on first expand
  // =========================================================================
  const toggleEvent = (eventId) => {
    setExpandedEvents((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
        if (!tracksByEvent[eventId]) fetchTracksForEvent(eventId);
      }
      return next;
    });
  };

  const toggleTrack = (trackId) => {
    setExpandedTracks((prev) => {
      const next = new Set(prev);
      if (next.has(trackId)) {
        next.delete(trackId);
      } else {
        next.add(trackId);
        if (!roundsByTrack[trackId]) fetchRoundsForTrack(trackId);
      }
      return next;
    });
  };

  // =========================================================================
  // EVENT HANDLERS (preserved from EventsManagement)
  // =========================================================================
  const openEditEvent = (ev) => {
    setSelectedEvent(ev);
    setEventForm({
      name: ev.name,
      description: ev.description || "",
      bannerUrl: ev.bannerUrl || "",
      bannerFile: null,
      location: ev.location || "",
      isOnline: Boolean(ev.isOnline),
      startDate: formatDate(ev.startDate),
      endDate: formatDate(ev.endDate),
      status: ev.status,
    });
    setEventFormError("");
    setEventModal("edit");
  };
  const openDeleteEvent = (ev) => {
    setSelectedEvent(ev);
    setEventFormError("");
    setEventModal("delete");
  };
  const closeEventModal = () => {
    setEventModal(null);
    setSelectedEvent(null);
    setEventFormError("");
  };

  const handleEventFormChange = (field, value) => {
    setEventForm((p) => ({ ...p, [field]: value }));
    setEventFormError("");
  };

  const validateEventForm = () => {
    if (!eventForm.name.trim()) return "Tên sự kiện không được để trống.";
    if (!eventForm.startDate) return "Vui lòng chọn ngày bắt đầu.";
    if (!eventForm.endDate) return "Vui lòng chọn ngày kết thúc.";
    if (eventForm.endDate < eventForm.startDate)
      return "Ngày kết thúc phải sau ngày bắt đầu.";
    return "";
  };

  // EDIT event
  const handleEditEvent = async () => {
    const err = validateEventForm();
    if (err) {
      setEventFormError(err);
      return;
    }
    const bannerError = validateEventBannerImage(eventForm.bannerFile);
    if (bannerError) {
      setEventFormError(`Ảnh banner: ${bannerError}`);
      return;
    }
    if (isEventStatusRollback(selectedEvent?.status, eventForm.status)) {
      setEventFormError(
        `Không thể chuyển Event từ ${selectedEvent?.status} về ${eventForm.status}. Trạng thái Event chỉ được đi tới, không được quay lại.`,
      );
      return;
    }
    setEventSaving(true);
    try {
      let bannerUrl = eventForm.bannerUrl?.trim() || null;
      if (eventForm.bannerFile) {
        const upload = await uploadEventBannerImage(eventForm.bannerFile);
        bannerUrl = upload.secure_url;
      }

      await eventService.update(selectedEvent.id, {
        name: eventForm.name.trim(),
        description: eventForm.description.trim(),
        bannerUrl,
        location: eventForm.location?.trim() || null,
        isOnline: Boolean(eventForm.isOnline),
        startDate: eventForm.startDate,
        endDate: eventForm.endDate,
        status: eventForm.status,
      });
      await fetchEvents();
      closeEventModal();
    } catch (err) {
      setEventFormError(err?.response?.data?.message || "Cập nhật thất bại.");
    } finally {
      setEventSaving(false);
    }
  };

  // DELETE event
  const handleDeleteEvent = async () => {
    setEventSaving(true);
    try {
      await eventService.remove(selectedEvent.id);
      await fetchEvents();
      closeEventModal();
    } catch (err) {
      setEventFormError(err?.response?.data?.message || "Xóa thất bại.");
    } finally {
      setEventSaving(false);
    }
  };

  // =========================================================================
  // TRACK HANDLERS (preserved from TracksManagement)
  // =========================================================================
  const openCreateTrack = (event) => {
    if (isTrackCreateLocked(event)) return;
    setTrackForm({ ...TRACK_EMPTY, eventId: String(event.id) });
    setRoundForm({ ...ROUND_EMPTY });
    setTrackFormError("");
    setRoundFormError("");
    setTrackModal("create");
  };
  const openEditTrack = (track) => {
    setSelectedTrack(track);
    setTrackForm({
      name: track.name,
      description: track.description || "",
      maxTeams: String(track.maxTeams),
      eventId: String(track.eventId),
    });
    setTrackFormError("");
    setTrackModal("edit");
  };
  const closeTrackModal = () => {
    setTrackModal(null);
    setSelectedTrack(null);
    setTrackFormError("");
  };

  const handleTrackFormChange = (field, value) => {
    setTrackForm((p) => ({ ...p, [field]: value }));
    setTrackFormError("");
  };

  const validateTrackForm = () => {
    if (!trackForm.name.trim()) return "Tên track không được để trống.";
    if (
      !trackForm.maxTeams ||
      isNaN(trackForm.maxTeams) ||
      Number(trackForm.maxTeams) < 1
    )
      return "Số đội tối đa phải là số nguyên dương.";
    if (!trackForm.eventId) return "Vui lòng chọn sự kiện.";
    return "";
  };

  const validateTrackRoundForm = () => {
    if (!roundForm.name.trim()) return "Tên vòng không được để trống.";
    if (!roundForm.startTime) return "Vui lòng chọn thời gian bắt đầu.";
    if (!roundForm.endTime) return "Vui lòng chọn thời gian kết thúc.";
    if (roundForm.endTime <= roundForm.startTime)
      return "Thời gian kết thúc phải sau bắt đầu.";
    if (!roundForm.advancingSlots || Number(roundForm.advancingSlots) < 1)
      return "Số suất đi tiếp phải lớn hơn 0.";
    return "";
  };

  // CREATE track
  const handleCreateTrack = async () => {
    const err = validateTrackForm();
    if (err) {
      setTrackFormError(err);
      return;
    }
    const roundErr = validateTrackRoundForm();
    if (roundErr) {
      setRoundFormError(roundErr);
      return;
    }
    setTrackSaving(true);
    try {
      const trackResponse = await eventService.createTrack({
        name: trackForm.name.trim(),
        description: trackForm.description.trim(),
        maxTeams: Number(trackForm.maxTeams),
        eventId: Number(trackForm.eventId),
        isFinal: false,
      });
      const createdTrackId = getCreatedEntityId(trackResponse);
      if (!createdTrackId) {
        throw new Error("Không lấy được Track ID sau khi tạo track.");
      }
      await eventService.createRound({
        trackId: Number(createdTrackId),
        orderIndex: 1,
        name: roundForm.name.trim(),
        startTime: new Date(roundForm.startTime).toISOString(),
        endTime: new Date(roundForm.endTime).toISOString(),
        advancingSlots: Number(roundForm.advancingSlots),
      });
      await fetchTracksForEvent(trackForm.eventId);
      await fetchRoundsForTrack(createdTrackId);
      closeTrackModal();
    } catch (err) {
      setTrackFormError(
        err?.response?.data?.message ||
          err?.message ||
          "Tạo track và round thất bại.",
      );
    } finally {
      setTrackSaving(false);
    }
  };

  // EDIT track
  const handleEditTrack = async () => {
    const err = validateTrackForm();
    if (err) {
      setTrackFormError(err);
      return;
    }
    setTrackSaving(true);
    try {
      await eventService.updateTrack(selectedTrack.id, {
        name: trackForm.name.trim(),
        description: trackForm.description.trim(),
        maxTeams: Number(trackForm.maxTeams),
        eventId: Number(trackForm.eventId),
        isFinal: isFinalTrack(selectedTrack),
      });
      await fetchTracksForEvent(trackForm.eventId);
      closeTrackModal();
    } catch (err) {
      setTrackFormError(
        err?.response?.data?.message || "Cập nhật track thất bại.",
      );
    } finally {
      setTrackSaving(false);
    }
  };

  // =========================================================================
  // ROUND HANDLERS (preserved from RoundsManagement)
  // =========================================================================
  const openCreateRound = (trackId) => {
    setRoundForm({ ...ROUND_EMPTY, trackId: String(trackId) });
    setRoundFormError("");
    setRoundModal("create");
  };
  const openEditRound = (round, trackId) => {
    setSelectedRound({ ...round, trackId });
    setRoundForm({
      trackId: String(trackId),
      name: round.name,
      startTime: round.startTime?.slice(0, 16) || "",
      endTime: round.endTime?.slice(0, 16) || "",
      advancingSlots: String(round.advancingSlots),
    });
    setRoundFormError("");
    setRoundModal("edit");
  };
  const openRoundStatus = (round, trackId, event) => {
    const trackRounds = roundsByTrack[trackId]?.data || [];
    setSelectedRound({
      ...round,
      trackId,
      eventId: event?.id,
      eventName: event?.name,
      eventStatus: event?.status,
    });
    setRoundStatusValue(getEffectiveRoundStatus(trackRounds, round));
    setRoundFormError("");
    setRoundModal("status");
  };
  const closeRoundModal = () => {
    setRoundModal(null);
    setSelectedRound(null);
    setRoundFormError("");
  };

  const handleRoundFormChange = (field, value) => {
    setRoundForm((p) => ({ ...p, [field]: value }));
    setRoundFormError("");
  };

  const validateRoundForm = () => {
    if (!roundForm.name.trim()) return "Tên vòng không được để trống.";
    if (!roundForm.trackId) return "Vui lòng chọn track.";
    if (!roundForm.startTime) return "Vui lòng chọn thời gian bắt đầu.";
    if (!roundForm.endTime) return "Vui lòng chọn thời gian kết thúc.";
    if (roundForm.endTime <= roundForm.startTime)
      return "Thời gian kết thúc phải sau bắt đầu.";
    if (!roundForm.advancingSlots || Number(roundForm.advancingSlots) < 1)
      return "Số suất đi tiếp phải lớn hơn 0.";
    return "";
  };

  // CREATE round
  const handleCreateRound = async () => {
    const err = validateRoundForm();
    if (err) {
      setRoundFormError(err);
      return;
    }
    setRoundSaving(true);
    try {
      await eventService.createRound({
        trackId: Number(roundForm.trackId),
        orderIndex: 1,
        name: roundForm.name.trim(),
        startTime: new Date(roundForm.startTime).toISOString(),
        endTime: new Date(roundForm.endTime).toISOString(),
        advancingSlots: Number(roundForm.advancingSlots),
      });
      await fetchRoundsForTrack(roundForm.trackId);
      closeRoundModal();
    } catch (err) {
      setRoundFormError(err?.response?.data?.message || "Tạo round thất bại.");
    } finally {
      setRoundSaving(false);
    }
  };

  // EDIT round
  const handleEditRound = async () => {
    const err = validateRoundForm();
    if (err) {
      setRoundFormError(err);
      return;
    }
    setRoundSaving(true);
    try {
      await eventService.updateRound(selectedRound.roundId, {
        name: roundForm.name.trim(),
        startTime: new Date(roundForm.startTime).toISOString(),
        endTime: new Date(roundForm.endTime).toISOString(),
        advancingSlots: Number(roundForm.advancingSlots),
      });
      await fetchRoundsForTrack(selectedRound.trackId);
      closeRoundModal();
    } catch (err) {
      setRoundFormError(
        err?.response?.data?.message || "Cập nhật round thất bại.",
      );
    } finally {
      setRoundSaving(false);
    }
  };

  // STATUS update round
  const handleRoundStatusUpdate = async () => {
    if (!roundStatusValue) return;
    const trackRounds = roundsByTrack[selectedRound?.trackId]?.data || [];
    const blockingRound = getBlockingPreviousRound(trackRounds, selectedRound);

    if (
      isRoundAfterUpcoming(roundStatusValue) &&
      !isEventActive(selectedRound?.eventStatus)
    ) {
      setRoundFormError(
        `Không thể chuyển round sang ${roundStatusValue} khi Event "${selectedRound?.eventName || ""}" chưa Active. Event chưa Active thì round chỉ được ở Upcoming.`,
      );
      return;
    }
    if (roundStatusValue === "Active" && blockingRound) {
      setRoundFormError(
        `Không thể Active "${selectedRound?.name || "round này"}" vì round trước "${blockingRound.name}" trong cùng track chưa Closed.`,
      );
      return;
    }
    setRoundSaving(true);
    try {
      const response = await eventService.updateRoundStatus(selectedRound.roundId, roundStatusValue);
      await fetchRoundsForTrack(selectedRound.trackId);
      setRoundStatusNotice(
        response.data?.message ||
          (roundStatusValue === "Active"
            ? "Đã mở vòng thi thành công."
            : "Cập nhật trạng thái round thành công."),
      );
      closeRoundModal();
    } catch (err) {
      setRoundFormError(
        err?.response?.data?.message || "Cập nhật trạng thái thất bại.",
      );
    } finally {
      setRoundSaving(false);
    }
  };

  // =========================================================================
  // RENDER
  // =========================================================================
  const selectedRoundTrackRounds = roundsByTrack[selectedRound?.trackId]?.data || [];
  const selectedRoundBlockingPrevious = getBlockingPreviousRound(
    selectedRoundTrackRounds,
    selectedRound,
  );
  const selectedRoundEffectiveStatus = getEffectiveRoundStatus(
    selectedRoundTrackRounds,
    selectedRound,
  );

  return (
    <div className="space-y-4">
      {/* ─── Header panel ─── */}
      <CoordinatorPanel
        title="Competition Setup"
        subtitle="Manage events, tracks, and rounds in a unified tree view"
        icon={icons.CalendarDays}
        actions={
          <div className="flex flex-wrap gap-2">
            <CoordinatorActionButton onClick={() => setExcelImportOpen(true)}>
              <FileSpreadsheet className="h-4 w-4" />
              Import Excel
            </CoordinatorActionButton>
            <CoordinatorActionButton onClick={() => setDemoImportOpen(true)}>
              <Upload className="h-4 w-4" />
              Import dữ liệu demo
            </CoordinatorActionButton>
            <CoordinatorActionButton
              variant="primary"
              icon={icons.GitBranch}
              onClick={() => setStructureModalOpen(true)}
            >
              Setup Event
            </CoordinatorActionButton>
          </div>
        }
      />

      {roundStatusNotice && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          <div className="flex items-start justify-between gap-3">
            <span>{roundStatusNotice}</span>
            <button
              type="button"
              onClick={() => setRoundStatusNotice("")}
              className="text-emerald-700/70 hover:text-emerald-900"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* ─── Event list ─── */}
      {eventsLoading ? (
        <div className="flex items-center justify-center py-12 gap-2 text-sm text-slate-400">
          <Loader2
            className="w-4 h-4 animate-spin"
            style={{ color: "#F26F21" }}
          />
          Đang tải sự kiện...
        </div>
      ) : eventsError ? (
        <div className="flex flex-col items-center py-10 gap-3">
          <p className="text-sm text-red-500">{eventsError}</p>
          <CoordinatorActionButton onClick={fetchEvents}>
            Thử lại
          </CoordinatorActionButton>
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 py-14 text-center text-sm text-slate-400">
          Chưa có sự kiện nào. Nhấn &quot;Setup Event&quot; để bắt đầu.
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => {
            const isExpanded = expandedEvents.has(event.id);
            const tracksState = tracksByEvent[event.id];

            return (
              <div
                key={event.id}
                className="rounded-2xl border bg-white transition-all duration-300 hover:shadow-md"
                style={{
                  borderColor: isExpanded ? "rgba(242,111,33,0.3)" : "#E5E7EB",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.02)",
                }}
              >
                {/* ── Event header row ── */}
                <div
                  className="flex items-center gap-3 p-4 cursor-pointer select-none"
                  onClick={() => toggleEvent(event.id)}
                >
                  <button
                    type="button"
                    className="flex-shrink-0 rounded-lg p-1 hover:bg-slate-100 transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-[#F26F21]" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                  </button>

                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0"
                    style={{
                      background: "rgba(242,111,33,0.1)",
                      border: "1px solid rgba(242,111,33,0.2)",
                    }}
                  >
                    <icons.CalendarDays
                      className="h-4 w-4"
                      style={{ color: "#F26F21" }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-slate-900 truncate">
                        {event.name}
                      </h3>
                      <CoordinatorBadge tone={eventStatusTone(event.status)}>
                        {event.status}
                      </CoordinatorBadge>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {formatDate(event.startDate)} →{" "}
                      {formatDate(event.endDate)}
                      {event.description && ` • ${compactText(event.description)}`}
                    </p>
                  </div>

                  <div
                    className="flex flex-shrink-0 flex-wrap items-center justify-end gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <CoordinatorActionButton
                      icon={icons.Edit3}
                      onClick={() => openEditEvent(event)}
                    >
                      Edit
                    </CoordinatorActionButton>
                    <CoordinatorActionButton
                      icon={Copy}
                      onClick={() => setCloneSourceEvent(event)}
                    >
                      Copy
                    </CoordinatorActionButton>
                    <CoordinatorActionButton
                      variant="danger"
                      icon={icons.Trash2}
                      onClick={() => openDeleteEvent(event)}
                    >
                      Delete
                    </CoordinatorActionButton>
                    <CoordinatorActionButton
                      icon={icons.Plus}
                      disabled={isTrackCreateLocked(event)}
                      onClick={() => openCreateTrack(event)}
                      className={
                        isTrackCreateLocked(event)
                          ? "pointer-events-auto"
                          : ""
                      }
                    >
                      Add Track
                    </CoordinatorActionButton>
                  </div>
                </div>

                {/* ── Expanded: Tracks inside event ── */}
                {isExpanded && (
                  <div
                    className="border-t px-4 pb-4 pt-3 animate-fade-in"
                    style={{
                      borderColor: "#F0F0F0",
                      background: "rgba(249,250,251,0.5)",
                    }}
                  >
                    {!tracksState || tracksState.loading ? (
                      <div className="flex items-center justify-center py-8 gap-2 text-sm text-slate-400">
                        <Loader2
                          className="w-4 h-4 animate-spin"
                          style={{ color: "#F26F21" }}
                        />
                        Đang tải track...
                      </div>
                    ) : tracksState.error ? (
                      <div className="flex flex-col items-center py-6 gap-3">
                        <p className="text-sm text-red-500">
                          {tracksState.error}
                        </p>
                        <CoordinatorActionButton
                          onClick={() => fetchTracksForEvent(event.id)}
                        >
                          Thử lại
                        </CoordinatorActionButton>
                      </div>
                    ) : tracksState.data.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-sm text-slate-400">
                        Chưa có track nào trong sự kiện này.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {sortTracksWithFinalLast(tracksState.data).map((track) => {
                          const isTrackExpanded = expandedTracks.has(track.id);
                          const roundsState = roundsByTrack[track.id];
                          const finalTrack = isFinalTrack(track);

                          return (
                            <div key={track.id} className={finalTrack ? "pt-2" : ""}>
                              {finalTrack && (
                                <div className="mb-3 mt-1 flex items-center gap-3">
                                  <div className="h-px flex-1 bg-slate-200" />
                                  <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-orange-700">
                                    <Crown className="h-3.5 w-3.5" />
                                    Final Track
                                  </div>
                                  <div className="h-px flex-1 bg-slate-200" />
                                </div>
                              )}
                              <div
                                className="rounded-xl border transition-all duration-200"
                                style={{
                                  background: finalTrack ? "#f0f0f0f0" : "#FFFFFF",
                                  borderColor: finalTrack
                                    ? "rgba(242,111,33,0.28)"
                                    : isTrackExpanded
                                      ? "rgba(242,111,33,0.2)"
                                      : "#E5E7EB",
                                }}
                              >
                              {/* ── Track header row ── */}
                              <div
                                className="flex items-center gap-3 p-3 cursor-pointer select-none"
                                onClick={() => toggleTrack(track.id)}
                              >
                                <button
                                  type="button"
                                  className="flex-shrink-0 rounded p-0.5 hover:bg-slate-100 transition-colors"
                                >
                                  {isTrackExpanded ? (
                                    <ChevronDown className="w-3.5 h-3.5 text-[#F26F21]" />
                                  ) : (
                                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                                  )}
                                </button>

                                {finalTrack ? (
                                  <Crown
                                    className="w-4 h-4 flex-shrink-0"
                                    style={{ color: "#F26F21" }}
                                  />
                                ) : (
                                  <icons.GitBranch
                                    className="w-4 h-4 flex-shrink-0"
                                    style={{ color: "#F26F21" }}
                                  />
                                )}

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="font-bold text-slate-800 text-sm truncate">
                                      {track.name}
                                    </p>
                                    <CoordinatorBadge tone="info">
                                      #{track.id}
                                    </CoordinatorBadge>
                                  </div>
                                  <p className="text-xs text-slate-500 mt-0.5">
                                    {track.description || "—"} • Max teams:{" "}
                                    {track.maxTeams}
                                  </p>
                                </div>

                                <div className="hidden flex-shrink-0 text-right text-sm font-semibold text-slate-700 sm:block">
                                  {getTrackCurrentTeamCount(track)}/{track.maxTeams}
                                </div>

                                <div
                                  className="flex items-center gap-2 flex-shrink-0"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <CoordinatorActionButton
                                    icon={icons.Edit3}
                                    onClick={() => openEditTrack(track)}
                                  >
                                    Edit
                                  </CoordinatorActionButton>
                                </div>
                              </div>

                              {/* ── Expanded: Rounds inside track ── */}
                              {isTrackExpanded && (
                                <div
                                  className="border-t px-3 pb-3 pt-2 animate-fade-in"
                                  style={{ borderColor: "#F0F0F0" }}
                                >
                                  {!roundsState || roundsState.loading ? (
                                    <div className="flex items-center justify-center py-6 gap-2 text-sm text-slate-400">
                                      <Loader2
                                        className="w-4 h-4 animate-spin"
                                        style={{ color: "#F26F21" }}
                                      />
                                      Đang tải rounds...
                                    </div>
                                  ) : roundsState.error ? (
                                    <div className="flex flex-col items-center py-4 gap-3">
                                      <p className="text-sm text-red-500">
                                        {roundsState.error}
                                      </p>
                                      <CoordinatorActionButton
                                        onClick={() =>
                                          fetchRoundsForTrack(track.id)
                                        }
                                      >
                                        Thử lại
                                      </CoordinatorActionButton>
                                    </div>
                                  ) : roundsState.data.length === 0 ? (
                                    <div className="rounded-lg border border-dashed border-slate-200 py-6 text-center text-sm text-slate-400">
                                      Chưa có round nào trong track này.
                                    </div>
                                  ) : (
                                    <div className="space-y-2">
                                      {roundsState.data.map((round, idx) => {
                                        const displayStatus = getEffectiveRoundStatus(
                                          roundsState.data,
                                          round,
                                        );

                                        return (
                                        <div
                                          key={round.roundId}
                                          className="grid gap-3 rounded-xl border border-slate-100 p-3 lg:grid-cols-[auto_1fr_160px_auto]"
                                          style={{
                                            background:
                                              displayStatus === "Active"
                                                ? "rgba(242,111,33,0.02)"
                                                : "#fff",
                                          }}
                                        >
                                          {/* Index + status */}
                                          <div className="flex items-center gap-2">
                                            <div
                                              className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white flex-shrink-0"
                                              style={{
                                                background:
                                                  displayStatus === "Active"
                                                    ? "#F26F21"
                                                    : "#94A3B8",
                                              }}
                                            >
                                              {idx + 1}
                                            </div>
                                            <CoordinatorBadge
                                              tone={roundStatusTone(
                                                displayStatus,
                                              )}
                                            >
                                              {displayStatus}
                                            </CoordinatorBadge>
                                          </div>

                                          {/* Info */}
                                          <div>
                                            <h4 className="font-bold text-slate-900 text-sm">
                                              {round.name}
                                            </h4>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                              {formatDateTime(round.startTime)}{" "}
                                              → {formatDateTime(round.endTime)}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                              Suất đi tiếp:{" "}
                                              <span className="font-bold text-slate-700">
                                                {round.advancingSlots}
                                              </span>
                                            </p>
                                          </div>

                                          {/* Progress */}
                                          <CoordinatorProgressBar
                                            label="Progress"
                                            value={
                                              round.progressPercentage ?? 0
                                            }
                                            color={
                                              displayStatus === "Active"
                                                ? "#F26F21"
                                                : "#64748B"
                                            }
                                          />

                                          {/* Actions */}
                                          <div className="flex flex-col gap-1.5 justify-center">
                                            <CoordinatorActionButton
                                              icon={icons.Edit3}
                                              onClick={() =>
                                                openEditRound(round, track.id)
                                              }
                                            >
                                              Edit
                                            </CoordinatorActionButton>
                                            <CoordinatorActionButton
                                              icon={icons.SlidersHorizontal}
                                              onClick={() =>
                                                openRoundStatus(round, track.id, event)
                                              }
                                            >
                                              Status
                                            </CoordinatorActionButton>
                                          </div>
                                        </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {cloneSourceEvent && (
        <CloneCompetitionModal
          sourceEvent={cloneSourceEvent}
          onClose={closeCloneModal}
          onCompleted={completeClone}
        />
      )}

      {structureModalOpen && (
        <CompetitionTemplateModal
          onClose={() => setStructureModalOpen(false)}
          onCompleted={async () => {
            setStructureModalOpen(false);
            await fetchEvents();
          }}
        />
      )}

      {excelImportOpen && (
        <CompetitionExcelImportModal
          onClose={() => setExcelImportOpen(false)}
          onCompleted={async () => {
            setExcelImportOpen(false);
            await fetchEvents();
          }}
        />
      )}

      {demoImportOpen && (
        <DemoDataImportModal
          events={events}
          onClose={() => setDemoImportOpen(false)}
          onCompleted={fetchEvents}
        />
      )}

      {/* =============================================================== */}
      {/* EVENT MODALS (preserved from EventsManagement)                  */}
      {/* =============================================================== */}
      {eventModal === "edit" && (
        <ModalShell
          title={`Chỉnh sửa: ${selectedEvent?.name}`}
          onClose={closeEventModal}
          actions={
            <>
              <CoordinatorActionButton
                onClick={closeEventModal}
                disabled={eventSaving}
              >
                Hủy
              </CoordinatorActionButton>
              <CoordinatorActionButton
                variant="primary"
                disabled={eventSaving}
                onClick={handleEditEvent}
              >
                {eventSaving ? "Đang lưu..." : "Lưu thay đổi"}
              </CoordinatorActionButton>
            </>
          }
        >
          <div className="space-y-3">
            <FormError msg={eventFormError} />
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">
                Tên sự kiện <span className="text-orange-500">*</span>
              </label>
              <input
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
                placeholder="VD: FPT Hackathon 2026"
                value={eventForm.name}
                onChange={(e) => handleEventFormChange("name", e.target.value)}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">
                  Địa điểm
                </label>
                <input
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
                  placeholder="VD: FPT University HCM"
                  value={eventForm.location}
                  onChange={(e) => handleEventFormChange("location", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">
                  Ảnh banner
                </label>
                <EventBannerPicker
                  file={eventForm.bannerFile}
                  url={eventForm.bannerUrl}
                  disabled={eventSaving}
                  onFileChange={(file) => handleEventFormChange("bannerFile", file)}
                  onUrlChange={(url) => handleEventFormChange("bannerUrl", url)}
                />
              </div>
            </div>
            <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800">
              <input
                type="checkbox"
                className="h-4 w-4 accent-orange-600"
                checked={eventForm.isOnline}
                onChange={(e) => handleEventFormChange("isOnline", e.target.checked)}
              />
              Tổ chức online
            </label>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">
                Mô tả
              </label>
              <RichTextEditor
                value={eventForm.description}
                onChange={(html) => handleEventFormChange("description", html)}
                placeholder="Nhập mô tả sự kiện..."
                minHeightClass="min-h-40"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">
                  Ngày bắt đầu <span className="text-orange-500">*</span>
                </label>
                <input
                  type="date"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
                  value={eventForm.startDate}
                  onChange={(e) =>
                    handleEventFormChange("startDate", e.target.value)
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">
                  Ngày kết thúc <span className="text-orange-500">*</span>
                </label>
                <input
                  type="date"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
                  value={eventForm.endDate}
                  onChange={(e) =>
                    handleEventFormChange("endDate", e.target.value)
                  }
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">Trạng thái</label>
              <select className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none" value={eventForm.status} onChange={(e) => handleEventFormChange("status", e.target.value)}>
                {EVENT_STATUS_OPTIONS.map((status) => <option key={status} value={status} disabled={isEventStatusRollback(selectedEvent?.status, status)}>{status}</option>)}
              </select>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-500">Sau khi chuyển lên <strong>Active</strong> hoặc <strong>Completed</strong>, Coordinator không thể quay lại trạng thái trước đó.</p>
            </div>
          </div>
        </ModalShell>
      )}

      {eventModal === "delete" && (
        <ModalShell
          title={`Xóa sự kiện: ${selectedEvent?.name}?`}
          onClose={closeEventModal}
          actions={
            <>
              <CoordinatorActionButton
                onClick={closeEventModal}
                disabled={eventSaving}
              >
                Hủy
              </CoordinatorActionButton>
              <CoordinatorActionButton
                variant="danger"
                disabled={eventSaving}
                onClick={handleDeleteEvent}
              >
                {eventSaving ? "Đang xóa..." : "Xác nhận xóa"}
              </CoordinatorActionButton>
            </>
          }
        >
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              Sự kiện sẽ bị ẩn khỏi hệ thống nhưng dữ liệu vẫn được giữ lại
              (soft delete).
            </p>
            <FormError msg={eventFormError} />
          </div>
        </ModalShell>
      )}

      {/* =============================================================== */}
      {/* TRACK MODALS (preserved from TracksManagement)                  */}
      {/* =============================================================== */}
      {(trackModal === "create" || trackModal === "edit") && (
        <ModalShell
          maxWidthClass={trackModal === "create" ? "max-w-4xl" : "max-w-xl"}
          title={
            trackModal === "create"
              ? "Tạo Track mới"
              : `Chỉnh sửa: ${selectedTrack?.name}`
          }
          onClose={closeTrackModal}
          actions={
            <>
              <CoordinatorActionButton
                onClick={closeTrackModal}
                disabled={trackSaving}
              >
                Hủy
              </CoordinatorActionButton>
              <CoordinatorActionButton
                variant="primary"
                disabled={trackSaving}
                onClick={
                  trackModal === "create" ? handleCreateTrack : handleEditTrack
                }
              >
                {trackSaving
                  ? "Đang lưu..."
                  : trackModal === "create"
                    ? "Tạo Track và Round"
                    : "Lưu thay đổi"}
              </CoordinatorActionButton>
            </>
          }
        >
          <div className="space-y-3">
            <FormError msg={trackFormError} />
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <h4 className="mb-3 text-sm font-bold text-slate-900">
                Thông tin Track
              </h4>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">
                    Sự kiện <span className="text-orange-500">*</span>
                  </label>
                  <select
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
                    value={trackForm.eventId}
                    onChange={(e) =>
                      handleTrackFormChange("eventId", e.target.value)
                    }
                  >
                    <option value="">-- Chọn sự kiện --</option>
                    {events.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">
                    Tên Track <span className="text-orange-500">*</span>
                  </label>
                  <input
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
                    placeholder="VD: AI & Data Science"
                    value={trackForm.name}
                    onChange={(e) =>
                      handleTrackFormChange("name", e.target.value)
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">
                    Số đội tối đa <span className="text-orange-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
                    placeholder="VD: 20"
                    value={trackForm.maxTeams}
                    onChange={(e) =>
                      handleTrackFormChange("maxTeams", e.target.value)
                    }
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">
                    Mô tả
                  </label>
                  <textarea
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none min-h-16"
                    placeholder="Mô tả track"
                    value={trackForm.description}
                    onChange={(e) =>
                      handleTrackFormChange("description", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>

            {trackModal === "create" && (
              <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4">
                <div className="mb-3">
                  <h4 className="text-sm font-bold text-slate-900">
                    Round của Track
                  </h4>
                  <p className="text-xs text-slate-500">
                    Mỗi track chỉ có một round, vì vậy cần tạo round cùng lúc
                    với track.
                  </p>
                </div>
                <FormError msg={roundFormError} />
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">
                      Tên Round <span className="text-orange-500">*</span>
                    </label>
                    <input
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
                      placeholder="VD: Vòng sản phẩm"
                      value={roundForm.name}
                      onChange={(e) =>
                        handleRoundFormChange("name", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">
                      Suất đi tiếp <span className="text-orange-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
                      placeholder="VD: 5"
                      value={roundForm.advancingSlots}
                      onChange={(e) =>
                        handleRoundFormChange("advancingSlots", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">
                      Bắt đầu <span className="text-orange-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
                      value={roundForm.startTime}
                      onChange={(e) =>
                        handleRoundFormChange("startTime", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">
                      Kết thúc <span className="text-orange-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
                      value={roundForm.endTime}
                      onChange={(e) =>
                        handleRoundFormChange("endTime", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ModalShell>
      )}

      {/* =============================================================== */}
      {/* ROUND MODALS (preserved from RoundsManagement)                  */}
      {/* =============================================================== */}
      {(roundModal === "create" || roundModal === "edit") && (
        <ModalShell
          title={
            roundModal === "create"
              ? "Tạo Round mới"
              : `Chỉnh sửa: ${selectedRound?.name}`
          }
          onClose={closeRoundModal}
          actions={
            <>
              <CoordinatorActionButton
                onClick={closeRoundModal}
                disabled={roundSaving}
              >
                Hủy
              </CoordinatorActionButton>
              <CoordinatorActionButton
                variant="primary"
                disabled={roundSaving}
                onClick={
                  roundModal === "create" ? handleCreateRound : handleEditRound
                }
              >
                {roundSaving
                  ? "Đang lưu..."
                  : roundModal === "create"
                    ? "Tạo Round"
                    : "Lưu thay đổi"}
              </CoordinatorActionButton>
            </>
          }
        >
          <div className="space-y-3">
            <FormError msg={roundFormError} />
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">
                Tên Round <span className="text-orange-500">*</span>
              </label>
              <input
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
                placeholder="VD: Vòng Sơ Loại"
                value={roundForm.name}
                onChange={(e) => handleRoundFormChange("name", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">
                Suất đi tiếp <span className="text-orange-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
                placeholder="10"
                value={roundForm.advancingSlots}
                onChange={(e) =>
                  handleRoundFormChange("advancingSlots", e.target.value)
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">
                  Bắt đầu <span className="text-orange-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
                  value={roundForm.startTime}
                  onChange={(e) =>
                    handleRoundFormChange("startTime", e.target.value)
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">
                  Kết thúc <span className="text-orange-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
                  value={roundForm.endTime}
                  onChange={(e) =>
                    handleRoundFormChange("endTime", e.target.value)
                  }
                />
              </div>
            </div>
          </div>
        </ModalShell>
      )}

      {roundModal === "status" && (
        <ModalShell
          title={`Đổi trạng thái: ${selectedRound?.name}`}
          onClose={closeRoundModal}
          actions={
            <>
              <CoordinatorActionButton
                onClick={closeRoundModal}
                disabled={roundSaving}
              >
                Hủy
              </CoordinatorActionButton>
              <CoordinatorActionButton
                variant="primary"
                disabled={roundSaving}
                onClick={handleRoundStatusUpdate}
              >
                {roundSaving ? "Đang lưu..." : "Cập nhật"}
              </CoordinatorActionButton>
            </>
          }
        >
          <div className="space-y-3">
            <p className="text-sm text-slate-500">
              Trạng thái hiện tại:{" "}
              <CoordinatorBadge tone={roundStatusTone(selectedRoundEffectiveStatus)}>
                {selectedRoundEffectiveStatus}
              </CoordinatorBadge>
            </p>
            <p className="text-sm text-slate-500">
              Event:{" "}
              <span className="font-semibold text-slate-700">
                {selectedRound?.eventName || "Unknown"}
              </span>{" "}
              <CoordinatorBadge
                tone={isEventActive(selectedRound?.eventStatus) ? "success" : "warning"}
              >
                {selectedRound?.eventStatus || "Unknown"}
              </CoordinatorBadge>
            </p>
            {!isEventActive(selectedRound?.eventStatus) && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                Event chưa Active nên round chỉ được ở trạng thái{" "}
                <strong>Upcoming</strong>. Không thể chọn Active, Scoring hoặc
                Closed lúc này.
              </div>
            )}
            {selectedRoundBlockingPrevious && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                Round này chỉ được Active sau khi round trước trong cùng track là{" "}
                <strong>Closed</strong>. Round đang chặn:{" "}
                <strong>{selectedRoundBlockingPrevious.name}</strong> (
                {selectedRoundBlockingPrevious.status}).
              </div>
            )}
            <select
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
              value={roundStatusValue}
              onChange={(e) => setRoundStatusValue(e.target.value)}
            >
              {ROUND_STATUS_OPTIONS.map((s) => (
                <option
                  key={s}
                  value={s}
                  disabled={
                    (isRoundAfterUpcoming(s) &&
                      !isEventActive(selectedRound?.eventStatus)) ||
                    (s === "Active" && !!selectedRoundBlockingPrevious)
                  }
                >
                  {s}
                </option>
              ))}
            </select>
            <FormError msg={roundFormError} />
          </div>
        </ModalShell>
      )}
    </div>
  );
}
