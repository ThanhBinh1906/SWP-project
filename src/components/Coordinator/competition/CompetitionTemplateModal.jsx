import { useState } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import eventService from "../../../services/eventService";
import {
  CoordinatorActionButton,
  ModalShell,
} from "../CoordinatorUI";

const INITIAL_FORM = {
  eventName: "",
  eventDescription: "",
  eventStartDate: "",
  eventEndDate: "",
  trackName: "",
  trackDescription: "",
  trackMaxTeams: "",
  roundName: "",
  roundStartTime: "",
  roundEndTime: "",
  roundAdvancingSlots: "",
};

function getCreatedId(response, keys) {
  const data = response?.data?.data ?? response?.data;
  if (typeof data === "number" || typeof data === "string") return data;
  for (const key of keys) {
    if (data?.[key] !== undefined && data?.[key] !== null) return data[key];
  }
  return null;
}

function Field({ label, required, children, hint }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
        {label} {required && <span className="text-orange-500">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

export function CompetitionTemplateModal({ onClose, onCompleted }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [created, setCreated] = useState({ eventId: null, trackId: null, roundId: null });
  const [activeStage, setActiveStage] = useState("event");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const completed = Boolean(created.roundId);
  const currentStage = created.eventId
    ? created.trackId
      ? created.roundId
        ? "done"
        : "round"
      : "track"
    : "event";

  const change = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
    setError("");
  };

  const validate = () => {
    if (!form.eventName.trim()) return "Vui lòng nhập tên sự kiện.";
    if (!form.eventStartDate || !form.eventEndDate)
      return "Vui lòng chọn đầy đủ thời gian của sự kiện.";
    if (form.eventEndDate < form.eventStartDate)
      return "Ngày kết thúc sự kiện phải sau ngày bắt đầu.";
    if (!form.trackName.trim()) return "Vui lòng nhập tên track.";
    if (!Number.isInteger(Number(form.trackMaxTeams)) || Number(form.trackMaxTeams) < 1)
      return "Số team tối đa phải là số nguyên dương.";
    if (!form.roundName.trim()) return "Vui lòng nhập tên round.";
    if (!form.roundStartTime || !form.roundEndTime)
      return "Vui lòng chọn đầy đủ thời gian của round.";
    if (form.roundEndTime <= form.roundStartTime)
      return "Thời gian kết thúc round phải sau thời gian bắt đầu.";
    if (form.roundStartTime.slice(0, 10) < form.eventStartDate || form.roundEndTime.slice(0, 10) > form.eventEndDate)
      return "Thời gian round phải nằm trong thời gian của sự kiện.";
    if (
      !Number.isInteger(Number(form.roundAdvancingSlots)) ||
      Number(form.roundAdvancingSlots) < 1
    )
      return "Số suất đi tiếp phải là số nguyên dương.";
    if (Number(form.roundAdvancingSlots) > Number(form.trackMaxTeams))
      return "Số suất đi tiếp không được lớn hơn số team tối đa của track.";
    return "";
  };

  const submit = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError("");
    let eventId = created.eventId;
    let trackId = created.trackId;

    try {
      if (!eventId) {
        setActiveStage("event");
        const eventResponse = await eventService.create({
          name: form.eventName.trim(),
          description: form.eventDescription.trim(),
          startDate: form.eventStartDate,
          endDate: form.eventEndDate,
          status: "Registration",
        });
        eventId = getCreatedId(eventResponse, ["id", "eventId"]);
        if (!eventId) throw new Error("API tạo Event không trả về eventId.");
        setCreated((previous) => ({ ...previous, eventId }));
      }

      if (!trackId) {
        setActiveStage("track");
        const trackResponse = await eventService.createTrack({
          eventId: Number(eventId),
          name: form.trackName.trim(),
          description: form.trackDescription.trim(),
          maxTeams: Number(form.trackMaxTeams),
        });
        trackId = getCreatedId(trackResponse, ["id", "trackId"]);
        if (!trackId) throw new Error("API tạo Track không trả về trackId.");
        setCreated((previous) => ({ ...previous, trackId }));
      }

      setActiveStage("round");
      const roundResponse = await eventService.createRound({
        trackId: Number(trackId),
        name: form.roundName.trim(),
        startTime: new Date(form.roundStartTime).toISOString(),
        endTime: new Date(form.roundEndTime).toISOString(),
        advancingSlots: Number(form.roundAdvancingSlots),
      });
      const roundId = getCreatedId(roundResponse, ["id", "roundId"]);
      setCreated((previous) => ({ ...previous, roundId: roundId ?? true }));
      setActiveStage("done");
      await onCompleted?.({ eventId, trackId, roundId });
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          `Không thể tạo ${currentStage}. Vui lòng thử lại.`,
      );
    } finally {
      setSaving(false);
    }
  };

  const close = () => {
    if (!saving) onClose?.({ hasPartialData: Boolean(created.eventId) && !completed });
  };

  return (
    <ModalShell
      title="Tạo nhanh cấu trúc cuộc thi"
      onClose={close}
      maxWidthClass="max-w-6xl"
      maxHeightClass="max-h-[90vh]"
      actions={
        <>
          <CoordinatorActionButton onClick={close} disabled={saving}>
            {completed ? "Đóng" : "Hủy"}
          </CoordinatorActionButton>
          {!completed && (
            <CoordinatorActionButton variant="primary" onClick={submit} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? `Đang tạo ${activeStage}...` : created.eventId ? "Thử lại từ bước lỗi" : "Tạo Event, Track và Round"}
            </CoordinatorActionButton>
          )}
        </>
      }
    >
      <div className="grid gap-5 pb-2 lg:grid-cols-3">
        {error && (
          <div className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 lg:col-span-3">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {completed && (
          <div className="flex gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-700 lg:col-span-3">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
            Đã tạo thành công Event, Track và Round.
          </div>
        )}
        {created.eventId && !completed && (
          <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800 lg:col-span-3">
            Một phần dữ liệu đã được tạo. Các phần hoàn tất được khóa và lần thử tiếp theo sẽ tiếp tục từ bước bị lỗi.
          </p>
        )}

        <section className="space-y-3 rounded-xl border border-slate-200 p-4">
          <div>
            <p className="font-bold text-slate-900">1. Thông tin sự kiện</p>
            <p className="text-xs text-slate-500">Sự kiện mới mặc định ở trạng thái Registration.</p>
          </div>
          <Field label="Tên sự kiện" required>
            <input className={inputClass} disabled={Boolean(created.eventId)} value={form.eventName} onChange={(e) => change("eventName", e.target.value)} placeholder="VD: FPT Hackathon 2026" />
          </Field>
          <Field label="Mô tả">
            <textarea className={`${inputClass} min-h-20 resize-y`} disabled={Boolean(created.eventId)} value={form.eventDescription} onChange={(e) => change("eventDescription", e.target.value)} placeholder="Mô tả ngắn về sự kiện" />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Ngày bắt đầu" required>
              <input type="date" className={inputClass} disabled={Boolean(created.eventId)} value={form.eventStartDate} onChange={(e) => change("eventStartDate", e.target.value)} />
            </Field>
            <Field label="Ngày kết thúc" required>
              <input type="date" className={inputClass} disabled={Boolean(created.eventId)} value={form.eventEndDate} onChange={(e) => change("eventEndDate", e.target.value)} />
            </Field>
          </div>
        </section>

        <section className="space-y-3 rounded-xl border border-slate-200 p-4">
          <p className="font-bold text-slate-900">2. Track đầu tiên</p>
          <Field label="Tên track" required>
            <input className={inputClass} disabled={Boolean(created.trackId)} value={form.trackName} onChange={(e) => change("trackName", e.target.value)} placeholder="VD: Web Application" />
          </Field>
          <Field label="Mô tả">
            <textarea className={`${inputClass} min-h-20 resize-y`} disabled={Boolean(created.trackId)} value={form.trackDescription} onChange={(e) => change("trackDescription", e.target.value)} placeholder="Mô tả track" />
          </Field>
          <Field label="Số team tối đa" required>
            <input type="number" min="1" step="1" className={inputClass} disabled={Boolean(created.trackId)} value={form.trackMaxTeams} onChange={(e) => change("trackMaxTeams", e.target.value)} placeholder="20" />
          </Field>
        </section>

        <section className="space-y-3 rounded-xl border border-slate-200 p-4">
          <p className="font-bold text-slate-900">3. Round đầu tiên</p>
          <Field label="Tên round" required>
            <input className={inputClass} disabled={completed} value={form.roundName} onChange={(e) => change("roundName", e.target.value)} placeholder="VD: Vòng sơ loại" />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Bắt đầu" required>
              <input type="datetime-local" className={inputClass} disabled={completed} value={form.roundStartTime} onChange={(e) => change("roundStartTime", e.target.value)} />
            </Field>
            <Field label="Kết thúc" required>
              <input type="datetime-local" className={inputClass} disabled={completed} value={form.roundEndTime} onChange={(e) => change("roundEndTime", e.target.value)} />
            </Field>
          </div>
          <Field label="Số suất đi tiếp" required>
            <input type="number" min="1" step="1" className={inputClass} disabled={completed} value={form.roundAdvancingSlots} onChange={(e) => change("roundAdvancingSlots", e.target.value)} placeholder="5" />
          </Field>
        </section>
      </div>
    </ModalShell>
  );
}
