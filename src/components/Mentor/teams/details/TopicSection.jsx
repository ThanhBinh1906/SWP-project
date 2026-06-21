import { MentorPanel } from "../../shared/MentorPanel";
import { mentorIcons } from "../../shared/mentorIcons";

export function TopicSection({ topic }) {
  return <MentorPanel title="Đề bài được giao" subtitle="Nội dung và tài liệu tham khảo" icon={mentorIcons.Lightbulb}>
    {!topic ? <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-600">Team chưa được gán đề bài.</div> : <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5">
      <h4 className="text-lg font-bold text-slate-950">{topic.title}</h4>
      <p className="mt-3 whitespace-pre-line leading-6 text-slate-700">{topic.description || "Không có mô tả."}</p>
      <div className="mt-5"><p className="text-sm font-bold uppercase tracking-wide text-slate-600">Yêu cầu</p><p className="mt-2 whitespace-pre-line leading-6 text-slate-700">{topic.requirements || "Không có yêu cầu bổ sung."}</p></div>
      {topic.attachmentUrl && <a href={topic.attachmentUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-lg border border-orange-200 bg-white px-4 py-2 text-sm font-bold text-orange-700 hover:bg-orange-50">Mở tài liệu PDF <mentorIcons.ExternalLink className="h-4 w-4" /></a>}
    </div>}
  </MentorPanel>;
}
