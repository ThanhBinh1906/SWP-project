import { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  FileWarning,
  GitBranch,
} from "lucide-react";
import eventService from "../../../services/eventService";
import LoadingActionText from "../../shared/LoadingActionText";
import {
  CoordinatorActionButton,
  CoordinatorBadge,
  ModalShell,
} from "../CoordinatorUI";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100";

function toLocalDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-600">
        {label}
        {required && <span className="text-orange-600"> *</span>}
      </span>
      {children}
    </label>
  );
}

export function CloneCompetitionModal({ sourceEvent, onClose, onCompleted }) {
  const [form, setForm] = useState(() => ({
    newName: `${sourceEvent.name} - Bản sao`,
    newStartDate: toLocalDateTime(sourceEvent.startDate),
    newEndDate: toLocalDateTime(sourceEvent.endDate),
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const change = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
  };

  const submit = async () => {
    if (!form.newName.trim())
      return setError("Tên Event mới không được để trống.");
    if (
      !form.newStartDate ||
      !form.newEndDate ||
      form.newEndDate <= form.newStartDate
    )
      return setError("Thời gian Event mới chưa hợp lệ.");
    setSaving(true);
    setError("");
    try {
      const response = await eventService.clone(sourceEvent.id, {
        newName: form.newName.trim(),
        newStartDate: new Date(form.newStartDate).toISOString(),
        newEndDate: new Date(form.newEndDate).toISOString(),
      });
      const data = response.data?.data;
      setResult(data);
      await onCompleted?.(data);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message || "Không thể nhân bản Event.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title={`Sao chép: ${sourceEvent.name}`}
      onClose={() => !saving && onClose?.()}
      maxWidthClass="max-w-4xl"
      maxHeightClass="max-h-[88vh]"
      actions={
        <>
          <CoordinatorActionButton disabled={saving} onClick={onClose}>
            {result ? "Đóng" : "Hủy"}
          </CoordinatorActionButton>
          {!result && (
            <CoordinatorActionButton
              variant="primary"
              icon={Copy}
              disabled={saving}
              onClick={submit}
            >
              {saving ? (
                <LoadingActionText>Đang sao chép Event</LoadingActionText>
              ) : (
                "Tạo bản sao"
              )}
            </CoordinatorActionButton>
          )}
        </>
      }
    >
      <div className="space-y-5">
        {error && (
          <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
        {result ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-6 w-6 text-emerald-600" />
              <div>
                <h3 className="font-bold text-emerald-950">
                  Đã nhân bản Event thành công
                </h3>
                <p className="mt-1 text-sm text-emerald-800">{result.name}</p>
                <div className="mt-3">
                  <CoordinatorBadge tone="orange">
                    {result.status || "Registration"}
                  </CoordinatorBadge>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <section className="rounded-xl border border-slate-200 p-4">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                  <Copy className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-950">
                    Thông tin Event mới
                  </h3>
                  <p className="text-sm text-slate-600">
                    Event mới bắt đầu ở trạng thái Registration.
                  </p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Tên Event mới" required>
                  <input
                    className={inputClass}
                    value={form.newName}
                    onChange={(event) => change("newName", event.target.value)}
                  />
                </Field>
                <div className="hidden md:block" />
                <Field label="Bắt đầu" required>
                  <input
                    type="datetime-local"
                    className={inputClass}
                    value={form.newStartDate}
                    onChange={(event) =>
                      change("newStartDate", event.target.value)
                    }
                  />
                </Field>
                <Field label="Kết thúc" required>
                  <input
                    type="datetime-local"
                    className={inputClass}
                    value={form.newEndDate}
                    onChange={(event) =>
                      change("newEndDate", event.target.value)
                    }
                  />
                </Field>
              </div>
            </section>
            <section className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-center gap-2 font-bold text-emerald-900">
                  <GitBranch className="h-4 w-4" />
                  Sẽ được sao chép
                </div>
                <p className="mt-2 text-sm leading-6 text-emerald-800">
                  Track, Round, Criteria, giới hạn team/thành viên và số suất đi
                  tiếp.
                </p>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-center gap-2 font-bold text-amber-900">
                  <FileWarning className="h-4 w-4" />
                  Không sao chép Topic
                </div>
                <p className="mt-2 text-sm leading-6 text-amber-800">
                  Coordinator cần tạo đề bài mới để đảm bảo nội dung cuộc thi
                  không bị lộ.
                </p>
              </div>
            </section>
          </>
        )}
      </div>
    </ModalShell>
  );
}
