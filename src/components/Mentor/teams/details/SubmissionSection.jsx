import { MentorBadge } from "../../shared/MentorBadge";
import { MentorPanel } from "../../shared/MentorPanel";
import { mentorIcons } from "../../shared/mentorIcons";

function formatDate(value) {
  if (!value) return "N/A";
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function SubmissionSection({ submissions = [], loadFailed }) {
  return <MentorPanel title="Lịch sử bài nộp" subtitle="Bài presentation của team theo từng round" icon={mentorIcons.FileText}>
    {loadFailed ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">Không thể tải bài nộp của team này.</div> : submissions.length ? <div className="space-y-3">{submissions.map((submission) => <article key={submission.id} className="grid gap-4 rounded-xl border border-slate-200 p-4 lg:grid-cols-[160px_1fr_auto] lg:items-center">
      <div><p className="text-xs font-bold uppercase tracking-wide text-slate-700">Round</p><p className="mt-1 font-bold text-slate-950">Round #{submission.roundId}</p><p className="mt-1 text-xs text-slate-700">{formatDate(submission.createdAt)}</p></div>
      <div className="min-w-0"><p className="text-xs font-bold uppercase tracking-wide text-slate-700">Presentation</p>{submission.presentationUrl ? <a href={submission.presentationUrl} target="_blank" rel="noreferrer" className="mt-1 flex items-center gap-2 break-all font-semibold text-orange-700 hover:underline">{submission.presentationUrl}<mentorIcons.ExternalLink className="h-4 w-4 shrink-0" /></a> : <p className="mt-1 text-sm text-slate-600">Không có đường dẫn</p>}</div>
      <MentorBadge tone={submission.isDisqualified ? "danger" : "success"}>{submission.isDisqualified ? "Đã bị loại" : "Hợp lệ"}</MentorBadge>
      {submission.isDisqualified && submission.disqualifyReason && <p className="text-sm text-red-700 lg:col-span-3">Lý do: {submission.disqualifyReason}</p>}
      {submission.aiEvaluation && <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700 lg:col-span-3"><span className="font-bold">AI evaluation: </span>{typeof submission.aiEvaluation === "string" ? submission.aiEvaluation : JSON.stringify(submission.aiEvaluation)}</div>}
    </article>)}</div> : <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-600">Team chưa có bài nộp.</div>}
  </MentorPanel>;
}
