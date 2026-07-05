import { JudgePanel } from "../shared/JudgePanel";
import { JudgeProgressBar } from "../shared/JudgeProgressBar";
import { judgeIcons } from "../shared/judgeIcons";
import { AssignedRounds } from "./AssignedRounds";
import { JudgeStatsCards } from "./JudgeStatsCards";
import { RecentScoringActivity } from "./RecentScoringActivity";

export function JudgeOverview({ onOpenScoring }) {
  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRounds = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await roundService.getAssigned();
      setRounds(response.data?.data || []);
    } catch (requestError) {
      setRounds([]);
      setError(requestError?.response?.data?.message || "Không thể tải Round được phân công.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRounds(); }, [loadRounds]);

  const totalSubmissions = rounds.reduce((sum, round) => sum + Number(round.submissionCount || 0), 0);
  const scoringRounds = rounds.filter((round) => round.status === "Scoring").length;
  const progress = rounds.length ? (scoringRounds / rounds.length) * 100 : 0;

  return (
    <div className="space-y-6">
      <JudgeStatsCards rounds={rounds} totalSubmissions={totalSubmissions} />
      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2"><AssignedRounds rounds={rounds} loading={loading} onReload={loadRounds} onOpenScoring={onOpenScoring} /></div>
        <JudgePanel title="Scoring window" subtitle="Round đang ở trạng thái Scoring" icon={judgeIcons.Trophy}>
          <JudgeProgressBar value={progress} label="Completed" />
          <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">Scoring rounds</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{scoringRounds}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">Submissions</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{totalSubmissions}</p>
            </div>
          </div>
        </JudgePanel>
      </div>
      <RecentScoringActivity rounds={rounds} />
    </div>
  );
}
import { useCallback, useEffect, useState } from "react";
import roundService from "../../../services/roundService";
