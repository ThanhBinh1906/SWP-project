import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useSelector, useDispatch } from "react-redux";
import * as XLSX from "xlsx";
import { fetchMyTeam, updateMyTeam } from "../../store/teamSlice";
import trackService from "../../services/trackService";
import {
  Users,
  Github,
  Plus,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  UserPlus,
  Trash2,
  User,
  Mail,
  Phone,
  Hash,
  School,
  Lock,
  Edit2,
  X,
  Download,
  Upload,
} from "lucide-react";
import teamService from "../../services/teamService";
import LoadingActionText from "../shared/LoadingActionText";

const DEFAULT_MIN_TEAM_MEMBERS = 3;
const DEFAULT_MAX_TEAM_MEMBERS = 5;

const EMPTY_MEMBER = {
  fullName: "",
  studentCode: "",
  email: "",
  phone: "",
  university: "",
  isFPTStudent: false,
};

function getTrackMaxMembers(track) {
  const value = Number(track?.maxMembers ?? track?.MaxMembers);
  return Number.isFinite(value) && value >= 2
    ? value
    : DEFAULT_MAX_TEAM_MEMBERS;
}

function getTrackMinMembers(track) {
  const value = Number(track?.minMembers ?? track?.MinMembers);
  return Number.isFinite(value) && value >= 2
    ? value
    : DEFAULT_MIN_TEAM_MEMBERS;
}

const MEMBER_IMPORT_HEADERS = [
  "fullName",
  "studentCode",
  "email",
  "phone",
  "university",
  "isFPTStudent",
];

const MEMBER_SAMPLE_ROWS = [
  ["Nguyen Van A", "SE180001", "nguyenvana@example.com", "0911111111", "FPT University", "TRUE"],
  ["Tran Thi B", "SE180002", "tranthib@example.com", "0922222222", "FPT University", "TRUE"],
  ["Le Minh C", "SE180003", "leminhc@example.com", "0933333333", "University of Science", "FALSE"],
  ["Pham Gia D", "SE180004", "phamgiad@example.com", "0944444444", "HUTECH University", "FALSE"],
];

function normalizeImportText(value) {
  return String(value ?? "").trim();
}

function parseBooleanCell(value) {
  const text = normalizeImportText(value).toLowerCase();
  return ["true", "yes", "y", "1", "x", "có", "co"].includes(text);
}

function downloadMemberTemplate() {
  const sheet = XLSX.utils.aoa_to_sheet([MEMBER_IMPORT_HEADERS, ...MEMBER_SAMPLE_ROWS]);
  sheet["!cols"] = [
    { wch: 24 },
    { wch: 14 },
    { wch: 28 },
    { wch: 14 },
    { wch: 24 },
    { wch: 14 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Members");
  XLSX.writeFile(workbook, "team-members-import-template.xlsx");
}

function isValidGithubUrl(value) {
  if (!value?.trim()) return false;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" && url.hostname.toLowerCase() === "github.com";
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
function InputField({ label, required, icon: Icon, error, locked, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      {label && (
        <label className="block text-xs font-bold text-slate-800 mb-1.5 uppercase tracking-wider">
          {label} {required && <span style={{ color: "#F26F21" }}>*</span>}
          {locked && <Lock className="inline w-3 h-3 ml-1 text-slate-600" />}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{
              color: locked ? "#D1D5DB" : focused ? "#F26F21" : "#64748B",
            }}
          />
        )}
        <input
          {...props}
          readOnly={locked}
          className="w-full py-2.5 rounded-xl text-sm outline-none transition-all duration-200 placeholder:text-slate-500"
          style={{
            paddingLeft: Icon ? "2.5rem" : "1rem",
            paddingRight: "1rem",
            background: locked ? "#F3F4F6" : "#FFFFFF",
            color: locked ? "#6B7280" : "#0F172A",
            border: `1px solid ${error ? "#ef4444" : focused ? "#F26F21" : "#94A3B8"}`,
            boxShadow:
              !locked && focused ? "0 0 0 3px rgba(242,111,33,0.18)" : "none",
            cursor: locked ? "not-allowed" : "text",
          }}
          onFocus={() => !locked && setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </div>
      {error && (
        <p
          className="mt-1 text-xs flex items-center gap-1"
          style={{ color: "#ef4444" }}
        >
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

function FPTCheckbox({ value, onChange }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer select-none w-fit mt-1">
      <div
        onClick={onChange}
        className="w-4 h-4 rounded flex items-center justify-center transition-all duration-150 flex-shrink-0"
        style={{
          background: value ? "#F26F21" : "#FFFFFF",
          border: `1px solid ${value ? "#F26F21" : "#94A3B8"}`,
        }}
      >
        {value && <CheckCircle className="w-3 h-3 text-white" />}
      </div>
      <span className="text-xs font-semibold text-slate-700">
        Là sinh viên FPT
      </span>
    </label>
  );
}

function ApiError({ message }) {
  if (!message) return null;
  return (
    <div
      className="flex items-start gap-3 p-3 rounded-xl text-sm whitespace-pre-line"
      style={{
        background: "rgba(239,68,68,0.06)",
        border: "1px solid rgba(239,68,68,0.2)",
        color: "#dc2626",
      }}
    >
      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
function MemberCard({ index, member, errors, onChange, onRemove }) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: "1px solid #E5E7EB", background: "#FAFAFA" }}
    >
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ background: "#F3F4F6", borderBottom: "1px solid #E5E7EB" }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ background: "#6366f1" }}
          >
            {index + 1}
          </div>
          <span className="text-xs font-semibold text-[#374151]">
            Thành viên {index + 1}
          </span>
        </div>
        <button
          onClick={() => onRemove(index)}
          className="w-6 h-6 rounded-lg flex items-center justify-center transition-colors duration-150"
          style={{ color: "#9CA3AF" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(239,68,68,0.08)";
            e.currentTarget.style.color = "#ef4444";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "#9CA3AF";
          }}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InputField
            label="Họ và tên"
            required
            icon={User}
            placeholder="Nguyễn Văn A"
            value={member.fullName}
            onChange={(e) => onChange(index, "fullName", e.target.value)}
            error={errors?.fullName}
          />
          <InputField
            label="Mã sinh viên"
            required
            icon={Hash}
            placeholder="SE123456"
            value={member.studentCode}
            onChange={(e) => onChange(index, "studentCode", e.target.value)}
            error={errors?.studentCode}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InputField
            label="Email"
            required
            icon={Mail}
            type="email"
            placeholder="example@email.com"
            value={member.email}
            onChange={(e) => onChange(index, "email", e.target.value)}
            error={errors?.email}
          />
          <InputField
            label="Số điện thoại"
            required
            icon={Phone}
            type="tel"
            placeholder="0912345678"
            value={member.phone}
            onChange={(e) => onChange(index, "phone", e.target.value)}
            error={errors?.phone}
          />
        </div>
        <InputField
          label="Trường"
          required
          icon={School}
          placeholder="VD: FPT University"
          value={member.university}
          onChange={(e) => onChange(index, "university", e.target.value)}
          error={errors?.university}
        />
        <FPTCheckbox
          value={member.isFPTStudent}
          onChange={() => onChange(index, "isFPTStudent", !member.isFPTStudent)}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
function TeamCreateForm({
  onCreated,
  eventId,
  tracks,
  tracksLoading,
  tracksError,
}) {
  const { user } = useSelector((s) => s.auth);
  const memberImportInputRef = useRef(null);

  const [teamForm, setTeamForm] = useState({
    teamName: "",
    university: "",
    githubRepoLink: "",
    trackId: "",
  });
  const [leaderExtra, setLeaderExtra] = useState({
    studentCode: "",
    phone: "",
    isFPTStudent: false,
  });
  const [members, setMembers] = useState([]);
  const [teamErrors, setTeamErrors] = useState({});
  const [leaderErrors, setLeaderErrors] = useState({});
  const [memberErrors, setMemberErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const availableTracks = Array.isArray(tracks) ? tracks : [];
  const selectedTrack = availableTracks.find(
    (track) => String(track.id) === String(teamForm.trackId),
  );
  const minTeamMembers = getTrackMinMembers(selectedTrack);
  const maxTeamMembers = getTrackMaxMembers(selectedTrack);
  const minAdditionalMembers = Math.max(minTeamMembers - 1, 0);
  const maxAdditionalMembers = Math.max(maxTeamMembers - 1, 0);

  const handleTeamChange = (field, value) => {
    setTeamForm((p) => ({ ...p, [field]: value }));
    if (teamErrors[field]) setTeamErrors((p) => ({ ...p, [field]: "" }));
    setApiError("");
  };

  const handleLeaderChange = (field, value) => {
    setLeaderExtra((p) => ({ ...p, [field]: value }));
    if (leaderErrors[field]) setLeaderErrors((p) => ({ ...p, [field]: "" }));
    setApiError("");
  };

  const handleMemberChange = (i, field, value) => {
    setMembers((p) =>
      p.map((m, idx) => (idx === i ? { ...m, [field]: value } : m)),
    );
    if (memberErrors[i]?.[field]) {
      setMemberErrors((p) => {
        const n = [...p];
        n[i] = { ...n[i], [field]: "" };
        return n;
      });
    }
    setApiError("");
  };

  const addMember = () => {
    if (members.length >= maxAdditionalMembers) return;
    setMembers((p) => [...p, { ...EMPTY_MEMBER }]);
  };

  const removeMember = (i) => {
    setMembers((p) => p.filter((_, idx) => idx !== i));
    setMemberErrors((p) => p.filter((_, idx) => idx !== i));
  };

  const importMembersFromRows = (rows) => {
    const [headerRow, ...bodyRows] = rows;
    const headerMap = (headerRow || []).reduce((map, header, index) => {
      map[normalizeImportText(header).toLowerCase()] = index;
      return map;
    }, {});

    const missingHeaders = MEMBER_IMPORT_HEADERS.filter(
      (header) => headerMap[header.toLowerCase()] === undefined,
    );
    if (missingHeaders.length) {
      return [`File thiếu cột: ${missingHeaders.join(", ")}. Hãy tải lại mẫu thành viên.`];
    }

    const nextMembers = [];
    const seenEmails = new Set();
    const seenStudentCodes = new Set();
    const errors = [];

    bodyRows.forEach((row, index) => {
      const line = index + 2;
      const hasAnyData = row.some((cell) => normalizeImportText(cell) !== "");
      if (!hasAnyData) return;

      const member = {
        fullName: normalizeImportText(row[headerMap.fullname]),
        studentCode: normalizeImportText(row[headerMap.studentcode]).toUpperCase(),
        email: normalizeImportText(row[headerMap.email]),
        phone: normalizeImportText(row[headerMap.phone]),
        university: normalizeImportText(row[headerMap.university]),
        isFPTStudent: parseBooleanCell(row[headerMap.isfptstudent]),
      };

      if (nextMembers.length >= maxAdditionalMembers) {
        errors.push(`Dòng ${line}: đội chỉ được thêm tối đa ${maxAdditionalMembers} thành viên ngoài leader.`);
        return;
      }

      if (!member.fullName) errors.push(`Dòng ${line}: thiếu họ tên.`);
      if (!member.studentCode) errors.push(`Dòng ${line}: thiếu mã sinh viên.`);
      if (!member.email) errors.push(`Dòng ${line}: thiếu email.`);
      if (!member.phone) errors.push(`Dòng ${line}: thiếu số điện thoại.`);
      if (!member.university) errors.push(`Dòng ${line}: thiếu trường.`);

      if (member.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(member.email)) {
        errors.push(`Dòng ${line}: email không hợp lệ.`);
      }

      const emailKey = member.email.toLowerCase();
      const studentCodeKey = member.studentCode.toLowerCase();
      if (emailKey && emailKey === String(user?.email || "").toLowerCase()) {
        errors.push(`Dòng ${line}: email bị trùng với leader.`);
      }
      if (emailKey && seenEmails.has(emailKey)) {
        errors.push(`Dòng ${line}: email bị trùng trong file.`);
      }
      if (studentCodeKey && seenStudentCodes.has(studentCodeKey)) {
        errors.push(`Dòng ${line}: mã sinh viên bị trùng trong file.`);
      }

      seenEmails.add(emailKey);
      seenStudentCodes.add(studentCodeKey);
      nextMembers.push(member);
    });

    if (!errors.length && nextMembers.length < minAdditionalMembers) {
      errors.push(
        `File cần ít nhất ${minAdditionalMembers} thành viên ngoài leader theo cấu hình Track.`,
      );
    }

    if (errors.length) return errors;

    setMembers(nextMembers);
    setMemberErrors([]);
    setTeamErrors((prev) => ({ ...prev, members: "" }));
    setApiError("");
    return [];
  };

  const handleImportMembers = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      try {
        const workbook = XLSX.read(loadEvent.target.result, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
        const errors = importMembersFromRows(rows);
        if (errors.length) {
          setApiError(errors.slice(0, 8).join("\n"));
        }
      } catch {
        setApiError("Không thể đọc file Excel. Hãy dùng đúng file .xlsx hoặc tải lại mẫu thành viên.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const validate = () => {
    let valid = true;
    const te = {};
    if (!teamForm.teamName.trim()) {
      te.teamName = "Bắt buộc";
      valid = false;
    }
    if (!teamForm.university.trim()) {
      te.university = "Bắt buộc";
      valid = false;
    }
    if (!teamForm.trackId) {
      te.trackId = "Vui lòng chọn track";
      valid = false;
    }
    if (members.length < minAdditionalMembers) {
      te.members = `Cần ít nhất ${minAdditionalMembers} thành viên khác để team có tối thiểu ${minTeamMembers} người gồm Leader theo cấu hình Track.`;
      valid = false;
    }
    if (members.length > maxAdditionalMembers) {
      te.members = `Chỉ được thêm tối đa ${maxAdditionalMembers} thành viên ngoài Leader theo cấu hình Track.`;
      valid = false;
    }
    setTeamErrors(te);

    const le = {};
    if (!leaderExtra.studentCode.trim()) {
      le.studentCode = "Bắt buộc";
      valid = false;
    }
    if (!leaderExtra.phone.trim()) {
      le.phone = "Bắt buộc";
      valid = false;
    }
    setLeaderErrors(le);

    const me = members.map((m) => {
      const e = {};
      if (!m.fullName.trim()) {
        e.fullName = "Bắt buộc";
        valid = false;
      }
      if (!m.studentCode.trim()) {
        e.studentCode = "Bắt buộc";
        valid = false;
      }
      if (!m.email.trim()) {
        e.email = "Bắt buộc";
        valid = false;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m.email)) {
        e.email = "Email không hợp lệ";
        valid = false;
      }
      if (!m.phone.trim()) {
        e.phone = "Bắt buộc";
        valid = false;
      }
      if (!m.university.trim()) {
        e.university = "Bắt buộc";
        valid = false;
      }
      return e;
    });
    setMemberErrors(me);
    return valid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setApiError("");
    try {
      const memberPayload = members.map((member) => ({
        fullName: member.fullName.trim(),
        studentCode: member.studentCode.trim(),
        email: member.email.trim(),
        phone: member.phone.trim(),
        university: member.university.trim(),
        isFPTStudent: member.isFPTStudent,
      }));

      const teamPayload = {
        teamName: teamForm.teamName.trim(),
        university: teamForm.university.trim(),
        trackId: Number(teamForm.trackId),
        githubRepoLink: teamForm.githubRepoLink.trim() || null,
        fullName: user?.username || "",
        studentCode: leaderExtra.studentCode.trim(),
        email: user?.email || "",
        phone: leaderExtra.phone.trim(),
        isFPTStudent: leaderExtra.isFPTStudent,
        members: memberPayload,
      };

      const res = await teamService.createTeam(teamPayload);
      onCreated(res.data?.data || { ...teamPayload, members: memberPayload });
    } catch (err) {
      const validationMessage = Object.values(err?.response?.data?.errors || {})
        .flat()
        .find(Boolean);
      setApiError(
        err?.response?.data?.message ||
          validationMessage ||
          err?.message ||
          "Đã có lỗi xảy ra.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-6 space-y-5">
      {/* Header */}
      <div
        className="rounded-2xl p-6 text-center"
        style={{
          background: "linear-gradient(135deg, #FFF6F0 0%, #FFFFFF 100%)",
          border: "1px solid rgba(242,111,33,0.2)",
        }}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
          style={{
            background: "rgba(242,111,33,0.1)",
            border: "1px solid rgba(242,111,33,0.2)",
          }}
        >
          <Users className="w-7 h-7" style={{ color: "#F26F21" }} />
        </div>
        <h3
          className="text-lg font-black text-[#111827]"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          Đăng ký Team
        </h3>
        <p className="text-sm text-slate-700 mt-1">
          Điền thông tin team và thành viên để tham gia hackathon
        </p>
      </div>

      <ApiError message={apiError} />

      {/* Section 1: Team info */}
      <div
        className="rounded-2xl p-6 space-y-4"
        style={{
          background: "#FFFFFF",
          border: "1px solid #E5E7EB",
          boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
        }}
      >
        <SectionTitle number="1" title="Thông tin Team" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField
            label="Tên Team"
            required
            placeholder="VD: Alpha Team"
            value={teamForm.teamName}
            onChange={(e) => handleTeamChange("teamName", e.target.value)}
            error={teamErrors.teamName}
          />
          <InputField
            label="Trường"
            required
            icon={School}
            placeholder="VD: FPT University"
            value={teamForm.university}
            onChange={(e) => handleTeamChange("university", e.target.value)}
            error={teamErrors.university}
          />
        </div>
        <InputField
          label="GitHub Repo"
          icon={Github}
          type="url"
          placeholder="https://github.com/... (tuỳ chọn)"
          value={teamForm.githubRepoLink}
          onChange={(e) => handleTeamChange("githubRepoLink", e.target.value)}
        />

        {/* Track selector */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1.5 uppercase tracking-wider">
            Track tham gia <span style={{ color: "#F26F21" }}>*</span>
          </label>
          {tracksLoading ? (
            <div className="flex items-center gap-2 py-2.5 text-xs text-slate-600">
              <Loader2
                className="w-4 h-4 animate-spin"
                style={{ color: "#F26F21" }}
              />
              Đang tải danh sách track...
            </div>
          ) : tracksError ? (
            <div
              className="flex items-center gap-2 p-2.5 rounded-xl text-xs"
              style={{
                background: "rgba(239,68,68,0.06)",
                border: "1px solid rgba(239,68,68,0.2)",
                color: "#dc2626",
              }}
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {tracksError}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {tracks.map((track) => {
                const selected = String(teamForm.trackId) === String(track.id);
                return (
                  <button
                    key={track.id}
                    type="button"
                    onClick={() => {
                      handleTeamChange("trackId", track.id);
                    }}
                    className="flex items-start gap-3 p-3 rounded-xl text-left transition-all duration-150"
                    style={{
                      border: selected
                        ? "1.5px solid #F26F21"
                        : "1px solid #E5E7EB",
                      background: selected
                        ? "rgba(242,111,33,0.06)"
                        : "#FFFFFF",
                      boxShadow: selected
                        ? "0 0 0 3px rgba(242,111,33,0.12)"
                        : "none",
                    }}
                  >
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center"
                      style={{
                        border: selected
                          ? "5px solid #F26F21"
                          : "1.5px solid #94A3B8",
                        background: selected ? "#FFF" : "#FFF",
                      }}
                    />
                    <div>
                      <p
                        className="text-xs font-bold"
                        style={{ color: selected ? "#F26F21" : "#111827" }}
                      >
                        {track.name || track.trackName}
                      </p>
                      {track.description && (
                        <p className="text-[11px] text-slate-700 mt-0.5 leading-relaxed">
                          {track.description}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
          {teamErrors.trackId && (
            <p
              className="mt-1 text-xs flex items-center gap-1"
              style={{ color: "#ef4444" }}
            >
              <AlertCircle className="w-3 h-3 flex-shrink-0" />
              {teamErrors.trackId}
            </p>
          )}
        </div>
      </div>

      {/* Section 2: Leader info */}
      <div
        className="rounded-2xl p-6 space-y-4"
        style={{
          background: "#FFFFFF",
          border: "1px solid #E5E7EB",
          boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
        }}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SectionTitle number="2" title="Thông tin Leader (bạn)" />
          <span
            className="text-[10px] px-2 py-1 rounded-lg font-semibold"
            style={{
              background: "rgba(242,111,33,0.08)",
              color: "#F26F21",
              border: "1px solid rgba(242,111,33,0.2)",
            }}
          >
            Leader
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField
            label="Họ và tên"
            icon={User}
            value={user?.username || ""}
            locked
          />
          <InputField
            label="Email"
            icon={Mail}
            type="email"
            value={user?.email || ""}
            locked
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField
            label="Mã sinh viên"
            required
            icon={Hash}
            placeholder="SE123456"
            value={leaderExtra.studentCode}
            onChange={(e) => handleLeaderChange("studentCode", e.target.value)}
            error={leaderErrors.studentCode}
          />
          <InputField
            label="Số điện thoại"
            required
            icon={Phone}
            type="tel"
            placeholder="0912345678"
            value={leaderExtra.phone}
            onChange={(e) => handleLeaderChange("phone", e.target.value)}
            error={leaderErrors.phone}
          />
        </div>
        <FPTCheckbox
          value={leaderExtra.isFPTStudent}
          onChange={() =>
            handleLeaderChange("isFPTStudent", !leaderExtra.isFPTStudent)
          }
        />
      </div>

      {/* Section 3: Members */}
      <div
        className="rounded-2xl p-6 space-y-4"
        style={{
          background: "#FFFFFF",
          border: "1px solid #E5E7EB",
          boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
        }}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SectionTitle
            number="3"
            title="Thành viên khác"
            subtitle={`(${members.length}/${maxAdditionalMembers})`}
          />
          <div className="flex shrink-0 flex-wrap gap-2 sm:flex-nowrap">
            <button
              type="button"
              onClick={downloadMemberTemplate}
              className="flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150"
              style={{
                background: "#FFFFFF",
                border: "1px solid #CBD5E1",
                color: "#334155",
              }}
            >
              <Download className="w-3.5 h-3.5" /> Tải mẫu
            </button>
            <button
              type="button"
              onClick={() => memberImportInputRef.current?.click()}
              className="flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150"
              style={{
                background: "rgba(242,111,33,0.08)",
                border: "1px solid rgba(242,111,33,0.2)",
                color: "#F26F21",
              }}
            >
              <Upload className="w-3.5 h-3.5" /> Import Excel
            </button>
            <input
              ref={memberImportInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleImportMembers}
            />
            {members.length < maxAdditionalMembers && (
              <button
                type="button"
                onClick={addMember}
                className="flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150"
                style={{
                  background: "rgba(242,111,33,0.08)",
                  border: "1px solid rgba(242,111,33,0.2)",
                  color: "#F26F21",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(242,111,33,0.15)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "rgba(242,111,33,0.08)")
                }
              >
                <UserPlus className="w-3.5 h-3.5" /> Thêm thành viên
              </button>
            )}
          </div>
        </div>

        {members.length > 0 && (
          <div className="space-y-3">
            {members.map((m, i) => (
              <MemberCard
                key={i}
                index={i}
                member={m}
                errors={memberErrors[i]}
                onChange={handleMemberChange}
                onRemove={removeMember}
              />
            ))}
          </div>
        )}

        <p className="py-3 text-center text-xs leading-5 text-slate-600">
          {members.length === 0
            ? `Chưa có thành viên nào. Track yêu cầu tổng từ ${minTeamMembers} đến ${maxTeamMembers} thành viên, bao gồm Leader; nhấn "Thêm thành viên" để bắt đầu.`
            : members.length >= maxAdditionalMembers
              ? `Đã đạt tối đa ${maxTeamMembers} thành viên trong đội, bao gồm Leader.`
              : `Đã thêm ${members.length}/${maxAdditionalMembers} thành viên khác. Track yêu cầu tổng từ ${minTeamMembers} đến ${maxTeamMembers} thành viên, bao gồm Leader.`}
        </p>

        {teamErrors.members && (
          <p className="flex items-center justify-center gap-1 text-xs text-red-500">
            <AlertCircle className="h-3 w-3" />
            {teamErrors.members}
          </p>
        )}
      </div>

      {/* Note */}
      <div
        className="flex items-start gap-2.5 p-3 rounded-xl text-xs"
        style={{
          background: "rgba(242,111,33,0.04)",
          border: "1px solid rgba(242,111,33,0.15)",
          color: "#92400e",
        }}
      >
        <Clock
          className="w-3.5 h-3.5 mt-0.5 flex-shrink-0"
          style={{ color: "#F26F21" }}
        />
        <span>
          Sau khi đăng ký, team sẽ ở trạng thái <strong>Chờ duyệt</strong>.
          Coordinator sẽ xét duyệt và phân Track.
        </span>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white transition-all duration-200"
        style={{
          background: loading ? "#FDA071" : "#F26F21",
          boxShadow: loading ? "none" : "0 4px 14px rgba(242,111,33,0.35)",
          cursor: loading ? "not-allowed" : "pointer",
        }}
        onMouseEnter={(e) => {
          if (!loading) e.currentTarget.style.background = "#D95F10";
        }}
        onMouseLeave={(e) => {
          if (!loading) e.currentTarget.style.background = "#F26F21";
        }}
      >
        {loading ? (
          <LoadingActionText>Đang tạo team</LoadingActionText>
        ) : (
          <>
            <Plus className="w-4 h-4" /> Đăng ký Team
          </>
        )}
      </button>
    </div>
  );
}

function TeamCreatedBanner({ team }) {
  return (
    <div className="max-w-2xl mx-auto mt-6 space-y-4">
      <div
        className="rounded-2xl p-8 text-center"
        style={{
          background: "linear-gradient(135deg, #F0FDF4 0%, #FFFFFF 100%)",
          border: "1px solid rgba(34,197,94,0.25)",
        }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{
            background: "rgba(34,197,94,0.1)",
            border: "1px solid rgba(34,197,94,0.2)",
          }}
        >
          <CheckCircle className="w-8 h-8" style={{ color: "#16a34a" }} />
        </div>
        <h3
          className="text-xl font-black text-[#111827] mb-1"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          Đăng ký thành công!
        </h3>
        <p className="text-sm text-slate-700">
          Team <strong className="text-[#111827]">{team.teamName}</strong> đang
          chờ Coordinator duyệt.
        </p>
      </div>

      <div
        className="rounded-2xl p-5"
        style={{ background: "#FFFFFF", border: "1px solid #E5E7EB" }}
      >
        <h4 className="text-xs font-bold text-[#374151] uppercase tracking-widest mb-3">
          Thông tin Team
        </h4>
        <div className="space-y-2">
          <InfoRow label="Tên team" value={team.teamName} />
          <InfoRow label="Trường" value={team.university} />
          {team.githubRepoLink && (
            <InfoRow label="GitHub" value={team.githubRepoLink} isLink />
          )}
          <InfoRow
            label="Trạng thái"
            value={
              <span
                className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider"
                style={{
                  background: "rgba(234,179,8,0.1)",
                  border: "1px solid rgba(234,179,8,0.3)",
                  color: "#b45309",
                }}
              >
                Chờ duyệt
              </span>
            }
          />
        </div>
      </div>

      {team.members?.length > 0 && (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "#FFFFFF", border: "1px solid #E5E7EB" }}
        >
          <div
            className="px-5 py-3.5 border-b"
            style={{ borderColor: "#E5E7EB" }}
          >
            <h4 className="text-xs font-bold text-[#374151] uppercase tracking-widest">
              Thành viên ({team.members.length})
            </h4>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr
                style={{
                  background: "#F9FAFB",
                  borderBottom: "1px solid #E5E7EB",
                }}
              >
                {["#", "Họ và tên", "Mã SV", "Email", "SĐT", "FPT"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2.5 text-left font-semibold text-slate-700 uppercase tracking-wider text-[10px]"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {team.members.map((m, i) => (
                <tr
                  key={i}
                  style={{
                    borderBottom:
                      i < team.members.length - 1
                        ? "1px solid #F3F4F6"
                        : "none",
                  }}
                >
                  <td className="px-4 py-3 text-slate-600">{i + 1}</td>
                  <td className="px-4 py-3 font-semibold text-[#111827]">
                    {m.fullName}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{m.studentCode}</td>
                  <td className="px-4 py-3 text-slate-700">{m.email}</td>
                  <td className="px-4 py-3 text-slate-700">{m.phone}</td>
                  <td className="px-4 py-3">
                    {m.isFPTStudent ? (
                      <span className="text-emerald-600 font-bold">✓</span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-center text-slate-600 pb-2">
        Bạn sẽ nhận thông báo khi Coordinator duyệt team.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
function SectionTitle({ number, title, subtitle }) {
  return (
    <h4 className="text-sm font-bold text-[#111827] flex items-center gap-2">
      <span
        className="w-5 h-5 rounded-md flex items-center justify-center text-white text-xs font-black"
        style={{ background: "#F26F21" }}
      >
        {number}
      </span>
      {title}
      {subtitle && (
        <span className="text-xs font-normal text-slate-600">{subtitle}</span>
      )}
    </h4>
  );
}

function InfoRow({ label, value, isLink }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-slate-700 flex-shrink-0">{label}</span>
      {isLink ? (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium truncate max-w-[60%]"
          style={{ color: "#F26F21" }}
        >
          {value}
        </a>
      ) : (
        <span className="text-xs font-semibold text-[#111827] text-right">
          {typeof value === "string" ? value : value}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// MemberModal — Add / Edit member
// ---------------------------------------------------------------------------
function MemberModal({ teamId, member, onClose, onSaved }) {
  const isEdit = !!member;
  const [form, setForm] = useState(
    isEdit
      ? {
          fullName: member.fullName,
          studentCode: member.studentCode,
          email: member.email,
          phone: member.phone,
          university: member.university || "",
          isFPTStudent: member.isFPTStudent,
        }
      : { ...EMPTY_MEMBER },
  );
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleChange = (field, value) => {
    setForm((p) => ({ ...p, [field]: value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: "" }));
    setApiError("");
  };

  const validate = () => {
    const e = {};
    // FullName: 2-100 ký tự
    if (!form.fullName.trim()) e.fullName = "Họ tên không được để trống.";
    else if (
      form.fullName.trim().length < 2 ||
      form.fullName.trim().length > 100
    )
      e.fullName = "Họ tên phải từ 2–100 ký tự.";
    // StudentCode: 2 chữ cái + 6 chữ số
    if (!form.studentCode.trim())
      e.studentCode = "Mã sinh viên không được để trống.";
    else if (!/^[A-Za-z]{2}\d{6}$/.test(form.studentCode.trim()))
      e.studentCode =
        "Mã sinh viên phải có dạng 2 chữ cái + 6 chữ số (VD: SE123456).";
    // Email
    if (!form.email.trim()) e.email = "Email không được để trống.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Email không đúng định dạng.";
    else if (form.email.length > 256) e.email = "Email tối đa 256 ký tự.";
    // Phone: optional nhưng nếu nhập phải đúng định dạng, tối đa 15 ký tự
    if (form.phone.trim()) {
      if (!/^[\d\s\-\+\(\)]{7,15}$/.test(form.phone.trim()))
        e.phone = "Số điện thoại không đúng định dạng.";
      else if (form.phone.trim().length > 15)
        e.phone = "Số điện thoại tối đa 15 ký tự.";
    }
    if (!form.university?.trim()) e.university = "Trường không được để trống.";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        fullName: form.fullName.trim(),
        studentCode: form.studentCode.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        university: form.university.trim(),
        isFPTStudent: form.isFPTStudent,
      };
      if (isEdit) {
        await teamService.updateMember(teamId, member.id, payload);
      } else {
        await teamService.addMember(teamId, payload);
      }
      onSaved();
    } catch (err) {
      setApiError(err?.response?.data?.message || "Lưu thất bại.");
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4 animate-modal-scale">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">
            {isEdit ? "Sửa thành viên" : "Thêm thành viên"}
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-600 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {apiError && (
          <div
            className="flex items-center gap-2 p-3 rounded-xl text-sm"
            style={{
              background: "rgba(239,68,68,0.06)",
              border: "1px solid rgba(239,68,68,0.2)",
              color: "#dc2626",
            }}
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {apiError}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <InputField
            label="Họ và tên"
            required
            icon={User}
            placeholder="Nguyễn Văn A"
            value={form.fullName}
            onChange={(e) => handleChange("fullName", e.target.value)}
            error={errors.fullName}
          />
          <InputField
            label="Mã sinh viên"
            required
            icon={Hash}
            placeholder="SE123456"
            value={form.studentCode}
            onChange={(e) => handleChange("studentCode", e.target.value)}
            error={errors.studentCode}
            locked={isEdit}
          />
          {isEdit && (
            <p className="text-xs text-slate-700 -mt-2 col-start-2">
              Mã sinh viên là thông tin định danh, không thể chỉnh sửa sau khi tạo.
            </p>
          )}
          <InputField
            label="Email"
            required
            icon={Mail}
            type="email"
            placeholder="example@email.com"
            value={form.email}
            onChange={(e) => handleChange("email", e.target.value)}
            error={errors.email}
          />
          <InputField
            label="Số điện thoại"
            required
            icon={Phone}
            type="tel"
            placeholder="0912345678"
            value={form.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            error={errors.phone}
          />
          <InputField
            label="Trường"
            required
            icon={School}
            placeholder="FPT University"
            value={form.university}
            onChange={(e) => handleChange("university", e.target.value)}
            error={errors.university}
          />
        </div>

        <FPTCheckbox
          value={form.isFPTStudent}
          onChange={() => handleChange("isFPTStudent", !form.isFPTStudent)}
        />

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 transition-all"
            style={{ background: "#F3F4F6", border: "1px solid #E5E7EB" }}
          >
            Huỷ
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-all"
            style={{
              background: saving ? "#FDA071" : "#F26F21",
              cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            {saving ? <LoadingActionText>Đang lưu</LoadingActionText> : isEdit ? "Lưu thay đổi" : "Thêm"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ---------------------------------------------------------------------------
// EditTeamModal — sửa đầy đủ trong Registration, chỉ sửa GitHub khi Active
// ---------------------------------------------------------------------------
function EditTeamModal({ team, onClose, onSaved, githubOnly = false }) {
  const [form, setForm] = useState({
    teamName: team.teamName,
    university: team.university,
    githubRepoLink: team.githubRepoLink || "",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleChange = (field, value) => {
    setForm((p) => ({ ...p, [field]: value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: "" }));
    setApiError("");
  };

  const validate = () => {
    const e = {};
    if (!githubOnly && !form.teamName.trim()) {
      e.teamName = "Tên team không được để trống.";
    }
    if (!githubOnly && !form.university.trim()) {
      e.university = "Trường không được để trống.";
    }
    if (!form.githubRepoLink.trim()) {
      e.githubRepoLink = "GitHub Repo là bắt buộc để nộp bài.";
    } else if (!isValidGithubUrl(form.githubRepoLink)) {
      e.githubRepoLink = "GitHub Repo phải bắt đầu bằng https://github.com/.";
    }
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await teamService.updateTeam(team.id, {
        teamName: form.teamName.trim(),
        university: form.university.trim(),
        githubRepoLink: form.githubRepoLink.trim() || null,
      });
      onSaved();
    } catch (err) {
      setApiError(err?.response?.data?.message || "Cập nhật thất bại.");
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4 animate-modal-scale">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">
            {githubOnly ? "Cập nhật GitHub Repo" : "Sửa thông tin Team"}
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-600 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {apiError && (
          <div
            className="flex items-center gap-2 p-3 rounded-xl text-sm"
            style={{
              background: "rgba(239,68,68,0.06)",
              border: "1px solid rgba(239,68,68,0.2)",
              color: "#dc2626",
            }}
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {apiError}
          </div>
        )}

        <div className="space-y-3">
          {!githubOnly && (
            <>
              <InputField
                label="Tên Team"
                required
                placeholder="VD: Alpha Team"
                value={form.teamName}
                onChange={(e) => handleChange("teamName", e.target.value)}
                error={errors.teamName}
              />
              <InputField
                label="Trường"
                required
                icon={School}
                placeholder="VD: FPT University"
                value={form.university}
                onChange={(e) => handleChange("university", e.target.value)}
                error={errors.university}
              />
            </>
          )}
          <InputField
            label="GitHub Repo"
            required
            icon={Github}
            type="url"
            placeholder="https://github.com/owner/repository"
            value={form.githubRepoLink}
            onChange={(e) => handleChange("githubRepoLink", e.target.value)}
            error={errors.githubRepoLink}
          />
        </div>

        <div
          className="flex items-center gap-2 p-3 rounded-xl text-xs"
          style={{
            background: "rgba(242,111,33,0.04)",
            border: "1px solid rgba(242,111,33,0.15)",
            color: "#92400e",
          }}
        >
          <Clock
            className="w-3.5 h-3.5 flex-shrink-0"
            style={{ color: "#F26F21" }}
          />
          Link GitHub là bắt buộc để nộp bài. Hãy cập nhật đúng repo của team
          trước khi vào Form nộp bài.
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600"
            style={{ background: "#F3F4F6", border: "1px solid #E5E7EB" }}
          >
            Huỷ
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-all"
            style={{
              background: saving ? "#FDA071" : "#F26F21",
              cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            {saving ? (
              <LoadingActionText>Đang lưu</LoadingActionText>
            ) : githubOnly ? (
              "Lưu GitHub Repo"
            ) : (
              "Lưu thay đổi"
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ---------------------------------------------------------------------------
// TeamInfoView — hiển thị khi đã có team (fetch từ API)
// ---------------------------------------------------------------------------
function TeamInfoView({
  team: initialTeam,
  onRefresh,
  readOnly = false,
  lockMessage = "",
  allowGithubEdit = false,
  tracks = [],
}) {
  const [team, setTeam] = useState(initialTeam);
  const [memberModal, setMemberModal] = useState(null); // null | "add" | member object (edit)
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState("");

  const dispatch = useDispatch();
  const myTeam = useSelector((s) => s.team.myTeam);

  // Sync local state when Redux updates
  useEffect(() => {
    if (myTeam) setTeam(myTeam);
  }, [myTeam]);

  useEffect(() => {
    if (deleteTarget) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [deleteTarget]);
  const [editTeamModal, setEditTeamModal] = useState(false);

  const refreshTeam = () => {
    if (onRefresh) onRefresh(); // dispatch fetchMyTeam vào Redux
  };

  const handleDelete = async () => {
    if (!deleteTarget || readOnly) return;
    const minTeamMembers = getTrackMinMembers(
      tracks.find((track) => String(track.id) === String(team.trackId)) ?? team,
    );
    const totalMembers = team.members?.length || 0;
    if (totalMembers - 1 < minTeamMembers) {
      setActionError(
        `Không thể xóa thành viên. Track yêu cầu đội duy trì ít nhất ${minTeamMembers} thành viên, bao gồm Leader.`,
      );
      setDeleteTarget(null);
      return;
    }
    setDeleting(true);
    setActionError("");
    try {
      await teamService.deleteMember(team.id, deleteTarget.id);
      await refreshTeam();
      setDeleteTarget(null);
    } catch (err) {
      setActionError(err?.response?.data?.message || "Xóa thất bại.");
    } finally {
      setDeleting(false);
    }
  };

  const statusColor = {
    Pending: {
      bg: "rgba(234,179,8,0.1)",
      border: "rgba(234,179,8,0.3)",
      text: "#b45309",
    },
    Approved: {
      bg: "rgba(34,197,94,0.1)",
      border: "rgba(34,197,94,0.25)",
      text: "#16a34a",
    },
    Disqualified: {
      bg: "rgba(239,68,68,0.08)",
      border: "rgba(239,68,68,0.2)",
      text: "#dc2626",
    },
  }[team.status] || {
    bg: "rgba(234,179,8,0.1)",
    border: "rgba(234,179,8,0.3)",
    text: "#b45309",
  };

  const currentTrack = tracks.find(
    (track) => String(track.id) === String(team.trackId),
  );
  const minTeamMembers = getTrackMinMembers(currentTrack ?? team);
  const maxTeamMembers = getTrackMaxMembers(currentTrack ?? team);
  const maxAdditionalMembers = Math.max(maxTeamMembers - 1, 0);
  const nonLeaderCount = team.members?.filter((m) => !m.isLeader).length || 0;
  const totalMemberCount = team.members?.length || 0;
  const canAddMember = !readOnly && nonLeaderCount < maxAdditionalMembers;
  const canDeleteMember = !readOnly && totalMemberCount > minTeamMembers;

  useEffect(() => {
    if (readOnly) {
      setMemberModal(null);
      setDeleteTarget(null);
      if (!allowGithubEdit) setEditTeamModal(false);
    }
  }, [allowGithubEdit, readOnly]);

  return (
    <div className="max-w-2xl mx-auto mt-6 space-y-4">
      {readOnly && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-900">
          <Lock className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-bold">Đội hình đang ở chế độ chỉ xem</p>
            <p className="mt-1 text-sm leading-6 text-red-800">
              {lockMessage ||
                "Team đã dừng tại vòng trước nên không thể chỉnh sửa đội hoặc thành viên."}
            </p>
          </div>
        </div>
      )}
      {/* Header */}
      <div
        className="rounded-2xl p-6 text-center"
        style={{
          background: "linear-gradient(135deg, #FFF6F0 0%, #FFFFFF 100%)",
          border: "1px solid rgba(242,111,33,0.2)",
        }}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
          style={{
            background: "rgba(242,111,33,0.1)",
            border: "1px solid rgba(242,111,33,0.2)",
          }}
        >
          <Users className="w-7 h-7" style={{ color: "#F26F21" }} />
        </div>
        <h3
          className="text-xl font-black text-[#111827]"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          {team.teamName}
        </h3>
        <p className="text-sm text-slate-700 mt-1">{team.university}</p>
      </div>

      {/* Team info */}
      <div
        className="rounded-2xl p-5"
        style={{ background: "#FFFFFF", border: "1px solid #E5E7EB" }}
      >
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-[#374151] uppercase tracking-widest">
            Thông tin Team
          </h4>
          {(!readOnly || allowGithubEdit) && (
            <button
              onClick={() => setEditTeamModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150"
              style={{
                background: "rgba(242,111,33,0.08)",
                border: "1px solid rgba(242,111,33,0.2)",
                color: "#F26F21",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(242,111,33,0.15)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "rgba(242,111,33,0.08)")
              }
            >
              <Edit2 className="w-3.5 h-3.5" />
              {readOnly ? "Cập nhật GitHub" : "Sửa thông tin"}
            </button>
          )}
          </div>
        <div className="space-y-2">
          <InfoRow label="Tên team" value={team.teamName} />
          <InfoRow label="Trường" value={team.university} />
          <InfoRow
            label="Track"
            value={team.trackId ? `Track #${team.trackId}` : "Chưa phân"}
          />
          <InfoRow
            label="GitHub"
            value={team.githubRepoLink || "Chưa cập nhật"}
            isLink={!!team.githubRepoLink}
          />
          <InfoRow
            label="Trạng thái"
            value={
              <span
                className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider"
                style={{
                  background: statusColor.bg,
                  border: `1px solid ${statusColor.border}`,
                  color: statusColor.text,
                }}
              >
                {team.status === "Pending"
                  ? "Chờ duyệt"
                  : team.status === "Approved"
                    ? "Đã duyệt"
                    : "Bị loại"}
              </span>
            }
          />
        </div>
      </div>

      {/* Members */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "#FFFFFF", border: "1px solid #E5E7EB" }}
      >
        <div
          className="px-5 py-3.5 border-b flex items-center justify-between"
          style={{ borderColor: "#E5E7EB" }}
        >
          <h4 className="text-xs font-bold text-[#374151] uppercase tracking-widest">
            Thành viên ({team.members?.length || 0})
          </h4>
          {canAddMember && (
            <button
              onClick={() => setMemberModal("add")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150"
              style={{
                background: "rgba(242,111,33,0.08)",
                border: "1px solid rgba(242,111,33,0.2)",
                color: "#F26F21",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(242,111,33,0.15)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "rgba(242,111,33,0.08)")
              }
            >
              <UserPlus className="w-3.5 h-3.5" /> Thêm thành viên
            </button>
          )}
        </div>

        {actionError && (
          <div
            className="mx-4 mt-3 flex items-center gap-2 p-2.5 rounded-xl text-xs"
            style={{
              background: "rgba(239,68,68,0.06)",
              border: "1px solid rgba(239,68,68,0.2)",
              color: "#dc2626",
            }}
          >
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            {actionError}
          </div>
        )}

        {!team.members?.length ? (
          <p className="text-xs text-center text-slate-600 py-8">
            Chưa có thành viên nào.
          </p>
        ) : (
          <table className="w-full text-xs table-fixed">
            <colgroup>
              <col className="w-8" />
              <col />
              <col className="w-20" />
              <col className="w-36" />
              <col className="w-24" />
              <col className="w-8" />
              <col className="w-16" />
            </colgroup>
            <thead>
              <tr
                style={{
                  background: "#F9FAFB",
                  borderBottom: "1px solid #E5E7EB",
                }}
              >
                {["#", "Họ và tên", "Mã SV", "Email", "SĐT", "FPT", ""].map(
                  (h, i) => (
                    <th
                      key={i}
                      className="px-3 py-2.5 text-left font-semibold text-slate-700 uppercase tracking-wider text-[10px]"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {team.members.map((m, i) => (
                <tr
                  key={m.id ?? i}
                  style={{
                    borderBottom:
                      i < team.members.length - 1
                        ? "1px solid #F3F4F6"
                        : "none",
                  }}
                >
                  <td className="px-3 py-3 align-top text-slate-600">{i + 1}</td>
                  <td className="px-3 py-3 align-top font-semibold leading-5 text-[#111827]">
                    <div className="flex min-w-0 flex-wrap items-center gap-1.5 break-words">
                      {m.fullName}
                      {m.isLeader && (
                        <span
                          className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase"
                          style={{
                            background: "rgba(242,111,33,0.1)",
                            color: "#F26F21",
                            border: "1px solid rgba(242,111,33,0.2)",
                          }}
                        >
                          Leader
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="break-all px-3 py-3 align-top leading-5 text-slate-700">
                    {m.studentCode}
                  </td>
                  <td className="break-all px-3 py-3 align-top leading-5 text-slate-700">
                    {m.email}
                  </td>
                  <td className="break-all px-3 py-3 align-top leading-5 text-slate-700">
                    {m.phone}
                  </td>
                  <td className="px-3 py-3 align-top">
                    {m.isFPTStudent ? (
                      <span className="text-emerald-600 font-bold">✓</span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 align-top whitespace-nowrap">
                    {!m.isLeader && !readOnly && (
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setMemberModal(m)}
                          className="w-6 h-6 rounded-lg flex items-center justify-center transition-all"
                          style={{
                            background: "rgba(242,111,33,0.08)",
                            color: "#F26F21",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background =
                              "rgba(242,111,33,0.18)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background =
                              "rgba(242,111,33,0.08)")
                          }
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => {
                            if (!canDeleteMember) {
                              setActionError(
                                `Không thể xóa thành viên. Track yêu cầu đội duy trì ít nhất ${minTeamMembers} thành viên, bao gồm Leader.`,
                              );
                              return;
                            }
                            setDeleteTarget(m);
                            setActionError("");
                          }}
                          disabled={!canDeleteMember}
                          title={
                            canDeleteMember
                              ? "Xóa thành viên"
                              : `Đội phải duy trì ít nhất ${minTeamMembers} thành viên`
                          }
                          className="w-6 h-6 rounded-lg flex items-center justify-center transition-all"
                          style={{
                            background: "rgba(239,68,68,0.06)",
                            color: "#ef4444",
                            cursor: canDeleteMember ? "pointer" : "not-allowed",
                            opacity: canDeleteMember ? 1 : 0.4,
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background =
                              "rgba(239,68,68,0.15)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background =
                              "rgba(239,68,68,0.06)")
                          }
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Member Modal (Add/Edit) */}
      {memberModal && !readOnly && (
        <MemberModal
          teamId={team.id}
          member={memberModal === "add" ? null : memberModal}
          onClose={() => setMemberModal(null)}
          onSaved={async () => {
            setMemberModal(null);
            await refreshTeam();
          }}
        />
      )}

      {/* Edit Team Modal */}
      {editTeamModal && (!readOnly || allowGithubEdit) && (
        <EditTeamModal
          team={team}
          githubOnly={readOnly && allowGithubEdit}
          onClose={() => setEditTeamModal(false)}
          onSaved={async (updated) => {
            setEditTeamModal(false);
            await refreshTeam();
          }}
        />
      )}

      {/* Delete confirm */}
      {deleteTarget && !readOnly &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl space-y-4 animate-modal-scale">
              <h3 className="text-base font-bold text-slate-900">
                Xóa thành viên?
              </h3>
              <p className="text-sm text-slate-600">
                Bạn có chắc muốn xóa <strong>{deleteTarget.fullName}</strong>{" "}
                khỏi team?
              </p>
              {actionError && (
                <p className="text-xs text-red-500">{actionError}</p>
              )}
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600"
                  style={{ background: "#F3F4F6", border: "1px solid #E5E7EB" }}
                >
                  Huỷ
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-white"
                  style={{
                    background: deleting ? "#fca5a5" : "#ef4444",
                    cursor: deleting ? "not-allowed" : "pointer",
                  }}
                >
                  {deleting ? <LoadingActionText>Đang xóa</LoadingActionText> : "Xác nhận xóa"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

// ---------------------------------------------------------------------------
export function TeamView({
  readOnly = false,
  lockMessage = "",
  eventEnded = false,
  allowGithubEdit = false,
}) {
  const dispatch = useDispatch();
  const eventId = useSelector((s) => s.event.activeEventId);
  const { myTeam, loading: teamLoading, fetched } = useSelector((s) => s.team);

  // Tracks vẫn fetch local vì chỉ cần khi tạo team
  const [tracks, setTracks] = useState([]);
  const [tracksLoading, setTracksLoading] = useState(true);
  const [tracksError, setTracksError] = useState("");

  useEffect(() => {
    if (!eventId) {
      setTracks([]);
      setTracksError("");
      setTracksLoading(false);
      return;
    }
    setTracksLoading(true);
    setTracksError("");
    trackService
      .getByEvent(eventId)
      .then((res) => setTracks(res.data?.data || res.data || []))
      .catch((err) =>
        setTracksError(
          err?.response?.data?.message || "Không thể tải danh sách track.",
        ),
      )
      .finally(() => setTracksLoading(false));
  }, [eventId]);

  // Khi tạo team xong → update Redux
  const handleCreated = (newTeam) => {
    dispatch(updateMyTeam(newTeam));
  };

  // Khi refresh team (sau edit/add member) → re-fetch vào Redux
  const handleRefresh = () => {
    dispatch(fetchMyTeam());
  };

  if (eventEnded) {
    return (
      <div className="mx-auto mt-10 max-w-2xl rounded-3xl border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 text-orange-600">
          <CheckCircle className="h-7 w-7" />
        </div>
        <h3 className="mt-4 text-xl font-bold text-slate-900">
          Sự kiện đã kết thúc
        </h3>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">
          Cảm ơn bạn và đội thi đã đồng hành cùng chương trình.
          Hiện không còn sự kiện nào đang mở đăng ký hoặc diễn ra.
          Hy vọng sẽ gặp lại bạn trong sự kiện tiếp theo!
        </p>
      </div>
    );
  }

  if (tracksLoading || (teamLoading && !fetched))
    return (
      <div className="flex items-center justify-center py-20 gap-3 text-sm text-slate-600">
        <Loader2
          className="w-5 h-5 animate-spin"
          style={{ color: "#F26F21" }}
        />
        Đang kiểm tra thông tin team...
      </div>
    );

  if (!myTeam && readOnly) {
    return (
      <div className="mx-auto mt-6 max-w-2xl rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-950">
        <div className="flex items-start gap-3">
          <Lock className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <h3 className="font-bold">Chức năng quản lý đội đang bị khóa</h3>
            <p className="mt-1 text-sm leading-6 text-amber-900">
              {lockMessage ||
                "Chỉ được tạo và thay đổi đội trong giai đoạn Registration."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!myTeam)
    return (
      <TeamCreateForm
        onCreated={handleCreated}
        eventId={eventId}
        tracks={tracks}
        tracksLoading={tracksLoading}
        tracksError={tracksError}
      />
    );

  return (
    <TeamInfoView
      team={myTeam}
      onRefresh={handleRefresh}
      readOnly={readOnly}
      lockMessage={lockMessage}
      allowGithubEdit={allowGithubEdit}
      tracks={tracks}
    />
  );
}
