import { useState, useEffect, useCallback } from "react";
import {
  CoordinatorActionButton,
  CoordinatorPanel,
  ModalShell,
  icons,
} from "../CoordinatorUI";
import eventService from "../../../services/eventService";
import trackService from "../../../services/trackService";
import roundService from "../../../services/roundService";
import topicService from "../../../services/topicService";
import {
  TOPIC_PDF_MAX_SIZE,
  uploadTopicPdf,
  validateTopicPdf,
} from "../../../services/cloudinaryService";
import {
  FormError,
  LoadingState,
  ApiErrorState,
  getApiMessage,
  SetupRequiredBanner,
  validateRoundSelection,
  FormField,
  FilterSelect,
  ModalHintBanner,
} from "../coordinatorHelpers";
import LoadingActionText from "../../shared/LoadingActionText";

const EMPTY_FORM = {
  title: "",
  description: "",
  requirements: "",
  attachmentUrl: "",
};

export function TopicsManagement() {
  const [events, setEvents] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [selectedTrackId, setSelectedTrackId] = useState("");
  const [selectedRoundId, setSelectedRoundId] = useState("");

  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const [selected, setSelected] = useState(null);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
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
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedEventId) {
      setTracks([]);
      setSelectedTrackId("");
      return;
    }
    setTracks([]);
    setSelectedTrackId("");
    trackService
      .getByEvent(selectedEventId)
      .then((res) => {
        const list = res.data?.data || [];
        setTracks(list);
        setSelectedTrackId(list.length > 0 ? String(list[0].id) : "");
      })
      .catch(() => setTracks([]));
  }, [selectedEventId]);

  useEffect(() => {
    if (!selectedTrackId) {
      setRounds([]);
      setSelectedRoundId("");
      return;
    }
    setRounds([]);
    setSelectedRoundId("");
    roundService
      .getByTrack(selectedTrackId)
      .then((res) => {
        const list = res.data?.data || [];
        setRounds(list);
        setSelectedRoundId(list.length > 0 ? String(list[0].id) : "");
      })
      .catch(() => setRounds([]));
  }, [selectedTrackId]);

  const fetchTopics = useCallback(async () => {
    if (!selectedRoundId) {
      setTopics([]);
      return;
    }
    setLoading(true);
    setApiError("");
    try {
      const res = await topicService.getByRound(selectedRoundId);
      setTopics(res.data?.data || []);
    } catch (err) {
      setApiError(getApiMessage(err, "Không thể tải đề tài."));
    } finally {
      setLoading(false);
    }
  }, [selectedRoundId]);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  const roundCheck = validateRoundSelection({
    selectedEventId,
    selectedTrackId,
    selectedRoundId,
    rounds,
    tracks,
    events,
  });

  const handleCreate = async () => {
    const check = validateRoundSelection({
      selectedEventId,
      selectedTrackId,
      selectedRoundId,
      rounds,
      tracks,
      events,
    });
    if (!check.roundId) {
      setFormError(check.error);
      return;
    }
    if (!form.title.trim()) {
      setFormError("Tiêu đề đề tài không được để trống.");
      return;
    }
    const fileError = validateTopicPdf(attachmentFile);
    if (fileError) {
      setFormError(fileError);
      return;
    }
    setSaving(true);
    setUploadProgress(0);
    try {
      let attachmentUrl = form.attachmentUrl.trim() || null;
      if (attachmentFile) {
        const uploadResult = await uploadTopicPdf(attachmentFile, {
          onProgress: setUploadProgress,
        });
        attachmentUrl = uploadResult.secure_url;
        setForm((prev) => ({ ...prev, attachmentUrl }));
      }

      await topicService.create(check.roundId, {
        title: form.title.trim(),
        description: form.description.trim() || null,
        requirements: form.requirements.trim() || null,
        attachmentUrl,
      });
      await fetchTopics();
      setModal(false);
      setForm(EMPTY_FORM);
      setAttachmentFile(null);
      setUploadProgress(0);
      setFormError("");
    } catch (err) {
      setFormError(getApiMessage(err, "Tạo đề tài thất bại."));
    } finally {
      setSaving(false);
    }
  };

  const selectedTrack = tracks.find((t) => String(t.id) === selectedTrackId);
  const selectedRound = rounds.find((r) => String(r.id) === selectedRoundId);

  return (
    <div className="space-y-6">
      <CoordinatorPanel
        title="Bộ lọc đề tài"
        subtitle="Chọn Event → Track → Round trước khi thêm Topic"
        icon={icons.Filter}
        actions={
          <CoordinatorActionButton
            variant="primary"
            icon={icons.Plus}
            disabled={!roundCheck.roundId}
            onClick={() => {
              if (!roundCheck.roundId) return;
              setForm(EMPTY_FORM);
              setAttachmentFile(null);
              setUploadProgress(0);
              setFormError("");
              setModal(true);
            }}
          >
            Add Topic
          </CoordinatorActionButton>
        }
      >
        <div className="grid gap-3 md:grid-cols-3">
          <FilterSelect
            label="Sự kiện (Event)"
            icon={icons.CalendarDays}
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
          >
            {events.length === 0 ? (
              <option value="">Chưa có sự kiện</option>
            ) : (
              events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name}
                </option>
              ))
            )}
          </FilterSelect>
          <FilterSelect
            label="Bảng thi (Track)"
            icon={icons.GitBranch}
            value={selectedTrackId}
            onChange={(e) => setSelectedTrackId(e.target.value)}
            disabled={!tracks.length}
          >
            {tracks.length === 0 ? (
              <option value="">Chưa có Track</option>
            ) : (
              tracks.map((tr) => (
                <option key={tr.id} value={tr.id}>
                  {tr.name}
                </option>
              ))
            )}
          </FilterSelect>
          <FilterSelect
            label="Vòng thi (Round)"
            icon={icons.Timer}
            value={selectedRoundId}
            onChange={(e) => setSelectedRoundId(e.target.value)}
            disabled={!rounds.length}
          >
            {rounds.length === 0 ? (
              <option value="">Chưa có Round — tạo ở Competition Setup</option>
            ) : (
              rounds.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))
            )}
          </FilterSelect>
        </div>
      </CoordinatorPanel>

      {roundCheck.error && (
        <SetupRequiredBanner
          title={roundCheck.error}
          hint="Thứ tự: Event → Track → Round → Topic"
        />
      )}

      {loading ? (
        <LoadingState />
      ) : apiError ? (
        <ApiErrorState message={apiError} onRetry={fetchTopics} />
      ) : !roundCheck.roundId ? null : topics.length === 0 ? (
        <p className="py-12 text-center text-sm text-slate-600">
          Chưa có đề tài cho vòng này.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {topics.map((topic) => (
            <button
              key={topic.id}
              type="button"
              onClick={() => setSelected(topic)}
              className="rounded-2xl border bg-white p-5 text-left transition hover:-translate-y-0.5 hover:shadow-lg"
              style={{ borderColor: "#E5E7EB" }}
            >
              <h3 className="font-bold text-slate-900">{topic.title}</h3>
              <p className="mt-1 text-sm text-slate-700">
                {selectedTrack?.name} • {selectedRound?.name}
              </p>
              {topic.description && (
                <p className="mt-2 text-xs text-slate-700 line-clamp-2">
                  {topic.description}
                </p>
              )}
            </button>
          ))}
        </div>
      )}

      {selected && (
        <ModalShell
          title="Topic details"
          onClose={() => setSelected(null)}
          actions={
            <CoordinatorActionButton
              variant="primary"
              onClick={() => setSelected(null)}
            >
              Done
            </CoordinatorActionButton>
          }
        >
          <div className="min-w-0 space-y-4 overflow-x-hidden pb-2 text-sm text-slate-600">
            <TopicDetailRow label="Title">{selected.title}</TopicDetailRow>
            <TopicDetailRow label="Description">
              {selected.description || "—"}
            </TopicDetailRow>
            <TopicDetailRow label="Requirements">
              {selected.requirements || "—"}
            </TopicDetailRow>
            {selected.attachmentUrl && (
              <TopicDetailRow label="Attachment">
                <a
                  href={selected.attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block max-w-full break-all text-[#F26F21] hover:underline"
                >
                  {selected.attachmentUrl}
                </a>
              </TopicDetailRow>
            )}
          </div>
        </ModalShell>
      )}

      {modal && (
        <ModalShell
          title="Thêm đề tài (Topic)"
          onClose={() => {
            if (saving) return;
            setModal(false);
            setAttachmentFile(null);
            setUploadProgress(0);
          }}
          actions={
            <>
              <CoordinatorActionButton
                disabled={saving}
                onClick={() => {
                  setModal(false);
                  setAttachmentFile(null);
                  setUploadProgress(0);
                }}
              >
                Hủy
              </CoordinatorActionButton>
              <CoordinatorActionButton
                variant="primary"
                disabled={saving}
                onClick={handleCreate}
              >
                {saving ? <LoadingActionText>Đang lưu đề tài</LoadingActionText> : "Lưu đề tài"}
              </CoordinatorActionButton>
            </>
          }
        >
          <div className="min-w-0 space-y-4 overflow-x-hidden pb-2">
            <ModalHintBanner icon={icons.Lightbulb} title="Đề tài (Topic) là gì?">
              Topic là đề bài/hướng dẫn thi cho vòng đó. Team Leader có thể tham khảo
              khi làm project — khác với bài nộp (Demo/Report URL) ở mục Submit.
            </ModalHintBanner>
            <FormError msg={formError} />
            <FormField
              label="Tiêu đề đề tài"
              icon={icons.Lightbulb}
              required
              hint="Tên ngắn gọn, VD: Smart Campus Assistant"
            >
              <input
                className="min-w-0 max-w-full w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
                placeholder="Smart Campus Assistant"
                value={form.title}
                onChange={(e) =>
                  setForm((p) => ({ ...p, title: e.target.value }))
                }
              />
            </FormField>
            <FormField
              label="Mô tả"
              icon={icons.Edit3}
              hint="Giải thích đề bài, bối cảnh, mục tiêu"
            >
              <textarea
                className="min-h-20 min-w-0 max-h-40 max-w-full w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
                placeholder="Xây dựng ứng dụng AI hỗ trợ sinh viên..."
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
              />
            </FormField>
            <FormField
              label="Yêu cầu kỹ thuật"
              icon={icons.CheckCircle2}
              hint="Stack, tính năng bắt buộc, tiêu chí đánh giá"
            >
              <textarea
                className="min-h-20 min-w-0 max-h-40 max-w-full w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
                placeholder="Công nghệ sử dụng, yêu cầu demo, tiêu chí kỹ thuật cần đạt..."
                value={form.requirements}
                onChange={(e) =>
                  setForm((p) => ({ ...p, requirements: e.target.value }))
                }
              />
            </FormField>
            <FormField
              label="File tài liệu đính kèm"
              icon={icons.Upload}
              hint="Chỉ hỗ trợ PDF, tối đa 10MB. Sau khi chọn file, hệ thống sẽ tự lưu và gắn vào đề tài."
            >
              <TopicPdfUpload
                file={attachmentFile}
                progress={uploadProgress}
                disabled={saving}
                attachmentUrl={form.attachmentUrl}
                onChange={(file) => {
                  const error = validateTopicPdf(file);
                  if (error) {
                    setFormError(error);
                    return;
                  }
                  setAttachmentFile(file);
                  setUploadProgress(0);
                  setForm((p) => ({ ...p, attachmentUrl: "" }));
                  setFormError("");
                }}
                onRemove={() => {
                  setAttachmentFile(null);
                  setUploadProgress(0);
                  setForm((p) => ({ ...p, attachmentUrl: "" }));
                }}
              />
            </FormField>
          </div>
        </ModalShell>
      )}
    </div>
  );
}

function TopicDetailRow({ label, children }) {
  return (
    <div className="min-w-0">
      <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-700">
        {label}
      </p>
      <div className="max-w-full break-words leading-6 text-slate-700">
        {children}
      </div>
    </div>
  );
}

function TopicPdfUpload({
  file,
  progress,
  disabled,
  attachmentUrl,
  onChange,
  onRemove,
}) {
  const maxSizeMb = Math.round(TOPIC_PDF_MAX_SIZE / 1024 / 1024);

  return (
    <div className="min-w-0 space-y-3">
      <label
        className={`flex min-h-[118px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-4 py-5 text-center transition ${
          disabled
            ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-70"
            : "border-orange-200 bg-orange-50/40 hover:border-[#F26F21] hover:bg-orange-50"
        }`}
      >
        <input
          type="file"
          accept="application/pdf,.pdf"
          disabled={disabled}
          className="sr-only"
          onChange={(e) => {
            const selectedFile = e.target.files?.[0];
            e.target.value = "";
            if (selectedFile) onChange(selectedFile);
          }}
        />
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#F26F21] shadow-sm">
          <icons.Upload className="h-5 w-5" />
        </span>
        <span className="mt-3 text-sm font-bold text-slate-800">
          Chọn file PDF đề bài
        </span>
        <span className="mt-1 text-xs text-slate-700">
          Kéo thả/chọn file PDF, tối đa {maxSizeMb}MB
        </span>
      </label>

      {file && (
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">
                {file.name}
              </p>
              <p className="mt-0.5 text-xs text-slate-700">
                {(file.size / 1024 / 1024).toFixed(2)}MB
              </p>
            </div>
            <button
              type="button"
              disabled={disabled}
              onClick={onRemove}
              className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Bỏ file
            </button>
          </div>
          {progress > 0 && (
            <div className="mt-3">
              <div className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>Đang upload Cloudinary</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-[#F26F21] transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {attachmentUrl && !file && (
        <a
          href={attachmentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block max-w-full truncate rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:underline"
        >
          File đã upload: {attachmentUrl}
        </a>
      )}
    </div>
  );
}
