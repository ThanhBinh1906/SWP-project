import { useRef, useState } from "react";
import {
  AlertCircle,
  FileText,
  GitBranch,
  Plus,
  ShieldCheck,
  Trash2,
  Upload,
} from "lucide-react";
import eventService from "../../../services/eventService";
import {
  uploadTopicPdf,
  validateTopicPdf,
} from "../../../services/cloudinaryService";
import LoadingActionText from "../../shared/LoadingActionText";
import { CoordinatorActionButton, ModalShell } from "../CoordinatorUI";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100";

const newTopic = () => ({
  name: "",
  description: "",
  requirements: "",
  attachmentUrl: "",
  file: null,
});

const newRound = (overrides = {}) => ({
  name: "",
  startTime: "",
  endTime: "",
  advancingSlots: "",
  ...overrides,
});

const newTrack = (overrides = {}) => ({
  name: "",
  description: "",
  maxTeams: "",
  maxMembers: "",
  rounds: [newRound()],
  isFinalTrack: false,
  ...overrides,
});

const newFinalTrack = () =>
  newTrack({
    name: "Final Track",
    description: "Track chung kết nhận các đội đi tiếp từ các track vòng loại.",
    isFinalTrack: true,
    rounds: [
      newRound({
        name: "Final Round",
        advancingSlots: "",
        isFinalRound: true,
      }),
    ],
  });

const initialForm = () => ({
  name: "",
  description: "",
  startDate: "",
  endDate: "",
  topic: newTopic(),
  tracks: [newTrack(), newFinalTrack()],
});

function Field({ label, required, children, hint }) {
  return (
    <div className="min-w-0">
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-600">
        {label}
        {required && <span className="text-orange-600"> *</span>}
      </span>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

function isFinalTrack(track) {
  return Boolean(track?.isFinalTrack);
}

function isFinalRound(track, round) {
  return isFinalTrack(track) && Boolean(round?.isFinalRound);
}

function getNormalTrackCount(tracks) {
  return tracks.filter((track) => !isFinalTrack(track)).length;
}

function validate(form) {
  if (!form.name.trim()) return "Vui lòng nhập tên Event.";
  if (!form.startDate || !form.endDate || form.endDate <= form.startDate) {
    return "Thời gian Event chưa hợp lệ.";
  }

  if (!form.topic.name.trim()) return "Vui lòng nhập tên đề tài chung.";
  const topicFileError = validateTopicPdf(form.topic.file);
  if (topicFileError) return `File đề tài chung: ${topicFileError}`;

  const finalTrackIndex = form.tracks.findIndex(isFinalTrack);
  if (finalTrackIndex < 0) return "Cấu trúc phải có Final Track.";
  if (finalTrackIndex !== form.tracks.length - 1) {
    return "Final Track phải nằm cuối danh sách Track.";
  }
  if (getNormalTrackCount(form.tracks) < 1) {
    return "Cấu trúc phải có ít nhất một Track vòng loại.";
  }

  for (let ti = 0; ti < form.tracks.length; ti += 1) {
    const track = form.tracks[ti];
    const trackLabel = isFinalTrack(track) ? "Final Track" : `Track ${ti + 1}`;

    if (!track.name.trim()) return `${trackLabel} chưa có tên.`;

    const maxTeams = Number(track.maxTeams);
    const maxMembers = Number(track.maxMembers);
    if (!Number.isInteger(maxTeams) || maxTeams < 1) {
      return `Team tối đa của ${trackLabel} phải là số nguyên dương.`;
    }
    if (!Number.isInteger(maxMembers) || maxMembers < 1) {
      return `Thành viên tối đa của ${trackLabel} phải là số nguyên dương.`;
    }
    if (!track.rounds.length) return `${trackLabel} phải có ít nhất một Round.`;
    if (isFinalTrack(track) && track.rounds.length !== 1) {
      return "Final Track chỉ được có một Final Round.";
    }

    for (let ri = 0; ri < track.rounds.length; ri += 1) {
      const round = track.rounds[ri];
      const roundLabel = isFinalRound(track, round)
        ? "Final Round"
        : `Round ${ri + 1} của ${trackLabel}`;

      if (!round.name.trim()) return `${roundLabel} chưa có tên.`;
      if (!round.startTime || !round.endTime || round.endTime <= round.startTime) {
        return `Thời gian ${roundLabel} chưa hợp lệ.`;
      }
      if (round.startTime < form.startDate || round.endTime > form.endDate) {
        return `${roundLabel} phải nằm trong thời gian Event.`;
      }

      if (isFinalRound(track, round)) {
        if (round.advancingSlots !== "") {
          return "Final Round không cần nhập suất đi tiếp vì đây là vòng chốt kết quả.";
        }
        continue;
      }

      if (round.advancingSlots === "") {
        return `Suất đi tiếp của ${roundLabel} là bắt buộc.`;
      }

      const advancingSlots = Number(round.advancingSlots);
      if (!Number.isInteger(advancingSlots) || advancingSlots < 1) {
        return `Suất đi tiếp của ${roundLabel} phải là số nguyên dương.`;
      }
      if (advancingSlots > maxTeams) {
        return `Suất đi tiếp của ${roundLabel} không được vượt quá ${maxTeams} team.`;
      }
      if (ri > 0) {
        const previousSlots = Number(track.rounds[ri - 1].advancingSlots);
        if (advancingSlots >= previousSlots) {
          return `Suất đi tiếp của Round ${ri + 1} phải nhỏ hơn Round ${ri} trong cùng ${trackLabel}.`;
        }
      }
    }
  }

  return "";
}

function normalizeTracks(tracks) {
  const finalTrack = tracks.find(isFinalTrack) || newFinalTrack();
  const normalTracks = tracks.filter((track) => !isFinalTrack(track));
  return [...normalTracks, finalTrack];
}

export function CompetitionTemplateModal({ onClose, onCompleted }) {
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [progressLabel, setProgressLabel] = useState("");

  const updateTrack = (ti, field, value) => {
    setForm((current) => ({
      ...current,
      tracks: normalizeTracks(
        current.tracks.map((track, index) =>
          index === ti ? { ...track, [field]: value } : track,
        ),
      ),
    }));
  };

  const updateRound = (ti, ri, field, value) => {
    setForm((current) => ({
      ...current,
      tracks: normalizeTracks(
        current.tracks.map((track, index) =>
          index === ti
            ? {
                ...track,
                rounds: track.rounds.map((round, position) =>
                  position === ri ? { ...round, [field]: value } : round,
                ),
              }
            : track,
        ),
      ),
    }));
  };

  const updateTopic = (field, value) => {
    setForm((current) => ({
      ...current,
      topic: { ...current.topic, [field]: value },
    }));
  };

  const addTrack = () => {
    setForm((current) => {
      const finalTrack = current.tracks.find(isFinalTrack) || newFinalTrack();
      const normalTracks = current.tracks.filter((track) => !isFinalTrack(track));
      return { ...current, tracks: [...normalTracks, newTrack(), finalTrack] };
    });
  };

  const removeTrack = (ti) => {
    setForm((current) => {
      const target = current.tracks[ti];
      if (!target || isFinalTrack(target)) return current;
      const normalTracks = current.tracks.filter(
        (track, index) => index !== ti && !isFinalTrack(track),
      );
      if (!normalTracks.length) return current;
      const finalTrack = current.tracks.find(isFinalTrack) || newFinalTrack();
      return { ...current, tracks: [...normalTracks, finalTrack] };
    });
  };

  const addRound = (ti) => {
    setForm((current) => ({
      ...current,
      tracks: normalizeTracks(
        current.tracks.map((track, index) => {
          if (index !== ti || isFinalTrack(track)) return track;
          return { ...track, rounds: [...track.rounds, newRound()] };
        }),
      ),
    }));
  };

  const removeRound = (ti, ri) => {
    setForm((current) => ({
      ...current,
      tracks: normalizeTracks(
        current.tracks.map((track, index) => {
          if (index !== ti || isFinalTrack(track) || track.rounds.length <= 1) {
            return track;
          }
          return {
            ...track,
            rounds: track.rounds.filter((_, position) => position !== ri),
          };
        }),
      ),
    }));
  };

  const buildPayload = async () => {
    let topicAttachmentUrl = form.topic.attachmentUrl || null;
    if (form.topic.file) {
      setProgressLabel(`Đang tải PDF cho ${form.topic.name}`);
      const upload = await uploadTopicPdf(form.topic.file);
      topicAttachmentUrl = upload.secure_url;
    }

    const topic = {
      name: form.topic.name.trim(),
      description: form.topic.description.trim() || null,
      requirements: form.topic.requirements.trim() || null,
      attachmentUrl: topicAttachmentUrl,
    };

    const tracks = normalizeTracks(form.tracks).map((track) => ({
      name: track.name.trim(),
      description: track.description.trim() || null,
      maxTeams: Number(track.maxTeams),
      maxMembers: Number(track.maxMembers),
      rounds: track.rounds.map((round) => ({
        name: round.name.trim(),
        startTime: new Date(round.startTime).toISOString(),
        endTime: new Date(round.endTime).toISOString(),
        advancingSlots: round.advancingSlots === "" ? null : Number(round.advancingSlots),
      })),
    }));

    return {
      name: form.name.trim(),
      description: form.description.trim() || null,
      startDate: new Date(form.startDate).toISOString(),
      endDate: new Date(form.endDate).toISOString(),
      topic,
      tracks,
    };
  };

  const submit = async () => {
    const validationError = validate(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError("");
    setProgressLabel("Đang chuẩn bị cấu trúc");

    try {
      const payload = await buildPayload();
      setProgressLabel("Đang tạo Event, Topic, Track và Round");
      const response = await eventService.createFull(payload);
      await onCompleted?.(response.data?.data);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Không thể tạo cấu trúc cuộc thi.",
      );
    } finally {
      setSaving(false);
      setProgressLabel("");
    }
  };

  return (
    <ModalShell
      title="Tạo cấu trúc cuộc thi"
      onClose={() => !saving && onClose?.()}
      maxWidthClass="max-w-7xl"
      maxHeightClass="h-[92vh] max-h-[92vh]"
      actions={
        <>
          <CoordinatorActionButton disabled={saving} onClick={onClose}>
            Hủy
          </CoordinatorActionButton>
          <CoordinatorActionButton variant="primary" disabled={saving} onClick={submit}>
            {saving ? (
              <LoadingActionText>
                {progressLabel || "Đang tạo cấu trúc"}
              </LoadingActionText>
            ) : (
              "Tạo Event, Topic, Track và Round"
            )}
          </CoordinatorActionButton>
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

        <section className="rounded-xl border border-orange-200 bg-orange-50/50 p-4">
          <div className="mb-4">
            <p className="font-bold text-slate-950">Thông tin Event</p>
            <p className="text-sm text-slate-600">
              Event được tạo tự động ở trạng thái Registration.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Tên Event" required>
              <input
                className={inputClass}
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
              />
            </Field>
            <Field label="Mô tả">
              <input
                className={inputClass}
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
              />
            </Field>
            <Field label="Bắt đầu" required>
              <input
                type="datetime-local"
                className={inputClass}
                value={form.startDate}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    startDate: event.target.value,
                  }))
                }
              />
            </Field>
            <Field label="Kết thúc" required>
              <input
                type="datetime-local"
                className={inputClass}
                value={form.endDate}
                onChange={(event) =>
                  setForm((current) => ({ ...current, endDate: event.target.value }))
                }
              />
            </Field>
          </div>
        </section>

        <section className="rounded-xl border border-orange-200 bg-white p-4">
          <div className="mb-4 flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-700">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <p className="font-bold text-slate-950">Đề tài chung</p>
              <p className="text-sm text-slate-600">
                Đề tài này áp dụng cho toàn bộ Track và Round trong Event.
              </p>
            </div>
          </div>
          <div className="grid min-w-0 gap-3 lg:grid-cols-2">
            <Field label="Tên đề tài" required>
              <input
                className={inputClass}
                value={form.topic.name}
                onChange={(event) => updateTopic("name", event.target.value)}
              />
            </Field>
            <Field label="Mô tả">
              <input
                className={inputClass}
                value={form.topic.description}
                onChange={(event) => updateTopic("description", event.target.value)}
              />
            </Field>
            <Field label="Yêu cầu">
              <textarea
                className={`${inputClass} min-h-24 resize-y`}
                value={form.topic.requirements}
                onChange={(event) => updateTopic("requirements", event.target.value)}
              />
            </Field>
            <Field label="File đề PDF">
              <PdfFilePicker
                file={form.topic.file}
                onChange={(file) => updateTopic("file", file)}
              />
            </Field>
          </div>
        </section>

        <div className="space-y-4">
          {form.tracks.map((track, ti) => {
            const finalTrack = isFinalTrack(track);
            const normalTrackCount = getNormalTrackCount(form.tracks);

            return (
              <section
                key={finalTrack ? "final-track" : `track-${ti}`}
                className={`rounded-xl border p-4 ${
                  finalTrack
                    ? "border-orange-200 bg-orange-50/40"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {finalTrack ? (
                      <ShieldCheck className="h-5 w-5 text-orange-600" />
                    ) : (
                      <GitBranch className="h-5 w-5 text-orange-600" />
                    )}
                    <div>
                      <h3 className="font-bold text-slate-950">
                        {finalTrack ? "Final Track" : `Track ${ti + 1}`}
                      </h3>
                      {finalTrack && (
                        <p className="text-xs font-medium text-orange-700">
                          Luôn nằm cuối và không thể xóa.
                        </p>
                      )}
                    </div>
                  </div>

                  {!finalTrack && normalTrackCount > 1 && (
                    <IconButton
                      label={`Xóa Track ${ti + 1}`}
                      onClick={() => removeTrack(ti)}
                    />
                  )}
                </div>

                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                  <Field label="Tên Track" required>
                    <input
                      className={inputClass}
                      value={track.name}
                      onChange={(event) => updateTrack(ti, "name", event.target.value)}
                    />
                  </Field>
                  <Field label="Mô tả">
                    <input
                      className={inputClass}
                      value={track.description}
                      onChange={(event) =>
                        updateTrack(ti, "description", event.target.value)
                      }
                    />
                  </Field>
                  <Field label="Team tối đa" required>
                    <input
                      required
                      type="number"
                      min="1"
                      step="1"
                      className={inputClass}
                      value={track.maxTeams}
                      onChange={(event) =>
                        updateTrack(ti, "maxTeams", event.target.value)
                      }
                    />
                  </Field>
                  <Field label="Thành viên tối đa" required>
                    <input
                      required
                      type="number"
                      min="1"
                      step="1"
                      className={inputClass}
                      value={track.maxMembers}
                      onChange={(event) =>
                        updateTrack(ti, "maxMembers", event.target.value)
                      }
                    />
                  </Field>
                </div>

                <div className="mt-4 space-y-3">
                  {track.rounds.map((round, ri) => {
                    const finalRound = isFinalRound(track, round);

                    return (
                      <div
                        key={finalRound ? "final-round" : `round-${ri}`}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <div>
                            <p className="font-bold text-slate-900">
                              {finalRound ? "Final Round" : `Round ${ri + 1}`}
                            </p>
                            {finalRound && (
                              <p className="text-xs text-slate-600">
                                Vòng chung kết không cần suất đi tiếp.
                              </p>
                            )}
                          </div>
                          {!finalTrack && track.rounds.length > 1 && (
                            <IconButton
                              label={`Xóa Round ${ri + 1}`}
                              onClick={() => removeRound(ti, ri)}
                            />
                          )}
                        </div>

                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                          <Field label="Tên Round" required>
                            <input
                              className={inputClass}
                              value={round.name}
                              onChange={(event) =>
                                updateRound(ti, ri, "name", event.target.value)
                              }
                            />
                          </Field>
                          <Field label="Bắt đầu" required>
                            <input
                              type="datetime-local"
                              className={inputClass}
                              value={round.startTime}
                              onChange={(event) =>
                                updateRound(ti, ri, "startTime", event.target.value)
                              }
                            />
                          </Field>
                          <Field label="Kết thúc" required>
                            <input
                              type="datetime-local"
                              className={inputClass}
                              value={round.endTime}
                              onChange={(event) =>
                                updateRound(ti, ri, "endTime", event.target.value)
                              }
                            />
                          </Field>
                          <Field
                            label="Suất đi tiếp"
                            required={!finalRound}
                            hint={finalRound ? "Vòng chung kết không cần suất đi tiếp." : ""}
                          >
                            <input
                              type="number"
                              min="1"
                              step="1"
                              disabled={finalRound}
                              placeholder={finalRound ? "Final Round" : "VD: 5"}
                              className={`${inputClass} disabled:bg-slate-100 disabled:text-slate-500`}
                              value={round.advancingSlots}
                              onChange={(event) =>
                                updateRound(ti, ri, "advancingSlots", event.target.value)
                              }
                            />
                          </Field>
                        </div>
                      </div>
                    );
                  })}

                  {!finalTrack && (
                    <button
                      type="button"
                      onClick={() => addRound(ti)}
                      className="inline-flex items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-white"
                    >
                      <Plus className="h-4 w-4" />
                      Thêm Round
                    </button>
                  )}
                </div>
              </section>
            );
          })}
        </div>

        <button
          type="button"
          onClick={addTrack}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-orange-300 py-3 text-sm font-bold text-orange-700 hover:bg-orange-50"
        >
          <Plus className="h-4 w-4" />
          Thêm Track vòng loại
        </button>
      </div>
    </ModalShell>
  );
}

function IconButton({ label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg p-2 text-red-600 hover:bg-red-50"
      aria-label={label}
      title={label}
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}

function PdfFilePicker({ file, onChange }) {
  const inputRef = useRef(null);

  return (
    <div className="min-w-0">
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(event) => {
          onChange(event.target.files?.[0] || null);
          event.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex min-h-20 w-full min-w-0 items-center justify-center gap-2 overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 text-sm font-semibold text-slate-700 hover:border-orange-400"
      >
        <Upload className="h-4 w-4 shrink-0" />
        <span className="min-w-0 truncate">{file?.name || "Chọn PDF"}</span>
      </button>
    </div>
  );
}
