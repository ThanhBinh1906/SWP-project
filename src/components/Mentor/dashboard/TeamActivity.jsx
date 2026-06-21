import { MentorBadge } from "../shared/MentorBadge";
import { MentorPanel } from "../shared/MentorPanel";
import { mentorIcons } from "../shared/mentorIcons";

function formatDate(value) {
  if (!value) return "Chưa có bài nộp";
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

export function TeamActivity({ teams = [] }) {
  const sortedTeams = [...teams].sort((a, b) => new Date(b.latestSubmission?.createdAt || 0) - new Date(a.latestSubmission?.createdAt || 0));
  return <MentorPanel title="Hoạt động gần đây" subtitle="Bài nộp mới nhất của từng team" icon={mentorIcons.Activity}>
    <div className="space-y-3">{sortedTeams.length ? sortedTeams.map((team) => <div key={team.id} className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 p-4">
      <div className="min-w-0"><p className="truncate font-bold text-slate-950">{team.teamName}</p><p className="mt-1 text-sm text-slate-600">{formatDate(team.latestSubmission?.createdAt)}</p></div>
      <MentorBadge tone={team.submissionStatus === "Submitted" ? "success" : "danger"}>{team.submissionStatus === "Submitted" ? "Đã nộp" : "Chưa nộp"}</MentorBadge>
    </div>) : <p className="py-8 text-center text-sm text-slate-500">Chưa có hoạt động.</p>}</div>
  </MentorPanel>;
}
