import { useRef, useState } from "react";
import {
  FileText,
  GitBranch,
  Image as ImageIcon,
  Plus,
  ShieldCheck,
  Trash2,
  Upload,
} from "lucide-react";
import eventService from "../../../services/eventService";
import {
  uploadEventBannerImage,
  uploadTopicPdf,
  validateEventBannerImage,
  validateTopicPdf,
} from "../../../services/cloudinaryService";
import LoadingActionText from "../../shared/LoadingActionText";
import RichTextEditor from "../../shared/RichTextEditor";
import { CoordinatorActionButton, ModalShell } from "../CoordinatorUI";
import { FormError, getInvalidFieldClass } from "../coordinatorHelpers";

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
  isFinal: false,
  isFinalTrack: false,
  ...overrides,
});

const newFinalTrack = () =>
  newTrack({
    name: "Final Track",
    description: "Track chung kết nhận các đội đi tiếp từ các track vòng loại.",
    isFinal: true,
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
  bannerUrl: "",
  bannerFile: null,
  location: "",
  isOnline: false,
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
      {hint && <p className="mt-1 text-xs text-slate-700">{hint}</p>}
    </div>
  );
}

function isFinalTrack(track) {
  return Boolean(track?.isFinal || track?.isFinalTrack);
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

  const bannerError = validateEventBannerImage(form.bannerFile);
  if (bannerError) return `Ảnh banner: ${bannerError}`;

  if (!form.topic.name.trim()) return "Vui lòng nhập tên đề tài cho vòng loại.";
  const topicFileError = validateTopicPdf(form.topic.file);
  if (topicFileError) return `File đề tài vòng loại: ${topicFileError}`;

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
    if (!track.rounds.length) return `${trackLabel} phải có một Round.`;
    if (track.rounds.length !== 1) {
      return `${trackLabel} hiện chỉ được có một Round.`;
    }

    for (let ri = 0; ri < track.rounds.length; ri += 1) {
      const round = track.rounds[ri];
      const roundLabel = isFinalRound(track, round)
        ? "Final Round"
        : `Round của ${trackLabel}`;

      if (!round.name.trim()) return `${roundLabel} chưa có tên.`;
      if (!round.startTime || !round.endTime || round.endTime <= round.startTime) {
        return `Thời gian ${roundLabel} chưa hợp lệ.`;
      }
      if (round.startTime < form.startDate || round.endTime > form.endDate) {
        return `${roundLabel} phải nằm trong thời gian Event.`;
      }

      if (isFinalRound(track, round)) {
        if (round.advancingSlots !== "") {
          return "Final Round không cần nhập suất đi tiếp.";
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

  const buildPayload = async () => {
    let bannerUrl = form.bannerUrl || null;
    if (form.bannerFile) {
      setProgressLabel("Đang tải ảnh banner");
      const upload = await uploadEventBannerImage(form.bannerFile);
      bannerUrl = upload.secure_url;
    }

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
      isFinal: isFinalTrack(track),
      rounds: track.rounds.slice(0, 1).map((round) => ({
        name: round.name.trim(),
        startTime: new Date(round.startTime).toISOString(),
        endTime: new Date(round.endTime).toISOString(),
        advancingSlots:
          round.advancingSlots === "" ? null : Number(round.advancingSlots),
      })),
    }));

    return {
      name: form.name.trim(),
      description: form.description.trim() || null,
      bannerUrl,
      location: form.location.trim() || null,
      isOnline: Boolean(form.isOnline),
      startDate: new Date(form.startDate).toISOString(),
      endDate: new Date(form.endDate).toISOString(),
      topic,
      tracks,
    };
  };

  const submit = async () => {
    const validationError = validate(form);
    if (validationError) {
      setError("");
      window.requestAnimationFrame(() => setError(validationError));
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

  const hasSubmitError = Boolean(error);
  const eventNameInvalid = hasSubmitError && !form.name.trim();
  const eventTimeInvalid =
    hasSubmitError &&
    (!form.startDate || !form.endDate || form.endDate <= form.startDate);
  const topicNameInvalid = hasSubmitError && !form.topic.name.trim();
  const topicFileInvalid = hasSubmitError && Boolean(validateTopicPdf(form.topic.file));

  return (
    <ModalShell
      title="Tạo cấu trúc cuộc thi"
      onClose={() => !saving && onClose?.()}
      maxWidthClass="max-w-[min(1280px,calc(100vw-32px))]"
      maxHeightClass="h-[94dvh] max-h-[94dvh]"
      actions={
        <>
          <CoordinatorActionButton disabled={saving} onClick={onClose}>
            Hủy
          </CoordinatorActionButton>
          <CoordinatorActionButton
            variant="primary"
            disabled={saving}
            onClick={submit}
          >
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
      <div className="mx-auto w-full max-w-6xl space-y-5">
        <FormError msg={error} />

        <section className="rounded-2xl border border-orange-100 bg-orange-50/40 p-5 shadow-sm">
          <div className="mb-4">
            <p className="font-bold text-slate-950">Thông tin Event</p>
            <p className="text-sm text-slate-600">
              Event được tạo ở trạng thái Registration. Mô tả bên dưới sẽ được
              lưu dưới dạng HTML để hiển thị ở trang public.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Tên Event" required>
              <input
                className={`${inputClass} ${getInvalidFieldClass(eventNameInvalid)}`}
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
              />
            </Field>
            <Field label="Địa điểm">
              <input
                className={inputClass}
                value={form.location}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    location: event.target.value,
                  }))
                }
                placeholder={form.isOnline ? "Online" : "VD: FPT University HCM"}
              />
            </Field>
            <Field label="Bắt đầu" required>
              <input
                type="datetime-local"
                className={`${inputClass} ${getInvalidFieldClass(eventTimeInvalid)}`}
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
                className={`${inputClass} ${getInvalidFieldClass(eventTimeInvalid)}`}
                value={form.endDate}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    endDate: event.target.value,
                  }))
                }
              />
            </Field>
            <Field label="Hình thức">
              <label className="flex min-h-20 items-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-orange-600"
                  checked={form.isOnline}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      isOnline: event.target.checked,
                    }))
                  }
                />
                Tổ chức online
              </label>
            </Field>
            <Field label="Ảnh banner">
              <ImageFilePicker
                file={form.bannerFile}
                url={form.bannerUrl}
                onFileChange={(file) =>
                  setForm((current) => ({
                    ...current,
                    bannerFile: file,
                    bannerUrl: file ? "" : current.bannerUrl,
                  }))
                }
              />
            </Field>
            <div className="md:col-span-2">
              <Field
                label="Mô tả Event"
                hint="Có thể định dạng tiêu đề, danh sách, link và ảnh. Nội dung sẽ lưu vào description dưới dạng HTML."
              >
                <RichTextEditor
                  value={form.description}
                  onChange={(html) =>
                    setForm((current) => ({ ...current, description: html }))
                  }
                  minHeightClass="min-h-36"
                  placeholder="Nhập mô tả sự kiện cho trang public..."
                />
              </Field>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-700">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <p className="font-bold text-slate-950">Đề cho vòng loại</p>
              <p className="text-sm text-slate-600">
                Hệ thống sẽ tạo đề này cho từng Round thường. Final Round dùng lại bài thi của đội đi tiếp.
              </p>
            </div>
          </div>
          <div className="grid min-w-0 gap-3 lg:grid-cols-2">
            <Field label="Tên đề tài" required>
              <input
                className={`${inputClass} ${getInvalidFieldClass(topicNameInvalid)}`}
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
                invalid={topicFileInvalid}
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
              <div
                key={finalTrack ? "final-track-group" : `track-group-${ti}`}
                className="space-y-4"
              >
                {finalTrack && (
                  <button
                    type="button"
                    onClick={addTrack}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-orange-300 py-3 text-sm font-bold text-orange-700 hover:bg-orange-50"
                  >
                    <Plus className="h-4 w-4" />
                    Thêm Track
                  </button>
                )}

                <section
                  className={`rounded-xl border p-4 ${
                    finalTrack
                      ? "border-orange-200 bg-[#f0f0f0]"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  {finalTrack && (
                    <div className="mb-4 h-px bg-gradient-to-r from-transparent via-orange-300 to-transparent" />
                  )}
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
                        onChange={(event) =>
                          updateTrack(ti, "name", event.target.value)
                        }
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
                          <div className="mb-3">
                            <p className="font-bold text-slate-900">
                              {finalRound ? "Final Round" : "Round của Track"}
                            </p>
                            {finalRound && (
                              <p className="text-xs text-slate-600">
                                Vòng chung kết không cần suất đi tiếp.
                              </p>
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
                                  updateRound(
                                    ti,
                                    ri,
                                    "startTime",
                                    event.target.value,
                                  )
                                }
                              />
                            </Field>
                            <Field label="Kết thúc" required>
                              <input
                                type="datetime-local"
                                className={inputClass}
                                value={round.endTime}
                                onChange={(event) =>
                                  updateRound(
                                    ti,
                                    ri,
                                    "endTime",
                                    event.target.value,
                                  )
                                }
                              />
                            </Field>
                            <Field
                              label="Suất đi tiếp"
                              required={!finalRound}
                              hint={
                                finalRound
                                  ? "Vòng chung kết không cần suất đi tiếp."
                                  : ""
                              }
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
                                  updateRound(
                                    ti,
                                    ri,
                                    "advancingSlots",
                                    event.target.value,
                                  )
                                }
                              />
                            </Field>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>
            );
          })}
        </div>
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

function PdfFilePicker({ file, invalid, onChange }) {
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
        className={`flex min-h-20 w-full min-w-0 items-center justify-center gap-2 overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 text-sm font-semibold text-slate-700 hover:border-orange-400 ${getInvalidFieldClass(invalid)}`}
      >
        <Upload className="h-4 w-4 shrink-0" />
        <span className="min-w-0 truncate">{file?.name || "Chọn PDF"}</span>
      </button>
    </div>
  );
}

function ImageFilePicker({ file, url, onFileChange }) {
  const inputRef = useRef(null);

  return (
    <div className="min-w-0">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(event) => {
          onFileChange(event.target.files?.[0] || null);
          event.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex min-h-20 w-full min-w-0 items-center justify-center gap-2 overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 text-sm font-semibold text-slate-700 transition hover:border-orange-400 hover:bg-orange-50"
      >
        <ImageIcon className="h-4 w-4 shrink-0" />
        <span className="min-w-0 truncate">
          {file?.name || (url ? "Đã có ảnh banner" : "Chọn ảnh banner")}
        </span>
      </button>
    </div>
  );
}
