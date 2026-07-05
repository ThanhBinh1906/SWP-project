import { JudgeBadge } from "../shared/JudgeBadge";
import { JudgePanel } from "../shared/JudgePanel";
import { judgeIcons } from "../shared/judgeIcons";

export function RecentScoringActivity({ rounds }) {
  return (
    <JudgePanel title="Recent Scoring Activity" subtitle="Your recent scoring workspace events" icon={judgeIcons.Activity}>
      <div className="space-y-3">
        {rounds.length === 0 ? <p className="py-6 text-center text-sm text-slate-700">Chưa có hoạt động Round.</p> : rounds.slice(0, 5).map((item) => (
          <div key={item.id} className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 p-4">
            <div className="min-w-0">
              <p className="font-bold text-slate-900">{item.name}</p>
              <p className="mt-1 text-sm text-slate-700">{item.eventName} · {item.trackName}</p>
              <p className="mt-1 text-xs text-slate-600">{item.submissionCount || 0} submissions</p>
            </div>
            <JudgeBadge tone={item.status === "Scoring" ? "success" : "info"}>{item.status}</JudgeBadge>
          </div>
        ))}
      </div>
    </JudgePanel>
  );
}
