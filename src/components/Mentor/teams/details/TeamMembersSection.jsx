import { MentorBadge } from "../../shared/MentorBadge";
import { MentorPanel } from "../../shared/MentorPanel";
import { mentorIcons } from "../../shared/mentorIcons";

export function TeamMembersSection({ members = [] }) {
  return <MentorPanel title="Thành viên" subtitle="Thông tin liên hệ chỉ được phép xem" icon={mentorIcons.Users}>
    {members.length ? <div className="overflow-x-auto rounded-xl border border-slate-200"><table className="min-w-full divide-y divide-slate-200 text-sm">
      <thead className="bg-slate-50"><tr>{["Họ tên", "Mã sinh viên", "Email", "Trường", "Số điện thoại", "Vai trò"].map((label) => <th key={label} className="whitespace-nowrap px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-600">{label}</th>)}</tr></thead>
      <tbody className="divide-y divide-slate-200 bg-white">{members.map((member) => <tr key={member.id}>
        <td className="whitespace-nowrap px-4 py-4 font-bold text-slate-950">{member.fullName}</td><td className="whitespace-nowrap px-4 py-4 text-slate-700">{member.studentCode || "N/A"}</td><td className="px-4 py-4 text-slate-700">{member.email || "N/A"}</td><td className="px-4 py-4 text-slate-700">{member.university || "N/A"}</td><td className="whitespace-nowrap px-4 py-4 text-slate-700">{member.phone || "N/A"}</td>
        <td className="whitespace-nowrap px-4 py-4"><MentorBadge tone={member.isLeader ? "purple" : member.isFPTStudent ? "orange" : "neutral"}>{member.isLeader ? "Leader" : member.isFPTStudent ? "FPT" : "Thành viên"}</MentorBadge></td>
      </tr>)}</tbody>
    </table></div> : <p className="py-8 text-center text-sm text-slate-500">Không có dữ liệu thành viên.</p>}
  </MentorPanel>;
}
