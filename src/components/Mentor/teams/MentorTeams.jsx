import { useMemo, useState } from "react";
import { EmptyState } from "../shared/EmptyState";
import { MentorPanel } from "../shared/MentorPanel";
import { mentorIcons } from "../shared/mentorIcons";
import { TeamDetailModal } from "./details/TeamDetailModal";
import { TeamTable } from "./TeamTable";

const statuses = ["All", "Pending", "Approved", "Disqualified"];

export function MentorTeams({ teams = [], loading, error, onReload }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [selectedTeam, setSelectedTeam] = useState(null);
  const { Filter, Search, Users } = mentorIcons;
  const filteredTeams = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return teams.filter((team) => {
      const values = [team.teamName, team.university, `track ${team.trackId}`];
      return (status === "All" || team.status === status) && (!keyword || values.some((value) => String(value || "").toLowerCase().includes(keyword)));
    });
  }, [search, status, teams]);

  return <div className="space-y-6">
    <MentorPanel title="Team được phân công" subtitle="Xem thành viên, đề bài và lịch sử bài nộp" icon={Users}>
      <div className="mb-5 grid gap-3 md:grid-cols-[1fr_auto]">
        <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm theo team, trường hoặc track" className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-950 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" /></div>
        <div className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2.5"><Filter className="h-4 w-4 text-slate-700" /><select value={status} onChange={(event) => setStatus(event.target.value)} className="bg-transparent text-sm font-semibold text-slate-800 outline-none">{statuses.map((item) => <option key={item}>{item}</option>)}</select></div>
      </div>
      {loading ? <p className="py-12 text-center font-semibold text-slate-600">Đang tải danh sách team...</p> : error ? <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-800"><p>{error}</p><button onClick={onReload} className="mt-3 rounded-lg bg-red-700 px-4 py-2 text-sm font-bold text-white">Thử lại</button></div> : filteredTeams.length ? <TeamTable teams={filteredTeams} onSelectTeam={setSelectedTeam} /> : <EmptyState icon={Users} title="Không tìm thấy team" description="Mentor chưa được phân team hoặc bộ lọc không có kết quả." />}
    </MentorPanel>
    <MentorPanel title="Phạm vi quyền hạn" subtitle="Mentor chỉ theo dõi dữ liệu, không thay đổi kết quả cuộc thi" icon={mentorIcons.CheckCircle2}><div className="grid gap-3 md:grid-cols-3">{["Xem thông tin team", "Xem toàn bộ bài nộp", "Xem đề bài được giao"].map((item) => <div key={item} className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">{item}</div>)}</div></MentorPanel>
    {selectedTeam && <TeamDetailModal team={selectedTeam} onClose={() => setSelectedTeam(null)} />}
  </div>;
}
