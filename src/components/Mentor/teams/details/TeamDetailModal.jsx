import { useEffect } from "react";
import { createPortal } from "react-dom";
import { MentorBadge } from "../../shared/MentorBadge";
import { MentorProgressBar } from "../../shared/MentorProgressBar";
import { mentorIcons } from "../../shared/mentorIcons";
import { TeamStatusBadge } from "../TeamStatusBadge";
import { SubmissionSection } from "./SubmissionSection";
import { TeamMembersSection } from "./TeamMembersSection";
import { TopicSection } from "./TopicSection";

export function TeamDetailModal({ team, onClose }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return createPortal(<div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
    <div className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-xl bg-white shadow-2xl">
      <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4">
        <div><p className="text-xs font-bold uppercase tracking-widest text-orange-600">Chi tiết team</p><h3 className="mt-1 text-xl font-bold text-slate-950">{team.teamName}</h3></div>
        <button className="rounded-lg border border-slate-300 p-2 text-slate-600 hover:bg-slate-100" onClick={onClose} aria-label="Đóng"><mentorIcons.X className="h-5 w-5" /></button>
      </div>
      <div className="space-y-5 p-5">
        <section className="rounded-xl border border-slate-200 p-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Info label="Trường" value={team.university || "N/A"} />
            <Info label="Track" value={`Track #${team.trackId ?? "N/A"}`} />
            <Info label="Thành viên" value={team.members?.length || 0} />
            <div><Label>Trạng thái team</Label><div className="mt-1"><TeamStatusBadge status={team.status} /></div></div>
            <div><Label>Bài nộp</Label><div className="mt-1"><MentorBadge tone={team.submissionStatus === "Submitted" ? "success" : "danger"}>{team.submissionStatus === "Submitted" ? "Đã nộp" : "Chưa nộp"}</MentorBadge></div></div>
          </div>
          <div className="mt-5"><MentorProgressBar value={team.readiness || 0} label="Mức độ sẵn sàng (GitHub, topic, submission)" /></div>
          <div className="mt-4 rounded-lg bg-slate-50 p-4"><Label>GitHub repository</Label>{team.githubRepoLink ? <a href={team.githubRepoLink} target="_blank" rel="noreferrer" className="mt-1 inline-flex max-w-full items-center gap-2 break-all font-semibold text-orange-700 hover:underline">{team.githubRepoLink}<mentorIcons.ExternalLink className="h-4 w-4 shrink-0" /></a> : <p className="mt-1 text-slate-600">Chưa cập nhật</p>}</div>
        </section>
        <TeamMembersSection members={team.members || []} />
        <SubmissionSection submissions={team.submissions || []} loadFailed={team.submissionLoadFailed} />
        <TopicSection topic={team.topic} />
      </div>
    </div>
  </div>, document.body);
}

function Label({ children }) { return <p className="text-xs font-bold uppercase tracking-wide text-slate-700">{children}</p>; }
function Info({ label, value }) { return <div><Label>{label}</Label><p className="mt-1 font-bold text-slate-950">{value}</p></div>; }
