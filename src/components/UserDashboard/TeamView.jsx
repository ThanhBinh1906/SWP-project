import { useState } from "react";
import {
  Users,
  Github,
  School,
  Plus,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  UserPlus,
  Trash2,
  User,
  Mail,
} from "lucide-react";
import axiosInstance from "../../services/axiosInstance";
import teamService from "../../services/teamService";

// ---------------------------------------------------------------------------
// CONSTANTS — chỉnh tại đây nếu BE thay đổi rules
// ---------------------------------------------------------------------------
const MIN_MEMBERS = 1; // TODO: đổi thành 3 nếu BE yêu cầu tối thiểu 3 người
const MAX_MEMBERS = 4;

// Member fields — TODO: thêm studentCode, phone, isFPTStudent nếu BE yêu cầu sau
const EMPTY_MEMBER = {
  fullName: "",
  email: "",
  school: "",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function InputField({ label, required, icon: Icon, error, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      {label && (
        <label className="block text-xs font-semibold text-[#374151] mb-1.5 uppercase tracking-wider">
          {label} {required && <span style={{ color: "#F26F21" }}>*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: focused ? "#F26F21" : "#9CA3AF" }}
          />
        )}
        <input
          {...props}
          className="w-full py-2.5 rounded-xl text-sm text-[#111827] outline-none transition-all duration-200"
          style={{
            paddingLeft: Icon ? "2.5rem" : "1rem",
            paddingRight: "1rem",
            background: "#F9FAFB",
            border: `1px solid ${error ? "#ef4444" : focused ? "#F26F21" : "#E5E7EB"}`,
            boxShadow: focused ? "0 0 0 3px rgba(242,111,33,0.08)" : "none",
          }}
          onFocus={() => setFocused(true)}
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

function ApiError({ message }) {
  if (!message) return null;
  return (
    <div
      className="flex items-start gap-3 p-3 rounded-xl text-sm"
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
// MemberCard — 1 thành viên trong form
// ---------------------------------------------------------------------------
function MemberCard({ index, member, errors, onChange, onRemove, canRemove }) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: "1px solid #E5E7EB", background: "#FAFAFA" }}
    >
      {/* Card header */}
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ background: "#F3F4F6", borderBottom: "1px solid #E5E7EB" }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ background: "#F26F21" }}
          >
            {index + 1}
          </div>
          <span className="text-xs font-semibold text-[#374151]">
            Thành viên {index + 1}
          </span>
        </div>
        {canRemove && (
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
        )}
      </div>

      {/* Fields */}
      <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
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
          label="Trường"
          required
          icon={School}
          placeholder="FPT University"
          value={member.school}
          onChange={(e) => onChange(index, "school", e.target.value)}
          error={errors?.school}
        />
        {/* TODO: thêm StudentCode, Phone, IsFPTStudent nếu BE yêu cầu
        <InputField label="Mã SV" ... />
        <InputField label="Số điện thoại" ... />
        <div> IsFPTStudent checkbox </div>
        */}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TeamCreateForm — Step 1: info team + members
// ---------------------------------------------------------------------------
function TeamCreateForm({ onCreated }) {
  const [teamForm, setTeamForm] = useState({
    teamName: "",
    school: "",
    githubRepo: "",
  });
  const [members, setMembers] = useState([{ ...EMPTY_MEMBER }]);
  const [teamErrors, setTeamErrors] = useState({});
  const [memberErrors, setMemberErrors] = useState([]); // array of {fullName, email, school}
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  // --- Team form handlers ---
  const handleTeamChange = (field, value) => {
    setTeamForm((prev) => ({ ...prev, [field]: value }));
    if (teamErrors[field]) setTeamErrors((prev) => ({ ...prev, [field]: "" }));
    setApiError("");
  };

  // --- Member handlers ---
  const handleMemberChange = (index, field, value) => {
    setMembers((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)),
    );
    if (memberErrors[index]?.[field]) {
      setMemberErrors((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], [field]: "" };
        return next;
      });
    }
    setApiError("");
  };

  const addMember = () => {
    if (members.length >= MAX_MEMBERS) return;
    setMembers((prev) => [...prev, { ...EMPTY_MEMBER }]);
  };

  const removeMember = (index) => {
    setMembers((prev) => prev.filter((_, i) => i !== index));
    setMemberErrors((prev) => prev.filter((_, i) => i !== index));
  };

  // --- Validation ---
  const validate = () => {
    let valid = true;

    // Team
    const te = {};
    if (!teamForm.teamName.trim()) {
      te.teamName = "Tên team không được để trống";
      valid = false;
    }
    if (!teamForm.school.trim()) {
      te.school = "Trường không được để trống";
      valid = false;
    }
    setTeamErrors(te);

    // Members
    const me = members.map((m) => {
      const e = {};
      if (!m.fullName.trim()) {
        e.fullName = "Bắt buộc";
        valid = false;
      }
      if (!m.email.trim()) {
        e.email = "Bắt buộc";
        valid = false;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m.email)) {
        e.email = "Email không hợp lệ";
        valid = false;
      }
      if (!m.school.trim()) {
        e.school = "Bắt buộc";
        valid = false;
      }
      return e;
    });
    setMemberErrors(me);

    return valid;
  };

  // --- Submit ---
  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    setApiError("");
    console.log("Submitting team:", teamForm, "members:", members);
    try {
      // Bước 1: Tạo team
      const teamPayload = {
        teamName: teamForm.teamName.trim(),
        school: teamForm.school.trim(),
        ...(teamForm.githubRepo.trim() && {
          githubRepo: teamForm.githubRepo.trim(),
        }),
      };
      const teamRes = await teamService.createTeam(teamPayload);

      // TODO: nếu BE đổi field name thì sửa dòng dưới
      const teamId = teamRes.data?.teamId;

      if (!teamId) throw new Error("Không nhận được teamId từ server");

      // Bước 2: Thêm từng thành viên
      // TODO: nếu BE hỗ trợ bulk POST thì gộp thành 1 call
      await Promise.all(
        members.map((m) =>
          axiosInstance.post(`/teams/${teamId}/members`, {
            fullName: m.fullName.trim(),
            email: m.email.trim(),
            school: m.school.trim(),
            // TODO: thêm studentCode, phone, isFPTStudent nếu BE yêu cầu
          }),
        ),
      );

      onCreated({ ...teamPayload, teamId, members, status: "Pending" });
    } catch (err) {
      setApiError(
        err?.response?.data?.message ||
          err?.message ||
          "Đã có lỗi xảy ra. Vui lòng thử lại.",
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
        <p className="text-sm text-slate-500 mt-1">
          Điền thông tin team và thành viên để tham gia hackathon
        </p>
      </div>

      {/* API Error */}
      <ApiError message={apiError} />

      {/* ---- SECTION 1: Thông tin team ---- */}
      <div
        className="rounded-2xl p-6 space-y-4"
        style={{
          background: "#FFFFFF",
          border: "1px solid #E5E7EB",
          boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
        }}
      >
        <h4 className="text-sm font-bold text-[#111827] flex items-center gap-2">
          <span
            className="w-5 h-5 rounded-md flex items-center justify-center text-white text-xs font-black"
            style={{ background: "#F26F21" }}
          >
            1
          </span>
          Thông tin Team
        </h4>

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
            value={teamForm.school}
            onChange={(e) => handleTeamChange("school", e.target.value)}
            error={teamErrors.school}
          />
        </div>
        <InputField
          label="GitHub Repo"
          icon={Github}
          type="url"
          placeholder="https://github.com/your-org/repo (tuỳ chọn)"
          value={teamForm.githubRepo}
          onChange={(e) => handleTeamChange("githubRepo", e.target.value)}
        />
      </div>

      {/* ---- SECTION 2: Thành viên ---- */}
      <div
        className="rounded-2xl p-6 space-y-4"
        style={{
          background: "#FFFFFF",
          border: "1px solid #E5E7EB",
          boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
        }}
      >
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-[#111827] flex items-center gap-2">
            <span
              className="w-5 h-5 rounded-md flex items-center justify-center text-white text-xs font-black"
              style={{ background: "#F26F21" }}
            >
              2
            </span>
            Thành viên
            <span className="text-xs font-normal text-slate-400">
              ({members.length}/{MAX_MEMBERS}) — tối thiểu {MIN_MEMBERS}, tối đa{" "}
              {MAX_MEMBERS}
            </span>
          </h4>
          {members.length < MAX_MEMBERS && (
            <button
              onClick={addMember}
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

        <div className="space-y-3">
          {members.map((m, i) => (
            <MemberCard
              key={i}
              index={i}
              member={m}
              errors={memberErrors[i]}
              onChange={handleMemberChange}
              onRemove={removeMember}
              canRemove={members.length > MIN_MEMBERS}
            />
          ))}
        </div>

        {members.length >= MAX_MEMBERS && (
          <p className="text-xs text-center" style={{ color: "#9CA3AF" }}>
            Đã đạt tối đa {MAX_MEMBERS} thành viên
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
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Đang đăng ký...
          </>
        ) : (
          <>
            <Plus className="w-4 h-4" /> Đăng ký Team
          </>
        )}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TeamCreatedBanner — sau khi tạo thành công
// ---------------------------------------------------------------------------
function TeamCreatedBanner({ team }) {
  return (
    <div className="max-w-2xl mx-auto mt-6 space-y-4">
      {/* Success header */}
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
        <p className="text-sm text-slate-500">
          Team <strong className="text-[#111827]">{team.name}</strong> đang chờ
          Coordinator duyệt.
        </p>
      </div>

      {/* Team info */}
      <div
        className="rounded-2xl p-5"
        style={{ background: "#FFFFFF", border: "1px solid #E5E7EB" }}
      >
        <h4 className="text-xs font-bold text-[#374151] uppercase tracking-widest mb-3">
          Thông tin Team
        </h4>
        <div className="space-y-2">
          <InfoRow label="Tên team" value={team.name} />
          <InfoRow label="Trường" value={team.school} />
          {team.githubRepo && (
            <InfoRow label="GitHub" value={team.githubRepo} isLink />
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

      {/* Members table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "#FFFFFF", border: "1px solid #E5E7EB" }}
      >
        <div
          className="px-5 py-3.5 border-b"
          style={{ borderColor: "#E5E7EB" }}
        >
          <h4 className="text-xs font-bold text-[#374151] uppercase tracking-widest">
            Thành viên ({team.members?.length || 0})
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
              {["#", "Họ và tên", "Email", "Trường"].map((h) => (
                <th
                  key={h}
                  className="px-4 py-2.5 text-left font-semibold text-slate-500 uppercase tracking-wider text-[10px]"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(team.members || []).map((m, i) => (
              <tr
                key={i}
                style={{
                  borderBottom:
                    i < team.members.length - 1 ? "1px solid #F3F4F6" : "none",
                }}
              >
                <td className="px-4 py-3 text-slate-400">{i + 1}</td>
                <td className="px-4 py-3 font-semibold text-[#111827]">
                  {m.fullName}
                </td>
                <td className="px-4 py-3 text-slate-500">{m.email}</td>
                <td className="px-4 py-3 text-slate-500">{m.school}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-center text-slate-400 pb-2">
        Bạn sẽ nhận thông báo khi Coordinator duyệt team.
      </p>
    </div>
  );
}

function InfoRow({ label, value, isLink }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-slate-500 flex-shrink-0">{label}</span>
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
// TeamView — entry point
// ---------------------------------------------------------------------------
export function TeamView() {
  // false = chưa có team | object = đã tạo/có team
  // TODO: khi BE có GET /api/teams/my-team → fetch ở đây, set team = data hoặc false nếu 404
  const [team, setTeam] = useState(false);

  if (!team) return <TeamCreateForm onCreated={setTeam} />;
  return <TeamCreatedBanner team={team} />;
}
