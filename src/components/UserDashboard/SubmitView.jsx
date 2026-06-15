import { useState, useEffect, useCallback, useMemo } from "react";
import {
  AlertCircle,
  CheckCircle,
  CloudUpload,
  ExternalLink,
  FileText,
  Github,
  Link,
  Loader2,
} from "lucide-react";
import teamService from "../../services/teamService";
import submissionService from "../../services/submissionService";
import { getApiMessage } from "../Coordinator/coordinatorHelpers";

const EMPTY_FORM = {
  projectLink: "",
  slideLink: "",
  githubLink: "",
};

function normalizeUrl(value) {
  return value.trim();
}

function isValidUrl(value) {
  if (!value?.trim()) return false;
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isValidGithubUrl(value) {
  if (!isValidUrl(value)) return false;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" && url.hostname.toLowerCase() === "github.com";
  } catch {
    return false;
  }
}

function isRoundOpen(round, now = new Date()) {
  if (round?.status !== "Active") return false;

  const startTime = new Date(round.startTime);
  const endTime = new Date(round.endTime);

  if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
    return false;
  }

  return startTime <= now && now <= endTime;
}

function getSubmissionGithubLink(submission, team) {
  return (
    submission?.githubRepoLink ||
    submission?.githubUrl ||
    submission?.sourceCodeUrl ||
    submission?.sourceUrl ||
    team?.githubRepoLink ||
    ""
  );
}

function buildSubmissionPayload(form) {
  return {
    demoUrl: normalizeUrl(form.projectLink),
    reportUrl: normalizeUrl(form.slideLink),
    githubRepoLink: normalizeUrl(form.githubLink),
  };
}

function FieldError({ children }) {
  if (!children) return null;
  return <p className="mt-1.5 text-xs font-medium text-red-600">{children}</p>;
}

function AlertBox({ tone = "warning", icon: Icon = AlertCircle, title, children }) {
  const styles = {
    warning: {
      background: "#FFFBEB",
      border: "1px solid #FDE68A",
      color: "#92400E",
    },
    danger: {
      background: "rgba(239,68,68,0.06)",
      border: "1px solid rgba(239,68,68,0.2)",
      color: "#dc2626",
    },
    success: {
      background: "#D1FAE5",
      border: "1px solid #A7F3D0",
      color: "#047857",
    },
  };

  return (
    <div className="rounded-2xl p-4 text-sm" style={styles[tone]}>
      <div className="flex items-start gap-2">
        <Icon className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <div>
          {title && <p className="font-semibold">{title}</p>}
          {children && <div className={title ? "mt-1" : ""}>{children}</div>}
        </div>
      </div>
    </div>
  );
}

function SubmissionField({
  label,
  required,
  icon: Icon,
  value,
  onChange,
  placeholder,
  error,
  disabled,
  hint,
}) {
  return (
    <div>
      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div
        className={`mt-1.5 flex items-center gap-2 rounded-xl border px-3 py-2.5 ${
          error ? "border-red-300 bg-red-50/40" : "border-slate-300 bg-white"
        }`}
      >
        <Icon className="h-4 w-4 flex-shrink-0 text-slate-500" />
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="min-w-0 flex-1 bg-transparent text-sm outline-none disabled:cursor-not-allowed"
        />
      </div>
      <FieldError>{error}</FieldError>
      {hint && !error && <p className="mt-1.5 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

function PreviewLink({ href }) {
  if (!isValidUrl(href)) {
    return <p className="mt-1 truncate text-slate-400">Chưa sẵn sàng</p>;
  }

  return (
    <a
      className="mt-1 inline-flex max-w-full items-center gap-1 truncate font-semibold text-orange-700"
      href={href.trim()}
      target="_blank"
      rel="noreferrer"
    >
      <span className="truncate">{href.trim()}</span>
      <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
    </a>
  );
}

function SubmissionForm({ eventId }) {
  const [team, setTeam] = useState(null);
  const [activeRound, setActiveRound] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [selectedRoundId, setSelectedRoundId] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = useCallback(async () => {
    if (!eventId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const teamRes = await teamService.getMyTeam(eventId);
      const myTeam = teamRes.data?.data;
      setTeam(myTeam || null);

      if (!myTeam) {
        setActiveRound(null);
        setSubmissions([]);
        setSelectedRoundId("");
        return;
      }

      const [activeRoundRes, subsRes] = await Promise.all([
        teamService.getMyActiveRound(),
        submissionService.getByTeam(myTeam.id),
      ]);

      const currentRound = activeRoundRes.data?.data || null;
      const submissionList = subsRes.data?.data || [];

      setActiveRound(currentRound);
      setSubmissions(submissionList);
      setSelectedRoundId(currentRound?.id ? String(currentRound.id) : "");
    } catch (err) {
      if (err?.response?.status === 404) {
        setTeam(null);
      } else {
        setError(getApiMessage(err, "Không thể tải thông tin nộp bài."));
      }
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const existingSubmission = useMemo(
    () => submissions.find((s) => String(s.roundId) === selectedRoundId),
    [selectedRoundId, submissions],
  );

  const selectedRound = useMemo(
    () =>
      activeRound && String(activeRound.id) === selectedRoundId
        ? activeRound
        : null,
    [activeRound, selectedRoundId],
  );

  useEffect(() => {
    setForm({
      projectLink: existingSubmission?.demoUrl || "",
      slideLink: existingSubmission?.reportUrl || "",
      githubLink: getSubmissionGithubLink(existingSubmission, team),
    });
    setFieldErrors({});
    setError("");
    setSuccess("");
  }, [existingSubmission?.id, selectedRoundId, team?.githubRepoLink]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: "" }));
    setError("");
    setSuccess("");
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!form.projectLink.trim()) {
      nextErrors.projectLink = "Vui lòng nhập link dự án.";
    } else if (!isValidUrl(form.projectLink)) {
      nextErrors.projectLink = "Link dự án phải là URL http(s) hợp lệ.";
    }

    if (!form.slideLink.trim()) {
      nextErrors.slideLink = "Vui lòng nhập link slide.";
    } else if (!isValidUrl(form.slideLink)) {
      nextErrors.slideLink = "Link slide phải là URL http(s) hợp lệ.";
    }

    if (!form.githubLink.trim()) {
      nextErrors.githubLink = "Vui lòng nhập link GitHub source code.";
    } else if (!isValidGithubUrl(form.githubLink)) {
      nextErrors.githubLink = "Link GitHub phải bắt đầu bằng https://github.com/.";
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (saving) return;
    setError("");
    setSuccess("");

    if (!team) {
      setError("Bạn chưa có team. Vui lòng tạo team trước khi nộp bài.");
      return;
    }
    if (team.status !== "Approved") {
      setError("Team chưa được Coordinator duyệt. Không thể nộp bài.");
      return;
    }
    if (!activeRound) {
      setError("Chưa có vòng thi đang diễn ra.");
      return;
    }
    if (!activeRound.topic) {
      setError("Đề chưa được phát nên chưa thể nộp bài.");
      return;
    }
    if (!selectedRoundId) {
      setError("Không có vòng thi Active trong thời gian cho phép để nộp bài.");
      return;
    }
    if (!selectedRound || !isRoundOpen(selectedRound)) {
      setError("Round hiện tại không ở trạng thái Active hoặc đã ngoài khung thời gian nộp bài.");
      return;
    }
    if (!validateForm()) return;

    setSaving(true);
    try {
      const payload = buildSubmissionPayload(form);

      if (existingSubmission) {
        await submissionService.update(existingSubmission.id, payload);
        setSuccess("Cập nhật bài nộp thành công.");
      } else {
        await submissionService.create(selectedRoundId, payload);
        setSuccess("Nộp bài thành công.");
      }

      await loadData();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(getApiMessage(err, "Nộp bài thất bại."));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin text-[#F26F21]" />
        Đang tải...
      </div>
    );
  }

  if (!team) {
    return (
      <AlertBox title="Chưa có team">
        <p>Vào mục Team Information để tạo team trước khi nộp bài.</p>
      </AlertBox>
    );
  }

  if (team.status !== "Approved") {
    return (
      <AlertBox title="Team chưa được duyệt">
        <p>
          Trạng thái hiện tại: <strong>{team.status || "Pending"}</strong>.
          Coordinator cần duyệt team trước khi nộp bài.
        </p>
      </AlertBox>
    );
  }

  if (!activeRound) {
    return (
      <AlertBox title="Chưa có vòng thi đang mở">
        <p>Cần có Round trạng thái Active và thời gian hiện tại nằm trong khoảng startTime - endTime.</p>
      </AlertBox>
    );
  }

  if (!activeRound.topic) {
    return (
      <AlertBox title="Đề chưa được phát">
        <p>Round đang diễn ra nhưng team chưa được phát đề nên chưa thể nộp bài.</p>
      </AlertBox>
    );
  }

  const isDisqualified = existingSubmission?.isDisqualified;
  const submitDisabled = saving || isDisqualified;

  return (
    <div
      className="rounded-2xl p-5 transition-all duration-300 sm:p-6"
      style={{
        background: "#FFFFFF",
        border: "1px solid #E5E7EB",
        boxShadow: "0 10px 30px rgba(0,0,0,0.02)",
      }}
    >
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg"
            style={{
              background: "rgba(242,111,33,0.1)",
              border: "1px solid rgba(242,111,33,0.2)",
            }}
          >
            <CloudUpload className="h-4 w-4" style={{ color: "#F26F21" }} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#111827]">Form nộp bài</h3>
            <p className="text-[11px] text-slate-500">
              Đội: {team.teamName} - Bảng ID: {team.trackId}
            </p>
          </div>
        </div>
        {existingSubmission && (
          <span className="inline-flex w-fit items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
            <CheckCircle className="h-3.5 w-3.5" />
            Đã nộp
          </span>
        )}
      </div>

      <div className="space-y-4">
        {error && (
          <AlertBox tone="danger" title="Lỗi nộp bài">
            <p>{error}</p>
          </AlertBox>
        )}

        {success && (
          <AlertBox tone="success" icon={CheckCircle} title="Thành công">
            <p>{success}</p>
          </AlertBox>
        )}

        {isDisqualified && (
          <AlertBox tone="danger" title="Bài nộp đã bị loại">
            <p>{existingSubmission.disqualifyReason || "-"}</p>
          </AlertBox>
        )}

        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Vòng thi đang mở
          </label>
          <div className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-700">
            {activeRound.name || `Round #${activeRound.id}`}
          </div>
          {selectedRound && (
            <p className="mt-1.5 text-xs text-slate-400">
              {new Date(selectedRound.startTime).toLocaleString("vi-VN")} -{" "}
              {new Date(selectedRound.endTime).toLocaleString("vi-VN")}
            </p>
          )}
        </div>

        {existingSubmission && (
          <div
            className="rounded-xl p-3 text-xs"
            style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}
          >
            <p className="font-semibold text-emerald-800">Đã có bài nộp cho vòng này</p>
            <p className="mt-0.5 text-emerald-700">
              {existingSubmission.createdAt
                ? `Nộp lúc: ${new Date(existingSubmission.createdAt).toLocaleString("vi-VN")}`
                : "Bạn có thể cập nhật lại thông tin nếu round vẫn cho phép."}
            </p>
          </div>
        )}

        <div className="grid gap-4">
          <SubmissionField
            label="Link dự án"
            required
            icon={Link}
            value={form.projectLink}
            onChange={(value) => updateField("projectLink", value)}
            placeholder="https://your-demo.example.com"
            error={fieldErrors.projectLink}
            disabled={submitDisabled}
            hint="Link demo, ứng dụng đã deploy, trang sản phẩm hoặc trang giới thiệu dự án."
          />

          <SubmissionField
            label="Slide"
            required
            icon={FileText}
            value={form.slideLink}
            onChange={(value) => updateField("slideLink", value)}
            placeholder="https://docs.google.com/presentation/... or https://drive.google.com/..."
            error={fieldErrors.slideLink}
            disabled={submitDisabled}
            hint="Dán link slide public. Project hiện tại chưa có flow upload file slide."
          />

          <SubmissionField
            label="Link mã nguồn GitHub"
            required
            icon={Github}
            value={form.githubLink}
            onChange={(value) => updateField("githubLink", value)}
            placeholder="https://github.com/owner/repository"
            error={fieldErrors.githubLink}
            disabled={submitDisabled}
            hint="Bắt buộc là URL GitHub, ví dụ https://github.com/org/repo."
          />
        </div>

        <div className="grid gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600 sm:grid-cols-3">
          <div className="min-w-0">
            <p className="font-bold uppercase text-slate-500">Dự án</p>
            <PreviewLink href={form.projectLink} />
          </div>
          <div className="min-w-0">
            <p className="font-bold uppercase text-slate-500">Slide</p>
            <PreviewLink href={form.slideLink} />
          </div>
          <div className="min-w-0">
            <p className="font-bold uppercase text-slate-500">Mã nguồn</p>
            <PreviewLink href={form.githubLink} />
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitDisabled}
        className="mt-5 w-full rounded-xl py-3 text-sm font-bold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50"
        style={{
          background: "linear-gradient(135deg, #F26F21, #c9520e)",
          color: "#fff",
          boxShadow: "0 4px 14px rgba(242,111,33,0.2)",
        }}
      >
        {saving ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Đang lưu...
          </span>
        ) : existingSubmission ? (
          "Cập nhật bài nộp"
        ) : (
          "Nộp bài"
        )}
      </button>
    </div>
  );
}

export function SubmitView({ eventId }) {
  return (
    <div className="space-y-6">
      <div
        className="flex items-start gap-3 rounded-xl px-4 py-3.5"
        style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}
      >
        <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
        <div>
          <p className="mb-0.5 text-xs font-bold text-amber-900">
            Điều kiện nộp bài
          </p>
          <p className="text-xs text-amber-700">
            Team phải được duyệt và Round đang ở trạng thái{" "}
            <strong>Active</strong> trong khung thời gian cho phép.
          </p>
        </div>
      </div>

      <div className="w-full">
        <SubmissionForm eventId={eventId} />
      </div>
    </div>
  );
}
