import { JudgeActionButton } from "../shared/JudgeActionButton";
import { JudgePanel } from "../shared/JudgePanel";
import { judgeIcons } from "../shared/judgeIcons";
import { RoundStatusBadge } from "../rounds/RoundStatusBadge";

export function AssignedRounds({ rounds, loading, onReload, onOpenScoring }) {
  return (
    <JudgePanel title="Assigned Rounds" subtitle="Round access follows scoring window and ranking lock rules" icon={judgeIcons.CalendarDays}>
      {loading ? <p className="py-10 text-center text-sm text-slate-500">Đang tải Round...</p> : rounds.length === 0 ? <div className="py-10 text-center"><p className="text-sm text-slate-500">Chưa được phân công Round.</p><JudgeActionButton className="mt-3" onClick={onReload}>Tải lại</JudgeActionButton></div> :
      <div className="grid gap-4 lg:grid-cols-3">
        {rounds.map((round) => {
          const canScore = round.status === "Scoring";
          return (
            <div key={round.id} className="rounded-xl border border-slate-100 p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-bold text-slate-900">{round.name}</h4>
                  <p className="mt-1 text-sm text-slate-500">{round.trackName}</p>
                </div>
                <RoundStatusBadge status={round.status} />
              </div>
              <div className="space-y-2 text-sm text-slate-600">
                <p><span className="font-semibold text-slate-700">EndTime:</span> {new Date(round.endTime).toLocaleString()}</p>
                <p><span className="font-semibold text-slate-700">Submissions:</span> {round.submissionCount || 0}</p>
              </div>
              <div className="mt-4 space-y-3">
                {!canScore && <p className="text-xs text-slate-500">Chỉ mở chấm điểm khi Round ở trạng thái Scoring.</p>}
                <JudgeActionButton variant="secondary" disabled={!canScore} onClick={() => onOpenScoring(round.id)} icon={judgeIcons.Gavel}>
                  Mở chấm điểm
                </JudgeActionButton>
              </div>
            </div>
          );
        })}
      </div>}
    </JudgePanel>
  );
}
