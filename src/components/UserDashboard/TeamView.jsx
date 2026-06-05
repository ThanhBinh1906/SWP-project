import { useState } from "react";
import { useSelector } from "react-redux";
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
} from "lucide-react";
import axiosInstance from "../../services/axiosInstance";

const MIN_MEMBERS = 0; // members ngoài leader, có thể 0
const MAX_MEMBERS = 3; // tối đa 3 member thêm vào (leader + 3 = 4)

const EMPTY_MEMBER = {
  fullName: "",
  studentCode: "",
  email: "",
  phone: "",
  isFPTStudent: false,
};

// ---------------------------------------------------------------------------
function InputField({ label, required, icon: Icon, error, locked, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      {label && (
        <label className="block text-xs font-bold text-slate-800 mb-1.5 uppercase tracking-wider">
          {label} {required && <span style={{ color: "#F26F21" }}>*</span>}
          {locked && <Lock className="inline w-3 h-3 ml-1 text-slate-400" />}
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
        <FPTCheckbox
          value={member.isFPTStudent}
          onChange={() => onChange(index, "isFPTStudent", !member.isFPTStudent)}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
function TeamCreateForm({ onCreated }) {
  const { user } = useSelector((s) => s.auth);

  const [teamForm, setTeamForm] = useState({
    teamName: "",
    university: "",
    githubRepoLink: "",
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
    if (members.length >= MAX_MEMBERS) return;
    setMembers((p) => [...p, { ...EMPTY_MEMBER }]);
  };

  const removeMember = (i) => {
    setMembers((p) => p.filter((_, idx) => idx !== i));
    setMemberErrors((p) => p.filter((_, idx) => idx !== i));
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
      // Bước 1: Tạo team + leader info
      const teamPayload = {
        teamName: teamForm.teamName.trim(),
        university: teamForm.university.trim(),
        trackId: 2, // TODO: Coordinator sẽ phân track sau
        githubRepoLink: teamForm.githubRepoLink.trim() || null,
        fullName: user?.username || "",
        studentCode: leaderExtra.studentCode.trim(),
        email: user?.email || "",
        phone: leaderExtra.phone.trim(),
        isFPTStudent: leaderExtra.isFPTStudent,
      };

      const res = await axiosInstance.post("/api/teams", teamPayload);
      const teamId = res.data?.data?.id;
      if (!teamId) throw new Error("Không nhận được team ID từ server.");

      // Bước 2: Thêm từng member nếu có
      if (members.length > 0) {
        await Promise.all(
          members.map((m) =>
            axiosInstance.post(`/api/teams/${teamId}/members`, {
              fullName: m.fullName.trim(),
              studentCode: m.studentCode.trim(),
              email: m.email.trim(),
              phone: m.phone.trim(),
              isFPTStudent: m.isFPTStudent,
            }),
          ),
        );
      }

      onCreated({ ...res.data.data, members });
    } catch (err) {
      setApiError(
        err?.response?.data?.message || err?.message || "Đã có lỗi xảy ra.",
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
        <div className="flex items-center justify-between">
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
        <div className="flex items-center justify-between">
          <SectionTitle
            number="3"
            title="Thành viên khác"
            subtitle={`(${members.length}/${MAX_MEMBERS}) — tuỳ chọn`}
          />
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

        {members.length === 0 ? (
          <p className="text-xs text-center py-4 text-slate-400">
            Chưa có thành viên nào. Nhấn "Thêm thành viên" để thêm.
          </p>
        ) : (
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

        {members.length >= MAX_MEMBERS && (
          <p className="text-xs text-center text-slate-400">
            Đã đạt tối đa {MAX_MEMBERS} thành viên (chưa tính leader)
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
        <p className="text-sm text-slate-500">
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
                    className="px-4 py-2.5 text-left font-semibold text-slate-500 uppercase tracking-wider text-[10px]"
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
                  <td className="px-4 py-3 text-slate-400">{i + 1}</td>
                  <td className="px-4 py-3 font-semibold text-[#111827]">
                    {m.fullName}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{m.studentCode}</td>
                  <td className="px-4 py-3 text-slate-500">{m.email}</td>
                  <td className="px-4 py-3 text-slate-500">{m.phone}</td>
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

      <p className="text-xs text-center text-slate-400 pb-2">
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
        <span className="text-xs font-normal text-slate-400">{subtitle}</span>
      )}
    </h4>
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
export function TeamView() {
  // TODO: khi BE có GET /api/teams/{id} → fetch team hiện tại của user khi mount
  const [team, setTeam] = useState(false);
  if (!team) return <TeamCreateForm onCreated={setTeam} />;
  return <TeamCreatedBanner team={team} />;
}
