import { MentorBadge } from "../shared/MentorBadge";
import { MentorPanel } from "../shared/MentorPanel";
import { MentorProgressBar } from "../shared/MentorProgressBar";
import { mentorIcons } from "../shared/mentorIcons";
import { AssignedTracks } from "./AssignedTracks";
import { MentorStatsCards } from "./MentorStatsCards";
import { TeamActivity } from "./TeamActivity";

export function MentorOverview({ teams = [], loading, error, onReload, onViewTeams }) {
  const submitted = teams.filter((team) => team.submissionStatus === "Submitted").length;
  const progress = teams.length ? Math.round((submitted / teams.length) * 100) : 0;

  if (loading) return <div className="rounded-xl border border-slate-200 bg-white p-10 text-center font-semibold text-slate-600">Đang tải dữ liệu Mentor...</div>;
  if (error) return <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800"><p className="font-bold">Không thể tải dữ liệu Mentor</p><p className="mt-1 text-sm">{error}</p><button onClick={onReload} className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-bold text-white">Thử lại</button></div>;

  return <div className="space-y-6">
    <MentorStatsCards teams={teams} />
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <div className="xl:col-span-2"><AssignedTracks teams={teams} /></div>
      <MentorPanel title="Tiến độ nộp bài" subtitle="Tổng hợp theo team được phân công" icon={mentorIcons.FileText} actions={<button onClick={onViewTeams} className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-bold text-orange-700">Xem team</button>}>
        <MentorProgressBar value={progress} label={`${submitted}/${teams.length} team đã nộp`} />
        <div className="mt-5 space-y-3">{teams.slice(0, 5).map((team) => <div key={team.id} className="flex items-center justify-between gap-3"><span className="truncate text-sm font-semibold text-slate-800">{team.teamName}</span><MentorBadge tone={team.submissionStatus === "Submitted" ? "success" : "danger"}>{team.submissionStatus === "Submitted" ? "Đã nộp" : "Chưa nộp"}</MentorBadge></div>)}</div>
      </MentorPanel>
    </div>
    <TeamActivity teams={teams} />
  </div>;
}
